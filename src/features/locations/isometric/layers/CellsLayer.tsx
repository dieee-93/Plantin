import React from 'react'
import type { FacilityLocation } from '@/domain/location'
import { formatGridPosition } from '@/domain/location'
import type { Individual } from '@/domain/individual'
import { getIndividualDisplayName } from '@/domain/individual'
import type { Accession } from '@/domain/accession'
import type { Taxon } from '@/domain/taxon'
import type { IsometricLensMode } from '../botanicalArchetypes'
import { evaluateMicroclimateComfort } from '../botanicalArchetypes'
import { halfW, halfH, projectCell } from '../geometry/iso'
import { setHoveredSlot } from '../hoverStore'

export interface CellsLayerProps {
  rows: number
  cols: number
  locationType: FacilityLocation['type']
  lensMode: IsometricLensMode
  speciesFilterId: string | null
  ambientTempC: number
  slotToPlant: Map<string, Individual>
  accessions: Accession[]
  accessionToTaxon: Map<string, Taxon>
  selectedSlot: string | null
  selectedIndividualId: string | null
  dragOverSlot: string | null
  movingPlantId: string | null
  setDragOverSlot: (slot: string | null) => void
  setMovingPlantId: (id: string | null) => void
  onSelectPlant: (individualId: string, slot?: string) => void
  onClickEmptySlot: (posLabel: string) => void
  onMovePlantToSlot: (individualId: string, posLabel: string) => void
  onDropSeedInSlot: (posLabel: string, accessionId: string, seedLotId?: string) => void
}

function getBbchHeatmapColors(bbch?: number): { fill: string; stroke: string } {
  const stage = bbch ?? 0
  if (stage < 10) return { fill: '#e0f2fe', stroke: '#0284c7' }
  if (stage < 50) return { fill: '#dcfce7', stroke: '#16a34a' }
  if (stage < 70) return { fill: '#fef3c7', stroke: '#d97706' }
  if (stage < 80) return { fill: '#ffedd5', stroke: '#ea580c' }
  return { fill: '#fee2e2', stroke: '#dc2626' }
}

export const CellsLayer: React.FC<CellsLayerProps> = React.memo(({
  rows,
  cols,
  locationType,
  lensMode,
  speciesFilterId,
  ambientTempC,
  slotToPlant,
  accessions,
  accessionToTaxon,
  selectedSlot,
  selectedIndividualId,
  dragOverSlot,
  movingPlantId,
  setDragOverSlot,
  setMovingPlantId,
  onSelectPlant,
  onClickEmptySlot,
  onMovePlantToSlot,
  onDropSeedInSlot,
}) => {
  const handleSlotDrop = (e: React.DragEvent, posLabel: string) => {
    e.preventDefault()
    setDragOverSlot(null)
    const raw = e.dataTransfer.getData('application/plantin-dnd') || e.dataTransfer.getData('text/plain')
    if (!raw) return
    try {
      const payload = JSON.parse(raw)
      if (payload.kind === 'SEED') {
        onDropSeedInSlot(posLabel, payload.accessionId, payload.seedLotId)
      } else if (payload.kind === 'PLANT' && payload.individualId) {
        onMovePlantToSlot(payload.individualId, posLabel)
        setMovingPlantId(null)
      }
    } catch {
      // ignore invalid payload
    }
  }

  const cells: React.ReactNode[] = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const posLabel = formatGridPosition(r, c)
      const center = projectCell(r, c)
      const plant = slotToPlant.get(posLabel)
      const acc = plant ? accessions.find(a => a.id === plant.accessionId) : undefined
      const taxon = acc ? accessionToTaxon.get(acc.id) : undefined
      const plantDisplayName = plant ? getIndividualDisplayName(plant, acc?.accessionNumber) : ''

      const isSlotSelected = selectedSlot === posLabel
      const isPlantSelected = Boolean(plant && selectedIndividualId === plant.id)
      const isDragOver = dragOverSlot === posLabel
      const activeHighlight = isSlotSelected || isPlantSelected || isDragOver

      // Color de baldosa según lente visual
      let tileFill =
        locationType === 'field'
          ? 'rgba(120, 53, 15, 0.55)'
          : locationType === 'growth_chamber'
            ? 'rgba(30, 27, 75, 0.72)'
            : 'rgba(255, 255, 255, 0.85)'

      let tileStroke =
        locationType === 'field'
          ? '#92400e'
          : locationType === 'growth_chamber'
            ? '#4c1d95'
            : '#cbd5e1'

      if (plant) {
        if (lensMode === 'bbch') {
          const heat = getBbchHeatmapColors(plant.currentBBCH)
          tileFill = heat.fill
          tileStroke = heat.stroke
        } else if (lensMode === 'climate') {
          const comfort = evaluateMicroclimateComfort(taxon, locationType, ambientTempC)
          tileFill = comfort.tileFill
          tileStroke = comfort.tileStroke
        } else if (lensMode === 'genetics') {
          tileFill = plant.generation ? '#f3e8ff' : '#f8fafc'
          tileStroke = plant.generation ? '#9333ea' : '#cbd5e1'
        } else if (speciesFilterId && taxon?.id === speciesFilterId) {
          tileFill = '#dcfce7'
          tileStroke = '#16a34a'
        }
      }

      if (isDragOver) {
        tileFill = '#bbf7d0'
        tileStroke = '#15803d'
      } else if (isSlotSelected || isPlantSelected) {
        tileFill = '#d8f3dc'
        tileStroke = '#15803d'
      }

      cells.push(
        <g
          key={posLabel}
          className="iso-cell"
          data-interactive="true"
          transform={`translate(${center.x}, ${center.y})`}
          role="button"
          tabIndex={0}
          aria-label={
            plant
              ? `Celda ${posLabel} ocupada por ${plantDisplayName}`
              : `Celda vacía ${posLabel}`
          }
          onMouseEnter={() => setHoveredSlot(posLabel)}
          onMouseLeave={() => setHoveredSlot(null)}
          onDragOver={e => {
            e.preventDefault()
            setDragOverSlot(posLabel)
          }}
          onDragLeave={() => setDragOverSlot(null)}
          onDrop={e => {
            if (!plant) {
              handleSlotDrop(e, posLabel)
            }
          }}
          onClick={() => {
            if (movingPlantId && !plant) {
              onMovePlantToSlot(movingPlantId, posLabel)
              setMovingPlantId(null)
              return
            }
            if (plant) {
              onSelectPlant(plant.id, posLabel)
            } else {
              onClickEmptySlot(posLabel)
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (plant) {
                onSelectPlant(plant.id, posLabel)
              } else {
                onClickEmptySlot(posLabel)
              }
            }
          }}
          style={{ cursor: 'pointer', outline: 'none' }}
        >
          {/* Baldosa / Celda Isométrica con bisel interior */}
          <polygon
            className="iso-tile"
            data-selected={isSlotSelected || isPlantSelected}
            data-dragover={isDragOver}
            points={`0,${-halfH + 3} ${halfW - 4},0 0,${halfH - 3} ${-halfW + 4},0`}
            fill={tileFill}
            stroke={tileStroke}
            strokeWidth={activeHighlight ? '2.2' : '1.1'}
          />

          {/* Si la celda está vacía: Contenedor 3D Volumétrico con opacidad suave en reposo (V3) */}
          {!plant && (
            <g
              data-empty-container="3d-pot"
              className="iso-empty-pot"
              style={{
                opacity: activeHighlight ? 1 : 0.7,
                transition: 'opacity 0.15s ease',
              }}
            >
              {locationType === 'field' ? (
                /* Alcorque / Hoyo de siembra 3D sobre el camellón */
                <>
                  <ellipse cx="0" cy="-2" rx="17" ry="8.5" fill="#451a03" />
                  <ellipse
                    cx="0"
                    cy="-4"
                    rx="13.5"
                    ry="6.8"
                    fill="#78350f"
                    stroke={activeHighlight ? '#4ade80' : '#b45309'}
                    strokeWidth={activeHighlight ? '1.8' : '1'}
                  />
                  <ellipse cx="0" cy="-5" rx="9" ry="4.2" fill="#290f02" />
                </>
              ) : locationType === 'growth_chamber' ? (
                /* Contenedor hidro/técnico cuadrado 3D vacío */
                <>
                  <ellipse cx="0" cy="2" rx="16" ry="8" fill="rgba(15, 23, 42, 0.35)" />
                  <polygon points="-13,-7 0,0 0,9 -11,2" fill={activeHighlight ? '#166534' : '#334155'} />
                  <polygon points="13,-7 0,0 0,9 11,2" fill={activeHighlight ? '#14532d' : '#1e293b'} />
                  <polygon
                    points="0,-14 15,-6.5 0,1 -15,-6.5"
                    fill={activeHighlight ? '#22c55e' : '#475569'}
                    stroke={activeHighlight ? '#86efac' : '#c084fc'}
                    strokeWidth="1"
                  />
                  <polygon points="0,-12 11.5,-6.5 0,-1 -11.5,-6.5" fill="#1e293b" />
                </>
              ) : (
                /* Maceta 3D Terracota / Vivero con sustrato orgánico y perlita */
                <>
                  <ellipse cx="0" cy="3" rx="16" ry="8" fill="rgba(15, 23, 42, 0.16)" />
                  <polygon
                    points="-13,-7 0,0 0,10 -11,3"
                    fill={activeHighlight ? '#15803d' : '#c2410c'}
                  />
                  <polygon
                    points="13,-7 0,0 0,10 11,3"
                    fill={activeHighlight ? '#166534' : '#9a3412'}
                  />
                  <polygon
                    points="0,-14 15,-6.5 0,1 -15,-6.5"
                    fill={activeHighlight ? '#4ade80' : '#ea580c'}
                    stroke={activeHighlight ? '#14532d' : '#7c2d12'}
                    strokeWidth="1"
                  />
                  <polygon
                    points="0,-12 11.5,-6.5 0,-1 -11.5,-6.5"
                    fill="#3e2723"
                  />
                  <circle cx="-3" cy="-7" r="0.9" fill="rgba(255,255,255,0.55)" />
                  <circle cx="3.5" cy="-5.5" r="0.8" fill="rgba(255,255,255,0.45)" />
                </>
              )}

              {/* Botón '+' de siembra: visible solo en hover, foco o celda activa (V3) */}
              <g
                className={`iso-empty-plus${activeHighlight ? ' iso-active' : ''}`}
                data-slot-plus={posLabel}
                transform="translate(0, -15)"
                style={{
                  opacity: activeHighlight ? 1 : undefined,
                }}
              >
                <circle
                  cx="0"
                  cy="0"
                  r="6.5"
                  fill={activeHighlight ? '#16a34a' : 'rgba(255, 255, 255, 0.92)'}
                  stroke={activeHighlight ? '#ffffff' : '#94a3b8'}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="3.2"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  fill={activeHighlight ? '#ffffff' : '#475569'}
                >
                  +
                </text>
              </g>
            </g>
          )}
        </g>
      )
    }
  }

  return <g data-layer="cells">{cells}</g>
})
CellsLayer.displayName = 'CellsLayer'
