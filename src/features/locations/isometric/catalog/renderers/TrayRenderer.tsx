import React from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { getBoxCorners } from './prismHelper'

export interface TrayRendererProps {
  obj: PlacedObject
  view: 'a' | 'b'
}

export const TrayRenderer: React.FC<TrayRendererProps> = React.memo(({ obj, view }) => {
  const isViewB = view === 'b'
  const w = isViewB ? 28 : 54
  const d = isViewB ? 54 : 28
  const h = 5

  const { p0, pX, pXY, pY, topP0, topPX, topPXY, topPY } = getBoxCorners(w, d, h)

  return (
    <g data-object-id={obj.id} data-object-type={obj.typeId} className="cursor-pointer">
      {/* Sombra en el piso */}
      <polygon
        points={`${p0.x},${p0.y} ${pX.x},${pX.y} ${pXY.x},${pXY.y} ${pY.x},${pY.y}`}
        fill="rgba(15, 23, 42, 0.25)"
      />

      {/* Cara frontal izquierda (eje Y) */}
      <polygon
        points={`${pY.x},${pY.y} ${pXY.x},${pXY.y} ${topPXY.x},${topPXY.y} ${topPY.x},${topPY.y}`}
        fill="#1e293b"
        stroke="#0f172a"
        strokeWidth="1"
      />

      {/* Cara frontal derecha (eje X) */}
      <polygon
        points={`${pX.x},${pX.y} ${pXY.x},${pXY.y} ${topPXY.x},${topPXY.y} ${topPX.x},${topPX.y}`}
        fill="#334155"
        stroke="#0f172a"
        strokeWidth="1"
      />

      {/* Cara superior (plato con los 72 alvéolos) */}
      <polygon
        points={`${topP0.x},${topP0.y} ${topPX.x},${topPX.y} ${topPXY.x},${topPXY.y} ${topPY.x},${topPY.y}`}
        fill="#475569"
        stroke="#1e293b"
        strokeWidth="1.2"
      />

      {/* Líneas de micro-grilla de alvéolos */}
      <line
        x1={(topP0.x + topPX.x) / 2}
        y1={(topP0.y + topPX.y) / 2}
        x2={(topPY.x + topPXY.x) / 2}
        y2={(topPY.y + topPXY.y) / 2}
        stroke="#1e293b"
        strokeWidth="0.8"
        strokeDasharray="2 3"
      />
      <line
        x1={(topP0.x + topPY.x) / 2}
        y1={(topP0.y + topPY.y) / 2}
        x2={(topPX.x + topPXY.x) / 2}
        y2={(topPX.y + topPXY.y) / 2}
        stroke="#1e293b"
        strokeWidth="0.8"
        strokeDasharray="2 3"
      />
    </g>
  )
})
TrayRenderer.displayName = 'TrayRenderer'
