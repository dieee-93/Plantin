import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useSpaceLayoutStore } from '@/store/spaceLayoutStore';
import { useIndividualStore } from '@/store/individualStore';
import { useSeedLotStore } from '@/store/seedLotStore';
import { Space3DViewer } from '../Space3DViewer';

describe('Space3DViewerRedesign - Full-Screen Canvas & Floating Glassmorphism HUD Controls', () => {
  beforeEach(() => {
    useSpaceLayoutStore.getState().resetAll();
    useIndividualStore.setState({ individuals: [] });
    useSeedLotStore.setState({ seedLots: [] });
  });

  it('renders full-screen clean container with top-left header nav, top-right lens bar, bottom command dock, and camera widget', () => {
    render(
      <Space3DViewer
        locationId="loc-redesign-1"
        locationName="Invernadero Beta"
        locationType="greenhouse"
        capacity={25}
      />,
    );

    // Full-screen container
    const viewer = screen.getByTestId('space-3d-viewer');
    expect(viewer).toBeInTheDocument();

    // Top-Left Header Nav
    expect(screen.getByText(/Invernadero Beta/i)).toBeInTheDocument();
    expect(screen.getByText(/0\s*\/\s*25\s*plantas/i)).toBeInTheDocument();

    // Top-Right Lens Bar Pills
    expect(screen.getByRole('button', { name: /Nombres/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Luz/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lentes/i })).toBeInTheDocument();

    // Bottom-Center Command Dock
    expect(screen.getByRole('button', { name: /Cultivo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Diseñar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ Sembrar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bandeja/i })).toBeInTheDocument();

    // Bottom-Right Camera Widget
    expect(screen.getByRole('button', { name: /2D|Plano 2D/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3D|Vista 3D/i })).toBeInTheDocument();
    expect(screen.getByText(/\d+%/)).toBeInTheDocument();
  });

  it('toggles bottom tray drawer to view seed lots and seedlings', () => {
    // Add a seed lot in store
    useSeedLotStore.getState().add({
      accessionId: 'acc-1',
      lotCode: 'ALB-2026-L1',
      initialCount: 50,
      harvestDate: '2026-03-01',
    });

    render(
      <Space3DViewer
        locationId="loc-redesign-2"
        locationName="Sala Climatizada"
        locationType="growth_chamber"
      />,
    );

    // Initially bottom tray is closed
    expect(screen.queryByRole('button', { name: /Cerrar bandeja/i })).not.toBeInTheDocument();

    // Click Bandeja button in command dock
    fireEvent.click(screen.getByRole('button', { name: /Bandeja/i }));

    // Now bottom dock is open with seed lot
    expect(screen.getByRole('button', { name: /Cerrar bandeja/i })).toBeInTheDocument();
    expect(screen.getByText('ALB-2026-L1')).toBeInTheDocument();
    expect(screen.getByText(/50\s*semillas/i)).toBeInTheDocument();

    // Close tray
    fireEvent.click(screen.getByRole('button', { name: /Cerrar bandeja/i }));
    expect(screen.queryByRole('button', { name: /Cerrar bandeja/i })).not.toBeInTheDocument();
  });

  it('selects a plant and opens SpacePlantActionBar with details, +Etapa, and delete actions', () => {
    const onInspect = vi.fn();
    const onAdvance = vi.fn();
    const onRemove = vi.fn();

    // Seed an individual in store matching patio_croquis plant-tomatera-1
    useIndividualStore.setState({
      individuals: [
        {
          id: 'plant-tomatera-1',
          accessionId: 'acc-tom-1',
          label: 'Tomatera',
          locationId: 'loc-redesign-3',
          plantingDate: '2026-02-01',
          currentBBCH: 20,
          status: 'active',
        },
      ],
    });

    render(
      <Space3DViewer
        locationId="loc-redesign-3"
        locationName="Patio Experimental"
        locationType="outdoor"
        onInspectPlantDetails={onInspect}
        onAdvancePlantBBCH={onAdvance}
        onRemovePlantIndividual={onRemove}
      />,
    );

    // Select plant-tomatera-1 on plane
    fireEvent.click(screen.getByTestId('plane-plant-plant-tomatera-1'));

    // Floating contextual popover appears
    const inspector = screen.getByTestId('selected-plant-inspector');
    expect(inspector).toBeInTheDocument();
    expect(inspector).toHaveTextContent(/Tomatera/i);
    expect(inspector).toHaveTextContent(/BBCH\s*20/i);

    // Advance BBCH (+Etapa)
    fireEvent.click(screen.getByRole('button', { name: /\+Etapa/i }));
    expect(onAdvance).toHaveBeenCalledWith('plant-tomatera-1');
    const updatedInd = useIndividualStore.getState().individuals.find(i => i.id === 'plant-tomatera-1');
    expect(updatedInd?.currentBBCH).toBe(30);

    // Inspect details
    fireEvent.click(screen.getByRole('button', { name: /Detalles/i }));
    expect(onInspect).toHaveBeenCalledWith('plant-tomatera-1');

    // Remove plant
    fireEvent.click(screen.getByRole('button', { name: /Eliminar/i }));
    expect(onRemove).toHaveBeenCalledWith('plant-tomatera-1');
    expect(useIndividualStore.getState().individuals).toHaveLength(0);
  });

  it('supports undo and redo via CommandDock buttons and keyboard shortcuts (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)', () => {
    render(
      <Space3DViewer
        locationId="loc-redesign-undo-1"
        locationName="Patio Undo"
        locationType="outdoor"
      />,
    );

    // Initial paths in patio_croquis is 2
    expect(
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-redesign-undo-1').paths,
    ).toHaveLength(2);

    const undoBtn = screen.getByRole('button', { name: /deshacer|undo/i });
    const redoBtn = screen.getByRole('button', { name: /rehacer|redo/i });
    expect(undoBtn).toBeDisabled();
    expect(redoBtn).toBeDisabled();

    // Switch to Trazar Camino and add a path
    fireEvent.click(screen.getByRole('button', { name: /Trazar Camino/i }));
    const plane = screen.getByTestId('interactive-plane-1to1');
    fireEvent.click(plane, { clientX: 100, clientY: 500 });
    fireEvent.click(plane, { clientX: 400, clientY: 500 });

    expect(
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-redesign-undo-1').paths,
    ).toHaveLength(3);
    expect(undoBtn).not.toBeDisabled();
    expect(redoBtn).toBeDisabled();

    // Click Undo button in CommandDock
    fireEvent.click(undoBtn);
    expect(
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-redesign-undo-1').paths,
    ).toHaveLength(2);
    expect(undoBtn).toBeDisabled();
    expect(redoBtn).not.toBeDisabled();

    // Click Redo button in CommandDock
    fireEvent.click(redoBtn);
    expect(
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-redesign-undo-1').paths,
    ).toHaveLength(3);
    expect(undoBtn).not.toBeDisabled();
    expect(redoBtn).toBeDisabled();

    // Test Ctrl+Z keyboard shortcut
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-redesign-undo-1').paths,
    ).toHaveLength(2);

    // Test Ctrl+Y keyboard shortcut
    fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
    expect(
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-redesign-undo-1').paths,
    ).toHaveLength(3);

    // Test Ctrl+Z again
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-redesign-undo-1').paths,
    ).toHaveLength(2);

    // Test Ctrl+Shift+Z keyboard shortcut (redo)
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });
    expect(
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-redesign-undo-1').paths,
    ).toHaveLength(3);

    // Test that typing in input prevents Ctrl+Z from triggering layout undo
    fireEvent.click(screen.getByRole('button', { name: /Editar Contorno/i }));
    const widthInput = screen.getByLabelText(/Ancho Terreno/i);
    fireEvent.keyDown(widthInput, { key: 'z', ctrlKey: true });
    // Still 3 paths because the event was ignored on input
    expect(
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-redesign-undo-1').paths,
    ).toHaveLength(3);
  });

  it('shows undo toast when deleting plant in Cultivo mode and restores plant and individual on click', () => {
    useIndividualStore.setState({
      individuals: [
        {
          id: 'plant-tomatera-1',
          accessionId: 'acc-tom-1',
          label: 'Tomatera Criolla',
          locationId: 'loc-redesign-toast-1',
          plantingDate: '2026-02-01',
          currentBBCH: 25,
          status: 'active',
        },
      ],
    });

    render(
      <Space3DViewer
        locationId="loc-redesign-toast-1"
        locationName="Huerto Cultivo"
        locationType="outdoor"
      />,
    );

    // Switch to Cultivo mode
    fireEvent.click(screen.getByRole('button', { name: /Cultivo/i }));

    // Select plant-tomatera-1
    fireEvent.click(screen.getByTestId('plane-plant-plant-tomatera-1'));

    // Remove plant
    fireEvent.click(screen.getByRole('button', { name: /Eliminar/i }));

    // Plant is removed
    expect(
      useSpaceLayoutStore
        .getState()
        .getOrCreateSpaceLayout('loc-redesign-toast-1')
        .placedPlants.some((p) => p.id === 'plant-tomatera-1'),
    ).toBe(false);
    expect(useIndividualStore.getState().individuals).toHaveLength(0);

    // Floating toast appears with glassmorphism style
    const toast = screen.getByTestId('undo-delete-plant-toast');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent(/Planta Tomatera eliminada/i);

    // Click Deshacer button in Toast
    const toastUndoBtn = screen.getByRole('button', { name: /deshacer/i });
    fireEvent.click(toastUndoBtn);

    // Plant is restored in spaceLayoutStore
    expect(
      useSpaceLayoutStore
        .getState()
        .getOrCreateSpaceLayout('loc-redesign-toast-1')
        .placedPlants.some((p) => p.id === 'plant-tomatera-1'),
    ).toBe(true);

    // Individual is restored in individualStore with same attributes
    const restoredInd = useIndividualStore.getState().individuals.find((i) => i.id === 'plant-tomatera-1');
    expect(restoredInd).toBeDefined();
    expect(restoredInd?.currentBBCH).toBe(25);
    expect(restoredInd?.label).toBe('Tomatera Criolla');

    // Toast is dismissed
    expect(screen.queryByTestId('undo-delete-plant-toast')).not.toBeInTheDocument();
  });

  it('auto-dismisses the undo toast after 6 seconds in Cultivo mode', () => {
    vi.useFakeTimers();

    useIndividualStore.setState({
      individuals: [
        {
          id: 'plant-tomatera-1',
          accessionId: 'acc-tom-1',
          label: 'Tomatera',
          locationId: 'loc-redesign-toast-2',
          status: 'active',
        },
      ],
    });

    render(
      <Space3DViewer
        locationId="loc-redesign-toast-2"
        locationName="Huerto Cultivo 2"
        locationType="outdoor"
      />,
    );

    // Switch to Cultivo mode
    fireEvent.click(screen.getByRole('button', { name: /Cultivo/i }));
    fireEvent.click(screen.getByTestId('plane-plant-plant-tomatera-1'));
    fireEvent.click(screen.getByRole('button', { name: /Eliminar/i }));

    expect(screen.getByTestId('undo-delete-plant-toast')).toBeInTheDocument();

    // Advance 5.9 seconds -> still visible
    act(() => {
      vi.advanceTimersByTime(5900);
    });
    expect(screen.getByTestId('undo-delete-plant-toast')).toBeInTheDocument();

    // Advance remaining 200 ms -> toast dismissed
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByTestId('undo-delete-plant-toast')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('reconciles dangling selection cleanly without crash when selected plant is undone via Ctrl+Z', () => {
    render(
      <Space3DViewer
        locationId="loc-redesign-dangling"
        locationName="Patio Dangling Test"
        locationType="outdoor"
      />,
    );

    // Initial plants in patio_croquis is 3
    expect(
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-redesign-dangling').placedPlants,
    ).toHaveLength(3);

    // Switch to Plantar Individual tool in Design mode and add a plant
    fireEvent.click(screen.getByRole('button', { name: /^Plantar$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Plantar Individual/i }));
    const plane = screen.getByTestId('interactive-plane-1to1');
    fireEvent.click(plane, { clientX: 300, clientY: 200 });

    const plantsAfter = useSpaceLayoutStore
      .getState()
      .getOrCreateSpaceLayout('loc-redesign-dangling').placedPlants;
    expect(plantsAfter).toHaveLength(4);
    const addedPlant = plantsAfter[plantsAfter.length - 1];

    // Select the newly added plant
    fireEvent.click(screen.getByTestId(`plane-plant-${addedPlant.id}`));
    expect(screen.getByTestId('selected-plant-inspector')).toBeInTheDocument();

    // Trigger undo via Ctrl+Z (the plant is removed from placedPlants)
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });

    // Plant count goes back to 3
    expect(
      useSpaceLayoutStore.getState().getOrCreateSpaceLayout('loc-redesign-dangling').placedPlants,
    ).toHaveLength(3);

    // Inspector unmounts cleanly without throwing TypeError or leaving dangling ID
    expect(screen.queryByTestId('selected-plant-inspector')).not.toBeInTheDocument();
  });
});
