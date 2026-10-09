import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Taxon } from '@/domain/taxon'

export const INITIAL_TAXONS: Taxon[] = []

interface TaxonState {
  taxons: Taxon[]
  add: (taxon: Omit<Taxon, 'id'>) => Taxon
  update: (id: string, patch: Partial<Taxon>) => void
  remove: (id: string) => void
  getById: (id: string) => Taxon | undefined
}

export const useTaxonStore = create<TaxonState>()(
  persist(
    (set, get) => ({
      taxons: INITIAL_TAXONS,
      add: (input) => {
        const newTaxon = { ...input, id: crypto.randomUUID() }
        set((state) => ({ taxons: [...state.taxons, newTaxon] }))
        return newTaxon
      },
      update: (id, patch) => {
        set((state) => ({
          taxons: state.taxons.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }))
      },
      remove: (id) => {
        set((state) => ({
          taxons: state.taxons.filter((t) => t.id !== id),
        }))
      },
      getById: (id) => {
        return get().taxons.find((t) => t.id === id)
      },
    }),
    {
      name: 'plantin-taxon-storage',
    }
  )
)
