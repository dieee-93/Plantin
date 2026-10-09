export type LocationType = 'greenhouse' | 'room' | 'field' | 'growth_chamber' | 'bench' | 'lab'

export interface FacilityLocation {
  id: string
  name: string
  type: LocationType
  description?: string
  capacity?: number
  parentId?: string // Para crear jerarquías (ej: Mesa dentro de Invernadero)
  createdAt: string
}

export type CreateLocationInput = Omit<FacilityLocation, 'id' | 'createdAt'>

export function createLocation(input: CreateLocationInput): FacilityLocation {
  if (!input.name.trim()) {
    throw new Error('Location name is required')
  }

  return {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
}
