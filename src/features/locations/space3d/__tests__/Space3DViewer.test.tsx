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
    fireEvent.click(screen.getByRole('button', { name: '100 cm' }));
    fireEvent.change(screen.getByLabelText(/Material de Camino/i), {
      target: { value: 'gravel' },
    });

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
});
