/**
 * Ciclo TDD #4 — CrossingEvent domain
 *
 * Seam acordado: createCrossingEvent(input) → CrossingEvent
 *
 * Invariantes de negocio:
 *   - crossName no puede estar vacío
 *   - maternalParentId y paternalParentId son obligatorios y no vacíos
 *   - Para crossType 'biparental': los dos padres deben ser distintos
 *   - Para crossType 'self': los dos padres deben ser iguales
 *   - successStatus 'pending' por defecto
 */

import { describe, it, expect } from 'vitest'
import { createCrossingEvent } from '@/domain/crossingEvent'

const baseInput = {
  crossName: 'PLT-CROSS-2024-001',
  maternalParentId: 'plant-A',
  paternalParentId: 'plant-B',
  crossType: 'biparental' as const,
}

describe('createCrossingEvent', () => {
  it('genera un id único en cada llamada', () => {
    const c1 = createCrossingEvent(baseInput)
    const c2 = createCrossingEvent(baseInput)
    expect(c1.id).toBeTruthy()
    expect(c1.id).not.toBe(c2.id)
  })

  it('asigna successStatus "pending" por defecto', () => {
    const c = createCrossingEvent(baseInput)
    expect(c.successStatus).toBe('pending')
  })

  it('acepta un successStatus explícito', () => {
    const c = createCrossingEvent({ ...baseInput, successStatus: 'successful' })
    expect(c.successStatus).toBe('successful')
  })

  it('rechaza crossName vacío', () => {
    expect(() =>
      createCrossingEvent({ ...baseInput, crossName: '' })
    ).toThrow('crossName is required')
  })

  it('rechaza crossName con solo espacios', () => {
    expect(() =>
      createCrossingEvent({ ...baseInput, crossName: '   ' })
    ).toThrow('crossName is required')
  })

  it('rechaza maternalParentId vacío', () => {
    expect(() =>
      createCrossingEvent({ ...baseInput, maternalParentId: '' })
    ).toThrow('maternalParentId is required')
  })

  it('rechaza paternalParentId vacío', () => {
    expect(() =>
      createCrossingEvent({ ...baseInput, paternalParentId: '' })
    ).toThrow('paternalParentId is required')
  })

  describe('crossType: biparental', () => {
    it('acepta padres distintos', () => {
      expect(() => createCrossingEvent(baseInput)).not.toThrow()
    })

    it('rechaza padres iguales (no puede auto-cruzarse en biparental)', () => {
      expect(() =>
        createCrossingEvent({
          ...baseInput,
          maternalParentId: 'plant-A',
          paternalParentId: 'plant-A',
        })
      ).toThrow('biparental cross requires two different parents')
    })
  })

  describe('crossType: self', () => {
    it('acepta padres iguales', () => {
      expect(() =>
        createCrossingEvent({
          ...baseInput,
          crossType: 'self',
          maternalParentId: 'plant-A',
          paternalParentId: 'plant-A',
        })
      ).not.toThrow()
    })

    it('rechaza padres distintos en self-pollination', () => {
      expect(() =>
        createCrossingEvent({
          ...baseInput,
          crossType: 'self',
          maternalParentId: 'plant-A',
          paternalParentId: 'plant-B',
        })
      ).toThrow('self cross requires the same parent for both maternal and paternal')
    })
  })
})
