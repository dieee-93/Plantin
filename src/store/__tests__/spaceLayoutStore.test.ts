import { beforeEach, describe, expect, it } from 'vitest';
import { classifySpacePoint, computeSpaceRegions } from '@/domain/spaceGeometry';
import { measurePlantNeighbors } from '@/domain/solarAndPlantSpatial';
import { SPACE_PRESETS, useSpaceLayoutStore } from '../spaceLayoutStore';

describe('spaceLayoutStore - Slice 1: 1:1 Space Layout Store & Presets', () => {
  beforeEach(() => {
    useSpaceLayoutStore.getState().resetAll();
  });

  it('creates patio_croquis layout with 1 continuous walkable surface, 3 cultivable sectors totaling 60 m2, and example plants at 45 cm and 120 cm', () => {
    const store = useSpaceLayoutStore.getState();
    const layout = store.getOrCreateSpaceLayout('loc-patio-1', 'outdoor', 'patio_croquis');

    expect(layout.locationId).toBe('loc-patio-1');
    expect(layout.presetId).toBe('patio_croquis');
    expect(SPACE_PRESETS.patio_croquis).toBeDefined();
    expect(SPACE_PRESETS.greenhouse_1to1).toBeDefined();
    expect(SPACE_PRESETS.indoor_room_1to1).toBeDefined();
    expect(SPACE_PRESETS.empty_lot_1to1).toBeDefined();

    const regions = computeSpaceRegions(
      layout.baseBoundary,
      layout.hardscapeZones,
      layout.paths,
    );

    expect(regions.baseAreaM2).toBe(60);
    expect(regions.walkablePolygons).toHaveLength(1);
    expect(regions.cultivablePolygons).toHaveLength(3);

    expect(layout.placedPlants).toHaveLength(3);
    const tomatera = layout.placedPlants.find((p) => p.label.includes('Tomatera'));
    expect(tomatera).toBeDefined();

    const neighbors = measurePlantNeighbors(tomatera!, layout.placedPlants);
    expect(neighbors[0].neighborLabel).toContain('Morrón');
    expect(neighbors[0].distanceCm).toBe(45);
    expect(neighbors[0].clearanceCm).toBe(-5);
    expect(neighbors[0].isCrowded).toBe(true);

    expect(neighbors[1].neighborLabel).toContain('Lechuga');
    expect(neighbors[1].distanceCm).toBe(120);
  });

  it('supports switching presets (greenhouse_1to1, indoor_room_1to1, empty_lot_1to1) and editing boundary vertices, paths, hardscape, and solar config', () => {
    const store = useSpaceLayoutStore.getState();
    store.getOrCreateSpaceLayout('loc-1', 'greenhouse', 'greenhouse_1to1');

    let layout = useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-1');
    expect(layout.presetId).toBe('greenhouse_1to1');
    expect(layout.walls.every((w) => w.material === 'polycarbonate')).toBe(true);
    expect(layout.paths).toHaveLength(1);
    expect(layout.paths[0].widthCm).toBe(90);

    // Apply indoor_room_1to1 preset
    store.applyPreset('loc-1', 'indoor_room_1to1');
    layout = useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-1');
    expect(layout.presetId).toBe('indoor_room_1to1');
    expect(layout.walls.every((w) => w.material === 'brick')).toBe(true);

    // Insert and move boundary vertex
    store.insertBoundaryVertex('loc-1', 1, { x: 400, y: 200 });
    layout = useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-1');
    expect(layout.baseBoundary).toHaveLength(5);

    store.moveBoundaryVertex('loc-1', 2, { x: 453, y: 198 }, 10);
    layout = useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-1');
    expect(layout.baseBoundary[2]).toEqual({ x: 450, y: 200 });

    // Add & remove path stroke and hardscape zone
    store.addPathStroke('loc-1', {
      id: 'custom-path',
      material: 'gravel',
      points: [
        { x: 0, y: 200 },
        { x: 400, y: 200 },
      ],
      widthCm: 60,
    });
    expect(useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-1').paths).toHaveLength(1);
    store.removePathStroke('loc-1', 'custom-path');
    expect(useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-1').paths).toHaveLength(0);

    store.addHardscapeZone('loc-1', {
      id: 'custom-slab',
      material: 'concrete',
      polygon: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
    });
    expect(
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-1').hardscapeZones,
    ).toHaveLength(1);
    store.removeHardscapeZone('loc-1', 'custom-slab');
    expect(
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-1').hardscapeZones,
    ).toHaveLength(0);

    // Update solar config
    store.updateSolarConfig('loc-1', { season: 'winter', hourOfDay: 9.5, northAngleDeg: 45 });
    const solar = useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-1').solarConfig;
    expect(solar.season).toBe('winter');
    expect(solar.hourOfDay).toBe(9.5);
    expect(solar.northAngleDeg).toBe(45);
  });

  it('places, moves, removes plants, places plant lines skipping paths, and auto-fills a cultivable sector', () => {
    const store = useSpaceLayoutStore.getState();
    store.getOrCreateSpaceLayout('loc-patio-2', 'outdoor', 'patio_croquis');

    // Clear initial example plants
    const initial = useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-patio-2');
    for (const p of initial.placedPlants) {
      store.removePlant('loc-patio-2', p.id);
    }
    expect(
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-patio-2').placedPlants,
    ).toHaveLength(0);

    // Place, move, and remove single plant
    const id = store.placePlant('loc-patio-2', {
      label: 'Albahaca',
      cropCode: 'basil',
      xCm: 150,
      yCm: 260,
      canopyRadiusCm: 15,
    });
    store.movePlant('loc-patio-2', id, 160, 270);
    let plants = useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-patio-2').placedPlants;
    expect(plants).toHaveLength(1);
    expect(plants[0]).toMatchObject({ id, xCm: 160, yCm: 270 });

    store.removePlant('loc-patio-2', id);
    expect(
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-patio-2').placedPlants,
    ).toHaveLength(0);

    // Place a line across the diagonal path -> only cultivable points are placed
    const addedFromLine = store.placePlantLine(
      'loc-patio-2',
      { x: 450, y: 360 },
      { x: 900, y: 360 },
      50,
      { label: 'Lechuga', cropCode: 'lettuce', canopyRadiusCm: 15 },
    );
    expect(addedFromLine).toBeGreaterThan(3);

    const layoutAfterLine = useSpaceLayoutStore
      .getState()
      .getOrCreateSpaceLayout('loc-patio-2');
    const regions = computeSpaceRegions(
      layoutAfterLine.baseBoundary,
      layoutAfterLine.hardscapeZones,
      layoutAfterLine.paths,
    );
    for (const plant of layoutAfterLine.placedPlants) {
      expect(classifySpacePoint({ x: plant.xCm, y: plant.yCm }, regions)).toBe('cultivable');
    }

    // Auto-fill cultivable sector 0
    const addedFromFill = store.fillCultivableSector(
      'loc-patio-2',
      0,
      { plantSpacingCm: 60, rowSpacingCm: 60, marginCm: 20 },
      { label: 'Espinaca', cropCode: 'spinach', canopyRadiusCm: 12 },
    );
    expect(addedFromFill).toBeGreaterThan(2);
    plants = useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-patio-2').placedPlants;
    expect(plants).toHaveLength(addedFromLine + addedFromFill);
  });
});
