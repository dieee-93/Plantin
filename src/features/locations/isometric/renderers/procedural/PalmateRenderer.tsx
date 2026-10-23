import React from 'react'
import type { PlantRendererProps } from '../types'
import { EarlyStages } from './EarlyStages'

/**
 * Arquetipo 8: Palmeada / Caña industrial (Cannabis, Humulus, Ricinus).
 * Escala relativa adulto: 50–58 px de altura total (cola apical en y = -50 px).
 * Hojas digitadas de 5 folíolos lanceolados con nervaduras. Iluminación NW.
 */
export const PalmateRenderer: React.FC<PlantRendererProps> = ({ spec }) => {
  const { bbch, palette } = spec

  if (bbch < 30) {
    return <EarlyStages spec={spec} />
  }

  const { stem, leaf, leafDark, leafLight, fruit } = palette

  return (
    <g data-botanical-feature="palmate-cane">
      {/* 1. Caña principal erecta con nudos */}
      <line x1="0" y1="-7" x2="0" y2="-46" stroke={stem.left} strokeWidth={3} strokeLinecap="round" />
      <line x1="-2.5" y1="-18" x2="2.5" y2="-18" stroke={stem.shadow} strokeWidth={0.8} />
      <line x1="-2.5" y1="-30" x2="2.5" y2="-30" stroke={stem.shadow} strokeWidth={0.8} />

      {/* 2. Hoja palmada inferior trasera (profundidad dorsal) */}
      <g transform="translate(0, -17)">
        {/* Folíolos digitados izquierdos */}
        <path d="M 0,0 L -15,-8 M 0,0 L -17,-1 M 0,0 L -12,5" stroke={leafDark.left} strokeWidth={2} strokeLinecap="round" />
        <line x1="0" y1="0" x2="-17" y2="-1" stroke={leafDark.shadow} strokeWidth={0.8} />
      </g>

      {/* 3. Hoja palmada inferior delantera */}
      <g transform="translate(0, -18)">
        {/* Folíolos digitados derechos */}
        <path d="M 0,0 L 15,-8 M 0,0 L 17,-1 M 0,0 L 12,5" stroke={leaf.left} strokeWidth={2} strokeLinecap="round" />
        <line x1="0" y1="0" x2="17" y2="-1" stroke={leafLight.top} strokeWidth={0.8} />
      </g>

      {/* 4. Hojas intermedias y superiores */}
      <g transform="translate(0, -28)">
        <path d="M 0,0 L -16,-10 M 0,0 L -18,-3 M 0,0 L -11,4" stroke={leaf.left} strokeWidth={1.8} strokeLinecap="round" />
        <path d="M 0,0 L 16,-10 M 0,0 L 18,-3 M 0,0 L 11,4" stroke={leafLight.left} strokeWidth={1.8} strokeLinecap="round" />
      </g>
      <g transform="translate(0, -38)">
        <path d="M 0,0 L -12,-8 M 0,0 L 12,-8" stroke={leafLight.left} strokeWidth={1.6} strokeLinecap="round" />
      </g>

      {/* 5. Inflorescencia apical: Cola resinosa / racimo compacto (BBCH 50+) */}
      {bbch >= 50 && (
        <g data-botanical-feature="palmate-cola" transform="translate(0, -45)">
          <ellipse
            cx="0"
            cy="0"
            rx={bbch >= 70 ? 5.2 : 3.8}
            ry={bbch >= 70 ? 9.5 : 7}
            fill={fruit.left}
            stroke={fruit.shadow}
            strokeWidth={0.8}
          />
          {/* Brácteas y estigmas dorados/naranjas */}
          <path d="M -3,-3 Q -5,-7 -3,-9" stroke={fruit.shadow} strokeWidth={0.8} fill="none" />
          <path d="M 3,-3 Q 5,-7 3,-9" stroke={fruit.shadow} strokeWidth={0.8} fill="none" />
          <ellipse cx="-1.2" cy="-2" rx="1.2" ry="2.5" fill={fruit.highlight} opacity="0.6" />
        </g>
      )}
    </g>
  )
}
