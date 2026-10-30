import { describe, expect, it } from 'vitest';
import { computeSpaceRegions, createRectPolygon } from '@/domain/spaceGeometry';
import type { PlacedPlantSpatialCm } from '@/domain/solarAndPlantSpatial';
import {
  PLANT_BUILDER_PRESETS,
  computeCursorPlantPreview,
  computeDraftPathMetrics,
  createInitialBuilderState,
  spaceBuilderReducer,
} from '../spaceBuilderReducer';

describe('spaceBuilderReducer (1:1 Space Builder State Machine)', () => {
  it('initializes with default inspect tool, 80 cm concrete path, and tomato plant template', () => {
    const state = createInitialBuilderState();

    expect(state.activeTool).toBe('inspect');
    expect(state.pathWidthCm).toBe(80);
    expect(state.pathMaterial).toBe('concrete');
    expect(state.plantTemplate).toEqual(PLANT_BUILDER_PRESETS.tomato);
    expect(state.draftStartCm).toBeNull();
    expect(state.cursorCm).toBeNull();
    expect(state.selectedVertexIndex).toBeNull();
    expect(state.selectedPlantId).toBeNull();
  });

  it('switches tools and clears transient draft/vertex selection state', () => {
    let state = createInitialBuilderState();
    state = spaceBuilderReducer(state, {
      type: 'SET_TOOL',
      tool: 'draw_path',
    });
    state = spaceBuilderReducer(state, {
      type: 'SET_DRAFT_START',
      pointCm: { x: 100, y: 120 },
    });

    expect(state.activeTool).toBe('draw_path');
    expect(state.draftStartCm).toEqual({ x: 100, y: 120 });

    const next = spaceBuilderReducer(state, {
      type: 'SET_TOOL',
      tool: 'plant_single',
    });
    expect(next.activeTool).toBe('plant_single');
    expect(next.draftStartCm).toBeNull();
  });

  it('computes live 1:1 draft path metrics (lengthCm and angleDeg) when drawing a path from (0,0) to (300,400)', () => {
    let state = createInitialBuilderState();
    state = spaceBuilderReducer(state, { type: 'SET_TOOL', tool: 'draw_path' });
    state = spaceBuilderReducer(state, {
      type: 'SET_DRAFT_START',
      pointCm: { x: 0, y: 0 },
    });
    state = spaceBuilderReducer(state, {
      type: 'MOVE_CURSOR',
      pointCm: { x: 300, y: 400 },
    });

    const metrics = computeDraftPathMetrics(state);
    expect(metrics).not.toBeNull();
    expect(metrics?.lengthCm).toBeCloseTo(500, 2);
    expect(metrics?.angleDeg).toBeCloseTo(53.13, 2);
    expect(metrics?.start).toEqual({ x: 0, y: 0 });
    expect(metrics?.end).toEqual({ x: 300, y: 400 });
  });

  it('updates path width, path material, and crop preset with custom spacing', () => {
    let state = createInitialBuilderState();
    state = spaceBuilderReducer(state, { type: 'SET_PATH_WIDTH', widthCm: 100 });
    state = spaceBuilderReducer(state, { type: 'SET_PATH_MATERIAL', material: 'gravel' });
    state = spaceBuilderReducer(state, {
      type: 'SET_PLANT_PRESET',
      presetKey: 'pepper',
    });
    state = spaceBuilderReducer(state, {
      type: 'SET_PLANT_SPACING',
      plantSpacingCm: 45,
      rowSpacingCm: 55,
    });

    expect(state.pathWidthCm).toBe(100);
    expect(state.pathMaterial).toBe('gravel');
    expect(state.plantTemplate.cropCode).toBe('pepper');
    expect(state.plantTemplate.canopyRadiusCm).toBe(20);
    expect(state.plantTemplate.plantSpacingCm).toBe(45);
    expect(state.plantTemplate.rowSpacingCm).toBe(55);
  });

  it('computes live cursor plant preview with surface classification and nearest neighbor clearance in cm', () => {
    const boundary = createRectPolygon(1000, 600);
    const regions = computeSpaceRegions(
      boundary,
      [],
      [
        {
          id: 'path-mid',
          material: 'concrete',
          points: [
            { x: 0, y: 300 },
            { x: 1000, y: 300 },
          ],
          widthCm: 80,
        },
      ],
    );

    const existingPlants: PlacedPlantSpatialCm[] = [
      {
        id: 'p-1',
        label: 'Morrón',
        cropCode: 'pepper',
        xCm: 200,
        yCm: 450,
        canopyRadiusCm: 20,
      },
    ];

    let state = createInitialBuilderState();
    state = spaceBuilderReducer(state, { type: 'SET_TOOL', tool: 'plant_single' });
    // Cursor on cultivable soil 45 cm away from Morrón (Tomatera radius 30 + Morrón 20 = 50 -> clearance -5 cm)
    state = spaceBuilderReducer(state, {
      type: 'MOVE_CURSOR',
      pointCm: { x: 245, y: 450 },
    });

    const soilPreview = computeCursorPlantPreview(state, regions, existingPlants);
    expect(soilPreview).not.toBeNull();
    expect(soilPreview?.surface).toBe('cultivable');
    expect(soilPreview?.canPlant).toBe(true);
    expect(soilPreview?.nearestNeighbor?.neighborLabel).toBe('Morrón');
    expect(soilPreview?.nearestNeighbor?.distanceCm).toBe(45);
    expect(soilPreview?.nearestNeighbor?.clearanceCm).toBe(-5);
    expect(soilPreview?.nearestNeighbor?.isCrowded).toBe(true);

    // Cursor over the concrete path at y=300 -> walkable, cannot plant
    const pathState = spaceBuilderReducer(state, {
      type: 'MOVE_CURSOR',
      pointCm: { x: 245, y: 300 },
    });
    const pathPreview = computeCursorPlantPreview(pathState, regions, existingPlants);
    expect(pathPreview?.surface).toBe('walkable');
    expect(pathPreview?.canPlant).toBe(false);
  });
});
