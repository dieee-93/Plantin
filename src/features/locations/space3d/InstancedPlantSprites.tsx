import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { resolvePlantSpriteUrl } from './SpacePlantSprite';

export interface InstancedPlantItem {
  id: string;
  label: string;
  xM: number;
  zM: number;
  radiusM: number;
  bodyHeightM: number;
  isCrowded?: boolean;
}

export interface InstancedPlantGroupProps {
  cropCode: string;
  phase?: 'germination' | 'leaf' | 'structure' | 'flowering' | 'fruiting';
  plants: InstancedPlantItem[];
  onSelectPlant?: (plantId: string) => void;
}

interface InnerInstancedMeshProps {
  spriteUrl: string;
  count: number;
  plants: InstancedPlantItem[];
  baseGeometry: THREE.BufferGeometry;
  onSelectPlant?: (plantId: string) => void;
}

const InnerInstancedMesh: React.FC<InnerInstancedMeshProps> = ({
  spriteUrl,
  count,
  plants,
  baseGeometry,
  onSelectPlant,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const texture = useTexture(spriteUrl, (t) => {
    if ('isTexture' in t) {
      t.colorSpace = THREE.SRGBColorSpace;
    }
  });

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: texture as THREE.Texture,
        transparent: false,
        alphaTest: 0.5,
        depthWrite: true,
        side: THREE.DoubleSide,
        roughness: 0.7,
        emissive: new THREE.Color('#15803d'),
        emissiveIntensity: 0.12,
      }),
    [texture],
  );

  // Update instance matrices in parallel to always face the camera
  useFrame(({ camera }) => {
    if (!meshRef.current || count === 0) return;

    for (let i = 0; i < count; i++) {
      const p = plants[i];
      const widthM = Math.max(0.25, p.radiusM * 2.0);
      const heightM = Math.max(0.35, p.bodyHeightM * 1.1);

      dummy.position.set(p.xM, heightM / 2, p.zM);
      dummy.scale.set(widthM, heightM, 1);
      dummy.lookAt(camera.position.x, camera.position.y, camera.position.z);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      name="instanced-plant-billboard-mesh"
      args={[baseGeometry, material, count]}
      castShadow
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        if (e.instanceId !== undefined && plants[e.instanceId]) {
          onSelectPlant?.(plants[e.instanceId].id);
        }
      }}
    />
  );
};

/**
 * High-performance GPU Instanced billboard group for massive plant counts.
 * Renders hundreds or thousands of plants of the same cropCode in a single WebGL draw call.
 */
export const InstancedPlantGroup: React.FC<InstancedPlantGroupProps> = ({
  cropCode,
  phase = 'fruiting',
  plants,
  onSelectPlant,
}) => {
  const spriteUrl = resolvePlantSpriteUrl(cropCode, undefined, phase);
  const count = plants.length;

  const baseGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const fallbackMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#16a34a',
        roughness: 0.6,
        side: THREE.DoubleSide,
      }),
    [],
  );

  if (count === 0 || !spriteUrl) return null;

  return (
    <React.Suspense
      fallback={
        <instancedMesh
          name="instanced-plant-billboard-mesh"
          args={[baseGeometry, fallbackMaterial, count]}
        />
      }
    >
      <InnerInstancedMesh
        spriteUrl={spriteUrl}
        count={count}
        plants={plants}
        baseGeometry={baseGeometry}
        onSelectPlant={onSelectPlant}
      />
    </React.Suspense>
  );
};
