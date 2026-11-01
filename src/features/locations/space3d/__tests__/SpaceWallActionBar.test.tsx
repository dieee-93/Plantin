import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpaceWallActionBar } from '../SpaceWallActionBar';
import type { WallSegmentCm } from '@/domain/spaceGeometry';

describe('SpaceWallActionBar - Contextual Popover for Wall Segments', () => {
  const sampleWall: WallSegmentCm = {
    id: 'wall-test-1',
    start: { x: 0, y: 0 },
    end: { x: 500, y: 0 },
    heightCm: 200,
    thicknessCm: 15,
    material: 'brick',
    openings: [],
  };

  it('renders wall details, length in meters, height slider and swatches', () => {
    const onUpdateHeight = vi.fn();
    const onUpdateMaterial = vi.fn();
    const onClose = vi.fn();
    const onApplyToAll = vi.fn();

    render(
      <SpaceWallActionBar
        wall={sampleWall}
        onClose={onClose}
        onUpdateHeight={onUpdateHeight}
        onUpdateMaterial={onUpdateMaterial}
        onApplyToAllWalls={onApplyToAll}
      />,
    );

    expect(screen.getByText('Pared / Cerramiento')).toBeInTheDocument();
    expect(screen.getByText('5.00 m')).toBeInTheDocument();

    // Click on 120 cm preset
    fireEvent.click(screen.getByRole('button', { name: '120 cm (Cerco)' }));
    expect(onUpdateHeight).toHaveBeenCalledWith(120);

    // Height slider
    const heightSlider = screen.getByLabelText('Altura de pared');
    fireEvent.change(heightSlider, { target: { value: '250' } });
    expect(onUpdateHeight).toHaveBeenCalledWith(250);

    // Change material via visual swatch button
    fireEvent.click(screen.getByRole('button', { name: 'Material Madera' }));
    expect(onUpdateMaterial).toHaveBeenCalledWith('wood_fence');

    // Click apply to all
    fireEvent.click(screen.getByRole('button', { name: /Aplicar a todo el perímetro/i }));
    expect(onApplyToAll).toHaveBeenCalledTimes(1);

    // Click close
    fireEvent.click(screen.getByLabelText('Cerrar inspector de pared'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('supports adding doors, adding windows, and repositioning openings via track slider', () => {
    const onAddDoor = vi.fn();
    const onAddWindow = vi.fn();
    const onRemoveOpening = vi.fn();
    const onUpdateOpening = vi.fn();

    const wallWithOpenings: WallSegmentCm = {
      ...sampleWall,
      openings: [
        {
          id: 'door-1',
          kind: 'door',
          offsetCm: 100,
          widthCm: 90,
          heightCm: 210,
          sillHeightCm: 0,
        },
      ],
    };

    render(
      <SpaceWallActionBar
        wall={wallWithOpenings}
        onClose={vi.fn()}
        onUpdateHeight={vi.fn()}
        onUpdateMaterial={vi.fn()}
        onAddDoor={onAddDoor}
        onAddWindow={onAddWindow}
        onRemoveOpening={onRemoveOpening}
        onUpdateOpening={onUpdateOpening}
      />,
    );

    // Shows 1 abertura
    expect(screen.getByText('1 abertura')).toBeInTheDocument();
    expect(screen.getByText(/Puerta #1 \(90×210 cm\)/i)).toBeInTheDocument();

    // Click + Puerta
    fireEvent.click(screen.getByRole('button', { name: /\+ Puerta \(90 cm\)/i }));
    expect(onAddDoor).toHaveBeenCalledTimes(1);

    // Click + Ventana
    fireEvent.click(screen.getByRole('button', { name: /\+ Ventana \(120 cm\)/i }));
    expect(onAddWindow).toHaveBeenCalledTimes(1);

    // Reposition opening via track slider
    const trackSlider = screen.getByLabelText('Posición de puerta 1');
    fireEvent.change(trackSlider, { target: { value: '180' } });
    expect(onUpdateOpening).toHaveBeenCalledWith('door-1', { offsetCm: 180 });

    // Click delete opening
    fireEvent.click(screen.getByLabelText('Eliminar puerta 1'));
    expect(onRemoveOpening).toHaveBeenCalledWith('door-1');
  });

  it('disables opening buttons when available wall interval cannot fit opening', () => {
    const crowdedWall: WallSegmentCm = {
      ...sampleWall,
      end: { x: 180, y: 0 }, // 180 cm total
      openings: [
        {
          id: 'door-crowded',
          kind: 'door',
          offsetCm: 15,
          widthCm: 90,
          heightCm: 210,
          sillHeightCm: 0,
        },
      ],
    };

    render(
      <SpaceWallActionBar
        wall={crowdedWall}
        onClose={vi.fn()}
        onUpdateHeight={vi.fn()}
        onUpdateMaterial={vi.fn()}
        onAddDoor={vi.fn()}
        onAddWindow={vi.fn()}
      />,
    );

    const addDoorBtn = screen.getByRole('button', { name: /\+ Puerta \(90 cm\)/i });
    const addWindowBtn = screen.getByRole('button', { name: /\+ Ventana \(120 cm\)/i });
    expect(addDoorBtn).toBeDisabled();
    expect(addWindowBtn).toBeDisabled();
    expect(addDoorBtn).toHaveAttribute('title', expect.stringContaining('No hay espacio continuo'));
  });
});
