import { useQuery } from '@tanstack/react-query'
import { searchGBIF } from '@/services/taxonomy/gbifApi'
import type { TaxonomySearchResult } from '@/services/taxonomy/types'

// We create a unified search function
export async function searchUnifiedTaxonomy(query: string): Promise<TaxonomySearchResult[]> {
  if (!query) return []
  
  const gbifResults = await searchGBIF(query)
  const merged = new Map<string, TaxonomySearchResult>()
  
  // Helper function to create a bulletproof comparison key
  const generateMergeKey = (item: TaxonomySearchResult): string => {
    // To ensure perfect matching, we always extract the first two words from scientificName.
    const parts = item.scientificName.split(' ')
    const g = parts[0] || ''
    const s = parts[1] || ''

    // If we don't have at least a genus, fallback to the full name
    if (!g) {
      return item.scientificName.toLowerCase().trim()
    }

    // Normalize: remove accents, strange characters, and lowercase it
    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase().trim()

    // Example: "Solanum" + "lycopersicum" -> "solanum_lycopersicum"
    return `${normalize(g)}_${normalize(s)}`
  }

  // Process GBIF (our strong taxonomic baseline)
  gbifResults.forEach(item => {
    const key = generateMergeKey(item)
    if (!merged.has(key)) {
      merged.set(key, item)
    }
  })

  return Array.from(merged.values())
}

export function useTaxonomySearch(query: string) {
  return useQuery({
    queryKey: ['taxonomySearch', query],
    queryFn: () => searchUnifiedTaxonomy(query),
    enabled: query.trim().length > 2, // Only search if query is > 2 chars
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours to save API quotas
    retry: 1,
  })
}
