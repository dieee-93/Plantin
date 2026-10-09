/**
 * Primer ciclo TDD — Accession domain
 *
 * Seam acordado: función createAccession(input) → Accession
 * Comportamiento a verificar:
 *   1. Genera un id único si no se provee
 *   2. Aplica "unknown" como acquisitionSource por defecto
 *   3. Normaliza genus a initial mayúscula (invariante de negocio)
 *   4. Rechaza accessionNumber vacío
 */

import { describe, it, expect } from 'vitest'
import { createAccession } from '@/domain/accession'

describe('createAccession', () => {
  const minimalInput = {
    accessionNumber: 'PLT-2024-001',
    taxonId: 'taxon-abc',
  }

  it('genera un id único cuando no se provee', () => {
    const a1 = createAccession(minimalInput)
    const a2 = createAccession(minimalInput)
    expect(a1.id).toBeTruthy()
    expect(a1.id).not.toBe(a2.id)
  })

  it('usa "unknown" como acquisitionSource por defecto', () => {
    const a = createAccession(minimalInput)
    expect(a.acquisitionSource).toBe('unknown')
  })

  it('acepta un acquisitionSource explícito', () => {
    const a = createAccession({ ...minimalInput, acquisitionSource: 'wild' })
    expect(a.acquisitionSource).toBe('wild')
  })

  it('lanza error si accessionNumber está vacío', () => {
    expect(() =>
      createAccession({ ...minimalInput, accessionNumber: '' })
    ).toThrow('accessionNumber is required')
  })

  it('lanza error si accessionNumber contiene solo espacios', () => {
    expect(() =>
      createAccession({ ...minimalInput, accessionNumber: '   ' })
    ).toThrow('accessionNumber is required')
  })
})
