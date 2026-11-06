import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpacePlantActionBar } from '../SpacePlantActionBar';

describe('SpacePlantActionBar - Floating Contextual Popover for Selected Plant', () => {
  const mockPlant = {
    id: 'plant-tomatera-1',
    label: 'Tomatera #01',
    cropCode: 'tomato',
    xCm: 250,
    yCm: 180,
    canopyRadiusCm: 25,
  };

  const mockNeighbors = [
    {
      neighborId: 'plant-pepper-1',
      neighborLabel: 'Morrón',
      distanceCm: 45,
      clearanceCm: -5,
      isCrowded: true,
    },
    {
      neighborId: 'plant-lettuce-1',
      neighborLabel: 'Lechuga',
      distanceCm: 120,
      clearanceCm: 70,
      isCrowded: false,
    },
  ];

  it('renders plant label, BBCH stage badge, neighbor distances with overlap warning, and action buttons', () => {
    const onClose = vi.fn();
    const onInspect = vi.fn();
    const onAdvanceBBCH = vi.fn();
    const onMove = vi.fn();
    const onTakeCutting = vi.fn();
    const onRemove = vi.fn();

    render(
      <SpacePlantActionBar
        plant={mockPlant}
        bbchStage={65}
        neighbors={mockNeighbors}
        onClose={onClose}
        onInspectDetails={onInspect}
        onAdvanceBBCH={onAdvanceBBCH}
        onMovePlant={onMove}
        onTakeCutting={onTakeCutting}
        onRemovePlant={onRemove}
      />,
    );

    const inspector = screen.getByTestId('selected-plant-inspector');
    expect(inspector).toBeInTheDocument();
    expect(inspector.className).toContain('rounded-2xl');
    expect(inspector.className).toContain('border-slate-200/90');
    expect(inspector.className).toContain('bg-white/95');
    expect(inspector.className).toContain('text-slate-900');
    expect(screen.getByText(/Tomatera #01/i)).toBeInTheDocument();
    expect(screen.getByText(/BBCH\s*65/i)).toBeInTheDocument();

    // Neighbor distances
    expect(screen.getByText(/Distancia a Morrón:\s*45\s*cm/i)).toBeInTheDocument();
    expect(screen.getByText(/Distancia a Lechuga:\s*120\s*cm/i)).toBeInTheDocument();

    // Action buttons
    fireEvent.click(screen.getByRole('button', { name: /Detalles/i }));
    expect(onInspect).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /\+Etapa/i }));
    expect(onAdvanceBBCH).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Mover/i }));
    expect(onMove).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Esqueje/i }));
    expect(onTakeCutting).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Eliminar/i }));
    expect(onRemove).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Cerrar popover|✕/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
