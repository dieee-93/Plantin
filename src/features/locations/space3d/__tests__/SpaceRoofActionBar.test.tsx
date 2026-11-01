import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpaceRoofActionBar } from '../SpaceRoofActionBar';
import type { SpaceRoofConfig } from '@/store/spaceLayoutStore';

describe('SpaceRoofActionBar - Builder Visual Shelf for Roofs & Architecture', () => {
  const greenhouseConfig: SpaceRoofConfig = {
    kind: 'gabled_greenhouse',
    heightCm: 140,
    material: 'polycarbonate',
    hasGrowLights: true,
  };

  it('renders 4 visual silhouette cards with titles and badges', () => {
    const onSelectRoofKind = vi.fn();
    render(
      <SpaceRoofActionBar
        roofConfig={greenhouseConfig}
        showRoof={true}
        onToggleShowRoof={vi.fn()}
        onSelectRoofKind={onSelectRoofKind}
        onUpdateRoofHeight={vi.fn()}
        onUpdateRoofMaterial={vi.fn()}
      />,
    );

    expect(screen.getByText('Cubiertas & Techos')).toBeInTheDocument();
    expect(screen.getByText('Invernadero Dos Aguas')).toBeInTheDocument();
    expect(screen.getByText('Pérgola Media-Sombra')).toBeInTheDocument();
    expect(screen.getByText('Losa Indoor Cerrada')).toBeInTheDocument();
    expect(screen.getByText('Cielo Abierto')).toBeInTheDocument();

    // Selecting pergola card triggers callback
    fireEvent.click(screen.getByText('Pérgola Media-Sombra'));
    expect(onSelectRoofKind).toHaveBeenCalledWith('shade_cloth');

    // Selecting open sky triggers callback
    fireEvent.click(screen.getByText('Cielo Abierto'));
    expect(onSelectRoofKind).toHaveBeenCalledWith('none');
  });

  it('controls ridge height slider and preset pills in greenhouse mode', () => {
    const onUpdateRoofHeight = vi.fn();
    render(
      <SpaceRoofActionBar
        roofConfig={greenhouseConfig}
        showRoof={true}
        onToggleShowRoof={vi.fn()}
        onSelectRoofKind={vi.fn()}
        onUpdateRoofHeight={onUpdateRoofHeight}
        onUpdateRoofMaterial={vi.fn()}
      />,
    );

    // Height presets
    fireEvent.click(screen.getByRole('button', { name: '1.8m' }));
    expect(onUpdateRoofHeight).toHaveBeenCalledWith(180);

    // Slider range
    const slider = screen.getByLabelText('Altura de cumbrera');
    fireEvent.change(slider, { target: { value: '200' } });
    expect(onUpdateRoofHeight).toHaveBeenCalledWith(200);
  });

  it('allows switching cover material and toggling grow lights', () => {
    const onUpdateRoofMaterial = vi.fn();
    const onToggleGrowLights = vi.fn();

    render(
      <SpaceRoofActionBar
        roofConfig={greenhouseConfig}
        showRoof={true}
        onToggleShowRoof={vi.fn()}
        onSelectRoofKind={vi.fn()}
        onUpdateRoofHeight={vi.fn()}
        onUpdateRoofMaterial={onUpdateRoofMaterial}
        onToggleGrowLights={onToggleGrowLights}
      />,
    );

    // Click Glass swatch
    fireEvent.click(screen.getByRole('button', { name: /Vidrio Templado/i }));
    expect(onUpdateRoofMaterial).toHaveBeenCalledWith('glass');

    // Toggle grow lights
    fireEvent.click(screen.getByRole('button', { name: /Luces LED: ON/i }));
    expect(onToggleGrowLights).toHaveBeenCalledWith(false);
  });

  it('handles visibility eye toggle and close button', () => {
    const onToggleShowRoof = vi.fn();
    const onClose = vi.fn();

    render(
      <SpaceRoofActionBar
        roofConfig={greenhouseConfig}
        showRoof={true}
        onToggleShowRoof={onToggleShowRoof}
        onSelectRoofKind={vi.fn()}
        onUpdateRoofHeight={vi.fn()}
        onUpdateRoofMaterial={vi.fn()}
        onClose={onClose}
      />,
    );

    const eyeButton = screen.getByTitle('Ocultar temporalmente para ver plantas');
    fireEvent.click(eyeButton);
    expect(onToggleShowRoof).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByLabelText('Cerrar panel de techos');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders pergola-specific controls when roofConfig is shade_cloth', () => {
    const pergolaConfig: SpaceRoofConfig = {
      kind: 'shade_cloth',
      heightCm: 220,
      material: 'shade_mesh',
    };
    const onUpdateRoofMaterial = vi.fn();
    const onUpdateRoofHeight = vi.fn();

    render(
      <SpaceRoofActionBar
        roofConfig={pergolaConfig}
        showRoof={true}
        onToggleShowRoof={vi.fn()}
        onSelectRoofKind={vi.fn()}
        onUpdateRoofHeight={onUpdateRoofHeight}
        onUpdateRoofMaterial={onUpdateRoofMaterial}
      />,
    );

    expect(screen.getByText(/Altura de postes de madera/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '2.4m' }));
    expect(onUpdateRoofHeight).toHaveBeenCalledWith(240);
  });
});
