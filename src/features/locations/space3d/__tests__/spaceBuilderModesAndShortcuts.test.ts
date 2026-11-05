import { describe, expect, it } from 'vitest';
import type { PlacedPlantSpatialCm } from '@/domain/solarAndPlantSpatial';
import {
  createInitialBuilderState,
  spaceBuilderReducer,
  type SpaceBuilderState,
} from '../spaceBuilderReducer';
import {
  resolveSpaceKeyCommand,
} from '../spaceKeyboardShortcuts';

describe('Fase 1 - Máquina de Estados de 3 Modos y Buffer de Staging', () => {
  describe('Jerarquía de 3 Modos Principales y Sub-modos de Construcción', () => {
    it('initializes with primaryMode: "live", buildSubMode: "architecture", activeTool: "inspect" and empty stagedPlants', () => {
      const state = createInitialBuilderState();

      expect(state.primaryMode).toBe('live');
      expect(state.buildSubMode).toBe('architecture');
      expect(state.activeTool).toBe('inspect');
      expect(state.stagedPlants).toEqual([]);
    });

    it('transitions to primaryMode: "live", resetting activeTool to "inspect" and clearing draftStartCm', () => {
      let state = createInitialBuilderState();
      // Setup draft and tool in another mode
      state = spaceBuilderReducer(state, { type: 'SET_TOOL', tool: 'draw_path' });
      state = spaceBuilderReducer(state, {
        type: 'SET_DRAFT_START',
        pointCm: { x: 100, y: 150 },
      });
      expect(state.draftStartCm).not.toBeNull();

      state = spaceBuilderReducer(state, { type: 'SET_PRIMARY_MODE', mode: 'live' });
      expect(state.primaryMode).toBe('live');
      expect(state.activeTool).toBe('inspect');
      expect(state.draftStartCm).toBeNull();
    });

    it('transitions to primaryMode: "build" with default architecture tool "edit_boundary", or props tool "place_object"', () => {
      let state = createInitialBuilderState();
      // Switching to build when buildSubMode is architecture
      state = spaceBuilderReducer(state, { type: 'SET_PRIMARY_MODE', mode: 'build' });
      expect(state.primaryMode).toBe('build');
      expect(state.activeTool).toBe('edit_boundary');

      // Allows keeping architecture tool if already set (e.g. walls)
      state = spaceBuilderReducer(state, { type: 'SET_TOOL', tool: 'walls' });
      expect(state.activeTool).toBe('walls');
      state = spaceBuilderReducer(state, { type: 'SET_PRIMARY_MODE', mode: 'build' });
      expect(state.activeTool).toBe('walls');

      // Allows explicit tool specification
      state = spaceBuilderReducer(state, {
        type: 'SET_PRIMARY_MODE',
        mode: 'build',
        tool: 'inspect',
      });
      expect(state.activeTool).toBe('inspect');

      // In props submode, entering build automatically sets place_object
      state = spaceBuilderReducer(state, {
        type: 'SET_BUILD_SUBMODE',
        subMode: 'props',
      });
      state = spaceBuilderReducer(state, { type: 'SET_PRIMARY_MODE', mode: 'live' });
      state = spaceBuilderReducer(state, { type: 'SET_PRIMARY_MODE', mode: 'build' });
      expect(state.buildSubMode).toBe('props');
      expect(state.activeTool).toBe('place_object');
    });

    it('handles SET_BUILD_SUBMODE transitions cleanly', () => {
      let state = createInitialBuilderState();

      // Switch to props: ensures primaryMode is build and activeTool is place_object
      state = spaceBuilderReducer(state, {
        type: 'SET_BUILD_SUBMODE',
        subMode: 'props',
      });
      expect(state.primaryMode).toBe('build');
      expect(state.buildSubMode).toBe('props');
      expect(state.activeTool).toBe('place_object');

      // Switch back to architecture: resets place_object to edit_boundary
      state = spaceBuilderReducer(state, {
        type: 'SET_BUILD_SUBMODE',
        subMode: 'architecture',
      });
      expect(state.primaryMode).toBe('build');
      expect(state.buildSubMode).toBe('architecture');
      expect(state.activeTool).toBe('edit_boundary');

      // If already in an architecture tool (e.g. walls), preserves it
      state = spaceBuilderReducer(state, { type: 'SET_TOOL', tool: 'walls' });
      state = spaceBuilderReducer(state, {
        type: 'SET_BUILD_SUBMODE',
        subMode: 'architecture',
      });
      expect(state.activeTool).toBe('walls');
    });

    it('transitions to primaryMode: "planting" and defaults non-planting tools to "plant_single"', () => {
      let state = createInitialBuilderState();
      // From architecture tool (walls) to planting -> defaults to plant_single
      state = spaceBuilderReducer(state, { type: 'SET_TOOL', tool: 'walls' });
      state = spaceBuilderReducer(state, { type: 'SET_PRIMARY_MODE', mode: 'planting' });
      expect(state.primaryMode).toBe('planting');
      expect(state.activeTool).toBe('plant_single');

      // Preserves valid planting tools (plant_line, plant_fill_sector, place_object, inspect)
      state = spaceBuilderReducer(state, { type: 'SET_TOOL', tool: 'plant_line' });
      state = spaceBuilderReducer(state, { type: 'SET_PRIMARY_MODE', mode: 'planting' });
      expect(state.activeTool).toBe('plant_line');

      state = spaceBuilderReducer(state, { type: 'SET_TOOL', tool: 'place_object' });
      state = spaceBuilderReducer(state, { type: 'SET_PRIMARY_MODE', mode: 'planting' });
      expect(state.activeTool).toBe('place_object');

      state = spaceBuilderReducer(state, { type: 'SET_TOOL', tool: 'inspect' });
      state = spaceBuilderReducer(state, { type: 'SET_PRIMARY_MODE', mode: 'planting' });
      expect(state.activeTool).toBe('inspect');
    });

    it('automatically synchronizes primaryMode and buildSubMode when SET_TOOL is dispatched directly', () => {
      let state = createInitialBuilderState();

      // Architecture tools sync mode: build, subMode: architecture
      const archTools = ['edit_boundary', 'walls', 'draw_path', 'roof'] as const;
      for (const tool of archTools) {
        state = spaceBuilderReducer(state, { type: 'SET_PRIMARY_MODE', mode: 'live' });
        state = spaceBuilderReducer(state, { type: 'SET_TOOL', tool });
        expect(state.primaryMode).toBe('build');
        expect(state.buildSubMode).toBe('architecture');
        expect(state.activeTool).toBe(tool);
      }

      // Planting tools sync mode: planting
      const plantingTools = ['plant_single', 'plant_line', 'plant_fill_sector'] as const;
      for (const tool of plantingTools) {
        state = spaceBuilderReducer(state, { type: 'SET_PRIMARY_MODE', mode: 'live' });
        state = spaceBuilderReducer(state, { type: 'SET_TOOL', tool });
        expect(state.primaryMode).toBe('planting');
        expect(state.activeTool).toBe(tool);
      }

      // place_object when in live syncs mode: build, subMode: props
      state = spaceBuilderReducer(state, { type: 'SET_PRIMARY_MODE', mode: 'live' });
      state = spaceBuilderReducer(state, { type: 'SET_TOOL', tool: 'place_object' });
      expect(state.primaryMode).toBe('build');
      expect(state.buildSubMode).toBe('props');
      expect(state.activeTool).toBe('place_object');
    });
  });

  describe('Buffer Transaccional de Plantación (stagedPlants)', () => {
    const mockPlant1: PlacedPlantSpatialCm = {
      id: 'staged-plant-1',
      label: 'Tomatera San Marzano',
      cropCode: 'tomato',
      xCm: 150,
      yCm: 220,
      canopyRadiusCm: 30,
    };

    const mockPlant2: PlacedPlantSpatialCm = {
      id: 'staged-plant-2',
      label: 'Morrón Calafate',
      cropCode: 'pepper',
      xCm: 200,
      yCm: 280,
      canopyRadiusCm: 25,
    };

    it('stages a single plant with STAGE_PLANT', () => {
      let state = createInitialBuilderState();
      state = spaceBuilderReducer(state, { type: 'STAGE_PLANT', plant: mockPlant1 });

      expect(state.stagedPlants).toHaveLength(1);
      expect(state.stagedPlants[0]).toEqual(mockPlant1);
    });

    it('stages multiple plants with STAGE_PLANTS_BATCH', () => {
      let state = createInitialBuilderState();
      state = spaceBuilderReducer(state, {
        type: 'STAGE_PLANTS_BATCH',
        plants: [mockPlant1, mockPlant2],
      });

      expect(state.stagedPlants).toHaveLength(2);
      expect(state.stagedPlants).toEqual([mockPlant1, mockPlant2]);
    });

    it('removes a staged plant with REMOVE_STAGED_PLANT and deselects it if selected', () => {
      let state = createInitialBuilderState();
      state = spaceBuilderReducer(state, {
        type: 'STAGE_PLANTS_BATCH',
        plants: [mockPlant1, mockPlant2],
      });
      state = spaceBuilderReducer(state, {
        type: 'SELECT_PLANT',
        plantId: mockPlant1.id,
      });
      expect(state.selectedPlantId).toBe(mockPlant1.id);

      state = spaceBuilderReducer(state, {
        type: 'REMOVE_STAGED_PLANT',
        plantId: mockPlant1.id,
      });

      expect(state.stagedPlants).toHaveLength(1);
      expect(state.stagedPlants[0].id).toBe(mockPlant2.id);
      expect(state.selectedPlantId).toBeNull();
    });

    it('updates staged plant properties with UPDATE_STAGED_PLANT', () => {
      let state = createInitialBuilderState();
      state = spaceBuilderReducer(state, { type: 'STAGE_PLANT', plant: mockPlant1 });
      state = spaceBuilderReducer(state, {
        type: 'UPDATE_STAGED_PLANT',
        plantId: mockPlant1.id,
        patch: { xCm: 180, yCm: 250 },
      });

      expect(state.stagedPlants[0].xCm).toBe(180);
      expect(state.stagedPlants[0].yCm).toBe(250);
      expect(state.stagedPlants[0].label).toBe(mockPlant1.label);
    });

    it('clears all staged plants with CLEAR_STAGED_PLANTS', () => {
      let state = createInitialBuilderState();
      state = spaceBuilderReducer(state, {
        type: 'STAGE_PLANTS_BATCH',
        plants: [mockPlant1, mockPlant2],
      });
      expect(state.stagedPlants).toHaveLength(2);

      state = spaceBuilderReducer(state, { type: 'CLEAR_STAGED_PLANTS' });
      expect(state.stagedPlants).toEqual([]);
    });
  });

  describe('Escalera de Escape (ESCAPE_STEP)', () => {
    it('Step 1: cancels active draft first without resetting tool or selection', () => {
      let state = createInitialBuilderState();
      state = spaceBuilderReducer(state, { type: 'SET_TOOL', tool: 'draw_path' });
      state = spaceBuilderReducer(state, {
        type: 'SET_DRAFT_START',
        pointCm: { x: 50, y: 80 },
      });
      state = spaceBuilderReducer(state, {
        type: 'SELECT_OBJECT',
        objectId: 'obj-42',
      });

      state = spaceBuilderReducer(state, { type: 'ESCAPE_STEP' });

      expect(state.draftStartCm).toBeNull();
      expect(state.activeTool).toBe('draw_path');
      expect(state.selectedObjectId).toBe('obj-42');
    });

    it('Step 2: clears ALL selections when no draft is active', () => {
      let state = createInitialBuilderState();
      state = spaceBuilderReducer(state, { type: 'SET_TOOL', tool: 'edit_boundary' });
      state = spaceBuilderReducer(state, { type: 'SELECT_VERTEX', vertexIndex: 2 });
      expect(state.selectedVertexIndex).toBe(2);

      state = spaceBuilderReducer(state, { type: 'ESCAPE_STEP' });

      expect(state.selectedVertexIndex).toBeNull();
      expect(state.selectedObjectId).toBeNull();
      expect(state.selectedPlantId).toBeNull();
      expect(state.selectedWallId).toBeNull();
      expect(state.activeTool).toBe('edit_boundary');
    });

    it('Step 3: resets activeTool to "inspect" when nothing is drafting or selected', () => {
      let state = createInitialBuilderState();
      state = spaceBuilderReducer(state, { type: 'SET_TOOL', tool: 'plant_line' });
      expect(state.activeTool).toBe('plant_line');

      state = spaceBuilderReducer(state, { type: 'ESCAPE_STEP' });

      expect(state.activeTool).toBe('inspect');
    });

    it('does nothing when already on "inspect" with no draft or selection', () => {
      const state = createInitialBuilderState();
      const next = spaceBuilderReducer(state, { type: 'ESCAPE_STEP' });
      expect(next).toEqual(state);
    });
  });
});

describe('Fase 1 - Gestor Unificado de Teclado (resolveSpaceKeyCommand)', () => {
  it('ignores all keys when an input is focused or a modal dialog is open', () => {
    const state = createInitialBuilderState();

    expect(
      resolveSpaceKeyCommand({ key: 'Escape', isInputFocused: true }, state),
    ).toEqual({ kind: 'ignore' });

    expect(
      resolveSpaceKeyCommand({ key: 'Delete', hasModalOpen: true }, state),
    ).toEqual({ kind: 'ignore' });

    expect(
      resolveSpaceKeyCommand({ key: 'z', ctrlKey: true, isInputFocused: true }, state),
    ).toEqual({ kind: 'ignore' });
  });

  it('never hides HUD on Tab key press (preserves accessibility focus)', () => {
    const state = createInitialBuilderState();
    expect(resolveSpaceKeyCommand({ key: 'Tab' }, state)).toEqual({
      kind: 'ignore',
    });
    expect(
      resolveSpaceKeyCommand({ key: 'Tab', shiftKey: true }, state),
    ).toEqual({ kind: 'ignore' });
  });

  it('toggles HUD on "h" or "H"', () => {
    const state = createInitialBuilderState();
    expect(resolveSpaceKeyCommand({ key: 'h' }, state)).toEqual({
      kind: 'toggle_hud',
    });
    expect(resolveSpaceKeyCommand({ key: 'H' }, state)).toEqual({
      kind: 'toggle_hud',
    });
  });

  it('resolves undo (Ctrl+Z / Cmd+Z) in ANY mode', () => {
    const liveState = createInitialBuilderState();
    const buildState: SpaceBuilderState = {
      ...liveState,
      primaryMode: 'build',
      activeTool: 'walls',
    };
    const plantingState: SpaceBuilderState = {
      ...liveState,
      primaryMode: 'planting',
      activeTool: 'plant_single',
    };

    for (const state of [liveState, buildState, plantingState]) {
      expect(
        resolveSpaceKeyCommand({ key: 'z', ctrlKey: true }, state),
      ).toEqual({ kind: 'undo' });
      expect(
        resolveSpaceKeyCommand({ key: 'Z', metaKey: true }, state),
      ).toEqual({ kind: 'undo' });
    }
  });

  it('resolves redo (Ctrl+Y / Cmd+Y or Ctrl+Shift+Z) in ANY mode', () => {
    const state = createInitialBuilderState();

    expect(resolveSpaceKeyCommand({ key: 'y', ctrlKey: true }, state)).toEqual({
      kind: 'redo',
    });
    expect(resolveSpaceKeyCommand({ key: 'Y', metaKey: true }, state)).toEqual({
      kind: 'redo',
    });
    expect(
      resolveSpaceKeyCommand({ key: 'z', ctrlKey: true, shiftKey: true }, state),
    ).toEqual({ kind: 'redo' });
    expect(
      resolveSpaceKeyCommand({ key: 'Z', metaKey: true, shiftKey: true }, state),
    ).toEqual({ kind: 'redo' });
  });

  it('switches modes via numeric keys 1, 2, 3', () => {
    let state = createInitialBuilderState(); // live mode

    // 1 -> live mode
    expect(resolveSpaceKeyCommand({ key: '1' }, state)).toEqual({
      kind: 'dispatch',
      event: { type: 'SET_PRIMARY_MODE', mode: 'live' },
    });

    // 2 from live -> enters build mode
    expect(resolveSpaceKeyCommand({ key: '2' }, state)).toEqual({
      kind: 'dispatch',
      event: { type: 'SET_PRIMARY_MODE', mode: 'build' },
    });

    // 2 when already in build mode (architecture) -> toggles to props
    state = { ...state, primaryMode: 'build', buildSubMode: 'architecture' };
    expect(resolveSpaceKeyCommand({ key: '2' }, state)).toEqual({
      kind: 'dispatch',
      event: { type: 'SET_BUILD_SUBMODE', subMode: 'props' },
    });

    // 2 when already in build mode (props) -> toggles to architecture
    state = { ...state, primaryMode: 'build', buildSubMode: 'props' };
    expect(resolveSpaceKeyCommand({ key: '2' }, state)).toEqual({
      kind: 'dispatch',
      event: { type: 'SET_BUILD_SUBMODE', subMode: 'architecture' },
    });

    // 3 -> planting mode
    expect(resolveSpaceKeyCommand({ key: '3' }, state)).toEqual({
      kind: 'dispatch',
      event: { type: 'SET_PRIMARY_MODE', mode: 'planting' },
    });
  });

  it('switches to inspect tool via "v" / "V"', () => {
    const state = createInitialBuilderState();
    expect(resolveSpaceKeyCommand({ key: 'v' }, state)).toEqual({
      kind: 'dispatch',
      event: { type: 'SET_TOOL', tool: 'inspect' },
    });
    expect(resolveSpaceKeyCommand({ key: 'V' }, state)).toEqual({
      kind: 'dispatch',
      event: { type: 'SET_TOOL', tool: 'inspect' },
    });
  });

  describe('Contextual sub-tools (q, w, e, t)', () => {
    it('dispatches architecture tools in build + architecture', () => {
      const state: SpaceBuilderState = {
        ...createInitialBuilderState(),
        primaryMode: 'build',
        buildSubMode: 'architecture',
      };

      expect(resolveSpaceKeyCommand({ key: 'q' }, state)).toEqual({
        kind: 'dispatch',
        event: { type: 'SET_TOOL', tool: 'edit_boundary' },
      });
      expect(resolveSpaceKeyCommand({ key: 'w' }, state)).toEqual({
        kind: 'dispatch',
        event: { type: 'SET_TOOL', tool: 'walls' },
      });
      expect(resolveSpaceKeyCommand({ key: 'e' }, state)).toEqual({
        kind: 'dispatch',
        event: { type: 'SET_TOOL', tool: 'draw_path' },
      });
      expect(resolveSpaceKeyCommand({ key: 't' }, state)).toEqual({
        kind: 'dispatch',
        event: { type: 'SET_TOOL', tool: 'roof' },
      });
    });

    it('dispatches place_object on "q" in build + props', () => {
      const state: SpaceBuilderState = {
        ...createInitialBuilderState(),
        primaryMode: 'build',
        buildSubMode: 'props',
      };

      expect(resolveSpaceKeyCommand({ key: 'q' }, state)).toEqual({
        kind: 'dispatch',
        event: { type: 'SET_TOOL', tool: 'place_object' },
      });
      // w, e, t are unmapped in build+props -> ignore
      expect(resolveSpaceKeyCommand({ key: 'w' }, state)).toEqual({
        kind: 'ignore',
      });
    });

    it('dispatches planting tools in planting mode', () => {
      const state: SpaceBuilderState = {
        ...createInitialBuilderState(),
        primaryMode: 'planting',
      };

      expect(resolveSpaceKeyCommand({ key: 'q' }, state)).toEqual({
        kind: 'dispatch',
        event: { type: 'SET_TOOL', tool: 'plant_single' },
      });
      expect(resolveSpaceKeyCommand({ key: 'w' }, state)).toEqual({
        kind: 'dispatch',
        event: { type: 'SET_TOOL', tool: 'plant_line' },
      });
      expect(resolveSpaceKeyCommand({ key: 'e' }, state)).toEqual({
        kind: 'dispatch',
        event: { type: 'SET_TOOL', tool: 'plant_fill_sector' },
      });
      expect(resolveSpaceKeyCommand({ key: 't' }, state)).toEqual({
        kind: 'dispatch',
        event: { type: 'SET_TOOL', tool: 'place_object' },
      });
    });
  });

  describe('Universal verbs without tool collisions', () => {
    it('"r" / "R" rotates selected object or preview, and NEVER switches tool to plant_fill_sector', () => {
      // 1. With selected object: rotates object by +90 (or -90 with shift)
      const stateWithObj: SpaceBuilderState = {
        ...createInitialBuilderState(),
        selectedObjectId: 'bench-01',
      };
      expect(resolveSpaceKeyCommand({ key: 'r' }, stateWithObj)).toEqual({
        kind: 'rotate_selected_object',
        deltaDeg: 90,
      });
      expect(
        resolveSpaceKeyCommand({ key: 'R', shiftKey: true }, stateWithObj),
      ).toEqual({
        kind: 'rotate_selected_object',
        deltaDeg: -90,
      });

      // 2. No selected object, but activeTool is place_object -> rotates placement preview
      const statePlacing: SpaceBuilderState = {
        ...createInitialBuilderState(),
        activeTool: 'place_object',
        objectRotationDeg: 90,
      };
      expect(resolveSpaceKeyCommand({ key: 'r' }, statePlacing)).toEqual({
        kind: 'dispatch',
        event: { type: 'SET_OBJECT_ROTATION', rotationDeg: 180 },
      });
      expect(
        resolveSpaceKeyCommand({ key: 'r', shiftKey: true }, statePlacing),
      ).toEqual({
        kind: 'dispatch',
        event: { type: 'SET_OBJECT_ROTATION', rotationDeg: 0 },
      });

      // 3. In other tools with no selection -> ignore (never triggers plant_fill_sector)
      const normalState = createInitialBuilderState();
      expect(resolveSpaceKeyCommand({ key: 'r' }, normalState)).toEqual({
        kind: 'ignore',
      });
    });

    it('Delete / Backspace operates symmetrically on whatever is selected', () => {
      const baseState = createInitialBuilderState();

      // Selected object
      const stateObj: SpaceBuilderState = {
        ...baseState,
        selectedObjectId: 'box-99',
      };
      expect(resolveSpaceKeyCommand({ key: 'Delete' }, stateObj)).toEqual({
        kind: 'delete_selected_object',
        objectId: 'box-99',
      });
      expect(resolveSpaceKeyCommand({ key: 'Backspace' }, stateObj)).toEqual({
        kind: 'delete_selected_object',
        objectId: 'box-99',
      });

      // Staged plant -> REMOVE_STAGED_PLANT
      const stateStagedPlant: SpaceBuilderState = {
        ...baseState,
        selectedPlantId: 'staged-plant-3',
        stagedPlants: [
          {
            id: 'staged-plant-3',
            label: 'Albahaca',
            cropCode: 'basil',
            xCm: 50,
            yCm: 50,
            canopyRadiusCm: 15,
          },
        ],
      };
      expect(
        resolveSpaceKeyCommand({ key: 'Delete' }, stateStagedPlant),
      ).toEqual({
        kind: 'dispatch',
        event: { type: 'REMOVE_STAGED_PLANT', plantId: 'staged-plant-3' },
      });

      // Persisted plant -> delete_selected_plant
      const statePersistedPlant: SpaceBuilderState = {
        ...baseState,
        selectedPlantId: 'persisted-plant-9',
        stagedPlants: [],
      };
      expect(
        resolveSpaceKeyCommand({ key: 'Delete' }, statePersistedPlant),
      ).toEqual({
        kind: 'delete_selected_plant',
        plantId: 'persisted-plant-9',
      });

      // Selected wall -> reset_selected_wall
      const stateWall: SpaceBuilderState = {
        ...baseState,
        selectedWallId: 'wall-north',
      };
      expect(resolveSpaceKeyCommand({ key: 'Delete' }, stateWall)).toEqual({
        kind: 'reset_selected_wall',
        wallId: 'wall-north',
      });

      // Selected vertex -> delete_selected_vertex
      const stateVertex: SpaceBuilderState = {
        ...baseState,
        selectedVertexIndex: 3,
      };
      expect(resolveSpaceKeyCommand({ key: 'Delete' }, stateVertex)).toEqual({
        kind: 'delete_selected_vertex',
        vertexIndex: 3,
      });

      // Nothing selected -> ignore
      expect(resolveSpaceKeyCommand({ key: 'Delete' }, baseState)).toEqual({
        kind: 'ignore',
      });
    });

    it('Escape dispatches ESCAPE_STEP', () => {
      const state = createInitialBuilderState();
      expect(resolveSpaceKeyCommand({ key: 'Escape' }, state)).toEqual({
        kind: 'dispatch',
        event: { type: 'ESCAPE_STEP' },
      });
    });
  });
});
