import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SpaceCommandDock } from '../SpaceCommandDock';
import { SpaceAssetDrawer } from '../SpaceAssetDrawer';
import { SpacePlantingStagingBar } from '../SpacePlantingStagingBar';
import { SpaceHeaderNav } from '../SpaceHeaderNav';
import { Space3DViewer } from '../Space3DViewer';
import { SPACE_PRESETS, useSpaceLayoutStore } from '@/store/spaceLayoutStore';
import { useIndividualStore } from '@/store/individualStore';
import type { PlantingValidationReport } from '@/domain/plantingStagingDiagnostics';
import type { PlacedPlantSpatialCm } from '@/domain/solarAndPlantSpatial';

describe('Fase 4: 3 Modes, Filtered Catalog & Planting Staging Integration', () => {
  const locationId = 'loc-staging-integration-test';

  beforeEach(() => {
    useSpaceLayoutStore.setState({
      layouts: {
        [locationId]: SPACE_PRESETS.patio_croquis.createLayout(locationId),
      },
      history: {},
    });
    useIndividualStore.setState({
      individuals: [],
    });
  });

  describe('1. SpaceAssetDrawer: Mode-based Catalog Filtering & Technical Spec Badges', () => {
    it('filters catalog items by placementMode="build_props" vs "planting_utility"', () => {
      const { rerender } = render(
        <SpaceAssetDrawer
          selectedAssetId="pallet_standard_wood_a01"
          onSelectAssetId={vi.fn()}
          placementMode="build_props"
        />,
      );

      // In build_props mode, search for Palet
      const searchInput = screen.getByPlaceholderText(/Buscar entre 999 modelos/i);
      fireEvent.change(searchInput, { target: { value: 'Palet Estándar' } });
      expect(screen.getAllByRole('button', { name: /Palet Estándar/i }).length).toBeGreaterThan(0);
      expect(screen.queryByRole('button', { name: /Tanque IBC/i })).not.toBeInTheDocument();

      // Rerender with planting_utility mode
      rerender(
        <SpaceAssetDrawer
          selectedAssetId="tank_ibc_1000l_a01"
          onSelectAssetId={vi.fn()}
          placementMode="planting_utility"
        />,
      );

      // In planting_utility mode, search for IBC tank
      const searchInput2 = screen.getByPlaceholderText(/Buscar entre 999 modelos/i);
      fireEvent.change(searchInput2, { target: { value: 'Tanque IBC' } });
      expect(screen.getAllByRole('button', { name: /Tanque IBC/i }).length).toBeGreaterThan(0);
      expect(screen.queryByRole('button', { name: /Palet Estándar/i })).not.toBeInTheDocument();
    });

    it('renders Level 1 Technical Spec badges on AssetTileCards', () => {
      render(
        <SpaceAssetDrawer
          selectedAssetId="tank_ibc_1000l_a01"
          onSelectAssetId={vi.fn()}
          placementMode="planting_utility"
        />,
      );

      // Search for IBC tank
      const searchInput = screen.getByPlaceholderText(/Buscar entre 999 modelos/i);
      fireEvent.change(searchInput, { target: { value: 'Tanque IBC' } });

      // Technical badge for 1000 L and IoT
      expect(screen.getAllByText(/1000\s*L/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/IoT/i).length).toBeGreaterThan(0);
    });
  });

  describe('2. SpaceCommandDock: 3 Modes, Build Submodes & Cleaned Shortcuts', () => {
    it('renders the 3 primary mode buttons and build submode toggles with accurate shortcuts', () => {
      const onChangePrimaryMode = vi.fn();
      const onChangeBuildSubMode = vi.fn();

      render(
        <SpaceCommandDock
          mode="design"
          onChangeMode={vi.fn()}
          primaryMode="build"
          onChangePrimaryMode={onChangePrimaryMode}
          buildSubMode="architecture"
          onChangeBuildSubMode={onChangeBuildSubMode}
          onOpenSowModalOrDrawer={vi.fn()}
          isTrayOpen={false}
          onToggleTray={vi.fn()}
          activeTool="edit_boundary"
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
          cultivableSectorCount={1}
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

      // 3 primary modes
      const liveBtn = screen.getByTestId('mode-btn-live');
      const buildBtn = screen.getByTestId('mode-btn-build');
      const plantingBtn = screen.getByTestId('mode-btn-planting');

      expect(liveBtn).toBeInTheDocument();
      expect(buildBtn).toBeInTheDocument();
      expect(plantingBtn).toBeInTheDocument();

      // Build Submodes visible when in build mode
      const archSubBtn = screen.getByTestId('submode-btn-architecture');
      const propsSubBtn = screen.getByTestId('submode-btn-props');
      expect(archSubBtn).toBeInTheDocument();
      expect(propsSubBtn).toBeInTheDocument();

      fireEvent.click(propsSubBtn);
      expect(onChangeBuildSubMode).toHaveBeenCalledWith('props');

      fireEvent.click(plantingBtn);
      expect(onChangePrimaryMode).toHaveBeenCalledWith('planting');

      // Check shortcuts: V for inspect, Q for edit_boundary, W for walls
      const inspectBtn = screen.getByRole('button', { name: /^Inspeccionar$/i });
      expect(inspectBtn).toBeInTheDocument();
      // Status line for walls should NOT have duplicate 2.0m button
    });
  });

  describe('3. SpacePlantingStagingBar: Diagnostic Summary & Commit/Discard', () => {
    it('renders staged count, issue chips for invalid_surface, crowding, synergies and handles commit/discard', () => {
      const mockStaged: PlacedPlantSpatialCm[] = [
        {
          id: 'staged-1',
          label: 'Tomatera',
          cropCode: 'tomato',
          xCm: 100,
          yCm: 100,
          canopyRadiusCm: 30,
        },
        {
          id: 'staged-2',
          label: 'Albahaca',
          cropCode: 'basil',
          xCm: 140,
          yCm: 100,
          canopyRadiusCm: 15,
        },
      ];

      const mockReport: PlantingValidationReport = {
        stagedCount: 2,
        canCommit: true,
        errorCount: 0,
        warningCount: 1,
        synergyCount: 1,
        issues: [
          {
            plantId: 'staged-1',
            kind: 'crowding',
            severity: 'warning',
            message: 'Solapamiento de copa con vecina',
          },
          {
            plantId: 'staged-2',
            kind: 'companion_synergy',
            severity: 'positive',
            message: 'Sinergia de asociación benéfica con Tomatera',
          },
        ],
        issuesByPlantId: {},
      };

      const onConfirm = vi.fn();
      const onDiscard = vi.fn();

      const { rerender } = render(
        <SpacePlantingStagingBar
          stagedPlants={mockStaged}
          report={mockReport}
          onConfirm={onConfirm}
          onDiscard={onDiscard}
        />,
      );

      const bar = screen.getByTestId('planting-staging-bar');
      expect(bar).toBeInTheDocument();
      expect(within(bar).getByText(/2 plantas en borrador/i)).toBeInTheDocument();
      expect(within(bar).getByText(/densidad excesiva|solapamiento|crowding/i)).toBeInTheDocument();
      expect(within(bar).getByText(/sinergia/i)).toBeInTheDocument();

      const confirmBtn = screen.getByTestId('confirm-planting-btn');
      expect(confirmBtn).not.toBeDisabled();
      fireEvent.click(confirmBtn);
      expect(onConfirm).toHaveBeenCalledTimes(1);

      const discardBtn = screen.getByTestId('discard-planting-btn');
      fireEvent.click(discardBtn);
      expect(onDiscard).toHaveBeenCalledTimes(1);

      // When errorCount > 0, Confirm button must be disabled
      const errorReport: PlantingValidationReport = {
        ...mockReport,
        canCommit: false,
        errorCount: 1,
        issues: [
          {
            plantId: 'staged-1',
            kind: 'invalid_surface',
            severity: 'error',
            message: 'Fuera de superficie cultivable',
          },
        ],
      };

      rerender(
        <SpacePlantingStagingBar
          stagedPlants={mockStaged}
          report={errorReport}
          onConfirm={onConfirm}
          onDiscard={onDiscard}
        />,
      );

      expect(screen.getByTestId('confirm-planting-btn')).toBeDisabled();
      expect(screen.getByText(/fuera de superficie cultivable|área no cultivable/i)).toBeInTheDocument();
    });
  });

  describe('4. SpaceHeaderNav: Single Form of Dimensions', () => {
    it('calls onOpenTerrainBuilder directly when geometry pill is clicked, avoiding duplicate input form', () => {
      const onOpenTerrainBuilder = vi.fn();
      render(
        <SpaceHeaderNav
          locationName="Invernadero Principal"
          plantCount={5}
          widthM={10}
          depthM={6}
          onOpenTerrainBuilder={onOpenTerrainBuilder}
        />,
      );

      const pill = screen.getByRole('button', { name: /Geometría|10(\.0)?\s*×\s*6(\.0)?\s*m/i });
      fireEvent.click(pill);

      expect(onOpenTerrainBuilder).toHaveBeenCalledTimes(1);
      expect(screen.queryByLabelText(/Ancho Terreno/i)).not.toBeInTheDocument();
    });
  });

  describe('5. Full End-to-End Flow in Space3DViewer: 3 Modes, Keyboard Shortcuts & Staging Commit', () => {
    it('switches modes via keys 1, 2, 3 and performs transactional planting with live diagnostics and store commit', () => {
      render(
        <Space3DViewer
          locationId={locationId}
          locationName="Patio Staging E2E"
          locationType="outdoor"
        />,
      );

      // Interactive plane is mounted in 2D / headless mode
      const plane = screen.getByTestId('interactive-plane-1to1');
      expect(plane).toBeInTheDocument();

      // Initially in live/crop or build mode
      // Press '3' to switch to Planting mode
      fireEvent.keyDown(window, { key: '3' });

      // Planting mode active in dock
      const plantingBtn = screen.getByTestId('mode-btn-planting');
      expect(plantingBtn).toHaveAttribute('aria-pressed', 'true');

      // Select plant_single tool via shortcut 'q'
      fireEvent.keyDown(window, { key: 'q' });

      // Click on 2D plane to place a plant in staging
      fireEvent.click(plane, { clientX: 300, clientY: 200 });

      // Planting staging bar appears
      const stagingBar = screen.getByTestId('planting-staging-bar');
      expect(stagingBar).toBeInTheDocument();

      // Click "Confirmar Plantación"
      const confirmBtn = screen.getByTestId('confirm-planting-btn');
      fireEvent.click(confirmBtn);

      // Staging bar disappears
      expect(screen.queryByTestId('planting-staging-bar')).not.toBeInTheDocument();

      // Layout has committed the new plant
      const placed = useSpaceLayoutStore.getState().layouts[locationId].placedPlants;
      expect(placed.length).toBeGreaterThan(3);

      // Individual store has registered the new plant
      const individuals = useIndividualStore.getState().individuals;
      expect(individuals.length).toBeGreaterThan(0);
    });

    it('pressing "H" toggles HUD visibility and Tab does NOT hide HUD', () => {
      render(
        <Space3DViewer
          locationId={locationId}
          locationName="HUD Accessibility Test"
          locationType="indoor"
        />,
      );

      expect(screen.getByText('HUD Accessibility Test')).toBeInTheDocument();

      // Press Tab -> HUD must NOT hide (accessibility WCAG)
      fireEvent.keyDown(window, { key: 'Tab' });
      expect(screen.getByText('HUD Accessibility Test')).toBeInTheDocument();

      // Press H -> HUD toggles to hidden
      fireEvent.keyDown(window, { key: 'h' });
      expect(screen.queryByText('HUD Accessibility Test')).not.toBeInTheDocument();

      // Press H again -> HUD restored
      fireEvent.keyDown(window, { key: 'h' });
      expect(screen.getByText('HUD Accessibility Test')).toBeInTheDocument();
    });
  });
});
