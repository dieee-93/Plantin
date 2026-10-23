import React, { useSyncExternalStore } from 'react'
import type { FacilityLocation } from '@/domain/location'
import { formatGridPosition } from '@/domain/location'
import type { Individual } from '@/domain/individual'
import { getIndividualDisplayName } from '@/domain/individual'
import type { Accession } from '@/domain/accession'
import { halfH, projectCell } from '../geometry/iso'
import { subscribeHover, getHoveredSlot } from '../hoverStore'

export interface LabelsLayerProps {
  rows: number
  cols: number
  locationType: FacilityLocation['type']
  slotToPlant: Map<string, Individual>
  accessions: Accession[]
  selectedSlot: string | null
  selectedIndividualId: string | null
  showPlantNames: boolean
}

function truncate(str: string, maxLen = 12): string {
  if (!str) return ''
  return str.length > maxLen ? `${str.slice(0, maxLen - 1)}…` : str
}

export const LabelsLayer: React.FC<LabelsLayerProps> = React.memo(({
  rows,
  cols,
  locationType,
  slotToPlant,
  accessions,
  selectedSlot,
  selectedIndividualId,
  showPlantNames,
}) => {
  const hoveredSlot = useSyncExternalStore(subscribeHover, getHoveredSlot)

  const labels: React.ReactNode[] = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const posLabel = formatGridPosition(r, c)
      const center = projectCell(r, c)
      const plant = slotToPlant.get(posLabel)
      const acc = plant ? accessions.find(a => a.id === plant.accessionId) : undefined
      const rawName = plant ? getIndividualDisplayName(plant, acc?.accessionNumber) : ''
      const isSlotSelected = selectedSlot === posLabel
      const isPlantSelected = Boolean(plant && selectedIndividualId === plant.id)
      const isHovered = hoveredSlot === posLabel

      const shouldShowName = Boolean(plant && (showPlantNames || isHovered || isPlantSelected))

      // Desplazamiento vertical alternado para evitar solapes en la misma diagonal (r+c)
      const verticalJitter = (r + c) % 2 === 0 ? -4 : 4

      // Color de la etiqueta de coordenadas al pie de la baldosa
      const coordColor =
        isSlotSelected || isPlantSelected
          ? '#166534'
          : locationType === 'field' || locationType === 'growth_chamber'
            ? '#cbd5e1'
            : '#475569'

      labels.push(
        <g
          key={`label-${posLabel}`}
          transform={`translate(${center.x}, ${center.y})`}
          style={{ pointerEvents: 'none' }}
        >
          {/* Coordenada fija en el pie de la baldosa (nunca tapada por plantas de adelante) */}
          <text
            x="0"
            y={halfH - 6}
            textAnchor="middle"
            fontSize="8.5"
            fontFamily="monospace"
            fontWeight={isSlotSelected || isPlantSelected ? '800' : '600'}
            fill={coordColor}
            opacity={isSlotSelected || isPlantSelected || isHovered ? 1 : 0.75}
          >
            {posLabel}
          </text>

          {/* Etiqueta flotante con estilo píldora para el nombre de la planta */}
          {shouldShowName && (
            <g transform={`translate(0, ${halfH + 8 + (showPlantNames ? verticalJitter : 0)})`}>
              {/* Fondo semitransparente tipo píldora para máxima legibilidad */}
              <rect
                x="-38"
                y="-8"
                width="76"
                height="15"
                rx="4"
                fill={isPlantSelected ? '#15803d' : 'rgba(15, 23, 42, 0.88)'}
                stroke={isPlantSelected ? '#86efac' : 'rgba(255, 255, 255, 0.2)'}
                strokeWidth="1"
              />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                fontSize="8"
                fontFamily="monospace"
                fontWeight="700"
                fill="#ffffff"
              >
                {truncate(rawName, 12)}
              </text>

              {/* Badge del individuo (-001 #03 / Gen) solo cuando está seleccionado */}
              {isPlantSelected && plant?.generation && (
                <g transform="translate(0, -14)">
                  <rect
                    x="-20"
                    y="-6"
                    width="40"
                    height="12"
                    rx="3"
                    fill="#5b21b6"
                    stroke="#c4b5fd"
                    strokeWidth="0.8"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight="800"
                    fill="#ffffff"
                  >
                    Gen {plant.generation}
                  </text>
                </g>
              )}
            </g>
          )}
        </g>
      )
    }
  }

  return <g data-layer="labels">{labels}</g>
})
LabelsLayer.displayName = 'LabelsLayer'
