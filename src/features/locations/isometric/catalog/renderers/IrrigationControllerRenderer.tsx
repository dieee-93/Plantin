import React from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { getBoxCorners } from './prismHelper'

export interface IrrigationControllerRendererProps {
  obj: PlacedObject
  view: 'a' | 'b'
}

export const IrrigationControllerRenderer: React.FC<IrrigationControllerRendererProps> = React.memo(({ obj, view }) => {
  const isViewB = view === 'b'
  const w = isViewB ? 20 : 50
  const d = isViewB ? 50 : 20
  const h = 70

  const { p0, pX, pXY, pY, topP0, topPX, topPXY, topPY } = getBoxCorners(w, d, h)

  return (
    <g data-object-id={obj.id} data-object-type={obj.typeId} className="cursor-pointer">
      {/* Sombra proyectada */}
      <polygon
        points={`${p0.x},${p0.y} ${pX.x},${pX.y} ${pXY.x},${pXY.y} ${pY.x},${pY.y}`}
        fill="rgba(15, 23, 42, 0.2)"
      />

      {/* Cara lateral izquierda (sombra media) */}
      <polygon
        points={`
          ${pY.x},${pY.y}
          ${pXY.x},${pXY.y}
          ${topPXY.x},${topPXY.y}
          ${topPY.x},${topPY.y}
        `}
        fill="#475569"
        stroke="#1e293b"
        strokeWidth="1.2"
      />

      {/* Cara frontal derecha (iluminada) */}
      <polygon
        points={`
          ${pX.x},${pX.y}
          ${pXY.x},${pXY.y}
          ${topPXY.x},${topPXY.y}
          ${topPX.x},${topPX.y}
        `}
        fill="#94a3b8"
        stroke="#1e293b"
        strokeWidth="1.2"
      />

      {/* Tapa superior */}
      <polygon
        points={`
          ${topP0.x},${topP0.y}
          ${topPX.x},${topPX.y}
          ${topPXY.x},${topPXY.y}
          ${topPY.x},${topPY.y}
        `}
        fill="#cbd5e1"
        stroke="#334155"
        strokeWidth="1.2"
      />

      {/* Pantalla del programador */}
      <polygon
        points={`
          ${topPX.x - 4},${topPX.y + 12}
          ${topPXY.x - 8},${topPXY.y + 10}
          ${topPXY.x - 8},${topPXY.y + 24}
          ${topPX.x - 4},${topPX.y + 26}
        `}
        fill="#0f172a"
        stroke="#0284c7"
        strokeWidth="0.8"
      />

      {/* Botones de zona / perillas */}
      <circle cx={topPXY.x - 12} cy={topPXY.y + 32} r="2.5" fill="#38bdf8" />
      <circle cx={topPXY.x - 18} cy={topPXY.y + 30} r="2.5" fill="#22c55e" />
      <circle cx={topPXY.x - 24} cy={topPXY.y + 28} r="2.5" fill="#e2e8f0" />

      {/* Tuberías de derivación hacia el piso */}
      <line x1={pXY.x - 6} y1={pXY.y} x2={pXY.x - 6} y2={pXY.y + 14} stroke="#1e293b" strokeWidth="3" />
      <line x1={pXY.x - 14} y1={pXY.y} x2={pXY.x - 14} y2={pXY.y + 14} stroke="#0284c7" strokeWidth="3" />
    </g>
  )
})
IrrigationControllerRenderer.displayName = 'IrrigationControllerRenderer'
