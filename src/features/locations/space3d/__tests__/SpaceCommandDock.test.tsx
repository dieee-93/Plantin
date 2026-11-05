import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpaceCommandDock } from '../SpaceCommandDock';

describe('SpaceCommandDock - Left Vertical HudRail & Bottom Command Dock', () => {
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

  it('renders vertical HudRail with 1:1 tool icons and status line when mode is "design"', () => {
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

    // Vertical HUD toolbar
    expect(screen.getByRole('toolbar')).toBeInTheDocument();

    // Tool buttons queried by role and aria-label
    const inspectBtn = screen.getByRole('button', { name: /^Inspeccionar$/i });
    const drawPathBtn = screen.getByRole('button', { name: /^Trazar Camino$/i });
    const wallsBtn = screen.getByRole('button', { name: /^Muros$/i });
    const roofBtn = screen.getByRole('button', { name: /^Techo$/i });
    const editBoundaryBtn = screen.getByRole('button', { name: /^Editar Contorno$/i });
    const plantGroupBtn = screen.getByRole('button', { name: /^Plantar$/i });

    expect(inspectBtn).toBeInTheDocument();
    expect(drawPathBtn).toBeInTheDocument();
    expect(wallsBtn).toBeInTheDocument();
    expect(roofBtn).toBeInTheDocument();
    expect(editBoundaryBtn).toBeInTheDocument();
    expect(plantGroupBtn).toBeInTheDocument();

    // Click Plantar to open sub-tools flyout
    fireEvent.click(plantGroupBtn);

    const plantSingleBtn = screen.getByRole('button', { name: /^Plantar Individual$/i });
    const plantLineBtn = screen.getByRole('button', { name: /^Surco\/Fila$/i });
    const plantFillSectorBtn = screen.getByRole('button', { name: /^Rellenar Sector$/i });

    expect(plantSingleBtn).toBeInTheDocument();
    expect(plantLineBtn).toBeInTheDocument();
    expect(plantFillSectorBtn).toBeInTheDocument();

    // Active tool state
    expect(drawPathBtn).toHaveAttribute('aria-pressed', 'true');
    expect(inspectBtn).toHaveAttribute('aria-pressed', 'false');

    // Switch tool
    fireEvent.click(inspectBtn);
    expect(onChangeTool).toHaveBeenCalledWith('inspect');

    // Contextual status line
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Clicking 100 cm width option in status line actions
    const width100Btn = screen.getByRole('button', { name: '100 cm' });
    expect(width100Btn).toBeInTheDocument();
    fireEvent.click(width100Btn);
    expect(onChangePathWidth).toHaveBeenCalledWith(100);
  });

  it('renders wall presets status line without duplicate height buttons when activeTool is "walls"', () => {
    render(
      <SpaceCommandDock
        mode="design"
        onChangeMode={vi.fn()}
        onOpenSowModalOrDrawer={vi.fn()}
        isTrayOpen={false}
        onToggleTray={vi.fn()}
        activeTool="walls"
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

    expect(screen.getByText(/Cerramiento perimetral:/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /2.0m/i })).not.toBeInTheDocument();
  });

  it('renders Deshacer (Undo) and Rehacer (Redo) buttons in design mode with enabled/disabled states', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();

    const { rerender } = render(
      <SpaceCommandDock
        mode="design"
        onChangeMode={vi.fn()}
        onOpenSowModalOrDrawer={vi.fn()}
        isTrayOpen={false}
        onToggleTray={vi.fn()}
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
        canUndo={false}
        canRedo={false}
        onUndo={onUndo}
        onRedo={onRedo}
      />,
    );

    const undoBtn = screen.getByRole('button', { name: /deshacer|undo/i });
    const redoBtn = screen.getByRole('button', { name: /rehacer|redo/i });

    expect(undoBtn).toBeInTheDocument();
    expect(redoBtn).toBeInTheDocument();
    expect(undoBtn).toBeDisabled();
    expect(redoBtn).toBeDisabled();

    // Rerender with canUndo and canRedo true
    rerender(
      <SpaceCommandDock
        mode="design"
        onChangeMode={vi.fn()}
        onOpenSowModalOrDrawer={vi.fn()}
        isTrayOpen={false}
        onToggleTray={vi.fn()}
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
        canUndo={true}
        canRedo={true}
        onUndo={onUndo}
        onRedo={onRedo}
      />,
    );

    expect(undoBtn).not.toBeDisabled();
    expect(redoBtn).not.toBeDisabled();

    fireEvent.click(undoBtn);
    expect(onUndo).toHaveBeenCalledTimes(1);

    fireEvent.click(redoBtn);
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it('displays transient rail hints on first visit, dismisses on hover/click, and persists to localStorage', () => {
    localStorage.removeItem('plantin_hud_rail_hints_shown');
    // Ensure prefers-reduced-motion is false
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { unmount } = render(
      <SpaceCommandDock
        mode="design"
        onChangeMode={vi.fn()}
        onOpenSowModalOrDrawer={vi.fn()}
        isTrayOpen={false}
        onToggleTray={vi.fn()}
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

    const rail = screen.getByTestId('hud-left-rail');
    // Hovering dismisses hints and persists
    fireEvent.mouseEnter(rail);
    expect(localStorage.getItem('plantin_hud_rail_hints_shown')).toBe('true');

    unmount();
  });

  it('renders bottom command dock bar with relative flex flow (no absolute positioning) and luminous medallion styling', () => {
    render(
      <SpaceCommandDock
        mode="design"
        primaryMode="build"
        onChangeMode={vi.fn()}
        onOpenSowModalOrDrawer={vi.fn()}
        isTrayOpen={false}
        onToggleTray={vi.fn()}
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
        canUndo={true}
        canRedo={false}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
      />,
    );

    const dockBar = screen.getByTestId('space-command-dock-bar');
    expect(dockBar).toBeInTheDocument();
    expect(dockBar.className).toContain('rounded-full');
    expect(dockBar.className).toContain('border-slate-200/90');
    expect(dockBar.className).toContain('bg-white/95');

    // Check parent wrapper has relative w-full and NOT absolute bottom-3
    const dockWrapper = dockBar.parentElement;
    expect(dockWrapper).toBeInTheDocument();
    expect(dockWrapper?.className).toContain('relative');
    expect(dockWrapper?.className).toContain('w-full');
    expect(dockWrapper?.className).not.toContain('absolute bottom-3');

    // Build button should be active medallion
    const buildBtn = screen.getByTestId('mode-btn-build');
    expect(buildBtn.className).toContain('bg-emerald-600');
    expect(buildBtn.className).toContain('text-white');
    expect(buildBtn.className).toContain('rounded-full');

    // Live button should be inactive medallion
    const liveBtn = screen.getByTestId('mode-btn-live');
    expect(liveBtn.className).toContain('bg-slate-100');
    expect(liveBtn.className).toContain('text-slate-700');
    expect(liveBtn.className).toContain('rounded-full');
  });
});

