import type {
  ClimateProfile, DailyClimateSeries, GeoCoordinates, MonthlyClimate,
} from '@/domain/agroclimate/types'

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

/**
 * Agrega una serie diaria multianual en normales mensuales.
 * Los días con valor nulo se ignoran; si un mes carece de datos, falla
 * explícitamente en lugar de inventar valores.
 */
export function buildClimateProfile(
  coordinates: GeoCoordinates,
  daily: DailyClimateSeries,
  fetchedAt: string,
): ClimateProfile {
  const years = new Set(daily.time.map(t => t.slice(0, 4)))
  const monthly: MonthlyClimate[] = []

  for (let m = 1; m <= 12; m++) {
    const mean: number[] = [], tmin: number[] = [], tmax: number[] = []
    let rainTotal = 0
    let frostTotal = 0
    let absMin = Infinity

    daily.time.forEach((t, i) => {
      if (Number(t.slice(5, 7)) !== m) return
      const tm = daily.temperature_2m_mean[i]
      const lo = daily.temperature_2m_min[i]
      const hi = daily.temperature_2m_max[i]
      const p = daily.precipitation_sum[i]
      if (tm != null) mean.push(tm)
      if (lo != null) {
        tmin.push(lo)
        if (lo <= 0) frostTotal++
        if (lo < absMin) absMin = lo
      }
      if (hi != null) tmax.push(hi)
      if (p != null) rainTotal += p
    })

    if (mean.length === 0 || tmin.length === 0 || tmax.length === 0) {
      throw new Error(`Datos climáticos insuficientes para el mes ${m}`)
    }

    monthly.push({
      month: m,
      tempMean: avg(mean),
      tempMin: avg(tmin),
      tempMax: avg(tmax),
      tempAbsoluteMin: absMin,
      precipitation: rainTotal / years.size,
      frostDays: frostTotal / years.size,
    })
  }

  return {
    coordinates,
    hemisphere: coordinates.latitude < 0 ? 'south' : 'north',
    annualRainfall: monthly.reduce((a, x) => a + x.precipitation, 0),
    annualFrostDays: monthly.reduce((a, x) => a + x.frostDays, 0),
    monthly,
    fetchedAt,
  }
}
