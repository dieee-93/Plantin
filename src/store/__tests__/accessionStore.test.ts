/**
 * Ciclo TDD #5 — AccessionStore
 *
 * Seam acordado: useAccessionStore — add / update / remove / getById
 *
 * El store delega la validación a createAccession, así que sólo
 * testeamos el comportamiento del store, no la validación del dominio.
 */

import { beforeEach, describe, it, expect } from 'vitest'
import { useAccessionStore } from '@/store/accessionStore'

const minimalInput = {
  accessionNumber: 'PLT-2024-001',
  taxonId: 'taxon-abc',
}

beforeEach(() => {
  // Resetea el estado del store y el localStorage entre tests
  useAccessionStore.setState({ accessions: [] })
  localStorage.clear()
})

describe('useAccessionStore', () => {
  describe('add', () => {
    it('agrega una accesión y la retorna con id generado', () => {
      const acc = useAccessionStore.getState().add(minimalInput)
      expect(acc.id).toBeTruthy()
      expect(useAccessionStore.getState().accessions).toHaveLength(1)
    })

    it('cada add genera una accesión con id único', () => {
      const a1 = useAccessionStore.getState().add(minimalInput)
      const a2 = useAccessionStore.getState().add({
        accessionNumber: 'PLT-2024-002',
        taxonId: 'taxon-abc',
      })
      expect(a1.id).not.toBe(a2.id)
      expect(useAccessionStore.getState().accessions).toHaveLength(2)
    })

    it('propaga el error de validación del dominio (accessionNumber vacío)', () => {
      expect(() =>
        useAccessionStore.getState().add({ ...minimalInput, accessionNumber: '' })
      ).toThrow('accessionNumber is required')
      // No debe agregar nada al store
      expect(useAccessionStore.getState().accessions).toHaveLength(0)
    })
  })

  describe('update', () => {
    it('actualiza un campo de la accesión correcta', () => {
      const acc = useAccessionStore.getState().add(minimalInput)
      useAccessionStore.getState().update(acc.id, { cultivarName: 'Cherry Roma' })
      const updated = useAccessionStore.getState().getById(acc.id)
      expect(updated?.cultivarName).toBe('Cherry Roma')
    })

    it('no modifica otras accesiones al hacer update', () => {
      const a1 = useAccessionStore.getState().add(minimalInput)
      const a2 = useAccessionStore.getState().add({
        accessionNumber: 'PLT-2024-002',
        taxonId: 'taxon-abc',
      })
      useAccessionStore.getState().update(a1.id, { remarks: 'Modificada' })
      const unchanged = useAccessionStore.getState().getById(a2.id)
      expect(unchanged?.remarks).toBeUndefined()
    })

    it('no hace nada si el id no existe', () => {
      useAccessionStore.getState().add(minimalInput)
      useAccessionStore.getState().update('id-inexistente', { remarks: 'X' })
      expect(useAccessionStore.getState().accessions).toHaveLength(1)
    })
  })

  describe('remove', () => {
    it('elimina la accesión del store', () => {
      const acc = useAccessionStore.getState().add(minimalInput)
      useAccessionStore.getState().remove(acc.id)
      expect(useAccessionStore.getState().accessions).toHaveLength(0)
    })

    it('sólo elimina la accesión indicada', () => {
      const a1 = useAccessionStore.getState().add(minimalInput)
      useAccessionStore.getState().add({
        accessionNumber: 'PLT-2024-002',
        taxonId: 'taxon-abc',
      })
      useAccessionStore.getState().remove(a1.id)
      expect(useAccessionStore.getState().accessions).toHaveLength(1)
    })
  })

  describe('getById', () => {
    it('retorna la accesión correcta', () => {
      const acc = useAccessionStore.getState().add(minimalInput)
      const found = useAccessionStore.getState().getById(acc.id)
      expect(found?.accessionNumber).toBe('PLT-2024-001')
    })

    it('retorna undefined si el id no existe', () => {
      const found = useAccessionStore.getState().getById('no-existe')
      expect(found).toBeUndefined()
    })
  })
})
