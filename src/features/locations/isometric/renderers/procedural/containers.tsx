import React from 'react'
import type { LocationType } from '@/domain/location'

export interface PlantContainerProps {
  locationType: LocationType
  isSelected: boolean
}

/**
 * Renderiza el contenedor contextual botánico según el tipo de instalación:
 * - field: Alcorque de tierra labrada enriquecida (escala óptima para baldosa de 104 px).
 * - growth_chamber: Contenedor técnico cuadrado para hidroponía/aeroponía.
 * - lab: Frasco in-vitro traslúcido para micropropagación.
 * - greenhouse / otros: Maceta de terracota 3D volumétrica.
 */
export const PlantContainer: React.FC<PlantContainerProps> = ({
  locationType,
  isSelected,
}) => {
  if (locationType === 'field') {
    return (
      <g data-container="field">
        {/* Alcorque de tierra labrada: ocupa ~60 px de ancho (58% de la baldosa de 104 px) */}
        <ellipse cx="0" cy="-2" rx="28" ry="14" fill="#381a06" />
        <ellipse
          cx="0"
          cy="-4"
          rx="22"
          ry="11"
          fill="#59290a"
          stroke={isSelected ? '#4ade80' : '#78350f'}
          strokeWidth={isSelected ? 1.4 : 0.8}
        />
        <ellipse cx="0" cy="-5.5" rx="14" ry="6.5" fill="#240e02" />
      </g>
    )
  }

  if (locationType === 'growth_chamber') {
    return (
      <g data-container="growth_chamber">
        {/* Contenedor técnico cuadrado negro */}
        <polygon points="-16,-8 0,0 0,12 -14,4" fill={isSelected ? '#1b4332' : '#1e293b'} />
        <polygon points="16,-8 0,0 0,12 14,4" fill={isSelected ? '#2d6a4f' : '#0f172a'} />
        <polygon
          points="0,-16 18,-7 0,2 -18,-7"
          fill={isSelected ? '#40916c' : '#334155'}
          stroke={isSelected ? '#4ade80' : '#475569'}
          strokeWidth={0.8}
        />
        <polygon points="0,-14 14,-7 0,0 -14,-7" fill="#1e293b" />
      </g>
    )
  }

  if (locationType === 'lab') {
    return (
      <g data-container="lab">
        {/* Frasco in-vitro de cultivo de tejidos traslúcido */}
        <polygon
          points="-15,-8 0,0 0,11 -13,3"
          fill="rgba(186, 230, 253, 0.75)"
          stroke="#0284c7"
          strokeWidth={0.8}
        />
        <polygon
          points="15,-8 0,0 0,11 13,3"
          fill="rgba(125, 211, 252, 0.85)"
          stroke="#0284c7"
          strokeWidth={0.8}
        />
        <polygon
          points="0,-15 16,-7 0,1 -16,-7"
          fill="rgba(224, 242, 254, 0.9)"
          stroke={isSelected ? '#15803d' : '#0369a1'}
          strokeWidth={0.8}
        />
        <polygon points="0,-13 12,-7 0,-1 -12,-7" fill="#67e8f9" />
      </g>
    )
  }

  // Invernadero / Sala / Bancada: Maceta Terracota 3D
  return (
    <g data-container={locationType}>
      <polygon points="-16,-8 0,0 0,12 -13,4" fill={isSelected ? '#1b4332' : '#c2410c'} />
      <polygon points="16,-8 0,0 0,12 13,4" fill={isSelected ? '#2d6a4f' : '#9a3412'} />
      <polygon
        points="0,-16 18,-7 0,2 -18,-7"
        fill={isSelected ? '#40916c' : '#ea580c'}
        stroke={isSelected ? '#1b4332' : '#7c2d12'}
        strokeWidth={0.8}
      />
      <polygon points="0,-14 14,-7 0,0 -14,-7" fill="#3e2723" />
    </g>
  )
}
