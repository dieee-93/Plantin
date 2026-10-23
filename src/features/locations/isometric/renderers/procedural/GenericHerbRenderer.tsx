import React from 'react'
import type { PlantRendererProps } from '../types'
import { EarlyStages } from './EarlyStages'

/**
 * Arquetipo 9: Herbácea general / Silvestre (Arabidopsis, Ocimum, Mentha).
 * Escala relativa adulto: 45–50 px de altura total (sin tutor artificial).
 * Tallo erguido ramificado, hojas ovadas opuestas con nervaduras. Iluminación NW.
 */
export const GenericHerbRenderer: React.FC<PlantRendererProps> = ({ spec }) => {
  const { bbch, palette, paletteKey } = spec

  if (bbch < 30) {
    return <EarlyStages spec={spec} />
  }

  const { leaf, leafDark, leafLight, flower, fruit } = palette

  return (
    <g data-botanical-feature="generic-herb">
      {/* 1. Hojas opuestas traseras (profundidad dorsal) */}
      <g transform="translate(0, -17)">
        <path d="M 0,0 Q -12,-7 -16,-2 Q -8,3 0,0" fill={leafDark.left} stroke={leafDark.shadow} strokeWidth={0.8} />
        <line x1="0" y1="0" x2="-14" y2="-2" stroke={leafLight.top} strokeWidth={0.8} />
      </g>
      <g transform="translate(0, -29)">
        <path d="M 0,0 Q 13,-7 17,-2 Q 9,3 0,0" fill={leafDark.left} stroke={leafDark.shadow} strokeWidth={0.8} />
        <line x1="0" y1="0" x2="15" y2="-2" stroke={leafLight.top} strokeWidth={0.8} />
      </g>

      {/* 2. Tallo principal erguido ramificado (sin tutor) */}
      <path
        d="M 0,-7 C -1,-18 1,-28 0,-42 M 0,-22 L -8,-32 M 0,-26 L 8,-35"
        stroke={`url(#plant-stem-${paletteKey})`}
        strokeWidth={2.8}
        strokeLinecap="round"
        fill="none"
      />

      {/* 3. Hojas opuestas delanteras (profundidad frontal con luz NW) */}
      <g transform="translate(0, -18)">
        <path d="M 0,0 Q 12,-7 16,-2 Q 8,3 0,0" fill={leaf.left} stroke={leaf.shadow} strokeWidth={0.8} />
        <line x1="0" y1="0" x2="14" y2="-2" stroke={leafLight.highlight} strokeWidth={0.8} />
      </g>
      <g transform="translate(0, -28)">
        <path d="M 0,0 Q -13,-7 -17,-2 Q -9,3 0,0" fill={leaf.left} stroke={leaf.shadow} strokeWidth={0.8} />
        <line x1="0" y1="0" x2="-15" y2="-2" stroke={leafLight.top} strokeWidth={0.8} />
      </g>

      {/* Hojas apicales subterminales (ápice a y = -46 px) */}
      <ellipse cx="-4" cy="-39" rx="4.5" ry="2.6" transform="rotate(-25 -4 -39)" fill={leafLight.left} stroke={leaf.shadow} strokeWidth={0.8} />
      <ellipse cx="4" cy="-39" rx="4.5" ry="2.6" transform="rotate(25 4 -39)" fill={leafLight.left} stroke={leaf.shadow} strokeWidth={0.8} />
      <circle cx="0" cy="-44" r="2.8" fill={leafLight.highlight} />

      {/* 4. Inflorescencias apicales en corimbo (BBCH 50–69) */}
      {bbch >= 50 && bbch < 70 && (
        <g data-botanical-feature="herb-flowers">
          <circle cx="-6" cy="-33" r="1.8" fill={flower.left} stroke={flower.shadow} strokeWidth={0.8} />
          <circle cx="6" cy="-36" r="1.8" fill={flower.left} stroke={flower.shadow} strokeWidth={0.8} />
          <circle cx="0" cy="-45" r="2" fill={flower.highlight} stroke={flower.shadow} strokeWidth={0.8} />
        </g>
      )}

      {/* 5. Pequeños frutos capsulares / núculas (BBCH 70+) */}
      {bbch >= 70 && (
        <g data-botanical-feature="herb-fruit">
          <ellipse cx="-6" cy="-33" rx="1.8" ry="3.2" fill={fruit.left} stroke={fruit.shadow} strokeWidth={0.8} />
          <ellipse cx="6" cy="-36" rx="1.8" ry="3.2" fill={fruit.left} stroke={fruit.shadow} strokeWidth={0.8} />
          <ellipse cx="0" cy="-45" rx="2" ry="3.5" fill={fruit.left} stroke={fruit.shadow} strokeWidth={0.8} />
        </g>
      )}
    </g>
  )
}
