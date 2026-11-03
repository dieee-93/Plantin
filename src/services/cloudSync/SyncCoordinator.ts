import type {
  CloudSyncOptions,
  RoomSyncMetadata,
  SyncBufferEntry,
  SyncManifest,
  SyncStateDetail,
  SyncStatus,
} from './types';
import { GoogleAuthManager, googleAuthManager } from './GoogleAuthManager';
import { GoogleDriveClient, GoogleDriveAuthError } from './GoogleDriveClient';
import type { SpaceLayout1to1, SpaceLayoutStoreState } from '@/store/spaceLayoutStore';
import type { StoreApi } from 'zustand';

export class SyncCoordinator {
  private authManager: GoogleAuthManager;
  private driveClient: GoogleDriveClient;
  private options: Required<CloudSyncOptions>;

  // Estado del coordinador
  private status: SyncStatus = 'disconnected';
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private lastSyncedAt: Date | null = null;
  private lastError: string | null = null;
  private listeners = new Set<(detail: SyncStateDetail) => void>();

  // Doble Búfer y Monotonic Revisions
  private localRevisions = new Map<string, number>();
  private syncedRevisions = new Map<string, number>();
  private pending = new Map<string, SyncBufferEntry<SpaceLayout1to1>>();
  private inFlight: Map<string, SyncBufferEntry<SpaceLayout1to1>> | null = null;

  // Timers y Debounce Inteligente
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private firstPendingTimestamp: number | null = null;

  // Subscripciones
  private authUnsubscribe: (() => void) | null = null;
  private storeUnsubscribe: (() => void) | null = null;
  private boundStore: StoreApi<SpaceLayoutStoreState> | null = null;
  private prevLayouts: Record<string, SpaceLayout1to1> = {};
  private isApplyingCloudData = false;

  // Event handlers
  private handleVisibilityChangeBound = this.handleVisibilityChange.bind(this);
  private handleOnlineBound = this.handleOnline.bind(this);
  private handleOfflineBound = this.handleOffline.bind(this);
  private handleBeforeUnloadBound = this.handleBeforeUnload.bind(this);

  constructor(
    authManager: GoogleAuthManager = googleAuthManager,
    options?: CloudSyncOptions,
    customDriveClient?: GoogleDriveClient,
  ) {
    this.authManager = authManager;
    this.options = {
      clientId: options?.clientId ?? authManager.getClientId() ?? '',
      trailingDebounceMs: options?.trailingDebounceMs ?? 2500,
      maxWaitMs: options?.maxWaitMs ?? 15000,
      silentRenewMarginMs: options?.silentRenewMarginMs ?? 300000,
    };

    this.driveClient =
      customDriveClient ||
      new GoogleDriveClient({
        getAccessToken: () => this.authManager.getAccessToken(),
      });

    this.initStatus();
    this.attachBrowserEvents();
    this.listenToAuthChanges();
  }

  private initStatus(): void {
    if (!this.isOnline) {
      this.status = 'offline';
    } else if (this.authManager.isAuthenticated()) {
      this.status = 'idle';
    } else {
      this.status = 'disconnected';
    }
  }

  private attachBrowserEvents(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', this.handleOnlineBound);
    window.addEventListener('offline', this.handleOfflineBound);
    window.addEventListener('beforeunload', this.handleBeforeUnloadBound);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChangeBound);
    }
  }

  private detachBrowserEvents(): void {
    if (typeof window === 'undefined') return;

    window.removeEventListener('online', this.handleOnlineBound);
    window.removeEventListener('offline', this.handleOfflineBound);
    window.removeEventListener('beforeunload', this.handleBeforeUnloadBound);

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChangeBound);
    }
  }

  private listenToAuthChanges(): void {
    this.authUnsubscribe = this.authManager.subscribe(() => {
      if (this.authManager.isAuthenticated()) {
        if (this.status === 'disconnected') {
          this.setStatus(this.pending.size > 0 ? 'pending' : 'idle');
          if (this.boundStore) {
            void this.initialBidirectionalSync(this.boundStore);
          }
        }
      } else {
        this.setStatus('disconnected');
      }
    });
  }

  private handleOnline(): void {
    this.isOnline = true;
    if (this.authManager.isAuthenticated()) {
      if (this.pending.size > 0) {
        this.setStatus('pending');
        void this.flush();
      } else {
        this.setStatus('idle');
      }
    } else {
      this.setStatus('disconnected');
    }
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.setStatus('offline');
  }

  private handleVisibilityChange(): void {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      if (this.pending.size > 0 && this.canSync()) {
        void this.flush();
      }
    }
  }

  private handleBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  public hasUnsavedChanges(): boolean {
    return this.pending.size > 0 || this.inFlight !== null;
  }

  public getPendingCount(): number {
    return this.pending.size + (this.inFlight ? this.inFlight.size : 0);
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public getDetail(): SyncStateDetail {
    return {
      status: this.status,
      pendingCount: this.getPendingCount(),
      lastSyncedAt: this.lastSyncedAt,
      error: this.lastError,
      user: this.authManager.getUser(),
      isOnline: this.isOnline,
    };
  }

  private setStatus(newStatus: SyncStatus, error: string | null = null): void {
    this.status = newStatus;
    if (error !== null) {
      this.lastError = error;
    } else if (newStatus === 'idle' || newStatus === 'syncing') {
      this.lastError = null;
    }
    this.notifyListeners();
  }

  public subscribeStatus(listener: (detail: SyncStateDetail) => void): () => void {
    this.listeners.add(listener);
    listener(this.getDetail());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const detail = this.getDetail();
    for (const listener of this.listeners) {
      try {
        listener(detail);
      } catch (err) {
        console.error('[SyncCoordinator] Error in listener callback:', err);
      }
    }
  }

  private canSync(): boolean {
    return (
      this.isOnline &&
      this.authManager.isAuthenticated() &&
      this.status !== 'offline'
    );
  }

  /**
   * Encola una modificación de sala en el búfer de pendientes
   * aplicando revisión monotónica.
   */
  public enqueueRoomChange(locationId: string, layout: SpaceLayout1to1): void {
    const currentRev = (this.localRevisions.get(locationId) ?? 0) + 1;
    this.localRevisions.set(locationId, currentRev);

    const now = Date.now();
    this.pending.set(locationId, {
      data: layout,
      revision: currentRev,
      timestamp: now,
    });

    if (this.firstPendingTimestamp === null) {
      this.firstPendingTimestamp = now;
    }

    if (this.status !== 'syncing') {
      this.setStatus(this.canSync() ? 'pending' : (this.isOnline ? 'disconnected' : 'offline'));
    }

    this.scheduleDebouncedFlush();
  }

  /**
   * Debounce inteligente: ventana trailing de 2.5s con techo MaxWait de 15s.
   */
  private scheduleDebouncedFlush(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (!this.canSync()) return;

    const now = Date.now();
    const firstTime = this.firstPendingTimestamp ?? now;
    const elapsed = now - firstTime;

    if (elapsed >= this.options.maxWaitMs) {
      // Se superó el techo máximo de espera: flush inmediato
      void this.flush();
      return;
    }

    const remainingMaxWait = this.options.maxWaitMs - elapsed;
    const delay = Math.min(this.options.trailingDebounceMs, remainingMaxWait);

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.flush();
    }, delay);
  }

  /**
   * Ejecuta el ciclo de sincronización utilizando Doble Búfer.
   * Si hay una subida en vuelo, espera su culminación sin perder cambios.
   */
  public async flush(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (!this.canSync() || this.pending.size === 0) {
      if (this.status === 'pending' && this.pending.size === 0 && !this.inFlight) {
        this.setStatus('idle');
      }
      return;
    }

    // Si ya hay una transferencia en vuelo (inFlight), no sobreescribir;
    // la finalización del vuelo en curso revisará la cola de pending.
    if (this.inFlight !== null) {
      return;
    }

    // Paso de Búfer: pending -> inFlight
    this.inFlight = new Map(this.pending);
    this.pending.clear();
    this.firstPendingTimestamp = null;

    this.setStatus('syncing');

    try {
      // 1. Obtener manifiesto actual de la nube
      const existingManifestData = await this.driveClient.loadManifest();
      const currentManifest: SyncManifest = existingManifestData?.manifest ?? {
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        rooms: {},
      };

      // 2. Subir cada sala en vuelo
      for (const [locationId, entry] of this.inFlight.entries()) {
        const fileMeta = await this.driveClient.saveRoom(locationId, entry.data);

        const roomMeta: RoomSyncMetadata = {
          locationId,
          revision: entry.revision,
          updatedAt: new Date(entry.timestamp).toISOString(),
          plantCount: entry.data.placedPlants.length,
          fileId: fileMeta.id,
        };

        currentManifest.rooms[locationId] = roomMeta;
        this.syncedRevisions.set(locationId, entry.revision);
      }

      // 3. Subir manifiesto actualizado
      currentManifest.updatedAt = new Date().toISOString();
      await this.driveClient.saveManifest(currentManifest);

      // Sincronización exitosa
      this.inFlight = null;
      this.lastSyncedAt = new Date();

      // Si llegaron nuevos cambios mientras se ejecutaba la subida,
      // procesarlos en el siguiente tick
      if (this.pending.size > 0) {
        this.setStatus('pending');
        this.scheduleDebouncedFlush();
      } else {
        this.setStatus('idle');
      }
    } catch (err: unknown) {
      // Ante error, reintegrar inFlight a pending conservando la mayor revisión
      if (this.inFlight) {
        for (const [locId, inFlightEntry] of this.inFlight.entries()) {
          const currentPending = this.pending.get(locId);
          if (!currentPending || currentPending.revision < inFlightEntry.revision) {
            this.pending.set(locId, inFlightEntry);
          }
        }
        this.inFlight = null;
      }

      if (err instanceof GoogleDriveAuthError) {
        this.setStatus('error', 'Sesión de Google Drive expirada.');
      } else {
        const message = err instanceof Error ? err.message : String(err);
        this.setStatus('error', message);
      }
    }
  }

  /**
   * Suscribe reactivamente al store de layout para detectar mutaciones
   * de salas sin requerir botones manuales ni tocar la UI del usuario.
   */
  public startListening(store: StoreApi<SpaceLayoutStoreState>): () => void {
    this.boundStore = store;
    this.prevLayouts = { ...store.getState().layouts };

    this.storeUnsubscribe = store.subscribe((state) => {
      if (this.isApplyingCloudData) return;

      const currentLayouts = state.layouts || {};
      for (const [locId, layout] of Object.entries(currentLayouts)) {
        if (this.prevLayouts[locId] !== layout) {
          this.enqueueRoomChange(locId, layout);
        }
      }
      this.prevLayouts = { ...currentLayouts };
    });

    return () => {
      if (this.storeUnsubscribe) {
        this.storeUnsubscribe();
        this.storeUnsubscribe = null;
      }
      this.boundStore = null;
    };
  }

  /**
   * Sincronización bidireccional al iniciar sesión:
   * Compara el manifest de Google Drive con el store local IndexedDB.
   */
  public async initialBidirectionalSync(
    store: StoreApi<SpaceLayoutStoreState>,
  ): Promise<void> {
    if (!this.canSync()) return;

    this.setStatus('syncing');

    try {
      const manifestResult = await this.driveClient.loadManifest();
      const localLayouts = store.getState().layouts || {};

      if (!manifestResult) {
        // No hay manifest en la nube: subir todas las salas locales existentes
        for (const [locId, layout] of Object.entries(localLayouts)) {
          this.enqueueRoomChange(locId, layout);
        }
        if (this.pending.size > 0) {
          await this.flush();
        } else {
          this.setStatus('idle');
        }
        return;
      }

      const { manifest } = manifestResult;
      const cloudRooms = manifest.rooms || {};

      this.isApplyingCloudData = true;
      try {
        // Descargar salas que existan en la nube y no existan en local o sean más nuevas
        for (const [locId, cloudMeta] of Object.entries(cloudRooms)) {
          const localLayout = localLayouts[locId];

          if (!localLayout) {
            // No existe localmente: descargar de la nube
            if (cloudMeta.fileId) {
              const remoteLayout = await this.driveClient.loadRoom(cloudMeta.fileId);
              store.setState((s) => ({
                layouts: {
                  ...s.layouts,
                  [locId]: remoteLayout,
                },
              }));
              this.localRevisions.set(locId, cloudMeta.revision);
              this.syncedRevisions.set(locId, cloudMeta.revision);
            }
          } else {
            // Existe en ambos: registrar revisión remota
            const syncedRev = this.syncedRevisions.get(locId) ?? 0;
            if (cloudMeta.revision > syncedRev && !this.pending.has(locId)) {
              if (cloudMeta.fileId) {
                const remoteLayout = await this.driveClient.loadRoom(cloudMeta.fileId);
                store.setState((s) => ({
                  layouts: {
                    ...s.layouts,
                    [locId]: remoteLayout,
                  },
                }));
                this.localRevisions.set(locId, cloudMeta.revision);
                this.syncedRevisions.set(locId, cloudMeta.revision);
              }
            }
          }
        }

        // Detectar salas locales que no están en la nube para subirlas
        for (const [locId, layout] of Object.entries(localLayouts)) {
          if (!cloudRooms[locId]) {
            this.enqueueRoomChange(locId, layout);
          }
        }
      } finally {
        this.isApplyingCloudData = false;
        this.prevLayouts = { ...store.getState().layouts };
      }

      if (this.pending.size > 0) {
        await this.flush();
      } else {
        this.lastSyncedAt = new Date();
        this.setStatus('idle');
      }
    } catch (err: unknown) {
      console.warn('[SyncCoordinator] Error in initial bidirectional sync:', err);
      const message = err instanceof Error ? err.message : String(err);
      this.setStatus('error', message);
    }
  }

  public cleanup(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = null;
    }
    this.detachBrowserEvents();
    this.listeners.clear();
  }
}

export const syncCoordinator = new SyncCoordinator();
