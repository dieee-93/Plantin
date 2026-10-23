import React from 'react'
import type { PlantRendererProps } from '../types'
import { EarlyStages } from './EarlyStages'

/**
 * Arquetipo 7: Leñosa perenne / Frutal / Cítrico (Citrus, Olea, Prunus).
 * Escala relativa adulto: 55–65 px de altura total (copa arbustiva en y = -54 px).
 * Contornos uniformes 0.8 en tono shadow. Iluminación NW.
 */
export const WoodyRenderer: React.FC<PlantRendererProps> = ({ spec }) => {
  const { bbch, palette } = spec

  if (bbch < 30) {
    return <EarlyStages spec={spec} />
  }

  const { stem, leaf, leafDark, leafLight, fruit } = palette

  return (
    <g data-botanical-feature="woody-shrub">
      {/* 1. Tronco principal leñoso y ramificación */}
      <path
        d="M 0,-7 L 0,-25 M 0,-20 L -9,-30 M 0,-22 L 9,-31"
        stroke={stem.shadow}
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      {/* Vetas de corteza */}
      <line x1="-1" y1="-10" x2="-1" y2="-18" stroke={stem.left} strokeWidth={0.8} />

      {/* 2. Copa dorsal trasera */}
      <circle cx="-10" cy="-33" r="9.5" fill={leafDark.left} stroke={leafDark.shadow} strokeWidth={0.8} />
      <circle cx="10" cy="-33" r="9.5" fill={leafDark.left} stroke={leafDark.shadow} strokeWidth={0.8} />

      {/* 3. Copa frontal iluminada NW (ápice a y = -53 px) */}
      <circle cx="-5" cy="-40" r="10.5" fill={leaf.left} stroke={leaf.shadow} strokeWidth={0.8} />
      <circle cx="6" cy="-40" r="10.5" fill={leaf.left} stroke={leaf.shadow} strokeWidth={0.8} />
      <circle cx="0" cy="-46" r="9" fill={leafLight.left} stroke={leaf.shadow} strokeWidth={0.8} />

      {/* Folíolos salientes perimetrales */}
      <ellipse cx="-16" cy="-39" rx="3.5" ry="2" transform="rotate(-30 -16 -39)" fill={leafLight.left} />
      <ellipse cx="16" cy="-39" rx="3.5" ry="2" transform="rotate(30 16 -39)" fill={leafLight.left} />

      {/* 4. Fructificación: Cítricos / Bayas globulares (BBCH 70+) */}
      {bbch >= 70 && (
        <g data-botanical-feature="woody-fruit">
          {/* Fruto izquierdo */}
          <g transform="translate(-8, -32)">
            <circle cx="0" cy="0" r="4.2" fill={fruit.left} stroke={fruit.shadow} strokeWidth={0.8} />
            <circle cx="-1.4" cy="-1.4" r="1.1" fill="#ffffff" opacity="0.8" />
          </g>
          {/* Fruto derecho */}
          <g transform="translate(8, -33)">
            <circle cx="0" cy="0" r="4.2" fill={fruit.left} stroke={fruit.shadow} strokeWidth={0.8} />
            <circle cx="-1.4" cy="-1.4" r="1.1" fill="#ffffff" opacity="0.8" />
          </g>
          {/* Fruto frontal central */}
          <g transform="translate(0, -39)">
            <circle cx="0" cy="0" r="3.8" fill={fruit.left} stroke={fruit.shadow} strokeWidth={0.8} />
            <circle cx="-1.2" cy="-1.2" r="1" fill="#ffffff" opacity="0.8" />
          </g>
        </g>
      )}
    </g>
  )
}
