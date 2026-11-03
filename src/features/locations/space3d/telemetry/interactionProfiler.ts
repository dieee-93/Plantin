/**
 * Millimetric Interaction Telemetry & Profiling Module for 3D Space Interactions.
 *
 * Measures sub-millisecond execution times and rendering performance for:
 * 1. Plant Selection (`onSelectPlant` + `measurePlantNeighbors` + contextual action bar)
 * 2. Tool Switching (`setTool` / active tool transitions)
 * 3. Cursor Plant Preview (`computeCursorPlantPreview` + spatial hash lookup)
 * 4. Camera Rotation & Azimuth Updates (Frame Time, Render loop delta & FPS during OrbitControls rotation)
 * 5. Instanced Buffer Updates (Canopy and Sprite matrix/color buffer updates & GPU uploads)
 *
 * Emits high-precision performance marks, measures, and structured console logs with [PERF: INTERACTION].
 */

export interface PlantSelectionTelemetry {
  plantId: string | null;
  durationMs: number;
  neighborCount: number;
  totalPlants: number;
  timestamp: number;
}

export interface ToolChangeTelemetry {
  fromTool: string;
  toTool: string;
  durationMs: number;
  timestamp: number;
}

export interface BoundaryDragTelemetry {
  vertexIndex: number;
  totalDurationMs: number;
  clipperTimeMs: number;
  syncWallsTimeMs: number;
  meshRebuildTimeMs: number;
  plantCount: number;
  vertexCount: number;
  timestamp: number;
}

export interface RotationTelemetrySummary {
  sampleCount: number;
  totalDurationMs: number;
  avgFrameMs: number;
  minFrameMs: number;
  maxFrameMs: number;
  avgFps: number;
}

export class InteractionProfiler {
  private lastSelection: PlantSelectionTelemetry | null = null;
  private lastToolChange: ToolChangeTelemetry | null = null;

  // Camera Rotation frame timing buffer
  private isRotating = false;
  private rotationSamples: number[] = [];
  private lastRotationTimestamp = 0;
  private rotationTimerId: ReturnType<typeof setTimeout> | null = null;
  private lastRotationSummary: RotationTelemetrySummary | null = null;

  // Throttled cursor preview telemetry
  private lastCursorLogTime = 0;
  private lastBoundaryDragLogTime = 0;
  private lastBoundaryDrag: BoundaryDragTelemetry | null = null;

  /**
   * Records execution metrics for plant selection (target identification + neighbor measurement).
   */
  recordPlantSelection(params: {
    plantId: string | null;
    durationMs: number;
    neighborCount: number;
    totalPlants: number;
  }): void {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.lastSelection = {
      ...params,
      timestamp: now,
    };

    try {
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark('interaction-select-plant-end');
      }
    } catch {
      // Ignore in unsupported environments
    }

    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      const plantLabel = params.plantId ? `Planta "${params.plantId}"` : 'Deselección';
      console.log(
        `%c[PERF: INTERACTION] 🌿 Selección de Planta | ${plantLabel} | Duración: ${params.durationMs.toFixed(2)}ms | Vecinos medidos: ${params.neighborCount} | Total Sala: ${params.totalPlants}`,
        'color: #10b981; font-weight: bold;',
      );
    }
  }

  /**
   * Records execution metrics for tool switching in the 3D builder.
   */
  recordToolChange(params: {
    fromTool: string;
    toTool: string;
    durationMs: number;
  }): void {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.lastToolChange = {
      ...params,
      timestamp: now,
    };

    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log(
        `%c[PERF: INTERACTION] 🛠 Cambio de Herramienta | ${params.fromTool} ➔ ${params.toTool} | Duración: ${params.durationMs.toFixed(2)}ms`,
        'color: #f59e0b; font-weight: bold;',
      );
    }
  }

  /**
   * Records cursor plant preview computation time (throttled to avoid flooding console).
   */
  recordCursorPreview(params: {
    durationMs: number;
    totalPlants: number;
  }): void {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    // Log at most once every 1000ms during cursor dragging
    if (now - this.lastCursorLogTime > 1000) {
      this.lastCursorLogTime = now;
      if (typeof console !== 'undefined' && typeof console.log === 'function') {
        console.log(
          `%c[PERF: INTERACTION] 🎯 Cursor Preview | Duración: ${params.durationMs.toFixed(2)}ms | Plantas indexadas: ${params.totalPlants}`,
          'color: #06b6d4; font-weight: bold;',
        );
      }
    }
  }

  /**
   * Records buffer update time when instanced mesh buffers are uploaded to GPU.
   */
  recordBufferUpdate(params: {
    layer: 'canopy' | 'sprites';
    count: number;
    durationMs: number;
    reason: 'mount' | 'layout' | 'selection';
  }): void {
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      const badge = params.layer === 'canopy' ? '⭕ Canopy Rings' : '🌿 Plant Sprites';
      console.log(
        `%c[PERF: INTERACTION] ⚡ GPU Buffer Update (${params.reason}) | ${badge} | Instancias: ${params.count} | Tiempo: ${params.durationMs.toFixed(2)}ms`,
        'color: #3b82f6; font-weight: bold;',
      );
    }
  }

  /**
   * Records boundary vertex dragging frame performance.
   * Throttles console emission to at most once every 500ms during continuous drag.
   */
  recordBoundaryDragStep(params: {
    vertexIndex: number;
    clipperTimeMs: number;
    syncWallsTimeMs: number;
    meshRebuildTimeMs: number;
    plantCount: number;
    vertexCount: number;
    totalDurationMs: number;
  }): void {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.lastBoundaryDrag = {
      ...params,
      timestamp: now,
    };

    if (now - this.lastBoundaryDragLogTime > 500) {
      this.lastBoundaryDragLogTime = now;
      if (typeof console !== 'undefined' && typeof console.log === 'function') {
        console.log(
          `%c[PERF: BOUNDARY_DRAG] 📐 Arrastre Vértice #${params.vertexIndex} | Total: ${params.totalDurationMs.toFixed(2)}ms | Clipper: ${params.clipperTimeMs.toFixed(2)}ms | Paredes: ${params.syncWallsTimeMs.toFixed(2)}ms | Mallas: ${params.meshRebuildTimeMs.toFixed(2)}ms | Plantas: ${params.plantCount} | Vértices: ${params.vertexCount}`,
          'color: #8b5cf6; font-weight: bold;',
        );
      }
    }
  }

  /**
   * Starts or continues tracking camera rotation frame times.
   */
  recordRotationFrame(deltaSeconds: number): void {
    const deltaMs = deltaSeconds * 1000;
    // Discard absurd initial delta spikes (> 250ms)
    if (deltaMs > 0 && deltaMs < 250) {
      this.rotationSamples.push(deltaMs);
    }

    this.isRotating = true;
    this.lastRotationTimestamp = typeof performance !== 'undefined' ? performance.now() : Date.now();

    // Skip trailing timer in test environment to avoid lingering handles
    if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test') {
      return;
    }

    // Reset inactivity debounce timer (300ms after last frame)
    if (this.rotationTimerId) {
      clearTimeout(this.rotationTimerId);
    }

    this.rotationTimerId = setTimeout(() => {
      this.emitRotationSummary();
    }, 300);
  }

  /**
   * Dispatches summary log of camera rotation frame rate and timings.
   */
  emitRotationSummary(): void {
    this.isRotating = false;
    if (this.rotationTimerId) {
      clearTimeout(this.rotationTimerId);
      this.rotationTimerId = null;
    }

    if (this.rotationSamples.length < 5) {
      this.rotationSamples = [];
      return;
    }

    const samples = this.rotationSamples;
    const count = samples.length;
    let sumMs = 0;
    let minMs = Infinity;
    let maxMs = -Infinity;

    for (let i = 0; i < count; i++) {
      const s = samples[i];
      sumMs += s;
      if (s < minMs) minMs = s;
      if (s > maxMs) maxMs = s;
    }

    const avgFrameMs = sumMs / count;
    const avgFps = avgFrameMs > 0 ? 1000 / avgFrameMs : 0;

    const summary: RotationTelemetrySummary = {
      sampleCount: count,
      totalDurationMs: sumMs,
      avgFrameMs,
      minFrameMs: minMs,
      maxFrameMs: maxMs,
      avgFps,
    };
    this.lastRotationSummary = summary;
    this.rotationSamples = [];

    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      const fpsColor = avgFps >= 50 ? '#10b981' : avgFps >= 30 ? '#f59e0b' : '#ef4444';
      console.log(
        `%c[PERF: INTERACTION] 🔄 Rotación de Cámara | Avg FPS: ${avgFps.toFixed(1)} | Frame Time: ${avgFrameMs.toFixed(2)}ms (Min: ${minMs.toFixed(1)}ms, Max: ${maxMs.toFixed(1)}ms) | Muestras: ${count}`,
        `color: ${fpsColor}; font-weight: bold;`,
      );
    }
  }

  getLastSelection(): PlantSelectionTelemetry | null {
    return this.lastSelection;
  }

  getLastToolChange(): ToolChangeTelemetry | null {
    return this.lastToolChange;
  }

  getLastRotationSummary(): RotationTelemetrySummary | null {
    return this.lastRotationSummary;
  }

  getIsRotating(): boolean {
    return this.isRotating;
  }

  getLastRotationTimestamp(): number {
    return this.lastRotationTimestamp;
  }

  getLastBoundaryDrag(): BoundaryDragTelemetry | null {
    return this.lastBoundaryDrag;
  }

  reset(): void {
    this.lastSelection = null;
    this.lastToolChange = null;
    this.lastBoundaryDrag = null;
    this.lastBoundaryDragLogTime = 0;
    this.rotationSamples = [];
    this.isRotating = false;
    this.lastRotationSummary = null;
    if (this.rotationTimerId) {
      clearTimeout(this.rotationTimerId);
      this.rotationTimerId = null;
    }
  }
}

export const interactionProfiler = new InteractionProfiler();
