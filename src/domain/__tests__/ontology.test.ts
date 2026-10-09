import { describe, it, expect } from 'vitest'
import { getTraitsForCrop, validateTraitValue, CROP_ONTOLOGY } from '../ontology/index'

describe('Ontology Engine', () => {
  describe('getTraitsForCrop', () => {
    it('returns traits for a known crop code', () => {
      const traits = getTraitsForCrop('TOM')
      expect(traits).toHaveLength(CROP_ONTOLOGY['TOM'].length)
      expect(traits[0].id).toBe('TOM_BRIX')
    })

    it('returns an empty array for an unknown crop code', () => {
      const traits = getTraitsForCrop('UNKNOWN_CROP')
      expect(traits).toEqual([])
    })

    it('is case insensitive', () => {
      const traits = getTraitsForCrop('tom')
      expect(traits).toHaveLength(CROP_ONTOLOGY['TOM'].length)
    })
  })

  describe('validateTraitValue', () => {
    it('validates required fields', () => {
      const trait = CROP_ONTOLOGY['TOM'].find(t => t.id === 'TOM_BRIX')!
      expect(validateTraitValue(trait, null).valid).toBe(false)
      expect(validateTraitValue(trait, undefined).valid).toBe(false)
      expect(validateTraitValue(trait, '').valid).toBe(false)
      expect(validateTraitValue(trait, 5).valid).toBe(true)
    })

    it('allows empty values for non-required fields', () => {
      const trait = CROP_ONTOLOGY['TOM'].find(t => t.id === 'TOM_WEIGHT')!
      expect(validateTraitValue(trait, null).valid).toBe(true)
      expect(validateTraitValue(trait, '').valid).toBe(true)
    })

    it('validates numeric bounds', () => {
      const trait = CROP_ONTOLOGY['TOM'].find(t => t.id === 'TOM_BRIX')! // min: 0, max: 15
      expect(validateTraitValue(trait, -1).valid).toBe(false)
      expect(validateTraitValue(trait, 16).valid).toBe(false)
      expect(validateTraitValue(trait, 10).valid).toBe(true)
      expect(validateTraitValue(trait, '10').valid).toBe(true) // Should parse strings
      expect(validateTraitValue(trait, 'abc').valid).toBe(false)
    })

    it('validates categorical options', () => {
      const trait = CROP_ONTOLOGY['TOM'].find(t => t.id === 'TOM_COLOR')!
      expect(validateTraitValue(trait, 'red').valid).toBe(true)
      expect(validateTraitValue(trait, 'blue').valid).toBe(false) // not in options
    })

    it('validates numeric categorical options', () => {
      const trait = CROP_ONTOLOGY['WHT'].find(t => t.id === 'WHT_RUST')!
      expect(validateTraitValue(trait, 5).valid).toBe(true)
      expect(validateTraitValue(trait, '5').valid).toBe(true)
      expect(validateTraitValue(trait, 4).valid).toBe(false) // 4 is not in options [1,3,5,7,9]
    })

    it('validates boolean fields', () => {
      const trait = CROP_ONTOLOGY['TOM'].find(t => t.id === 'TOM_CRACKING')!
      expect(validateTraitValue(trait, true).valid).toBe(true)
      expect(validateTraitValue(trait, false).valid).toBe(true)
      expect(validateTraitValue(trait, 'true').valid).toBe(true)
      expect(validateTraitValue(trait, 'xyz').valid).toBe(false)
    })
  })
})
