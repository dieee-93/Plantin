import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { HudSyncIndicator, formatBytes } from '../HudSyncIndicator';
import { SyncCoordinator } from '@/services/cloudSync/SyncCoordinator';
import { GoogleAuthManager } from '@/services/cloudSync/GoogleAuthManager';
import { GoogleDriveClient } from '@/services/cloudSync/GoogleDriveClient';

describe('HudSyncIndicator - Glassmorphism Cloud Sync Status & Quick Connect Pill', () => {
  let authManager: GoogleAuthManager;
  let coordinator: SyncCoordinator;

  beforeEach(() => {
    vi.restoreAllMocks();
    authManager = new GoogleAuthManager('');
    coordinator = new SyncCoordinator(authManager, {}, {
      loadManifest: vi.fn().mockResolvedValue(null),
      saveManifest: vi.fn().mockResolvedValue({ id: 'm-id' }),
      loadRoom: vi.fn(),
      saveRoom: vi.fn().mockResolvedValue({ id: 'r-id' }),
    } as unknown as GoogleDriveClient);
  });

  it('renders "Modo local" pill when client ID is not configured', () => {
    render(<HudSyncIndicator coordinator={coordinator} authManager={authManager} />);
    expect(screen.getByTestId('hud-sync-indicator-local')).toBeInTheDocument();
    expect(screen.getByText('Modo local')).toBeInTheDocument();
  });

  it('renders "Conectar Google Drive" button when client ID is configured but disconnected', () => {
    authManager.init('configured-client-id.apps.googleusercontent.com');
    render(<HudSyncIndicator coordinator={coordinator} authManager={authManager} />);

    const connectBtn = screen.getByTestId('hud-sync-connect-button');
    expect(connectBtn).toBeInTheDocument();
    expect(screen.getByText('Conectar Google Drive')).toBeInTheDocument();

    const signInSpy = vi.spyOn(authManager, 'signIn').mockResolvedValue({
      accessToken: 'token-abc',
      expiresAt: Date.now() + 3600000,
    });

    fireEvent.click(connectBtn);
    expect(signInSpy).toHaveBeenCalledTimes(1);
  });

  it('renders "Guardado en Google Drive" when idle and authenticated', () => {
    vi.spyOn(authManager, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(authManager, 'getUser').mockReturnValue({
      accessToken: 'valid-token',
      expiresAt: Date.now() + 3600000,
    });
    authManager.init('configured-client-id');
    const authCoord = new SyncCoordinator(authManager);

    render(<HudSyncIndicator coordinator={authCoord} authManager={authManager} />);

    expect(screen.getByTestId('hud-sync-indicator-saved')).toBeInTheDocument();
    expect(screen.getAllByText('Guardado en Google Drive')[0]).toBeInTheDocument();

    // Clicking toggles quick management popover
    fireEvent.click(screen.getByTestId('hud-sync-indicator-saved'));
    expect(screen.getByTestId('hud-sync-menu')).toBeInTheDocument();
    expect(screen.getByText('Sincronizar ahora')).toBeInTheDocument();
    expect(screen.getByText('Desconectar Google Drive')).toBeInTheDocument();
  });

  it('renders "Sincronizando..." when syncing or pending', () => {
    vi.spyOn(authManager, 'isAuthenticated').mockReturnValue(true);
    const authCoord = new SyncCoordinator(authManager);
    authCoord.enqueueRoomChange('loc-1', {
      locationId: 'loc-1',
      presetId: 'greenhouse_1to1',
      baseBoundary: [],
      baseMaterial: 'soil',
      hardscapeZones: [],
      paths: [],
      walls: [],
      solarConfig: { latitudeDeg: 0, northAngleDeg: 0, season: 'summer', hourOfDay: 12 },
      placedPlants: [],
    });

    render(<HudSyncIndicator coordinator={authCoord} authManager={authManager} />);

    expect(screen.getByTestId('hud-sync-indicator-syncing')).toBeInTheDocument();
    expect(screen.getByText('Sincronizando...')).toBeInTheDocument();
  });

  it('renders "Modo local (sin conexión)" when offline', () => {
    window.dispatchEvent(new Event('offline'));

    render(<HudSyncIndicator coordinator={coordinator} authManager={authManager} />);

    expect(screen.getByTestId('hud-sync-indicator-offline')).toBeInTheDocument();
    expect(screen.getAllByText('Modo local (sin conexión)')[0]).toBeInTheDocument();

    // Restore online
    window.dispatchEvent(new Event('online'));
  });

  it('formats byte units cleanly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(25088)).toBe('24.5 KB');
    expect(formatBytes(15 * 1024 * 1024 * 1024)).toBe('15 GB');
  });

  it('displays saved layout size and Google Drive storage quota in details popover', () => {
    vi.spyOn(authManager, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(authManager, 'getUser').mockReturnValue({
      accessToken: 'valid-token',
      expiresAt: Date.now() + 3600000,
    });
    authManager.init('configured-client-id');
    const authCoord = new SyncCoordinator(authManager);

    vi.spyOn(authCoord, 'getDetail').mockReturnValue({
      status: 'idle',
      pendingCount: 0,
      lastSyncedAt: new Date(2026, 10, 3, 14, 30),
      error: null,
      user: { accessToken: 'valid-token', expiresAt: Date.now() + 3600000 },
      isOnline: true,
      lastSyncSizeBytes: 25088,
      storageQuota: {
        limitBytes: 15 * 1024 * 1024 * 1024,
        usageBytes: Math.round(1.2 * 1024 * 1024 * 1024),
      },
    });

    render(<HudSyncIndicator coordinator={authCoord} authManager={authManager} />);

    // Open popover menu
    fireEvent.click(screen.getByTestId('hud-sync-indicator-saved'));

    expect(screen.getByTestId('hud-sync-menu')).toBeInTheDocument();
    expect(screen.getByTestId('hud-sync-file-size')).toHaveTextContent('Tamaño del guardado: 24.5 KB');
    expect(screen.getByTestId('hud-sync-quota')).toHaveTextContent('Espacio en Google Drive: 1.2 GB / 15 GB');
  });
});
