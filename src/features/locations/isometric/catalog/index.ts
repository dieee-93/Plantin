import React from 'react'
import type { ObjectType } from './types'
import {
  PotRenderer,
  TrayRenderer,
  RaisedBedRenderer,
  FurrowRenderer,
  BenchRenderer,
  ShelfRenderer,
  WaterTankRenderer,
  LedPanelRenderer,
  DoorRenderer,
  WindowRenderer,
  SensorStationRenderer,
  IrrigationControllerRenderer,
  DripLineRenderer,
  SignPostRenderer,
  PathwayRenderer,
  TrellisRenderer,
} from './renderers'
import { RASTER_OBJECTS } from './raster/manifest.generated'
import { ImageObjectRenderer } from './raster/ImageObjectRenderer'

function withRasterFallback(typeId: string, ProceduralRenderer: React.FC<any>): React.FC<any> {
  const DynamicRenderer: React.FC<any> = (props) => {
    if (RASTER_OBJECTS[typeId]) {
      return React.createElement(ImageObjectRenderer, props)
    }
    return React.createElement(ProceduralRenderer, props)
  }
  DynamicRenderer.displayName = `RendererWithFallback(${typeId})`
  return DynamicRenderer
}

export const OBJECT_CATALOG: Record<string, ObjectType> = {
  pot_20l: {
    id: 'pot_20l',
    label: 'Maceta 20 L',
    category: 'container',
    footprint: { w: 35, d: 35, h: 30 },
    mount: 'floor',
    allowedIn: ['greenhouse', 'room', 'bench', 'lab'],
    Renderer: withRasterFallback('pot_20l', PotRenderer),
    slots: (obj) => [
      {
        x: obj.x + 17.5,
        y: obj.y + 17.5,
        z: obj.z,
        label: obj.label || 'Maceta 20L',
      },
    ],
  },
  pot_5l: {
    id: 'pot_5l',
    label: 'Maceta 5 L',
    category: 'container',
    footprint: { w: 25, d: 25, h: 22 },
    mount: 'floor',
    allowedIn: ['greenhouse', 'room', 'bench', 'growth_chamber', 'lab'],
    Renderer: withRasterFallback('pot_5l', PotRenderer),
    slots: (obj) => [
      {
        x: obj.x + 12.5,
        y: obj.y + 12.5,
        z: obj.z,
        label: obj.label || 'Maceta 5L',
      },
    ],
  },
  pot_1l: {
    id: 'pot_1l',
    label: 'Maceta 1 L',
    category: 'container',
    footprint: { w: 15, d: 15, h: 14 },
    mount: 'floor',
    allowedIn: ['greenhouse', 'room', 'bench', 'growth_chamber', 'lab'],
    Renderer: withRasterFallback('pot_1l', PotRenderer),
    slots: (obj) => [
      {
        x: obj.x + 7.5,
        y: obj.y + 7.5,
        z: obj.z,
        label: obj.label || 'Maceta 1L',
      },
    ],
  },
  tray_72: {
    id: 'tray_72',
    label: 'Bandeja 72 alvéolos',
    category: 'container',
    footprint: { w: 54, d: 28, h: 5 },
    mount: 'floor',
    allowedIn: ['greenhouse', 'growth_chamber', 'lab', 'bench'],
    Renderer: withRasterFallback('tray_72', TrayRenderer),
    slots: (obj) => {
      const cols = 12
      const rows = 6
      const w = 54
      const d = 28
      const dx = w / cols
      const dy = d / rows
      const slots = []

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const slotNum = r * cols + c + 1
          slots.push({
            x: obj.x + (c + 0.5) * dx,
            y: obj.y + (r + 0.5) * dy,
            z: obj.z,
            label: `${obj.label || 'Bandeja'} · A-${String(slotNum).padStart(2, '0')}`,
          })
        }
      }
      return slots
    },
  },
  raised_bed: {
    id: 'raised_bed',
    label: 'Cantero elevado',
    category: 'container',
    footprint: { w: 200, d: 80, h: 40 },
    resizable: { w: [100, 500], d: [40, 150] },
    mount: 'floor',
    allowedIn: ['greenhouse', 'room', 'field'],
    Renderer: RaisedBedRenderer,
    params: [
      { key: 'widthCm', label: 'Ancho', type: 'number', unit: 'cm', min: 100, max: 500, step: 10, default: 200 },
      { key: 'depthCm', label: 'Profundidad', type: 'number', unit: 'cm', min: 40, max: 150, step: 10, default: 80 },
      { key: 'plantSpacingCm', label: 'Distancia entre plantas', type: 'number', unit: 'cm', min: 15, max: 100, step: 5, default: 40 },
      { key: 'rowSpacingCm', label: 'Distancia entre filas', type: 'number', unit: 'cm', min: 20, max: 100, step: 5, default: 40 },
    ],
    slots: (obj) => {
      const w = Number(obj.params?.widthCm ?? 200)
      const d = Number(obj.params?.depthCm ?? 80)
      const plantSpacing = Number(obj.params?.plantSpacingCm ?? 40)
      const rowSpacing = Number(obj.params?.rowSpacingCm ?? 40)

      const numRows = Math.max(1, Math.floor(d / rowSpacing))
      const numPlantsPerRow = Math.max(1, Math.floor(w / plantSpacing))

      const marginX = (w - (numPlantsPerRow - 1) * plantSpacing) / 2
      const marginY = (d - (numRows - 1) * rowSpacing) / 2

      const slots = []
      for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numPlantsPerRow; c++) {
          slots.push({
            x: obj.x + marginX + c * plantSpacing,
            y: obj.y + marginY + r * rowSpacing,
            z: obj.z + 40,
            label: `${obj.label || 'Cantero'} · R${r + 1}-P${String(c + 1).padStart(2, '0')}`,
          })
        }
      }
      return slots
    },
  },
  furrow: {
    id: 'furrow',
    label: 'Surco / Camellón',
    category: 'container',
    footprint: { w: 1000, d: 40, h: 15 },
    resizable: { w: [200, 3000], d: [30, 80] },
    mount: 'floor',
    allowedIn: ['field'],
    Renderer: FurrowRenderer,
    params: [
      { key: 'lengthCm', label: 'Largo', type: 'number', unit: 'cm', min: 200, max: 3000, step: 50, default: 1000 },
      { key: 'plantSpacingCm', label: 'Distancia entre plantas', type: 'number', unit: 'cm', min: 15, max: 150, step: 5, default: 40 },
    ],
    slots: (obj) => {
      const length = Number(obj.params?.lengthCm ?? 1000)
      const plantSpacing = Number(obj.params?.plantSpacingCm ?? 40)
      const count = Math.max(1, Math.floor(length / plantSpacing))
      const margin = (length - (count - 1) * plantSpacing) / 2

      const slots = []
      for (let i = 0; i < count; i++) {
        slots.push({
          x: obj.x + margin + i * plantSpacing,
          y: obj.y + 20,
          z: obj.z,
          label: `${obj.label || 'Surco'} · P${String(i + 1).padStart(2, '0')}`,
        })
      }
      return slots
    },
  },
  bench: {
    id: 'bench',
    label: 'Mesada de cultivo',
    category: 'furniture',
    footprint: { w: 120, d: 60, h: 80 },
    resizable: { w: [80, 240], d: [40, 100] },
    mount: 'floor',
    allowedIn: ['greenhouse', 'room', 'bench', 'lab'],
    stackableSurfaceZ: [80],
    Renderer: BenchRenderer,
  },
  shelf_3: {
    id: 'shelf_3',
    label: 'Estantería 3 niveles',
    category: 'furniture',
    footprint: { w: 100, d: 40, h: 180 },
    mount: 'floor',
    allowedIn: ['growth_chamber', 'room', 'lab'],
    stackableSurfaceZ: [0, 60, 120],
    Renderer: withRasterFallback('shelf_3', ShelfRenderer),
    slots: (obj) => {
      const levels = [0, 60, 120]
      const isRotated = obj.rotation === 90 || obj.rotation === 270
      const d = isRotated ? 100 : 40
      const slots: { x: number; y: number; z: number; label: string }[] = []
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
    },
  },
  water_tank: {
    id: 'water_tank',
    label: 'Tanque de riego',
    category: 'equipment',
    footprint: { w: 80, d: 80, h: 160 },
    mount: 'floor',
    allowedIn: ['greenhouse', 'room', 'field'],
    Renderer: withRasterFallback('water_tank', WaterTankRenderer),
  },
  led_panel: {
    id: 'led_panel',
    label: 'Panel LED',
    category: 'equipment',
    footprint: { w: 100, d: 30, h: 10 },
    mount: 'surface',
    allowedIn: ['growth_chamber', 'lab', 'greenhouse'],
    Renderer: withRasterFallback('led_panel', LedPanelRenderer),
  },
  door: {
    id: 'door',
    label: 'Puerta técnica',
    category: 'structure',
    footprint: { w: 90, d: 10, h: 210 },
    mount: 'wall',
    allowedIn: ['greenhouse', 'growth_chamber', 'lab', 'room'],
    Renderer: withRasterFallback('door', DoorRenderer),
  },
  window: {
    id: 'window',
    label: 'Ventana de ventilación',
    category: 'structure',
    footprint: { w: 120, d: 10, h: 100 },
    mount: 'wall',
    allowedIn: ['greenhouse', 'room', 'lab'],
    Renderer: withRasterFallback('window', WindowRenderer),
  },
  env_sensor_station: {
    id: 'env_sensor_station',
    label: 'Estación IoT Agroclimática',
    category: 'equipment',
    footprint: { w: 25, d: 25, h: 140 },
    mount: 'floor',
    allowedIn: ['greenhouse', 'growth_chamber', 'field', 'room'],
    Renderer: withRasterFallback('env_sensor_station', SensorStationRenderer),
  },
  irrigation_controller: {
    id: 'irrigation_controller',
    label: 'Programador de Riego / Válvulas',
    category: 'equipment',
    footprint: { w: 50, d: 20, h: 70 },
    mount: 'wall',
    allowedIn: ['greenhouse', 'room', 'growth_chamber', 'field'],
    Renderer: withRasterFallback('irrigation_controller', IrrigationControllerRenderer),
  },
  drip_irrigation_line: {
    id: 'drip_irrigation_line',
    label: 'Línea de Goteo',
    category: 'equipment',
    footprint: { w: 400, d: 8, h: 4 },
    resizable: { w: [100, 2500], d: [8, 8] },
    mount: 'floor',
    allowedIn: ['greenhouse', 'field', 'room'],
    params: [
      { key: 'lengthCm', label: 'Largo', type: 'number', unit: 'cm', min: 100, max: 2500, step: 50, default: 400 },
    ],
    Renderer: DripLineRenderer,
  },
  sign_post: {
    id: 'sign_post',
    label: 'Cartel de Parcela / Lote',
    category: 'decor',
    footprint: { w: 45, d: 15, h: 85 },
    mount: 'floor',
    allowedIn: ['field', 'greenhouse', 'room'],
    Renderer: withRasterFallback('sign_post', SignPostRenderer),
  },
  pathway: {
    id: 'pathway',
    label: 'Pasillo Técnico / Rejilla',
    category: 'structure',
    footprint: { w: 200, d: 50, h: 2 },
    resizable: { w: [50, 600], d: [40, 150] },
    mount: 'floor',
    allowedIn: ['greenhouse', 'room', 'field', 'growth_chamber'],
    params: [
      { key: 'widthCm', label: 'Largo', type: 'number', unit: 'cm', min: 50, max: 600, step: 25, default: 200 },
      { key: 'depthCm', label: 'Ancho', type: 'number', unit: 'cm', min: 40, max: 150, step: 10, default: 50 },
    ],
    Renderer: PathwayRenderer,
  },
  trellis: {
    id: 'trellis',
    label: 'Espaldera / Tutor de Guiado',
    category: 'structure',
    footprint: { w: 200, d: 10, h: 180 },
    resizable: { w: [100, 1000], d: [10, 10] },
    mount: 'floor',
    allowedIn: ['field', 'greenhouse'],
    params: [
      { key: 'widthCm', label: 'Largo', type: 'number', unit: 'cm', min: 100, max: 1000, step: 50, default: 200 },
    ],
    Renderer: TrellisRenderer,
  },
}

export function getCatalogObject(typeId: string): ObjectType | undefined {
  return OBJECT_CATALOG[typeId]
}
