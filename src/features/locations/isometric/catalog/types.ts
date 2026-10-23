import type React from 'react'
import type { LocationType } from '@/domain/location'
import type { PlacedObject, PlantSlot } from '@/domain/roomLayout'

export interface ParamDef {
  key: string
  label: string
  type: 'number' | 'string' | 'boolean'
  unit?: 'cm' | 'm' | 'L' | 'unidades'
  min?: number
  max?: number
  step?: number
  default: number | string | boolean
}

export interface ObjectType {
  id: string // 'pot_20l', 'tray_72', 'raised_bed', 'bench', 'shelf_3', 'water_tank', 'led_panel', 'door', 'window'
  label: string
  category: 'container' | 'furniture' | 'equipment' | 'structure' | 'decor'
  footprint: { w: number; d: number; h: number } // cm, rotación 0
  resizable?: { w?: [min: number, max: number]; d?: [min: number, max: number] }
  mount: 'floor' | 'surface' | 'wall' // wall = puertas, ventanas, carteles
  allowedIn?: LocationType[]
  stackableSurfaceZ?: number[] // alturas donde se pueden apoyar otros objetos (estante 3 niveles: [0, 60, 120])
  params?: ParamDef[] // definición de parámetros editables
  slots?: (obj: PlacedObject) => Omit<PlantSlot, 'id' | 'objectId'>[]
  Renderer?: React.ComponentType<{ obj: PlacedObject; view: 'a' | 'b' }>
  PlanRenderer?: React.ComponentType<{ obj: PlacedObject }>
}
