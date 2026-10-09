import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { IndividualsPage } from './IndividualsPage'
import { useIndividualStore } from '@/store/individualStore'
import { useAccessionStore } from '@/store/accessionStore'
import { useTaxonStore } from '@/store/taxonStore'

describe('IndividualsPage', () => {
  beforeEach(() => {
    // Reset store state
    useIndividualStore.setState({ individuals: [] })
    useAccessionStore.setState({ accessions: [] })
    useTaxonStore.setState({ 
      taxons: [
        { id: 'tax-1', family: 'Solanaceae', genus: 'Solanum', species: 'lycopersicum', cropCode: 'TOM', commonName: 'Tomate' }
      ] 
    })

    // Seed one accession so we can create an individual for it
    useAccessionStore.getState().add({
      accessionNumber: 'TOM-2024-001',
      taxonId: 'tax-1',
      acquisitionSource: 'wild'
    })
  })

  it('renders the empty state when there are no individuals', () => {
    render(<IndividualsPage />)
    expect(screen.getByText(/No hay individuos registrados/i)).toBeInTheDocument()
  })

  it('adds a new individual through the compact form', async () => {
    const user = userEvent.setup()
    render(<IndividualsPage />)

    const accessionSelect = screen.getByLabelText(/Accesión Origen/i)
    const locationInput = screen.getByLabelText(/Ubicación/i)
    const positionInput = screen.getByLabelText(/Posición/i)
    const bbchInput = screen.getByLabelText(/Estadio BBCH/i)
    const submitBtn = screen.getByRole('button', { name: /plantar/i })

    // Find the accession id from store
    const accession = useAccessionStore.getState().accessions[0]

    await user.selectOptions(accessionSelect, accession.id)
    await user.type(locationInput, 'Invernadero A')
    await user.type(positionInput, 'Maceta 12')
    await user.type(bbchInput, '10')
    await user.click(submitBtn)

    // Verify it appears in the UI
    expect(screen.getAllByText(/Invernadero A/i).length).toBeGreaterThan(0)
    
    // The store should have it
    const individuals = useIndividualStore.getState().individuals
    expect(individuals).toHaveLength(1)
    expect(individuals[0].location).toBe('Invernadero A')
    expect(individuals[0].position).toBe('Maceta 12')
    expect(individuals[0].currentBBCH).toBe(10)
    expect(individuals[0].accessionId).toBe(accession.id)
  })

  it('selects an individual and displays its details', async () => {
    const user = userEvent.setup()
    const accession = useAccessionStore.getState().accessions[0]
    
    useIndividualStore.getState().add({
      accessionId: accession.id,
      location: 'Campo Norte',
      position: 'Fila 3',
      currentBBCH: 60
    })

    render(<IndividualsPage />)

    // Click on the list item (it should display the location)
    const items = screen.getAllByText(/Campo Norte/i)
    await user.click(items[0])

    // The details area should now show the full information
    const detailsLabels = screen.getAllByText('Estadio BBCH')
    expect(detailsLabels.length).toBeGreaterThan(0)
    expect(screen.getByText('60')).toBeInTheDocument()
    // Subtitle displays accession number
    expect(screen.getAllByText('TOM-2024-001').length).toBeGreaterThan(0)
  })
})
