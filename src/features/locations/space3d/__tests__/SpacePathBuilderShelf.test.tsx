import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpacePathBuilderShelf } from '../SpacePathBuilderShelf';

describe('SpacePathBuilderShelf - Visual Walkway & Path Builder Shelf', () => {
  const samplePaths = [
    { id: 'path-1', label: 'Sendero Principal', widthCm: 100 },
    { id: 'path-2', label: 'Pasarela Este', widthCm: 60 },
  ];

  it('renders width archetypes and triggers onChangePathWidth', () => {
    const onChangePathWidth = vi.fn();
    render(
      <SpacePathBuilderShelf
        pathWidthCm={80}
        onChangePathWidth={onChangePathWidth}
        pathMaterial="gravel"
        onChangePathMaterial={vi.fn()}
        paths={[]}
        onRemovePath={vi.fn()}
      />,
    );

    expect(screen.getByText('Caminos & Senderos')).toBeInTheDocument();
    expect(screen.getByText('Sendero Angosto')).toBeInTheDocument();
    expect(screen.getByText('Paso de Carretilla')).toBeInTheDocument();
    expect(screen.getByText('Paseo Principal')).toBeInTheDocument();

    // Click on Sendero Angosto (60 cm)
    fireEvent.click(screen.getByText('Sendero Angosto'));
    expect(onChangePathWidth).toHaveBeenCalledWith(60);

    // Click on 120 cm pill
    fireEvent.click(screen.getByRole('button', { name: '120 cm' }));
    expect(onChangePathWidth).toHaveBeenCalledWith(120);
  });

  it('renders PBR material swatches and triggers onChangePathMaterial', () => {
    const onChangePathMaterial = vi.fn();
    render(
      <SpacePathBuilderShelf
        pathWidthCm={80}
        onChangePathWidth={vi.fn()}
        pathMaterial="gravel"
        onChangePathMaterial={onChangePathMaterial}
        paths={[]}
        onRemovePath={vi.fn()}
      />,
    );

    expect(screen.getByText('Grava Drenante')).toBeInTheDocument();
    expect(screen.getByText('Deck de Madera')).toBeInTheDocument();
    expect(screen.getByText('Adoquín / Baldosa')).toBeInTheDocument();
    expect(screen.getByText('Cemento Alisado')).toBeInTheDocument();

    // Click on Wood Deck
    fireEvent.click(screen.getByText('Deck de Madera'));
    expect(onChangePathMaterial).toHaveBeenCalledWith('wood');

    // Click on Tile
    fireEvent.click(screen.getByText('Adoquín / Baldosa'));
    expect(onChangePathMaterial).toHaveBeenCalledWith('tile');
  });

  it('shows drafting status and allows canceling active draft', () => {
    const onCancelDraft = vi.fn();
    const { rerender } = render(
      <SpacePathBuilderShelf
        pathWidthCm={80}
        onChangePathWidth={vi.fn()}
        pathMaterial="gravel"
        onChangePathMaterial={vi.fn()}
        paths={[]}
        onRemovePath={vi.fn()}
        draftStartCm={null}
        onCancelDraft={onCancelDraft}
      />,
    );

    expect(screen.getByText('Modo de Trazado Continuo Activo')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cancelar Trazo/i })).not.toBeInTheDocument();

    // Rerender with draftStartCm active
    rerender(
      <SpacePathBuilderShelf
        pathWidthCm={80}
        onChangePathWidth={vi.fn()}
        pathMaterial="gravel"
        onChangePathMaterial={vi.fn()}
        paths={[]}
        onRemovePath={vi.fn()}
        draftStartCm={{ x: 200, y: 300 }}
        onCancelDraft={onCancelDraft}
      />,
    );

    expect(screen.getByText(/Punto de inicio fijado/i)).toBeInTheDocument();
    const cancelBtn = screen.getByRole('button', { name: /Cancelar Trazo/i });
    expect(cancelBtn).toBeInTheDocument();
    fireEvent.click(cancelBtn);
    expect(onCancelDraft).toHaveBeenCalledTimes(1);
  });

  it('renders drawn paths list and allows removing individual paths', () => {
    const onRemovePath = vi.fn();
    render(
      <SpacePathBuilderShelf
        pathWidthCm={80}
        onChangePathWidth={vi.fn()}
        pathMaterial="gravel"
        onChangePathMaterial={vi.fn()}
        paths={samplePaths}
        onRemovePath={onRemovePath}
      />,
    );

    expect(screen.getByText('Sendero Principal')).toBeInTheDocument();
    expect(screen.getByText('Pasarela Este')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Eliminar Sendero Principal'));
    expect(onRemovePath).toHaveBeenCalledWith('path-1');
  });

  it('handles close button', () => {
    const onClose = vi.fn();
    render(
      <SpacePathBuilderShelf
        pathWidthCm={80}
        onChangePathWidth={vi.fn()}
        pathMaterial="gravel"
        onChangePathMaterial={vi.fn()}
        paths={[]}
        onRemovePath={vi.fn()}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByLabelText('Cerrar panel de caminos'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
