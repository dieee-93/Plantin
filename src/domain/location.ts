import type { GeoCoordinates } from './agroclimate/types'

export type LocationType = 'greenhouse' | 'room' | 'field' | 'growth_chamber' | 'bench' | 'lab'

export interface FacilityLocation {
  id: string
  name: string
  type: LocationType
  description?: string
  capacity?: number
  parentId?: string // Para crear jerarquías (ej: Mesa dentro de Invernadero)
  /** Georreferencia para evaluar aptitud agroclimática de los cultivos. */
  coordinates?: GeoCoordinates
  createdAt: string
}

export type CreateLocationInput = Omit<FacilityLocation, 'id' | 'createdAt'>

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
