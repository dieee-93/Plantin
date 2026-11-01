import { describe, expect, it } from 'vitest';
import {
  computeCrowdedPlantIds,
  computeShadowLengthCm,
  computeSunPosition,
  findNearestNeighbor,
  generateLinePlantPositions,
  generatePolygonFillPlantPositions,
  measurePlantNeighbors,
  shouldCutawayWall,
  type PlacedPlantSpatialCm,
} from '../solarAndPlantSpatial';
import {
  classifySpacePoint,
  computeSpaceRegions,
  createRectPolygon,
  isPointInPolygonCm,
  type Polygon2DCm,
} from '../spaceGeometry';

describe('solarAndPlantSpatial - Slice 1: Astronomical Sun Position (computeSunPosition)', () => {
  it('calculates solar elevation, azimuth, and 3D scene direction for Southern Hemisphere (Buenos Aires -34.6°) across seasons, hours, and north orientations', () => {
    // Summer noon in Buenos Aires (-34.6° lat, declination -23.44°):
    // Elevation = 90 - |-34.6 - (-23.44)| = 78.84°; Sun is toward North (-Z)
    const summerNoon = computeSunPosition({
      latitudeDeg: -34.6,
      season: 'summer',
      hourOfDay: 12,
    });
    expect(summerNoon.elevationDeg).toBeCloseTo(78.8, 0);
    expect(summerNoon.isDaylight).toBe(true);
    expect(summerNoon.intensity).toBeGreaterThan(0.9);
    expect(summerNoon.sceneDirection.y).toBeGreaterThan(0.95);
    expect(summerNoon.sceneDirection.z).toBeLessThan(-0.15);
    expect(summerNoon.sceneDirection.x).toBeCloseTo(0, 2);

    // Winter noon in Buenos Aires (-34.6° lat, declination +23.44°):
    // Elevation = 90 - |-34.6 - 23.44| = 31.96°; Sun lower in North sky (-Z)
    const winterNoon = computeSunPosition({
      latitudeDeg: -34.6,
      season: 'winter',
      hourOfDay: 12,
    });
    expect(winterNoon.elevationDeg).toBeCloseTo(32.0, 0);
    expect(winterNoon.isDaylight).toBe(true);
    expect(winterNoon.sceneDirection.z).toBeLessThan(-0.8);
    expect(winterNoon.sceneDirection.x).toBeCloseTo(0, 2);

    // Morning (8:00 AM) -> Sun in the East (+X)
    const morning = computeSunPosition({
      latitudeDeg: -34.6,
      season: 'spring',
      hourOfDay: 8,
    });
    expect(morning.isDaylight).toBe(true);
    expect(morning.sceneDirection.x).toBeGreaterThan(0.5);

    // Afternoon (16:00 PM) -> Sun in the West (-X)
    const afternoon = computeSunPosition({
      latitudeDeg: -34.6,
      season: 'spring',
      hourOfDay: 16,
    });
    expect(afternoon.isDaylight).toBe(true);
    expect(afternoon.sceneDirection.x).toBeLessThan(-0.5);

    // Nighttime (02:00 AM) -> below horizon
    const night = computeSunPosition({
      latitudeDeg: -34.6,
      season: 'winter',
      hourOfDay: 2,
    });
    expect(night.isDaylight).toBe(false);
    expect(night.intensity).toBe(0);
    expect(night.elevationDeg).toBeLessThan(0);

    // Rotating northAngleDeg by 90° rotates the horizontal noon sun vector from North (-Z) to East (+X)
    const rotatedNoon = computeSunPosition({
      latitudeDeg: -34.6,
      northAngleDeg: 90,
      season: 'winter',
      hourOfDay: 12,
    });
    expect(rotatedNoon.elevationDeg).toBeCloseTo(32.0, 0);
    expect(rotatedNoon.sceneDirection.x).toBeGreaterThan(0.8);
    expect(rotatedNoon.sceneDirection.z).toBeCloseTo(0, 2);
  });
});

describe('solarAndPlantSpatial - Slice 2: Shadow Length in cm & Wall Cutaway (computeShadowLengthCm, shouldCutawayWall)', () => {
  it('computes 200 cm shadow for a 200 cm wall at 45°, ~320.2 cm in winter noon (31.96°), 0 at night, and cuts away front-facing walls relative to camera', () => {
    expect(computeShadowLengthCm(200, 45)).toBeCloseTo(200, 1);
    expect(computeShadowLengthCm(200, 31.96)).toBeCloseTo(320.6, 1);
    expect(computeShadowLengthCm(200, 0)).toBe(0);
    expect(computeShadowLengthCm(200, -15)).toBe(0);

    const spaceCenter = { x: 500, y: 300 };
    const northWallStart = { x: 0, y: 0 };
    const northWallEnd = { x: 1000, y: 0 };
    const southWallStart = { x: 1000, y: 600 };
    const southWallEnd = { x: 0, y: 600 };

    // Camera looking from the South (y = 950) toward center (500, 300):
    // South wall is between camera and center -> cutaway = true; North wall stays full height = false
    const cameraSouth = { x: 500, y: 950 };
    expect(shouldCutawayWall(southWallStart, southWallEnd, cameraSouth, spaceCenter)).toBe(true);
    expect(shouldCutawayWall(northWallStart, northWallEnd, cameraSouth, spaceCenter)).toBe(false);

    // Camera rotated to look from the North (y = -350):
    // North wall is between camera and center -> cutaway = true; South wall stays full height = false
    const cameraNorth = { x: 500, y: -350 };
    expect(shouldCutawayWall(northWallStart, northWallEnd, cameraNorth, spaceCenter)).toBe(true);
    expect(shouldCutawayWall(southWallStart, southWallEnd, cameraNorth, spaceCenter)).toBe(false);
  });
});

describe('solarAndPlantSpatial - Slice 3: 1:1 Plant Neighbor Distances & Canopy Overlap (measurePlantNeighbors)', () => {
  it('measures center-to-center distance and canopy clearance between a Tomatera, a Morrón, and a Lechuga sorted nearest-first', () => {
    const tomatera: PlacedPlantSpatialCm = {
      id: 'plant-tomate-1',
      label: 'Tomatera Platense',
      cropCode: 'tomato',
      xCm: 200,
      yCm: 300,
      canopyRadiusCm: 30,
    };

    const morron: PlacedPlantSpatialCm = {
      id: 'plant-morron-1',
      label: 'Morrón Calahorra',
      cropCode: 'pepper',
      xCm: 245,
      yCm: 300,
      canopyRadiusCm: 20,
    };

    const lechuga: PlacedPlantSpatialCm = {
      id: 'plant-lechuga-1',
      label: 'Lechuga Mantecosa',
      cropCode: 'lettuce',
      xCm: 200,
      yCm: 420,
      canopyRadiusCm: 15,
    };

    // Pass lettuce first and pepper second to verify nearest-first sorting
    const neighbors = measurePlantNeighbors(tomatera, [lechuga, morron, tomatera]);

    expect(neighbors).toHaveLength(2);
    expect(neighbors[0]).toEqual({
      neighborId: 'plant-morron-1',
      neighborLabel: 'Morrón Calahorra',
      distanceCm: 45,
      clearanceCm: -5,
      isCrowded: true,
    });
    expect(neighbors[1]).toEqual({
      neighborId: 'plant-lechuga-1',
      neighborLabel: 'Lechuga Mantecosa',
      distanceCm: 120,
      clearanceCm: 75,
      isCrowded: false,
    });
  });
});

describe('solarAndPlantSpatial - Slice 4: Row/Line Plant Positions Respecting Paths (generateLinePlantPositions)', () => {
  it('generates evenly spaced points along horizontal or diagonal lines and filters out points falling on concrete paths or outside the lot', () => {
    // 3-4-5 right triangle diagonal of 200 cm (dx=120, dy=160) with spacing 50 cm -> 5 points (0, 50, 100, 150, 200 cm)
    const diagonalRow = generateLinePlantPositions(
      { x: 100, y: 100 },
      { x: 220, y: 260 },
      50,
    );
    expect(diagonalRow).toEqual([
      { x: 100, y: 100 },
      { x: 130, y: 140 },
      { x: 160, y: 180 },
      { x: 190, y: 220 },
      { x: 220, y: 260 },
    ]);

    // User patio with diagonal concrete path from (350, 120) to (1000, 600)
    const baseBoundary = createRectPolygon(1000, 600);
    const regions = computeSpaceRegions(
      baseBoundary,
      [],
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
      ],
    );

    // Horizontal line across y = 360 from x = 450 to x = 900 every 50 cm (crosses diagonal path around x = 675)
    const filteredRow = generateLinePlantPositions(
      { x: 450, y: 360 },
      { x: 900, y: 360 },
      50,
      regions,
    );

    // Every kept point must be strictly in a cultivable region
    expect(filteredRow.length).toBeGreaterThan(4);
    expect(filteredRow.length).toBeLessThan(10);
    for (const pt of filteredRow) {
      expect(classifySpacePoint(pt, regions)).toBe('cultivable');
    }
    // Keeps points on both left bed (x <= 550) and right bed (x >= 800), skipping x = 650, 700 on the diagonal path
    expect(filteredRow.some((pt) => pt.x <= 550)).toBe(true);
    expect(filteredRow.some((pt) => pt.x >= 800)).toBe(true);
    expect(filteredRow.some((pt) => pt.x === 650 || pt.x === 700)).toBe(false);
  });
});

describe('solarAndPlantSpatial - Slice 5: Irregular Polygon Auto-Fill with Path Margin (generatePolygonFillPlantPositions)', () => {
  it('fills an irregular trapezoidal bed with a plant grid inset by marginCm from diagonal borders and supports angled rows', () => {
    // Trapezoidal cultivable bed bordered by a diagonal path on the right:
    // Top width 300 cm (x: 0..300 at y=200), bottom width 600 cm (x: 0..600 at y=600)
    const trapezoidBed: Polygon2DCm = [
      { x: 0, y: 200 },
      { x: 300, y: 200 },
      { x: 600, y: 600 },
      { x: 0, y: 600 },
    ];

    const positions = generatePolygonFillPlantPositions(trapezoidBed, {
      plantSpacingCm: 60,
      rowSpacingCm: 80,
      marginCm: 25,
    });

    expect(positions.length).toBeGreaterThan(15);

    for (const pt of positions) {
      expect(isPointInPolygonCm(pt, trapezoidBed)).toBe(true);
      // Respects 25 cm inset from left (x >= 25), top (y >= 225), and bottom (y <= 575)
      expect(pt.x).toBeGreaterThanOrEqual(25);
      expect(pt.y).toBeGreaterThanOrEqual(225);
      expect(pt.y).toBeLessThanOrEqual(575);

      // Distance to the diagonal border line 4x - 3y - 600 = 0 (from (300,200) to (600,600))
      // For points inside the trapezoid, 3y + 600 - 4x > 0, and perpendicular distance is (3y + 600 - 4x) / 5
      const distToDiagonalCm = (3 * pt.y + 600 - 4 * pt.x) / 5;
      expect(distToDiagonalCm).toBeGreaterThanOrEqual(24);
    }

    // Also works with rotated rows (angleDeg = 35°)
    const angledPositions = generatePolygonFillPlantPositions(trapezoidBed, {
      plantSpacingCm: 60,
      rowSpacingCm: 80,
      marginCm: 25,
      angleDeg: 35,
    });
    expect(angledPositions.length).toBeGreaterThan(12);
    for (const pt of angledPositions) {
      expect(isPointInPolygonCm(pt, trapezoidBed)).toBe(true);
    }
  });
});

describe('solarAndPlantSpatial - Slice 6: Spatial Hash Grid Performance & Equivalence (computeCrowdedPlantIds & findNearestNeighbor)', () => {
  it('handles empty and single-plant arrays trivially', () => {
    expect(computeCrowdedPlantIds([])).toEqual(new Set());
    expect(
      computeCrowdedPlantIds([
        { id: 'p1', label: 'Plant 1', xCm: 100, yCm: 100, canopyRadiusCm: 25 },
      ]),
    ).toEqual(new Set());

    expect(
      findNearestNeighbor(
        { id: 'probe', label: 'Probe', xCm: 100, yCm: 100, canopyRadiusCm: 25 },
        [],
      ),
    ).toBeNull();
  });

  it('matches measurePlantNeighbors exactly for a random distribution of 500 plants', () => {
    // Deterministic pseudo-random sequence
    let seed = 42;
    function pseudoRandom() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    }

    const plantCount = 500;
    const testPlants: PlacedPlantSpatialCm[] = [];
    for (let i = 0; i < plantCount; i++) {
      testPlants.push({
        id: `rnd-plant-${i}`,
        label: `Crop ${i}`,
        xCm: Math.round(pseudoRandom() * 2000),
        yCm: Math.round(pseudoRandom() * 2000),
        canopyRadiusCm: Math.round(15 + pseudoRandom() * 30),
      });
    }

    // Benchmark & compute reference with measurePlantNeighbors
    const expectedCrowdedIds = new Set<string>();
    for (const plant of testPlants) {
      const neighbors = measurePlantNeighbors(plant, testPlants);
      if (neighbors[0]?.isCrowded) {
        expectedCrowdedIds.add(plant.id);
      }
    }

    // Fast O(N) Spatial Hash Grid computation
    const actualCrowdedIds = computeCrowdedPlantIds(testPlants);

    expect(actualCrowdedIds.size).toBe(expectedCrowdedIds.size);
    expect(actualCrowdedIds).toEqual(expectedCrowdedIds);

    // Verify findNearestNeighbor matches measurePlantNeighbors[0]
    for (let i = 0; i < 20; i++) {
      const target = testPlants[i];
      const expectedNearest = measurePlantNeighbors(target, testPlants)[0] ?? null;
      const actualNearest = findNearestNeighbor(target, testPlants);
      expect(actualNearest?.neighborId).toBe(expectedNearest?.neighborId);
      expect(actualNearest?.distanceCm).toBe(expectedNearest?.distanceCm);
      expect(actualNearest?.isCrowded).toBe(expectedNearest?.isCrowded);
    }
  });

  it('correctly marks all 500 plants as crowded in a dense overlapping grid', () => {
    const densePlants: PlacedPlantSpatialCm[] = [];
    let id = 0;
    for (let row = 0; row < 25; row++) {
      for (let col = 0; col < 20; col++) {
        densePlants.push({
          id: `dense-${id++}`,
          label: 'Dense Tomato',
          xCm: col * 20, // 20 cm spacing
          yCm: row * 20,
          canopyRadiusCm: 25, // 25 + 25 = 50 cm required, but spacing is 20 cm -> always crowded
        });
      }
    }

    const crowded = computeCrowdedPlantIds(densePlants);
    expect(crowded.size).toBe(500);
  });
});





