import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  AmbientLayer,
  resolveDaylightPeriod,
} from '../layers/AmbientLayer'
import { IsometricPlantSprite } from '../IsometricPlantSprite'

describe('Fase 5 — Animaciones Sutiles y Atmósfera', () => {
  describe('Luz Diurna Ambiental (AmbientLayer)', () => {
    it('resolveDaylightPeriod clasifica correctamente día, atardecer/amanecer y noche', () => {
      // Día al mediodía (12:00): sin tinte
      const day = resolveDaylightPeriod(12)
      expect(day.period).toBe('day')
      expect(day.opacity).toBe(0)

      // Amanecer (06:30): tinte cálido
      const dawn = resolveDaylightPeriod(6.5)
      expect(dawn.period).toBe('twilight')
      expect(dawn.color).toBe('#fde68a')
      expect(dawn.opacity).toBe(0.12)

      // Atardecer (20:00): tinte crepuscular
      const dusk = resolveDaylightPeriod(20)
      expect(dusk.period).toBe('twilight')
      expect(dusk.color).toBe('#fde68a')
      expect(dusk.opacity).toBe(0.12)

      // Noche (23:30): tinte azul nocturno
      const night = resolveDaylightPeriod(23.5)
      expect(night.period).toBe('night')
      expect(night.color).toBe('#1e3a8a')
      expect(night.opacity).toBe(0.18)
    })

    it('AmbientLayer no aplica tinte en cámaras de crecimiento ni en laboratorios (luz artificial constante)', () => {
      const viewBox = { minX: 0, minY: 0, width: 400, height: 300 }

      // Cámara de crecimiento en plena noche
      const { container: chamberContainer } = render(
        <svg>
          <AmbientLayer locationType="growth_chamber" viewBox={viewBox} customHour={23} />
        </svg>
      )
      expect(chamberContainer.querySelector('[data-layer="ambient-daylight"]')).not.toBeInTheDocument()

      // Laboratorio in-vitro en el crepúsculo
      const { container: labContainer } = render(
        <svg>
          <AmbientLayer locationType="lab" viewBox={viewBox} customHour={6.5} />
        </svg>
      )
      expect(labContainer.querySelector('[data-layer="ambient-daylight"]')).not.toBeInTheDocument()
    })

    it('AmbientLayer aplica luz nocturna en invernadero de noche y respeta el toggle enabled=false', () => {
      const viewBox = { minX: 0, minY: 0, width: 400, height: 300 }

      const { container: nightContainer } = render(
        <svg>
          <AmbientLayer locationType="greenhouse" viewBox={viewBox} customHour={23} enabled={true} />
        </svg>
      )
      const rect = nightContainer.querySelector('[data-layer="ambient-daylight"]')
      expect(rect).toBeInTheDocument()
      expect(rect).toHaveAttribute('fill', '#1e3a8a')
      expect(rect).toHaveStyle({ mixBlendMode: 'multiply' })

      // Al apagar el toggle de luz diurna no se renderiza
      const { container: disabledContainer } = render(
        <svg>
          <AmbientLayer locationType="greenhouse" viewBox={viewBox} customHour={23} enabled={false} />
        </svg>
      )
      expect(disabledContainer.querySelector('[data-layer="ambient-daylight"]')).not.toBeInTheDocument()
    })
  })

  describe('Balanceo Ambiental (.iso-sway) y Halo de Selección (.iso-selected-halo)', () => {
    it('aplica .iso-sway al follaje en plantas vivas con amplitud diferenciada por tipo de sala', () => {
      const { container: fieldContainer } = render(
        <svg>
          <IsometricPlantSprite
            individualId="ind-alive-field"
            bbch={45}
            status="active"
            label="MAI-01"
            locationType="field"
          />
        </svg>
      )
      const fieldFoliage = fieldContainer.querySelector('.iso-sway')
      expect(fieldFoliage).toBeInTheDocument()
      // En campo abierto la amplitud es ×1.5
      expect(fieldFoliage?.getAttribute('style')).toContain('--sway-amp: 1.5')

      const { container: labContainer } = render(
        <svg>
          <IsometricPlantSprite
            individualId="ind-alive-lab"
            bbch={45}
            status="active"
            label="ARA-01"
            locationType="lab"
          />
        </svg>
      )
      const labFoliage = labContainer.querySelector('.iso-sway')
      expect(labFoliage).toBeInTheDocument()
      // En laboratorio la amplitud es ×0.5
      expect(labFoliage?.getAttribute('style')).toContain('--sway-amp: 0.5')
    })

    it('NO aplica .iso-sway en plantas muertas o descartadas', () => {
      const { container: deadContainer } = render(
        <svg>
          <IsometricPlantSprite
            individualId="ind-dead"
            bbch={45}
            status="dead"
            label="TOM-DEAD"
            locationType="greenhouse"
          />
        </svg>
      )
      expect(deadContainer.querySelector('.iso-sway')).not.toBeInTheDocument()
    })

    it('aplica .iso-selected-halo con marcha de hormigas en el halo de selección', () => {
      const { container } = render(
        <svg>
          <IsometricPlantSprite
            individualId="ind-selected"
            bbch={45}
            status="active"
            label="TOM-SEL"
            isSelected={true}
          />
        </svg>
      )
      const halo = container.querySelector('.iso-selected-halo')
      expect(halo).toBeInTheDocument()
      expect(halo).toHaveAttribute('stroke-dasharray', '4 2')
    })
  })
})
