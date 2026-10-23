import React from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { getBoxCorners } from './prismHelper'

export interface ShelfRendererProps {
  obj: PlacedObject
  view: 'a' | 'b'
}

export const ShelfRenderer: React.FC<ShelfRendererProps> = React.memo(({ obj, view }) => {
  const isViewB = view === 'b'
  const w = isViewB ? 40 : 100
  const d = isViewB ? 100 : 40
  const totalH = 180

  const { p0, pX, pXY, pY, topP0, topPX, topPXY, topPY } = getBoxCorners(w, d, totalH)

  // Alturas de los 3 estantes: z = 0, 60, 120 (más el estante superior a 180)
  const levels = [0, 60, 120, 180]

  return (
    <g data-object-id={obj.id} data-object-type={obj.typeId} className="cursor-pointer">
      {/* Sombra base */}
      <polygon
        points={`${p0.x},${p0.y} ${pX.x},${pX.y} ${pXY.x},${pXY.y} ${pY.x},${pY.y}`}
        fill="rgba(15, 23, 42, 0.2)"
      />

      {/* 4 postes verticales esquineros (ángulos de hierro ranurados) */}
      <line x1={p0.x} y1={p0.y} x2={topP0.x} y2={topP0.y} stroke="#475569" strokeWidth="2.5" />
      <line x1={pX.x} y1={pX.y} x2={topPX.x} y2={topPX.y} stroke="#475569" strokeWidth="2.5" />
      <line x1={pY.x} y1={pY.y} x2={topPY.x} y2={topPY.y} stroke="#334155" strokeWidth="2.5" />
      <line x1={pXY.x} y1={pXY.y} x2={topPXY.x} y2={topPXY.y} stroke="#1e293b" strokeWidth="3" />

      {/* Niveles de estantes horizontales */}
      {levels.map((lvlZ, idx) => {
        const { topP0: l0, topPX: lX, topPXY: lXY, topPY: lY } = getBoxCorners(w, d, lvlZ)
        return (
          <g key={`shelf-lvl-${idx}`}>
            {/* Reborde del estante */}
            <polygon
              points={`
                ${lY.x},${lY.y}
                ${lXY.x},${lXY.y}
                ${lXY.x},${lXY.y + 4}
                ${lY.x},${lY.y + 4}
              `}
              fill="#334155"
              stroke="#1e293b"
              strokeWidth="0.8"
            />
            <polygon
              points={`
                ${lX.x},${lX.y}
                ${lXY.x},${lXY.y}
                ${lXY.x},${lXY.y + 4}
                ${lX.x},${lX.y + 4}
              `}
              fill="#475569"
              stroke="#1e293b"
              strokeWidth="0.8"
            />
            {/* Superficie del estante */}
            <polygon
              points={`${l0.x},${l0.y} ${lX.x},${lX.y} ${lXY.x},${lXY.y} ${lY.x},${lY.y}`}
              fill="#94a3b8"
              stroke="#475569"
              strokeWidth="1"
            />
          </g>
        )
      })}
    </g>
  )
})
ShelfRenderer.displayName = 'ShelfRenderer'
