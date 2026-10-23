import React from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { getBoxCorners } from './prismHelper'

export interface SignPostRendererProps {
  obj: PlacedObject
  view: 'a' | 'b'
}

export const SignPostRenderer: React.FC<SignPostRendererProps> = React.memo(({ obj, view }) => {
  const isViewB = view === 'b'
  const w = isViewB ? 15 : 45
  const d = isViewB ? 45 : 15
  const h = 85

  const { pXY, topP0, topPX, topPXY, topPY } = getBoxCorners(w, d, h)

  return (
    <g data-object-id={obj.id} data-object-type={obj.typeId} className="cursor-pointer">
      {/* Sombra de la base */}
      <ellipse
        cx={pXY.x / 2}
        cy={pXY.y / 2}
        rx="10"
        ry="5"
        fill="rgba(15, 23, 42, 0.22)"
      />

      {/* Estaca / poste de fijación */}
      <line
        x1={pXY.x / 2}
        y1={pXY.y / 2}
        x2={pXY.x / 2}
        y2={topPXY.y / 2 + 10}
        stroke="#94a3b8"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Cartel / Pizarra técnica */}
      <polygon
        points={`
          ${topP0.x - 4},${topP0.y - 10}
          ${topPX.x + 4},${topPX.y - 10}
          ${topPXY.x + 4},${topPXY.y + 15}
          ${topPY.x - 4},${topPY.y + 15}
        `}
        fill="#f8fafc"
        stroke="#475569"
        strokeWidth="1.5"
      />

      {/* Recuadro de información agronómica */}
      <polygon
        points={`
          ${topP0.x},${topP0.y - 6}
          ${topPX.x},${topPX.y - 6}
          ${topPXY.x},${topPXY.y + 11}
          ${topPY.x},${topPY.y + 11}
        `}
        fill="#0284c7"
      />

      {/* Texto de accesión / etiqueta del cartel */}
      <text
        x={topPXY.x / 2}
        y={topPXY.y + 4}
        textAnchor="middle"
        fill="#ffffff"
        fontSize="7.5"
        fontFamily="sans-serif"
        fontWeight="bold"
      >
        {obj.label || 'LOTE #01'}
      </text>
    </g>
  )
})
SignPostRenderer.displayName = 'SignPostRenderer'
