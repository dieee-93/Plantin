import React from 'react'
import type { FacilityLocation } from '@/domain/location'
import type { Individual } from '@/domain/individual'
import type { Accession } from '@/domain/accession'
import type { SeedLot } from '@/domain/seedLot'
import type { Taxon } from '@/domain/taxon'
import type { PlacedObject } from '@/domain/roomLayout'
import type { GhostObject } from '../editor/editorTypes'
import type { IsometricLensMode } from '../botanicalArchetypes'
import { FloorLayer } from './FloorLayer'
import { SceneryLayer } from './SceneryLayer'
import { ObjectsLayer } from './ObjectsLayer'
import { GhostOverlayLayer } from '../editor/layers/GhostOverlayLayer'
import { CellsLayer } from './CellsLayer'
import { PlantsLayer } from './PlantsLayer'
import { LabelsLayer } from './LabelsLayer'
import { OverlayLayer, type PedigreeLink } from './OverlayLayer'
import { AmbientLayer } from './AmbientLayer'

export interface RoomSceneLayersProps {
  location: FacilityLocation
  rows: number
  cols: number
  wallColors: {
    leftWall: string
    rightWall: string
    topCap: string
    sideCap: string
    wallStroke: string
    baseboard: string
    floor: string
    floorSideLeft: string
    floorSideRight: string
  }
  roomSeedLots: SeedLot[]
  onNavigateSeedLot?: (seedLotId: string) => void
  placedObjects: PlacedObject[]
  selectedObjectId: string | null
  ghost: GhostObject | null
  drawPreview?: { tool: string; start: { x: number; y: number }; current: { x: number; y: number } } | null
  isSpaceMode: boolean
  onSelectObject: (id: string) => void
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
  setMovingPlantId: (plantId: string | null) => void
  onSelectPlant: (id: string) => void
  onClickEmptySlot: (slot: string) => void
  onMovePlantToSlot: (plantId: string, slot: string) => void
  onDropSeedInSlot: (slot: string, accessionId: string, seedLotId?: string) => void
  showPlantNames: boolean
  pedigreeLinks: PedigreeLink[]
  viewBox: { minX: number; minY: number; width: number; height: number }
  ambientLightingEnabled: boolean
}

export const RoomSceneLayers: React.FC<RoomSceneLayersProps> = React.memo((props) => {
  const {
    location,
    rows,
    cols,
    wallColors,
    roomSeedLots,
    onNavigateSeedLot,
    placedObjects,
    selectedObjectId,
    ghost,
    drawPreview,
    isSpaceMode,
    onSelectObject,
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
    showPlantNames,
    pedigreeLinks,
    viewBox,
    ambientLightingEnabled,
  } = props

  return (
    <>
      {/* ── Capa 1: Suelo y losa 3D ── */}
      <FloorLayer rows={rows} cols={cols} locationType={location.type} wallColors={wallColors} />

      {/* ── Capa 2: Escenografía perimetral, muros y equipamiento ── */}
      <SceneryLayer
        location={location}
        rows={rows}
        cols={cols}
        wallColors={wallColors}
        roomSeedLots={roomSeedLots}
        onNavigateSeedLot={onNavigateSeedLot}
      />

      {/* ── Capa 2.5: Objetos del catálogo con orden de profundidad topológico ── */}
      <ObjectsLayer
        placedObjects={placedObjects}
        selectedObjectId={selectedObjectId}
        onSelectObject={onSelectObject}
      />

      {/* ── Capa 2.6: Vista previa fantasma de colocación y trazado ── */}
      <GhostOverlayLayer ghost={ghost} drawPreview={drawPreview} />

      {/* ── Capa 3: Baldosas e interacción de celda ── */}
      <CellsLayer
        rows={rows}
        cols={cols}
        locationType={location.type}
        lensMode={lensMode}
        speciesFilterId={speciesFilterId}
        ambientTempC={ambientTempC}
        slotToPlant={slotToPlant}
        accessions={accessions}
        accessionToTaxon={accessionToTaxon}
        selectedSlot={selectedSlot}
        selectedIndividualId={selectedIndividualId}
        dragOverSlot={dragOverSlot}
        movingPlantId={movingPlantId}
        setDragOverSlot={setDragOverSlot}
        setMovingPlantId={setMovingPlantId}
        onSelectPlant={onSelectPlant}
        onClickEmptySlot={onClickEmptySlot}
        onMovePlantToSlot={onMovePlantToSlot}
        onDropSeedInSlot={onDropSeedInSlot}
      />

      {/* ── Capa 4: Plantas ordenadas por profundidad ── */}
      <g opacity={isSpaceMode ? 0.9 : 1}>
        <PlantsLayer
          rows={rows}
          cols={cols}
          locationType={location.type}
          lensMode={lensMode}
          speciesFilterId={speciesFilterId}
          slotToPlant={slotToPlant}
          accessions={accessions}
          accessionToTaxon={accessionToTaxon}
          selectedSlot={selectedSlot}
          selectedIndividualId={selectedIndividualId}
          dragOverSlot={dragOverSlot}
        />
      </g>

      {/* ── Capa 5: Etiquetas de coordenadas y nombres ── */}
      {!isSpaceMode && (
        <LabelsLayer
          rows={rows}
          cols={cols}
          locationType={location.type}
          slotToPlant={slotToPlant}
          accessions={accessions}
          selectedSlot={selectedSlot}
          selectedIndividualId={selectedIndividualId}
          showPlantNames={showPlantNames}
        />
      )}

      {/* ── Capa 6: Vínculos parentales y overlays ── */}
      {!isSpaceMode && (
        <OverlayLayer
          pedigreeLinks={pedigreeLinks}
          lensMode={lensMode}
          selectedIndividualId={selectedIndividualId}
        />
      )}

      {/* ── Capa 7: Luz diurna ambiental ── */}
      <AmbientLayer
        locationType={location.type}
        viewBox={viewBox}
        enabled={ambientLightingEnabled}
      />
    </>
  )
})
RoomSceneLayers.displayName = 'RoomSceneLayers'
