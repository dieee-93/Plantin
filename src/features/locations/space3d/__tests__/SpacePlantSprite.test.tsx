import { describe, expect, it } from 'vitest';
import { resolvePlantSpriteUrl } from '../SpacePlantSprite';

describe('SpacePlantSprite & resolvePlantSpriteUrl', () => {
  it('resolves correct sprite URLs for registered crop codes', () => {
    expect(resolvePlantSpriteUrl('TOM')).toBe('/textures/plants/TOM/fruiting.webp');
    expect(resolvePlantSpriteUrl('tomato')).toBe('/textures/plants/TOM/fruiting.webp');
    expect(resolvePlantSpriteUrl('CARROT')).toBe('/textures/plants/CARROT/fruiting.webp');
    expect(resolvePlantSpriteUrl('PEPPER_SWEET')).toBe('/textures/plants/PEPPER_SWEET/fruiting.webp');
    expect(resolvePlantSpriteUrl('SQUASH')).toBe('/textures/plants/SQUASH/fruiting.webp');
    expect(resolvePlantSpriteUrl('LETTUCE')).toBe('/textures/plants/LETTUCE/fruiting.webp');
    expect(resolvePlantSpriteUrl('CITRUS_ORANGE')).toBe('/textures/plants/CITRUS_ORANGE/fruiting.webp');
    expect(resolvePlantSpriteUrl('ONION')).toBe('/textures/plants/ONION/fruiting.webp');
    expect(resolvePlantSpriteUrl('HEMP')).toBe('/textures/plants/HEMP/fruiting.webp');
    // Corn / Maize mapped to upright stalk fallback
    expect(resolvePlantSpriteUrl('CORN')).toBe('/textures/plants/HEMP/fruiting.webp');
    expect(resolvePlantSpriteUrl('corn')).toBe('/textures/plants/HEMP/fruiting.webp');
    expect(resolvePlantSpriteUrl('MAI')).toBe('/textures/plants/HEMP/fruiting.webp');
  });

  it('resolves correct sprite URLs from plant labels when cropCode is missing', () => {
    expect(resolvePlantSpriteUrl(undefined, 'Tomatera Cherry')).toBe('/textures/plants/TOM/fruiting.webp');
    expect(resolvePlantSpriteUrl(undefined, 'Zanahoria Nantes')).toBe('/textures/plants/CARROT/fruiting.webp');
    expect(resolvePlantSpriteUrl(undefined, 'Morrón Rojo')).toBe('/textures/plants/PEPPER_SWEET/fruiting.webp');
    expect(resolvePlantSpriteUrl(undefined, 'Zapallo Kabutia')).toBe('/textures/plants/SQUASH/fruiting.webp');
    expect(resolvePlantSpriteUrl(undefined, 'Maíz dulce')).toBe('/textures/plants/HEMP/fruiting.webp');
    expect(resolvePlantSpriteUrl(undefined, 'Choclo')).toBe('/textures/plants/HEMP/fruiting.webp');
  });

  it('respects requested phenological phase', () => {
    expect(resolvePlantSpriteUrl('TOM', undefined, 'flowering')).toBe('/textures/plants/TOM/flowering.webp');
    expect(resolvePlantSpriteUrl('CARROT', undefined, 'leaf')).toBe('/textures/plants/CARROT/leaf.webp');
    expect(resolvePlantSpriteUrl('CITRUS_ORANGE', undefined, 'germination')).toBe('/textures/plants/CITRUS_ORANGE/germination.webp');
  });

  it('returns null for unregistered or custom species to allow fallback', () => {
    expect(resolvePlantSpriteUrl('UNKNOWN_CROP', 'Hierba silvestre')).toBeNull();
  });
});
