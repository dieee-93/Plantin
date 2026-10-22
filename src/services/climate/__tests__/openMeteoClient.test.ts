import { describe, it, expect, vi } from 'vitest'
import { fetchClimateProfile } from '../openMeteoClient'
import type { DailyClimateSeries } from '@/domain/agroclimate/types'

/** Respuesta Open-Meteo con 1 año (2019) de clima constante: Tmean 20, Tmax 25, Tmin 15, 1 mm el día 1. */
function openMeteoBody(): { daily: DailyClimateSeries } {
  const daily: DailyClimateSeries = {
    time: [], temperature_2m_max: [], temperature_2m_min: [],
    temperature_2m_mean: [], precipitation_sum: [],
  }
  for (let m = 0; m < 12; m++) {
    const days = new Date(Date.UTC(2019, m + 1, 0)).getUTCDate()
    for (let d = 1; d <= days; d++) {
      daily.time.push(`2019-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
      daily.temperature_2m_max.push(25)
      daily.temperature_2m_min.push(15)
      daily.temperature_2m_mean.push(20)
      daily.precipitation_sum.push(d === 1 ? 1 : 0)
    }
  }
  return { daily }
}

const okResponse = () => ({ ok: true, status: 200, json: async () => openMeteoBody() }) as Response

function memoryStorage() {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, v) },
    removeItem: (k: string) => { m.delete(k) },
    _map: m,
  }
}

const COORDS = { latitude: -34.6037, longitude: -58.3816, name: 'Buenos Aires' }
const DAY = 24 * 3600 * 1000

describe('fetchClimateProfile', () => {
  it('consulta Open-Meteo Archive con la serie diaria 1991–2020 y devuelve el perfil', async () => {
    const fetcher = vi.fn(async (_url: RequestInfo | URL) => okResponse())

    const profile = await fetchClimateProfile(COORDS, { fetcher, storage: memoryStorage(), now: () => Date.UTC(2026, 9, 20) })

    const url = new URL(String(fetcher.mock.calls[0][0]))
    expect(url.origin + url.pathname).toBe('https://archive-api.open-meteo.com/v1/archive')
    expect(url.searchParams.get('latitude')).toBe('-34.6037')
    expect(url.searchParams.get('longitude')).toBe('-58.3816')
    expect(url.searchParams.get('start_date')).toBe('1991-01-01')
    expect(url.searchParams.get('end_date')).toBe('2020-12-31')
    expect(url.searchParams.get('daily')).toBe(
      'temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum',
    )
    expect(profile.monthly[0].tempMean).toBe(20)
    expect(profile.hemisphere).toBe('south')
    expect(profile.fetchedAt).toBe(new Date(Date.UTC(2026, 9, 20)).toISOString())
  })

  it('reutiliza el caché (clave por coordenadas a 2 decimales) dentro de 30 días', async () => {
    const storage = memoryStorage()
    const fetcher = vi.fn(async () => okResponse())
    let now = Date.UTC(2026, 9, 20)

    await fetchClimateProfile(COORDS, { fetcher, storage, now: () => now })
    now += 29 * DAY
    // coordenada cercana (misma celda ~1 km) → mismo caché
    await fetchClimateProfile({ latitude: -34.6049, longitude: -58.3821 }, { fetcher, storage, now: () => now })

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(storage._map.has('plantin_climate_-34.60_-58.38')).toBe(true)
  })

  it('vuelve a consultar cuando el caché supera los 30 días', async () => {
    const storage = memoryStorage()
    const fetcher = vi.fn(async () => okResponse())
    let now = Date.UTC(2026, 9, 20)

    await fetchClimateProfile(COORDS, { fetcher, storage, now: () => now })
    now += 31 * DAY
    await fetchClimateProfile(COORDS, { fetcher, storage, now: () => now })

    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('si la red falla sirve el caché vencido en lugar de fallar', async () => {
    const storage = memoryStorage()
    let now = Date.UTC(2026, 9, 20)
    await fetchClimateProfile(COORDS, { fetcher: async () => okResponse(), storage, now: () => now })
    now += 90 * DAY

    const offline = vi.fn(async () => { throw new Error('offline') })
    const profile = await fetchClimateProfile(COORDS, { fetcher: offline, storage, now: () => now })

    expect(offline).toHaveBeenCalledTimes(1)
    expect(profile.monthly[0].tempMean).toBe(20)
  })

  it('sin red ni caché lanza un error explícito (sin datos inventados)', async () => {
    const offline = async () => { throw new Error('offline') }

    await expect(
      fetchClimateProfile(COORDS, { fetcher: offline, storage: memoryStorage(), now: () => 0 }),
    ).rejects.toThrow(/Sin datos climáticos disponibles/)
  })

  it('trata una respuesta HTTP no exitosa como fallo de red', async () => {
    const bad = async () => ({ ok: false, status: 429, json: async () => ({}) }) as Response

    await expect(
      fetchClimateProfile(COORDS, { fetcher: bad, storage: memoryStorage(), now: () => 0 }),
    ).rejects.toThrow(/Sin datos climáticos disponibles/)
  })
})
