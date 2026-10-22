import { fetchTrefleSpeciesDetail } from './trefleApi'
import { lookupEcocrop } from './ecocrop'
import type { TaxonomySearchResult } from './types'
import { resolveCropOntology, getTraitsForCrop, generateFallbackCropCode } from '@/domain/ontology/index'
import { mergeAgronomicData } from '@/domain/taxon'
import type { Taxon, AgronomicData } from '@/domain/taxon'

export interface EnrichedTaxonDraft {
  family: string
  genus: string
  species: string
  commonName?: string
  cropCode: string
  imageUrl?: string
  agronomicData?: AgronomicData
  traits?: Taxon['traits']
  ecocropMatchedName?: string | null
}

/**
 * Resuelve en un solo paso la ontología agronómica (Crop Code + Traits)
 * y fusiona los datos ecofisiológicos de Trefle y FAO EcoCrop.
 */
export async function enrichTaxonomySearchResult(
  result: TaxonomySearchResult
): Promise<EnrichedTaxonDraft> {
  const family = result.family || 'Desconocida'
  const genus = result.genus || ''
  const species = result.species || ''
  const commonName = result.commonName || ''

  const resolution = resolveCropOntology({
    genus,
    species,
    commonName,
    family,
  })
  const traits = resolution ? getTraitsForCrop(resolution.cropCode) : []
  const cropCode = resolution?.cropCode || generateFallbackCropCode(genus, species)

  let agronomicData: AgronomicData | undefined = result.agronomicData
  let ecocropMatchedName: string | null = null

  try {
    const [trefle, eco] = await Promise.all([
      result.trefleSlug ? fetchTrefleSpeciesDetail(result.trefleSlug) : Promise.resolve(result.agronomicData),
      lookupEcocrop(genus, species),
    ])
    agronomicData = mergeAgronomicData(trefle, eco?.data)
    ecocropMatchedName = eco ? eco.matchedName : null
  } catch {
    // Fallback silencioso a los datos que ya traía el resultado de búsqueda
  }

  return {
    family,
    genus,
    species,
    commonName: commonName || undefined,
    cropCode,
    imageUrl: result.imageUrl,
    agronomicData,
    traits: traits.length > 0 ? traits : undefined,
    ecocropMatchedName,
  }
}
