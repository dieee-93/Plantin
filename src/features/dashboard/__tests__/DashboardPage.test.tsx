import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from '../DashboardPage'
import { useAccessionStore } from '@/store/accessionStore'
import { useIndividualStore } from '@/store/individualStore'
import { useTaxonStore } from '@/store/taxonStore'
import { useSeedLotStore } from '@/store/seedLotStore'
import { useLocationStore } from '@/store/locationStore'
import { useObservationStore } from '@/store/observationStore'
import { useCrossingStore } from '@/store/crossingStore'
import { useAgroClimateStore } from '@/store/agroClimateStore'
import { BUENOS_AIRES } from '@/domain/agroclimate/__tests__/fixtures'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('DashboardPage (HUD Design System)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useLocationStore.setState({
      locations: [
        {
          id: 'loc-1',
          name: 'Invernadero Principal',
          type: 'greenhouse',
          description: 'Invernadero de 50 m2',
          capacity: 50,
          createdAt: '2026-01-01',
        },
      ],
    })

    useTaxonStore.setState({
      taxons: [
        {
          id: 'tax-1',
          family: 'Solanaceae',
          genus: 'Solanum',
          species: 'lycopersicum',
          commonName: 'Tomate',
          cropCode: 'TOM',
        },
      ],
    })

    useAccessionStore.setState({
      accessions: [
        {
          id: 'acc-1',
          accessionNumber: 'TOM-2026-001',
          cultivarName: 'Platense',
          taxonId: 'tax-1',
          acquisitionSource: 'cultivated',
          acquisitionDate: '2026-01-15',
        },
        {
          id: 'acc-2',
          accessionNumber: 'TOM-2026-002',
          cultivarName: 'Línea F1 Mejorada',
          taxonId: 'tax-1',
          acquisitionSource: 'breeding',
          acquisitionDate: '2026-02-01',
        },
      ],
    })

    useSeedLotStore.setState({
      seedLots: [
        {
          id: 'lot-1',
          accessionId: 'acc-1',
          lotCode: 'TOM-2026-001-L1',
          currentCount: 150,
          status: 'active',
          storageLocation: 'Heladera Semillas',
        },
      ],
    })

    useIndividualStore.setState({
      individuals: [
        {
          id: 'ind-1',
          accessionId: 'acc-1',
          label: 'TOM-001-01',
          status: 'active',
        },
      ],
    })

    useObservationStore.setState({
      observations: [
        {
          id: 'obs-1',
          individualId: 'ind-1',
          date: '2026-03-01',
          traitId: 'bbch_scale',
          value: 65,
        },
      ],
    })

    useCrossingStore.setState({
      crossings: [
        {
          id: 'cross-1',
          crossName: 'CR-2026-001',
          maternalParentId: 'ind-1',
          paternalParentId: 'ind-2',
          crossType: 'biparental',
          successStatus: 'successful',
        },
      ],
    })

    useAgroClimateStore.setState({
      farmCoordinates: {
        latitude: -34.6,
        longitude: -58.4,
        elevation: 25,
        name: 'Palermo, Buenos Aires, Argentina',
      },
      currentClimate: BUENOS_AIRES,
      currentWeather: {
        temperature: 22.5,
        apparentTemperature: 23.0,
        humidity: 60,
        windSpeed: 14,
        precipitation: 0,
        weatherCode: 0,
        conditionLabel: 'Cielo despejado',
        isDay: true,
        fetchedAt: '2026-10-21T15:00:00Z',
      },
      isLoadingClimate: false,
    })
  })

  it('renders clean HUD header with agronomic greeting, system status badge and real-time telemetry', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/HUD AGRONÓMICO · SISTEMA ACTIVO/i)).toBeInTheDocument()
    expect(screen.getByText(/Operador Agronómico/i)).toBeInTheDocument()
    expect(screen.getByText(/Palermo, Buenos Aires, Argentina/i)).toBeInTheDocument()
    expect(screen.getAllByText(/22.5°C/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Cielo despejado/i).length).toBeGreaterThan(0)
  })

  it('renders the 7 interactive workflow stat cards (Paso 1 to Paso 4)', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    // Step badges
    expect(screen.getByText('Paso 1')).toBeInTheDocument()
    expect(screen.getByText('Paso 2')).toBeInTheDocument()
    expect(screen.getByText('Paso 2b')).toBeInTheDocument()
    expect(screen.getByText('Paso 2c')).toBeInTheDocument()
    expect(screen.getByText('Paso 3')).toBeInTheDocument()
    expect(screen.getByText('Paso 3b')).toBeInTheDocument()
    expect(screen.getByText('Paso 4')).toBeInTheDocument()

    // Metric labels
    expect(screen.getByText('Mis Espacios')).toBeInTheDocument()
    expect(screen.getAllByText(/Variedades \(Accesiones\)/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Lotes de Semillas').length).toBeGreaterThan(0)
    expect(screen.getByText('Catálogo Botánico')).toBeInTheDocument()
    expect(screen.getAllByText('Cultivo Activo').length).toBeGreaterThan(0)
    expect(screen.getByText('Fenotipado')).toBeInTheDocument()
    expect(screen.getByText('Cruzas y F1')).toBeInTheDocument()
  })

  it('navigates to corresponding sections when clicking stat cards', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    // Click Paso 1: Mis Espacios
    const espaciosCard = screen.getByText('Mis Espacios').closest('div[class*="group"]')
    expect(espaciosCard).toBeTruthy()
    if (espaciosCard) {
      await user.click(espaciosCard)
      expect(mockNavigate).toHaveBeenCalledWith('/locations')
    }

    // Click Paso 4: Cruzas y F1
    const cruzasCard = screen.getByText('Cruzas y F1').closest('div[class*="group"]')
    expect(cruzasCard).toBeTruthy()
    if (cruzasCard) {
      await user.click(cruzasCard)
      expect(mockNavigate).toHaveBeenCalledWith('/breeding')
    }
  })

  it('renders WorkflowPipeline with 4 steps and SemanticGlossaryBanner', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/Flujo del Ciclo de Cultivo y Fitomejoramiento/i)).toBeInTheDocument()
    expect(screen.getByText('PASO 01')).toBeInTheDocument()
    expect(screen.getByText('PASO 02')).toBeInTheDocument()
    expect(screen.getByText('PASO 03')).toBeInTheDocument()
    expect(screen.getByText('PASO 04')).toBeInTheDocument()

    expect(screen.getByText(/Glosario Unificado de Conceptos/i)).toBeInTheDocument()
    expect(screen.getByText('Especie (Catálogo Botánico)')).toBeInTheDocument()
    expect(screen.getByText('Variedad (Accesión)')).toBeInTheDocument()
    expect(screen.getAllByText('Lote de Semillas').length).toBeGreaterThan(0)
    expect(screen.getByText('Planta (Individuo)')).toBeInTheDocument()
  })

  it('renders bottom distribution cards: IndividualStatusChart, TopTaxa, RecentAccessions', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Estado de Plantas (Individuos)')).toBeInTheDocument()
    expect(screen.getByText('Activas en cultivo')).toBeInTheDocument()

    expect(screen.getByText('Variedades por Especie Botánica')).toBeInTheDocument()
    expect(screen.getAllByText(/Solanum lycopersicum/i).length).toBeGreaterThan(0)

    expect(screen.getByText('Variedades Recientes')).toBeInTheDocument()
    expect(screen.getAllByText(/TOM-2026-001/i).length).toBeGreaterThan(0)
  })
})
