/**
 * Observation — Registro de observación fenotípica (BrAPI Phenotyping)
 * value es siempre string (igual que BrAPI) para manejar tipos heterogéneos
 * sin schema complejo. La interpretación/validación se hace en base a scaleType
 * de la PhenotypicVariable asociada.
 */
import type { PhenotypicVariable } from './phenotypicVariable'

export interface Observation {
  id: string
  individualId: string
  variableId: string
  /** String universal — se interpreta según PhenotypicVariable.scaleType */
  value: string
  /** ISO 8601 datetime */
  observationDate: string
  /** Estadio BBCH al momento de medir */
  bbchAtObservation?: number
  /** Nombre o ID del observador */
  observedBy?: string
  imageUrls?: string[]
  notes?: string
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export type CreateObservationInput = Omit<Observation, 'id'>

/**
 * Crea una nueva Observation validada contra la PhenotypicVariable asociada.
 *
 * Reglas por scaleType:
 *   - numerical  → value parseable como número; dentro de min/max si están definidos
 *   - ordinal    → value debe existir en scaleCategories
 *   - nominal    → value debe existir en scaleCategories
 *   - text/date  → value no puede estar vacío
 */
export function createObservation(
  input: CreateObservationInput,
  variable: PhenotypicVariable
): Observation {
  if (!input.individualId.trim()) {
    throw new Error('individualId is required')
  }
  if (!input.variableId.trim()) {
    throw new Error('variableId is required')
  }
  if (!input.value && input.value !== '0') {
    throw new Error('value cannot be empty')
  }

  const { scaleType } = variable

  if (scaleType === 'numerical') {
    const num = Number(input.value)
    if (isNaN(num)) {
      throw new Error('value must be a number for numerical scale')
    }
    if (
      (variable.scaleMinimum !== undefined && num < variable.scaleMinimum) ||
      (variable.scaleMaximum !== undefined && num > variable.scaleMaximum)
    ) {
      throw new Error('value out of range')
    }
  }

  if (scaleType === 'ordinal' || scaleType === 'nominal') {
    const validValues = (variable.scaleCategories ?? []).map((c) => c.value)
    if (!validValues.includes(input.value)) {
      throw new Error('value must be one of the defined scale categories')
    }
  }

  if ((scaleType === 'text' || scaleType === 'date') && !input.value.trim()) {
    throw new Error('value cannot be empty')
  }

  return {
    ...input,
    id: crypto.randomUUID(),
  }
}
