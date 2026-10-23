import React from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { getBoxCorners } from './prismHelper'

export interface LedPanelRendererProps {
  obj: PlacedObject
  view: 'a' | 'b'
}

export const LedPanelRenderer: React.FC<LedPanelRendererProps> = React.memo(({ obj, view }) => {
  const isViewB = view === 'b'
  const w = isViewB ? 30 : 100
  const d = isViewB ? 100 : 30
  const h = 10

  const { p0, pX, pXY, pY, topP0, topPX, topPXY, topPY } = getBoxCorners(w, d, h)

  return (
    <g data-object-id={obj.id} data-object-type={obj.typeId} className="cursor-pointer">
      {/* Haz sutil de luz hacia el suelo */}
      <polygon
        points={`
          ${p0.x},${p0.y}
          ${pX.x},${pX.y}
          ${pXY.x * 1.25},${pXY.y + 40}
          ${pY.x * 1.25},${pY.y + 40}
        `}
        fill="rgba(217, 70, 239, 0.12)"
      />

      {/* Carcasa inferior emisora de luz LED */}
      <polygon
        points={`${p0.x},${p0.y} ${pX.x},${pX.y} ${pXY.x},${pXY.y} ${pY.x},${pY.y}`}
        fill="#fdf4ff"
        stroke="#e879f9"
        strokeWidth="1.2"
      />

      {/* Cara frontal izquierda */}
      <polygon
        points={`${pY.x},${pY.y} ${pXY.x},${pXY.y} ${topPXY.x},${topPXY.y} ${topPY.x},${topPY.y}`}
        fill="#475569"
        stroke="#334155"
        strokeWidth="1"
      />

      {/* Cara frontal derecha */}
      <polygon
        points={`${pX.x},${pX.y} ${pXY.x},${pXY.y} ${topPXY.x},${topPXY.y} ${topPX.x},${topPX.y}`}
        fill="#64748b"
        stroke="#334155"
        strokeWidth="1"
      />

      {/* Tapa superior de aluminio anodizado con aletas de disipación */}
      <polygon
        points={`${topP0.x},${topP0.y} ${topPX.x},${topPX.y} ${topPXY.x},${topPXY.y} ${topPY.x},${topPY.y}`}
        fill="#cbd5e1"
        stroke="#64748b"
        strokeWidth="1.2"
      />

      {/* Cables de suspensión en las 4 esquinas superiores */}
      <line x1={topP0.x} y1={topP0.y} x2={topP0.x} y2={topP0.y - 18} stroke="#94a3b8" strokeWidth="0.8" />
      <line x1={topPX.x} y1={topPX.y} x2={topPX.x} y2={topPX.y - 18} stroke="#94a3b8" strokeWidth="0.8" />
      <line x1={topPY.x} y1={topPY.y} x2={topPY.x} y2={topPY.y - 18} stroke="#94a3b8" strokeWidth="0.8" />
      <line x1={topPXY.x} y1={topPXY.y} x2={topPXY.x} y2={topPXY.y - 18} stroke="#94a3b8" strokeWidth="0.8" />
    </g>
  )
})
LedPanelRenderer.displayName = 'LedPanelRenderer'
