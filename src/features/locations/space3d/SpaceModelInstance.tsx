import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { configureGltfLoader } from './loaders/gltfLoaderSetup';

export interface SpaceModelInstanceProps {
  modelUrl: string;
  positionCm?: { x: number; y: number }; // Coordenadas 2D del plano en cm
  centerCm?: { x: number; y: number };   // Centro del plano para mapear coordenadas
  elevationM?: number;                    // Altura Y en metros respecto al piso
  rotationDeg?: number;                   // Rotación en el plano horizontal (eje Y)
  scaleMultiplier?: number;               // 1.0 por defecto (el modelo ya está en metros)
  castShadow?: boolean;
  receiveShadow?: boolean;
  onClick?: (e: THREE.Event) => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

const CM_TO_M = 0.01;

const isTestEnv =
  (typeof globalThis !== 'undefined' &&
    ((globalThis as unknown as { process?: { env?: { NODE_ENV?: string; VITEST?: string } } })
      .process?.env?.NODE_ENV === 'test' ||
      Boolean(
        (globalThis as unknown as { process?: { env?: { NODE_ENV?: string; VITEST?: string } } })
          .process?.env?.VITEST,
      ))) ||
  import.meta.env?.MODE === 'test';

function resolveModelUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
}

export const SpaceModelInstance: React.FC<SpaceModelInstanceProps> = ({
  modelUrl,
  positionCm = { x: 0, y: 0 },
  centerCm = { x: 0, y: 0 },
  elevationM = 0,
  rotationDeg = 0,
  scaleMultiplier = 1.0,
  castShadow = true,
  receiveShadow = true,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  // Conversión de coordenadas del plano (cm) a coordenadas Three.js (m) con compensación del centro
  const posX = (positionCm.x - centerCm.x) * CM_TO_M;
  const posY = elevationM;
  const posZ = (positionCm.y - centerCm.y) * CM_TO_M;
  const rotY = (rotationDeg * Math.PI) / 180;

  // En entorno de pruebas (jsdom/vitest), renderizar un placeholder seguro para evitar fetch de red local en Node
  if (isTestEnv) {
    return (
      <mesh
        name={`model-instance-${modelUrl}`}
        position={[posX, posY, posZ]}
        rotation={[0, rotY, 0]}
        scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}
        onClick={onClick}
      >
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshBasicMaterial color="#64748b" />
      </mesh>
    );
  }

  return (
    <SpaceModelContent
      modelUrl={modelUrl}
      posX={posX}
      posY={posY}
      posZ={posZ}
      rotY={rotY}
      scaleMultiplier={scaleMultiplier}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    />
  );
};

interface SpaceModelContentProps {
  modelUrl: string;
  posX: number;
  posY: number;
  posZ: number;
  rotY: number;
  scaleMultiplier: number;
  castShadow: boolean;
  receiveShadow: boolean;
  onClick?: (e: THREE.Event) => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

const SpaceModelContent: React.FC<SpaceModelContentProps> = ({
  modelUrl,
  posX,
  posY,
  posZ,
  rotY,
  scaleMultiplier,
  castShadow,
  receiveShadow,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  const resolvedUrl = useMemo(() => resolveModelUrl(modelUrl), [modelUrl]);
  // Carga con useGLTF inyectando el decodificador Meshopt singleton
  const { scene } = useGLTF(resolvedUrl, true, true, configureGltfLoader);

  // Clonar la escena para permitir múltiples instancias independientes sin compartir matrices de nodo
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;
      }
    });
    return clone;
  }, [scene, castShadow, receiveShadow]);

  return (
    <primitive
      object={clonedScene}
      position={[posX, posY, posZ]}
      rotation={[0, rotY, 0]}
      scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    />
  );
};
