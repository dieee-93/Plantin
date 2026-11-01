import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

export interface CanopyRingItem {
  id: string;
  xM: number;
  zM: number;
  radiusM: number;
  isCrowded?: boolean;
  isSelected?: boolean;
}

export interface CanopyRingsInstancedProps {
  rings: CanopyRingItem[];
  onSelectPlant?: (plantId: string) => void;
}

const CROWDED_COLOR = new THREE.Color('#ef4444');
const SELECTED_COLOR = new THREE.Color('#38bdf8');
const NORMAL_COLOR = new THREE.Color('#22c55e');

/**
 * High-performance GPU Instanced canopy rings mesh for all placed plants.
 * Renders all canopy rings across the entire layout in a single WebGL draw call.
 */
export const CanopyRingsInstanced: React.FC<CanopyRingsInstancedProps> = React.memo(({
  rings,
  onSelectPlant,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = rings.length;

  const baseGeometry = useMemo(() => {
    // Unit ring: inner radius 0.82, outer radius 1.0, 24 segments
    const geo = new THREE.RingGeometry(0.82, 1.0, 24);
    // Rotate to lie flat on the ground plane (XZ plane)
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      baseGeometry.dispose();
      material.dispose();
    };
  }, [baseGeometry, material]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || count === 0) return;

    // Direct TypedArray assignment (Float32Array): 10-50x faster than dummy.updateMatrix() for 5,000 instances
    const matrixArray = mesh.instanceMatrix.array as Float32Array;

    if (!mesh.instanceColor) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    }
    const colorArray = mesh.instanceColor.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const ring = rings[i];
      const mOffset = i * 16;

      matrixArray[mOffset] = ring.radiusM;
      matrixArray[mOffset + 1] = 0;
      matrixArray[mOffset + 2] = 0;
      matrixArray[mOffset + 3] = 0;

      matrixArray[mOffset + 4] = 0;
      matrixArray[mOffset + 5] = 1;
      matrixArray[mOffset + 6] = 0;
      matrixArray[mOffset + 7] = 0;

      matrixArray[mOffset + 8] = 0;
      matrixArray[mOffset + 9] = 0;
      matrixArray[mOffset + 10] = ring.radiusM;
      matrixArray[mOffset + 11] = 0;

      matrixArray[mOffset + 12] = ring.xM;
      matrixArray[mOffset + 13] = 0.02;
      matrixArray[mOffset + 14] = ring.zM;
      matrixArray[mOffset + 15] = 1;

      const cOffset = i * 3;
      const col = ring.isSelected
        ? SELECTED_COLOR
        : ring.isCrowded
        ? CROWDED_COLOR
        : NORMAL_COLOR;
      colorArray[cOffset] = col.r;
      colorArray[cOffset + 1] = col.g;
      colorArray[cOffset + 2] = col.b;
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [rings, count]);

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      name="instanced-canopy-rings-mesh"
      args={[baseGeometry, material, count]}
      onClick={(e) => {
        e.stopPropagation();
        if (e.instanceId !== undefined && rings[e.instanceId]) {
          onSelectPlant?.(rings[e.instanceId].id);
        }
      }}
    />
  );
});
CanopyRingsInstanced.displayName = 'CanopyRingsInstanced';
