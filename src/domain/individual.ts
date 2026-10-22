/**
 * Individual — Planta física sembrada (BrAPI ObservationUnit)
 * Es el sujeto de las observaciones fenotípicas y el nodo del grafo de pedigrí.
 */

export type IndividualStatus = 'active' | 'harvested' | 'dead' | 'discarded'

export type CrossType =
  | 'open_pollinated'
  | 'self'
  | 'controlled'
  | 'unknown'

/**
 * Escala BBCH: enteros 0–99.
 * 0-9: germinación | 10-19: foliar | 20-29: brotes laterales
 * 30-39: elongación | 40-49: partes vegetativas | 50-59: inflorescencia
 * 60-69: floración | 70-79: fruto | 80-89: maduración | 90-99: senescencia
 */
export type BBCHStage = number // 0–99, validado en capa de servicio

export interface Individual {
  id: string
  accessionId: string
  seedLotId?: string
  /** Identificador legible de la planta física. Ej: "TOM-2026-001 #01" */
  label?: string
  /** ISO 8601 */
  plantingDate?: string
  /** Referencia estructural a un FacilityLocation (Invernadero, Sala, etc) */
  locationId?: string
  /** Descripción libre del lugar o notas adicionales. Ej: "Cantero 2 / Maceta 14" */
  location?: string
  /** Row/col si hay diseño experimental — BrAPI observationUnitPosition */
  position?: string
  /** Estadio fenológico actual — escala BBCH */
  currentBBCH?: BBCHStage
  status: IndividualStatus
  /**
   * Generación filial — Ej: "F1", "F2", "BC1F1", "S3"
   * Notación USDA estándar.
   */
  generation?: string
  /** Planta madre — nodo del DAG de pedigrí */
  maternalParentId?: string
  /** Planta padre */
  paternalParentId?: string
  crossType?: CrossType
  tags?: string[]
  notes?: string
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export type CreateIndividualInput =
  Omit<Individual, 'id' | 'status'> &
  Partial<Pick<Individual, 'id' | 'status'>>

/**
 * Crea un nuevo Individual validado.
 * - Genera un id único (crypto.randomUUID) si no se provee.
 * - Aplica 'active' como status por defecto.
 * - Valida que currentBBCH esté entre 0 y 99 (escala BBCH).
 * - Rechaza que un individuo sea su propio padre.
 * - En crossType 'self', exige que maternalParentId === paternalParentId.
 */
export function createIndividual(input: CreateIndividualInput): Individual {
  const id = input.id ?? crypto.randomUUID()

  if (
    input.currentBBCH !== undefined &&
    (input.currentBBCH < 0 || input.currentBBCH > 99)
  ) {
    throw new Error('currentBBCH must be between 0 and 99')
  }

  if (
    (input.maternalParentId && input.maternalParentId === id) ||
    (input.paternalParentId && input.paternalParentId === id)
  ) {
    throw new Error('an individual cannot be its own parent')
  }

  if (
    input.crossType === 'self' &&
    input.maternalParentId !== input.paternalParentId
  ) {
    throw new Error(
      'self-pollination requires the same parent for both maternal and paternal'
    )
  }

  return {
    ...input,
    id,
    status: input.status ?? 'active',
  }
}

/**
 * Devuelve un nombre legible y único para mostrar una planta en listas y selectores.
 */
export function getIndividualDisplayName(
  individual: Individual,
  accessionNumber?: string,
  indexInAccession?: number
): string {
  if (individual.label && individual.label.trim()) {
    return individual.label.trim()
  }
  const base = accessionNumber || 'PLT'
  if (indexInAccession !== undefined && indexInAccession >= 0) {
    return `${base} #${String(indexInAccession + 1).padStart(2, '0')}`
  }
  return `${base} #${individual.id.slice(0, 4).toUpperCase()}`
}
