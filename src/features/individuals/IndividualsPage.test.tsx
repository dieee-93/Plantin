import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { IndividualsPage } from './IndividualsPage'
import { useIndividualStore } from '@/store/individualStore'
import { useAccessionStore } from '@/store/accessionStore'
import { useTaxonStore } from '@/store/taxonStore'
import { useSeedLotStore } from '@/store/seedLotStore'
import { useObservationStore } from '@/store/observationStore'

describe('IndividualsPage', () => {
  beforeEach(() => {
    // Reset store state
    useIndividualStore.setState({ individuals: [] })
    useAccessionStore.setState({ accessions: [] })
    useSeedLotStore.setState({ seedLots: [] })
    useObservationStore.setState({ observations: [] })
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
    render(<MemoryRouter><IndividualsPage /></MemoryRouter>)
    expect(screen.getByText(/No hay individuos registrados/i)).toBeInTheDocument()
  })

  it('adds a new individual through the compact form', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><IndividualsPage /></MemoryRouter>)

    const accessionSelect = screen.getByLabelText(/Accesión Origen/i)
    const positionInput = screen.getByLabelText(/Posición/i)
    const bbchInput = screen.getByLabelText(/Estadio BBCH/i)
    const submitBtn = screen.getByRole('button', { name: /registrar individuo/i })

    // Find the accession id from store
    const accession = useAccessionStore.getState().accessions[0]

    await user.selectOptions(accessionSelect, accession.id)
    await user.type(positionInput, 'Maceta 12')
    await user.type(bbchInput, '10')
    await user.click(submitBtn)

    // Verify it appears in the UI
    expect(screen.getAllByText(/Maceta 12/i).length).toBeGreaterThan(0)
    
    // The store should have it
    const individuals = useIndividualStore.getState().individuals
    expect(individuals).toHaveLength(1)
    expect(individuals[0].location).toBe('Maceta 12')
    expect(individuals[0].currentBBCH).toBe(10)
    expect(individuals[0].accessionId).toBe(accession.id)
  })

  it('selects an individual and displays its details', async () => {
    const user = userEvent.setup()
    const accession = useAccessionStore.getState().accessions[0]
    
    useIndividualStore.getState().add({
      accessionId: accession.id,
      location: 'Campo Norte',
      currentBBCH: 60
    })

    render(<MemoryRouter><IndividualsPage /></MemoryRouter>)

    // Click on the list item in sidebar by its accession number
    const items = screen.getAllByText('TOM-2024-001')
    await user.click(items[0])

    // The details area should now show the full information
    expect(screen.getAllByText(/Campo Norte/i).length).toBeGreaterThan(0)
    expect(screen.getByText('60')).toBeInTheDocument()
    expect(screen.getAllByText('TOM-2024-001').length).toBeGreaterThan(0)
  })

  it('sows an individual from a SeedLot and deducts 1 seed from stock', async () => {
    const user = userEvent.setup()
    const accession = useAccessionStore.getState().accessions[0]

    const seedLot = useSeedLotStore.getState().add({
      accessionId: accession.id,
      lotCode: 'TOM-2024-001-L1',
      initialCount: 10,
    })

    render(<MemoryRouter><IndividualsPage /></MemoryRouter>)

    await user.selectOptions(screen.getByLabelText(/Accesión Origen/i), accession.id)
    await user.selectOptions(screen.getByLabelText(/Lote de Semillas/i), seedLot.id)
    await user.click(screen.getByRole('button', { name: /registrar individuo/i }))

    const individuals = useIndividualStore.getState().individuals
    expect(individuals).toHaveLength(1)
    expect(individuals[0].seedLotId).toBe(seedLot.id)

    const updatedLot = useSeedLotStore.getState().getById(seedLot.id)
    expect(updatedLot?.currentCount).toBe(9)
  })

  it('updates BBCH stage and harvests seeds into a new SeedLot', async () => {
    const user = userEvent.setup()
    const accession = useAccessionStore.getState().accessions[0]

    const ind = useIndividualStore.getState().add({
      accessionId: accession.id,
      location: 'Invernadero Central',
      currentBBCH: 60,
    })

    render(<MemoryRouter initialEntries={[`/individuals?selectedId=${ind.id}`]}><IndividualsPage /></MemoryRouter>)

    // Click quick milestone button to update BBCH to 75
    await user.click(screen.getByRole('button', { name: /75 · Fruto/i }))
    expect(useIndividualStore.getState().getById(ind.id)?.currentBBCH).toBe(75)

    // Open harvest panel and harvest seeds
    await user.click(screen.getByRole('button', { name: /Cosechar Semillas/i }))
    const countInput = screen.getByLabelText(/Cantidad de Semillas Cosechadas/i)
    await user.clear(countInput)
    await user.type(countInput, '250')
    await user.click(screen.getByRole('button', { name: /Confirmar Cosecha/i }))

    // Verify plant is marked as harvested and BBCH advanced to 89
    const updatedInd = useIndividualStore.getState().getById(ind.id)
    expect(updatedInd?.status).toBe('harvested')
    expect(updatedInd?.currentBBCH).toBe(89)

    // Verify new SeedLot was created and linked to this plant
    const lots = useSeedLotStore.getState().seedLots
    expect(lots).toHaveLength(1)
    expect(lots[0].harvestIndividualId).toBe(ind.id)
    expect(lots[0].initialCount).toBe(250)
    expect(lots[0].currentCount).toBe(250)
  })

  it('sows multiple plants at once, assigns sequential labels (#01, #02, #03), and deducts total seeds from the SeedLot', async () => {
    const user = userEvent.setup()
    const accession = useAccessionStore.getState().accessions[0]

    const seedLot = useSeedLotStore.getState().add({
      accessionId: accession.id,
      lotCode: 'TOM-2024-001-L1',
      initialCount: 20,
    })

    render(<MemoryRouter><IndividualsPage /></MemoryRouter>)

    await user.selectOptions(screen.getByLabelText(/Accesión Origen/i), accession.id)
    await user.selectOptions(screen.getByLabelText(/Lote de Semillas/i), seedLot.id)

    const countInput = screen.getByLabelText(/Cantidad de Plantas a Sembrar/i)
    await user.clear(countInput)
    await user.type(countInput, '3')

    await user.click(screen.getByRole('button', { name: /registrar individuo/i }))

    const individuals = useIndividualStore.getState().individuals
    expect(individuals).toHaveLength(3)
    expect(individuals.map(i => i.label)).toEqual([
      'TOM-2024-001 #01',
      'TOM-2024-001 #02',
      'TOM-2024-001 #03',
    ])

    const updatedLot = useSeedLotStore.getState().getById(seedLot.id)
    expect(updatedLot?.currentCount).toBe(17)
  })

  it('records phenotypic observations directly inside the plant detail view and displays them in the plant logbook', async () => {
    const user = userEvent.setup()
    const accession = useAccessionStore.getState().accessions[0]

    const ind = useIndividualStore.getState().add({
      accessionId: accession.id,
      label: 'TOM-2024-001 #01',
      location: 'Invernadero A',
      currentBBCH: 72,
    })

    render(<MemoryRouter initialEntries={[`/individuals?selectedId=${ind.id}`]}><IndividualsPage /></MemoryRouter>)

    // Fill a trait from TOM ontology (e.g. Peso Medio del Fruto / TOM_WEIGHT)
    const fruitWeightInput = screen.getByLabelText(/Peso Medio del Fruto/i)
    await user.type(fruitWeightInput, '185')
    await user.click(screen.getByRole('button', { name: /Guardar Medición Fenotípica/i }))

    const observations = useObservationStore.getState().observations
    expect(observations).toHaveLength(1)
    expect(observations[0].individualId).toBe(ind.id)
    expect(String(observations[0].value)).toBe('185')
    expect(observations[0].bbchAtObservation).toBe(72)

    expect(screen.getByText(/185 g/i)).toBeInTheDocument()
  })
})
