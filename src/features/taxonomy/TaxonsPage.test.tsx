import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TaxonsPage } from './TaxonsPage'
import { useTaxonStore, INITIAL_TAXONS } from '@/store/taxonStore'
import * as useTaxonomySearchModule from '@/hooks/useTaxonomySearch'

// Mock the hook
vi.mock('@/hooks/useTaxonomySearch', () => ({
  useTaxonomySearch: vi.fn()
}))

describe('TaxonsPage', () => {
  beforeEach(() => {
    // Reset store state to initial
    useTaxonStore.setState({ taxons: [
      { id: 'tax-1', family: 'Solanaceae', genus: 'Solanum', species: 'lycopersicum', cropCode: 'TOM', commonName: 'Tomate' },
      { id: 'tax-5', family: 'Poaceae', genus: 'Zea', species: 'mays', cropCode: 'MAI', commonName: 'Maíz' }
    ] })
    
    // Default mock implementation
    vi.mocked(useTaxonomySearchModule.useTaxonomySearch).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)
  })

  it('renders the initial taxons list', () => {
    render(<TaxonsPage />)
    expect(screen.getByText(/Nueva Especie/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Tomate/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Maíz/i).length).toBeGreaterThan(0)
  })

  it('adds a new taxon through the autocomplete form', async () => {
    const user = userEvent.setup()
    
    // Mock a search result
    vi.mocked(useTaxonomySearchModule.useTaxonomySearch).mockReturnValue({
      data: [{
        id: '123',
        source: 'GBIF',
        scientificName: 'Malus domestica',
        commonName: 'Manzano',
        family: 'Rosaceae',
        genus: 'Malus',
        species: 'domestica'
      }],
      isLoading: false,
    } as any)

    render(<TaxonsPage />)

    const searchInput = screen.getByPlaceholderText(/Buscar/i)
    await user.type(searchInput, 'Man')

    // Wait for the dropdown item to appear and click it
    const dropdownItem = await screen.findByText(/Manzano/i)
    await user.click(dropdownItem)

    // Check if the form fields were autofilled by checking the values
    expect(screen.getByDisplayValue('Rosaceae')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Malus')).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: /agregar/i })
    await user.click(submitBtn)

    // The store should have it
    const taxons = useTaxonStore.getState().taxons
    const apple = taxons.find(t => t.genus === 'Malus')
    expect(apple).toBeDefined()
    expect(apple?.species).toBe('domestica')
    expect(apple?.cropCode).toBe('APPLE') // Automatically resolved to APPLE ontology
  })

  it('selects a taxon and displays its details in the main area', async () => {
    const user = userEvent.setup()
    render(<TaxonsPage />)

    const items = screen.getAllByText(/Tomate/i)
    await user.click(items[0])

    const detailsHeading = screen.getByRole('heading', { name: /Solanum lycopersicum/i })
    expect(detailsHeading).toBeInTheDocument()
    expect(screen.getAllByText('TOM').length).toBeGreaterThan(0)
  })
})
