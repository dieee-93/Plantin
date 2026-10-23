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
 * Determina si el elemento A debe dibujarse antes que B en proyección isométrica 2:1.
 * Retorna true si A está detrás o debajo de B.
 */
export function isBehind(a: Footprint, b: Footprint): boolean {
  const aZ = a.z ?? 0
  const bZ = b.z ?? 0
  const aH = a.h ?? 0
  const bH = b.h ?? 0

  // 1. Verificación de apilamiento vertical en Z si se solapan en XY
  const overlapX = a.x < b.x + b.w && b.x < a.x + a.w
  const overlapY = a.y < b.y + b.d && b.y < a.y + a.d

  if (overlapX && overlapY) {
    if (aZ + aH <= bZ) return true
    if (bZ + bH <= aZ) return false
  }

  // 2. Separación en el plano XY: A está detrás de B si está más al fondo en X o en Y
  const aBehindBInPlan = a.x + a.w <= b.x || a.y + a.d <= b.y
  const bBehindAInPlan = b.x + b.w <= a.x || b.y + b.d <= a.y

  if (aBehindBInPlan && !bBehindAInPlan) return true
  if (bBehindAInPlan && !aBehindBInPlan) return false

  return false
}

/**
 * Ordenamiento topológico para elementos con huella 3D (Footprint).
 * Construye un grafo de dependencias y aplica el algoritmo de Kahn con desempate
 * por distancia combinada isométrica (x + y + z).
 */
export function topologicalSortFootprints<T extends { footprint?: Footprint; key?: string }>(
  items: T[]
): T[] {
  const n = items.length
  if (n <= 1) return [...items]

  // Para items sin huella, estimar huella puntual en x=0, y=0
  const getFp = (item: T): Footprint =>
    item.footprint ?? { x: 0, y: 0, w: 0, d: 0, z: 0, h: 0 }

  // adjacency list: graph[i] contiene los j tal que items[i] debe dibujarse antes de items[j] (i -> j)
  const graph: number[][] = Array.from({ length: n }, () => [])
  const inDegree: number[] = new Array(n).fill(0)

  for (let i = 0; i < n; i++) {
    const fpI = getFp(items[i])
    for (let j = i + 1; j < n; j++) {
      const fpJ = getFp(items[j])

      const iBehindJ = isBehind(fpI, fpJ)
      const jBehindI = isBehind(fpJ, fpI)

      if (iBehindJ && !jBehindI) {
        graph[i].push(j)
        inDegree[j]++
      } else if (jBehindI && !iBehindJ) {
        graph[j].push(i)
        inDegree[i]++
      }
    }
  }

  // Métrica de distancia a cámara para desempate / fallback:
  // (x + y + z) menor = más lejos del observador = se dibuja primero
  const getDistanceScore = (idx: number): number => {
    const fp = getFp(items[idx])
    return fp.x + fp.y + (fp.z ?? 0)
  }

  // Nodos listos (inDegree === 0)
  const available: number[] = []
  for (let i = 0; i < n; i++) {
    if (inDegree[i] === 0) {
      available.push(i)
    }
  }

  const result: T[] = []

  while (result.length < n) {
    if (available.length === 0) {
      // Ciclo o estancamiento: elegir el elemento restante con menor distancia isométrica
      let bestRemaining = -1
      let bestScore = Infinity
      for (let i = 0; i < n; i++) {
        if (inDegree[i] > 0) {
          const score = getDistanceScore(i)
          if (score < bestScore) {
            bestScore = score
            bestRemaining = i
          }
        }
      }
      if (bestRemaining !== -1) {
        inDegree[bestRemaining] = 0
        available.push(bestRemaining)
      } else {
        break
      }
    }

    // Ordenar available para que el nodo con menor score se procese primero
    available.sort((a, b) => getDistanceScore(a) - getDistanceScore(b))
    const current = available.shift()!
    result.push(items[current])

    for (const neighbor of graph[current]) {
      inDegree[neighbor]--
      if (inDegree[neighbor] === 0) {
        available.push(neighbor)
      }
    }
  }

  return result
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
