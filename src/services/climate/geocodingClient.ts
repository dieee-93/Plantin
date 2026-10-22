export interface GeocodingResult {
  id: number
  name: string
  admin1?: string
  country?: string
  latitude: number
  longitude: number
  elevation?: number
}

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const REVERSE_GEOCODING_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client'

export async function searchLocations(
  query: string,
  fetcher: (url: string) => Promise<Response> = (url) => fetch(url),
): Promise<GeocodingResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const params = new URLSearchParams({
    name: trimmed,
    count: '6',
    language: 'es',
    format: 'json',
  })

  try {
    const res = await fetcher(`${GEOCODING_URL}?${params}`)
    if (!res.ok) return []
    const body = (await res.json()) as { results?: GeocodingResult[] }
    return body.results ?? []
  } catch {
    return []
  }
}

/**
 * Obtiene el nombre aproximado de la localidad/ciudad, provincia y país
 * a partir de coordenadas GPS usando geocodificación inversa gratuita sin API key.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  fetcher: (url: string) => Promise<Response> = (url) => fetch(url),
): Promise<string | undefined> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: 'es',
  })

  try {
    const res = await fetcher(`${REVERSE_GEOCODING_URL}?${params}`)
    if (!res.ok) return undefined
    const body = (await res.json()) as {
      locality?: string
      city?: string
      principalSubdivision?: string
      countryName?: string
    }

    const primary = body.city || body.locality
    const parts = [primary, body.principalSubdivision, body.countryName]
      .filter((p): p is string => Boolean(p && p.trim()))
      // Evita duplicar si city === principalSubdivision (ej. "Buenos Aires, Buenos Aires")
      .filter((item, idx, arr) => idx === 0 || item.toLowerCase() !== arr[idx - 1].toLowerCase())

    return parts.length > 0 ? parts.join(', ') : undefined
  } catch {
    return undefined
  }
}
