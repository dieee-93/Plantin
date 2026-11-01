import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpaceWallBuilderShelf } from '../SpaceWallBuilderShelf';

describe('SpaceWallBuilderShelf - Visual Perimeter Enclosure Builder Shelf', () => {
  it('renders 4 visual archetype cards with titles and badges', () => {
    const onApplyPerimeter = vi.fn();
    render(
      <SpaceWallBuilderShelf
        currentHeightCm={200}
        currentMaterial="brick"
        onApplyPerimeter={onApplyPerimeter}
      />,
    );

    expect(screen.getByText('Cerramientos & Muros')).toBeInTheDocument();
    expect(screen.getByText('Cantero Abierto')).toBeInTheDocument();
    expect(screen.getByText('Cerco de Huerta')).toBeInTheDocument();
    expect(screen.getByText('Medianera Urbana')).toBeInTheDocument();
    expect(screen.getByText('Pared Galpón')).toBeInTheDocument();

    // Selecting Cerco de Huerta applies 120 cm and wood_fence
    fireEvent.click(screen.getByText('Cerco de Huerta'));
    expect(onApplyPerimeter).toHaveBeenCalledWith(120, 'wood_fence');

    // Selecting Cantero Abierto applies 0 cm
    fireEvent.click(screen.getByText('Cantero Abierto'));
    expect(onApplyPerimeter).toHaveBeenCalledWith(0, 'wood_fence');
  });

  it('allows picking perimeter material and clicking apply to all', () => {
    const onApplyPerimeter = vi.fn();
    render(
      <SpaceWallBuilderShelf
        currentHeightCm={200}
        currentMaterial="brick"
        onApplyPerimeter={onApplyPerimeter}
      />,
    );

    // Pick Concrete material
    fireEvent.click(screen.getByRole('button', { name: /Hormigón/i }));
    expect(onApplyPerimeter).toHaveBeenCalledWith(200, 'concrete');

    // Click Apply to All button
    fireEvent.click(screen.getByRole('button', { name: /Perímetro/i }));
    expect(onApplyPerimeter).toHaveBeenCalledWith(200, 'concrete');
  });

  it('handles close button', () => {
    const onClose = vi.fn();
    render(
      <SpaceWallBuilderShelf
        currentHeightCm={200}
        currentMaterial="brick"
        onApplyPerimeter={vi.fn()}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByLabelText('Cerrar panel de muros'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
