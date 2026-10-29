import { describe, it, expect } from 'vitest'
import { findEcocropRecord, ecocropToAgronomicData, deriveGrowthMonths, type EcocropRecord } from '../ecocrop'
import { mergeAgronomicData, tagAgronomicSource } from '@/domain/taxon'
import realDataset from '@/data/ecocrop.json'

const records: EcocropRecord[] = [
  { n: 'Zea mays', s: ['zea indurata'], t: [18, 33, 10, 47], ph: [5, 7, 4.5, 8.5], r: [600, 1200, 400, 1800], g: [65, 365], li: 9, fe: 8, sa: 2, hu: 5 },
  { n: 'Zea mays ssp. saccharata', t: [16, 24, 12, 38] },
  { n: 'Lycopersicon esculentum', s: ['solanum lycopersicum'], t: [20, 27, 7, 35], ph: [5.5, 6.8, 5, 7.5], li: 8, fe: 8, sa: 2, hu: 8 },
  { n: 'Cannabis sativa ssp. indica', t: [15, 28, 6, 32], ph: [6, 7, 4.5, 8.2] },
  { n: 'Cannabis sativa ssp. indica var. longa', t: [1, 2, 3, 4] },
]

describe('findEcocropRecord', () => {
  it('prioriza el nombre exacto sobre infraespecíficos', () => {
    const r = findEcocropRecord('Zea', 'mays', records)
    expect(r?.match).toBe('exact')
    expect(r?.record.n).toBe('Zea mays')
  })

  it('resuelve por sinónimo (Solanum lycopersicum → Lycopersicon esculentum)', () => {
    const r = findEcocropRecord('Solanum', 'lycopersicum', records)
    expect(r?.match).toBe('synonym')
    expect(r?.record.n).toBe('Lycopersicon esculentum')
  })

  it('cae a infraespecífico eligiendo el nombre más corto', () => {
    const r = findEcocropRecord('Cannabis', 'sativa', records)
    expect(r?.match).toBe('infraspecific')
    expect(r?.record.n).toBe('Cannabis sativa ssp. indica')
  })

  it('es insensible a mayúsculas y descarta autoría en el epíteto', () => {
    expect(findEcocropRecord('zea', 'MAYS L.', records)?.record.n).toBe('Zea mays')
  })

  it('no confunde prefijos de epíteto (sativa ≠ sativum)', () => {
    expect(findEcocropRecord('Cannabis', 'sativ', records)).toBeUndefined()
  })

  it('devuelve undefined sin género o especie', () => {
    expect(findEcocropRecord('', 'mays', records)).toBeUndefined()
    expect(findEcocropRecord('Zea', '', records)).toBeUndefined()
  })
})

describe('ecocropToAgronomicData', () => {
  it('mapea cuartetos óptimo/absoluto y etiqueta la fuente', () => {
    const d = ecocropToAgronomicData(records[0])!
    expect(d).toMatchObject({
      optTempMin: 18, optTempMax: 33, minTemp: 10, maxTemp: 47,
      optPhMin: 5, optPhMax: 7, phMinimum: 4.5, phMaximum: 8.5,
      rainfallMin: 400, rainfallMax: 1800, cycleDaysMin: 65, cycleDaysMax: 365,
    })
    expect(d.sources?.minTemp).toBe('ecocrop')
  })

  it('omite valores null', () => {
    const d = ecocropToAgronomicData({ n: 'X y', t: [null, null, 5, null] })!
    expect(d.minTemp).toBe(5)
    expect('maxTemp' in d).toBe(false)
  })

  it('mapea la temperatura letal (k) como killTemp con fuente ecocrop', () => {
    // Registros reales: trigo k=0 °C, quinua k=-8 °C
    const wheat = ecocropToAgronomicData({ n: 'Triticum aestivum', t: [15, 23, 5, 27], k: 0 })!
    const quinoa = ecocropToAgronomicData({ n: 'Chenopodium quinoa', t: [14, 18, 2, 35], k: -8 })!
    expect(wheat.killTemp).toBe(0)
    expect(quinoa.killTemp).toBe(-8)
    expect(quinoa.sources?.killTemp).toBe('ecocrop')
  })

  it('no inventa killTemp cuando el registro no tiene k', () => {
    const d = ecocropToAgronomicData(records[0])!
    expect('killTemp' in d).toBe(false)
  })

  it('mapea light, soilNutriments, soilSalinity, atmosphericHumidity y growthMonths con fuente ecocrop', () => {
    const d = ecocropToAgronomicData(records[0])!
    expect(d.light).toBe(9)
    expect(d.soilNutriments).toBe(8)
    expect(d.soilSalinity).toBe(2)
    expect(d.atmosphericHumidity).toBe(5)
    expect(d.growthMonths).toEqual(['sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'])
    expect(d.sources?.light).toBe('ecocrop')
    expect(d.sources?.soilNutriments).toBe('ecocrop')
    expect(d.sources?.soilSalinity).toBe('ecocrop')
    expect(d.sources?.atmosphericHumidity).toBe('ecocrop')
    expect(d.sources?.growthMonths).toBe('ecocrop')
  })

  it('calcula growthMonths correctamente según rango térmico y duración de ciclo', () => {
    // Cálido de ciclo normal (> 100 días)
    expect(deriveGrowthMonths({ n: 'A', t: [20, 27, 7, 35], g: [70, 150] })).toEqual([
      'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'
    ])
    // Cálido de ciclo corto (<= 100 días)
    expect(deriveGrowthMonths({ n: 'B', t: [20, 27, 7, 35], g: [40, 60] })).toEqual([
      'oct', 'nov', 'dec', 'jan', 'feb'
    ])
    // Estación fría (optTempMax <= 20)
    expect(deriveGrowthMonths({ n: 'C', t: [13, 20, 2, 27], g: [40, 120] })).toEqual([
      'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct'
    ])
    // Templado amplio (optTempMin < 18 && optTempMax > 20)
    expect(deriveGrowthMonths({ n: 'D', t: [12, 21, 5, 30], g: [35, 85] })).toEqual([
      'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar', 'apr'
    ])
    // Sin t ni g
    expect(deriveGrowthMonths({ n: 'E' })).toBeUndefined()
  })
})

describe('mergeAgronomicData', () => {
  it('Trefle tiene prioridad y EcoCrop completa los huecos', () => {
    const trefle = tagAgronomicSource({ phMinimum: 5.5, phMaximum: 7.5, light: 9 }, 'trefle')
    const eco = ecocropToAgronomicData(records[0])
    const m = mergeAgronomicData(trefle, eco)!
    expect(m.phMinimum).toBe(5.5)
    expect(m.sources?.phMinimum).toBe('trefle')
    expect(m.minTemp).toBe(10)
    expect(m.sources?.minTemp).toBe('ecocrop')
    expect(m.light).toBe(9)
  })

  it('devuelve undefined si ninguna fuente tiene datos', () => {
    expect(mergeAgronomicData(undefined, undefined)).toBeUndefined()
  })
})

describe('dataset real (src/data/ecocrop.json)', () => {
  const data = realDataset as EcocropRecord[]
  it.each([
    ['Solanum', 'lycopersicum', 7, 35],
    ['Zea', 'mays', 10, 47],
    ['Cannabis', 'sativa', 6, 32],
  ])('%s %s tiene temperaturas', (g, s, min, max) => {
    const d = ecocropToAgronomicData(findEcocropRecord(g, s, data)!.record)!
    expect(d.minTemp).toBe(min)
    expect(d.maxTemp).toBe(max)
  })

  it('especies reales clave (Solanum lycopersicum, Zea mays, Citrus sinensis) traen campos agronómicos completos', () => {
    const crops = [
      { genus: 'Solanum', species: 'lycopersicum', expectedLight: 8, expectedFe: 8, expectedSa: 2, expectedHu: 8 },
      { genus: 'Zea', species: 'mays', expectedLight: 9, expectedFe: 8, expectedSa: 2, expectedHu: 5 },
      { genus: 'Citrus', species: 'sinensis', expectedLight: 9, expectedFe: 5, expectedSa: 2, expectedHu: 8 },
    ]

    for (const crop of crops) {
      const match = findEcocropRecord(crop.genus, crop.species, data)
      expect(match).toBeDefined()
      const d = ecocropToAgronomicData(match!.record)!
      expect(d).toBeDefined()
      expect(d.light).toBe(crop.expectedLight)
      expect(d.soilNutriments).toBe(crop.expectedFe)
      expect(d.soilSalinity).toBe(crop.expectedSa)
      expect(d.atmosphericHumidity).toBe(crop.expectedHu)
      expect(d.growthMonths).toBeDefined()
      expect(d.growthMonths!.length).toBeGreaterThan(0)
      expect(d.sources?.light).toBe('ecocrop')
      expect(d.sources?.soilNutriments).toBe('ecocrop')
      expect(d.sources?.soilSalinity).toBe('ecocrop')
      expect(d.sources?.atmosphericHumidity).toBe('ecocrop')
      expect(d.sources?.growthMonths).toBe('ecocrop')
    }
  })
})
