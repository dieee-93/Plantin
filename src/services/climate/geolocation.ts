import type { GeoCoordinates } from '@/domain/agroclimate/types'

export type GeolocationFailure = 'permission_denied' | 'unavailable' | 'timeout' | 'unsupported'

export class GeolocationError extends Error {
  readonly reason: GeolocationFailure

  constructor(reason: GeolocationFailure, message: string) {
    super(message)
    this.reason = reason
    this.name = 'GeolocationError'
  }
}

const REASON_BY_CODE: Record<number, GeolocationFailure> = {
  1: 'permission_denied',
  2: 'unavailable',
  3: 'timeout',
}

const MESSAGES: Record<GeolocationFailure, string> = {
  permission_denied: 'Permiso de ubicación denegado. Ingresá las coordenadas manualmente.',
  unavailable: 'No se pudo determinar la posición del dispositivo.',
  timeout: 'Se agotó el tiempo esperando la ubicación.',
  unsupported: 'Este navegador no soporta geolocalización.',
}

/**
 * Solicita la posición actual al navegador. Si falla, el error indica el motivo
 * para que la UI ofrezca la selección manual de coordenadas.
 */
export function getBrowserPosition(
  geo: Pick<Geolocation, 'getCurrentPosition'> | undefined = typeof navigator !== 'undefined' ? navigator.geolocation : undefined,
): Promise<GeoCoordinates> {
  return new Promise((resolve, reject) => {
    if (!geo) return reject(new GeolocationError('unsupported', MESSAGES.unsupported))
    geo.getCurrentPosition(
      ({ coords }) => resolve({
        latitude: coords.latitude,
        longitude: coords.longitude,
        ...(coords.altitude != null ? { elevation: coords.altitude } : {}),
      }),
      (err) => {
        const reason = REASON_BY_CODE[err.code] ?? 'unavailable'
        reject(new GeolocationError(reason, MESSAGES[reason]))
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    )
  })
}
