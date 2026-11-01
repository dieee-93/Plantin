/**
 * Botanical metrics and aspect ratio calibration per species for 3D plant billboards.
 *
 * Sprites are rendered as vertical billboard planes. To prevent unnatural stretching,
 * squishing, or distortion (e.g. low-growing lettuce deformed vertically into a tall bush),
 * all instances maintain their true image cutout aspect ratio (width / height) and scale
 * according to botanical phenotype.
 */

export type PlantPhenotype = 'squat' | 'spreading' | 'bushy' | 'erect';

export interface PlantBotanicalMetric {
  cropCode: string;
  speciesName: string;
  /** Real texture cutout aspect ratio (width / height) */
  aspectRatio: number;
  /** Phenotypic scale factor (e.g. erect tall corn vs. squat rosette lettuce) */
  heightMultiplier: number;
  phenotype: PlantPhenotype;
  /** Fallback sprite folder if dedicated textures are not yet on disk */
  fallbackSpriteCode?: string;
}

/**
 * Standard elevation in meters above the 3D ground plane.
 * Matches canopy ring elevation (0.02 m) and clears walkable paths (0.015 m) without clipping or floating.
 */
export const PLANT_GROUND_ELEVATION_M = 0.02;

/**
 * Exact metrics measured from plant sprite textures in public/textures/plants/
 */
export const PLANT_BOTANICAL_METRICS: Record<string, PlantBotanicalMetric> = {
  // Tomato: erect indeterminate/determinate vine or bush (240x165 px)
  TOM: {
    cropCode: 'TOM',
    speciesName: 'Tomate',
    aspectRatio: 240 / 165, // ~1.4545
    heightMultiplier: 1.35,
    phenotype: 'erect',
  },
  // Lettuce: low-growing squat basal rosette resting on soil (210x72 px)
  LETTUCE: {
    cropCode: 'LETTUCE',
    speciesName: 'Lechuga',
    aspectRatio: 210 / 72, // ~2.9167
    heightMultiplier: 0.95,
    phenotype: 'squat',
  },
  // Carrot: low delicate feathery foliage (210x90 px)
  CARROT: {
    cropCode: 'CARROT',
    speciesName: 'Zanahoria',
    aspectRatio: 210 / 90, // ~2.3333
    heightMultiplier: 0.9,
    phenotype: 'squat',
  },
  // Citrus Orange: woody shrub / small tree with elevated canopy (240x180 px)
  CITRUS_ORANGE: {
    cropCode: 'CITRUS_ORANGE',
    speciesName: 'Cítrico / Naranjo',
    aspectRatio: 240 / 180, // ~1.3333
    heightMultiplier: 1.4,
    phenotype: 'erect',
  },
  // Hemp: tall erect fibrous stalk plant (240x180 px)
  HEMP: {
    cropCode: 'HEMP',
    speciesName: 'Cáñamo',
    aspectRatio: 240 / 180, // ~1.3333
    heightMultiplier: 1.5,
    phenotype: 'erect',
  },
  // Onion: compact low bulb with slender foliage (210x78 px)
  ONION: {
    cropCode: 'ONION',
    speciesName: 'Cebolla',
    aspectRatio: 210 / 78, // ~2.6923
    heightMultiplier: 0.9,
    phenotype: 'squat',
  },
  // Pepper: compact bushy upright plant (240x150 px)
  PEPPER_SWEET: {
    cropCode: 'PEPPER_SWEET',
    speciesName: 'Pimiento / Morrón',
    aspectRatio: 240 / 150, // 1.6000
    heightMultiplier: 1.15,
    phenotype: 'bushy',
  },
  // Squash: expansive spreading vine with large ground leaves (240x150 px)
  SQUASH: {
    cropCode: 'SQUASH',
    speciesName: 'Calabaza / Zapallo',
    aspectRatio: 240 / 150, // 1.6000
    heightMultiplier: 0.95,
    phenotype: 'spreading',
  },
  // Corn / Maize: tall erect cereal stalk (uses HEMP upright stalk texture as sprite fallback)
  CORN: {
    cropCode: 'CORN',
    speciesName: 'Maíz / Choclo',
    aspectRatio: 240 / 180, // ~1.3333
    heightMultiplier: 1.8,
    phenotype: 'erect',
    fallbackSpriteCode: 'HEMP',
  },
};

const DEFAULT_METRIC: PlantBotanicalMetric = {
  cropCode: 'DEFAULT',
  speciesName: 'General',
  aspectRatio: 1.4,
  heightMultiplier: 1.0,
  phenotype: 'bushy',
};

/**
 * Resolves any cropCode variant or common species label to the canonical crop code.
 */
export function resolveCanonicalCropCode(cropCode?: string, label?: string): string {
  const code = (cropCode || '').toUpperCase().trim();
  const name = (label || '').toLowerCase().trim();

  if (code === 'TOM' || code === 'TOMATO' || name.includes('tomat')) {
    return 'TOM';
  }
  if (code === 'CARROT' || name.includes('zanahori')) {
    return 'CARROT';
  }
  if (
    code === 'PEPPER' ||
    code === 'PEPPER_SWEET' ||
    name.includes('morr') ||
    name.includes('pimiento')
  ) {
    return 'PEPPER_SWEET';
  }
  if (code === 'SQUASH' || name.includes('zapall') || name.includes('calabaz')) {
    return 'SQUASH';
  }
  if (code === 'LETTUCE' || name.includes('lechug')) {
    return 'LETTUCE';
  }
  if (code === 'CITRUS_ORANGE' || name.includes('naranj') || name.includes('citric')) {
    return 'CITRUS_ORANGE';
  }
  if (code === 'ONION' || name.includes('ceboll')) {
    return 'ONION';
  }
  if (code === 'HEMP' || name.includes('cáñam') || name.includes('canam')) {
    return 'HEMP';
  }
  if (
    code === 'CORN' ||
    code === 'MAI' ||
    name.includes('maiz') ||
    name.includes('maíz') ||
    name.includes('choclo') ||
    name.includes('corn')
  ) {
    return 'CORN';
  }
  return code;
}

/**
 * Returns the botanical metric configuration for the given cropCode or label.
 */
export function getPlantBotanicalMetrics(cropCode?: string, label?: string): PlantBotanicalMetric {
  const canonical = resolveCanonicalCropCode(cropCode, label);
  return PLANT_BOTANICAL_METRICS[canonical] ?? DEFAULT_METRIC;
}

export interface PlantDimensionsResult {
  widthM: number;
  heightM: number;
  aspectRatio: number;
}

/**
 * Calculates billboard width and height in meters ensuring:
 * 1. The exact image aspect ratio (widthM / heightM == aspectRatio) is 100% preserved.
 * 2. Dimensions scale proportionally to canopy spread and botanical phenotype.
 * 3. Never stretches or deforms horizontally or vertically.
 */
export function calculatePlantDimensions(
  cropCode?: string,
  radiusM: number = 0.2,
  customBodyHeightM?: number,
  label?: string,
): PlantDimensionsResult {
  const metric = getPlantBotanicalMetrics(cropCode, label);
  const minWidthM = 0.15;
  const minHeightM = 0.08;

  // Ground diameter based on canopy radius
  const diameterM = Math.max(0.12, radiusM * 2.0);

  let finalWidthM: number;
  let finalHeightM: number;

  if (metric.phenotype === 'squat' || metric.phenotype === 'spreading') {
    // For squat rosettes (lettuce, onion, carrot) and spreading plants (squash),
    // ground footprint is bounded by canopy diameter, and height sits low on the soil.
    finalWidthM = Math.max(minWidthM, diameterM * metric.heightMultiplier);
    finalHeightM = Math.max(minHeightM, finalWidthM / metric.aspectRatio);
    // Align width strictly so finalWidthM / finalHeightM === metric.aspectRatio
    finalWidthM = finalHeightM * metric.aspectRatio;
  } else {
    // For bushy and erect plants (tomato, corn, citrus, hemp, pepper),
    // height scales with vertical growth habit.
    const rawHeight =
      customBodyHeightM && customBodyHeightM > 0
        ? customBodyHeightM * (metric.heightMultiplier / 1.35)
        : (diameterM / metric.aspectRatio) * metric.heightMultiplier;

    finalHeightM = Math.max(minHeightM, rawHeight);
    finalWidthM = Math.max(minWidthM, finalHeightM * metric.aspectRatio);
    // Align height strictly so finalWidthM / finalHeightM === metric.aspectRatio
    finalHeightM = finalWidthM / metric.aspectRatio;
  }

  return {
    widthM: finalWidthM,
    heightM: finalHeightM,
    aspectRatio: metric.aspectRatio,
  };
}
