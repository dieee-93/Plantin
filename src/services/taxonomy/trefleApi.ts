import type { TaxonomySearchResult } from './types'
import type { AgronomicData } from '@/domain/taxon'
import { tagAgronomicSource } from '@/domain/taxon'

const TREFLE_API_BASE = 'https://trefle.io/api/v1'

function getToken(): string | undefined {
  return import.meta.env && import.meta.env.VITE_TREFLE_TOKEN
}

/**
 * Maps a Trefle `growth` object to our internal AgronomicData model.
 * Returns undefined if the growth object has no useful data at all.
 */
function mapGrowthToAgronomicData(growth: any): AgronomicData | undefined {
  if (!growth) return undefined

  const data: AgronomicData = {}

  if (growth.minimum_temperature?.deg_c != null) data.minTemp = growth.minimum_temperature.deg_c
  if (growth.maximum_temperature?.deg_c != null) data.maxTemp = growth.maximum_temperature.deg_c
  if (growth.light != null)                      data.light = growth.light
  if (growth.atmospheric_humidity != null)       data.atmosphericHumidity = growth.atmospheric_humidity
  if (growth.soil_nutriments != null)            data.soilNutriments = growth.soil_nutriments
  if (growth.soil_salinity != null)              data.soilSalinity = growth.soil_salinity
  if (growth.ph_minimum != null)                 data.phMinimum = growth.ph_minimum
  if (growth.ph_maximum != null)                 data.phMaximum = growth.ph_maximum
  if (Array.isArray(growth.growth_months) && growth.growth_months.length > 0) {
    data.growthMonths = growth.growth_months
  }

  // Return undefined if all fields are still missing (empty object)
  return Object.keys(data).length > 0 ? data : undefined
}

/**
 * Search for plants on Trefle — returns basic info only.
 * Use fetchTrefleSpeciesDetail() to get ecophysiological data for a specific result.
 */
export async function searchTrefle(query: string, token?: string): Promise<TaxonomySearchResult[]> {
  const actualToken = token || getToken()

  if (!query || query.trim() === '') return []

  if (!actualToken) {
    console.warn('Trefle API token is missing. Skipping Trefle search.')
    return []
  }

  const url = `${TREFLE_API_BASE}/plants/search?token=${actualToken}&q=${encodeURIComponent(query)}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Trefle API error: ${response.statusText}`)
    }

    const json = await response.json()

    if (!json.data || !Array.isArray(json.data)) {
      return []
    }

    return json.data.map((item: any): TaxonomySearchResult => ({
      id: `trefle-${item.id}`,
      source: 'TREFLE',
      scientificName: item.scientific_name,
      commonName: item.common_name,
      family: item.family,
      genus: item.genus,
      species: item.scientific_name?.split(' ').slice(1).join(' '),
      imageUrl: item.image_url,
      trefleSlug: item.slug, // ← key for the detail fetch
    }))
  } catch (error) {
    console.error('Failed to fetch from Trefle:', error)
    return []
  }
}

/**
 * Fetches the full species detail from Trefle using the slug.
 * Returns enriched agronomicData from the `growth` block.
 * Called once when the user selects a specific search result.
 */
export async function fetchTrefleSpeciesDetail(
  slug: string,
  token?: string,
): Promise<AgronomicData | undefined> {
  const actualToken = token || getToken()

  if (!slug || !actualToken) return undefined

  const url = `${TREFLE_API_BASE}/species/${encodeURIComponent(slug)}?token=${actualToken}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`Trefle detail fetch failed for slug "${slug}": ${response.statusText}`)
      return undefined
    }

    const json = await response.json()
    return tagAgronomicSource(mapGrowthToAgronomicData(json?.data?.growth), 'trefle')
  } catch (error) {
    console.error(`Failed to fetch Trefle detail for slug "${slug}":`, error)
    return undefined
  }
}
