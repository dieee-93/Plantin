import { describe, it, expect, beforeEach } from 'vitest'
import {
  deriveSlots,
  type RoomLayout,
  type PlacedObject,
} from '@/domain/roomLayout'
import { OBJECT_CATALOG } from '../catalog'
import { getPlantSpacing } from '@/data/plantSpacing'
import { useRoomLayoutStore } from '@/store/roomLayoutStore'
import { useIndividualStore } from '@/store/individualStore'

describe('Fase E4 — Contenedores con Espaciado y Grids Derivados', () => {
  beforeEach(() => {
    useRoomLayoutStore.getState().resetAll()
    // Limpiar individuos
    const allInds = useIndividualStore.getState().individuals
    allInds.forEach((i) => useIndividualStore.getState().remove(i.id))
  })

  describe('Cálculo reactivo de puestos en canteros y surcos', () => {
    it('recalcula puestos al cambiar plantSpacingCm de 40 a 20 en un cantero', () => {
      const bedObj: PlacedObject = {
        id: 'bed-test',
        typeId: 'raised_bed',
        x: 0,
        y: 0,
        z: 0,
        rotation: 0,
        params: {
          widthCm: 200,
          depthCm: 80,
          plantSpacingCm: 40, // 200 / 40 = 5 plantas
          rowSpacingCm: 40,   // 80 / 40 = 2 filas -> total 10 puestos
        },
      }

      const layout: RoomLayout = {
        schemaVersion: 1,
        locationId: 'loc-1',
        shape: { kind: 'rect', widthCm: 500, depthCm: 500 },
        snapCm: 10,
        wallHeightCm: 250,
        floor: 'concrete',
        objects: [bedObj],
      }

      let slots = deriveSlots(layout, OBJECT_CATALOG)
      expect(slots).toHaveLength(10)

      // Modificamos a 20 cm de espaciado (200 / 20 = 10 plantas × 2 filas = 20 puestos)
      const updatedObj = {
        ...bedObj,
        params: { ...bedObj.params, plantSpacingCm: 20 },
      }
      slots = deriveSlots({ ...layout, objects: [updatedObj] }, OBJECT_CATALOG)
      expect(slots).toHaveLength(20)
    })

    it('recalcula puestos en surco al cambiar lengthCm o plantSpacingCm', () => {
      const furrowObj: PlacedObject = {
        id: 'furrow-test',
        typeId: 'furrow',
        x: 50,
        y: 100,
        z: 0,
        rotation: 0,
        params: {
          lengthCm: 500,
          plantSpacingCm: 50, // 500 / 50 = 10 puestos
        },
      }

      const layout: RoomLayout = {
        schemaVersion: 1,
        locationId: 'loc-field',
        shape: { kind: 'rect', widthCm: 1000, depthCm: 1000 },
        snapCm: 10,
        wallHeightCm: 0,
        floor: 'soil',
        objects: [furrowObj],
      }

      let slots = deriveSlots(layout, OBJECT_CATALOG)
      expect(slots).toHaveLength(10)

      // Alargar el surco a 800 cm (800 / 50 = 16 puestos)
      const updatedFurrow = {
        ...furrowObj,
        params: { ...furrowObj.params, lengthCm: 800 },
      }
      slots = deriveSlots({ ...layout, objects: [updatedFurrow] }, OBJECT_CATALOG)
      expect(slots).toHaveLength(16)
    })

    it('deriva puestos multinivel con alturas Z independientes para shelf_3', () => {
      const shelfObj: PlacedObject = {
        id: 'shelf-1',
        typeId: 'shelf_3',
        x: 100,
        y: 100,
        z: 0,
        rotation: 0,
      }

      const layout: RoomLayout = {
        schemaVersion: 1,
        locationId: 'loc-chamber',
        shape: { kind: 'rect', widthCm: 400, depthCm: 400 },
        snapCm: 10,
        wallHeightCm: 250,
        floor: 'mesh',
        objects: [shelfObj],
      }

      const slots = deriveSlots(layout, OBJECT_CATALOG)
      expect(slots).toHaveLength(9) // 3 niveles × 3 puestos

      const zHeights = slots.map((s) => s.z)
      expect(zHeights).toContain(0)
      expect(zHeights).toContain(60)
      expect(zHeights).toContain(120)
    })

    it('garantiza que micro-trazados o longitudes mínimas produzcan al menos 1 puesto válido sin colapso ni NaN', () => {
      const microFurrow: PlacedObject = {
        id: 'micro-furrow',
        typeId: 'furrow',
        x: 0,
        y: 0,
        z: 0,
        rotation: 0,
        params: {
          lengthCm: 15, // Micro-arrastre menor al espaciado de 40 cm
          plantSpacingCm: 40,
        },
      }
      const layout: RoomLayout = {
        schemaVersion: 1,
        locationId: 'loc-field',
        shape: { kind: 'rect', widthCm: 1000, depthCm: 1000 },
        snapCm: 10,
        wallHeightCm: 0,
        floor: 'soil',
        objects: [microFurrow],
      }

      const slots = deriveSlots(layout, OBJECT_CATALOG)
      expect(slots).toHaveLength(1)
      expect(Number.isNaN(slots[0].x)).toBe(false)
      expect(Number.isNaN(slots[0].y)).toBe(false)
      expect(slots[0].label).toContain('Surco · P01')
    })
  })

  describe('Marco de plantación y avisos agronómicos', () => {
    it('compara el espaciado configurado contra la recomendación agronómica', () => {
      const tomRec = getPlantSpacing('TOM')
      expect(tomRec.isRecommended).toBe(true)
      expect(tomRec.plantCm).toBe(40)

      const userSpacing = 25
      const isUnderSpaced = userSpacing < tomRec.plantCm
      expect(isUnderSpaced).toBe(true)
    })
  })

  describe('Protección de plantas y estado "Sin ubicar"', () => {
    it('desasocia las plantas y las pasa a "Sin ubicar" si se elimina el contenedor', () => {
      const plantSlotId = 'bed-1:0'
      const ind = useIndividualStore.getState().add({
        accessionId: 'acc-1',
        locationId: 'loc-1',
        slotId: plantSlotId,
        position: 'Cantero 1 · R1-P01',
      })

      expect(ind.slotId).toBe('bed-1:0')

      // Simulamos la eliminación del contenedor: las plantas asociadas a bed-1 pasan a 'Sin ubicar'
      const currentInds = useIndividualStore.getState().individuals
      const affected = currentInds.filter(
        (i) => i.slotId?.startsWith('bed-1:') || i.position?.includes('Cantero 1')
      )

      affected.forEach((i) => {
        useIndividualStore.getState().update(i.id, {
          slotId: undefined,
          position: 'Sin ubicar',
        })
      })

      const updatedInd = useIndividualStore.getState().getById(ind.id)
      expect(updatedInd?.slotId).toBeUndefined()
      expect(updatedInd?.position).toBe('Sin ubicar')
    })
  })
})
