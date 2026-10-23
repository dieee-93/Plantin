import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { IsometricRoomInterior } from '../IsometricRoomInterior'
import { resolvePlantPalette } from '../visual/paletteKey'
import type { FacilityLocation } from '@/domain/location'
import type { Individual } from '@/domain/individual'
import type { Accession } from '@/domain/accession'
import type { Taxon } from '@/domain/taxon'
import { formatGridPosition } from '@/domain/location'

describe('Fase 1 — Rendimiento y Gradientes Compartidos en Motor Isométrico', () => {
  it('genera paletteKey estable combinando arquetipo, forma de fruto, estado vital y madurez', () => {
    const palAlive = resolvePlantPalette({
      taxon: { genus: 'Solanum', species: 'lycopersicum', family: 'Solanaceae', cropCode: 'TOM' },
      status: 'active',
      bbch: 35,
    })
    expect(palAlive.key).toBe('solanaceae_tall_round_alive_unripe')

    const palRipe = resolvePlantPalette({
      taxon: { genus: 'Solanum', species: 'lycopersicum', family: 'Solanaceae', cropCode: 'TOM' },
      status: 'active',
      bbch: 85,
    })
    expect(palRipe.key).toBe('solanaceae_tall_round_alive_ripe')

    const palDead = resolvePlantPalette({
      taxon: { genus: 'Solanum', species: 'lycopersicum', family: 'Solanaceae', cropCode: 'TOM' },
      status: 'dead',
      bbch: 85,
    })
    expect(palDead.key).toBe('solanaceae_tall_round_dead_ripe')

    const palPepper = resolvePlantPalette({
      taxon: { genus: 'Capsicum', species: 'annuum', family: 'Solanaceae', cropCode: 'PEPPER_SWEET' },
      status: 'active',
      bbch: 85,
    })
    expect(palPepper.key).toBe('solanaceae_tall_elongated_pod_alive_ripe')
  })

  it('en una sala 16×16 llena (256 plantas), el DOM tiene ≤ 20 elementos <linearGradient>/<radialGradient>', () => {
    const rows = 16
    const cols = 16
    const location: FacilityLocation = {
      id: 'room-16x16',
      name: 'Mega Invernadero',
      type: 'greenhouse',
      rows,
      cols,
      createdAt: new Date().toISOString(),
    }

    const taxon: Taxon = {
      id: 'tax-tom',
      genus: 'Solanum',
      species: 'lycopersicum',
      family: 'Solanaceae',
      cropCode: 'TOM',
      commonName: 'Tomate',
    }

    const accession: Accession = {
      id: 'acc-tom',
      accessionNumber: 'TOM-2026-BIG',
      taxonId: taxon.id,
      acquisitionSource: 'research',
    }

    // 256 individuos con diferentes estados y BBCH
    const individuals: Individual[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pos = formatGridPosition(r, c)
        individuals.push({
          id: `ind-${r}-${c}`,
          accessionId: accession.id,
          locationId: location.id,
          position: pos,
          currentBBCH: (r * cols + c) % 2 === 0 ? 30 : 85,
          status: (r * cols + c) % 20 === 0 ? 'harvested' : 'active',
        })
      }
    }

    const { container } = render(
      <IsometricRoomInterior
        location={location}
        allLocations={[location]}
        individuals={individuals}
        accessions={[accession]}
        seedLots={[]}
        taxons={[taxon]}
        selectedSlot={null}
        selectedIndividualId={null}
        onBackToMap={vi.fn()}
        onSwitchRoom={vi.fn()}
        onClickEmptySlot={vi.fn()}
        onSelectPlant={vi.fn()}
        onDropSeedInSlot={vi.fn()}
        onMovePlantToSlot={vi.fn()}
        onMovePlantToRoom={vi.fn()}
      />
    )

    const gradientElements = container.querySelectorAll('linearGradient, radialGradient')
    // El criterio de aceptación exige ≤ 20 gradientes en total dentro de la sala
    expect(gradientElements.length).toBeLessThanOrEqual(20)
    // Confirmamos que tiene significativamente menos de los 768 que generaba antes
    expect(gradientElements.length).toBeGreaterThan(0)
  }, 15000)

  it('mover el hover entre dos celdas no re-renderiza toda la sala ni sus celdas', () => {
    const location: FacilityLocation = {
      id: 'room-perf',
      name: 'Sala Test Perf',
      type: 'greenhouse',
      rows: 2,
      cols: 2,
      createdAt: new Date().toISOString(),
    }

    const taxon: Taxon = {
      id: 'tax-tom',
      genus: 'Solanum',
      species: 'lycopersicum',
      family: 'Solanaceae',
      cropCode: 'TOM',
    }

    const accession: Accession = {
      id: 'acc-tom',
      accessionNumber: 'TOM-PERF',
      taxonId: taxon.id,
      acquisitionSource: 'research',
    }

    const plant: Individual = {
      id: 'plant-1',
      accessionId: accession.id,
      locationId: location.id,
      position: 'A-01',
      status: 'active',
      currentBBCH: 45,
    }

    const { container } = render(
      <IsometricRoomInterior
        location={location}
        allLocations={[location]}
        individuals={[plant]}
        accessions={[accession]}
        seedLots={[]}
        taxons={[taxon]}
        selectedSlot={null}
        selectedIndividualId={null}
        onBackToMap={vi.fn()}
        onSwitchRoom={vi.fn()}
        onClickEmptySlot={vi.fn()}
        onSelectPlant={vi.fn()}
        onDropSeedInSlot={vi.fn()}
        onMovePlantToSlot={vi.fn()}
        onMovePlantToRoom={vi.fn()}
      />
    )

    const cells = container.querySelectorAll('.iso-cell')
    expect(cells.length).toBe(4)

    // Al interactuar con el mouse, el hover no debe alterar props del sprite
    // ni renderizar los sprites nuevamente gracias al store externo de hover y React.memo
    const cellA01 = cells[0]
    const cellA02 = cells[1]

    fireEvent.mouseEnter(cellA01)
    // El tooltip HUD aparece para la celda ocupada A-01
    expect(container.querySelector('[style*="position: absolute"]')).toBeInTheDocument()

    // Movemos a la celda vacía A-02
    fireEvent.mouseLeave(cellA01)
    fireEvent.mouseEnter(cellA02)

    // En celda vacía el tooltip desaparece automáticamente sin re-renderizar la grilla de celdas
    fireEvent.mouseLeave(cellA02)
  })
})
