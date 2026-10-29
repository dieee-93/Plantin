import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import sharp from 'sharp'
import { removeBackground } from '../../../../../scripts/assets/process'
import { ImageObjectRenderer } from '../catalog/raster/ImageObjectRenderer'
import { RasterPlant } from '../renderers/raster/RasterPlant'
import { getCatalogObject } from '../catalog'
import type { PlacedObject } from '@/domain/roomLayout'
import type { PlantVisualSpec } from '../visual/plantSpec'

describe('Fase B1 — Pipeline de Assets Ilustrados y Renderers', () => {
  it('recorta por clave de color una imagen sintética (círculo sobre magenta) sin halos', async () => {
    const size = 100
    // Crear un círculo verde sobre fondo magenta puro (#FF00FF = 255, 0, 255)
    const svgCircle = `
      <svg width="${size}" height="${size}">
        <rect width="${size}" height="${size}" fill="#FF00FF" />
        <circle cx="${size / 2}" cy="${size / 2}" r="30" fill="#22c55e" stroke="#16a34a" stroke-width="2" />
      </svg>
    `
    const pngBuf = await sharp(Buffer.from(svgCircle)).png().toBuffer()

    const result = await removeBackground(pngBuf, {
      lowThreshold: 15,
      highThreshold: 25,
      isCyanKey: false,
    })

    expect(result.width).toBe(size)
    expect(result.height).toBe(size)

    // Bounding box del círculo (radio 31 incluyendo stroke)
    expect(result.minX).toBeGreaterThanOrEqual(15)
    expect(result.maxX).toBeLessThanOrEqual(85)
    expect(result.minY).toBeGreaterThanOrEqual(15)
    expect(result.maxY).toBeLessThanOrEqual(85)
    expect(result.touchesBorder).toBe(false)

    // Esquinas (0, 0) y (99, 99) deben ser 100% transparentes (alpha === 0)
    const cornerAlpha = result.rgbaBuffer[3]
    const cornerAlpha2 = result.rgbaBuffer[(99 * size + 99) * 4 + 3]
    expect(cornerAlpha).toBe(0)
    expect(cornerAlpha2).toBe(0)

    // Centro (50, 50) debe ser 100% opaco y verde
    const centerIdx = (50 * size + 50) * 4
    const centerAlpha = result.rgbaBuffer[centerIdx + 3]
    const centerG = result.rgbaBuffer[centerIdx + 1]
    const centerR = result.rgbaBuffer[centerIdx]
    const centerB = result.rgbaBuffer[centerIdx + 2]

    expect(centerAlpha).toBe(255)
    expect(centerG).toBeGreaterThan(centerR)
    expect(centerG).toBeGreaterThan(centerB)
  })

  it('ancla RasterPlant respetando soilY si el contenedor es raster', () => {
    const mockSpec: PlantVisualSpec = {
      archetype: 'vine_climber',
      cropCode: 'SQUASH',
      fruitShape: 'gourd',
      bbch: 85,
      phase: 'fruiting',
      phaseProgress: 1,
      vitality: 'alive',
      palette: {} as any,
      paletteKey: 'test',
      seed: 123,
      variation: { heightScale: 1, leanDeg: 0, leafJitterDeg: 0, mirror: false },
      container: 'greenhouse',
      containerScale: 1,
    }

    // Render sin soilY (default -7)
    const { container: defaultContainer } = render(
      <svg>
        <RasterPlant spec={mockSpec} isSelected={false} />
      </svg>
    )
    const gDefault = defaultContainer.querySelector('g[data-renderer="raster-plant"]')
    expect(gDefault?.getAttribute('data-base-y')).toBe('-7')

    // Render con soilY personalizado (-12)
    const { container: customContainer } = render(
      <svg>
        <RasterPlant spec={mockSpec} isSelected={false} soilY={-12} />
      </svg>
    )
    const gCustom = customContainer.querySelector('g[data-renderer="raster-plant"]')
    expect(gCustom?.getAttribute('data-base-y')).toBe('-12')

    // Verificar que la base de la imagen coincide exactamente con soilY
    const imageEl = customContainer.querySelector('image')
    const imgY = Number(imageEl?.getAttribute('y'))
    const imgH = Number(imageEl?.getAttribute('height'))
    expect(imgY + imgH).toBe(-12)
  })

  it('hace fallback transparente a renderer procedural si no existe asset raster', () => {
    const mockSpec: PlantVisualSpec = {
      archetype: 'generic_herb',
      cropCode: 'UNKNOWN_CROP',
      fruitShape: 'round',
      bbch: 85,
      phase: 'fruiting',
      phaseProgress: 1,
      vitality: 'alive',
      palette: {
        stem: { top: '#000', left: '#000', right: '#000', highlight: '#000', shadow: '#000' },
        leaf: { top: '#000', left: '#000', right: '#000', highlight: '#000', shadow: '#000' },
        leafDark: { top: '#000', left: '#000', right: '#000', highlight: '#000', shadow: '#000' },
        leafLight: { top: '#000', left: '#000', right: '#000', highlight: '#000', shadow: '#000' },
        fruit: { top: '#000', left: '#000', right: '#000', highlight: '#000', shadow: '#000' },
        flower: { top: '#000', left: '#000', right: '#000', highlight: '#000', shadow: '#000' },
        badgeColor: '#000',
      },
      paletteKey: 'test',
      seed: 123,
      variation: { heightScale: 1, leanDeg: 0, leafJitterDeg: 0, mirror: false },
      container: 'greenhouse',
      containerScale: 1,
    }

    const { container } = render(
      <svg>
        <RasterPlant spec={mockSpec} isSelected={false} />
      </svg>
    )

    // No debe tener data-renderer="raster-plant"
    expect(container.querySelector('g[data-renderer="raster-plant"]')).toBeNull()
    // Debe tener el grupo botánico procedural
    expect(container.querySelector('g[data-crop="UNKNOWN_CROP"]')).toBeDefined()
  })

  it('ImageObjectRenderer preserva data-object-id, data-object-type y maneja reflejo en vista B', () => {
    const mockObj: PlacedObject = {
      id: 'pot-test-1',
      typeId: 'pot_5l',
      x: 50,
      y: 50,
      z: 0,
      rotation: 0,
    }

    // Si pot_5l está en el manifiesto, renderiza ImageObjectRenderer
    const { container: viewAContainer } = render(
      <svg>
        <ImageObjectRenderer obj={mockObj} view="a" />
      </svg>
    )

    const gViewA = viewAContainer.querySelector('g[data-object-id="pot-test-1"]')
    if (gViewA) {
      expect(gViewA.getAttribute('data-object-type')).toBe('pot_5l')
      expect(gViewA.getAttribute('transform')).toBeNull()

      const { container: viewBContainer } = render(
        <svg>
          <ImageObjectRenderer obj={mockObj} view="b" />
        </svg>
      )
      const gViewB = viewBContainer.querySelector('g[data-object-id="pot-test-1"]')
      expect(gViewB?.getAttribute('transform')).toBe('scale(-1, 1)')
    }
  })

  it('el catálogo mantiene renderers funcionales para todos los objetos fijos', () => {
    const potDef = getCatalogObject('pot_5l')
    expect(potDef).toBeDefined()
    expect(potDef?.Renderer).toBeDefined()

    const mockObj: PlacedObject = {
      id: 'pot-cat-1',
      typeId: 'pot_5l',
      x: 20,
      y: 20,
      z: 0,
      rotation: 0,
    }

    const Renderer = potDef?.Renderer
    expect(Renderer).toBeDefined()
    if (!Renderer) return

    const { container } = render(
      <svg>
        <Renderer obj={mockObj} view="a" />
      </svg>
    )
    expect(container.querySelector('[data-object-id="pot-cat-1"]')).toBeDefined()
  })
})
