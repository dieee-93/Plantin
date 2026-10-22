/**
 * Taxon — Taxonomía estándar (Darwin Core / MCPD)
 * Entidad de lookup compartida. No se duplica en cada Accession.
 */

/** Origen de cada dato ecofisiológico (trazabilidad por campo). */
export type AgronomicSource = 'trefle' | 'ecocrop' | 'manual'

export interface AgronomicValues {
  minTemp?: number;        // °C — límite absoluto
  maxTemp?: number;        // °C — límite absoluto
  optTempMin?: number;     // °C — rango óptimo (EcoCrop)
  optTempMax?: number;     // °C — rango óptimo (EcoCrop)
  killTemp?: number;       // °C — temperatura letal (EcoCrop 'KTMP'); frío bajo el cual la planta muere
  light?: number; // 0-10 scale
  atmosphericHumidity?: number; // 0-10 scale
  soilNutriments?: number; // 0-10 scale
  soilSalinity?: number; // 0-10 scale
  phMinimum?: number;      // límite absoluto
  phMaximum?: number;      // límite absoluto
  optPhMin?: number;       // rango óptimo (EcoCrop)
  optPhMax?: number;       // rango óptimo (EcoCrop)
  rainfallMin?: number;    // mm/año — límite absoluto (EcoCrop)
  rainfallMax?: number;    // mm/año — límite absoluto (EcoCrop)
  cycleDaysMin?: number;   // días de ciclo de cultivo (EcoCrop)
  cycleDaysMax?: number;   // días de ciclo de cultivo (EcoCrop)
  growthMonths?: string[];
}

export type AgronomicField = keyof AgronomicValues

export interface AgronomicData extends AgronomicValues {
  /** Fuente de cada campo presente. */
  sources?: Partial<Record<AgronomicField, AgronomicSource>>;
}

const AGRONOMIC_FIELDS: AgronomicField[] = [
  'minTemp', 'maxTemp', 'optTempMin', 'optTempMax', 'killTemp',
  'light', 'atmosphericHumidity', 'soilNutriments', 'soilSalinity',
  'phMinimum', 'phMaximum', 'optPhMin', 'optPhMax',
  'rainfallMin', 'rainfallMax', 'cycleDaysMin', 'cycleDaysMax', 'growthMonths',
]

/** Etiqueta cada campo presente con la fuente indicada. */
export function tagAgronomicSource(
  values: AgronomicValues | undefined,
  source: AgronomicSource,
): AgronomicData | undefined {
  if (!values) return undefined
  const out: AgronomicData = { sources: {} }
  for (const f of AGRONOMIC_FIELDS) {
    if (values[f] !== undefined) {
      ;(out as Record<string, unknown>)[f] = values[f]
      out.sources![f] = source
    }
  }
  return Object.keys(out.sources!).length > 0 ? out : undefined
}

/**
 * Fusiona varias fuentes campo a campo, por orden de prioridad:
 * el primer layer que tenga un valor para un campo gana.
 * Ej: mergeAgronomicData(trefle, ecocrop) → Trefle primero, EcoCrop completa huecos.
 */
export function mergeAgronomicData(
  ...layers: (AgronomicData | undefined)[]
): AgronomicData | undefined {
  const out: AgronomicData = { sources: {} }
  for (const layer of layers) {
    if (!layer) continue
    for (const f of AGRONOMIC_FIELDS) {
      if (out[f] === undefined && layer[f] !== undefined) {
        ;(out as Record<string, unknown>)[f] = layer[f]
        const src = layer.sources?.[f]
        if (src) out.sources![f] = src
      }
    }
  }
  return AGRONOMIC_FIELDS.some(f => out[f] !== undefined) ? out : undefined
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
