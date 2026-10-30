import {
  area,
  areaPaths,
  difference,
  EndType,
  FillRule,
  inflatePaths,
  intersect,
  JoinType,
  pointInPolygon,
  PointInPolygonResult,
  union,
  type Path64,
  type Paths64,
} from 'clipper2-ts';

export interface Point2DCm {
  x: number;
  y: number;
}

export type Polygon2DCm = Point2DCm[];

export type FloorMaterialType =
  | 'soil'
  | 'grass'
  | 'concrete'
  | 'gravel'
  | 'tile'
  | 'wood'
  | 'mulch';

export interface HardscapeZoneCm {
  id: string;
  label?: string;
  material: FloorMaterialType;
  polygon: Polygon2DCm;
}

export interface PathStrokeCm {
  id: string;
  label?: string;
  material: FloorMaterialType;
  points: Point2DCm[];
  widthCm: number;
}

export type WallMaterialType =
  | 'brick'
  | 'concrete'
  | 'glass_greenhouse'
  | 'polycarbonate'
  | 'wood_fence'
  | 'wire_fence'
  | 'drywall';

export interface WallOpeningCm {
  id: string;
  kind: 'door' | 'window';
  offsetCm: number;
  widthCm: number;
  heightCm: number;
  sillHeightCm: number;
}

export interface WallSegmentCm {
  id: string;
  start: Point2DCm;
  end: Point2DCm;
  heightCm: number;
  thicknessCm: number;
  material: WallMaterialType;
  openings?: WallOpeningCm[];
}

export interface ComputedSpaceRegions {
  baseAreaM2: number;
  walkablePolygons: Polygon2DCm[];
  walkableAreaM2: number;
  cultivablePolygons: Polygon2DCm[];
  cultivableAreaM2: number;
}

const CM2_PER_M2 = 10_000;

function toPath64(polygon: Polygon2DCm): Path64 {
  return polygon.map((pt) => ({
    x: Math.round(pt.x),
    y: Math.round(pt.y),
  }));
}

function fromPaths64(paths: Paths64): Polygon2DCm[] {
  return paths.map((path) => path.map((pt) => ({ x: pt.x, y: pt.y })));
}

export function createRectPolygon(
  widthCm: number,
  depthCm: number,
  origin: Point2DCm = { x: 0, y: 0 },
): Polygon2DCm {
  const x0 = Math.round(origin.x);
  const y0 = Math.round(origin.y);
  const w = Math.round(widthCm);
  const d = Math.round(depthCm);

  return [
    { x: x0, y: y0 },
    { x: x0 + w, y: y0 },
    { x: x0 + w, y: y0 + d },
    { x: x0, y: y0 + d },
  ];
}

export function calculatePolygonAreaM2(polygon: Polygon2DCm): number {
  if (polygon.length < 3) return 0;
  return Math.abs(area(toPath64(polygon))) / CM2_PER_M2;
}

export function inflatePathToPolygon(
  points: Point2DCm[],
  widthCm: number,
  boundaryToClip?: Polygon2DCm,
): Polygon2DCm[] {
  if (points.length < 2 || widthCm <= 0) return [];
  const inflated = inflatePaths(
    [toPath64(points)],
    widthCm / 2,
    JoinType.Miter,
    EndType.Butt,
  );
  if (boundaryToClip && boundaryToClip.length >= 3) {
    const clipped = intersect(
      inflated,
      [toPath64(boundaryToClip)],
      FillRule.NonZero,
    );
    return fromPaths64(clipped);
  }
  return fromPaths64(inflated);
}

export function computeSpaceRegions(
  baseBoundary: Polygon2DCm,
  hardscapeZones: HardscapeZoneCm[],
  paths: PathStrokeCm[],
): ComputedSpaceRegions {
  if (baseBoundary.length < 3) {
    return {
      baseAreaM2: 0,
      walkablePolygons: [],
      walkableAreaM2: 0,
      cultivablePolygons: [],
      cultivableAreaM2: 0,
    };
  }

  const basePath64 = toPath64(baseBoundary);
  const basePaths64: Paths64 = [basePath64];
  const baseAreaM2 = Math.abs(area(basePath64)) / CM2_PER_M2;

  const rawWalkablePaths: Paths64 = [];

  for (const zone of hardscapeZones) {
    if (zone.polygon.length >= 3) {
      rawWalkablePaths.push(toPath64(zone.polygon));
    }
  }

  for (const stroke of paths) {
    const inflatedPolys = inflatePathToPolygon(stroke.points, stroke.widthCm);
    for (const poly of inflatedPolys) {
      if (poly.length >= 3) {
        rawWalkablePaths.push(toPath64(poly));
      }
    }
  }

  const walkablePaths64: Paths64 =
    rawWalkablePaths.length > 0
      ? intersect(
          union(rawWalkablePaths, FillRule.NonZero),
          basePaths64,
          FillRule.NonZero,
        )
      : [];

  const cultivablePaths64: Paths64 =
    walkablePaths64.length > 0
      ? difference(basePaths64, walkablePaths64, FillRule.NonZero)
      : basePaths64;

  const walkableAreaM2 = Math.abs(areaPaths(walkablePaths64)) / CM2_PER_M2;
  const cultivableAreaM2 = Math.abs(areaPaths(cultivablePaths64)) / CM2_PER_M2;

  return {
    baseAreaM2,
    walkablePolygons: fromPaths64(walkablePaths64),
    walkableAreaM2,
    cultivablePolygons: fromPaths64(cultivablePaths64),
    cultivableAreaM2,
  };
}

export function isPointInPolygonCm(
  point: Point2DCm,
  polygon: Polygon2DCm,
): boolean {
  if (polygon.length < 3) return false;
  const pt64 = { x: Math.round(point.x), y: Math.round(point.y) };
  const result = pointInPolygon(pt64, toPath64(polygon));
  return result !== PointInPolygonResult.IsOutside;
}

export function classifySpacePoint(
  point: Point2DCm,
  regions: ComputedSpaceRegions,
): 'cultivable' | 'walkable' | 'outside' {
  if (regions.walkablePolygons.some((poly) => isPointInPolygonCm(point, poly))) {
    return 'walkable';
  }
  if (
    regions.cultivablePolygons.some((poly) => isPointInPolygonCm(point, poly))
  ) {
    return 'cultivable';
  }
  return 'outside';
}

export function insertPolygonVertex(
  polygon: Polygon2DCm,
  edgeIndex: number,
  point: Point2DCm,
): Polygon2DCm {
  if (polygon.length === 0) {
    return [{ x: Math.round(point.x), y: Math.round(point.y) }];
  }
  const normalizedEdge =
    ((edgeIndex % polygon.length) + polygon.length) % polygon.length;
  const insertAt = normalizedEdge + 1;
  const roundedPoint: Point2DCm = {
    x: Math.round(point.x),
    y: Math.round(point.y),
  };
  return [
    ...polygon.slice(0, insertAt),
    roundedPoint,
    ...polygon.slice(insertAt),
  ];
}

export function movePolygonVertex(
  polygon: Polygon2DCm,
  vertexIndex: number,
  newPoint: Point2DCm,
  snapCm: number = 1,
): Polygon2DCm {
  const step = snapCm > 1 ? snapCm : 1;
  const snapped: Point2DCm = {
    x: Math.round(newPoint.x / step) * step,
    y: Math.round(newPoint.y / step) * step,
  };
  return polygon.map((pt, idx) =>
    idx === vertexIndex ? snapped : { x: pt.x, y: pt.y },
  );
}

export function createPerimeterWalls(
  boundary: Polygon2DCm,
  defaultHeightCm: number = 200,
  material: WallMaterialType = 'brick',
): WallSegmentCm[] {
  if (boundary.length < 2) return [];
  return boundary.map((startPt, idx) => {
    const endPt = boundary[(idx + 1) % boundary.length];
    return {
      id: `wall-${idx}`,
      start: { x: Math.round(startPt.x), y: Math.round(startPt.y) },
      end: { x: Math.round(endPt.x), y: Math.round(endPt.y) },
      heightCm: Math.round(defaultHeightCm),
      thicknessCm: 15,
      material,
      openings: [],
    };
  });
}
