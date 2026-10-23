import { describe, it, expect } from 'vitest'
import {
  projectWorld,
  screenToWorld,
  projectCell,
  tilePolygon,
  roomCorners,
  roomViewBox,
  halfW,
  halfH,
} from '../geometry/iso'
import {
  sortDrawables,
  occludes,
  type Drawable,
} from '../geometry/depth'

describe('geometry/iso.ts', () => {
  it('proyecta y desproyecta coordenadas continuas en centímetros (screenToWorld invertibility)', () => {
    const worldPoint = { x: 150, y: 100, z: 0 }
    const screenPoint = projectWorld(worldPoint)
    const inverted = screenToWorld(screenPoint.x, screenPoint.y, 0)

    expect(inverted.x).toBeCloseTo(worldPoint.x, 3)
    expect(inverted.y).toBeCloseTo(worldPoint.y, 3)
  })

  it('projectCell coincide exactamente con la fórmula histórica de pantalla', () => {
    // Para r=2, c=3:
    // centerX = (3 - 2) * halfW = 1 * 52 = 52
    // centerY = (3 + 2 + 1) * halfH = 6 * 26 = 156
    const cell = projectCell(2, 3)
    expect(cell.x).toBe(52)
    expect(cell.y).toBe(156)
  })

  it('genera correctamente los polígonos de baldosa y esquinas de sala', () => {
    const poly = tilePolygon(3)
    expect(poly).toBe(`0,${-halfH + 3} ${halfW - 3},0 0,${halfH - 3} ${-halfW + 3},0`)

    const corners = roomCorners(4, 6)
    expect(corners.topCorner).toEqual({ x: 0, y: 0 })
    expect(corners.rightCorner).toEqual({ x: 6 * 52, y: 6 * 26 })
    expect(corners.bottomCorner).toEqual({ x: (6 - 4) * 52, y: (6 + 4) * 26 })
    expect(corners.leftCorner).toEqual({ x: -4 * 52, y: 4 * 26 })
  })

  it('calcula el viewBox SVG para salas de 1×1 y 16×16', () => {
    const vb1 = roomViewBox(1, 1)
    expect(vb1.minX).toBe(-1 * 52 - 102)
    expect(vb1.maxX).toBe(1 * 52 + 102)
    expect(vb1.minY).toBe(-142)
    expect(vb1.maxY).toBe(2 * 26 + 88)

    const vb16 = roomViewBox(16, 16)
    expect(vb16.minX).toBe(-16 * 52 - 102)
    expect(vb16.maxX).toBe(16 * 52 + 102)
    expect(vb16.viewBoxWidth).toBe(vb16.maxX - vb16.minX)
    expect(vb16.viewBoxHeight).toBe(vb16.maxY - vb16.minY)
  })
})

describe('geometry/depth.ts', () => {
  it('ordena dibujables por profundidad isométrica (row + col) y capas', () => {
    const items: Drawable[] = [
      { key: 'front', row: 3, col: 2, layer: 2, node: null }, // sum = 5
      { key: 'back', row: 1, col: 1, layer: 2, node: null }, // sum = 2
      { key: 'mid-label', row: 2, col: 2, layer: 4, node: null }, // sum = 4, layer = 4
      { key: 'mid-plant', row: 2, col: 2, layer: 3, node: null }, // sum = 4, layer = 3
    ]

    const sorted = sortDrawables(items)
    expect(sorted.map(s => s.key)).toEqual(['back', 'mid-plant', 'mid-label', 'front'])
  })

  it('ordena dibujables con huellas dimensionales (footprint en cm)', () => {
    // Mueble A: x=0, y=0, w=100, d=50 (detrás)
    // Mueble B: x=120, y=60, w=50, d=50 (delante)
    const items: Drawable[] = [
      {
        key: 'bench-front',
        row: 2,
        col: 2,
        layer: 1,
        footprint: { x: 120, y: 60, w: 50, d: 50 },
        node: null,
      },
      {
        key: 'bench-back',
        row: 0,
        col: 0,
        layer: 1,
        footprint: { x: 0, y: 0, w: 100, d: 50 },
        node: null,
      },
    ]

    const sorted = sortDrawables(items)
    expect(sorted[0].key).toBe('bench-back')
    expect(sorted[1].key).toBe('bench-front')
  })

  it('detecta correctamente la oclusión de una celda detrás por una planta alta adelante', () => {
    // Celda trasera en row=0, col=0 (esquina norte)
    // Planta en row=1, col=0 (justo al frente de la diagonal izquierda)
    const backCell = { row: 0, col: 0 }
    const frontPlant = { row: 1, col: 0, bbch: 75, heightScale: 1 }

    expect(occludes(frontPlant, backCell)).toBe(true)

    // Si la planta está detrás de la celda (row=0, col=0 vs celda row=2, col=2), NO ocluye
    const behindPlant = { row: 0, col: 0, bbch: 80 }
    const targetCell = { row: 2, col: 2 }
    expect(occludes(behindPlant, targetCell)).toBe(false)
  })
})
