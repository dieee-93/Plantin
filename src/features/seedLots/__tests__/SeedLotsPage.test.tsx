import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { SeedLotsPage } from '../SeedLotsPage'
import { useSeedLotStore } from '@/store/seedLotStore'
import { useAccessionStore } from '@/store/accessionStore'
import { useTaxonStore } from '@/store/taxonStore'
import { useLocationStore } from '@/store/locationStore'
import { useIndividualStore } from '@/store/individualStore'

describe('SeedLotsPage (HUD Design System)', () => {
  beforeEach(() => {
    useSeedLotStore.setState({ seedLots: [] })
    useAccessionStore.setState({ accessions: [] })
    useLocationStore.setState({ locations: [] })
    useIndividualStore.setState({ individuals: [] })
    useTaxonStore.setState({
      taxons: [
        { id: 'tax-1', family: 'Solanaceae', genus: 'Solanum', species: 'lycopersicum', commonName: 'Tomate', cropCode: 'TOM' },
        { id: 'tax-2', family: 'Capsicum', genus: 'Capsicum', species: 'annuum', commonName: 'Pimiento', cropCode: 'PEP' },
      ],
    })
  })

  it('renders empty state when there are no seed lots', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SeedLotsPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/no hay lotes de semillas registrados/i)).toBeInTheDocument()
    expect(screen.getByText(/registra el primer sobre de semillas/i)).toBeInTheDocument()

    // Clicking the empty state or header "+ Nuevo Lote" button opens the HudFlyout form
    const newLotBtn = screen.getByRole('button', { name: /\+ nuevo lote/i })
    await user.click(newLotBtn)

    expect(screen.getByText('Nuevo Lote de Semillas')).toBeInTheDocument()
    expect(screen.getByLabelText(/código de lote/i)).toBeInTheDocument()
  })

  it('renders initial list of seed lots in grid', () => {
    useAccessionStore.setState({
      accessions: [
        {
          id: 'acc-1',
          accessionNumber: 'TOM-2026-001',
          taxonId: 'tax-1',
          cultivarName: 'San Marzano',
          acquisitionSource: 'cultivated',
        },
      ],
    })

    useSeedLotStore.setState({
      seedLots: [
        {
          id: 'lot-1',
          accessionId: 'acc-1',
          lotCode: 'TOM-2026-001-L1',
          initialCount: 500,
          currentCount: 450,
          status: 'active',
          germinationRate: 88,
          storageLocation: 'Heladera A / Cajón 2',
        },
      ],
    })

    render(
      <MemoryRouter>
        <SeedLotsPage />
      </MemoryRouter>
    )

    expect(screen.getByText('TOM-2026-001-L1')).toBeInTheDocument()
    expect(screen.getAllByText(/TOM-2026-001/).length).toBeGreaterThan(0)
    expect(screen.getByText(/San Marzano/i)).toBeInTheDocument()
    expect(screen.getByText(/450 \/ 500/i)).toBeInTheDocument()
    expect(screen.getByText('88%')).toBeInTheDocument()
    expect(screen.getByText('Heladera A / Cajón 2')).toBeInTheDocument()
  })

  it('adds a new seed lot with auto-generated lot code when accession is selected', async () => {
    const user = userEvent.setup()

    useAccessionStore.setState({
      accessions: [
        {
          id: 'acc-1',
          accessionNumber: 'TOM-2026-001',
          taxonId: 'tax-1',
          cultivarName: 'San Marzano',
          acquisitionSource: 'cultivated',
        },
      ],
    })

    render(
      <MemoryRouter>
        <SeedLotsPage />
      </MemoryRouter>
    )

    // Open Flyout via top toolbar button "+ Nuevo Lote"
    const topNewBtn = screen.getByRole('button', { name: /\+ nuevo lote/i })
    await user.click(topNewBtn)

    const accessionSelect = screen.getByLabelText(/accesión/i)
    const codeInput = screen.getByLabelText(/código de lote/i) as HTMLInputElement
    const countInput = screen.getByLabelText(/cantidad inicial/i)
    const submitBtn = screen.getByRole('button', { name: /registrar lote/i })

    // Select accession, auto-code should generate TOM-2026-001-L1
    await user.selectOptions(accessionSelect, 'acc-1')
    expect(codeInput.value).toBe('TOM-2026-001-L1')

    await user.type(countInput, '300')
    await user.click(submitBtn)

    // Verify it was added to store and shows in grid
    const lots = useSeedLotStore.getState().seedLots
    expect(lots).toHaveLength(1)
    expect(lots[0].lotCode).toBe('TOM-2026-001-L1')
    expect(lots[0].initialCount).toBe(300)
    expect(lots[0].currentCount).toBe(300)
    expect(lots[0].status).toBe('active')

    expect(screen.getAllByText('TOM-2026-001-L1').length).toBeGreaterThan(0)
  })

  it('selects a seed lot and opens its details in the HudFlyout lateral panel with quick stock and viability editors', async () => {
    const user = userEvent.setup()

    useAccessionStore.setState({
      accessions: [
        {
          id: 'acc-1',
          accessionNumber: 'TOM-2026-001',
          taxonId: 'tax-1',
          cultivarName: 'San Marzano',
          acquisitionSource: 'cultivated',
        },
      ],
    })

    useSeedLotStore.setState({
      seedLots: [
        {
          id: 'lot-1',
          accessionId: 'acc-1',
          lotCode: 'TOM-2026-001-L1',
          initialCount: 100,
          currentCount: 100,
          status: 'active',
          storageLocation: 'Cajón 3',
        },
      ],
    })

    render(
      <MemoryRouter>
        <SeedLotsPage />
      </MemoryRouter>
    )

    // Click lot card in grid
    const card = screen.getByText('TOM-2026-001-L1')
    await user.click(card)

    // Flyout should be open displaying lotCode and details
    expect(screen.getByRole('region', { name: 'TOM-2026-001-L1' })).toBeInTheDocument()
    expect(screen.getByText(/stock de semillas/i)).toBeInTheDocument()
    expect(screen.getByText(/pruebas de viabilidad/i)).toBeInTheDocument()

    // Test quick stock editor
    const editStockBtn = screen.getByLabelText(/editar stock actual/i)
    await user.click(editStockBtn)

    const stockInput = screen.getByLabelText(/stock actual/i)
    await user.clear(stockInput)
    await user.type(stockInput, '75')

    const saveStockBtn = screen.getByLabelText(/guardar stock/i)
    await user.click(saveStockBtn)

    // Check store updated
    expect(useSeedLotStore.getState().seedLots[0].currentCount).toBe(75)

    // Test viability editor
    const registerTestBtn = screen.getByRole('button', { name: /registrar test/i })
    await user.click(registerTestBtn)

    const rateInput = screen.getByLabelText(/tasa de germinación \(%\)/i)
    await user.type(rateInput, '92')

    const saveViabilityBtn = screen.getByRole('button', { name: /guardar ensayo/i })
    await user.click(saveViabilityBtn)

    expect(useSeedLotStore.getState().seedLots[0].germinationRate).toBe(92)
  })

  it('filters seed lots using HudChipRow status filter', async () => {
    const user = userEvent.setup()

    useAccessionStore.setState({
      accessions: [
        { id: 'acc-1', accessionNumber: 'ACC-1', taxonId: 'tax-1', acquisitionSource: 'cultivated' },
      ],
    })

    useSeedLotStore.setState({
      seedLots: [
        { id: 'lot-active', accessionId: 'acc-1', lotCode: 'LOT-ACTIVE-1', initialCount: 100, currentCount: 100, status: 'active' },
        { id: 'lot-exhausted', accessionId: 'acc-1', lotCode: 'LOT-EXHAUSTED-2', initialCount: 100, currentCount: 0, status: 'exhausted' },
        { id: 'lot-discarded', accessionId: 'acc-1', lotCode: 'LOT-DISCARDED-3', initialCount: 100, currentCount: 50, status: 'discarded' },
      ],
    })

    render(
      <MemoryRouter>
        <SeedLotsPage />
      </MemoryRouter>
    )

    // Initially all 3 are visible
    expect(screen.getByText('LOT-ACTIVE-1')).toBeInTheDocument()
    expect(screen.getByText('LOT-EXHAUSTED-2')).toBeInTheDocument()
    expect(screen.getByText('LOT-DISCARDED-3')).toBeInTheDocument()

    // Filter by 'Activos'
    const activeChip = screen.getAllByRole('button', { name: 'Activos' })[0]
    await user.click(activeChip)

    expect(screen.getByText('LOT-ACTIVE-1')).toBeInTheDocument()
    expect(screen.queryByText('LOT-EXHAUSTED-2')).not.toBeInTheDocument()
    expect(screen.queryByText('LOT-DISCARDED-3')).not.toBeInTheDocument()

    // Filter by 'Agotados'
    const exhaustedChip = screen.getAllByRole('button', { name: 'Agotados' })[0]
    await user.click(exhaustedChip)

    expect(screen.queryByText('LOT-ACTIVE-1')).not.toBeInTheDocument()
    expect(screen.getByText('LOT-EXHAUSTED-2')).toBeInTheDocument()
    expect(screen.queryByText('LOT-DISCARDED-3')).not.toBeInTheDocument()

    // Filter by 'Descartados'
    const discardedChip = screen.getAllByRole('button', { name: 'Descartados' })[0]
    await user.click(discardedChip)

    expect(screen.queryByText('LOT-ACTIVE-1')).not.toBeInTheDocument()
    expect(screen.queryByText('LOT-EXHAUSTED-2')).not.toBeInTheDocument()
    expect(screen.getByText('LOT-DISCARDED-3')).toBeInTheDocument()

    // Back to 'Todos'
    const allChip = screen.getAllByRole('button', { name: 'Todos' })[0]
    await user.click(allChip)

    expect(screen.getByText('LOT-ACTIVE-1')).toBeInTheDocument()
    expect(screen.getByText('LOT-EXHAUSTED-2')).toBeInTheDocument()
    expect(screen.getByText('LOT-DISCARDED-3')).toBeInTheDocument()
  })

  it('searches seed lots by lot code or accession and allows clearing search', async () => {
    const user = userEvent.setup()

    useAccessionStore.setState({
      accessions: [
        { id: 'acc-1', accessionNumber: 'TOM-2026-001', taxonId: 'tax-1', acquisitionSource: 'cultivated' },
        { id: 'acc-2', accessionNumber: 'PEP-2026-002', taxonId: 'tax-2', acquisitionSource: 'cultivated' },
      ],
    })

    useSeedLotStore.setState({
      seedLots: [
        { id: 'lot-1', accessionId: 'acc-1', lotCode: 'TOM-2026-001-L1', status: 'active' },
        { id: 'lot-2', accessionId: 'acc-2', lotCode: 'PEP-2026-002-L1', status: 'active' },
      ],
    })

    render(
      <MemoryRouter>
        <SeedLotsPage />
      </MemoryRouter>
    )

    expect(screen.getByText('TOM-2026-001-L1')).toBeInTheDocument()
    expect(screen.getByText('PEP-2026-002-L1')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(/buscar por lote o accesión/i)
    await user.type(searchInput, 'PEP')

    expect(screen.queryByText('TOM-2026-001-L1')).not.toBeInTheDocument()
    expect(screen.getByText('PEP-2026-002-L1')).toBeInTheDocument()

    const clearBtn = screen.getByLabelText(/limpiar búsqueda/i)
    await user.click(clearBtn)

    expect(screen.getByText('TOM-2026-001-L1')).toBeInTheDocument()
    expect(screen.getByText('PEP-2026-002-L1')).toBeInTheDocument()
  })
})
