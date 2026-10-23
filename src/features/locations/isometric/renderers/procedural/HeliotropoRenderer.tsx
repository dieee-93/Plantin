import React from 'react'
import type { PlantRendererProps } from '../types'
import { EarlyStages } from './EarlyStages'

/**
 * Arquetipo 5: Capítulo Solar / Girasol (Helianthus).
 * Escala relativa adulto: 60–70 px de altura total (capítulo apical en y = -60 px).
 * Contornos uniformes 0.8 en tono shadow. Iluminación NW.
 */
export const HeliotropoRenderer: React.FC<PlantRendererProps> = ({ spec }) => {
  const { bbch, palette, paletteKey } = spec

  if (bbch < 30) {
    return <EarlyStages spec={spec} />
  }

  const { leaf, leafDark, leafLight, flower, fruit } = palette

  return (
    <g>
      {/* 1. Tallo robusto y hojas cordadas (profundidad dorsal) */}
      <g data-botanical-feature="sunflower-stem">
        {bbch >= 70 ? (
          <path
            d="M 0,-7 L 0,-36 Q 0,-46 -7,-50"
            stroke={`url(#plant-stem-${paletteKey})`}
            strokeWidth={4.5}
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <line
            x1="0"
            y1="-7"
            x2="0"
            y2="-50"
            stroke={`url(#plant-stem-${paletteKey})`}
            strokeWidth={4.5}
            strokeLinecap="round"
          />
        )}

        {/* Hojas basales e intermedias */}
        {/* Nivel inferior */}
        <g transform="translate(0, -16)">
          <path
            d="M 0,0 C -5,-7 -19,-12 -22,-3 C -23,5 -9,6 0,0"
            fill={leafDark.left}
            stroke={leafDark.shadow}
            strokeWidth={0.8}
          />
          <line x1="0" y1="0" x2="-20" y2="-2" stroke={leafLight.top} strokeWidth={0.8} />

          <path
            d="M 0,0 C 5,-7 19,-12 22,-3 C 23,5 9,6 0,0"
            fill={leaf.left}
            stroke={leaf.shadow}
            strokeWidth={0.8}
          />
          <line x1="0" y1="0" x2="20" y2="-2" stroke={leafLight.top} strokeWidth={0.8} />
        </g>

        {/* Nivel medio */}
        <g transform="translate(0, -29)">
          <path
            d="M 0,0 C -4,-6 -17,-10 -19,-2 C -20,5 -7,4 0,0"
            fill={leaf.left}
            stroke={leaf.shadow}
            strokeWidth={0.8}
          />
          <line x1="0" y1="0" x2="-18" y2="-2" stroke={leafLight.top} strokeWidth={0.8} />

          <path
            d="M 0,0 C 4,-6 17,-10 19,-2 C 20,5 7,4 0,0"
            fill={leafLight.left}
            stroke={leafDark.shadow}
            strokeWidth={0.8}
          />
          <line x1="0" y1="0" x2="18" y2="-2" stroke={leafLight.highlight} strokeWidth={0.8} />
        </g>

        {/* Hojas superiores */}
        <g transform="translate(0, -40)">
          <path d="M 0,0 Q -10,-7 -13,-2 Q -7,3 0,0" fill={leafLight.left} stroke={leaf.shadow} strokeWidth={0.8} />
          <path d="M 0,0 Q 10,-7 13,-2 Q 7,3 0,0" fill={leaf.left} stroke={leaf.shadow} strokeWidth={0.8} />
        </g>
      </g>

      {/* 2. Floración: Capítulo solar radiante (BBCH 50–69, centro en y = -52 px) */}
      {bbch >= 50 && bbch < 70 && (
        <g data-botanical-feature="sunflower-head" transform="translate(0, -52)">
          {/* Brácteas involucrales posteriores */}
          <g fill={leafDark.shadow} stroke={leafDark.right} strokeWidth={0.8}>
            <polygon points="0,-13 -2.5,-9 2.5,-9" />
            <polygon points="-9,-9 -7,-5 -5,-7" />
            <polygon points="9,-9 7,-5 5,-7" />
            <polygon points="-13,0 -9,-2.5 -9,2.5" />
            <polygon points="13,0 9,-2.5 9,2.5" />
            <polygon points="-9,9 -7,5 -5,7" />
            <polygon points="9,9 7,5 5,7" />
            <polygon points="0,13 -2.5,9 2.5,9" />
          </g>

          {/* Anillo exterior de lígulas doradas */}
          <g fill={flower.left} stroke={flower.shadow} strokeWidth={0.8}>
            <ellipse cx="0" cy="-12" rx="2.2" ry="4.8" />
            <ellipse cx="6" cy="-10" rx="2.2" ry="4.8" transform="rotate(30 6 -10)" />
            <ellipse cx="10" cy="-6" rx="2.2" ry="4.8" transform="rotate(60 10 -6)" />
            <ellipse cx="12" cy="0" rx="2.2" ry="4.8" transform="rotate(90 12 0)" />
            <ellipse cx="10" cy="6" rx="2.2" ry="4.8" transform="rotate(120 10 6)" />
            <ellipse cx="6" cy="10" rx="2.2" ry="4.8" transform="rotate(150 6 10)" />
            <ellipse cx="0" cy="12" rx="2.2" ry="4.8" transform="rotate(180 0 12)" />
            <ellipse cx="-6" cy="10" rx="2.2" ry="4.8" transform="rotate(210 -6 10)" />
            <ellipse cx="-10" cy="6" rx="2.2" ry="4.8" transform="rotate(240 -10 6)" />
            <ellipse cx="-12" cy="0" rx="2.2" ry="4.8" transform="rotate(270 -12 0)" />
            <ellipse cx="-10" cy="-6" rx="2.2" ry="4.8" transform="rotate(300 -10 -6)" />
            <ellipse cx="-6" cy="-10" rx="2.2" ry="4.8" transform="rotate(330 -6 -10)" />
          </g>

          {/* Disco central de flores tubulares */}
          <circle cx="0" cy="0" r="7" fill={fruit.shadow} stroke={flower.shadow} strokeWidth={0.8} />
          <circle cx="0" cy="0" r="4.2" fill={fruit.left} stroke={fruit.shadow} strokeWidth={0.8} />
          <circle cx="0" cy="0" r="1.8" fill={fruit.shadow} />
          <circle cx="-2.5" cy="-2.5" r="0.7" fill={flower.highlight} />
          <circle cx="2.5" cy="-2.5" r="0.7" fill={flower.highlight} />
          <circle cx="-2.5" cy="2.5" r="0.7" fill={flower.highlight} />
          <circle cx="2.5" cy="2.5" r="0.7" fill={flower.highlight} />
        </g>
      )}

      {/* 3. Fructificación: Cabeza péndula de aquenios maduros (BBCH 70+) */}
      {bbch >= 70 && (
        <g data-botanical-feature="sunflower-seed-head" transform="translate(-8, -50) rotate(16)">
          <ellipse cx="0" cy="-2" rx="11" ry="8.5" fill={leafDark.left} stroke={leafDark.shadow} strokeWidth={0.8} />
          <ellipse cx="0" cy="2" rx="10" ry="7.5" fill={fruit.shadow} stroke={flower.shadow} strokeWidth={0.8} />

          {/* Reticulado concéntrico de aquenios */}
          <g stroke={leafLight.shadow} strokeWidth={0.8} strokeDasharray="1.2 1.2" fill="none">
            <ellipse cx="0" cy="2" rx="7.5" ry="5.5" />
            <ellipse cx="0" cy="2" rx="4.8" ry="3.5" />
          </g>

          {/* Lígulas marchitas */}
          <g fill={flower.shadow} opacity="0.85">
            <path d="M -9,3 Q -12,8 -9,11 Q -8,7 -7,4 Z" />
            <path d="M -5,6 Q -6,11 -3,12 Q -3,9 -2,7 Z" />
            <path d="M 0,7 Q 0,13 2,13 Q 2,10 2,7 Z" />
            <path d="M 5,6 Q 7,11 8,10 Q 7,8 6,6 Z" />
          </g>
        </g>
      )}
    </g>
  )
}
