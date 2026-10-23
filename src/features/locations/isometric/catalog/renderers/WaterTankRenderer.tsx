import React from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { halfW, halfH, CELL_CM } from '../../geometry/iso'

export interface WaterTankRendererProps {
  obj: PlacedObject
  view: 'a' | 'b'
}

export const WaterTankRenderer: React.FC<WaterTankRendererProps> = React.memo(({ obj }) => {
  const radiusCm = 40
  const heightCm = 160

  const scale = halfW / (CELL_CM / 2) // px/cm
  const rx = radiusCm * scale * 0.48
  const ry = rx * 0.5
  const hPx = heightCm * (halfH / (CELL_CM / 2)) * 1.05

  return (
    <g data-object-id={obj.id} data-object-type={obj.typeId} className="cursor-pointer">
      {/* Sombra base */}
      <ellipse cx="0" cy="2" rx={rx * 1.12} ry={ry * 1.12} fill="rgba(15, 23, 42, 0.28)" />

      {/* Base */}
      <ellipse cx="0" cy="0" rx={rx} ry={ry} fill="#0369a1" />

      {/* Cuerpo cilíndrico */}
      <path
        d={`
          M ${-rx} 0
          L ${-rx} ${-hPx}
          A ${rx} ${ry} 0 0 0 ${rx} ${-hPx}
          L ${rx} 0
          A ${rx} ${ry} 0 0 1 ${-rx} 0
          Z
        `}
        fill="#0284c7"
        stroke="#0369a1"
        strokeWidth="1.6"
      />

      {/* Costillas horizontales de refuerzo del tanque */}
      <path
        d={`M ${-rx} ${-hPx * 0.33} A ${rx} ${ry} 0 0 0 ${rx} ${-hPx * 0.33}`}
        fill="none"
        stroke="#0369a1"
        strokeWidth="1.2"
      />
      <path
        d={`M ${-rx} ${-hPx * 0.66} A ${rx} ${ry} 0 0 0 ${rx} ${-hPx * 0.66}`}
        fill="none"
        stroke="#0369a1"
        strokeWidth="1.2"
      />

      {/* Visor de nivel de líquido lateral */}
      <rect
        x={rx * 0.45}
        y={-hPx * 0.85}
        width="4"
        height={hPx * 0.7}
        rx="2"
        fill="#38bdf8"
        stroke="#0c4a6e"
        strokeWidth="0.8"
      />

      {/* Tapa cúpula superior */}
      <ellipse
        cx="0"
        cy={-hPx}
        rx={rx}
        ry={ry}
        fill="#38bdf8"
        stroke="#0284c7"
        strokeWidth="1.4"
      />

      {/* Tapa roscada central */}
      <ellipse
        cx="0"
        cy={-hPx - 3}
        rx={rx * 0.38}
        ry={ry * 0.38}
        fill="#0369a1"
        stroke="#0284c7"
        strokeWidth="1.2"
      />

      {/* Rotulación técnica H2O */}
      <text
        x="0"
        y={-hPx * 0.5}
        textAnchor="middle"
        fontSize="11"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
        fontWeight="800"
        fill="#ffffff"
      >
        H2O
      </text>
    </g>
  )
})
WaterTankRenderer.displayName = 'WaterTankRenderer'
