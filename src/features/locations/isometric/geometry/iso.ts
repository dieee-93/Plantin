/**
 * Funciones de proyección y geometría isométrica 2.5D (dimétrica 2:1).
 * Todas las coordenadas de mundo se expresan en centímetros (cm).
 */

export const TILE_W = 104
export const TILE_H = 52
export const halfW = TILE_W / 2 // 52
export const halfH = TILE_H / 2 // 26
export const CELL_CM = 50 // 50 cm = 1 celda / baldosa estándar
export const wallHeight = 86

export interface Point2D {
  x: number
  y: number
}

export interface WorldPoint3D {
  x: number // cm (eje columnas)
  y: number // cm (eje filas)
  z?: number // cm (altura sobre el plano de piso)
}

/**
 * Proyecta coordenadas continuas del mundo en centímetros a coordenadas de pantalla (SVG).
 * x = eje horizontal de columnas (cm)
 * y = eje en profundidad de filas (cm)
 * z = altura vertical (cm)
 */
export function projectWorld({ x, y, z = 0 }: WorldPoint3D): Point2D {
  const col = x / CELL_CM
  const row = y / CELL_CM
  const px = (col - row) * halfW
  const py = (col + row) * halfH - z * (TILE_H / CELL_CM)
  return { x: px, y: py }
}

/**
 * Convierte coordenadas de pantalla (SVG) a coordenadas de mundo en centímetros en el plano z = 0 (o z dado).
 */
export function screenToWorld(px: number, py: number, z = 0): { x: number; y: number } {
  const effPy = py + z * (TILE_H / CELL_CM)
  const col = (px / halfW + effPy / halfH) / 2
  const row = (effPy / halfH - px / halfW) / 2
  return {
    x: col * CELL_CM,
    y: row * CELL_CM,
  }
}

/**
 * Proyecta el centro de la celda discreta (r, c) a pantalla.
 * En la convención de la sala, el centro de la celda (r, c) coincide con
 * x = (c + 0.5) * CELL_CM, y = (r + 0.5) * CELL_CM.
 * Devuelve px = (c - r) * halfW, py = (c + r + 1) * halfH.
 */
export function projectCell(r: number, c: number, z = 0): Point2D {
  const px = (c - r) * halfW
  const py = (c + r + 1) * halfH - z * (TILE_H / CELL_CM)
  return { x: px, y: py }
}

/**
 * Genera el string de puntos para el polígono de una baldosa isométrica centrada en (0, 0).
 */
export function tilePolygon(inset = 0): string {
  const topY = -halfH + inset
  const rightX = halfW - inset
  const bottomY = halfH - inset
  const leftX = -halfW + inset
  return `0,${topY} ${rightX},0 0,${bottomY} ${leftX},0`
}

export interface RoomCorners {
  topCorner: Point2D
  rightCorner: Point2D
  bottomCorner: Point2D
  leftCorner: Point2D
}

/**
 * Calcula las 4 esquinas del contorno del piso de la sala.
 */
export function roomCorners(rows: number, cols: number): RoomCorners {
  return {
    topCorner: { x: 0, y: 0 },
    rightCorner: { x: cols * halfW, y: cols * halfH },
    bottomCorner: { x: (cols - rows) * halfW, y: (cols + rows) * halfH },
    leftCorner: { x: -rows * halfW, y: rows * halfH },
  }
}

export interface RoomViewBox {
  minX: number
  maxX: number
  minY: number
  maxY: number
  viewBoxWidth: number
  viewBoxHeight: number
  viewBoxString: string
}

/**
 * Calcula el viewBox SVG óptimo para una sala de rows × cols con márgenes para muros y equipos.
 */
export function roomViewBox(rows: number, cols: number): RoomViewBox {
  const minX = -rows * halfW - 102
  const maxX = cols * halfW + 102
  const minY = -142
  const maxY = (rows + cols) * halfH + 88
  const viewBoxWidth = maxX - minX
  const viewBoxHeight = maxY - minY
  return {
    minX,
    maxX,
    minY,
    maxY,
    viewBoxWidth,
    viewBoxHeight,
    viewBoxString: `${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}`,
  }
}
