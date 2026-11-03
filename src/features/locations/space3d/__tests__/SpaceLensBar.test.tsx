import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SPACE_PRESETS } from '@/store/spaceLayoutStore';
import { SpaceLensBar } from '../SpaceLensBar';

describe('SpaceLensBar - Top-Right Glassmorphism Quick Pills & Floating Analytical / Solar Panels', () => {
  const layout = SPACE_PRESETS.patio_croquis.createLayout('loc-lens-1');

  it('renders quick pills (Nombres, Luz, Lentes) and toggles name tags', () => {
    const onToggleLabels = vi.fn();
    render(
      <SpaceLensBar
        layout={layout}
        showLabels={false}
        onToggleShowLabels={onToggleLabels}
        activeLens={null}
        onSelectLens={vi.fn()}
        speciesFilter={null}
        onSelectSpeciesFilter={vi.fn()}
        onUpdateSolar={vi.fn()}
        onApplyPreset={vi.fn()}
      />,
    );

    const nombresBtn = screen.getByRole('button', { name: /Nombres/i });
    expect(nombresBtn).toBeInTheDocument();
    fireEvent.click(nombresBtn);
    expect(onToggleLabels).toHaveBeenCalled();
  });

  it('opens and toggles analytical lenses (Especies, Fenología BBCH, Genética, Confort Climático) and filters by species', () => {
    const onSelectLens = vi.fn();
    const onSelectSpeciesFilter = vi.fn();

    render(
      <SpaceLensBar
        layout={layout}
        showLabels={true}
        onToggleShowLabels={vi.fn()}
        activeLens="species"
        onSelectLens={onSelectLens}
        speciesFilter={null}
        onSelectSpeciesFilter={onSelectSpeciesFilter}
        availableSpecies={[
          { code: 'tomato', label: 'Tomate' },
          { code: 'pepper', label: 'Morrón' },
        ]}
        onUpdateSolar={vi.fn()}
        onApplyPreset={vi.fn()}
      />,
    );

    // Open lenses panel
    const lensesToggle = screen.getByRole('button', { name: /Lentes/i });
    fireEvent.click(lensesToggle);

    // Lenses buttons
    expect(screen.getByRole('button', { name: /Especies/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fenología BBCH/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Genética|Pedigrí/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confort Climático/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Fenología BBCH/i }));
    expect(onSelectLens).toHaveBeenCalledWith('phenology');

    // Species filter chips
    expect(screen.getByText(/FILTRAR ESPECIE:/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tomate' }));
    expect(onSelectSpeciesFilter).toHaveBeenCalledWith('tomato');
  });

  it('opens solar simulator panel and displays elevation, shadow, and 1:1 metrics', () => {
    const onUpdateSolar = vi.fn();
    render(
      <SpaceLensBar
        layout={layout}
        showLabels={true}
        onToggleShowLabels={vi.fn()}
        activeLens={null}
        onSelectLens={vi.fn()}
        speciesFilter={null}
        onSelectSpeciesFilter={vi.fn()}
        onUpdateSolar={onUpdateSolar}
        onApplyPreset={vi.fn()}
      />,
    );

    // Toggle solar simulator
    const solarToggle = screen.getByRole('button', { name: /Luz/i });
    fireEvent.click(solarToggle);

    expect(screen.getByText(/Simulador Solar en Vivo/i)).toBeInTheDocument();
    expect(screen.getByTestId('metric-cultivable-area')).toBeInTheDocument();
    expect(screen.getByTestId('metric-walkable-area')).toBeInTheDocument();

    // Adjust hour slider
    const slider = screen.getByLabelText(/Hora Solar/i);
    fireEvent.change(slider, { target: { value: '15' } });
    expect(onUpdateSolar).toHaveBeenCalledWith({ hourOfDay: 15 });
  });

  it('renders roof toggle pill when space has roof config and calls onToggleShowRoof', () => {
    const onToggleShowRoof = vi.fn();
    const greenhouseLayout = SPACE_PRESETS.greenhouse_1to1.createLayout('loc-gh-1');

    const { rerender } = render(
      <SpaceLensBar
        layout={greenhouseLayout}
        showLabels={true}
        onToggleShowLabels={vi.fn()}
        showRoof={true}
        onToggleShowRoof={onToggleShowRoof}
        hasRoof={true}
        activeLens={null}
        onSelectLens={vi.fn()}
        speciesFilter={null}
        onSelectSpeciesFilter={vi.fn()}
        onUpdateSolar={vi.fn()}
        onApplyPreset={vi.fn()}
      />,
    );

    const roofBtn = screen.getByTestId('toggle-roof-btn');
    expect(roofBtn).toBeInTheDocument();
    expect(roofBtn).toHaveTextContent('Techo');
    fireEvent.click(roofBtn);
    expect(onToggleShowRoof).toHaveBeenCalledTimes(1);

    // If hasRoof is false, toggle button is hidden
    rerender(
      <SpaceLensBar
        layout={greenhouseLayout}
        showLabels={true}
        onToggleShowLabels={vi.fn()}
        showRoof={true}
        onToggleShowRoof={onToggleShowRoof}
        hasRoof={false}
        activeLens={null}
        onSelectLens={vi.fn()}
        speciesFilter={null}
        onSelectSpeciesFilter={vi.fn()}
        onUpdateSolar={vi.fn()}
        onApplyPreset={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('toggle-roof-btn')).not.toBeInTheDocument();
  });

  it('limits plant neighbor list to 30 items and shows count indicator when layout has > 30 plants', () => {
    const manyPlantsLayout = {
      ...layout,
      placedPlants: Array.from({ length: 45 }, (_, i) => ({
        id: `plant-${i}`,
        xCm: i * 20,
        yCm: 100,
        canopyRadiusCm: 15,
        label: `Planta ${i}`,
        cropCode: 'tomato',
      })),
    };

    render(
      <SpaceLensBar
        layout={manyPlantsLayout}
        showLabels={true}
        onToggleShowLabels={vi.fn()}
        activeLens={null}
        onSelectLens={vi.fn()}
        speciesFilter={null}
        onSelectSpeciesFilter={vi.fn()}
        onUpdateSolar={vi.fn()}
        onApplyPreset={vi.fn()}
        defaultSolarOpen={true}
      />,
    );

    expect(screen.getByText(/Mostrando 30 de 45 plantas/i)).toBeInTheDocument();
    // Verify first plant and nearest neighbor distance
    expect(screen.getByText(/Planta 0 ↔ Planta 1: 20 cm/i)).toBeInTheDocument();
  });

  it('renders distances panel collapsed by default with conflict badge and expands on toggle', () => {
    const crowdedLayout = {
      ...layout,
      placedPlants: [
        { id: 'p1', xCm: 100, yCm: 100, canopyRadiusCm: 30, label: 'Tomatera 1', cropCode: 'tomato' },
        { id: 'p2', xCm: 130, yCm: 100, canopyRadiusCm: 30, label: 'Tomatera 2', cropCode: 'tomato' }, // 30cm < 60cm -> crowded!
      ],
    };

    render(
      <SpaceLensBar
        layout={crowdedLayout}
        showLabels={true}
        onToggleShowLabels={vi.fn()}
        activeLens={null}
        onSelectLens={vi.fn()}
        speciesFilter={null}
        onSelectSpeciesFilter={vi.fn()}
        onUpdateSolar={vi.fn()}
        onApplyPreset={vi.fn()}
        defaultSolarOpen={true}
        defaultDistancesOpen={false}
      />,
    );

    // Conflict counter badge is visible when collapsed
    expect(screen.getByText(/⚠️ 2 conflictos/i)).toBeInTheDocument();
    // List is not in document
    expect(screen.queryByText(/Tomatera 1 ↔ Tomatera 2/i)).not.toBeInTheDocument();

    // Toggle button to expand
    const toggleBtn = screen.getByRole('button', { name: /Alternar lista de distancias entre plantas/i });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggleBtn);

    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Tomatera 1 ↔ Tomatera 2: 30 cm/i)).toBeInTheDocument();
  });

  it('automatically closes solar simulator when hasSelectedPlant becomes true', () => {
    const { rerender } = render(
      <SpaceLensBar
        layout={layout}
        showLabels={true}
        onToggleShowLabels={vi.fn()}
        activeLens={null}
        onSelectLens={vi.fn()}
        speciesFilter={null}
        onSelectSpeciesFilter={vi.fn()}
        onUpdateSolar={vi.fn()}
        onApplyPreset={vi.fn()}
        defaultSolarOpen={true}
        hasSelectedPlant={false}
      />,
    );

    expect(screen.getByText(/Simulador Solar en Vivo/i)).toBeInTheDocument();

    // Rerender with plant selected
    rerender(
      <SpaceLensBar
        layout={layout}
        showLabels={true}
        onToggleShowLabels={vi.fn()}
        activeLens={null}
        onSelectLens={vi.fn()}
        speciesFilter={null}
        onSelectSpeciesFilter={vi.fn()}
        onUpdateSolar={vi.fn()}
        onApplyPreset={vi.fn()}
        defaultSolarOpen={true}
        hasSelectedPlant={true}
      />,
    );

    expect(screen.queryByText(/Simulador Solar en Vivo/i)).not.toBeInTheDocument();
  });
});
