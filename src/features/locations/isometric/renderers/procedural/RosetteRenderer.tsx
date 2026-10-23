import React from 'react'
import type { PlantRendererProps } from '../types'
import { EarlyStages } from './EarlyStages'

/**
 * Arquetipo 3: Hortecillas de hoja y rosetas (Lechuga, Espinaca, Brássica, Frutilla).
 * Escala relativa adulto: 18–24 px de altura total sobre el contenedor.
 * Contornos uniformes 0.8 en tono shadow. Iluminación NW.
 */
export const RosetteRenderer: React.FC<PlantRendererProps> = ({ spec }) => {
  const { bbch, palette, fruitShape } = spec

  if (bbch < 30) {
    return <EarlyStages spec={spec} />
  }

  const { leaf, leafDark, leafLight, flower, fruit } = palette

  return (
    <g>
      {fruitShape === 'berry_cluster' ? (
        /* SUB-VARIANTE FRUTILLA (Fragaria) */
        <g>
          {/* Trifolios traseros */}
          <g transform="translate(0, -6)">
            <line x1="0" y1="0" x2="-12" y2="-10" stroke={leafLight.left} strokeWidth={0.8} strokeLinecap="round" />
            <ellipse
              cx="-14"
              cy="-13"
              rx="4.2"
              ry="3"
              transform="rotate(-35 -14 -13)"
              fill={leafDark.left}
              stroke={leafDark.shadow}
              strokeWidth={0.8}
            />
            <ellipse
              cx="-11"
              cy="-15"
              rx="3.5"
              ry="2.5"
              transform="rotate(-15 -11 -15)"
              fill={leaf.left}
              stroke={leaf.shadow}
              strokeWidth={0.8}
            />
          </g>

          {/* Trifolios delanteros */}
          <g transform="translate(0, -6)">
            <line x1="0" y1="0" x2="12" y2="-10" stroke={leafLight.left} strokeWidth={0.8} strokeLinecap="round" />
            <ellipse
              cx="14"
              cy="-13"
              rx="4.2"
              ry="3"
              transform="rotate(35 14 -13)"
              fill={leaf.left}
              stroke={leaf.shadow}
              strokeWidth={0.8}
            />
            <ellipse
              cx="11"
              cy="-15"
              rx="3.5"
              ry="2.5"
              transform="rotate(15 11 -15)"
              fill={leafLight.left}
              stroke={leafLight.shadow}
              strokeWidth={0.8}
            />
          </g>

          {/* Trifolio central erecto (ápice a y = -22 px) */}
          <g transform="translate(0, -6)">
            <line x1="0" y1="0" x2="0" y2="-13" stroke={leafLight.left} strokeWidth={0.8} strokeLinecap="round" />
            <ellipse
              cx="0"
              cy="-16"
              rx="4.5"
              ry="3.2"
              fill={leafLight.left}
              stroke={leafLight.shadow}
              strokeWidth={0.8}
            />
            <ellipse
              cx="-4"
              cy="-14"
              rx="3.6"
              ry="2.5"
              transform="rotate(-25 -4 -14)"
              fill={leaf.left}
              stroke={leaf.shadow}
              strokeWidth={0.8}
            />
            <ellipse
              cx="4"
              cy="-14"
              rx="3.6"
              ry="2.5"
              transform="rotate(25 4 -14)"
              fill={leafLight.left}
              stroke={leafLight.shadow}
              strokeWidth={0.8}
            />
          </g>

          {/* Flores blancas de 5 pétalos (BBCH 50–69) */}
          {bbch >= 50 && (
            <g data-botanical-feature="strawberry-flower">
              <g transform="translate(-6, -19)">
                <circle cx="0" cy="-2.5" r="1.8" fill="#ffffff" stroke={flower.highlight} strokeWidth={0.8} />
                <circle cx="2.5" cy="-0.8" r="1.8" fill="#ffffff" stroke={flower.highlight} strokeWidth={0.8} />
                <circle cx="1.6" cy="2" r="1.8" fill="#ffffff" stroke={flower.highlight} strokeWidth={0.8} />
                <circle cx="-1.6" cy="2" r="1.8" fill="#ffffff" stroke={flower.highlight} strokeWidth={0.8} />
                <circle cx="-2.5" cy="-0.8" r="1.8" fill="#ffffff" stroke={flower.highlight} strokeWidth={0.8} />
                <circle cx="0" cy="0" r="1.4" fill={flower.left} stroke={flower.shadow} strokeWidth={0.8} />
              </g>
              <g transform="translate(7, -20)">
                <circle cx="0" cy="-2.5" r="1.8" fill="#ffffff" stroke={flower.highlight} strokeWidth={0.8} />
                <circle cx="2.5" cy="-0.8" r="1.8" fill="#ffffff" stroke={flower.highlight} strokeWidth={0.8} />
                <circle cx="1.6" cy="2" r="1.8" fill="#ffffff" stroke={flower.highlight} strokeWidth={0.8} />
                <circle cx="-1.6" cy="2" r="1.8" fill="#ffffff" stroke={flower.highlight} strokeWidth={0.8} />
                <circle cx="-2.5" cy="-0.8" r="1.8" fill="#ffffff" stroke={flower.highlight} strokeWidth={0.8} />
                <circle cx="0" cy="0" r="1.4" fill={flower.left} stroke={flower.shadow} strokeWidth={0.8} />
              </g>
            </g>
          )}

          {/* Frutillas colgantes cónicas (BBCH 70+) */}
          {bbch >= 70 && (
            <g data-botanical-feature="strawberry-berry">
              <g transform="translate(-9, -9) rotate(-12)">
                <path
                  d="M 0,-4 L -2.5,-5.5 M 0,-4 L 2.5,-5.5 M 0,-4 L -3,-2.5 M 0,-4 L 3,-2.5"
                  stroke={leafDark.left}
                  strokeWidth={0.8}
                  strokeLinecap="round"
                />
                <path
                  d="M -4,-3 C -4,1.5 -0.8,6.5 0,7.5 C 0.8,6.5 4,1.5 4,-3 C 2.5,-4 -2.5,-4 -4,-3 Z"
                  fill={fruit.left}
                  stroke={fruit.shadow}
                  strokeWidth={0.8}
                />
                <ellipse cx="-1.4" cy="-1.2" rx="1.1" ry="1.8" fill={fruit.highlight} opacity="0.75" />
                <circle cx="-1.5" cy="-0.8" r="0.5" fill={flower.highlight} />
                <circle cx="1.5" cy="-0.8" r="0.5" fill={flower.highlight} />
                <circle cx="0" cy="2" r="0.5" fill={flower.highlight} />
              </g>

              <g transform="translate(10, -8) rotate(16)">
                <path
                  d="M 0,-3.5 L -2,-5 M 0,-3.5 L 2,-5 M 0,-3.5 L -2.5,-2 M 0,-3.5 L 2.5,-2"
                  stroke={leafDark.left}
                  strokeWidth={0.8}
                  strokeLinecap="round"
                />
                <path
                  d="M -3.5,-2.5 C -3.5,1.5 -0.6,5.8 0,6.8 C 0.6,5.8 3.5,1.5 3.5,-2.5 C 2,-3.5 -2,-3.5 -3.5,-2.5 Z"
                  fill={fruit.left}
                  stroke={fruit.shadow}
                  strokeWidth={0.8}
                />
                <ellipse cx="-1.2" cy="-0.8" rx="0.9" ry="1.5" fill={fruit.highlight} opacity="0.7" />
                <circle cx="-1.2" cy="-0.4" r="0.4" fill={flower.highlight} />
                <circle cx="1.2" cy="-0.4" r="0.4" fill={flower.highlight} />
                <circle cx="0" cy="2" r="0.4" fill={flower.highlight} />
              </g>
            </g>
          )}
        </g>
      ) : (
        /* SUB-VARIANTE HORTALIZAS DE HOJA / LECHUGA / REPOLLO */
        <g data-botanical-feature="leafy-rosette">
          {/* Capa basal dorsal */}
          <g fill={leafDark.left} stroke={leafDark.shadow} strokeWidth={0.8}>
            <path d="M 0,-6 C -10,-3 -18,-7 -20,-12 C -16,-15 -10,-12 0,-7 Z" />
            <path d="M 0,-6 C 10,-3 18,-7 20,-12 C 16,-15 10,-12 0,-7 Z" />
            <path d="M -9,-3 C -7,2 7,2 9,-3 C 6,-6 -6,-6 -9,-3 Z" />
            <path d="M -12,-8 C -10,-18 10,-18 12,-8 C 5,-12 -5,-12 -12,-8 Z" />
          </g>

          {/* Nervaduras basales */}
          <line x1="0" y1="-6" x2="-15" y2="-11" stroke={leafLight.top} strokeWidth={0.8} strokeLinecap="round" />
          <line x1="0" y1="-6" x2="15" y2="-11" stroke={leafLight.top} strokeWidth={0.8} strokeLinecap="round" />

          {/* Capa intermedia */}
          <g fill={leaf.left} stroke={leaf.shadow} strokeWidth={0.8}>
            <path d="M 0,-6 C -7,-9 -13,-14 -13,-19 C -8,-20 -3,-15 0,-9 Z" />
            <path d="M 0,-6 C 7,-9 13,-14 13,-19 C 8,-20 3,-15 0,-9 Z" />
            <path d="M -7,-7 C -7,-14 7,-14 7,-7 C 3,-10 -3,-10 -7,-7 Z" />
          </g>

          {/* Cogollo central turgente (ápice en y = -21 px) */}
          <g fill={leafLight.left} stroke={leafLight.shadow} strokeWidth={0.8}>
            <ellipse cx="0" cy="-16" rx="6.5" ry="5" />
            <path d="M -4,-16 Q 0,-21 4,-16 Q 0,-13 -4,-16 Z" fill={leafLight.top} />
            <ellipse cx="0" cy="-17" rx="3" ry="2.2" fill={leafLight.highlight} />
          </g>
        </g>
      )}
    </g>
  )
}
