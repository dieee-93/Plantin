import React from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import {
  getSpaceMaterialProgramCacheKey,
  injectAntiTilingShader,
  injectOrthographicRoughnessFloor,
} from './antiTilingShader';
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

function configureTextureMap(
  tex: THREE.Texture | undefined,
  colorSpace: THREE.ColorSpace,
  maxAnisotropy: number,
): THREE.Texture | undefined {
  if (!tex) return undefined;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = colorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

function extractAndConfigurePbrMaps(
  loaded: unknown,
  maxAnisotropy: number,
): {
  albedoMap?: THREE.Texture;
  normalMap?: THREE.Texture;
  armMap?: THREE.Texture;
} {
  const isSingleTexture = Boolean(loaded && 'isTexture' in (loaded as object));
  const rawAlbedo = isSingleTexture
    ? (loaded as THREE.Texture)
    : (loaded as Record<string, THREE.Texture | undefined>)?.map;
  const rawNormal = isSingleTexture
    ? undefined
    : (loaded as Record<string, THREE.Texture | undefined>)?.normalMap;
  const rawArm = isSingleTexture
    ? undefined
    : (loaded as Record<string, THREE.Texture | undefined>)?.armMap;

  return {
    albedoMap: configureTextureMap(rawAlbedo, THREE.SRGBColorSpace, maxAnisotropy),
    normalMap: configureTextureMap(rawNormal, THREE.NoColorSpace, maxAnisotropy),
    armMap: configureTextureMap(rawArm, THREE.NoColorSpace, maxAnisotropy),
  };
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
    const maxAnisotropy = gl?.capabilities?.getMaxAnisotropy?.() ?? 1;
    return extractAndConfigurePbrMaps(loaded, maxAnisotropy);
  }, [loaded, gl]);

  const scale = config.normalScale ?? 1.0;
  const normalScaleVec = React.useMemo(
    () => new THREE.Vector2(scale, scale),
    [scale],
  );

  const isAntiTile = Boolean(config.antiTile);
  const isDielectric = (config.metalness ?? 0) === 0;
  const customProgramCacheKey = React.useCallback(
    () => getSpaceMaterialProgramCacheKey(isAntiTile),
    [isAntiTile],
  );

  const onBeforeCompile = React.useCallback(
    (shader: { fragmentShader: string }) => {
      if (isAntiTile) {
        injectAntiTilingShader(shader);
      } else if (isDielectric) {
        injectOrthographicRoughnessFloor(shader);
      }
    },
    [isAntiTile, isDielectric],
  );

  return (
    <meshStandardMaterial
      key={getSpaceMaterialProgramCacheKey(isAntiTile)}
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
      envMapIntensity={0.3}
      transparent={config.transparent ?? false}
      opacity={config.opacity ?? 1}
      emissive={displayEmissive}
      emissiveIntensity={displayEmissiveIntensity}
      customProgramCacheKey={customProgramCacheKey}
      onBeforeCompile={onBeforeCompile}
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
      envMapIntensity={0.3}
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
