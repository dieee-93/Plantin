import React from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { getBoxCorners } from './prismHelper'

export interface DoorRendererProps {
  obj: PlacedObject
  view: 'a' | 'b'
}

export const DoorRenderer: React.FC<DoorRendererProps> = React.memo(({ obj, view }) => {
  const isViewB = view === 'b'
  const w = isViewB ? 10 : 90
  const d = isViewB ? 90 : 10
  const h = 210

  const { p0, pX, pXY, pY, topP0, topPX, topPXY, topPY } = getBoxCorners(w, d, h)

  return (
    <g data-object-id={obj.id} data-object-type={obj.typeId} className="cursor-pointer">
      {/* Marco de la puerta */}
      <polygon
        points={`${p0.x},${p0.y} ${pX.x},${pX.y} ${topPX.x},${topPX.y} ${topP0.x},${topP0.y}`}
        fill="#334155"
        stroke="#1e293b"
        strokeWidth="1.2"
      />
      <polygon
        points={`${p0.x},${p0.y} ${pY.x},${pY.y} ${topPY.x},${topPY.y} ${topP0.x},${topP0.y}`}
        fill="#1e293b"
        stroke="#0f172a"
        strokeWidth="1.2"
      />

      {/* Hoja técnica de la puerta */}
      <polygon
        points={`
          ${pY.x * 0.95},${pY.y * 0.95}
          ${pXY.x * 0.95},${pXY.y * 0.95}
          ${topPXY.x * 0.95},${topPXY.y * 0.95}
          ${topPY.x * 0.95},${topPY.y * 0.95}
        `}
        fill="#cbd5e1"
        stroke="#475569"
        strokeWidth="1.4"
      />

      {/* Visor / ventana de inspección redonda en la puerta */}
      <ellipse
        cx={(topPY.x + topPXY.x) * 0.48}
        cy={(topPY.y + topPXY.y) * 0.48 + 50}
        rx="8"
        ry="8"
        fill="#bae6fd"
        stroke="#475569"
        strokeWidth="1"
      />

      {/* Manija técnica ergonómica */}
      <circle
        cx={(topPY.x + topPXY.x) * 0.48 + 6}
        cy={(topPY.y + topPXY.y) * 0.48 + 90}
        r="2.5"
        fill="#0f172a"
      />
    </g>
  )
})
DoorRenderer.displayName = 'DoorRenderer'
