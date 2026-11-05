import { beforeEach, describe, expect, it } from 'vitest';
import {
  evaluatePlantingStagingDiagnostics,
  commitPlantingSessionToStores,
  type PlantingStagingEvaluationInput,
  type PlantingDiagnosticIssue,
  type PlantingValidationReport,
} from '../plantingStagingDiagnostics';
import {
  computeSpaceRegions,
  createPerimeterWalls,
  createRectPolygon,
  type ComputedSpaceRegions,
  type WallSegmentCm,
} from '../spaceGeometry';
import type { PlacedPlantSpatialCm } from '../solarAndPlantSpatial';
import { useSpaceLayoutStore } from '@/store/spaceLayoutStore';
import { useIndividualStore } from '@/store/individualStore';

describe('plantingStagingDiagnostics - Slice 1: Pre-Planting Diagnostic Engine', () => {
  const boundary = createRectPolygon(1000, 600); // 10m x 6m
  const regions: ComputedSpaceRegions = computeSpaceRegions(
    boundary,
    [],
    [
      {
        id: 'central-path',
        points: [
          { x: 500, y: 0 },
          { x: 500, y: 600 },
        ],
        widthCm: 100,
        material: 'gravel',
      },
    ],
  );
  const walls: WallSegmentCm[] = createPerimeterWalls(boundary, 200, 'brick');

  const baseInput: PlantingStagingEvaluationInput = {
    stagedPlants: [],
    existingPlants: [],
    regions,
    walls,
    solarConfig: {
      latitudeDeg: -34.6, // Buenos Aires
      season: 'winter',
      hourOfDay: 12,
    },
    hasGrowLights: false,
  };

  it('returns empty report with canCommit = false when stagedPlants is empty', () => {
    const report = evaluatePlantingStagingDiagnostics(baseInput);

    expect(report.stagedCount).toBe(0);
    expect(report.canCommit).toBe(false);
    expect(report.errorCount).toBe(0);
    expect(report.warningCount).toBe(0);
    expect(report.synergyCount).toBe(0);
    expect(report.issues).toEqual([]);
    expect(report.issuesByPlantId).toEqual({});
  });

  describe('Rule 1: invalid_surface (error)', () => {
    it('detects when a staged plant is placed on a walkable path and flags invalid_surface error', () => {
      const plantOnPath: PlacedPlantSpatialCm = {
        id: 'staged-1',
        label: 'Tomatera en camino',
        cropCode: 'tomato',
        xCm: 500, // Inside the central path (width 100cm => 450 to 550)
        yCm: 300,
        canopyRadiusCm: 30,
      };

      const report = evaluatePlantingStagingDiagnostics({
        ...baseInput,
        stagedPlants: [plantOnPath],
      });

      expect(report.stagedCount).toBe(1);
      expect(report.errorCount).toBe(1);
      expect(report.canCommit).toBe(false);

      const issue = report.issues.find((i) => i.kind === 'invalid_surface');
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('error');
      expect(issue?.plantId).toBe('staged-1');
      expect(issue?.message).toMatch(/Fuera de superficie cultivable/i);
      expect(report.issuesByPlantId['staged-1']).toContainEqual(issue);
    });

    it('detects when a staged plant is placed outside room boundaries and flags invalid_surface error', () => {
      const plantOutside: PlacedPlantSpatialCm = {
        id: 'staged-out',
        label: 'Tomatera afuera',
        cropCode: 'tomato',
        xCm: 1200, // Outside (width is 1000)
        yCm: 300,
        canopyRadiusCm: 30,
      };

      const report = evaluatePlantingStagingDiagnostics({
        ...baseInput,
        stagedPlants: [plantOutside],
      });

      expect(report.errorCount).toBe(1);
      expect(report.canCommit).toBe(false);
      expect(report.issues[0].kind).toBe('invalid_surface');
      expect(report.issues[0].severity).toBe('error');
    });

    it('allows committing when staged plant is in cultivable soil without errors', () => {
      const plantInSoil: PlacedPlantSpatialCm = {
        id: 'staged-ok',
        label: 'Tomatera en cantero',
        cropCode: 'tomato',
        xCm: 250,
        yCm: 300,
        canopyRadiusCm: 30,
      };

      const report = evaluatePlantingStagingDiagnostics({
        ...baseInput,
        stagedPlants: [plantInSoil],
      });

      expect(report.errorCount).toBe(0);
      expect(report.canCommit).toBe(true);
      expect(report.issues.some((i) => i.kind === 'invalid_surface')).toBe(false);
    });
  });

  describe('Rule 2: crowding (warning)', () => {
    it('flags crowding warning when staged plant overlaps canopy with an existing plant', () => {
      const existingPlant: PlacedPlantSpatialCm = {
        id: 'exist-1',
        label: 'Tomatera Existente',
        cropCode: 'tomato',
        xCm: 200,
        yCm: 300,
        canopyRadiusCm: 30,
      };
      const stagedPlant: PlacedPlantSpatialCm = {
        id: 'staged-crowded',
        label: 'Tomatera Nueva',
        cropCode: 'tomato',
        xCm: 240, // Distance = 40cm, needed = 30 + 30 = 60cm -> overlap of 20cm
        yCm: 300,
        canopyRadiusCm: 30,
      };

      const report = evaluatePlantingStagingDiagnostics({
        ...baseInput,
        existingPlants: [existingPlant],
        stagedPlants: [stagedPlant],
      });

      expect(report.errorCount).toBe(0);
      expect(report.warningCount).toBeGreaterThanOrEqual(1);
      expect(report.canCommit).toBe(true); // Warnings do not block commit

      const crowdingIssue = report.issues.find(
        (i) => i.plantId === 'staged-crowded' && i.kind === 'crowding',
      );
      expect(crowdingIssue).toBeDefined();
      expect(crowdingIssue?.severity).toBe('warning');
      expect(crowdingIssue?.relatedPlantId).toBe('exist-1');
      expect(crowdingIssue?.message).toMatch(/Solapamiento de copa con vecina/i);
    });

    it('flags crowding warning between two staged plants in the same batch', () => {
      const stagedA: PlacedPlantSpatialCm = {
        id: 'staged-a',
        label: 'Morrón A',
        cropCode: 'pepper',
        xCm: 200,
        yCm: 300,
        canopyRadiusCm: 25,
      };
      const stagedB: PlacedPlantSpatialCm = {
        id: 'staged-b',
        label: 'Morrón B',
        cropCode: 'pepper',
        xCm: 230, // Distance = 30cm, needed = 25 + 25 = 50cm
        yCm: 300,
        canopyRadiusCm: 25,
      };

      const report = evaluatePlantingStagingDiagnostics({
        ...baseInput,
        stagedPlants: [stagedA, stagedB],
      });

      expect(report.issues.some((i) => i.plantId === 'staged-a' && i.kind === 'crowding')).toBe(true);
      expect(report.issues.some((i) => i.plantId === 'staged-b' && i.kind === 'crowding')).toBe(true);
    });
  });

  describe('Rule 3: sunlight_deficit (warning)', () => {
    it('flags sunlight_deficit when a full-sun plant is placed in the shadow strip of a high perimeter wall', () => {
      // Wall 0 goes from (0,0) to (1000,0) with height 200cm.
      // Winter noon in Buenos Aires: sun is North (-Z in 3D, -Y in 2D), casting shadow southward (+Y).
      // Max shadow depth = min(shadowLengthCm, wallHeight * 0.8) = min(~320cm, 160cm) = 160cm.
      const plantInShadow: PlacedPlantSpatialCm = {
        id: 'staged-shade-tomato',
        label: 'Tomate al pie del muro norte',
        cropCode: 'tomato',
        xCm: 250,
        yCm: 60, // 60cm from north wall (y=0) < 160cm
        canopyRadiusCm: 30,
      };

      const report = evaluatePlantingStagingDiagnostics({
        ...baseInput,
        stagedPlants: [plantInShadow],
      });

      const shadeIssue = report.issues.find(
        (i) => i.plantId === 'staged-shade-tomato' && i.kind === 'sunlight_deficit',
      );
      expect(shadeIssue).toBeDefined();
      expect(shadeIssue?.severity).toBe('warning');
      expect(shadeIssue?.message).toMatch(/Sombra proyectada por muro/i);
    });

    it('does NOT flag sunlight_deficit if hasGrowLights is true', () => {
      const plantInIndoor: PlacedPlantSpatialCm = {
        id: 'staged-indoor-tomato',
        label: 'Tomate bajo lámparas',
        cropCode: 'tomato',
        xCm: 250,
        yCm: 60,
        canopyRadiusCm: 30,
      };

      const report = evaluatePlantingStagingDiagnostics({
        ...baseInput,
        hasGrowLights: true,
        stagedPlants: [plantInIndoor],
      });

      expect(report.issues.some((i) => i.kind === 'sunlight_deficit')).toBe(false);
    });

    it('does NOT flag sunlight_deficit when wall height is below 150cm', () => {
      const lowWalls = createPerimeterWalls(boundary, 100, 'brick'); // 100cm < 150cm
      const plantNearLowWall: PlacedPlantSpatialCm = {
        id: 'staged-low-wall',
        label: 'Tomate cerca de muro bajo',
        cropCode: 'tomato',
        xCm: 250,
        yCm: 60,
        canopyRadiusCm: 30,
      };

      const report = evaluatePlantingStagingDiagnostics({
        ...baseInput,
        walls: lowWalls,
        stagedPlants: [plantNearLowWall],
      });

      expect(report.issues.some((i) => i.kind === 'sunlight_deficit')).toBe(false);
    });

    it('does NOT flag sunlight_deficit when plant is sufficiently far from the wall', () => {
      const plantFarFromWall: PlacedPlantSpatialCm = {
        id: 'staged-sunny',
        label: 'Tomate en pleno sol',
        cropCode: 'tomato',
        xCm: 250,
        yCm: 300, // 300cm > 160cm
        canopyRadiusCm: 30,
      };

      const report = evaluatePlantingStagingDiagnostics({
        ...baseInput,
        stagedPlants: [plantFarFromWall],
      });

      expect(report.issues.some((i) => i.kind === 'sunlight_deficit')).toBe(false);
    });
  });

  describe('Rule 4: companion_conflict (warning) & companion_synergy (positive)', () => {
    it('detects allelopathic incompatibility (tomato + corn) within 80cm and emits companion_conflict warning', () => {
      const tomato: PlacedPlantSpatialCm = {
        id: 'staged-tom',
        label: 'Tomatera Platense',
        cropCode: 'tomato',
        xCm: 200,
        yCm: 300,
        canopyRadiusCm: 25,
      };
      const corn: PlacedPlantSpatialCm = {
        id: 'staged-corn',
        label: 'Maíz Dulce',
        cropCode: 'corn',
        xCm: 260, // distance = 60cm < 80cm (no crowding since 25+25 = 50 < 60)
        yCm: 300,
        canopyRadiusCm: 25,
      };

      const report = evaluatePlantingStagingDiagnostics({
        ...baseInput,
        stagedPlants: [tomato, corn],
      });

      const conflict = report.issues.find(
        (i) => i.plantId === 'staged-tom' && i.kind === 'companion_conflict',
      );
      expect(conflict).toBeDefined();
      expect(conflict?.severity).toBe('warning');
      expect(conflict?.relatedPlantId).toBe('staged-corn');
    });

    it('detects incompatible pair: pepper + beans and onion + beans', () => {
      const pepper: PlacedPlantSpatialCm = {
        id: 'staged-pep',
        label: 'Morrón',
        cropCode: 'pepper',
        xCm: 200,
        yCm: 300,
        canopyRadiusCm: 20,
      };
      const beans: PlacedPlantSpatialCm = {
        id: 'staged-beans',
        label: 'Porotos Chaucha',
        cropCode: 'beans',
        xCm: 250, // 50cm apart
        yCm: 300,
        canopyRadiusCm: 20,
      };

      const report = evaluatePlantingStagingDiagnostics({
        ...baseInput,
        stagedPlants: [pepper, beans],
      });

      expect(
        report.issues.some(
          (i) => i.plantId === 'staged-pep' && i.kind === 'companion_conflict',
        ),
      ).toBe(true);
    });

    it('detects beneficial association (tomato + basil) within 80cm and emits companion_synergy positive issue', () => {
      const tomato: PlacedPlantSpatialCm = {
        id: 'staged-tom',
        label: 'Tomatera',
        cropCode: 'tomato',
        xCm: 200,
        yCm: 300,
        canopyRadiusCm: 25,
      };
      const basil: PlacedPlantSpatialCm = {
        id: 'staged-basil',
        label: 'Albahaca',
        cropCode: 'basil',
        xCm: 260, // 60cm distance
        yCm: 300,
        canopyRadiusCm: 15,
      };

      const report = evaluatePlantingStagingDiagnostics({
        ...baseInput,
        stagedPlants: [tomato, basil],
      });

      expect(report.synergyCount).toBeGreaterThanOrEqual(1);
      const synergy = report.issues.find(
        (i) => i.plantId === 'staged-tom' && i.kind === 'companion_synergy',
      );
      expect(synergy).toBeDefined();
      expect(synergy?.severity).toBe('positive');
      expect(synergy?.relatedPlantId).toBe('staged-basil');
    });

    it('detects Milpa synergy (corn + beans) and carrot + onion synergy', () => {
      const corn: PlacedPlantSpatialCm = {
        id: 'staged-corn',
        label: 'Maíz',
        cropCode: 'corn',
        xCm: 150,
        yCm: 300,
        canopyRadiusCm: 20,
      };
      const beans: PlacedPlantSpatialCm = {
        id: 'staged-beans',
        label: 'Porotos',
        cropCode: 'beans',
        xCm: 200,
        yCm: 300,
        canopyRadiusCm: 20,
      };

      const report = evaluatePlantingStagingDiagnostics({
        ...baseInput,
        stagedPlants: [corn, beans],
      });

      expect(
        report.issues.some(
          (i) => i.plantId === 'staged-corn' && i.kind === 'companion_synergy',
        ),
      ).toBe(true);
    });

    it('does NOT emit companion issues when distance between plants is >= 80cm', () => {
      const tomato: PlacedPlantSpatialCm = {
        id: 'staged-tom',
        label: 'Tomatera',
        cropCode: 'tomato',
        xCm: 100,
        yCm: 300,
        canopyRadiusCm: 25,
      };
      const corn: PlacedPlantSpatialCm = {
        id: 'staged-corn',
        label: 'Maíz',
        cropCode: 'corn',
        xCm: 200, // 100cm apart >= 80cm
        yCm: 300,
        canopyRadiusCm: 25,
      };

      const report = evaluatePlantingStagingDiagnostics({
        ...baseInput,
        stagedPlants: [tomato, corn],
      });

      expect(report.issues.some((i) => i.kind === 'companion_conflict')).toBe(false);
    });
  });
});

describe('plantingStagingDiagnostics - Slice 2: Atomic Transactional Commit (spaceLayoutStore + individualStore)', () => {
  const locationId = 'loc-test-staging';

  beforeEach(() => {
    useSpaceLayoutStore.getState().resetAll();
    useIndividualStore.setState({ individuals: [] });
  });

  it('commitStagedPlants inserts plants atomically into spaceLayoutStore with a single plant_batch_add history entry', () => {
    const store = useSpaceLayoutStore.getState();
    store.getOrCreateSpaceLayout(locationId, 'field', 'empty_lot_1to1');

    const stagedPlants: PlacedPlantSpatialCm[] = [
      { id: 'plant-commit-1', label: 'Tomate #1', cropCode: 'tomato', xCm: 150, yCm: 200, canopyRadiusCm: 30 },
      { id: 'plant-commit-2', label: 'Tomate #2', cropCode: 'tomato', xCm: 220, yCm: 200, canopyRadiusCm: 30 },
      { id: 'plant-commit-3', label: 'Albahaca #1', cropCode: 'basil', xCm: 290, yCm: 200, canopyRadiusCm: 20 },
    ];

    const committed = store.commitStagedPlants(locationId, stagedPlants);
    expect(committed).toHaveLength(3);

    const layout = useSpaceLayoutStore.getState().layouts[locationId];
    expect(layout.placedPlants).toHaveLength(3);
    expect(layout.placedPlants.map((p) => p.id)).toEqual([
      'plant-commit-1',
      'plant-commit-2',
      'plant-commit-3',
    ]);

    // History should have exactly 1 'plant_batch_add' entry
    const history = useSpaceLayoutStore.getState().history[locationId];
    expect(history.past).toHaveLength(1);
    expect(history.past[0].type).toBe('plant_batch_add');

    // A single undo should revert all 3 plants at once
    useSpaceLayoutStore.getState().undo(locationId);
    const layoutAfterUndo = useSpaceLayoutStore.getState().layouts[locationId];
    expect(layoutAfterUndo.placedPlants).toHaveLength(0);

    // A single redo should restore all 3 plants
    useSpaceLayoutStore.getState().redo(locationId);
    const layoutAfterRedo = useSpaceLayoutStore.getState().layouts[locationId];
    expect(layoutAfterRedo.placedPlants).toHaveLength(3);
  });

  it('commitPlantingSessionToStores synchronizes spaceLayoutStore and creates active Individual records in individualStore', () => {
    const store = useSpaceLayoutStore.getState();
    store.getOrCreateSpaceLayout(locationId, 'patio');

    const stagedPlants: PlacedPlantSpatialCm[] = [
      { id: 'plant-sync-1', label: 'Tomate Platense #01', cropCode: 'tomato', xCm: 120, yCm: 180, canopyRadiusCm: 25 },
      { id: 'plant-sync-2', label: 'Tomate Platense #02', cropCode: 'tomato', xCm: 180, yCm: 180, canopyRadiusCm: 25 },
    ];

    const result = commitPlantingSessionToStores({
      locationId,
      stagedPlants,
      accessionId: 'acc-tom-platense',
      seedLotId: 'lot-2026-01',
    });

    expect(result.committedPlants).toHaveLength(2);
    expect(result.createdIndividuals).toHaveLength(2);

    // Verify individualStore state
    const individuals = useIndividualStore.getState().individuals;
    expect(individuals).toHaveLength(2);

    expect(individuals[0].slotId).toBe('plant-sync-1');
    expect(individuals[0].label).toBe('Tomate Platense #01');
    expect(individuals[0].accessionId).toBe('acc-tom-platense');
    expect(individuals[0].seedLotId).toBe('lot-2026-01');
    expect(individuals[0].locationId).toBe(locationId);
    expect(individuals[0].status).toBe('active');
    expect(individuals[0].plantingDate).toBeDefined();

    // Verify idempotency / duplicate guard
    const secondCallResult = commitPlantingSessionToStores({
      locationId,
      stagedPlants,
      accessionId: 'acc-tom-platense',
    });

    // Staged plants already have slots, existing individuals shouldn't be duplicated
    expect(secondCallResult.createdIndividuals).toHaveLength(0);
    expect(useIndividualStore.getState().individuals).toHaveLength(2);
  });
});
