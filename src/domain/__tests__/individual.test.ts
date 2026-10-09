/**
 * Ciclo TDD #2 — Individual domain
 *
 * Seam acordado: función createIndividual(input) → Individual
 * Comportamiento a verificar:
 *   1. Genera un id único si no se provee
 *   2. Status 'active' por defecto
 *   3. Rechaza BBCH fuera del rango 0–99
 *   4. Rechaza que un individuo sea su propio padre (maternalParentId o paternalParentId === su propio id)
 *   5. Si crossType es 'self', ambos parentIds deben ser iguales entre sí
 */

import { describe, it, expect } from 'vitest'
import { createIndividual } from '@/domain/individual'

describe('createIndividual', () => {
  const minimalInput = {
    accessionId: 'acc-001',
  }

  it('genera un id único en cada llamada', () => {
    const i1 = createIndividual(minimalInput)
    const i2 = createIndividual(minimalInput)
    expect(i1.id).toBeTruthy()
    expect(i1.id).not.toBe(i2.id)
  })

  it('asigna status "active" por defecto', () => {
    const ind = createIndividual(minimalInput)
    expect(ind.status).toBe('active')
  })

  it('acepta un status explícito', () => {
    const ind = createIndividual({ ...minimalInput, status: 'dead' })
    expect(ind.status).toBe('dead')
  })

  describe('validación de BBCH', () => {
    it('acepta BBCH en el límite inferior (0)', () => {
      expect(() =>
        createIndividual({ ...minimalInput, currentBBCH: 0 })
      ).not.toThrow()
    })

    it('acepta BBCH en el límite superior (99)', () => {
      expect(() =>
        createIndividual({ ...minimalInput, currentBBCH: 99 })
      ).not.toThrow()
    })

    it('rechaza BBCH negativo', () => {
      expect(() =>
        createIndividual({ ...minimalInput, currentBBCH: -1 })
      ).toThrow('currentBBCH must be between 0 and 99')
    })

    it('rechaza BBCH mayor a 99', () => {
      expect(() =>
        createIndividual({ ...minimalInput, currentBBCH: 100 })
      ).toThrow('currentBBCH must be between 0 and 99')
    })
  })

  describe('validación de pedigrí', () => {
    it('rechaza que maternalParentId sea igual al id del individuo', () => {
      // Usamos la misma id para simular auto-referencia
      expect(() =>
        createIndividual({
          ...minimalInput,
          id: 'plant-1',
          maternalParentId: 'plant-1',
        })
      ).toThrow('an individual cannot be its own parent')
    })

    it('rechaza que paternalParentId sea igual al id del individuo', () => {
      expect(() =>
        createIndividual({
          ...minimalInput,
          id: 'plant-1',
          paternalParentId: 'plant-1',
        })
      ).toThrow('an individual cannot be its own parent')
    })

    it('en crossType "self", acepta que ambos parentIds sean iguales', () => {
      expect(() =>
        createIndividual({
          ...minimalInput,
          crossType: 'self',
          maternalParentId: 'plant-2',
          paternalParentId: 'plant-2',
        })
      ).not.toThrow()
    })

    it('en crossType "self", rechaza parentIds distintos', () => {
      expect(() =>
        createIndividual({
          ...minimalInput,
          crossType: 'self',
          maternalParentId: 'plant-2',
          paternalParentId: 'plant-3',
        })
      ).toThrow('self-pollination requires the same parent for both maternal and paternal')
    })
  })
})
