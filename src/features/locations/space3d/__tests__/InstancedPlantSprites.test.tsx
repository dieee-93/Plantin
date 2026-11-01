import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {
  InstancedPlantGroup,
  injectCylindricalBillboardShader,
  type InstancedPlantItem,
} from '../InstancedPlantSprites';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

describe('InstancedPlantSprites', () => {
  it('renders an instancedMesh for a batch of plants with correct count and customDepthMaterial', async () => {
    const samplePlants: InstancedPlantItem[] = [
      { id: 'lettuce-1', label: 'Lechuga 1', xM: 1, zM: 1, radiusM: 0.15, bodyHeightM: 0.25 },
      { id: 'lettuce-2', label: 'Lechuga 2', xM: 1.5, zM: 1, radiusM: 0.15, bodyHeightM: 0.25 },
      { id: 'lettuce-3', label: 'Lechuga 3', xM: 2, zM: 1, radiusM: 0.15, bodyHeightM: 0.25 },
      { id: 'lettuce-4', label: 'Lechuga 4', xM: 2.5, zM: 1, radiusM: 0.15, bodyHeightM: 0.25 },
    ];

    const renderer = await ReactThreeTestRenderer.create(
      <InstancedPlantGroup
        cropCode="LETTUCE"
        plants={samplePlants}
      />,
    );

    const instancedMeshes = renderer.scene.findAllByProps({
      name: 'instanced-plant-billboard-mesh',
    });

    expect(instancedMeshes).toHaveLength(1);
    expect(instancedMeshes[0].props.args[2]).toBe(4);
    expect(instancedMeshes[0].props.castShadow).toBe(true);
    expect(instancedMeshes[0].props.customDepthMaterial).toBeDefined();

    await renderer.unmount();
  });

  it('renders an instancedMesh for corn plants using fallback sprite mapping', async () => {
    const cornPlants: InstancedPlantItem[] = [
      { id: 'corn-1', label: 'Maíz 1', xM: 0, zM: 0, radiusM: 0.25, bodyHeightM: 0.6 },
      { id: 'corn-2', label: 'Maíz 2', xM: 1, zM: 0, radiusM: 0.25, bodyHeightM: 0.6 },
    ];

    const renderer = await ReactThreeTestRenderer.create(
      <InstancedPlantGroup
        cropCode="CORN"
        plants={cornPlants}
      />,
    );

    const instancedMeshes = renderer.scene.findAllByProps({
      name: 'instanced-plant-billboard-mesh',
    });

    expect(instancedMeshes).toHaveLength(1);
    expect(instancedMeshes[0].props.args[2]).toBe(2);

    await renderer.unmount();
  });

  it('renders null if plant list is empty or cropCode has no sprite', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <InstancedPlantGroup
        cropCode="NON_EXISTENT_CROP"
        plants={[]}
      />,
    );

    const instancedMeshes = renderer.scene.findAllByProps({
      name: 'instanced-plant-billboard-mesh',
    });

    expect(instancedMeshes).toHaveLength(0);

    await renderer.unmount();
  });

  it('injects GPU cylindrical billboard hooks into MeshStandardMaterial shader', () => {
    const material = new THREE.MeshStandardMaterial();
    injectCylindricalBillboardShader(material);

    expect(typeof material.onBeforeCompile).toBe('function');

    const mockShader = {
      vertexShader: THREE.ShaderLib.standard.vertexShader,
      fragmentShader: THREE.ShaderLib.standard.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(THREE.ShaderLib.standard.uniforms),
    };

    material.onBeforeCompile(mockShader, {} as THREE.WebGLRenderer);

    // Verify Vertex Shader transformations:
    // 1. begin_vertex replaced with billboard calculations
    expect(mockShader.vertexShader).toContain('instanceWorldBase');
    expect(mockShader.vertexShader).toContain('instScaleX');
    expect(mockShader.vertexShader).toContain('instScaleY');
    expect(mockShader.vertexShader).toContain('worldRight');
    expect(mockShader.vertexShader).toContain('billboardWorldPos');

    // 2. project_vertex replaced with direct mvPosition projection
    expect(mockShader.vertexShader).toContain('gl_Position = projectionMatrix * mvPosition;');

    // 3. defaultnormal_vertex replaced for physical diffuse lighting
    expect(mockShader.vertexShader).toContain('vec3 transformedNormal = (viewMatrix * vec4(lookDir, 0.0)).xyz;');

    // 4. worldpos_vertex replaced for shadow mapping
    expect(mockShader.vertexShader).toContain('vec4 worldPosition = vec4( billboardWorldPos, 1.0 );');
  });

  it('injects GPU cylindrical billboard hooks into MeshDepthMaterial for customDepthMaterial', () => {
    const depthMat = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      alphaTest: 0.5,
    });
    injectCylindricalBillboardShader(depthMat, { isDepthMaterial: true });

    const mockShader = {
      vertexShader: THREE.ShaderLib.depth.vertexShader,
      fragmentShader: THREE.ShaderLib.depth.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(THREE.ShaderLib.depth.uniforms),
    };

    depthMat.onBeforeCompile(mockShader, {} as THREE.WebGLRenderer);

    // Depth shader has no defaultnormal_vertex, but has begin_vertex and project_vertex
    expect(mockShader.vertexShader).toContain('billboardWorldPos');
    expect(mockShader.vertexShader).toContain('gl_Position = projectionMatrix * mvPosition;');
  });
});
