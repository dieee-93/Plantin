import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';

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
  const code = (cropCode || '').toUpperCase().trim();
  const name = (label || '').toLowerCase().trim();

  let resolvedCode: string | null = null;
  if (code === 'TOM' || code === 'TOMATO' || name.includes('tomat')) {
    resolvedCode = 'TOM';
  } else if (code === 'CARROT' || name.includes('zanahori')) {
    resolvedCode = 'CARROT';
  } else if (
    code === 'PEPPER' ||
    code === 'PEPPER_SWEET' ||
    name.includes('morr') ||
    name.includes('pimiento')
  ) {
    resolvedCode = 'PEPPER_SWEET';
  } else if (
    code === 'SQUASH' ||
    name.includes('zapall') ||
    name.includes('calabaz')
  ) {
    resolvedCode = 'SQUASH';
  } else if (code === 'LETTUCE' || name.includes('lechug')) {
    resolvedCode = 'LETTUCE';
  } else if (
    code === 'CITRUS_ORANGE' ||
    name.includes('naranj') ||
    name.includes('citric')
  ) {
    resolvedCode = 'CITRUS_ORANGE';
  } else if (code === 'ONION' || name.includes('ceboll')) {
    resolvedCode = 'ONION';
  } else if (
    code === 'HEMP' ||
    name.includes('cáñam') ||
    name.includes('canam')
  ) {
    resolvedCode = 'HEMP';
  }

  if (!resolvedCode) return null;
  return `/textures/plants/${resolvedCode}/${phase}.webp`;
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
  const worldPos = useMemo(() => new THREE.Vector3(), []);

  // Dynamically face the active camera in real-time so it never appears edge-on ("as paper")
  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    groupRef.current.getWorldPosition(worldPos);
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

export const SpacePlantSprite: React.FC<SpacePlantSpriteProps> = ({
  cropCode,
  label,
  phase = 'fruiting',
  radiusM,
  bodyHeightM,
  isCrowded = false,
}) => {
  const spriteUrl = resolvePlantSpriteUrl(cropCode, label, phase);
  const spriteWidthM = Math.max(0.25, radiusM * 2.0);
  const spriteHeightM = Math.max(0.35, bodyHeightM * 1.1);

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
