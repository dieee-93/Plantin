import { describe, expect, it, vi } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { CanopyRingsInstanced, type CanopyRingItem } from '../CanopyRingsInstanced';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

describe('CanopyRingsInstanced', () => {
  it('renders a single instancedMesh for all canopy rings with correct count', async () => {
    const sampleRings: CanopyRingItem[] = [
      { id: 'plant-1', xM: 1, zM: 1, radiusM: 0.2, isCrowded: false, isSelected: false },
      { id: 'plant-2', xM: 2, zM: 2, radiusM: 0.3, isCrowded: true, isSelected: false },
      { id: 'plant-3', xM: 3, zM: 3, radiusM: 0.25, isCrowded: false, isSelected: true },
    ];

    const renderer = await ReactThreeTestRenderer.create(
      <CanopyRingsInstanced rings={sampleRings} />,
    );

    const ringMeshes = renderer.scene.findAllByProps({
      name: 'instanced-canopy-rings-mesh',
    });

    expect(ringMeshes).toHaveLength(1);
    expect(ringMeshes[0].props.args[2]).toBe(3);

    await renderer.unmount();
  });

  it('renders null when rings array is empty', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <CanopyRingsInstanced rings={[]} />,
    );

    const ringMeshes = renderer.scene.findAllByProps({
      name: 'instanced-canopy-rings-mesh',
    });

    expect(ringMeshes).toHaveLength(0);

    await renderer.unmount();
  });

  it('handles click and selects plant by instanceId', async () => {
    const onSelectPlant = vi.fn();
    const sampleRings: CanopyRingItem[] = [
      { id: 'plant-a', xM: 1, zM: 1, radiusM: 0.2 },
      { id: 'plant-b', xM: 2, zM: 2, radiusM: 0.3 },
    ];

    const renderer = await ReactThreeTestRenderer.create(
      <CanopyRingsInstanced rings={sampleRings} onSelectPlant={onSelectPlant} />,
    );

    const ringMesh = renderer.scene.findByProps({
      name: 'instanced-canopy-rings-mesh',
    });

    // Simulate click on second instance (plant-b)
    ringMesh.props.onClick({
      stopPropagation: vi.fn(),
      instanceId: 1,
    });

    expect(onSelectPlant).toHaveBeenCalledWith('plant-b');

    await renderer.unmount();
  });

  it('handles 5,000 canopy rings directly via typed arrays without CPU composition overhead', async () => {
    const massiveRings: CanopyRingItem[] = new Array(5000);
    for (let i = 0; i < 5000; i++) {
      massiveRings[i] = {
        id: `plant-${i}`,
        xM: (i % 50) * 0.5,
        zM: Math.floor(i / 50) * 0.5,
        radiusM: 0.2,
        isCrowded: i % 10 === 0,
        isSelected: i === 42,
      };
    }

    const t0 = performance.now();
    const renderer = await ReactThreeTestRenderer.create(
      <CanopyRingsInstanced rings={massiveRings} />,
    );
    const durationMs = performance.now() - t0;

    const ringMeshes = renderer.scene.findAllByProps({
      name: 'instanced-canopy-rings-mesh',
    });

    expect(ringMeshes).toHaveLength(1);
    expect(ringMeshes[0].props.args[2]).toBe(5000);
    expect(durationMs).toBeLessThan(1000);

    await renderer.unmount();
  });
});
