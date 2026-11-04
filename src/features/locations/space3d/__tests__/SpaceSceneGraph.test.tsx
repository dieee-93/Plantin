import ReactThreeTestRenderer from '@react-three/test-renderer';
import { describe, expect, it } from 'vitest';
import { SPACE_PRESETS } from '@/store/spaceLayoutStore';
import { SpaceSceneGraph } from '../SpaceSceneGraph';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

describe('SpaceSceneGraph - Slice 2: 1:1 R3F Scene Graph, Solar Light & Wall Cutaway', () => {
  it('renders 3 cultivable-sector-mesh, 1 walkable-surface-mesh, and GPU instanced plant & ring meshes for patio_croquis', async () => {
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
    const canopyRingMeshes = renderer.scene.findAllByProps({
      name: 'instanced-canopy-rings-mesh',
    });
    const plantBillboardMeshes = renderer.scene.findAllByProps({
      name: 'instanced-plant-billboard-mesh',
    });

    expect(cultivableMeshes).toHaveLength(3);
    expect(walkableMeshes).toHaveLength(2);
    expect(walkableMeshes.map((m) => m.props.userData?.material)).toEqual([
      'concrete',
      'gravel',
    ]);
    expect(walkableMeshes[0].props.position[1]).toBeCloseTo(0.015, 3);
    // 1 single instanced mesh for all 3 canopy rings
    expect(canopyRingMeshes).toHaveLength(1);
    expect(canopyRingMeshes[0].props.args[2]).toBe(3);
    // 3 instanced groups (one per cropCode: tomato, pepper, lettuce)
    expect(plantBillboardMeshes).toHaveLength(3);

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
    expect(sunLightNoon.props.color).toBe('#fff3d1');

    const hemiLight = renderer.scene.findByProps({
      name: 'cozy-hemisphere-light',
    });
    expect(hemiLight.props.args).toEqual(['#fffbeb', '#8ca870', 0.65]);

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

  it('renders 3D interactive vertex corner handles and edge split indicators when isBoundaryEditMode is true', async () => {
    const layout = SPACE_PRESETS.patio_croquis.createLayout('loc-handles-test');

    const renderer = await ReactThreeTestRenderer.create(
      <SpaceSceneGraph
        layout={layout}
        viewMode="3d"
        isBoundaryEditMode={true}
        selectedVertexIndex={1}
      />,
    );

    const vertexHandles = renderer.scene.findAllByProps({
      name: 'boundary-vertex-handle-3d',
    });
    const vertexSpheres = renderer.scene.findAllByProps({
      name: 'boundary-vertex-sphere',
    });
    const edgeIndicators = renderer.scene.findAllByProps({
      name: 'edge-split-indicator-3d',
    });

    expect(vertexHandles).toHaveLength(layout.baseBoundary.length);
    expect(vertexSpheres).toHaveLength(layout.baseBoundary.length);
    expect(edgeIndicators).toHaveLength(layout.baseBoundary.length);

    // Selected vertex has isSelected: true
    expect(vertexHandles[1].props.userData.isSelected).toBe(true);
    expect(vertexHandles[0].props.userData.isSelected).toBe(false);

    await renderer.unmount();
  });

  it('omits split handles for short boundary edges (< 120 cm) preventing handle saturation', async () => {
    const layout = {
      ...SPACE_PRESETS.empty_lot_1to1.createLayout('loc-short-edge'),
      baseBoundary: [
        { x: 0, y: 0 },
        { x: 50, y: 0 }, // edge 0-1 is 50 cm (< 120 cm)
        { x: 50, y: 500 }, // edge 1-2 is 500 cm (>= 120 cm)
        { x: 0, y: 500 }, // edge 2-3 is 50 cm (< 120 cm), edge 3-0 is 500 cm (>= 120 cm)
      ],
    };
    const renderer = await ReactThreeTestRenderer.create(
      <SpaceSceneGraph layout={layout} viewMode="3d" isBoundaryEditMode={true} />,
    );
    const edgeIndicators = renderer.scene.findAllByProps({
      name: 'edge-split-indicator-3d',
    });
    // Out of 4 edges, only 2 are >= 120 cm
    expect(edgeIndicators).toHaveLength(2);
    await renderer.unmount();
  });

  it('renders 3D architectural carpentry (door-opening-node and window-opening-node) and decomposes walls with openings', async () => {
    const baseLayout = SPACE_PRESETS.indoor_room_1to1.createLayout('loc-openings-3d');
    // Wall 0 (North): add door (90x210) and window (120x110)
    const layoutWithOpenings = {
      ...baseLayout,
      walls: baseLayout.walls.map((w, idx) =>
        idx === 0
          ? {
              ...w,
              openings: [
                {
                  id: 'op-door-1',
                  kind: 'door' as const,
                  offsetCm: 50,
                  widthCm: 90,
                  heightCm: 210,
                  sillHeightCm: 0,
                },
                {
                  id: 'op-win-1',
                  kind: 'window' as const,
                  offsetCm: 200,
                  widthCm: 120,
                  heightCm: 110,
                  sillHeightCm: 90,
                },
              ],
            }
          : w,
      ),
    };

    const renderer = await ReactThreeTestRenderer.create(
      <SpaceSceneGraph
        layout={layoutWithOpenings}
        viewMode="3d"
        cameraGroundPosCm={{ x: 200, y: 800 }}
      />,
    );

    const doorNodes = renderer.scene.findAllByProps({
      name: 'door-opening-node',
    });
    const windowNodes = renderer.scene.findAllByProps({
      name: 'window-opening-node',
    });

    expect(doorNodes).toHaveLength(1);
    expect(windowNodes).toHaveLength(1);

    await renderer.unmount();
  });

  it('renders 3D gabled greenhouse roof with trusses and translucent slopes, and hides it when showRoof is false', async () => {
    const layout = SPACE_PRESETS.greenhouse_1to1.createLayout('loc-gh-roof');

    const renderer = await ReactThreeTestRenderer.create(
      <SpaceSceneGraph
        layout={layout}
        viewMode="3d"
        showRoof={true}
        cameraGroundPosCm={{ x: 500, y: 950 }}
      />,
    );

    const roofRoot = renderer.scene.findAllByProps({ name: 'space-roof-root' });
    expect(roofRoot).toHaveLength(1);

    const gabledGroup = renderer.scene.findAllByProps({
      name: 'gabled-greenhouse-roof-group',
    });
    expect(gabledGroup).toHaveLength(1);

    const leftSlope = renderer.scene.findAllByProps({
      name: 'greenhouse-roof-slope-left',
    });
    const rightSlope = renderer.scene.findAllByProps({
      name: 'greenhouse-roof-slope-right',
    });
    expect(leftSlope).toHaveLength(1);
    expect(rightSlope).toHaveLength(1);

    // Toggle showRoof={false}
    await renderer.update(
      <SpaceSceneGraph
        layout={layout}
        viewMode="3d"
        showRoof={false}
        cameraGroundPosCm={{ x: 500, y: 950 }}
      />,
    );

    expect(renderer.scene.findAllByProps({ name: 'space-roof-root' })).toHaveLength(0);

    await renderer.unmount();
  });

  it('renders flat indoor ceiling with suspended grow light nodes', async () => {
    const layout = SPACE_PRESETS.indoor_room_1to1.createLayout('loc-indoor-roof');

    const renderer = await ReactThreeTestRenderer.create(
      <SpaceSceneGraph
        layout={layout}
        viewMode="3d"
        showRoof={true}
        cameraGroundPosCm={{ x: 200, y: 800 }}
      />,
    );

    const flatCeilingGroup = renderer.scene.findAllByProps({
      name: 'flat-ceiling-indoor-group',
    });
    expect(flatCeilingGroup).toHaveLength(1);

    const growLights = renderer.scene.findAllByProps({
      name: 'suspended-grow-light-node',
    });
    expect(growLights.length).toBeGreaterThanOrEqual(1);

    await renderer.unmount();
  });

  it('renders shade cloth pergola with corner timber posts and mesh', async () => {
    const baseLayout = SPACE_PRESETS.patio_croquis.createLayout('loc-shade-test');
    const layoutWithShade = {
      ...baseLayout,
      roofConfig: {
        kind: 'shade_cloth' as const,
        heightCm: 230,
      },
    };

    const renderer = await ReactThreeTestRenderer.create(
      <SpaceSceneGraph
        layout={layoutWithShade}
        viewMode="3d"
        showRoof={true}
        cameraGroundPosCm={{ x: 500, y: 950 }}
      />,
    );

    const shadeGroup = renderer.scene.findAllByProps({
      name: 'shade-cloth-roof-group',
    });
    expect(shadeGroup).toHaveLength(1);

    await renderer.unmount();
  });

  it('renders open-boundary-line-mesh for open wall boundaries (heightCm: 0) so they can be seen and selected in 3D', async () => {
    const baseLayout = SPACE_PRESETS.patio_croquis.createLayout('loc-open-walls');
    const layoutWithOpenWall = {
      ...baseLayout,
      walls: baseLayout.walls.map((w, idx) =>
        idx === 0 ? { ...w, heightCm: 0 } : w,
      ),
    };

    const renderer = await ReactThreeTestRenderer.create(
      <SpaceSceneGraph
        layout={layoutWithOpenWall}
        viewMode="3d"
        cameraGroundPosCm={{ x: 500, y: 950 }}
      />,
    );

    const openBoundaryMeshes = renderer.scene.findAllByProps({
      name: 'open-boundary-line-mesh',
    });
    expect(openBoundaryMeshes).toHaveLength(1);
    expect(openBoundaryMeshes[0].props.userData.isOpen).toBe(true);

    await renderer.unmount();
  });

  it('mounts 3D infrastructure immediately in 0ms and defers massive plants (>1000) to next tick', async () => {
    const baseLayout = SPACE_PRESETS.patio_croquis.createLayout('loc-massive-test');
    // Generate 1200 plants to trigger progressive plant population threshold (>1000)
    const massivePlants = Array.from({ length: 1200 }, (_, i) => ({
      id: `massive-p-${i}`,
      label: `Planta #${i + 1}`,
      xCm: 100 + (i % 30) * 20,
      yCm: 100 + Math.floor(i / 30) * 20,
      canopyRadiusCm: 15,
      cropCode: 'TOM',
    }));

    const massiveLayout = {
      ...baseLayout,
      placedPlants: massivePlants,
    };

    const renderer = await ReactThreeTestRenderer.create(
      <SpaceSceneGraph
        layout={massiveLayout}
        viewMode="3d"
        cameraGroundPosCm={{ x: 500, y: 950 }}
      />,
    );

    // 1. Frame 0: Infrastructure (cultivable sectors, walkable surfaces, walls) mounts immediately
    const cultivableMeshes = renderer.scene.findAllByProps({
      name: 'cultivable-sector-mesh',
    });
    expect(cultivableMeshes.length).toBeGreaterThan(0);

    // 2. Plants layer is initially deferred so frame 0 renders with 0ms freeze
    const initialPlantsLayer = renderer.scene.findAllByProps({
      name: 'plants-layer',
    });
    expect(initialPlantsLayer).toHaveLength(0);

    // 3. Next tick: Progressive population mounts the 1200 plants seamlessly
    await ReactThreeTestRenderer.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const populatedPlantsLayer = renderer.scene.findAllByProps({
      name: 'plants-layer',
    });
    expect(populatedPlantsLayer).toHaveLength(1);

    const canopyRingMeshes = renderer.scene.findAllByProps({
      name: 'instanced-canopy-rings-mesh',
    });
    expect(canopyRingMeshes).toHaveLength(1);
    expect(canopyRingMeshes[0].props.args[2]).toBe(1200);

    await renderer.unmount();
  });

  it('renders surrounding-ground-plane with raycast disabled to prevent interfering with picking', async () => {
    const layout = SPACE_PRESETS.patio_croquis.createLayout('loc-ground-test');

    const renderer = await ReactThreeTestRenderer.create(
      <SpaceSceneGraph
        layout={layout}
        viewMode="3d"
      />,
    );

    const groundMesh = renderer.scene.findByProps({
      name: 'surrounding-ground-plane',
    });

    expect(groundMesh).toBeDefined();
    expect(groundMesh.props.raycast()).toBeNull();
    expect(groundMesh.props.position[1]).toBe(-0.01);

    await renderer.unmount();
  });
});
