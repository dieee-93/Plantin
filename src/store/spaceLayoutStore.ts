import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uuidv7 } from 'uuidv7';
import {
  computeSpaceRegions,
  createPerimeterWalls,
  createRectPolygon,
  insertPolygonVertex,
  movePolygonVertex,
  type FloorMaterialType,
  type HardscapeZoneCm,
  type PathStrokeCm,
  type Point2DCm,
  type Polygon2DCm,
  type WallMaterialType,
  type WallSegmentCm,
} from '@/domain/spaceGeometry';
import {
  generateLinePlantPositions,
  generatePolygonFillPlantPositions,
  type PlacedPlantSpatialCm,
  type PolygonFillOptions,
  type SolarSeason,
} from '@/domain/solarAndPlantSpatial';

export interface SpaceSolarConfig {
  latitudeDeg: number;
  northAngleDeg: number;
  season: SolarSeason;
  hourOfDay: number;
}

export interface SpaceLayout1to1 {
  locationId: string;
  presetId: string;
  baseBoundary: Polygon2DCm;
  baseMaterial: FloorMaterialType;
  hardscapeZones: HardscapeZoneCm[];
  paths: PathStrokeCm[];
  walls: WallSegmentCm[];
  solarConfig: SpaceSolarConfig;
  placedPlants: PlacedPlantSpatialCm[];
}

export interface SpacePresetDefinition {
  id: string;
  label: string;
  description: string;
  createLayout: (locationId: string) => SpaceLayout1to1;
}

const DEFAULT_SOLAR_CONFIG: SpaceSolarConfig = {
  latitudeDeg: -34.6,
  northAngleDeg: 0,
  season: 'summer',
  hourOfDay: 12,
};

function getWallMaterialForPreset(
  presetId: string,
  existingWalls?: WallSegmentCm[],
): WallMaterialType {
  if (existingWalls && existingWalls.length > 0) {
    return existingWalls[0].material;
  }
  if (presetId === 'greenhouse_1to1') return 'polycarbonate';
  return 'brick';
}

export const SPACE_PRESETS: Record<string, SpacePresetDefinition> = {
  patio_croquis: {
    id: 'patio_croquis',
    label: 'Croquis Patio (Caminos en Y)',
    description:
      'Patio de 10 × 6 m con playón superior en L, camino diagonal y camino horizontal (3 sectores cultivables)',
    createLayout: (locationId: string): SpaceLayout1to1 => {
      const baseBoundary = createRectPolygon(1000, 600);
      return {
        locationId,
        presetId: 'patio_croquis',
        baseBoundary,
        baseMaterial: 'soil',
        hardscapeZones: [
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
        ],
        paths: [
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
        ],
        walls: createPerimeterWalls(baseBoundary, 200, 'brick'),
        solarConfig: { ...DEFAULT_SOLAR_CONFIG },
        placedPlants: [
          {
            id: 'plant-tomatera-1',
            label: 'Tomatera',
            cropCode: 'tomato',
            xCm: 200,
            yCm: 480,
            canopyRadiusCm: 30,
          },
          {
            id: 'plant-morron-1',
            label: 'Morrón',
            cropCode: 'pepper',
            xCm: 245,
            yCm: 480,
            canopyRadiusCm: 20,
          },
          {
            id: 'plant-lechuga-1',
            label: 'Lechuga',
            cropCode: 'lettuce',
            xCm: 80,
            yCm: 480,
            canopyRadiusCm: 15,
          },
        ],
      };
    },
  },
  greenhouse_1to1: {
    id: 'greenhouse_1to1',
    label: 'Invernadero 1:1',
    description: 'Invernadero de 6 × 12 m con pasillo central de grava de 90 cm y muros de policarbonato',
    createLayout: (locationId: string): SpaceLayout1to1 => {
      const baseBoundary = createRectPolygon(600, 1200);
      return {
        locationId,
        presetId: 'greenhouse_1to1',
        baseBoundary,
        baseMaterial: 'soil',
        hardscapeZones: [],
        paths: [
          {
            id: 'pasillo-central-grava',
            label: 'Pasillo central de grava',
            material: 'gravel',
            points: [
              { x: 300, y: 0 },
              { x: 300, y: 1200 },
            ],
            widthCm: 90,
          },
        ],
        walls: createPerimeterWalls(baseBoundary, 240, 'polycarbonate'),
        solarConfig: { ...DEFAULT_SOLAR_CONFIG },
        placedPlants: [],
      };
    },
  },
  indoor_room_1to1: {
    id: 'indoor_room_1to1',
    label: 'Sala Indoor 1:1',
    description: 'Sala indoor de 4 × 4 m con muros de ladrillo',
    createLayout: (locationId: string): SpaceLayout1to1 => {
      const baseBoundary = createRectPolygon(400, 400);
      return {
        locationId,
        presetId: 'indoor_room_1to1',
        baseBoundary,
        baseMaterial: 'concrete',
        hardscapeZones: [],
        paths: [],
        walls: createPerimeterWalls(baseBoundary, 250, 'brick'),
        solarConfig: { ...DEFAULT_SOLAR_CONFIG },
        placedPlants: [],
      };
    },
  },
  empty_lot_1to1: {
    id: 'empty_lot_1to1',
    label: 'Terreno Vacío',
    description: 'Terreno limpio de 8 × 6 m',
    createLayout: (locationId: string): SpaceLayout1to1 => {
      const baseBoundary = createRectPolygon(800, 600);
      return {
        locationId,
        presetId: 'empty_lot_1to1',
        baseBoundary,
        baseMaterial: 'soil',
        hardscapeZones: [],
        paths: [],
        walls: createPerimeterWalls(baseBoundary, 200, 'brick'),
        solarConfig: { ...DEFAULT_SOLAR_CONFIG },
        placedPlants: [],
      };
    },
  },
};

function resolveDefaultPresetId(locationType?: string, presetId?: string): string {
  if (presetId && SPACE_PRESETS[presetId]) return presetId;
  if (locationType === 'greenhouse') return 'greenhouse_1to1';
  if (locationType === 'indoor') return 'indoor_room_1to1';
  return 'patio_croquis';
}

export interface PlantTemplateInput {
  label: string;
  cropCode?: string;
  canopyRadiusCm: number;
}

export interface SpaceLayoutStoreState {
  layouts: Record<string, SpaceLayout1to1>;
  getOrCreateSpaceLayout: (
    locationId: string,
    locationType?: string,
    presetId?: string,
  ) => SpaceLayout1to1;
  applyPreset: (locationId: string, presetId: string) => void;
  setBaseBoundary: (locationId: string, boundary: Polygon2DCm) => void;
  moveBoundaryVertex: (
    locationId: string,
    vertexIndex: number,
    newPoint: Point2DCm,
    snapCm?: number,
  ) => void;
  insertBoundaryVertex: (locationId: string, edgeIndex: number, point: Point2DCm) => void;
  addPathStroke: (
    locationId: string,
    path: Omit<PathStrokeCm, 'id'> & { id?: string },
  ) => void;
  removePathStroke: (locationId: string, pathId: string) => void;
  addHardscapeZone: (
    locationId: string,
    zone: Omit<HardscapeZoneCm, 'id'> & { id?: string },
  ) => void;
  removeHardscapeZone: (locationId: string, zoneId: string) => void;
  updateSolarConfig: (locationId: string, partial: Partial<SpaceSolarConfig>) => void;
  placePlant: (
    locationId: string,
    plant: Omit<PlacedPlantSpatialCm, 'id'> & { id?: string },
  ) => string;
  movePlant: (locationId: string, plantId: string, xCm: number, yCm: number) => void;
  removePlant: (locationId: string, plantId: string) => void;
  placePlantLine: (
    locationId: string,
    start: Point2DCm,
    end: Point2DCm,
    spacingCm: number,
    plantTemplate: PlantTemplateInput,
  ) => number;
  fillCultivableSector: (
    locationId: string,
    sectorIndex: number,
    options: PolygonFillOptions,
    plantTemplate: PlantTemplateInput,
  ) => number;
  resetAll: () => void;
}

export const useSpaceLayoutStore = create<SpaceLayoutStoreState>()(
  persist(
    (set, get) => ({
      layouts: {},

      getOrCreateSpaceLayout: (locationId, locationType, presetId) => {
        const existing = get().layouts[locationId];
        if (existing) {
          return existing;
        }
        const resolvedPresetId = resolveDefaultPresetId(locationType, presetId);
        const preset = SPACE_PRESETS[resolvedPresetId] ?? SPACE_PRESETS.patio_croquis;
        const created = preset.createLayout(locationId);
        set((state) => ({
          layouts: {
            ...state.layouts,
            [locationId]: created,
          },
        }));
        return created;
      },

      applyPreset: (locationId, presetId) => {
        const preset = SPACE_PRESETS[presetId];
        if (!preset) return;
        const nextLayout = preset.createLayout(locationId);
        set((state) => ({
          layouts: {
            ...state.layouts,
            [locationId]: nextLayout,
          },
        }));
      },

      setBaseBoundary: (locationId, boundary) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        const wallMaterial = getWallMaterialForPreset(current.presetId, current.walls);
        const wallHeight = current.walls[0]?.heightCm ?? 200;
        set((state) => ({
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              baseBoundary: boundary,
              walls: createPerimeterWalls(boundary, wallHeight, wallMaterial),
            },
          },
        }));
      },

      moveBoundaryVertex: (locationId, vertexIndex, newPoint, snapCm = 1) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        const nextBoundary = movePolygonVertex(
          current.baseBoundary,
          vertexIndex,
          newPoint,
          snapCm,
        );
        const wallMaterial = getWallMaterialForPreset(current.presetId, current.walls);
        const wallHeight = current.walls[0]?.heightCm ?? 200;
        set((state) => ({
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              baseBoundary: nextBoundary,
              walls: createPerimeterWalls(nextBoundary, wallHeight, wallMaterial),
            },
          },
        }));
      },

      insertBoundaryVertex: (locationId, edgeIndex, point) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        const nextBoundary = insertPolygonVertex(current.baseBoundary, edgeIndex, point);
        const wallMaterial = getWallMaterialForPreset(current.presetId, current.walls);
        const wallHeight = current.walls[0]?.heightCm ?? 200;
        set((state) => ({
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              baseBoundary: nextBoundary,
              walls: createPerimeterWalls(nextBoundary, wallHeight, wallMaterial),
            },
          },
        }));
      },

      addPathStroke: (locationId, path) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        const newPath: PathStrokeCm = {
          ...path,
          id: path.id ?? `path-${uuidv7()}`,
        };
        set((state) => ({
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              paths: [...current.paths, newPath],
            },
          },
        }));
      },

      removePathStroke: (locationId, pathId) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        set((state) => ({
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              paths: current.paths.filter((p) => p.id !== pathId),
            },
          },
        }));
      },

      addHardscapeZone: (locationId, zone) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        const newZone: HardscapeZoneCm = {
          ...zone,
          id: zone.id ?? `zone-${uuidv7()}`,
        };
        set((state) => ({
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              hardscapeZones: [...current.hardscapeZones, newZone],
            },
          },
        }));
      },

      removeHardscapeZone: (locationId, zoneId) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        set((state) => ({
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              hardscapeZones: current.hardscapeZones.filter((z) => z.id !== zoneId),
            },
          },
        }));
      },

      updateSolarConfig: (locationId, partial) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        set((state) => ({
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              solarConfig: {
                ...current.solarConfig,
                ...partial,
              },
            },
          },
        }));
      },

      placePlant: (locationId, plant) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        const id = plant.id ?? `plant-${uuidv7()}`;
        const newPlant: PlacedPlantSpatialCm = {
          ...plant,
          id,
        };
        set((state) => ({
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              placedPlants: [...current.placedPlants, newPlant],
            },
          },
        }));
        return id;
      },

      movePlant: (locationId, plantId, xCm, yCm) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        set((state) => ({
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              placedPlants: current.placedPlants.map((p) =>
                p.id === plantId ? { ...p, xCm: Math.round(xCm), yCm: Math.round(yCm) } : p,
              ),
            },
          },
        }));
      },

      removePlant: (locationId, plantId) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        set((state) => ({
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              placedPlants: current.placedPlants.filter((p) => p.id !== plantId),
            },
          },
        }));
      },

      placePlantLine: (locationId, start, end, spacingCm, plantTemplate) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        const regions = computeSpaceRegions(
          current.baseBoundary,
          current.hardscapeZones,
          current.paths,
        );
        const positions = generateLinePlantPositions(start, end, spacingCm, regions);
        if (positions.length === 0) return 0;

        const addedPlants: PlacedPlantSpatialCm[] = positions.map((pt, idx) => ({
          id: `plant-${uuidv7()}-${idx}`,
          label: plantTemplate.label,
          cropCode: plantTemplate.cropCode,
          xCm: pt.x,
          yCm: pt.y,
          canopyRadiusCm: plantTemplate.canopyRadiusCm,
        }));

        set((state) => ({
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              placedPlants: [...current.placedPlants, ...addedPlants],
            },
          },
        }));

        return addedPlants.length;
      },

      fillCultivableSector: (locationId, sectorIndex, options, plantTemplate) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        const regions = computeSpaceRegions(
          current.baseBoundary,
          current.hardscapeZones,
          current.paths,
        );
        const targetPolygon = regions.cultivablePolygons[sectorIndex];
        if (!targetPolygon) return 0;

        const positions = generatePolygonFillPlantPositions(targetPolygon, options);
        if (positions.length === 0) return 0;

        const addedPlants: PlacedPlantSpatialCm[] = positions.map((pt, idx) => ({
          id: `plant-${uuidv7()}-${idx}`,
          label: plantTemplate.label,
          cropCode: plantTemplate.cropCode,
          xCm: pt.x,
          yCm: pt.y,
          canopyRadiusCm: plantTemplate.canopyRadiusCm,
        }));

        set((state) => ({
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              placedPlants: [...current.placedPlants, ...addedPlants],
            },
          },
        }));

        return addedPlants.length;
      },

      resetAll: () => {
        set({ layouts: {} });
      },
    }),
    {
      name: 'plantin-space-layout-v1',
      version: 1,
    },
  ),
);
