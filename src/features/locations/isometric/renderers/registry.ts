import type { BotanicalArchetypeId } from '../botanicalArchetypes'
import type { PlantVisualSpec } from '../visual/plantSpec'
import type { PlantRenderer } from './types'
import { PROCEDURAL_RENDERERS, GenericHerbRenderer } from './procedural'
import { RasterPlant } from './raster/RasterPlant'
import { getRasterSprite } from './raster/manifest'

export { PROCEDURAL_RENDERERS }

/**
 * Resuelve el renderer botánico para una planta:
 * 1. Si existe un sprite raster en el manifiesto para su cropCode y fase/estado, devuelve RasterPlant.
 * 2. Si no, realiza fallback transparente al renderer procedural correspondiente.
 */
export function getPlantRenderer(
  archetypeOrSpec: BotanicalArchetypeId | PlantVisualSpec
): PlantRenderer {
  if (typeof archetypeOrSpec !== 'string') {
    const spec = archetypeOrSpec
    const spriteUrl = getRasterSprite(spec.cropCode, spec.phase, spec.vitality)
    if (spriteUrl) {
      return RasterPlant
    }
    return PROCEDURAL_RENDERERS[spec.archetype] ?? GenericHerbRenderer
  }

  return PROCEDURAL_RENDERERS[archetypeOrSpec] ?? GenericHerbRenderer
}
