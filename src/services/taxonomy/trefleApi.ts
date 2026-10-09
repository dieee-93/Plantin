import type { TaxonomySearchResult } from './types'

const TREFLE_API_BASE = 'https://trefle.io/api/v1/plants/search'

// The user should provide this in their .env file as VITE_TREFLE_TOKEN
// For the sake of the TDD tests, we can inject or mock it.
export async function searchTrefle(query: string, token?: string): Promise<TaxonomySearchResult[]> {
  const actualToken = token || (import.meta.env && import.meta.env.VITE_TREFLE_TOKEN)
  
  if (!query || query.trim() === '') return []
  
  if (!actualToken) {
    console.warn('Trefle API token is missing. Skipping Trefle search.')
    return []
  }

  const url = `${TREFLE_API_BASE}?token=${actualToken}&q=${encodeURIComponent(query)}`
  
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
    }))
  } catch (error) {
    console.error('Failed to fetch from Trefle:', error)
    return []
  }
}
