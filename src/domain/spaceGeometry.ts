import {
  area,
  areaPaths,
  booleanOpWithPolyTree,
  ClipType,
  difference,
  EndType,
  FillRule,
  inflatePaths,
  intersect,
  JoinType,
  pointInPolygon,
  PointInPolygonResult,
  PolyPath64,
  PolyTree64,
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

export interface CultivableSectorCm {
  id: string;
  outer: Polygon2DCm;
  holes: Polygon2DCm[];
  areaM2: number;
}

export interface WalkableMaterialRegionCm {
  material: FloorMaterialType;
  polygons: Polygon2DCm[];
}

export interface ComputedSpaceRegions {
  baseAreaM2: number;
  walkablePolygons: Polygon2DCm[];
  walkableRegionsByMaterial: WalkableMaterialRegionCm[];
  walkableAreaM2: number;
  cultivablePolygons: Polygon2DCm[];
  cultivableSectors: CultivableSectorCm[];
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

export function extractCultivableSectorsFromPolyTree(
  root: PolyTree64,
  prefix: string = 'cultivable',
): CultivableSectorCm[] {
  const sectors: CultivableSectorCm[] = [];

  function traverse(node: PolyTree64 | PolyPath64) {
    const poly = node.poly;
    if (poly && poly.length >= 3 && !node.isHole) {
      const outer: Polygon2DCm = poly.map((pt) => ({ x: pt.x, y: pt.y }));
      const holes: Polygon2DCm[] = [];

      for (let i = 0; i < node.count; i++) {
        const child = node.child(i);
        const childPoly = child.poly;
        if (child.isHole && childPoly && childPoly.length >= 3) {
          holes.push(childPoly.map((pt) => ({ x: pt.x, y: pt.y })));
          for (let j = 0; j < child.count; j++) {
            traverse(child.child(j));
          }
        }
      }

      const outerAreaM2 = Math.abs(area(poly)) / CM2_PER_M2;
      const holesAreaM2 = holes.reduce(
        (sum, h) => sum + Math.abs(area(toPath64(h))) / CM2_PER_M2,
        0,
      );
      const areaM2 = Math.max(0, Math.round((outerAreaM2 - holesAreaM2) * 1000) / 1000);

      sectors.push({
        id: `${prefix}-${sectors.length}`,
        outer,
        holes,
        areaM2,
      });
    } else {
      for (let i = 0; i < node.count; i++) {
        traverse(node.child(i));
      }
    }
  }

  traverse(root);
  return sectors;
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
      walkableRegionsByMaterial: [],
      walkableAreaM2: 0,
      cultivablePolygons: [],
      cultivableSectors: [],
      cultivableAreaM2: 0,
    };
  }

  const basePath64 = toPath64(baseBoundary);
  const basePaths64: Paths64 = [basePath64];
  const baseAreaM2 = Math.abs(area(basePath64)) / CM2_PER_M2;

  const rawWalkablePaths: Paths64 = [];
  const materialLayers = new Map<FloorMaterialType, Paths64>();

  const applyWalkableMaterialLayer = (
    material: FloorMaterialType,
    itemPaths64: Paths64,
  ) => {
    if (itemPaths64.length === 0) return;
    const clippedItem = intersect(
      union(itemPaths64, FillRule.NonZero),
      basePaths64,
      FillRule.NonZero,
    );
    if (clippedItem.length === 0) return;

    for (const [otherMat, existingPaths] of materialLayers.entries()) {
      if (otherMat !== material && existingPaths.length > 0) {
        materialLayers.set(
          otherMat,
          difference(existingPaths, clippedItem, FillRule.NonZero),
        );
      }
    }

    const sameMatPaths = materialLayers.get(material) ?? [];
    materialLayers.set(
      material,
      union([...sameMatPaths, ...clippedItem], FillRule.NonZero),
    );
  };

  for (const zone of hardscapeZones) {
    if (zone.polygon.length >= 3) {
      const p64 = toPath64(zone.polygon);
      rawWalkablePaths.push(p64);
      applyWalkableMaterialLayer(zone.material || 'concrete', [p64]);
    }
  }

  for (const stroke of paths) {
    const inflatedPolys = inflatePathToPolygon(stroke.points, stroke.widthCm);
    const strokePaths64: Paths64 = [];
    for (const poly of inflatedPolys) {
      if (poly.length >= 3) {
        const p64 = toPath64(poly);
        rawWalkablePaths.push(p64);
        strokePaths64.push(p64);
      }
    }
    applyWalkableMaterialLayer(stroke.material || 'concrete', strokePaths64);
  }

  const walkablePaths64: Paths64 =
    rawWalkablePaths.length > 0
      ? intersect(
          union(rawWalkablePaths, FillRule.NonZero),
          basePaths64,
          FillRule.NonZero,
        )
      : [];

  const walkableAreaM2 = Math.abs(areaPaths(walkablePaths64)) / CM2_PER_M2;

  if (walkablePaths64.length === 0) {
    const singleSector: CultivableSectorCm = {
      id: 'cultivable-0',
      outer: baseBoundary,
      holes: [],
      areaM2: baseAreaM2,
    };
    return {
      baseAreaM2,
      walkablePolygons: [],
      walkableRegionsByMaterial: [],
      walkableAreaM2: 0,
      cultivablePolygons: [baseBoundary],
      cultivableSectors: [singleSector],
      cultivableAreaM2: baseAreaM2,
    };
  }

  const walkableRegionsByMaterial: WalkableMaterialRegionCm[] = [];
  for (const [material, matPaths64] of materialLayers.entries()) {
    const polygons = fromPaths64(matPaths64).filter((p) => p.length >= 3);
    if (polygons.length > 0) {
      walkableRegionsByMaterial.push({ material, polygons });
    }
  }

  const polytree = new PolyTree64();
  booleanOpWithPolyTree(
    ClipType.Difference,
    basePaths64,
    walkablePaths64,
    polytree,
    FillRule.NonZero,
  );

  const cultivableSectors = extractCultivableSectorsFromPolyTree(polytree);
  const cultivablePolygons = cultivableSectors.map((s) => s.outer);
  const cultivableAreaM2 =
    Math.round(
      cultivableSectors.reduce((sum, s) => sum + s.areaM2, 0) * 1000,
    ) / 1000;

  return {
    baseAreaM2,
    walkablePolygons: fromPaths64(walkablePaths64),
    walkableRegionsByMaterial,
    walkableAreaM2,
    cultivablePolygons,
    cultivableSectors,
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
  if (regions.cultivableSectors && regions.cultivableSectors.length > 0) {
    if (
      regions.cultivableSectors.some(
        (sec) =>
          isPointInPolygonCm(point, sec.outer) &&
          !sec.holes.some((h) => isPointInPolygonCm(point, h)),
      )
    ) {
      return 'cultivable';
    }
  } else if (
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

// ---------------------------------------------------------------------------
// Slice 9: Object Footprint & Collision Validation (Clipper2)
// ---------------------------------------------------------------------------

/**
 * Genera el polígono 2D del Oriented Bounding Box (OBB) de un objeto en coordenadas de plano (cm),
 * rotado por `rotationDeg` alrededor de su centro.
 */
export function computeObjectFootprintPolygon(
  centerCm: Point2DCm,
  widthCm: number,
  depthCm: number,
  rotationDeg: number = 0,
): Polygon2DCm {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const hx = widthCm / 2;
  const hy = depthCm / 2;

  // 4 esquinas locales relativas al centro
  const localCorners = [
    { x: -hx, y: -hy },
    { x: hx, y: -hy },
    { x: hx, y: hy },
    { x: -hx, y: hy },
  ];

  return localCorners.map((c) => ({
    x: Math.round(centerCm.x + (c.x * cos - c.y * sin)),
    y: Math.round(centerCm.y + (c.x * sin + c.y * cos)),
  }));
}

/**
 * Infla el segmento de muro a un polígono 2D cerrado en cm con su espesor real.
 */
export function computeWallFootprintPolygon(wall: WallSegmentCm): Polygon2DCm[] {
  const thickness = wall.thicknessCm > 0 ? wall.thicknessCm : 15;
  const inflated = inflatePaths(
    [toPath64([wall.start, wall.end])],
    thickness / 2,
    JoinType.Miter,
    EndType.Square,
  );
  return fromPaths64(inflated);
}

export type StackingRole = 'support_base' | 'stackable_item' | 'top_only';

export interface ExistingObjectSpatialSummary {
  id: string;
  assetId?: string;
  category?: string;
  xCm: number;
  yCm: number;
  widthCm?: number;
  depthCm?: number;
  heightCm?: number;
  rotationDeg?: number;
  elevationM?: number;
  label?: string;
  stackRole?: StackingRole;
  supportSurfaceHeightCm?: number;
}

export interface ValidateObjectPlacementInput {
  centerCm: Point2DCm;
  widthCm: number;
  depthCm: number;
  rotationDeg?: number;
  elevationM?: number;
  heightCm?: number;
  baseBoundary: Polygon2DCm;
  walls?: WallSegmentCm[];
  existingObjects?: ExistingObjectSpatialSummary[];
  ignoreObjectId?: string;
  stackedBaseObjectId?: string;
}

export interface ObjectPlacementValidationResult {
  isValid: boolean;
  footprint: Polygon2DCm;
  isOutsidePerimeter: boolean;
  outsideAreaCm2: number;
  collidingWallIds: string[];
  collidingObjectIds: string[];
  reasons: string[];
  effectiveElevationM?: number;
  isStacked?: boolean;
  stackedOnLabel?: string;
}

/**
 * Valida con Clipper2 (diferencia e intersección booleana exacta) si la huella 2D de un objeto
 * cabe dentro del perímetro de la sala, si colisiona con muros perimetrales o si colisiona
 * con otros objetos colocados en el mismo nivel de elevación (permitiendo apilado vertical).
 */
export function validateObjectPlacement(
  input: ValidateObjectPlacementInput,
): ObjectPlacementValidationResult {
  const {
    centerCm,
    widthCm,
    depthCm,
    rotationDeg = 0,
    elevationM = 0,
    heightCm = 100,
    baseBoundary,
    walls = [],
    existingObjects = [],
    ignoreObjectId,
    stackedBaseObjectId,
  } = input;

  const footprint = computeObjectFootprintPolygon(centerCm, widthCm, depthCm, rotationDeg);
  const footprintPath = toPath64(footprint);
  const reasons: string[] = [];
  let isOutsidePerimeter = false;
  let outsideAreaCm2 = 0;
  const collidingWallIds: string[] = [];
  const collidingObjectIds: string[] = [];

  // 1. Verificación de Perímetro con Clipper2 difference: footprint - baseBoundary
  if (baseBoundary && baseBoundary.length >= 3) {
    const outsidePaths = difference([footprintPath], [toPath64(baseBoundary)], FillRule.NonZero);
    outsideAreaCm2 = Math.abs(areaPaths(outsidePaths));
    // Tolerancia mínima de 1 cm² por discretización de enteros
    if (outsideAreaCm2 > 1.0) {
      isOutsidePerimeter = true;
      reasons.push('El objeto sobresale fuera del perímetro de la sala');
    }
  }

  // 2. Verificación de Colisión con Muros con Clipper2 intersect: footprint ∩ wallFootprint
  for (const wall of walls) {
    const wallPolys = computeWallFootprintPolygon(wall);
    if (wallPolys.length === 0) continue;
    const intersection = intersect([footprintPath], wallPolys.map(toPath64), FillRule.NonZero);
    const wallCollisionArea = Math.abs(areaPaths(intersection));
    if (wallCollisionArea > 1.0) {
      collidingWallIds.push(wall.id);
    }
  }
  if (collidingWallIds.length > 0) {
    reasons.push(
      `Colisión con muro (${collidingWallIds.length === 1 ? 'muro' : `${collidingWallIds.length} muros`})`,
    );
  }

  // 3. Verificación de Colisión con Otros Objetos (con soporte de apilado por elevación)
  const currentBottomM = elevationM;
  const currentTopM = elevationM + heightCm * 0.01;

  for (const other of existingObjects) {
    if (ignoreObjectId && other.id === ignoreObjectId) continue;
    if (stackedBaseObjectId && other.id === stackedBaseObjectId) continue;

    const otherBottomM = other.elevationM ?? 0;
    const otherHeightM = (other.heightCm ?? 50) * 0.01;
    const otherTopM = otherBottomM + otherHeightM;

    // Se solapan verticalmente si: currentBottom < otherTop AND currentTop > otherBottom
    // Con 1 cm (0.01 m) de holgura para permitir apoyar un cajón sobre un palet sin falso positivo
    const verticalOverlap =
      currentBottomM < otherTopM - 0.01 && currentTopM > otherBottomM + 0.01;

    if (!verticalOverlap) {
      // Sin colisión vertical (apilado o a diferente altura)
      continue;
    }

    const otherWidth = other.widthCm ?? 60;
    const otherDepth = other.depthCm ?? 40;
    const otherRot = other.rotationDeg ?? 0;
    const otherFootprint = computeObjectFootprintPolygon(
      { x: other.xCm, y: other.yCm },
      otherWidth,
      otherDepth,
      otherRot,
    );

    const inter = intersect([footprintPath], [toPath64(otherFootprint)], FillRule.NonZero);
    const interArea = Math.abs(areaPaths(inter));
    if (interArea > 2.0) {
      collidingObjectIds.push(other.id);
    }
  }

  if (collidingObjectIds.length > 0) {
    reasons.push(`Superposición con otro objeto (${collidingObjectIds.length})`);
  }

  const isValid =
    !isOutsidePerimeter && collidingWallIds.length === 0 && collidingObjectIds.length === 0;

  return {
    isValid,
    footprint,
    isOutsidePerimeter,
    outsideAreaCm2,
    collidingWallIds,
    collidingObjectIds,
    reasons,
    effectiveElevationM: elevationM,
  };
}

/**
 * Snaps a metric centimeter value to the nearest grid step.
 * e.g. snapToMetricGrid(123, 10) => 120, snapToMetricGrid(128, 10) => 130
 */
export function snapToMetricGrid(valCm: number, stepCm: number = 5): number {
  if (stepCm <= 1) return Math.round(valCm);
  return Math.round(valCm / stepCm) * stepCm;
}

/**
 * Snaps a 2D coordinate in centimeters to a metric grid step (default 5 cm).
 */
export function snapPointToMetricGrid(
  pointCm: Point2DCm,
  stepCm: number = 5,
): Point2DCm {
  return {
    x: snapToMetricGrid(pointCm.x, stepCm),
    y: snapToMetricGrid(pointCm.y, stepCm),
  };
}

/**
 * Infiere el rol de apilado físico de un objeto en el espacio agronómico/logístico.
 */
export function inferSpatialStackRole(
  assetId?: string,
  category?: string,
): StackingRole {
  if (!assetId) return 'top_only';
  const idLower = assetId.toLowerCase();
  if (
    idLower.includes('pallet') ||
    idLower.includes('table') ||
    idLower.includes('workbench') ||
    idLower.includes('desk') ||
    idLower.includes('bench') ||
    idLower.includes('rack') ||
    idLower.includes('shelf')
  ) {
    return 'support_base';
  }
  if (
    idLower.includes('crate') ||
    idLower.includes('box') ||
    idLower.includes('bin') ||
    idLower.includes('container')
  ) {
    return 'stackable_item';
  }
  if (category === 'logistics' && idLower.includes('cart')) {
    return 'support_base';
  }
  return 'top_only';
}

/**
 * Determina si un objeto puede apoyarse encima de otro.
 * Regla:
 * - Objetos 'top_only' no admiten nada encima.
 * - Objetos 'support_base' (palets, mesas, racks) nunca se apilan sobre otros objetos.
 * - 'support_base' puede soportar 'stackable_item' y 'top_only'.
 * - 'stackable_item' (cajones) pueden soportar otros 'stackable_item' o 'top_only'.
 */
export function canStackRoles(
  itemRole: StackingRole,
  baseRole: StackingRole,
): boolean {
  if (baseRole === 'top_only') return false;
  if (itemRole === 'support_base') return false;
  if (baseRole === 'support_base') {
    return itemRole === 'stackable_item' || itemRole === 'top_only';
  }
  if (baseRole === 'stackable_item') {
    return itemRole === 'stackable_item' || itemRole === 'top_only';
  }
  return false;
}

export interface AutoStackDetectionInput {
  centerCm: Point2DCm;
  widthCm?: number;
  depthCm?: number;
  rotationDeg?: number;
  itemAssetId?: string;
  itemCategory?: string;
  itemStackRole?: StackingRole;
  existingObjects?: ExistingObjectSpatialSummary[];
  ignoreObjectId?: string;
  maxStackLevels?: number;
}

export interface AutoStackElevationResult {
  isStacked: boolean;
  targetElevationM: number;
  baseObjectId: string | null;
  baseObjectLabel: string | null;
  stackLevels: number;
  rejectionReason?: string;
}

function inferDefaultDimensions(
  assetId?: string,
  category?: string,
): { widthCm: number; depthCm: number; heightCm: number } {
  if (!assetId) return { widthCm: 60, depthCm: 40, heightCm: 30 };
  const idLower = assetId.toLowerCase();
  if (idLower.includes('pallet')) return { widthCm: 120, depthCm: 80, heightCm: 21 };
  if (idLower.includes('crate') || idLower.includes('box')) return { widthCm: 60, depthCm: 40, heightCm: 25 };
  if (idLower.includes('table') || idLower.includes('bench') || idLower.includes('desk'))
    return { widthCm: 150, depthCm: 80, heightCm: 90 };
  if (idLower.includes('rack') || idLower.includes('shelf'))
    return { widthCm: 130, depthCm: 50, heightCm: 180 };
  if (category === 'harvest_produce') return { widthCm: 30, depthCm: 30, heightCm: 20 };
  return { widthCm: 60, depthCm: 60, heightCm: 60 };
}

/**
 * Busca si existe un objeto válido de soporte debajo de un objeto dado.
 * Un objeto sirve de soporte si:
 * 1. Su elevación superior (elevationM + supportSurfaceHeightM) está por debajo (o en la base) del objeto.
 * 2. Su huella 2D contiene el centro del objeto superior O solapa al menos el 25% del área.
 * 3. Sus roles son compatibles (canStackRoles).
 */
export function findSupportingBaseUnder(
  item: ExistingObjectSpatialSummary,
  candidates: ExistingObjectSpatialSummary[],
  visitedIds = new Set<string>(),
): { base: ExistingObjectSpatialSummary; topM: number } | null {
  const itemDefaults = inferDefaultDimensions(item.assetId, item.category);
  const itemW = item.widthCm ?? itemDefaults.widthCm;
  const itemD = item.depthCm ?? itemDefaults.depthCm;
  const itemRot = item.rotationDeg ?? 0;
  const itemFootprint = computeObjectFootprintPolygon({ x: item.xCm, y: item.yCm }, itemW, itemD, itemRot);
  const itemFootprintPath = toPath64(itemFootprint);
  const itemAreaCm2 = itemW * itemD;
  const itemRole = item.stackRole ?? inferSpatialStackRole(item.assetId, item.category);

  // Bases de soporte pesadas (como mesas y palets) nunca se consideran soportadas por otros
  if (itemRole === 'support_base') return null;

  const validBases: Array<{ base: ExistingObjectSpatialSummary; topM: number; interAreaCm2: number }> = [];

  for (const cand of candidates) {
    if (cand.id === item.id || visitedIds.has(cand.id)) continue;

    const baseDefaults = inferDefaultDimensions(cand.assetId, cand.category);
    const baseW = cand.widthCm ?? baseDefaults.widthCm;
    const baseD = cand.depthCm ?? baseDefaults.depthCm;
    const baseRot = cand.rotationDeg ?? 0;
    const baseFootprint = computeObjectFootprintPolygon({ x: cand.xCm, y: cand.yCm }, baseW, baseD, baseRot);
    const baseFootprintPath = toPath64(baseFootprint);

    const centerInside = isPointInPolygonCm({ x: item.xCm, y: item.yCm }, baseFootprint);
    const inter = intersect([itemFootprintPath], [baseFootprintPath], FillRule.NonZero);
    const interAreaCm2 = Math.abs(areaPaths(inter));
    const overlapRatio = itemAreaCm2 > 0 ? interAreaCm2 / itemAreaCm2 : 0;

    if (centerInside || overlapRatio >= 0.25) {
      const candElevationM = cand.elevationM ?? 0;
      const itemElevationM = item.elevationM ?? 0;

      // Un candidato no puede ser soporte si su base está por encima del ítem
      // o a la misma altura (a menos que cand sea un support_base en el suelo)
      if (candElevationM > itemElevationM) continue;
      if (candElevationM === itemElevationM) {
        if (candElevationM > 0) continue;
        const candRole = cand.stackRole ?? inferSpatialStackRole(cand.assetId, cand.category);
        if (candRole !== 'support_base') continue;
      }

      const baseRole = cand.stackRole ?? inferSpatialStackRole(cand.assetId, cand.category);
      if (!canStackRoles(itemRole, baseRole)) continue;

      const candSurfaceHeightM = (cand.supportSurfaceHeightCm ?? cand.heightCm ?? baseDefaults.heightCm) * 0.01;
      const topM = Math.round((candElevationM + candSurfaceHeightM) * 1000) / 1000;

      validBases.push({ base: cand, topM, interAreaCm2 });
    }
  }

  if (validBases.length === 0) return null;

  // Ordenar por la superficie de soporte más alta
  validBases.sort((a, b) => {
    if (Math.abs(b.topM - a.topM) > 0.01) {
      return b.topM - a.topM;
    }
    return b.interAreaCm2 - a.interAreaCm2;
  });

  return validBases[0];
}

/**
 * Verifica si un objeto está sólidamente apoyado en el suelo (elevationM <= 0.05)
 * o si posee una cadena continua de objetos de soporte que llega hasta el suelo.
 * Evita apilar sobre objetos que estén flotando en el aire.
 */
export function isObjectGrounded(
  obj: ExistingObjectSpatialSummary,
  allObjects: ExistingObjectSpatialSummary[],
): boolean {
  if ((obj.elevationM ?? 0) <= 0.05) return true;

  let current = obj;
  const visited = new Set<string>([obj.id]);

  while ((current.elevationM ?? 0) > 0.05) {
    const support = findSupportingBaseUnder(current, allObjects, visited);
    if (!support) return false; // Vacío debajo -> suspendido en el aire

    visited.add(support.base.id);
    current = support.base;
    if (visited.size > 10) return false;
  }

  return true;
}

export interface ReconcileStackElevationsOptions {
  exemptObjectId?: string;
}

/**
 * Reconcilia la elevación vertical de todos los objetos en el espacio para mantener
 * la coherencia física gravitacional (cascada de soporte):
 * 1. Para objetos en el suelo (elevationM <= 0.05):
 *    - Si no tienen soporte o son 'support_base', su elevación es 0.
 * 2. Para objetos elevados (elevationM > 0.05):
 *    - Busca si existe un soporte válido debajo.
 *    - Si lo encuentra y la base está anclada al suelo, su elevación se ajusta a la superficie de ese soporte.
 *    - Si NO lo encuentra (porque la base fue movida o eliminada), la gravedad lo hace caer al suelo (elevationM = 0).
 * 3. Ejecuta iterativamente hasta convergencia (máximo 6 iteraciones para cadenas profundas).
 */
export function reconcileStackElevations<T extends ExistingObjectSpatialSummary>(
  objects: T[],
  options?: ReconcileStackElevationsOptions,
): T[] {
  if (!objects || objects.length === 0) return [];

  let currentList: T[] = objects.map((obj) => ({ ...obj }));
  const exemptId = options?.exemptObjectId;
  const MAX_PASSES = 6;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let changed = false;

    // Procesar de menor a mayor elevación para que la cascada caiga en orden
    const sortedIndices = currentList
      .map((obj, idx) => ({ idx, elev: obj.elevationM ?? 0 }))
      .sort((a, b) => a.elev - b.elev)
      .map((item) => item.idx);

    for (const idx of sortedIndices) {
      const obj = currentList[idx];

      // Si el objeto está exento por modificación explícita del usuario, preservar su elevación
      if (exemptId && obj.id === exemptId) {
        continue;
      }

      const role = obj.stackRole ?? inferSpatialStackRole(obj.assetId, obj.category);

      if (role === 'support_base') {
        if ((obj.elevationM ?? 0) !== 0) {
          currentList[idx] = { ...obj, elevationM: 0 };
          changed = true;
        }
        continue;
      }

      const support = findSupportingBaseUnder(obj, currentList);
      let targetElevationM = 0;
      if (support && isObjectGrounded(support.base, currentList)) {
        targetElevationM = support.topM;
      }

      const currentElevationM = obj.elevationM ?? 0;
      if (Math.abs(currentElevationM - targetElevationM) > 0.005) {
        currentList[idx] = { ...obj, elevationM: targetElevationM };
        changed = true;
      }
    }

    if (!changed) break;
  }

  return currentList;
}

/**
 * Calcula niveles de apilado transitivos debajo de un objeto base.
 */
function countStackLevelsUnder(
  baseObj: ExistingObjectSpatialSummary,
  allObjects: ExistingObjectSpatialSummary[],
): number {
  if (!isObjectGrounded(baseObj, allObjects)) {
    return 999; // Base no anclada, inválida
  }

  let count = 1;
  let current = baseObj;
  const visited = new Set<string>([baseObj.id]);

  while ((current.elevationM ?? 0) > 0.05) {
    const support = findSupportingBaseUnder(current, allObjects, visited);
    if (!support) break;
    visited.add(support.base.id);
    count++;
    current = support.base;
    if (count > 10) break; // salvaguarda contra bucles infinitos
  }

  return count;
}

/**
 * Detecta si la huella 2D de un objeto (por contención de centro o por superposición de superficie >= 20%)
 * se apoya sobre un objeto base soportante (palet, mesa, estante, cajón inferior) y calcula
 * la elevación vertical exacta (Z_top = Z_base + H_base + 1mm) con prevención de Z-fighting
 * y validación jerárquica de apilado.
 */
export function detectAutoStackElevation(
  input: AutoStackDetectionInput,
): AutoStackElevationResult {
  const {
    centerCm,
    widthCm,
    depthCm,
    rotationDeg = 0,
    itemAssetId,
    itemCategory,
    itemStackRole,
    existingObjects = [],
    ignoreObjectId,
    maxStackLevels = 4,
  } = input;

  const itemRole =
    itemStackRole ?? inferSpatialStackRole(itemAssetId, itemCategory);

  // Bases de soporte pesadas (como palets y mesas) nunca se apilan sobre otros objetos
  if (itemRole === 'support_base') {
    return {
      isStacked: false,
      targetElevationM: 0,
      baseObjectId: null,
      baseObjectLabel: null,
      stackLevels: 0,
    };
  }

  const defaultDims = inferDefaultDimensions(itemAssetId, itemCategory);
  const itemW = widthCm ?? defaultDims.widthCm;
  const itemD = depthCm ?? defaultDims.depthCm;
  const itemRot = rotationDeg ?? 0;
  const itemFootprint = computeObjectFootprintPolygon(centerCm, itemW, itemD, itemRot);
  const itemFootprintPath = toPath64(itemFootprint);
  const itemAreaCm2 = itemW * itemD;

  // Filtrar candidatos que contengan el centro o tengan superficie de soporte suficiente
  const containingCandidates: Array<{
    base: ExistingObjectSpatialSummary;
    topM: number;
    elevationM: number;
    interAreaCm2: number;
    overlapRatio: number;
  }> = [];

  for (const obj of existingObjects) {
    if (ignoreObjectId && obj.id === ignoreObjectId) continue;

    const baseDefaults = inferDefaultDimensions(obj.assetId, obj.category);
    const baseW = obj.widthCm ?? baseDefaults.widthCm;
    const baseD = obj.depthCm ?? baseDefaults.depthCm;
    const baseRot = obj.rotationDeg ?? 0;
    const baseFootprint = computeObjectFootprintPolygon({ x: obj.xCm, y: obj.yCm }, baseW, baseD, baseRot);
    const baseFootprintPath = toPath64(baseFootprint);

    // 1. ¿El centro del ítem está dentro de la base?
    const centerInside = isPointInPolygonCm(centerCm, baseFootprint);

    // 2. ¿Qué porcentaje del ítem se apoya físicamente sobre la base?
    const inter = intersect([itemFootprintPath], [baseFootprintPath], FillRule.NonZero);
    const interAreaCm2 = Math.abs(areaPaths(inter));
    const overlapRatio = itemAreaCm2 > 0 ? interAreaCm2 / itemAreaCm2 : 0;

    // Se considera soportado si el centro está dentro O si al menos el 25% de su huella
    // descansa sobre la superficie de la base (permite ubicar cajas en los bordes y esquinas de palets)
    const isSupported = centerInside || overlapRatio >= 0.25;

    if (isSupported) {
      const elevationM = obj.elevationM ?? 0;
      const surfaceHeightM = (obj.supportSurfaceHeightCm ?? obj.heightCm ?? baseDefaults.heightCm) * 0.01;
      const topM = elevationM + surfaceHeightM;
      containingCandidates.push({
        base: obj,
        topM,
        elevationM,
        interAreaCm2,
        overlapRatio,
      });
    }
  }

  if (containingCandidates.length === 0) {
    return {
      isStacked: false,
      targetElevationM: 0,
      baseObjectId: null,
      baseObjectLabel: null,
      stackLevels: 0,
    };
  }

  // Ordenar candidatos: primero la superficie de soporte más alta, luego mayor superficie de apoyo
  containingCandidates.sort((a, b) => {
    if (Math.abs(b.topM - a.topM) > 0.01) {
      return b.topM - a.topM;
    }
    return b.interAreaCm2 - a.interAreaCm2;
  });

  const bestCandidate = containingCandidates[0];
  const baseObj = bestCandidate.base;

  // Validar que la base esté anclada al suelo o soporte continuo firme
  if (!isObjectGrounded(baseObj, existingObjects)) {
    return {
      isStacked: false,
      targetElevationM: 0,
      baseObjectId: null,
      baseObjectLabel: null,
      stackLevels: 0,
      rejectionReason: 'El objeto base no está apoyado sobre el suelo o soporte firme',
    };
  }

  const baseRole =
    baseObj.stackRole ?? inferSpatialStackRole(baseObj.assetId, baseObj.category);

  // Validar compatibilidad de roles
  if (!canStackRoles(itemRole, baseRole)) {
    return {
      isStacked: false,
      targetElevationM: 0,
      baseObjectId: null,
      baseObjectLabel: null,
      stackLevels: 0,
      rejectionReason: 'Base incompatible para apilar este elemento',
    };
  }

  // Verificar límite de niveles de apilado
  const currentLevelsUnder = countStackLevelsUnder(baseObj, existingObjects);
  if (currentLevelsUnder >= maxStackLevels) {
    return {
      isStacked: false,
      targetElevationM: 0,
      baseObjectId: null,
      baseObjectLabel: null,
      stackLevels: currentLevelsUnder,
      rejectionReason: `Límite máximo de apilado alcanzado (${maxStackLevels} niveles)`,
    };
  }

  // Z_top = Z_base + H_base + 0.001 m (1mm de epsilon anti Z-fighting)
  const targetElevationM = Math.round((bestCandidate.topM + 0.001) * 1000) / 1000;

  const MAX_ALLOWED_ELEVATION_M = 2.5;
  if (targetElevationM > MAX_ALLOWED_ELEVATION_M) {
    return {
      isStacked: false,
      targetElevationM: 0,
      baseObjectId: null,
      baseObjectLabel: null,
      stackLevels: currentLevelsUnder,
      rejectionReason: `Límite máximo de altura de apilado alcanzado (${MAX_ALLOWED_ELEVATION_M}m)`,
    };
  }

  return {
    isStacked: true,
    targetElevationM,
    baseObjectId: baseObj.id,
    baseObjectLabel: baseObj.label || baseObj.assetId || 'Base',
    stackLevels: currentLevelsUnder + 1,
  };
}

export interface MagneticWallSnapInput {
  candidateCenterCm: Point2DCm;
  widthCm: number;
  depthCm: number;
  currentRotationDeg?: number;
  baseBoundary: Polygon2DCm;
  walls?: WallSegmentCm[];
  snapThresholdCm?: number;
  breakAwayThresholdCm?: number;
  currentlySnappedWallId?: string | null;
  tangentGridStepCm?: number;
}

export interface MagneticWallSnapResult {
  isSnapped: boolean;
  wallId: string | null;
  snappedCenterCm: Point2DCm;
  snappedRotationDeg: number;
  wallNormal: Point2DCm | null;
  distanceToFaceCm: number;
  isBlockingOpening: boolean;
  openingKind?: 'door' | 'window';
  warning?: string;
}

function normalizeAngleDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function circularAngleDiffDeg(a: number, b: number): number {
  const diff = Math.abs(normalizeAngleDeg(a) - normalizeAngleDeg(b));
  return Math.min(diff, 360 - diff);
}

/**
 * Motor de atracción magnética inteligente hacia caras interiores de muros (Wall Snapping).
 * - Calcula la distancia exacta a la cara interior (restando espesor de muro y semi-dimensión de objeto).
 * - Auto-rota el objeto al ángulo paralelo o perpendicular más cercano minimizando saltos de 180°.
 * - Evita falsas colisiones y Z-fighting agregando holgura técnica de 0.5 cm.
 * - Delimita los extremos del muro (edge clamping) para no permitir snap en el vacío.
 * - Aplica histéresis (dead-band) para eliminar el parpadeo en umbrales y el "corner ping-pong".
 * - Detecta obstrucción de puertas y ventanas definidas en el muro.
 */
export function findMagneticWallSnap(
  input: MagneticWallSnapInput,
): MagneticWallSnapResult {
  const {
    candidateCenterCm,
    widthCm,
    depthCm,
    currentRotationDeg = 0,
    baseBoundary,
    walls = [],
    snapThresholdCm = 18,
    breakAwayThresholdCm = 28,
    currentlySnappedWallId = null,
    tangentGridStepCm = 5,
  } = input;

  const defaultResult: MagneticWallSnapResult = {
    isSnapped: false,
    wallId: null,
    snappedCenterCm: candidateCenterCm,
    snappedRotationDeg: currentRotationDeg,
    wallNormal: null,
    distanceToFaceCm: Infinity,
    isBlockingOpening: false,
  };

  if (!walls || walls.length === 0) {
    return defaultResult;
  }

  interface SnapCandidate {
    wall: WallSegmentCm;
    snappedCenterCm: Point2DCm;
    snappedRotationDeg: number;
    wallNormal: Point2DCm;
    distanceToFaceCm: number;
    score: number;
    isBlockingOpening: boolean;
    openingKind?: 'door' | 'window';
    warning?: string;
  }

  const candidates: SnapCandidate[] = [];

  for (const wall of walls) {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const length = Math.hypot(dx, dy);
    if (length < 1) continue;

    const ux = dx / length;
    const uy = dy / length;
    const wallAngleDeg = normalizeAngleDeg((Math.atan2(dy, dx) * 180) / Math.PI);

    // Normal base preliminar (-uy, ux)
    let nx = -uy;
    let ny = ux;

    // Orientar la normal hacia el interior de la sala
    const mx = (wall.start.x + wall.end.x) / 2;
    const my = (wall.start.y + wall.end.y) / 2;
    if (baseBoundary && baseBoundary.length >= 3) {
      const testPtA = { x: mx + nx * 5, y: my + ny * 5 };
      const testPtB = { x: mx - nx * 5, y: my - ny * 5 };
      const inA = isPointInPolygonCm(testPtA, baseBoundary);
      const inB = isPointInPolygonCm(testPtB, baseBoundary);

      if (!inA && inB) {
        nx = -nx;
        ny = -ny;
      }
    }

    // Proyección del centro tentativo sobre la línea del muro
    const vx = candidateCenterCm.x - wall.start.x;
    const vy = candidateCenterCm.y - wall.start.y;
    const tangentDist = vx * ux + vy * uy;
    const signedDistToCenterline = vx * nx + vy * ny;

    // Si el cursor está muy lejos de los extremos del muro longitudinalmente (> 15 cm), no atraer
    if (tangentDist < -15 || tangentDist > length + 15) {
      continue;
    }

    // Auto-alineación angular: candidatos ortogonales al muro
    const rotCandidates = [
      wallAngleDeg,
      normalizeAngleDeg(wallAngleDeg + 90),
      normalizeAngleDeg(wallAngleDeg + 180),
      normalizeAngleDeg(wallAngleDeg + 270),
    ];
    const currRotNorm = normalizeAngleDeg(currentRotationDeg);
    let bestRot = rotCandidates[0];
    let minDiff = circularAngleDiffDeg(currRotNorm, bestRot);

    for (let i = 1; i < rotCandidates.length; i++) {
      const diff = circularAngleDiffDeg(currRotNorm, rotCandidates[i]);
      if (diff < minDiff) {
        minDiff = diff;
        bestRot = rotCandidates[i];
      }
    }

    // Dimensiones efectivas según si el objeto se alinea paralelo o transversal al muro
    const diffWithWall = circularAngleDiffDeg(bestRot, wallAngleDeg);
    const isParallel = diffWithWall <= 45 || diffWithWall >= 135;
    const tangentDim = isParallel ? widthCm : depthCm;
    const normalDim = isParallel ? depthCm : widthCm;

    const wallThickness = wall.thicknessCm > 0 ? wall.thicknessCm : 15;
    const halfWallThickness = wallThickness / 2;
    const halfNormalDim = normalDim / 2;

    // Distancia entre el borde más cercano del objeto y la cara interior del muro
    // cara interior está a +halfWallThickness de la centerline
    const gapToFaceCm = signedDistToCenterline - (halfWallThickness + halfNormalDim);
    const absDistToFace = Math.abs(gapToFaceCm);

    // Verificación de umbral con histéresis
    const isCurrentlySnapped = currentlySnappedWallId === wall.id;
    const effectiveThreshold = isCurrentlySnapped
      ? breakAwayThresholdCm
      : snapThresholdCm;

    if (absDistToFace > effectiveThreshold) {
      continue;
    }

    // Delimitación de extremos (Edge Clamping): evitar que el objeto cuelgue en el vacío
    const halfTangent = tangentDim / 2;
    const minTangentDist = halfTangent + 0.5;
    const maxTangentDist = length - halfTangent - 0.5;

    let clampedTangentDist: number;
    if (minTangentDist > maxTangentDist) {
      clampedTangentDist = length / 2;
    } else {
      clampedTangentDist = Math.max(minTangentDist, Math.min(maxTangentDist, tangentDist));
    }

    // Snap métrico tangencial a lo largo del muro
    let finalTangentDist = clampedTangentDist;
    if (tangentGridStepCm > 0 && minTangentDist <= maxTangentDist) {
      const snappedTangent = Math.round(clampedTangentDist / tangentGridStepCm) * tangentGridStepCm;
      finalTangentDist = Math.max(minTangentDist, Math.min(maxTangentDist, snappedTangent));
    }

    // Offset a cara interior con 0.5 cm de holgura anti-colisión y anti-Z fighting
    const targetNormalDist = halfWallThickness + halfNormalDim + 0.5;

    const snappedCenterCm: Point2DCm = {
      x: Math.round(wall.start.x + ux * finalTangentDist + nx * targetNormalDist),
      y: Math.round(wall.start.y + uy * finalTangentDist + ny * targetNormalDist),
    };

    // Verificación de aberturas (puertas / ventanas)
    let isBlockingOpening = false;
    let openingKind: 'door' | 'window' | undefined;
    let warning: string | undefined;

    if (wall.openings && wall.openings.length > 0) {
      const objStart = finalTangentDist - halfTangent;
      const objEnd = finalTangentDist + halfTangent;

      for (const op of wall.openings) {
        const opStart = op.offsetCm;
        const opEnd = op.offsetCm + op.widthCm;
        const hasOverlap = Math.max(objStart, opStart) < Math.min(objEnd, opEnd);
        if (hasOverlap) {
          isBlockingOpening = true;
          openingKind = op.kind;
          warning =
            op.kind === 'door'
              ? '⚠️ Obstruye puerta de acceso'
              : '⚠️ Bloquea ventana';
          break;
        }
      }
    }

    // Puntuación de histéresis: ventaja de 6 cm al muro actual para evitar ping-pong en esquinas
    const score = isCurrentlySnapped ? absDistToFace - 6 : absDistToFace;

    candidates.push({
      wall,
      snappedCenterCm,
      snappedRotationDeg: bestRot,
      wallNormal: { x: nx, y: ny },
      distanceToFaceCm: Math.round(absDistToFace * 10) / 10,
      score,
      isBlockingOpening,
      openingKind,
      warning,
    });
  }

  if (candidates.length === 0) {
    return defaultResult;
  }

  // Ordenar por menor puntaje
  candidates.sort((a, b) => a.score - b.score);
  const best = candidates[0];

  return {
    isSnapped: true,
    wallId: best.wall.id,
    snappedCenterCm: best.snappedCenterCm,
    snappedRotationDeg: best.snappedRotationDeg,
    wallNormal: best.wallNormal,
    distanceToFaceCm: best.distanceToFaceCm,
    isBlockingOpening: best.isBlockingOpening,
    openingKind: best.openingKind,
    warning: best.warning,
  };
}
