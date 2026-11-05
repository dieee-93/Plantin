import {
  classifySpacePoint,
  type ComputedSpaceRegions,
  type WallSegmentCm,
} from './spaceGeometry';
import {
  computeShadowLengthCm,
  computeSunPosition,
  type PlacedPlantSpatialCm,
  type SolarSeason,
} from './solarAndPlantSpatial';
import type { LocationType } from './location';
import type { Individual } from './individual';
import { useSpaceLayoutStore } from '@/store/spaceLayoutStore';
import { useIndividualStore } from '@/store/individualStore';

export type PlantingDiagnosticSeverity = 'error' | 'warning' | 'positive';

export type PlantingDiagnosticKind =
  | 'invalid_surface'
  | 'crowding'
  | 'sunlight_deficit'
  | 'companion_conflict'
  | 'companion_synergy';

export interface PlantingDiagnosticIssue {
  plantId: string;
  kind: PlantingDiagnosticKind;
  severity: PlantingDiagnosticSeverity;
  message: string;
  relatedPlantId?: string;
  details?: Record<string, unknown>;
}

export interface PlantingStagingEvaluationInput {
  stagedPlants: PlacedPlantSpatialCm[];
  existingPlants: PlacedPlantSpatialCm[];
  regions: ComputedSpaceRegions;
  walls: WallSegmentCm[];
  solarConfig: {
    latitudeDeg: number;
    northAngleDeg?: number;
    season: SolarSeason;
    hourOfDay: number;
  };
  hasGrowLights?: boolean;
  locationType?: LocationType;
  ambientTempC?: number;
}

export interface PlantingValidationReport {
  stagedCount: number;
  canCommit: boolean;
  errorCount: number;
  warningCount: number;
  synergyCount: number;
  issues: PlantingDiagnosticIssue[];
  issuesByPlantId: Record<string, PlantingDiagnosticIssue[]>;
}

export function normalizeCropCode(code?: string): string {
  if (!code) return '';
  const lower = code.trim().toLowerCase();
  if (lower === 'tom' || lower.includes('tomato') || lower.includes('tomate')) return 'tomato';
  if (lower === 'pep' || lower.includes('pepper') || lower.includes('morron') || lower.includes('pimiento')) return 'pepper';
  if (lower === 'mai' || lower.includes('corn') || lower.includes('maiz')) return 'corn';
  if (lower === 'pot' || lower.includes('potato') || lower.includes('papa')) return 'potato';
  if (lower === 'fen' || lower.includes('fennel') || lower.includes('hinojo')) return 'fennel';
  if (lower === 'bean' || lower.includes('beans') || lower.includes('poroto') || lower.includes('frijol')) return 'beans';
  if (lower === 'pea' || lower.includes('peas') || lower.includes('arveja')) return 'peas';
  if (lower === 'oni' || lower.includes('onion') || lower.includes('cebolla')) return 'onion';
  if (lower === 'gar' || lower.includes('garlic') || lower.includes('ajo')) return 'garlic';
  if (lower === 'bas' || lower.includes('basil') || lower.includes('albahaca')) return 'basil';
  if (lower === 'car' || lower.includes('carrot') || lower.includes('zanahoria')) return 'carrot';
  if (lower === 'let' || lower.includes('lettuce') || lower.includes('lechuga')) return 'lettuce';
  if (lower === 'squ' || lower.includes('squash') || lower.includes('zapallo') || lower.includes('calabaza')) return 'squash';
  return lower;
}

const FULL_SUN_CROPS = new Set([
  'tomato',
  'pepper',
  'corn',
  'basil',
  'sunflower',
  'hemp',
  'sun',
  'sun_oil',
  'can',
]);

function isFullSunCrop(code?: string): boolean {
  if (!code) return true;
  const norm = normalizeCropCode(code);
  return FULL_SUN_CROPS.has(norm) || norm.includes('sunflower') || norm.includes('hemp');
}

const INCOMPATIBLE_PAIRS: [string, string][] = [
  ['tomato', 'corn'],
  ['tomato', 'potato'],
  ['tomato', 'fennel'],
  ['pepper', 'fennel'],
  ['pepper', 'beans'],
  ['onion', 'beans'],
  ['onion', 'peas'],
  ['garlic', 'beans'],
  ['garlic', 'peas'],
];

const BENEFICIAL_SYNERGIES: [string, string][] = [
  ['tomato', 'basil'],
  ['tomato', 'carrot'],
  ['tomato', 'lettuce'],
  ['corn', 'squash'],
  ['corn', 'beans'],
  ['carrot', 'lettuce'],
  ['carrot', 'onion'],
];

export function checkCompanionRelationship(
  cropA: string,
  cropB: string,
): 'conflict' | 'synergy' | 'neutral' {
  if (!cropA || !cropB) return 'neutral';
  const a = normalizeCropCode(cropA);
  const b = normalizeCropCode(cropB);
  if (!a || !b) return 'neutral';

  const isConflict = INCOMPATIBLE_PAIRS.some(
    ([c1, c2]) => (a === c1 && b === c2) || (a === c2 && b === c1),
  );
  if (isConflict) return 'conflict';

  const isSynergy = BENEFICIAL_SYNERGIES.some(
    ([c1, c2]) => (a === c1 && b === c2) || (a === c2 && b === c1),
  );
  if (isSynergy) return 'synergy';

  return 'neutral';
}

export function evaluatePlantingStagingDiagnostics(
  input: PlantingStagingEvaluationInput,
): PlantingValidationReport {
  const {
    stagedPlants,
    existingPlants,
    regions,
    walls,
    solarConfig,
    hasGrowLights = false,
  } = input;

  const issues: PlantingDiagnosticIssue[] = [];
  const issuesByPlantId: Record<string, PlantingDiagnosticIssue[]> = {};

  const addIssue = (issue: PlantingDiagnosticIssue) => {
    issues.push(issue);
    if (!issuesByPlantId[issue.plantId]) {
      issuesByPlantId[issue.plantId] = [];
    }
    issuesByPlantId[issue.plantId].push(issue);
  };

  const allPlants: PlacedPlantSpatialCm[] = [...existingPlants, ...stagedPlants];

  // Pre-calculate solar position once if applicable
  const sun = !hasGrowLights ? computeSunPosition(solarConfig) : null;
  const lx = sun ? -sun.sceneDirection.x : 0;
  const ly = sun ? -sun.sceneDirection.z : 0;

  for (const plant of stagedPlants) {
    // 1. invalid_surface (error)
    const surfaceType = classifySpacePoint({ x: plant.xCm, y: plant.yCm }, regions);
    if (surfaceType !== 'cultivable') {
      addIssue({
        plantId: plant.id,
        kind: 'invalid_surface',
        severity: 'error',
        message: 'Fuera de superficie cultivable',
        details: { surfaceType, point: { x: plant.xCm, y: plant.yCm } },
      });
    }

    // 2. crowding (warning)
    for (const other of allPlants) {
      if (other.id === plant.id) continue;
      const dx = other.xCm - plant.xCm;
      const dy = other.yCm - plant.yCm;
      const distanceCm = Math.hypot(dx, dy);
      const requiredRadiusSum = plant.canopyRadiusCm + other.canopyRadiusCm;
      const clearanceCm = Math.round((distanceCm - requiredRadiusSum) * 10) / 10;
      if (clearanceCm < 0) {
        addIssue({
          plantId: plant.id,
          kind: 'crowding',
          severity: 'warning',
          message: 'Solapamiento de copa con vecina',
          relatedPlantId: other.id,
          details: {
            neighborLabel: other.label,
            distanceCm: Math.round(distanceCm * 10) / 10,
            clearanceCm,
          },
        });
      }
    }

    // 3. sunlight_deficit (warning)
    if (!hasGrowLights && sun && sun.isDaylight && sun.elevationDeg > 0 && isFullSunCrop(plant.cropCode)) {
      for (const wall of walls) {
        if (wall.heightCm < 150) continue;
        const shadowLengthCm = computeShadowLengthCm(wall.heightCm, sun.elevationDeg);
        const maxShadowDistCm = Math.min(shadowLengthCm, wall.heightCm * 0.8);
        if (maxShadowDistCm <= 0) continue;

        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const len = Math.hypot(dx, dy);
        if (len === 0) continue;

        const ux = dx / len;
        const uy = dy / len;
        const nx = -uy;
        const ny = ux;

        const t = (plant.xCm - wall.start.x) * ux + (plant.yCm - wall.start.y) * uy;
        const dSigned = (plant.xCm - wall.start.x) * nx + (plant.yCm - wall.start.y) * ny;
        const dPerp = Math.abs(dSigned);

        const lightN = lx * nx + ly * ny;
        if (Math.abs(lightN) > 1e-4) {
          const isInShadowSide = dSigned * lightN > 0;
          const isAlongWall = t >= -plant.canopyRadiusCm && t <= len + plant.canopyRadiusCm;

          if (isInShadowSide && isAlongWall && dPerp < maxShadowDistCm) {
            addIssue({
              plantId: plant.id,
              kind: 'sunlight_deficit',
              severity: 'warning',
              message: 'Sombra proyectada por muro / Posible falta de sol directo',
              details: {
                wallId: wall.id,
                wallHeightCm: wall.heightCm,
                distanceToWallCm: Math.round(dPerp * 10) / 10,
                shadowLengthCm: Math.round(shadowLengthCm * 10) / 10,
                maxShadowDistCm: Math.round(maxShadowDistCm * 10) / 10,
              },
            });
            break;
          }
        }
      }
    }

    // 4. companion_conflict (warning) & companion_synergy (positive)
    for (const other of allPlants) {
      if (other.id === plant.id) continue;
      const dx = other.xCm - plant.xCm;
      const dy = other.yCm - plant.yCm;
      const distanceCm = Math.hypot(dx, dy);
      if (distanceCm < 80) {
        const rel = checkCompanionRelationship(plant.cropCode ?? '', other.cropCode ?? '');
        if (rel === 'conflict') {
          addIssue({
            plantId: plant.id,
            kind: 'companion_conflict',
            severity: 'warning',
            message: `Incompatibilidad de asociación con ${other.label || other.cropCode || 'vecina'}`,
            relatedPlantId: other.id,
            details: {
              plantCrop: plant.cropCode,
              neighborCrop: other.cropCode,
              distanceCm: Math.round(distanceCm * 10) / 10,
            },
          });
        } else if (rel === 'synergy') {
          addIssue({
            plantId: plant.id,
            kind: 'companion_synergy',
            severity: 'positive',
            message: `Sinergia de asociación benéfica con ${other.label || other.cropCode || 'vecina'}`,
            relatedPlantId: other.id,
            details: {
              plantCrop: plant.cropCode,
              neighborCrop: other.cropCode,
              distanceCm: Math.round(distanceCm * 10) / 10,
            },
          });
        }
      }
    }
  }

  const stagedCount = stagedPlants.length;
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const synergyCount = issues.filter((i) => i.severity === 'positive').length;
  const canCommit = stagedCount > 0 && errorCount === 0;

  return {
    stagedCount,
    canCommit,
    errorCount,
    warningCount,
    synergyCount,
    issues,
    issuesByPlantId,
  };
}

export interface CommitPlantingSessionOptions {
  locationId: string;
  stagedPlants: PlacedPlantSpatialCm[];
  accessionId?: string;
  seedLotId?: string;
}

export interface CommitPlantingSessionResult {
  committedPlants: PlacedPlantSpatialCm[];
  createdIndividuals: Individual[];
}

export function commitPlantingSessionToStores(
  options: CommitPlantingSessionOptions,
): CommitPlantingSessionResult {
  const { locationId, stagedPlants, accessionId, seedLotId } = options;
  if (!stagedPlants || stagedPlants.length === 0) {
    return { committedPlants: [], createdIndividuals: [] };
  }

  const committedPlants = useSpaceLayoutStore
    .getState()
    .commitStagedPlants(locationId, stagedPlants);

  const individualStore = useIndividualStore.getState();
  const existingIndividuals = individualStore.individuals;
  const todayIso = new Date().toISOString().split('T')[0];
  const createdIndividuals: Individual[] = [];

  for (const plant of committedPlants) {
    const alreadyExists = existingIndividuals.some(
      (ind) => ind.slotId === plant.id || ind.id === plant.id,
    );
    if (!alreadyExists) {
      const created = individualStore.add({
        slotId: plant.id,
        label: plant.label,
        accessionId: accessionId ?? `acc-${plant.cropCode || 'gen'}`,
        seedLotId,
        locationId,
        plantingDate: todayIso,
        status: 'active',
      });
      createdIndividuals.push(created);
    }
  }

  return { committedPlants, createdIndividuals };
}
