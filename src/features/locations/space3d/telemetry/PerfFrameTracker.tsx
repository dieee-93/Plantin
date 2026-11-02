import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { roomLoadProfiler } from './roomLoadProfiler';
import { interactionProfiler } from './interactionProfiler';

export interface PerfFrameTrackerProps {
  plantCount: number;
  isReady?: boolean;
}

/**
 * R3F component that hooks into the Three.js render loop.
 * Captures the exact millisecond when the GPU paints the first frame (T4)
 * and continuously profiles frame times and FPS during camera rotation/panning.
 */
export const PerfFrameTracker: React.FC<PerfFrameTrackerProps> = ({
  plantCount,
  isReady = true,
}) => {
  const hasRecordedRef = useRef(false);
  const prevCamPosRef = useRef({ x: 0, y: 0, z: 0 });

  useFrame((state, delta) => {
    if (!hasRecordedRef.current && isReady) {
      hasRecordedRef.current = true;
      roomLoadProfiler.markFirstFrame(plantCount);
    }

    // Detect camera movement (rotation or panning) to measure interaction FPS
    const cam = state.camera;
    const dx = Math.abs(cam.position.x - prevCamPosRef.current.x);
    const dy = Math.abs(cam.position.y - prevCamPosRef.current.y);
    const dz = Math.abs(cam.position.z - prevCamPosRef.current.z);

    if (dx > 0.005 || dy > 0.005 || dz > 0.005) {
      interactionProfiler.recordRotationFrame(delta);
      prevCamPosRef.current = { x: cam.position.x, y: cam.position.y, z: cam.position.z };
    }
  });

  return null;
};
