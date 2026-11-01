import { describe, expect, it } from 'vitest';
import {
  FLOOR_MATERIAL_CONFIGS,
  getFloorMaterialConfig,
  getWallMaterialConfig,
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

  it('defines valid, well-formed texture URLs for textured floor and wall materials', () => {
    const expectedFloorTextures: Record<string, string> = {
      soil: '/textures/floors/soil/albedo.webp',
      grass: '/textures/floors/grass/albedo.webp',
      concrete: '/textures/floors/concrete/albedo.webp',
      gravel: '/textures/floors/gravel/albedo.webp',
      tile: '/textures/floors/tile/albedo.webp',
      wood: '/textures/floors/wood/albedo.webp',
      mulch: '/textures/floors/mulch/albedo.webp',
    };

    for (const [key, expectedUrl] of Object.entries(expectedFloorTextures)) {
      expect(FLOOR_MATERIAL_CONFIGS[key as keyof typeof FLOOR_MATERIAL_CONFIGS]?.textureUrl).toBe(expectedUrl);
    }

    const expectedWallTextures: Record<string, string> = {
      brick: '/textures/walls/brick/albedo.webp',
      concrete: '/textures/walls/concrete/albedo.webp',
      wood_fence: '/textures/walls/wood_fence/albedo.webp',
      drywall: '/textures/walls/drywall/albedo.webp',
    };

    for (const [key, expectedUrl] of Object.entries(expectedWallTextures)) {
      expect(WALL_MATERIAL_CONFIGS[key as keyof typeof WALL_MATERIAL_CONFIGS]?.textureUrl).toBe(expectedUrl);
    }
  });
});
