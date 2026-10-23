import { describe, it, expect, beforeEach } from 'vitest'
import {
  deriveSlots,
  gridToLayout,
  CELL_CM,
  DEFAULT_SNAP_CM,
  type RoomLayout,
  type PlacedObject,
} from '../roomLayout'
import { OBJECT_CATALOG } from '@/features/locations/isometric/catalog'
import {
  ROOM_TEMPLATES,
  getTemplatesForLocationType,
  getTemplateById,
  getDefaultTemplateForType,
} from '@/features/locations/isometric/templates'
import { useRoomLayoutStore } from '@/store/roomLayoutStore'
import { getPlantSpacing, PLANT_SPACING_TABLE } from '@/data/plantSpacing'
import type { Individual } from '../individual'

describe('Fase E1 — Modelo de Espacios y Plantillas (roomLayout)', () => {
  beforeEach(() => {
    useRoomLayoutStore.getState().resetAll()
  })

  describe('deriveSlots y cálculo de puestos en centímetros', () => {
    it('deriva 1 puesto centrado para una maceta individual (pot_20l)', () => {
      const layout: RoomLayout = {
        schemaVersion: 1,
        locationId: 'loc-1',
        shape: { kind: 'rect', widthCm: 100, depthCm: 100 },
        snapCm: DEFAULT_SNAP_CM,
        wallHeightCm: 250,
        floor: 'concrete',
        objects: [
          {
            id: 'pot-obj-1',
            typeId: 'pot_20l',
            x: 20,
            y: 30,
            z: 0,
            rotation: 0,
            label: 'A-01',
          },
        ],
      }

      const slots = deriveSlots(layout, OBJECT_CATALOG)
      expect(slots).toHaveLength(1)
      expect(slots[0].id).toBe('pot-obj-1:0')
      expect(slots[0].objectId).toBe('pot-obj-1')
      expect(slots[0].x).toBe(20 + 17.5)
      expect(slots[0].y).toBe(30 + 17.5)
      expect(slots[0].z).toBe(0)
      expect(slots[0].label).toBe('A-01')
    })

    it('deriva exactamente 72 puestos distribuidos para una bandeja tray_72', () => {
      const layout: RoomLayout = {
        schemaVersion: 1,
        locationId: 'loc-lab',
        shape: { kind: 'rect', widthCm: 300, depthCm: 400 },
        snapCm: DEFAULT_SNAP_CM,
        wallHeightCm: 250,
        floor: 'tile',
        objects: [
          {
            id: 'tray-1',
            typeId: 'tray_72',
            x: 50,
            y: 50,
            z: 80, // sobre mesada
            rotation: 0,
            label: 'Bandeja Tomates',
          },
        ],
      }

      const slots = deriveSlots(layout, OBJECT_CATALOG)
      expect(slots).toHaveLength(72)
      expect(slots[0].id).toBe('tray-1:0')
      expect(slots[71].id).toBe('tray-1:71')
      expect(slots[0].z).toBe(80)
      expect(slots[0].label).toContain('Bandeja Tomates · A-01')
      expect(slots[71].label).toContain('Bandeja Tomates · A-72')
    })

    it('recalcula puestos en un cantero elevado según plantSpacingCm y rowSpacingCm', () => {
      const layout: RoomLayout = {
        schemaVersion: 1,
        locationId: 'loc-gh',
        shape: { kind: 'rect', widthCm: 600, depthCm: 600 },
        snapCm: DEFAULT_SNAP_CM,
        wallHeightCm: 250,
        floor: 'concrete',
        objects: [
          {
            id: 'bed-1',
            typeId: 'raised_bed',
            x: 100,
            y: 100,
            z: 0,
            rotation: 0,
            label: 'Cantero 1',
            params: {
              widthCm: 200,
              depthCm: 80,
              plantSpacingCm: 50, // 200 / 50 = 4 plantas por fila
              rowSpacingCm: 40,   // 80 / 40 = 2 filas -> total 8 puestos
            },
          },
        ],
      }

      const slots = deriveSlots(layout, OBJECT_CATALOG)
      expect(slots).toHaveLength(8)
      expect(slots[0].label).toContain('Cantero 1 · R1-P01')
      expect(slots[7].label).toContain('Cantero 1 · R2-P04')
      expect(slots[0].z).toBe(40) // z base + altura cantero
    })

    it('deriva puestos para surcos de campo a cielo abierto', () => {
      const layout: RoomLayout = {
        schemaVersion: 1,
        locationId: 'loc-field',
        shape: { kind: 'rect', widthCm: 1000, depthCm: 2000 },
        snapCm: DEFAULT_SNAP_CM,
        wallHeightCm: 0,
        floor: 'soil',
        objects: [
          {
            id: 'furrow-1',
            typeId: 'furrow',
            x: 100,
            y: 100,
            z: 0,
            rotation: 0,
            label: 'Surco Maíz',
            params: {
              lengthCm: 1000,
              plantSpacingCm: 50, // 1000 / 50 = 20 plantas
            },
          },
        ],
      }

      const slots = deriveSlots(layout, OBJECT_CATALOG)
      expect(slots).toHaveLength(20)
      expect(slots[0].label).toBe('Surco Maíz · P01')
      expect(slots[19].label).toBe('Surco Maíz · P20')
    })
  })

  describe('gridToLayout y compatibilidad hacia atrás', () => {
    it('convierte una grilla 4×5 en RoomLayout de 200×250 cm con 20 macetas y etiquetas A-01..D-05', () => {
      const layout = gridToLayout(4, 5, 'room-test-1', 'greenhouse')

      expect(layout.schemaVersion).toBe(1)
      expect(layout.shape.kind).toBe('rect')
      if (layout.shape.kind === 'rect') {
        expect(layout.shape.widthCm).toBe(5 * CELL_CM) // 250 cm
        expect(layout.shape.depthCm).toBe(4 * CELL_CM) // 200 cm
      }
      expect(layout.objects).toHaveLength(20)

      // Etiquetas preservadas
      const labels = layout.objects.map((o) => o.label)
      expect(labels).toContain('A-01')
      expect(labels).toContain('A-05')
      expect(labels).toContain('D-05')

      const slots = deriveSlots(layout, OBJECT_CATALOG)
      expect(slots).toHaveLength(20)
      expect(slots.map((s) => s.label)).toEqual(labels)
    })
  })

  describe('plantSpacing.ts — Marcos de plantación recomendados', () => {
    it('resuelve espaciados curados de INTA y FAO para los principales cultivos', () => {
      const tom = getPlantSpacing('TOM')
      expect(tom.isRecommended).toBe(true)
      expect(tom.plantCm).toBe(40)
      expect(tom.rowCm).toBe(70)
      expect(tom.source).toContain('INTA')

      const mai = getPlantSpacing('MAI')
      expect(mai.isRecommended).toBe(true)
      expect(mai.plantCm).toBe(25)
      expect(mai.rowCm).toBe(70)
      expect(mai.source).toContain('FAO')

      const lettuce = getPlantSpacing({ genus: 'Lactuca', species: 'sativa' })
      expect(lettuce.isRecommended).toBe(true)
      expect(lettuce.plantCm).toBe(25)
      expect(lettuce.rowCm).toBe(30)
    })

    it('devuelve fallback estándar 40×70 cm con isRecommended=false si no hay dato agronómico', () => {
      const unknown = getPlantSpacing('UNKNOWN_CROP')
      expect(unknown.isRecommended).toBe(false)
      expect(unknown.plantCm).toBe(40)
      expect(unknown.rowCm).toBe(70)
    })

    it('la tabla contiene ~30 cultivos curados', () => {
      const count = Object.keys(PLANT_SPACING_TABLE).length
      expect(count).toBeGreaterThanOrEqual(25)
    })
  })

  describe('Individual.slotId en el modelo de dominio', () => {
    it('permite registrar slotId en Individual sin romper campos existentes', () => {
      const individual: Individual = {
        id: 'ind-1',
        accessionId: 'acc-1',
        label: 'TOM-2026 #01',
        locationId: 'room-1',
        position: 'A-01',
        slotId: 'pot-obj-1:0',
        status: 'active',
        currentBBCH: 15,
      }

      expect(individual.slotId).toBe('pot-obj-1:0')
      expect(individual.position).toBe('A-01')
    })
  })

  describe('useRoomLayoutStore y Plantillas por LocationType (Decision D3)', () => {
    it('dispone de las 6 plantillas de referencia', () => {
      expect(ROOM_TEMPLATES.length).toBeGreaterThanOrEqual(6)
      expect(getTemplateById('greenhouse_standard')).toBeDefined()
      expect(getTemplateById('chamber_racks')).toBeDefined()
      expect(getTemplateById('field_furrows')).toBeDefined()
      expect(getTemplateById('lab_benches')).toBeDefined()
      expect(getTemplateById('room_pot_grid')).toBeDefined()
      expect(getTemplateById('empty_room')).toBeDefined()
    })

    it('filtra plantillas válidas por LocationType y resuelve la plantilla por defecto', () => {
      const ghTemplates = getTemplatesForLocationType('greenhouse')
      expect(ghTemplates.some((t) => t.id === 'greenhouse_standard')).toBe(true)

      const fieldTemplates = getTemplatesForLocationType('field')
      expect(fieldTemplates.some((t) => t.id === 'field_furrows')).toBe(true)

      const defGh = getDefaultTemplateForType('greenhouse')
      expect(defGh.id).toBe('greenhouse_standard')
    })

    it('createFromTemplate genera el layout inicial con objetos y puestos', () => {
      const store = useRoomLayoutStore.getState()
      const layout = store.createFromTemplate('loc-gh-1', 'greenhouse_standard')

      expect(layout.locationId).toBe('loc-gh-1')
      expect(layout.objects.length).toBeGreaterThan(0)

      const slots = store.getSlots('loc-gh-1')
      expect(slots.length).toBeGreaterThan(0)
    })

    it('permite añadir, actualizar y remover objetos del layout', () => {
      const store = useRoomLayoutStore.getState()
      store.createFromTemplate('loc-test', 'empty_room')

      const newObj: PlacedObject = {
        id: 'new-pot-1',
        typeId: 'pot_20l',
        x: 100,
        y: 100,
        z: 0,
        rotation: 0,
        label: 'Maceta Test',
      }

      store.addObject('loc-test', newObj)
      expect(store.getLayout('loc-test')?.objects).toHaveLength(1)
      expect(store.getSlots('loc-test')).toHaveLength(1)

      store.updateObject('loc-test', 'new-pot-1', { label: 'Maceta Actualizada' })
      expect(store.getSlots('loc-test')[0].label).toBe('Maceta Actualizada')

      store.removeObject('loc-test', 'new-pot-1')
      expect(store.getLayout('loc-test')?.objects).toHaveLength(0)
      expect(store.getSlots('loc-test')).toHaveLength(0)
    })
  })
})
