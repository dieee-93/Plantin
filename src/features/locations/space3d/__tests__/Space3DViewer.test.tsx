import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useSpaceLayoutStore } from '@/store/spaceLayoutStore';
import { Space3DViewer } from '../Space3DViewer';

describe('Space3DViewer - Interactive 1:1 Space Builder & Viewer', () => {
  beforeEach(() => {
    useSpaceLayoutStore.getState().resetAll();
  });

  it('switches to "Trazar Camino", adds a new path stroke from A to B, and updates walkable and cultivable area metrics in m²', () => {
    render(
      <Space3DViewer
        locationId="loc-patio-builder-1"
        locationName="Patio Principal"
        locationType="outdoor"
      />,
    );

    // Initially patio_croquis has 60.0 m² total, 30.2 m² cultivable, 29.8 m² walkable
    expect(screen.getByTestId('metric-cultivable-area')).toHaveTextContent('30.2 m²');
    expect(screen.getByTestId('metric-walkable-area')).toHaveTextContent('29.8 m²');

    // Switch to Trazar Camino tool
    fireEvent.click(screen.getByRole('button', { name: /Trazar Camino/i }));

    // Select 100 cm width and Grava material
    fireEvent.click(screen.getAllByRole('button', { name: '100 cm' })[0]);
    fireEvent.click(screen.getByText('Grava Drenante'));

    // Click two points on the interactive 1:1 plane or use the 1:1 path coordinates action:
    // Start at (100, 520) and End at (600, 520) across the lower cultivable sector
    const plane = screen.getByTestId('interactive-plane-1to1');
    fireEvent.click(plane, { clientX: 100, clientY: 520 });
    fireEvent.mouseMove(plane, { clientX: 600, clientY: 520 });

    // Live draft metric shows 500 cm length
    expect(screen.getByTestId('draft-path-metrics')).toHaveTextContent(/500\s*cm/i);

    // Second click finishes the path stroke
    fireEvent.click(plane, { clientX: 600, clientY: 520 });

    // Walkable area increases and cultivable area decreases accordingly
    const updatedLayout = useSpaceLayoutStore.getState().layouts['loc-patio-builder-1'];
    expect(updatedLayout.paths).toHaveLength(3);
    expect(screen.getByTestId('metric-cultivable-area')).not.toHaveTextContent('30.2 m²');
    expect(screen.getByTestId('metric-walkable-area')).not.toHaveTextContent('29.8 m²');
  });

  it('switches to "Rellenar Sector" and fills a cultivable sector respecting diagonal paths and updating the total plant count', () => {
    render(
      <Space3DViewer
        locationId="loc-patio-builder-2"
        locationName="Patio Norte"
        locationType="outdoor"
      />,
    );

    // Initially 3 plants in patio_croquis
    expect(screen.getByTestId('total-plants-counter')).toHaveTextContent('3 plantas');

    // Switch to Rellenar Sector tool
    fireEvent.click(screen.getByRole('button', { name: /Rellenar Sector/i }));

    // Choose Lechuga preset (30 cm spacing)
    fireEvent.change(screen.getByLabelText(/Cultivo a sembrar/i), {
      target: { value: 'lettuce' },
    });

    // Click "Rellenar Sector 1"
    fireEvent.click(screen.getByRole('button', { name: /Rellenar Sector 1/i }));

    const updatedLayout = useSpaceLayoutStore.getState().layouts['loc-patio-builder-2'];
    expect(updatedLayout.placedPlants.length).toBeGreaterThan(10);
    expect(screen.getByTestId('total-plants-counter')).toHaveTextContent(
      `${updatedLayout.placedPlants.length} plantas`,
    );
  });

  it('selects an existing plant on the 1:1 plane and displays its exact distance in cm to neighboring plants', () => {
    render(
      <Space3DViewer
        locationId="loc-patio-builder-3"
        locationName="Patio Sur"
        locationType="outdoor"
      />,
    );

    // Click on "Tomatera" marker in the interactive plane
    fireEvent.click(screen.getByTestId('plane-plant-plant-tomatera-1'));

    const inspector = screen.getByTestId('selected-plant-inspector');
    expect(inspector).toHaveTextContent(/Tomatera/i);
    expect(inspector).toHaveTextContent(/Distancia a Morrón:\s*45\s*cm/i);
    expect(inspector).toHaveTextContent(/Distancia a Lechuga:\s*120\s*cm/i);
  });

  it('renders interactive boundary vertex handles, supports dragging vertices, and wall selection with height/material editing', () => {
    render(
      <Space3DViewer
        locationId="loc-terrain-test-1"
        locationName="Lote Pruebas"
        locationType="outdoor"
      />,
    );

    // Initially, handles are not rendered in default select tool
    expect(screen.queryByTestId('boundary-vertex-0')).not.toBeInTheDocument();

    // Switch to "Editar Contorno" tool
    fireEvent.click(screen.getByRole('button', { name: /Editar Contorno/i }));

    // Boundary vertex handles should be rendered on the 2D plane
    const vertex0 = screen.getByTestId('boundary-vertex-0');
    expect(vertex0).toBeInTheDocument();
    expect(screen.getByTestId('boundary-vertex-1')).toBeInTheDocument();

    // Drag vertex 1 from (1000, 0) to (900, 50)
    const plane = screen.getByTestId('interactive-plane-1to1');
    fireEvent.pointerDown(screen.getByTestId('boundary-vertex-1'));
    fireEvent.pointerMove(plane, { clientX: 900, clientY: 50 });
    fireEvent.pointerUp(plane);

    // Wall segments should be rendered and selectable
    const wall0 = useSpaceLayoutStore.getState().layouts['loc-terrain-test-1'].walls[0];
    const wallElement = screen.getByTestId(`wall-segment-${wall0.id}`);
    expect(wallElement).toBeInTheDocument();

    // Click on the wall segment to open SpaceWallActionBar
    fireEvent.click(wallElement);
    const wallInspector = screen.getByTestId('selected-wall-inspector');
    expect(wallInspector).toBeInTheDocument();
    expect(wallInspector).toHaveTextContent(/Pared \/ Cerramiento/i);

    // Change wall height to 120 cm (Cerco)
    fireEvent.click(screen.getByRole('button', { name: '120 cm (Cerco)' }));
    expect(
      useSpaceLayoutStore.getState().layouts['loc-terrain-test-1'].walls[0].heightCm,
    ).toBe(120);

    // Change material to wood_fence
    fireEvent.click(screen.getByRole('button', { name: 'Material Madera' }));
    expect(
      useSpaceLayoutStore.getState().layouts['loc-terrain-test-1'].walls[0].material,
    ).toBe('wood_fence');

    // Change to 0 cm (Abierto)
    fireEvent.click(screen.getByRole('button', { name: '0 cm (Abierto)' }));
    expect(
      useSpaceLayoutStore.getState().layouts['loc-terrain-test-1'].walls[0].heightCm,
    ).toBe(0);
    expect(wallInspector).toHaveTextContent(/Límite Abierto/i);

    // Switch tool back to "Inspeccionar" -> boundary handles should disappear
    fireEvent.click(screen.getByRole('button', { name: /Inspeccionar/i }));
    expect(screen.queryByTestId('boundary-vertex-0')).not.toBeInTheDocument();
  });
});
