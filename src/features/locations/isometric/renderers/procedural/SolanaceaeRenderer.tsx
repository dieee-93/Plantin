import React from 'react'
import type { PlantRendererProps } from '../types'
import { EarlyStages } from './EarlyStages'

/**
 * Arquetipo 1: Solanáceas de fruto (Tomate, Pimiento, Berenjena).
 * Escala relativa adulto: 45–55 px (resuelve V4: tutor y ápice acotados a ~49 px de altura total).
 * Contornos uniformes 0.8 en tono shadow. Iluminación NW coherente.
 */
export const SolanaceaeRenderer: React.FC<PlantRendererProps> = ({ spec }) => {
  const { bbch, palette, paletteKey, fruitShape } = spec

  if (bbch < 30) {
    return <EarlyStages spec={spec} />
  }

  const { leaf, leafDark, leafLight, flower, fruit, stem } = palette

  return (
    <g>
      {/* 1. Hojas traseras (profundidad dorsal) */}
      <g transform="translate(-1, -16)">
        <path d="M 0,0 Q -12,-6 -17,-1 Q -9,4 0,0" fill={leafDark.left} stroke={leafDark.shadow} strokeWidth={0.8} />
        <line x1="0" y1="0" x2="-15" y2="-1" stroke={leafLight.top} strokeWidth={0.8} />
        <ellipse cx="-10" cy="-3" rx="3" ry="1.6" transform="rotate(-15 -10 -3)" fill={leaf.left} />
      </g>
      <g transform="translate(1, -28)">
        <path d="M 0,0 Q 13,-8 19,-2 Q 10,4 0,0" fill={leafDark.left} stroke={leafDark.shadow} strokeWidth={0.8} />
        <line x1="0" y1="0" x2="17" y2="-2" stroke={leafLight.top} strokeWidth={0.8} />
        <ellipse cx="11" cy="-4" rx="3.5" ry="1.8" transform="rotate(15 11 -4)" fill={leaf.left} />
      </g>

      {/* 2. Tutor de bambú / guía con abrazaderas (anclado en sustrato y acotado a 48 px) */}
      <g data-botanical-feature="plant-stake">
        <rect
          x="4"
          y="-49"
          width="3.2"
          height="43"
          rx="1.2"
          fill="url(#tutor-bamboo)"
          stroke={stem.shadow}
          strokeWidth={0.8}
        />
        {/* Nudos de bambú */}
        <line x1="3.5" y1="-38" x2="7.5" y2="-38" stroke={stem.shadow} strokeWidth={0.8} />
        <line x1="3.5" y1="-26" x2="7.5" y2="-26" stroke={stem.shadow} strokeWidth={0.8} />
        <line x1="3.5" y1="-14" x2="7.5" y2="-14" stroke={stem.shadow} strokeWidth={0.8} />
        {/* Abrazaderas de sujeción */}
        <ellipse cx="3.5" cy="-24" rx="3.5" ry="1.6" fill={leafDark.shadow} stroke={leafDark.right} strokeWidth={0.8} />
        <ellipse cx="3.5" cy="-38" rx="3.5" ry="1.6" fill={leafDark.shadow} stroke={leafDark.right} strokeWidth={0.8} />
      </g>

      {/* 3. Tallo principal cilíndrico */}
      <path
        d="M 0,-7 C -2,-20 2,-32 0,-44"
        stroke={`url(#plant-stem-${paletteKey})`}
        strokeWidth={3.4}
        strokeLinecap="round"
        fill="none"
      />

      {/* 4. Hojas delanteras (profundidad frontal con luz NW) */}
      <g transform="translate(1, -17)">
        <path d="M 0,0 Q 12,-6 18,-1 Q 9,4 0,0" fill={leaf.left} stroke={leaf.shadow} strokeWidth={0.8} />
        <line x1="0" y1="0" x2="16" y2="-1" stroke={leafLight.top} strokeWidth={0.8} />
        <ellipse cx="10" cy="-3" rx="3" ry="1.6" transform="rotate(15 10 -3)" fill={leafLight.left} />
      </g>
      <g transform="translate(-1, -29)">
        <path d="M 0,0 Q -13,-8 -19,-2 Q -10,4 0,0" fill={leaf.left} stroke={leaf.shadow} strokeWidth={0.8} />
        <line x1="0" y1="0" x2="-17" y2="-2" stroke={leafLight.top} strokeWidth={0.8} />
        <ellipse cx="-11" cy="-4" rx="3.5" ry="1.8" transform="rotate(-15 -11 -4)" fill={leafLight.left} />
      </g>

      {/* Ápice foliáceo (altura máxima y = -48 px, total 41 px de follaje sobre contenedor) */}
      <path d="M 0,-40 Q -10,-49 -12,-42 Q -5,-36 0,-40" fill={leafLight.left} stroke={leaf.shadow} strokeWidth={0.8} />
      <path d="M 0,-40 Q 10,-49 12,-42 Q 5,-36 0,-40" fill={leaf.left} stroke={leaf.shadow} strokeWidth={0.8} />
      <ellipse cx="0" cy="-47" rx="4.2" ry="2.8" fill={leafLight.left} />

      {/* 5. Floración estrellada (BBCH 50–69) */}
      {bbch >= 50 && bbch < 70 && (
        <g data-botanical-feature="star-flower">
          <g transform="translate(-8, -32)">
            <line x1="0" y1="0" x2="-2.5" y2="-2.5" stroke={leafDark.shadow} strokeWidth={0.8} />
            <polygon
              points="0,-4.5 1.4,-1.4 4.5,0 1.4,1.4 0,4.5 -1.4,1.4 -4.5,0 -1.4,-1.4"
              fill={flower.left}
              stroke={flower.shadow}
              strokeWidth={0.8}
            />
            <circle cx="0" cy="0" r="1.4" fill={flower.highlight} />
          </g>
          <g transform="translate(9, -34)">
            <polygon
              points="0,-4.5 1.4,-1.4 4.5,0 1.4,1.4 0,4.5 -1.4,1.4 -4.5,0 -1.4,-1.4"
              fill={flower.left}
              stroke={flower.shadow}
              strokeWidth={0.8}
            />
            <circle cx="0" cy="0" r="1.4" fill={flower.highlight} />
          </g>
        </g>
      )}

      {/* 6. Fructificación con cáliz estrellado y brillo especular NW (BBCH 70+) */}
      {bbch >= 70 && (
        <g data-botanical-feature="calyx-fruit">
          {fruitShape === 'elongated_pod' ? (
            <>
              {/* Pimiento / Berenjena izquierdo */}
              <g transform="translate(-9, -22) rotate(14)">
                <polygon
                  points="0,-7 -3,-4.5 0,-5.5 3,-4.5"
                  fill={leafDark.left}
                  stroke={leafDark.shadow}
                  strokeWidth={0.8}
                />
                <ellipse
                  cx="0"
                  cy="0"
                  rx="3.8"
                  ry="6.8"
                  fill={`url(#plant-fruit-${paletteKey})`}
                  stroke={fruit.shadow}
                  strokeWidth={0.8}
                />
                <ellipse cx="-1.2" cy="-1.8" rx="1" ry="3" fill="#ffffff" opacity="0.65" />
              </g>
              {/* Pimiento derecho */}
              <g transform="translate(9, -25) rotate(-14)">
                <polygon
                  points="0,-7 -3,-4.5 0,-5.5 3,-4.5"
                  fill={leafDark.left}
                  stroke={leafDark.shadow}
                  strokeWidth={0.8}
                />
                <ellipse
                  cx="0"
                  cy="0"
                  rx="3.8"
                  ry="6.8"
                  fill={`url(#plant-fruit-${paletteKey})`}
                  stroke={fruit.shadow}
                  strokeWidth={0.8}
                />
                <ellipse cx="-1.2" cy="-1.8" rx="1" ry="3" fill="#ffffff" opacity="0.65" />
              </g>
            </>
          ) : (
            <>
              {/* Tomate izquierdo esférico */}
              <g transform="translate(-9, -22)">
                <circle
                  cx="0"
                  cy="0"
                  r="5"
                  fill={`url(#plant-fruit-${paletteKey})`}
                  stroke={fruit.shadow}
                  strokeWidth={0.8}
                />
                {/* Brillo especular NW */}
                <circle cx="-1.6" cy="-1.6" r="1.3" fill="#ffffff" opacity="0.8" />
                <g transform="translate(0, -4.5)">
                  <path
                    d="M 0,0 L -2.5,-1.8 M 0,0 L 2.5,-1.8 M 0,0 L -3.2,0.4 M 0,0 L 3.2,0.4 M 0,0 L 0,-2.5"
                    stroke={leafDark.left}
                    strokeWidth={0.8}
                    strokeLinecap="round"
                  />
                  <circle cx="0" cy="0" r="1" fill={leafDark.shadow} />
                </g>
              </g>

              {/* Tomate derecho */}
              <g transform="translate(9, -25)">
                <circle
                  cx="0"
                  cy="0"
                  r="5.2"
                  fill={`url(#plant-fruit-${paletteKey})`}
                  stroke={fruit.shadow}
                  strokeWidth={0.8}
                />
                <circle cx="-1.6" cy="-1.6" r="1.3" fill="#ffffff" opacity="0.8" />
                <g transform="translate(0, -4.7)">
                  <path
                    d="M 0,0 L -2.5,-1.8 M 0,0 L 2.5,-1.8 M 0,0 L -3.2,0.4 M 0,0 L 3.2,0.4 M 0,0 L 0,-2.5"
                    stroke={leafDark.left}
                    strokeWidth={0.8}
                    strokeLinecap="round"
                  />
                  <circle cx="0" cy="0" r="1" fill={leafDark.shadow} />
                </g>
              </g>

              {/* Tomate subapical */}
              <g transform="translate(0, -34)">
                <circle
                  cx="0"
                  cy="0"
                  r="4.2"
                  fill={`url(#plant-fruit-${paletteKey})`}
                  stroke={fruit.shadow}
                  strokeWidth={0.8}
                />
                <circle cx="-1.3" cy="-1.3" r="1.1" fill="#ffffff" opacity="0.8" />
                <g transform="translate(0, -3.8)">
                  <path
                    d="M 0,0 L -2,-1.5 M 0,0 L 2,-1.5 M 0,0 L -2.5,0 M 0,0 L 2.5,0"
                    stroke={leafDark.left}
                    strokeWidth={0.8}
                    strokeLinecap="round"
                  />
                  <circle cx="0" cy="0" r="0.8" fill={leafDark.shadow} />
                </g>
              </g>
            </>
          )}
        </g>
      )}
    </g>
  )
}
