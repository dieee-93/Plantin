import React from 'react'
import type { PlantRendererProps } from '../types'
import { EarlyStages } from './EarlyStages'

/**
 * Arquetipo 6: Enredadera / Trepadora (Vid, Poroto, Zapallo).
 * Escala relativa adulto: 48–55 px de altura total con espaldera técnica.
 * Contornos uniformes 0.8 en tono shadow. Iluminación NW.
 */
export const VineRenderer: React.FC<PlantRendererProps> = ({ spec }) => {
  const { bbch, palette, fruitShape } = spec

  if (bbch < 30) {
    return <EarlyStages spec={spec} />
  }

  const { stem, leaf, leafDark, leafLight, fruit, flower } = palette

  return (
    <g>
      {/* 1. Espaldera técnica de guía vertical con amarres */}
      <g data-botanical-feature="vine-trellis">
        <line x1="4" y1="-7" x2="4" y2="-49" stroke={stem.shadow} strokeWidth={1.8} strokeLinecap="round" />
        <line x1="-8" y1="-24" x2="16" y2="-24" stroke={stem.shadow} strokeWidth={1} />
        <line x1="-8" y1="-38" x2="16" y2="-38" stroke={stem.shadow} strokeWidth={1} />
        {/* Ataduras de rafia */}
        <circle cx="4" cy="-24" r="1.5" fill={stem.left} stroke={stem.shadow} strokeWidth={0.8} />
        <circle cx="4" cy="-38" r="1.5" fill={stem.left} stroke={stem.shadow} strokeWidth={0.8} />
      </g>

      {/* 2. Tallo trepador helicoidal sinuoso */}
      <path
        d="M 0,-7 C -6,-16 6,-24 4,-32 C 2,-38 6,-43 4,-48"
        stroke={stem.left}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />

      {/* 3. Zarcillos trepadores espiralados */}
      <g data-botanical-feature="vine-tendril">
        <path d="M 4,-28 Q 10,-32 12,-29 Q 14,-26 12,-24" stroke={leafDark.shadow} strokeWidth={0.8} fill="none" />
        <path d="M 4,-42 Q -2,-45 -4,-42 Q -5,-39 -3,-38" stroke={leafDark.shadow} strokeWidth={0.8} fill="none" />
        <path d="M 2,-16 Q -5,-20 -7,-17 Q -9,-14 -6,-13" stroke={leafDark.shadow} strokeWidth={0.8} fill="none" />
      </g>

      {/* 4. Hojas traseras y delanteras palmilobadas */}
      <g transform="translate(-4, -18)">
        <path d="M 0,0 Q -12,-8 -16,-3 Q -8,3 0,0" fill={leafDark.left} stroke={leafDark.shadow} strokeWidth={0.8} />
        <line x1="0" y1="0" x2="-14" y2="-3" stroke={leafLight.top} strokeWidth={0.8} />
      </g>
      <g transform="translate(6, -26)">
        <path d="M 0,0 Q 14,-8 17,-2 Q 9,4 0,0" fill={leaf.left} stroke={leaf.shadow} strokeWidth={0.8} />
        <line x1="0" y1="0" x2="15" y2="-2" stroke={leafLight.top} strokeWidth={0.8} />
      </g>
      <g transform="translate(-2, -34)">
        <path d="M 0,0 Q -11,-7 -14,-1 Q -7,4 0,0" fill={leaf.left} stroke={leaf.shadow} strokeWidth={0.8} />
        <line x1="0" y1="0" x2="-12" y2="-1" stroke={leafLight.top} strokeWidth={0.8} />
      </g>
      <g transform="translate(5, -42)">
        <path d="M 0,0 Q 10,-6 12,-1 Q 6,3 0,0" fill={leafLight.left} stroke={leaf.shadow} strokeWidth={0.8} />
      </g>

      {/* 5. Floración papilionácea / amariposada de leguminosas (BBCH 50–69) */}
      {bbch >= 50 && bbch < 70 && (
        <g data-botanical-feature="papilionaceous-flower" transform="translate(-6, -28)">
          {/* Estandarte dorsal amplio */}
          <path
            d="M 0,0 C -4,-6 4,-6 0,0"
            fill={flower.left}
            stroke={flower.shadow}
            strokeWidth={0.8}
            transform="scale(1.4)"
          />
          {/* Alas laterales */}
          <ellipse cx="-2.5" cy="1" rx="2" ry="1.2" transform="rotate(-20 -2.5 1)" fill={flower.highlight} stroke={flower.shadow} strokeWidth={0.6} />
          <ellipse cx="2.5" cy="1" rx="2" ry="1.2" transform="rotate(20 2.5 1)" fill={flower.highlight} stroke={flower.shadow} strokeWidth={0.6} />
          {/* Quilla central */}
          <ellipse cx="0" cy="2" rx="1.2" ry="1.8" fill={flower.left} stroke={flower.shadow} strokeWidth={0.6} />
        </g>
      )}

      {/* 6. Fructificación: Racimo de uvas / Vainas péndulas / Calabazas (BBCH 70+) */}
      {bbch >= 70 && (
        <g>
          {fruitShape === 'gourd' ? (
            /* Zapallito / calabacín con costillas */
            <g data-botanical-feature="gourd-fruit" transform="translate(-7, -14)">
              <ellipse cx="0" cy="0" rx="6" ry="5" fill={fruit.left} stroke={fruit.shadow} strokeWidth={0.8} />
              <path d="M 0,-5 Q -2,0 0,5" stroke={fruit.shadow} strokeWidth={0.6} fill="none" />
              <ellipse cx="-1.5" cy="-1.5" rx="1.5" ry="1.2" fill="#ffffff" opacity="0.6" />
            </g>
          ) : fruitShape === 'elongated_pod' ? (
            /* Vainas péndulas de poroto / legumbre con abultamiento de semillas en relieve */
            <g data-botanical-feature="legume-pod" transform="translate(-6, -24)">
              {/* Vaina 1 principal curvada */}
              <path
                d="M 0,0 Q -5,8 -2,16 Q 0,8 2,0"
                fill={fruit.left}
                stroke={fruit.shadow}
                strokeWidth={0.9}
              />
              {/* Relieve de semillas dentro de la vaina */}
              <circle cx="-1.2" cy="4" r="1.3" fill={fruit.highlight} opacity="0.65" />
              <circle cx="-2.6" cy="8.2" r="1.4" fill={fruit.highlight} opacity="0.65" />
              <circle cx="-2.3" cy="12.4" r="1.3" fill={fruit.highlight} opacity="0.65" />
              {/* Pico estilar terminal */}
              <path d="M -2,16 Q -2,18 -4,19" stroke={fruit.shadow} strokeWidth={0.7} fill="none" />

              {/* Vaina 2 secundaria */}
              <path
                d="M 6,3 Q 3,10 5,17 Q 7,10 8,3"
                fill={fruit.left}
                stroke={fruit.shadow}
                strokeWidth={0.9}
              />
              <circle cx="4.6" cy="7" r="1.2" fill={fruit.highlight} opacity="0.65" />
              <circle cx="4.1" cy="11.2" r="1.2" fill={fruit.highlight} opacity="0.65" />
              <circle cx="4.9" cy="14.8" r="1.1" fill={fruit.highlight} opacity="0.65" />
            </g>
          ) : (
            /* Racimo de bayas / uvas péndulas */
            <g data-botanical-feature="grape-cluster" transform="translate(-7, -22)">
              {/* Nivel superior del racimo */}
              <circle cx="-3" cy="0" r="2.6" fill={fruit.left} stroke={fruit.shadow} strokeWidth={0.8} />
              <circle cx="3" cy="0" r="2.6" fill={fruit.left} stroke={fruit.shadow} strokeWidth={0.8} />
              {/* Nivel medio */}
              <circle cx="-1.5" cy="4" r="2.4" fill={fruit.left} stroke={fruit.shadow} strokeWidth={0.8} />
              <circle cx="2.5" cy="4" r="2.4" fill={fruit.left} stroke={fruit.shadow} strokeWidth={0.8} />
              {/* Ápice del racimo */}
              <circle cx="0.5" cy="7.5" r="2.1" fill={fruit.left} stroke={fruit.shadow} strokeWidth={0.8} />
              {/* Brillos especulares NW */}
              <circle cx="-3.8" cy="-0.8" r="0.8" fill="#ffffff" opacity="0.8" />
              <circle cx="2.2" cy="-0.8" r="0.8" fill="#ffffff" opacity="0.8" />
              <circle cx="-2.2" cy="3.2" r="0.7" fill="#ffffff" opacity="0.8" />
            </g>
          )}
        </g>
      )}
    </g>
  )
}
