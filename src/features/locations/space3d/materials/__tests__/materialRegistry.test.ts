import { describe, expect, it } from 'vitest';
import {
  FLOOR_MATERIAL_CONFIGS,
  getFloorMaterialConfig,
  getStructuralMaterialConfig,
  getWallMaterialConfig,
  STRUCTURAL_MATERIAL_CONFIGS,
  WALL_MATERIAL_CONFIGS,
} from '../materialRegistry';

describe('materialRegistry', () => {
  it('contains valid definitions for all domain floor materials', () => {
    const requiredFloorTypes = [
      'soil',
      'grass',
      'concrete',
      'gravel',
      'tile',
      'wood',
      'mulch',
    ] as const;

    for (const type of requiredFloorTypes) {
      const config = FLOOR_MATERIAL_CONFIGS[type];
      expect(config).toBeDefined();
      expect(config.fallbackColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(config.metersPerTileX).toBeGreaterThan(0);
      expect(config.metersPerTileY).toBeGreaterThan(0);
      expect(config.roughness).toBeGreaterThanOrEqual(0);
      expect(config.roughness).toBeLessThanOrEqual(1);
      expect(config.normalScale).toBeGreaterThan(0);
      expect(config.aoMapIntensity).toBeGreaterThan(0);
    }
  });

  it('contains valid definitions for all domain wall materials', () => {
    const requiredWallTypes = [
      'brick',
      'concrete',
      'glass_greenhouse',
      'polycarbonate',
      'wood_fence',
      'wire_fence',
      'drywall',
    ] as const;

    for (const type of requiredWallTypes) {
      const config = WALL_MATERIAL_CONFIGS[type];
      expect(config).toBeDefined();
      expect(config.fallbackColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(config.metersPerTileX).toBeGreaterThan(0);
      expect(config.metersPerTileY).toBeGreaterThan(0);
    }
  });

  it('supports color tinting without losing physical scale parameters', () => {
    const defaultWood = getFloorMaterialConfig('wood');
    expect(defaultWood.tintColor).toBeUndefined();

    const tintedWood = getFloorMaterialConfig('wood', '#fef3c7');
    expect(tintedWood.tintColor).toBe('#fef3c7');
    expect(tintedWood.fallbackColor).toBe('#fef3c7');
    expect(tintedWood.metersPerTileX).toBe(defaultWood.metersPerTileX);
    expect(tintedWood.metersPerTileY).toBe(defaultWood.metersPerTileY);

    const tintedBrick = getWallMaterialConfig('brick', '#78350f');
    expect(tintedBrick.tintColor).toBe('#78350f');
    expect(tintedBrick.fallbackColor).toBe('#78350f');
  });

  it('defines valid, well-formed PBR texture URLs (albedo, normal, arm) for textured floor and wall materials', () => {
    const expectedFloorTypes = [
      'soil',
      'grass',
      'concrete',
      'gravel',
      'tile',
      'wood',
      'mulch',
    ] as const;

    for (const key of expectedFloorTypes) {
      const config = FLOOR_MATERIAL_CONFIGS[key];
      expect(config.textureUrl).toBe(`/textures/floors/${key}/albedo.webp`);
      expect(config.normalMapUrl).toBe(`/textures/floors/${key}/normal.webp`);
      expect(config.armMapUrl).toBe(`/textures/floors/${key}/arm.webp`);
    }

    const expectedWallTypes = [
      'brick',
      'concrete',
      'wood_fence',
      'drywall',
    ] as const;

    for (const key of expectedWallTypes) {
      const config = WALL_MATERIAL_CONFIGS[key];
      expect(config.textureUrl).toBe(`/textures/walls/${key}/albedo.webp`);
      expect(config.normalMapUrl).toBe(`/textures/walls/${key}/normal.webp`);
      expect(config.armMapUrl).toBe(`/textures/walls/${key}/arm.webp`);
      expect(config.normalScale).toBeGreaterThan(0);
      expect(config.aoMapIntensity).toBeGreaterThan(0);
    }
  });

  it('provides structural material configurations for wood_carpentry and metal_frame', () => {
    const woodCarpentry = getStructuralMaterialConfig('wood_carpentry');
    expect(woodCarpentry).toEqual(STRUCTURAL_MATERIAL_CONFIGS.wood_carpentry);
    expect(woodCarpentry.textureUrl).toBe('/textures/floors/wood/albedo.webp');
    expect(woodCarpentry.normalMapUrl).toBe('/textures/floors/wood/normal.webp');
    expect(woodCarpentry.armMapUrl).toBe('/textures/floors/wood/arm.webp');
    expect(woodCarpentry.tintColor).toBe('#b45309');

    const metalFrame = getStructuralMaterialConfig('metal_frame');
    expect(metalFrame).toEqual(STRUCTURAL_MATERIAL_CONFIGS.metal_frame);
    expect(metalFrame.metalness).toBeGreaterThanOrEqual(0.7);
    expect(metalFrame.roughness).toBeLessThanOrEqual(0.4);
  });

  it('enables stochastic antiTile on continuous/organic materials and disables it on geometric jointed materials', () => {
    expect(FLOOR_MATERIAL_CONFIGS.soil.antiTile).toBe(true);
    expect(FLOOR_MATERIAL_CONFIGS.grass.antiTile).toBe(true);
    expect(FLOOR_MATERIAL_CONFIGS.concrete.antiTile).toBe(true);
    expect(FLOOR_MATERIAL_CONFIGS.gravel.antiTile).toBe(true);
    expect(FLOOR_MATERIAL_CONFIGS.mulch.antiTile).toBe(true);
    expect(FLOOR_MATERIAL_CONFIGS.tile.antiTile).toBe(false);
    expect(FLOOR_MATERIAL_CONFIGS.wood.antiTile).toBe(false);

    expect(WALL_MATERIAL_CONFIGS.concrete.antiTile).toBe(true);
    expect(WALL_MATERIAL_CONFIGS.drywall.antiTile).toBe(true);
    expect(WALL_MATERIAL_CONFIGS.brick.antiTile).toBe(false);
    expect(WALL_MATERIAL_CONFIGS.wood_fence.antiTile).toBe(false);
  });

  it('enforces 1:1 square UV aspect ratio and high dielectric roughness (>= 0.88, metalness 0) on all floor and textured wall materials to prevent orthographic glare and stretching', () => {
    const floorTypes = ['soil', 'grass', 'concrete', 'gravel', 'tile', 'wood', 'mulch'] as const;
    for (const key of floorTypes) {
      const cfg = FLOOR_MATERIAL_CONFIGS[key];
      expect(cfg.metersPerTileX).toBe(cfg.metersPerTileY);
      expect(cfg.roughness).toBeGreaterThanOrEqual(0.88);
      expect(cfg.metalness).toBe(0);
    }

    const texturedWalls = ['brick', 'concrete', 'wood_fence', 'drywall'] as const;
    for (const key of texturedWalls) {
      const cfg = WALL_MATERIAL_CONFIGS[key];
      expect(cfg.metersPerTileX).toBe(cfg.metersPerTileY);
      expect(cfg.roughness).toBeGreaterThanOrEqual(0.88);
      expect(cfg.metalness).toBe(0);
    }
  });
});
