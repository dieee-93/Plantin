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
  onPointerDown?: (e: THREE.Event) => void;
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

interface ModelErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ModelErrorBoundary extends React.Component<ModelErrorBoundaryProps, ModelErrorBoundaryState> {
  constructor(props: ModelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ModelErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('[SpaceModelInstance] Failed to load 3D model, displaying fallback:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function resolveModelUrl(url: string): string {
  let targetUrl = url;
  // Fallback and alias removed or deprecated experiment assets
  if (targetUrl.includes('plant_tomato_star_a01')) {
    targetUrl = targetUrl.replace('plant_tomato_star_a01', 'plant_tomato_clay_a01');
  }

  if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
    return targetUrl;
  }
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`;
  return `${cleanBase}${cleanPath}`;
}

import { computeModelGroundingOffset } from './utils/modelGrounding';
export { computeModelGroundingOffset };
export type { ModelGroundingOffsetResult } from './utils/modelGrounding';

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
  onPointerDown,
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
        onPointerDown={onPointerDown}
      >
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshBasicMaterial color="#64748b" />
      </mesh>
    );
  }

  return (
    <ModelErrorBoundary
      fallback={
        <group position={[posX, posY, posZ]} rotation={[0, rotY, 0]}>
          <mesh onClick={onClick} onPointerDown={onPointerDown}>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial color="#f59e0b" wireframe />
          </mesh>
        </group>
      }
    >
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
        onPointerDown={onPointerDown}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      />
    </ModelErrorBoundary>
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
  onPointerDown?: (e: THREE.Event) => void;
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
  onPointerDown,
  onPointerOver,
  onPointerOut,
}) => {
  const resolvedUrl = useMemo(() => resolveModelUrl(modelUrl), [modelUrl]);
  // Carga con useGLTF inyectando el decodificador Meshopt singleton
  const { scene } = useGLTF(resolvedUrl, true, true, configureGltfLoader);

  // Clonar la escena para permitir múltiples instancias independientes sin compartir matrices de nodo
  // y calcular el desplazamiento de auto-grounding y centrado métrico
  const { clonedScene, xOffset, yOffset, zOffset } = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;
      }
    });

    const offset = computeModelGroundingOffset(clone);
    return {
      clonedScene: clone,
      xOffset: offset.xOffset,
      yOffset: offset.yOffset,
      zOffset: offset.zOffset,
    };
  }, [scene, castShadow, receiveShadow]);

  return (
    <group
      position={[posX, posY, posZ]}
      rotation={[0, rotY, 0]}
      scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <primitive
        object={clonedScene}
        position={[xOffset, yOffset, zOffset]}
      />
    </group>
  );
};
