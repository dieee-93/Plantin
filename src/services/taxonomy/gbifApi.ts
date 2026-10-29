import type { TaxonomySearchResult } from './types'

const GBIF_API_BASE = 'https://api.gbif.org/v1/species'

export async function searchGBIF(query: string): Promise<TaxonomySearchResult[]> {
  if (!query || query.trim() === '') return []

  // Rank=SPECIES ensures we get species and not kingdoms or classes
  const url = `${GBIF_API_BASE}/search?q=${encodeURIComponent(query)}&rank=SPECIES&limit=10`
  
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`GBIF API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.results || !Array.isArray(data.results)) {
      return []
    }

    return data.results
      .filter((item: any) => item.scientificName && item.kingdom === 'Plantae') // We only care about plants
      .map((item: any): TaxonomySearchResult => {
        // GBIF's item.species is often the full binomial "Genus species"
        // We only want the species epithet (the second word).
        const nameParts = item.scientificName.split(' ')
        const speciesEpithet = nameParts.length > 1 ? nameParts[1] : (item.species || '')

        return {
          id: `gbif-${item.key}`,
          source: 'GBIF',
          scientificName: item.scientificName,
          commonName: item.vernacularName,
          family: item.family,
          genus: item.genus,
          species: speciesEpithet,
        }
      })
  } catch (error) {
    console.error('Failed to fetch from GBIF:', error)
    return [] // Silently fail and return empty to not break the UI, since we'll fallback to other things or just show no results
  }
}

/**
 * Resuelve una imagen botánica sin API key consultando la API pública de Wikipedia REST (CORS abierto).
 */
export async function fetchBotanicalImage(genus: string, species: string): Promise<string | undefined> {
  if (!genus?.trim() || !species?.trim()) return undefined
  const epithet = species.trim().split(/\s+/)[0]
  const title = `${genus.trim()}_${epithet}`
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`

  try {
    const res = await fetch(url)
    if (!res.ok) return undefined
    const data = await res.json()
    const src = data?.thumbnail?.source || data?.originalimage?.source
    if (typeof src === 'string' && src.startsWith('https://')) {
      return src
    }
    return undefined
  } catch {
    return undefined
  }
}
