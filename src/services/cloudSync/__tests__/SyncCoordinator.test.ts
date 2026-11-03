import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncCoordinator } from '../SyncCoordinator';
import { GoogleAuthManager } from '../GoogleAuthManager';
import { GoogleDriveClient } from '../GoogleDriveClient';
import type { SpaceLayout1to1, SpaceLayoutStoreState } from '@/store/spaceLayoutStore';
import { createStore } from 'zustand/vanilla';

function createMockRoomLayout(locationId: string, plantCount = 0): SpaceLayout1to1 {
  return {
    locationId,
    presetId: 'greenhouse_1to1',
    baseBoundary: [
      { x: 0, y: 0 },
      { x: 600, y: 0 },
      { x: 600, y: 1200 },
      { x: 0, y: 1200 },
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
      xCm: 50 + i * 20,
      yCm: 100,
      canopyRadiusCm: 25,
    })),
  };
}

describe('SyncCoordinator - Double Buffer, Smart Debounce & Reactive Drive Sync', () => {
  let authManager: GoogleAuthManager;
  let mockDriveClient: GoogleDriveClient;
  let coordinator: SyncCoordinator;

  beforeEach(() => {
    vi.useFakeTimers();
    authManager = new GoogleAuthManager('test-client-id');
    // Simular usuario autenticado
    vi.spyOn(authManager, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(authManager, 'getAccessToken').mockReturnValue('mock-active-token');

    mockDriveClient = {
      loadManifest: vi.fn().mockResolvedValue(null),
      saveManifest: vi.fn().mockResolvedValue({ id: 'manifest-id', name: 'manifest.json' }),
      loadRoom: vi.fn(),
      saveRoom: vi.fn().mockResolvedValue({ id: 'room-file-id', name: 'room_loc-1.json' }),
    } as unknown as GoogleDriveClient;

    coordinator = new SyncCoordinator(
      authManager,
      {
        trailingDebounceMs: 2500,
        maxWaitMs: 15000,
      },
      mockDriveClient,
    );
  });

  afterEach(() => {
    coordinator.cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('enqueues room changes with monotonic revision numbers', () => {
    const layout1 = createMockRoomLayout('loc-1', 2);
    coordinator.enqueueRoomChange('loc-1', layout1);

    expect(coordinator.getStatus()).toBe('pending');
    expect(coordinator.getPendingCount()).toBe(1);

    // Segunda modificación sobre la misma sala incrementa revisión
    const layout2 = { ...layout1, placedPlants: [...layout1.placedPlants, { id: 'p3', label: 'P3', xCm: 10, yCm: 20, canopyRadiusCm: 15 }] };
    coordinator.enqueueRoomChange('loc-1', layout2);

    expect(coordinator.getPendingCount()).toBe(1);
  });

  it('applies smart debounce (2.5s trailing window)', async () => {
    const layout = createMockRoomLayout('loc-debounce', 1);
    coordinator.enqueueRoomChange('loc-debounce', layout);

    expect(mockDriveClient.saveRoom).not.toHaveBeenCalled();

    // Avanzar 2000ms: aún no debe disparar
    vi.advanceTimersByTime(2000);
    expect(mockDriveClient.saveRoom).not.toHaveBeenCalled();

    // Llega otro cambio que resetea el timer trailing
    coordinator.enqueueRoomChange('loc-debounce', layout);

    // Avanzar 1500ms (total 3500ms pero solo 1500ms desde el último cambio)
    vi.advanceTimersByTime(1500);
    expect(mockDriveClient.saveRoom).not.toHaveBeenCalled();

    // Avanzar los 1000ms restantes para completar los 2500ms trailing
    await vi.advanceTimersByTimeAsync(1000);

    expect(mockDriveClient.saveRoom).toHaveBeenCalledTimes(1);
    expect(coordinator.getStatus()).toBe('idle');
  });

  it('forces flush when maxWait (15s ceiling) is reached despite continuous edits', async () => {
    const layout = createMockRoomLayout('loc-rapid', 1);

    // Primer cambio
    coordinator.enqueueRoomChange('loc-rapid', layout);

    // Ráfaga ininterrumpida de cambios cada 1.5s durante 15s
    for (let i = 0; i < 9; i++) {
      vi.advanceTimersByTime(1500);
      coordinator.enqueueRoomChange('loc-rapid', layout);
      expect(mockDriveClient.saveRoom).not.toHaveBeenCalled();
    }

    // Al llegar al límite de maxWait (15000ms), se fuerza la subida
    await vi.advanceTimersByTimeAsync(1500);

    expect(mockDriveClient.saveRoom).toHaveBeenCalledTimes(1);
  });

  it('guarantees zero data loss with double buffering when edits arrive in-flight', async () => {
    let resolveFirstSave: (val: unknown) => void = () => {};
    const firstSavePromise = new Promise((res) => {
      resolveFirstSave = res;
    });

    // La primera llamada a saveRoom quedará en vuelo
    (mockDriveClient.saveRoom as ReturnType<typeof vi.fn>).mockImplementationOnce(() => firstSavePromise);

    const layoutRev1 = createMockRoomLayout('loc-buffer', 2);
    coordinator.enqueueRoomChange('loc-buffer', layoutRev1);

    // Disparar flush de rev 1
    const flushPromise = coordinator.flush();

    expect(coordinator.getStatus()).toBe('syncing');

    // Mientras está en vuelo rev 1, el usuario añade más plantas (rev 2)
    const layoutRev2 = createMockRoomLayout('loc-buffer', 5);
    coordinator.enqueueRoomChange('loc-buffer', layoutRev2);

    // El pending ahora tiene rev 2 mientras inFlight tiene rev 1
    expect(coordinator.getPendingCount()).toBe(2); // 1 inFlight + 1 pending

    // Culmina el primer save
    resolveFirstSave({ id: 'file-1', name: 'room_loc-buffer.json' });
    await flushPromise;

    // Al terminar rev 1, como pending tenía rev 2, se programa inmediatamente el ciclo
    // para subir rev 2
    expect(coordinator.getStatus()).toBe('pending');

    await vi.advanceTimersByTimeAsync(2500);
    expect(mockDriveClient.saveRoom).toHaveBeenCalledTimes(2);
    expect(coordinator.getStatus()).toBe('idle');
    expect(coordinator.getPendingCount()).toBe(0);
  });

  it('restores inFlight back into pending preserving highest revision on network error', async () => {
    (mockDriveClient.saveRoom as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network drop'),
    );

    const layout = createMockRoomLayout('loc-err', 1);
    coordinator.enqueueRoomChange('loc-err', layout);

    await coordinator.flush();

    expect(coordinator.getStatus()).toBe('error');
    // El cambio no se pierde: volvió a la cola de pendientes
    expect(coordinator.getPendingCount()).toBe(1);
  });

  it('flushes immediately on visibilitychange when tab is hidden', async () => {
    const layout = createMockRoomLayout('loc-tab', 3);
    coordinator.enqueueRoomChange('loc-tab', layout);

    expect(mockDriveClient.saveRoom).not.toHaveBeenCalled();

    // Simular ocultamiento de pestaña
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
      configurable: true,
    });

    document.dispatchEvent(new Event('visibilitychange'));

    // Esperar microtareas del flush asíncrono
    await Promise.resolve();

    expect(mockDriveClient.saveRoom).toHaveBeenCalledTimes(1);
  });

  it('pauses on offline and resumes/drains queue on online event', async () => {
    const layout = createMockRoomLayout('loc-net', 2);
    coordinator.enqueueRoomChange('loc-net', layout);

    // Pasa a offline
    window.dispatchEvent(new Event('offline'));
    expect(coordinator.getStatus()).toBe('offline');

    // Intentar debounce mientras está offline no debe disparar
    vi.advanceTimersByTime(5000);
    expect(mockDriveClient.saveRoom).not.toHaveBeenCalled();

    // Vuelve la conexión online
    window.dispatchEvent(new Event('online'));

    await vi.advanceTimersByTimeAsync(100);
    expect(mockDriveClient.saveRoom).toHaveBeenCalledTimes(1);
    expect(coordinator.getStatus()).toBe('idle');
  });

  it('subscribes reactively to useSpaceLayoutStore mutations without manual save buttons', () => {
    const mockStore = createStore<SpaceLayoutStoreState>(() => ({
      layouts: {},
      history: {},
      getOrCreateSpaceLayout: vi.fn(),
      applyPreset: vi.fn(),
      setBaseBoundary: vi.fn(),
      setBaseMaterial: vi.fn(),
      snapshotHistory: vi.fn(),
      moveBoundaryVertex: vi.fn(),
      insertBoundaryVertex: vi.fn(),
      removeBoundaryVertex: vi.fn(),
      sanitizeBoundary: vi.fn(),
      scaleBoundary: vi.fn(),
      updateWall: vi.fn(),
      addWallOpening: vi.fn(),
      removeWallOpening: vi.fn(),
      updateWallOpening: vi.fn(),
      updateRoofConfig: vi.fn(),
      setAllWallsHeight: vi.fn(),
      setAllWallsMaterial: vi.fn(),
      addPathStroke: vi.fn(),
      removePathStroke: vi.fn(),
      addHardscapeZone: vi.fn(),
      removeHardscapeZone: vi.fn(),
      updateSolarConfig: vi.fn(),
      placePlant: vi.fn(),
      movePlant: vi.fn(),
      removePlant: vi.fn(),
      placePlantLine: vi.fn(),
      fillCultivableSector: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: vi.fn(),
      canRedo: vi.fn(),
      clearHistory: vi.fn(),
      resetAll: vi.fn(),
    }));

    const unsubscribe = coordinator.startListening(mockStore);

    // Mutar el store añadiendo una sala
    const newLayout = createMockRoomLayout('loc-reactive', 4);
    mockStore.setState({
      layouts: {
        'loc-reactive': newLayout,
      },
    });

    expect(coordinator.getStatus()).toBe('pending');
    expect(coordinator.getPendingCount()).toBe(1);

    unsubscribe();
  });

  it('performs initial bidirectional sync: downloads newer cloud rooms and uploads local rooms', async () => {
    const cloudManifest = {
      fileId: 'man-1',
      manifest: {
        schemaVersion: 1,
        updatedAt: '2026-11-03T11:00:00Z',
        rooms: {
          'loc-cloud-only': {
            locationId: 'loc-cloud-only',
            revision: 5,
            updatedAt: '2026-11-03T11:00:00Z',
            fileId: 'file-cloud-only',
          },
        },
      },
    };

    (mockDriveClient.loadManifest as ReturnType<typeof vi.fn>).mockResolvedValueOnce(cloudManifest);
    const remoteLayout = createMockRoomLayout('loc-cloud-only', 10);
    (mockDriveClient.loadRoom as ReturnType<typeof vi.fn>).mockResolvedValueOnce(remoteLayout);

    const localLayout = createMockRoomLayout('loc-local-only', 2);
    const mockStore = createStore<SpaceLayoutStoreState>(() => ({
      layouts: {
        'loc-local-only': localLayout,
      },
      history: {},
      getOrCreateSpaceLayout: vi.fn(),
      applyPreset: vi.fn(),
      setBaseBoundary: vi.fn(),
      setBaseMaterial: vi.fn(),
      snapshotHistory: vi.fn(),
      moveBoundaryVertex: vi.fn(),
      insertBoundaryVertex: vi.fn(),
      removeBoundaryVertex: vi.fn(),
      sanitizeBoundary: vi.fn(),
      scaleBoundary: vi.fn(),
      updateWall: vi.fn(),
      addWallOpening: vi.fn(),
      removeWallOpening: vi.fn(),
      updateWallOpening: vi.fn(),
      updateRoofConfig: vi.fn(),
      setAllWallsHeight: vi.fn(),
      setAllWallsMaterial: vi.fn(),
      addPathStroke: vi.fn(),
      removePathStroke: vi.fn(),
      addHardscapeZone: vi.fn(),
      removeHardscapeZone: vi.fn(),
      updateSolarConfig: vi.fn(),
      placePlant: vi.fn(),
      movePlant: vi.fn(),
      removePlant: vi.fn(),
      placePlantLine: vi.fn(),
      fillCultivableSector: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: vi.fn(),
      canRedo: vi.fn(),
      clearHistory: vi.fn(),
      resetAll: vi.fn(),
    }));

    await coordinator.initialBidirectionalSync(mockStore);

    // 1. Debe haber descargado 'loc-cloud-only' e inyectado en el store
    expect(mockDriveClient.loadRoom).toHaveBeenCalledWith('file-cloud-only');
    expect(mockStore.getState().layouts['loc-cloud-only']).toBeDefined();
    expect(mockStore.getState().layouts['loc-cloud-only'].placedPlants).toHaveLength(10);

    // 2. Debe haber subido 'loc-local-only' a la nube
    expect(mockDriveClient.saveRoom).toHaveBeenCalledWith('loc-local-only', expect.any(Object));
  });
});
