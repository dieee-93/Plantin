import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render as rtlRender, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const render = (ui: React.ReactElement) => rtlRender(ui, { wrapper: MemoryRouter })
import userEvent from '@testing-library/user-event'
import { LocationsPage } from '../LocationsPage'
import { resolveBotanicalArchetype } from '../isometric/botanicalArchetypes'
import { useLocationStore } from '@/store/locationStore'
import { useIndividualStore } from '@/store/individualStore'
import { useAccessionStore } from '@/store/accessionStore'
import { useSeedLotStore } from '@/store/seedLotStore'
import { useTaxonStore } from '@/store/taxonStore'
import { useAgroClimateStore } from '@/store/agroClimateStore'
import { useRoomLayoutStore } from '@/store/roomLayoutStore'
import { BUENOS_AIRES } from '@/domain/agroclimate/__tests__/fixtures'
import * as taxonomySearchModule from '@/hooks/useTaxonomySearch'

describe('LocationsPage — Interfaz Gráfica Isométrica 2.5D', () => {
  beforeEach(() => {
    useLocationStore.setState({ locations: [] })
    useIndividualStore.setState({ individuals: [] })
    useAccessionStore.setState({ accessions: [] })
    useSeedLotStore.setState({ seedLots: [] })
    useRoomLayoutStore.setState({ layouts: {} })
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

  it('permite crear un espacio físico con nombre, tipo, capacidad y descripción heredando el clima global', async () => {
    const user = userEvent.setup()
    render(<LocationsPage />)

    // Abre el Drawer contextual de Nueva Ubicación
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

  it('Interacciones 1 y 2: entra al interior isométrico de una sala, siembra al hacer clic en una celda vacía y abre el Inspector al hacer clic en la planta', async () => {
    const user = userEvent.setup()

    const room = useLocationStore.getState().add({
      name: 'Invernadero Norte',
      type: 'greenhouse',
      capacity: 12,
    })
    const acc = useAccessionStore.getState().add({
      accessionNumber: 'TOM-2026-001',
      taxonId: 'tax-tom',
      acquisitionSource: 'research',
    })
    const lot = useSeedLotStore.getState().add({
      accessionId: acc.id,
      lotCode: 'TOM-2026-001-L1',
      initialCount: 15,
    })

    render(<LocationsPage />)

    // Drill-down al interior isométrico de la sala
    const enterBtn = screen.getByRole('button', { name: /Entrar a vista isométrica de Invernadero Norte/i })
    await user.click(enterBtn)

    expect(screen.getByRole('region', { name: /Plano isométrico interior de Invernadero Norte/i })).toBeInTheDocument()

    // Interacción 1: Clic en celda vacía B-02 abre la barra contextual sin abrir el Drawer
    const emptyCellB02 = screen.getByRole('button', { name: /Celda vacía B-02/i })
    await user.click(emptyCellB02)

    expect(screen.getByText(/Slot Vacío · B-02/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Celda en la grilla/i)).not.toBeInTheDocument()

    // Clic en "Sembrar de Inventario" abre el Drawer pre-cargado con B-02
    await user.click(screen.getByRole('button', { name: /Sembrar de Inventario en slot/i }))
    expect(screen.getByLabelText(/Celda en la grilla/i)).toHaveValue('B-02')

    await user.selectOptions(screen.getByLabelText(/Variedad a sembrar/i), acc.id)
    await user.selectOptions(screen.getByLabelText(/Lote de Semillas en sala/i), lot.id)
    await user.click(screen.getByRole('button', { name: /Plantar en B-02/i }))

    // Verifica que la planta se creó en B-02 y descontó 1 semilla del lote
    const createdPlants = useIndividualStore.getState().individuals
    expect(createdPlants).toHaveLength(1)
    expect(createdPlants[0].locationId).toBe(room.id)
    expect(createdPlants[0].position).toBe('B-02')
    expect(useSeedLotStore.getState().getById(lot.id)?.currentCount).toBe(14)

    // Interacción 2: El Inspector in-situ se abre y permite actualizar el BBCH en vivo
    await user.click(screen.getByRole('button', { name: /65 · Floración/i }))
    expect(useIndividualStore.getState().getById(createdPlants[0].id)?.currentBBCH).toBe(65)
  }, 15000)

  it('Interacciones 3 y 4: permite sembrar arrastrando semillas (Drag & Drop) a una celda vacía y trasplantar plantas arrastrándolas a otra celda o sala', () => {
    const roomA = useLocationStore.getState().add({
      name: 'Cámara 1',
      type: 'growth_chamber',
      capacity: 9,
    })
    const roomB = useLocationStore.getState().add({
      name: 'Invernadero B',
      type: 'greenhouse',
      capacity: 9,
    })
    const acc = useAccessionStore.getState().add({
      accessionNumber: 'TOM-2026-009',
      taxonId: 'tax-tom',
      acquisitionSource: 'breeding',
    })
    const lot = useSeedLotStore.getState().add({
      accessionId: acc.id,
      lotCode: 'TOM-009-L1',
      initialCount: 25,
    })
    const plant = useIndividualStore.getState().add({
      accessionId: acc.id,
      label: 'TOM-2026-009 #01',
      locationId: roomA.id,
      position: 'A-01',
      location: 'A-01',
      currentBBCH: 30,
    })

    render(<LocationsPage />)

    // Entrar a Cámara 1
    fireEvent.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Cámara 1/i }))

    // Interacción 3: Drag & Drop de Semilla desde la bandeja hacia la celda vacía A-03
    const emptyCellA03 = screen.getByRole('button', { name: /Celda vacía A-03/i })
    const seedPayload = JSON.stringify({
      kind: 'SEED',
      accessionId: acc.id,
      seedLotId: lot.id,
    })
    fireEvent.drop(emptyCellA03, {
      dataTransfer: {
        getData: () => seedPayload,
      },
    })

    // Verifica que el formulario lateral se pre-cargó con A-03, la accesión y el lote
    expect(screen.getByLabelText(/Celda en la grilla/i)).toHaveValue('A-03')
    expect(screen.getByLabelText(/Variedad a sembrar/i)).toHaveValue(acc.id)
    expect(screen.getByLabelText(/Lote de Semillas en sala/i)).toHaveValue(lot.id)

    // Interacción 4a: Drag & Drop de la planta existente hacia otra celda vacía (B-02)
    const emptyCellB02 = screen.getByRole('button', { name: /Celda vacía B-02/i })
    const plantPayload = JSON.stringify({
      kind: 'PLANT',
      individualId: plant.id,
    })
    fireEvent.drop(emptyCellB02, {
      dataTransfer: {
        getData: () => plantPayload,
      },
    })

    expect(useIndividualStore.getState().getById(plant.id)?.position).toBe('B-02')

    // Interacción 4b: Drag & Drop de la planta hacia el chip de otra sala (Invernadero B)
    const toggleRoomsBtn = screen.getByRole('button', { name: /Alternar barra de otras salas/i })
    if (toggleRoomsBtn.getAttribute('aria-expanded') !== 'true') {
      fireEvent.click(toggleRoomsBtn)
    }
    const targetRoomChip = screen.getByRole('button', { name: /Sala destino Invernadero B/i })
    fireEvent.drop(targetRoomChip, {
      dataTransfer: {
        getData: () => plantPayload,
      },
    })

    expect(useIndividualStore.getState().getById(plant.id)?.locationId).toBe(roomB.id)
  })

  it('resuelve los 8 arquetipos botánicos según especie, género y familia (resolveBotanicalArchetype)', () => {
    expect(resolveBotanicalArchetype({ genus: 'Solanum', species: 'lycopersicum', family: 'Solanaceae' }).archetype).toBe('solanaceae_tall')
    expect(resolveBotanicalArchetype({ genus: 'Zea', species: 'mays', family: 'Poaceae' }).archetype).toBe('cereal_grass')
    expect(resolveBotanicalArchetype({ genus: 'Lactuca', species: 'sativa', family: 'Asteraceae' }).archetype).toBe('rosette_leafy')
    expect(resolveBotanicalArchetype({ genus: 'Daucus', species: 'carota', family: 'Apiaceae' }).archetype).toBe('root_tuber')
    expect(resolveBotanicalArchetype({ genus: 'Helianthus', species: 'annuus', family: 'Asteraceae' }).archetype).toBe('heliotropo_tall')
    expect(resolveBotanicalArchetype({ genus: 'Cannabis', species: 'sativa', family: 'Cannabaceae' }).archetype).toBe('palmate_cane')
    expect(resolveBotanicalArchetype({ genus: 'Phaseolus', species: 'vulgaris', family: 'Fabaceae' }).archetype).toBe('vine_climber')
    expect(resolveBotanicalArchetype({ genus: 'Malus', species: 'domestica', family: 'Rosaceae' }).archetype).toBe('woody_perennial')
  })

  it('renderiza arquetipos específicos por especie, escenografía de Campo Abierto sin paredes, lentes visuales, arcos de pedigrí y filtro por especie', async () => {
    const user = userEvent.setup()

    const maizeTaxon = useTaxonStore.getState().add({
      family: 'Poaceae',
      genus: 'Zea',
      species: 'mays',
      cropCode: 'MAI',
      commonName: 'Maíz',
    })
    const sunflowerTaxon = useTaxonStore.getState().add({
      family: 'Asteraceae',
      genus: 'Helianthus',
      species: 'annuus',
      cropCode: 'SUN_OIL',
      commonName: 'Girasol',
    })

    const fieldLoc = useLocationStore.getState().add({
      name: 'Parcela Experimental Sur',
      type: 'field',
      rows: 3,
      cols: 4,
    })

    const accMaize = useAccessionStore.getState().add({
      accessionNumber: 'MAI-2026-001',
      taxonId: maizeTaxon.id,
      acquisitionSource: 'cultivated',
    })
    const accSun = useAccessionStore.getState().add({
      accessionNumber: 'SUN-2026-001',
      taxonId: sunflowerTaxon.id,
      acquisitionSource: 'cultivated',
    })

    const motherMaize = useIndividualStore.getState().add({
      accessionId: accMaize.id,
      label: 'MAI-001 Madre',
      locationId: fieldLoc.id,
      position: 'A-01',
      location: 'A-01',
      currentBBCH: 75,
      generation: 'P1',
    })

    useIndividualStore.getState().add({
      accessionId: accMaize.id,
      label: 'MAI-001 Hijo F1',
      locationId: fieldLoc.id,
      position: 'A-02',
      location: 'A-02',
      currentBBCH: 35,
      generation: 'F1',
      maternalParentId: motherMaize.id,
    })

    useIndividualStore.getState().add({
      accessionId: accSun.id,
      label: 'SUN-001 #01',
      locationId: fieldLoc.id,
      position: 'B-01',
      location: 'B-01',
      currentBBCH: 65,
    })

    const { container } = render(<LocationsPage />)

    // En Nivel 1 muestra el resumen de especies cultivadas y la grilla configurada 3x4
    expect(screen.getByText(/Grilla 3×4/i)).toBeInTheDocument()
    expect(screen.getByText(/Maíz \(2\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Girasol \(1\)/i)).toBeInTheDocument()

    // Entrar a la Parcela Experimental Sur
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Parcela Experimental Sur/i }))

    // Verifica que la escenografía sea de campo abierto (cerco y camellones) y contenedores de suelo ('field')
    expect(container.querySelector('[data-scenery="open-field-fence"]')).toBeInTheDocument()
    expect(container.querySelector('[data-scenery="field-ridges"]')).toBeInTheDocument()
    expect(container.querySelector('[data-archetype="cereal_grass"]')).toBeInTheDocument()
    expect(container.querySelector('[data-archetype="heliotropo_tall"]')).toBeInTheDocument()

    // Cambiar al Lente Genético y verificar que se dibuja el arco de pedigrí entre Madre e Hijo F1
    const toggleLensBtn = screen.getByRole('button', { name: /Alternar barra de lentes analíticos/i })
    if (toggleLensBtn.getAttribute('aria-expanded') !== 'true') {
      await user.click(toggleLensBtn)
    }
    await user.click(screen.getByRole('button', { name: /Lente Genética \/ Pedigrí/i }))
    expect(container.querySelector('[data-pedigree-link="Madre"]')).toBeInTheDocument()

    // Filtrar por especie (Maíz) y verificar que el botón queda activo
    const filterMaizeBtn = screen.getByRole('button', { name: /Filtrar especie Maíz/i })
    await user.click(filterMaizeBtn)
    expect(filterMaizeBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('renderiza arquitectura 3D con espesor de muros, gradientes de iluminación, equipamiento ambiental y macetas vacías 3D volumétricas en salas e invernaderos', async () => {
    const user = userEvent.setup()

    useLocationStore.getState().add({
      name: 'Patio De Atras',
      type: 'room',
      rows: 4,
      cols: 5,
    })

    useLocationStore.getState().add({
      name: 'Invernadero Cristal',
      type: 'greenhouse',
      rows: 3,
      cols: 4,
    })

    const { container } = render(<LocationsPage />)

    // Nivel 1: Los edificios en el mapa de campus tienen definiciones de gradientes y volumen arquitectónico 3D
    expect(container.querySelectorAll('svg defs linearGradient').length).toBeGreaterThanOrEqual(4)
    expect(container.querySelector('[data-building-3d="room"]')).toBeInTheDocument()
    expect(container.querySelector('[data-building-3d="greenhouse"]')).toBeInTheDocument()

    // Entrar al interior de "Patio De Atras" (room)
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Patio De Atras/i }))

    // Nivel 2: Muros con espesor 3D (top cap + bisel lateral), equipamiento arquitectónico y macetas vacías 3D con sustrato
    expect(container.querySelector('[data-wall-volume="3d"]')).toBeInTheDocument()
    expect(container.querySelector('[data-room-fixture="room-equipment"]')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-empty-container="3d-pot"]').length).toBe(20)
  })

  it('renderiza Solanáceas (Tomate/Pimiento/Berenjena) con tutor de soporte, hojas compuestas, flor estrellada y frutos volumétricos con cáliz', async () => {
    const user = userEvent.setup()

    const pepperTaxon = useTaxonStore.getState().add({
      family: 'Solanaceae',
      genus: 'Capsicum',
      species: 'annuum',
      cropCode: 'PEPPER_HOT',
      commonName: 'Pimiento Morrón',
    })

    const room = useLocationStore.getState().add({
      name: 'Invernadero Pimientos',
      type: 'greenhouse',
      rows: 2,
      cols: 2,
    })

    const acc = useAccessionStore.getState().add({
      accessionNumber: 'PEP-2026-HQ',
      taxonId: pepperTaxon.id,
      acquisitionSource: 'breeding',
    })

    // Planta en floración (BBCH 65)
    useIndividualStore.getState().add({
      accessionId: acc.id,
      label: 'PEP Flor #01',
      locationId: room.id,
      position: 'A-01',
      location: 'A-01',
      currentBBCH: 65,
    })

    // Planta con frutos maduros (BBCH 85)
    useIndividualStore.getState().add({
      accessionId: acc.id,
      label: 'PEP Fruto #02',
      locationId: room.id,
      position: 'A-02',
      location: 'A-02',
      currentBBCH: 85,
    })

    const { container } = render(<LocationsPage />)

    // Entrar al Invernadero
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Invernadero Pimientos/i }))

    // Verifica tutor de cultivo, flor estrellada con estambres y frutos con cáliz/sépalos verdes
    expect(container.querySelectorAll('[data-botanical-feature="plant-stake"]').length).toBeGreaterThanOrEqual(1)
    expect(container.querySelector('[data-botanical-feature="star-flower"]')).toBeInTheDocument()
    expect(container.querySelector('[data-botanical-feature="calyx-fruit"]')).toBeInTheDocument()
  })

  it('renderiza Cereales/Gramíneas (Maíz/Trigo) con caña segmentada, nervadura central, panoja apical y mazorcas con chalas y sedas', async () => {
    const user = userEvent.setup()

    const maizeTaxon = useTaxonStore.getState().add({
      family: 'Poaceae',
      genus: 'Zea',
      species: 'mays',
      cropCode: 'MAI_SWEET',
      commonName: 'Maíz Criollo',
    })

    const room = useLocationStore.getState().add({
      name: 'Sector Cereales',
      type: 'greenhouse',
      rows: 2,
      cols: 2,
    })

    const acc = useAccessionStore.getState().add({
      accessionNumber: 'MAI-2026-HQ',
      taxonId: maizeTaxon.id,
      acquisitionSource: 'breeding',
    })

    // Maíz en floración / emisión de panoja (BBCH 65)
    useIndividualStore.getState().add({
      accessionId: acc.id,
      label: 'MAI Panoja #01',
      locationId: room.id,
      position: 'A-01',
      location: 'A-01',
      currentBBCH: 65,
    })

    // Maíz en llenado de granos / mazorcas con sedas (BBCH 85)
    useIndividualStore.getState().add({
      accessionId: acc.id,
      label: 'MAI Mazorca #02',
      locationId: room.id,
      position: 'A-02',
      location: 'A-02',
      currentBBCH: 85,
    })

    const { container } = render(<LocationsPage />)

    // Entrar al Sector Cereales
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Sector Cereales/i }))

    // Verifica caña segmentada con nervaduras, panoja apical y mazorcas con chalas/sedas
    expect(container.querySelectorAll('[data-botanical-feature="cereal-culm"]').length).toBeGreaterThanOrEqual(1)
    expect(container.querySelector('[data-botanical-feature="cereal-tassel"]')).toBeInTheDocument()
    expect(container.querySelector('[data-botanical-feature="maize-cob"]')).toBeInTheDocument()
  })

  it('renderiza Capítulo Solar/Girasol con tallo robusto, hojas acorazonadas, capítulo radiante y disco de aquenios maduros', async () => {
    const user = userEvent.setup()

    const sunTaxon = useTaxonStore.getState().add({
      family: 'Asteraceae',
      genus: 'Helianthus',
      species: 'annuus',
      cropCode: 'SUN',
      commonName: 'Girasol Gigante',
    })

    const room = useLocationStore.getState().add({
      name: 'Sector Oleaginosas',
      type: 'greenhouse',
      rows: 2,
      cols: 2,
    })

    const acc = useAccessionStore.getState().add({
      accessionNumber: 'SUN-2026-HQ',
      taxonId: sunTaxon.id,
      acquisitionSource: 'breeding',
    })

    // Girasol en floración (BBCH 65): capítulo erecto radiante con lígulas doradas
    useIndividualStore.getState().add({
      accessionId: acc.id,
      label: 'SUN Floración #01',
      locationId: room.id,
      position: 'A-01',
      location: 'A-01',
      currentBBCH: 65,
    })

    // Girasol en llenado de aquenios (BBCH 85): cabeza péndula con disco de semillas estriadas
    useIndividualStore.getState().add({
      accessionId: acc.id,
      label: 'SUN Semillas #02',
      locationId: room.id,
      position: 'A-02',
      location: 'A-02',
      currentBBCH: 85,
    })

    const { container } = render(<LocationsPage />)

    // Entrar al Sector Oleaginosas
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Sector Oleaginosas/i }))

    // Verifica tallo robusto con hojas cordadas, capítulo solar en floración y cabeza péndula de aquenios
    expect(container.querySelectorAll('[data-botanical-feature="sunflower-stem"]').length).toBeGreaterThanOrEqual(1)
    expect(container.querySelector('[data-botanical-feature="sunflower-head"]')).toBeInTheDocument()
    expect(container.querySelector('[data-botanical-feature="sunflower-seed-head"]')).toBeInTheDocument()
  })

  it('renderiza Roseta Foliar y Frutilla (Lactuca/Fragaria) con hojas onduladas superpuestas, flores blancas y frutillas colgantes con semillas', async () => {
    const user = userEvent.setup()

    const lettuceTaxon = useTaxonStore.getState().add({
      family: 'Asteraceae',
      genus: 'Lactuca',
      species: 'sativa',
      cropCode: 'SPINACH',
      commonName: 'Lechuga Mantecosa',
    })

    const strawberryTaxon = useTaxonStore.getState().add({
      family: 'Rosaceae',
      genus: 'Fragaria',
      species: 'ananassa',
      cropCode: 'BERRY',
      commonName: 'Frutilla Criolla',
    })

    const room = useLocationStore.getState().add({
      name: 'Sector Huerta y Bayas',
      type: 'greenhouse',
      rows: 2,
      cols: 2,
    })

    const accLettuce = useAccessionStore.getState().add({
      accessionNumber: 'LET-2026-HQ',
      taxonId: lettuceTaxon.id,
      acquisitionSource: 'breeding',
    })

    const accStraw = useAccessionStore.getState().add({
      accessionNumber: 'STR-2026-HQ',
      taxonId: strawberryTaxon.id,
      acquisitionSource: 'breeding',
    })

    // Lechuga en desarrollo foliar / roseta densa (BBCH 45)
    useIndividualStore.getState().add({
      accessionId: accLettuce.id,
      label: 'LET Mantecosa #01',
      locationId: room.id,
      position: 'A-01',
      location: 'A-01',
      currentBBCH: 45,
    })

    // Frutilla en fructificación con flores y bayas rojas colgantes (BBCH 75)
    useIndividualStore.getState().add({
      accessionId: accStraw.id,
      label: 'STR Albión #02',
      locationId: room.id,
      position: 'A-02',
      location: 'A-02',
      currentBBCH: 75,
    })

    const { container } = render(<LocationsPage />)

    // Entrar al Sector Huerta y Bayas
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Sector Huerta y Bayas/i }))

    // Verifica roseta de hojas onduladas, flor blanca de frutilla y frutos cónicos con semillas
    expect(container.querySelector('[data-botanical-feature="leafy-rosette"]')).toBeInTheDocument()
    expect(container.querySelector('[data-botanical-feature="strawberry-flower"]')).toBeInTheDocument()
    expect(container.querySelector('[data-botanical-feature="strawberry-berry"]')).toBeInTheDocument()
  })

  it('renderiza Raíces y Tubérculos (Zanahoria/Remolacha) con hombro de raíz emergente del sustrato, follaje plumoso y pecíolos púrpuras', async () => {
    const user = userEvent.setup()

    const carrotTaxon = useTaxonStore.getState().add({
      family: 'Apiaceae',
      genus: 'Daucus',
      species: 'carota',
      cropCode: 'CARROT_WILD',
      commonName: 'Zanahoria Chantenay',
    })

    const beetTaxon = useTaxonStore.getState().add({
      family: 'Amaranthaceae',
      genus: 'Beta',
      species: 'vulgaris',
      cropCode: 'RADISH',
      commonName: 'Remolacha Detroit',
    })

    const room = useLocationStore.getState().add({
      name: 'Sector Raíces',
      type: 'greenhouse',
      rows: 2,
      cols: 2,
    })

    const accCarrot = useAccessionStore.getState().add({
      accessionNumber: 'CAR-2026-HQ',
      taxonId: carrotTaxon.id,
      acquisitionSource: 'breeding',
    })

    const accBeet = useAccessionStore.getState().add({
      accessionNumber: 'BEE-2026-HQ',
      taxonId: beetTaxon.id,
      acquisitionSource: 'breeding',
    })

    // Zanahoria con hombro naranja y follaje plumoso (BBCH 45)
    useIndividualStore.getState().add({
      accessionId: accCarrot.id,
      label: 'CAR Chantenay #01',
      locationId: room.id,
      position: 'A-01',
      location: 'A-01',
      currentBBCH: 45,
    })

    // Remolacha con bulbo globular y pecíolos magenta (BBCH 48)
    useIndividualStore.getState().add({
      accessionId: accBeet.id,
      label: 'BEE Detroit #02',
      locationId: room.id,
      position: 'A-02',
      location: 'A-02',
      currentBBCH: 48,
    })

    const { container } = render(<LocationsPage />)

    // Entrar al Sector Raíces
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Sector Raíces/i }))

    // Verifica hombro de raíz emergente, follaje plumoso de zanahoria y hojas con venación magenta de remolacha
    expect(container.querySelectorAll('[data-botanical-feature="root-shoulder"]').length).toBeGreaterThanOrEqual(1)
    expect(container.querySelector('[data-botanical-feature="plumose-foliage"]')).toBeInTheDocument()
    expect(container.querySelector('[data-botanical-feature="beet-foliage"]')).toBeInTheDocument()
  })

  it('Ciclo TDD 1: entrar al Modo Diseñar preserva íntegramente las macetas y plantas existentes sin mostrar modales de sobrescritura', async () => {
    const user = userEvent.setup()

    const room = useLocationStore.getState().add({
      name: 'Invernadero Sur',
      type: 'greenhouse',
      rows: 3,
      cols: 3,
    })

    const acc = useAccessionStore.getState().add({
      accessionNumber: 'TOM-2026-SUR',
      taxonId: 'tax-tom',
      acquisitionSource: 'cultivated',
    })

    useIndividualStore.getState().add({
      accessionId: acc.id,
      label: 'TOM Sur #01',
      locationId: room.id,
      position: 'A-01',
      location: 'A-01',
      currentBBCH: 65,
    })

    const { container } = render(<LocationsPage />)

    // Entrar al Invernadero Sur
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Invernadero Sur/i }))

    // Verifica que en modo cultivo inicial se ven las 8 macetas vacías y la planta
    expect(container.querySelectorAll('[data-empty-container="3d-pot"]').length).toBe(8)

    // Activar Modo Diseñar en el dock inferior
    const designModeBtn = screen.getByRole('button', { name: /Modo Diseñar Espacio y Mobiliario/i })
    await user.click(designModeBtn)

    // El catálogo de diseño está presente y no hay ningún modal de "Espacio sin objetos"
    expect(screen.getByText('Contenedores')).toBeInTheDocument()
    expect(screen.getByText('Mobiliario')).toBeInTheDocument()
    expect(screen.queryByText(/Espacio sin objetos/i)).not.toBeInTheDocument()

    // Las macetas existentes se preservaron sin ser borradas ni sobrescritas
    expect(container.querySelectorAll('[data-empty-container="3d-pot"]').length).toBe(8)
  })

  it('Ciclo TDD 2: permite seleccionar un objeto del catálogo de diseño, colocarlo en el espacio y seleccionarlo para ver su barra contextual', async () => {
    const user = userEvent.setup()

    const room = useLocationStore.getState().add({
      name: 'Laboratorio Botánico',
      type: 'lab',
      rows: 2,
      cols: 2,
    })

    const { container } = render(<LocationsPage />)

    // Entrar al Laboratorio
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Laboratorio Botánico/i }))

    // Activar Modo Diseñar
    await user.click(screen.getByRole('button', { name: /Modo Diseñar Espacio y Mobiliario/i }))

    // Seleccionar 'Maceta 20 L' en el catálogo
    const potBtn = screen.getByRole('button', { name: /Seleccionar Maceta 20 L/i })
    await user.click(potBtn)

    // Al agregar el objeto en el layout de la sala, este se renderiza en la capa ObjectsLayer con data-placed-object
    useRoomLayoutStore.getState().addObject(room.id, {
      id: 'test-placed-pot',
      typeId: 'pot_20l',
      x: 100,
      y: 100,
      z: 0,
      rotation: 0,
    })

    // El objeto se renderiza en el plano isométrico con el atributo semántico data-placed-object="pot_20l"
    const placedPot = container.querySelector('[data-placed-object="pot_20l"]')
    expect(placedPot).toBeInTheDocument()

    // Al hacer clic en el objeto colocado, se selecciona y aparece la barra contextual ObjectContextBar
    if (placedPot) {
      await user.click(placedPot)
      expect(screen.getByRole('button', { name: /Rotar 90°/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Duplicar/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Eliminar objeto/i })).toBeInTheDocument()
    }
  })

  it('Ciclo TDD 3: permite activar la herramienta de trazado de surco, configurar longitud y espaciado dinámico de plantas en la barra contextual', async () => {
    const user = userEvent.setup()

    const room = useLocationStore.getState().add({
      name: 'Campo de Ensayo',
      type: 'field',
      rows: 4,
      cols: 4,
    })

    const { container } = render(<LocationsPage />)

    // Entrar al Campo de Ensayo
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Campo de Ensayo/i }))

    // Activar Modo Diseñar
    await user.click(screen.getByRole('button', { name: /Modo Diseñar Espacio y Mobiliario/i }))

    // Botón Trazar Surco disponible en el catálogo
    const furrowBtn = screen.getByRole('button', { name: /Trazar Surco/i })
    expect(furrowBtn).toBeInTheDocument()
    await user.click(furrowBtn)

    // Simular colocación de surco de 200cm con espaciado de 40cm
    act(() => {
      useRoomLayoutStore.getState().addObject(room.id, {
        id: 'furrow-test-1',
        typeId: 'furrow',
        x: 50,
        y: 50,
        z: 0,
        rotation: 0,
        params: { lengthCm: 200, plantSpacingCm: 40 },
      })
    })

    await waitFor(() => {
      expect(container.querySelector('[data-placed-object="furrow"]')).toBeInTheDocument()
    })
    const placedFurrow = container.querySelector('[data-placed-object="furrow"]')

    // Seleccionar el surco para ver su barra contextual con chips de espaciado
    if (placedFurrow) {
      await user.click(placedFurrow)
      expect(screen.getByText(/200×40/i)).toBeInTheDocument()

      // Modificar espaciado a 50 cm mediante el chip rápido
      const chip50 = screen.getByRole('button', { name: '50' })
      await user.click(chip50)

      const updatedObj = useRoomLayoutStore.getState().getLayout(room.id)?.objects.find(o => o.id === 'furrow-test-1')
      expect(updatedObj?.params?.plantSpacingCm).toBe(50)
    }
  })

  it('Ciclo TDD 4: al eliminar un objeto que contiene plantas asignadas, las plantas se protegen moviéndose a "Sin ubicar" y el toast de deshacer permite recuperarlas', async () => {
    const user = userEvent.setup()

    const room = useLocationStore.getState().add({
      name: 'Invernadero Seguridad',
      type: 'greenhouse',
      rows: 2,
      cols: 2,
    })

    const taxon = useTaxonStore.getState().add({
      family: 'Solanaceae',
      genus: 'Capsicum',
      species: 'annuum',
      cropCode: 'PEP',
      commonName: 'Pimiento Protegido',
    })

    const acc = useAccessionStore.getState().add({
      accessionNumber: 'SAFE-01',
      taxonId: taxon.id,
      acquisitionSource: 'breeding',
    })

    // Objeto contenedor en la sala (tipo bench = Mesada de cultivo)
    act(() => {
      useRoomLayoutStore.getState().addObject(room.id, {
        id: 'safe-bench-1',
        typeId: 'bench',
        label: 'Mesa Principal',
        x: 20,
        y: 20,
        z: 0,
        rotation: 0,
      })
    })

    // Planta asignada al objeto
    const plant = useIndividualStore.getState().add({
      accessionId: acc.id,
      label: 'Planta Valiosa #1',
      locationId: room.id,
      slotId: 'safe-bench-1-slot-0',
      position: 'Mesa Principal',
      location: 'Mesa Principal',
    })

    const { container } = render(<LocationsPage />)

    // Entrar al invernadero y activar diseño
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Invernadero Seguridad/i }))
    await user.click(screen.getByRole('button', { name: /Modo Diseñar Espacio y Mobiliario/i }))

    // Seleccionar el objeto
    await waitFor(() => {
      expect(container.querySelector('[data-placed-object="bench"]')).toBeInTheDocument()
    })
    const placedBench = container.querySelector('[data-placed-object="bench"]')
    if (placedBench) {
      await user.click(placedBench)

      // Eliminar el objeto
      const deleteBtn = screen.getByRole('button', { name: /Eliminar objeto/i })
      await user.click(deleteBtn)

      // La planta se protegió y pasó a "Sin ubicar" en lugar de ser eliminada
      const plantAfterDelete = useIndividualStore.getState().getById(plant.id)
      expect(plantAfterDelete?.position).toBe('Sin ubicar')

      // Se muestra el toast con botón Deshacer
      expect(screen.getByText(/pasaron a "Sin ubicar"/i)).toBeInTheDocument()
      const undoToastBtn = screen.getByRole('button', { name: /Deshacer reubicación de plantas/i })
      await user.click(undoToastBtn)

      // Se restaura la planta a su posición original y el objeto al layout
      const plantAfterUndo = useIndividualStore.getState().getById(plant.id)
      expect(plantAfterUndo?.position).toBe('Mesa Principal')
      const restoredObj = useRoomLayoutStore.getState().getLayout(room.id)?.objects.find(o => o.id === 'safe-bench-1')
      expect(restoredObj).toBeDefined()
    }
  })

  it('Ciclo TDD 5: el Command Dock gestiona el historial deshacer y rehacer de manera reactiva', async () => {
    const user = userEvent.setup()

    useLocationStore.getState().add({
      name: 'Sala Historial',
      type: 'lab',
      rows: 2,
      cols: 2,
    })

    render(<LocationsPage />)

    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Sala Historial/i }))
    await user.click(screen.getByRole('button', { name: /Modo Diseñar Espacio y Mobiliario/i }))

    // Deshacer y Rehacer están deshabilitados al inicio sin historial nuevo
    const undoBtn = screen.getByRole('button', { name: /Deshacer/i })
    const redoBtn = screen.getByRole('button', { name: /Rehacer/i })
    expect(undoBtn).toBeDisabled()
    expect(redoBtn).toBeDisabled()
  })

  it('Caso de Borde: los atajos de teclado (Delete, R, Backspace) se ignoran si el foco del usuario está dentro de un input', async () => {
    const user = userEvent.setup()

    const room = useLocationStore.getState().add({
      name: 'Sala Input Focus',
      type: 'field',
      rows: 2,
      cols: 2,
    })

    act(() => {
      useRoomLayoutStore.getState().addObject(room.id, {
        id: 'protected-furrow',
        typeId: 'furrow',
        x: 20,
        y: 20,
        z: 0,
        rotation: 0,
        params: { lengthCm: 200, plantSpacingCm: 40 },
      })
    })

    const { container } = render(<LocationsPage />)

    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Sala Input Focus/i }))
    await user.click(screen.getByRole('button', { name: /Modo Diseñar Espacio y Mobiliario/i }))

    await waitFor(() => {
      expect(container.querySelector('[data-placed-object="furrow"]')).toBeInTheDocument()
    })

    const furrowEl = container.querySelector('[data-placed-object="furrow"]')
    if (furrowEl) {
      await user.click(furrowEl)

      // El input numérico de espaciado está en la barra contextual
      const spacingInput = container.querySelector('input[type="number"]')
      expect(spacingInput).toBeInTheDocument()

      if (spacingInput) {
        // Enfocar el input
        await user.click(spacingInput)

        // Presionar Delete y Backspace mientras se escribe
        await user.keyboard('{Delete}{Backspace}')

        // El objeto NO debe haberse eliminado
        expect(container.querySelector('[data-placed-object="furrow"]')).toBeInTheDocument()
        const objAfterDelete = useRoomLayoutStore.getState().getLayout(room.id)?.objects.find(o => o.id === 'protected-furrow')
        expect(objAfterDelete).toBeDefined()

        // Presionar 'r' mientras se escribe en el input
        await user.keyboard('r')

        // La rotación NO debe haber cambiado (sigue en 0°)
        const objAfterRotate = useRoomLayoutStore.getState().getLayout(room.id)?.objects.find(o => o.id === 'protected-furrow')
        expect(objAfterRotate?.rotation).toBe(0)
      }
    }
  })

  it('renderiza Leguminosas y Trepadoras (Poroto/Soja/Vid) con zarcillos espiralados, floración papilionácea y vainas de legumbre con semillas en relieve', async () => {
    const user = userEvent.setup()

    const beanTaxon = useTaxonStore.getState().add({
      family: 'Fabaceae',
      genus: 'Phaseolus',
      species: 'vulgaris',
      cropCode: 'BEA_DRY',
      commonName: 'Poroto Negro',
    })

    const room = useLocationStore.getState().add({
      name: 'Sector Legumbres',
      type: 'field',
      rows: 2,
      cols: 2,
    })

    const acc = useAccessionStore.getState().add({
      accessionNumber: 'BEA-2026-HQ',
      taxonId: beanTaxon.id,
      acquisitionSource: 'breeding',
    })

    // Poroto en floración papilionácea (BBCH 65)
    useIndividualStore.getState().add({
      accessionId: acc.id,
      label: 'Poroto Flor #01',
      locationId: room.id,
      position: 'A-01',
      location: 'A-01',
      currentBBCH: 65,
    })

    // Poroto en llenado de vainas con semillas visibles (BBCH 85)
    useIndividualStore.getState().add({
      accessionId: acc.id,
      label: 'Poroto Vainas #02',
      locationId: room.id,
      position: 'A-02',
      location: 'A-02',
      currentBBCH: 85,
    })

    const { container } = render(<LocationsPage />)

    // Entrar al Sector Legumbres
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Sector Legumbres/i }))

    // Verifica zarcillos trepadores, flor papilionácea y vainas de legumbre con relieve
    expect(container.querySelectorAll('[data-botanical-feature="vine-tendril"]').length).toBeGreaterThanOrEqual(1)
    expect(container.querySelector('[data-botanical-feature="papilionaceous-flower"]')).toBeInTheDocument()
    expect(container.querySelector('[data-botanical-feature="legume-pod"]')).toBeInTheDocument()
  })

  it('renderiza Palmeadas/Industriales (Humulus/Cannabaceae procedural) con caña erecta segmentada, hojas digitadas de folíolos aserrados y cola apical resinosa', async () => {
    const user = userEvent.setup()

    const hempTaxon = useTaxonStore.getState().add({
      family: 'Cannabaceae',
      genus: 'Humulus',
      species: 'lupulus',
      cropCode: 'HOPS',
      commonName: 'Lúpulo Industrial',
    })

    const room = useLocationStore.getState().add({
      name: 'Sector Lúpulo',
      type: 'greenhouse',
      rows: 2,
      cols: 2,
    })

    const acc = useAccessionStore.getState().add({
      accessionNumber: 'HOPS-2026-HQ',
      taxonId: hempTaxon.id,
      acquisitionSource: 'breeding',
    })

    // Palmeada en fase vegetativa con hojas palmadas (BBCH 35)
    useIndividualStore.getState().add({
      accessionId: acc.id,
      label: 'Lúpulo Veg #01',
      locationId: room.id,
      position: 'A-01',
      location: 'A-01',
      currentBBCH: 35,
    })

    // Palmeada en floración avanzada con cola apical (BBCH 85)
    useIndividualStore.getState().add({
      accessionId: acc.id,
      label: 'Lúpulo Flor #02',
      locationId: room.id,
      position: 'A-02',
      location: 'A-02',
      currentBBCH: 85,
    })

    const { container } = render(<LocationsPage />)

    // Entrar al Sector Lúpulo
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Sector Lúpulo/i }))

    // Verifica caña erecta, hojas palmadas digitadas aserradas y cola apical resinosa
    expect(container.querySelectorAll('[data-botanical-feature="palmate-cane"]').length).toBeGreaterThanOrEqual(1)
    expect(container.querySelectorAll('[data-botanical-feature="palmate-serrated-leaf"]').length).toBeGreaterThanOrEqual(1)
    expect(container.querySelector('[data-botanical-feature="resin-cola"]')).toBeInTheDocument()
  })

  it('renderiza Leñosas y Frutales Perennes (Cítricos/Frutales) con tronco leñoso bifurcado, floración de azahar y frutos esféricos con ombligo y reflejo', async () => {
    const user = userEvent.setup()

    const lemonTaxon = useTaxonStore.getState().add({
      family: 'Rutaceae',
      genus: 'Citrus',
      species: 'limon',
      cropCode: 'LEMON',
      commonName: 'Limonero Cuatro Estaciones',
    })

    const room = useLocationStore.getState().add({
      name: 'Sector Cítricos',
      type: 'field',
      rows: 2,
      cols: 2,
    })

    const acc = useAccessionStore.getState().add({
      accessionNumber: 'LEM-2026-HQ',
      taxonId: lemonTaxon.id,
      acquisitionSource: 'breeding',
    })

    // Limonero en floración azahar (BBCH 65)
    useIndividualStore.getState().add({
      accessionId: acc.id,
      label: 'Limonero Azahar #01',
      locationId: room.id,
      position: 'A-01',
      location: 'A-01',
      currentBBCH: 65,
    })

    // Limonero con frutos maduros esféricos (BBCH 85)
    useIndividualStore.getState().add({
      accessionId: acc.id,
      label: 'Limonero Fruto #02',
      locationId: room.id,
      position: 'A-02',
      location: 'A-02',
      currentBBCH: 85,
    })

    const { container } = render(<LocationsPage />)

    // Entrar al Sector Cítricos
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Sector Cítricos/i }))

    // Verifica tronco leñoso, flores de azahar y frutos esféricos con reflejo
    expect(container.querySelectorAll('[data-botanical-feature="woody-trunk"]').length).toBeGreaterThanOrEqual(1)
    expect(container.querySelector('[data-botanical-feature="blossom-flower"]')).toBeInTheDocument()
    expect(container.querySelector('[data-botanical-feature="spherical-fruit"]')).toBeInTheDocument()
  })

  it('renderiza plantas con sprites raster cuando el cultivo cuenta con assets WebP (ej. TOM, HEMP)', async () => {
    const user = userEvent.setup()

    const tomatoTaxon = useTaxonStore.getState().add({
      family: 'Solanaceae',
      genus: 'Solanum',
      species: 'lycopersicum',
      cropCode: 'TOM',
      commonName: 'Tomate Platense',
    })

    const hempTaxon = useTaxonStore.getState().add({
      family: 'Cannabaceae',
      genus: 'Cannabis',
      species: 'sativa',
      cropCode: 'HEMP',
      commonName: 'Cannabis / Cáñamo',
    })

    const room = useLocationStore.getState().add({
      name: 'Sector Cultivos Raster',
      type: 'greenhouse',
      rows: 2,
      cols: 2,
    })

    const accTom = useAccessionStore.getState().add({
      accessionNumber: 'TOM-2026-HQ',
      taxonId: tomatoTaxon.id,
      acquisitionSource: 'breeding',
    })

    const accHemp = useAccessionStore.getState().add({
      accessionNumber: 'HEMP-2026-HQ',
      taxonId: hempTaxon.id,
      acquisitionSource: 'breeding',
    })

    useIndividualStore.getState().add({
      accessionId: accTom.id,
      label: 'TOM Raster #01',
      locationId: room.id,
      position: 'A-01',
      location: 'A-01',
      currentBBCH: 85,
    })

    useIndividualStore.getState().add({
      accessionId: accHemp.id,
      label: 'HEMP Raster #02',
      locationId: room.id,
      position: 'A-02',
      location: 'A-02',
      currentBBCH: 85,
    })

    const { container } = render(<LocationsPage />)

    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Sector Cultivos Raster/i }))

    expect(container.querySelectorAll('[data-renderer="raster-plant"]').length).toBe(2)
    expect(container.querySelectorAll('image').length).toBe(2)
  })

  it('Flujo unificado "Nuevo Cultivo / Material" con filtro de colisión biológica', async () => {
    const user = userEvent.setup()

    useLocationStore.getState().add({
      name: 'Invernadero Bio',
      type: 'greenhouse',
      capacity: 12,
    })

    render(<LocationsPage />)

    // Entra a una sala isométrica
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Invernadero Bio/i }))

    // Abre el Drawer contextual de siembra / alta unificada
    await user.click(screen.getByRole('button', { name: /Sembrar en Celda/i }))

    // Cambia a la pestaña "+ Nuevo Cultivo / Material"
    await user.click(screen.getByRole('button', { name: /\+ Nuevo Cultivo \/ Material/i }))

    // Selecciona o agrega Naranjo Dulce (Citrus sinensis)
    await user.click(screen.getByRole('button', { name: /Naranjo Dulce/i }))

    // Verifica que se ofrecen los formatos Plantín, Gajo / Esqueje y Semillas, pero NO Bulbo / Tubérculo
    expect(screen.getByRole('button', { name: /Plantín/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gajo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Semillas \/ Sobre/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Bulbo/i })).not.toBeInTheDocument()

    // Selecciona o agrega Ajo (Allium sativum)
    await user.click(screen.getByRole('button', { name: /\bAjo\b/i }))

    // Verifica que SÍ aparece habilitado Bulbo / Tubérculo con BBCH 5
    expect(screen.getByRole('button', { name: /Bulbo/i })).toBeInTheDocument()
    expect(screen.getByText(/BBCH 5/i)).toBeInTheDocument()
  })

  it('Plantación directa de Plantín / Gajo en un solo paso', async () => {
    const user = userEvent.setup()

    const room = useLocationStore.getState().add({
      name: 'Sala Climatizada Alpha',
      type: 'growth_chamber',
      capacity: 9,
    })

    render(<LocationsPage />)

    // Entra a la sala
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Sala Climatizada Alpha/i }))

    // Abre el drawer de siembra y pasa a + Nuevo Cultivo / Material
    await user.click(screen.getByRole('button', { name: /Sembrar en Celda/i }))
    await user.click(screen.getByRole('button', { name: /\+ Nuevo Cultivo \/ Material/i }))

    // Selecciona Tomate
    await user.click(screen.getByRole('button', { name: /Tomate/i }))

    // Elige el formato Plantín (en sustrato)
    await user.click(screen.getByRole('button', { name: /Plantín/i }))

    // Escribe variedad "Platense"
    await user.type(screen.getByLabelText(/Nombre de variedad o cultivar/i), 'Platense')

    // Celda preseleccionada o establecida en A-01
    expect(screen.getByLabelText(/Celda en la grilla/i)).toHaveValue('A-01')

    // Confirma plantar en A-01
    await user.click(screen.getByRole('button', { name: /Plantar Plantín en A-01/i }))

    // Verifica que se creó automáticamente la Accession (TOM-...)
    const accessions = useAccessionStore.getState().accessions
    const createdAcc = accessions.find(a => a.cultivarName === 'Platense')
    expect(createdAcc).toBeDefined()
    expect(createdAcc?.accessionNumber).toMatch(/^TOM-/)

    // Verifica que se creó el Individual vivo en A-01 con currentBBCH: 14 y tag 'plantín'
    const individuals = useIndividualStore.getState().individuals
    expect(individuals).toHaveLength(1)
    const plant = individuals[0]
    expect(plant.locationId).toBe(room.id)
    expect(plant.position).toBe('A-01')
    expect(plant.currentBBCH).toBe(14)
    expect(plant.tags).toContain('plantín')

    // Verifica que el Drawer pasó al modo Inspector in-situ
    expect(screen.getByText(/Inspector In-Situ · Posición A-01/i)).toBeInTheDocument()
  })

  it('permite abrir + Nuevo Cultivo / Material desde el nivel 1 (mapa de salas) e ingresar semilla al catálogo', async () => {
    const user = userEvent.setup()

    render(<LocationsPage />)

    // Clic en + Nuevo Cultivo / Material desde la cabecera del Campus
    await user.click(screen.getByRole('button', { name: /\+ Nuevo Cultivo \/ Material/i }))

    // Selecciona Zapallo desde presets
    await user.click(screen.getByRole('button', { name: /Zapallo/i }))

    // Escribe variedad
    await user.type(screen.getByLabelText(/Nombre de variedad o cultivar/i), 'Criollo Plomo')

    // Confirmar e Ingresar Cultivo
    await user.click(screen.getByRole('button', { name: /Confirmar e Ingresar Cultivo/i }))

    // Verifica creación de Accession y Lote de Semillas
    const acc = useAccessionStore.getState().accessions.find(a => a.cultivarName === 'Criollo Plomo')
    expect(acc).toBeDefined()
    expect(acc?.accessionNumber).toMatch(/^SQUASH-/)

    const seedLots = useSeedLotStore.getState().seedLots
    expect(seedLots).toHaveLength(1)
    expect(seedLots[0].accessionId).toBe(acc?.id)
    expect(seedLots[0].currentCount).toBe(50)
  })

  it('Formatos extendidos, etiquetas dinámicas y plantación múltiple híbrida (automática vs bandeja manual)', async () => {
    const user = userEvent.setup()

    useLocationStore.getState().add({
      name: 'Invernadero Híbrido',
      type: 'greenhouse',
      capacity: 12,
    })

    render(<LocationsPage />)

    // Entra a la sala isométrica
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Invernadero Híbrido/i }))

    // Abre el drawer de siembra y pasa a + Nuevo Cultivo / Material
    await user.click(screen.getByRole('button', { name: /Sembrar en Celda/i }))
    await user.click(screen.getByRole('button', { name: /\+ Nuevo Cultivo \/ Material/i }))

    // 1. Naranjo Dulce muestra "Árbol de Vivero / Injerto"
    await user.click(screen.getByRole('button', { name: /Naranjo Dulce/i }))
    expect(screen.getByRole('button', { name: /Árbol de Vivero \/ Injerto/i })).toBeInTheDocument()

    // 2. Ajo muestra "Diente / Bulbo / Tubérculo"
    await user.click(screen.getByRole('button', { name: /\bAjo\b/i }))
    expect(screen.getByRole('button', { name: /Diente \/ Bulbo/i })).toBeInTheDocument()

    // 3. Tomate: 3 plantines en modo automático desde A-01
    await user.click(screen.getByRole('button', { name: /^Tomate$/i }))
    await user.click(screen.getByRole('button', { name: /Plantín/i }))
    await user.type(screen.getByLabelText(/Nombre de variedad o cultivar/i), 'Platense')

    const countInput = screen.getByLabelText(/Cantidad a ingresar/i)
    await user.clear(countInput)
    await user.type(countInput, '3')

    // El modo por defecto es auto_cells
    expect(screen.getByLabelText(/Plantar automáticamente en celdas libres/i)).toBeChecked()

    // Confirma plantar
    await user.click(screen.getByRole('button', { name: /Plantar 3 Plantines desde A-01/i }))

    // Verifica que se crearon 3 individuos en A-01, A-02 y A-03
    const allInds = useIndividualStore.getState().individuals
    expect(allInds.filter(i => i.position === 'A-01')).toHaveLength(1)
    expect(allInds.filter(i => i.position === 'A-02')).toHaveLength(1)
    expect(allInds.filter(i => i.position === 'A-03')).toHaveLength(1)

    // 4. Vuelve a abrir Nuevo Cultivo para probar modo "Dejar en la Bandeja Inferior para ubicar manualmente"
    // El drawer quedó en inspect de la primera planta; cerramos para volver a siembra
    const closeBtn = screen.getByRole('button', { name: /Cerrar ×/i })
    await user.click(closeBtn)

    await user.click(screen.getByRole('button', { name: /\+ Nuevo Cultivo \/ Material/i }))
    await user.click(screen.getByRole('button', { name: /^Tomate$/i }))
    await user.click(screen.getByRole('button', { name: /Gajo/i }))
    await user.type(screen.getByLabelText(/Nombre de variedad o cultivar/i), 'Cherry')

    const countInput2 = screen.getByLabelText(/Cantidad a ingresar/i)
    await user.clear(countInput2)
    await user.type(countInput2, '2')

    // Selecciona modo manual_tray
    const manualRadio = screen.getByLabelText(/Dejar en la Bandeja Inferior para ubicar manualmente/i)
    await user.click(manualRadio)

    await user.click(screen.getByRole('button', { name: /Dejar 2 Gajos en Bandeja/i }))

    const cherryInds = useIndividualStore.getState().individuals.filter(i => {
      const acc = useAccessionStore.getState().getById(i.accessionId)
      return acc?.cultivarName === 'Cherry'
    })
    expect(cherryInds).toHaveLength(2)
    expect(cherryInds[0].position).toBe('Sin ubicar')
    expect(cherryInds[1].position).toBe('Sin ubicar')
  }, 15000)

  it('Clonación vegetativa en ambos sentidos (Planta Madre → Esqueje y botón inverso "Sacar Esqueje / Gajo" desde el Inspector)', async () => {
    const user = userEvent.setup()

    const room = useLocationStore.getState().add({
      name: 'Invernadero Clones',
      type: 'greenhouse',
      capacity: 12,
    })
    const acc = useAccessionStore.getState().add({
      accessionNumber: 'TOM-2026-001',
      taxonId: 'tax-tom',
      cultivarName: 'Platense Madre',
      acquisitionSource: 'research',
    })
    const mother = useIndividualStore.getState().add({
      accessionId: acc.id,
      label: 'TOM-2026-001 #01',
      locationId: room.id,
      position: 'A-01',
      location: 'A-01',
      currentBBCH: 35,
      status: 'active',
    })

    render(<LocationsPage />)

    // Entra a la sala isométrica
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Invernadero Clones/i }))

    // Selecciona la planta madre en A-01 para abrir la SlotActionBar
    await user.click(screen.getByRole('button', { name: /Celda A-01 ocupada por TOM-2026-001 #01/i }))
    expect(screen.getByText(/Slot Ocupado · A-01/i)).toBeInTheDocument()

    // Clic en "Ver detalles" para abrir el Inspector in-situ
    await user.click(screen.getByRole('button', { name: /Ver detalles de planta del slot/i }))

    // Verifica que el Inspector in-situ está abierto con la planta madre
    expect(screen.getByText(/Inspector In-Situ · Posición A-01/i)).toBeInTheDocument()

    // Camino inverso: Clic en "Sacar Esqueje / Gajo" desde el Inspector
    const cloneBtn = screen.getByRole('button', { name: /Sacar Esqueje \/ Gajo/i })
    expect(cloneBtn).toBeInTheDocument()
    await user.click(cloneBtn)

    // Configura cantidad 2
    const qtyInput = screen.getByLabelText(/Cantidad de clones/i)
    await user.clear(qtyInput)
    await user.type(qtyInput, '2')

    // Confirma esquejes
    await user.click(screen.getByRole('button', { name: /Confirmar Esquejes/i }))

    // Verifica que se crearon 2 nuevos individuos clones con maternalParentId apuntando a la madre, currentBBCH: 10 y tag 'clon'
    const allInds = useIndividualStore.getState().individuals
    const clonesFromInspector = allInds.filter(i => i.maternalParentId === mother.id)
    expect(clonesFromInspector).toHaveLength(2)
    clonesFromInspector.forEach(clone => {
      expect(clone.currentBBCH).toBe(10)
      expect(clone.tags).toContain('clon')
      expect(clone.tags).toContain('esqueje')
      expect(clone.accessionId).toBe(mother.accessionId)
    })

    // Camino directo: Abrir "+ Nuevo Cultivo / Material", seleccionar Madre y verificar herencia
    const closeBtn = screen.getByRole('button', { name: /Cerrar ×/i })
    await user.click(closeBtn)

    await user.click(screen.getByRole('button', { name: /\+ Nuevo Cultivo \/ Material/i }))
    await user.click(screen.getByRole('button', { name: /^Tomate$/i }))
    await user.click(screen.getByRole('button', { name: /Gajo/i }))

    // Selecciona la planta madre en el dropdown
    const motherSelect = screen.getByLabelText(/Planta Madre \(Clon\)/i)
    await user.selectOptions(motherSelect, mother.id)

    // Confirma el gajo
    await user.click(screen.getByRole('button', { name: /Plantar/i }))

    const clonesTotal = useIndividualStore.getState().individuals.filter(i => i.maternalParentId === mother.id)
    expect(clonesTotal).toHaveLength(3)
  }, 15000)

  it('Secuencia de puntero real (pointerDown + pointerUp + click) no es interceptada por useIsometricCamera y ObjectsLayer no bloquea celdas en Modo Cultivo', async () => {
    const user = userEvent.setup()

    const room = useLocationStore.getState().add({
      name: 'Invernadero Pointer',
      type: 'greenhouse',
      capacity: 12,
    })

    // Coloca un objeto decorativo en el espacio de la sala
    useRoomLayoutStore.getState().addObject(room.id, {
      id: 'pot-deco-1',
      typeId: 'pot_terracotta',
      x: 0,
      y: 0,
      z: 0,
      rotation: 0,
    })

    const { container } = render(<LocationsPage />)

    // Entra a la sala isométrica
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Invernadero Pointer/i }))

    // Verifica que la capa de objetos colocados tiene pointer-events: none en Modo Cultivo
    const objectsLayer = container.querySelector('[data-layer="placed-objects"]')
    expect(objectsLayer).toBeInTheDocument()
    expect(objectsLayer).toHaveStyle({ pointerEvents: 'none' })

    // Busca la celda A-01 y el botón plus
    const cellA1 = screen.getByRole('button', { name: /Celda vacía A-01/i })
    expect(cellA1).toHaveAttribute('data-interactive', 'true')

    const plusBtn = container.querySelector('[data-slot-plus="A-01"]')
    expect(plusBtn).toBeInTheDocument()

    // Secuencia de puntero real sin arrastre: pointerDown -> pointerUp -> click
    fireEvent.pointerDown(cellA1, { clientX: 150, clientY: 150, pointerId: 1, button: 0 })
    fireEvent.pointerUp(cellA1, { clientX: 151, clientY: 151, pointerId: 1, button: 0 })
    fireEvent.click(cellA1)

    // Comprueba que el slot A-01 fue seleccionado y se desplegó la barra contextual
    const slotBar = screen.getByTestId('slot-action-bar')
    expect(slotBar).toBeInTheDocument()
    expect(slotBar).toHaveAttribute('role', 'toolbar')
    expect(slotBar).toHaveAttribute('aria-label', 'Acciones de slot A-01')
    expect(screen.getByText(/Slot Vacío · A-01/i)).toBeInTheDocument()
    expect(slotBar.style.left).toMatch(/%$/)
    expect(slotBar.style.top).toMatch(/%$/)
  }, 15000)

  it('SlotActionBar Estado A (Slot Vacío): colocar planta sin ubicar en 1 clic y conmutar pestañas de siembra', async () => {
    const user = userEvent.setup()

    const room = useLocationStore.getState().add({
      name: 'Invernadero Slot A',
      type: 'greenhouse',
      capacity: 12,
    })
    const acc = useAccessionStore.getState().add({
      accessionNumber: 'TOM-2026-UNP',
      taxonId: 'tax-tom',
      cultivarName: 'Tomate Bandeja',
      acquisitionSource: 'research',
    })
    const unplacedInd = useIndividualStore.getState().add({
      accessionId: acc.id,
      label: 'TOM-2026-UNP #01',
      locationId: room.id,
      position: 'Sin ubicar',
      location: 'Sin ubicar',
      currentBBCH: 10,
      status: 'active',
    })

    render(<LocationsPage />)

    // Entra a la sala
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Invernadero Slot A/i }))

    // Clic en celda vacía A-01
    await user.click(screen.getByRole('button', { name: /Celda vacía A-01/i }))

    const slotBar = screen.getByTestId('slot-action-bar')
    expect(slotBar).toBeInTheDocument()
    expect(screen.getByText(/Slot Vacío · A-01/i)).toBeInTheDocument()
    expect(slotBar.style.left).toMatch(/%$/)
    expect(slotBar.style.top).toMatch(/%$/)

    // Botones disponibles en Estado A
    const placeUnplacedBtn = screen.getByRole('button', { name: /Colocar planta sin ubicar en slot/i })
    expect(placeUnplacedBtn).toBeInTheDocument()
    expect(placeUnplacedBtn).toHaveTextContent(/Colocar .* aquí/i)

    const sowInventoryBtn = screen.getByRole('button', { name: /Sembrar de Inventario en slot/i })
    const newCropBtn = screen.getByRole('button', { name: /Nuevo Cultivo en slot/i })
    expect(sowInventoryBtn).toBeInTheDocument()
    expect(newCropBtn).toBeInTheDocument()

    // Conmutar a Nuevo Cultivo mediante la barra
    await user.click(newCropBtn)
    expect(screen.getByRole('heading', { name: /Nuevo Cultivo \/ Material/i })).toBeInTheDocument()

    // Conmutar a De mi Inventario mediante la barra
    await user.click(sowInventoryBtn)
    expect(screen.getByRole('heading', { name: /Sembrar en Invernadero Slot A/i })).toBeInTheDocument()

    // Clic en Colocar planta sin ubicar en slot
    await user.click(placeUnplacedBtn)

    // Verifica que la planta se ubicó en A-01
    const updatedInd = useIndividualStore.getState().getById(unplacedInd.id)
    expect(updatedInd?.position).toBe('A-01')

    // Ahora la barra de slot refleja Estado B (Slot Ocupado)
    expect(screen.getByText(/Slot Ocupado · A-01/i)).toBeInTheDocument()
  }, 15000)

  it('SlotActionBar Estado B (Slot Ocupado): subir BBCH, mover planta de celda, clonación vegetativa y liberar slot', async () => {
    const user = userEvent.setup()

    const room = useLocationStore.getState().add({
      name: 'Invernadero Slot B',
      type: 'greenhouse',
      capacity: 12,
    })
    const acc = useAccessionStore.getState().add({
      accessionNumber: 'TOM-2026-OCC',
      taxonId: 'tax-tom',
      cultivarName: 'Tomate Fructificación',
      acquisitionSource: 'research',
    })
    const ind = useIndividualStore.getState().add({
      accessionId: acc.id,
      label: 'TOM-2026-OCC #01',
      locationId: room.id,
      position: 'A-01',
      location: 'A-01',
      currentBBCH: 10,
      status: 'active',
    })

    render(<LocationsPage />)

    // Entra a la sala
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Invernadero Slot B/i }))

    // Clic en la planta en A-01
    await user.click(screen.getByRole('button', { name: /Celda A-01 ocupada por TOM-2026-OCC #01/i }))

    // 1. Verifica barra en Estado B
    const slotBar = screen.getByTestId('slot-action-bar')
    expect(slotBar).toBeInTheDocument()
    expect(screen.getByText(/Slot Ocupado · A-01/i)).toBeInTheDocument()
    expect(screen.getByText(/BBCH 10/i)).toBeInTheDocument()
    expect(slotBar.style.left).toMatch(/%$/)
    expect(slotBar.style.top).toMatch(/%$/)

    // 2. Acción Subir BBCH (de 10 al próximo hito 14)
    const bbchBtn = screen.getByRole('button', { name: /Avanzar etapa BBCH del slot/i })
    await user.click(bbchBtn)

    const indAfterBbch = useIndividualStore.getState().getById(ind.id)
    expect(indAfterBbch?.currentBBCH).toBe(14)
    expect(screen.getByText(/BBCH 14/i)).toBeInTheDocument()

    // 3. Acción Clonar Planta (Tomate admite esquejes)
    const cloneBtn = screen.getByRole('button', { name: /Clonar planta desde slot/i })
    expect(cloneBtn).toHaveTextContent(/Sacar Esqueje \/ Gajo/i)
    await user.click(cloneBtn)

    const clones = useIndividualStore.getState().individuals.filter(i => i.maternalParentId === ind.id)
    expect(clones).toHaveLength(1)
    expect(clones[0].position).toBe('A-02')
    expect(clones[0].tags).toContain('esqueje')
    expect(clones[0].tags).toContain('clon')

    // 4. Acción Mover de Celda (mover A-01 a A-03)
    // Volvemos a seleccionar A-01
    await user.click(screen.getByRole('button', { name: /Celda A-01 ocupada por TOM-2026-OCC #01/i }))
    const moveBtn = screen.getByRole('button', { name: /Mover planta de celda/i })
    await user.click(moveBtn)

    expect(screen.getByText(/Selecciona una celda vacía.../i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cancelar movimiento/i })).toBeInTheDocument()

    // Clic en la celda vacía A-03
    await user.click(screen.getByRole('button', { name: /Celda vacía A-03/i }))

    const indAfterMove = useIndividualStore.getState().getById(ind.id)
    expect(indAfterMove?.position).toBe('A-03')

    // 5. Acción Liberar Slot
    // Selecciona la celda ocupada A-03
    await user.click(screen.getByRole('button', { name: /Celda A-03 ocupada por TOM-2026-OCC #01/i }))
    const freeSlotBtn = screen.getByRole('button', { name: /Liberar slot ocupado/i })
    await user.click(freeSlotBtn)

    const indAfterDelete = useIndividualStore.getState().getById(ind.id)
    expect(indAfterDelete).toBeUndefined()
  }, 15000)

  it('registra presets botánicos (Naranjo Dulce / Tomate) con foto botánica, traits y datos agronómicos completos', async () => {
    const user = userEvent.setup()

    useLocationStore.getState().add({
      name: 'Vivero Cítricos',
      type: 'greenhouse',
      capacity: 10,
    })

    render(<LocationsPage />)

    // Entra a la sala
    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Vivero Cítricos/i }))

    // Abre el drawer contextual de siembra / alta unificada
    await user.click(screen.getByRole('button', { name: /Sembrar en Celda/i }))
    await user.click(screen.getByRole('button', { name: /\+ Nuevo Cultivo \/ Material/i }))

    // Selecciona el preset Naranjo Dulce
    await user.click(screen.getByRole('button', { name: /Naranjo Dulce/i }))

    // Verifica que Naranjo Dulce se haya registrado en useTaxonStore con foto, traits y datos agronómicos completos
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
    expect(orangeTaxon?.agronomicData?.optPhMin).toBe(5)
    expect(orangeTaxon?.agronomicData?.rainfallMin).toBe(450)
    expect(orangeTaxon?.agronomicData?.cycleDaysMin).toBe(180)
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

    useLocationStore.getState().add({
      name: 'Huerto Manzanos',
      type: 'field',
      capacity: 10,
    })

    render(<LocationsPage />)

    await user.click(screen.getByRole('button', { name: /Entrar a vista isométrica de Huerto Manzanos/i }))
    await user.click(screen.getByRole('button', { name: /Sembrar en Celda/i }))
    await user.click(screen.getByRole('button', { name: /\+ Nuevo Cultivo \/ Material/i }))

    // Busca Malus en el buscador rápido GBIF
    const searchInput = screen.getByPlaceholderText(/Buscar otra especie/i)
    await user.type(searchInput, 'Malus')

    // Espera que aparezca el resultado y haz clic
    const resultBtn = await screen.findByRole('button', { name: /Manzano Común/i })
    await user.click(resultBtn)

    // Verifica que el nuevo taxón agregado tenga imageUrl y traits
    const appleTaxon = useTaxonStore.getState().taxons.find(t => t.genus === 'Malus' && t.species === 'domestica')
    expect(appleTaxon).toBeDefined()
    expect(appleTaxon?.cropCode).toBe('APPLE')
    expect(appleTaxon?.imageUrl).toBe('https://images.example.com/apple-flower.jpg')
    expect(appleTaxon?.traits).toBeDefined()
    expect(appleTaxon!.traits!.length).toBeGreaterThan(0)
  })

  it('auto-repara taxones incompletos existentes en el store al montar LocationsPage', async () => {
    // tax-tom inicial solo tiene genus/species/family sin imageUrl ni traits ni phMinimum
    useLocationStore.getState().add({
      name: 'Invernadero Reparador',
      type: 'greenhouse',
      capacity: 5,
    })

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
})
