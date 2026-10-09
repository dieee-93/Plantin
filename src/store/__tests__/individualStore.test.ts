/**
 * Ciclo TDD #6 — IndividualStore
 *
 * Seam acordado: useIndividualStore — add / update / remove / getById / getByAccession
 *
 * getByAccession es el selector derivado más importante:
 * permite listar todas las plantas de una accesión.
 */

import { beforeEach, describe, it, expect } from 'vitest'
import { useIndividualStore } from '@/store/individualStore'

const baseInput = {
  accessionId: 'acc-001',
}

beforeEach(() => {
  useIndividualStore.setState({ individuals: [] })
  localStorage.clear()
})

describe('useIndividualStore', () => {
  describe('add', () => {
    it('agrega un individuo y lo retorna con id generado', () => {
      const ind = useIndividualStore.getState().add(baseInput)
      expect(ind.id).toBeTruthy()
      expect(ind.status).toBe('active')
      expect(useIndividualStore.getState().individuals).toHaveLength(1)
    })

    it('propaga el error de dominio (BBCH fuera de rango)', () => {
      expect(() =>
        useIndividualStore.getState().add({ ...baseInput, currentBBCH: 150 })
      ).toThrow('currentBBCH must be between 0 and 99')
      expect(useIndividualStore.getState().individuals).toHaveLength(0)
    })
  })

  describe('update', () => {
    it('actualiza el estadio BBCH de un individuo', () => {
      const ind = useIndividualStore.getState().add(baseInput)
      useIndividualStore.getState().update(ind.id, { currentBBCH: 65 })
      const updated = useIndividualStore.getState().getById(ind.id)
      expect(updated?.currentBBCH).toBe(65)
    })

    it('actualiza el status de un individuo', () => {
      const ind = useIndividualStore.getState().add(baseInput)
      useIndividualStore.getState().update(ind.id, { status: 'harvested' })
      const updated = useIndividualStore.getState().getById(ind.id)
      expect(updated?.status).toBe('harvested')
    })
  })

  describe('remove', () => {
    it('elimina el individuo del store', () => {
      const ind = useIndividualStore.getState().add(baseInput)
      useIndividualStore.getState().remove(ind.id)
      expect(useIndividualStore.getState().individuals).toHaveLength(0)
    })
  })

  describe('getByAccession', () => {
    it('retorna sólo los individuos de la accesión solicitada', () => {
      useIndividualStore.getState().add({ accessionId: 'acc-001' })
      useIndividualStore.getState().add({ accessionId: 'acc-001' })
      useIndividualStore.getState().add({ accessionId: 'acc-002' })

      const result = useIndividualStore.getState().getByAccession('acc-001')
      expect(result).toHaveLength(2)
      expect(result.every((i) => i.accessionId === 'acc-001')).toBe(true)
    })

    it('retorna array vacío si la accesión no tiene individuos', () => {
      const result = useIndividualStore.getState().getByAccession('acc-999')
      expect(result).toHaveLength(0)
    })
  })
})
