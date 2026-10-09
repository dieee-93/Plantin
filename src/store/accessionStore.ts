import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Accession, CreateAccessionInput } from '@/domain/accession'
import { createAccession } from '@/domain/accession'

interface AccessionState {
  accessions: Accession[]
  add: (input: CreateAccessionInput) => Accession
  update: (id: string, patch: Partial<Accession>) => void
  remove: (id: string) => void
  getById: (id: string) => Accession | undefined
}

export const useAccessionStore = create<AccessionState>()(
  persist(
    (set, get) => ({
      accessions: [],
      add: (input) => {
        const accession = createAccession(input) // Valida y crea
        set((state) => ({ accessions: [...state.accessions, accession] }))
        return accession
      },
      update: (id, patch) => {
        set((state) => ({
          accessions: state.accessions.map((a) =>
            a.id === id ? { ...a, ...patch } : a
          ),
        }))
      },
      remove: (id) => {
        set((state) => ({
          accessions: state.accessions.filter((a) => a.id !== id),
        }))
      },
      getById: (id) => {
        return get().accessions.find((a) => a.id === id)
      },
    }),
    {
      name: 'plantin-accession-storage',
    }
  )
)
