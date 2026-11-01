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

export function calculatePolygonPerimeterM(polygon: Polygon2DCm): number {
  if (polygon.length < 2) return 0;
  let totalCm = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    totalCm += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return Math.round((totalCm / 100) * 10) / 10;
}

export function isRectangularPolygon(
  polygon: Polygon2DCm,
  toleranceDeg: number = 4,
): boolean {
  if (polygon.length !== 4) return false;
  const maxCos = Math.sin((toleranceDeg * Math.PI) / 180);
  for (let i = 0; i < 4; i++) {
    const prev = polygon[(i + 3) % 4];
    const curr = polygon[i];
    const next = polygon[(i + 1) % 4];
    const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.hypot(v1.x, v1.y);
    const mag2 = Math.hypot(v2.x, v2.y);
    if (mag1 === 0 || mag2 === 0) return false;
    const cosAngle = Math.abs(dot / (mag1 * mag2));
    if (cosAngle > maxCos) return false;
  }
  return true;
}

export function scalePolygonFromCenter(
  polygon: Polygon2DCm,
  scaleFactor: number,
): Polygon2DCm {
  if (polygon.length < 3 || scaleFactor <= 0) return polygon;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of polygon) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  return polygon.map((p) => ({
    x: Math.round(cx + (p.x - cx) * scaleFactor),
    y: Math.round(cy + (p.y - cy) * scaleFactor),
  }));
}

export function createLShapePolygon(
  widthCm: number,
  depthCm: number,
  cutWidthRatio: number = 0.4,
  cutDepthRatio: number = 0.45,
  origin: Point2DCm = { x: 0, y: 0 },
): Polygon2DCm {
  const x0 = Math.round(origin.x);
  const y0 = Math.round(origin.y);
  const w = Math.round(widthCm);
  const d = Math.round(depthCm);
  const cutW = Math.round(w * cutWidthRatio);
  const cutD = Math.round(d * cutDepthRatio);

  return [
    { x: x0, y: y0 },
    { x: x0 + w, y: y0 },
    { x: x0 + w, y: y0 + (d - cutD) },
    { x: x0 + (w - cutW), y: y0 + (d - cutD) },
    { x: x0 + (w - cutW), y: y0 + d },
    { x: x0, y: y0 + d },
  ];
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

function ccw(A: Point2DCm, B: Point2DCm, C: Point2DCm): number {
  return (C.y - A.y) * (B.x - A.x) - (B.y - A.y) * (C.x - A.x);
}

export function doSegmentsIntersectStrict(
  a: Point2DCm,
  b: Point2DCm,
  c: Point2DCm,
  d: Point2DCm,
): boolean {
  if (
    (a.x === c.x && a.y === c.y) ||
    (a.x === d.x && a.y === d.y) ||
    (b.x === c.x && b.y === c.y) ||
    (b.x === d.x && b.y === d.y)
  ) {
    return false;
  }

  const ccw1 = ccw(a, b, c);
  const ccw2 = ccw(a, b, d);
  const ccw3 = ccw(c, d, a);
  const ccw4 = ccw(c, d, b);

  return (
    ((ccw1 > 0 && ccw2 < 0) || (ccw1 < 0 && ccw2 > 0)) &&
    ((ccw3 > 0 && ccw4 < 0) || (ccw3 < 0 && ccw4 > 0))
  );
}

export function wouldPolygonSelfIntersect(
  polygon: Polygon2DCm,
  vertexIndex: number,
  newPoint: Point2DCm,
): boolean {
  const n = polygon.length;
  if (n < 3) return false;

  const prevIdx = (vertexIndex - 1 + n) % n;
  const nextIdx = (vertexIndex + 1) % n;

  // 1. Proximity guard to adjacent neighbors: prevents collapsing edges or folding past neighbor
  const distPrev = Math.hypot(newPoint.x - polygon[prevIdx].x, newPoint.y - polygon[prevIdx].y);
  const distNext = Math.hypot(newPoint.x - polygon[nextIdx].x, newPoint.y - polygon[nextIdx].y);
  if (distPrev < 60 || distNext < 60) {
    return true;
  }

  // 2. Proximity guard to any other vertex in the polygon: prevents superimposing vertices
  for (let j = 0; j < n; j++) {
    if (j === vertexIndex || j === prevIdx || j === nextIdx) continue;
    const distOther = Math.hypot(newPoint.x - polygon[j].x, newPoint.y - polygon[j].y);
    if (distOther < 50) {
      return true;
    }
  }

  const movingEdgePrev = { a: polygon[prevIdx], b: newPoint };
  const movingEdgeNext = { a: newPoint, b: polygon[nextIdx] };

  for (let j = 0; j < n; j++) {
    const jNext = (j + 1) % n;
    if (j === prevIdx || jNext === prevIdx || j === vertexIndex || jNext === vertexIndex) {
      continue;
    }
    const edge = { a: polygon[j], b: polygon[jNext] };
    if (doSegmentsIntersectStrict(movingEdgePrev.a, movingEdgePrev.b, edge.a, edge.b)) {
      return true;
    }
  }

  for (let j = 0; j < n; j++) {
    const jNext = (j + 1) % n;
    if (j === vertexIndex || jNext === vertexIndex || j === nextIdx || jNext === nextIdx) {
      continue;
    }
    const edge = { a: polygon[j], b: polygon[jNext] };
    if (doSegmentsIntersectStrict(movingEdgeNext.a, movingEdgeNext.b, edge.a, edge.b)) {
      return true;
    }
  }

  const candidatePoly = polygon.map((pt, idx) => (idx === vertexIndex ? newPoint : pt));
  const areaM2 = calculatePolygonAreaM2(candidatePoly);
  if (areaM2 < 2.0) {
    return true;
  }

  return false;
}

export function canInsertVertexAtEdge(
  polygon: Polygon2DCm,
  edgeIndex: number,
  point: Point2DCm,
  minEdgeLenCm = 100,
  minVertexDistCm = 40,
): boolean {
  const n = polygon.length;
  if (n < 3) return false;
  const normEdge = ((edgeIndex % n) + n) % n;
  const start = polygon[normEdge];
  const end = polygon[(normEdge + 1) % n];
  const edgeLen = Math.hypot(end.x - start.x, end.y - start.y);
  if (edgeLen < minEdgeLenCm) return false;

  const distStart = Math.hypot(point.x - start.x, point.y - start.y);
  const distEnd = Math.hypot(point.x - end.x, point.y - end.y);
  if (distStart < minVertexDistCm || distEnd < minVertexDistCm) return false;

  for (let i = 0; i < n; i++) {
    if (i === normEdge || i === (normEdge + 1) % n) continue;
    const d = Math.hypot(point.x - polygon[i].x, point.y - polygon[i].y);
    if (d < 30) return false;
  }
  return true;
}

export function sanitizeAndWeldPolygon(
  polygon: Polygon2DCm,
  minDistCm = 40,
): Polygon2DCm {
  if (polygon.length <= 3) return polygon;

  // 1. Weld consecutive vertices that are too close (< minDistCm)
  const welded: Point2DCm[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const current = polygon[i];
    if (welded.length === 0) {
      welded.push(current);
      continue;
    }
    const last = welded[welded.length - 1];
    const dist = Math.hypot(current.x - last.x, current.y - last.y);
    if (dist >= minDistCm) {
      welded.push(current);
    }
  }

  // Check wrap-around between last and first
  if (welded.length > 3) {
    const first = welded[0];
    const last = welded[welded.length - 1];
    if (Math.hypot(first.x - last.x, first.y - last.y) < minDistCm) {
      welded.pop();
    }
  }

  if (welded.length <= 3) return welded.length >= 3 ? welded : polygon;

  // 2. Remove collinear redundant vertices
  const cleaned: Point2DCm[] = [];
  const m = welded.length;
  for (let i = 0; i < m; i++) {
    const prev = welded[(i - 1 + m) % m];
    const curr = welded[i];
    const next = welded[(i + 1) % m];

    const cross = (curr.x - prev.x) * (next.y - prev.y) - (curr.y - prev.y) * (next.x - prev.x);
    const d1 = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    const d2 = Math.hypot(next.x - curr.x, next.y - curr.y);
    const d3 = Math.hypot(next.x - prev.x, next.y - prev.y);

    const isCollinear = Math.abs(cross) / Math.max(1, d3) < 2.0 && Math.abs(d1 + d2 - d3) < 3.0;

    if (!isCollinear || cleaned.length + (m - i - 1) < 3) {
      cleaned.push(curr);
    }
  }

  return cleaned.length >= 3 ? cleaned : welded;
}

export function removePolygonVertex(
  polygon: Polygon2DCm,
  vertexIndex: number,
): Polygon2DCm {
  if (polygon.length <= 3) return polygon;
  if (vertexIndex < 0 || vertexIndex >= polygon.length) return polygon;
  return polygon.filter((_, idx) => idx !== vertexIndex);
}

export function findClosestEdgeOnPolygon(
  polygon: Polygon2DCm,
  point: Point2DCm,
): { edgeIndex: number; projectedPoint: Point2DCm; distanceCm: number } | null {
  if (polygon.length < 2) return null;
  let minDistance = Infinity;
  let bestEdgeIndex = 0;
  let bestProjected: Point2DCm = { x: point.x, y: point.y };

  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    let t = 0;
    if (lenSq > 0) {
      t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq));
    }
    const projX = Math.round(a.x + t * dx);
    const projY = Math.round(a.y + t * dy);
    const dist = Math.hypot(point.x - projX, point.y - projY);
    if (dist < minDistance) {
      minDistance = dist;
      bestEdgeIndex = i;
      bestProjected = { x: projX, y: projY };
    }
  }

  return {
    edgeIndex: bestEdgeIndex,
    projectedPoint: bestProjected,
    distanceCm: Math.round(minDistance * 10) / 10,
  };
}

export interface WallSubMeshPrism {
  xStartM: number;
  xEndM: number;
  yBottomM: number;
  yTopM: number;
}

export interface NextOpeningSlotResult {
  canPlace: boolean;
  offsetCm: number;
  remainingCm: number;
  reason?: string;
}

export function findNextOpeningSlot(
  wallLengthCm: number,
  openingWidthCm: number,
  existingOpenings: WallOpeningCm[] = [],
  cornerMarginCm: number = 10,
  minGapCm: number = 15,
): NextOpeningSlotResult {
  const usableStart = cornerMarginCm;
  const usableEnd = wallLengthCm - cornerMarginCm;
  const totalUsable = usableEnd - usableStart;

  if (totalUsable < openingWidthCm) {
    return {
      canPlace: false,
      offsetCm: 0,
      remainingCm: Math.max(0, totalUsable),
      reason: `La pared (${(wallLengthCm / 100).toFixed(2)} m) es demasiado corta para un vano de ${(openingWidthCm / 100).toFixed(2)} m más márgenes de esquina.`,
    };
  }

  const sorted = existingOpenings
    .filter((op) => op.widthCm > 0)
    .map((op) => ({
      start: op.offsetCm,
      end: op.offsetCm + op.widthCm,
    }))
    .sort((a, b) => a.start - b.start);

  if (sorted.length === 0) {
    const centeredOffset = Math.max(
      cornerMarginCm,
      Math.round((wallLengthCm - openingWidthCm) / 2),
    );
    return {
      canPlace: true,
      offsetCm: centeredOffset,
      remainingCm: totalUsable - openingWidthCm,
    };
  }

  let candidateOffset: number | null = null;
  let maxFreeSpace = 0;

  // 1. Before first opening
  const firstSlotLen = sorted[0].start - minGapCm - usableStart;
  if (firstSlotLen >= openingWidthCm) {
    candidateOffset = usableStart;
  }
  maxFreeSpace = Math.max(maxFreeSpace, firstSlotLen);

  // 2. Between openings
  if (candidateOffset === null) {
    for (let i = 0; i < sorted.length - 1; i++) {
      const slotStart = sorted[i].end + minGapCm;
      const slotEnd = sorted[i + 1].start - minGapCm;
      const slotLen = slotEnd - slotStart;
      maxFreeSpace = Math.max(maxFreeSpace, slotLen);
      if (slotLen >= openingWidthCm) {
        candidateOffset = slotStart;
        break;
      }
    }
  }

  // 3. After last opening
  if (candidateOffset === null) {
    const lastSlotStart = sorted[sorted.length - 1].end + minGapCm;
    const lastSlotLen = usableEnd - lastSlotStart;
    maxFreeSpace = Math.max(maxFreeSpace, lastSlotLen);
    if (lastSlotLen >= openingWidthCm) {
      candidateOffset = lastSlotStart;
    }
  }

  if (candidateOffset !== null) {
    return {
      canPlace: true,
      offsetCm: candidateOffset,
      remainingCm: maxFreeSpace,
    };
  }

  return {
    canPlace: false,
    offsetCm: 0,
    remainingCm: Math.max(0, maxFreeSpace),
    reason: `No hay espacio continuo de ${(openingWidthCm / 100).toFixed(2)} m en este tramo. Mayor hueco disponible: ${(Math.max(0, maxFreeSpace) / 100).toFixed(2)} m.`,
  };
}

export function createDefaultDoorOpening(
  wallLengthCm: number,
  offsetCm?: number,
  existingOpenings: WallOpeningCm[] = [],
): WallOpeningCm {
  const widthCm = 90;
  const heightCm = 210;
  const slot = findNextOpeningSlot(wallLengthCm, widthCm, existingOpenings);
  const defaultOffset = slot.canPlace
    ? slot.offsetCm
    : Math.max(10, Math.round((wallLengthCm - widthCm) / 2));
  return {
    id: `door-${Math.random().toString(36).substring(2, 7)}`,
    kind: 'door',
    offsetCm: offsetCm !== undefined ? offsetCm : defaultOffset,
    widthCm,
    heightCm,
    sillHeightCm: 0,
  };
}

export function createDefaultWindowOpening(
  wallLengthCm: number,
  offsetCm?: number,
  existingOpenings: WallOpeningCm[] = [],
): WallOpeningCm {
  const widthCm = 120;
  const heightCm = 110;
  const sillHeightCm = 90;
  const slot = findNextOpeningSlot(wallLengthCm, widthCm, existingOpenings);
  const defaultOffset = slot.canPlace
    ? slot.offsetCm
    : Math.max(10, Math.round((wallLengthCm - widthCm) / 2));
  return {
    id: `window-${Math.random().toString(36).substring(2, 7)}`,
    kind: 'window',
    offsetCm: offsetCm !== undefined ? offsetCm : defaultOffset,
    widthCm,
    heightCm,
    sillHeightCm,
  };
}

export function decomposeWallIntoPrisms(
  wallLengthCm: number,
  wallHeightCm: number,
  openings?: WallOpeningCm[],
): WallSubMeshPrism[] {
  const lengthM = wallLengthCm * 0.01;
  const heightM = wallHeightCm * 0.01;

  if (!openings || openings.length === 0 || heightM <= 0) {
    return [{ xStartM: 0, xEndM: lengthM, yBottomM: 0, yTopM: heightM }];
  }

  // Sort and sanitize openings within wall bounds
  const validOpenings = openings
    .filter((op) => op.widthCm > 0 && op.heightCm > 0)
    .map((op) => ({
      ...op,
      offsetCm: Math.max(0, Math.min(wallLengthCm - op.widthCm, op.offsetCm)),
    }))
    .sort((a, b) => a.offsetCm - b.offsetCm);

  if (validOpenings.length === 0) {
    return [{ xStartM: 0, xEndM: lengthM, yBottomM: 0, yTopM: heightM }];
  }

  // Sanitize overlapping openings to avoid degenerate zero-width prisms
  const nonOverlapping: WallOpeningCm[] = [];
  let maxEndCm = 0;
  for (const op of validOpenings) {
    if (op.offsetCm >= maxEndCm) {
      nonOverlapping.push(op);
      maxEndCm = op.offsetCm + op.widthCm;
    }
  }

  const prisms: WallSubMeshPrism[] = [];
  let currentXM = 0;

  for (const op of nonOverlapping) {
    const opStartM = op.offsetCm * 0.01;
    const opEndM = (op.offsetCm + op.widthCm) * 0.01;
    const sillM = Math.max(0, op.sillHeightCm * 0.01);
    const lintelBottomM = Math.min(heightM, (op.sillHeightCm + op.heightCm) * 0.01);

    // Left solid segment before opening
    if (opStartM > currentXM) {
      prisms.push({
        xStartM: currentXM,
        xEndM: opStartM,
        yBottomM: 0,
        yTopM: heightM,
      });
    }

    // Under opening (sill)
    if (sillM > 0) {
      prisms.push({
        xStartM: opStartM,
        xEndM: opEndM,
        yBottomM: 0,
        yTopM: Math.min(heightM, sillM),
      });
    }

    // Above opening (lintel)
    if (lintelBottomM < heightM) {
      prisms.push({
        xStartM: opStartM,
        xEndM: opEndM,
        yBottomM: lintelBottomM,
        yTopM: heightM,
      });
    }

    currentXM = Math.max(currentXM, opEndM);
  }

  // Remaining solid segment after last opening
  if (currentXM < lengthM) {
    prisms.push({
      xStartM: currentXM,
      xEndM: lengthM,
      yBottomM: 0,
      yTopM: heightM,
    });
  }

  return prisms;
}

export function syncWallsWithBoundary(
  newBoundary: Polygon2DCm,
  existingWalls: WallSegmentCm[],
  defaultHeightCm: number = 200,
  defaultMaterial: WallMaterialType = 'brick',
): WallSegmentCm[] {
  if (newBoundary.length < 2) return [];

  if (existingWalls.length === newBoundary.length) {
    return newBoundary.map((startPt, idx) => {
      const endPt = newBoundary[(idx + 1) % newBoundary.length];
      const prev = existingWalls[idx];
      return {
        id: prev?.id ?? `wall-${idx}`,
        start: { x: Math.round(startPt.x), y: Math.round(startPt.y) },
        end: { x: Math.round(endPt.x), y: Math.round(endPt.y) },
        heightCm: prev?.heightCm ?? Math.round(defaultHeightCm),
        thicknessCm: prev?.thicknessCm ?? 15,
        material: prev?.material ?? defaultMaterial,
        openings: prev?.openings ?? [],
      };
    });
  }

  if (existingWalls.length === newBoundary.length - 1) {
    return newBoundary.map((startPt, idx) => {
      const endPt = newBoundary[(idx + 1) % newBoundary.length];
      const prev = existingWalls[Math.min(idx, existingWalls.length - 1)];
      return {
        id: `wall-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        start: { x: Math.round(startPt.x), y: Math.round(startPt.y) },
        end: { x: Math.round(endPt.x), y: Math.round(endPt.y) },
        heightCm: prev?.heightCm ?? Math.round(defaultHeightCm),
        thicknessCm: prev?.thicknessCm ?? 15,
        material: prev?.material ?? defaultMaterial,
        openings: [],
      };
    });
  }

  const commonHeight = existingWalls[0]?.heightCm ?? defaultHeightCm;
  const commonMaterial = existingWalls[0]?.material ?? defaultMaterial;
  return createPerimeterWalls(newBoundary, commonHeight, commonMaterial);
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
