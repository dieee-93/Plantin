import { describe, it, expect } from 'vitest'
import {
  PROPAGATION_FORM_SPECS,
  getPropagationFormSpec,
  getCompatiblePropagationForms,
  isPropagationFormCompatible,
  getVegetativeCloneCapability,
  MATURE_PLANT_STAGES,
  STARTER_SPECIES_PRESETS,
} from '../propagationForm'
import type { PropagationFormId } from '../propagationForm'

describe('propagationForm domain module', () => {
  describe('PropagationFormSpec metadata & BBCH', () => {
    it('defines exact defaultBBCH values according to biological standards', () => {
      expect(getPropagationFormSpec('seed').defaultBBCH).toBe(0)
      expect(getPropagationFormSpec('bulb_tuber').defaultBBCH).toBe(5)
      expect(getPropagationFormSpec('cutting').defaultBBCH).toBe(10)
      expect(getPropagationFormSpec('seedling').defaultBBCH).toBe(14)
      expect(getPropagationFormSpec('offset_division').defaultBBCH).toBe(22)
      expect(getPropagationFormSpec('mature_grafted').defaultBBCH).toBe(35)
    })

    it('defines icons, seed-lot and individual-creation flags correctly for all propagation forms', () => {
      expect(PROPAGATION_FORM_SPECS.seed.icon).toBe('🌰')
      expect(PROPAGATION_FORM_SPECS.seed.createsSeedLot).toBe(true)
      expect(PROPAGATION_FORM_SPECS.seed.createsIndividualImmediately).toBe(false)
      expect(PROPAGATION_FORM_SPECS.seed.defaultTag).toBe('semilla')

      expect(PROPAGATION_FORM_SPECS.seedling.icon).toBe('🌱')
      expect(PROPAGATION_FORM_SPECS.seedling.createsSeedLot).toBe(false)
      expect(PROPAGATION_FORM_SPECS.seedling.createsIndividualImmediately).toBe(true)
      expect(PROPAGATION_FORM_SPECS.seedling.defaultTag).toBe('plantín')

      expect(PROPAGATION_FORM_SPECS.cutting.icon).toBe('✂️')
      expect(PROPAGATION_FORM_SPECS.cutting.createsSeedLot).toBe(false)
      expect(PROPAGATION_FORM_SPECS.cutting.createsIndividualImmediately).toBe(true)
      expect(PROPAGATION_FORM_SPECS.cutting.defaultTag).toBe('esqueje')

      expect(PROPAGATION_FORM_SPECS.bulb_tuber.icon).toBe('🧅')
      expect(PROPAGATION_FORM_SPECS.bulb_tuber.createsSeedLot).toBe(false)
      expect(PROPAGATION_FORM_SPECS.bulb_tuber.createsIndividualImmediately).toBe(true)
      expect(PROPAGATION_FORM_SPECS.bulb_tuber.defaultTag).toBe('bulbo/tubérculo')

      expect(PROPAGATION_FORM_SPECS.offset_division.icon).toBe('🌿')
      expect(PROPAGATION_FORM_SPECS.offset_division.label).toBe('Hijuelo / División de Mata')
      expect(PROPAGATION_FORM_SPECS.offset_division.shortLabel).toBe('Hijuelo / División')
      expect(PROPAGATION_FORM_SPECS.offset_division.createsSeedLot).toBe(false)
      expect(PROPAGATION_FORM_SPECS.offset_division.createsIndividualImmediately).toBe(true)
      expect(PROPAGATION_FORM_SPECS.offset_division.defaultTag).toBe('hijuelo')

      expect(PROPAGATION_FORM_SPECS.mature_grafted.icon).toBe('🌳')
      expect(PROPAGATION_FORM_SPECS.mature_grafted.label).toBe('Planta Joven / Adulta')
      expect(PROPAGATION_FORM_SPECS.mature_grafted.shortLabel).toBe('Planta Adulta')
      expect(PROPAGATION_FORM_SPECS.mature_grafted.createsSeedLot).toBe(false)
      expect(PROPAGATION_FORM_SPECS.mature_grafted.createsIndividualImmediately).toBe(true)
      expect(PROPAGATION_FORM_SPECS.mature_grafted.defaultTag).toBe('planta-adulta')
    })

    it('defines MATURE_PLANT_STAGES correctly', () => {
      expect(MATURE_PLANT_STAGES).toHaveLength(4)
      expect(MATURE_PLANT_STAGES.map(s => s.bbch)).toEqual([35, 55, 65, 75])
      expect(MATURE_PLANT_STAGES[0].label).toContain('35')
      expect(MATURE_PLANT_STAGES[1].label).toContain('55')
      expect(MATURE_PLANT_STAGES[2].label).toContain('65')
      expect(MATURE_PLANT_STAGES[3].label).toContain('75')
    })

    it('throws error when querying an unknown propagation form id', () => {
      expect(() => getPropagationFormSpec('unknown' as PropagationFormId)).toThrow()
    })
  })

  describe('getCompatiblePropagationForms rules', () => {
    it('returns seed, seedling, cutting when taxon is null or undefined (never bulb_tuber until specified)', () => {
      const nullResult = getCompatiblePropagationForms(null).map(f => f.id)
      expect(nullResult).toEqual(['seed', 'seedling', 'cutting'])
      expect(nullResult).not.toContain('bulb_tuber')

      const undefinedResult = getCompatiblePropagationForms(undefined).map(f => f.id)
      expect(undefinedResult).toEqual(['seed', 'seedling', 'cutting'])
    })

    it('verifies that Naranjo (Citrus sinensis) permits seedling, mature_grafted, cutting, seed but NOT bulb_tuber', () => {
      const citrusTaxon = {
        genus: 'Citrus',
        species: 'sinensis',
        family: 'Rutaceae',
        cropCode: 'CITRUS_ORANGE',
        commonName: 'Naranjo Dulce',
      }
      const forms = getCompatiblePropagationForms(citrusTaxon).map(f => f.id)

      expect(forms).toEqual(['seedling', 'mature_grafted', 'cutting', 'seed'])
      expect(forms).toContain('seedling')
      expect(forms).toContain('mature_grafted')
      expect(forms).toContain('cutting')
      expect(forms).toContain('seed')
      expect(forms).not.toContain('bulb_tuber')

      expect(isPropagationFormCompatible(citrusTaxon, 'seedling')).toBe(true)
      expect(isPropagationFormCompatible(citrusTaxon, 'mature_grafted')).toBe(true)
      expect(isPropagationFormCompatible(citrusTaxon, 'cutting')).toBe(true)
      expect(isPropagationFormCompatible(citrusTaxon, 'seed')).toBe(true)
      expect(isPropagationFormCompatible(citrusTaxon, 'bulb_tuber')).toBe(false)
    })

    it('verifies that Papa (Solanum tuberosum) and Ajo (Allium sativum) permit bulb_tuber as first recommended option', () => {
      const potatoTaxon = {
        genus: 'Solanum',
        species: 'tuberosum',
        family: 'Solanaceae',
        cropCode: 'POT',
        commonName: 'Papa',
      }
      const potatoForms = getCompatiblePropagationForms(potatoTaxon).map(f => f.id)
      expect(potatoForms[0]).toBe('bulb_tuber')
      expect(potatoForms).toContain('bulb_tuber')
      expect(potatoForms).toContain('seedling')
      expect(potatoForms).toContain('seed')
      expect(potatoForms).toContain('mature_grafted')
      expect(potatoForms).not.toContain('cutting')
      expect(isPropagationFormCompatible(potatoTaxon, 'bulb_tuber')).toBe(true)

      const garlicTaxon = {
        genus: 'Allium',
        species: 'sativum',
        family: 'Amaryllidaceae',
        cropCode: 'GARLIC',
        commonName: 'Ajo',
      }
      const garlicForms = getCompatiblePropagationForms(garlicTaxon).map(f => f.id)
      expect(garlicForms[0]).toBe('bulb_tuber')
      expect(garlicForms).toContain('bulb_tuber')
      expect(garlicForms).toContain('seedling')
      expect(garlicForms).toContain('seed')
      expect(garlicForms).toContain('mature_grafted')
      expect(garlicForms).not.toContain('cutting')
      expect(isPropagationFormCompatible(garlicTaxon, 'bulb_tuber')).toBe(true)
    })

    it('verifies that Maíz (Zea mays) and Lechuga (Lactuca sativa) permit seed, seedling and mature_grafted, but NOT cutting nor bulb_tuber', () => {
      const maizeTaxon = {
        genus: 'Zea',
        species: 'mays',
        family: 'Poaceae',
        cropCode: 'MAI',
        commonName: 'Maíz',
      }
      const maizeForms = getCompatiblePropagationForms(maizeTaxon).map(f => f.id)
      expect(maizeForms).toEqual(['seed', 'seedling', 'mature_grafted'])
      expect(maizeForms).not.toContain('cutting')
      expect(maizeForms).not.toContain('bulb_tuber')
      expect(isPropagationFormCompatible(maizeTaxon, 'seed')).toBe(true)
      expect(isPropagationFormCompatible(maizeTaxon, 'seedling')).toBe(true)
      expect(isPropagationFormCompatible(maizeTaxon, 'mature_grafted')).toBe(true)
      expect(isPropagationFormCompatible(maizeTaxon, 'cutting')).toBe(false)
      expect(isPropagationFormCompatible(maizeTaxon, 'bulb_tuber')).toBe(false)

      const lettuceTaxon = {
        genus: 'Lactuca',
        species: 'sativa',
        family: 'Asteraceae',
        cropCode: 'LETTUCE',
        commonName: 'Lechuga',
      }
      const lettuceForms = getCompatiblePropagationForms(lettuceTaxon).map(f => f.id)
      expect(lettuceForms).toEqual(['seed', 'seedling', 'mature_grafted'])
      expect(lettuceForms).not.toContain('cutting')
      expect(lettuceForms).not.toContain('bulb_tuber')
      expect(isPropagationFormCompatible(lettuceTaxon, 'seed')).toBe(true)
      expect(isPropagationFormCompatible(lettuceTaxon, 'seedling')).toBe(true)
      expect(isPropagationFormCompatible(lettuceTaxon, 'mature_grafted')).toBe(true)
      expect(isPropagationFormCompatible(lettuceTaxon, 'cutting')).toBe(false)
      expect(isPropagationFormCompatible(lettuceTaxon, 'bulb_tuber')).toBe(false)
    })

    it('verifies that Tomate (Solanum lycopersicum) permits seed, seedling, cutting and mature_grafted, but NOT bulb_tuber', () => {
      const tomatoTaxon = {
        genus: 'Solanum',
        species: 'lycopersicum',
        family: 'Solanaceae',
        cropCode: 'TOM',
        commonName: 'Tomate',
      }
      const tomatoForms = getCompatiblePropagationForms(tomatoTaxon).map(f => f.id)
      expect(tomatoForms).toEqual(['seed', 'seedling', 'cutting', 'mature_grafted'])
      expect(tomatoForms).toContain('seed')
      expect(tomatoForms).toContain('seedling')
      expect(tomatoForms).toContain('cutting')
      expect(tomatoForms).toContain('mature_grafted')
      expect(tomatoForms).not.toContain('bulb_tuber')
      expect(isPropagationFormCompatible(tomatoTaxon, 'cutting')).toBe(true)
      expect(isPropagationFormCompatible(tomatoTaxon, 'bulb_tuber')).toBe(false)
    })

    it('verifies direct-seeded roots like Zanahoria (Daucus carota) never allow cutting or bulb_tuber', () => {
      const carrotTaxon = {
        genus: 'Daucus',
        species: 'carota',
        family: 'Apiaceae',
        cropCode: 'CARROT',
        commonName: 'Zanahoria',
      }
      const carrotForms = getCompatiblePropagationForms(carrotTaxon).map(f => f.id)
      expect(carrotForms).toEqual(['seed', 'seedling', 'mature_grafted'])
      expect(carrotForms).not.toContain('cutting')
      expect(carrotForms).not.toContain('bulb_tuber')
    })

    it('verifies cucurbits like Zapallo (Cucurbita maxima) return seed, seedling and mature_grafted', () => {
      const squashTaxon = {
        genus: 'Cucurbita',
        species: 'maxima',
        family: 'Cucurbitaceae',
        cropCode: 'SQUASH',
        commonName: 'Zapallo',
      }
      const squashForms = getCompatiblePropagationForms(squashTaxon).map(f => f.id)
      expect(squashForms).toEqual(['seed', 'seedling', 'mature_grafted'])
      expect(squashForms).not.toContain('cutting')
      expect(squashForms).not.toContain('bulb_tuber')
    })

    it('verifies special case Caña de Azúcar (Saccharum) supports cutting as first format', () => {
      const sugarCane = {
        genus: 'Saccharum',
        species: 'officinarum',
        cropCode: 'SUG_CANE',
      }
      const caneForms = getCompatiblePropagationForms(sugarCane).map(f => f.id)
      expect(caneForms).toEqual(['cutting', 'seedling', 'seed', 'mature_grafted'])
    })

    it('verifies Batata (Ipomoea batatas) includes cutting along with bulb_tuber', () => {
      const sweetPotato = {
        genus: 'Ipomoea',
        species: 'batatas',
        cropCode: 'SWEET_POTATO',
      }
      const spForms = getCompatiblePropagationForms(sweetPotato).map(f => f.id)
      expect(spForms[0]).toBe('bulb_tuber')
      expect(spForms).toContain('cutting')
      expect(spForms).toContain('seedling')
      expect(spForms).toContain('seed')
      expect(spForms).toContain('mature_grafted')
    })

    it('verifies Frutilla (Fragaria) supports offset_division (estolón/hijuelo) and does not include cutting', () => {
      const strawberry = {
        genus: 'Fragaria',
        species: 'ananassa',
        cropCode: 'STRAWBERRY',
      }
      const strawForms = getCompatiblePropagationForms(strawberry).map(f => f.id)
      expect(strawForms).toEqual(['seedling', 'offset_division', 'mature_grafted', 'seed'])
      expect(strawForms).not.toContain('cutting')
      expect(strawForms).not.toContain('bulb_tuber')
    })

    it('verifies Banano (Musa) supports offset_division and does not include cutting nor bulb_tuber', () => {
      const banana = {
        genus: 'Musa',
        species: 'acuminata',
        cropCode: 'BANANA',
      }
      const bananaForms = getCompatiblePropagationForms(banana).map(f => f.id)
      expect(bananaForms).toEqual(['seedling', 'offset_division', 'mature_grafted', 'seed'])
      expect(bananaForms).not.toContain('cutting')
      expect(bananaForms).not.toContain('bulb_tuber')
    })
  })

  describe('Dynamic contextual labels & icons', () => {
    it('adapts bulb_tuber for Garlic (Ajo) with garlic icon and clove label', () => {
      const garlicTaxon = {
        genus: 'Allium',
        species: 'sativum',
        cropCode: 'GARLIC',
      }
      const forms = getCompatiblePropagationForms(garlicTaxon)
      const bulbForm = forms.find(f => f.id === 'bulb_tuber')!

      expect(bulbForm.icon).toBe('🧄')
      expect(bulbForm.label).toBe('Diente / Bulbo / Tubérculo')
      expect(bulbForm.shortLabel).toBe('Diente / Bulbo')
    })

    it('adapts bulb_tuber for Potato (Papa) with potato icon and tuber label', () => {
      const potatoTaxon = {
        genus: 'Solanum',
        species: 'tuberosum',
        cropCode: 'POT',
      }
      const forms = getCompatiblePropagationForms(potatoTaxon)
      const bulbForm = forms.find(f => f.id === 'bulb_tuber')!

      expect(bulbForm.icon).toBe('🥔')
      expect(bulbForm.label).toBe('Tubérculo / Bulbo')
      expect(bulbForm.shortLabel).toBe('Tubérculo')
    })

    it('adapts bulb_tuber for Ginger (Jengibre) with ginger icon and rhizome label', () => {
      const gingerTaxon = {
        genus: 'Zingiber',
        species: 'officinale',
        cropCode: 'GINGER',
      }
      const forms = getCompatiblePropagationForms(gingerTaxon)
      const bulbForm = forms.find(f => f.id === 'bulb_tuber')!

      expect(bulbForm.icon).toBe('🫚')
      expect(bulbForm.label).toBe('Rizoma / Tubérculo')
      expect(bulbForm.shortLabel).toBe('Rizoma')
    })

    it('adapts mature_grafted for Woody/Citrus vs herbaceous crops', () => {
      const citrusTaxon = {
        genus: 'Citrus',
        species: 'sinensis',
        cropCode: 'CITRUS_ORANGE',
      }
      const citrusForms = getCompatiblePropagationForms(citrusTaxon)
      const citrusMature = citrusForms.find(f => f.id === 'mature_grafted')!

      expect(citrusMature.icon).toBe('🌳')
      expect(citrusMature.label).toBe('Árbol de Vivero / Injerto')
      expect(citrusMature.shortLabel).toBe('Vivero / Injerto')
      expect(citrusMature.defaultTag).toBe('injerto')

      const tomatoTaxon = {
        genus: 'Solanum',
        species: 'lycopersicum',
        cropCode: 'TOM',
      }
      const tomatoForms = getCompatiblePropagationForms(tomatoTaxon)
      const tomatoMature = tomatoForms.find(f => f.id === 'mature_grafted')!

      expect(tomatoMature.icon).toBe('🌳')
      expect(tomatoMature.label).toBe('Planta Joven / Adulta')
      expect(tomatoMature.shortLabel).toBe('Planta Adulta')
      expect(tomatoMature.defaultTag).toBe('planta-adulta')
    })

    it('adapts offset_division for Strawberry (estolón) and Mint/Banana (hijuelo/división)', () => {
      const strawberryTaxon = {
        genus: 'Fragaria',
        species: 'ananassa',
        cropCode: 'STRAWBERRY',
      }
      const strawForms = getCompatiblePropagationForms(strawberryTaxon)
      const strawOffset = strawForms.find(f => f.id === 'offset_division')!

      expect(strawOffset.icon).toBe('🍓')
      expect(strawOffset.label).toBe('Estolón / Hijuelo')
      expect(strawOffset.shortLabel).toBe('Estolón')

      const mintTaxon = {
        genus: 'Mentha',
        species: 'spicata',
        cropCode: 'MINT',
      }
      const mintForms = getCompatiblePropagationForms(mintTaxon)
      const mintOffset = mintForms.find(f => f.id === 'offset_division')!

      expect(mintOffset.icon).toBe('🌿')
      expect(mintOffset.label).toBe('Hijuelo / División de Mata')

      const bananaTaxon = {
        genus: 'Musa',
        species: 'paradisiaca',
        cropCode: 'BANANA',
      }
      const bananaForms = getCompatiblePropagationForms(bananaTaxon)
      const bananaOffset = bananaForms.find(f => f.id === 'offset_division')!

      expect(bananaOffset.icon).toBe('🌿')
      expect(bananaOffset.label).toBe('Hijuelo / División de Mata')
    })
  })

  describe('getVegetativeCloneCapability helper', () => {
    it('returns canClone: true with cutting for Tomate, Naranjo, and Cannabis', () => {
      const tomato = { genus: 'Solanum', species: 'lycopersicum', cropCode: 'TOM' }
      const tomatoCap = getVegetativeCloneCapability(tomato)
      expect(tomatoCap.canClone).toBe(true)
      expect(tomatoCap.formId).toBe('cutting')
      expect(tomatoCap.actionLabel).toBe('Sacar Esqueje / Gajo')
      expect(tomatoCap.shortNoun).toBe('Esqueje')
      expect(tomatoCap.defaultBBCH).toBe(10)
      expect(tomatoCap.defaultTag).toBe('esqueje')

      const citrus = { genus: 'Citrus', species: 'sinensis', cropCode: 'CITRUS_ORANGE' }
      const citrusCap = getVegetativeCloneCapability(citrus)
      expect(citrusCap.canClone).toBe(true)
      expect(citrusCap.formId).toBe('cutting')
      expect(citrusCap.shortNoun).toBe('Esqueje')

      const hemp = { genus: 'Cannabis', species: 'sativa', cropCode: 'HEMP' }
      const hempCap = getVegetativeCloneCapability(hemp)
      expect(hempCap.canClone).toBe(true)
      expect(hempCap.formId).toBe('cutting')
      expect(hempCap.shortNoun).toBe('Esqueje')
    })

    it('returns canClone: true with offset_division for Strawberry and Banana', () => {
      const strawberry = { genus: 'Fragaria', species: 'ananassa', cropCode: 'STRAWBERRY' }
      const strawCap = getVegetativeCloneCapability(strawberry)
      expect(strawCap.canClone).toBe(true)
      expect(strawCap.formId).toBe('offset_division')
      expect(strawCap.actionLabel).toBe('Sacar Hijuelo / Estolón')
      expect(strawCap.shortNoun).toBe('Hijuelo')
      expect(strawCap.defaultBBCH).toBe(22)
      expect(strawCap.defaultTag).toBe('hijuelo')

      const banana = { genus: 'Musa', species: 'paradisiaca', cropCode: 'BANANA' }
      const bananaCap = getVegetativeCloneCapability(banana)
      expect(bananaCap.canClone).toBe(true)
      expect(bananaCap.formId).toBe('offset_division')
      expect(bananaCap.actionLabel).toBe('Sacar Hijuelo / Estolón')
      expect(bananaCap.shortNoun).toBe('Hijuelo')
    })

    it('returns canClone: false for Maíz, Lechuga, and Zanahoria', () => {
      const corn = { genus: 'Zea', species: 'mays', cropCode: 'MAI' }
      const cornCap = getVegetativeCloneCapability(corn)
      expect(cornCap.canClone).toBe(false)
      expect(cornCap.formId).toBeNull()
      expect(cornCap.actionLabel).toBe('')
      expect(cornCap.shortNoun).toBe('')

      const lettuce = { genus: 'Lactuca', species: 'sativa', cropCode: 'LETTUCE' }
      const lettuceCap = getVegetativeCloneCapability(lettuce)
      expect(lettuceCap.canClone).toBe(false)
      expect(lettuceCap.formId).toBeNull()

      const carrot = { genus: 'Daucus', species: 'carota', cropCode: 'CARROT' }
      const carrotCap = getVegetativeCloneCapability(carrot)
      expect(carrotCap.canClone).toBe(false)
      expect(carrotCap.formId).toBeNull()

      const nullCap = getVegetativeCloneCapability(null)
      expect(nullCap.canClone).toBe(false)
      expect(nullCap.formId).toBeNull()
    })
  })

  describe('STARTER_SPECIES_PRESETS', () => {
    it('contains exactly 10 starter presets with complete botanical and agronomic data', () => {
      expect(STARTER_SPECIES_PRESETS).toHaveLength(10)

      const expectedCrops = [
        'TOM',
        'PEPPER_SWEET',
        'LETTUCE',
        'SQUASH',
        'MAI',
        'CARROT',
        'CITRUS_ORANGE',
        'POT',
        'GARLIC',
        'HEMP',
      ]

      const actualCrops = STARTER_SPECIES_PRESETS.map(p => p.cropCode)
      expect(actualCrops).toEqual(expectedCrops)

      for (const preset of STARTER_SPECIES_PRESETS) {
        expect(preset.id).toBeTruthy()
        expect(preset.commonName).toBeTruthy()
        expect(preset.family).toBeTruthy()
        expect(preset.genus).toBeTruthy()
        expect(preset.species).toBeTruthy()
        expect(preset.cropCode).toBeTruthy()
        expect(preset.badge).toBeTruthy()
        expect(preset.imageUrl).toBeTruthy()
        expect(preset.imageUrl).toMatch(/^https:\/\//)

        const agro = preset.agronomicData
        expect(agro).toBeDefined()
        expect(typeof agro.minTemp).toBe('number')
        expect(typeof agro.maxTemp).toBe('number')
        expect(typeof agro.optTempMin).toBe('number')
        expect(typeof agro.optTempMax).toBe('number')
        expect(typeof agro.phMinimum).toBe('number')
        expect(typeof agro.phMaximum).toBe('number')
        expect(typeof agro.optPhMin).toBe('number')
        expect(typeof agro.optPhMax).toBe('number')
        expect(typeof agro.rainfallMin).toBe('number')
        expect(typeof agro.rainfallMax).toBe('number')
        expect(typeof agro.cycleDaysMin).toBe('number')
        expect(typeof agro.cycleDaysMax).toBe('number')

        expect(agro.minTemp).toBeLessThan(agro.optTempMin!)
        expect(agro.optTempMin).toBeLessThanOrEqual(agro.optTempMax!)
        expect(agro.optTempMax).toBeLessThan(agro.maxTemp!)
      }
    })

    it('ensures all starter species have coherent propagation compatibility', () => {
      const tomato = STARTER_SPECIES_PRESETS.find(p => p.cropCode === 'TOM')!
      expect(isPropagationFormCompatible(tomato, 'cutting')).toBe(true)
      expect(isPropagationFormCompatible(tomato, 'mature_grafted')).toBe(true)

      const potato = STARTER_SPECIES_PRESETS.find(p => p.cropCode === 'POT')!
      expect(isPropagationFormCompatible(potato, 'bulb_tuber')).toBe(true)
      expect(isPropagationFormCompatible(potato, 'mature_grafted')).toBe(true)

      const corn = STARTER_SPECIES_PRESETS.find(p => p.cropCode === 'MAI')!
      expect(isPropagationFormCompatible(corn, 'cutting')).toBe(false)
      expect(isPropagationFormCompatible(corn, 'bulb_tuber')).toBe(false)
      expect(isPropagationFormCompatible(corn, 'seed')).toBe(true)
      expect(isPropagationFormCompatible(corn, 'mature_grafted')).toBe(true)
    })
  })
})
