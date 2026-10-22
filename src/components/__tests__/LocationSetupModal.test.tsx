import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocationSetupModal } from '../LocationSetupModal'
import { useAgroClimateStore } from '@/store/agroClimateStore'
import * as geoService from '@/services/climate/geolocation'
import * as openMeteo from '@/services/climate/openMeteoClient'
import * as geocoding from '@/services/climate/geocodingClient'
import { BUENOS_AIRES } from '@/domain/agroclimate/__tests__/fixtures'

describe('LocationSetupModal', () => {
  beforeEach(() => {
    useAgroClimateStore.setState({
      farmCoordinates: undefined,
      currentClimate: undefined,
      isLoadingClimate: false,
      climateError: undefined,
    })
    vi.restoreAllMocks()
    vi.spyOn(openMeteo, 'fetchClimateProfile').mockResolvedValue(BUENOS_AIRES)
  })

  it('se muestra como requisito obligatorio cuando no hay farmCoordinates y permite detectar GPS', async () => {
    const user = userEvent.setup()
    vi.spyOn(geoService, 'getBrowserPosition').mockResolvedValue({
      latitude: -34.6,
      longitude: -58.4,
      elevation: 25,
    })

    render(<LocationSetupModal />)

    expect(screen.getByText(/Configura la ubicación de tu cultivo/i)).toBeInTheDocument()
    // En modo requisito obligatorio no debe mostrarse botón de cerrar/cancelar
    expect(screen.queryByRole('button', { name: /Cancelar/i })).not.toBeInTheDocument()

    const gpsBtn = screen.getByRole('button', { name: /Detectar mi ubicación actual/i })
    await user.click(gpsBtn)

    await waitFor(() => {
      expect(useAgroClimateStore.getState().farmCoordinates).toMatchObject({
        latitude: -34.6,
        longitude: -58.4,
      })
    })
  })

  it('permite buscar una ciudad por nombre y seleccionarla como ubicación global', async () => {
    const user = userEvent.setup()
    vi.spyOn(geocoding, 'searchLocations').mockResolvedValue([
      {
        id: 1,
        name: 'Mendoza',
        admin1: 'Mendoza',
        country: 'Argentina',
        latitude: -32.8908,
        longitude: -68.8272,
        elevation: 746,
      },
    ])

    render(<LocationSetupModal />)

    const searchInput = screen.getByPlaceholderText(/Buscar ciudad o localidad/i)
    await user.type(searchInput, 'Mendoza')

    await waitFor(() => {
      expect(screen.getByText(/Mendoza, Argentina/i)).toBeInTheDocument()
    })

    await user.click(screen.getByText(/Mendoza, Argentina/i))

    expect(useAgroClimateStore.getState().farmCoordinates).toEqual({
      name: 'Mendoza, Mendoza, Argentina',
      latitude: -32.8908,
      longitude: -68.8272,
      elevation: 746,
    })
  })

  it('permite ingresar coordenadas manuales con nombre del establecimiento', async () => {
    const user = userEvent.setup()
    render(<LocationSetupModal />)

    await user.type(screen.getByLabelText(/Nombre del lugar o ciudad/i), 'Chacra Experimental Sur')
    await user.type(screen.getByLabelText(/Latitud/i), '-38.71')
    await user.type(screen.getByLabelText(/Longitud/i), '-62.26')

    await user.click(screen.getByRole('button', { name: /Guardar Ubicación/i }))

    expect(useAgroClimateStore.getState().farmCoordinates).toEqual({
      name: 'Chacra Experimental Sur',
      latitude: -38.71,
      longitude: -62.26,
      elevation: undefined,
    })
  })
})
