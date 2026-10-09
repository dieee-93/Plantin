/**
 * CrossingEvent — Evento de cruza planificada o ejecutada (BrAPI Cross)
 */

export type CrossEventType =
  | 'biparental'
  | 'self'
  | 'open'
  | 'poly'
  | 'bulk'
  | 'topcross'

export type CrossSuccessStatus = 'pending' | 'successful' | 'failed'

export interface CrossingEvent {
  id: string
  /** Ej: "PLT-CROSS-2024-001" — BrAPI crossName */
  crossName: string
  /** Planta madre ♀ */
  maternalParentId: string
  /** Planta padre ♂ */
  paternalParentId: string
  crossType: CrossEventType
  /** ISO 8601 */
  crossDate?: string
  /** Semillas objetivo */
  plannedOffspringCount?: number
  /** Lote generado como resultado de la cruza */
  resultingSeedLotId?: string
  successStatus?: CrossSuccessStatus
  notes?: string
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export type CreateCrossingEventInput =
  Omit<CrossingEvent, 'id' | 'successStatus'> &
  Partial<Pick<CrossingEvent, 'successStatus'>>

/**
 * Crea un nuevo CrossingEvent validado.
 * - crossName, maternalParentId y paternalParentId son obligatorios.
 * - successStatus por defecto: 'pending'.
 * - biparental: exige padres distintos.
 * - self: exige padres iguales.
 */
export function createCrossingEvent(input: CreateCrossingEventInput): CrossingEvent {
  if (!input.crossName.trim()) {
    throw new Error('crossName is required')
  }
  if (!input.maternalParentId.trim()) {
    throw new Error('maternalParentId is required')
  }
  if (!input.paternalParentId.trim()) {
    throw new Error('paternalParentId is required')
  }

  if (
    input.crossType === 'biparental' &&
    input.maternalParentId === input.paternalParentId
  ) {
    throw new Error('biparental cross requires two different parents')
  }

  if (
    input.crossType === 'self' &&
    input.maternalParentId !== input.paternalParentId
  ) {
    throw new Error(
      'self cross requires the same parent for both maternal and paternal'
    )
  }

  return {
    ...input,
    id: crypto.randomUUID(),
    successStatus: input.successStatus ?? 'pending',
  }
}
