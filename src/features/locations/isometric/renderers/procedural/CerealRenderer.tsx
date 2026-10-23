import React from 'react'
import type { PlantRendererProps } from '../types'
import { EarlyStages } from './EarlyStages'

/**
 * Arquetipo 2: Cereal / Gramínea (Maíz, Trigo).
 * Escala relativa adulto: 55–65 px (panoja apical a ~60 px de altura total).
 * Contornos uniformes 0.8 en tono shadow. Iluminación NW.
 */
export const CerealRenderer: React.FC<PlantRendererProps> = ({ spec }) => {
  const { bbch, palette, paletteKey } = spec

  if (bbch < 30) {
    return <EarlyStages spec={spec} />
  }

  const { leaf, leafDark, leafLight, flower, fruit } = palette

  return (
    <g>
      {/* 1. Hojas acintadas traseras (profundidad dorsal) */}
      <g transform="translate(0, -18)">
        <path d="M 0,0 Q -16,-12 -22,-5 Q -12,-2 0,0" fill={leafDark.left} stroke={leafDark.shadow} strokeWidth={0.8} />
        <line x1="0" y1="0" x2="-20" y2="-5" stroke={leafLight.top} strokeWidth={0.8} />
      </g>
      <g transform="translate(0, -32)">
        <path d="M 0,0 Q 18,-16 24,-7 Q 14,-3 0,0" fill={leafDark.left} stroke={leafDark.shadow} strokeWidth={0.8} />
        <line x1="0" y1="0" x2="22" y2="-7" stroke={leafLight.top} strokeWidth={0.8} />
      </g>

      {/* 2. Culmo / Caña cilíndrica segmentada */}
      <g data-botanical-feature="cereal-culm">
        <line
          x1="0"
          y1="-7"
          x2="0"
          y2="-52"
          stroke={`url(#plant-stem-${paletteKey})`}
          strokeWidth={3.8}
          strokeLinecap="round"
        />
        {/* Nudos */}
        <line x1="-3" y1="-20" x2="3" y2="-20" stroke={leafDark.shadow} strokeWidth={0.8} />
        <line x1="-3" y1="-34" x2="3" y2="-34" stroke={leafDark.shadow} strokeWidth={0.8} />
        <line x1="-2.5" y1="-46" x2="2.5" y2="-46" stroke={leafDark.shadow} strokeWidth={0.8} />
      </g>

      {/* 3. Hojas acintadas delanteras (profundidad frontal) */}
      <g transform="translate(0, -19)">
        <path d="M 0,0 Q 16,-13 22,-6 Q 12,-2 0,0" fill={leaf.left} stroke={leaf.shadow} strokeWidth={0.8} />
        <line x1="0" y1="0" x2="20" y2="-6" stroke={leafLight.highlight} strokeWidth={0.8} />
      </g>
      <g transform="translate(0, -30)">
        <path d="M 0,0 Q -19,-15 -25,-7 Q -14,-3 0,0" fill={leaf.left} stroke={leaf.shadow} strokeWidth={0.8} />
        <line x1="0" y1="0" x2="-23" y2="-7" stroke={leafLight.highlight} strokeWidth={0.8} />
      </g>
      {/* Hojas superiores de la bandera */}
      <g transform="translate(0, -42)">
        <path d="M 0,0 Q -13,-14 -16,-9 Q -9,-5 0,0" fill={leafLight.left} stroke={leaf.shadow} strokeWidth={0.8} />
        <line x1="0" y1="0" x2="-14" y2="-9" stroke={leafLight.highlight} strokeWidth={0.8} />
      </g>
      <g transform="translate(0, -44)">
        <path d="M 0,0 Q 13,-15 16,-10 Q 9,-6 0,0" fill={leaf.left} stroke={leaf.shadow} strokeWidth={0.8} />
        <line x1="0" y1="0" x2="14" y2="-10" stroke={leafLight.highlight} strokeWidth={0.8} />
      </g>

      {/* 4. Floración: Panoja apical dorada (BBCH 50–69, altura máxima y = -62 px) */}
      {bbch >= 50 && (
        <g data-botanical-feature="cereal-tassel" transform="translate(0, -52)">
          <line x1="0" y1="2" x2="0" y2="-12" stroke={flower.left} strokeWidth={1.8} strokeLinecap="round" />
          <path d="M 0,-3 Q -6,-8 -8,-12" stroke={flower.shadow} strokeWidth={0.8} fill="none" />
          <path d="M 0,-3 Q 6,-8 8,-12" stroke={flower.shadow} strokeWidth={0.8} fill="none" />
          <path d="M 0,-7 Q -4,-12 -5,-16" stroke={flower.left} strokeWidth={0.8} fill="none" />
          <path d="M 0,-7 Q 4,-12 5,-16" stroke={flower.left} strokeWidth={0.8} fill="none" />
          <circle cx="0" cy="-12" r="1.4" fill={flower.highlight} stroke={flower.shadow} strokeWidth={0.8} />
          <circle cx="-8" cy="-12" r="1.2" fill={flower.highlight} stroke={flower.shadow} strokeWidth={0.8} />
          <circle cx="8" cy="-12" r="1.2" fill={flower.highlight} stroke={flower.shadow} strokeWidth={0.8} />
        </g>
      )}

      {/* 5. Fructificación: Mazorcas con chalas y sedas (BBCH 70+) */}
      {bbch >= 70 && (
        <g data-botanical-feature="maize-cob">
          {/* Mazorca izquierda */}
          <g transform="translate(-4, -26) rotate(-22)">
            <ellipse cx="0" cy="0" rx="3.8" ry="7.5" fill={fruit.left} stroke={fruit.shadow} strokeWidth={0.8} />
            <line x1="-1.2" y1="-5" x2="-1.2" y2="5" stroke={fruit.shadow} strokeWidth={0.8} strokeDasharray="1.2 1.2" />
            <line x1="1.2" y1="-5" x2="1.2" y2="5" stroke={fruit.shadow} strokeWidth={0.8} strokeDasharray="1.2 1.2" />
            <path d="M -3.6,5 Q -5,0 -3.8,-6" stroke={leafDark.left} strokeWidth={1.4} fill="none" />
            <path d="M 3.6,5 Q 5,0 3.8,-6" stroke={leaf.left} strokeWidth={1.4} fill="none" />
            <path d="M 0,-7 Q -2.5,-12 -1,-14" stroke={fruit.shadow} strokeWidth={0.8} fill="none" />
          </g>

          {/* Mazorca derecha */}
          <g transform="translate(5, -31) rotate(22)">
            <ellipse cx="0" cy="0" rx="3.5" ry="7" fill={fruit.left} stroke={fruit.shadow} strokeWidth={0.8} />
            <line x1="-1" y1="-4.5" x2="-1" y2="4.5" stroke={fruit.shadow} strokeWidth={0.8} strokeDasharray="1.2 1.2" />
            <line x1="1" y1="-4.5" x2="1" y2="4.5" stroke={fruit.shadow} strokeWidth={0.8} strokeDasharray="1.2 1.2" />
            <path d="M -3.2,4.5 Q -4.5,0 -3.5,-5" stroke={leafDark.left} strokeWidth={1.4} fill="none" />
            <path d="M 3.2,4.5 Q 4.5,0 3.5,-5" stroke={leaf.left} strokeWidth={1.4} fill="none" />
            <path d="M 0,-6 Q 2,-11 1,-13" stroke={fruit.shadow} strokeWidth={0.8} fill="none" />
          </g>
        </g>
      )}
    </g>
  )
}
