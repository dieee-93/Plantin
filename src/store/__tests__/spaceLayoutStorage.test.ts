import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get as idbGet, del as idbDel } from 'idb-keyval';
import {
  createDebouncedPersistStorage,
  flushSpaceLayoutStorage,
  useSpaceLayoutStore,
  type PersistedSpaceLayoutState,
  type SpaceLayout1to1,
} from '../spaceLayoutStore';
import type { StorageValue } from 'zustand/middleware';

function makeMockLayout(locationId: string, plantCount = 5): SpaceLayout1to1 {
  return {
    locationId,
    presetId: 'empty_lot_1to1',
    baseBoundary: [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 1000 },
      { x: 0, y: 1000 },
    ],
    baseMaterial: 'soil',
    hardscapeZones: [],
    paths: [],
    walls: [],
    solarConfig: {
      latitudeDeg: -34.6,
      northAngleDeg: 0,
      season: 'summer',
      hourOfDay: 12,
    },
    placedPlants: Array.from({ length: plantCount }, (_, i) => ({
      id: `plant-${locationId}-${i}`,
      label: `Planta ${i}`,
      cropCode: 'tomato',
      xCm: (i % 20) * 40 + 50,
      yCm: Math.floor(i / 20) * 40 + 50,
      canopyRadiusCm: 20,
    })),
  };
}

describe('spaceLayoutStore - Persistencia Asíncrona en IndexedDB & Auto-Migración', () => {
  const TEST_KEY = 'plantin-space-layout-test-key';

  beforeEach(async () => {
    localStorage.clear();
    await idbDel(TEST_KEY);
    await idbDel('plantin-space-layout-v1');
    useSpaceLayoutStore.getState().resetAll();
  });

  describe('Lectura y escritura asíncrona en IndexedDB', () => {
    it('guarda datos asíncronamente en IndexedDB y los lee correctamente', async () => {
      const storage = createDebouncedPersistStorage(20);
      const testState: StorageValue<PersistedSpaceLayoutState> = {
        state: {
          layouts: {
            'loc-idb-1': makeMockLayout('loc-idb-1', 10),
          },
        },
        version: 1,
      };

      storage.setItem(TEST_KEY, testState);

      // Inmediatamente antes del debounce, debe estar disponible via cache de escrituras pendientes
      const immediateRead = await storage.getItem(TEST_KEY);
      expect(immediateRead).toEqual(testState);

      // Esperar que transcurra el debounce delay
      await new Promise((r) => setTimeout(r, 50));

      // Verificar que el dato se escribió efectivamente en IndexedDB
      const persistedInIdb = await idbGet<StorageValue<PersistedSpaceLayoutState>>(TEST_KEY);
      expect(persistedInIdb).toBeDefined();
      expect(persistedInIdb?.state.layouts['loc-idb-1'].placedPlants).toHaveLength(10);

      // Leer a través de getItem
      const readFromStorage = await storage.getItem(TEST_KEY);
      expect(readFromStorage?.state.layouts['loc-idb-1'].placedPlants).toHaveLength(10);
    });

    it('elimina datos de IndexedDB con removeItem', async () => {
      const storage = createDebouncedPersistStorage(10);
      const testState: StorageValue<PersistedSpaceLayoutState> = {
        state: {
          layouts: {
            'loc-del': makeMockLayout('loc-del', 2),
          },
        },
        version: 1,
      };

      storage.setItem(TEST_KEY, testState);
      await new Promise((r) => setTimeout(r, 30));

      expect(await idbGet(TEST_KEY)).toBeDefined();

      await storage.removeItem(TEST_KEY);

      expect(await idbGet(TEST_KEY)).toBeUndefined();
      expect(await storage.getItem(TEST_KEY)).toBeNull();
    });

    it('soporta flushSpaceLayoutStorage() para forzar escritura antes de esperar el debounce', async () => {
      const store = useSpaceLayoutStore.getState();
      store.getOrCreateSpaceLayout('loc-flush-test', 'outdoor', 'empty_lot_1to1');
      store.placePlant('loc-flush-test', {
        label: 'Lavanda',
        xCm: 100,
        yCm: 100,
        canopyRadiusCm: 25,
      });

      // Forzar flush inmediato
      await flushSpaceLayoutStorage();

      const idbData = await idbGet<StorageValue<PersistedSpaceLayoutState>>('plantin-space-layout-v1');
      expect(idbData).toBeDefined();
      expect(idbData?.state.layouts['loc-flush-test']).toBeDefined();
      const plants = idbData?.state.layouts['loc-flush-test'].placedPlants;
      expect(plants?.some((p) => p.label === 'Lavanda')).toBe(true);
    });
  });

  describe('Auto-migración transparente desde localStorage a IndexedDB', () => {
    it('migra automáticamente datos preexistentes de localStorage a IndexedDB y limpia localStorage', async () => {
      const storage = createDebouncedPersistStorage(20);
      const legacyState: StorageValue<PersistedSpaceLayoutState> = {
        state: {
          layouts: {
            'loc-legacy-patio': makeMockLayout('loc-legacy-patio', 4),
          },
        },
        version: 1,
      };

      // Simular datos preexistentes en localStorage
      localStorage.setItem(TEST_KEY, JSON.stringify(legacyState));
      expect(localStorage.getItem(TEST_KEY)).not.toBeNull();

      // Asegurar que IndexedDB no tiene aún el dato
      await idbDel(TEST_KEY);
      expect(await idbGet(TEST_KEY)).toBeUndefined();

      // Al llamar a getItem, debe detectar localStorage, migrar a IndexedDB y devolverlo
      const migrated = await storage.getItem(TEST_KEY);
      expect(migrated).toBeDefined();
      expect(migrated?.state.layouts['loc-legacy-patio'].placedPlants).toHaveLength(4);

      // Verificar que ahora está en IndexedDB
      const idbStored = await idbGet<StorageValue<PersistedSpaceLayoutState>>(TEST_KEY);
      expect(idbStored).toBeDefined();
      expect(idbStored?.state.layouts['loc-legacy-patio']).toBeDefined();

      // Verificar que localStorage fue liberado para no ocupar los 5 MB
      expect(localStorage.getItem(TEST_KEY)).toBeNull();
    });

    it('maneja con elegancia contenido corrupto en localStorage sin lanzar excepciones', async () => {
      const storage = createDebouncedPersistStorage(20);
      localStorage.setItem(TEST_KEY, '{ invalid JSON : true');

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await storage.getItem(TEST_KEY);
      expect(result).toBeNull();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Escalabilidad y Cuota: Salas con miles de plantas', () => {
    it('guarda y recupera salas con miles de plantas en IndexedDB sin errores de cuota', async () => {
      const storage = createDebouncedPersistStorage(10);
      const PLANT_COUNT = 5000;
      const massiveLayout = makeMockLayout('loc-massive-greenhouse', PLANT_COUNT);

      const massiveState: StorageValue<PersistedSpaceLayoutState> = {
        state: {
          layouts: {
            'loc-massive-greenhouse': massiveLayout,
          },
        },
        version: 1,
      };

      // Verificar que la serialización supera con creces tamaños pequeños
      const jsonStr = JSON.stringify(massiveState);
      expect(jsonStr.length).toBeGreaterThan(500_000); // > 500 KB

      // Guardar en almacenamiento asíncrono
      storage.setItem(TEST_KEY, massiveState);
      await new Promise((r) => setTimeout(r, 40));

      // Recuperar de IndexedDB
      const loaded = await storage.getItem(TEST_KEY);
      expect(loaded).toBeDefined();
      expect(loaded?.state.layouts['loc-massive-greenhouse'].placedPlants).toHaveLength(PLANT_COUNT);

      const firstPlant = loaded?.state.layouts['loc-massive-greenhouse'].placedPlants[0];
      const lastPlant = loaded?.state.layouts['loc-massive-greenhouse'].placedPlants[PLANT_COUNT - 1];

      expect(firstPlant?.id).toBe('plant-loc-massive-greenhouse-0');
      expect(lastPlant?.id).toBe(`plant-loc-massive-greenhouse-${PLANT_COUNT - 1}`);
    });
  });

  describe('Fallback transparente cuando IndexedDB no está disponible', () => {
    it('hace fallback a memoria / localStorage si IndexedDB arroja error o no está soportado', async () => {
      // Forzar que idbSet falle
      const failingStorage = createDebouncedPersistStorage(10);
      const testFallbackKey = 'plantin-fallback-test';

      const originalIndexedDB = globalThis.indexedDB;
      try {
        // Simular IndexedDB no disponible
        (globalThis as unknown as { indexedDB: unknown }).indexedDB = undefined;

        const testState: StorageValue<PersistedSpaceLayoutState> = {
          state: {
            layouts: {
              'loc-fallback': makeMockLayout('loc-fallback', 3),
            },
          },
          version: 1,
        };

        // setItem debe completarse sin arrojar error
        expect(() => failingStorage.setItem(testFallbackKey, testState)).not.toThrow();

        // Debe leerse de memoria / localStorage
        const read = await failingStorage.getItem(testFallbackKey);
        expect(read?.state.layouts['loc-fallback'].placedPlants).toHaveLength(3);
      } finally {
        (globalThis as unknown as { indexedDB: unknown }).indexedDB = originalIndexedDB;
      }
    });
  });
});
