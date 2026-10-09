import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccessionsPage } from './AccessionsPage'
import { useAccessionStore } from '@/store/accessionStore'

import { useTaxonStore } from '@/store/taxonStore'

describe('AccessionsPage', () => {
  beforeEach(() => {
    // Reset store states
    useAccessionStore.setState({ accessions: [] })
    useTaxonStore.setState({ 
      taxons: [
        { id: 'tax-1', family: 'Solanaceae', genus: 'Solanum', species: 'lycopersicum', cropCode: 'TOM' },
        { id: 'tax-3', family: 'Poaceae', genus: 'Zea', species: 'mays', cropCode: 'MAI' }
      ] 
    })
  })

  it('renders the empty state when there are no accessions', () => {
    render(<AccessionsPage />)
    expect(screen.getByText(/no hay accesiones/i)).toBeInTheDocument()
    expect(screen.getByText(/seleccione una accesión/i)).toBeInTheDocument()
  })

  it('adds a new accession through the compact form with validation', async () => {
    const user = userEvent.setup()
    render(<AccessionsPage />)

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

    render(<AccessionsPage />)

    // Click on the list item
    const listItem = screen.getByText('TEST-2024-001')
    await user.click(listItem)

    // The details area should now show the full information
    const detailsHeading = screen.getByRole('heading', { name: 'TEST-2024-001' })
    expect(detailsHeading).toBeInTheDocument()
    // It should render the resolved species name (Zea mays)
    expect(screen.getAllByText(/Zea mays/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/breeding/i).length).toBeGreaterThan(0)
  })
})
