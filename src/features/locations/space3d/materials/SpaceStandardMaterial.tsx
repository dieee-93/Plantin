import React from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { SpaceMaterialConfig } from './materialRegistry';

export interface SpaceStandardMaterialProps {
  config: SpaceMaterialConfig;
  isSelected?: boolean;
  emissive?: string;
  emissiveIntensity?: number;
}

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class MaterialErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Graceful fallback to solid color when a texture file is missing (404) or fails to load
    console.warn('[SpaceStandardMaterial] Falling back to solid color due to texture error:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface TexturedMaterialProps {
  url: string;
  config: SpaceMaterialConfig;
  displayColor: string;
  displayEmissive: string;
  displayEmissiveIntensity: number;
}

const TexturedMaterial: React.FC<TexturedMaterialProps> = ({
  url,
  config,
  displayColor,
  displayEmissive,
  displayEmissiveIntensity,
}) => {
  const { gl } = useThree();

  const texture = useTexture(url, (t) => {
    if ('isTexture' in t) {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
      if (gl?.capabilities) {
        t.anisotropy = gl.capabilities.getMaxAnisotropy();
      }
    }
  });

  return (
    <meshStandardMaterial
      map={texture as THREE.Texture}
      color={displayColor}
      roughness={config.roughness}
      metalness={config.metalness ?? 0}
      transparent={config.transparent ?? false}
      opacity={config.opacity ?? 1}
      emissive={displayEmissive}
      emissiveIntensity={displayEmissiveIntensity}
    />
  );
};

export const SpaceStandardMaterial: React.FC<SpaceStandardMaterialProps> = ({
  config,
  isSelected = false,
  emissive,
  emissiveIntensity = 0,
}) => {
  const defaultBaseColor = config.textureUrl
    ? (config.tintColor ?? '#ffffff')
    : (config.tintColor ?? config.fallbackColor);

  const displayColor = isSelected ? '#38bdf8' : defaultBaseColor;
  const displayEmissive = isSelected ? '#0284c7' : (emissive ?? '#000000');
  const displayEmissiveIntensity = isSelected ? 0.4 : emissiveIntensity;

  const fallbackMaterial = (
    <meshStandardMaterial
      color={isSelected ? '#38bdf8' : (config.tintColor ?? config.fallbackColor)}
      roughness={config.roughness}
      metalness={config.metalness ?? 0}
      transparent={config.transparent ?? false}
      opacity={config.opacity ?? 1}
      emissive={displayEmissive}
      emissiveIntensity={displayEmissiveIntensity}
    />
  );

  if (config.textureUrl) {
    return (
      <MaterialErrorBoundary fallback={fallbackMaterial}>
        <React.Suspense fallback={fallbackMaterial}>
          <TexturedMaterial
            url={config.textureUrl}
            config={config}
            displayColor={displayColor}
            displayEmissive={displayEmissive}
            displayEmissiveIntensity={displayEmissiveIntensity}
          />
        </React.Suspense>
      </MaterialErrorBoundary>
    );
  }

  return fallbackMaterial;
};
