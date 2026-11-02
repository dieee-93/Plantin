import {
  classifySpacePoint,
  type ComputedSpaceRegions,
  type FloorMaterialType,
  type Point2DCm,
} from '@/domain/spaceGeometry';
import {
  findNearestNeighbor,
  type PlacedPlantSpatialCm,
  type PlantNeighborMeasurement,
} from '@/domain/solarAndPlantSpatial';

export type SpaceBuilderTool =
  | 'inspect'
  | 'draw_path'
  | 'walls'
  | 'roof'
  | 'edit_boundary'
  | 'plant_single'
  | 'plant_line'
  | 'plant_fill_sector';

export interface PlantBuilderTemplate {
  label: string;
  cropCode: string;
  canopyRadiusCm: number;
  plantSpacingCm: number;
  rowSpacingCm: number;
}

export type PlantPresetKey = 'tomato' | 'pepper' | 'lettuce' | 'corn' | 'basil' | 'carrot';

export const PLANT_BUILDER_PRESETS: Record<PlantPresetKey, PlantBuilderTemplate> = {
  tomato: {
    label: 'Tomatera',
    cropCode: 'tomato',
    canopyRadiusCm: 30,
    plantSpacingCm: 50,
    rowSpacingCm: 60,
  },
  pepper: {
    label: 'Morrón',
    cropCode: 'pepper',
    canopyRadiusCm: 20,
    plantSpacingCm: 40,
    rowSpacingCm: 50,
  },
  lettuce: {
    label: 'Lechuga',
    cropCode: 'lettuce',
    canopyRadiusCm: 15,
    plantSpacingCm: 30,
    rowSpacingCm: 30,
  },
  corn: {
    label: 'Maíz',
    cropCode: 'corn',
    canopyRadiusCm: 25,
    plantSpacingCm: 35,
    rowSpacingCm: 60,
  },
  basil: {
    label: 'Albahaca',
    cropCode: 'basil',
    canopyRadiusCm: 15,
    plantSpacingCm: 30,
    rowSpacingCm: 30,
  },
  carrot: {
    label: 'Zanahoria',
    cropCode: 'carrot',
    canopyRadiusCm: 12,
    plantSpacingCm: 20,
    rowSpacingCm: 25,
  },
};

export interface SpaceBuilderState {
  activeTool: SpaceBuilderTool;
  pathWidthCm: number;
  pathMaterial: FloorMaterialType;
  plantTemplate: PlantBuilderTemplate;
  draftStartCm: Point2DCm | null;
  cursorCm: Point2DCm | null;
  selectedVertexIndex: number | null;
  selectedWallId: string | null;
  selectedPlantId: string | null;
}

export type SpaceBuilderEvent =
  | { type: 'SET_TOOL'; tool: SpaceBuilderTool }
  | { type: 'SET_PATH_WIDTH'; widthCm: number }
  | { type: 'SET_PATH_MATERIAL'; material: FloorMaterialType }
  | { type: 'SET_PLANT_PRESET'; presetKey: PlantPresetKey }
  | {
      type: 'SET_PLANT_SPACING';
      plantSpacingCm: number;
      rowSpacingCm?: number;
    }
  | { type: 'SET_DRAFT_START'; pointCm: Point2DCm | null }
  | { type: 'MOVE_CURSOR'; pointCm: Point2DCm | null }
  | { type: 'SELECT_VERTEX'; vertexIndex: number | null }
  | { type: 'SELECT_WALL'; wallId: string | null }
  | { type: 'SELECT_PLANT'; plantId: string | null };

export function createInitialBuilderState(): SpaceBuilderState {
  return {
    activeTool: 'inspect',
    pathWidthCm: 80,
    pathMaterial: 'concrete',
    plantTemplate: { ...PLANT_BUILDER_PRESETS.tomato },
    draftStartCm: null,
    cursorCm: null,
    selectedVertexIndex: null,
    selectedWallId: null,
    selectedPlantId: null,
  };
}

export function spaceBuilderReducer(
  state: SpaceBuilderState,
  event: SpaceBuilderEvent,
): SpaceBuilderState {
  switch (event.type) {
    case 'SET_TOOL':
      return {
        ...state,
        activeTool: event.tool,
        draftStartCm: null,
        selectedVertexIndex: null,
        selectedWallId: null,
      };
    case 'SET_PATH_WIDTH':
      return {
        ...state,
        pathWidthCm: Math.max(20, Math.round(event.widthCm)),
      };
    case 'SET_PATH_MATERIAL':
      return {
        ...state,
        pathMaterial: event.material,
      };
    case 'SET_PLANT_PRESET': {
      const preset = PLANT_BUILDER_PRESETS[event.presetKey];
      if (!preset) return state;
      return {
        ...state,
        plantTemplate: { ...preset },
      };
    }
    case 'SET_PLANT_SPACING': {
      const nextSpacing = Math.max(10, Math.round(event.plantSpacingCm));
      const nextRowSpacing =
        event.rowSpacingCm !== undefined
          ? Math.max(10, Math.round(event.rowSpacingCm))
          : state.plantTemplate.rowSpacingCm;
      return {
        ...state,
        plantTemplate: {
          ...state.plantTemplate,
          plantSpacingCm: nextSpacing,
          rowSpacingCm: nextRowSpacing,
        },
      };
    }
    case 'SET_DRAFT_START':
      return {
        ...state,
        draftStartCm: event.pointCm
          ? { x: Math.round(event.pointCm.x), y: Math.round(event.pointCm.y) }
          : null,
      };
    case 'MOVE_CURSOR':
      return {
        ...state,
        cursorCm: event.pointCm
          ? { x: Math.round(event.pointCm.x), y: Math.round(event.pointCm.y) }
          : null,
      };
    case 'SELECT_VERTEX':
      return {
        ...state,
        selectedVertexIndex: event.vertexIndex,
      };
    case 'SELECT_WALL':
      return {
        ...state,
        selectedWallId: event.wallId,
      };
    case 'SELECT_PLANT':
      return {
        ...state,
        selectedPlantId: event.plantId,
      };
    default:
      return state;
  }
}

export interface DraftPathMetrics {
  lengthCm: number;
  angleDeg: number;
  start: Point2DCm;
  end: Point2DCm;
}

export function computeDraftPathMetrics(
  state: SpaceBuilderState,
): DraftPathMetrics | null {
  if (
    (state.activeTool !== 'draw_path' && state.activeTool !== 'plant_line') ||
    !state.draftStartCm ||
    !state.cursorCm
  ) {
    return null;
  }

  const dx = state.cursorCm.x - state.draftStartCm.x;
  const dy = state.cursorCm.y - state.draftStartCm.y;
  const lengthCm = Math.round(Math.hypot(dx, dy) * 100) / 100;
  const angleDeg = Math.round(((Math.atan2(dy, dx) * 180) / Math.PI) * 100) / 100;

  return {
    lengthCm,
    angleDeg,
    start: state.draftStartCm,
    end: state.cursorCm,
  };
}

export interface CursorPlantPreview {
  pointCm: Point2DCm;
  surface: 'cultivable' | 'walkable' | 'outside';
  canPlant: boolean;
  nearestNeighbor: PlantNeighborMeasurement | null;
}

export function computeCursorPlantPreview(
  state: SpaceBuilderState,
  regions: ComputedSpaceRegions,
  existingPlants: PlacedPlantSpatialCm[],
): CursorPlantPreview | null {
  if (!state.cursorCm) return null;

  const surface = classifySpacePoint(state.cursorCm, regions);
  const canPlant = surface === 'cultivable';

  const probePlant: PlacedPlantSpatialCm = {
    id: '__cursor_probe__',
    label: state.plantTemplate.label,
    cropCode: state.plantTemplate.cropCode,
    xCm: state.cursorCm.x,
    yCm: state.cursorCm.y,
    canopyRadiusCm: state.plantTemplate.canopyRadiusCm,
  };

  const nearestNeighbor = findNearestNeighbor(probePlant, existingPlants);
  return {
    pointCm: state.cursorCm,
    surface,
    canPlant,
    nearestNeighbor,
  };
}
