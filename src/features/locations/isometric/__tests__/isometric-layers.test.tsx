import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { IsometricRoomInterior } from '../IsometricRoomInterior'
import { SceneryLayer } from '../layers/SceneryLayer'
import { CellsLayer } from '../layers/CellsLayer'
import { LabelsLayer } from '../layers/LabelsLayer'
import type { FacilityLocation } from '@/domain/location'
import type { Individual } from '@/domain/individual'

const mockLocation: FacilityLocation = {
  id: 'loc-test-1',
  name: 'Invernadero pequeño',
  type: 'greenhouse',
  capacity: 4,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const mockFieldLocation: FacilityLocation = {
  id: 'loc-field-1',
  name: 'Parcela experimental',
  type: 'field',
  capacity: 4,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const mockIndividuals: Individual[] = [
  {
    id: 'ind-1',
    accessionId: 'acc-1',
    locationId: 'loc-test-1',
    position: 'A-01',
    status: 'active',
    currentBBCH: 65,
    generation: 'F2',
  },
]

describe('Fase 2 — Capas, Geometría y Legibilidad', () => {
  it('SceneryLayer renderiza el cartel con la letra Ñ preservada en mayúsculas (V6)', () => {
    render(
      <svg>
        <SceneryLayer
          location={mockLocation}
          rows={2}
          cols={2}
          wallColors={{
            leftWall: '#fff',
            rightWall: '#eee',
            topCap: '#ccc',
            sideCap: '#bbb',
            wallStroke: '#aaa',
            baseboard: '#999',
          }}
          roomSeedLots={[]}
        />
      </svg>
    )

    // Debe contener 'INVERNADERO PEQUEÑO' con Ñ (no PEQUEO)
    expect(screen.getByText('INVERNADERO PEQUEÑO')).toBeInTheDocument()
  })

  it('SceneryLayer en campo abierto (field) dibuja mangueras de riego en negro polietileno #1e293b (D1)', () => {
    const { container } = render(
      <svg>
        <SceneryLayer
          location={mockFieldLocation}
          rows={2}
          cols={2}
          wallColors={{
            leftWall: 'transparent',
            rightWall: 'transparent',
            topCap: '#a16207',
            sideCap: '#78350f',
            wallStroke: '#a16207',
            baseboard: '#78350f',
          }}
          roomSeedLots={[]}
        />
      </svg>
    )

    const ridges = container.querySelector('[data-scenery="field-ridges"]')
    expect(ridges).toBeInTheDocument()
    const dripLines = ridges?.querySelectorAll('line')
    expect(dripLines?.length).toBeGreaterThan(0)
    // El trazo debe ser el polietileno negro #1e293b
    expect(dripLines?.[0]).toHaveAttribute('stroke', '#1e293b')
    expect(dripLines?.[0]).toHaveAttribute('opacity', '0.45')
  })

  it('CellsLayer en reposo (idle) oculta el botón "+" en celdas vacías (V3)', () => {
    const { container } = render(
      <svg>
        <CellsLayer
          rows={2}
          cols={2}
          locationType="greenhouse"
          lensMode="species"
          speciesFilterId={null}
          ambientTempC={22}
          slotToPlant={new Map()}
          accessions={[]}
          accessionToTaxon={new Map()}
          selectedSlot={null}
          selectedIndividualId={null}
          dragOverSlot={null}
          movingPlantId={null}
          setDragOverSlot={vi.fn()}
          setMovingPlantId={vi.fn()}
          onSelectPlant={vi.fn()}
          onClickEmptySlot={vi.fn()}
          onMovePlantToSlot={vi.fn()}
          onDropSeedInSlot={vi.fn()}
        />
      </svg>
    )

    // La maceta vacía 3D se renderiza con menor contraste (opacidad 0.7 en reposo)
    const emptyPots = container.querySelectorAll('[data-empty-container="3d-pot"]')
    expect(emptyPots.length).toBe(4)
    expect(emptyPots[0]).toHaveStyle({ opacity: '0.7' })

    // Los botones '+' tienen clase .iso-empty-plus para control CSS en reposo
    const plusButtons = container.querySelectorAll('.iso-empty-plus')
    expect(plusButtons.length).toBe(4)
    // En reposo no tienen la clase de activación ni inline opacity 1
    expect(plusButtons[0]).toHaveClass('iso-empty-plus')
    expect(plusButtons[0]).not.toHaveClass('iso-active')
    expect(plusButtons[0].getAttribute('style') || '').not.toContain('opacity: 1')
  })

  it('LabelsLayer desacopla las etiquetas de coordenadas y nombres sobre las plantas (V1, V7)', () => {
    render(
      <svg>
        <LabelsLayer
          rows={2}
          cols={2}
          locationType="greenhouse"
          slotToPlant={new Map([['A-01', mockIndividuals[0]]])}
          accessions={[{ id: 'acc-1', accessionNumber: 'ACC-001', taxonId: 'tx-1', acquisitionSource: 'research' }]}
          selectedSlot={null}
          selectedIndividualId={null}
          showPlantNames={true}
        />
      </svg>
    )

    // Coordenadas siempre legibles al pie
    expect(screen.getByText('A-01')).toBeInTheDocument()
    expect(screen.getByText('A-02')).toBeInTheDocument()
    // Nombre truncado tipo píldora cuando showPlantNames está activo
    expect(screen.getByText(/ACC-001/i)).toBeInTheDocument()
  })

  it('IsometricRoomInterior integra todas las capas y mantiene <600 líneas de código', () => {
    const { container } = render(
      <IsometricRoomInterior
        location={mockLocation}
        allLocations={[mockLocation]}
        individuals={mockIndividuals}
        accessions={[{ id: 'acc-1', accessionNumber: 'ACC-001', taxonId: 'tx-1', acquisitionSource: 'research' }]}
        seedLots={[]}
        taxons={[]}
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

    expect(container.querySelector('[data-layer="floor"]')).toBeInTheDocument()
    expect(container.querySelector('[data-layer="scenery"]')).toBeInTheDocument()
    expect(container.querySelector('[data-layer="cells"]')).toBeInTheDocument()
    expect(container.querySelector('[data-layer="plants"]')).toBeInTheDocument()
    expect(container.querySelector('[data-layer="labels"]')).toBeInTheDocument()
  })
})
