/**
 * Ciclo TDD #3 — Observation domain
 *
 * Seam acordado: createObservation(input, variable) → Observation
 *
 * El `value` es siempre string (BrAPI), pero su validez depende del
 * scaleType de la PhenotypicVariable asociada:
 *   - numerical  → parseable como número, dentro de min/max si existen
 *   - ordinal    → debe existir en scaleCategories
 *   - nominal    → debe existir en scaleCategories
 *   - text/date  → cualquier string no vacío
 */

import { describe, it, expect } from 'vitest'
import { createObservation } from '@/domain/observation'
import type { PhenotypicVariable } from '@/domain/phenotypicVariable'

// ── fixtures ─────────────────────────────────────────────────────────────────

const numericalVar: PhenotypicVariable = {
  id: 'var-height',
  name: 'Plant Height',
  traitName: 'Plant height',
  traitClass: 'morphological',
  methodName: 'Measurement with ruler',
  methodType: 'measurement',
  scaleName: 'cm',
  scaleType: 'numerical',
  scaleMinimum: 0,
  scaleMaximum: 500,
}

const ordinalVar: PhenotypicVariable = {
  id: 'var-vigor',
  name: 'Vigor',
  traitName: 'Vigor',
  traitClass: 'agronomical',
  methodName: 'Visual scoring',
  methodType: 'scoring',
  scaleName: 'Vigor scale 1-3',
  scaleType: 'ordinal',
  scaleCategories: [
    { value: '1', label: 'Bajo' },
    { value: '2', label: 'Medio' },
    { value: '3', label: 'Alto' },
  ],
}

const textVar: PhenotypicVariable = {
  id: 'var-notes',
  name: 'Field notes',
  traitName: 'Field notes',
  traitClass: 'morphological',
  methodName: 'Free text',
  methodType: 'estimation',
  scaleName: 'text',
  scaleType: 'text',
}

const baseInput = {
  individualId: 'ind-001',
  variableId: 'var-height',
  observationDate: '2024-06-15T10:00:00Z',
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('createObservation', () => {
  it('genera un id único en cada llamada', () => {
    const o1 = createObservation({ ...baseInput, value: '45' }, numericalVar)
    const o2 = createObservation({ ...baseInput, value: '45' }, numericalVar)
    expect(o1.id).toBeTruthy()
    expect(o1.id).not.toBe(o2.id)
  })

  it('rechaza individualId vacío', () => {
    expect(() =>
      createObservation({ ...baseInput, individualId: '', value: '45' }, numericalVar)
    ).toThrow('individualId is required')
  })

  it('rechaza variableId vacío', () => {
    expect(() =>
      createObservation({ ...baseInput, variableId: '', value: '45' }, numericalVar)
    ).toThrow('variableId is required')
  })

  describe('scaleType: numerical', () => {
    it('acepta un valor numérico válido dentro del rango', () => {
      expect(() =>
        createObservation({ ...baseInput, value: '120' }, numericalVar)
      ).not.toThrow()
    })

    it('rechaza un value no numérico', () => {
      expect(() =>
        createObservation({ ...baseInput, value: 'alto' }, numericalVar)
      ).toThrow('value must be a number for numerical scale')
    })

    it('rechaza un value por debajo del mínimo', () => {
      expect(() =>
        createObservation({ ...baseInput, value: '-1' }, numericalVar)
      ).toThrow('value out of range')
    })

    it('rechaza un value por encima del máximo', () => {
      expect(() =>
        createObservation({ ...baseInput, value: '501' }, numericalVar)
      ).toThrow('value out of range')
    })

    it('acepta un value igual al mínimo (0)', () => {
      expect(() =>
        createObservation({ ...baseInput, value: '0' }, numericalVar)
      ).not.toThrow()
    })

    it('acepta un value igual al máximo (500)', () => {
      expect(() =>
        createObservation({ ...baseInput, value: '500' }, numericalVar)
      ).not.toThrow()
    })
  })

  describe('scaleType: ordinal / nominal', () => {
    it('acepta un value que existe en scaleCategories', () => {
      expect(() =>
        createObservation(
          { ...baseInput, variableId: 'var-vigor', value: '2' },
          ordinalVar
        )
      ).not.toThrow()
    })

    it('rechaza un value que no existe en scaleCategories', () => {
      expect(() =>
        createObservation(
          { ...baseInput, variableId: 'var-vigor', value: '9' },
          ordinalVar
        )
      ).toThrow('value must be one of the defined scale categories')
    })
  })

  describe('scaleType: text', () => {
    it('acepta cualquier string no vacío', () => {
      expect(() =>
        createObservation(
          { ...baseInput, variableId: 'var-notes', value: 'Hojas amarillas en el margen' },
          textVar
        )
      ).not.toThrow()
    })

    it('rechaza value vacío', () => {
      expect(() =>
        createObservation(
          { ...baseInput, variableId: 'var-notes', value: '' },
          textVar
        )
      ).toThrow('value cannot be empty')
    })
  })
})
