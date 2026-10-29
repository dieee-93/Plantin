import { fetchTrefleSpeciesDetail } from './trefleApi'
import { lookupEcocrop } from './ecocrop'
import { searchUnifiedTaxonomy } from '@/hooks/useTaxonomySearch'
import type { TaxonomySearchResult } from './types'
import { resolveCropOntology, getTraitsForCrop, generateFallbackCropCode } from '@/domain/ontology/index'
import { mergeAgronomicData } from '@/domain/taxon'
import type { Taxon, AgronomicData } from '@/domain/taxon'
import { useTaxonStore } from '@/store/taxonStore'
import { STARTER_SPECIES_PRESETS, type StarterSpeciesPreset } from '@/domain/propagationForm'

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

  const presetMatch = STARTER_SPECIES_PRESETS.find(
    p => p.genus.toLowerCase() === genus.toLowerCase() && p.species.toLowerCase() === species.toLowerCase()
  )
  const imageUrl = result.imageUrl || presetMatch?.imageUrl

  return {
    family,
    genus,
    species,
    commonName: commonName || resolution?.cropName || undefined,
    cropCode,
    imageUrl,
    agronomicData,
    traits: traits.length > 0 ? traits : undefined,
    ecocropMatchedName,
  }
}

/**
 * Construye de forma inmediata (0ms) el draft de un taxón a partir de un preset de especie,
 * resolviendo ontología completa, descriptores fenotípicos y datos agronómicos base.
 */
export function buildInitialPresetTaxon(preset: StarterSpeciesPreset): Omit<Taxon, 'id'> {
  const resolution = resolveCropOntology({
    genus: preset.genus,
    species: preset.species,
    commonName: preset.commonName,
    family: preset.family,
  })
  const effectiveCropCode = resolution?.cropCode || preset.cropCode || generateFallbackCropCode(preset.genus, preset.species)
  const traits = getTraitsForCrop(effectiveCropCode)

  return {
    family: preset.family,
    genus: preset.genus,
    species: preset.species,
    commonName: preset.commonName || resolution?.cropName,
    cropCode: effectiveCropCode,
    imageUrl: preset.imageUrl,
    agronomicData: preset.agronomicData,
    traits: traits.length > 0 ? traits : undefined,
  }
}

/**
 * Hidrata un taxón registrado con las APIs remotas (GBIF + Trefle + FAO EcoCrop)
 * y actualiza de forma reactiva el store de taxones.
 */
export async function hydrateTaxonWithApis(taxonId: string): Promise<void> {
  const store = useTaxonStore.getState()
  const taxon = store.getById(taxonId)
  if (!taxon) return

  const resolution = resolveCropOntology({
    genus: taxon.genus,
    species: taxon.species,
    commonName: taxon.commonName,
    family: taxon.family,
  })
  const effectiveCropCode = resolution?.cropCode || taxon.cropCode || generateFallbackCropCode(taxon.genus, taxon.species)
  const traits = (taxon.traits && taxon.traits.length > 0)
    ? taxon.traits
    : getTraitsForCrop(effectiveCropCode)

  const presetMatch = STARTER_SPECIES_PRESETS.find(
    p => p.genus.toLowerCase() === taxon.genus.toLowerCase() && p.species.toLowerCase() === taxon.species.toLowerCase()
  )
  const presetFallbackImage = presetMatch?.imageUrl

  let searchResults: TaxonomySearchResult[] = []
  let eco: Awaited<ReturnType<typeof lookupEcocrop>> = undefined

  try {
    const [searchRes, ecoRes] = await Promise.all([
      typeof searchUnifiedTaxonomy === 'function'
        ? searchUnifiedTaxonomy(`${taxon.genus} ${taxon.species}`).catch(() => [] as TaxonomySearchResult[])
        : Promise.resolve([] as TaxonomySearchResult[]),
      typeof lookupEcocrop === 'function'
        ? lookupEcocrop(taxon.genus, taxon.species).catch(() => undefined)
        : Promise.resolve(undefined),
    ])
    searchResults = searchRes || []
    eco = ecoRes
  } catch {
    // API errors handled gracefully
  }

  const match = searchResults.find(
    r => r.genus?.toLowerCase() === taxon.genus.toLowerCase() &&
         r.species?.toLowerCase() === taxon.species.toLowerCase()
  ) || (searchResults.length > 0 ? searchResults[0] : undefined)

  let trefleDetail: AgronomicData | undefined = undefined
  if (match?.trefleSlug) {
    try {
      trefleDetail = await fetchTrefleSpeciesDetail(match.trefleSlug)
    } catch {
      // fallback
    }
  }

  let agronomicData: AgronomicData | undefined
  let imageUrl: string | undefined
  let commonName: string | undefined
  let family: string

  if (match) {
    agronomicData = mergeAgronomicData(
      trefleDetail || match.agronomicData,
      eco?.data,
      taxon.agronomicData,
      presetMatch?.agronomicData
    )
    imageUrl = match.imageUrl || taxon.imageUrl || presetFallbackImage
    commonName = taxon.commonName || match.commonName || resolution?.cropName
    family = (taxon.family && taxon.family !== 'Desconocida') ? taxon.family : (match.family || taxon.family)
  } else {
    agronomicData = mergeAgronomicData(
      eco?.data,
      taxon.agronomicData,
      presetMatch?.agronomicData
    )
    imageUrl = taxon.imageUrl || presetFallbackImage
    commonName = taxon.commonName || resolution?.cropName
    family = taxon.family
  }

  const currentTaxon = useTaxonStore.getState().getById(taxonId)
  if (!currentTaxon) return

  useTaxonStore.getState().update(taxonId, {
    cropCode: effectiveCropCode,
    traits: traits.length > 0 ? traits : undefined,
    agronomicData,
    imageUrl,
    commonName,
    family,
  })
}

/**
 * Selecciona o crea un taxón a partir de un preset de especie garantizando
 * el enriquecimiento inmediato y asíncrono con GBIF, Trefle y FAO EcoCrop.
 */
export function selectOrCreatePresetTaxon(preset: StarterSpeciesPreset): Taxon {
  const store = useTaxonStore.getState()
  const existing = store.taxons.find(
    t => t.genus.toLowerCase() === preset.genus.toLowerCase() &&
         t.species.toLowerCase() === preset.species.toLowerCase()
  )

  if (existing) {
    void hydrateTaxonWithApis(existing.id)
    return existing
  }

  const added = store.add(buildInitialPresetTaxon(preset))
  void hydrateTaxonWithApis(added.id)
  return added
}
