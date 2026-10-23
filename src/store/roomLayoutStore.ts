import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LocationType } from '@/domain/location'
import type { RoomLayout, PlacedObject, PlantSlot } from '@/domain/roomLayout'
import { deriveSlots, gridToLayout, DEFAULT_SNAP_CM } from '@/domain/roomLayout'
import { getDefaultTemplateForType, getTemplateById } from '@/features/locations/isometric/templates'
import { OBJECT_CATALOG } from '@/features/locations/isometric/catalog'

interface RoomLayoutState {
  layouts: Record<string, RoomLayout>
  getLayout: (locationId: string) => RoomLayout | undefined
  getOrCreateLayout: (
    locationId: string,
    locationType: LocationType,
    rows?: number,
    cols?: number
  ) => RoomLayout
  setLayout: (locationId: string, layout: RoomLayout) => void
  createFromTemplate: (locationId: string, templateId: string) => RoomLayout
  addObject: (locationId: string, obj: PlacedObject) => void
  updateObject: (locationId: string, objectId: string, patch: Partial<PlacedObject>) => void
  removeObject: (locationId: string, objectId: string) => void
  getSlots: (locationId: string) => PlantSlot[]
  resetAll: () => void
}

export const useRoomLayoutStore = create<RoomLayoutState>()(
  persist(
    (set, get) => ({
      layouts: {},

      getLayout: (locationId) => {
        return get().layouts[locationId]
      },

      getOrCreateLayout: (locationId, locationType, rows, cols) => {
        const existing = get().layouts[locationId]
        if (existing) {
          return existing
        }

        // Si se especifican filas/columnas explícitas, generamos grilla compatible
        let newLayout: RoomLayout
        if (rows && cols && rows > 0 && cols > 0) {
          newLayout = gridToLayout(rows, cols, locationId, locationType)
        } else {
          // Si no, aplicamos la plantilla por defecto para ese tipo de sala
          const template = getDefaultTemplateForType(locationType)
          newLayout = template.createLayout(locationId)
        }

        set((state) => ({
          layouts: {
            ...state.layouts,
            [locationId]: newLayout,
          },
        }))

        return newLayout
      },

      setLayout: (locationId, layout) => {
        set((state) => ({
          layouts: {
            ...state.layouts,
            [locationId]: layout,
          },
        }))
      },

      createFromTemplate: (locationId, templateId) => {
        const template = getTemplateById(templateId)
        if (!template) {
          throw new Error(`Plantilla no encontrada: ${templateId}`)
        }
        const layout = template.createLayout(locationId)
        set((state) => ({
          layouts: {
            ...state.layouts,
            [locationId]: layout,
          },
        }))
        return layout
      },

      addObject: (locationId, obj) => {
        set((state) => {
          const current = state.layouts[locationId] ?? {
            schemaVersion: 1,
            locationId,
            shape: { kind: 'rect', widthCm: 500, depthCm: 500 },
            snapCm: DEFAULT_SNAP_CM,
            wallHeightCm: 250,
            floor: 'soil',
            objects: [],
          }
          return {
            layouts: {
              ...state.layouts,
              [locationId]: {
                ...current,
                objects: [...current.objects, obj],
              },
            },
          }
        })
      },

      updateObject: (locationId, objectId, patch) => {
        set((state) => {
          const current = state.layouts[locationId]
          if (!current) return state
          return {
            layouts: {
              ...state.layouts,
              [locationId]: {
                ...current,
                objects: current.objects.map((o) =>
                  o.id === objectId ? { ...o, ...patch } : o
                ),
              },
            },
          }
        })
      },

      removeObject: (locationId, objectId) => {
        set((state) => {
          const current = state.layouts[locationId]
          if (!current) return state
          return {
            layouts: {
              ...state.layouts,
              [locationId]: {
                ...current,
                objects: current.objects.filter((o) => o.id !== objectId),
              },
            },
          }
        })
      },

      getSlots: (locationId) => {
        const layout = get().layouts[locationId]
        if (!layout) return []
        return deriveSlots(layout, OBJECT_CATALOG)
      },

      resetAll: () => {
        set({ layouts: {} })
      },
    }),
    {
      name: 'plantin-room-layout-storage',
      version: 1,
    }
  )
)
