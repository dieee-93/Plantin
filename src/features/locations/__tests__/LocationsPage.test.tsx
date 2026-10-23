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

    // Interacción 1: Clic en celda vacía B-02 pre-carga el formulario en esa coordenada
    const emptyCellB02 = screen.getByRole('button', { name: /Celda vacía B-02/i })
    await user.click(emptyCellB02)

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
      cropCode: 'PEPPER_SWEET',
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
      cropCode: 'MAI',
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
      cropCode: 'SUN_OIL',
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
      cropCode: 'LETTUCE',
      commonName: 'Lechuga Mantecosa',
    })

    const strawberryTaxon = useTaxonStore.getState().add({
      family: 'Rosaceae',
      genus: 'Fragaria',
      species: 'ananassa',
      cropCode: 'STRAWBERRY',
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
      cropCode: 'CARROT',
      commonName: 'Zanahoria Chantenay',
    })

    const beetTaxon = useTaxonStore.getState().add({
      family: 'Amaranthaceae',
      genus: 'Beta',
      species: 'vulgaris',
      cropCode: 'BEETROOT',
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

    const room = useLocationStore.getState().add({
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
})
