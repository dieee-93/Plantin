import { useEffect, useState } from 'react';
import type { GoogleAuthUser, StorageQuota, SyncStateDetail, SyncStatus } from './types';
import { syncCoordinator, SyncCoordinator } from './SyncCoordinator';
import { googleAuthManager, GoogleAuthManager } from './GoogleAuthManager';

export interface UseSyncStatusResult {
  status: SyncStatus;
  pendingCount: number;
  lastSyncedAt: Date | null;
  error: string | null;
  user: GoogleAuthUser | null;
  isOnline: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  storageQuota?: StorageQuota;
  lastSyncSizeBytes?: number;
  signIn: () => Promise<void>;
  signOut: () => void;
  flush: () => Promise<void>;
}

export function useSyncStatus(
  coordinator: SyncCoordinator = syncCoordinator,
  auth: GoogleAuthManager = googleAuthManager,
): UseSyncStatusResult {
  const [detail, setDetail] = useState<SyncStateDetail>(() => coordinator.getDetail());

  useEffect(() => {
    const unsubscribe = coordinator.subscribeStatus((newDetail) => {
      setDetail(newDetail);
    });
    return unsubscribe;
  }, [coordinator]);

  const signIn = async () => {
    await auth.signIn();
  };

  const signOut = () => {
    auth.signOut();
  };

  const flush = async () => {
    await coordinator.flush();
  };

  return {
    status: detail.status,
    pendingCount: detail.pendingCount,
    lastSyncedAt: detail.lastSyncedAt,
    error: detail.error,
    user: detail.user,
    isOnline: detail.isOnline,
    isAuthenticated: auth.isAuthenticated(),
    isConfigured: auth.isConfigured(),
    storageQuota: detail.storageQuota,
    lastSyncSizeBytes: detail.lastSyncSizeBytes,
    signIn,
    signOut,
    flush,
  };
}
