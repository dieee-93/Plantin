import type { PlacedObject } from '@/domain/roomLayout'
import { OBJECT_CATALOG } from '../catalog'

export interface Box2D {
  x: number
  y: number
  w: number
  d: number
  z?: number
  h?: number
}

/**
 * Ajusta un valor en cm a la grilla de encastre (snapCm).
 */
export function snapToGrid(value: number, snapCm: number = 10): number {
  if (snapCm <= 0) return Math.round(value)
  return Math.round(value / snapCm) * snapCm
}

/**
 * Obtiene la caja 2D en planta (cm) de un objeto colocado considerando su rotación.
 */
export function getObjectBox(obj: PlacedObject): Box2D {
  const def = OBJECT_CATALOG[obj.typeId]
  const baseW = Number(obj.params?.widthCm ?? obj.params?.lengthCm ?? def?.footprint.w ?? 50)
  const baseD = Number(obj.params?.depthCm ?? def?.footprint.d ?? 50)
  const baseH = def?.footprint.h ?? 30

  const isRotated90or270 = obj.rotation === 90 || obj.rotation === 270
  const w = isRotated90or270 ? baseD : baseW
  const d = isRotated90or270 ? baseW : baseD

  return {
    x: obj.x,
    y: obj.y,
    z: obj.z,
    w,
    d,
    h: baseH,
  }
}

/**
 * Comprueba si dos cajas 2D se solapan en el plano XY (AABB).
 */
export function checkAABBOverlap(a: Box2D, b: Box2D): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.d && a.y + a.d > b.y
}

/**
 * Comprueba si una caja está enteramente dentro de los límites de la sala en cm.
 */
export function isWithinRoom(box: Box2D, roomWidthCm: number, roomDepthCm: number): boolean {
  return (
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.w <= roomWidthCm &&
    box.y + box.d <= roomDepthCm
  )
}

export interface ValidationResult {
  isValid: boolean
  reason?: string
}

/**
 * Valida la colocación de un objeto candidato frente a las dimensiones de la sala y otros objetos.
 * Si dos objetos están en diferentes alturas Z (por ejemplo, una maceta sobre una mesada a z=80),
 * no se considera colisión.
 */
export function validatePlacement(
  candidate: PlacedObject,
  otherObjects: PlacedObject[],
  roomWidthCm: number,
  roomDepthCm: number
): ValidationResult {
  const candidateBox = getObjectBox(candidate)

  // 1. Validar límites de la sala
  if (!isWithinRoom(candidateBox, roomWidthCm, roomDepthCm)) {
    return {
      isValid: false,
      reason: 'Fuera de los límites de la sala',
    }
  }

  // 2. Validar colisión con otros objetos en el mismo nivel Z
  for (const other of otherObjects) {
    if (other.id === candidate.id) continue

    const otherBox = getObjectBox(other)

    // Si coinciden en altura Z o sus rangos Z se solapan:
    const candZ = candidateBox.z ?? 0
    const candTopZ = candZ + (candidateBox.h ?? 0)
    const otherZ = otherBox.z ?? 0
    const otherTopZ = otherZ + (otherBox.h ?? 0)

    const zOverlap = candZ < otherTopZ && candTopZ > otherZ

    if (zOverlap && checkAABBOverlap(candidateBox, otherBox)) {
      const otherLabel = other.label || OBJECT_CATALOG[other.typeId]?.label || other.typeId
      return {
        isValid: false,
        reason: `Choca con ${otherLabel}`,
      }
    }
  }

  return { isValid: true }
}
