import React from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { getBoxCorners } from './prismHelper'

export interface PathwayRendererProps {
  obj: PlacedObject
  view: 'a' | 'b'
}

export const PathwayRenderer: React.FC<PathwayRendererProps> = React.memo(({ obj, view }) => {
  const isViewB = view === 'b'
  const rawW = Number(obj.params?.widthCm ?? 200)
  const rawD = Number(obj.params?.depthCm ?? 50)
  const w = isViewB ? rawD : rawW
  const d = isViewB ? rawW : rawD
  const h = 2

  const { p0, pX, pXY, pY, topP0, topPX, topPXY, topPY } = getBoxCorners(w, d, h)

  return (
    <g data-object-id={obj.id} data-object-type={obj.typeId} className="cursor-pointer">
      {/* Sombra sutil del reborde */}
      <polygon
        points={`${p0.x},${p0.y} ${pX.x},${pX.y} ${pXY.x},${pXY.y} ${pY.x},${pY.y}`}
        fill="rgba(15, 23, 42, 0.18)"
      />

      {/* Reborde frontal del pasillo */}
      <polygon
        points={`
          ${pY.x},${pY.y}
          ${pXY.x},${pXY.y}
          ${topPXY.x},${topPXY.y}
          ${topPY.x},${topPY.y}
        `}
        fill="#64748b"
      />
      <polygon
        points={`
          ${pX.x},${pX.y}
          ${pXY.x},${pXY.y}
          ${topPXY.x},${topPXY.y}
          ${topPX.x},${topPX.y}
        `}
        fill="#94a3b8"
      />

      {/* Superficie transitable con losas o trama antideslizante */}
      <polygon
        points={`
          ${topP0.x},${topP0.y}
          ${topPX.x},${topPX.y}
          ${topPXY.x},${topPXY.y}
          ${topPY.x},${topPY.y}
        `}
        fill="#e2e8f0"
        stroke="#94a3b8"
        strokeWidth="0.8"
      />

      {/* Juntas de dilatación / divisiones de losas cada 50 cm */}
      {Array.from({ length: Math.max(1, Math.floor(rawW / 50)) }).map((_, i) => {
        const factor = (i + 1) / (Math.floor(rawW / 50) + 1)
        const x1 = isViewB ? topP0.x + (topPY.x - topP0.x) * factor : topP0.x + (topPX.x - topP0.x) * factor
        const y1 = isViewB ? topP0.y + (topPY.y - topP0.y) * factor : topP0.y + (topPX.y - topP0.y) * factor
        const x2 = isViewB ? topPX.x + (topPXY.x - topPX.x) * factor : topPY.x + (topPXY.x - topPY.x) * factor
        const y2 = isViewB ? topPX.y + (topPXY.y - topPX.y) * factor : topPY.y + (topPXY.y - topPY.y) * factor
        return (
          <line
            key={`joint-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#cbd5e1"
            strokeWidth="1"
          />
        )
      })}
    </g>
  )
})
PathwayRenderer.displayName = 'PathwayRenderer'
