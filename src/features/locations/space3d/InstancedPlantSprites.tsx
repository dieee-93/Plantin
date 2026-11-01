import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { resolvePlantSpriteUrl } from './SpacePlantSprite';
import { calculatePlantDimensions, PLANT_GROUND_ELEVATION_M } from './plantMetrics';

export interface InstancedPlantItem {
  id: string;
  label: string;
  xM: number;
  zM: number;
  radiusM: number;
  bodyHeightM: number;
  isCrowded?: boolean;
  isSelected?: boolean;
}

export interface InstancedPlantGroupProps {
  cropCode: string;
  phase?: 'germination' | 'leaf' | 'structure' | 'flowering' | 'fruiting';
  plants: InstancedPlantItem[];
  onSelectPlant?: (plantId: string) => void;
}

export interface InnerInstancedMeshProps {
  cropCode: string;
  spriteUrl: string;
  count: number;
  plants: InstancedPlantItem[];
  baseGeometry: THREE.BufferGeometry;
  onSelectPlant?: (plantId: string) => void;
}

const NORMAL_COLOR = new THREE.Color(1, 1, 1);
const CROWDED_COLOR = new THREE.Color(1, 0.85, 0.85);
const SELECTED_COLOR = new THREE.Color(0.7, 0.9, 1.0);

export interface CylindricalBillboardOptions {
  isDepthMaterial?: boolean;
}

/**
 * Injects a GPU-accelerated cylindrical billboard shader hook into a Three.js material.
 * Locks the sprite rotation to the vertical Y axis while dynamically facing the camera,
 * eliminating all CPU matrix recalculation and GPU buffer uploads during camera movement.
 */
export function injectCylindricalBillboardShader(
  material: THREE.Material,
  _options?: CylindricalBillboardOptions,
): void {
  material.onBeforeCompile = (shader) => {
    // 1. In #include <defaultnormal_vertex> (diffuse/standard material)
    // Compute billboard orientation normal in view space for physically accurate diffuse lighting
    if (shader.vertexShader.includes('#include <defaultnormal_vertex>')) {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <defaultnormal_vertex>',
        /* glsl */ `
#ifdef USE_INSTANCING
    vec3 instanceWorldBase = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    bool isOrtho = (projectionMatrix[3][3] == 1.0);
    vec3 lookDir = isOrtho ? vec3(viewMatrix[0][2], 0.0, viewMatrix[2][2]) : (cameraPosition - instanceWorldBase);
    lookDir.y = 0.0;
    if (dot(lookDir, lookDir) < 0.0001) {
        lookDir = vec3(0.0, 0.0, 1.0);
    } else {
        lookDir = normalize(lookDir);
    }
    vec3 transformedNormal = (viewMatrix * vec4(lookDir, 0.0)).xyz;
    #define BILLBOARD_BASE_COMPUTED
#else
    #include <defaultnormal_vertex>
#endif
`,
      );
    }

    // 2. In #include <begin_vertex>
    // Extract instance scale and compute billboard world position & view-space mvPosition
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      /* glsl */ `
#include <begin_vertex>
#ifdef USE_INSTANCING
    #ifndef BILLBOARD_BASE_COMPUTED
    vec3 instanceWorldBase = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    bool isOrtho = (projectionMatrix[3][3] == 1.0);
    vec3 lookDir = isOrtho ? vec3(viewMatrix[0][2], 0.0, viewMatrix[2][2]) : (cameraPosition - instanceWorldBase);
    lookDir.y = 0.0;
    if (dot(lookDir, lookDir) < 0.0001) {
        lookDir = vec3(0.0, 0.0, 1.0);
    } else {
        lookDir = normalize(lookDir);
    }
    #endif

    float instScaleX = length(vec3(instanceMatrix[0][0], instanceMatrix[0][1], instanceMatrix[0][2]));
    float instScaleY = length(vec3(instanceMatrix[1][0], instanceMatrix[1][1], instanceMatrix[1][2]));

    vec3 worldUp = vec3(0.0, 1.0, 0.0);
    vec3 worldRight = normalize(cross(worldUp, lookDir));

    vec3 billboardWorldPos = instanceWorldBase + (worldRight * position.x * instScaleX) + (worldUp * position.y * instScaleY);
    vec4 mvPosition = viewMatrix * vec4(billboardWorldPos, 1.0);
#endif
`,
    );

    // 3. In #include <project_vertex>
    // Project the billboard mvPosition to clip space
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      /* glsl */ `
#ifdef USE_INSTANCING
    gl_Position = projectionMatrix * mvPosition;
#else
    #include <project_vertex>
#endif
`,
    );

    // 4. In #include <worldpos_vertex> (if present)
    // Ensure shadow mapping and lighting receive the correct billboard world coordinates
    if (shader.vertexShader.includes('#include <worldpos_vertex>')) {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        /* glsl */ `
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
#ifdef USE_INSTANCING
    vec4 worldPosition = vec4( billboardWorldPos, 1.0 );
#else
    #include <worldpos_vertex>
#endif
#endif
`,
      );
    }
  };
}

export const InnerInstancedMesh: React.FC<InnerInstancedMeshProps> = ({
  cropCode,
  spriteUrl,
  count,
  plants,
  baseGeometry,
  onSelectPlant,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Precompute calibrated botanical dimensions for all plants in this group
  // Guarantees true image aspect ratio (widthM / heightM === metric.aspectRatio) with 0% distortion
  const plantDims = useMemo(() => {
    return plants.map((p) =>
      calculatePlantDimensions(cropCode, p.radiusM, p.bodyHeightM, p.label),
    );
  }, [plants, cropCode]);

  const texture = useTexture(spriteUrl, (t) => {
    if ('isTexture' in t) {
      t.colorSpace = THREE.SRGBColorSpace;
    }
  });

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: texture as THREE.Texture,
      transparent: false,
      alphaTest: 0.5,
      depthWrite: true,
      side: THREE.DoubleSide,
      roughness: 0.7,
      emissive: new THREE.Color('#15803d'),
      emissiveIntensity: 0.12,
    });
    injectCylindricalBillboardShader(mat);
    return mat;
  }, [texture]);

  const customDepthMaterial = useMemo(() => {
    const depthMat = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      alphaTest: 0.5,
      map: texture as THREE.Texture,
    });
    injectCylindricalBillboardShader(depthMat, { isDepthMaterial: true });
    return depthMat;
  }, [texture]);

  useEffect(() => {
    return () => {
      material.dispose();
      customDepthMaterial.dispose();
    };
  }, [material, customDepthMaterial]);

  // Initial matrix layout and instance color assignment
  // Set ONCE on mount or when plant data changes.
  // Rotation is kept at identity (0, 0, 0) because cylindrical billboarding
  // is executed 100% on the GPU in the vertex shader, eliminating all useFrame CPU loops.
  useLayoutEffect(() => {
    if (!meshRef.current || count === 0) return;

    for (let i = 0; i < count; i++) {
      const p = plants[i];
      const dims = plantDims[i] ?? { widthM: 0.4, heightM: 0.4 };

      // Base geometry pivot is translated by +0.5 in Y.
      // Setting y = PLANT_GROUND_ELEVATION_M (0.02 m) anchors the bottom edge cleanly on the ground,
      // level with canopy rings and above floor geometry without sinking or clipping.
      dummy.position.set(p.xM, PLANT_GROUND_ELEVATION_M, p.zM);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(dims.widthM, dims.heightM, 1);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);

      const color = p.isSelected
        ? SELECTED_COLOR
        : p.isCrowded
        ? CROWDED_COLOR
        : NORMAL_COLOR;
      meshRef.current.setColorAt(i, color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
    meshRef.current.computeBoundingSphere();
  }, [plants, count, dummy, plantDims]);

  return (
    <instancedMesh
      ref={meshRef}
      name="instanced-plant-billboard-mesh"
      args={[baseGeometry, material, count]}
      customDepthMaterial={customDepthMaterial}
      castShadow
      receiveShadow={false}
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

  const baseGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, 1);
    // Offset pivot to ground base (y = 0) so the billboard never lifts or sinks when rotating
    geo.translate(0, 0.5, 0);
    return geo;
  }, []);

  const fallbackMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: '#16a34a',
      roughness: 0.6,
      side: THREE.DoubleSide,
    });
    injectCylindricalBillboardShader(mat);
    return mat;
  }, []);

  useEffect(() => {
    return () => {
      baseGeometry.dispose();
      fallbackMaterial.dispose();
    };
  }, [baseGeometry, fallbackMaterial]);

  if (count === 0 || !spriteUrl) return null;

  return (
    <React.Suspense
      fallback={
        <instancedMesh
          name="instanced-plant-billboard-mesh"
          args={[baseGeometry, fallbackMaterial, count]}
          castShadow
          receiveShadow={false}
        />
      }
    >
      <InnerInstancedMesh
        cropCode={cropCode}
        spriteUrl={spriteUrl}
        count={count}
        plants={plants}
        baseGeometry={baseGeometry}
        onSelectPlant={onSelectPlant}
      />
    </React.Suspense>
  );
};
