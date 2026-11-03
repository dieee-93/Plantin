import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GoogleAuthManager,
  DRIVE_APPDATA_SCOPE,
  type GoogleTokenResponse,
  type TokenClientOptions,
} from '../GoogleAuthManager';

describe('GoogleAuthManager - Google Identity Services & OAuth2 Token Lifecycle', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
    delete (window as unknown as { google?: unknown }).google;
  });

  it('initializes in disconnected state when no client_id is provided', () => {
    const manager = new GoogleAuthManager('');
    expect(manager.isConfigured()).toBe(false);
    expect(manager.isAuthenticated()).toBe(false);
    expect(manager.getAccessToken()).toBeNull();
    expect(manager.getUser()).toBeNull();
  });

  it('hydrates valid non-expired session from sessionStorage (never localStorage)', () => {
    const validUser = {
      accessToken: 'token-valid-123',
      expiresAt: Date.now() + 3600 * 1000,
    };
    sessionStorage.setItem('plantin_gis_auth_token_v1', JSON.stringify(validUser));
    // Verify localStorage has nothing
    expect(localStorage.getItem('plantin_gis_auth_token_v1')).toBeNull();

    const manager = new GoogleAuthManager('test-client-id.apps.googleusercontent.com');
    expect(manager.isConfigured()).toBe(true);
    expect(manager.isAuthenticated()).toBe(true);
    expect(manager.getAccessToken()).toBe('token-valid-123');
    expect(manager.getUser()?.accessToken).toBe('token-valid-123');

    // Never stored in localStorage
    expect(localStorage.length).toBe(0);
    manager.cleanup();
  });

  it('discards expired token from sessionStorage during initialization', () => {
    const expiredUser = {
      accessToken: 'token-expired',
      expiresAt: Date.now() - 5000,
    };
    sessionStorage.setItem('plantin_gis_auth_token_v1', JSON.stringify(expiredUser));

    const manager = new GoogleAuthManager('test-client-id');
    expect(manager.isAuthenticated()).toBe(false);
    expect(manager.getAccessToken()).toBeNull();
    expect(sessionStorage.getItem('plantin_gis_auth_token_v1')).toBeNull();
  });

  it('performs signIn using Google Identity Services tokenClient', async () => {
    let capturedCallback: ((resp: GoogleTokenResponse) => void) | null = null;
    const mockRequestAccessToken = vi.fn(() => {
      // Simular respuesta exitosa de GIS
      if (capturedCallback) {
        capturedCallback({
          access_token: 'mock-gis-token-456',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: DRIVE_APPDATA_SCOPE,
        });
      }
    });

    window.google = {
      accounts: {
        oauth2: {
          initTokenClient: vi.fn((opts: TokenClientOptions) => {
            capturedCallback = opts.callback;
            return {
              requestAccessToken: mockRequestAccessToken,
            };
          }),
        },
      },
    };

    const manager = new GoogleAuthManager('dummy-id.apps.googleusercontent.com');
    const user = await manager.signIn();

    expect(user.accessToken).toBe('mock-gis-token-456');
    expect(user.expiresAt).toBeGreaterThan(Date.now() + 3500 * 1000);
    expect(manager.isAuthenticated()).toBe(true);
    expect(manager.getAccessToken()).toBe('mock-gis-token-456');

    // Stored in sessionStorage
    const stored = JSON.parse(sessionStorage.getItem('plantin_gis_auth_token_v1') || '{}');
    expect(stored.accessToken).toBe('mock-gis-token-456');

    manager.cleanup();
  });

  it('handles OAuth error response during signIn', async () => {
    let capturedCallback: ((resp: GoogleTokenResponse) => void) | null = null;
    window.google = {
      accounts: {
        oauth2: {
          initTokenClient: vi.fn((opts: TokenClientOptions) => {
            capturedCallback = opts.callback;
            return {
              requestAccessToken: vi.fn(() => {
                if (capturedCallback) {
                  capturedCallback({
                    access_token: '',
                    expires_in: 0,
                    error: 'access_denied',
                    error_description: 'User canceled authorization',
                  });
                }
              }),
            };
          }),
        },
      },
    };

    const manager = new GoogleAuthManager('dummy-id');
    await expect(manager.signIn()).rejects.toThrow(/access_denied/);
    expect(manager.isAuthenticated()).toBe(false);
  });

  it('signOut clears token, session, timers, and notifies subscribers', () => {
    const validUser = {
      accessToken: 'token-active',
      expiresAt: Date.now() + 3600 * 1000,
    };
    sessionStorage.setItem('plantin_gis_auth_token_v1', JSON.stringify(validUser));

    const manager = new GoogleAuthManager('test-client-id');
    const listener = vi.fn();
    manager.subscribe(listener);

    // Initial subscriber call
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'token-active' }));

    manager.signOut();

    expect(manager.isAuthenticated()).toBe(false);
    expect(manager.getAccessToken()).toBeNull();
    expect(sessionStorage.getItem('plantin_gis_auth_token_v1')).toBeNull();
    expect(listener).toHaveBeenLastCalledWith(null);

    manager.cleanup();
  });
});
