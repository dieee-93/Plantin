import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { FacilityLocation } from '@/domain/location'
import {
  formatGridPosition,
  getLocationGridDimensions,
} from '@/domain/location'
import type { Individual } from '@/domain/individual'
import type { Accession } from '@/domain/accession'
import type { SeedLot } from '@/domain/seedLot'
import type { Taxon } from '@/domain/taxon'
import {
  resolveBotanicalArchetype,
  type IsometricLensMode,
} from './botanicalArchetypes'
import { SharedDefs } from './visual/SharedDefs'
import { resolvePlantPalette, type PlantPaletteData } from './visual/paletteKey'
import { halfW, halfH, roomViewBox } from './geometry/iso'
import { FloorLayer } from './layers/FloorLayer'
import { SceneryLayer } from './layers/SceneryLayer'
import { CellsLayer } from './layers/CellsLayer'
import { PlantsLayer } from './layers/PlantsLayer'
import { LabelsLayer } from './layers/LabelsLayer'
import { OverlayLayer } from './layers/OverlayLayer'
import { AmbientLayer } from './layers/AmbientLayer'
import { RoomHoverTooltip } from './RoomHoverTooltip'
import { RoomTopBar } from './ui/RoomTopBar'
import { RoomLensBar } from './ui/RoomLensBar'
import { RoomOtherLocationsBar } from './ui/RoomOtherLocationsBar'
import { RoomSeedTray } from './ui/RoomSeedTray'
import { RoomPlantStrip } from './ui/RoomPlantStrip'

export interface IsometricRoomInteriorProps {
  location: FacilityLocation
  allLocations: FacilityLocation[]
  individuals: Individual[]
  accessions: Accession[]
  seedLots: SeedLot[]
  taxons?: Taxon[]
  ambientTempC?: number
  selectedSlot: string | null
  selectedIndividualId: string | null
  onBackToMap: () => void
  onSwitchRoom: (locationId: string) => void
  onClickEmptySlot: (posLabel: string) => void
  onSelectPlant: (individualId: string) => void
  onDropSeedInSlot: (posLabel: string, accessionId: string, seedLotId?: string) => void
  onMovePlantToSlot: (individualId: string, targetPosLabel: string) => void
  onMovePlantToRoom: (individualId: string, targetLocationId: string) => void
  onUpdateGridDimensions?: (rows: number, cols: number) => void
  onNavigateSeedLot?: (seedLotId: string) => void
}

export const IsometricRoomInterior: React.FC<IsometricRoomInteriorProps> = ({
  location,
  allLocations,
  individuals,
  accessions,
  seedLots,
  taxons = [],
  ambientTempC = 20,
  selectedSlot,
  selectedIndividualId,
  onBackToMap,
  onSwitchRoom,
  onClickEmptySlot,
  onSelectPlant,
  onDropSeedInSlot,
  onMovePlantToSlot,
  onMovePlantToRoom,
  onUpdateGridDimensions,
  onNavigateSeedLot,
}) => {
  const [zoom, setZoom] = useState(1)
  const [lensMode, setLensMode] = useState<IsometricLensMode>('species')
  const [speciesFilterId, setSpeciesFilterId] = useState<string | null>(null)
  const [showPlantNames, setShowPlantNames] = useState(false)
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)
  const [movingPlantId, setMovingPlantId] = useState<string | null>(null)

  // Estado de luz diurna ambiental persistido en localStorage
  const [ambientLightingEnabled, setAmbientLightingEnabled] = useState(() => {
    try {
      return localStorage.getItem('plantin_ambient_light') !== 'false'
    } catch {
      return true
    }
  })

  const handleToggleAmbientLighting = useCallback(() => {
    setAmbientLightingEnabled(prev => {
      const next = !prev
      try {
        localStorage.setItem('plantin_ambient_light', String(next))
      } catch {}
      return next
    })
  }, [])

  // Pausar animaciones (.iso-paused) cuando la sala no está visible en pantalla (IntersectionObserver)
  const [isRoomVisible, setIsRoomVisible] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsRoomVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const roomIndividuals = useMemo(
    () => individuals.filter(ind => ind.locationId === location.id),
    [individuals, location.id]
  )

  const roomSeedLots = useMemo(
    () => seedLots.filter(lot => lot.locationId === location.id && lot.status === 'active'),
    [seedLots, location.id]
  )

  const { rows, cols, totalSlots } = useMemo(
    () => getLocationGridDimensions(location, roomIndividuals.length),
    [location, roomIndividuals.length]
  )

  const accessionToTaxon = useMemo(() => {
    const map = new Map<string, Taxon>()
    for (const acc of accessions) {
      const t = taxons.find(tx => tx.id === acc.taxonId)
      if (t) map.set(acc.id, t)
    }
    return map
  }, [accessions, taxons])

  const speciesInRoom = useMemo(() => {
    const counts = new Map<string, { taxon: Taxon; count: number; badgeColor: string; archetypeLabel: string }>()
    for (const ind of roomIndividuals) {
      const taxon = accessionToTaxon.get(ind.accessionId)
      if (!taxon) continue
      const existing = counts.get(taxon.id)
      if (existing) {
        existing.count += 1
      } else {
        const profile = resolveBotanicalArchetype(taxon)
        counts.set(taxon.id, {
          taxon,
          count: 1,
          badgeColor: profile.badgeColor,
          archetypeLabel: profile.archetypeLabel,
        })
      }
    }
    return Array.from(counts.values())
  }, [roomIndividuals, accessionToTaxon])

  const slotToPlant = useMemo(() => {
    const map = new Map<string, Individual>()
    const unassigned: Individual[] = []

    const validLabels = new Set<string>()
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        validLabels.add(formatGridPosition(r, c))
      }
    }

    for (const ind of roomIndividuals) {
      const candidate = (ind.position || ind.location || '').trim().toUpperCase()
      if (validLabels.has(candidate) && !map.has(candidate)) {
        map.set(candidate, ind)
      } else {
        unassigned.push(ind)
      }
    }

    let uIdx = 0
    for (let r = 0; r < rows && uIdx < unassigned.length; r++) {
      for (let c = 0; c < cols && uIdx < unassigned.length; c++) {
        const label = formatGridPosition(r, c)
        if (!map.has(label)) {
          map.set(label, unassigned[uIdx])
          uIdx++
        }
      }
    }

    return map
  }, [roomIndividuals, rows, cols])

  const plantCoordinates = useMemo(() => {
    const coords = new Map<string, { posLabel: string; x: number; y: number; ind: Individual }>()
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const posLabel = formatGridPosition(r, c)
        const plant = slotToPlant.get(posLabel)
        if (plant) {
          coords.set(plant.id, {
            posLabel,
            x: (c - r) * halfW,
            y: (c + r + 1) * halfH,
            ind: plant,
          })
        }
      }
    }
    return coords
  }, [slotToPlant, rows, cols])

  const pedigreeLinks = useMemo(() => {
    if (lensMode !== 'genetics' && !selectedIndividualId) return []
    const links: {
      id: string
      fromX: number
      fromY: number
      toX: number
      toY: number
      role: 'Madre' | 'Padre'
    }[] = []

    for (const [, childNode] of plantCoordinates) {
      const { ind, x: toX, y: toY } = childNode
      const isRelevant =
        lensMode === 'genetics' ||
        ind.id === selectedIndividualId ||
        ind.maternalParentId === selectedIndividualId ||
        ind.paternalParentId === selectedIndividualId

      if (!isRelevant) continue

      if (ind.maternalParentId && plantCoordinates.has(ind.maternalParentId)) {
        const mother = plantCoordinates.get(ind.maternalParentId)!
        links.push({
          id: `${mother.ind.id}->${ind.id}-M`,
          fromX: mother.x,
          fromY: mother.y - 24,
          toX,
          toY: toY - 24,
          role: 'Madre',
        })
      }
      if (
        ind.paternalParentId &&
        ind.paternalParentId !== ind.maternalParentId &&
        plantCoordinates.has(ind.paternalParentId)
      ) {
        const father = plantCoordinates.get(ind.paternalParentId)!
        links.push({
          id: `${father.ind.id}->${ind.id}-P`,
          fromX: father.x,
          fromY: father.y - 24,
          toX,
          toY: toY - 24,
          role: 'Padre',
        })
      }
    }
    return links
  }, [plantCoordinates, lensMode, selectedIndividualId])

  const otherLocations = useMemo(
    () => allLocations.filter(l => l.id !== location.id),
    [allLocations, location.id]
  )

  const { minX, minY, viewBoxWidth, viewBoxHeight } = useMemo(
    () => roomViewBox(rows, cols),
    [rows, cols]
  )

  const wallColors = useMemo(() => {
    switch (location.type) {
      case 'greenhouse':
        return {
          leftWall: 'url(#interior-glass-left)',
          rightWall: 'url(#interior-glass-right)',
          topCap: '#bae6fd',
          sideCap: '#38bdf8',
          wallStroke: '#0284c7',
          baseboard: '#0369a1',
          floor: 'url(#interior-floor-greenhouse)',
          floorSideLeft: '#64748b',
          floorSideRight: '#475569',
        }
      case 'growth_chamber':
        return {
          leftWall: 'url(#interior-chamber-left)',
          rightWall: 'url(#interior-chamber-right)',
          topCap: '#818cf8',
          sideCap: '#4f46e5',
          wallStroke: '#a855f7',
          baseboard: '#6366f1',
          floor: 'url(#interior-floor-chamber)',
          floorSideLeft: '#4c1d95',
          floorSideRight: '#2e1065',
        }
      case 'field':
        return {
          leftWall: 'transparent',
          rightWall: 'transparent',
          topCap: '#a16207',
          sideCap: '#78350f',
          wallStroke: '#a16207',
          baseboard: '#78350f',
          floor: 'url(#interior-floor-field)',
          floorSideLeft: '#78350f',
          floorSideRight: '#451a03',
        }
      case 'lab':
        return {
          leftWall: '#f5f3ff',
          rightWall: '#ede9fe',
          topCap: '#c4b5fd',
          sideCap: '#8b5cf6',
          wallStroke: '#7c3aed',
          baseboard: '#6d28d9',
          floor: 'url(#interior-floor-room)',
          floorSideLeft: '#94a3b8',
          floorSideRight: '#64748b',
        }
      default:
        return {
          leftWall: 'url(#interior-wall-left)',
          rightWall: 'url(#interior-wall-right)',
          topCap: '#f8fafc',
          sideCap: '#94a3b8',
          wallStroke: '#64748b',
          baseboard: '#475569',
          floor: 'url(#interior-floor-room)',
          floorSideLeft: '#94a3b8',
          floorSideRight: '#64748b',
        }
    }
  }, [location.type])

  const plantPalettes = useMemo(() => {
    const map = new Map<string, PlantPaletteData>()
    for (const ind of roomIndividuals) {
      const acc = accessions.find(a => a.id === ind.accessionId)
      const taxon = acc ? accessionToTaxon.get(acc.id) : undefined
      const pal = resolvePlantPalette({ taxon, status: ind.status, bbch: ind.currentBBCH })
      if (!map.has(pal.key)) {
        map.set(pal.key, pal)
      }
    }
    return Array.from(map.values())
  }, [roomIndividuals, accessions, accessionToTaxon])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── Barra Superior de la Sala (Navegación + Dimensiones + Controles) ── */}
      <RoomTopBar
        location={location}
        roomIndividualsCount={roomIndividuals.length}
        totalSlots={totalSlots}
        rows={rows}
        cols={cols}
        zoom={zoom}
        showPlantNames={showPlantNames}
        movingPlantId={movingPlantId}
        onBackToMap={onBackToMap}
        onUpdateGridDimensions={onUpdateGridDimensions}
        setZoom={setZoom}
        setShowPlantNames={setShowPlantNames}
        setMovingPlantId={setMovingPlantId}
        ambientLightingEnabled={ambientLightingEnabled}
        onToggleAmbientLighting={handleToggleAmbientLighting}
      />

      {/* ── Barra de Lentes Visuales y Filtro por Especie ── */}
      <RoomLensBar
        lensMode={lensMode}
        setLensMode={setLensMode}
        speciesInRoom={speciesInRoom}
        speciesFilterId={speciesFilterId}
        setSpeciesFilterId={setSpeciesFilterId}
      />

      {/* ── Barra de Acceso Rápido y Drop a Otras Salas ── */}
      <RoomOtherLocationsBar
        otherLocations={otherLocations}
        onSwitchRoom={onSwitchRoom}
        onMovePlantToRoom={onMovePlantToRoom}
        setMovingPlantId={setMovingPlantId}
      />

      {/* ── Bandeja de Semillas Activas para Drag & Drop ── */}
      <RoomSeedTray
        accessions={accessions}
        seedLots={seedLots}
        accessionToTaxon={accessionToTaxon}
      />

      {/* ── Lienzo Isométrico 2.5D de la Sala (Cutaway 3D Diorama) ── */}
      <div
        ref={containerRef}
        className={isRoomVisible ? undefined : 'iso-paused'}
        style={{
          background:
            location.type === 'field'
              ? 'radial-gradient(circle at 50% 30%, #fefce8 0%, #dcfce7 100%)'
              : location.type === 'growth_chamber'
                ? 'radial-gradient(circle at 50% 30%, #2e1065 0%, #0f172a 100%)'
                : 'radial-gradient(circle at 50% 30%, #ffffff 0%, #e2e8f0 100%)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          minHeight: 470,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          position: 'relative',
          boxShadow: 'inset 0 2px 10px rgba(15, 23, 42, 0.06)',
        }}
      >
        {/* HUD Botánico Flotante (Rich Hover Tooltip optimizado) */}
        <RoomHoverTooltip
          slotToPlant={slotToPlant}
          accessions={accessions}
          accessionToTaxon={accessionToTaxon}
          locationType={location.type}
          ambientTempC={ambientTempC}
        />

        <svg
          viewBox={`${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}`}
          data-room-type={location.type}
          data-lens-mode={lensMode}
          style={{
            width: '100%',
            maxWidth: Math.round(780 * zoom),
            height: 'auto',
            minHeight: 400,
            overflow: 'visible',
            transition: 'max-width 0.2s ease',
          }}
          role="region"
          aria-label={`Plano isométrico interior de ${location.name}`}
        >
          {/* ── Definiciones de Gradientes Direccionales y Sombreado 3D ── */}
          <defs>
            <linearGradient id="interior-wall-left" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <linearGradient id="interior-wall-right" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="interior-glass-left" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(224, 242, 254, 0.78)" />
              <stop offset="50%" stopColor="rgba(186, 230, 253, 0.42)" />
              <stop offset="100%" stopColor="rgba(125, 211, 252, 0.65)" />
            </linearGradient>
            <linearGradient id="interior-glass-right" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(186, 230, 253, 0.68)" />
              <stop offset="100%" stopColor="rgba(56, 189, 248, 0.45)" />
            </linearGradient>
            <linearGradient id="interior-chamber-left" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3730a3" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
            <linearGradient id="interior-chamber-right" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#312e81" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="interior-floor-room" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="interior-floor-greenhouse" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f0fdf4" />
              <stop offset="100%" stopColor="#dcfce7" />
            </linearGradient>
            <linearGradient id="interior-floor-chamber" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="interior-floor-field" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#92400e" />
              <stop offset="100%" stopColor="#5c2d0c" />
            </linearGradient>
            <SharedDefs palettes={plantPalettes} />
          </defs>

          {/* ── Capa 1: Suelo y losa 3D ── */}
          <FloorLayer
            rows={rows}
            cols={cols}
            locationType={location.type}
            wallColors={wallColors}
          />

          {/* ── Capa 2: Escenografía perimetral, muros y equipamiento ── */}
          <SceneryLayer
            location={location}
            rows={rows}
            cols={cols}
            wallColors={wallColors}
            roomSeedLots={roomSeedLots}
            onNavigateSeedLot={onNavigateSeedLot}
          />

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

          {/* ── Capa 4: Plantas ordenadas por profundidad con rayos X ── */}
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

          {/* ── Capa 5: Etiquetas de coordenadas y nombres (por encima de plantas) ── */}
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

          {/* ── Capa 6: Vínculos parentales y overlays ── */}
          <OverlayLayer
            pedigreeLinks={pedigreeLinks}
            lensMode={lensMode}
            selectedIndividualId={selectedIndividualId}
          />

          {/* ── Capa 7: Luz diurna ambiental (Fase 5) ── */}
          <AmbientLayer
            locationType={location.type}
            viewBox={{ minX, minY, width: viewBoxWidth, height: viewBoxHeight }}
            enabled={ambientLightingEnabled}
          />
        </svg>

        {/* ── Tira de Plantas en esta Sala (Drag & Drop nativo para mover) ── */}
        <RoomPlantStrip
          locationType={location.type}
          roomIndividuals={roomIndividuals}
          accessions={accessions}
          accessionToTaxon={accessionToTaxon}
          selectedIndividualId={selectedIndividualId}
          onSelectPlant={onSelectPlant}
        />
      </div>
    </div>
  )
}
