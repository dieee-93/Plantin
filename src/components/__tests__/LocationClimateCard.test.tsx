import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LocationClimateCard } from '../LocationClimateCard'
import { useAgroClimateStore } from '@/store/agroClimateStore'
import { BUENOS_AIRES } from '@/domain/agroclimate/__tests__/fixtures'

describe('LocationClimateCard', () => {
  beforeEach(() => {
    useAgroClimateStore.setState({
      farmCoordinates: {
        latitude: -34.6,
        longitude: -58.4,
        elevation: 25,
        name: 'Palermo, Buenos Aires, Argentina',
      },
      currentClimate: BUENOS_AIRES,
      currentWeather: {
        temperature: 23.4,
        apparentTemperature: 24.1,
        humidity: 64,
        windSpeed: 15,
        precipitation: 0,
        weatherCode: 0,
        conditionLabel: 'Cielo despejado',
        isDay: true,
        fetchedAt: '2026-10-21T15:00:00Z',
      },
      isLoadingClimate: false,
      climateError: undefined,
    })
  })

  it('muestra la ubicación aproximada con nombre, coordenadas, clima actual en vivo y normales agroclimáticas', () => {
    render(<LocationClimateCard />)

    expect(screen.getByText(/Palermo, Buenos Aires, Argentina/i)).toBeInTheDocument()
    expect(screen.getByText(/23.4°C/i)).toBeInTheDocument()
    expect(screen.getByText(/Cielo despejado/i)).toBeInTheDocument()
    expect(screen.getByText(/64% HR/i)).toBeInTheDocument()
    expect(screen.getByText(/15 km\/h/i)).toBeInTheDocument()
    expect(screen.getByText(/mm\/año/i)).toBeInTheDocument()
    expect(screen.getByText(/h de luz hoy/i)).toBeInTheDocument()
  })
})
