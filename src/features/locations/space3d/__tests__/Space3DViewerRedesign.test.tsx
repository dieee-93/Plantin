import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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
    expect(screen.getByText('75%')).toBeInTheDocument();
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
});
