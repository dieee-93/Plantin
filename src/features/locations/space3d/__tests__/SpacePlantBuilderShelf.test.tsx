import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpacePlantBuilderShelf } from '../SpacePlantBuilderShelf';

describe('SpacePlantBuilderShelf - Visual Sowing, Crops & Botanical Builder Shelf', () => {
  it('renders 5 botanical crop cards with titles, agronomic badges and recommended spacing', () => {
    const onChangePlantCropCode = vi.fn();
    const onChangePlantSpacing = vi.fn();

    render(
      <SpacePlantBuilderShelf
        activeTool="plant_single"
        plantCropCode="tomato"
        onChangePlantCropCode={onChangePlantCropCode}
        plantSpacingCm={50}
        onChangePlantSpacing={onChangePlantSpacing}
        cultivableSectorCount={2}
        onFillSector={vi.fn()}
      />,
    );

    expect(screen.getByText('Siembra & Cultivo')).toBeInTheDocument();
    expect(screen.getByText('Plantar Ejemplar Individual')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tomate Redondo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lechuga Mantecosa/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Albahaca Genovesa/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Maíz Dulce/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zanahoria Criolla/i })).toBeInTheDocument();

    // Click on Lechuga card
    fireEvent.click(screen.getByRole('button', { name: /Lechuga Mantecosa/i }));
    expect(onChangePlantCropCode).toHaveBeenCalledWith('lettuce');
    expect(onChangePlantSpacing).toHaveBeenCalledWith(25);
  });

  it('triggers onChangePlantSpacing when clicking spacing preset buttons', () => {
    const onChangePlantSpacing = vi.fn();

    render(
      <SpacePlantBuilderShelf
        activeTool="plant_line"
        plantCropCode="basil"
        onChangePlantCropCode={vi.fn()}
        plantSpacingCm={30}
        onChangePlantSpacing={onChangePlantSpacing}
        cultivableSectorCount={1}
        onFillSector={vi.fn()}
      />,
    );

    expect(screen.getByText('Surco / Hilera en Línea')).toBeInTheDocument();

    // Click 40 cm preset
    fireEvent.click(screen.getByRole('button', { name: '40 cm' }));
    expect(onChangePlantSpacing).toHaveBeenCalledWith(40);

    // Click 60 cm preset
    fireEvent.click(screen.getByRole('button', { name: '60 cm' }));
    expect(onChangePlantSpacing).toHaveBeenCalledWith(60);
  });

  it('renders sector auto-fill buttons and triggers onFillSector in plant_fill_sector mode', () => {
    const onFillSector = vi.fn();

    render(
      <SpacePlantBuilderShelf
        activeTool="plant_fill_sector"
        plantCropCode="carrot"
        onChangePlantCropCode={vi.fn()}
        plantSpacingCm={20}
        onChangePlantSpacing={vi.fn()}
        cultivableSectorCount={3}
        onFillSector={onFillSector}
      />,
    );

    expect(screen.getByText('Población Automática de Sector')).toBeInTheDocument();
    expect(screen.getByText('Sectores (3):')).toBeInTheDocument();

    const sector1Btn = screen.getByRole('button', { name: /Rellenar Sector 1/i });
    const sector2Btn = screen.getByRole('button', { name: /Rellenar Sector 2/i });
    const sector3Btn = screen.getByRole('button', { name: /Rellenar Sector 3/i });

    expect(sector1Btn).toBeInTheDocument();
    expect(sector2Btn).toBeInTheDocument();
    expect(sector3Btn).toBeInTheDocument();

    fireEvent.click(sector2Btn);
    expect(onFillSector).toHaveBeenCalledWith(1);
  });

  it('provides accessible select that triggers crop selection', () => {
    const onChangePlantCropCode = vi.fn();
    const onChangePlantSpacing = vi.fn();

    render(
      <SpacePlantBuilderShelf
        activeTool="plant_single"
        plantCropCode="tomato"
        onChangePlantCropCode={onChangePlantCropCode}
        plantSpacingCm={50}
        onChangePlantSpacing={onChangePlantSpacing}
        cultivableSectorCount={1}
        onFillSector={vi.fn()}
      />,
    );

    const select = screen.getByLabelText(/Cultivo a sembrar/i);
    expect(select).toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'corn' } });
    expect(onChangePlantCropCode).toHaveBeenCalledWith('corn');
    expect(onChangePlantSpacing).toHaveBeenCalledWith(40);
  });

  it('triggers onClose when clicking the close button', () => {
    const onClose = vi.fn();

    render(
      <SpacePlantBuilderShelf
        activeTool="plant_single"
        plantCropCode="tomato"
        onChangePlantCropCode={vi.fn()}
        plantSpacingCm={50}
        onChangePlantSpacing={vi.fn()}
        cultivableSectorCount={1}
        onFillSector={vi.fn()}
        onClose={onClose}
      />,
    );

    const closeBtn = screen.getByLabelText('Cerrar panel de siembra');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
