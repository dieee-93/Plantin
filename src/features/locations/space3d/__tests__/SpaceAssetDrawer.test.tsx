import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpaceAssetDrawer } from '../SpaceAssetDrawer';

describe('SpaceAssetDrawer - 3D Asset Drawer & Taxonomy', () => {
  it('renders CAD drawer with search, category tabs, and asset cards', () => {
    const onSelectAssetId = vi.fn();
    const onClose = vi.fn();

    render(
      <SpaceAssetDrawer
        selectedAssetId="pallet_standard_wood_a01"
        onSelectAssetId={onSelectAssetId}
        onClose={onClose}
      />,
    );

    // Header & Search
    expect(screen.getByText('Biblioteca de Objetos')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Buscar entre \d+ modelos/i),
    ).toBeInTheDocument();

    // Primary categories
    expect(screen.getByText('Plantas 3D')).toBeInTheDocument();
    expect(screen.getByText('Logística')).toBeInTheDocument();
    expect(screen.getByText('Clima / MEP')).toBeInTheDocument();
    expect(screen.getByText('Mobiliario')).toBeInTheDocument();
    expect(screen.getByText('Cosechas')).toBeInTheDocument();
    expect(screen.getByText('Herramientas')).toBeInTheDocument();
    expect(screen.getByText('Seguridad')).toBeInTheDocument();
  });

  it('filters items using search query and calls onSelectAssetId on card click', () => {
    const onSelectAssetId = vi.fn();

    render(
      <SpaceAssetDrawer
        selectedAssetId="pallet_standard_wood_a01"
        onSelectAssetId={onSelectAssetId}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/Buscar entre 999 modelos/i);
    fireEvent.change(searchInput, { target: { value: 'Extension Bar' } });

    // Should find the card matching Extension Bar
    const cardBtn = screen.getByRole('button', { name: /Extension Bar/i });
    expect(cardBtn).toBeInTheDocument();

    fireEvent.click(cardBtn);
    expect(onSelectAssetId).toHaveBeenCalledWith('handTool_extension_bar_a01');
  });

  it('filters items by category and subcategory', () => {
    const onSelectAssetId = vi.fn();

    render(
      <SpaceAssetDrawer
        selectedAssetId="pallet_standard_wood_a01"
        onSelectAssetId={onSelectAssetId}
      />,
    );

    // Switch to Cosechas category
    const cosechasTab = screen.getByText('Cosechas');
    fireEvent.click(cosechasTab);

    // Subcategories for harvest_produce should now appear
    expect(screen.getByText('Frutas')).toBeInTheDocument();
    expect(screen.getByText('Hortalizas y Frutos')).toBeInTheDocument();
    expect(screen.getByText('Hojas y Coles')).toBeInTheDocument();

    // Select Frutas subcategory
    const frutasChip = screen.getByText('Frutas');
    fireEvent.click(frutasChip);

    // Frutas items should be rendered in grid
    const grid = screen.getByTestId('space-asset-grid');
    const manzanaCards = within(grid).getAllByText(/Manzana/i);
    expect(manzanaCards.length).toBeGreaterThan(0);
  });

  it('renders clean Spanish labels and dimension badges correctly', () => {
    render(
      <SpaceAssetDrawer
        selectedAssetId="pallet_standard_wood_a01"
        onSelectAssetId={vi.fn()}
      />,
    );

    // Switch to Logística category
    const logisticsTab = screen.getByText('Logística');
    fireEvent.click(logisticsTab);

    // Subcategory Palets
    const paletsChip = screen.getByText('Palets y Zorras');
    fireEvent.click(paletsChip);

    const grid = screen.getByTestId('space-asset-grid');

    // Dimension badge '120×80 cm' should be rendered on pallet cards
    const dimensionBadges = within(grid).getAllByText('120×80 cm');
    expect(dimensionBadges.length).toBeGreaterThan(0);

    // Spanish label for pallet
    const palletLabels = within(grid).getAllByText(/Palet/i);
    expect(palletLabels.length).toBeGreaterThan(0);
  });

  it('supports minimizing and reopening the drawer', () => {
    const onToggleOpen = vi.fn();

    const { rerender } = render(
      <SpaceAssetDrawer
        isOpen={true}
        onToggleOpen={onToggleOpen}
        selectedAssetId="pallet_standard_wood_a01"
        onSelectAssetId={vi.fn()}
      />,
    );

    // When open, close button is available
    const closeBtn = screen.getByTestId('space-asset-drawer-close-btn');
    fireEvent.click(closeBtn);

    // When closed, floating open button is shown
    rerender(
      <SpaceAssetDrawer
        isOpen={false}
        onToggleOpen={onToggleOpen}
        selectedAssetId="pallet_standard_wood_a01"
        onSelectAssetId={vi.fn()}
      />,
    );

    const openBtn = screen.getByTestId('space-asset-drawer-open-btn');
    expect(openBtn).toBeInTheDocument();
    expect(screen.getByText('Biblioteca de Objetos')).toBeInTheDocument();

    fireEvent.click(openBtn);
    expect(onToggleOpen).toHaveBeenCalled();
  });

  it('loads more items when clicking Cargar más button', () => {
    render(
      <SpaceAssetDrawer
        selectedAssetId="pallet_standard_wood_a01"
        onSelectAssetId={vi.fn()}
      />,
    );

    // Initial batch is 24 items in 'all' category (out of 999)
    const loadMoreBtn = screen.getByRole('button', { name: /Cargar más/i });
    expect(loadMoreBtn).toBeInTheDocument();

    fireEvent.click(loadMoreBtn);

    // Expecting next batch
    expect(screen.getByText(/Mostrando 48 de \d+/i)).toBeInTheDocument();
  });

  it('renders in horizontal luminous bottom console layout without dark mode classes', () => {
    const { container } = render(
      <SpaceAssetDrawer
        selectedAssetId="pallet_standard_wood_a01"
        onSelectAssetId={vi.fn()}
      />,
    );

    const aside = screen.getByTestId('space-asset-drawer');
    // Checks horizontal luminous console layout
    expect(aside.className).toContain('max-w-4xl');
    expect(aside.className).toContain('max-h-[34vh]');
    expect(aside.className).not.toContain('fixed top-0 bottom-0 left-0 w-96');

    // No dark:* classes across the rendered component
    const allHtml = container.innerHTML;
    expect(allHtml).not.toMatch(/dark:/);

    // Grid has horizontal responsive columns
    const grid = screen.getByTestId('space-asset-grid');
    expect(grid.className).toContain('sm:grid-cols-3');
    expect(grid.className).toContain('md:grid-cols-4');
  });
});
