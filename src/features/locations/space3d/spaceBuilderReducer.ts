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

export type SpacePrimaryMode = 'live' | 'build' | 'planting';
export type SpaceBuildSubMode = 'architecture' | 'props';

export type SpaceBuilderTool =
  | 'inspect'
  | 'draw_path'
  | 'walls'
  | 'roof'
  | 'edit_boundary'
  | 'place_object'
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
  primaryMode: SpacePrimaryMode;
  buildSubMode: SpaceBuildSubMode;
  stagedPlants: PlacedPlantSpatialCm[];
  activeTool: SpaceBuilderTool;
  pathWidthCm: number;
  pathMaterial: FloorMaterialType;
  plantTemplate: PlantBuilderTemplate;
  selectedObjectAssetId: string;
  objectRotationDeg: number;
  objectElevationM: number;
  draftStartCm: Point2DCm | null;
  cursorCm: Point2DCm | null;
  selectedVertexIndex: number | null;
  selectedWallId: string | null;
  selectedPlantId: string | null;
  selectedObjectId: string | null;
}

export type SpaceBuilderEvent =
  | { type: 'SET_PRIMARY_MODE'; mode: SpacePrimaryMode; tool?: SpaceBuilderTool }
  | { type: 'SET_BUILD_SUBMODE'; subMode: SpaceBuildSubMode }
  | { type: 'STAGE_PLANT'; plant: PlacedPlantSpatialCm }
  | { type: 'STAGE_PLANTS_BATCH'; plants: PlacedPlantSpatialCm[] }
  | { type: 'REMOVE_STAGED_PLANT'; plantId: string }
  | { type: 'UPDATE_STAGED_PLANT'; plantId: string; patch: Partial<PlacedPlantSpatialCm> }
  | { type: 'CLEAR_STAGED_PLANTS' }
  | { type: 'ESCAPE_STEP' }
  | { type: 'SET_TOOL'; tool: SpaceBuilderTool }
  | { type: 'SET_PATH_WIDTH'; widthCm: number }
  | { type: 'SET_PATH_MATERIAL'; material: FloorMaterialType }
  | { type: 'SET_PLANT_PRESET'; presetKey: PlantPresetKey }
  | {
      type: 'SET_PLANT_SPACING';
      plantSpacingCm: number;
      rowSpacingCm?: number;
    }
  | { type: 'SET_OBJECT_ASSET'; assetId: string }
  | { type: 'SET_OBJECT_ROTATION'; rotationDeg: number }
  | { type: 'SET_OBJECT_ELEVATION'; elevationM: number }
  | { type: 'SET_DRAFT_START'; pointCm: Point2DCm | null }
  | { type: 'MOVE_CURSOR'; pointCm: Point2DCm | null }
  | { type: 'SELECT_VERTEX'; vertexIndex: number | null }
  | { type: 'SELECT_WALL'; wallId: string | null }
  | { type: 'SELECT_PLANT'; plantId: string | null }
  | { type: 'SELECT_OBJECT'; objectId: string | null };

export function createInitialBuilderState(): SpaceBuilderState {
  return {
    primaryMode: 'live',
    buildSubMode: 'architecture',
    activeTool: 'inspect',
    stagedPlants: [],
    pathWidthCm: 80,
    pathMaterial: 'concrete',
    plantTemplate: { ...PLANT_BUILDER_PRESETS.tomato },
    selectedObjectAssetId: 'pallet_standard_wood_a01',
    objectRotationDeg: 0,
    objectElevationM: 0,
    draftStartCm: null,
    cursorCm: null,
    selectedVertexIndex: null,
    selectedWallId: null,
    selectedPlantId: null,
    selectedObjectId: null,
  };
}

export function spaceBuilderReducer(
  state: SpaceBuilderState,
  event: SpaceBuilderEvent,
): SpaceBuilderState {
  switch (event.type) {
    case 'SET_PRIMARY_MODE': {
      if (event.mode === 'live') {
        return {
          ...state,
          primaryMode: 'live',
          activeTool: 'inspect',
          draftStartCm: null,
        };
      }
      if (event.mode === 'build') {
        let nextTool: SpaceBuilderTool;
        if (event.tool) {
          nextTool = event.tool;
        } else if (state.buildSubMode === 'props') {
          nextTool = 'place_object';
        } else {
          const archTools: SpaceBuilderTool[] = [
            'inspect',
            'edit_boundary',
            'walls',
            'draw_path',
            'roof',
          ];
          if (archTools.includes(state.activeTool) && state.activeTool !== 'inspect') {
            nextTool = state.activeTool;
          } else {
            nextTool = 'edit_boundary';
          }
        }
        return {
          ...state,
          primaryMode: 'build',
          activeTool: nextTool,
        };
      }
      if (event.mode === 'planting') {
        let nextTool: SpaceBuilderTool;
        if (event.tool) {
          nextTool = event.tool;
        } else {
          const plantingTools: SpaceBuilderTool[] = [
            'plant_single',
            'plant_line',
            'plant_fill_sector',
            'place_object',
            'inspect',
          ];
          if (plantingTools.includes(state.activeTool)) {
            nextTool = state.activeTool;
          } else {
            nextTool = 'plant_single';
          }
        }
        return {
          ...state,
          primaryMode: 'planting',
          activeTool: nextTool,
        };
      }
      return state;
    }
    case 'SET_BUILD_SUBMODE': {
      if (event.subMode === 'props') {
        return {
          ...state,
          primaryMode: 'build',
          buildSubMode: 'props',
          activeTool: 'place_object',
        };
      }
      const plantingTools: SpaceBuilderTool[] = [
        'plant_single',
        'plant_line',
        'plant_fill_sector',
      ];
      const shouldResetTool =
        state.activeTool === 'place_object' || plantingTools.includes(state.activeTool);
      return {
        ...state,
        primaryMode: 'build',
        buildSubMode: 'architecture',
        activeTool: shouldResetTool ? 'edit_boundary' : state.activeTool,
      };
    }
    case 'STAGE_PLANT':
      return {
        ...state,
        stagedPlants: [...state.stagedPlants, event.plant],
      };
    case 'STAGE_PLANTS_BATCH':
      return {
        ...state,
        stagedPlants: [...state.stagedPlants, ...event.plants],
      };
    case 'REMOVE_STAGED_PLANT':
      return {
        ...state,
        stagedPlants: state.stagedPlants.filter((p) => p.id !== event.plantId),
        selectedPlantId:
          state.selectedPlantId === event.plantId ? null : state.selectedPlantId,
      };
    case 'UPDATE_STAGED_PLANT':
      return {
        ...state,
        stagedPlants: state.stagedPlants.map((p) =>
          p.id === event.plantId ? { ...p, ...event.patch } : p,
        ),
      };
    case 'CLEAR_STAGED_PLANTS':
      return {
        ...state,
        stagedPlants: [],
      };
    case 'ESCAPE_STEP': {
      if (state.draftStartCm !== null) {
        return {
          ...state,
          draftStartCm: null,
        };
      }
      if (
        state.selectedObjectId !== null ||
        state.selectedPlantId !== null ||
        state.selectedWallId !== null ||
        state.selectedVertexIndex !== null
      ) {
        return {
          ...state,
          selectedObjectId: null,
          selectedPlantId: null,
          selectedWallId: null,
          selectedVertexIndex: null,
        };
      }
      if (state.activeTool !== 'inspect') {
        return {
          ...state,
          activeTool: 'inspect',
        };
      }
      return state;
    }
    case 'SET_TOOL': {
      let nextPrimaryMode = state.primaryMode;
      let nextBuildSubMode = state.buildSubMode;

      const archTools: SpaceBuilderTool[] = [
        'edit_boundary',
        'walls',
        'draw_path',
        'roof',
      ];
      const plantingTools: SpaceBuilderTool[] = [
        'plant_single',
        'plant_line',
        'plant_fill_sector',
      ];

      if (archTools.includes(event.tool)) {
        nextPrimaryMode = 'build';
        nextBuildSubMode = 'architecture';
      } else if (plantingTools.includes(event.tool)) {
        if (state.primaryMode !== 'build') {
          nextPrimaryMode = 'planting';
        }
      } else if (event.tool === 'place_object') {
        if (state.primaryMode !== 'planting') {
          nextPrimaryMode = 'build';
          nextBuildSubMode = 'props';
        }
      }

      return {
        ...state,
        primaryMode: nextPrimaryMode,
        buildSubMode: nextBuildSubMode,
        activeTool: event.tool,
        draftStartCm: null,
        selectedVertexIndex: null,
        selectedWallId: null,
        selectedObjectId: null,
      };
    }
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
    case 'SET_OBJECT_ASSET':
      return {
        ...state,
        selectedObjectAssetId: event.assetId,
      };
    case 'SET_OBJECT_ROTATION':
      return {
        ...state,
        objectRotationDeg: event.rotationDeg,
      };
    case 'SET_OBJECT_ELEVATION':
      return {
        ...state,
        objectElevationM: event.elevationM,
      };
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
        selectedObjectId: event.wallId ? null : state.selectedObjectId,
      };
    case 'SELECT_PLANT':
      return {
        ...state,
        selectedPlantId: event.plantId,
        selectedObjectId: event.plantId ? null : state.selectedObjectId,
      };
    case 'SELECT_OBJECT':
      return {
        ...state,
        selectedObjectId: event.objectId,
        selectedPlantId: event.objectId ? null : state.selectedPlantId,
        selectedWallId: event.objectId ? null : state.selectedWallId,
        selectedVertexIndex: event.objectId ? null : state.selectedVertexIndex,
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
