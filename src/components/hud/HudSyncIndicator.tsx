import React, { useState } from 'react';
import { Cloud, CloudOff, Check, Loader2, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { HudTooltip } from './HudTooltip';
import { useSyncStatus } from '@/services/cloudSync/useSyncStatus';
import type { SyncCoordinator } from '@/services/cloudSync/SyncCoordinator';
import type { GoogleAuthManager } from '@/services/cloudSync/GoogleAuthManager';

export interface HudSyncIndicatorProps {
  className?: string;
  coordinator?: SyncCoordinator;
  authManager?: GoogleAuthManager;
}

export function formatBytes(bytes?: number): string {
  if (bytes === undefined || isNaN(bytes) || bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const unitIndex = Math.min(Math.max(0, i), units.length - 1);
  const value = bytes / Math.pow(1024, unitIndex);
  const formatted =
    value >= 100 || unitIndex === 0
      ? Math.round(value).toString()
      : value.toFixed(1).replace(/\.0$/, '');
  return `${formatted} ${units[unitIndex]}`;
}

export const HudSyncIndicator: React.FC<HudSyncIndicatorProps> = ({
  className = '',
  coordinator,
  authManager,
}) => {
  const {
    status,
    pendingCount,
    lastSyncedAt,
    error,
    isOnline,
    isAuthenticated,
    isConfigured,
    storageQuota,
    lastSyncSizeBytes,
    signIn,
    signOut,
    flush,
  } = useSyncStatus(coordinator, authManager);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleConnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsSigningIn(true);
      await signIn();
    } catch (err) {
      console.error('[HudSyncIndicator] Error connecting to Google Drive:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleManualFlush = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await flush();
    } catch (err) {
      console.error('[HudSyncIndicator] Manual flush error:', err);
    }
  };

  const handleDisconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    signOut();
    setIsMenuOpen(false);
  };

  // 1. Estado Desconectado / Modo Local
  if (status === 'disconnected' || (!isAuthenticated && isOnline)) {
    if (!isConfigured) {
      return (
        <HudTooltip
          title="Modo local activo"
          description="Los cambios se guardan automáticamente en IndexedDB en este dispositivo. Para sincronizar en la nube con Google Drive se requiere configurar VITE_GOOGLE_CLIENT_ID."
          side="bottom"
        >
          <div
            data-testid="hud-sync-indicator-local"
            className={`pointer-events-auto flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1 text-xs text-slate-500 shadow-sm backdrop-blur-md transition select-none ${className}`}
          >
            <Cloud size={13} className="text-slate-400" />
            <span className="font-medium text-slate-600">Modo local</span>
          </div>
        </HudTooltip>
      );
    }

    return (
      <HudTooltip
        title="Google Drive desconectado"
        description="Conecta tu Google Drive para respaldar tus salas y plantas automáticamente en segundo plano."
        side="bottom"
      >
        <button
          type="button"
          data-testid="hud-sync-connect-button"
          onClick={handleConnect}
          disabled={isSigningIn}
          className={`pointer-events-auto flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-md transition hover:bg-white hover:text-emerald-700 hover:border-emerald-300 cursor-pointer active:scale-95 disabled:opacity-50 ${className}`}
        >
          {isSigningIn ? (
            <Loader2 size={13} className="animate-spin text-emerald-600" />
          ) : (
            <Cloud size={13} className="text-slate-500 group-hover:text-emerald-600" />
          )}
          <span>{isSigningIn ? 'Conectando...' : 'Conectar Google Drive'}</span>
        </button>
      </HudTooltip>
    );
  }

  // 2. Estado Offline (Sin Conexión)
  if (status === 'offline' || !isOnline) {
    return (
      <HudTooltip
        title="Modo local (sin conexión)"
        description={`Sin conexión a internet. Los cambios se guardan localmente en tu navegador${pendingCount > 0 ? ` (${pendingCount} cambio${pendingCount > 1 ? 's' : ''} pendiente${pendingCount > 1 ? 's' : ''})` : ''} y se sincronizarán al restablecer la red.`}
        side="bottom"
      >
        <div
          data-testid="hud-sync-indicator-offline"
          className={`pointer-events-auto flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50/90 px-2.5 py-1 text-xs text-amber-800 shadow-sm backdrop-blur-md select-none ${className}`}
        >
          <CloudOff size={13} className="text-amber-600" />
          <span className="font-medium">Modo local (sin conexión)</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-200/80 px-1.5 py-0.2 text-[10px] font-bold">
              {pendingCount}
            </span>
          )}
        </div>
      </HudTooltip>
    );
  }

  // 3. Estado Sincronizando / Pendiente
  if (status === 'syncing' || status === 'pending') {
    return (
      <HudTooltip
        title="Sincronizando con Google Drive"
        description={
          status === 'syncing'
            ? 'Subiendo cambios a appDataFolder en segundo plano...'
            : `${pendingCount} cambio${pendingCount > 1 ? 's' : ''} acumulado${pendingCount > 1 ? 's' : ''}, subiendo en breve...`
        }
        side="bottom"
      >
        <div
          data-testid="hud-sync-indicator-syncing"
          className={`pointer-events-auto flex items-center gap-1.5 rounded-full border border-sky-200/80 bg-sky-50/90 px-2.5 py-1 text-xs text-sky-800 shadow-sm backdrop-blur-md select-none ${className}`}
        >
          <Loader2 size={13} className="animate-spin text-sky-600" />
          <span className="font-medium">Sincronizando...</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-sky-200/80 px-1.5 py-0.2 text-[10px] font-bold text-sky-900">
              {pendingCount}
            </span>
          )}
        </div>
      </HudTooltip>
    );
  }

  // 4. Estado de Error
  if (status === 'error') {
    return (
      <HudTooltip
        title="Error de sincronización"
        description={`${error || 'Ocurrió un problema de red.'} Haz clic para reintentar la subida.`}
        side="bottom"
      >
        <button
          type="button"
          data-testid="hud-sync-indicator-error"
          onClick={handleManualFlush}
          className={`pointer-events-auto flex items-center gap-1.5 rounded-full border border-rose-200/90 bg-rose-50/90 px-2.5 py-1 text-xs font-semibold text-rose-800 shadow-sm backdrop-blur-md hover:bg-rose-100 transition cursor-pointer active:scale-95 ${className}`}
        >
          <AlertCircle size={13} className="text-rose-600" />
          <span>Error de sync (Reintentar)</span>
        </button>
      </HudTooltip>
    );
  }

  // 5. Estado Idle: Guardado en Google Drive
  const formattedTime = lastSyncedAt
    ? lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'recién';

  const sizeText =
    lastSyncSizeBytes !== undefined
      ? `Tamaño del guardado: ${formatBytes(lastSyncSizeBytes)}`
      : null;

  const quotaText =
    storageQuota?.usageBytes !== undefined && storageQuota?.limitBytes !== undefined
      ? `Espacio en Google Drive: ${formatBytes(storageQuota.usageBytes)} / ${formatBytes(storageQuota.limitBytes)}`
      : storageQuota?.usageBytes !== undefined
        ? `Espacio en Google Drive: ${formatBytes(storageQuota.usageBytes)} usado`
        : null;

  const tooltipDesc = [
    `Sincronizado automáticamente a las ${formattedTime}.`,
    sizeText,
    quotaText,
    'Clic para gestionar sincronización.',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="relative pointer-events-auto">
      <HudTooltip
        title="Guardado en Google Drive"
        description={tooltipDesc}
        side="bottom"
      >
        <button
          type="button"
          data-testid="hud-sync-indicator-saved"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white/90 px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-sm backdrop-blur-md transition hover:bg-emerald-50 cursor-pointer ${className}`}
        >
          <div className="relative flex items-center justify-center">
            <Cloud size={13} className="text-emerald-600" />
            <Check
              size={7}
              strokeWidth={3}
              className="absolute text-emerald-700"
            />
          </div>
          <span>Guardado en Google Drive</span>
        </button>
      </HudTooltip>

      {/* Popover Flyout Menú para desconectar o forzar sync */}
      {isMenuOpen && (
        <div
          data-testid="hud-sync-menu"
          className="absolute right-0 top-full mt-1.5 z-40 w-64 rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-xl backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <span className="text-xs font-bold text-slate-800">Google Drive Sync</span>
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-600 mb-1">
            Último respaldo: <span className="font-mono text-slate-800">{formattedTime}</span>
          </p>
          {sizeText && (
            <p className="text-[11px] text-slate-600 mb-1" data-testid="hud-sync-file-size">
              {sizeText}
            </p>
          )}
          {quotaText && (
            <p className="text-[11px] text-slate-600 mb-2" data-testid="hud-sync-quota">
              {quotaText}
            </p>
          )}
          <div className="flex flex-col gap-1.5 mt-2">
            <button
              type="button"
              onClick={handleManualFlush}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <RefreshCw size={12} className="text-slate-500" />
              <span>Sincronizar ahora</span>
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <LogOut size={12} className="text-rose-500" />
              <span>Desconectar Google Drive</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
