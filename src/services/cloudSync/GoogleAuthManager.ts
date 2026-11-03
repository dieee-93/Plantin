import type { GoogleAuthUser } from './types';

export const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const SESSION_STORAGE_KEY = 'plantin_gis_auth_token_v1';
const DEFAULT_RENEW_MARGIN_MS = 5 * 60 * 1000; // 5 minutos antes de expirar

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: string | number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

export interface TokenClientOptions {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (error: unknown) => void;
}

export interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: TokenClientOptions) => GoogleTokenClient;
        };
      };
    };
  }
}

export class GoogleAuthManager {
  private clientId: string | null = null;
  private currentUser: GoogleAuthUser | null = null;
  private tokenClient: GoogleTokenClient | null = null;
  private listeners = new Set<(user: GoogleAuthUser | null) => void>();
  private renewTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingSignInPromise: {
    resolve: (user: GoogleAuthUser) => void;
    reject: (err: Error) => void;
  } | null = null;

  constructor(initialClientId?: string) {
    const envClientId =
      typeof import.meta !== 'undefined' && import.meta.env
        ? (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)
        : undefined;

    this.clientId =
      initialClientId !== undefined
        ? (initialClientId.trim() ? initialClientId : null)
        : (envClientId || null);
    this.hydrateFromSession();
  }

  public init(clientId?: string): void {
    if (clientId !== undefined) {
      this.clientId = clientId.trim() ? clientId : null;
    }
    this.tokenClient = null; // Re-inicializar si cambia
  }

  public getClientId(): string | null {
    return this.clientId;
  }

  public isConfigured(): boolean {
    return Boolean(this.clientId && this.clientId.trim().length > 0);
  }

  public isAuthenticated(): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.expiresAt > Date.now();
  }

  public getAccessToken(): string | null {
    if (this.isAuthenticated()) {
      return this.currentUser?.accessToken ?? null;
    }
    return null;
  }

  public getUser(): GoogleAuthUser | null {
    return this.currentUser;
  }

  public subscribe(listener: (user: GoogleAuthUser | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentUser);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentUser);
      } catch (e) {
        console.error('[GoogleAuthManager] Error in listener callback:', e);
      }
    }
  }

  private hydrateFromSession(): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    try {
      const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return;
      const parsed: GoogleAuthUser = JSON.parse(raw);
      if (parsed && parsed.accessToken && parsed.expiresAt > Date.now()) {
        this.currentUser = parsed;
        this.scheduleSilentRenewal();
      } else {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {
      // Ignorar errores de parsing
    }
  }

  private saveToSession(user: GoogleAuthUser): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('[GoogleAuthManager] Could not save token to sessionStorage:', e);
    }
  }

  private clearSession(): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    try {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignorar
    }
  }

  public loadGsiScript(): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.resolve();
    }
    if (window.google?.accounts?.oauth2) {
      return Promise.resolve();
    }

    const existingScript = document.querySelector(`script[src="${GSI_SCRIPT_URL}"]`);
    if (existingScript) {
      return new Promise((resolve, reject) => {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () =>
          reject(new Error('Failed to load Google Identity Services script.')),
        );
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GSI_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Failed to load Google Identity Services script.'));
      document.head.appendChild(script);
    });
  }

  private ensureTokenClient(): GoogleTokenClient {
    if (this.tokenClient) return this.tokenClient;
    if (!this.clientId) {
      throw new Error(
        'Google Client ID is not configured. Set VITE_GOOGLE_CLIENT_ID or call init(clientId).',
      );
    }
    if (!window.google?.accounts?.oauth2) {
      throw new Error('Google Identity Services SDK is not loaded.');
    }

    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: this.clientId,
      scope: DRIVE_APPDATA_SCOPE,
      callback: (resp: GoogleTokenResponse) => {
        if (resp.error) {
          const err = new Error(`OAuth error: ${resp.error} - ${resp.error_description || ''}`);
          if (this.pendingSignInPromise) {
            this.pendingSignInPromise.reject(err);
            this.pendingSignInPromise = null;
          }
          console.error('[GoogleAuthManager]', err);
          return;
        }

        const expiresInSec = typeof resp.expires_in === 'number'
          ? resp.expires_in
          : parseInt(resp.expires_in || '3600', 10) || 3600;

        const user: GoogleAuthUser = {
          accessToken: resp.access_token,
          expiresAt: Date.now() + expiresInSec * 1000,
        };

        this.currentUser = user;
        this.saveToSession(user);
        this.scheduleSilentRenewal();
        this.notifyListeners();

        if (this.pendingSignInPromise) {
          this.pendingSignInPromise.resolve(user);
          this.pendingSignInPromise = null;
        }
      },
      error_callback: (err: unknown) => {
        const error = err instanceof Error ? err : new Error(String(err));
        if (this.pendingSignInPromise) {
          this.pendingSignInPromise.reject(error);
          this.pendingSignInPromise = null;
        }
      },
    });

    return this.tokenClient;
  }

  public async signIn(prompt = 'consent'): Promise<GoogleAuthUser> {
    if (!this.isConfigured()) {
      throw new Error('Google Drive sync is not configured (missing VITE_GOOGLE_CLIENT_ID).');
    }

    await this.loadGsiScript();
    const client = this.ensureTokenClient();

    return new Promise<GoogleAuthUser>((resolve, reject) => {
      this.pendingSignInPromise = { resolve, reject };
      try {
        client.requestAccessToken({ prompt });
      } catch (err) {
        this.pendingSignInPromise = null;
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  public signOut(): void {
    if (this.renewTimer) {
      clearTimeout(this.renewTimer);
      this.renewTimer = null;
    }
    this.currentUser = null;
    this.clearSession();
    this.notifyListeners();
  }

  private scheduleSilentRenewal(): void {
    if (this.renewTimer) {
      clearTimeout(this.renewTimer);
      this.renewTimer = null;
    }

    if (!this.currentUser) return;

    const timeUntilExpiry = this.currentUser.expiresAt - Date.now();
    // Renovar 5 min antes, o si falta menos de 5 min pero más de 10 seg, a la mitad del tiempo restante
    const delay = Math.max(
      1000,
      timeUntilExpiry > DEFAULT_RENEW_MARGIN_MS
        ? timeUntilExpiry - DEFAULT_RENEW_MARGIN_MS
        : Math.floor(timeUntilExpiry / 2),
    );

    this.renewTimer = setTimeout(async () => {
      try {
        await this.silentRenew();
      } catch (e) {
        console.warn('[GoogleAuthManager] Silent token renewal failed:', e);
      }
    }, delay);
  }

  public async silentRenew(): Promise<GoogleAuthUser | null> {
    if (!this.isConfigured()) return null;
    try {
      await this.loadGsiScript();
      const client = this.ensureTokenClient();
      return await new Promise<GoogleAuthUser>((resolve, reject) => {
        this.pendingSignInPromise = { resolve, reject };
        client.requestAccessToken({ prompt: '' });
      });
    } catch (e) {
      console.warn('[GoogleAuthManager] Silent renewal skipped or failed:', e);
      return null;
    }
  }

  public cleanup(): void {
    if (this.renewTimer) {
      clearTimeout(this.renewTimer);
      this.renewTimer = null;
    }
    this.listeners.clear();
    this.pendingSignInPromise = null;
  }
}

export const googleAuthManager = new GoogleAuthManager();
