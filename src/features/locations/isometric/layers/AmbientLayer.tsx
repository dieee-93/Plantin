import React from 'react'
import type { FacilityLocation } from '@/domain/location'

export interface AmbientLayerProps {
  locationType: FacilityLocation['type']
  viewBox: { minX: number; minY: number; width: number; height: number }
  enabled?: boolean
  customHour?: number // Permite simular u overridear la hora (ej. en tests)
}

export type DaylightPeriod = 'day' | 'twilight' | 'night'

export function resolveDaylightPeriod(hour: number): { period: DaylightPeriod; color: string; opacity: number } {
  // Amanecer: 6:00 a 7:00 / Atardecer: 19:00 a 20:30
  if ((hour >= 6 && hour < 7) || (hour >= 19 && hour < 20.5)) {
    return { period: 'twilight', color: '#fde68a', opacity: 0.12 }
  }
  // Noche: 20:30 a 6:00
  if (hour >= 20.5 || hour < 6) {
    return { period: 'night', color: '#1e3a8a', opacity: 0.18 }
  }
  // Día: 7:00 a 19:00 (sin tinte)
  return { period: 'day', color: 'transparent', opacity: 0 }
}

/**
 * Capa de luz diurna ambiental que tiñe sutilmente la sala según la hora local
 * usando mix-blend-mode: multiply.
 * En cámaras de crecimiento y laboratorios no aplica tinte (luz artificial constante).
 */
export const AmbientLayer: React.FC<AmbientLayerProps> = React.memo(({
  locationType,
  viewBox,
  enabled = true,
  customHour,
}) => {
  // Cámaras técnicas y laboratorios poseen luz artificial constante sin fotoperíodo solar diurno
  if (locationType === 'growth_chamber' || locationType === 'lab' || !enabled) {
    return null
  }

  const hour = customHour !== undefined ? customHour : new Date().getHours() + new Date().getMinutes() / 60
  const { period, color, opacity } = resolveDaylightPeriod(hour)

  if (period === 'day' || opacity <= 0) {
    return null
  }

  return (
    <rect
      data-layer="ambient-daylight"
      data-period={period}
      x={viewBox.minX}
      y={viewBox.minY}
      width={viewBox.width}
      height={viewBox.height}
      fill={color}
      opacity={opacity}
      style={{
        mixBlendMode: 'multiply',
        pointerEvents: 'none',
        transition: 'opacity 0.5s ease',
      }}
    />
  )
})

AmbientLayer.displayName = 'AmbientLayer'
