import ReactThreeTestRenderer from '@react-three/test-renderer';
import * as THREE from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getFloorMaterialConfig, getWallMaterialConfig } from '../materialRegistry';
import { SpaceStandardMaterial } from '../SpaceStandardMaterial';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const mockUseTexture = vi.fn();

vi.mock('@react-three/drei', () => ({
  useTexture: (input: unknown) => mockUseTexture(input),
}));

describe('SpaceStandardMaterial', () => {
  beforeEach(() => {
    mockUseTexture.mockReset();
  });

  it('binds PBR maps (map, normalMap, aoMap, roughnessMap, metalnessMap) and configures SRGB vs NoColorSpace accurately', async () => {
    const fakeAlbedo = new THREE.Texture();
    const fakeNormal = new THREE.Texture();
    const fakeArm = new THREE.Texture();

    mockUseTexture.mockReturnValue({
      map: fakeAlbedo,
      normalMap: fakeNormal,
      armMap: fakeArm,
    });

    const soilConfig = getFloorMaterialConfig('soil');

    const renderer = await ReactThreeTestRenderer.create(
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <SpaceStandardMaterial config={soilConfig} />
      </mesh>,
    );

    expect(mockUseTexture).toHaveBeenCalledWith({
      map: '/textures/floors/soil/albedo.webp',
      normalMap: '/textures/floors/soil/normal.webp',
      armMap: '/textures/floors/soil/arm.webp',
    });

    expect(fakeAlbedo.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(fakeAlbedo.wrapS).toBe(THREE.RepeatWrapping);
    expect(fakeAlbedo.wrapT).toBe(THREE.RepeatWrapping);

    expect(fakeNormal.colorSpace).toBe(THREE.NoColorSpace);
    expect(fakeNormal.wrapS).toBe(THREE.RepeatWrapping);
    expect(fakeNormal.wrapT).toBe(THREE.RepeatWrapping);

    expect(fakeArm.colorSpace).toBe(THREE.NoColorSpace);
    expect(fakeArm.wrapS).toBe(THREE.RepeatWrapping);
    expect(fakeArm.wrapT).toBe(THREE.RepeatWrapping);

    const meshNode = renderer.scene.children[0];
    const matInstance = (meshNode.instance as THREE.Mesh).material as THREE.MeshStandardMaterial;

    expect(matInstance.map).toBe(fakeAlbedo);
    expect(matInstance.normalMap).toBe(fakeNormal);
    expect(matInstance.aoMap).toBe(fakeArm);
    expect(matInstance.roughnessMap).toBe(fakeArm);
    expect(matInstance.metalnessMap).toBe(fakeArm);
    expect(matInstance.normalScale.x).toBeCloseTo(soilConfig.normalScale ?? 1.0, 3);
    expect(matInstance.normalScale.y).toBeCloseTo(soilConfig.normalScale ?? 1.0, 3);
    expect(matInstance.aoMapIntensity).toBeCloseTo(soilConfig.aoMapIntensity ?? 0.6, 3);

    await renderer.unmount();
  });

  it('renders untextured materials directly without calling useTexture', async () => {
    const glassConfig = getWallMaterialConfig('glass_greenhouse');

    const renderer = await ReactThreeTestRenderer.create(
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <SpaceStandardMaterial config={glassConfig} />
      </mesh>,
    );

    expect(mockUseTexture).not.toHaveBeenCalled();

    const meshNode = renderer.scene.children[0];
    const matInstance = (meshNode.instance as THREE.Mesh).material as THREE.MeshStandardMaterial;
    expect(matInstance.transparent).toBe(true);
    expect(matInstance.opacity).toBeCloseTo(0.45, 2);

    await renderer.unmount();
  });

  it('gracefully falls back to solid fallbackColor material when texture loading throws an error', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockUseTexture.mockImplementation(() => {
      throw new Error('404 Texture Not Found');
    });

    const brickConfig = getWallMaterialConfig('brick');

    const renderer = await ReactThreeTestRenderer.create(
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <SpaceStandardMaterial config={brickConfig} />
      </mesh>,
    );

    const meshNode = renderer.scene.children[0];
    const matInstance = (meshNode.instance as THREE.Mesh).material as THREE.MeshStandardMaterial;
    expect(matInstance.map).toBeNull();
    expect(`#${matInstance.color.getHexString()}`).toBe(brickConfig.fallbackColor.toLowerCase());

    warnSpy.mockRestore();
    await renderer.unmount();
  });
});
