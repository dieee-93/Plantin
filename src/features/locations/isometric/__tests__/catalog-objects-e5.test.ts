import { describe, it, expect } from 'vitest'
import { getCatalogObject } from '../catalog'
import { topologicalSortFootprints } from '../geometry/depth'
import { getObjectBox } from '../editor/collision'
import type { PlacedObject } from '@/domain/roomLayout'

describe('Fase E5 — Catálogo Extendido de Objetos Agronómicos', () => {
  const newObjectIds = [
    'env_sensor_station',
    'irrigation_controller',
    'drip_irrigation_line',
    'sign_post',
    'pathway',
    'trellis',
  ]

  it('registra todos los objetos nuevos en OBJECT_CATALOG con renderer y categoría', () => {
    newObjectIds.forEach((id) => {
      const objDef = getCatalogObject(id)
      expect(objDef, `Objeto ${id} debe existir en el catálogo`).toBeDefined()
      expect(objDef?.Renderer, `Objeto ${id} debe tener un Renderer SVG asociado`).toBeDefined()
      expect(objDef?.category).toBeDefined()
      expect(objDef?.footprint).toBeDefined()
      expect(objDef?.footprint.w).toBeGreaterThan(0)
      expect(objDef?.footprint.d).toBeGreaterThan(0)
    })
  })

  it('configura parámetros y dimensiones editables para objetos reconfigurables', () => {
    const drip = getCatalogObject('drip_irrigation_line')
    expect(drip?.resizable?.w).toBeDefined()
    expect(drip?.params?.some((p) => p.key === 'lengthCm')).toBe(true)

    const pathway = getCatalogObject('pathway')
    expect(pathway?.resizable?.w).toBeDefined()
    expect(pathway?.resizable?.d).toBeDefined()

    const trellis = getCatalogObject('trellis')
    expect(trellis?.resizable?.w).toBeDefined()
  })

  it('calcula la caja 2D de colisión getObjectBox respetando rotación y params dinámicos', () => {
    const customDrip: PlacedObject = {
      id: 'drip-1',
      typeId: 'drip_irrigation_line',
      x: 100,
      y: 150,
      z: 0,
      rotation: 0,
      params: { lengthCm: 600 },
    }

    const box = getObjectBox(customDrip)
    expect(box.w).toBe(600)
    expect(box.d).toBe(8)

    // Rotado 90 grados
    const rotatedBox = getObjectBox({ ...customDrip, rotation: 90 })
    expect(rotatedBox.w).toBe(8)
    expect(rotatedBox.d).toBe(600)
  })

  it('ordena topológicamente escenas con objetos de E5 (pasillo en el piso, espaldera detrás de cantero)', () => {
    const pathwayObj: PlacedObject = {
      id: 'pathway-1',
      typeId: 'pathway',
      x: 50,
      y: 50,
      z: 0,
      rotation: 0,
      params: { widthCm: 300, depthCm: 50 },
    }

    const trellisObj: PlacedObject = {
      id: 'trellis-1',
      typeId: 'trellis',
      x: 50,
      y: 110,
      z: 0,
      rotation: 0,
      params: { widthCm: 200 },
    }

    const bedObj: PlacedObject = {
      id: 'bed-1',
      typeId: 'raised_bed',
      x: 50,
      y: 130, // Delante de la espaldera
      z: 0,
      rotation: 0,
      params: { widthCm: 200, depthCm: 80 },
    }

    const items = [bedObj, trellisObj, pathwayObj].map((obj) => {
      const box = getObjectBox(obj)
      return {
        obj,
        footprint: {
          x: box.x,
          y: box.y,
          z: box.z ?? obj.z,
          w: box.w,
          d: box.d,
          h: box.h ?? 30,
        },
      }
    })

    const sorted = topologicalSortFootprints(items)
    const sortedIds = sorted.map((s) => s.obj.id)

    // El pasillo (y=50) va detrás de la espaldera (y=110), y la espaldera va detrás del cantero (y=130)
    expect(sortedIds.indexOf('pathway-1')).toBeLessThan(sortedIds.indexOf('trellis-1'))
    expect(sortedIds.indexOf('trellis-1')).toBeLessThan(sortedIds.indexOf('bed-1'))
  })
})
