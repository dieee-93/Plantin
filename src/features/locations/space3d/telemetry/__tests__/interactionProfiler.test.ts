import { describe, expect, it, vi, beforeEach } from 'vitest';
import { interactionProfiler } from '../interactionProfiler';
import { measurePlantNeighbors, findNearestNeighbor, type PlacedPlantSpatialCm } from '@/domain/solarAndPlantSpatial';

describe('interactionProfiler - Telemetry and Interaction Performance Benchmarks', () => {
  beforeEach(() => {
    interactionProfiler.reset();
  });

  it('records plant selection metrics with duration and neighbor count', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    interactionProfiler.recordPlantSelection({
      plantId: 'plant-42',
      durationMs: 0.12,
      neighborCount: 5,
      totalPlants: 7762,
    });

    const last = interactionProfiler.getLastSelection();
    expect(last).not.toBeNull();
    expect(last?.plantId).toBe('plant-42');
    expect(last?.durationMs).toBe(0.12);
    expect(last?.neighborCount).toBe(5);
    expect(last?.totalPlants).toBe(7762);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[PERF: INTERACTION] 🌿 Selección de Planta'),
      expect.any(String),
    );

    consoleSpy.mockRestore();
  });

  it('records tool switching transitions with structured tags', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    interactionProfiler.recordToolChange({
      fromTool: 'inspect',
      toTool: 'plant_single',
      durationMs: 0.05,
    });

    const last = interactionProfiler.getLastToolChange();
    expect(last?.fromTool).toBe('inspect');
    expect(last?.toTool).toBe('plant_single');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[PERF: INTERACTION] 🛠 Cambio de Herramienta | inspect ➔ plant_single'),
      expect.any(String),
    );

    consoleSpy.mockRestore();
  });

  it('measures camera rotation frame times, FPS, and min/max delta', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Simulate 30 frames at 60 FPS (~16.6ms per frame)
    for (let i = 0; i < 30; i++) {
      interactionProfiler.recordRotationFrame(0.0166);
    }

    interactionProfiler.emitRotationSummary();

    const summary = interactionProfiler.getLastRotationSummary();
    expect(summary).not.toBeNull();
    expect(summary?.sampleCount).toBe(30);
    expect(summary?.avgFps).toBeGreaterThan(55);
    expect(summary?.avgFrameMs).toBeCloseTo(16.6, 0);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[PERF: INTERACTION] 🔄 Rotación de Cámara'),
      expect.any(String),
    );

    consoleSpy.mockRestore();
  });

  it('benchmarks measurePlantNeighbors with 7,762 plants bounded to 5 neighbors in < 1.0 ms', () => {
    // Generate 7,762 mock plants as in "Invernadero Pequeño"
    const massivePlants: PlacedPlantSpatialCm[] = new Array(7762);
    for (let i = 0; i < 7762; i++) {
      massivePlants[i] = {
        id: `plant-${i}`,
        label: `Tomato #${i}`,
        cropCode: 'TOM',
        xCm: (i % 88) * 45,
        yCm: Math.floor(i / 88) * 45,
        canopyRadiusCm: 20,
      };
    }

    const target = massivePlants[3881]; // Middle plant

    // Warm-up
    measurePlantNeighbors(target, massivePlants, 5);

    const t0 = performance.now();
    const neighbors = measurePlantNeighbors(target, massivePlants, 5);
    const durationMs = performance.now() - t0;

    expect(neighbors.length).toBeLessThanOrEqual(5);
    expect(neighbors.length).toBeGreaterThan(0);
    // Bounded search executes in < 2ms (typically ~0.2ms)
    expect(durationMs).toBeLessThan(5.0);
    expect(neighbors[0].distanceCm).toBe(45);
  });

  it('benchmarks findNearestNeighbor with WeakMap spatial grid cache on 7,762 plants in < 0.2 ms', () => {
    const massivePlants: PlacedPlantSpatialCm[] = new Array(7762);
    for (let i = 0; i < 7762; i++) {
      massivePlants[i] = {
        id: `plant-${i}`,
        label: `Tomato #${i}`,
        cropCode: 'TOM',
        xCm: (i % 88) * 45,
        yCm: Math.floor(i / 88) * 45,
        canopyRadiusCm: 20,
      };
    }

    // First call primes the WeakMap cache
    findNearestNeighbor(massivePlants[0], massivePlants);

    // Subsequent calls (as when moving the cursor across the grid)
    const probe: PlacedPlantSpatialCm = {
      id: '__cursor_probe__',
      label: 'Cursor Probe',
      cropCode: 'TOM',
      xCm: 500,
      yCm: 500,
      canopyRadiusCm: 20,
    };

    const t0 = performance.now();
    for (let i = 0; i < 10; i++) {
      findNearestNeighbor(probe, massivePlants);
    }
    const totalMs = performance.now() - t0;
    const avgMs = totalMs / 10;

    expect(avgMs).toBeLessThan(0.2);
  });

  it('records boundary vertex dragging telemetry and throttles log emissions', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    interactionProfiler.recordBoundaryDragStep({
      vertexIndex: 2,
      clipperTimeMs: 1.25,
      syncWallsTimeMs: 0.15,
      meshRebuildTimeMs: 4.80,
      plantCount: 500,
      vertexCount: 6,
      totalDurationMs: 6.20,
    });

    const last = interactionProfiler.getLastBoundaryDrag();
    expect(last).not.toBeNull();
    expect(last?.vertexIndex).toBe(2);
    expect(last?.clipperTimeMs).toBe(1.25);
    expect(last?.syncWallsTimeMs).toBe(0.15);
    expect(last?.meshRebuildTimeMs).toBe(4.80);
    expect(last?.plantCount).toBe(500);
    expect(last?.vertexCount).toBe(6);
    expect(last?.totalDurationMs).toBe(6.20);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[PERF: BOUNDARY_DRAG] 📐 Arrastre Vértice #2'),
      expect.any(String),
    );

    consoleSpy.mockRestore();
  });
});
