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

  describe('spaceLayoutStore - Undo / Redo & Temporal History', () => {
    it('initializes with canUndo and canRedo false', () => {
      const store = useSpaceLayoutStore.getState();
      store.getOrCreateSpaceLayout('loc-undo-1', 'outdoor', 'patio_croquis');

      expect(store.canUndo('loc-undo-1')).toBe(false);
      expect(store.canRedo('loc-undo-1')).toBe(false);
    });

    it('records addPathStroke and allows undo and redo', () => {
      const store = useSpaceLayoutStore.getState();
      const initial = store.getOrCreateSpaceLayout('loc-undo-2', 'outdoor', 'patio_croquis');
      const initialPathCount = initial.paths.length;

      store.addPathStroke('loc-undo-2', {
        id: 'new-path-1',
        material: 'concrete',
        points: [
          { x: 100, y: 100 },
          { x: 200, y: 200 },
        ],
        widthCm: 80,
      });

      expect(useSpaceLayoutStore.getState().canUndo('loc-undo-2')).toBe(true);
      expect(useSpaceLayoutStore.getState().canRedo('loc-undo-2')).toBe(false);
      expect(useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-undo-2').paths).toHaveLength(
        initialPathCount + 1,
      );

      // Undo
      useSpaceLayoutStore.getState().undo('loc-undo-2');
      expect(useSpaceLayoutStore.getState().canUndo('loc-undo-2')).toBe(false);
      expect(useSpaceLayoutStore.getState().canRedo('loc-undo-2')).toBe(true);
      expect(useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-undo-2').paths).toHaveLength(
        initialPathCount,
      );

      // Redo
      useSpaceLayoutStore.getState().redo('loc-undo-2');
      expect(useSpaceLayoutStore.getState().canUndo('loc-undo-2')).toBe(true);
      expect(useSpaceLayoutStore.getState().canRedo('loc-undo-2')).toBe(false);
      expect(useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-undo-2').paths).toHaveLength(
        initialPathCount + 1,
      );
    });

    it('records multiple actions and undoes them step-by-step in reverse order', () => {
      const store = useSpaceLayoutStore.getState();
      store.getOrCreateSpaceLayout('loc-undo-3', 'outdoor', 'patio_croquis');

      // 1. Add plant
      const plantId = store.placePlant('loc-undo-3', {
        label: 'Menta',
        cropCode: 'mint',
        xCm: 300,
        yCm: 300,
        canopyRadiusCm: 15,
      });

      // 2. Remove plant
      store.removePlant('loc-undo-3', plantId);

      // 3. Remove a path
      const currentPaths = useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-undo-3').paths;
      const pathToRemove = currentPaths[0].id;
      store.removePathStroke('loc-undo-3', pathToRemove);

      expect(useSpaceLayoutStore.getState().canUndo('loc-undo-3')).toBe(true);

      // Undo 3: path should be restored
      useSpaceLayoutStore.getState().undo('loc-undo-3');
      expect(
        useSpaceLayoutStore
          .getState()
          .getOrCreateSpaceLayout('loc-undo-3')
          .paths.some((p) => p.id === pathToRemove),
      ).toBe(true);

      // Undo 2: removed plant should be restored
      useSpaceLayoutStore.getState().undo('loc-undo-3');
      expect(
        useSpaceLayoutStore
          .getState()
          .getOrCreateSpaceLayout('loc-undo-3')
          .placedPlants.some((p) => p.id === plantId),
      ).toBe(true);

      // Undo 1: newly added plant should be gone
      useSpaceLayoutStore.getState().undo('loc-undo-3');
      expect(
        useSpaceLayoutStore
          .getState()
          .getOrCreateSpaceLayout('loc-undo-3')
          .placedPlants.some((p) => p.id === plantId),
      ).toBe(false);

      expect(useSpaceLayoutStore.getState().canUndo('loc-undo-3')).toBe(false);
    });

    it('discards redo future when a new mutation is made after undo', () => {
      const store = useSpaceLayoutStore.getState();
      store.getOrCreateSpaceLayout('loc-undo-4', 'outdoor', 'patio_croquis');

      store.addPathStroke('loc-undo-4', {
        id: 'branch-a',
        material: 'concrete',
        points: [{ x: 10, y: 10 }, { x: 50, y: 50 }],
        widthCm: 80,
      });

      // Undo branch-a
      useSpaceLayoutStore.getState().undo('loc-undo-4');
      expect(useSpaceLayoutStore.getState().canRedo('loc-undo-4')).toBe(true);

      // Branch B: new mutation
      useSpaceLayoutStore.getState().addPathStroke('loc-undo-4', {
        id: 'branch-b',
        material: 'gravel',
        points: [{ x: 20, y: 20 }, { x: 80, y: 80 }],
        widthCm: 60,
      });

      // Future is cleared: cannot redo branch-a
      expect(useSpaceLayoutStore.getState().canRedo('loc-undo-4')).toBe(false);
      const paths = useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-undo-4').paths;
      expect(paths.some((p) => p.id === 'branch-b')).toBe(true);
      expect(paths.some((p) => p.id === 'branch-a')).toBe(false);
    });

    it('records applyPreset, setBaseBoundary, insertBoundaryVertex, placePlantLine, and fillCultivableSector', () => {
      const store = useSpaceLayoutStore.getState();
      store.getOrCreateSpaceLayout('loc-undo-5', 'outdoor', 'patio_croquis');

      // 1. applyPreset
      store.applyPreset('loc-undo-5', 'greenhouse_1to1');
      expect(useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-undo-5').presetId).toBe(
        'greenhouse_1to1',
      );

      // 2. setBaseBoundary
      const newBoundary = [
        { x: 0, y: 0 },
        { x: 500, y: 0 },
        { x: 500, y: 500 },
        { x: 0, y: 500 },
      ];
      store.setBaseBoundary('loc-undo-5', newBoundary);
      expect(
        useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-undo-5').baseBoundary,
      ).toHaveLength(4);

      // 3. insertBoundaryVertex
      store.insertBoundaryVertex('loc-undo-5', 0, { x: 250, y: 0 });
      expect(
        useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-undo-5').baseBoundary,
      ).toHaveLength(5);

      // Undo vertex insertion
      useSpaceLayoutStore.getState().undo('loc-undo-5');
      expect(
        useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-undo-5').baseBoundary,
      ).toHaveLength(4);

      // Undo setBaseBoundary -> returns to greenhouse boundary (600 x 1200)
      useSpaceLayoutStore.getState().undo('loc-undo-5');
      expect(
        useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-undo-5').baseBoundary[2],
      ).toEqual({ x: 600, y: 1200 });

      // Undo applyPreset -> returns to patio_croquis (1000 x 600)
      useSpaceLayoutStore.getState().undo('loc-undo-5');
      expect(useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-undo-5').presetId).toBe(
        'patio_croquis',
      );
      expect(
        useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-undo-5').baseBoundary[2],
      ).toEqual({ x: 1000, y: 600 });
    });

    it('caps history stack at 50 snapshots', () => {
      const store = useSpaceLayoutStore.getState();
      store.getOrCreateSpaceLayout('loc-undo-cap', 'outdoor', 'empty_lot_1to1');

      // Perform 55 mutations
      for (let i = 0; i < 55; i++) {
        store.placePlant('loc-undo-cap', {
          label: `Plant-${i}`,
          xCm: 100 + i * 2,
          yCm: 100,
          canopyRadiusCm: 10,
        });
      }

      // Check undo works up to 50 times
      let undoCount = 0;
      while (useSpaceLayoutStore.getState().canUndo('loc-undo-cap')) {
        useSpaceLayoutStore.getState().undo('loc-undo-cap');
        undoCount++;
      }

      expect(undoCount).toBe(50);
      expect(useSpaceLayoutStore.getState().canUndo('loc-undo-cap')).toBe(false);
    });

    it('clears history on clearHistory without changing current layout', () => {
      const store = useSpaceLayoutStore.getState();
      store.getOrCreateSpaceLayout('loc-undo-clear', 'outdoor', 'empty_lot_1to1');
      store.placePlant('loc-undo-clear', {
        label: 'Acelga',
        xCm: 200,
        yCm: 200,
        canopyRadiusCm: 15,
      });

      expect(useSpaceLayoutStore.getState().canUndo('loc-undo-clear')).toBe(true);
      store.clearHistory('loc-undo-clear');
      expect(useSpaceLayoutStore.getState().canUndo('loc-undo-clear')).toBe(false);
      expect(useSpaceLayoutStore.getState().canRedo('loc-undo-clear')).toBe(false);

      // Current layout still has the plant
      expect(
        useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-undo-clear').placedPlants,
      ).toHaveLength(1);
    });

    it('excludes history from serialized localStorage to prevent quota exceeded errors', () => {
      const store = useSpaceLayoutStore.getState();
      store.getOrCreateSpaceLayout('loc-storage-test', 'outdoor', 'empty_lot_1to1');
      store.placePlant('loc-storage-test', {
        label: 'Menta',
        xCm: 50,
        yCm: 50,
        canopyRadiusCm: 15,
      });

      const rawStorage = localStorage.getItem('plantin-space-layout-v1');
      if (rawStorage) {
        const parsed = JSON.parse(rawStorage);
        expect(parsed.state.history).toBeUndefined();
        expect(parsed.state.layouts).toBeDefined();
      }
    });

    it('guarantees deep immutability so in-place edits to vertices do not corrupt past snapshots', () => {
      const store = useSpaceLayoutStore.getState();
      store.getOrCreateSpaceLayout('loc-deep-copy', 'outdoor', 'empty_lot_1to1');

      // Base polygon has { x: 800, y: 0 } at index 1
      const initial = store.getOrCreateSpaceLayout('loc-deep-copy');
      expect(initial.baseBoundary[1].x).toBe(800);

      // Move vertex to 950
      store.moveBoundaryVertex('loc-deep-copy', 1, { x: 950, y: 0 });
      expect(store.getOrCreateSpaceLayout('loc-deep-copy').baseBoundary[1].x).toBe(950);

      // Verify that past snapshot has x=800 in independent memory
      const past = useSpaceLayoutStore.getState().history['loc-deep-copy'].past;
      expect(past[past.length - 1].baseBoundary[1].x).toBe(800);

      // Mutate current boundary directly to test deep isolation
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-deep-copy').baseBoundary[1].x = 1200;
      expect(useSpaceLayoutStore.getState().history['loc-deep-copy'].past[past.length - 1].baseBoundary[1].x).toBe(800);

      // Undo restores original 800
      store.undo('loc-deep-copy');
      expect(store.getOrCreateSpaceLayout('loc-deep-copy').baseBoundary[1].x).toBe(800);
    });
  });
});
