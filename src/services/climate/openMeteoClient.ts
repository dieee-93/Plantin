import type { ClimateProfile, CurrentWeather, DailyClimateSeries, GeoCoordinates } from '@/domain/agroclimate/types'
import { buildClimateProfile } from './climateAggregation'

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const DAILY_VARS = 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum'
const CURRENT_VARS = 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day'
/** Normal climatológica estándar OMM. */
const NORMAL_START = '1991-01-01'
const NORMAL_END = '2020-12-31'
const CACHE_TTL_MS = 30 * 24 * 3600 * 1000

export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface ClimateClientOptions {
  fetcher?: (url: string) => Promise<Response>
  storage?: KeyValueStorage
  now?: () => number
}

interface CacheEntry { storedAt: number; profile: ClimateProfile }

/** Clave de caché por celda de ~1 km (coordenadas redondeadas a 2 decimales). */
export const climateCacheKey = (c: GeoCoordinates) =>
  `plantin_climate_${c.latitude.toFixed(2)}_${c.longitude.toFixed(2)}`

function readCache(storage: KeyValueStorage | undefined, key: string): CacheEntry | undefined {
  if (!storage) return undefined
  try {
    const raw = storage.getItem(key)
    return raw ? (JSON.parse(raw) as CacheEntry) : undefined
  } catch {
    return undefined
  }
}

/**
 * Obtiene el perfil agroclimático de una coordenada (normales 1991–2020, ERA5).
 * Caché 30 días; ante fallo de red sirve el caché vencido; sin ninguno, error explícito.
 */
export async function fetchClimateProfile(
  coords: GeoCoordinates,
  options: ClimateClientOptions = {},
): Promise<ClimateProfile> {
  const fetcher = options.fetcher ?? ((url: string) => fetch(url))
  const storage = options.storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined)
  const now = options.now ?? Date.now
  const key = climateCacheKey(coords)

  const cached = readCache(storage, key)
  if (cached && now() - cached.storedAt <= CACHE_TTL_MS) return cached.profile

  try {
    const params = new URLSearchParams({
      latitude: String(coords.latitude),
      longitude: String(coords.longitude),
      start_date: NORMAL_START,
      end_date: NORMAL_END,
      daily: DAILY_VARS,
      timezone: 'UTC',
    })
    const res = await fetcher(`${ARCHIVE_URL}?${params}`)
    if (!res.ok) throw new Error(`Open-Meteo respondió ${res.status}`)
    const body = (await res.json()) as { daily?: DailyClimateSeries }
    if (!body.daily) throw new Error('Respuesta de Open-Meteo sin serie diaria')

    const profile = buildClimateProfile(coords, body.daily, new Date(now()).toISOString())
    try {
      storage?.setItem(key, JSON.stringify({ storedAt: now(), profile } satisfies CacheEntry))
    } catch { /* caché lleno o no disponible: no es fatal */ }
    return profile
  } catch (error) {
    if (cached) return cached.profile
    throw new Error(
      `Sin datos climáticos disponibles para la coordenada seleccionada (${(error as Error).message})`,
    )
  }
}

export function describeWeatherCode(code: number): string {
  if (code === 0) return 'Cielo despejado'
  if (code === 1) return 'Mayormente despejado'
  if (code === 2) return 'Parcialmente nublado'
  if (code === 3) return 'Nublado'
  if (code === 45 || code === 48) return 'Niebla / Neblina'
  if (code >= 51 && code <= 57) return 'Llovizna ligera'
  if (code >= 61 && code <= 67) return 'Lluvia'
  if (code >= 71 && code <= 77) return 'Nieve / Agua nieve'
  if (code >= 80 && code <= 82) return 'Chaparrones'
  if (code >= 95) return 'Tormenta eléctrica'
  return 'Condición variable'
}

/**
 * Obtiene el clima en tiempo real (temperatura actual, humedad, viento y estado del cielo)
 * desde Open-Meteo Forecast API.
 */
export async function fetchCurrentWeather(
  coords: GeoCoordinates,
  options: ClimateClientOptions = {},
): Promise<CurrentWeather | undefined> {
  const fetcher = options.fetcher ?? ((url: string) => fetch(url))
  const now = options.now ?? Date.now

  try {
    const params = new URLSearchParams({
      latitude: String(coords.latitude),
      longitude: String(coords.longitude),
      current: CURRENT_VARS,
      timezone: 'auto',
    })
    const res = await fetcher(`${FORECAST_URL}?${params}`)
    if (!res.ok) return undefined
    const body = (await res.json()) as {
      current?: {
        temperature_2m?: number
        apparent_temperature?: number
        relative_humidity_2m?: number
        precipitation?: number
        weather_code?: number
        wind_speed_10m?: number
        is_day?: number
      }
    }
    if (!body.current || typeof body.current.temperature_2m !== 'number') return undefined

    const code = body.current.weather_code ?? 0
    return {
      temperature: body.current.temperature_2m,
      apparentTemperature: body.current.apparent_temperature ?? body.current.temperature_2m,
      humidity: body.current.relative_humidity_2m ?? 0,
      windSpeed: body.current.wind_speed_10m ?? 0,
      precipitation: body.current.precipitation ?? 0,
      weatherCode: code,
      conditionLabel: describeWeatherCode(code),
      isDay: body.current.is_day !== 0,
      fetchedAt: new Date(now()).toISOString(),
    }
  } catch {
    return undefined
  }
}
