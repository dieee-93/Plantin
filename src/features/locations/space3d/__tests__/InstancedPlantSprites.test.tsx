import { describe, expect, it } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { InstancedPlantGroup, type InstancedPlantItem } from '../InstancedPlantSprites';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

describe('InstancedPlantSprites', () => {
  it('renders an instancedMesh for a batch of plants with correct count and properties', async () => {
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
});
