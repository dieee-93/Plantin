/**
 * Tipos y Estados para el Motor de Sincronización Automática con Google Drive
 * (Scope: drive.appdata - appDataFolder)
 */

export type SyncStatus =
  | 'idle'
  | 'pending'
  | 'syncing'
  | 'offline'
  | 'error'
  | 'disconnected';

export interface GoogleAuthUser {
  accessToken: string;
  expiresAt: number; // Marca de tiempo en milisegundos
  email?: string;
  name?: string;
  picture?: string;
}

export interface RoomSyncMetadata {
  locationId: string;
  revision: number;
  updatedAt: string; // ISO 8601
  checksum?: string;
  plantCount?: number;
  fileId?: string;
}

export interface SyncManifest {
  schemaVersion: number;
  clientId?: string;
  updatedAt: string;
  rooms: Record<string, RoomSyncMetadata>;
}

export interface SyncBufferEntry<T> {
  data: T;
  revision: number;
  timestamp: number;
}

export interface SyncBufferState<T> {
  pending: Map<string, SyncBufferEntry<T>>;
  inFlight: Map<string, SyncBufferEntry<T>> | null;
}

export interface StorageQuota {
  limitBytes?: number;
  usageBytes?: number;
  usageInDriveBytes?: number;
}

export interface GoogleDriveFileMeta {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string;
  mimeType?: string;
}

export interface SyncStateDetail {
  status: SyncStatus;
  pendingCount: number;
  lastSyncedAt: Date | null;
  error: string | null;
  user: GoogleAuthUser | null;
  isOnline: boolean;
  storageQuota?: StorageQuota;
  lastSyncSizeBytes?: number;
}

export type SyncState = SyncStateDetail;

export interface CloudSyncOptions {
  clientId?: string;
  trailingDebounceMs?: number; // Por defecto: 2500ms
  maxWaitMs?: number; // Por defecto: 15000ms
  silentRenewMarginMs?: number; // Renovar 5 min antes de vencer (300,000ms)
}
