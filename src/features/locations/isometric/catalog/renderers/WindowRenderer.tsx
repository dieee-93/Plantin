import React from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { getBoxCorners } from './prismHelper'

export interface WindowRendererProps {
  obj: PlacedObject
  view: 'a' | 'b'
}

export const WindowRenderer: React.FC<WindowRendererProps> = React.memo(({ obj, view }) => {
  const isViewB = view === 'b'
  const w = isViewB ? 10 : 120
  const d = isViewB ? 120 : 10
  const h = 100

  const { p0, pX, pXY, pY, topP0, topPX, topPXY, topPY } = getBoxCorners(w, d, h)

  return (
    <g data-object-id={obj.id} data-object-type={obj.typeId} className="cursor-pointer">
      {/* Marco perimetral de la ventana */}
      <polygon
        points={`${p0.x},${p0.y} ${pX.x},${pX.y} ${topPX.x},${topPX.y} ${topP0.x},${topP0.y}`}
        fill="#475569"
        stroke="#1e293b"
        strokeWidth="1.4"
      />
      <polygon
        points={`${p0.x},${p0.y} ${pY.x},${pY.y} ${topPY.x},${topPY.y} ${topP0.x},${topP0.y}`}
        fill="#334155"
        stroke="#1e293b"
        strokeWidth="1.4"
      />

      {/* Cristal translúcido con tinte celeste */}
      <polygon
        points={`${pY.x},${pY.y} ${pXY.x},${pXY.y} ${topPXY.x},${topPXY.y} ${topPY.x},${topPY.y}`}
        fill="rgba(224, 242, 254, 0.75)"
        stroke="#0284c7"
        strokeWidth="1.2"
      />

      {/* Montante central de la carpintería */}
      <line
        x1={(pY.x + pXY.x) / 2}
        y1={(pY.y + pXY.y) / 2}
        x2={(topPY.x + topPXY.x) / 2}
        y2={(topPY.y + topPXY.y) / 2}
        stroke="#475569"
        strokeWidth="1.4"
      />

      {/* Reflejos de luz diagonales */}
      <line
        x1={(pY.x + pXY.x) * 0.4}
        y1={(pY.y + pXY.y) * 0.4 - 20}
        x2={(pY.x + pXY.x) * 0.6}
        y2={(pY.y + pXY.y) * 0.6 - 50}
        stroke="rgba(255, 255, 255, 0.85)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </g>
  )
})
WindowRenderer.displayName = 'WindowRenderer'
