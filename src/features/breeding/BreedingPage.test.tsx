import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { BreedingPage } from './BreedingPage'
import { useAccessionStore } from '@/store/accessionStore'
import { useTaxonStore } from '@/store/taxonStore'
import { useIndividualStore } from '@/store/individualStore'
import { useObservationStore } from '@/store/observationStore'
import { useSeedLotStore } from '@/store/seedLotStore'
import { useCrossingStore } from '@/store/crossingStore'

describe('BreedingPage', () => {
  beforeEach(() => {
    useAccessionStore.setState({ accessions: [] })
    useIndividualStore.setState({ individuals: [] })
    useObservationStore.setState({ observations: [] })
    useSeedLotStore.setState({ seedLots: [] })
    useCrossingStore.setState({ crossings: [] })
    useTaxonStore.setState({
      taxons: [
        { id: 'tax-tom', family: 'Solanaceae', genus: 'Solanum', species: 'lycopersicum', cropCode: 'TOM', commonName: 'Tomate' },
      ],
    })
  })

  it('registers a biparental cross, promotes the F1 accession with pedigree, and creates the F1 SeedLot when seed count is provided', async () => {
    const user = userEvent.setup()

    const motherAcc = useAccessionStore.getState().add({
      accessionNumber: 'TOM-2026-001',
      cultivarName: 'Platense',
      taxonId: 'tax-tom',
      acquisitionSource: 'cultivated',
    })
    const fatherAcc = useAccessionStore.getState().add({
      accessionNumber: 'TOM-2026-002',
      cultivarName: 'Cherry Dulce',
      taxonId: 'tax-tom',
      acquisitionSource: 'cultivated',
    })

    render(
      <MemoryRouter>
        <BreedingPage />
      </MemoryRouter>
    )

    await user.selectOptions(screen.getByLabelText(/Parental Materno/i), motherAcc.id)
    await user.selectOptions(screen.getByLabelText(/Parental Paterno/i), fatherAcc.id)

    const seedCountInput = screen.getByLabelText(/Semillas F1 Cosechadas/i)
    await user.clear(seedCountInput)
    await user.type(seedCountInput, '45')

    await user.click(screen.getByRole('button', { name: /Generar Nueva Accesión/i }))

    const year = new Date().getFullYear()
    const expectedF1Code = `F1-TOM-${year}-001`

    // 1. New F1 Accession should exist with locked pedigree
    const f1Acc = useAccessionStore.getState().accessions.find(a => a.accessionNumber === expectedF1Code)
    expect(f1Acc).toBeDefined()
    expect(f1Acc?.pedigree).toBe('TOM-2026-001 × TOM-2026-002')
    expect(f1Acc?.maternalAccessionId).toBe(motherAcc.id)
    expect(f1Acc?.paternalAccessionId).toBe(fatherAcc.id)

    // 2. New F1 SeedLot should be created automatically in inventory
    const lots = useSeedLotStore.getState().seedLots
    expect(lots).toHaveLength(1)
    expect(lots[0].accessionId).toBe(f1Acc?.id)
    expect(lots[0].lotCode).toBe(`${expectedF1Code}-L1`)
    expect(lots[0].initialCount).toBe(45)

    // 3. CrossingEvent should be recorded in crossingStore
    const crossings = useCrossingStore.getState().crossings
    expect(crossings).toHaveLength(1)
    expect(crossings[0].resultingSeedLotId).toBe(lots[0].id)
    expect(crossings[0].successStatus).toBe('successful')
  })
})
