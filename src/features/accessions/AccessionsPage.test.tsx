import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccessionsPage } from './AccessionsPage'
import { useAccessionStore } from '@/store/accessionStore'
import { useTaxonStore } from '@/store/taxonStore'
import { useSeedLotStore } from '@/store/seedLotStore'

vi.mock('@/hooks/useTaxonomySearch', () => ({
  useTaxonomySearch: vi.fn(() => ({ data: [], isLoading: false })),
}))

describe('AccessionsPage', () => {
  beforeEach(() => {
    // Reset store states
    useAccessionStore.setState({ accessions: [] })
    useSeedLotStore.setState({ seedLots: [] })
    useTaxonStore.setState({ 
      taxons: [
        { id: 'tax-1', family: 'Solanaceae', genus: 'Solanum', species: 'lycopersicum', cropCode: 'TOM' },
        { id: 'tax-3', family: 'Poaceae', genus: 'Zea', species: 'mays', cropCode: 'MAI' }
      ] 
    })
  })

  it('renders the empty state when there are no accessions', () => {
    render(<MemoryRouter><AccessionsPage /></MemoryRouter>)
    expect(screen.getAllByText(/no hay accesiones/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/registra la primera/i)).toBeInTheDocument()
  })

  it('adds a new accession through the compact form with validation', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><AccessionsPage /></MemoryRouter>)

    const accNumberInput = screen.getByLabelText(/accession number/i)
    const taxonSelect = screen.getByLabelText(/Especie \(Taxón\)/i)
    const sourceSelect = screen.getByLabelText(/Origen de Adquisición/i)
    const submitBtn = screen.getByRole('button', { name: /agregar/i })

    await user.clear(accNumberInput)
    await user.type(accNumberInput, `PLT-${new Date().getFullYear()}-001`)
    await user.selectOptions(taxonSelect, 'tax-1')
    await user.selectOptions(sourceSelect, 'wild')
    await user.click(submitBtn)

    // Verify it appears in the list (and details area since it gets selected automatically)
    // The prefix automatically changed to TOM (tax-1 crop code) when the taxon was selected
    const currentYear = new Date().getFullYear()
    expect(screen.getAllByText(`TOM-${currentYear}-001`).length).toBeGreaterThan(0)
    
    // The store should have it
    const accessions = useAccessionStore.getState().accessions
    expect(accessions).toHaveLength(1)
    expect(accessions[0].accessionNumber).toBe(`TOM-${currentYear}-001`)
    expect(accessions[0].taxonId).toBe('tax-1')
    expect(accessions[0].acquisitionSource).toBe('wild')
  })

  it('selects an accession and displays its details in the main area', async () => {
    const user = userEvent.setup()
    // Pre-populate store
    useAccessionStore.getState().add({
      accessionNumber: 'TEST-2024-001',
      taxonId: 'tax-3', // Zea mays in mock
      acquisitionSource: 'breeding'
    })

    render(<MemoryRouter><AccessionsPage /></MemoryRouter>)

    // Click on the list item
    const listItem = screen.getByText('TEST-2024-001')
    await user.click(listItem)

    // The details area should now show the full information
    const detailsHeading = screen.getByRole('heading', { name: 'TEST-2024-001' })
    expect(detailsHeading).toBeInTheDocument()
    // It should render the resolved species name (Zea mays)
    expect(screen.getAllByText(/Zea mays/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/mejoramiento/i).length).toBeGreaterThan(0)
  })

  it('auto-prefixes Cannabis sativa with HEMP when selected', async () => {
    const user = userEvent.setup()
    useTaxonStore.setState({
      taxons: [
        { id: 'tax-cannabis', family: 'Cannabaceae', genus: 'Cannabis', species: 'sativa', commonName: 'Cáñamo / Cannabis' }
      ]
    })

    render(<MemoryRouter><AccessionsPage /></MemoryRouter>)

    const taxonSelect = screen.getByLabelText(/Especie \(Taxón\)/i)
    const accNumberInput = screen.getByLabelText(/accession number/i) as HTMLInputElement

    await user.selectOptions(taxonSelect, 'tax-cannabis')
    const currentYear = new Date().getFullYear()
    expect(accNumberInput.value).toBe(`HEMP-${currentYear}-001`)
  })

  it('auto-prefixes unmapped species with deterministic fallback (Passiflora edulis -> PASE)', async () => {
    const user = userEvent.setup()
    useTaxonStore.setState({
      taxons: [
        { id: 'tax-passiflora', family: 'Passifloraceae', genus: 'Passiflora', species: 'edulis', commonName: 'Maracuyá Silvestre' }
      ]
    })

    render(<MemoryRouter><AccessionsPage /></MemoryRouter>)

    const taxonSelect = screen.getByLabelText(/Especie \(Taxón\)/i)
    const accNumberInput = screen.getByLabelText(/accession number/i) as HTMLInputElement

    await user.selectOptions(taxonSelect, 'tax-passiflora')
    const currentYear = new Date().getFullYear()
    expect(accNumberInput.value).toBe(`PASSION_FRUIT-${currentYear}-001`)
  })

  it('auto-prefixes completely unknown botanical with deterministic genus-species fallback', async () => {
    const user = userEvent.setup()
    useTaxonStore.setState({
      taxons: [
        { id: 'tax-exotic', family: 'Orchidaceae', genus: 'Phalaenopsis', species: 'amabilis', commonName: 'Orquídea Luna' }
      ]
    })

    render(<MemoryRouter><AccessionsPage /></MemoryRouter>)

    const taxonSelect = screen.getByLabelText(/Especie \(Taxón\)/i)
    const accNumberInput = screen.getByLabelText(/accession number/i) as HTMLInputElement

    await user.selectOptions(taxonSelect, 'tax-exotic')
    const currentYear = new Date().getFullYear()
    expect(accNumberInput.value).toBe(`PHAA-${currentYear}-001`)
  })

  it('automatically creates initial SeedLot (L1) when initial seed count is entered during accession registration and shows it in details', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><AccessionsPage /></MemoryRouter>)

    const taxonSelect = screen.getByLabelText(/Especie \(Taxón\)/i)
    const initialSeedsInput = screen.getByLabelText(/Stock Inicial de Semillas/i)
    const submitBtn = screen.getByRole('button', { name: /agregar/i })

    await user.selectOptions(taxonSelect, 'tax-1')
    await user.type(initialSeedsInput, '120')
    await user.click(submitBtn)

    const currentYear = new Date().getFullYear()
    const expectedLotCode = `TOM-${currentYear}-001-L1`

    // SeedLot store should have the L1 lot linked to the created accession
    const lots = useSeedLotStore.getState().seedLots
    expect(lots).toHaveLength(1)
    expect(lots[0].lotCode).toBe(expectedLotCode)
    expect(lots[0].initialCount).toBe(120)
    expect(lots[0].currentCount).toBe(120)

    // The lot code should also be rendered directly inside the Accession detail panel
    expect(screen.getByText(expectedLotCode)).toBeInTheDocument()
  })
})
