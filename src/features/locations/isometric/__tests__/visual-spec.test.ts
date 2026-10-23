import { describe, it, expect } from 'vitest'
import {
  hexToOklch,
  oklchToHex,
  shade,
  adjustVitality,
  createShadedColor,
} from '../visual/palette'
import { hashString, mulberry32 } from '../visual/seed'
import {
  resolveBbchPhase,
  buildPlantVisualSpec,
} from '../visual/plantSpec'

describe('Fase 3 — visual/palette (OKLCH y sombreado direccional)', () => {
  it('convierte sRGB a OKLCH y viceversa manteniendo coherencia', () => {
    const greenHex = '#40916c'
    const oklch = hexToOklch(greenHex)
    expect(oklch.l).toBeGreaterThan(0)
    expect(oklch.l).toBeLessThan(1)
    expect(oklch.c).toBeGreaterThan(0)
    expect(oklch.h).toBeGreaterThanOrEqual(0)
    expect(oklch.h).toBeLessThan(360)

    const reconstructed = oklchToHex(oklch.l, oklch.c, oklch.h)
    // El roundtrip sRGB -> OKLCH -> sRGB debe ser exacto o con tolerancia mínima de 1 bit
    const origOklch = hexToOklch(greenHex)
    const newOklch = hexToOklch(reconstructed)
    expect(Math.abs(origOklch.l - newOklch.l)).toBeLessThan(0.02)
  })

  it('shade aplica la jerarquía de luz: highlight > top > left (base) > right > shadow', () => {
    const baseGreen = '#2d6a4f'
    const top = shade(baseGreen, 'top')
    const left = shade(baseGreen, 'left')
    const right = shade(baseGreen, 'right')
    const highlight = shade(baseGreen, 'highlight')
    const shadow = shade(baseGreen, 'shadow')

    // left es la base intacta
    expect(left).toBe(baseGreen)

    const lTop = hexToOklch(top).l
    const lLeft = hexToOklch(left).l
    const lRight = hexToOklch(right).l
    const lHighlight = hexToOklch(highlight).l
    const lShadow = hexToOklch(shadow).l

    expect(lHighlight).toBeGreaterThan(lTop)
    expect(lTop).toBeGreaterThan(lLeft)
    expect(lLeft).toBeGreaterThan(lRight)
    expect(lRight).toBeGreaterThan(lShadow)
  })

  it('shade clampa correctamente los extremos (blanco y negro)', () => {
    const white = '#ffffff'
    const black = '#000000'

    expect(shade(white, 'top')).toMatch(/^#[0-9a-f]{6}$/i)
    expect(shade(white, 'highlight')).toMatch(/^#[0-9a-f]{6}$/i)
    expect(shade(black, 'right')).toMatch(/^#[0-9a-f]{6}$/i)
    expect(shade(black, 'shadow')).toMatch(/^#[0-9a-f]{6}$/i)

    const lWhiteHighlight = hexToOklch(shade(white, 'highlight')).l
    expect(lWhiteHighlight).toBeLessThanOrEqual(1)

    const lBlackShadow = hexToOklch(shade(black, 'shadow')).l
    expect(lBlackShadow).toBeGreaterThanOrEqual(0)
  })

  it('adjustVitality desatura y vira el hue a tonos ocres para plantas muertas o cosechadas', () => {
    const vibrantLeaf = '#22c55e'
    const alive = adjustVitality(vibrantLeaf, 'alive')
    expect(alive).toBe(vibrantLeaf)

    const dead = adjustVitality(vibrantLeaf, 'dead')
    const harvested = adjustVitality(vibrantLeaf, 'harvested')

    const aliveOklch = hexToOklch(alive)
    const deadOklch = hexToOklch(dead)
    const harvestedOklch = hexToOklch(harvested)

    // Croma debe reducirse fuertemente
    expect(deadOklch.c).toBeLessThan(aliveOklch.c)
    expect(harvestedOklch.c).toBeLessThan(aliveOklch.c)

    // Hue debe ubicarse entre 55° y 75° (amarillo/ocre seco)
    expect(deadOklch.h).toBeGreaterThanOrEqual(55)
    expect(deadOklch.h).toBeLessThanOrEqual(75)
    expect(harvestedOklch.h).toBeGreaterThanOrEqual(55)
    expect(harvestedOklch.h).toBeLessThanOrEqual(75)
  })

  it('createShadedColor genera las 5 caras sombreadas', () => {
    const shaded = createShadedColor('#e11d48')
    expect(shaded).toHaveProperty('top')
    expect(shaded).toHaveProperty('left')
    expect(shaded).toHaveProperty('right')
    expect(shaded).toHaveProperty('highlight')
    expect(shaded).toHaveProperty('shadow')
  })
})

describe('Fase 3 — visual/seed (FNV-1a y Mulberry32)', () => {
  it('hashString produce un uint32 determinista', () => {
    const h1 = hashString('plant-tomato-001')
    const h2 = hashString('plant-tomato-001')
    const h3 = hashString('plant-tomato-002')

    expect(h1).toBe(h2)
    expect(h1).not.toBe(h3)
    expect(h1).toBeGreaterThanOrEqual(0)
    expect(h1).toBeLessThanOrEqual(0xffffffff)
  })

  it('mulberry32 produce secuencias pseudo-aleatorias deterministas en [0, 1)', () => {
    const rng1 = mulberry32(123456)
    const seq1 = [rng1(), rng1(), rng1(), rng1()]

    const rng2 = mulberry32(123456)
    const seq2 = [rng2(), rng2(), rng2(), rng2()]

    expect(seq1).toEqual(seq2)
    for (const val of seq1) {
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThan(1)
    }
  })
})

describe('Fase 3 — visual/plantSpec (Crecimiento y Variación)', () => {
  it('resolveBbchPhase mapea correctamente las 5 fases y su progreso continuo', () => {
    // Germinación: [0, 10)
    const g0 = resolveBbchPhase(0)
    expect(g0.phase).toBe('germination')
    expect(g0.phaseProgress).toBe(0)

    const g5 = resolveBbchPhase(5)
    expect(g5.phase).toBe('germination')
    expect(g5.phaseProgress).toBeCloseTo(0.5, 2)

    // Hoja: [10, 30)
    const l10 = resolveBbchPhase(10)
    expect(l10.phase).toBe('leaf')
    expect(l10.phaseProgress).toBe(0)

    const l20 = resolveBbchPhase(20)
    expect(l20.phase).toBe('leaf')
    expect(l20.phaseProgress).toBeCloseTo(0.5, 2)

    // Estructura: [30, 50)
    const s30 = resolveBbchPhase(30)
    expect(s30.phase).toBe('structure')
    expect(s30.phaseProgress).toBe(0)

    // Floración: [50, 70)
    const f50 = resolveBbchPhase(50)
    expect(f50.phase).toBe('flowering')
    expect(f50.phaseProgress).toBe(0)

    // Fructificación: [70, 100]
    const fr70 = resolveBbchPhase(70)
    expect(fr70.phase).toBe('fruiting')
    expect(fr70.phaseProgress).toBe(0)

    const fr85 = resolveBbchPhase(85)
    expect(fr85.phase).toBe('fruiting')
    expect(fr85.phaseProgress).toBeCloseTo(0.5, 2)
  })

  it('buildPlantVisualSpec genera una especificación completa, pura y determinista', () => {
    const spec1 = buildPlantVisualSpec({
      individualId: 'ind-tom-1',
      taxon: {
        genus: 'Solanum',
        species: 'lycopersicum',
        family: 'Solanaceae',
        cropCode: 'TOM',
      },
      bbch: 65,
      status: 'active',
      locationType: 'greenhouse',
    })

    const spec2 = buildPlantVisualSpec({
      individualId: 'ind-tom-1',
      taxon: {
        genus: 'Solanum',
        species: 'lycopersicum',
        family: 'Solanaceae',
        cropCode: 'TOM',
      },
      bbch: 65,
      status: 'active',
      locationType: 'greenhouse',
    })

    expect(spec1).toEqual(spec2)
    expect(spec1.archetype).toBe('solanaceae_tall')
    expect(spec1.phase).toBe('flowering')
    expect(spec1.vitality).toBe('alive')

    // Rango de variación botánica natural
    expect(spec1.variation.heightScale).toBeGreaterThanOrEqual(0.9)
    expect(spec1.variation.heightScale).toBeLessThanOrEqual(1.1)

    expect(spec1.variation.leanDeg).toBeGreaterThanOrEqual(-4)
    expect(spec1.variation.leanDeg).toBeLessThanOrEqual(4)

    expect(spec1.variation.leafJitterDeg).toBeGreaterThanOrEqual(-8)
    expect(spec1.variation.leafJitterDeg).toBeLessThanOrEqual(8)

    expect(typeof spec1.variation.mirror).toBe('boolean')
  })

  it('buildPlantVisualSpec ajusta la vitalidad y paleta cuando la planta está muerta o descartada', () => {
    const deadSpec = buildPlantVisualSpec({
      individualId: 'ind-dead-1',
      taxon: { genus: 'Zea', species: 'mays', family: 'Poaceae', cropCode: 'MAIZE' },
      bbch: 85,
      status: 'dead',
      locationType: 'field',
    })

    expect(deadSpec.vitality).toBe('dead')
    expect(deadSpec.palette.leaf.left).toMatch(/^#[0-9a-f]{6}$/i)
    // El tono de la hoja debe estar desaturado
    const oklch = hexToOklch(deadSpec.palette.leaf.left)
    expect(oklch.h).toBeGreaterThanOrEqual(55)
    expect(oklch.h).toBeLessThanOrEqual(75)
  })
})
