import type { BbchPhase } from '../../visual/plantSpec'

/**
 * Manifiesto de sprites raster disponibles por cropCode y fase fenológica/estado.
 * Si un cropCode o fase no está aquí, el motor realiza fallback automático al renderer procedural.
 */
export const RASTER_SPRITES: Partial<
  Record<string /* cropCode */, Partial<Record<BbchPhase | 'dead' | 'harvested', string>>>
> = {
  TOM: {
    germination: new URL('./assets/tom-germination.webp', import.meta.url).href,
    leaf: new URL('./assets/tom-leaf.webp', import.meta.url).href,
    structure: new URL('./assets/tom-structure.webp', import.meta.url).href,
    flowering: new URL('./assets/tom-flowering.webp', import.meta.url).href,
    fruiting: new URL('./assets/tom-fruiting.webp', import.meta.url).href,
  },
}

export function getRasterSprite(
  cropCode: string,
  phase: BbchPhase,
  vitality: 'alive' | 'harvested' | 'dead'
): string | undefined {
  const crop = RASTER_SPRITES[cropCode]
  if (!crop) return undefined
  if (vitality === 'dead' && crop.dead) return crop.dead
  if (vitality === 'harvested' && crop.harvested) return crop.harvested
  return crop[phase]
}
