import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { render } from '@testing-library/react';
import { SpaceObjectGizmo } from '../SpaceObjectGizmo';
import type { PlacedObjectSpatialCm } from '@/store/spaceLayoutStore';

// Mock PivotControls for React Testing Library DOM rendering if needed or inspect props
vi.mock('@react-three/drei', () => ({
  PivotControls: ({ children, activeAxes, fixed, depthTest, disableRotations, onDragStart, onDrag, onDragEnd }: any) => (
    <div
      data-testid="mock-pivot-controls"
      data-active-axes={JSON.stringify(activeAxes)}
      data-fixed={String(fixed)}
      data-depth-test={String(depthTest)}
      data-disable-rotations={String(disableRotations)}
      onClick={() => {
        onDragStart?.();
        const dummyMatrix = new THREE.Matrix4().makeTranslation(1, 0, 0);
        onDrag?.(dummyMatrix, dummyMatrix, dummyMatrix, dummyMatrix);
        onDragEnd?.();
      }}
    >
      {children}
    </div>
  ),
}));

describe('SpaceObjectGizmo - Declarative 3D Manipulator Wrapper', () => {
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

  it('renders only children when isSelected is false', () => {
    const { queryByTestId, getByText } = render(
      <SpaceObjectGizmo
        object={mockObject}
        centerCm={centerCm}
        isSelected={false}
      >
        <span data-testid="child-content">Contenido 3D</span>
      </SpaceObjectGizmo>,
    );

    expect(queryByTestId('mock-pivot-controls')).toBeNull();
    expect(getByText('Contenido 3D')).toBeInTheDocument();
  });

  it('wraps children with PivotControls configured for cardinal axes (XZ only) when isSelected is true', () => {
    const { getByTestId } = render(
      <SpaceObjectGizmo
        object={mockObject}
        centerCm={centerCm}
        isSelected={true}
      >
        <span data-testid="child-content">Contenido 3D</span>
      </SpaceObjectGizmo>,
    );

    const gizmo = getByTestId('mock-pivot-controls');
    expect(gizmo).toBeInTheDocument();
    expect(gizmo.getAttribute('data-active-axes')).toBe(JSON.stringify([true, false, true]));
    expect(gizmo.getAttribute('data-fixed')).toBe('true');
    expect(gizmo.getAttribute('data-depth-test')).toBe('false');
    expect(gizmo.getAttribute('data-disable-rotations')).toBe('true');
  });

  it('invokes onTransformChange and onTransformCommit when dragging occurs', () => {
    const onTransformChange = vi.fn();
    const onTransformCommit = vi.fn();

    const { getByTestId } = render(
      <SpaceObjectGizmo
        object={mockObject}
        centerCm={centerCm}
        isSelected={true}
        onTransformChange={onTransformChange}
        onTransformCommit={onTransformCommit}
      >
        <span>Contenido 3D</span>
      </SpaceObjectGizmo>,
    );

    const gizmo = getByTestId('mock-pivot-controls');
    gizmo.click();

    expect(onTransformChange).toHaveBeenCalledTimes(1);
    expect(onTransformCommit).toHaveBeenCalledTimes(1);
    expect(onTransformCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        xCm: expect.any(Number),
        yCm: expect.any(Number),
        elevationM: 0.21,
      }),
    );
  });

  it('propagates Shift key state to onTransformChange to enable free precision placement', () => {
    const onTransformChange = vi.fn();
    const onTransformCommit = vi.fn();

    const { getByTestId } = render(
      <SpaceObjectGizmo
        object={mockObject}
        centerCm={centerCm}
        isSelected={true}
        onTransformChange={onTransformChange}
        onTransformCommit={onTransformCommit}
      >
        <span>Contenido 3D</span>
      </SpaceObjectGizmo>,
    );

    // Press Shift before/during interaction
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }));

    const gizmo = getByTestId('mock-pivot-controls');
    gizmo.click();

    expect(onTransformChange).toHaveBeenCalledWith(
      expect.objectContaining({
        isShiftKey: true,
      }),
    );
    expect(onTransformCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        isShiftKey: true,
      }),
    );

    // Release Shift
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Shift' }));
  });
});
