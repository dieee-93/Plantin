import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpaceBottomDock } from '../SpaceBottomDock';

describe('SpaceBottomDock - Bottom Tray Drawer for Seeds & Seedlings / Plants', () => {
  const mockSeedLots = [
    {
      id: 'lot-1',
      lotCode: 'TOM-2026-L1',
      cropName: 'Tomate Platense',
      currentCount: 45,
      germinationRate: 92,
    },
  ];

  const mockPlants = [
    {
      id: 'ind-1',
      label: 'Albahaca Genovesa #01',
      cropName: 'Albahaca',
      bbchStage: 12,
      isPlaced: false,
    },
  ];

  it('renders tabs (Semillas, Plantas) and handles seed selection and plant placement', () => {
    const onSelectSeed = vi.fn();
    const onSelectPlant = vi.fn();
    const onClose = vi.fn();

    render(
      <SpaceBottomDock
        isOpen={true}
        onClose={onClose}
        seedLots={mockSeedLots}
        availablePlants={mockPlants}
        onSelectSeedLotToSow={onSelectSeed}
        onSelectPlantToPlace={onSelectPlant}
      />,
    );

    expect(screen.getByRole('button', { name: /Semillas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Plantas/i })).toBeInTheDocument();

    // In seeds tab
    expect(screen.getByText('TOM-2026-L1')).toBeInTheDocument();
    expect(screen.getByText(/45\s*semillas/i)).toBeInTheDocument();
    const sowSeedBtn = screen.getByRole('button', { name: /Sembrar lote|Sembrar/i });
    fireEvent.click(sowSeedBtn);
    expect(onSelectSeed).toHaveBeenCalledWith('lot-1');

    // Switch to plants tab
    fireEvent.click(screen.getByRole('button', { name: /Plantas/i }));
    expect(screen.getByText('Albahaca Genovesa #01')).toBeInTheDocument();
    const placePlantBtn = screen.getByRole('button', { name: /Ubicar|Plantar/i });
    fireEvent.click(placePlantBtn);
    expect(onSelectPlant).toHaveBeenCalledWith('ind-1');

    // Close button
    fireEvent.click(screen.getByRole('button', { name: /Cerrar bandeja|✕/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
