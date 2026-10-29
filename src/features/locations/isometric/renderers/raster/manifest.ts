import type { BbchPhase } from '../../visual/plantSpec'
import {
  RASTER_SPRITES,
  RASTER_SPRITES_META,
  type RasterSpriteMeta,
} from './manifest.generated'

export { RASTER_SPRITES, RASTER_SPRITES_META, type RasterSpriteMeta }

/**
 * Resuelve el sprite raster correspondiente si existe en el manifiesto generado.
 * Si no está disponible para ese cultivo o fase, devuelve undefined (activando fallback procedural).
 */
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

/**
 * Resuelve los metadatos geométricos opcionales de un sprite raster (width, height, anclaje).
 */
export function getRasterSpriteMeta(
  cropCode: string,
  phase: BbchPhase,
  vitality: 'alive' | 'harvested' | 'dead'
): RasterSpriteMeta | undefined {
  const crop = RASTER_SPRITES_META[cropCode]
  if (!crop) return undefined
  if (vitality === 'dead' && crop.dead) return crop.dead
  if (vitality === 'harvested' && crop.harvested) return crop.harvested
  return crop[phase]
}
