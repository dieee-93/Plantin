import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoomLoadProfiler } from '../roomLoadProfiler';
import { preloadBotanicalTextures, KEY_BOTANICAL_TEXTURES } from '../../SpacePlantSprite';
import { useTexture } from '@react-three/drei';

describe('RoomLoadProfiler - Millimetric Telemetry & Benchmarks', () => {
  let profiler: RoomLoadProfiler;

  beforeEach(() => {
    profiler = new RoomLoadProfiler();
    vi.restoreAllMocks();
  });

  it('records full T0 -> T4 lifecycle and prints console.table', () => {
    const tableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});
    const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

    // T0: Click
    profiler.start({ roomId: 'room-dos-asad', roomName: 'dos asad', plantCount: 5000 });
    const sessionT0 = profiler.getLastSession();
    expect(sessionT0).not.toBeNull();
    expect(sessionT0?.roomId).toBe('room-dos-asad');
    expect(sessionT0?.roomName).toBe('dos asad');
    expect(sessionT0?.t0).toBeGreaterThan(0);
    expect(sessionT0?.completed).toBe(false);

    // T1: Viewer Mount
    profiler.markViewerMount('room-dos-asad');
    const sessionT1 = profiler.getLastSession();
    expect(sessionT1?.t1Mount).toBeDefined();
    expect(sessionT1?.t1MountDurationMs).toBeGreaterThanOrEqual(0);

    // T2: Geometry & Spatial Hash
    profiler.markGeometryStart();
    profiler.markGeometryEnd(5000);
    const sessionT2 = profiler.getLastSession();
    expect(sessionT2?.t2GeometryDurationMs).toBeGreaterThanOrEqual(0);

    // T3: GPU Buffers (Canopy + Sprites)
    profiler.markGpuBuffers('canopy', 5000, 1.25);
    profiler.markGpuBuffers('sprites', 5000, 2.5);
    const sessionT3 = profiler.getLastSession();
    expect(sessionT3?.t3CanopyBuffersMs).toBe(1.25);
    expect(sessionT3?.t3SpriteBuffersMs).toBe(2.5);
    expect(sessionT3?.t3TotalBuffersMs).toBe(3.75);

    // T4: First WebGL Frame Rendered
    profiler.markFirstFrame(5000);
    const sessionT4 = profiler.getLastSession();
    expect(sessionT4?.completed).toBe(true);
    expect(sessionT4?.t4FirstFrame).toBeDefined();
    expect(sessionT4?.totalDurationMs).toBeGreaterThanOrEqual(0);

    // Assert console table was emitted with structured telemetry
    expect(groupSpy).toHaveBeenCalledWith(
      expect.stringContaining('[PERF: ROOM_LOAD]'),
      expect.any(String),
    );
    expect(tableSpy).toHaveBeenCalledTimes(1);
    const tableData = tableSpy.mock.calls[0][0];
    expect(Array.isArray(tableData)).toBe(true);
    expect(tableData.length).toBe(5);
    expect(tableData[0]['Paso']).toContain('T0 → T1: Montaje React Space3DViewer');
    expect(tableData[1]['Paso']).toContain('T1 → T2: Geometría & Spatial Hash Grid (5000 plantas)');
    expect(tableData[2]['Paso']).toContain('T2 → T3: Preparación Buffers GPU');
    expect(tableData[3]['Paso']).toContain('T3 → T4: Primer Frame WebGL Pintado');
    expect(tableData[4]['Paso']).toContain('TOTAL: Click a Primer Frame Pintado');
    expect(groupEndSpy).toHaveBeenCalled();
  });

  it('handles direct mount without T0 click gracefully', () => {
    profiler.markViewerMount('direct-room');
    const session = profiler.getLastSession();
    expect(session).not.toBeNull();
    expect(session?.roomId).toBe('direct-room');
    expect(session?.t0).toBeDefined();
    expect(session?.t1Mount).toBeDefined();
  });

  it('ignores duplicate markFirstFrame calls in the same session', () => {
    const tableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});
    profiler.start({ roomId: 'r1' });
    profiler.markFirstFrame(10);
    profiler.markFirstFrame(10);
    expect(tableSpy).toHaveBeenCalledTimes(1);
  });

  it('preloads essential botanical textures via useTexture.preload', () => {
    const preloadSpy = vi.spyOn(useTexture, 'preload');
    preloadBotanicalTextures();

    expect(preloadSpy).toHaveBeenCalled();
    KEY_BOTANICAL_TEXTURES.forEach((url) => {
      expect(preloadSpy).toHaveBeenCalledWith(url);
    });
  });
});
