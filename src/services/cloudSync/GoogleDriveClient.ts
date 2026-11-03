import type { GoogleDriveFileMeta, SyncManifest } from './types';
import type { SpaceLayout1to1 } from '@/store/spaceLayoutStore';

const DRIVE_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files';

export class GoogleDriveAuthError extends Error {
  constructor(message = 'Unauthorized Google Drive request (401)') {
    super(message);
    this.name = 'GoogleDriveAuthError';
  }
}

export class GoogleDriveRateLimitError extends Error {
  constructor(message = 'Google Drive rate limit reached (429)') {
    super(message);
    this.name = 'GoogleDriveRateLimitError';
  }
}

export interface GoogleDriveClientOptions {
  getAccessToken: () => string | null;
  fetchFn?: typeof fetch;
  baseDelayMs?: number;
  maxDelayMs?: number;
  maxRetries?: number;
}

export class GoogleDriveClient {
  private getAccessToken: () => string | null;
  private fetchFn: typeof fetch;
  private baseDelayMs: number;
  private maxDelayMs: number;
  private maxRetries: number;
  // Caché en memoria de fileIds en appDataFolder: filename -> fileId
  private fileIdCache = new Map<string, string>();

  constructor(options: GoogleDriveClientOptions) {
    this.getAccessToken = options.getAccessToken;
    this.fetchFn = options.fetchFn || (typeof window !== 'undefined' ? window.fetch.bind(window) : fetch);
    this.baseDelayMs = options.baseDelayMs ?? 400;
    this.maxDelayMs = options.maxDelayMs ?? 5000;
    this.maxRetries = options.maxRetries ?? 3;
  }

  public clearCache(): void {
    this.fileIdCache.clear();
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Ejecuta peticiones fetch con Exponential Backoff y Jitter
   * ante 429, 5xx o errores de red.
   */
  public async fetchWithBackoff(url: string, init: RequestInit): Promise<Response> {
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      const token = this.getAccessToken();
      if (!token) {
        throw new GoogleDriveAuthError('No access token available for Google Drive.');
      }

      const headers = new Headers(init.headers || {});
      headers.set('Authorization', `Bearer ${token}`);

      try {
        const response = await this.fetchFn(url, { ...init, headers });

        if (response.status === 401) {
          throw new GoogleDriveAuthError(`Google Drive 401 Unauthorized for ${url}`);
        }

        const isRateLimit = response.status === 429;
        const isServerError = response.status >= 500 && response.status < 600;

        if ((isRateLimit || isServerError) && attempt < this.maxRetries) {
          const jitter = Math.random() * 200;
          const delay = Math.min(
            this.maxDelayMs,
            this.baseDelayMs * Math.pow(2, attempt) + jitter,
          );
          attempt++;
          await this.sleep(delay);
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');
          if (isRateLimit) {
            throw new GoogleDriveRateLimitError(`Rate limit (429): ${errorBody}`);
          }
          throw new Error(`Google Drive API error (${response.status}): ${errorBody}`);
        }

        return response;
      } catch (err: unknown) {
        if (err instanceof GoogleDriveAuthError) {
          throw err;
        }

        if (attempt < this.maxRetries) {
          const jitter = Math.random() * 200;
          const delay = Math.min(
            this.maxDelayMs,
            this.baseDelayMs * Math.pow(2, attempt) + jitter,
          );
          attempt++;
          await this.sleep(delay);
          continue;
        }

        throw err;
      }
    }

    throw new Error(`Exceeded maximum retries (${this.maxRetries}) for Google Drive request`);
  }

  /**
   * Lista todos los archivos existentes en el appDataFolder
   */
  public async listAppDataFiles(): Promise<GoogleDriveFileMeta[]> {
    const params = new URLSearchParams({
      spaces: 'appDataFolder',
      fields: 'files(id, name, modifiedTime, size, mimeType)',
      pageSize: '100',
    });

    const url = `${DRIVE_FILES_ENDPOINT}?${params.toString()}`;
    const response = await this.fetchWithBackoff(url, { method: 'GET' });
    const data = (await response.json()) as { files?: GoogleDriveFileMeta[] };
    const files = data.files || [];

    // Actualizar caché
    for (const f of files) {
      if (f.name && f.id) {
        this.fileIdCache.set(f.name, f.id);
      }
    }

    return files;
  }

  /**
   * Obtiene el contenido de un archivo por su ID
   */
  public async getAppDataFile<T = unknown>(fileId: string): Promise<T> {
    const url = `${DRIVE_FILES_ENDPOINT}/${encodeURIComponent(fileId)}?alt=media`;
    const response = await this.fetchWithBackoff(url, { method: 'GET' });
    return (await response.json()) as T;
  }

  /**
   * Sube un archivo nuevo o actualiza uno existente en appDataFolder
   */
  public async uploadOrUpdateFile(
    filename: string,
    content: string | object,
    mimeType = 'application/json',
  ): Promise<GoogleDriveFileMeta> {
    const jsonString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

    let fileId = this.fileIdCache.get(filename);
    if (!fileId) {
      // Consultar si existe en Drive
      const query = `name = '${filename}' and 'appDataFolder' in parents and trashed = false`;
      const params = new URLSearchParams({
        spaces: 'appDataFolder',
        q: query,
        fields: 'files(id, name, modifiedTime, size, mimeType)',
        pageSize: '1',
      });
      const searchRes = await this.fetchWithBackoff(`${DRIVE_FILES_ENDPOINT}?${params.toString()}`, {
        method: 'GET',
      });
      const data = (await searchRes.json()) as { files?: GoogleDriveFileMeta[] };
      if (data.files && data.files.length > 0) {
        fileId = data.files[0].id;
        this.fileIdCache.set(filename, fileId);
      }
    }

    if (fileId) {
      // Archivo ya existe: PATCH de medios
      const uploadUrl = `${DRIVE_UPLOAD_ENDPOINT}/${encodeURIComponent(fileId)}?uploadType=media`;
      const updateRes = await this.fetchWithBackoff(uploadUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': mimeType,
        },
        body: jsonString,
      });
      const updatedMeta = (await updateRes.json()) as GoogleDriveFileMeta;
      this.fileIdCache.set(filename, updatedMeta.id);
      return updatedMeta;
    }

    // Archivo no existe: POST multipart a appDataFolder
    const boundary = `plantin_boundary_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const metadata = {
      name: filename,
      parents: ['appDataFolder'],
    };

    const multipartBody =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n` +
      `${jsonString}\r\n` +
      `--${boundary}--`;

    const createUrl = `${DRIVE_UPLOAD_ENDPOINT}?uploadType=multipart`;
    const createRes = await this.fetchWithBackoff(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    });

    const createdMeta = (await createRes.json()) as GoogleDriveFileMeta;
    this.fileIdCache.set(filename, createdMeta.id);
    return createdMeta;
  }

  /**
   * Elimina un archivo por su ID
   */
  public async deleteFile(fileId: string): Promise<void> {
    const url = `${DRIVE_FILES_ENDPOINT}/${encodeURIComponent(fileId)}`;
    await this.fetchWithBackoff(url, { method: 'DELETE' });
    // Limpiar de caché
    for (const [name, id] of this.fileIdCache.entries()) {
      if (id === fileId) {
        this.fileIdCache.delete(name);
        break;
      }
    }
  }

  // ── Métodos de conveniencia específicos del dominio ──

  public static getRoomFilename(locationId: string): string {
    return `room_${locationId}.json`;
  }

  public static getManifestFilename(): string {
    return 'manifest.json';
  }

  public async loadManifest(): Promise<{ fileId: string; manifest: SyncManifest } | null> {
    const files = await this.listAppDataFiles();
    const manifestFile = files.find((f) => f.name === GoogleDriveClient.getManifestFilename());
    if (!manifestFile) return null;

    const manifest = await this.getAppDataFile<SyncManifest>(manifestFile.id);
    return { fileId: manifestFile.id, manifest };
  }

  public async saveManifest(manifest: SyncManifest): Promise<GoogleDriveFileMeta> {
    return this.uploadOrUpdateFile(GoogleDriveClient.getManifestFilename(), manifest);
  }

  public async loadRoom(fileId: string): Promise<SpaceLayout1to1> {
    return this.getAppDataFile<SpaceLayout1to1>(fileId);
  }

  public async saveRoom(
    locationId: string,
    layout: SpaceLayout1to1,
  ): Promise<GoogleDriveFileMeta> {
    return this.uploadOrUpdateFile(GoogleDriveClient.getRoomFilename(locationId), layout);
  }
}
