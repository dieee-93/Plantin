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

  const textureInput = React.useMemo(() => {
    const input: Record<string, string> = { map: url };
    if (config.normalMapUrl) {
      input.normalMap = config.normalMapUrl;
    }
    if (config.armMapUrl) {
      input.armMap = config.armMapUrl;
    }
    return input;
  }, [url, config.normalMapUrl, config.armMapUrl]);

  const loaded = useTexture(textureInput);

  const { albedoMap, normalMap, armMap } = React.useMemo(() => {
    const isSingleTexture = Boolean(loaded && 'isTexture' in (loaded as object));
    const mapTex = isSingleTexture
      ? (loaded as unknown as THREE.Texture)
      : (loaded as Record<string, THREE.Texture | undefined>)?.map;
    const normalTex = isSingleTexture
      ? undefined
      : (loaded as Record<string, THREE.Texture | undefined>)?.normalMap;
    const armTex = isSingleTexture
      ? undefined
      : (loaded as Record<string, THREE.Texture | undefined>)?.armMap;

    const maxAnisotropy = gl?.capabilities?.getMaxAnisotropy?.() ?? 1;

    if (mapTex) {
      mapTex.wrapS = THREE.RepeatWrapping;
      mapTex.wrapT = THREE.RepeatWrapping;
      mapTex.colorSpace = THREE.SRGBColorSpace;
      mapTex.anisotropy = maxAnisotropy;
      mapTex.needsUpdate = true;
    }

    if (normalTex) {
      normalTex.wrapS = THREE.RepeatWrapping;
      normalTex.wrapT = THREE.RepeatWrapping;
      normalTex.colorSpace = THREE.NoColorSpace;
      normalTex.anisotropy = maxAnisotropy;
      normalTex.needsUpdate = true;
    }

    if (armTex) {
      armTex.wrapS = THREE.RepeatWrapping;
      armTex.wrapT = THREE.RepeatWrapping;
      armTex.colorSpace = THREE.NoColorSpace;
      armTex.anisotropy = maxAnisotropy;
      armTex.needsUpdate = true;
    }

    return {
      albedoMap: mapTex,
      normalMap: normalTex,
      armMap: armTex,
    };
  }, [loaded, gl]);

  const scale = config.normalScale ?? 1.0;
  const normalScaleVec = React.useMemo(
    () => new THREE.Vector2(scale, scale),
    [scale],
  );

  return (
    <meshStandardMaterial
      map={albedoMap}
      normalMap={normalMap}
      normalScale={normalScaleVec}
      aoMap={armMap}
      aoMapIntensity={config.aoMapIntensity ?? 0.6}
      roughnessMap={armMap}
      metalnessMap={armMap}
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
