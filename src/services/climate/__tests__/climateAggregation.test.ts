import { describe, it, expect } from 'vitest'
import { buildClimateProfile } from '../climateAggregation'
import type { DailyClimateSeries } from '@/domain/agroclimate/types'

/**
 * Genera una serie diaria sintética de `years` años a partir de normales
 * mensuales conocidas (literales de tablas climáticas): cada día del mes
 * tiene Tmean = normal, Tmax = normal + 5, Tmin = normal - 5, y la lluvia
 * mensual se deposita completa el día 1 de cada mes.
 */
function seriesFromNormals(
  startYear: number,
  years: number,
  tmean: number[],
  rain: number[],
): DailyClimateSeries {
  const s: DailyClimateSeries = {
    time: [], temperature_2m_max: [], temperature_2m_min: [],
    temperature_2m_mean: [], precipitation_sum: [],
  }
  for (let y = startYear; y < startYear + years; y++) {
    for (let m = 0; m < 12; m++) {
      const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
      for (let d = 1; d <= days; d++) {
        s.time.push(`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
        s.temperature_2m_mean.push(tmean[m])
        s.temperature_2m_max.push(tmean[m] + 5)
        s.temperature_2m_min.push(tmean[m] - 5)
        s.precipitation_sum.push(d === 1 ? rain[m] : 0)
      }
    }
  }
  return s
}

// Buenos Aires (SMN Observatorio Central, normales aprox.)
const BA_TMEAN = [24.8, 23.7, 21.8, 17.9, 14.4, 11.4, 10.8, 12.3, 14.5, 17.8, 21.0, 23.5]
const BA_RAIN = [123, 118, 134, 108, 89, 60, 59, 71, 80, 120, 112, 100]

describe('buildClimateProfile', () => {
  it('promedia 12 meses de normales y suma la lluvia anual (Buenos Aires)', () => {
    const profile = buildClimateProfile(
      { latitude: -34.6, longitude: -58.4, name: 'Buenos Aires' },
      seriesFromNormals(2010, 3, BA_TMEAN, BA_RAIN),
      '2026-10-20T00:00:00.000Z',
    )

    expect(profile.monthly).toHaveLength(12)
    expect(profile.monthly[0].month).toBe(1)
    expect(profile.monthly[0].tempMean).toBeCloseTo(24.8, 1)
    expect(profile.monthly[6].tempMean).toBeCloseTo(10.8, 1)   // julio
    expect(profile.monthly[6].tempMin).toBeCloseTo(5.8, 1)
    expect(profile.monthly[6].tempMax).toBeCloseTo(15.8, 1)
    expect(profile.monthly[2].precipitation).toBeCloseTo(134, 0)
    expect(profile.annualRainfall).toBeCloseTo(1174, 0)        // suma literal de BA_RAIN
  })

  it('cuenta días de helada y mínima absoluta promediando por año (Mendoza)', () => {
    // Mendoza: invierno seco, Tmean julio ≈ 7.8 °C → Tmin media 2.8 °C
    const MZA_TMEAN = [25.2, 23.7, 20.4, 15.9, 11.3, 7.9, 7.8, 10.2, 13.1, 17.6, 21.4, 24.2]
    const MZA_RAIN = [31, 34, 31, 18, 12, 9, 12, 14, 18, 24, 26, 30]
    const s = seriesFromNormals(2010, 2, MZA_TMEAN, MZA_RAIN)
    const setTmin = (date: string, v: number) => { s.temperature_2m_min[s.time.indexOf(date)] = v }
    setTmin('2010-07-10', -4); setTmin('2010-07-11', -2); setTmin('2010-07-12', -3) // 3 heladas
    setTmin('2011-07-05', -7)                                                       // 1 helada

    const p = buildClimateProfile({ latitude: -32.9, longitude: -68.8 }, s, '2026-10-20T00:00:00.000Z')

    expect(p.monthly[6].frostDays).toBe(2)            // (3 + 1) / 2 años
    expect(p.monthly[6].tempAbsoluteMin).toBe(-7)
    expect(p.monthly[0].frostDays).toBe(0)            // enero sin heladas
    expect(p.annualFrostDays).toBe(2)
  })

  it('distingue hemisferio por el signo de la latitud (Madrid vs Buenos Aires)', () => {
    const MAD_TMEAN = [6.3, 8.0, 11.3, 13.1, 17.0, 22.2, 25.6, 25.2, 20.8, 14.9, 9.6, 6.9]
    const MAD_RAIN = [34, 34, 27, 43, 46, 21, 11, 10, 25, 47, 52, 52]
    const north = buildClimateProfile({ latitude: 40.4, longitude: -3.7 }, seriesFromNormals(2010, 1, MAD_TMEAN, MAD_RAIN), 'x')
    const south = buildClimateProfile({ latitude: -34.6, longitude: -58.4 }, seriesFromNormals(2010, 1, BA_TMEAN, BA_RAIN), 'x')

    expect(north.hemisphere).toBe('north')
    expect(south.hemisphere).toBe('south')
    expect(north.monthly[6].tempMean).toBeGreaterThan(north.monthly[0].tempMean) // julio más cálido (boreal)
    expect(south.monthly[6].tempMean).toBeLessThan(south.monthly[0].tempMean)    // julio más frío (austral)
  })

  it('falla explícitamente si falta todo un mes en lugar de inventar datos', () => {
    const s = seriesFromNormals(2010, 1, BA_TMEAN, BA_RAIN)
    s.temperature_2m_min = s.temperature_2m_min.map((v, i) => (s.time[i].slice(5, 7) === '03' ? null : v))

    expect(() => buildClimateProfile({ latitude: -34.6, longitude: -58.4 }, s, 'x'))
      .toThrow(/mes 3/)
  })
})
