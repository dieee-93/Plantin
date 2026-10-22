import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createSeedLot } from '@/domain/seedLot'
import type { SeedLot, CreateSeedLotInput } from '@/domain/seedLot'

interface SeedLotState {
  seedLots: SeedLot[]
  add: (input: CreateSeedLotInput) => SeedLot
  update: (id: string, patch: Partial<SeedLot>) => void
  remove: (id: string) => void
  getById: (id: string) => SeedLot | undefined
  getByAccession: (accessionId: string) => SeedLot[]
  consumeSeeds: (id: string, count?: number) => void
}

export const useSeedLotStore = create<SeedLotState>()(
  persist(
    (set, get) => ({
      seedLots: [],
      add: (input) => {
        const seedLot = createSeedLot(input)
        set((state) => ({ seedLots: [...state.seedLots, seedLot] }))
        return seedLot
      },
      update: (id, patch) => {
        set((state) => ({
          seedLots: state.seedLots.map((lot) =>
            lot.id === id ? { ...lot, ...patch } : lot
          ),
        }))
      },
      remove: (id) => {
        set((state) => ({
          seedLots: state.seedLots.filter((lot) => lot.id !== id),
        }))
      },
      getById: (id) => {
        return get().seedLots.find((lot) => lot.id === id)
      },
      getByAccession: (accessionId) => {
        return get().seedLots.filter((lot) => lot.accessionId === accessionId)
      },
      consumeSeeds: (id, count = 1) => {
        set((state) => ({
          seedLots: state.seedLots.map((lot) => {
            if (lot.id !== id || lot.currentCount === undefined) return lot
            const nextCount = Math.max(0, lot.currentCount - count)
            return {
              ...lot,
              currentCount: nextCount,
              status: nextCount === 0 ? 'exhausted' : lot.status,
            }
          }),
        }))
      },
    }),
    {
      name: 'plantin-seedlot-storage',
    }
  )
)
