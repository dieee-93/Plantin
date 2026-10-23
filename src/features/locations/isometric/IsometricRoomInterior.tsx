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
import { RoomGradients } from './visual/RoomGradients'
import { resolvePlantPalette, type PlantPaletteData } from './visual/paletteKey'
import { halfW, halfH, roomViewBox } from './geometry/iso'
import { RoomSceneLayers } from './layers/RoomSceneLayers'
import { PlanViewLayer } from './editor/layers/PlanViewLayer'
import { useIsometricCamera } from './hooks/useIsometricCamera'
import { useSpaceEditorController } from './editor/useSpaceEditorController'
import { SpaceEditorOverlay } from './editor/SpaceEditorOverlay'
import { useRoomLayoutStore } from '@/store/roomLayoutStore'
import { RoomHoverTooltip } from './RoomHoverTooltip'
import { RoomHeaderNav } from './ui/RoomHeaderNav'
import { RoomOverlayControls } from './ui/RoomOverlayControls'
import { RoomCameraWidget } from './ui/RoomCameraWidget'
import { RoomCommandDock } from './ui/RoomCommandDock'
import { RoomBottomDock } from './ui/RoomBottomDock'

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
  onOpenSowDrawer?: () => void
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
  onOpenSowDrawer,
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
  const {
    camera,
    setZoom,
    resetCamera,
    handlePointerDown,
    handlePointerMove: handlePointerMoveCamera,
    handlePointerUp,
    handleWheel,
    handleDoubleClick,
  } = useIsometricCamera()

  const [lensMode, setLensMode] = useState<IsometricLensMode>('species')
  const [speciesFilterId, setSpeciesFilterId] = useState<string | null>(null)
  const [showPlantNames, setShowPlantNames] = useState(false)
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)
  const [movingPlantId, setMovingPlantId] = useState<string | null>(null)
  const [showLensBar, setShowLensBar] = useState(true)
  const [showOtherRooms, setShowOtherRooms] = useState(true)
  const [isBottomDockOpen, setIsBottomDockOpen] = useState(false)

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

  // Listener nativo no-pasivo para rueda del mouse: zoom sin scrollear la página web
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      handleWheel(e)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [handleWheel])

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

  const { minX, minY, viewBoxWidth, viewBoxHeight } = useMemo(
    () => roomViewBox(rows, cols),
    [rows, cols]
  )

  // Inicializar o recuperar el layout con macetas para salas existentes
  useEffect(() => {
    useRoomLayoutStore.getState().getOrCreateLayout(location.id, location.type, rows, cols)
  }, [location.id, location.type, rows, cols])

  // Controlador de edición de espacio (Fase E3)
  const {
    editorState,
    dispatchEditor,
    placedObjects,
    roomWidthCm,
    roomDepthCm,
    handlePointerMove,
    handleClick,
    handleUndo,
    handleRedo,
  } = useSpaceEditorController({
    locationId: location.id,
    rows,
    cols,
    camera,
    viewBox: { minX, minY, width: viewBoxWidth, height: viewBoxHeight },
    handlePointerMoveCamera,
  })

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
    () => allLocations.filter(loc => loc.id !== location.id),
    [allLocations, location.id]
  )


  const wallColors = useMemo(() => {
    switch (location.type) {
      case 'greenhouse':
        return { leftWall: 'url(#interior-glass-left)', rightWall: 'url(#interior-glass-right)', topCap: '#bae6fd', sideCap: '#38bdf8', wallStroke: '#0284c7', baseboard: '#0369a1', floor: 'url(#interior-floor-greenhouse)', floorSideLeft: '#86efac', floorSideRight: '#4ade80' }
      case 'growth_chamber':
        return { leftWall: 'url(#interior-chamber-left)', rightWall: 'url(#interior-chamber-right)', topCap: '#6366f1', sideCap: '#4f46e5', wallStroke: '#a855f7', baseboard: '#3b0764', floor: 'url(#interior-floor-chamber)', floorSideLeft: '#312e81', floorSideRight: '#1e1b4b' }
      case 'field':
        return { leftWall: 'transparent', rightWall: 'transparent', topCap: 'transparent', sideCap: 'transparent', wallStroke: 'transparent', baseboard: 'transparent', floor: 'url(#interior-floor-field)', floorSideLeft: '#78350f', floorSideRight: '#451a03' }
      default:
        return { leftWall: 'url(#interior-wall-left)', rightWall: 'url(#interior-wall-right)', topCap: '#cbd5e1', sideCap: '#94a3b8', wallStroke: '#64748b', baseboard: '#475569', floor: 'url(#interior-floor-room)', floorSideLeft: '#94a3b8', floorSideRight: '#64748b' }
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
    <div
      ref={containerRef}
      className={isRoomVisible ? undefined : 'iso-paused'}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        flex: 1,
        minHeight: 0,
        background:
          location.type === 'field'
            ? 'radial-gradient(circle at 50% 30%, #fefce8 0%, #dcfce7 100%)'
            : location.type === 'growth_chamber'
              ? 'radial-gradient(circle at 50% 30%, #2e1065 0%, #0f172a 100%)'
              : 'radial-gradient(circle at 50% 30%, #ffffff 0%, #e2e8f0 100%)',
        border: 'none',
        borderRadius: 0,
        padding: '0',
        overflow: 'hidden',
        boxShadow: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* ── Cuadrante 1: Superior Izquierdo (Identidad & Navegación) ── */}
      <RoomHeaderNav
        location={location}
        roomIndividualsCount={roomIndividuals.length}
        totalSlots={totalSlots}
        rows={rows}
        cols={cols}
        onBackToMap={onBackToMap}
        onUpdateGridDimensions={onUpdateGridDimensions}
      />

      {/* ── Cuadrante 2: Superior Derecho (Capas, Lentes & Filtros) ── */}
      <RoomOverlayControls
        showPlantNames={showPlantNames}
        setShowPlantNames={setShowPlantNames}
        ambientLightingEnabled={ambientLightingEnabled}
        onToggleAmbientLighting={handleToggleAmbientLighting}
        showLensBar={showLensBar}
        onToggleLensBar={() => setShowLensBar(prev => !prev)}
        lensMode={lensMode}
        setLensMode={setLensMode}
        speciesInRoom={speciesInRoom}
        speciesFilterId={speciesFilterId}
        setSpeciesFilterId={setSpeciesFilterId}
        otherLocations={otherLocations}
        showOtherRooms={showOtherRooms}
        onToggleOtherRooms={() => setShowOtherRooms(prev => !prev)}
        onSwitchRoom={onSwitchRoom}
        onMovePlantToRoom={onMovePlantToRoom}
        setMovingPlantId={setMovingPlantId}
      />

      {/* ── Cuadrante 3: Inferior Central (Floating Tool Dock) ── */}
      <RoomCommandDock
        mode={editorState.mode}
        onToggleMode={(m) => dispatchEditor({ type: 'SET_MODE', mode: m })}
        canUndo={editorState.historyIndex > 0}
        canRedo={editorState.historyIndex < editorState.history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenSowDrawer={onOpenSowDrawer}
        hasDockContent={accessions.length > 0 || roomIndividuals.length > 0}
        isDockOpen={isBottomDockOpen}
        onToggleDockOpen={() => setIsBottomDockOpen(prev => !prev)}
      />

      {/* ── Cuadrante 4: Inferior Derecho (Camera & Viewport Controls) ── */}
      <RoomCameraWidget
        zoom={camera.zoom}
        setZoom={setZoom}
        viewMode={editorState.viewMode}
        onToggleViewMode={(v) => dispatchEditor({ type: 'SET_VIEW_MODE', viewMode: v })}
        onResetCamera={resetCamera}
      />

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
          height: '100%',
          display: 'block',
          overflow: 'visible',
          cursor: editorState.mode === 'space' ? (editorState.tool === 'place' ? 'crosshair' : 'default') : 'grab',
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        role="region"
        aria-label={`Plano isométrico interior de ${location.name}`}
      >
        {/* ── Definiciones de Gradientes Direccionales y Sombreado 3D ── */}
        <defs>
          <RoomGradients />
          <SharedDefs palettes={plantPalettes} />
        </defs>

        {/* ── Contenedor Isométrico con soporte de Cámara Pan y Zoom centrado ── */}
        <g
          transform={`translate(${camera.x}, ${camera.y}) scale(${camera.zoom})`}
          style={{
            transformOrigin: `${minX + viewBoxWidth / 2}px ${minY + viewBoxHeight / 2}px`,
          }}
        >
          {editorState.viewMode === 'plan' ? (
            <PlanViewLayer
              roomWidthCm={roomWidthCm}
              roomDepthCm={roomDepthCm}
              placedObjects={placedObjects}
              selectedObjectId={editorState.selectedObjectId}
              ghost={editorState.ghost}
              drawPreview={
                editorState.dragDrawStart && editorState.dragDrawCurrent
                  ? { tool: editorState.tool, start: editorState.dragDrawStart, current: editorState.dragDrawCurrent }
                  : null
              }
              onSelectObject={(id) => {
                if (editorState.mode === 'space') dispatchEditor({ type: 'SELECT_OBJECT', id })
              }}
            />
          ) : (
            <RoomSceneLayers
              location={location}
              rows={rows}
              cols={cols}
              wallColors={wallColors}
              roomSeedLots={roomSeedLots}
              onNavigateSeedLot={onNavigateSeedLot}
              placedObjects={placedObjects}
              selectedObjectId={editorState.selectedObjectId}
              ghost={editorState.ghost}
              drawPreview={
                editorState.dragDrawStart && editorState.dragDrawCurrent
                  ? { tool: editorState.tool, start: editorState.dragDrawStart, current: editorState.dragDrawCurrent }
                  : null
              }
              isSpaceMode={editorState.mode === 'space'}
              onSelectObject={(id) => {
                if (editorState.mode === 'space') dispatchEditor({ type: 'SELECT_OBJECT', id })
              }}
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
              showPlantNames={showPlantNames}
              pedigreeLinks={pedigreeLinks}
              viewBox={{ minX, minY, width: viewBoxWidth, height: viewBoxHeight }}
              ambientLightingEnabled={ambientLightingEnabled}
            />
          )}
        </g>
      </svg>

      {/* ── Controles y Drawer del Editor de Espacio (Fase E3) ── */}
      <SpaceEditorOverlay
        locationId={location.id}
        locationType={location.type}
        roomWidthCm={roomWidthCm}
        roomDepthCm={roomDepthCm}
        state={editorState}
        dispatch={dispatchEditor}
        activeCropCode={speciesInRoom[0]?.taxon.cropCode}
      />

      {/* ── HUD Inferior Integrado: Dock de Semillas y Plantas ── */}
      {editorState.mode !== 'space' && (
        <RoomBottomDock
          locationType={location.type}
          roomIndividuals={roomIndividuals}
          accessions={accessions}
          seedLots={seedLots}
          accessionToTaxon={accessionToTaxon}
          selectedIndividualId={selectedIndividualId}
          onSelectPlant={onSelectPlant}
          isOpen={isBottomDockOpen}
          onClose={() => setIsBottomDockOpen(false)}
        />
      )}
    </div>
  )
}
