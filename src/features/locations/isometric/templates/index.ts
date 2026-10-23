import { uuidv7 } from 'uuidv7'
import type { LocationType } from '@/domain/location'
import type { RoomLayout, FloorMaterial } from '@/domain/roomLayout'
import { DEFAULT_SNAP_CM, gridToLayout } from '@/domain/roomLayout'

export interface RoomTemplate {
  id: string
  label: string
  description: string
  locationType: LocationType
  widthCm: number
  depthCm: number
  floor: FloorMaterial
  createLayout: (locationId: string) => RoomLayout
}

export const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    id: 'greenhouse_standard',
    label: 'Invernadero 6×20 m con 3 mesadas',
    description: 'Invernadero túnel de 120 m² con 3 líneas de mesadas de cultivo y pasillos de trabajo.',
    locationType: 'greenhouse',
    widthCm: 600,
    depthCm: 2000,
    floor: 'concrete',
    createLayout: (locationId) => ({
      schemaVersion: 1,
      locationId,
      shape: { kind: 'rect', widthCm: 600, depthCm: 2000 },
      snapCm: DEFAULT_SNAP_CM,
      wallHeightCm: 280,
      floor: 'concrete',
      objects: [
        // Tanque de riego en la esquina técnica
        { id: uuidv7(), typeId: 'water_tank', x: 40, y: 40, z: 0, rotation: 0, label: 'Tanque H2O' },
        // 3 líneas de canteros/mesadas de cultivo
        {
          id: uuidv7(),
          typeId: 'raised_bed',
          x: 100,
          y: 200,
          z: 0,
          rotation: 0,
          label: 'Cantero Oeste',
          params: { widthCm: 100, depthCm: 1600, plantSpacingCm: 40, rowSpacingCm: 40 },
        },
        {
          id: uuidv7(),
          typeId: 'raised_bed',
          x: 250,
          y: 200,
          z: 0,
          rotation: 0,
          label: 'Cantero Central',
          params: { widthCm: 100, depthCm: 1600, plantSpacingCm: 40, rowSpacingCm: 40 },
        },
        {
          id: uuidv7(),
          typeId: 'raised_bed',
          x: 400,
          y: 200,
          z: 0,
          rotation: 0,
          label: 'Cantero Este',
          params: { widthCm: 100, depthCm: 1600, plantSpacingCm: 40, rowSpacingCm: 40 },
        },
      ],
    }),
  },
  {
    id: 'chamber_racks',
    label: 'Cámara 2.4×1.2 m con 2 racks de 3 niveles',
    description: 'Cámara de ambiente controlado con 2 estanterías multinivel (6 niveles de cultivo).',
    locationType: 'growth_chamber',
    widthCm: 240,
    depthCm: 120,
    floor: 'mesh',
    createLayout: (locationId) => ({
      schemaVersion: 1,
      locationId,
      shape: { kind: 'rect', widthCm: 240, depthCm: 120 },
      snapCm: DEFAULT_SNAP_CM,
      wallHeightCm: 220,
      floor: 'mesh',
      objects: [
        {
          id: uuidv7(),
          typeId: 'shelf_3',
          x: 20,
          y: 40,
          z: 0,
          rotation: 0,
          label: 'Rack Norte',
        },
        {
          id: uuidv7(),
          typeId: 'shelf_3',
          x: 130,
          y: 40,
          z: 0,
          rotation: 0,
          label: 'Rack Sur',
        },
      ],
    }),
  },
  {
    id: 'field_furrows',
    label: 'Parcela 10×20 m con surcos a 70 cm',
    description: 'Lote a cielo abierto con surcos de cultivo paralelos a 70 cm entre hileras.',
    locationType: 'field',
    widthCm: 1000,
    depthCm: 2000,
    floor: 'soil',
    createLayout: (locationId) => {
      const objects = []
      // 10 surcos paralelos distanciados 70 cm
      for (let i = 0; i < 10; i++) {
        objects.push({
          id: uuidv7(),
          typeId: 'furrow',
          x: 100 + i * 80,
          y: 100,
          z: 0,
          rotation: 90 as const,
          label: `Surco ${i + 1}`,
          params: { lengthCm: 1800, plantSpacingCm: 40 },
        })
      }
      return {
        schemaVersion: 1,
        locationId,
        shape: { kind: 'rect', widthCm: 1000, depthCm: 2000 },
        snapCm: DEFAULT_SNAP_CM,
        wallHeightCm: 0, // Campo abierto = sin paredes
        floor: 'soil',
        objects,
      }
    },
  },
  {
    id: 'lab_benches',
    label: 'Laboratorio 3×4 m con mesada y 4 bandejas',
    description: 'Sala de germinación y micropropagación con mesada central y bandejas de alvéolos.',
    locationType: 'lab',
    widthCm: 300,
    depthCm: 400,
    floor: 'tile',
    createLayout: (locationId) => {
      const benchId = uuidv7()
      return {
        schemaVersion: 1,
        locationId,
        shape: { kind: 'rect', widthCm: 300, depthCm: 400 },
        snapCm: DEFAULT_SNAP_CM,
        wallHeightCm: 260,
        floor: 'tile',
        objects: [
          {
            id: benchId,
            typeId: 'bench',
            x: 60,
            y: 120,
            z: 0,
            rotation: 0,
            label: 'Mesada Principal',
          },
          // 4 bandejas apoyadas sobre la mesada a z=80 cm
          { id: uuidv7(), typeId: 'tray_72', x: 65, y: 125, z: 80, rotation: 0, parentId: benchId, label: 'Bandeja 1' },
          { id: uuidv7(), typeId: 'tray_72', x: 125, y: 125, z: 80, rotation: 0, parentId: benchId, label: 'Bandeja 2' },
          { id: uuidv7(), typeId: 'tray_72', x: 65, y: 155, z: 80, rotation: 0, parentId: benchId, label: 'Bandeja 3' },
          { id: uuidv7(), typeId: 'tray_72', x: 125, y: 155, z: 80, rotation: 0, parentId: benchId, label: 'Bandeja 4' },
        ],
      }
    },
  },
  {
    id: 'room_pot_grid',
    label: 'Sala 4×5 m con grilla de macetas',
    description: 'Grilla regular de macetas individuales (equivalente a la disposición actual).',
    locationType: 'room',
    widthCm: 400,
    depthCm: 500,
    floor: 'concrete',
    createLayout: (locationId) => gridToLayout(10, 8, locationId, 'room'),
  },
  {
    id: 'empty_room',
    label: 'Espacio vacío',
    description: 'Piso despejado listo para diseñar desde cero con el catálogo de objetos.',
    locationType: 'greenhouse',
    widthCm: 500,
    depthCm: 500,
    floor: 'concrete',
    createLayout: (locationId) => ({
      schemaVersion: 1,
      locationId,
      shape: { kind: 'rect', widthCm: 500, depthCm: 500 },
      snapCm: DEFAULT_SNAP_CM,
      wallHeightCm: 250,
      floor: 'concrete',
      objects: [],
    }),
  },
]

export function getTemplatesForLocationType(type: LocationType): RoomTemplate[] {
  return ROOM_TEMPLATES.filter(
    (t) => t.locationType === type || t.id === 'empty_room'
  )
}

export function getTemplateById(templateId: string): RoomTemplate | undefined {
  return ROOM_TEMPLATES.find((t) => t.id === templateId)
}

export function getDefaultTemplateForType(type: LocationType): RoomTemplate {
  return (
    ROOM_TEMPLATES.find((t) => t.locationType === type) ??
    ROOM_TEMPLATES.find((t) => t.id === 'room_pot_grid') ??
    ROOM_TEMPLATES[0]
  )
}
