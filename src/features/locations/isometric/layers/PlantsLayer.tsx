import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import { motion } from 'motion/react'
import type { FacilityLocation } from '@/domain/location'
import { formatGridPosition } from '@/domain/location'
import type { Individual } from '@/domain/individual'
import { getIndividualDisplayName } from '@/domain/individual'
import type { Accession } from '@/domain/accession'
import type { Taxon } from '@/domain/taxon'
import type { IsometricLensMode } from '../botanicalArchetypes'
import { IsometricPlantSprite } from '../IsometricPlantSprite'
import { projectCell } from '../geometry/iso'
import { sortDrawables, occludes, type Drawable } from '../geometry/depth'
import { subscribeHover, getHoveredSlot } from '../hoverStore'

export interface PlantsLayerProps {
  rows: number
  cols: number
  locationType: FacilityLocation['type']
  lensMode: IsometricLensMode
  speciesFilterId: string | null
  slotToPlant: Map<string, Individual>
  accessions: Accession[]
  accessionToTaxon: Map<string, Taxon>
  selectedSlot: string | null
  selectedIndividualId: string | null
  dragOverSlot: string | null
}

function parseGridPosition(posLabel: string | null): { row: number; col: number } | null {
  if (!posLabel || posLabel.length < 4) return null
  const row = posLabel.charCodeAt(0) - 65
  const col = parseInt(posLabel.slice(2), 10) - 1
  if (Number.isNaN(row) || Number.isNaN(col)) return null
  return { row, col }
}

export const PlantsLayer: React.FC<PlantsLayerProps> = React.memo(({
  rows,
  cols,
  locationType,
  lensMode,
  speciesFilterId,
  slotToPlant,
  accessions,
  accessionToTaxon,
  selectedSlot,
  selectedIndividualId,
  dragOverSlot,
}) => {
  // Suscripción aislada al hover para calcular rayos X sin re-renderizar capas inferiores
  const hoveredSlot = useSyncExternalStore(subscribeHover, getHoveredSlot)
  const activeSlotLabel = hoveredSlot || dragOverSlot || selectedSlot
  const activeGridPos = parseGridPosition(activeSlotLabel)

  // Detección pura de individuos recién sembrados tras el montaje inicial (animación de siembra)
  const isMountedRef = useRef(false)
  const prevPlantIdsRef = useRef<Set<string>>(new Set())
  const [newlySownIds, setNewlySownIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      prevPlantIdsRef.current = new Set(Array.from(slotToPlant.values()).map(p => p.id))
      return
    }

    const added = new Set<string>()
    for (const plant of slotToPlant.values()) {
      if (!prevPlantIdsRef.current.has(plant.id)) {
        added.add(plant.id)
      }
    }

    if (added.size > 0) {
      setNewlySownIds(added)
      const timer = setTimeout(() => {
        setNewlySownIds(new Set())
      }, 400)
      prevPlantIdsRef.current = new Set(Array.from(slotToPlant.values()).map(p => p.id))
      return () => clearTimeout(timer)
    }

    prevPlantIdsRef.current = new Set(Array.from(slotToPlant.values()).map(p => p.id))
  }, [slotToPlant])

  const drawables: Drawable[] = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const posLabel = formatGridPosition(r, c)
      const plant = slotToPlant.get(posLabel)
      if (!plant) continue

      const center = projectCell(r, c)
      const acc = accessions.find(a => a.id === plant.accessionId)
      const taxon = acc ? accessionToTaxon.get(acc.id) : undefined
      const plantDisplayName = getIndividualDisplayName(plant, acc?.accessionNumber)
      const isPlantSelected = Boolean(selectedIndividualId === plant.id)
      const isDimmedByFilter = Boolean(
        speciesFilterId && (!taxon || taxon.id !== speciesFilterId)
      )

      // Comprobación de oclusión (Rayos X): si esta planta está delante de la celda activa y la tapa
      const isOccludingActiveCell = Boolean(
        activeGridPos &&
        (activeGridPos.row !== r || activeGridPos.col !== c) &&
        occludes({ row: r, col: c, bbch: plant.currentBBCH }, activeGridPos)
      )

      // Determinar si es una planta sembrada dinámicamente
      const isNewlySown = newlySownIds.has(plant.id)

      const plantSprite = (
        <IsometricPlantSprite
          individualId={plant.id}
          bbch={plant.currentBBCH}
          status={plant.status}
          label={plantDisplayName}
          isSelected={isPlantSelected}
          taxon={taxon}
          locationType={locationType}
          generation={plant.generation}
          lensMode={lensMode}
          dimmed={isDimmedByFilter}
        />
      )

      drawables.push({
        key: plant.id,
        row: r,
        col: c,
        layer: 3, // Capa de plantas
        node: (
          <g
            key={plant.id}
            transform={`translate(${center.x}, ${center.y})`}
            style={{
              opacity: isOccludingActiveCell ? 0.35 : 1,
              transition: 'opacity 0.15s ease',
            }}
          >
            {isNewlySown ? (
              <motion.g
                initial={{ y: -12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                {plantSprite}
                {/* 3 partículas de tierra que salen despedidas al sembrar */}
                <motion.g initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                  <motion.circle
                    cx="0"
                    cy="-6"
                    r="1.5"
                    fill="#78350f"
                    animate={{ cx: -7, cy: -11, opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  />
                  <motion.circle
                    cx="0"
                    cy="-6"
                    r="1.5"
                    fill="#451a03"
                    animate={{ cx: 0, cy: -15, opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  />
                  <motion.circle
                    cx="0"
                    cy="-6"
                    r="1.5"
                    fill="#78350f"
                    animate={{ cx: 7, cy: -11, opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  />
                </motion.g>
              </motion.g>
            ) : (
              plantSprite
            )}
          </g>
        ),
      })
    }
  }

  // Ordenar de atrás hacia adelante con el algoritmo del pintor
  const sorted = sortDrawables(drawables)

  return (
    <g data-layer="plants" style={{ pointerEvents: 'none' }}>
      {sorted.map(d => d.node)}
    </g>
  )
})
PlantsLayer.displayName = 'PlantsLayer'
