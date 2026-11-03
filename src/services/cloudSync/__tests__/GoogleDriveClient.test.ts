import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GoogleDriveClient,
  GoogleDriveAuthError,
} from '../GoogleDriveClient';
import type { SyncManifest } from '../types';
import type { SpaceLayout1to1 } from '@/store/spaceLayoutStore';

describe('GoogleDriveClient - Drive REST API v3 (appDataFolder) & Exponential Backoff', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: GoogleDriveClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockFetch = vi.fn();
    client = new GoogleDriveClient({
      getAccessToken: () => 'valid-test-bearer-token',
      fetchFn: mockFetch as unknown as typeof fetch,
      baseDelayMs: 10,
      maxDelayMs: 50,
      maxRetries: 3,
    });
  });

  it('lists files in appDataFolder sending proper spaces query and authorization header', async () => {
    const mockFiles = [
      { id: 'f-manifest', name: 'manifest.json', modifiedTime: '2026-11-03T10:00:00Z' },
      { id: 'f-room-1', name: 'room_loc-1.json', modifiedTime: '2026-11-03T10:05:00Z' },
    ];

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ files: mockFiles }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const files = await client.listAppDataFiles();

    expect(files).toHaveLength(2);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [calledUrl, calledInit] = mockFetch.mock.calls[0];
    expect(calledUrl).toContain('spaces=appDataFolder');
    expect(calledInit.headers.get('Authorization')).toBe('Bearer valid-test-bearer-token');
  });

  it('gets file content with alt=media query', async () => {
    const mockContent = { hello: 'drive' };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockContent), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const data = await client.getAppDataFile<{ hello: string }>('file-id-abc');
    expect(data.hello).toBe('drive');

    const [calledUrl] = mockFetch.mock.calls[0];
    expect(calledUrl).toContain('file-id-abc?alt=media');
  });

  it('creates new file in appDataFolder using multipart POST with parents: [appDataFolder]', async () => {
    // 1. Search query: file doesn't exist
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ files: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    // 2. Multipart upload response
    const mockCreated = { id: 'file-new-123', name: 'room_loc-1.json' };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockCreated), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const created = await client.uploadOrUpdateFile('room_loc-1.json', { locationId: 'loc-1' });

    expect(created.id).toBe('file-new-123');
    expect(mockFetch).toHaveBeenCalledTimes(2);

    const [uploadUrl, uploadInit] = mockFetch.mock.calls[1];
    expect(uploadUrl).toContain('uploadType=multipart');
    expect(uploadInit.method).toBe('POST');
    expect(uploadInit.headers.get('Content-Type')).toContain('multipart/related');
    expect(uploadInit.body).toContain('"parents":["appDataFolder"]');
    expect(uploadInit.body).toContain('"locationId": "loc-1"');
  });

  it('updates existing file in appDataFolder using PATCH media', async () => {
    // 1. Search query: file exists with id 'file-existing-999'
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          files: [{ id: 'file-existing-999', name: 'manifest.json' }],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    // 2. PATCH media update
    const mockUpdated = { id: 'file-existing-999', name: 'manifest.json' };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockUpdated), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const updated = await client.uploadOrUpdateFile('manifest.json', { schemaVersion: 1 });

    expect(updated.id).toBe('file-existing-999');
    expect(mockFetch).toHaveBeenCalledTimes(2);

    const [updateUrl, updateInit] = mockFetch.mock.calls[1];
    expect(updateUrl).toContain('uploadType=media');
    expect(updateUrl).toContain('file-existing-999');
    expect(updateInit.method).toBe('PATCH');
    expect(updateInit.body).toContain('"schemaVersion": 1');
  });

  it('retries on 429 and 500 with exponential backoff and succeeds on 3rd attempt', async () => {
    // Attempt 1: 429
    mockFetch.mockResolvedValueOnce(new Response('Rate limit', { status: 429 }));
    // Attempt 2: 503
    mockFetch.mockResolvedValueOnce(new Response('Server Unavailable', { status: 503 }));
    // Attempt 3: 200 OK
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ files: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const files = await client.listAppDataFiles();
    expect(files).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('throws GoogleDriveAuthError immediately on 401 Unauthorized without retrying', async () => {
    mockFetch.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));

    await expect(client.listAppDataFiles()).rejects.toThrow(GoogleDriveAuthError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('saves and loads manifest and rooms cleanly', async () => {
    // 1. listAppDataFiles for loadManifest -> returns manifest file
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          files: [{ id: 'manifest-file-id', name: 'manifest.json' }],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const manifestData: SyncManifest = {
      schemaVersion: 1,
      updatedAt: '2026-11-03T12:00:00Z',
      rooms: {
        'room-alpha': {
          locationId: 'room-alpha',
          revision: 3,
          updatedAt: '2026-11-03T12:00:00Z',
          fileId: 'alpha-file-id',
        },
      },
    };

    // 2. getAppDataFile for manifest
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(manifestData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const loaded = await client.loadManifest();
    expect(loaded).not.toBeNull();
    expect(loaded?.fileId).toBe('manifest-file-id');
    expect(loaded?.manifest.rooms['room-alpha'].revision).toBe(3);

    // 3. loadRoom
    const mockRoomLayout: Partial<SpaceLayout1to1> = {
      locationId: 'room-alpha',
      presetId: 'greenhouse_1to1',
    };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockRoomLayout), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const room = await client.loadRoom('alpha-file-id');
    expect(room.locationId).toBe('room-alpha');
  });

  it('fetches storage quota from Google Drive about endpoint', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          storageQuota: {
            limit: '16106127360',
            usage: '1288490188',
            usageInDrive: '536870912',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const quota = await client.getStorageQuota();

    expect(quota).toEqual({
      limitBytes: 16106127360,
      usageBytes: 1288490188,
      usageInDriveBytes: 536870912,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [calledUrl] = mockFetch.mock.calls[0];
    expect(calledUrl).toContain('/about?fields=storageQuota');
  });

  it('populates size attribute on created and updated file metadata', async () => {
    // 1. Search (not found)
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ files: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    // 2. Creation response without size field from API
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'file-size-test', name: 'room_size.json' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const payload = { locationId: 'room_size', data: 'some layout content' };
    const expectedLength = new TextEncoder().encode(JSON.stringify(payload, null, 2)).length;

    const created = await client.uploadOrUpdateFile('room_size.json', payload);

    expect(created.id).toBe('file-size-test');
    expect(created.size).toBe(String(expectedLength));
  });
});
