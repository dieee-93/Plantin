import React from 'react'
import type { PlantRendererProps } from '../types'
import { EarlyStages } from './EarlyStages'

/**
 * Arquetipo 4: Raíces, tubérculos y bulbos (Zanahoria, Remolacha, Rábano, Allium).
 * Escala relativa adulto: 22–30 px de altura total de follaje sobre el contenedor.
 * Contornos uniformes 0.8 en tono shadow. Iluminación NW.
 */
export const RootTuberRenderer: React.FC<PlantRendererProps> = ({ spec }) => {
  const { bbch, palette, cropCode } = spec

  if (bbch < 30) {
    return <EarlyStages spec={spec} />
  }

  const { leaf, leafDark, leafLight, fruit } = palette

  return (
    <g>
      {/* 1. Hombro carnoso de la raíz emergente del sustrato */}
      <g data-botanical-feature="root-shoulder">
        {cropCode === 'CARROT' ? (
          <g>
            <path
              d="M -6,-5 C -7,-1 -2,2 0,2 C 2,2 7,-1 6,-5 C 4,-10 2,-12 0,-12 C -2,-12 -4,-10 -6,-5 Z"
              fill={fruit.left}
              stroke={fruit.shadow}
              strokeWidth={0.8}
            />
            {/* Estrías de crecimiento / lenticelas */}
            <line x1="-4" y1="-7.5" x2="4" y2="-7.5" stroke={fruit.shadow} strokeWidth={0.8} />
            <line x1="-3" y1="-4.5" x2="3" y2="-4.5" stroke={fruit.shadow} strokeWidth={0.8} />
            <ellipse cx="-2" cy="-7.5" rx="1" ry="2" fill={fruit.highlight} opacity="0.6" />
          </g>
        ) : cropCode === 'BEETROOT' || cropCode === 'RADISH' ? (
          <g>
            <ellipse
              cx="0"
              cy="-6"
              rx={bbch >= 70 ? 8.5 : 6}
              ry={bbch >= 70 ? 5.5 : 4.2}
              fill={fruit.left}
              stroke={fruit.shadow}
              strokeWidth={0.8}
            />
            <ellipse cx="-1.8" cy="-7" rx="2" ry="1.2" fill={fruit.highlight} opacity="0.5" />
            <path d="M -4,-5 Q 0,-3 4,-5" stroke={fruit.shadow} strokeWidth={0.8} fill="none" />
          </g>
        ) : (
          <g>
            <ellipse
              cx="0"
              cy="-6"
              rx={bbch >= 70 ? 8 : 5.8}
              ry={bbch >= 70 ? 5 : 3.6}
              fill={fruit.left}
              stroke={fruit.shadow}
              strokeWidth={0.8}
            />
          </g>
        )}
      </g>

      {/* 2. Follaje específico según cultivo (altura máxima y = -33 px, ~26 px de altura) */}
      {cropCode === 'CARROT' ? (
        <g data-botanical-feature="plumose-foliage">
          {/* Rama central plumosa */}
          <g transform="translate(0, -10)">
            <path d="M 0,0 L 0,-25" stroke={leafDark.left} strokeWidth={1.2} strokeLinecap="round" />
            <path d="M 0,-8 L -5,-11 M 0,-8 L 5,-11" stroke={leaf.left} strokeWidth={0.8} strokeLinecap="round" />
            <path d="M 0,-13 L -6,-17 M 0,-13 L 6,-17" stroke={leafLight.left} strokeWidth={0.8} strokeLinecap="round" />
            <path d="M 0,-18 L -7,-22 M 0,-18 L 7,-22" stroke={leaf.left} strokeWidth={0.8} strokeLinecap="round" />
            <path d="M 0,-22 L -5,-26 M 0,-22 L 5,-26" stroke={leafLight.top} strokeWidth={0.8} strokeLinecap="round" />
            <path d="M 0,-25 L -3,-29 M 0,-25 L 3,-29" stroke={leafLight.highlight} strokeWidth={0.8} strokeLinecap="round" />
          </g>

          {/* Rama lateral izquierda */}
          <g transform="translate(-1, -9)">
            <path d="M 0,0 Q -8,-10 -13,-21" stroke={leafDark.left} strokeWidth={1} strokeLinecap="round" fill="none" />
            <path d="M -4,-6 L -9,-8 M -4,-6 L -2,-10" stroke={leaf.left} strokeWidth={0.8} strokeLinecap="round" />
            <path d="M -7,-12 L -13,-14 M -7,-12 L -6,-16" stroke={leafLight.left} strokeWidth={0.8} strokeLinecap="round" />
            <path d="M -10,-17 L -15,-18 M -10,-17 L -9,-21" stroke={leafLight.top} strokeWidth={0.8} strokeLinecap="round" />
          </g>

          {/* Rama lateral derecha */}
          <g transform="translate(1, -9)">
            <path d="M 0,0 Q 8,-10 13,-21" stroke={leafDark.left} strokeWidth={1} strokeLinecap="round" fill="none" />
            <path d="M 4,-6 L 9,-8 M 4,-6 L 2,-10" stroke={leaf.left} strokeWidth={0.8} strokeLinecap="round" />
            <path d="M 7,-12 L 13,-14 M 7,-12 L 6,-16" stroke={leafLight.left} strokeWidth={0.8} strokeLinecap="round" />
            <path d="M 10,-17 L 15,-18 M 10,-17 L 9,-21" stroke={leafLight.top} strokeWidth={0.8} strokeLinecap="round" />
          </g>
        </g>
      ) : cropCode === 'BEETROOT' || cropCode === 'RADISH' ? (
        <g data-botanical-feature="beet-foliage">
          {/* Hoja izquierda */}
          <g transform="translate(0, -8)">
            <path d="M 0,0 Q -7,-8 -12,-13" stroke={fruit.left} strokeWidth={1.5} strokeLinecap="round" fill="none" />
            <ellipse
              cx="-13"
              cy="-17"
              rx="5.5"
              ry="4"
              transform="rotate(-30 -13 -17)"
              fill={leafDark.left}
              stroke={leafDark.shadow}
              strokeWidth={0.8}
            />
            <path d="M -10,-14 L -15,-20" stroke={fruit.highlight} strokeWidth={0.8} strokeLinecap="round" />
          </g>

          {/* Hoja derecha */}
          <g transform="translate(0, -8)">
            <path d="M 0,0 Q 7,-8 12,-13" stroke={fruit.left} strokeWidth={1.5} strokeLinecap="round" fill="none" />
            <ellipse
              cx="13"
              cy="-17"
              rx="5.5"
              ry="4"
              transform="rotate(30 13 -17)"
              fill={leaf.left}
              stroke={leafDark.shadow}
              strokeWidth={0.8}
            />
            <path d="M 10,-14 L 15,-20" stroke={fruit.highlight} strokeWidth={0.8} strokeLinecap="round" />
          </g>

          {/* Hoja central erecta (ápice en y = -31 px) */}
          <g transform="translate(0, -8)">
            <line x1="0" y1="0" x2="0" y2="-18" stroke={fruit.left} strokeWidth={1.6} strokeLinecap="round" />
            <ellipse cx="0" cy="-21" rx="5.2" ry="6" fill={leafLight.left} stroke={leafDark.shadow} strokeWidth={0.8} />
            <line x1="0" y1="-16" x2="0" y2="-26" stroke={fruit.highlight} strokeWidth={0.8} strokeLinecap="round" />
          </g>
        </g>
      ) : (
        /* Follaje tubular / erecto (cebollas, ajos) */
        <g>
          <path d="M 0,-7 Q -8,-18 -11,-28" stroke={leafDark.left} strokeWidth={2} strokeLinecap="round" fill="none" />
          <path d="M 0,-7 Q 8,-18 11,-28" stroke={leaf.left} strokeWidth={2} strokeLinecap="round" fill="none" />
          <path d="M 0,-8 L 0,-32" stroke={leafLight.left} strokeWidth={2.2} strokeLinecap="round" />
        </g>
      )}
    </g>
  )
}
