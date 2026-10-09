/**
 * Taxon — Taxonomía estándar (Darwin Core / MCPD)
 * Entidad de lookup compartida. No se duplica en cada Accession.
 */
export interface AgronomicData {
  minTemp?: number;
  maxTemp?: number;
  light?: number; // 0-10 scale
  atmosphericHumidity?: number; // 0-10 scale
  soilNutriments?: number; // 0-10 scale
  soilSalinity?: number; // 0-10 scale
  phMinimum?: number;
  phMaximum?: number;
  growthMonths?: string[];
}

import type { TraitDefinition } from './ontology/types'

export interface Taxon {
  id: string
  family: string
  genus: string        // Initial mayúscula. Ej: "Solanum"
  species: string      // Lowercase. Ej: "lycopersicum"
  subspecies?: string
  variety?: string     // Ej: "cerasiforme"
  commonName?: string
  authority?: string   // Ej: "Mill."
  cropCode?: string    // Ej: "TOM" (para prefijos de accesión)
  agronomicData?: AgronomicData // Traído de la API (Ej: Trefle)
  imageUrl?: string    // Imagen botánica de la API
  traits?: TraitDefinition[] // Descriptores fenotípicos vinculados
}

// kingdom, phylum, class, order → descartados: irrelevantes para fitomejoramiento
