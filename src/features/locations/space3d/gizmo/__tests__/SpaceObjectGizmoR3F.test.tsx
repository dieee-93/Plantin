import ReactThreeTestRenderer from '@react-three/test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { SpaceObjectGizmo } from '../SpaceObjectGizmo';
import type { PlacedObjectSpatialCm } from '@/store/spaceLayoutStore';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

describe('SpaceObjectGizmo - React Three Test Renderer', () => {
  const centerCm = { x: 500, y: 300 };
  const mockObject: PlacedObjectSpatialCm = {
    id: 'obj-pallet-1',
    assetId: 'pallet_standard_wood_a01',
    label: 'Palet Europeo',
    xCm: 200,
    yCm: 150,
    elevationM: 0.21,
    rotationDeg: 0,
  };

  it('renders in R3F when selected', async () => {
    const onTransformChange = vi.fn();
    const onTransformCommit = vi.fn();

    const renderer = await ReactThreeTestRenderer.create(
      <SpaceObjectGizmo
        object={mockObject}
        centerCm={centerCm}
        isSelected={true}
        onTransformChange={onTransformChange}
        onTransformCommit={onTransformCommit}
      >
        <mesh name="mock-target-mesh" />
      </SpaceObjectGizmo>,
    );

    const targetMesh = renderer.scene.findAllByProps({ name: 'mock-target-mesh' });
    expect(targetMesh).toHaveLength(1);

    await renderer.unmount();
  });
});
