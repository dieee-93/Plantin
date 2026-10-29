import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocationSetupModal } from '../LocationSetupModal'
import { useAgroClimateStore } from '@/store/agroClimateStore'
import { useTaxonStore } from '@/store/taxonStore'
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
    useTaxonStore.setState({
      taxons: [],
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
    }, { timeout: 3000 })
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
    }, { timeout: 3000 })

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

  it('permite el flujo completo de 2 pasos: configurar ubicación y seleccionar especies iniciales', async () => {
    const user = userEvent.setup()
    vi.spyOn(geoService, 'getBrowserPosition').mockResolvedValue({
      latitude: -34.6,
      longitude: -58.4,
      elevation: 25,
    })

    render(<LocationSetupModal />)

    // Paso 1: Configurar ubicación
    expect(screen.getByText(/Configura la ubicación de tu cultivo/i)).toBeInTheDocument()
    const gpsBtn = screen.getByRole('button', { name: /Detectar mi ubicación actual/i })
    await user.click(gpsBtn)

    // Al guardar ubicación pasa automáticamente al Paso 2
    await waitFor(() => {
      expect(useAgroClimateStore.getState().farmCoordinates).toMatchObject({
        latitude: -34.6,
        longitude: -58.4,
      })
    })

    await waitFor(() => {
      expect(screen.getByText(/Selecciona las especies con las que vas a trabajar/i)).toBeInTheDocument()
    })

    // Paso 2: Selección de especies rápidas (Tomate y Naranjo Dulce)
    const tomateChip = screen.getByRole('button', { name: /Tomate/i })
    await user.click(tomateChip)

    const naranjoChip = screen.getByRole('button', { name: /Naranjo Dulce/i })
    await user.click(naranjoChip)

    // Verificar en el store de taxones
    const stateTaxons = useTaxonStore.getState().taxons
    expect(stateTaxons.some((t) => t.genus === 'Solanum' && t.species === 'lycopersicum')).toBe(true)
    expect(stateTaxons.some((t) => t.genus === 'Citrus' && t.species === 'sinensis')).toBe(true)

    // Finalizar en el botón primario
    const finishBtn = screen.getByRole('button', { name: /Comenzar en el Mapa Isométrico/i })
    await user.click(finishBtn)

    // El wizard debe cerrarse
    await waitFor(() => {
      expect(screen.queryByText(/Selecciona las especies con las que vas a trabajar/i)).not.toBeInTheDocument()
    })
  })
})
