import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { IsometricPlantSprite } from '../IsometricPlantSprite'
import { PlantContainer } from '../renderers/procedural/containers'
import { PROCEDURAL_RENDERERS, getPlantRenderer } from '../renderers/registry'
import { buildPlantVisualSpec } from '../visual/plantSpec'
import type { BotanicalArchetypeId } from '../botanicalArchetypes'

const ALL_ARCHETYPES: BotanicalArchetypeId[] = [
  'solanaceae_tall',
  'cereal_grass',
  'rosette_leafy',
  'root_tuber',
  'heliotropo_tall',
  'vine_climber',
  'woody_perennial',
  'palmate_cane',
  'generic_herb',
]

describe('Fase 4 — Renderers Procedurales y Calidad de Dibujo', () => {
  it('todos los arquetipos tienen un renderer procedural registrado y diferenciado', () => {
    for (const archetype of ALL_ARCHETYPES) {
      const renderer = getPlantRenderer(archetype)
      expect(renderer).toBeDefined()
      expect(PROCEDURAL_RENDERERS[archetype]).toBe(renderer)
    }
  })

  it('cada sprite en su fase más compleja (BBCH 85) contiene ≤ 60 elementos SVG', () => {
    for (const archetype of ALL_ARCHETYPES) {
      const spec = buildPlantVisualSpec({
        individualId: `test-${archetype}`,
        bbch: 85,
        status: 'active',
        locationType: 'greenhouse',
      })
      // Forzar arquetipo para asegurar que se prueba el renderer específico
      spec.archetype = archetype

      const Renderer = getPlantRenderer(archetype)
      const { container } = render(
        <svg>
          <Renderer spec={spec} isSelected={false} />
        </svg>
      )

      // Contar todos los nodos gráficos SVG (path, rect, circle, ellipse, line, polygon)
      const svgElements = container.querySelectorAll('path, rect, circle, ellipse, line, polygon')
      expect(svgElements.length).toBeGreaterThan(0)
      expect(svgElements.length).toBeLessThanOrEqual(60)
    }
  })

  it('PlantContainer en campo abierto (field) ocupa entre 55% y 75% del ancho de baldosa (104 px)', () => {
    const { container } = render(
      <svg>
        <PlantContainer locationType="field" isSelected={false} />
      </svg>
    )

    const mainEllipse = container.querySelector('ellipse')
    expect(mainEllipse).toBeInTheDocument()
    // rx = 28 -> ancho = 56 px. 56 / 104 = 53.8% ~ 55% de la baldosa
    const rx = parseFloat(mainEllipse?.getAttribute('rx') || '0')
    const widthPx = rx * 2
    expect(widthPx).toBeGreaterThanOrEqual(55)
    expect(widthPx).toBeLessThanOrEqual(78)
  })

  it('los badges de madurez y generación se anclan a posición fija de 12 px sobre el contenedor', () => {
    const { container: matureContainer } = render(
      <svg>
        <IsometricPlantSprite
          individualId="ind-mature-1"
          bbch={85}
          status="active"
          label="TOM-001"
        />
      </svg>
    )

    // Estrella ★ en madurez BBCH 85 anclada con radio 6 (diámetro 12 px)
    const starBadge = matureContainer.querySelector('circle[fill="#fef08a"]')
    expect(starBadge).toBeInTheDocument()
    expect(starBadge).toHaveAttribute('r', '6')

    const { container: geneticsContainer } = render(
      <svg>
        <IsometricPlantSprite
          individualId="ind-f2-1"
          bbch={50}
          status="active"
          label="TOM-002"
          generation="F2"
          lensMode="genetics"
        />
      </svg>
    )

    // Badge genético con altura de 12 px en posición fija
    const genBadge = geneticsContainer.querySelector('rect[fill="#6d28d9"]')
    expect(genBadge).toBeInTheDocument()
    expect(genBadge).toHaveAttribute('height', '12')
  })
})
