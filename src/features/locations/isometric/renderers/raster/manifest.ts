import type { BbchPhase } from '../../visual/plantSpec'
import { RASTER_SPRITES } from './manifest.generated'

export { RASTER_SPRITES }

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
