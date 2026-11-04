import React, { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { PivotControls } from '@react-three/drei';
import type { PlacedObjectSpatialCm } from '@/store/spaceLayoutStore';
import type { Point2DCm } from '@/domain/spaceGeometry';
import {
  calculateGizmoSpatialUpdate,
  type GizmoSpatialResult,
} from './calculateGizmoSpatialUpdate';

export interface SpaceObjectGizmoProps {
  object: PlacedObjectSpatialCm;
  centerCm: Point2DCm;
  isSelected?: boolean;
  onDragStart?: () => void;
  onTransformChange?: (update: GizmoSpatialResult) => void;
  onTransformCommit?: (update: GizmoSpatialResult) => void;
  children: React.ReactNode;
}

const CM_TO_M = 0.01;

export const SpaceObjectGizmo: React.FC<SpaceObjectGizmoProps> = ({
  object,
  centerCm,
  isSelected = false,
  onDragStart,
  onTransformChange,
  onTransformCommit,
  children,
}) => {
  const isShiftPressedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const lastWorldMatrixRef = useRef<THREE.Matrix4 | null>(null);
  const pendingUpdateRef = useRef<GizmoSpatialResult | null>(null);
  const dragStartRotationRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftPressedRef.current = true;
        if (isDraggingRef.current && lastWorldMatrixRef.current) {
          const update = calculateGizmoSpatialUpdate({
            worldMatrix: lastWorldMatrixRef.current,
            centerCm,
            initialElevationM: object.elevationM ?? 0,
            initialRotationDeg: dragStartRotationRef.current,
            isShiftKey: true,
          });
          pendingUpdateRef.current = update;
          onTransformChange?.(update);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftPressedRef.current = false;
        if (isDraggingRef.current && lastWorldMatrixRef.current) {
          const update = calculateGizmoSpatialUpdate({
            worldMatrix: lastWorldMatrixRef.current,
            centerCm,
            initialElevationM: object.elevationM ?? 0,
            initialRotationDeg: dragStartRotationRef.current,
            isShiftKey: false,
          });
          pendingUpdateRef.current = update;
          onTransformChange?.(update);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [centerCm, object.elevationM, onTransformChange]);

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    dragStartRotationRef.current = object.rotationDeg ?? 0;
    pendingUpdateRef.current = {
      xCm: object.xCm,
      yCm: object.yCm,
      elevationM: object.elevationM ?? 0,
      rotationDeg: object.rotationDeg ?? 0,
      isShiftKey: isShiftPressedRef.current,
    };
    onDragStart?.();
  }, [object.xCm, object.yCm, object.elevationM, object.rotationDeg, onDragStart]);

  const handleDrag = useCallback(
    (_l: THREE.Matrix4, _deltaL: THREE.Matrix4, w: THREE.Matrix4) => {
      lastWorldMatrixRef.current = w;
      const update = calculateGizmoSpatialUpdate({
        worldMatrix: w,
        centerCm,
        initialElevationM: object.elevationM ?? 0,
        initialRotationDeg: dragStartRotationRef.current,
        isShiftKey: isShiftPressedRef.current,
      });

      pendingUpdateRef.current = update;
      onTransformChange?.(update);
    },
    [centerCm, object.elevationM, onTransformChange],
  );

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    lastWorldMatrixRef.current = null;
    if (pendingUpdateRef.current) {
      onTransformCommit?.(pendingUpdateRef.current);
    }
    pendingUpdateRef.current = null;
  }, [onTransformCommit]);

  if (!isSelected) {
    return <>{children}</>;
  }

  const posX = (object.xCm - centerCm.x) * CM_TO_M;
  const posY = object.elevationM ?? 0;
  const posZ = (object.yCm - centerCm.y) * CM_TO_M;

  return (
    <group name={`object-gizmo-${object.id}`}>
      {children}
      <group position={[posX, posY, posZ]}>
        <PivotControls
          activeAxes={[true, false, true]} // X (Three.X) y Z (Three.Z) activos. Y (vertical) bloqueado.
          disableAxes={false}
          disableSliders={false}
          disableRotations={true}
          disableScaling={true}
          depthTest={false}
          renderOrder={1000}
          fixed={true}
          scale={75}
          lineWidth={3}
          axisColors={['#ef4444', '#10b981', '#3b82f6']}
          hoveredColor="#f59e0b"
          autoTransform={false}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        />
      </group>
    </group>
  );
};
