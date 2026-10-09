import { describe, it, expect } from 'vitest'
import { resolveCropOntology } from '../cropResolver'
import { getTraitsForCrop } from '../index'

describe('cropResolver', () => {
  it('resolves exact match for Solanum lycopersicum to TOM', () => {
    const result = resolveCropOntology({
      genus: 'Solanum',
      species: 'lycopersicum',
    })
    expect(result).not.toBeNull()
    expect(result?.cropCode).toBe('TOM')
    expect(result?.confidence).toBe('exact')

    const traits = getTraitsForCrop(result!.cropCode)
    expect(traits.length).toBeGreaterThan(0)
  })

  it('resolves Solanum tuberosum to POT and gets traits', () => {
    const result = resolveCropOntology({
      genus: 'Solanum',
      species: 'tuberosum',
    })
    expect(result).not.toBeNull()
    expect(result?.cropCode).toBe('POT')
    expect(result?.confidence).toBe('exact')

    const traits = getTraitsForCrop(result!.cropCode)
    expect(traits.length).toBeGreaterThan(0)
  })

  it('resolves Zea mays to MAI', () => {
    const result = resolveCropOntology({
      genus: 'Zea',
      species: 'mays',
    })
    expect(result).not.toBeNull()
    expect(result?.cropCode).toBe('MAI')
    expect(result?.confidence).toBe('exact')
  })

  it('resolves botanical synonyms (Lycopersicon esculentum)', () => {
    const result = resolveCropOntology({
      genus: 'Lycopersicon',
      species: 'esculentum',
    })
    expect(result).not.toBeNull()
    expect(result?.cropCode).toBe('TOM')
    expect(result?.confidence).toBe('synonym')
  })

  it('resolves wild relative by genus (Solanum pimpinellifolium)', () => {
    const result = resolveCropOntology({
      genus: 'Solanum',
      species: 'pimpinellifolium',
    })
    expect(result).not.toBeNull()
    expect(result?.cropCode).toBe('TOM')
    expect(result?.confidence).toBe('genus')
  })

  it('returns null when no crop ontology exists (no level 4 fallback)', () => {
    const result = resolveCropOntology({
      genus: 'Phalaenopsis',
      species: 'amabilis', // An orchid without crop ontology
    })
    expect(result).toBeNull()
  })

  it('handles empty inputs safely', () => {
    expect(resolveCropOntology({})).toBeNull()
  })
})
