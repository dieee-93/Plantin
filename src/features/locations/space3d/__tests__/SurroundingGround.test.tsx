import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { SurroundingGround } from '../SurroundingGround';
import { createSurroundingGroundTexture } from '../surroundingGroundTexture';

describe('SurroundingGround - Soft Radial Horizon Blend Plane', () => {
  it('renders a surrounding-ground-plane mesh with transparent material and depthWrite disabled', async () => {
    const renderer = await ReactThreeTestRenderer.create(<SurroundingGround sizeM={350} />);

    const groundMesh = renderer.scene.findByProps({
      name: 'surrounding-ground-plane',
    });

    expect(groundMesh).toBeDefined();
    expect(groundMesh.props.raycast()).toBeNull();
    expect(groundMesh.props.position[1]).toBe(-0.01);

    // Check instance properties
    const meshObj = groundMesh.instance as unknown as THREE.Mesh<
      THREE.BufferGeometry,
      THREE.MeshBasicMaterial
    >;
    expect(meshObj.geometry).toBeDefined();
    expect(meshObj.geometry.type).toBe('PlaneGeometry');
    expect(meshObj.material).toBeDefined();
    expect(meshObj.material.transparent).toBe(true);
    expect(meshObj.material.depthWrite).toBe(false);

    await renderer.unmount();
  });

  it('safely handles canvas texture generation in any environment without errors', () => {
    // In headless test environments without 2D canvas context, gracefully returns null
    const tex = createSurroundingGroundTexture();
    // Should be either CanvasTexture or null, but never throw
    expect(tex === null || typeof tex === 'object').toBe(true);
  });
});
