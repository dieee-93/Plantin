import type { GeoCoordinates } from './agroclimate/types'

export type LocationType = 'greenhouse' | 'room' | 'field' | 'growth_chamber' | 'bench' | 'lab'

export interface FacilityLocation {
  id: string
  name: string
  type: LocationType
  description?: string
  capacity?: number
  /** Dimensiones opcionales de la grilla isométrica interior (filas × columnas) */
  rows?: number
  cols?: number
  parentId?: string // Para crear jerarquías (ej: Mesa dentro de Invernadero)
  /** Georreferencia para evaluar aptitud agroclimática de los cultivos. */
  coordinates?: GeoCoordinates
  createdAt: string
}

export type CreateLocationInput = Omit<FacilityLocation, 'id' | 'createdAt'>

/**
 * Formatea una coordenada de grilla (0-indexed) como etiqueta legible (ej: 0, 2 -> "A-03").
 */
export function formatGridPosition(row: number, col: number): string {
  const rowLetter = String.fromCharCode(65 + Math.max(0, Math.min(25, row)))
  const colNumber = String(Math.max(1, col + 1)).padStart(2, '0')
  return `${rowLetter}-${colNumber}`
}

/**
 * Parsea una etiqueta de posición de grilla (ej: "A-03" o "B3") a coordenadas 0-indexed.
 */
export function parseGridPosition(pos?: string): { row: number; col: number } | null {
  if (!pos) return null
  const match = pos.trim().toUpperCase().match(/^([A-Z])-?(\d{1,2})$/)
  if (!match) return null
  const row = match[1].charCodeAt(0) - 65
  const col = parseInt(match[2], 10) - 1
  if (row < 0 || col < 0) return null
  return { row, col }
}

/**
 * Calcula las dimensiones óptimas (rows × cols) de una sala para la vista isométrica 2.5D.
 */
export function getLocationGridDimensions(
  loc: Pick<FacilityLocation, 'rows' | 'cols' | 'capacity'>,
  currentPlantCount = 0
): { rows: number; cols: number; totalSlots: number } {
  if (loc.rows && loc.cols && loc.rows > 0 && loc.cols > 0) {
    return { rows: loc.rows, cols: loc.cols, totalSlots: loc.rows * loc.cols }
  }
  const targetSlots = Math.max(loc.capacity ?? 16, currentPlantCount, 6)
  const capped = Math.min(targetSlots, 64)
  const cols = Math.max(3, Math.ceil(Math.sqrt(capped * 1.25)))
  const rows = Math.max(2, Math.ceil(capped / cols))
  return { rows, cols, totalSlots: rows * cols }
}

/**
 * Genera todas las etiquetas de celdas de una grilla (ej: ["A-01", "A-02", ...]).
 */
export function getAllGridPositions(rows: number, cols: number): string[] {
  const positions: string[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions.push(formatGridPosition(r, c))
    }
  }
  return positions
}

export function isValidCoordinates(c: GeoCoordinates): boolean {
  return (
    Number.isFinite(c.latitude) && Math.abs(c.latitude) <= 90 &&
    Number.isFinite(c.longitude) && Math.abs(c.longitude) <= 180
  )
}

export function createLocation(input: CreateLocationInput): FacilityLocation {
  if (!input.name.trim()) {
    throw new Error('Location name is required')
  }

  if (input.coordinates && !isValidCoordinates(input.coordinates)) {
    throw new Error('Coordenadas inválidas: latitud ∈ [-90, 90], longitud ∈ [-180, 180]')
  }

  return {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
}
