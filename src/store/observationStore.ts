import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PhenotypeObservation {
  id: string
  individualId: string
  traitId: string
  value: string | number | boolean
  date: string
  bbchAtObservation?: number
  notes?: string
}

interface ObservationState {
  observations: PhenotypeObservation[]
  add: (obs: Omit<PhenotypeObservation, 'id'>) => PhenotypeObservation
  remove: (id: string) => void
  getByIndividual: (individualId: string) => PhenotypeObservation[]
}

export const useObservationStore = create<ObservationState>()(
  persist(
    (set, get) => ({
      observations: [],
      add: (input) => {
        const newObs = { ...input, id: crypto.randomUUID() }
        set((state) => ({ observations: [...state.observations, newObs] }))
        return newObs
      },
      remove: (id) => {
        set((state) => ({
          observations: state.observations.filter((o) => o.id !== id),
        }))
      },
      getByIndividual: (individualId) => {
        return get().observations.filter((o) => o.individualId === individualId)
      },
    }),
    {
      name: 'plantin-observation-storage',
    }
  )
)
