import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpaceTerrainBuilderShelf } from '../SpaceTerrainBuilderShelf';

describe('SpaceTerrainBuilderShelf - Visual Terrain & Flooring Builder Shelf', () => {
  it('renders 6 visual PBR material cards with badges and triggers onChangeMaterial', () => {
    const onChangeMaterial = vi.fn();
    render(
      <SpaceTerrainBuilderShelf
        currentMaterial="soil"
        onChangeMaterial={onChangeMaterial}
        customWidthM="6.0"
        setCustomWidthM={vi.fn()}
        customDepthM="10.0"
        setCustomDepthM={vi.fn()}
        onApplyDimensions={vi.fn()}
        vertexCount={4}
      />,
    );

    expect(screen.getByText('Terreno & Pavimentos')).toBeInTheDocument();
    expect(screen.getByText('Tierra de Cultivo')).toBeInTheDocument();
    expect(screen.getByText('Césped / Pasto')).toBeInTheDocument();
    expect(screen.getByText('Grava Drenante')).toBeInTheDocument();
    expect(screen.getByText('Hormigón Alisado')).toBeInTheDocument();
    expect(screen.getByText('Baldosas Rústicas')).toBeInTheDocument();
    expect(screen.getByText('Deck de Madera')).toBeInTheDocument();

    // Click on Grass
    fireEvent.click(screen.getByText('Césped / Pasto'));
    expect(onChangeMaterial).toHaveBeenCalledWith('grass');

    // Click on Wood Deck
    fireEvent.click(screen.getByText('Deck de Madera'));
    expect(onChangeMaterial).toHaveBeenCalledWith('wood');
  });

  it('handles parcel size presets and proportional scaling', () => {
    const setCustomWidthM = vi.fn();
    const setCustomDepthM = vi.fn();
    const onApplyDimensions = vi.fn();
    const onScaleParcel = vi.fn();

    render(
      <SpaceTerrainBuilderShelf
        currentMaterial="soil"
        onChangeMaterial={vi.fn()}
        customWidthM="6.0"
        setCustomWidthM={setCustomWidthM}
        customDepthM="10.0"
        setCustomDepthM={setCustomDepthM}
        onApplyDimensions={onApplyDimensions}
        onScaleParcel={onScaleParcel}
        vertexCount={4}
      />,
    );

    // Select preset 8 × 12 m
    fireEvent.click(screen.getByRole('button', { name: /8 × 12 m/i }));
    expect(setCustomWidthM).toHaveBeenCalledWith('8.0');
    expect(setCustomDepthM).toHaveBeenCalledWith('12.0');
    expect(onApplyDimensions).toHaveBeenCalledTimes(1);

    // Click Scale +10%
    fireEvent.click(screen.getByRole('button', { name: /\+10%/i }));
    expect(onScaleParcel).toHaveBeenCalledWith(1.1);

    // Click Scale -10%
    fireEvent.click(screen.getByRole('button', { name: /-10%/i }));
    expect(onScaleParcel).toHaveBeenCalledWith(0.9);
  });

  it('triggers vertex insertion, vertex deletion, and vertex sanitizing', () => {
    const onInsertVertex = vi.fn();
    const onRemoveSelectedVertex = vi.fn();
    const onSanitizeBoundary = vi.fn();

    render(
      <SpaceTerrainBuilderShelf
        currentMaterial="soil"
        onChangeMaterial={vi.fn()}
        customWidthM="6.0"
        setCustomWidthM={vi.fn()}
        customDepthM="10.0"
        setCustomDepthM={vi.fn()}
        onApplyDimensions={vi.fn()}
        vertexCount={6}
        selectedVertexIndex={2}
        onInsertVertex={onInsertVertex}
        onRemoveSelectedVertex={onRemoveSelectedVertex}
        onSanitizeBoundary={onSanitizeBoundary}
      />,
    );

    // Insert vertex
    fireEvent.click(screen.getByRole('button', { name: /\+ Vértice/i }));
    expect(onInsertVertex).toHaveBeenCalledTimes(1);

    // Remove selected vertex
    fireEvent.click(screen.getByRole('button', { name: /Eliminar Vértice #3/i }));
    expect(onRemoveSelectedVertex).toHaveBeenCalledTimes(1);

    // Sanitize vertices
    fireEvent.click(screen.getByRole('button', { name: /Sanear Vértices/i }));
    expect(onSanitizeBoundary).toHaveBeenCalledTimes(1);
  });

  it('handles close button', () => {
    const onClose = vi.fn();
    render(
      <SpaceTerrainBuilderShelf
        currentMaterial="soil"
        onChangeMaterial={vi.fn()}
        customWidthM="6.0"
        setCustomWidthM={vi.fn()}
        customDepthM="10.0"
        setCustomDepthM={vi.fn()}
        onApplyDimensions={vi.fn()}
        vertexCount={4}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByLabelText('Cerrar panel de terreno'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders restored Rellenar Espacio button and triggers onFillSector(0)', () => {
    const onFillSector = vi.fn();
    render(
      <SpaceTerrainBuilderShelf
        currentMaterial="soil"
        onChangeMaterial={vi.fn()}
        customWidthM="6.0"
        setCustomWidthM={vi.fn()}
        customDepthM="10.0"
        setCustomDepthM={vi.fn()}
        onApplyDimensions={vi.fn()}
        vertexCount={4}
        cultivableSectorCount={2}
        onFillSector={onFillSector}
      />,
    );

    const fillBtn = screen.getByRole('button', { name: /Rellenar Espacio/i });
    expect(fillBtn).toBeInTheDocument();
    fireEvent.click(fillBtn);
    expect(onFillSector).toHaveBeenCalledWith(0);
  });
});
