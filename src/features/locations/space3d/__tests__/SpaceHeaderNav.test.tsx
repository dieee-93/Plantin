import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpaceHeaderNav } from '../SpaceHeaderNav';

describe('SpaceHeaderNav - Top-Left Floating Navigation & Room Dimension Pill', () => {
  it('renders location name, plant count badge, and room dimension pill', () => {
    render(
      <SpaceHeaderNav
        locationName="Invernadero Principal"
        plantCount={8}
        capacity={20}
        widthM={10}
        depthM={6}
        onBackToCampus={vi.fn()}
        onApplyDimensions={vi.fn()}
      />,
    );

    expect(screen.getByText('Invernadero Principal')).toBeInTheDocument();
    expect(screen.getByText(/8\s*\/\s*20\s*plantas/i)).toBeInTheDocument();
    expect(screen.getByText(/10(\.0)?\s*×\s*6(\.0)?\s*m/i)).toBeInTheDocument();
  });

  it('calls onBackToCampus when back button is clicked', () => {
    const onBack = vi.fn();
    render(
      <SpaceHeaderNav
        locationName="Patio Norte"
        plantCount={3}
        widthM={8}
        depthM={5}
        onBackToCampus={onBack}
        onApplyDimensions={vi.fn()}
      />,
    );

    const backBtn = screen.getByRole('button', { name: /Volver al mapa|←/i });
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('opens popover to adjust width and depth in meters and calls onApplyDimensions', () => {
    const onApply = vi.fn();
    render(
      <SpaceHeaderNav
        locationName="Patio Norte"
        plantCount={3}
        widthM={8}
        depthM={5}
        onBackToCampus={vi.fn()}
        onApplyDimensions={onApply}
      />,
    );

    // Click dimensions pill to open popover
    const dimBtn = screen.getByRole('button', { name: /📐|8(\.0)?\s*×\s*5(\.0)?\s*m/i });
    fireEvent.click(dimBtn);

    // Inputs inside popover
    const widthInput = screen.getByLabelText(/Ancho Terreno \(m\)/i);
    const depthInput = screen.getByLabelText(/Largo Terreno \(m\)/i);
    fireEvent.change(widthInput, { target: { value: '12' } });
    fireEvent.change(depthInput, { target: { value: '7' } });

    fireEvent.click(screen.getByRole('button', { name: /Aplicar Dimensiones/i }));
    expect(onApply).toHaveBeenCalledWith(12, 7);
  });
});
