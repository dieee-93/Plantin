import { describe, expect, it } from 'vitest';
import {
  calculatePolygonAreaM2,
  calculatePolygonPerimeterM,
  canInsertVertexAtEdge,
  canStackRoles,
  classifySpacePoint,
  computeObjectFootprintPolygon,
  computeSpaceRegions,
  computeWallFootprintPolygon,
  createDefaultDoorOpening,
  createDefaultWindowOpening,
  createLShapePolygon,
  createPerimeterWalls,
  createRectPolygon,
  decomposeWallIntoPrisms,
  detectAutoStackElevation,
  findClosestEdgeOnPolygon,
  findNextOpeningSlot,
  inferSpatialStackRole,
  inflatePathToPolygon,
  insertPolygonVertex,
  isPointInPolygonCm,
  isRectangularPolygon,
  movePolygonVertex,
  removePolygonVertex,
  sanitizeAndWeldPolygon,
  scalePolygonFromCenter,
  snapPointToMetricGrid,
  snapToMetricGrid,
  syncWallsWithBoundary,
  validateObjectPlacement,
  wouldPolygonSelfIntersect,
  type HardscapeZoneCm,
  type PathStrokeCm,
  type Polygon2DCm,
  type WallSegmentCm,
} from '../spaceGeometry';

describe('spaceGeometry - Slice 1: Rectangles and Polygon Area (1:1 cm scale)', () => {
  it('creates a rectangular polygon in cm and calculates 60 m2 for a 1000x600 cm lot and 44 m2 for an L-shaped polygon', () => {
    const baseLot = createRectPolygon(1000, 600);

    expect(baseLot).toEqual([
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 600 },
      { x: 0, y: 600 },
    ]);
    expect(calculatePolygonAreaM2(baseLot)).toBe(60);
    expect(calculatePolygonPerimeterM(baseLot)).toBe(32); // 2*(10+6) = 32m
    expect(isRectangularPolygon(baseLot)).toBe(true);

    const offsetRect = createRectPolygon(200, 150, { x: 100, y: 50 });
    expect(offsetRect).toEqual([
      { x: 100, y: 50 },
      { x: 300, y: 50 },
      { x: 300, y: 200 },
      { x: 100, y: 200 },
    ]);
    expect(calculatePolygonAreaM2(offsetRect)).toBe(3);

    // L-shaped polygon:
    // Left wing: 400 cm wide x 200 cm deep = 80,000 cm2 (8 m2)
    // Right wing: 600 cm wide x 600 cm deep = 360,000 cm2 (36 m2)
    // Total known area = 44 m2
    const lShapePolygon: Polygon2DCm = [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 600 },
      { x: 400, y: 600 },
      { x: 400, y: 200 },
      { x: 0, y: 200 },
    ];
    expect(calculatePolygonAreaM2(lShapePolygon)).toBe(44);
    expect(isRectangularPolygon(lShapePolygon)).toBe(false);
  });

  it('creates an L-shaped parcel polygon and scales polygons smoothly from center', () => {
    const lShape = createLShapePolygon(1000, 600, 0.4, 0.5);
    expect(lShape).toHaveLength(6);
    expect(isRectangularPolygon(lShape)).toBe(false);

    const scaled = scalePolygonFromCenter(createRectPolygon(1000, 600), 1.1);
    expect(calculatePolygonAreaM2(scaled)).toBeCloseTo(72.6, 1); // 60 * 1.1^2 = 72.6 m2
  });
});

describe('spaceGeometry - Slice 2: Inflate Path Stroke to Polygon', () => {
  it('inflates a straight path to a polygon of exact widthCm and clips against boundary when provided', () => {
    // 400 cm long horizontal path x 80 cm wide = 32,000 cm2 = 3.2 m2
    const unclippedPolygons = inflatePathToPolygon(
      [
        { x: 100, y: 300 },
        { x: 500, y: 300 },
      ],
      80,
    );

    expect(unclippedPolygons).toHaveLength(1);
    expect(calculatePolygonAreaM2(unclippedPolygons[0])).toBeCloseTo(3.2, 2);

    // Path starting 100 cm outside the left boundary (-100, 300) to (500, 300)
    // Clipped against a 1000x600 cm boundary -> 500 cm inside x 80 cm wide = 40,000 cm2 = 4.0 m2
    const boundary = createRectPolygon(1000, 600);
    const clippedPolygons = inflatePathToPolygon(
      [
        { x: -100, y: 300 },
        { x: 500, y: 300 },
      ],
      80,
      boundary,
    );

    expect(clippedPolygons).toHaveLength(1);
    expect(calculatePolygonAreaM2(clippedPolygons[0])).toBeCloseTo(4.0, 2);
  });
});

describe('spaceGeometry - Slice 3: Boolean Union & Difference (User Patio Sketch Case)', () => {
  it('welds an L-shaped upper concrete slab, a diagonal path, and a left horizontal path into 1 walkable region and splits soil into 3 cultivable sectors totaling 60 m2', () => {
    const baseBoundary = createRectPolygon(1000, 600);

    const hardscapeZones: HardscapeZoneCm[] = [
      {
        id: 'playon-superior',
        label: 'Playón de cemento en L',
        material: 'concrete',
        polygon: [
          { x: 0, y: 0 },
          { x: 1000, y: 0 },
          { x: 1000, y: 260 },
          { x: 700, y: 260 },
          { x: 700, y: 160 },
          { x: 0, y: 160 },
        ],
      },
    ];

    const paths: PathStrokeCm[] = [
      {
        id: 'camino-diagonal',
        label: 'Camino diagonal',
        material: 'concrete',
        points: [
          { x: 350, y: 120 },
          { x: 1000, y: 600 },
        ],
        widthCm: 80,
      },
      {
        id: 'camino-horizontal-izq',
        label: 'Camino horizontal izquierdo',
        material: 'concrete',
        points: [
          { x: 0, y: 380 },
          { x: 720, y: 380 },
        ],
        widthCm: 80,
      },
    ];

    const regions = computeSpaceRegions(baseBoundary, hardscapeZones, paths);

    expect(regions.baseAreaM2).toBe(60);
    expect(regions.walkablePolygons).toHaveLength(1);
    expect(regions.cultivablePolygons).toHaveLength(3);
    expect(regions.walkableAreaM2).toBeGreaterThan(15);
    expect(regions.cultivableAreaM2).toBeGreaterThan(30);
    expect(regions.walkableAreaM2 + regions.cultivableAreaM2).toBeCloseTo(60, 1);
  });
});

describe('spaceGeometry - Slice 4: Point-in-Polygon & Region Classification', () => {
  it('detects whether a cm point is inside a polygon and classifies points across the 3 cultivable beds, the diagonal path, and outside the lot', () => {
    const baseBoundary = createRectPolygon(1000, 600);
    expect(isPointInPolygonCm({ x: 500, y: 300 }, baseBoundary)).toBe(true);
    expect(isPointInPolygonCm({ x: 1200, y: 300 }, baseBoundary)).toBe(false);

    const regions = computeSpaceRegions(
      baseBoundary,
      [
        {
          id: 'playon-superior',
          material: 'concrete',
          polygon: [
            { x: 0, y: 0 },
            { x: 1000, y: 0 },
            { x: 1000, y: 260 },
            { x: 700, y: 260 },
            { x: 700, y: 160 },
            { x: 0, y: 160 },
          ],
        },
      ],
      [
        {
          id: 'camino-diagonal',
          material: 'concrete',
          points: [
            { x: 350, y: 120 },
            { x: 1000, y: 600 },
          ],
          widthCm: 80,
        },
        {
          id: 'camino-horizontal-izq',
          material: 'concrete',
          points: [
            { x: 0, y: 380 },
            { x: 720, y: 380 },
          ],
          widthCm: 80,
        },
      ],
    );

    // Inside upper slab and diagonal path
    expect(classifySpacePoint({ x: 500, y: 80 }, regions)).toBe('walkable');
    expect(classifySpacePoint({ x: 675, y: 360 }, regions)).toBe('walkable');

    // Inside each of the 3 separated cultivable beds
    expect(classifySpacePoint({ x: 150, y: 260 }, regions)).toBe('cultivable');
    expect(classifySpacePoint({ x: 250, y: 500 }, regions)).toBe('cultivable');
    expect(classifySpacePoint({ x: 850, y: 380 }, regions)).toBe('cultivable');

    // Outside the property boundary
    expect(classifySpacePoint({ x: -20, y: 300 }, regions)).toBe('outside');
    expect(classifySpacePoint({ x: 1050, y: 700 }, regions)).toBe('outside');
  });
});

describe('spaceGeometry - Slice 5: Vertex Editing & Perimeter Walls Generation', () => {
  it('inserts and moves vertices with cm snapping to deform a rectangle and generates perimeter wall segments', () => {
    const rect = createRectPolygon(1000, 600);

    // Insert vertex on bottom edge (edgeIndex 2: from (1000,600) to (0,600))
    const withVertex = insertPolygonVertex(rect, 2, { x: 400, y: 600 });
    expect(withVertex).toHaveLength(5);
    expect(withVertex[3]).toEqual({ x: 400, y: 600 });

    // Move vertex 2 with 10 cm snap from (1000, 600) to (997, 403) -> snaps to (1000, 400)
    const moved = movePolygonVertex(withVertex, 2, { x: 997, y: 403 }, 10);
    expect(moved[2]).toEqual({ x: 1000, y: 400 });

    // Generate perimeter brick walls of 200 cm height for the 4-sided rectangle
    const walls = createPerimeterWalls(rect, 200, 'brick');
    expect(walls).toHaveLength(4);
    expect(walls[0]).toMatchObject({
      id: 'wall-0',
      start: { x: 0, y: 0 },
      end: { x: 1000, y: 0 },
      heightCm: 200,
      thicknessCm: 15,
      material: 'brick',
    });
    expect(walls[3]).toMatchObject({
      id: 'wall-3',
      start: { x: 0, y: 600 },
      end: { x: 0, y: 0 },
      heightCm: 200,
      thicknessCm: 15,
      material: 'brick',
    });
  });

  it('removes polygon vertices without dropping below 3 vertices, finds closest edges for wall splitting, and synchronizes walls preserving height and materials', () => {
    const rect = createRectPolygon(1000, 600);
    const withVertex = insertPolygonVertex(rect, 0, { x: 500, y: 0 });
    expect(withVertex).toHaveLength(5);

    // Remove vertex 1 (the newly inserted one at 500,0)
    const afterRemove = removePolygonVertex(withVertex, 1);
    expect(afterRemove).toHaveLength(4);
    expect(afterRemove[0]).toEqual({ x: 0, y: 0 });
    expect(afterRemove[1]).toEqual({ x: 1000, y: 0 });

    // Guard: will not remove if length <= 3
    const triangle: Polygon2DCm = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
    ];
    expect(removePolygonVertex(triangle, 0)).toHaveLength(3);

    // Find closest edge on rectangle for a click at (505, 12) -> should project to edge 0 (0,0)->(1000,0)
    const closest = findClosestEdgeOnPolygon(rect, { x: 505, y: 12 });
    expect(closest).not.toBeNull();
    expect(closest?.edgeIndex).toBe(0);
    expect(closest?.projectedPoint).toEqual({ x: 505, y: 0 });
    expect(closest?.distanceCm).toBe(12);

    // Wall sync preserving individual custom wall heights and materials
    const customWalls: WallSegmentCm[] = [
      {
        id: 'wall-wood-fence',
        start: { x: 0, y: 0 },
        end: { x: 1000, y: 0 },
        heightCm: 120,
        thicknessCm: 10,
        material: 'wood_fence',
        openings: [],
      },
      {
        id: 'wall-brick-tall',
        start: { x: 1000, y: 0 },
        end: { x: 1000, y: 600 },
        heightCm: 250,
        thicknessCm: 20,
        material: 'brick',
        openings: [],
      },
      {
        id: 'wall-open-ground',
        start: { x: 1000, y: 600 },
        end: { x: 0, y: 600 },
        heightCm: 0,
        thicknessCm: 15,
        material: 'concrete',
        openings: [],
      },
      {
        id: 'wall-wire-fence',
        start: { x: 0, y: 600 },
        end: { x: 0, y: 0 },
        heightCm: 120,
        thicknessCm: 10,
        material: 'wire_fence',
        openings: [],
      },
    ];

    // Move vertex 1 from (1000, 0) to (950, 50)
    const movedBoundary = movePolygonVertex(rect, 1, { x: 950, y: 50 });
    const syncedMoved = syncWallsWithBoundary(movedBoundary, customWalls);
    expect(syncedMoved).toHaveLength(4);
    // Preserved wood_fence material and 120 cm height on first wall
    expect(syncedMoved[0].material).toBe('wood_fence');
    expect(syncedMoved[0].heightCm).toBe(120);
    expect(syncedMoved[0].end).toEqual({ x: 950, y: 50 });
    // Preserved 0 cm (open) on third wall
    expect(syncedMoved[2].heightCm).toBe(0);
  });
});

describe('spaceGeometry - Slice 8: Wall Openings Decomposition (Doors & Windows)', () => {
  it('decomposes solid wall without openings into 1 single full-height prism', () => {
    const prisms = decomposeWallIntoPrisms(400, 250, []);
    expect(prisms).toHaveLength(1);
    expect(prisms[0]).toEqual({
      xStartM: 0,
      xEndM: 4.0,
      yBottomM: 0,
      yTopM: 2.5,
    });
  });

  it('decomposes wall with centered door into left, right, and lintel prisms', () => {
    // 400 cm wall, 250 cm high, door 90 cm wide x 210 cm high at offset 155 cm
    const door = createDefaultDoorOpening(400, 155);
    expect(door.kind).toBe('door');
    expect(door.sillHeightCm).toBe(0);

    const prisms = decomposeWallIntoPrisms(400, 250, [door]);
    expect(prisms).toHaveLength(3);

    // Left segment: 0 to 1.55m, full height (0 to 2.5m)
    expect(prisms[0].xStartM).toBeCloseTo(0, 3);
    expect(prisms[0].xEndM).toBeCloseTo(1.55, 3);
    expect(prisms[0].yBottomM).toBe(0);
    expect(prisms[0].yTopM).toBe(2.5);

    // Lintel above door: 1.55 to 2.45m, Y from 2.1m to 2.5m
    expect(prisms[1].xStartM).toBeCloseTo(1.55, 3);
    expect(prisms[1].xEndM).toBeCloseTo(2.45, 3);
    expect(prisms[1].yBottomM).toBeCloseTo(2.1, 3);
    expect(prisms[1].yTopM).toBe(2.5);

    // Right segment: 2.45m to 4.0m, full height (0 to 2.5m)
    expect(prisms[2].xStartM).toBeCloseTo(2.45, 3);
    expect(prisms[2].xEndM).toBeCloseTo(4.0, 3);
    expect(prisms[2].yBottomM).toBe(0);
    expect(prisms[2].yTopM).toBe(2.5);
  });

  it('decomposes wall with window into left, right, sill (bottom), and lintel (top) prisms', () => {
    // 400 cm wall, 250 cm high, window 120 cm wide x 110 cm high, sill 90 cm at offset 140 cm
    const window = createDefaultWindowOpening(400, 140);
    expect(window.kind).toBe('window');
    expect(window.sillHeightCm).toBe(90);

    const prisms = decomposeWallIntoPrisms(400, 250, [window]);
    expect(prisms).toHaveLength(4);

    // Left segment: 0 to 1.4m
    expect(prisms[0].xStartM).toBeCloseTo(0, 3);
    expect(prisms[0].xEndM).toBeCloseTo(1.4, 3);

    // Sill segment: 1.4 to 2.6m, Y from 0 to 0.9m
    expect(prisms[1].xStartM).toBeCloseTo(1.4, 3);
    expect(prisms[1].xEndM).toBeCloseTo(2.6, 3);
    expect(prisms[1].yBottomM).toBe(0);
    expect(prisms[1].yTopM).toBeCloseTo(0.9, 3);

    // Lintel segment: 1.4 to 2.6m, Y from (0.9 + 1.1 = 2.0m) to 2.5m
    expect(prisms[2].xStartM).toBeCloseTo(1.4, 3);
    expect(prisms[2].xEndM).toBeCloseTo(2.6, 3);
    expect(prisms[2].yBottomM).toBeCloseTo(2.0, 3);
    expect(prisms[2].yTopM).toBe(2.5);

    // Right segment: 2.6m to 4.0m
    expect(prisms[3].xStartM).toBeCloseTo(2.6, 3);
    expect(prisms[3].xEndM).toBeCloseTo(4.0, 3);
  });

  it('findNextOpeningSlot calculates free interval slots respecting structural margins and detects when space is exhausted', () => {
    // 300 cm wall. Door width = 90 cm.
    // 1. Empty wall: centered slot
    const slot1 = findNextOpeningSlot(300, 90, []);
    expect(slot1.canPlace).toBe(true);
    expect(slot1.offsetCm).toBe(105);

    // 2. Wall with door at offset 20 (span: 20 to 110)
    // Next opening: Window (120 cm).
    const slot2 = findNextOpeningSlot(300, 120, [
      { id: 'd1', kind: 'door', offsetCm: 20, widthCm: 90, heightCm: 210, sillHeightCm: 0 },
    ]);
    expect(slot2.canPlace).toBe(true);
    expect(slot2.offsetCm).toBe(125);

    // 3. Wall where space is exhausted
    const slot3 = findNextOpeningSlot(250, 90, [
      { id: 'd1', kind: 'door', offsetCm: 15, widthCm: 90, heightCm: 210, sillHeightCm: 0 },
      { id: 'w1', kind: 'window', offsetCm: 120, widthCm: 120, heightCm: 110, sillHeightCm: 90 },
    ]);
    expect(slot3.canPlace).toBe(false);
    expect(slot3.reason).toBeDefined();

    // 4. decomposeWallIntoPrisms sanitizes overlapping openings gracefully
    const overlappingPrisms = decomposeWallIntoPrisms(400, 250, [
      { id: 'd1', kind: 'door', offsetCm: 100, widthCm: 90, heightCm: 210, sillHeightCm: 0 },
      { id: 'w1', kind: 'window', offsetCm: 120, widthCm: 120, heightCm: 110, sillHeightCm: 90 }, // overlaps d1!
    ]);
    expect(overlappingPrisms.length).toBeGreaterThanOrEqual(2);
  });

  it('wouldPolygonSelfIntersect detects self-intersection and degenerated polygons preventing hourglass/bow-tie shapes', () => {
    // 1000x600 rectangle: (0,0), (1000,0), (1000,600), (0,600)
    const rect = createRectPolygon(1000, 600);

    // Valid move: moving (1000, 0) slightly inwards to (800, 100) -> valid concave polygon
    expect(wouldPolygonSelfIntersect(rect, 1, { x: 800, y: 100 })).toBe(false);

    // Invalid move: moving (1000, 0) all the way across to (-200, 300) crosses edge (0,600)-(0,0)
    expect(wouldPolygonSelfIntersect(rect, 1, { x: -200, y: 300 })).toBe(true);

    // Invalid move: crossing opposite edge (1000, 600)-(0, 600) produces an hourglass/bow-tie
    expect(wouldPolygonSelfIntersect(rect, 0, { x: 500, y: 800 })).toBe(true);

    // Degenerate move: collapsing polygon to near-zero area (< 2m2)
    const smallTriangle = [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 0, y: 200 },
    ];
    // Triangle is 2.0 m2. Moving vertex 1 inwards to (100, 0) reduces area to 1.0 m2 (< 2.0 m2 threshold)
    expect(wouldPolygonSelfIntersect(smallTriangle, 1, { x: 100, y: 0 })).toBe(true);

    // Proximity guard: moving vertex 1 too close to adjacent vertex 0 (< 60 cm) is blocked (prevents wall folding)
    expect(wouldPolygonSelfIntersect(rect, 1, { x: 40, y: 0 })).toBe(true);

    // Proximity guard: moving vertex 1 on top of non-adjacent vertex 3 (0, 600) is blocked
    expect(wouldPolygonSelfIntersect(rect, 1, { x: 10, y: 590 })).toBe(true);
  });

  it('canInsertVertexAtEdge enforces minimum edge length and distance to existing vertices', () => {
    const rect = createRectPolygon(1000, 600); // edges: 1000cm, 600cm, 1000cm, 600cm

    // Valid: split midpoint of 1000cm edge (edge 0: (0,0)-(1000,0)) at (500,0)
    expect(canInsertVertexAtEdge(rect, 0, { x: 500, y: 0 })).toBe(true);

    // Invalid: point too close to corner 0 (dist = 30cm < 60cm)
    expect(canInsertVertexAtEdge(rect, 0, { x: 30, y: 0 })).toBe(false);

    // Invalid: edge is shorter than 120 cm
    const shortPoly = [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 200 },
      { x: 0, y: 200 },
    ];
    expect(canInsertVertexAtEdge(shortPoly, 0, { x: 40, y: 0 })).toBe(false);
  });

  it('sanitizeAndWeldPolygon welds clustered duplicate vertices and cleans collinear redundancy', () => {
    // Simulate user scenario: 10 vertices where 6 are stacked around (500, 0) with 0-5 cm spacing
    const corruptPoly = [
      { x: 0, y: 0 },
      { x: 500, y: 0 },
      { x: 501, y: 0 },
      { x: 502, y: 0 },
      { x: 503, y: 0 },
      { x: 505, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 600 },
      { x: 0, y: 600 },
    ];

    const sanitized = sanitizeAndWeldPolygon(corruptPoly, 40);
    // All clustered vertices around (500, 0) are collapsed into one, and collinear points are pruned
    expect(sanitized.length).toBeLessThanOrEqual(5);
    expect(sanitized.length).toBeGreaterThanOrEqual(4);
  });
});

describe('spaceGeometry - PolyTree Hierarchical Decomposition (Outer & Holes)', () => {
  it('generates exactly 1 cultivableSector with 1 hole for an interior floating path, with net area = baseArea - pathArea', () => {
    // 1000x1000 cm room = 100 m2
    const baseBoundary = createRectPolygon(1000, 1000);
    // Interior floating path: from (500, 200) to (500, 800) with width 200 cm
    // Length = 600 cm, width = 200 cm -> Area = 120,000 cm2 = 12 m2
    const paths = [
      {
        id: 'interior-floating-path',
        material: 'concrete' as const,
        points: [
          { x: 500, y: 200 },
          { x: 500, y: 800 },
        ],
        widthCm: 200,
      },
    ];

    const regions = computeSpaceRegions(baseBoundary, [], paths);

    expect(regions.baseAreaM2).toBe(100);
    expect(regions.walkableAreaM2).toBeCloseTo(12, 1);
    expect(regions.cultivableAreaM2).toBeCloseTo(88, 1);

    // Exactly 1 sector with 1 hole (NOT 2 independent sectors!)
    expect(regions.cultivableSectors).toHaveLength(1);
    expect(regions.cultivablePolygons).toHaveLength(1);

    const sector = regions.cultivableSectors[0];
    expect(sector.outer).toHaveLength(4);
    expect(sector.holes).toHaveLength(1);
    expect(sector.holes[0]).toHaveLength(4);
    expect(sector.areaM2).toBeCloseTo(88, 1);
  });

  it('generates 2 distinct cultivableSectors when a path divides the room from wall to wall', () => {
    // 1000x1000 cm room
    const baseBoundary = createRectPolygon(1000, 1000);
    // Wall to wall vertical path at x=500 cutting from y=-50 to y=1050 with width 200 cm
    const paths = [
      {
        id: 'wall-to-wall-path',
        material: 'concrete' as const,
        points: [
          { x: 500, y: -50 },
          { x: 500, y: 1050 },
        ],
        widthCm: 200,
      },
    ];

    const regions = computeSpaceRegions(baseBoundary, [], paths);

    expect(regions.baseAreaM2).toBe(100);
    expect(regions.walkableAreaM2).toBeCloseTo(20, 1);
    expect(regions.cultivableAreaM2).toBeCloseTo(80, 1);

    // Dividing wall-to-wall creates 2 separate cultivable sectors without holes
    expect(regions.cultivableSectors).toHaveLength(2);
    expect(regions.cultivablePolygons).toHaveLength(2);

    expect(regions.cultivableSectors[0].holes).toHaveLength(0);
    expect(regions.cultivableSectors[1].holes).toHaveLength(0);
    expect(
      regions.cultivableSectors[0].areaM2 + regions.cultivableSectors[1].areaM2,
    ).toBeCloseTo(80, 1);
  });
});

describe('spaceGeometry - Slice 9: Object Footprint & Collision Validation (Clipper2)', () => {
  it('computes 2D Oriented Bounding Box (OBB) footprint polygon unrotated and rotated', () => {
    // 120 x 80 cm pallet centered at (500, 300) unrotated
    const footprint0 = computeObjectFootprintPolygon({ x: 500, y: 300 }, 120, 80, 0);
    expect(footprint0).toHaveLength(4);
    expect(footprint0[0]).toEqual({ x: 440, y: 260 });
    expect(footprint0[1]).toEqual({ x: 560, y: 260 });
    expect(footprint0[2]).toEqual({ x: 560, y: 340 });
    expect(footprint0[3]).toEqual({ x: 440, y: 340 });

    // Rotated 90 degrees around center
    const footprint90 = computeObjectFootprintPolygon({ x: 500, y: 300 }, 120, 80, 90);
    expect(footprint90).toHaveLength(4);
    // When rotated 90 deg, corners rotate: (-60, -40) -> (40, -60), etc.
    expect(footprint90[0]).toEqual({ x: 540, y: 240 });
    expect(footprint90[1]).toEqual({ x: 540, y: 360 });
    expect(footprint90[2]).toEqual({ x: 460, y: 360 });
    expect(footprint90[3]).toEqual({ x: 460, y: 240 });

    // Inflated wall footprint test
    const wallPolys = computeWallFootprintPolygon({
      id: 'wall-test',
      start: { x: 0, y: 0 },
      end: { x: 500, y: 0 },
      thicknessCm: 20,
      heightCm: 200,
      material: 'brick',
    });
    expect(wallPolys.length).toBeGreaterThan(0);
    expect(wallPolys[0].length).toBeGreaterThanOrEqual(4);
  });

  it('validates clean object placement inside room away from walls', () => {
    const baseBoundary = createRectPolygon(1000, 600);
    const walls = createPerimeterWalls(baseBoundary, 200, 'brick');

    const result = validateObjectPlacement({
      centerCm: { x: 500, y: 300 },
      widthCm: 120,
      depthCm: 80,
      rotationDeg: 0,
      elevationM: 0,
      heightCm: 21,
      baseBoundary,
      walls,
    });

    expect(result.isValid).toBe(true);
    expect(result.isOutsidePerimeter).toBe(false);
    expect(result.collidingWallIds).toHaveLength(0);
    expect(result.collidingObjectIds).toHaveLength(0);
    expect(result.reasons).toHaveLength(0);
  });

  it('detects when an object extends outside the room perimeter', () => {
    const baseBoundary = createRectPolygon(1000, 600);

    // Pallet placed at x=980 cm, half width = 60 cm, extends to x=1040 cm (outside x=1000)
    const result = validateObjectPlacement({
      centerCm: { x: 980, y: 300 },
      widthCm: 120,
      depthCm: 80,
      rotationDeg: 0,
      baseBoundary,
    });

    expect(result.isValid).toBe(false);
    expect(result.isOutsidePerimeter).toBe(true);
    expect(result.outsideAreaCm2).toBeGreaterThan(100);
    expect(result.reasons).toContain('El objeto sobresale fuera del perímetro de la sala');
  });

  it('detects collision when an object intersects a perimeter wall', () => {
    const baseBoundary = createRectPolygon(1000, 600);
    const walls = createPerimeterWalls(baseBoundary, 200, 'brick');

    // Wall-0 is along y=0 from (0,0) to (1000,0) with 15 cm thickness (y from -8 to +8 cm)
    // Pallet placed at y=20 cm with depth 80 cm (extends from y = -20 to y = 60 cm, intersecting wall-0)
    const result = validateObjectPlacement({
      centerCm: { x: 500, y: 20 },
      widthCm: 120,
      depthCm: 80,
      rotationDeg: 0,
      baseBoundary,
      walls,
    });

    expect(result.isValid).toBe(false);
    expect(result.collidingWallIds).toContain('wall-0');
    expect(result.reasons.some((r) => r.includes('Colisión con muro'))).toBe(true);
  });

  it('detects collision with other objects on the ground but permits vertical stacking', () => {
    const baseBoundary = createRectPolygon(1000, 600);
    const existingPallet = {
      id: 'pallet-1',
      xCm: 300,
      yCm: 300,
      widthCm: 120,
      depthCm: 80,
      heightCm: 21,
      elevationM: 0,
    };

    // 1. Placing another crate at same position and ground elevation (0m) -> collides!
    const groundCollision = validateObjectPlacement({
      centerCm: { x: 300, y: 300 },
      widthCm: 60,
      depthCm: 40,
      heightCm: 25,
      elevationM: 0,
      baseBoundary,
      existingObjects: [existingPallet],
    });

    expect(groundCollision.isValid).toBe(false);
    expect(groundCollision.collidingObjectIds).toContain('pallet-1');

    // 2. Placing the crate stacked on top of the pallet (elevation = 0.21m) -> valid stacking!
    const stackedPlacement = validateObjectPlacement({
      centerCm: { x: 300, y: 300 },
      widthCm: 60,
      depthCm: 40,
      heightCm: 25,
      elevationM: 0.21,
      baseBoundary,
      existingObjects: [existingPallet],
    });

    expect(stackedPlacement.isValid).toBe(true);
    expect(stackedPlacement.collidingObjectIds).toHaveLength(0);
  });

  it('snaps coordinates to metric grid with customizable step (5 cm, 10 cm, 25 cm)', () => {
    expect(snapToMetricGrid(123, 5)).toBe(125);
    expect(snapToMetricGrid(122, 5)).toBe(120);
    expect(snapToMetricGrid(127, 10)).toBe(130);
    expect(snapToMetricGrid(123, 10)).toBe(120);
    expect(snapToMetricGrid(138, 25)).toBe(150);
    expect(snapToMetricGrid(112, 25)).toBe(100);

    const snapped = snapPointToMetricGrid({ x: 234.6, y: 588.2 }, 10);
    expect(snapped).toEqual({ x: 230, y: 590 });
  });

  describe('Magnetic Auto-Stacking & Surface Snapping', () => {
    it('infers correct spatial stacking roles for logistics and horticultural models', () => {
      expect(inferSpatialStackRole('pallet_standard_wood_a01')).toBe('support_base');
      expect(inferSpatialStackRole('workbench_modular_table_b01')).toBe('support_base');
      expect(inferSpatialStackRole('rack_heavyduty_metal_f01')).toBe('support_base');
      expect(inferSpatialStackRole('crate_harvest_plastic_green_a01')).toBe('stackable_item');
      expect(inferSpatialStackRole('fan_axial_floor_a01')).toBe('top_only');
      expect(inferSpatialStackRole('produce_tomato_fruit_a01')).toBe('top_only');
    });

    it('enforces agronomic stacking compatibility hierarchy', () => {
      // Crate on pallet: OK
      expect(canStackRoles('stackable_item', 'support_base')).toBe(true);
      // Crate on crate: OK
      expect(canStackRoles('stackable_item', 'stackable_item')).toBe(true);
      // Fruit on crate: OK
      expect(canStackRoles('top_only', 'stackable_item')).toBe(true);
      // Fruit on workbench: OK
      expect(canStackRoles('top_only', 'support_base')).toBe(true);
      // Heavy pallet on crate: REJECTED
      expect(canStackRoles('support_base', 'stackable_item')).toBe(false);
      // Workbench on workbench: REJECTED
      expect(canStackRoles('support_base', 'support_base')).toBe(false);
      // Anything on top of top_only (e.g. fan or tomato): REJECTED
      expect(canStackRoles('stackable_item', 'top_only')).toBe(false);
    });

    it('returns elevation 0 when dragging over empty floor', () => {
      const result = detectAutoStackElevation({
        centerCm: { x: 300, y: 300 },
        itemAssetId: 'crate_harvest_plastic_green_a01',
        existingObjects: [],
      });

      expect(result.isStacked).toBe(false);
      expect(result.targetElevationM).toBe(0);
      expect(result.baseObjectId).toBeNull();
    });

    it('automatically snaps elevation when dragging a crate over a euro-pallet', () => {
      const pallet = {
        id: 'pallet-1',
        assetId: 'pallet_standard_wood_a01',
        label: 'Palet Europeo',
        xCm: 300,
        yCm: 300,
        widthCm: 120,
        depthCm: 80,
        heightCm: 21,
        supportSurfaceHeightCm: 21,
        elevationM: 0,
      };

      // Drag center inside pallet bounds (e.g. at 310, 305)
      const result = detectAutoStackElevation({
        centerCm: { x: 310, y: 305 },
        itemAssetId: 'crate_harvest_plastic_green_a01',
        existingObjects: [pallet],
      });

      expect(result.isStacked).toBe(true);
      expect(result.baseObjectId).toBe('pallet-1');
      // Elevation = 0m + 0.21m + 0.001m epsilon = 0.211m
      expect(result.targetElevationM).toBe(0.211);
      // Total stack height: 2 levels (1 base pallet + 1 crate)
      expect(result.stackLevels).toBe(2);
    });

    it('drops elevation to 0 when dragging center off the pallet edge (hysteresis)', () => {
      const pallet = {
        id: 'pallet-1',
        assetId: 'pallet_standard_wood_a01',
        xCm: 300,
        yCm: 300,
        widthCm: 120,
        depthCm: 80,
        heightCm: 21,
        elevationM: 0,
      };

      // Pallet X spans 240 to 360 cm. Center at 380 is outside!
      const result = detectAutoStackElevation({
        centerCm: { x: 380, y: 300 },
        itemAssetId: 'crate_harvest_plastic_green_a01',
        existingObjects: [pallet],
      });

      expect(result.isStacked).toBe(false);
      expect(result.targetElevationM).toBe(0);
    });

    it('supports multi-level stacking (crate on crate on pallet)', () => {
      const pallet = {
        id: 'pallet-1',
        assetId: 'pallet_standard_wood_a01',
        xCm: 300,
        yCm: 300,
        widthCm: 120,
        depthCm: 80,
        heightCm: 21,
        supportSurfaceHeightCm: 21,
        elevationM: 0,
      };

      const crate1 = {
        id: 'crate-1',
        assetId: 'crate_harvest_plastic_green_a01',
        label: 'Cajón 1',
        xCm: 300,
        yCm: 300,
        widthCm: 60,
        depthCm: 40,
        heightCm: 25,
        supportSurfaceHeightCm: 25,
        elevationM: 0.211,
      };

      // Dragging crate2 directly over crate1
      const result = detectAutoStackElevation({
        centerCm: { x: 300, y: 300 },
        itemAssetId: 'crate_harvest_plastic_green_a01',
        existingObjects: [pallet, crate1],
      });

      expect(result.isStacked).toBe(true);
      expect(result.baseObjectId).toBe('crate-1');
      // crate1 top = 0.211 + 0.25 = 0.461m -> target = 0.462m (+0.001)
      expect(result.targetElevationM).toBe(0.462);
      // Total stack height: 3 levels (1 base pallet + crate 1 + crate 2)
      expect(result.stackLevels).toBe(3);
    });

    it('rejects stacking heavy support bases like pallets on top of small crates', () => {
      const crate = {
        id: 'crate-1',
        assetId: 'crate_harvest_plastic_green_a01',
        xCm: 300,
        yCm: 300,
        widthCm: 60,
        depthCm: 40,
        heightCm: 25,
      };

      const result = detectAutoStackElevation({
        centerCm: { x: 300, y: 300 },
        itemAssetId: 'pallet_standard_wood_a01',
        existingObjects: [crate],
      });

      expect(result.isStacked).toBe(false);
      expect(result.targetElevationM).toBe(0);
    });

    it('ignores own object id when checking existing objects', () => {
      const movingCrate = {
        id: 'crate-1',
        assetId: 'crate_harvest_plastic_green_a01',
        xCm: 300,
        yCm: 300,
        widthCm: 60,
        depthCm: 40,
        heightCm: 25,
      };

      const result = detectAutoStackElevation({
        centerCm: { x: 300, y: 300 },
        itemAssetId: 'crate_harvest_plastic_green_a01',
        ignoreObjectId: 'crate-1',
        existingObjects: [movingCrate],
      });

      expect(result.isStacked).toBe(false);
      expect(result.targetElevationM).toBe(0);
    });
  });
});






