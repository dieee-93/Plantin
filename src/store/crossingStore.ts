import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createCrossingEvent } from '@/domain/crossingEvent'
import type { CrossingEvent, CreateCrossingEventInput } from '@/domain/crossingEvent'

interface CrossingState {
  crossings: CrossingEvent[]
  add: (input: CreateCrossingEventInput) => CrossingEvent
  update: (id: string, patch: Partial<CrossingEvent>) => void
  remove: (id: string) => void
  getById: (id: string) => CrossingEvent | undefined
}

export const useCrossingStore = create<CrossingState>()(
  persist(
    (set, get) => ({
      crossings: [],
      add: (input) => {
        const crossing = createCrossingEvent(input)
        set((state) => ({ crossings: [...state.crossings, crossing] }))
        return crossing
      },
      update: (id, patch) => {
        set((state) => ({
          crossings: state.crossings.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        }))
      },
      remove: (id) => {
        set((state) => ({
          crossings: state.crossings.filter((c) => c.id !== id),
        }))
      },
      getById: (id) => {
        return get().crossings.find((c) => c.id === id)
      },
    }),
    {
      name: 'plantin-crossing-storage',
    }
  )
)
