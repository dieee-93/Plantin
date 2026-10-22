import { describe, it, expect } from 'vitest'
import { assessCropSuitability } from '../suitabilityEngine'
import {
  BUENOS_AIRES, MENDOZA, MADRID, BOGOTA, TROPICAL_CONSTANT,
  TOMATO, WHEAT, QUINOA, BANANA, COFFEE,
} from './fixtures'
import type { AgronomicData } from '@/domain/taxon'

describe('assessCropSuitability — transparencia de incertidumbre', () => {
  it('sin datos del taxón informa "Datos insuficientes" y no inventa predicciones', () => {
    const a = assessCropSuitability(undefined, BUENOS_AIRES)

    expect(a.suitability).toBe('insufficient_data')
    expect(a.confidence).toBe('insufficient_data')
    expect(a.score).toBe(0)
    expect(a.sowingWindow).toBeUndefined()
    expect(a.limitingFactors).toContain('Datos insuficientes para determinar aptitud')
    expect(a.thermalFit.status).toBe('unknown')
    expect(a.waterFit.status).toBe('unknown')
  })

  it('datos sin ningún límite térmico inferior (solo pH/luz) también son insuficientes', () => {
    const a = assessCropSuitability({ light: 8, phMinimum: 5.5, phMaximum: 7 }, MADRID)
    expect(a.suitability).toBe('insufficient_data')
    expect(a.sowingWindow).toBeUndefined()
  })

  it('aun sin datos del taxón reporta el fotoperíodo local del sitio', () => {
    const a = assessCropSuitability(undefined, BUENOS_AIRES)
    expect(a.daylight.byMonth).toHaveLength(12)
    expect(Math.abs(a.daylight.maxHours - 14.2)).toBeLessThan(0.4) // diciembre
    expect(Math.abs(a.daylight.minHours - 10.1)).toBeLessThan(0.4) // junio
  })
})

describe('assessCropSuitability — aptitud térmica y ventana de siembra', () => {
  it('clima constante dentro del óptimo: los 12 meses son óptimos a campo abierto', () => {
    const a = assessCropSuitability(TOMATO, TROPICAL_CONSTANT)

    expect(a.suitability).toBe('optimal')
    expect(a.sowingWindow!.recommendedEnvironment).toBe('outdoor')
    expect(a.sowingWindow!.optimalMonths).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(a.sowingWindow!.cycleMonths).toBe(4) // ciclo medio (70+150)/2 = 110 d → 4 meses
    expect(a.score).toBe(100)
    expect(a.confidence).toBe('high')
    expect(a.thermalFit.status).toBe('optimal')
    expect(a.frostRisk).toEqual({ hasRisk: false, criticalMonths: [] })
  })

  it('tomate en Madrid (hemisferio norte): siembra de abril a julio; heladas ene–mar y nov–dic', () => {
    const a = assessCropSuitability(TOMATO, MADRID)

    expect(a.sowingWindow!.recommendedEnvironment).toBe('outdoor')
    expect(a.sowingWindow!.optimalMonths).toEqual([4, 5, 6, 7])
    expect(a.sowingWindow!.marginalMonths).toEqual([])
    expect(a.frostRisk.hasRisk).toBe(true)
    expect(a.frostRisk.criticalMonths).toEqual([1, 2, 3, 11, 12])
    expect(a.limitingFactors.some(f => /heladas/i.test(f))).toBe(true)
    expect(a.score).toBeGreaterThanOrEqual(70)
  })

  it('hemisferio austral: el tomate se siembra en primavera austral (oct–dic), no en mayo–junio', () => {
    const south = assessCropSuitability(TOMATO, BUENOS_AIRES).sowingWindow!
    const north = assessCropSuitability(TOMATO, MADRID).sowingWindow!

    expect(south.optimalMonths).toEqual(expect.arrayContaining([10, 11, 12]))
    expect(south.optimalMonths).not.toContain(5)
    expect(south.optimalMonths).not.toContain(6)
    expect(north.optimalMonths).toContain(5)
    expect(north.optimalMonths).not.toContain(11)
    expect(assessCropSuitability(TOMATO, BUENOS_AIRES).frostRisk.hasRisk).toBe(false)
  })

  it('tomate en Mendoza: solo octubre–diciembre; heladas abr–sep; déficit hídrico exige riego', () => {
    const a = assessCropSuitability(TOMATO, MENDOZA)

    expect(a.sowingWindow!.optimalMonths).toEqual([10, 11, 12])
    expect(a.frostRisk.criticalMonths).toEqual([4, 5, 6, 7, 8, 9])
    expect(a.waterFit.status).toBe('deficit') // 259 mm < 400 mm (mínimo absoluto EcoCrop)
    expect(a.limitingFactors.some(f => /riego/i.test(f))).toBe(true)
  })

  it('tomate en Bogotá (2600 m): a campo abierto marginal, óptimo solo en invernadero', () => {
    const a = assessCropSuitability(TOMATO, BOGOTA)

    expect(a.sowingWindow!.byEnvironment.outdoor.optimalMonths).toEqual([])
    expect(a.sowingWindow!.byEnvironment.outdoor.marginalMonths.length).toBeGreaterThan(0)
    expect(a.thermalFit.status).toBe('marginal')
    expect(a.sowingWindow!.recommendedEnvironment).toBe('greenhouse')
    expect(a.sowingWindow!.optimalMonths).toHaveLength(12)
    expect(a.suitability).toBe('suitable')
    expect(a.score).toBeLessThanOrEqual(80)
    expect(a.limitingFactors.some(f => /invernadero/i.test(f))).toBe(true)
  })
})

describe('assessCropSuitability — tolerancia a heladas (temperatura letal)', () => {
  it('quinua (letal −8 °C) en Bogotá: óptima todo el año, las heladas leves no la dañan', () => {
    const a = assessCropSuitability(QUINOA, BOGOTA)

    expect(a.suitability).toBe('optimal')
    expect(a.sowingWindow!.recommendedEnvironment).toBe('outdoor')
    expect(a.sowingWindow!.optimalMonths).toHaveLength(12)
    expect(a.frostRisk.hasRisk).toBe(false)
  })

  it('trigo (letal 0 °C) en Buenos Aires: óptimo con siembra de invierno (may–jul)', () => {
    const a = assessCropSuitability(WHEAT, BUENOS_AIRES)

    expect(a.suitability).toBe('optimal')
    expect(a.sowingWindow!.optimalMonths).toEqual(expect.arrayContaining([5, 6, 7]))
    expect(a.frostRisk.hasRisk).toBe(false)
  })

  it('trigo en Mendoza: viable pero con riesgo de heladas extremas en invierno (no letal)', () => {
    const a = assessCropSuitability(WHEAT, MENDOZA)

    expect(a.suitability).not.toBe('not_suitable')
    expect(a.sowingWindow!.recommendedEnvironment).toBe('outdoor')
    expect(a.frostRisk.hasRisk).toBe(true)
    expect(a.frostRisk.criticalMonths).toEqual(expect.arrayContaining([5, 6, 7, 8]))
  })
})

describe('assessCropSuitability — ambiente recomendado', () => {
  it('banano (ciclo de 12 meses, sensible a heladas) en Madrid: solo interior controlado', () => {
    const a = assessCropSuitability(BANANA, MADRID)

    expect(a.suitability).toBe('not_suitable')
    expect(a.score).toBe(0)
    expect(a.sowingWindow!.recommendedEnvironment).toBe('indoor')
    expect(a.sowingWindow!.optimalMonths).toEqual([])
    expect(a.sowingWindow!.marginalMonths).toEqual([])
    expect(a.thermalFit.status).toBe('incompatible')
  })

  it('café en Bogotá: ciclo de 9 meses → solo marzo está libre de heladas; almácigo en feb–mar', () => {
    const a = assessCropSuitability(COFFEE, BOGOTA)

    expect(a.sowingWindow!.cycleMonths).toBe(9)
    expect(a.sowingWindow!.recommendedEnvironment).toBe('outdoor')
    expect(a.sowingWindow!.optimalMonths).toEqual([3])
    expect(a.sowingWindow!.byEnvironment.indoor_starts.optimalMonths).toEqual([2, 3])
  })

  it('cuando a campo abierto no hay ventana óptima pero con almácigo sí: recomienda indoor_starts', () => {
    // Cultivo de ciclo largo (7 meses) y exigente en calor, en Madrid.
    const longCycleWarmCrop: AgronomicData = {
      optTempMin: 22, optTempMax: 30, minTemp: 10, maxTemp: 35,
      cycleDaysMin: 210, cycleDaysMax: 210,
    }
    const a = assessCropSuitability(longCycleWarmCrop, MADRID)

    expect(a.sowingWindow!.byEnvironment.outdoor.optimalMonths).toEqual([])
    expect(a.sowingWindow!.byEnvironment.outdoor.marginalMonths).toEqual([4])
    expect(a.sowingWindow!.recommendedEnvironment).toBe('indoor_starts')
    expect(a.sowingWindow!.optimalMonths).toEqual([4])
    expect(a.sowingWindow!.marginalMonths).toEqual([3])
    expect(a.suitability).toBe('suitable')
    expect(a.limitingFactors.some(f => /almácigo/i.test(f) && /abril/i.test(f))).toBe(true)
  })

  it('si ni protegido alcanza el óptimo pero sí el rango tolerable: clase marginal en invernadero', () => {
    const hotLoving: AgronomicData = {
      optTempMin: 24, optTempMax: 30, minTemp: 10, maxTemp: 38,
      cycleDaysMin: 90, cycleDaysMax: 150,
    }
    const a = assessCropSuitability(hotLoving, BOGOTA)

    expect(a.sowingWindow!.recommendedEnvironment).toBe('greenhouse')
    expect(a.sowingWindow!.optimalMonths).toEqual([])
    expect(a.sowingWindow!.marginalMonths).toHaveLength(12)
    expect(a.suitability).toBe('marginal')
    expect(a.score).toBeGreaterThanOrEqual(30)
    expect(a.score).toBeLessThan(70)
  })
})

describe('assessCropSuitability — agua y calidad del dato', () => {
  it('exceso de precipitación sobre el máximo absoluto del taxón', () => {
    const a = assessCropSuitability(TOMATO, { ...TROPICAL_CONSTANT, annualRainfall: 2500 })
    expect(a.waterFit.status).toBe('excess')
    expect(a.limitingFactors.some(f => /drenaje/i.test(f))).toBe(true)
  })

  it('lluvia dentro del rango tolerable es suficiente (Buenos Aires, 1174 mm)', () => {
    expect(assessCropSuitability(TOMATO, BUENOS_AIRES).waterFit.status).toBe('sufficient')
  })

  it('sin datos de precipitación del taxón, el estado hídrico es desconocido (no se asume)', () => {
    const a = assessCropSuitability({ optTempMin: 18, optTempMax: 27, minTemp: 8, maxTemp: 35 }, BUENOS_AIRES)
    expect(a.waterFit.status).toBe('unknown')
  })

  it('sin ciclo ni límite superior: confianza baja y advertencias explícitas', () => {
    const a = assessCropSuitability({ minTemp: 5, optTempMin: 15 }, BUENOS_AIRES)

    expect(a.confidence).toBe('low')
    expect(a.sowingWindow!.cycleMonths).toBeNull()
    expect(a.limitingFactors.some(f => /ciclo.*desconocido/i.test(f))).toBe(true)
    expect(a.limitingFactors.some(f => /límite térmico superior/i.test(f))).toBe(true)
  })
})
