import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import type { Taxon } from '@/domain/taxon'
import { getPlantRenderer, PROCEDURAL_RENDERERS } from '../renderers/registry'
import { RasterPlant } from '../renderers/raster/RasterPlant'
import { RASTER_SPRITES, getRasterSprite } from '../renderers/raster/manifest'
import { buildPlantVisualSpec, type BbchPhase } from '../visual/plantSpec'
import { IsometricPlantSprite } from '../IsometricPlantSprite'

describe('Fase 6 — Piloto de Sprite Raster (Tomate)', () => {
  const tomatoTaxon: Taxon = {
    id: 'tax-tom-1',
    genus: 'Solanum',
    species: 'lycopersicum',
    family: 'Solanaceae',
    cropCode: 'TOM',
    commonName: 'Tomate',
  }

  it('el manifiesto RASTER_SPRITES define las 5 fases fenológicas para TOM con rutas de assets válidas', () => {
    expect(RASTER_SPRITES.TOM).toBeDefined()
    const phases: BbchPhase[] = ['germination', 'leaf', 'structure', 'flowering', 'fruiting']

    for (const phase of phases) {
      const url = getRasterSprite('TOM', phase, 'alive')
      expect(url).toBeDefined()
      expect(typeof url).toBe('string')
      expect(url).toContain(phase)
      expect(url).toContain('.webp')
    }
  })

  it('todos los archivos referenciados en RASTER_SPRITES tienen URLs y nombres válidos', () => {
    for (const [cropCode, phases] of Object.entries(RASTER_SPRITES)) {
      if (!phases) continue
      for (const [phase, url] of Object.entries(phases)) {
        expect(url).toBeDefined()
        expect(url).toContain(`${cropCode.toLowerCase()}-${phase}.webp`)
      }
    }
  })

  it('resuelve RasterPlant para Tomate en cada una de las 5 fases', () => {
    const phaseBbchMap: Record<BbchPhase, number> = {
      germination: 5,
      leaf: 15,
      structure: 35,
      flowering: 60,
      fruiting: 85,
    }

    for (const [phase, bbch] of Object.entries(phaseBbchMap)) {
      const spec = buildPlantVisualSpec({
        individualId: `plant-tom-${phase}`,
        taxon: tomatoTaxon,
        bbch,
        status: 'active',
        locationType: 'greenhouse',
      })

      expect(spec.cropCode).toBe('TOM')
      expect(spec.phase).toBe(phase)

      const Renderer = getPlantRenderer(spec)
      expect(Renderer).toBe(RasterPlant)
    }
  })

  it('fallback transparente al renderer procedural cuando no hay sprite raster para el cultivo', () => {
    // Arroz no tiene raster en el manifest
    const riceTaxon: Taxon = {
      id: 'taxon-rice',
      family: 'Poaceae',
      genus: 'Oryza',
      species: 'sativa',
      cropCode: 'ORY',
      commonName: 'Arroz',
    }
    const spec = buildPlantVisualSpec({
      individualId: 'plant-rice-1',
      taxon: riceTaxon,
      bbch: 60,
      status: 'active',
      locationType: 'field',
    })

    const Renderer = getPlantRenderer(spec)
    expect(Renderer).toBe(PROCEDURAL_RENDERERS.cereal_grass)
  })

  it('fallback transparente al pasar solo BotanicalArchetypeId', () => {
    const Renderer = getPlantRenderer('solanaceae_tall')
    expect(Renderer).toBe(PROCEDURAL_RENDERERS.solanaceae_tall)
  })

  it('RasterPlant renderiza la etiqueta <image> alineada a la base (0, -7) con preserveAspectRatio="xMidYMax meet"', () => {
    const spec = buildPlantVisualSpec({
      individualId: 'plant-tom-fruiting',
      taxon: tomatoTaxon,
      bbch: 85,
      status: 'active',
      locationType: 'greenhouse',
    })

    const { container } = render(
      <svg>
        <RasterPlant spec={spec} isSelected={false} />
      </svg>
    )

    const group = container.querySelector('g[data-renderer="raster-plant"]')
    expect(group).toBeTruthy()
    expect(group?.getAttribute('data-crop')).toBe('TOM')
    expect(group?.getAttribute('data-phase')).toBe('fruiting')

    const image = container.querySelector('image')
    expect(image).toBeTruthy()
    expect(image?.getAttribute('preserveAspectRatio')).toBe('xMidYMax meet')
    expect(Number(image?.getAttribute('width'))).toBe(80)
    expect(Number(image?.getAttribute('height'))).toBe(55)
    // Alineado a la base: x = -40, y = -62 (bottom = -7, height = 55)
    expect(Number(image?.getAttribute('x'))).toBe(-40)
    expect(Number(image?.getAttribute('y'))).toBe(-62)
  })

  it('IsometricPlantSprite integra el sprite raster dentro del ciclo completo de animaciones y contenedor', () => {
    const { container } = render(
      <svg>
        <IsometricPlantSprite
          individualId="tom-001"
          taxon={tomatoTaxon}
          bbch={85}
          status="active"
          label="TOM #01"
          locationType="greenhouse"
          isSelected={true}
        />
      </svg>
    )

    // Contenedor procedural presente
    expect(container.querySelector('[data-container="greenhouse"]')).toBeTruthy()

    // Sprite raster <image> presente
    const image = container.querySelector('image')
    expect(image).toBeTruthy()

    // Halo de selección presente
    expect(container.querySelector('.iso-selected-halo')).toBeTruthy()

    // Sombra de contacto suave presente
    const shadow = container.querySelector('ellipse[fill="url(#plant-contact-shadow)"]')
    expect(shadow).toBeTruthy()

    // Clase de balanceo ambiental presente
    const foliageGroup = container.querySelector('.iso-sway')
    expect(foliageGroup).toBeTruthy()
  })
})
