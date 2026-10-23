import React from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { getBoxCorners } from './prismHelper'

export interface DripLineRendererProps {
  obj: PlacedObject
  view: 'a' | 'b'
}

export const DripLineRenderer: React.FC<DripLineRendererProps> = React.memo(({ obj, view }) => {
  const isRotated = view === 'b'
  const length = Number(obj.params?.lengthCm ?? 400)
  const w = isRotated ? 8 : length
  const d = isRotated ? length : 8
  const h = 4

  const { p0, pX, pXY, pY, topP0, topPX, topPXY, topPY } = getBoxCorners(w, d, h)

  // Cantidad de goteros cada 30 cm
  const emitterCount = Math.max(2, Math.floor(length / 30))

  return (
    <g data-object-id={obj.id} data-object-type={obj.typeId} className="cursor-pointer">
      {/* Sombra de la manguera */}
      <polygon
        points={`${p0.x},${p0.y} ${pX.x},${pX.y} ${pXY.x},${pXY.y} ${pY.x},${pY.y}`}
        fill="rgba(15, 23, 42, 0.2)"
      />

      {/* Cuerpo principal de polietileno negro */}
      <polygon
        points={`
          ${pY.x},${pY.y}
          ${pXY.x},${pXY.y}
          ${topPXY.x},${topPXY.y}
          ${topPY.x},${topPY.y}
        `}
        fill="#1e293b"
        stroke="#0f172a"
        strokeWidth="1"
      />
      <polygon
        points={`
          ${pX.x},${pX.y}
          ${pXY.x},${pXY.y}
          ${topPXY.x},${topPXY.y}
          ${topPX.x},${topPX.y}
        `}
        fill="#334155"
        stroke="#0f172a"
        strokeWidth="1"
      />
      <polygon
        points={`
          ${topP0.x},${topP0.y}
          ${topPX.x},${topPX.y}
          ${topPXY.x},${topPXY.y}
          ${topPY.x},${topPY.y}
        `}
        fill="#475569"
        stroke="#1e293b"
        strokeWidth="0.8"
      />

      {/* Micro-goteros distribuidos a lo largo de la manguera */}
      {Array.from({ length: emitterCount }).map((_, i) => {
        const factor = (i + 0.5) / emitterCount
        const ex = isRotated ? topPXY.x / 2 : topP0.x + (topPX.x - topP0.x) * factor
        const ey = isRotated ? topP0.y + (topPY.y - topP0.y) * factor : topP0.y + (topPX.y - topP0.y) * factor
        return (
          <circle
            key={`emitter-${i}`}
            cx={ex}
            cy={ey}
            r="1.8"
            fill="#38bdf8"
            stroke="#0284c7"
            strokeWidth="0.6"
          />
        )
      })}
    </g>
  )
})
DripLineRenderer.displayName = 'DripLineRenderer'
