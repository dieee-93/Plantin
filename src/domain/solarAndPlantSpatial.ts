import {
  area,
  EndType,
  inflatePaths,
  JoinType,
  type Path64,
} from 'clipper2-ts';
import {
  classifySpacePoint,
  isPointInPolygonCm,
  type ComputedSpaceRegions,
  type Point2DCm,
  type Polygon2DCm,
} from './spaceGeometry';

export type SolarSeason = 'summer' | 'autumn' | 'winter' | 'spring';

export interface SolarQuery {
  latitudeDeg: number;
  northAngleDeg?: number;
  season: SolarSeason;
  hourOfDay: number;
}

export interface SunPosition3D {
  elevationDeg: number;
  azimuthDeg: number;
  sceneDirection: { x: number; y: number; z: number };
  isDaylight: boolean;
  intensity: number;
}

export interface PlacedPlantSpatialCm {
  id: string;
  label: string;
  cropCode?: string;
  xCm: number;
  yCm: number;
  zCm?: number;
  canopyRadiusCm: number;
}

export interface PlantNeighborMeasurement {
  neighborId: string;
  neighborLabel: string;
  distanceCm: number;
  clearanceCm: number;
  isCrowded: boolean;
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const SOLSTICE_DECLINATION_DEG = 23.44;

function getSolarDeclinationDeg(season: SolarSeason, latitudeDeg: number): number {
  const isSouthernHemisphere = latitudeDeg < 0;
  if (season === 'summer') {
    return isSouthernHemisphere ? -SOLSTICE_DECLINATION_DEG : SOLSTICE_DECLINATION_DEG;
  }
  if (season === 'winter') {
    return isSouthernHemisphere ? SOLSTICE_DECLINATION_DEG : -SOLSTICE_DECLINATION_DEG;
  }
  return 0;
}

export function computeSunPosition(query: SolarQuery): SunPosition3D {
  const latRad = query.latitudeDeg * DEG_TO_RAD;
  const decDeg = getSolarDeclinationDeg(query.season, query.latitudeDeg);
  const decRad = decDeg * DEG_TO_RAD;
  const hourAngleRad = (query.hourOfDay - 12) * 15 * DEG_TO_RAD;

  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const sinDec = Math.sin(decRad);
  const cosDec = Math.cos(decRad);
  const cosH = Math.cos(hourAngleRad);
  const sinH = Math.sin(hourAngleRad);

  const up = Math.max(-1, Math.min(1, sinLat * sinDec + cosLat * cosDec * cosH));
  const north = cosLat * sinDec - sinLat * cosDec * cosH;
  const east = -cosDec * sinH;

  const elevationRad = Math.asin(up);
  const elevationDeg = elevationRad * RAD_TO_DEG;

  const rawAzimuthDeg = Math.atan2(east, north) * RAD_TO_DEG;
  const azimuthDeg = ((rawAzimuthDeg % 360) + 360) % 360;

  const northAngleRad = (query.northAngleDeg ?? 0) * DEG_TO_RAD;
  const totalAzimuthRad = azimuthDeg * DEG_TO_RAD + northAngleRad;
  const horizontalMag = Math.cos(elevationRad);

  const x = horizontalMag * Math.sin(totalAzimuthRad);
  const y = up;
  const z = -horizontalMag * Math.cos(totalAzimuthRad);

  const isDaylight = elevationDeg > 0;
  const intensity = isDaylight ? Math.max(0, Math.min(1, Math.sin(elevationRad))) : 0;

  return {
    elevationDeg,
    azimuthDeg,
    sceneDirection: { x, y, z },
    isDaylight,
    intensity,
  };
}

export function computeShadowLengthCm(
  obstacleHeightCm: number,
  elevationDeg: number,
): number {
  if (obstacleHeightCm <= 0 || elevationDeg <= 0) {
    return 0;
  }
  const tanElevation = Math.tan(elevationDeg * DEG_TO_RAD);
  if (tanElevation <= 1e-6) {
    return 0;
  }
  return obstacleHeightCm / tanElevation;
}

export function shouldCutawayWall(
  wallStart: Point2DCm,
  wallEnd: Point2DCm,
  cameraGroundPosCm: Point2DCm,
  spaceCenterCm: Point2DCm,
): boolean {
  const midX = (wallStart.x + wallEnd.x) / 2;
  const midY = (wallStart.y + wallEnd.y) / 2;

  const dx = wallEnd.x - wallStart.x;
  const dy = wallEnd.y - wallStart.y;

  let normalX = -dy;
  let normalY = dx;

  const centerToWallX = midX - spaceCenterCm.x;
  const centerToWallY = midY - spaceCenterCm.y;

  if (normalX * centerToWallX + normalY * centerToWallY < 0) {
    normalX = -normalX;
    normalY = -normalY;
  }

  const wallToCameraX = cameraGroundPosCm.x - midX;
  const wallToCameraY = cameraGroundPosCm.y - midY;

  return normalX * wallToCameraX + normalY * wallToCameraY > 0;
}

export function measurePlantNeighbors(
  target: PlacedPlantSpatialCm,
  others: PlacedPlantSpatialCm[],
): PlantNeighborMeasurement[] {
  return others
    .filter((other) => other.id !== target.id)
    .map((other) => {
      const dx = other.xCm - target.xCm;
      const dy = other.yCm - target.yCm;
      const distanceCm = Math.round(Math.hypot(dx, dy) * 10) / 10;
      const requiredRadiusSum = target.canopyRadiusCm + other.canopyRadiusCm;
      const clearanceCm = Math.round((distanceCm - requiredRadiusSum) * 10) / 10;
      return {
        neighborId: other.id,
        neighborLabel: other.label,
        distanceCm,
        clearanceCm,
        isCrowded: clearanceCm < 0,
      };
    })
    .sort((a, b) => a.distanceCm - b.distanceCm);
}

export function generateLinePlantPositions(
  start: Point2DCm,
  end: Point2DCm,
  spacingCm: number,
  regions?: ComputedSpaceRegions,
): Point2DCm[] {
  if (spacingCm <= 0) return [];

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const totalLen = Math.hypot(dx, dy);

  const count = totalLen === 0 ? 1 : Math.floor(totalLen / spacingCm) + 1;
  const ux = totalLen === 0 ? 0 : dx / totalLen;
  const uy = totalLen === 0 ? 0 : dy / totalLen;

  const points: Point2DCm[] = [];
  for (let i = 0; i < count; i++) {
    const dist = i * spacingCm;
    const pt: Point2DCm = {
      x: Math.round(start.x + ux * dist),
      y: Math.round(start.y + uy * dist),
    };
    if (regions && classifySpacePoint(pt, regions) !== 'cultivable') {
      continue;
    }
    points.push(pt);
  }

  return points;
}

export interface PolygonFillOptions {
  plantSpacingCm: number;
  rowSpacingCm: number;
  marginCm?: number;
  angleDeg?: number;
}

export function generatePolygonFillPlantPositions(
  cultivablePolygon: Polygon2DCm,
  options: PolygonFillOptions,
): Point2DCm[] {
  const {
    plantSpacingCm,
    rowSpacingCm,
    marginCm = 20,
    angleDeg = 0,
  } = options;

  if (
    cultivablePolygon.length < 3 ||
    plantSpacingCm <= 0 ||
    rowSpacingCm <= 0
  ) {
    return [];
  }

  let path64: Path64 = cultivablePolygon.map((pt) => ({
    x: Math.round(pt.x),
    y: Math.round(pt.y),
  }));

  if (area(path64) < 0) {
    path64 = [...path64].reverse();
  }

  const insetPolygons: Polygon2DCm[] =
    marginCm > 0
      ? inflatePaths(
          [path64],
          -marginCm,
          JoinType.Miter,
          EndType.Polygon,
        ).map((p) => p.map((pt) => ({ x: pt.x, y: pt.y })))
      : [path64.map((pt) => ({ x: pt.x, y: pt.y }))];

  if (insetPolygons.length === 0) {
    return [];
  }

  const theta = angleDeg * DEG_TO_RAD;
  const ux = Math.cos(theta);
  const uy = Math.sin(theta);
  const vx = -Math.sin(theta);
  const vy = Math.cos(theta);

  const results: Point2DCm[] = [];

  for (const poly of insetPolygons) {
    if (poly.length < 3) continue;

    let uMin = Infinity;
    let uMax = -Infinity;
    let vMin = Infinity;
    let vMax = -Infinity;

    for (const pt of poly) {
      const u = pt.x * ux + pt.y * uy;
      const v = pt.x * vx + pt.y * vy;
      if (u < uMin) uMin = u;
      if (u > uMax) uMax = u;
      if (v < vMin) vMin = v;
      if (v > vMax) vMax = v;
    }

    for (let v = vMin; v <= vMax + 1e-6; v += rowSpacingCm) {
      for (let u = uMin; u <= uMax + 1e-6; u += plantSpacingCm) {
        const candidate: Point2DCm = {
          x: Math.round(u * ux + v * vx),
          y: Math.round(u * uy + v * vy),
        };
        if (
          isPointInPolygonCm(candidate, poly) &&
          isPointInPolygonCm(candidate, cultivablePolygon)
        ) {
          results.push(candidate);
        }
      }
    }
  }

  return results;
}




