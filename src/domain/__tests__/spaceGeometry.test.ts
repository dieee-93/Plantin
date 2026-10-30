import { describe, expect, it } from 'vitest';
import {
  calculatePolygonAreaM2,
  classifySpacePoint,
  computeSpaceRegions,
  createPerimeterWalls,
  createRectPolygon,
  inflatePathToPolygon,
  insertPolygonVertex,
  isPointInPolygonCm,
  movePolygonVertex,
  type HardscapeZoneCm,
  type PathStrokeCm,
  type Polygon2DCm,
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
});




