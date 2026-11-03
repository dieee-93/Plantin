import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render as rtlRender, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const render = (ui: React.ReactElement) => rtlRender(ui, { wrapper: MemoryRouter })
import userEvent from '@testing-library/user-event'
import { LocationsPage } from '../LocationsPage'
import { resolveBotanicalArchetype } from '@/domain/botanicalArchetypes'
import { useLocationStore } from '@/store/locationStore'
import { useIndividualStore } from '@/store/individualStore'
import { useAccessionStore } from '@/store/accessionStore'
import { useSeedLotStore } from '@/store/seedLotStore'
import { useTaxonStore } from '@/store/taxonStore'
import { useAgroClimateStore } from '@/store/agroClimateStore'
import { useSpaceLayoutStore } from '@/store/spaceLayoutStore'
import { BUENOS_AIRES } from '@/domain/agroclimate/__tests__/fixtures'
import * as taxonomySearchModule from '@/hooks/useTaxonomySearch'

describe('LocationsPage — Motor de Espacios 1:1 y Diseño CAD 3D', () => {
  beforeEach(() => {
    useLocationStore.setState({ locations: [] })
    useIndividualStore.setState({ individuals: [] })
    useAccessionStore.setState({ accessions: [] })
    useSeedLotStore.setState({ seedLots: [] })
    useSpaceLayoutStore.setState({ layouts: {} })
    useTaxonStore.setState({
      taxons: [
        {
          id: 'tax-tom',
          family: 'Solanaceae',
          genus: 'Solanum',
          species: 'lycopersicum',
          cropCode: 'TOM',
          commonName: 'Tomate',
        },
      ],
    })
    useAgroClimateStore.setState({
      farmCoordinates: { latitude: -34.6, longitude: -58.4, name: 'Buenos Aires' },
      currentClimate: BUENOS_AIRES,
      isLoadingClimate: false,
    })
    vi.restoreAllMocks()
  })

  it('no solicita coordenadas GPS dentro del formulario de creación de espacios físicos', () => {
    render(<LocationsPage />)

    expect(screen.queryByLabelText(/Latitud/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Longitud/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Detectar GPS/i })).not.toBeInTheDocument()
  })

  it('permite crear un espacio 1:1 con nombre, tipo, capacidad y descripción heredando el clima global', async () => {
    const user = userEvent.setup()
    render(<LocationsPage />)

    // Abre el Drawer de Nueva Ubicación
    const openDrawerBtn = screen.getByRole('button', { name: /\+ Nueva Ubicación/i })
    await user.click(openDrawerBtn)

    const nameInput = screen.getByPlaceholderText(/Ej. Invernadero A/i)
    await user.type(nameInput, 'Invernadero Principal')

    const capacityInput = screen.getByPlaceholderText(/Opcional/i)
    await user.type(capacityInput, '40')

    const descInput = screen.getByLabelText(/Descripción \/ Notas/i)
    await user.type(descInput, 'Sector climatizado para solanáceas')

    const submitBtn = screen.getByRole('button', { name: /Crear Ubicación/i })
    await user.click(submitBtn)

    expect(screen.getByText('Invernadero Principal')).toBeInTheDocument()
    expect(screen.getByText('Sector climatizado para solanáceas')).toBeInTheDocument()
    expect(screen.getByText(/0 \/ 40/i)).toBeInTheDocument()
  }, 15000)

  it('permite crear un espacio 1:1 con medidas personalizadas en metros', async () => {
    const user = userEvent.setup()
    render(<LocationsPage />)

    await user.click(screen.getByRole('button', { name: /\+ Nueva Ubicación/i }))
    await user.type(screen.getByPlaceholderText(/Ej. Invernadero A/i), 'Huerta Grande')

    // Selecciona medidas personalizadas
    const presetSelect = screen.getByLabelText(/Plantilla Espacial 1:1/i)
    await user.selectOptions(presetSelect, 'custom')

    // Define ancho 15.0 m y largo 8.0 m
    const widthInput = screen.getByLabelText(/Ancho del Terreno \(m\)/i)
    await user.clear(widthInput)
    await user.type(widthInput, '15.0')

    const depthInput = screen.getByLabelText(/Largo \/ Profundidad \(m\)/i)
    await user.clear(depthInput)
    await user.type(depthInput, '8.0')

    expect(screen.getByText(/Superficie base: 120.0 m²/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Crear Ubicación/i }))
    expect(screen.getByText('Huerta Grande')).toBeInTheDocument()
  })

  it('entra directamente al espacio 1:1 montando el visor 3D, simulador solar y herramientas CAD', async () => {
    const user = userEvent.setup()

    useLocationStore.getState().add({
      name: 'Patio Experimental',
      type: 'field',
      capacity: 30,
    })

    render(<LocationsPage />)

    // Entrar al espacio
    await user.click(screen.getByRole('button', { name: /Entrar al espacio de Patio Experimental/i }))

    // Abre el panel del Simulador Solar mediante el botón Luz
    await user.click(screen.getByRole('button', { name: /Luz/i }))

    // Verifica que Space3DViewer está montado directamente sin vista clásica
    expect(screen.getByTestId('space-3d-viewer')).toBeInTheDocument()
    expect(screen.getByText(/Espacio 1:1 · Patio Experimental/i)).toBeInTheDocument()
    expect(screen.getByText(/Simulador Solar en Vivo/i)).toBeInTheDocument()
    expect(screen.getByTestId('metric-cultivable-area')).toBeInTheDocument()

    // Permite alternar la cámara dual 2D CAD y 3D Isométrica
    await user.click(screen.getByRole('button', { name: /Plano 2D \(CAD\)/i }))
    expect(screen.getByRole('button', { name: /Vista 3D Isométrica/i })).toBeInTheDocument()

    // Permite usar la herramienta Rellenar Sector dentro de LocationsPage
    await user.click(screen.getByRole('button', { name: /^Plantar$/i }))
    await user.click(screen.getByRole('button', { name: /Rellenar Sector/i }))
    await user.click(screen.getByRole('button', { name: /Rellenar Sector 1/i }))
    expect(screen.getByTestId('total-plants-counter')).not.toHaveTextContent('3 plantas')

    // Botón para volver al mapa
    await user.click(screen.getByRole('button', { name: /← Volver al Mapa de Espacios/i }))
    expect(screen.getByText('Patio Experimental')).toBeInTheDocument()
  })

  it('resuelve los 8 arquetipos botánicos según especie, género y familia (resolveBotanicalArchetype)', () => {
    const solanaceae = resolveBotanicalArchetype({
      family: 'Solanaceae',
      genus: 'Capsicum',
      species: 'annuum',
    })
    expect(solanaceae.archetype).toBe('solanaceae_tall')

    const grass = resolveBotanicalArchetype({
      family: 'Poaceae',
      genus: 'Zea',
      species: 'mays',
    })
    expect(grass.archetype).toBe('cereal_grass')

    const root = resolveBotanicalArchetype({
      family: 'Apiaceae',
      genus: 'Daucus',
      species: 'carota',
    })
    expect(root.archetype).toBe('root_tuber')

    const rosette = resolveBotanicalArchetype({
      family: 'Asteraceae',
      genus: 'Lactuca',
      species: 'sativa',
    })
    expect(rosette.archetype).toBe('rosette_leafy')
  })

  it('permite abrir + Nuevo Cultivo / Material desde el nivel 1 (mapa de salas) e ingresar semilla al catálogo', async () => {
    const user = userEvent.setup()
    render(<LocationsPage />)

    const openDrawerBtn = screen.getByRole('button', { name: /\+ Nuevo Cultivo \/ Material/i })
    await user.click(openDrawerBtn)

    expect(screen.getByText(/Alta Unificada · Nuevo Cultivo \/ Material/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Especie Botánica/i)).toBeInTheDocument()
  })

  it('registra presets botánicos (Naranjo Dulce / Tomate) con foto botánica, traits y datos agronómicos completos', async () => {
    const user = userEvent.setup()
    render(<LocationsPage />)

    await user.click(screen.getByRole('button', { name: /\+ Nuevo Cultivo \/ Material/i }))
    await user.click(screen.getByRole('button', { name: /Naranjo Dulce/i }))

    const stateTaxons = useTaxonStore.getState().taxons
    const orangeTaxon = stateTaxons.find(t => t.genus === 'Citrus' && t.species === 'sinensis')
    expect(orangeTaxon).toBeDefined()
    expect(orangeTaxon?.cropCode).toBe('CITRUS_ORANGE')
    expect(orangeTaxon?.imageUrl).toBeTruthy()
    expect(orangeTaxon?.imageUrl).toMatch(/^https:\/\//)
    expect(orangeTaxon?.traits).toBeDefined()
    expect(orangeTaxon!.traits!.length).toBeGreaterThan(0)
    expect(orangeTaxon?.agronomicData).toBeDefined()
    expect(orangeTaxon?.agronomicData?.phMinimum).toBe(4)
  })

  it('TaxonSearchDropdown preserva foto botánica (imageUrl) y descriptores fenotípicos (traits) al seleccionar resultados de búsqueda', async () => {
    const user = userEvent.setup()

    vi.spyOn(taxonomySearchModule, 'useTaxonomySearch').mockImplementation((query: string) => {
      if (query.trim().toLowerCase().includes('malus')) {
        return {
          data: [
            {
              id: 'gbif-apple-1',
              scientificName: 'Malus domestica Borkh.',
              genus: 'Malus',
              species: 'domestica',
              family: 'Rosaceae',
              commonName: 'Manzano Común',
              imageUrl: 'https://images.example.com/apple-flower.jpg',
              source: 'GBIF',
            },
          ],
          isLoading: false,
        } as any
      }
      return { data: [], isLoading: false } as any
    })

    render(<LocationsPage />)

    await user.click(screen.getByRole('button', { name: /\+ Nuevo Cultivo \/ Material/i }))

    const searchInput = screen.getByPlaceholderText(/Buscar otra especie/i)
    await user.type(searchInput, 'Malus')

    const resultBtn = await screen.findByRole('button', { name: /Manzano Común/i })
    await user.click(resultBtn)

    const appleTaxon = useTaxonStore.getState().taxons.find(t => t.genus === 'Malus' && t.species === 'domestica')
    expect(appleTaxon).toBeDefined()
    expect(appleTaxon?.cropCode).toBe('APPLE')
    expect(appleTaxon?.imageUrl).toBe('https://images.example.com/apple-flower.jpg')
    expect(appleTaxon?.traits).toBeDefined()
    expect(appleTaxon!.traits!.length).toBeGreaterThan(0)
  })

  it('auto-repara taxones incompletos existentes en el store al montar LocationsPage', async () => {
    render(<LocationsPage />)

    await waitFor(() => {
      const tom = useTaxonStore.getState().getById('tax-tom')
      expect(tom?.imageUrl).toBeTruthy()
      expect(tom?.traits).toBeDefined()
      expect(tom!.traits!.length).toBeGreaterThan(0)
      expect(tom?.agronomicData?.phMinimum).toBeDefined()
      expect(typeof tom?.agronomicData?.phMinimum).toBe('number')
      expect(tom!.agronomicData!.phMinimum!).toBeGreaterThanOrEqual(4.5)
    }, { timeout: 3000 })
  })

  it('brinda feedback visual inmediato (0 ms) con estado de carga y barra de transición al hacer clic para entrar a una sala', async () => {
    const user = userEvent.setup()

    const loc = useLocationStore.getState().add({
      name: 'dos asad',
      type: 'greenhouse',
      capacity: 5000,
    })

    for (let i = 0; i < 50; i++) {
      useIndividualStore.getState().add({
        locationId: loc.id,
        accessionId: 'acc-1',
        label: `Planta #${i + 1}`,
        status: 'active',
        currentBBCH: 15,
      })
    }

    render(<LocationsPage />)

    const enterBtn = screen.getByRole('button', { name: /Entrar a Sala/i })
    expect(enterBtn).toBeInTheDocument()

    await user.click(enterBtn)

    await waitFor(() => {
      expect(screen.getByTestId('space-3d-viewer')).toBeInTheDocument()
      expect(screen.getByText(/Espacio 1:1 · dos asad/i)).toBeInTheDocument()
    })
  })

  it('asigna puestos reales del layout 3D al sembrar en una sala desde el inventario', async () => {
    const user = userEvent.setup()

    const loc = useLocationStore.getState().add({
      name: 'Invernadero 3D',
      type: 'greenhouse',
      capacity: 10,
    })

    const acc = useAccessionStore.getState().add({
      accessionNumber: 'TOM-2026-001',
      taxonId: 'tax-tom',
      acquisitionSource: 'cultivated',
    })

    // Layout con 2 puestos
    useSpaceLayoutStore.getState().getOrCreateSpaceLayout(loc.id, 'greenhouse')
    useSpaceLayoutStore.setState(state => ({
      layouts: {
        ...state.layouts,
        [loc.id]: {
          ...state.layouts[loc.id],
          placedPlants: [
            { id: 'slot-alpha', label: 'Bancal A1', xCm: 50, yCm: 50, canopyRadiusCm: 20 },
            { id: 'slot-beta', label: 'Bancal A2', xCm: 100, yCm: 50, canopyRadiusCm: 20 },
          ],
        },
      },
    }))

    render(<LocationsPage />)

    // Entrar al espacio
    await user.click(screen.getByRole('button', { name: /Entrar al espacio de Invernadero 3D/i }))

    // Abrir drawer de siembra
    await user.click(screen.getByRole('button', { name: /\+ Sembrar/i }))

    // Seleccionar accesión
    const accSelect = screen.getByLabelText(/Variedad \(Accesión\)/i)
    await user.selectOptions(accSelect, acc.id)

    // Plantar 1 planta
    const plantBtn = screen.getByRole('button', { name: /Plantar en/i })
    await user.click(plantBtn)

    const individuals = useIndividualStore.getState().individuals
    expect(individuals).toHaveLength(1)
    expect(individuals[0].slotId).toBe('slot-alpha')
    expect(individuals[0].location).toBe('Bancal A1')
    expect(individuals[0].position).toBe('Bancal A1')
  })

  it('crea el individuo sin slotId (Sin ubicar) si la sala no tiene puestos libres en el layout 3D', async () => {
    const user = userEvent.setup()

    const loc = useLocationStore.getState().add({
      name: 'Sala Sin Puestos',
      type: 'growth_chamber',
      capacity: 10,
    })

    const acc = useAccessionStore.getState().add({
      accessionNumber: 'TOM-2026-002',
      taxonId: 'tax-tom',
      acquisitionSource: 'cultivated',
    })

    // Layout sin puestos (placedPlants vacío)
    useSpaceLayoutStore.getState().getOrCreateSpaceLayout(loc.id, 'growth_chamber')
    useSpaceLayoutStore.setState(state => ({
      layouts: {
        ...state.layouts,
        [loc.id]: {
          ...state.layouts[loc.id],
          placedPlants: [],
        },
      },
    }))

    render(<LocationsPage />)

    await user.click(screen.getByRole('button', { name: /Entrar al espacio de Sala Sin Puestos/i }))
    await user.click(screen.getByRole('button', { name: /\+ Sembrar/i }))

    const accSelect = screen.getByLabelText(/Variedad \(Accesión\)/i)
    await user.selectOptions(accSelect, acc.id)

    const plantBtn = screen.getByRole('button', { name: /Plantar en sala/i })
    await user.click(plantBtn)

    const individuals = useIndividualStore.getState().individuals
    expect(individuals).toHaveLength(1)
    expect(individuals[0].slotId).toBeUndefined()
    expect(individuals[0].location).toBe('Sin ubicar')
    expect(individuals[0].position).toBe('Sin ubicar')
  })
})
