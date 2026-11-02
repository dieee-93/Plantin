import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { roomLoadProfiler } from './roomLoadProfiler';

export interface PerfFrameTrackerProps {
  plantCount: number;
  isReady?: boolean;
}

/**
 * R3F component that hooks into the Three.js render loop.
 * Captures the exact millisecond when the GPU paints the first frame (T4)
 * and emits the comprehensive performance telemetry table.
 */
export const PerfFrameTracker: React.FC<PerfFrameTrackerProps> = ({
  plantCount,
  isReady = true,
}) => {
  const hasRecordedRef = useRef(false);

  useFrame(() => {
    if (!hasRecordedRef.current && isReady) {
      hasRecordedRef.current = true;
      roomLoadProfiler.markFirstFrame(plantCount);
    }
  });

  return null;
};
