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

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    if (!meshRef.current || count === 0) return;

    for (let i = 0; i < count; i++) {
      const ring = rings[i];
      dummy.position.set(ring.xM, 0.02, ring.zM);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(ring.radiusM, 1, ring.radiusM);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);

      const color = ring.isSelected
        ? SELECTED_COLOR
        : ring.isCrowded
        ? CROWDED_COLOR
        : NORMAL_COLOR;
      meshRef.current.setColorAt(i, color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
    meshRef.current.computeBoundingSphere();
  }, [rings, count, dummy]);

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
