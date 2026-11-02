import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import {
  calculatePlantDimensions,
  PLANT_BOTANICAL_METRICS,
  resolveCanonicalCropCode,
} from './plantMetrics';

export interface SpacePlantSpriteProps {
  cropCode?: string;
  label?: string;
  phase?: 'germination' | 'leaf' | 'structure' | 'flowering' | 'fruiting';
  radiusM: number;
  bodyHeightM: number;
  isCrowded?: boolean;
}

export function resolvePlantSpriteUrl(
  cropCode?: string,
  label?: string,
  phase = 'fruiting',
): string | null {
  const canonical = resolveCanonicalCropCode(cropCode, label);
  const metric = PLANT_BOTANICAL_METRICS[canonical];
  if (!metric) return null;

  const folder = metric.fallbackSpriteCode ?? metric.cropCode;
  return `/textures/plants/${folder}/${phase}.webp`;
}

interface PlantErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface PlantErrorBoundaryState {
  hasError: boolean;
}

class PlantErrorBoundary extends React.Component<PlantErrorBoundaryProps, PlantErrorBoundaryState> {
  constructor(props: PlantErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): PlantErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('[SpacePlantSprite] Falling back to geometric body due to sprite error:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface PlantBillboardPlaneProps {
  url: string;
  widthM: number;
  heightM: number;
  isCrowded?: boolean;
}

const PlantBillboardPlane: React.FC<PlantBillboardPlaneProps> = ({
  url,
  widthM,
  heightM,
  isCrowded = false,
}) => {
  const texture = useTexture(url, (t) => {
    if ('isTexture' in t) {
      t.colorSpace = THREE.SRGBColorSpace;
    }
  });

  const groupRef = useRef<THREE.Group>(null);

  // Dynamically face the active camera in real-time so it never appears edge-on ("as paper")
  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    groupRef.current.lookAt(camera.position.x, camera.position.y, camera.position.z);
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh
        name="plant-billboard-mesh"
        castShadow
        receiveShadow
        position={[0, heightM / 2, 0]}
      >
        <planeGeometry args={[widthM, heightM]} />
        <meshStandardMaterial
          map={texture as THREE.Texture}
          transparent={false}
          alphaTest={0.5}
          depthWrite={true}
          side={THREE.DoubleSide}
          roughness={0.7}
          emissive={isCrowded ? '#b45309' : '#15803d'}
          emissiveIntensity={0.12}
        />
      </mesh>
    </group>
  );
};

export const KEY_BOTANICAL_TEXTURES = [
  '/textures/plants/TOM/fruiting.webp',
  '/textures/plants/LETTUCE/fruiting.webp',
  '/textures/plants/CARROT/fruiting.webp',
  '/textures/plants/PEPPER_SWEET/fruiting.webp',
  '/textures/plants/SQUASH/fruiting.webp',
  '/textures/plants/CITRUS_ORANGE/fruiting.webp',
  '/textures/plants/HEMP/fruiting.webp',
  '/textures/plants/ONION/fruiting.webp',
];

/**
 * Preloads essential botanical textures via Drei's useTexture.preload.
 * Decodes WebP sprites into GPU texture cache so billboards mount instantly without suspending.
 */
export function preloadBotanicalTextures(): void {
  if (typeof window === 'undefined') return;
  if (typeof (useTexture as any)?.preload === 'function') {
    for (const url of KEY_BOTANICAL_TEXTURES) {
      try {
        (useTexture as any).preload(url);
      } catch {
        // Safe catch for headless / test environments
      }
    }
  }
}

// Automatically preload in browser environment
if (typeof window !== 'undefined') {
  preloadBotanicalTextures();
}

export const SpacePlantSprite: React.FC<SpacePlantSpriteProps> = ({
  cropCode,
  label,
  phase = 'fruiting',
  radiusM,
  bodyHeightM,
  isCrowded = false,
}) => {
  const spriteUrl = resolvePlantSpriteUrl(cropCode, label, phase);
  const dims = calculatePlantDimensions(cropCode, radiusM, bodyHeightM, label);
  const spriteWidthM = dims.widthM;
  const spriteHeightM = dims.heightM;

  const fallbackGeometricMesh = (
    <mesh
      name="plant-billboard-mesh"
      castShadow
      receiveShadow
      position={[0, bodyHeightM / 2, 0]}
    >
      <cylinderGeometry args={[radiusM * 0.45, radiusM * 0.3, bodyHeightM, 12]} />
      <meshStandardMaterial
        color={isCrowded ? '#f59e0b' : '#16a34a'}
        roughness={0.6}
      />
    </mesh>
  );

  if (!spriteUrl) {
    return fallbackGeometricMesh;
  }

  return (
    <PlantErrorBoundary fallback={fallbackGeometricMesh}>
      <React.Suspense fallback={fallbackGeometricMesh}>
        <PlantBillboardPlane
          url={spriteUrl}
          widthM={spriteWidthM}
          heightM={spriteHeightM}
          isCrowded={isCrowded}
        />
      </React.Suspense>
    </PlantErrorBoundary>
  );
};
