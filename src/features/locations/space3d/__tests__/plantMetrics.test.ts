import { describe, expect, it } from 'vitest';
import {
  calculatePlantDimensions,
  getPlantBotanicalMetrics,
  PLANT_BOTANICAL_METRICS,
  PLANT_GROUND_ELEVATION_M,
  resolveCanonicalCropCode,
} from '../plantMetrics';

describe('plantMetrics', () => {
  it('defines valid botanical metrics with accurate aspect ratios for all major crops', () => {
    const requiredCrops = [
      'TOM',
      'LETTUCE',
      'CARROT',
      'CITRUS_ORANGE',
      'HEMP',
      'ONION',
      'PEPPER_SWEET',
      'SQUASH',
      'CORN',
    ];

    for (const crop of requiredCrops) {
      const metric = PLANT_BOTANICAL_METRICS[crop];
      expect(metric).toBeDefined();
      expect(metric.aspectRatio).toBeGreaterThan(1.0); // all textures are landscape cutouts (wider than tall)
      expect(metric.heightMultiplier).toBeGreaterThan(0.5);
      expect(metric.phenotype).toMatch(/^(squat|spreading|bushy|erect)$/);
    }
  });

  it('measures specific aspect ratios matching physical texture files', () => {
    // Lettuce: 210 x 72 px cutout (~2.9167)
    expect(PLANT_BOTANICAL_METRICS.LETTUCE.aspectRatio).toBeCloseTo(210 / 72, 3);
    // Carrot: 210 x 90 px cutout (~2.3333)
    expect(PLANT_BOTANICAL_METRICS.CARROT.aspectRatio).toBeCloseTo(210 / 90, 3);
    // Onion: 210 x 78 px cutout (~2.6923)
    expect(PLANT_BOTANICAL_METRICS.ONION.aspectRatio).toBeCloseTo(210 / 78, 3);
    // Tomato: 240 x 165 px cutout (~1.4545)
    expect(PLANT_BOTANICAL_METRICS.TOM.aspectRatio).toBeCloseTo(240 / 165, 3);
    // Pepper: 240 x 150 px cutout (1.6)
    expect(PLANT_BOTANICAL_METRICS.PEPPER_SWEET.aspectRatio).toBeCloseTo(1.6, 3);
    // Squash: 240 x 150 px cutout (1.6)
    expect(PLANT_BOTANICAL_METRICS.SQUASH.aspectRatio).toBeCloseTo(1.6, 3);
    // Citrus: 240 x 180 px cutout (1.3333)
    expect(PLANT_BOTANICAL_METRICS.CITRUS_ORANGE.aspectRatio).toBeCloseTo(4 / 3, 3);
    // Hemp: 240 x 180 px cutout (1.3333)
    expect(PLANT_BOTANICAL_METRICS.HEMP.aspectRatio).toBeCloseTo(4 / 3, 3);
    // Corn: mapped to upright stalk (1.3333)
    expect(PLANT_BOTANICAL_METRICS.CORN.aspectRatio).toBeCloseTo(4 / 3, 3);
  });

  it('resolves crop variants, aliases, and localized labels to canonical codes', () => {
    expect(resolveCanonicalCropCode('TOM')).toBe('TOM');
    expect(resolveCanonicalCropCode('tomato')).toBe('TOM');
    expect(resolveCanonicalCropCode(undefined, 'Tomatera perita')).toBe('TOM');

    expect(resolveCanonicalCropCode('corn')).toBe('CORN');
    expect(resolveCanonicalCropCode('MAI')).toBe('CORN');
    expect(resolveCanonicalCropCode(undefined, 'Maíz dulce')).toBe('CORN');
    expect(resolveCanonicalCropCode(undefined, 'Choclo')).toBe('CORN');

    expect(resolveCanonicalCropCode('lettuce')).toBe('LETTUCE');
    expect(resolveCanonicalCropCode(undefined, 'Lechuga mantecosa')).toBe('LETTUCE');

    expect(resolveCanonicalCropCode('carrot')).toBe('CARROT');
    expect(resolveCanonicalCropCode(undefined, 'Zanahoria')).toBe('CARROT');
  });

  it('calculates plant dimensions strictly preserving aspect ratio without deformation', () => {
    const crops = ['LETTUCE', 'CARROT', 'TOM', 'CORN', 'SQUASH', 'PEPPER_SWEET'];

    for (const crop of crops) {
      const radiusM = 0.25;
      const dims = calculatePlantDimensions(crop, radiusM);
      const metric = getPlantBotanicalMetrics(crop);

      // CRITICAL: width / height MUST match the botanical metric aspectRatio
      const renderedAspectRatio = dims.widthM / dims.heightM;
      expect(renderedAspectRatio).toBeCloseTo(metric.aspectRatio, 2);
    }
  });

  it('assigns phenotypic heights appropriately: lettuce stays squat and corn stands tall', () => {
    const lettuceDims = calculatePlantDimensions('LETTUCE', 0.2); // 20cm radius = 40cm spread
    const cornDims = calculatePlantDimensions('CORN', 0.2);

    // Lettuce should be squat (height significantly less than width)
    expect(lettuceDims.heightM).toBeLessThan(lettuceDims.widthM * 0.45);

    // Corn should stand tall with significant vertical stature
    expect(cornDims.heightM).toBeGreaterThan(lettuceDims.heightM * 2.0);
  });

  it('defines plant ground elevation constant at 0.02 m', () => {
    expect(PLANT_GROUND_ELEVATION_M).toBe(0.02);
  });
});
