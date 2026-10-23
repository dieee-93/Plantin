import React from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { halfW, halfH, CELL_CM } from '../../geometry/iso'

export interface PotRendererProps {
  obj: PlacedObject
  view: 'a' | 'b'
}

export const PotRenderer: React.FC<PotRendererProps> = React.memo(({ obj }) => {
  // Dimensiones según el tipo de maceta
  const radiusCm = obj.typeId === 'pot_20l' ? 17.5 : obj.typeId === 'pot_5l' ? 12.5 : 7.5
  const heightCm = obj.typeId === 'pot_20l' ? 30 : obj.typeId === 'pot_5l' ? 22 : 14

  // Escala en píxeles de pantalla
  const scale = halfW / (CELL_CM / 2) // ~2.08 px/cm en el plano
  const rx = radiusCm * scale * 0.48
  const ry = rx * 0.5
  const hPx = heightCm * (halfH / (CELL_CM / 2)) * 1.05

  return (
    <g data-object-id={obj.id} data-object-type={obj.typeId} className="cursor-pointer">
      {/* Sombra proyectada en el piso */}
      <ellipse cx="0" cy="2" rx={rx * 1.15} ry={ry * 1.15} fill="rgba(15, 23, 42, 0.22)" />

      {/* Base de la maceta */}
      <ellipse cx="0" cy="0" rx={rx * 0.8} ry={ry * 0.8} fill="#9a3412" opacity="0.6" />

      {/* Cuerpo cilíndrico / troncocónico */}
      <path
        d={`
          M ${-rx * 0.8} 0
          L ${-rx} ${-hPx}
          A ${rx} ${ry} 0 0 0 ${rx} ${-hPx}
          L ${rx * 0.8} 0
          A ${rx * 0.8} ${ry * 0.8} 0 0 1 ${-rx * 0.8} 0
          Z
        `}
        fill="#ea580c"
        stroke="#9a3412"
        strokeWidth="1.2"
      />

      {/* Reborde superior */}
      <ellipse
        cx="0"
        cy={-hPx}
        rx={rx}
        ry={ry}
        fill="#c2410c"
        stroke="#7c2d12"
        strokeWidth="1.2"
      />

      {/* Sustrato / tierra fértil */}
      <ellipse
        cx="0"
        cy={-hPx + 2}
        rx={rx * 0.88}
        ry={ry * 0.88}
        fill="#451a03"
        stroke="#290e02"
        strokeWidth="0.8"
      />
    </g>
  )
})
PotRenderer.displayName = 'PotRenderer'
