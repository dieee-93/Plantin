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
    <g>
      {/* 1. Caña principal erecta con entrenudos marcados */}
      <g data-botanical-feature="palmate-cane">
        <line x1="0" y1="-7" x2="0" y2="-47" stroke={stem.left} strokeWidth={3.2} strokeLinecap="round" />
        <line x1="-3" y1="-18" x2="3" y2="-18" stroke={stem.shadow} strokeWidth={1} />
        <line x1="-3" y1="-29" x2="3" y2="-29" stroke={stem.shadow} strokeWidth={1} />
        <line x1="-2.5" y1="-39" x2="2.5" y2="-39" stroke={stem.shadow} strokeWidth={1} />
      </g>

      {/* 2. Hojas palmadas compuestas de folíolos lanceolados con borde aserrado */}
      <g data-botanical-feature="palmate-serrated-leaf" transform="translate(0, -18)">
        {/* Folíolos dorsales izquierdos */}
        <g transform="translate(-1, 0)">
          <path d="M 0,0 Q -8,4 -13,7 Q -10,3 0,0" fill={leafDark.left} stroke={leafDark.shadow} strokeWidth={0.7} />
          <path d="M 0,0 Q -11,-1 -18,-2 Q -12,-4 0,0" fill={leafDark.left} stroke={leafDark.shadow} strokeWidth={0.7} />
          <path d="M 0,0 Q -10,-8 -17,-12 Q -8,-8 0,0" fill={leafDark.left} stroke={leafDark.shadow} strokeWidth={0.7} />
          <line x1="0" y1="0" x2="-16" y2="-2" stroke={leafDark.shadow} strokeWidth={0.6} />
          <line x1="0" y1="0" x2="-15" y2="-11" stroke={leafDark.shadow} strokeWidth={0.6} />
        </g>
        {/* Folíolos frontales derechos iluminados NW */}
        <g transform="translate(1, 0)">
          <path d="M 0,0 Q 8,4 13,7 Q 10,3 0,0" fill={leaf.left} stroke={leaf.shadow} strokeWidth={0.7} />
          <path d="M 0,0 Q 11,-1 18,-2 Q 12,-4 0,0" fill={leaf.left} stroke={leaf.shadow} strokeWidth={0.7} />
          <path d="M 0,0 Q 10,-8 17,-12 Q 8,-8 0,0" fill={leaf.left} stroke={leaf.shadow} strokeWidth={0.7} />
          <line x1="0" y1="0" x2="16" y2="-2" stroke={leafLight.top} strokeWidth={0.6} />
          <line x1="0" y1="0" x2="15" y2="-11" stroke={leafLight.top} strokeWidth={0.6} />
        </g>
      </g>

      <g data-botanical-feature="palmate-serrated-leaf" transform="translate(0, -30)">
        {/* Hojas del tercio medio */}
        <path d="M 0,0 Q -10,-6 -16,-9 Q -8,-6 0,0" fill={leaf.left} stroke={leaf.shadow} strokeWidth={0.7} />
        <path d="M 0,0 Q -11,-1 -17,-2 Q -10,-3 0,0" fill={leaf.left} stroke={leaf.shadow} strokeWidth={0.7} />
        <path d="M 0,0 Q 10,-6 16,-9 Q 8,-6 0,0" fill={leafLight.left} stroke={leaf.shadow} strokeWidth={0.7} />
        <path d="M 0,0 Q 11,-1 17,-2 Q 10,-3 0,0" fill={leafLight.left} stroke={leaf.shadow} strokeWidth={0.7} />
        <line x1="0" y1="0" x2="-15" y2="-8" stroke={leafLight.top} strokeWidth={0.6} />
        <line x1="0" y1="0" x2="15" y2="-8" stroke={leafLight.top} strokeWidth={0.6} />
      </g>

      <g transform="translate(0, -40)">
        <path d="M 0,0 L -12,-7 M 0,0 L 12,-7" stroke={leafLight.left} strokeWidth={1.6} strokeLinecap="round" />
      </g>

      {/* 3. Inflorescencia apical: Cola resinosa piramidal densa con brácteas y estigmas (BBCH 50+) */}
      {bbch >= 50 && (
        <g data-botanical-feature="resin-cola" transform="translate(0, -46)">
          {/* Cuerpo piramidal de cálices agrupados */}
          <ellipse
            cx="0"
            cy="0"
            rx={bbch >= 70 ? 5.8 : 4.2}
            ry={bbch >= 70 ? 10.5 : 7.8}
            fill={fruit.left}
            stroke={fruit.shadow}
            strokeWidth={0.8}
          />
          {/* Brácteas y cálices en relieve */}
          <ellipse cx="-2.5" cy="-3" rx="2.4" ry="3.2" fill={leafLight.left} stroke={fruit.shadow} strokeWidth={0.6} />
          <ellipse cx="2.5" cy="-3" rx="2.4" ry="3.2" fill={leafLight.left} stroke={fruit.shadow} strokeWidth={0.6} />
          <ellipse cx="0" cy="3" rx="2.6" ry="3.4" fill={fruit.left} stroke={fruit.shadow} strokeWidth={0.6} />

          {/* Brácteas apicales agudas */}
          <path d="M 0,-11 L -2.5,-6 L 2.5,-6 Z" fill={leafLight.left} stroke={fruit.shadow} strokeWidth={0.6} />

          {/* Estigmas pistilares dobles emergentes */}
          <path d="M -2.5,-4 Q -5,-9 -3,-11" stroke="#f59e0b" strokeWidth={0.8} fill="none" />
          <path d="M 2.5,-4 Q 5,-9 3,-11" stroke="#f59e0b" strokeWidth={0.8} fill="none" />
          <path d="M -1,1 Q -3,3 -4,5" stroke="#f59e0b" strokeWidth={0.8} fill="none" />
          <path d="M 1,1 Q 3,3 4,5" stroke="#f59e0b" strokeWidth={0.8} fill="none" />

          {/* Brillo especular de tricomas resinosos */}
          <ellipse cx="-1.4" cy="-2.5" rx="1.5" ry="3" fill="#ffffff" opacity={bbch >= 70 ? 0.45 : 0.25} />
        </g>
      )}
    </g>
  )
}
