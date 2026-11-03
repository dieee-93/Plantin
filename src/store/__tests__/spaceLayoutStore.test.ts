import { beforeEach, describe, expect, it } from 'vitest';
import { get as idbGet } from 'idb-keyval';
import { classifySpacePoint, computeSpaceRegions } from '@/domain/spaceGeometry';
import { measurePlantNeighbors } from '@/domain/solarAndPlantSpatial';
import { flushSpaceLayoutStorage, SPACE_PRESETS, useSpaceLayoutStore } from '../spaceLayoutStore';

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

    it('excludes history from serialized storage to prevent quota exceeded errors', async () => {
      const store = useSpaceLayoutStore.getState();
      store.getOrCreateSpaceLayout('loc-storage-test', 'outdoor', 'empty_lot_1to1');
      store.placePlant('loc-storage-test', {
        label: 'Menta',
        xCm: 50,
        yCm: 50,
        canopyRadiusCm: 15,
      });
      await flushSpaceLayoutStorage();

      const rawStorage = localStorage.getItem('plantin-space-layout-v1');
      if (rawStorage) {
        const parsed = JSON.parse(rawStorage);
        expect(parsed.state.history).toBeUndefined();
        expect(parsed.state.layouts).toBeDefined();
      }

      const idbData = (await idbGet('plantin-space-layout-v1')) as { state?: { history?: unknown; layouts?: unknown } };
      if (idbData && idbData.state) {
        expect(idbData.state.history).toBeUndefined();
        expect(idbData.state.layouts).toBeDefined();
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
      expect(past[past.length - 1].baseBoundary![1].x).toBe(800);

      // Mutate current boundary directly to test deep isolation
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-deep-copy').baseBoundary[1].x = 1200;
      expect(useSpaceLayoutStore.getState().history['loc-deep-copy'].past[past.length - 1].baseBoundary![1].x).toBe(800);

      // Undo restores original 800
      store.undo('loc-deep-copy');
      expect(store.getOrCreateSpaceLayout('loc-deep-copy').baseBoundary[1].x).toBe(800);
    });

    it('atomic drag transactions: snapshots once on drag start and allows intermediate moves without polluting history', () => {
      const store = useSpaceLayoutStore.getState();
      store.getOrCreateSpaceLayout('loc-drag-atomic', 'outdoor', 'empty_lot_1to1');
      const initialLayout = store.getOrCreateSpaceLayout('loc-drag-atomic');
      expect(initialLayout.baseBoundary[0]).toEqual({ x: 0, y: 0 });

      // Drag starts -> snapshot history once
      store.snapshotHistory('loc-drag-atomic');
      expect(useSpaceLayoutStore.getState().history['loc-drag-atomic'].past).toHaveLength(1);

      // Simulate 20 mouse-move events during drag with recordHistory: false
      for (let i = 1; i <= 20; i++) {
        store.moveBoundaryVertex('loc-drag-atomic', 0, { x: i * 10, y: i * 5 }, 1, false);
      }

      // History stack must still only have 1 entry (not 21!)
      expect(useSpaceLayoutStore.getState().history['loc-drag-atomic'].past).toHaveLength(1);
      expect(store.getOrCreateSpaceLayout('loc-drag-atomic').baseBoundary[0]).toEqual({ x: 200, y: 100 });

      // Exactly ONE undo restores back to original { x: 0, y: 0 } immediately!
      store.undo('loc-drag-atomic');
      expect(store.getOrCreateSpaceLayout('loc-drag-atomic').baseBoundary[0]).toEqual({ x: 0, y: 0 });
      expect(useSpaceLayoutStore.getState().history['loc-drag-atomic'].past).toHaveLength(0);

      // Redo restores to final drag position { x: 200, y: 100 }
      store.redo('loc-drag-atomic');
      expect(store.getOrCreateSpaceLayout('loc-drag-atomic').baseBoundary[0]).toEqual({ x: 200, y: 100 });
    });

    it('updates individual wall height and material, sets all walls properties, and removes vertices', () => {
      const store = useSpaceLayoutStore.getState();
      store.getOrCreateSpaceLayout('loc-wall-test', 'outdoor', 'empty_lot_1to1');
      let layout = store.getOrCreateSpaceLayout('loc-wall-test');

      // Update specific wall 0 to 120 cm wood_fence
      const wall0Id = layout.walls[0].id;
      store.updateWall('loc-wall-test', wall0Id, {
        heightCm: 120,
        material: 'wood_fence',
      });
      layout = store.getOrCreateSpaceLayout('loc-wall-test');
      expect(layout.walls[0].heightCm).toBe(120);
      expect(layout.walls[0].material).toBe('wood_fence');

      // Set all walls to 0 cm (open outdoor space)
      store.setAllWallsHeight('loc-wall-test', 0);
      layout = store.getOrCreateSpaceLayout('loc-wall-test');
      expect(layout.walls.every((w) => w.heightCm === 0)).toBe(true);

      // Set all walls material to wire_fence
      store.setAllWallsMaterial('loc-wall-test', 'wire_fence');
      layout = store.getOrCreateSpaceLayout('loc-wall-test');
      expect(layout.walls.every((w) => w.material === 'wire_fence')).toBe(true);

      // Insert and remove vertex
      store.insertBoundaryVertex('loc-wall-test', 0, { x: 400, y: 0 });
      expect(store.getOrCreateSpaceLayout('loc-wall-test').baseBoundary).toHaveLength(5);
      store.removeBoundaryVertex('loc-wall-test', 1);
      expect(store.getOrCreateSpaceLayout('loc-wall-test').baseBoundary).toHaveLength(4);

      // Set base material
      store.setBaseMaterial('loc-wall-test', 'grass');
      expect(store.getOrCreateSpaceLayout('loc-wall-test').baseMaterial).toBe('grass');

      // Add door opening to wall0
      store.addWallOpening('loc-wall-test', wall0Id, {
        kind: 'door',
        offsetCm: 150,
        widthCm: 90,
        heightCm: 210,
        sillHeightCm: 0,
      });
      layout = store.getOrCreateSpaceLayout('loc-wall-test');
      expect(layout.walls[0].openings).toHaveLength(1);
      expect(layout.walls[0].openings?.[0].kind).toBe('door');
      const openingId = layout.walls[0].openings![0].id;

      // Remove door opening
      store.removeWallOpening('loc-wall-test', wall0Id, openingId);
      layout = store.getOrCreateSpaceLayout('loc-wall-test');
      expect(layout.walls[0].openings).toHaveLength(0);
    });

    it('moveBoundaryVertex rejects self-intersecting moves preserving boundary shape', () => {
      const store = useSpaceLayoutStore.getState();
      store.getOrCreateSpaceLayout('loc-intersect-test', 'outdoor', 'empty_lot_1to1');
      const initialBoundary = [...store.getOrCreateSpaceLayout('loc-intersect-test').baseBoundary];

      // Attempt to drag vertex 0 across the opposite edge creating a self-intersecting bow-tie
      store.moveBoundaryVertex('loc-intersect-test', 0, { x: 500, y: 800 });

      // Boundary remains completely unchanged
      const currentBoundary = store.getOrCreateSpaceLayout('loc-intersect-test').baseBoundary;
      expect(currentBoundary[0]).toEqual(initialBoundary[0]);
    });

    it('insertBoundaryVertex rejects points too close to corners, and sanitizeBoundary welds clustered vertices', () => {
      const store = useSpaceLayoutStore.getState();
      store.getOrCreateSpaceLayout('loc-weld-test', 'outdoor', 'empty_lot_1to1');

      // Attempt inserting at (10, 0) which is 10 cm from corner (0,0) -> rejected!
      store.insertBoundaryVertex('loc-weld-test', 0, { x: 10, y: 0 });
      expect(store.getOrCreateSpaceLayout('loc-weld-test').baseBoundary).toHaveLength(4);

      // Valid insert at (500, 0)
      store.insertBoundaryVertex('loc-weld-test', 0, { x: 500, y: 0 });
      expect(store.getOrCreateSpaceLayout('loc-weld-test').baseBoundary).toHaveLength(5);

      // Now sanitizeBoundary cleans any redundant collinear vertices
      store.sanitizeBoundary('loc-weld-test');
      expect(store.getOrCreateSpaceLayout('loc-weld-test').baseBoundary.length).toBeLessThanOrEqual(5);
    });

    describe('Delta History (Command Pattern) & High-Scale Plant Operations (5,000 plants)', () => {
      it('registers placePlant as atomic plant_add delta without cloning entire layout', () => {
        const store = useSpaceLayoutStore.getState();
        store.getOrCreateSpaceLayout('loc-delta-1', 'outdoor', 'empty_lot_1to1');

        const plantId = store.placePlant('loc-delta-1', {
          label: 'Tomatera',
          cropCode: 'tomato',
          xCm: 250,
          yCm: 350,
          canopyRadiusCm: 30,
        });

        const history = useSpaceLayoutStore.getState().history['loc-delta-1'];
        expect(history.past).toHaveLength(1);
        expect(history.past[0].type).toBe('plant_add');
        if (history.past[0].type === 'plant_add') {
          expect(history.past[0].plant.id).toBe(plantId);
          expect(history.past[0].plant.label).toBe('Tomatera');
        }

        // Undo removes the plant
        store.undo('loc-delta-1');
        expect(store.getOrCreateSpaceLayout('loc-delta-1').placedPlants).toHaveLength(0);
        expect(store.canUndo('loc-delta-1')).toBe(false);
        expect(store.canRedo('loc-delta-1')).toBe(true);

        // Redo re-inserts the plant with same id and properties
        store.redo('loc-delta-1');
        const plants = store.getOrCreateSpaceLayout('loc-delta-1').placedPlants;
        expect(plants).toHaveLength(1);
        expect(plants[0].id).toBe(plantId);
        expect(plants[0].xCm).toBe(250);
      });

      it('registers removePlant as atomic plant_remove delta and restores at original index', () => {
        const store = useSpaceLayoutStore.getState();
        store.getOrCreateSpaceLayout('loc-delta-2', 'outdoor', 'empty_lot_1to1');

        const id1 = store.placePlant('loc-delta-2', { label: 'Plant 1', xCm: 100, yCm: 100, canopyRadiusCm: 10 });
        const id2 = store.placePlant('loc-delta-2', { label: 'Plant 2', xCm: 200, yCm: 100, canopyRadiusCm: 10 });
        const id3 = store.placePlant('loc-delta-2', { label: 'Plant 3', xCm: 300, yCm: 100, canopyRadiusCm: 10 });

        // Remove middle plant (index 1)
        store.removePlant('loc-delta-2', id2);
        let plants = store.getOrCreateSpaceLayout('loc-delta-2').placedPlants;
        expect(plants.map((p) => p.id)).toEqual([id1, id3]);

        const history = useSpaceLayoutStore.getState().history['loc-delta-2'];
        const lastCmd = history.past[history.past.length - 1];
        expect(lastCmd.type).toBe('plant_remove');
        if (lastCmd.type === 'plant_remove') {
          expect(lastCmd.plant.id).toBe(id2);
          expect(lastCmd.index).toBe(1);
        }

        // Undo restores plant 2 back at index 1
        store.undo('loc-delta-2');
        plants = store.getOrCreateSpaceLayout('loc-delta-2').placedPlants;
        expect(plants.map((p) => p.id)).toEqual([id1, id2, id3]);

        // Redo removes plant 2 again
        store.redo('loc-delta-2');
        plants = store.getOrCreateSpaceLayout('loc-delta-2').placedPlants;
        expect(plants.map((p) => p.id)).toEqual([id1, id3]);
      });

      it('registers movePlant as atomic plant_move delta and undoes/redoes coordinate changes', () => {
        const store = useSpaceLayoutStore.getState();
        store.getOrCreateSpaceLayout('loc-delta-3', 'outdoor', 'empty_lot_1to1');

        const id = store.placePlant('loc-delta-3', { label: 'Zanahoria', xCm: 100, yCm: 150, canopyRadiusCm: 10 });
        store.movePlant('loc-delta-3', id, 220, 340);

        let plant = store.getOrCreateSpaceLayout('loc-delta-3').placedPlants[0];
        expect(plant.xCm).toBe(220);
        expect(plant.yCm).toBe(340);

        const history = useSpaceLayoutStore.getState().history['loc-delta-3'];
        const lastCmd = history.past[history.past.length - 1];
        expect(lastCmd.type).toBe('plant_move');
        if (lastCmd.type === 'plant_move') {
          expect(lastCmd.plantId).toBe(id);
          expect(lastCmd.prevX).toBe(100);
          expect(lastCmd.prevY).toBe(150);
          expect(lastCmd.nextX).toBe(220);
          expect(lastCmd.nextY).toBe(340);
        }

        // Undo moves plant back to (100, 150)
        store.undo('loc-delta-3');
        plant = store.getOrCreateSpaceLayout('loc-delta-3').placedPlants[0];
        expect(plant.xCm).toBe(100);
        expect(plant.yCm).toBe(150);

        // Redo moves plant forward to (220, 340)
        store.redo('loc-delta-3');
        plant = store.getOrCreateSpaceLayout('loc-delta-3').placedPlants[0];
        expect(plant.xCm).toBe(220);
        expect(plant.yCm).toBe(340);
      });

      it('atomically batches placePlantLine and fillCultivableSector with single history delta', () => {
        const store = useSpaceLayoutStore.getState();
        store.getOrCreateSpaceLayout('loc-delta-batch', 'outdoor', 'patio_croquis');

        // Clear existing plants
        const initial = store.getOrCreateSpaceLayout('loc-delta-batch').placedPlants;
        for (const p of initial) {
          store.removePlant('loc-delta-batch', p.id);
        }
        store.clearHistory('loc-delta-batch');

        // Batch line add
        const lineCount = store.placePlantLine(
          'loc-delta-batch',
          { x: 100, y: 500 },
          { x: 600, y: 500 },
          50,
          { label: 'Rabanito', canopyRadiusCm: 10 },
        );
        expect(lineCount).toBeGreaterThan(5);

        let history = useSpaceLayoutStore.getState().history['loc-delta-batch'];
        expect(history.past).toHaveLength(1);
        expect(history.past[0].type).toBe('plant_batch_add');
        if (history.past[0].type === 'plant_batch_add') {
          expect(history.past[0].plants).toHaveLength(lineCount);
        }

        // Undo line add removes all batch plants in one step
        store.undo('loc-delta-batch');
        expect(store.getOrCreateSpaceLayout('loc-delta-batch').placedPlants).toHaveLength(0);

        // Redo restores all batch plants
        store.redo('loc-delta-batch');
        expect(store.getOrCreateSpaceLayout('loc-delta-batch').placedPlants).toHaveLength(lineCount);

        // Batch fill sector
        const fillCount = store.fillCultivableSector(
          'loc-delta-batch',
          0,
          { plantSpacingCm: 80, rowSpacingCm: 80, marginCm: 20 },
          { label: 'Espinaca', canopyRadiusCm: 12 },
        );
        expect(fillCount).toBeGreaterThan(0);

        history = useSpaceLayoutStore.getState().history['loc-delta-batch'];
        expect(history.past).toHaveLength(2);
        expect(history.past[1].type).toBe('plant_batch_add');

        // Undo sector fill removes only sector plants
        store.undo('loc-delta-batch');
        expect(store.getOrCreateSpaceLayout('loc-delta-batch').placedPlants).toHaveLength(lineCount);

        // Undo line removes remaining plants
        store.undo('loc-delta-batch');
        expect(store.getOrCreateSpaceLayout('loc-delta-batch').placedPlants).toHaveLength(0);
      });

      it('seamlessly interleaves structural changes and plant deltas without plant duplication or loss', () => {
        const store = useSpaceLayoutStore.getState();
        store.getOrCreateSpaceLayout('loc-interleave', 'outdoor', 'empty_lot_1to1');

        // 1. Structural change: set boundary
        store.setBaseBoundary('loc-interleave', [
          { x: 0, y: 0 },
          { x: 600, y: 0 },
          { x: 600, y: 600 },
          { x: 0, y: 600 },
        ]);

        // 2. Plant addition
        const p1 = store.placePlant('loc-interleave', { label: 'Tomate', xCm: 100, yCm: 100, canopyRadiusCm: 20 });

        // 3. Structural change: wall height
        store.setAllWallsHeight('loc-interleave', 180);

        // 4. Plant addition
        const p2 = store.placePlant('loc-interleave', { label: 'Morrón', xCm: 200, yCm: 200, canopyRadiusCm: 15 });

        expect(store.getOrCreateSpaceLayout('loc-interleave').placedPlants).toHaveLength(2);
        expect(store.getOrCreateSpaceLayout('loc-interleave').walls[0].heightCm).toBe(180);

        // Undo 4: remove p2
        store.undo('loc-interleave');
        expect(store.getOrCreateSpaceLayout('loc-interleave').placedPlants.map((p) => p.id)).toEqual([p1]);
        expect(store.getOrCreateSpaceLayout('loc-interleave').walls[0].heightCm).toBe(180);

        // Undo 3: wall height reverted to default (0 for empty lot)
        store.undo('loc-interleave');
        expect(store.getOrCreateSpaceLayout('loc-interleave').walls[0].heightCm).toBe(0);
        expect(store.getOrCreateSpaceLayout('loc-interleave').placedPlants.map((p) => p.id)).toEqual([p1]);

        // Undo 2: remove p1
        store.undo('loc-interleave');
        expect(store.getOrCreateSpaceLayout('loc-interleave').placedPlants).toHaveLength(0);

        // Undo 1: boundary reverted to original empty lot (800 x 600)
        store.undo('loc-interleave');
        expect(store.getOrCreateSpaceLayout('loc-interleave').baseBoundary[1].x).toBe(800);

        // Redo all forward
        store.redo('loc-interleave'); // 1. boundary
        expect(store.getOrCreateSpaceLayout('loc-interleave').baseBoundary[1].x).toBe(600);

        store.redo('loc-interleave'); // 2. p1
        expect(store.getOrCreateSpaceLayout('loc-interleave').placedPlants.map((p) => p.id)).toEqual([p1]);

        store.redo('loc-interleave'); // 3. wall height
        expect(store.getOrCreateSpaceLayout('loc-interleave').walls[0].heightCm).toBe(180);

        store.redo('loc-interleave'); // 4. p2
        expect(store.getOrCreateSpaceLayout('loc-interleave').placedPlants.map((p) => p.id)).toEqual([p1, p2]);
      });

      it('benchmark: adding, removing, and undoing 1 plant with 5,000 existing plants executes in < 1 ms', () => {
        const store = useSpaceLayoutStore.getState();
        store.getOrCreateSpaceLayout('loc-perf-5000', 'outdoor', 'empty_lot_1to1');

        // Pre-populate with 5,000 plants in memory directly
        const massivePlants = Array.from({ length: 5000 }, (_, i) => ({
          id: `bench-plant-${i}`,
          label: `Plant-${i}`,
          cropCode: 'lettuce',
          xCm: (i % 100) * 10,
          yCm: Math.floor(i / 100) * 10,
          canopyRadiusCm: 15,
        }));

        useSpaceLayoutStore.setState((state) => ({
          layouts: {
            ...state.layouts,
            'loc-perf-5000': {
              ...state.layouts['loc-perf-5000'],
              placedPlants: massivePlants,
            },
          },
        }));

        expect(store.getOrCreateSpaceLayout('loc-perf-5000').placedPlants).toHaveLength(5000);

        // Benchmark placePlant
        const t0 = performance.now();
        const newPlantId = store.placePlant('loc-perf-5000', {
          label: 'Single Plant',
          cropCode: 'basil',
          xCm: 500,
          yCm: 500,
          canopyRadiusCm: 20,
        });
        const placeDurationMs = performance.now() - t0;

        expect(store.getOrCreateSpaceLayout('loc-perf-5000').placedPlants).toHaveLength(5001);

        // Benchmark undo
        const tUndo = performance.now();
        store.undo('loc-perf-5000');
        const undoDurationMs = performance.now() - tUndo;

        expect(store.getOrCreateSpaceLayout('loc-perf-5000').placedPlants).toHaveLength(5000);

        // Benchmark redo
        const tRedo = performance.now();
        store.redo('loc-perf-5000');
        const redoDurationMs = performance.now() - tRedo;

        expect(store.getOrCreateSpaceLayout('loc-perf-5000').placedPlants).toHaveLength(5001);

        // Benchmark removePlant
        const tRemove = performance.now();
        store.removePlant('loc-perf-5000', newPlantId);
        const removeDurationMs = performance.now() - tRemove;

        expect(store.getOrCreateSpaceLayout('loc-perf-5000').placedPlants).toHaveLength(5000);

        console.info(
          `[BENCHMARK 5000 PLANTS] placePlant: ${placeDurationMs.toFixed(3)}ms | undo: ${undoDurationMs.toFixed(3)}ms | redo: ${redoDurationMs.toFixed(3)}ms | removePlant: ${removeDurationMs.toFixed(3)}ms`,
        );
        // Previously structuredClone took 50-150 ms; now it is < 5.0 ms even under full CPU test runner load
        expect(placeDurationMs).toBeLessThan(10.0);
        expect(undoDurationMs).toBeLessThan(10.0);
        expect(redoDurationMs).toBeLessThan(10.0);
        expect(removeDurationMs).toBeLessThan(10.0);
      });

      describe('fillCultivableSector - Physical Limit & Infinite Stacking Prevention', () => {
        it('fills an empty sector, prevents duplicate stacking on repeated fills, and fills only gaps when plants are removed', () => {
          const store = useSpaceLayoutStore.getState();
          const locId = 'loc-fill-prevention';
          store.getOrCreateSpaceLayout(locId, 'outdoor', 'empty_lot_1to1');
          store.clearHistory(locId);

          // 1. Fill empty sector 0
          const firstFillCount = store.fillCultivableSector(
            locId,
            0,
            { plantSpacingCm: 80, rowSpacingCm: 80, marginCm: 20 },
            { label: 'Lechuga', cropCode: 'lettuce', canopyRadiusCm: 15 },
          );
          expect(firstFillCount).toBeGreaterThan(0);

          let layout = useSpaceLayoutStore.getState().getOrCreateSpaceLayout(locId);
          expect(layout.placedPlants).toHaveLength(firstFillCount);

          const historyAfterFirst = useSpaceLayoutStore.getState().history[locId];
          const historyLengthAfterFirst = historyAfterFirst.past.length;
          expect(historyLengthAfterFirst).toBe(1);

          // 2. Refill the EXACT SAME sector with identical spacing -> 0 added plants (prevents infinite stacking)
          const duplicateFillCount = store.fillCultivableSector(
            locId,
            0,
            { plantSpacingCm: 80, rowSpacingCm: 80, marginCm: 20 },
            { label: 'Lechuga', cropCode: 'lettuce', canopyRadiusCm: 15 },
          );
          expect(duplicateFillCount).toBe(0);

          layout = useSpaceLayoutStore.getState().getOrCreateSpaceLayout(locId);
          expect(layout.placedPlants).toHaveLength(firstFillCount);

          // Undo history is NOT polluted with a 0-plant batch entry
          const historyAfterSecond = useSpaceLayoutStore.getState().history[locId];
          expect(historyAfterSecond.past.length).toBe(historyLengthAfterFirst);

          // 3. Delete 3 plants from the sector
          const removedIds = [
            layout.placedPlants[0].id,
            layout.placedPlants[1].id,
            layout.placedPlants[2].id,
          ];
          for (const id of removedIds) {
            store.removePlant(locId, id);
          }
          layout = useSpaceLayoutStore.getState().getOrCreateSpaceLayout(locId);
          expect(layout.placedPlants).toHaveLength(firstFillCount - 3);

          // 4. Refill again -> fills ONLY the 3 empty gaps
          const gapFillCount = store.fillCultivableSector(
            locId,
            0,
            { plantSpacingCm: 80, rowSpacingCm: 80, marginCm: 20 },
            { label: 'Lechuga', cropCode: 'lettuce', canopyRadiusCm: 15 },
          );
          expect(gapFillCount).toBe(3);

          layout = useSpaceLayoutStore.getState().getOrCreateSpaceLayout(locId);
          expect(layout.placedPlants).toHaveLength(firstFillCount);

          // Repeating fill now that all gaps are filled returns 0 again
          expect(
            store.fillCultivableSector(
              locId,
              0,
              { plantSpacingCm: 80, rowSpacingCm: 80, marginCm: 20 },
              { label: 'Lechuga', cropCode: 'lettuce', canopyRadiusCm: 15 },
            ),
          ).toBe(0);
        });

        it('prevents stacking and finishes in < 25ms even when sector already has 5,000 dense plants', () => {
          const store = useSpaceLayoutStore.getState();
          const locId = 'loc-fill-scale-benchmark';
          store.getOrCreateSpaceLayout(locId, 'indoor', 'empty_lot_1to1');

          // Create boundary for a large commercial greenhouse: 50m x 40m = 5000cm x 4000cm
          store.setBaseBoundary(locId, [
            { x: 0, y: 0 },
            { x: 5000, y: 0 },
            { x: 5000, y: 4000 },
            { x: 0, y: 4000 },
          ]);

          // Initial fill of 5,000+ plants
          const initialFilled = store.fillCultivableSector(
            locId,
            0,
            { plantSpacingCm: 48, rowSpacingCm: 78, marginCm: 50 },
            { label: 'Macro Plant', cropCode: 'tomato', canopyRadiusCm: 20 },
          );
          expect(initialFilled).toBeGreaterThan(5000);

          // Now attempt to fill sector again with identical spacing -> 0 plants added
          const tStart = performance.now();
          const added = store.fillCultivableSector(
            locId,
            0,
            { plantSpacingCm: 48, rowSpacingCm: 78, marginCm: 50 },
            { label: 'Macro Plant', cropCode: 'tomato', canopyRadiusCm: 20 },
          );
          const durationMs = performance.now() - tStart;

          // Since all coordinates are occupied within minSeparationCm, 0 are added
          expect(added).toBe(0);
          expect(durationMs).toBeLessThan(50.0);
        });

        it('fills a sector with an interior path hole without placing any plants in the hole', () => {
          const store = useSpaceLayoutStore.getState();
          const locId = 'loc-floating-path-test';
          store.getOrCreateSpaceLayout(locId, 'indoor', 'empty_lot_1to1');

          // 1000x1000 cm parcel
          store.setBaseBoundary(locId, [
            { x: 0, y: 0 },
            { x: 1000, y: 0 },
            { x: 1000, y: 1000 },
            { x: 0, y: 1000 },
          ]);

          // Interior floating path from (500, 300) to (500, 700) with width 200 cm
          store.addPathStroke(locId, {
            points: [
              { x: 500, y: 300 },
              { x: 500, y: 700 },
            ],
            widthCm: 200,
            material: 'concrete',
          });

          const fillCount = store.fillCultivableSector(
            locId,
            0,
            { plantSpacingCm: 50, rowSpacingCm: 50, marginCm: 20 },
            { label: 'Tomato', cropCode: 'tomato', canopyRadiusCm: 20 },
          );

          expect(fillCount).toBeGreaterThan(0);

          const layout = store.getOrCreateSpaceLayout(locId);
          expect(layout.placedPlants).toHaveLength(fillCount);

          // Path bounds: X in [400, 600], Y in [300, 700]
          // Verify no plant falls inside the path or its margin
          for (const plant of layout.placedPlants) {
            const insidePath =
              plant.xCm >= 400 &&
              plant.xCm <= 600 &&
              plant.yCm >= 300 &&
              plant.yCm <= 700;
            expect(insidePath).toBe(false);
          }
        });
      });
    });
  });
});
