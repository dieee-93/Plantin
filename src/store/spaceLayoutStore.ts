import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { uuidv7 } from 'uuidv7';
import {
  canInsertVertexAtEdge,
  computeSpaceRegions,
  createPerimeterWalls,
  createRectPolygon,
  insertPolygonVertex,
  movePolygonVertex,
  removePolygonVertex,
  sanitizeAndWeldPolygon,
  scalePolygonFromCenter,
  syncWallsWithBoundary,
  wouldPolygonSelfIntersect,
  type FloorMaterialType,
  type HardscapeZoneCm,
  type PathStrokeCm,
  type Point2DCm,
  type Polygon2DCm,
  type WallMaterialType,
  type WallOpeningCm,
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

export type RoofKind =
  | 'none'
  | 'gabled_greenhouse'
  | 'flat_ceiling'
  | 'shade_cloth';

export interface SpaceRoofConfig {
  kind: RoofKind;
  heightCm?: number;
  material?: 'polycarbonate' | 'glass' | 'concrete' | 'shade_mesh';
  hasGrowLights?: boolean;
}

export interface PlacedObjectSpatialCm {
  id: string;
  assetId: string;
  modelUrl?: string;
  thumbnailUrl?: string;
  label: string;
  xCm: number;
  yCm: number;
  widthCm?: number;
  depthCm?: number;
  heightCm?: number;
  elevationM?: number;
  rotationDeg?: number;
  category?: 'logistics' | 'cultivation_container' | 'mep' | 'botanical' | string;
}

export interface SpaceLayout1to1 {
  locationId: string;
  presetId: string;
  baseBoundary: Polygon2DCm;
  baseMaterial: FloorMaterialType;
  hardscapeZones: HardscapeZoneCm[];
  paths: PathStrokeCm[];
  walls: WallSegmentCm[];
  roofConfig?: SpaceRoofConfig;
  solarConfig: SpaceSolarConfig;
  placedPlants: PlacedPlantSpatialCm[];
  placedObjects?: PlacedObjectSpatialCm[];
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
        placedObjects: [
          {
            id: 'obj-pallet-1',
            assetId: 'pallet_standard_wood_a01',
            label: 'Palet de Madera',
            xCm: 850,
            yCm: 100,
            widthCm: 120,
            depthCm: 80,
            heightCm: 21,
            elevationM: 0,
            rotationDeg: 0,
            category: 'logistics',
          },
          {
            id: 'obj-crate-stacked-1',
            assetId: 'crate_harvest_plastic_green_a01',
            label: 'Caja de Cosecha Verde (Apilada)',
            xCm: 850,
            yCm: 100,
            widthCm: 60,
            depthCm: 40,
            heightCm: 25,
            elevationM: 0.209,
            rotationDeg: 0,
            category: 'logistics',
          },
          {
            id: 'obj-crate-floor-2',
            assetId: 'crate_harvest_plastic_green_a01',
            label: 'Caja de Cosecha Verde',
            xCm: 760,
            yCm: 100,
            widthCm: 60,
            depthCm: 40,
            heightCm: 25,
            elevationM: 0,
            rotationDeg: 90,
            category: 'logistics',
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
        roofConfig: {
          kind: 'gabled_greenhouse',
          heightCm: 140,
          material: 'polycarbonate',
        },
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
        roofConfig: {
          kind: 'flat_ceiling',
          heightCm: 0,
          material: 'concrete',
          hasGrowLights: true,
        },
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
        walls: createPerimeterWalls(baseBoundary, 0, 'wire_fence'),
        solarConfig: { ...DEFAULT_SOLAR_CONFIG },
        placedPlants: [],
      };
    },
  },
};

function resolveDefaultPresetId(locationType?: string, presetId?: string): string {
  if (presetId && SPACE_PRESETS[presetId]) return presetId;
  if (locationType === 'greenhouse') return 'greenhouse_1to1';
  if (
    locationType === 'indoor' ||
    locationType === 'room' ||
    locationType === 'growth_chamber' ||
    locationType === 'lab'
  ) {
    return 'indoor_room_1to1';
  }
  if (locationType === 'field') return 'empty_lot_1to1';
  return 'patio_croquis';
}

export interface PlantTemplateInput {
  label: string;
  cropCode?: string;
  canopyRadiusCm: number;
}

export interface StructuralHistoryEntry {
  type: 'structural';
  locationId: string;
  presetId: string;
  baseBoundary: Polygon2DCm;
  baseMaterial: FloorMaterialType;
  hardscapeZones: HardscapeZoneCm[];
  paths: PathStrokeCm[];
  walls: WallSegmentCm[];
  roofConfig?: SpaceRoofConfig;
  solarConfig: SpaceSolarConfig;
  placedPlants?: PlacedPlantSpatialCm[];
  placedObjects?: PlacedObjectSpatialCm[];
}

export interface PlantAddDeltaEntry {
  type: 'plant_add';
  plant: PlacedPlantSpatialCm;
  baseBoundary?: undefined;
}

export interface PlantRemoveDeltaEntry {
  type: 'plant_remove';
  plant: PlacedPlantSpatialCm;
  index?: number;
  baseBoundary?: undefined;
}

export interface PlantMoveDeltaEntry {
  type: 'plant_move';
  plantId: string;
  prevX: number;
  prevY: number;
  nextX: number;
  nextY: number;
  baseBoundary?: undefined;
}

export interface PlantBatchAddDeltaEntry {
  type: 'plant_batch_add';
  plants: PlacedPlantSpatialCm[];
  baseBoundary?: undefined;
}

export type SpaceLayoutHistoryEntry =
  | StructuralHistoryEntry
  | PlantAddDeltaEntry
  | PlantRemoveDeltaEntry
  | PlantMoveDeltaEntry
  | PlantBatchAddDeltaEntry;

export interface SpaceLayoutHistory {
  past: SpaceLayoutHistoryEntry[];
  future: SpaceLayoutHistoryEntry[];
}

const MAX_HISTORY_STEPS = 50;

function cloneStructuralSnapshot(
  layout: SpaceLayout1to1,
  includePlants = false,
): StructuralHistoryEntry {
  return {
    type: 'structural',
    locationId: layout.locationId,
    presetId: layout.presetId,
    baseBoundary: structuredClone(layout.baseBoundary),
    baseMaterial: layout.baseMaterial,
    hardscapeZones: structuredClone(layout.hardscapeZones),
    paths: structuredClone(layout.paths),
    walls: structuredClone(layout.walls),
    roofConfig: layout.roofConfig ? structuredClone(layout.roofConfig) : undefined,
    solarConfig: { ...layout.solarConfig },
    placedPlants: includePlants ? structuredClone(layout.placedPlants) : undefined,
    placedObjects: layout.placedObjects ? structuredClone(layout.placedObjects) : undefined,
  };
}

function pushHistoryEntry(
  locationId: string,
  entry: SpaceLayoutHistoryEntry,
  historyMap: Record<string, SpaceLayoutHistory> | undefined,
): Record<string, SpaceLayoutHistory> {
  const currentHistory = (historyMap ?? {})[locationId] ?? { past: [], future: [] };
  const newPast = [...currentHistory.past, entry];
  if (newPast.length > MAX_HISTORY_STEPS) {
    newPast.shift();
  }
  return {
    ...(historyMap ?? {}),
    [locationId]: {
      past: newPast,
      future: [],
    },
  };
}

function pushStructuralSnapshot(
  locationId: string,
  currentLayout: SpaceLayout1to1,
  historyMap: Record<string, SpaceLayoutHistory> | undefined,
  includePlants = false,
): Record<string, SpaceLayoutHistory> {
  return pushHistoryEntry(
    locationId,
    cloneStructuralSnapshot(currentLayout, includePlants),
    historyMap,
  );
}

export interface SpaceLayoutStoreState {
  layouts: Record<string, SpaceLayout1to1>;
  history: Record<string, SpaceLayoutHistory>;
  getOrCreateSpaceLayout: (
    locationId: string,
    locationType?: string,
    presetId?: string,
  ) => SpaceLayout1to1;
  applyPreset: (locationId: string, presetId: string) => void;
  setBaseBoundary: (locationId: string, boundary: Polygon2DCm) => void;
  setBaseMaterial: (locationId: string, material: FloorMaterialType) => void;
  snapshotHistory: (locationId: string) => void;
  moveBoundaryVertex: (
    locationId: string,
    vertexIndex: number,
    newPoint: Point2DCm,
    snapCm?: number,
    recordHistory?: boolean,
  ) => void;
  insertBoundaryVertex: (locationId: string, edgeIndex: number, point: Point2DCm) => void;
  removeBoundaryVertex: (locationId: string, vertexIndex: number) => void;
  sanitizeBoundary: (locationId: string) => void;
  scaleBoundary: (locationId: string, factor: number) => void;
  updateWall: (
    locationId: string,
    wallId: string,
    partial: Partial<Pick<WallSegmentCm, 'heightCm' | 'material' | 'thicknessCm'>>,
  ) => void;
  addWallOpening: (
    locationId: string,
    wallId: string,
    opening: Omit<WallOpeningCm, 'id'> & { id?: string },
  ) => void;
  removeWallOpening: (
    locationId: string,
    wallId: string,
    openingId: string,
  ) => void;
  updateWallOpening: (
    locationId: string,
    wallId: string,
    openingId: string,
    partial: Partial<Omit<WallOpeningCm, 'id'>>,
  ) => void;
  updateRoofConfig: (
    locationId: string,
    partial: Partial<SpaceRoofConfig>,
  ) => void;
  setAllWallsHeight: (locationId: string, heightCm: number) => void;
  setAllWallsMaterial: (locationId: string, material: WallMaterialType) => void;
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
  placeObject: (
    locationId: string,
    objectData: Omit<PlacedObjectSpatialCm, 'id'> & { id?: string },
  ) => string;
  updateObject: (
    locationId: string,
    objectId: string,
    patch: Partial<PlacedObjectSpatialCm>,
  ) => void;
  removeObject: (locationId: string, objectId: string) => void;
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
  undo: (locationId: string) => void;
  redo: (locationId: string) => void;
  canUndo: (locationId: string) => boolean;
  canRedo: (locationId: string) => boolean;
  clearHistory: (locationId: string) => void;
  resetAll: () => void;
}

export interface PersistedSpaceLayoutState {
  layouts: Record<string, SpaceLayout1to1>;
}

function isIndexedDBAvailable(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof indexedDB !== 'undefined' &&
      indexedDB !== null &&
      typeof indexedDB.open === 'function'
    );
  } catch {
    return false;
  }
}

const activeFlushFunctions = new Set<() => Promise<void>>();

export async function flushSpaceLayoutStorage(): Promise<void> {
  await Promise.all(Array.from(activeFlushFunctions).map((fn) => fn()));
}

export interface DebouncedPersistStorage<S> extends PersistStorage<S> {
  flush: (key?: string) => Promise<void>;
}

export function createDebouncedPersistStorage(
  delayMs = 400,
): DebouncedPersistStorage<PersistedSpaceLayoutState> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const pendingWrites = new Map<string, StorageValue<PersistedSpaceLayoutState>>();
  const memoryFallback = new Map<string, StorageValue<PersistedSpaceLayoutState>>();

  const flush = async (key?: string): Promise<void> => {
    if (key) {
      const val = pendingWrites.get(key);
      if (val !== undefined) {
        pendingWrites.delete(key);
        if (isIndexedDBAvailable()) {
          try {
            await idbSet(key, val);
          } catch (e) {
            console.warn('[spaceLayoutStore] idb-keyval setItem error:', e);
            if (typeof window !== 'undefined' && window.localStorage) {
              try {
                window.localStorage.setItem(key, JSON.stringify(val));
              } catch (lsErr) {
                console.warn('[spaceLayoutStore] localStorage fallback error:', lsErr);
              }
            }
          }
        } else if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.setItem(key, JSON.stringify(val));
          } catch (lsErr) {
            console.warn('[spaceLayoutStore] localStorage fallback error:', lsErr);
          }
        }
      }
    } else {
      const entries = Array.from(pendingWrites.entries());
      pendingWrites.clear();
      for (const [k, val] of entries) {
        if (isIndexedDBAvailable()) {
          try {
            await idbSet(k, val);
          } catch (e) {
            console.warn('[spaceLayoutStore] idb-keyval setItem error:', e);
            if (typeof window !== 'undefined' && window.localStorage) {
              try {
                window.localStorage.setItem(k, JSON.stringify(val));
              } catch (lsErr) {
                console.warn('[spaceLayoutStore] localStorage fallback error:', lsErr);
              }
            }
          }
        } else if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.setItem(k, JSON.stringify(val));
          } catch (lsErr) {
            console.warn('[spaceLayoutStore] localStorage fallback error:', lsErr);
          }
        }
      }
    }
  };

  const instanceFlush = async (): Promise<void> => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    await flush();
  };

  activeFlushFunctions.add(instanceFlush);

  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('beforeunload', () => {
      void instanceFlush();
    });
  }

  return {
    flush: instanceFlush,
    getItem: async (name: string): Promise<StorageValue<PersistedSpaceLayoutState> | null> => {
      if (pendingWrites.has(name)) {
        return pendingWrites.get(name)!;
      }

      // 1. Intentar leer de IndexedDB
      if (isIndexedDBAvailable()) {
        try {
          const idbVal = await idbGet<StorageValue<PersistedSpaceLayoutState>>(name);
          if (idbVal !== undefined && idbVal !== null) {
            memoryFallback.set(name, idbVal);
            return idbVal;
          }
        } catch (e) {
          console.warn('[spaceLayoutStore] idb-keyval getItem error:', e);
        }
      }

      // 2. Auto-migración desde localStorage si no hay en IndexedDB
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const raw = window.localStorage.getItem(name);
          if (raw) {
            const data = JSON.parse(raw) as StorageValue<PersistedSpaceLayoutState>;
            memoryFallback.set(name, data);
            // Guardar inmediatamente en IndexedDB
            if (isIndexedDBAvailable()) {
              try {
                await idbSet(name, data);
                // Limpiar localStorage para liberar los 5 MB
                window.localStorage.removeItem(name);
              } catch (e) {
                console.warn('[spaceLayoutStore] idb-keyval setItem migration error:', e);
              }
            }
            return data;
          }
        } catch (e) {
          console.warn('[spaceLayoutStore] localStorage migration parse error:', e);
        }
      }

      // 3. Fallback a memoria
      return memoryFallback.get(name) ?? null;
    },
    setItem: (name: string, value: StorageValue<PersistedSpaceLayoutState>): void => {
      pendingWrites.set(name, value);
      memoryFallback.set(name, value);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void flush(name);
        timer = null;
      }, delayMs);
    },
    removeItem: async (name: string): Promise<void> => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      pendingWrites.delete(name);
      memoryFallback.delete(name);
      if (isIndexedDBAvailable()) {
        try {
          await idbDel(name);
        } catch (e) {
          console.warn('[spaceLayoutStore] idb-keyval removeItem error:', e);
        }
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.removeItem(name);
        } catch {
          // ignore
        }
      }
    },
  };
}

const debouncedPersistStorage = createDebouncedPersistStorage(400);

export const useSpaceLayoutStore = create<SpaceLayoutStoreState>()(
  persist(
    (set, get) => ({
      layouts: {},
      history: {},

      getOrCreateSpaceLayout: (locationId, locationType, presetId) => {
        const existing = get().layouts[locationId];
        if (existing) {
          // Auto-heal corrupt layouts with degenerate clustered vertices (> 8 vertices)
          if (existing.baseBoundary && existing.baseBoundary.length > 8) {
            const sanitized = sanitizeAndWeldPolygon(existing.baseBoundary, 40);
            if (sanitized.length < existing.baseBoundary.length) {
              const wallMaterial = getWallMaterialForPreset(existing.presetId, existing.walls);
              const wallHeight = existing.walls[0]?.heightCm ?? 200;
              const healed = {
                ...existing,
                baseBoundary: sanitized,
                walls: syncWallsWithBoundary(sanitized, existing.walls, wallHeight, wallMaterial),
              };
              set((state) => ({
                layouts: {
                  ...state.layouts,
                  [locationId]: healed,
                },
              }));
              return healed;
            }
          }
          if (existing.presetId === 'patio_croquis' && (!existing.placedObjects || existing.placedObjects.length === 0)) {
            const defaultPatio = SPACE_PRESETS.patio_croquis.createLayout(locationId);
            existing.placedObjects = defaultPatio.placedObjects;
          }
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
        const current = get().getOrCreateSpaceLayout(locationId);
        const nextLayout = preset.createLayout(locationId);
        set((state) => ({
          history: pushStructuralSnapshot(locationId, current, state.history, true),
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
          history: pushStructuralSnapshot(locationId, current, state.history),
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              baseBoundary: boundary,
              walls: syncWallsWithBoundary(boundary, current.walls, wallHeight, wallMaterial),
            },
          },
        }));
      },

      setBaseMaterial: (locationId, material) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        set((state) => ({
          history: pushStructuralSnapshot(locationId, current, state.history),
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              baseMaterial: material,
            },
          },
        }));
      },

      snapshotHistory: (locationId) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        set((state) => ({
          history: pushStructuralSnapshot(locationId, current, state.history),
        }));
      },

      moveBoundaryVertex: (
        locationId,
        vertexIndex,
        newPoint,
        snapCm = 1,
        recordHistory = true,
      ) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        // Prevent moving into a self-intersecting polygon (hourglass/bow-tie)
        if (wouldPolygonSelfIntersect(current.baseBoundary, vertexIndex, newPoint)) {
          return;
        }
        const nextBoundary = movePolygonVertex(
          current.baseBoundary,
          vertexIndex,
          newPoint,
          snapCm,
        );
        const wallMaterial = getWallMaterialForPreset(current.presetId, current.walls);
        const wallHeight = current.walls[0]?.heightCm ?? 200;
        set((state) => ({
          history: recordHistory
            ? pushStructuralSnapshot(locationId, current, state.history)
            : state.history,
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              baseBoundary: nextBoundary,
              walls: syncWallsWithBoundary(nextBoundary, current.walls, wallHeight, wallMaterial),
            },
          },
        }));
      },

      insertBoundaryVertex: (locationId, edgeIndex, point) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        if (!canInsertVertexAtEdge(current.baseBoundary, edgeIndex, point)) {
          return;
        }
        const nextBoundary = insertPolygonVertex(current.baseBoundary, edgeIndex, point);
        const wallMaterial = getWallMaterialForPreset(current.presetId, current.walls);
        const wallHeight = current.walls[0]?.heightCm ?? 200;
        set((state) => ({
          history: pushStructuralSnapshot(locationId, current, state.history),
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              baseBoundary: nextBoundary,
              walls: syncWallsWithBoundary(nextBoundary, current.walls, wallHeight, wallMaterial),
            },
          },
        }));
      },

      sanitizeBoundary: (locationId) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        const sanitized = sanitizeAndWeldPolygon(current.baseBoundary, 40);
        if (sanitized.length === current.baseBoundary.length) return;
        const wallMaterial = getWallMaterialForPreset(current.presetId, current.walls);
        const wallHeight = current.walls[0]?.heightCm ?? 200;
        set((state) => ({
          history: pushStructuralSnapshot(locationId, current, state.history),
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              baseBoundary: sanitized,
              walls: syncWallsWithBoundary(sanitized, current.walls, wallHeight, wallMaterial),
            },
          },
        }));
      },

      removeBoundaryVertex: (locationId, vertexIndex) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        if (current.baseBoundary.length <= 3) return;
        const nextBoundary = removePolygonVertex(current.baseBoundary, vertexIndex);
        const wallMaterial = getWallMaterialForPreset(current.presetId, current.walls);
        const wallHeight = current.walls[0]?.heightCm ?? 200;
        set((state) => ({
          history: pushStructuralSnapshot(locationId, current, state.history),
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              baseBoundary: nextBoundary,
              walls: syncWallsWithBoundary(nextBoundary, current.walls, wallHeight, wallMaterial),
            },
          },
        }));
      },

      scaleBoundary: (locationId, factor) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        const nextBoundary = scalePolygonFromCenter(current.baseBoundary, factor);
        const wallMaterial = getWallMaterialForPreset(current.presetId, current.walls);
        const wallHeight = current.walls[0]?.heightCm ?? 200;
        set((state) => ({
          history: pushStructuralSnapshot(locationId, current, state.history),
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              baseBoundary: nextBoundary,
              walls: syncWallsWithBoundary(nextBoundary, current.walls, wallHeight, wallMaterial),
            },
          },
        }));
      },

      updateWall: (locationId, wallId, partial) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        set((state) => ({
          history: pushStructuralSnapshot(locationId, current, state.history),
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              walls: current.walls.map((w) =>
                w.id === wallId ? { ...w, ...partial } : w,
              ),
            },
          },
        }));
      },

      addWallOpening: (locationId, wallId, opening) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        const newOpening: WallOpeningCm = {
          ...opening,
          id: opening.id ?? `opening-${uuidv7()}`,
        };
        set((state) => ({
          history: pushStructuralSnapshot(locationId, current, state.history),
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              walls: current.walls.map((w) =>
                w.id === wallId
                  ? { ...w, openings: [...(w.openings ?? []), newOpening] }
                  : w,
              ),
            },
          },
        }));
      },

      removeWallOpening: (locationId, wallId, openingId) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        set((state) => ({
          history: pushStructuralSnapshot(locationId, current, state.history),
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              walls: current.walls.map((w) =>
                w.id === wallId
                  ? {
                      ...w,
                      openings: (w.openings ?? []).filter((op) => op.id !== openingId),
                    }
                  : w,
              ),
            },
          },
        }));
      },

      updateWallOpening: (locationId, wallId, openingId, partial) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        set((state) => ({
          history: pushStructuralSnapshot(locationId, current, state.history),
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              walls: current.walls.map((w) =>
                w.id === wallId
                  ? {
                      ...w,
                      openings: (w.openings ?? []).map((op) =>
                        op.id === openingId ? { ...op, ...partial } : op,
                      ),
                    }
                  : w,
              ),
            },
          },
        }));
      },

      updateRoofConfig: (locationId, partial) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        const nextRoof: SpaceRoofConfig = {
          kind: current.roofConfig?.kind ?? 'none',
          ...current.roofConfig,
          ...partial,
        };
        set((state) => ({
          history: pushStructuralSnapshot(locationId, current, state.history),
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              roofConfig: nextRoof,
            },
          },
        }));
      },

      setAllWallsHeight: (locationId, heightCm) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        set((state) => ({
          history: pushStructuralSnapshot(locationId, current, state.history),
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              walls: current.walls.map((w) => ({
                ...w,
                heightCm: Math.max(0, Math.round(heightCm)),
              })),
            },
          },
        }));
      },

      setAllWallsMaterial: (locationId, material) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        set((state) => ({
          history: pushStructuralSnapshot(locationId, current, state.history),
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              walls: current.walls.map((w) => ({
                ...w,
                material,
              })),
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
          history: pushStructuralSnapshot(locationId, current, state.history),
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
          history: pushStructuralSnapshot(locationId, current, state.history),
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
          history: pushStructuralSnapshot(locationId, current, state.history),
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
          history: pushStructuralSnapshot(locationId, current, state.history),
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
          history: pushHistoryEntry(
            locationId,
            { type: 'plant_add', plant: newPlant },
            state.history,
          ),
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

      placeObject: (locationId, objectData) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        const id = objectData.id ?? `obj-${uuidv7()}`;
        const newObj: PlacedObjectSpatialCm = {
          ...objectData,
          id,
        };
        set((state) => ({
          history: pushStructuralSnapshot(locationId, current, state.history, true),
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              placedObjects: [...(current.placedObjects ?? []), newObj],
            },
          },
        }));
        return id;
      },

      updateObject: (locationId, objectId, patch) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        if (!current.placedObjects) return;
        const targetIndex = current.placedObjects.findIndex((o) => o.id === objectId);
        if (targetIndex === -1) return;
        const updated = { ...current.placedObjects[targetIndex], ...patch };
        const nextList = current.placedObjects.slice();
        nextList[targetIndex] = updated;
        set((state) => ({
          history: pushStructuralSnapshot(locationId, current, state.history, true),
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              placedObjects: nextList,
            },
          },
        }));
      },

      removeObject: (locationId, objectId) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        if (!current.placedObjects) return;
        set((state) => ({
          history: pushStructuralSnapshot(locationId, current, state.history, true),
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              placedObjects: (current.placedObjects ?? []).filter((o) => o.id !== objectId),
            },
          },
        }));
      },

      movePlant: (locationId, plantId, xCm, yCm) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        const targetIndex = current.placedPlants.findIndex((p) => p.id === plantId);
        if (targetIndex === -1) return;
        const target = current.placedPlants[targetIndex];
        const roundedX = Math.round(xCm);
        const roundedY = Math.round(yCm);
        if (target.xCm === roundedX && target.yCm === roundedY) return;

        const prevX = target.xCm;
        const prevY = target.yCm;
        const updatedPlant = { ...target, xCm: roundedX, yCm: roundedY };
        const nextPlants = current.placedPlants.slice();
        nextPlants[targetIndex] = updatedPlant;

        set((state) => ({
          history: pushHistoryEntry(
            locationId,
            { type: 'plant_move', plantId, prevX, prevY, nextX: roundedX, nextY: roundedY },
            state.history,
          ),
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              placedPlants: nextPlants,
            },
          },
        }));
      },

      removePlant: (locationId, plantId) => {
        const current = get().getOrCreateSpaceLayout(locationId);
        const index = current.placedPlants.findIndex((p) => p.id === plantId);
        if (index === -1) return;
        const plantToRemove = current.placedPlants[index];
        const nextPlants = current.placedPlants.slice();
        nextPlants.splice(index, 1);

        set((state) => ({
          history: pushHistoryEntry(
            locationId,
            { type: 'plant_remove', plant: plantToRemove, index },
            state.history,
          ),
          layouts: {
            ...state.layouts,
            [locationId]: {
              ...current,
              placedPlants: nextPlants,
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
          history: pushHistoryEntry(
            locationId,
            { type: 'plant_batch_add', plants: addedPlants },
            state.history,
          ),
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
        const targetSector = regions.cultivableSectors?.[sectorIndex];
        const targetPolygon = targetSector?.outer ?? regions.cultivablePolygons[sectorIndex];
        if (!targetPolygon) return 0;
        const holes = targetSector?.holes ?? [];

        const minSeparationCm =
          options.minSeparationCm !== undefined
            ? options.minSeparationCm
            : Math.max(10, Math.min(options.plantSpacingCm, options.rowSpacingCm) * 0.7);

        const positions = generatePolygonFillPlantPositions(targetPolygon, {
          ...options,
          holes,
          existingPlants: options.existingPlants ?? current.placedPlants,
          minSeparationCm,
        });
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
          history: pushHistoryEntry(
            locationId,
            { type: 'plant_batch_add', plants: addedPlants },
            state.history,
          ),
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

      canUndo: (locationId) => {
        const locHist = (get().history ?? {})[locationId];
        return Boolean(locHist && locHist.past.length > 0);
      },

      canRedo: (locationId) => {
        const locHist = (get().history ?? {})[locationId];
        return Boolean(locHist && locHist.future.length > 0);
      },

      undo: (locationId) => {
        const historyMap = get().history ?? {};
        const locHist = historyMap[locationId];
        if (!locHist || locHist.past.length === 0) return;
        const current = get().layouts[locationId] ?? get().getOrCreateSpaceLayout(locationId);

        const command = locHist.past[locHist.past.length - 1];
        const newPast = locHist.past.slice(0, -1);

        let nextLayout: SpaceLayout1to1;
        let redoCommand: SpaceLayoutHistoryEntry;

        switch (command.type) {
          case 'plant_add': {
            const targetId = command.plant.id;
            nextLayout = {
              ...current,
              placedPlants: current.placedPlants.filter((p) => p.id !== targetId),
            };
            redoCommand = command;
            break;
          }
          case 'plant_remove': {
            const restoredPlants = current.placedPlants.slice();
            if (
              typeof command.index === 'number' &&
              command.index >= 0 &&
              command.index <= restoredPlants.length
            ) {
              restoredPlants.splice(command.index, 0, command.plant);
            } else {
              restoredPlants.push(command.plant);
            }
            nextLayout = {
              ...current,
              placedPlants: restoredPlants,
            };
            redoCommand = command;
            break;
          }
          case 'plant_move': {
            nextLayout = {
              ...current,
              placedPlants: current.placedPlants.map((p) =>
                p.id === command.plantId ? { ...p, xCm: command.prevX, yCm: command.prevY } : p,
              ),
            };
            redoCommand = command;
            break;
          }
          case 'plant_batch_add': {
            const idsToRemove = new Set(command.plants.map((p) => p.id));
            nextLayout = {
              ...current,
              placedPlants: current.placedPlants.filter((p) => !idsToRemove.has(p.id)),
            };
            redoCommand = command;
            break;
          }
          default: {
            const structuralCmd = command as StructuralHistoryEntry;
            redoCommand = cloneStructuralSnapshot(current, structuralCmd.placedPlants !== undefined);
            nextLayout = {
              ...current,
              presetId: structuralCmd.presetId ?? current.presetId,
              baseBoundary: structuredClone(structuralCmd.baseBoundary ?? current.baseBoundary),
              baseMaterial: structuralCmd.baseMaterial ?? current.baseMaterial,
              hardscapeZones: structuredClone(structuralCmd.hardscapeZones ?? current.hardscapeZones),
              paths: structuredClone(structuralCmd.paths ?? current.paths),
              walls: structuredClone(structuralCmd.walls ?? current.walls),
              roofConfig: structuralCmd.roofConfig ? structuredClone(structuralCmd.roofConfig) : undefined,
              solarConfig: structuralCmd.solarConfig ? { ...structuralCmd.solarConfig } : current.solarConfig,
              placedPlants:
                structuralCmd.placedPlants !== undefined
                  ? structuredClone(structuralCmd.placedPlants)
                  : current.placedPlants,
              placedObjects:
                structuralCmd.placedObjects !== undefined
                  ? structuredClone(structuralCmd.placedObjects)
                  : (current.placedObjects ? structuredClone(current.placedObjects) : undefined),
            };
            break;
          }
        }

        const newFuture = [redoCommand, ...locHist.future];

        set((state) => ({
          history: {
            ...(state.history ?? {}),
            [locationId]: {
              past: newPast,
              future: newFuture,
            },
          },
          layouts: {
            ...state.layouts,
            [locationId]: nextLayout,
          },
        }));
      },

      redo: (locationId) => {
        const historyMap = get().history ?? {};
        const locHist = historyMap[locationId];
        if (!locHist || locHist.future.length === 0) return;
        const current = get().layouts[locationId] ?? get().getOrCreateSpaceLayout(locationId);

        const command = locHist.future[0];
        const newFuture = locHist.future.slice(1);

        let nextLayout: SpaceLayout1to1;
        let undoCommand: SpaceLayoutHistoryEntry;

        switch (command.type) {
          case 'plant_add': {
            nextLayout = {
              ...current,
              placedPlants: [...current.placedPlants, command.plant],
            };
            undoCommand = command;
            break;
          }
          case 'plant_remove': {
            nextLayout = {
              ...current,
              placedPlants: current.placedPlants.filter((p) => p.id !== command.plant.id),
            };
            undoCommand = command;
            break;
          }
          case 'plant_move': {
            nextLayout = {
              ...current,
              placedPlants: current.placedPlants.map((p) =>
                p.id === command.plantId ? { ...p, xCm: command.nextX, yCm: command.nextY } : p,
              ),
            };
            undoCommand = command;
            break;
          }
          case 'plant_batch_add': {
            nextLayout = {
              ...current,
              placedPlants: [...current.placedPlants, ...command.plants],
            };
            undoCommand = command;
            break;
          }
          default: {
            const structuralCmd = command as StructuralHistoryEntry;
            undoCommand = cloneStructuralSnapshot(current, structuralCmd.placedPlants !== undefined);
            nextLayout = {
              ...current,
              presetId: structuralCmd.presetId ?? current.presetId,
              baseBoundary: structuredClone(structuralCmd.baseBoundary ?? current.baseBoundary),
              baseMaterial: structuralCmd.baseMaterial ?? current.baseMaterial,
              hardscapeZones: structuredClone(structuralCmd.hardscapeZones ?? current.hardscapeZones),
              paths: structuredClone(structuralCmd.paths ?? current.paths),
              walls: structuredClone(structuralCmd.walls ?? current.walls),
              roofConfig: structuralCmd.roofConfig ? structuredClone(structuralCmd.roofConfig) : undefined,
              solarConfig: structuralCmd.solarConfig ? { ...structuralCmd.solarConfig } : current.solarConfig,
              placedPlants:
                structuralCmd.placedPlants !== undefined
                  ? structuredClone(structuralCmd.placedPlants)
                  : current.placedPlants,
              placedObjects:
                structuralCmd.placedObjects !== undefined
                  ? structuredClone(structuralCmd.placedObjects)
                  : (current.placedObjects ? structuredClone(current.placedObjects) : undefined),
            };
            break;
          }
        }

        const newPast = [...locHist.past, undoCommand];

        set((state) => ({
          history: {
            ...(state.history ?? {}),
            [locationId]: {
              past: newPast,
              future: newFuture,
            },
          },
          layouts: {
            ...state.layouts,
            [locationId]: nextLayout,
          },
        }));
      },

      clearHistory: (locationId) => {
        set((state) => {
          const nextHistory = { ...(state.history ?? {}) };
          delete nextHistory[locationId];
          return { history: nextHistory };
        });
      },

      resetAll: () => {
        set({ layouts: {}, history: {} });
      },
    }),
    {
      name: 'plantin-space-layout-v1',
      version: 1,
      storage: debouncedPersistStorage,
      partialize: (state) => ({
        layouts: state.layouts,
      }),
    },
  ),
);
