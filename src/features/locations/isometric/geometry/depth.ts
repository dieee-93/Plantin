import type React from 'react'
import { halfW, halfH, projectCell } from './iso'

export interface Footprint {
  x: number // cm (eje columnas)
  y: number // cm (eje filas)
  w: number // cm ancho
  d: number // cm profundidad
  z?: number // cm altura base
  h?: number // cm altura del objeto
}

export interface Drawable {
  key: string
  row: number
  col: number
  layer: number // orden vertical de capas (ej. 0: suelo, 1: escenografía, 2: celdas, 3: plantas, 4: etiquetas, 5: overlays)
  subOrder?: number
  footprint?: Footprint
  node: React.ReactNode
}

/**
 * Compara la profundidad isométrica de dos elementos.
 * Para objetos con huella dimensional en cm (Footprint), A va detrás de B si su caja
 * queda estrictamente detrás en el eje X o en el eje Y del mundo.
 * Para celdas o elementos discretos, se utiliza la suma (row + col).
 */
export function compareDepth(a: Drawable, b: Drawable): number {
  if (a.footprint && b.footprint) {
    // Si A está completamente detrás de B en X o en Y:
    const aBehindB =
      a.footprint.x + a.footprint.w <= b.footprint.x ||
      a.footprint.y + a.footprint.d <= b.footprint.y

    const bBehindA =
      b.footprint.x + b.footprint.w <= a.footprint.x ||
      b.footprint.y + b.footprint.d <= a.footprint.y

    if (aBehindB && !bBehindA) return -1
    if (bBehindA && !aBehindB) return 1

    // Si sus huellas en el piso coinciden, comparar altura Z
    if (a.footprint.z !== undefined && b.footprint.z !== undefined) {
      const aH = a.footprint.h ?? 0
      const bH = b.footprint.h ?? 0
      if (a.footprint.z + aH <= b.footprint.z) return -1
      if (b.footprint.z + bH <= a.footprint.z) return 1
    }
  }

  // Orden primario por profundidad isométrica de la grilla (row + col)
  const depthA = a.row + a.col
  const depthB = b.row + b.col
  if (depthA !== depthB) {
    return depthA - depthB
  }

  // Orden secundario por capa (layer asc)
  if (a.layer !== b.layer) {
    return a.layer - b.layer
  }

  // Orden terciario por subOrder
  const subA = a.subOrder ?? 0
  const subB = b.subOrder ?? 0
  if (subA !== subB) {
    return subA - subB
  }

  return a.key.localeCompare(b.key)
}

/**
 * Ordena una lista de dibujables según el algoritmo del pintor para proyección isométrica.
 */
export function sortDrawables(list: Drawable[]): Drawable[] {
  return [...list].sort(compareDepth)
}

export interface GridLocation {
  row: number
  col: number
}

export interface PlantOcclusionParams extends GridLocation {
  heightScale?: number
  bbch?: number
}

/**
 * Determina si una planta ubicada en 'front' ocluye visualmente (tapa) a la celda 'back'.
 * Para que haya oclusión:
 * 1. 'front' debe estar más cerca de la cámara que 'back' (front.row + front.col > back.row + back.col).
 * 2. La caja delimitadora proyectada en pantalla del follaje de 'front' debe intersectar
 *    el área de la baldosa o contenedor de 'back'.
 */
export function occludes(
  front: PlantOcclusionParams,
  back: GridLocation
): boolean {
  const frontDepth = front.row + front.col
  const backDepth = back.row + back.col

  // Solo puede ocluir si está por delante en profundidad isométrica
  if (frontDepth <= backDepth) {
    return false
  }

  const frontPos = projectCell(front.row, front.col)
  const backPos = projectCell(back.row, back.col)

  // Estimación de la altura del follaje del sprite delantero según BBCH / scale
  // Una planta madura típica (tomate, girasol, maíz) mide entre 50 y 75 px de alto
  const bbch = front.bbch ?? 50
  const baseHeight = bbch < 10 ? 15 : bbch < 30 ? 35 : bbch < 60 ? 55 : 75
  const spriteHeight = baseHeight * (front.heightScale ?? 1)
  const spriteHalfWidth = 32

  // Caja de pantalla del sprite delantero (crece hacia arriba desde la base del contenedor)
  const frontBox = {
    left: frontPos.x - spriteHalfWidth,
    right: frontPos.x + spriteHalfWidth,
    top: frontPos.y - spriteHeight,
    bottom: frontPos.y,
  }

  // Caja de pantalla de la baldosa trasera (área interactiva de la celda)
  const backBox = {
    left: backPos.x - halfW * 0.75,
    right: backPos.x + halfW * 0.75,
    top: backPos.y - halfH * 0.8,
    bottom: backPos.y + halfH * 0.8,
  }

  // Comprobar intersección de AABB en 2D
  const overlapX = Math.max(frontBox.left, backBox.left) <= Math.min(frontBox.right, backBox.right)
  const overlapY = Math.max(frontBox.top, backBox.top) <= Math.min(frontBox.bottom, backBox.bottom)

  return overlapX && overlapY
}
