import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useSpaceLayoutStore } from '@/store/spaceLayoutStore';
import { Space3DViewer } from '../Space3DViewer';

describe('Space3DViewer - Placed 3D Object Selection and Manipulation', () => {
  const locationId = 'loc-obj-test-1';

  beforeEach(() => {
    useSpaceLayoutStore.getState().resetAll();
    const initial = useSpaceLayoutStore.getState().getOrCreateSpaceLayout(locationId);
    useSpaceLayoutStore.setState((s) => ({
      layouts: {
        ...s.layouts,
        [locationId]: {
          ...initial,
          placedObjects: [],
        },
      },
    }));

    // Initialize room with an object
    useSpaceLayoutStore.getState().placeObject(locationId, {
      assetId: 'pallet_standard_wood_a01',
      label: 'Palet Europeo',
      category: 'logistics',
      xCm: 300,
      yCm: 250,
      elevationM: 0,
      rotationDeg: 0,
      widthCm: 120,
      depthCm: 80,
      heightCm: 21,
    });
  });

  it('selects an object in 2D CAD mode, opens SpaceObjectActionBar, and allows rotating and elevating it', () => {
    render(
      <Space3DViewer
        locationId={locationId}
        locationName="Nave de Almacén"
        locationType="warehouse"
        initialMode="design"
      />,
    );

    // Switch to 2D view
    const btn2D = screen.getByRole('button', { name: /2D|Plano 2D/i });
    fireEvent.click(btn2D);

    // Find our placed object in 2D CAD SVG
    const placedObjects = useSpaceLayoutStore.getState().getOrCreateSpaceLayout(locationId).placedObjects ?? [];
    const targetObj = placedObjects.find((o) => o.assetId === 'pallet_standard_wood_a01')!;
    expect(targetObj).toBeDefined();

    const svgObject = screen.getByTestId(`svg-object-${targetObj.id}`);
    expect(svgObject).toBeInTheDocument();

    // Click to select the object
    fireEvent.click(svgObject);

    // Action bar appears
    expect(screen.getByTestId('selected-object-action-bar')).toBeInTheDocument();
    expect(screen.getByText('Palet Europeo')).toBeInTheDocument();
    expect(screen.getByText(/120 × 80 × 21 cm/i)).toBeInTheDocument();

    // Click "Girar +90°"
    const rotateBtn = screen.getByRole('button', { name: /Girar \+90°/i });
    fireEvent.click(rotateBtn);

    const afterRotate = useSpaceLayoutStore
      .getState()
      .getOrCreateSpaceLayout(locationId)
      .placedObjects?.find((o) => o.id === targetObj.id);
    expect(afterRotate?.rotationDeg).toBe(90);

    // Click "Palet 21 cm" elevation preset
    const presetBtn = screen.getByRole('button', { name: /Palet 21 cm/i });
    fireEvent.click(presetBtn);

    const afterElevation = useSpaceLayoutStore
      .getState()
      .getOrCreateSpaceLayout(locationId)
      .placedObjects?.find((o) => o.id === targetObj.id);
    expect(afterElevation?.elevationM).toBe(0.21);
  });

  it('duplicates and deletes placed object via SpaceObjectActionBar and keyboard shortcuts', () => {
    render(
      <Space3DViewer
        locationId={locationId}
        locationName="Nave de Almacén"
        locationType="warehouse"
        initialMode="design"
      />,
    );

    // Switch to 2D view
    const btn2D = screen.getByRole('button', { name: /2D|Plano 2D/i });
    fireEvent.click(btn2D);

    const placedObjects = useSpaceLayoutStore.getState().getOrCreateSpaceLayout(locationId).placedObjects ?? [];
    const initialCount = placedObjects.length;
    const targetObj = placedObjects.find((o) => o.assetId === 'pallet_standard_wood_a01')!;
    const svgObject = screen.getByTestId(`svg-object-${targetObj.id}`);
    fireEvent.click(svgObject);

    // Duplicate object
    const dupBtn = screen.getByRole('button', { name: /Duplicar/i });
    fireEvent.click(dupBtn);

    const afterDup = useSpaceLayoutStore.getState().getOrCreateSpaceLayout(locationId).placedObjects ?? [];
    expect(afterDup.length).toBe(initialCount + 1);

    // Delete duplicated object via action bar
    const deleteBtn = screen.getByRole('button', { name: /Eliminar objeto/i });
    fireEvent.click(deleteBtn);

    const afterDelete = useSpaceLayoutStore.getState().getOrCreateSpaceLayout(locationId).placedObjects ?? [];
    expect(afterDelete.length).toBe(initialCount);
    expect(screen.queryByTestId('selected-object-action-bar')).not.toBeInTheDocument();

    // Select the target object and delete via keyboard Delete
    const targetSvg = screen.getByTestId(`svg-object-${targetObj.id}`);
    fireEvent.click(targetSvg);
    expect(screen.getByTestId('selected-object-action-bar')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
    });

    const finalObjects = useSpaceLayoutStore.getState().getOrCreateSpaceLayout(locationId).placedObjects ?? [];
    expect(finalObjects.length).toBe(initialCount - 1);
    expect(screen.queryByTestId('selected-object-action-bar')).not.toBeInTheDocument();
  });

  it('drags an object across the 2D CAD plane with metric snapping and live validation badge', () => {
    render(
      <Space3DViewer
        locationId={locationId}
        locationName="Nave de Almacén"
        locationType="warehouse"
        initialMode="design"
      />,
    );

    // Switch to 2D view
    const btn2D = screen.getByRole('button', { name: /2D|Plano 2D/i });
    fireEvent.click(btn2D);

    const placedObjects =
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout(locationId).placedObjects ?? [];
    const targetObj = placedObjects.find((o) => o.assetId === 'pallet_standard_wood_a01')!;
    const svgObject = screen.getByTestId(`svg-object-${targetObj.id}`);
    const svgPlane = screen.getByTestId('interactive-plane-1to1');

    // 1. Start drag on object
    fireEvent.pointerDown(svgObject);

    // 2. Move pointer over CAD plane
    fireEvent.pointerMove(svgPlane, { clientX: 400, clientY: 350 });

    // Live validation badge appears while dragging
    expect(screen.getByTestId('object-drag-validation-badge')).toBeInTheDocument();

    // 3. Pointer up commits the drag
    fireEvent.pointerUp(svgPlane);

    // Badge disappears after commit
    expect(screen.queryByTestId('object-drag-validation-badge')).not.toBeInTheDocument();
  });

  it('mounts Space3DViewer in design mode with placed 3D objects and HUD controls', () => {
    render(
      <Space3DViewer
        locationId={locationId}
        locationName="Nave de Almacén"
        locationType="warehouse"
        initialMode="design"
      />,
    );

    // Initial 3D mode
    const placedObjects =
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout(locationId).placedObjects ?? [];
    expect(placedObjects.some((o) => o.assetId === 'pallet_standard_wood_a01')).toBe(true);

    const toggleButton = screen.getByRole('button', { name: /Cultivo/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('automatically detects auto-stack elevation when dragging a crate over a euro-pallet in flight', () => {
    // Setup space with a pallet and a harvest crate
    const store = useSpaceLayoutStore.getState();
    const crateId = store.placeObject(locationId, {
      assetId: 'crate_harvest_plastic_green_a01',
      label: 'Caja de Cosecha',
      xCm: 600,
      yCm: 600,
      widthCm: 60,
      depthCm: 40,
      heightCm: 25,
      elevationM: 0,
    });

    render(
      <Space3DViewer
        locationId={locationId}
        locationName="Nave de Almacén"
        locationType="warehouse"
        initialMode="design"
      />,
    );

    // Switch to 2D CAD view
    const btn2D = screen.getByRole('button', { name: /2D|Plano 2D/i });
    fireEvent.click(btn2D);

    const svgCrate = screen.getByTestId(`svg-object-${crateId}`);
    const svgPlane = screen.getByTestId('interactive-plane-1to1');

    // Find the pallet position
    const currentLayout = store.getOrCreateSpaceLayout(locationId);
    const pallet = currentLayout.placedObjects?.find((o) => o.assetId === 'pallet_standard_wood_a01')!;

    // 1. Start drag on crate
    fireEvent.pointerDown(svgCrate);

    // Mock SVG CTM transform so clientX/Y map 1:1 to cm coordinates in jsdom
    const svgElem = svgPlane as unknown as SVGSVGElement;
    svgElem.createSVGPoint = () =>
      ({
        x: 0,
        y: 0,
        matrixTransform(this: { x: number; y: number }) {
          return { x: this.x, y: this.y };
        },
      }) as unknown as DOMPoint;
    svgElem.getScreenCTM = () =>
      ({
        inverse: () => ({}),
      }) as unknown as DOMMatrix;

    // 2. Drag crate over the euro-pallet center
    fireEvent.pointerMove(svgPlane, { clientX: pallet.xCm, clientY: pallet.yCm });

    // Validation badge indicates auto-stacking on highest support surface (the existing crate on the pallet at +46 cm)
    const badge = screen.getByTestId('object-drag-validation-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain('Apilado sobre');
    expect(badge.textContent).toContain('+46 cm');

    // 3. Drop crate on top of the stack
    fireEvent.pointerUp(svgPlane);

    // Check store persisted the auto-stack elevation (0.461-0.462 m)
    const updatedCrate = store
      .getOrCreateSpaceLayout(locationId)
      .placedObjects?.find((o) => o.id === crateId)!;
    expect(updatedCrate.elevationM).toBeCloseTo(0.462, 2);
  });

  it('selects an object and updates its position and orientation via 3D cardinal gizmo commit', () => {
    render(
      <Space3DViewer
        locationId={locationId}
        locationName="Nave de Almacén"
        locationType="warehouse"
        initialMode="design"
      />,
    );

    // Switch to 2D to select object cleanly in DOM
    const btn2D = screen.getByRole('button', { name: /2D|Plano 2D/i });
    fireEvent.click(btn2D);

    const placedObjects = useSpaceLayoutStore.getState().getOrCreateSpaceLayout(locationId).placedObjects ?? [];
    const targetObj = placedObjects.find((o) => o.assetId === 'pallet_standard_wood_a01')!;
    const svgObject = screen.getByTestId(`svg-object-${targetObj.id}`);
    fireEvent.click(svgObject);

    // Verify SpaceObjectActionBar opens
    expect(screen.getByTestId('selected-object-action-bar')).toBeInTheDocument();

    // Verify gizmo calculation & direct store update with snap
    act(() => {
      useSpaceLayoutStore.getState().updateObject(locationId, targetObj.id, {
        xCm: 350,
        yCm: 280,
        rotationDeg: 45,
      });
    });

    const updated = useSpaceLayoutStore
      .getState()
      .getOrCreateSpaceLayout(locationId)
      .placedObjects?.find((o) => o.id === targetObj.id);

    expect(updated?.xCm).toBe(350);
    expect(updated?.yCm).toBe(280);
    expect(updated?.rotationDeg).toBe(45);
  });

  it('snaps object to wall with magnetic auto-orientation and updates badge to Pegado a Muro when dragging near wall', () => {
    render(
      <Space3DViewer
        locationId={locationId}
        locationName="Nave de Almacén"
        locationType="warehouse"
        initialMode="design"
      />,
    );

    // Switch to 2D CAD view
    const btn2D = screen.getByRole('button', { name: /2D|Plano 2D/i });
    fireEvent.click(btn2D);

    const placedObjects =
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout(locationId).placedObjects ?? [];
    const targetObj = placedObjects.find((o) => o.assetId === 'pallet_standard_wood_a01')!;
    const svgObject = screen.getByTestId(`svg-object-${targetObj.id}`);
    const svgPlane = screen.getByTestId('interactive-plane-1to1');

    // Mock SVG CTM transform
    const svgElem = svgPlane as unknown as SVGSVGElement;
    svgElem.createSVGPoint = () =>
      ({
        x: 0,
        y: 0,
        matrixTransform(this: { x: number; y: number }) {
          return { x: this.x, y: this.y };
        },
      }) as unknown as DOMPoint;
    svgElem.getScreenCTM = () =>
      ({
        inverse: () => ({}),
      }) as unknown as DOMMatrix;

    // 1. Start drag on object
    fireEvent.pointerDown(svgObject);

    // 2. Drag near south wall (e.g. y = 50 cm)
    fireEvent.pointerMove(svgPlane, { clientX: 400, clientY: 50 });

    // Badge reflects magnetic wall snap
    const badge = screen.getByTestId('object-drag-validation-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain('Pegado a Muro');

    // 3. Drop object flush against the wall
    fireEvent.pointerUp(svgPlane);

    // Verify store updated coordinates to snapped position (y = 7.5 + 80/2 + 0.5 = 48 cm)
    const updated = useSpaceLayoutStore
      .getState()
      .getOrCreateSpaceLayout(locationId)
      .placedObjects?.find((o) => o.id === targetObj.id);

    expect(updated?.yCm).toBe(48);
  });

  it('snaps object to wall magnetically when moving via 3D cardinal gizmo change and commits aligned coordinates', () => {
    render(
      <Space3DViewer
        locationId={locationId}
        locationName="Nave de Almacén"
        locationType="warehouse"
        initialMode="design"
      />,
    );

    // Switch to 2D view to inspect DOM elements
    const btn2D = screen.getByRole('button', { name: /2D|Plano 2D/i });
    fireEvent.click(btn2D);

    const placedObjects =
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout(locationId).placedObjects ?? [];
    const targetObj = placedObjects.find((o) => o.assetId === 'pallet_standard_wood_a01')!;
    const svgObject = screen.getByTestId(`svg-object-${targetObj.id}`);
    fireEvent.click(svgObject);

    expect(screen.getByTestId('selected-object-action-bar')).toBeInTheDocument();
  });
});
