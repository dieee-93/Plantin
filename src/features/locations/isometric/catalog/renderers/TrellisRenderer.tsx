import React from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { getBoxCorners } from './prismHelper'

export interface TrellisRendererProps {
  obj: PlacedObject
  view: 'a' | 'b'
}

export const TrellisRenderer: React.FC<TrellisRendererProps> = React.memo(({ obj, view }) => {
  const isRotated = view === 'b'
  const length = Number(obj.params?.widthCm ?? 200)
  const w = isRotated ? 10 : length
  const d = isRotated ? length : 10
  const h = 180

  const { p0, pX, pXY, pY, topP0, topPXY } = getBoxCorners(w, d, h)

  return (
    <g data-object-id={obj.id} data-object-type={obj.typeId} className="cursor-pointer">
      {/* Sombra base */}
      <polygon
        points={`${p0.x},${p0.y} ${pX.x},${pX.y} ${pXY.x},${pXY.y} ${pY.x},${pY.y}`}
        fill="rgba(15, 23, 42, 0.15)"
      />

      {/* Postes extremos verticales (madera o acero) */}
      <line x1={p0.x} y1={p0.y} x2={topP0.x} y2={topP0.y} stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
      <line x1={pXY.x} y1={pXY.y} x2={topPXY.x} y2={topPXY.y} stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" />
      {length > 250 && (
        <line
          x1={(p0.x + pXY.x) / 2}
          y1={(p0.y + pXY.y) / 2}
          x2={(topP0.x + topPXY.x) / 2}
          y2={(topP0.y + topPXY.y) / 2}
          stroke="#78350f"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}

      {/* Travesaño superior */}
      <line x1={topP0.x} y1={topP0.y} x2={topPXY.x} y2={topPXY.y} stroke="#b45309" strokeWidth="2.5" />

      {/* Alambres tensores horizontales cada 35 cm de altura */}
      {[35, 70, 105, 140].map((wireH) => {
        const factor = wireH / h
        const y1 = p0.y + (topP0.y - p0.y) * factor
        const y2 = pXY.y + (topPXY.y - pXY.y) * factor
        return (
          <line
            key={`wire-${wireH}`}
            x1={p0.x}
            y1={y1}
            x2={pXY.x}
            y2={y2}
            stroke="#94a3b8"
            strokeWidth="1.2"
            strokeDasharray="4 2"
          />
        )
      })}
    </g>
  )
})
TrellisRenderer.displayName = 'TrellisRenderer'
