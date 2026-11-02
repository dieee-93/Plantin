/**
 * Millimetric Telemetry and Profiling Module for 3D Room Loading.
 *
 * Measures sub-millisecond execution times for:
 * - T0: User clicks on the room card/button (LocationsPage / SpacesCampusMap)
 * - T1: React mounts Space3DViewer and initial layout state
 * - T2: Geometry & Spatial Hash calculation (computeCrowdedPlantIds for N plants)
 * - T3: GPU Buffer preparation (TypedArray population in CanopyRingsInstanced & InstancedPlantSprites)
 * - T4: First WebGL Frame painted (via Three.js / R3F useFrame hook)
 *
 * Emits high-precision performance marks, measures, and a structured console.table summary.
 */

export interface RoomLoadTelemetrySession {
  roomId: string;
  roomName: string;
  plantCount: number;
  t0: number; // Click event timestamp
  t1Mount?: number; // Space3DViewer first mount
  t1MountDurationMs?: number; // T1 - T0
  t2GeometryDurationMs?: number; // Spatial hash duration
  t2GeometryEnd?: number;
  t3CanopyBuffersMs?: number;
  t3SpriteBuffersMs?: number;
  t3TotalBuffersMs?: number;
  t4FirstFrame?: number; // WebGL first frame painted
  totalDurationMs?: number; // T4 - T0
  completed: boolean;
}

export class RoomLoadProfiler {
  private currentSession: RoomLoadTelemetrySession | null = null;
  private lastCompletedSession: RoomLoadTelemetrySession | null = null;
  private geometryStartTime: number | null = null;

  start(params: { roomId: string; roomName?: string; plantCount?: number }): void {
    if (typeof window === 'undefined' || typeof performance === 'undefined') return;
    const now = performance.now();
    try {
      performance.mark('room-load-t0-click');
    } catch {
      // Ignore in unsupported environments
    }

    this.currentSession = {
      roomId: params.roomId,
      roomName: params.roomName || params.roomId,
      plantCount: params.plantCount || 0,
      t0: now,
      completed: false,
    };

    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log(
        `%c[PERF: ROOM_LOAD] ⏱ T0: Click en sala "${this.currentSession.roomName}" (Iniciando navegación)`,
        'color: #0284c7; font-weight: bold;',
      );
    }
  }

  markViewerMount(roomId?: string): void {
    if (typeof window === 'undefined' || typeof performance === 'undefined') return;
    const now = performance.now();
    try {
      performance.mark('room-load-t1-mount');
      if (this.currentSession) {
        performance.measure(
          '[PERF] T0->T1: React Mount',
          'room-load-t0-click',
          'room-load-t1-mount',
        );
      }
    } catch {
      // Ignore in unsupported environments
    }

    if (!this.currentSession) {
      // Direct deep link or reload without T0 click
      this.currentSession = {
        roomId: roomId || 'unknown',
        roomName: roomId || 'Sala',
        plantCount: 0,
        t0: now,
        completed: false,
      };
    }

    if (this.currentSession.t1Mount === undefined) {
      this.currentSession.t1Mount = now;
      this.currentSession.t1MountDurationMs = now - this.currentSession.t0;
    }
  }

  markGeometryStart(): void {
    if (typeof window === 'undefined' || typeof performance === 'undefined') return;
    this.geometryStartTime = performance.now();
    try {
      performance.mark('room-load-t2-geometry-start');
    } catch {
      // Ignore
    }
  }

  markGeometryEnd(plantCount: number): void {
    if (typeof window === 'undefined' || typeof performance === 'undefined') return;
    const now = performance.now();
    const duration =
      this.geometryStartTime !== null ? now - this.geometryStartTime : 0;
    this.geometryStartTime = null;

    try {
      performance.mark('room-load-t2-geometry-end');
      performance.measure(
        '[PERF] T1->T2: Geometry & Spatial Hash',
        'room-load-t2-geometry-start',
        'room-load-t2-geometry-end',
      );
    } catch {
      // Ignore
    }

    if (this.currentSession) {
      this.currentSession.plantCount = Math.max(
        this.currentSession.plantCount,
        plantCount,
      );
      this.currentSession.t2GeometryDurationMs =
        (this.currentSession.t2GeometryDurationMs ?? 0) + duration;
      this.currentSession.t2GeometryEnd = now;
    }
  }

  markGpuBuffers(
    type: 'canopy' | 'sprites',
    count: number,
    durationMs: number,
  ): void {
    if (typeof window === 'undefined') return;
    if (this.currentSession) {
      this.currentSession.plantCount = Math.max(
        this.currentSession.plantCount,
        count,
      );
      if (type === 'canopy') {
        this.currentSession.t3CanopyBuffersMs = durationMs;
      } else {
        this.currentSession.t3SpriteBuffersMs =
          (this.currentSession.t3SpriteBuffersMs ?? 0) + durationMs;
      }
      this.currentSession.t3TotalBuffersMs =
        (this.currentSession.t3CanopyBuffersMs ?? 0) +
        (this.currentSession.t3SpriteBuffersMs ?? 0);
    }
  }

  markFirstFrame(plantCount?: number): void {
    if (typeof window === 'undefined' || typeof performance === 'undefined') return;
    if (!this.currentSession || this.currentSession.completed) return;

    const now = performance.now();
    try {
      performance.mark('room-load-t4-first-frame');
      performance.measure(
        '[PERF] TOTAL: Click to First Frame',
        'room-load-t0-click',
        'room-load-t4-first-frame',
      );
    } catch {
      // Ignore
    }

    if (plantCount !== undefined) {
      this.currentSession.plantCount = Math.max(
        this.currentSession.plantCount,
        plantCount,
      );
    }

    this.currentSession.t4FirstFrame = now;
    this.currentSession.totalDurationMs = now - this.currentSession.t0;
    this.currentSession.completed = true;

    this.logTelemetryTable(this.currentSession);
    this.lastCompletedSession = { ...this.currentSession };
  }

  private logTelemetryTable(session: RoomLoadTelemetrySession): void {
    if (typeof console === 'undefined') return;

    const t0 = session.t0;
    const t1 = session.t1Mount ?? t0;
    const mountDur = session.t1MountDurationMs ?? (t1 - t0);
    const geomDur = session.t2GeometryDurationMs ?? 0;
    const buffDur = session.t3TotalBuffersMs ?? 0;
    const t4 = session.t4FirstFrame ?? performance.now();
    const total = session.totalDurationMs ?? (t4 - t0);

    const rows = [
      {
        'Paso': 'T0 → T1: Montaje React Space3DViewer',
        'Duración (ms)': +mountDur.toFixed(2),
        'Acumulado (ms)': +mountDur.toFixed(2),
        'Evaluación': mountDur < 50 ? '⚡ Inmediato (<50ms)' : '✓ Normal',
      },
      {
        'Paso': `T1 → T2: Geometría & Spatial Hash Grid (${session.plantCount} plantas)`,
        'Duración (ms)': +geomDur.toFixed(2),
        'Acumulado (ms)': +Math.max(mountDur, mountDur + geomDur).toFixed(2),
        'Evaluación': geomDur < 20 ? '⚡ O(N) Hash óptimo' : '✓ Aceptable',
      },
      {
        'Paso': 'T2 → T3: Preparación Buffers GPU (Instancing)',
        'Duración (ms)': +buffDur.toFixed(2),
        'Acumulado (ms)': +(mountDur + geomDur + buffDur).toFixed(2),
        'Evaluación': buffDur < 15 ? '⚡ Direct TypedArrays' : '✓ Normal',
      },
      {
        'Paso': 'T3 → T4: Primer Frame WebGL Pintado (GPU)',
        'Duración (ms)': +Math.max(
          0,
          total - (mountDur + geomDur + buffDur),
        ).toFixed(2),
        'Acumulado (ms)': +total.toFixed(2),
        'Evaluación': '🚀 WebGL Frame Rendered',
      },
      {
        'Paso': 'TOTAL: Click a Primer Frame Pintado',
        'Duración (ms)': +total.toFixed(2),
        'Acumulado (ms)': +total.toFixed(2),
        'Evaluación':
          total < 100
            ? '🔥 Ultrarrápido (<100ms)'
            : total < 250
            ? '⚡ Fluido (<250ms)'
            : '✓ Estable',
      },
    ];

    if (typeof console.group === 'function') {
      console.group(
        `%c[PERF: ROOM_LOAD] ⚡ Telemetría de Apertura 3D - "${session.roomName}" (${session.plantCount} plantas)`,
        'color: #10b981; font-weight: bold; font-size: 13px;',
      );
    }
    if (typeof console.table === 'function') {
      console.table(rows);
    }
    if (typeof console.log === 'function') {
      console.log(
        `%c[PERF: ROOM_LOAD] Resumen: Sala abierta en ${total.toFixed(2)} ms | React Mount: ${mountDur.toFixed(2)} ms | Spatial Hash: ${geomDur.toFixed(2)} ms | Buffers GPU: ${buffDur.toFixed(2)} ms | Plantas: ${session.plantCount}`,
        'color: #0284c7; font-weight: 600;',
      );
    }
    if (typeof console.groupEnd === 'function') {
      console.groupEnd();
    }
  }

  getLastSession(): RoomLoadTelemetrySession | null {
    return this.lastCompletedSession ?? this.currentSession;
  }

  reset(): void {
    this.currentSession = null;
    this.lastCompletedSession = null;
    this.geometryStartTime = null;
  }
}

export const roomLoadProfiler = new RoomLoadProfiler();
