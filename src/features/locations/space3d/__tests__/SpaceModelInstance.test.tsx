import ReactThreeTestRenderer from '@react-three/test-renderer';
import { describe, expect, it } from 'vitest';
import { ObjectsLayer } from '../SpaceSceneGraph';
import { SpaceModelInstance } from '../SpaceModelInstance';
import type { PlacedObjectSpatialCm } from '@/store/spaceLayoutStore';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

describe('SpaceModelInstance & ObjectsLayer - 3D Logistics & Facility Assets', () => {
  it('renders a single SpaceModelInstance at correct 3D coordinates based on cm and centerCm', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <SpaceModelInstance
        modelUrl="/models/pallet_standard_wood_a01.glb"
        positionCm={{ x: 850, y: 100 }}
        centerCm={{ x: 500, y: 300 }}
        elevationM={0}
        rotationDeg={90}
      />,
    );

    const mesh = renderer.scene.findAllByProps({
      name: 'model-instance-/models/pallet_standard_wood_a01.glb',
    });

    expect(mesh).toHaveLength(1);
    // X = (850 - 500) * 0.01 = 3.5 m
    expect(mesh[0].props.position[0]).toBeCloseTo(3.5, 3);
    // Y = 0 m
    expect(mesh[0].props.position[1]).toBeCloseTo(0, 3);
    // Z = (100 - 300) * 0.01 = -2.0 m
    expect(mesh[0].props.position[2]).toBeCloseTo(-2.0, 3);
    // Rotation Y = 90 deg = PI / 2
    expect(mesh[0].props.rotation[1]).toBeCloseTo(Math.PI / 2, 3);

    await renderer.unmount();
  });

  it('renders ObjectsLayer with pallets and stacked harvest crates', async () => {
    const placedObjects: PlacedObjectSpatialCm[] = [
      {
        id: 'obj-pallet-1',
        assetId: 'pallet_standard_wood_a01',
        label: 'Palet de Madera',
        xCm: 850,
        yCm: 100,
        elevationM: 0,
        rotationDeg: 0,
        category: 'logistics',
      },
      {
        id: 'obj-crate-1',
        assetId: 'crate_harvest_plastic_green_a01',
        label: 'Caja Apilada',
        xCm: 850,
        yCm: 100,
        elevationM: 0.209,
        rotationDeg: 0,
        category: 'logistics',
      },
    ];

    const renderer = await ReactThreeTestRenderer.create(
      <ObjectsLayer
        placedObjects={placedObjects}
        centerCm={{ x: 500, y: 300 }}
      />,
    );

    const pallets = renderer.scene.findAllByProps({
      name: 'model-instance-/models/pallet_standard_wood_a01.glb',
    });
    const crates = renderer.scene.findAllByProps({
      name: 'model-instance-/models/crate_harvest_plastic_green_a01.glb',
    });

    expect(pallets).toHaveLength(1);
    expect(crates).toHaveLength(1);
    // Crate stacked on top of pallet at elevationM = 0.209
    expect(crates[0].props.position[1]).toBeCloseTo(0.209, 3);

    await renderer.unmount();
  });
});
