import type { LocationType } from './location'
import { formatGridPosition } from './location'

export const CELL_CM = 50
export const DEFAULT_SNAP_CM = 10

export type FloorMaterial = 'tile' | 'concrete' | 'soil' | 'grass' | 'gravel' | 'mesh'

export interface RoomShapeRect {
  kind: 'rect'
  widthCm: number
  depthCm: number
}

export interface RoomShapeCells {
  kind: 'cells'
  cellCm: number
  mask: boolean[][]
}

export type RoomShape = RoomShapeRect | RoomShapeCells

export interface RoomLayout {
  schemaVersion: 1
  locationId: string
  shape: RoomShape
  snapCm: number // 10 cm por defecto
  wallHeightCm: number // 0 = sin paredes (campo abierto)
  floor: FloorMaterial
  objects: PlacedObject[]
}

export interface PlacedObject {
  id: string // uuidv7
  typeId: string // Referencia al catálogo de objetos
  x: number // cm desde el vértice NW
  y: number // cm
  z: number // cm; z > 0 = apoyado sobre mesada o estante
  rotation: 0 | 90 | 180 | 270 // grados
  parentId?: string // ID del objeto soporte si está apoyado
  label?: string // Ej: "Cantero 1", "Maceta A-01"
  params?: Record<string, number | string | boolean> // Ej: { rowSpacingCm: 70, plantSpacingCm: 40, widthCm: 120 }
}

export interface PlantSlot {
  id: string // Identificador único y estable: `${objectId}:${index}`
  objectId: string
  x: number // Coordenada X global en la sala (cm)
  y: number // Coordenada Y global en la sala (cm)
  z: number // Altura sobre el suelo (cm)
  label: string // Etiqueta legible derivada para Individual.position (ej: "Cantero 1 · P03" o "A-01")
}

export interface CatalogObjectLike {
  id: string
  slots?: (obj: PlacedObject) => Omit<PlantSlot, 'id' | 'objectId'>[]
  footprint?: { w: number; d: number; h: number }
}

/**
 * Resuelve las coordenadas locales relativas de los puestos de una maceta o contenedor básico.
 */
function defaultContainerSlots(obj: PlacedObject): Omit<PlantSlot, 'id' | 'objectId'>[] {
  // Macetas individuales: 1 puesto centrado
  if (obj.typeId.startsWith('pot_') || obj.typeId === 'pot') {
    const size = obj.typeId === 'pot_1l' ? 15 : obj.typeId === 'pot_5l' ? 25 : 35
    return [
      {
        x: obj.x + size / 2,
        y: obj.y + size / 2,
        z: obj.z,
        label: obj.label || 'Puesto 1',
      },
    ]
  }

  // Bandeja de 72 alvéolos (6 filas x 12 columnas en 54x28 cm)
  if (obj.typeId === 'tray_72') {
    const cols = 12
    const rows = 6
    const w = 54
    const d = 28
    const dx = w / cols
    const dy = d / rows
    const slots: Omit<PlantSlot, 'id' | 'objectId'>[] = []

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const slotIdx = r * cols + c + 1
        const localX = (c + 0.5) * dx
        const localY = (r + 0.5) * dy

        // Rotación 0 / 90 / 180 / 270
        let rx = localX
        let ry = localY
        if (obj.rotation === 90) {
          rx = d - localY
          ry = localX
        } else if (obj.rotation === 180) {
          rx = w - localX
          ry = d - localY
        } else if (obj.rotation === 270) {
          rx = localY
          ry = w - localX
        }

        slots.push({
          x: obj.x + rx,
          y: obj.y + ry,
          z: obj.z,
          label: `${obj.label || 'Bandeja'} · A-${String(slotIdx).padStart(2, '0')}`,
        })
      }
    }
    return slots
  }

  // Cantero elevado con espaciado configurable
  if (obj.typeId === 'raised_bed') {
    const w = Number(obj.params?.widthCm ?? 200)
    const d = Number(obj.params?.depthCm ?? 80)
    const plantSpacing = Number(obj.params?.plantSpacingCm ?? 40)
    const rowSpacing = Number(obj.params?.rowSpacingCm ?? 40)

    const numRows = Math.max(1, Math.floor(d / rowSpacing))
    const numPlantsPerRow = Math.max(1, Math.floor(w / plantSpacing))

    const marginX = (w - (numPlantsPerRow - 1) * plantSpacing) / 2
    const marginY = (d - (numRows - 1) * rowSpacing) / 2

    const slots: Omit<PlantSlot, 'id' | 'objectId'>[] = []
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numPlantsPerRow; c++) {
        const localX = marginX + c * plantSpacing
        const localY = marginY + r * rowSpacing

        slots.push({
          x: obj.x + localX,
          y: obj.y + localY,
          z: obj.z + Number(obj.params?.heightCm ?? 40),
          label: `${obj.label || 'Cantero'} · R${r + 1}-P${String(c + 1).padStart(2, '0')}`,
        })
      }
    }
    return slots
  }

  // Surco / camellón de campo abierto
  if (obj.typeId === 'furrow' || obj.typeId === 'ridge') {
    const length = Number(obj.params?.lengthCm ?? 500)
    const plantSpacing = Number(obj.params?.plantSpacingCm ?? 40)
    const count = Math.max(1, Math.floor(length / plantSpacing))
    const margin = (length - (count - 1) * plantSpacing) / 2

    const slots: Omit<PlantSlot, 'id' | 'objectId'>[] = []
    for (let i = 0; i < count; i++) {
      const offset = margin + i * plantSpacing
      const localX = obj.rotation === 90 || obj.rotation === 270 ? 0 : offset
      const localY = obj.rotation === 90 || obj.rotation === 270 ? offset : 0

      slots.push({
        x: obj.x + localX,
        y: obj.y + localY,
        z: obj.z,
        label: `${obj.label || 'Surco'} · P${String(i + 1).padStart(2, '0')}`,
      })
    }
    return slots
  }

  // Estantería multinivel
  if (obj.typeId === 'shelf_3') {
    const levels = [0, 60, 120]
    const isRotated = obj.rotation === 90 || obj.rotation === 270
    const d = isRotated ? 100 : 40
    const slots: Omit<PlantSlot, 'id' | 'objectId'>[] = []
    levels.forEach((zLvl, lvlIdx) => {
      for (let i = 0; i < 3; i++) {
        const offsetX = isRotated ? d / 2 : 20 + i * 30
        const offsetY = isRotated ? 20 + i * 30 : d / 2
        slots.push({
          x: obj.x + offsetX,
          y: obj.y + offsetY,
          z: obj.z + zLvl,
          label: `${obj.label || 'Estante'} · N${lvlIdx + 1}-P${i + 1}`,
        })
      }
    })
    return slots
  }

  // Por defecto, 1 puesto central si tiene huella definida
  return [
    {
      x: obj.x + 20,
      y: obj.y + 20,
      z: obj.z,
      label: obj.label || 'Puesto 1',
    },
  ]
}

/**
 * Función pura que deriva la lista de todos los puestos de siembra (PlantSlot)
 * a partir de los objetos colocados en la sala y el catálogo.
 */
export function deriveSlots(
  layout: RoomLayout,
  catalog?: Record<string, CatalogObjectLike> | ((typeId: string) => CatalogObjectLike | undefined)
): PlantSlot[] {
  const allSlots: PlantSlot[] = []

  for (const obj of layout.objects) {
    const catalogItem =
      typeof catalog === 'function'
        ? catalog(obj.typeId)
        : catalog
          ? catalog[obj.typeId]
          : undefined

    const slotGenerator = catalogItem?.slots ?? defaultContainerSlots
    const relativeSlots = slotGenerator(obj)

    relativeSlots.forEach((slot, index) => {
      allSlots.push({
        id: `${obj.id}:${index}`,
        objectId: obj.id,
        x: slot.x,
        y: slot.y,
        z: slot.z,
        label: slot.label,
      })
    })
  }

  return allSlots
}

/**
 * Generador de compatibilidad: convierte una grilla histórica rows × cols
 * en un RoomLayout con macetas individuales encastradas cada 50 cm (CELL_CM).
 */
export function gridToLayout(
  rows: number,
  cols: number,
  locationId = 'default-location',
  locationType: LocationType = 'greenhouse'
): RoomLayout {
  const widthCm = cols * CELL_CM
  const depthCm = rows * CELL_CM

  const wallHeightCm = locationType === 'field' ? 0 : 250
  const floor: FloorMaterial =
    locationType === 'field'
      ? 'soil'
      : locationType === 'growth_chamber'
        ? 'mesh'
        : locationType === 'lab'
          ? 'tile'
          : 'concrete'

  const objects: PlacedObject[] = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const positionLabel = formatGridPosition(r, c)
      objects.push({
        id: `${locationId}-pot-${r}-${c}`,
        typeId: 'pot_20l',
        x: c * CELL_CM + (CELL_CM - 35) / 2,
        y: r * CELL_CM + (CELL_CM - 35) / 2,
        z: 0,
        rotation: 0,
        label: positionLabel,
      })
    }
  }

  return {
    schemaVersion: 1,
    locationId,
    shape: {
      kind: 'rect',
      widthCm,
      depthCm,
    },
    snapCm: DEFAULT_SNAP_CM,
    wallHeightCm,
    floor,
    objects,
  }
}
