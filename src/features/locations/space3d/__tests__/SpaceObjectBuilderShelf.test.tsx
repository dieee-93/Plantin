import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpaceObjectBuilderShelf } from '../SpaceObjectBuilderShelf';

describe('SpaceObjectBuilderShelf - 3D Logistics & Facility Shelf', () => {
  it('renders all facility catalog cards and selection controls', () => {
    const onSelectAssetId = vi.fn();
    const onChangeRotationDeg = vi.fn();
    const onChangeElevationM = vi.fn();
    const onClose = vi.fn();

    render(
      <SpaceObjectBuilderShelf
        selectedAssetId="pallet_standard_wood_a01"
        onSelectAssetId={onSelectAssetId}
        rotationDeg={0}
        onChangeRotationDeg={onChangeRotationDeg}
        elevationM={0}
        onChangeElevationM={onChangeElevationM}
        onClose={onClose}
      />,
    );

    expect(screen.getByText(/Equipamiento & Logística/i)).toBeInTheDocument();

    // Check search functionality
    const searchInput = screen.getByPlaceholderText(/Buscar entre 999 modelos/i);
    fireEvent.change(searchInput, { target: { value: 'Extension Bar' } });

    // Select the filtered item
    const extensionBarBtn = screen.getByRole('button', { name: /Extension Bar/i });
    fireEvent.click(extensionBarBtn);
    expect(onSelectAssetId).toHaveBeenCalledWith('handTool_extension_bar_a01');

    // Change rotation chip (e.g. 90°)
    const chip90 = screen.getByText('90°');
    fireEvent.click(chip90);
    expect(onChangeRotationDeg).toHaveBeenCalledWith(90);

    // Change elevation chip (e.g. Sobre Palet)
    const chipPalet = screen.getByText('Sobre Palet (21 cm)');
    fireEvent.click(chipPalet);
    expect(onChangeElevationM).toHaveBeenCalledWith(0.209);
  });
});
