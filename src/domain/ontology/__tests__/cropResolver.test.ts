import { describe, it, expect } from 'vitest'
import { resolveCropOntology, generateFallbackCropCode, getEffectiveCropCode } from '../cropResolver'
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

  it('resolves Cannabis sativa to HEMP and verifies phenotypic traits', () => {
    const result = resolveCropOntology({
      genus: 'Cannabis',
      species: 'sativa',
    })
    expect(result).not.toBeNull()
    expect(result?.cropCode).toBe('HEMP')
    expect(result?.cropName).toContain('Cannabis')
    expect(result?.confidence).toBe('exact')

    const traits = getTraitsForCrop(result!.cropCode)
    expect(traits.length).toBeGreaterThanOrEqual(4)
    expect(traits.some(t => t.id === 'HEM_THC')).toBe(true)
    expect(traits.some(t => t.id === 'HEM_CBD')).toBe(true)
  })

  it('resolves Cannabis species variants and genus fallback to HEMP', () => {
    const indicaResult = resolveCropOntology({ genus: 'Cannabis', species: 'indica' })
    expect(indicaResult?.cropCode).toBe('HEMP')

    const genusResult = resolveCropOntology({ genus: 'Cannabis', species: 'unknown_wild' })
    expect(genusResult?.cropCode).toBe('HEMP')
    expect(genusResult?.confidence).toBe('genus')
  })

  it('resolves other newly enriched crops: Coffea, Theobroma, Nicotiana', () => {
    const coffee = resolveCropOntology({ genus: 'Coffea', species: 'arabica' })
    expect(coffee?.cropCode).toBe('COFFEE')
    expect(getTraitsForCrop('COFFEE').length).toBeGreaterThan(0)

    const cacao = resolveCropOntology({ genus: 'Theobroma', species: 'cacao' })
    expect(cacao?.cropCode).toBe('CACAO')
    expect(getTraitsForCrop('CACAO').length).toBeGreaterThan(0)

    const tobacco = resolveCropOntology({ genus: 'Nicotiana', species: 'tabacum' })
    expect(tobacco?.cropCode).toBe('TOBACCO')
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

  describe('generateFallbackCropCode', () => {
    it('generates 4-letter code from genus (3 chars) + species (1 char)', () => {
      expect(generateFallbackCropCode('Passiflora', 'edulis')).toBe('PASE')
      expect(generateFallbackCropCode('Solanum', 'bulbocastanum')).toBe('SOLB')
    })

    it('handles indeterminate species (sp, spp) using genus prefix', () => {
      expect(generateFallbackCropCode('Phalaenopsis', 'sp')).toBe('PHAL')
      expect(generateFallbackCropCode('Brassica', 'spp')).toBe('BRAS')
    })

    it('pads short genus names gracefully', () => {
      expect(generateFallbackCropCode('Aa', 'achalensis')).toBe('AAX')
    })

    it('falls back to ACC when genus is empty', () => {
      expect(generateFallbackCropCode('', '')).toBe('ACC')
    })
  })

  describe('getEffectiveCropCode', () => {
    it('prioritizes explicit cropCode if set', () => {
      expect(getEffectiveCropCode({ cropCode: 'MY_CODE', genus: 'Solanum', species: 'lycopersicum' })).toBe('MY_CODE')
    })

    it('uses canonical ontology cropCode if available', () => {
      expect(getEffectiveCropCode({ genus: 'Cannabis', species: 'sativa' })).toBe('HEMP')
      expect(getEffectiveCropCode({ genus: 'Solanum', species: 'lycopersicum' })).toBe('TOM')
    })

    it('uses deterministic fallback for unmapped species', () => {
      expect(getEffectiveCropCode({ genus: 'Phalaenopsis', species: 'amabilis' })).toBe('PHAA')
    })
  })
})
