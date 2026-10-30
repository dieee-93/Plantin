import ReactThreeTestRenderer from '@react-three/test-renderer';
import { describe, expect, it } from 'vitest';
import { SPACE_PRESETS } from '@/store/spaceLayoutStore';
import { SpaceSceneGraph } from '../SpaceSceneGraph';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

describe('SpaceSceneGraph - Slice 2: 1:1 R3F Scene Graph, Solar Light & Wall Cutaway', () => {
  it('renders 3 cultivable-sector-mesh and 1 walkable-surface-mesh for patio_croquis along with 3 placed-plant-node groups', async () => {
    const layout = SPACE_PRESETS.patio_croquis.createLayout('loc-patio-test');

    const renderer = await ReactThreeTestRenderer.create(
      <SpaceSceneGraph
        layout={layout}
        viewMode="3d"
        cameraGroundPosCm={{ x: 500, y: 950 }}
      />,
    );

    const cultivableMeshes = renderer.scene.findAllByProps({
      name: 'cultivable-sector-mesh',
    });
    const walkableMeshes = renderer.scene.findAllByProps({
      name: 'walkable-surface-mesh',
    });
    const plantNodes = renderer.scene.findAllByProps({
      name: 'placed-plant-node',
    });
    const canopyRings = renderer.scene.findAllByProps({
      name: 'plant-canopy-ring',
    });
    const plantBillboards = renderer.scene.findAllByProps({
      name: 'plant-billboard-mesh',
    });

    expect(cultivableMeshes).toHaveLength(3);
    expect(walkableMeshes).toHaveLength(1);
    expect(walkableMeshes[0].props.position[1]).toBeCloseTo(0.015, 3);
    expect(plantNodes).toHaveLength(3);
    expect(canopyRings).toHaveLength(3);
    expect(plantBillboards).toHaveLength(3);

    await renderer.unmount();
  });

  it('updates solar-directional-light position and intensity when hourOfDay and season change', async () => {
    const baseLayout = SPACE_PRESETS.patio_croquis.createLayout('loc-solar-test');
    const summerNoonLayout = {
      ...baseLayout,
      solarConfig: {
        ...baseLayout.solarConfig,
        season: 'summer' as const,
        hourOfDay: 12,
      },
    };

    const renderer = await ReactThreeTestRenderer.create(
      <SpaceSceneGraph
        layout={summerNoonLayout}
        viewMode="3d"
        cameraGroundPosCm={{ x: 500, y: 950 }}
      />,
    );

    const sunLightNoon = renderer.scene.findByProps({
      name: 'solar-directional-light',
    });
    const [noonX, noonY, noonZ] = sunLightNoon.props.position as [number, number, number];

    // At summer noon in Southern Hemisphere (-34.6°), sun is high (Y > 18m) and slightly North (Z < -3m, X ~ 0)
    expect(noonY).toBeGreaterThan(18);
    expect(Math.abs(noonX)).toBeLessThan(0.5);
    expect(noonZ).toBeLessThan(-3);

    // Update to winter morning (8:00 AM)
    const winterMorningLayout = {
      ...baseLayout,
      solarConfig: {
        ...baseLayout.solarConfig,
        season: 'winter' as const,
        hourOfDay: 8,
      },
    };

    await renderer.update(
      <SpaceSceneGraph
        layout={winterMorningLayout}
        viewMode="3d"
        cameraGroundPosCm={{ x: 500, y: 950 }}
      />,
    );

    const sunLightMorning = renderer.scene.findByProps({
      name: 'solar-directional-light',
    });
    const [morningX, morningY, morningZ] = sunLightMorning.props.position as [
      number,
      number,
      number,
    ];

    // In winter at 8:00 AM, sun is in the East (+X > 10m), much lower than summer noon (Y < noonY), and further North
    expect(morningX).toBeGreaterThan(10);
    expect(morningY).toBeLessThan(noonY);
    expect(morningZ).toBeLessThan(noonZ);

    await renderer.unmount();
  });

  it('applies wall cutaway (0.15 m height) to front-facing walls while keeping back walls at full 2.0 m height in 3D mode, and lowers all walls in 2D mode', async () => {
    const layout = SPACE_PRESETS.patio_croquis.createLayout('loc-walls-test');

    // Camera in the South (x=500, y=950) looking toward center (500, 300):
    // wall-0 is North (0,0)->(1000,0) -> back wall (full 2.0 m)
    // wall-2 is South (1000,600)->(0,600) -> front wall (cutaway 0.15 m)
    const renderer = await ReactThreeTestRenderer.create(
      <SpaceSceneGraph
        layout={layout}
        viewMode="3d"
        cameraGroundPosCm={{ x: 500, y: 950 }}
      />,
    );

    const wallMeshes3D = renderer.scene.findAllByProps({
      name: 'wall-segment-mesh',
    });
    expect(wallMeshes3D).toHaveLength(4);

    const heights3D = wallMeshes3D.map((m) => m.props.userData.wallHeightM as number);
    expect(heights3D).toContain(2.0);
    expect(heights3D).toContain(0.15);

    // Specifically verify North wall (wall-0) is 2.0m and South wall (wall-2) is 0.15m
    const northWall3D = wallMeshes3D.find((m) => m.props.userData.wallId === 'wall-0');
    const southWall3D = wallMeshes3D.find((m) => m.props.userData.wallId === 'wall-2');
    expect(northWall3D?.props.userData.wallHeightM).toBeCloseTo(2.0, 2);
    expect(southWall3D?.props.userData.wallHeightM).toBeCloseTo(0.15, 2);

    // Switch to 2D mode -> all walls lower to 0.15 m
    await renderer.update(
      <SpaceSceneGraph
        layout={layout}
        viewMode="2d"
        cameraGroundPosCm={{ x: 500, y: 950 }}
      />,
    );

    const wallMeshes2D = renderer.scene.findAllByProps({
      name: 'wall-segment-mesh',
    });
    for (const wallMesh of wallMeshes2D) {
      expect(wallMesh.props.userData.wallHeightM).toBeCloseTo(0.15, 2);
    }

    await renderer.unmount();
  });
});
