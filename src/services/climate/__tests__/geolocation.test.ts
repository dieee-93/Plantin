import { describe, it, expect } from 'vitest'
import { getBrowserPosition } from '../geolocation'

type Geo = Pick<Geolocation, 'getCurrentPosition'>

const geoOk = (latitude: number, longitude: number, altitude: number | null = null): Geo => ({
  getCurrentPosition: (success) =>
    success({ coords: { latitude, longitude, altitude } } as GeolocationPosition),
})

const geoError = (code: number, message = ''): Geo => ({
  getCurrentPosition: (_s, error) =>
    error?.({ code, message, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError),
})

describe('getBrowserPosition', () => {
  it('devuelve las coordenadas del navegador (con elevación si existe)', async () => {
    const pos = await getBrowserPosition(geoOk(-31.4201, -64.1888, 390))
    expect(pos).toEqual({ latitude: -31.4201, longitude: -64.1888, elevation: 390 })
  })

  it('omite la elevación cuando el dispositivo no la informa', async () => {
    const pos = await getBrowserPosition(geoOk(4.711, -74.0721, null))
    expect(pos).toEqual({ latitude: 4.711, longitude: -74.0721 })
  })

  it('traduce permiso denegado a un error que habilita la selección manual', async () => {
    await expect(getBrowserPosition(geoError(1))).rejects.toMatchObject({ reason: 'permission_denied' })
  })

  it('traduce posición no disponible y timeout', async () => {
    await expect(getBrowserPosition(geoError(2))).rejects.toMatchObject({ reason: 'unavailable' })
    await expect(getBrowserPosition(geoError(3))).rejects.toMatchObject({ reason: 'timeout' })
  })

  it('informa "unsupported" si el navegador no tiene geolocalización', async () => {
    await expect(getBrowserPosition(undefined)).rejects.toMatchObject({ reason: 'unsupported' })
  })
})
