import { projectWorld, type Point2D } from '../../geometry/iso'

export interface BoxCorners {
  p0: Point2D // (0, 0)
  pX: Point2D // (+w, 0)
  pXY: Point2D // (+w, +d)
  pY: Point2D // (0, +d)
  topP0: Point2D
  topPX: Point2D
  topPXY: Point2D
  topPY: Point2D
  hPx: number
}

/**
 * Calcula las coordenadas proyectadas de las 8 esquinas de una caja rectangular (w × d × h en cm).
 */
export function getBoxCorners(w: number, d: number, h: number): BoxCorners {
  const p0 = projectWorld({ x: 0, y: 0, z: 0 })
  const pX = projectWorld({ x: w, y: 0, z: 0 })
  const pXY = projectWorld({ x: w, y: d, z: 0 })
  const pY = projectWorld({ x: 0, y: d, z: 0 })

  const topP0 = projectWorld({ x: 0, y: 0, z: h })
  const topPX = projectWorld({ x: w, y: 0, z: h })
  const topPXY = projectWorld({ x: w, y: d, z: h })
  const topPY = projectWorld({ x: 0, y: d, z: h })

  const hPx = p0.y - topP0.y

  return {
    p0,
    pX,
    pXY,
    pY,
    topP0,
    topPX,
    topPXY,
    topPY,
    hPx,
  }
}
