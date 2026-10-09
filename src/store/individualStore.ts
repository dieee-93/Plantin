import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createIndividual } from '@/domain/individual'
import type { Individual, CreateIndividualInput } from '@/domain/individual'

interface IndividualState {
  individuals: Individual[]
  add: (input: CreateIndividualInput) => Individual
  update: (id: string, patch: Partial<Individual>) => void
  remove: (id: string) => void
  getById: (id: string) => Individual | undefined
  getByAccession: (accessionId: string) => Individual[]
}

export const useIndividualStore = create<IndividualState>()(
  persist(
    (set, get) => ({
      individuals: [],
      add: (input) => {
        const individual = createIndividual(input)
        set((state) => ({ individuals: [...state.individuals, individual] }))
        return individual
      },
      update: (id, patch) => {
        set((state) => ({
          individuals: state.individuals.map((ind) =>
            ind.id === id ? { ...ind, ...patch } : ind
          ),
        }))
      },
      remove: (id) => {
        set((state) => ({
          individuals: state.individuals.filter((ind) => ind.id !== id),
        }))
      },
      getById: (id) => {
        return get().individuals.find((ind) => ind.id === id)
      },
      getByAccession: (accessionId) => {
        return get().individuals.filter((ind) => ind.accessionId === accessionId)
      },
    }),
    {
      name: 'plantin-individual-storage',
    }
  )
)
