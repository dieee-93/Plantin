import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpaceObjectActionBar } from '../SpaceObjectActionBar';
import type { PlacedObjectSpatialCm } from '@/store/spaceLayoutStore';

describe('SpaceObjectActionBar - Floating Contextual Popover for 3D Objects', () => {
  const mockObject: PlacedObjectSpatialCm = {
    id: 'obj-pallet-1',
    assetId: 'pallet_standard_wood_a01',
    label: 'Palet Europeo',
    category: 'logistics',
    xCm: 250,
    yCm: 180,
    elevationM: 0,
    rotationDeg: 0,
    widthCm: 120,
    depthCm: 80,
    heightCm: 21,
    modelUrl: '/models/pallet_standard_wood_a01.glb',
  };

  it('renders object label, category, coordinates, and metric dimensions', () => {
    render(
      <SpaceObjectActionBar
        object={mockObject}
        onClose={vi.fn()}
        onRotate={vi.fn()}
        onUpdateElevation={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByTestId('selected-object-action-bar')).toBeInTheDocument();
    expect(screen.getByText('Palet Europeo')).toBeInTheDocument();
    expect(screen.getByText(/logistics/i)).toBeInTheDocument();
    expect(screen.getByText(/120 × 80 × 21 cm/i)).toBeInTheDocument();
    expect(screen.getByText(/Coord: \(250, 180 cm\)/i)).toBeInTheDocument();
  });

  it('calls onRotate with updated angle (+90°) when clicking rotate button', () => {
    const handleRotate = vi.fn();
    render(
      <SpaceObjectActionBar
        object={{ ...mockObject, rotationDeg: 90 }}
        onClose={vi.fn()}
        onRotate={handleRotate}
        onUpdateElevation={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    const rotateBtn = screen.getByRole('button', { name: /Girar \+90°/i });
    fireEvent.click(rotateBtn);
    expect(handleRotate).toHaveBeenCalledWith(180);
  });

  it('calls onUpdateElevation when clicking elevation preset pills and step buttons', () => {
    const handleElevation = vi.fn();
    render(
      <SpaceObjectActionBar
        object={mockObject}
        onClose={vi.fn()}
        onRotate={vi.fn()}
        onUpdateElevation={handleElevation}
        onRemove={vi.fn()}
      />,
    );

    // Click "Palet (21 cm)" preset pill
    const palletPreset = screen.getByRole('button', { name: /Palet 21 cm/i });
    fireEvent.click(palletPreset);
    expect(handleElevation).toHaveBeenCalledWith(0.21);

    // Click "+5 cm" stepper
    const stepUpBtn = screen.getByRole('button', { name: /\+5 cm/i });
    fireEvent.click(stepUpBtn);
    expect(handleElevation).toHaveBeenCalledWith(0.05);
  });

  it('calls onRemove when clicking delete button', () => {
    const handleRemove = vi.fn();
    render(
      <SpaceObjectActionBar
        object={mockObject}
        onClose={vi.fn()}
        onRotate={vi.fn()}
        onUpdateElevation={vi.fn()}
        onRemove={handleRemove}
      />,
    );

    const deleteBtn = screen.getByRole('button', { name: /Eliminar objeto/i });
    fireEvent.click(deleteBtn);
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  it('calls onDuplicate when clicking duplicate button', () => {
    const handleDuplicate = vi.fn();
    render(
      <SpaceObjectActionBar
        object={mockObject}
        onClose={vi.fn()}
        onRotate={vi.fn()}
        onUpdateElevation={vi.fn()}
        onRemove={vi.fn()}
        onDuplicate={handleDuplicate}
      />,
    );

    const duplicateBtn = screen.getByRole('button', { name: /Duplicar/i });
    fireEvent.click(duplicateBtn);
    expect(handleDuplicate).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking close button', () => {
    const handleClose = vi.fn();
    render(
      <SpaceObjectActionBar
        object={mockObject}
        onClose={handleClose}
        onRotate={vi.fn()}
        onUpdateElevation={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    const closeBtn = screen.getByRole('button', { name: /Cerrar popover/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
