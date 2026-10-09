import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createLocation } from '@/domain/location'
import type { FacilityLocation, CreateLocationInput } from '@/domain/location'

interface LocationState {
  locations: FacilityLocation[]
  add: (input: CreateLocationInput) => FacilityLocation
  update: (id: string, patch: Partial<FacilityLocation>) => void
  remove: (id: string) => void
  getById: (id: string) => FacilityLocation | undefined
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      locations: [],
      add: (input) => {
        const location = createLocation(input)
        set((state) => ({ locations: [...state.locations, location] }))
        return location
      },
      update: (id, patch) => {
        set((state) => ({
          locations: state.locations.map((loc) =>
            loc.id === id ? { ...loc, ...patch } : loc
          ),
        }))
      },
      remove: (id) => {
        set((state) => ({
          locations: state.locations.filter((loc) => loc.id !== id),
        }))
      },
      getById: (id) => {
        return get().locations.find((loc) => loc.id === id)
      },
    }),
    {
      name: 'plantin-location-storage',
    }
  )
)
