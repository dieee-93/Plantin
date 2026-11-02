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
  limit?: number,
): PlantNeighborMeasurement[] {
  // If limit is specified and collection is larger, use high-speed bounded Top-K candidate search.
  // Avoids allocating thousands of objects and running O(N log N) full Array.prototype.sort in V8.
  if (limit !== undefined && limit > 0 && others.length > limit) {
    const candidates: PlantNeighborMeasurement[] = [];
    let maxDistSqInCandidates = Infinity;

    for (let i = 0; i < others.length; i++) {
      const other = others[i];
      if (other.id === target.id) continue;
      const dx = other.xCm - target.xCm;
      const dy = other.yCm - target.yCm;
      const distSq = dx * dx + dy * dy;

      if (candidates.length < limit || distSq < maxDistSqInCandidates) {
        const distanceCm = Math.round(Math.sqrt(distSq) * 10) / 10;
        const requiredRadiusSum = target.canopyRadiusCm + other.canopyRadiusCm;
        const clearanceCm = Math.round((distanceCm - requiredRadiusSum) * 10) / 10;
        const item: PlantNeighborMeasurement = {
          neighborId: other.id,
          neighborLabel: other.label,
          distanceCm,
          clearanceCm,
          isCrowded: clearanceCm < 0,
        };

        // Insert into candidates sorted by distanceCm ascending
        let insertIdx = 0;
        while (insertIdx < candidates.length && candidates[insertIdx].distanceCm <= distanceCm) {
          insertIdx++;
        }
        candidates.splice(insertIdx, 0, item);
        if (candidates.length > limit) {
          candidates.pop();
        }
        const furthest = candidates[candidates.length - 1];
        maxDistSqInCandidates = furthest.distanceCm * furthest.distanceCm;
      }
    }
    return candidates;
  }

  // Standard full sort when limit is omitted (preserves 100% backward compatibility)
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

function findNearestNeighborLinear(
  target: PlacedPlantSpatialCm,
  plants: PlacedPlantSpatialCm[],
): PlantNeighborMeasurement | null {
  let nearestOther: PlacedPlantSpatialCm | null = null;
  let minDistanceSq = Infinity;

  for (let i = 0; i < plants.length; i++) {
    const other = plants[i];
    if (other.id === target.id) continue;
    const dx = other.xCm - target.xCm;
    const dy = other.yCm - target.yCm;
    const distSq = dx * dx + dy * dy;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      nearestOther = other;
    }
  }

  if (nearestOther) {
    const distanceCm = Math.round(Math.sqrt(minDistanceSq) * 10) / 10;
    const requiredRadiusSum = target.canopyRadiusCm + nearestOther.canopyRadiusCm;
    const clearanceCm = Math.round((distanceCm - requiredRadiusSum) * 10) / 10;
    return {
      neighborId: nearestOther.id,
      neighborLabel: nearestOther.label,
      distanceCm,
      clearanceCm,
      isCrowded: clearanceCm < 0,
    };
  }

  return null;
}

interface SpatialGridIndex {
  cellSize: number;
  grid: Map<string, PlacedPlantSpatialCm[]>;
}

const spatialGridCache = new WeakMap<PlacedPlantSpatialCm[], SpatialGridIndex>();

function getOrCreateSpatialGrid(plants: PlacedPlantSpatialCm[]): SpatialGridIndex {
  let cached = spatialGridCache.get(plants);
  if (cached) return cached;

  let maxRadius = 15;
  for (let i = 0; i < plants.length; i++) {
    if (plants[i].canopyRadiusCm > maxRadius) {
      maxRadius = plants[i].canopyRadiusCm;
    }
  }
  const cellSize = Math.max(50, maxRadius * 2);

  const grid = new Map<string, PlacedPlantSpatialCm[]>();
  for (let i = 0; i < plants.length; i++) {
    const p = plants[i];
    const key = `${Math.floor(p.xCm / cellSize)},${Math.floor(p.yCm / cellSize)}`;
    let cell = grid.get(key);
    if (!cell) {
      cell = [];
      grid.set(key, cell);
    }
    cell.push(p);
  }

  cached = { cellSize, grid };
  spatialGridCache.set(plants, cached);
  return cached;
}

/**
 * Fast O(1) average nearest neighbor lookup using Spatial Hash Grid when plants are dense,
 * falling back to linear scan if target is isolated or plants count is small.
 * Uses a WeakMap spatial hash cache on the plants array to eliminate rebuilding the grid
 * on every single pointer movement frame.
 */
export function findNearestNeighbor(
  target: PlacedPlantSpatialCm,
  plants: PlacedPlantSpatialCm[],
): PlantNeighborMeasurement | null {
  if (plants.length === 0) return null;
  if (plants.length === 1 && plants[0].id === target.id) return null;
  if (plants.length <= 32) {
    return findNearestNeighborLinear(target, plants);
  }

  const { cellSize, grid } = getOrCreateSpatialGrid(plants);
  const cx = Math.floor(target.xCm / cellSize);
  const cy = Math.floor(target.yCm / cellSize);

  let nearestOther: PlacedPlantSpatialCm | null = null;
  let minDistanceSq = Infinity;

  // Search 1-ring neighborhood (3x3 = 9 cells)
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const cell = grid.get(`${cx + dx},${cy + dy}`);
      if (!cell) continue;
      for (let j = 0; j < cell.length; j++) {
        const other = cell[j];
        if (other.id === target.id) continue;
        const distSq = (other.xCm - target.xCm) ** 2 + (other.yCm - target.yCm) ** 2;
        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          nearestOther = other;
        }
      }
    }
  }

  if (nearestOther && minDistanceSq < (cellSize * cellSize)) {
    const distanceCm = Math.round(Math.sqrt(minDistanceSq) * 10) / 10;
    const requiredRadiusSum = target.canopyRadiusCm + nearestOther.canopyRadiusCm;
    const clearanceCm = Math.round((distanceCm - requiredRadiusSum) * 10) / 10;
    return {
      neighborId: nearestOther.id,
      neighborLabel: nearestOther.label,
      distanceCm,
      clearanceCm,
      isCrowded: clearanceCm < 0,
    };
  }

  // Expanded 2-ring neighborhood (5x5 = 25 cells) for moderately distant neighbors
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) continue; // Already searched
      const cell = grid.get(`${cx + dx},${cy + dy}`);
      if (!cell) continue;
      for (let j = 0; j < cell.length; j++) {
        const other = cell[j];
        if (other.id === target.id) continue;
        const distSq = (other.xCm - target.xCm) ** 2 + (other.yCm - target.yCm) ** 2;
        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          nearestOther = other;
        }
      }
    }
  }

  if (nearestOther && minDistanceSq < ((cellSize * 2) ** 2)) {
    const distanceCm = Math.round(Math.sqrt(minDistanceSq) * 10) / 10;
    const requiredRadiusSum = target.canopyRadiusCm + nearestOther.canopyRadiusCm;
    const clearanceCm = Math.round((distanceCm - requiredRadiusSum) * 10) / 10;
    return {
      neighborId: nearestOther.id,
      neighborLabel: nearestOther.label,
      distanceCm,
      clearanceCm,
      isCrowded: clearanceCm < 0,
    };
  }

  return findNearestNeighborLinear(target, plants);
}

/**
 * Computes the set of plant IDs that are considered crowded in O(n) time using a 2D Spatial Hash Grid.
 * Preserves the exact semantics of measurePlantNeighbors(target, plants)[0]?.isCrowded:
 * A plant is crowded if and only if its nearest neighbor by Euclidean distance has clearance < 0.
 */
export function computeCrowdedPlantIds(plants: PlacedPlantSpatialCm[]): Set<string> {
  const crowdedIds = new Set<string>();
  if (plants.length <= 1) {
    return crowdedIds;
  }

  let maxRadius = 0;
  for (let i = 0; i < plants.length; i++) {
    if (plants[i].canopyRadiusCm > maxRadius) {
      maxRadius = plants[i].canopyRadiusCm;
    }
  }
  const cellSize = Math.max(50, maxRadius * 2);

  // Map cell key -> array of plants with their original indices
  const grid = new Map<string, { plant: PlacedPlantSpatialCm; index: number }[]>();
  for (let i = 0; i < plants.length; i++) {
    const p = plants[i];
    const key = `${Math.floor(p.xCm / cellSize)},${Math.floor(p.yCm / cellSize)}`;
    let cell = grid.get(key);
    if (!cell) {
      cell = [];
      grid.set(key, cell);
    }
    cell.push({ plant: p, index: i });
  }

  for (let i = 0; i < plants.length; i++) {
    const target = plants[i];
    const cx = Math.floor(target.xCm / cellSize);
    const cy = Math.floor(target.yCm / cellSize);

    let nearestDist = Infinity;
    let nearestClearance = 0;
    let nearestIndex = -1;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cell = grid.get(`${cx + dx},${cy + dy}`);
        if (!cell) continue;
        for (let j = 0; j < cell.length; j++) {
          const item = cell[j];
          if (item.index === i) continue;
          const other = item.plant;
          const dist = Math.round(Math.hypot(other.xCm - target.xCm, other.yCm - target.yCm) * 10) / 10;
          if (dist < nearestDist || (dist === nearestDist && item.index < nearestIndex)) {
            nearestDist = dist;
            nearestIndex = item.index;
            const requiredRadiusSum = target.canopyRadiusCm + other.canopyRadiusCm;
            nearestClearance = Math.round((dist - requiredRadiusSum) * 10) / 10;
          }
        }
      }
    }

    if (nearestIndex !== -1 && nearestDist < cellSize) {
      if (nearestClearance < 0) {
        crowdedIds.add(target.id);
      }
    }
  }

  return crowdedIds;
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

export type PlantCoordinateLike =
  | PlacedPlantSpatialCm
  | Point2DCm
  | { x?: number; y?: number; xCm?: number; yCm?: number };

export function extractPoint2DCm(item: PlantCoordinateLike): Point2DCm | null {
  const x =
    'xCm' in item && typeof item.xCm === 'number'
      ? item.xCm
      : 'x' in item && typeof item.x === 'number'
        ? item.x
        : undefined;
  const y =
    'yCm' in item && typeof item.yCm === 'number'
      ? item.yCm
      : 'y' in item && typeof item.y === 'number'
        ? item.y
        : undefined;
  if (x !== undefined && y !== undefined && !Number.isNaN(x) && !Number.isNaN(y)) {
    return { x, y };
  }
  return null;
}

/**
 * Fast 2D Spatial Hash Grid for clearance checking and collision avoidance
 * with O(1) average lookup time.
 */
export class PlantSpatialHashGrid2D {
  private cellSize: number;
  private grid: Map<string, Array<{ x: number; y: number }>> = new Map();

  constructor(cellSize: number) {
    this.cellSize = Math.max(1, cellSize);
  }

  public insert(x: number, y: number): void {
    const key = `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
    let cell = this.grid.get(key);
    if (!cell) {
      cell = [];
      this.grid.set(key, cell);
    }
    cell.push({ x, y });
  }

  public isOccupied(x: number, y: number, minDistanceCm: number): boolean {
    if (minDistanceCm <= 0) return false;
    const minDistSq = minDistanceCm * minDistanceCm;
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const cellRadius = Math.ceil(minDistanceCm / this.cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const cell = this.grid.get(`${cx + dx},${cy + dy}`);
        if (!cell) continue;
        for (let i = 0; i < cell.length; i++) {
          const pt = cell[i];
          const distSq = (pt.x - x) ** 2 + (pt.y - y) ** 2;
          if (distSq < minDistSq) {
            return true;
          }
        }
      }
    }
    return false;
  }
}

export interface PolygonFillOptions {
  plantSpacingCm: number;
  rowSpacingCm: number;
  marginCm?: number;
  angleDeg?: number;
  existingPlants?: PlantCoordinateLike[];
  minSeparationCm?: number;
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
    existingPlants,
    minSeparationCm: customMinSeparation,
  } = options;

  if (
    cultivablePolygon.length < 3 ||
    plantSpacingCm <= 0 ||
    rowSpacingCm <= 0
  ) {
    return [];
  }

  const minSeparationCm =
    customMinSeparation !== undefined
      ? customMinSeparation
      : Math.max(10, Math.min(plantSpacingCm, rowSpacingCm) * 0.7);

  let spatialGrid: PlantSpatialHashGrid2D | null = null;
  if (minSeparationCm > 0) {
    spatialGrid = new PlantSpatialHashGrid2D(Math.max(10, minSeparationCm));
    if (existingPlants && existingPlants.length > 0) {
      for (let i = 0; i < existingPlants.length; i++) {
        const pt = extractPoint2DCm(existingPlants[i]);
        if (pt) {
          spatialGrid.insert(pt.x, pt.y);
        }
      }
    }
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
          if (spatialGrid && spatialGrid.isOccupied(candidate.x, candidate.y, minSeparationCm)) {
            continue;
          }
          results.push(candidate);
          if (spatialGrid) {
            spatialGrid.insert(candidate.x, candidate.y);
          }
        }
      }
    }
  }

  return results;
}




