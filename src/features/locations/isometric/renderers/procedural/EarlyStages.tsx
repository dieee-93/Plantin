import React from 'react'
import type { PlantVisualSpec } from '../../visual/plantSpec'

export interface EarlyStagesProps {
  spec: PlantVisualSpec
}

/**
 * Renderiza la morfología juvenil (BBCH 0–9 Germinación y BBCH 10–29 Desarrollo Foliar).
 */
export const EarlyStages: React.FC<EarlyStagesProps> = ({ spec }) => {
  const { bbch, archetype, palette } = spec

  if (bbch < 10) {
    if (archetype === 'cereal_grass') {
      return (
        <path
          d="M 0,-7 Q -2,-16 3,-23 Q 1,-14 0,-7"
          fill={palette.leafLight.left}
          stroke={palette.leaf.shadow}
          strokeWidth="0.8"
        />
      )
    }

    return (
      <g>
        <path
          d="M 0,-7 Q 0,-15 0,-18"
          stroke={palette.leafLight.left}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse
          cx="-4"
          cy="-18"
          rx="4.5"
          ry="2.2"
          transform="rotate(-25 -4 -18)"
          fill={palette.leafLight.left}
        />
        <ellipse
          cx="4"
          cy="-18"
          rx="4.5"
          ry="2.2"
          transform="rotate(25 4 -18)"
          fill={palette.leaf.left}
        />
      </g>
    )
  }

  if (bbch < 30) {
    if (archetype === 'rosette_leafy') {
      return (
        <g>
          <ellipse
            cx="-9"
            cy="-11"
            rx="8"
            ry="4.5"
            transform="rotate(-18 -9 -11)"
            fill={palette.leafDark.left}
          />
          <ellipse
            cx="9"
            cy="-11"
            rx="8"
            ry="4.5"
            transform="rotate(18 9 -11)"
            fill={palette.leaf.left}
          />
          <ellipse
            cx="-5"
            cy="-15"
            rx="7"
            ry="4"
            transform="rotate(-10 -5 -15)"
            fill={palette.leaf.left}
          />
          <ellipse
            cx="5"
            cy="-15"
            rx="7"
            ry="4"
            transform="rotate(10 5 -15)"
            fill={palette.leafLight.left}
          />
          <circle cx="0" cy="-14" r="4.5" fill={palette.leafLight.left} />
        </g>
      )
    }

    if (archetype === 'cereal_grass') {
      return (
        <g>
          <path
            d="M 0,-7 L 0,-28"
            stroke={palette.stem.left}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path d="M 0,-14 Q -14,-24 -18,-18 Q -10,-16 0,-12" fill={palette.leaf.left} />
          <path d="M 0,-16 Q 14,-26 18,-20 Q 10,-18 0,-14" fill={palette.leafDark.left} />
          <path d="M 0,-22 Q -10,-34 -13,-30 Q -6,-26 0,-20" fill={palette.leafLight.left} />
          <path d="M 0,-24 Q 10,-36 13,-32 Q 6,-28 0,-22" fill={palette.leaf.left} />
        </g>
      )
    }

    return (
      <g>
        <path
          d="M 0,-7 C -1,-16 1,-24 0,-30"
          stroke={palette.stem.left}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M 0,-15 Q -12,-22 -14,-16 Q -8,-11 0,-15" fill={palette.leaf.left} />
        <path d="M 0,-15 Q 12,-22 14,-16 Q 8,-11 0,-15" fill={palette.leafDark.left} />
        <path d="M 0,-25 Q -10,-34 -12,-27 Q -6,-21 0,-25" fill={palette.leafLight.left} />
        <path d="M 0,-25 Q 10,-34 12,-27 Q 6,-21 0,-25" fill={palette.leaf.left} />
        <circle cx="0" cy="-31" r="3" fill={palette.leafLight.left} />
      </g>
    )
  }

  return null
}
