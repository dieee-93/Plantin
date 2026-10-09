import type { AgronomicData } from '@/domain/taxon'

export interface TaxonomySearchResult {
  /** Unique ID from the source API */
  id: string
  /** Source of the data */
  source: 'GBIF' | 'TREFLE'
  /** Scientific name (e.g. "Solanum lycopersicum") */
  scientificName: string
  /** Common name if available (e.g. "Tomato") */
  commonName?: string
  /** Botanical family */
  family?: string
  /** Botanical genus */
  genus?: string
  /** Species name (without genus) */
  species?: string
  /** URL to a picture of the plant, mainly available in Trefle */
  imageUrl?: string
  /** Agronomic data like temp, pH, light (mostly from Trefle) */
  agronomicData?: AgronomicData
}
