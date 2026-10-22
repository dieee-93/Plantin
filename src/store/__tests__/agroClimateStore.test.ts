import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAgroClimateStore } from '../agroClimateStore'
import * as openMeteo from '@/services/climate/openMeteoClient'
import * as geoService from '@/services/climate/geolocation'
import * as geocoding from '@/services/climate/geocodingClient'
import { BUENOS_AIRES } from '@/domain/agroclimate/__tests__/fixtures'

describe('useAgroClimateStore', () => {
  beforeEach(() => {
    useAgroClimateStore.setState({
      farmCoordinates: undefined,
      currentClimate: undefined,
      currentWeather: undefined,
      isLoadingClimate: false,
      climateError: undefined,
    })
    vi.restoreAllMocks()
  })

  it('permite establecer y persistir las coordenadas de la granja', () => {
    vi.spyOn(openMeteo, 'fetchClimateProfile').mockResolvedValue(BUENOS_AIRES)
    vi.spyOn(openMeteo, 'fetchCurrentWeather').mockResolvedValue({
      temperature: 22.5,
      apparentTemperature: 23.0,
      humidity: 62,
      windSpeed: 14,
      precipitation: 0,
      weatherCode: 0,
      conditionLabel: 'Despejado',
      isDay: true,
      fetchedAt: '2026-10-21T15:00:00Z',
    })

    const { setFarmCoordinates } = useAgroClimateStore.getState()
    setFarmCoordinates({ latitude: -34.6, longitude: -58.4, name: 'Buenos Aires' })

    expect(useAgroClimateStore.getState().farmCoordinates).toEqual({
      latitude: -34.6, longitude: -58.4, name: 'Buenos Aires',
    })
  })

  it('detecta automáticamente la ubicación del navegador, resuelve el nombre aproximado y carga clima histórico y actual', async () => {
    vi.spyOn(geoService, 'getBrowserPosition').mockResolvedValue({
      latitude: -34.6, longitude: -58.4,
    })
    vi.spyOn(geocoding, 'reverseGeocode').mockResolvedValue('Buenos Aires, Argentina')
    vi.spyOn(openMeteo, 'fetchClimateProfile').mockResolvedValue(BUENOS_AIRES)
    vi.spyOn(openMeteo, 'fetchCurrentWeather').mockResolvedValue({
      temperature: 21.4,
      apparentTemperature: 21.8,
      humidity: 58,
      windSpeed: 12,
      precipitation: 0,
      weatherCode: 1,
      conditionLabel: 'Mayormente despejado',
      isDay: true,
      fetchedAt: '2026-10-21T15:00:00Z',
    })

    const coords = await useAgroClimateStore.getState().detectBrowserLocation()

    expect(coords).toEqual({
      latitude: -34.6,
      longitude: -58.4,
      name: 'Buenos Aires, Argentina',
    })
    expect(useAgroClimateStore.getState().farmCoordinates?.name).toBe('Buenos Aires, Argentina')
    expect(useAgroClimateStore.getState().currentClimate).toBe(BUENOS_AIRES)
    expect(useAgroClimateStore.getState().currentWeather?.temperature).toBe(21.4)
    expect(useAgroClimateStore.getState().currentWeather?.conditionLabel).toBe('Mayormente despejado')
    expect(useAgroClimateStore.getState().isLoadingClimate).toBe(false)
  })

  it('captura errores si la geolocalización o la API climática falla', async () => {
    vi.spyOn(geoService, 'getBrowserPosition').mockRejectedValue(
      new Error('Permiso de ubicación denegado'),
    )

    await expect(useAgroClimateStore.getState().detectBrowserLocation()).rejects.toThrow(
      'Permiso de ubicación denegado',
    )
    expect(useAgroClimateStore.getState().climateError).toContain('Permiso de ubicación denegado')
  })
})
