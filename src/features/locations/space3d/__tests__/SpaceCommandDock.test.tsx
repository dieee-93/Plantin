import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpaceCommandDock } from '../SpaceCommandDock';

describe('SpaceCommandDock - Bottom-Center Floating Dock with Mode Toggle & Tools', () => {
  it('renders mode switch (Cultivo / Diseñar), Sembrar button, and Tray toggle button', () => {
    const onChangeMode = vi.fn();
    const onOpenSow = vi.fn();
    const onToggleTray = vi.fn();

    render(
      <SpaceCommandDock
        mode="crop"
        onChangeMode={onChangeMode}
        onOpenSowModalOrDrawer={onOpenSow}
        isTrayOpen={false}
        onToggleTray={onToggleTray}
        activeTool="inspect"
        onChangeTool={vi.fn()}
        pathWidthCm={80}
        onChangePathWidth={vi.fn()}
        pathMaterial="concrete"
        onChangePathMaterial={vi.fn()}
        paths={[]}
        onRemovePath={vi.fn()}
        plantCropCode="tomato"
        onChangePlantCropCode={vi.fn()}
        plantSpacingCm={30}
        onChangePlantSpacing={vi.fn()}
        cultivableSectorCount={2}
        onFillSector={vi.fn()}
        customWidthM="10"
        setCustomWidthM={vi.fn()}
        customDepthM="6"
        setCustomDepthM={vi.fn()}
        onApplyDimensions={vi.fn()}
        onInsertVertex={vi.fn()}
        vertexCount={4}
      />,
    );

    // Segmented mode toggle
    expect(screen.getByRole('button', { name: /Cultivo/i })).toBeInTheDocument();
    const designBtn = screen.getByRole('button', { name: /Diseñar/i });
    expect(designBtn).toBeInTheDocument();
    fireEvent.click(designBtn);
    expect(onChangeMode).toHaveBeenCalledWith('design');

    // + Sembrar button
    const sembrarBtn = screen.getByRole('button', { name: /\+ Sembrar/i });
    expect(sembrarBtn).toBeInTheDocument();
    fireEvent.click(sembrarBtn);
    expect(onOpenSow).toHaveBeenCalled();

    // Bandeja button
    const bandejaBtn = screen.getByRole('button', { name: /Bandeja/i });
    expect(bandejaBtn).toBeInTheDocument();
    fireEvent.click(bandejaBtn);
    expect(onToggleTray).toHaveBeenCalled();
  });

  it('renders design sub-toolbar with 1:1 tools when mode is "design"', () => {
    const onChangeTool = vi.fn();
    const onChangePathWidth = vi.fn();

    render(
      <SpaceCommandDock
        mode="design"
        onChangeMode={vi.fn()}
        onOpenSowModalOrDrawer={vi.fn()}
        isTrayOpen={false}
        onToggleTray={vi.fn()}
        activeTool="draw_path"
        onChangeTool={onChangeTool}
        pathWidthCm={80}
        onChangePathWidth={onChangePathWidth}
        pathMaterial="concrete"
        onChangePathMaterial={vi.fn()}
        paths={[]}
        onRemovePath={vi.fn()}
        plantCropCode="tomato"
        onChangePlantCropCode={vi.fn()}
        plantSpacingCm={30}
        onChangePlantSpacing={vi.fn()}
        cultivableSectorCount={2}
        onFillSector={vi.fn()}
        customWidthM="10"
        setCustomWidthM={vi.fn()}
        customDepthM="6"
        setCustomDepthM={vi.fn()}
        onApplyDimensions={vi.fn()}
        onInsertVertex={vi.fn()}
        vertexCount={4}
      />,
    );

    expect(screen.getByRole('button', { name: /Trazar Camino/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Editar Contorno/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Plantar Individual/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Surco\/Fila/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rellenar Sector/i })).toBeInTheDocument();

    // Clicking 100 cm width option
    fireEvent.click(screen.getByRole('button', { name: '100 cm' }));
    expect(onChangePathWidth).toHaveBeenCalledWith(100);
  });
});
