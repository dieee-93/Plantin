import React, { useState, useMemo } from 'react'
import type { FacilityLocation } from '@/domain/location'
import {
  formatGridPosition,
  getLocationGridDimensions,
} from '@/domain/location'
import type { Individual } from '@/domain/individual'
import { getIndividualDisplayName } from '@/domain/individual'
import type { Accession } from '@/domain/accession'
import type { SeedLot } from '@/domain/seedLot'
import type { Taxon } from '@/domain/taxon'
import { IsometricPlantSprite } from './IsometricPlantSprite'
import {
  resolveBotanicalArchetype,
  evaluateMicroclimateComfort,
  type IsometricLensMode,
} from './botanicalArchetypes'
import {
  Sprout, Package, Move, ZoomIn, ZoomOut,
  ArrowLeft, Sparkles, Building2, Eye, Activity,
  GitBranch, Thermometer, Grid, Filter
} from 'lucide-react'

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

const TILE_W = 104
const TILE_H = 52

const LENS_OPTIONS: {
  id: IsometricLensMode
  label: string
  shortDesc: string
  icon: React.FC<{ size?: number; color?: string }>
}[] = [
  { id: 'species', label: 'Especies', shortDesc: 'Morfología y arquetipo por taxón', icon: Eye },
  { id: 'bbch', label: 'Fenología BBCH', shortDesc: 'Mapa de calor de desarrollo (0-99)', icon: Activity },
  { id: 'genetics', label: 'Genética / Pedigrí', shortDesc: 'Generación filial y vínculos parentales', icon: GitBranch },
  { id: 'climate', label: 'Confort Climático', shortDesc: 'Aptitud térmica especie vs. sala', icon: Thermometer },
]

function getBbchHeatmapColors(bbch?: number): { fill: string; stroke: string; phaseLabel: string } {
  const stage = bbch ?? 0
  if (stage < 10) {
    return { fill: '#e0f2fe', stroke: '#0284c7', phaseLabel: 'Germinación (0-9)' }
  }
  if (stage < 50) {
    return { fill: '#dcfce7', stroke: '#16a34a', phaseLabel: 'Vegetativo (10-49)' }
  }
  if (stage < 70) {
    return { fill: '#fef3c7', stroke: '#d97706', phaseLabel: 'Floración (50-69)' }
  }
  if (stage < 80) {
    return { fill: '#ffedd5', stroke: '#ea580c', phaseLabel: 'Fructificación (70-79)' }
  }
  return { fill: '#fee2e2', stroke: '#dc2626', phaseLabel: 'Maduración / Cosecha (80+)' }
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
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)
  const [dragOverRoomId, setDragOverRoomId] = useState<string | null>(null)
  const [movingPlantId, setMovingPlantId] = useState<string | null>(null)
  const [showGridConfig, setShowGridConfig] = useState(false)

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

  const [customRows, setCustomRows] = useState<string>(String(rows))
  const [customCols, setCustomCols] = useState<string>(String(cols))

  // Mapa rápido de AccessionId -> Taxon
  const accessionToTaxon = useMemo(() => {
    const map = new Map<string, Taxon>()
    for (const acc of accessions) {
      const t = taxons.find(tx => tx.id === acc.taxonId)
      if (t) map.set(acc.id, t)
    }
    return map
  }, [accessions, taxons])

  // Especies presentes en esta sala (para las píldoras de filtro por especie)
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

  // Mapa determinístico de celda ("A-01") -> Planta (Individual)
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

  // Mapa inverso: IndividualId -> { posLabel, x, y } para dibujar líneas de pedigrí 2.5D
  const halfW = TILE_W / 2
  const halfH = TILE_H / 2

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
  }, [slotToPlant, rows, cols, halfW, halfH])

  // Vínculos parentales (Madre / Padre -> Hijo) dentro de la misma sala
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

  // Dimensiones del ViewBox SVG
  const minX = -rows * halfW - 102
  const maxX = cols * halfW + 102
  const minY = -142
  const maxY = (rows + cols) * halfH + 88
  const viewBoxWidth = maxX - minX
  const viewBoxHeight = maxY - minY

  const topCorner = { x: 0, y: 0 }
  const rightCorner = { x: cols * halfW, y: cols * halfH }
  const bottomCorner = { x: (cols - rows) * halfW, y: (cols + rows) * halfH }
  const leftCorner = { x: -rows * halfW, y: rows * halfH }

  const wallHeight = 86

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

  const hoveredPlantInfo = useMemo(() => {
    if (!hoveredSlot) return null
    const plant = slotToPlant.get(hoveredSlot)
    if (!plant) return null
    const acc = accessions.find(a => a.id === plant.accessionId)
    const taxon = acc ? accessionToTaxon.get(acc.id) : undefined
    const profile = resolveBotanicalArchetype(taxon)
    const comfort = evaluateMicroclimateComfort(taxon, location.type, ambientTempC)
    return {
      posLabel: hoveredSlot,
      plant,
      acc,
      taxon,
      profile,
      comfort,
      displayName: getIndividualDisplayName(plant, acc?.accessionNumber),
    }
  }, [hoveredSlot, slotToPlant, accessions, accessionToTaxon, location.type, ambientTempC])

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

  const handleRoomDrop = (e: React.DragEvent, targetLocationId: string) => {
    e.preventDefault()
    setDragOverRoomId(null)
    const raw = e.dataTransfer.getData('application/plantin-dnd') || e.dataTransfer.getData('text/plain')
    if (!raw) return
    try {
      const payload = JSON.parse(raw)
      if (payload.kind === 'PLANT' && payload.individualId) {
        onMovePlantToRoom(payload.individualId, targetLocationId)
        setMovingPlantId(null)
      }
    } catch {
      // ignore
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── Barra Superior de la Sala (Navegación + Dimensiones + Controles) ── */}
      <div
        style={{
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={onBackToMap}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--surface-subtle)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={13} />
            Mapa de Espacios
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                {location.name}
              </h2>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 8px',
                  borderRadius: 99,
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  fontWeight: 600,
                }}
              >
                {roomIndividuals.length} / {totalSlots} celdas ({rows}×{cols})
              </span>
              {onUpdateGridDimensions && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomRows(String(rows))
                    setCustomCols(String(cols))
                    setShowGridConfig(prev => !prev)
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: showGridConfig ? 'var(--surface-subtle)' : 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                  }}
                  title="Configurar filas y columnas de la sala"
                >
                  <Grid size={11} />
                  Dimensionar grilla
                </button>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Haz clic en una maceta 3D vacía para sembrar, arrastra semillas desde la bandeja, o cambia el Lente Visual para analizar especies, BBCH, genética y clima.
            </p>
          </div>
        </div>

        {/* Controles de Zoom y Modo Trasplante */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {selectedIndividualId && (
            <button
              type="button"
              onClick={() =>
                setMovingPlantId(prev => (prev === selectedIndividualId ? null : selectedIndividualId))
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 11px',
                borderRadius: 'var(--radius-sm)',
                border: movingPlantId ? '1px solid #d97706' : '1px solid var(--border)',
                background: movingPlantId ? '#fef3c7' : 'var(--surface-subtle)',
                color: movingPlantId ? '#92400e' : 'var(--text-secondary)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Move size={12} />
              {movingPlantId ? 'Selecciona celda o sala destino...' : 'Mover / Trasplantar planta'}
            </button>
          )}

          <button
            type="button"
            aria-label="Alejar vista"
            onClick={() => setZoom(z => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
            style={{
              padding: 6,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--surface-subtle)',
              cursor: 'pointer',
            }}
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            aria-label="Restablecer zoom"
            onClick={() => setZoom(1)}
            style={{
              padding: '5px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--surface-subtle)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            aria-label="Acercar vista"
            onClick={() => setZoom(z => Math.min(1.45, Number((z + 0.15).toFixed(2))))}
            style={{
              padding: 6,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--surface-subtle)',
              cursor: 'pointer',
            }}
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* ── Panel Desplegable de Configuración de Dimensiones (rows × cols) ── */}
      {showGridConfig && onUpdateGridDimensions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--accent)',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
            Geometría de Grilla Interior:
          </span>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            Filas (A-Z):
            <input
              aria-label="Filas de la sala"
              type="number"
              min="1"
              max="16"
              value={customRows}
              onChange={e => setCustomRows(e.target.value)}
              style={{
                width: 60,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
              }}
            />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            Columnas (01-16):
            <input
              aria-label="Columnas de la sala"
              type="number"
              min="1"
              max="16"
              value={customCols}
              onChange={e => setCustomCols(e.target.value)}
              style={{
                width: 60,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              const r = Math.max(1, Math.min(16, parseInt(customRows, 10) || rows))
              const c = Math.max(1, Math.min(16, parseInt(customCols, 10) || cols))
              onUpdateGridDimensions(r, c)
              setShowGridConfig(false)
            }}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Aplicar dimensiones
          </button>
        </div>
      )}

      {/* ── Barra de Lentes Visuales (View Modes) y Filtro por Especie ── */}
      <div
        style={{
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 10.5,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              marginRight: 4,
            }}
          >
            Lente Visual:
          </span>
          {LENS_OPTIONS.map(opt => {
            const Icon = opt.icon
            const active = lensMode === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                aria-label={`Lente ${opt.label}`}
                aria-pressed={active}
                onClick={() => setLensMode(opt.id)}
                title={opt.shortDesc}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  borderRadius: 99,
                  border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: active ? 'var(--accent-light)' : 'var(--surface-subtle)',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={12} />
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* Filtro Rápido por Especies Presentes en Sala */}
        {speciesInRoom.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10.5,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
              }}
            >
              <Filter size={11} />
              Especies en sala:
            </span>
            {speciesInRoom.map(({ taxon, count, badgeColor }) => {
              const isFiltered = speciesFilterId === taxon.id
              return (
                <button
                  key={taxon.id}
                  type="button"
                  aria-label={`Filtrar especie ${taxon.commonName || `${taxon.genus} ${taxon.species}`}`}
                  aria-pressed={isFiltered}
                  onClick={() =>
                    setSpeciesFilterId(prev => (prev === taxon.id ? null : taxon.id))
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '3px 9px',
                    borderRadius: 99,
                    border: isFiltered ? `1.5px solid ${badgeColor}` : '1px solid var(--border)',
                    background: isFiltered ? 'var(--surface-elevated)' : 'var(--surface-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: 11,
                    fontWeight: isFiltered ? 700 : 500,
                    cursor: 'pointer',
                    boxShadow: isFiltered ? `0 0 0 2px ${badgeColor}22` : 'none',
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: badgeColor,
                      display: 'inline-block',
                    }}
                  />
                  {taxon.commonName || `${taxon.genus} ${taxon.species}`} ({count})
                </button>
              )
            })}
            {speciesFilterId && (
              <button
                type="button"
                onClick={() => setSpeciesFilterId(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 11,
                  color: 'var(--accent)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Ver todas
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Barra de Otras Salas (Navegación Rápida + Drop Zone para Trasplantar entre Salas) ── */}
      {otherLocations.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
            }}
          >
            Otras Salas (Clic para ir o suelta una planta para trasplantar):
          </span>
          {otherLocations.map(other => {
            const isOver = dragOverRoomId === other.id
            return (
              <button
                key={other.id}
                type="button"
                aria-label={`Sala destino ${other.name}`}
                onClick={() => {
                  if (movingPlantId) {
                    onMovePlantToRoom(movingPlantId, other.id)
                    setMovingPlantId(null)
                  } else {
                    onSwitchRoom(other.id)
                  }
                }}
                onDragOver={e => {
                  e.preventDefault()
                  setDragOverRoomId(other.id)
                }}
                onDragLeave={() => setDragOverRoomId(null)}
                onDrop={e => handleRoomDrop(e, other.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 11px',
                  borderRadius: 99,
                  fontSize: 11.5,
                  fontWeight: 600,
                  border: isOver || movingPlantId ? '1.5px dashed var(--accent)' : '1px solid var(--border)',
                  background: isOver ? 'var(--accent-light)' : 'var(--surface-elevated)',
                  color: isOver ? 'var(--accent)' : 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                <Building2 size={12} color="var(--accent)" />
                {other.name}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Bandeja de Semillas y Variedades (Drag & Drop hacia las macetas) ── */}
      <div
        style={{
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
            }}
          >
            <Sparkles size={12} color="var(--accent)" />
            Bandeja de Siembra Rápida (Arrastra una variedad o lote hacia cualquier posición vacía)
          </span>
        </div>

        {accessions.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Aún no hay variedades en el Banco de Semillas. Puedes registrarlas en el Paso 02 o sembrar desde el formulario lateral.
          </p>
        ) : (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {accessions.map(acc => {
              const taxon = accessionToTaxon.get(acc.id)
              const profile = resolveBotanicalArchetype(taxon)
              const activeLotsForAcc = seedLots.filter(
                l => l.accessionId === acc.id && l.status === 'active' && (l.currentCount === undefined || l.currentCount > 0)
              )
              const primaryLot = activeLotsForAcc[0]
              const dragPayload = JSON.stringify({
                kind: 'SEED',
                accessionId: acc.id,
                seedLotId: primaryLot?.id,
              })

              return (
                <div
                  key={acc.id}
                  draggable
                  aria-label={`Semilla arrastrable ${acc.accessionNumber}`}
                  onDragStart={e => {
                    e.dataTransfer.setData('application/plantin-dnd', dragPayload)
                    e.dataTransfer.setData('text/plain', dragPayload)
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 11px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-subtle)',
                    border: '1px solid var(--border)',
                    borderLeft: `3px solid ${profile.badgeColor}`,
                    cursor: 'grab',
                    flexShrink: 0,
                    userSelect: 'none',
                  }}
                >
                  <Sprout size={13} color={profile.badgeColor} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {acc.accessionNumber}
                      {acc.cultivarName ? ` · ${acc.cultivarName}` : taxon?.commonName ? ` · ${taxon.commonName}` : ''}
                    </p>
                    {primaryLot ? (
                      <p style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: '#5b21b6', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Package size={10} />
                        {primaryLot.lotCode}
                        {primaryLot.currentCount !== undefined ? ` (${primaryLot.currentCount} sem.)` : ''}
                      </p>
                    ) : (
                      <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>Siembra libre</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Lienzo Isométrico 2.5D de la Sala (Cutaway 3D Diorama) ── */}
      <div
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
        {/* ── HUD Botánico Flotante (Rich Hover Tooltip) ── */}
        {hoveredPlantInfo && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              zIndex: 10,
              background: 'rgba(255, 255, 255, 0.96)',
              border: `1.5px solid ${hoveredPlantInfo.profile.badgeColor}`,
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              boxShadow: 'var(--shadow-md)',
              maxWidth: 270,
              pointerEvents: 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: hoveredPlantInfo.profile.badgeColor,
                  color: '#ffffff',
                }}
              >
                {hoveredPlantInfo.posLabel} · {hoveredPlantInfo.profile.cropCode}
              </span>
              {hoveredPlantInfo.plant.generation && (
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: '#ede9fe',
                    color: '#5b21b6',
                  }}
                >
                  Gen {hoveredPlantInfo.plant.generation}
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
              {hoveredPlantInfo.displayName}
            </p>
            {hoveredPlantInfo.taxon && (
              <p style={{ fontSize: 11.5, color: '#334155', fontStyle: 'italic' }}>
                {hoveredPlantInfo.taxon.genus} {hoveredPlantInfo.taxon.species}
                {hoveredPlantInfo.taxon.commonName ? ` (${hoveredPlantInfo.taxon.commonName})` : ''}
              </p>
            )}
            <p style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>
              {hoveredPlantInfo.profile.archetypeLabel}
            </p>
            <div
              style={{
                marginTop: 6,
                paddingTop: 6,
                borderTop: '1px dashed #cbd5e1',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: '#1e293b',
              }}
            >
              <span>BBCH: <strong>{hoveredPlantInfo.plant.currentBBCH ?? 0}</strong></span>
              <span style={{ color: hoveredPlantInfo.comfort.badgeBg, fontWeight: 600 }}>
                {hoveredPlantInfo.comfort.label}
              </span>
            </div>
          </div>
        )}

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
          </defs>

          {/* Sombra exterior proyectada bajo el diorama */}
          <polygon
            points={`
              ${topCorner.x},${topCorner.y + 18}
              ${rightCorner.x + 12},${rightCorner.y + 24}
              ${bottomCorner.x},${bottomCorner.y + 30}
              ${leftCorner.x - 12},${leftCorner.y + 24}
            `}
            fill="rgba(15, 23, 42, 0.14)"
          />

          {/* ── ESCENOGRAFÍA ARQUITECTÓNICA SEGÚN TIPO DE SALA ── */}
          {location.type === 'field' ? (
            /* CAMPO ABIERTO / PARCELA: Sin paredes cerradas; Cerco rústico perimetral de postes de madera y alambre */
            <g data-scenery="open-field-fence">
              {/* Franja de pasto exterior alrededor de la parcela */}
              <polygon
                points={`
                  ${topCorner.x},${topCorner.y - 10}
                  ${rightCorner.x + 14},${rightCorner.y}
                  ${bottomCorner.x},${bottomCorner.y + 10}
                  ${leftCorner.x - 14},${leftCorner.y}
                `}
                fill="#4ade80"
                opacity="0.45"
              />

              {/* Alambres perimetrales traseros */}
              <line x1={leftCorner.x} y1={leftCorner.y - 26} x2={topCorner.x} y2={topCorner.y - 26} stroke="#92400e" strokeWidth="1.5" strokeDasharray="6 3" />
              <line x1={leftCorner.x} y1={leftCorner.y - 14} x2={topCorner.x} y2={topCorner.y - 14} stroke="#92400e" strokeWidth="1.5" />
              <line x1={topCorner.x} y1={topCorner.y - 26} x2={rightCorner.x} y2={rightCorner.y - 26} stroke="#78350f" strokeWidth="1.5" strokeDasharray="6 3" />
              <line x1={topCorner.x} y1={topCorner.y - 14} x2={rightCorner.x} y2={rightCorner.y - 14} stroke="#78350f" strokeWidth="1.5" />

              {/* Postes de quebracho 3D a lo largo del borde izquierdo y derecho */}
              {Array.from({ length: rows + 1 }).map((_, idx) => {
                const px = -idx * halfW
                const py = idx * halfH
                return (
                  <g key={`post-l-${idx}`}>
                    <rect x={px - 3.5} y={py - 36} width="7" height="36" rx="1.5" fill="#78350f" stroke="#451a03" strokeWidth="1" />
                    <ellipse cx={px} cy={py - 36} rx="3.5" ry="1.8" fill="#d97706" />
                  </g>
                )
              })}
              {Array.from({ length: cols + 1 }).map((_, idx) => {
                const px = idx * halfW
                const py = idx * halfH
                return (
                  <g key={`post-r-${idx}`}>
                    <rect x={px - 3.5} y={py - 36} width="7" height="36" rx="1.5" fill="#78350f" stroke="#451a03" strokeWidth="1" />
                    <ellipse cx={px} cy={py - 36} rx="3.5" ry="1.8" fill="#d97706" />
                  </g>
                )
              })}

              {/* Cartel de madera de la parcela */}
              <g transform={`translate(${rightCorner.x * 0.5}, ${rightCorner.y * 0.5 - 48})`}>
                <rect x="-62" y="-15" width="124" height="24" rx="4" fill="#fef3c7" stroke="#92400e" strokeWidth="1.8" />
                <text x="0" y="1" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="monospace" fill="#78350f">
                  {location.name.toUpperCase()}
                </text>
              </g>
            </g>
          ) : (
            /* ESTRUCTURAS CON MUROS 3D EXTRUIDOS (Invernadero, Cámara LED, Sala, Laboratorio, Bancada) */
            <g data-scenery={`cutaway-${location.type}`} data-wall-volume="3d">
              {/* Cara interior Pared Izquierda */}
              <polygon
                points={`
                  ${leftCorner.x},${leftCorner.y}
                  ${topCorner.x},${topCorner.y}
                  ${topCorner.x},${topCorner.y - wallHeight}
                  ${leftCorner.x},${leftCorner.y - wallHeight}
                `}
                fill={wallColors.leftWall}
                stroke={wallColors.wallStroke}
                strokeWidth="1.8"
              />

              {/* Cara interior Pared Derecha */}
              <polygon
                points={`
                  ${topCorner.x},${topCorner.y}
                  ${rightCorner.x},${rightCorner.y}
                  ${rightCorner.x},${rightCorner.y - wallHeight}
                  ${topCorner.x},${topCorner.y - wallHeight}
                `}
                fill={wallColors.rightWall}
                stroke={wallColors.wallStroke}
                strokeWidth="1.8"
              />

              {/* ── Espesor 3D Superior de los Muros (Wall Top Caps) ── */}
              <polygon
                points={`
                  ${leftCorner.x},${leftCorner.y - wallHeight}
                  ${topCorner.x},${topCorner.y - wallHeight}
                  ${topCorner.x},${topCorner.y - wallHeight - 9}
                  ${leftCorner.x - 10},${leftCorner.y - wallHeight - 4}
                `}
                fill={wallColors.topCap}
                stroke={wallColors.wallStroke}
                strokeWidth="1.2"
              />
              <polygon
                points={`
                  ${topCorner.x},${topCorner.y - wallHeight}
                  ${rightCorner.x},${rightCorner.y - wallHeight}
                  ${rightCorner.x + 10},${rightCorner.y - wallHeight - 4}
                  ${topCorner.x},${topCorner.y - wallHeight - 9}
                `}
                fill={wallColors.topCap}
                stroke={wallColors.wallStroke}
                strokeWidth="1.2"
              />

              {/* ── Pilares 3D de Corte en los Extremos de los Muros ── */}
              <polygon
                points={`
                  ${leftCorner.x - 10},${leftCorner.y - wallHeight - 4}
                  ${leftCorner.x},${leftCorner.y - wallHeight}
                  ${leftCorner.x},${leftCorner.y + 16}
                  ${leftCorner.x - 10},${leftCorner.y + 11}
                `}
                fill={wallColors.sideCap}
                stroke={wallColors.wallStroke}
                strokeWidth="1.2"
              />
              <polygon
                points={`
                  ${rightCorner.x},${rightCorner.y - wallHeight}
                  ${rightCorner.x + 10},${rightCorner.y - wallHeight - 4}
                  ${rightCorner.x + 10},${rightCorner.y + 11}
                  ${rightCorner.x},${rightCorner.y + 16}
                `}
                fill={wallColors.sideCap}
                stroke={wallColors.wallStroke}
                strokeWidth="1.2"
              />

              {/* ── Zócalo Interior Arquitectónico ── */}
              <line
                x1={leftCorner.x}
                y1={leftCorner.y - 3}
                x2={topCorner.x}
                y2={topCorner.y - 3}
                stroke={wallColors.baseboard}
                strokeWidth="5"
              />
              <line
                x1={topCorner.x}
                y1={topCorner.y - 3}
                x2={rightCorner.x}
                y2={rightCorner.y - 3}
                stroke={wallColors.baseboard}
                strokeWidth="5"
              />

              {/* ── Equipamiento Específico según Tipo de Instalación ── */}
              {location.type === 'greenhouse' && (
                <g data-room-fixture="greenhouse-equipment">
                  {/* Montantes estructurales de aluminio y reflejos diagonales */}
                  {Array.from({ length: rows }).map((_, rIdx) => {
                    const mx = -(rIdx + 0.5) * halfW
                    const my = (rIdx + 0.5) * halfH
                    return (
                      <g key={`gh-l-${rIdx}`}>
                        <line x1={mx} y1={my} x2={mx} y2={my - wallHeight} stroke="#0284c7" strokeWidth="1.6" />
                        <line x1={mx - 8} y1={my - 28} x2={mx + 6} y2={my - 48} stroke="rgba(255,255,255,0.75)" strokeWidth="2.2" strokeLinecap="round" />
                      </g>
                    )
                  })}
                  {Array.from({ length: cols }).map((_, cIdx) => {
                    const mx = (cIdx + 0.5) * halfW
                    const my = (cIdx + 0.5) * halfH
                    return (
                      <line key={`gh-r-${cIdx}`} x1={mx} y1={my} x2={mx} y2={my - wallHeight} stroke="#0284c7" strokeWidth="1.6" />
                    )
                  })}
                  {/* Tanque hidropónico / riego en la esquina norte */}
                  <g transform={`translate(0, -24)`}>
                    <ellipse cx="0" cy="8" rx="14" ry="7" fill="#0369a1" />
                    <rect x="-14" y="-22" width="28" height="30" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
                    <ellipse cx="0" cy="-22" rx="14" ry="7" fill="#38bdf8" stroke="#0369a1" strokeWidth="1.2" />
                    <text x="0" y="-4" textAnchor="middle" fontSize="6.5" fontFamily="monospace" fontWeight="700" fill="#ffffff">
                      H2O
                    </text>
                  </g>
                </g>
              )}

              {location.type === 'growth_chamber' && (
                <g data-room-fixture="growth_chamber-equipment" data-scenery="led-array">
                  {/* Haz de luz magenta/violeta proyectado desde el techo */}
                  <polygon
                    points={`
                      ${topCorner.x},${topCorner.y - wallHeight + 12}
                      ${rightCorner.x * 0.85},${rightCorner.y * 0.85 - wallHeight + 12}
                      ${bottomCorner.x * 0.85},${bottomCorner.y * 0.85}
                      ${leftCorner.x * 0.85},${leftCorner.y * 0.85 - wallHeight + 12}
                    `}
                    fill="rgba(217, 70, 239, 0.12)"
                  />
                  {/* Luminaria LED 3D suspendida con barras de diodos */}
                  <polygon
                    points={`
                      0,${-wallHeight + 8}
                      ${cols * halfW * 0.58},${cols * halfH * 0.58 - wallHeight + 8}
                      ${(cols - rows) * halfW * 0.58},${(cols + rows) * halfH * 0.58 - wallHeight + 8}
                      ${-rows * halfW * 0.58},${rows * halfH * 0.58 - wallHeight + 8}
                    `}
                    fill="rgba(232, 121, 249, 0.42)"
                    stroke="#f0abfc"
                    strokeWidth="2"
                  />
                  {/* Display digital de clima en pared izquierda */}
                  <g transform={`translate(${leftCorner.x * 0.48}, ${leftCorner.y * 0.48 - wallHeight * 0.55})`}>
                    <rect x="-40" y="-12" width="80" height="22" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.4" />
                    <text x="0" y="2" textAnchor="middle" fontSize="8.5" fontFamily="monospace" fontWeight="700" fill="#4ade80">
                      24°C · PAR 680
                    </text>
                  </g>
                </g>
              )}

              {(location.type === 'room' || location.type === 'lab' || location.type === 'bench') && (
                <g data-room-fixture={`${location.type}-equipment`}>
                  {/* Ventana / Panel de ventilación con marco 3D en muro izquierdo */}
                  <g transform={`translate(${leftCorner.x * 0.36}, ${leftCorner.y * 0.36 - wallHeight * 0.56}) skewY(-26.5)`}>
                    <rect x="-26" y="-16" width="52" height="32" rx="3" fill="#e0f2fe" stroke="#475569" strokeWidth="2" />
                    <line x1="0" y1="-16" x2="0" y2="16" stroke="#64748b" strokeWidth="1.5" />
                    <line x1="-26" y1="0" x2="26" y2="0" stroke="#64748b" strokeWidth="1.5" />
                    <line x1="-18" y1="-10" x2="-8" y2="8" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />
                  </g>

                  {/* Tanque de riego / Estación hidrométrica en esquina norte */}
                  <g transform="translate(0, -20)">
                    <ellipse cx="0" cy="6" rx="12" ry="6" fill="#334155" />
                    <rect x="-12" y="-18" width="24" height="24" fill="#475569" stroke="#1e293b" strokeWidth="1" />
                    <ellipse cx="0" cy="-18" rx="12" ry="6" fill="#94a3b8" stroke="#1e293b" strokeWidth="1" />
                    <circle cx="0" cy="-6" r="4" fill="#f8fafc" stroke="#0284c7" strokeWidth="1" />
                  </g>

                  {/* Puerta técnica de acceso en muro derecho */}
                  <g transform={`translate(${rightCorner.x * 0.78}, ${rightCorner.y * 0.78 - 28}) skewY(26.5)`}>
                    <rect x="-15" y="-26" width="30" height="52" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1.8" />
                    <rect x="-10" y="-20" width="20" height="16" rx="1.5" fill="#bae6fd" stroke="#64748b" strokeWidth="1" />
                    <circle cx="9" cy="4" r="2" fill="#1e293b" />
                  </g>
                </g>
              )}

              {/* Estantería Isométrica de Lotes de Semillas (SeedLots almacenados en esta sala) */}
              {roomSeedLots.length > 0 && (
                <g
                  data-scenery="seed-vault-shelf"
                  transform={`translate(${leftCorner.x * 0.68}, ${leftCorner.y * 0.68 - wallHeight * 0.44})`}
                >
                  <rect
                    x="-46"
                    y="-16"
                    width="92"
                    height="32"
                    rx="4"
                    fill="rgba(255, 255, 255, 0.94)"
                    stroke="#7c3aed"
                    strokeWidth="1.4"
                  />
                  <text x="0" y="-5" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fontWeight="700" fill="#5b21b6">
                    LOTES EN SALA ({roomSeedLots.length})
                  </text>
                  {roomSeedLots.slice(0, 3).map((lot, idx) => (
                    <g
                      key={lot.id}
                      transform={`translate(${-26 + idx * 26}, 5)`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onNavigateSeedLot?.(lot.id)}
                    >
                      <rect x="-11" y="-5" width="22" height="11" rx="2" fill="#ede9fe" stroke="#7c3aed" strokeWidth="0.9" />
                      <text x="0" y="3" textAnchor="middle" fontSize="6.5" fontFamily="monospace" fontWeight="700" fill="#4c1d95">
                        {lot.lotCode.slice(-4)}
                      </text>
                    </g>
                  ))}
                </g>
              )}

              {/* Placa arquitectónica en el muro derecho */}
              <g transform={`translate(${rightCorner.x * 0.42}, ${rightCorner.y * 0.42 - wallHeight * 0.56}) skewY(26.5)`}>
                <rect
                  x="-64"
                  y="-13"
                  width="128"
                  height="22"
                  rx="4"
                  fill={location.type === 'growth_chamber' ? '#1e1b4b' : 'rgba(255,255,255,0.88)'}
                  stroke={wallColors.wallStroke}
                  strokeWidth="1.4"
                />
                <text
                  x="0"
                  y="2"
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight="800"
                  fontFamily="monospace"
                  fill={location.type === 'growth_chamber' ? '#f0abfc' : '#1e293b'}
                >
                  {location.name.toUpperCase()}
                </text>
              </g>
            </g>
          )}

          {/* ── Espesor 3D de la Losa del Piso (y Patas Metálicas si es Bancada/Mesa) ── */}
          {location.type === 'bench' && (
            <g>
              <rect x={leftCorner.x} y={leftCorner.y + 12} width="8" height="36" fill="#475569" />
              <rect x={bottomCorner.x - 4} y={bottomCorner.y + 12} width="8" height="36" fill="#334155" />
              <rect x={rightCorner.x - 8} y={rightCorner.y + 12} width="8" height="36" fill="#475569" />
            </g>
          )}
          <polygon
            points={`
              ${leftCorner.x},${leftCorner.y}
              ${bottomCorner.x},${bottomCorner.y}
              ${bottomCorner.x},${bottomCorner.y + 16}
              ${leftCorner.x},${leftCorner.y + 16}
            `}
            fill={wallColors.floorSideLeft}
          />
          <polygon
            points={`
              ${rightCorner.x},${rightCorner.y}
              ${bottomCorner.x},${bottomCorner.y}
              ${bottomCorner.x},${bottomCorner.y + 16}
              ${rightCorner.x},${rightCorner.y + 16}
            `}
            fill={wallColors.floorSideRight}
          />

          {/* Superficie principal del piso isométrico */}
          <polygon
            points={`
              ${topCorner.x},${topCorner.y}
              ${rightCorner.x},${rightCorner.y}
              ${bottomCorner.x},${bottomCorner.y}
              ${leftCorner.x},${leftCorner.y}
            `}
            fill={wallColors.floor}
            stroke={wallColors.wallStroke}
            strokeWidth="1.8"
          />

          {/* Camellones continuos 3D y líneas de riego por goteo cuando es Campo Abierto (field) */}
          {location.type === 'field' && (
            <g data-scenery="field-ridges">
              {Array.from({ length: rows }).map((_, r) => {
                const startX = (0 - r) * halfW
                const startY = (0 + r + 1) * halfH
                const endX = (cols - 1 - r) * halfW
                const endY = (cols - 1 + r + 1) * halfH
                return (
                  <g key={`ridge-${r}`}>
                    <line
                      x1={startX}
                      y1={startY + 2}
                      x2={endX}
                      y2={endY + 2}
                      stroke="#3e1f08"
                      strokeWidth="26"
                      strokeLinecap="round"
                    />
                    <line
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke="#78350f"
                      strokeWidth="20"
                      strokeLinecap="round"
                    />
                    <line
                      x1={startX}
                      y1={startY + 2}
                      x2={endX}
                      y2={endY + 2}
                      stroke="#38bdf8"
                      strokeWidth="1.6"
                      strokeDasharray="4 3"
                    />
                  </g>
                )
              })}
            </g>
          )}

          {/* ── Celdas / Tiles Isométricos Ordenados de Atrás hacia Adelante (Painter's Algorithm) ── */}
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((__, c) => {
              const posLabel = formatGridPosition(r, c)
              const centerX = (c - r) * halfW
              const centerY = (c + r + 1) * halfH
              const plant = slotToPlant.get(posLabel)
              const acc = plant ? accessions.find(a => a.id === plant.accessionId) : undefined
              const taxon = acc ? accessionToTaxon.get(acc.id) : undefined
              const plantDisplayName = plant ? getIndividualDisplayName(plant, acc?.accessionNumber) : ''
              const profile = resolveBotanicalArchetype(taxon)

              const isSlotSelected = selectedSlot === posLabel
              const isPlantSelected = Boolean(plant && selectedIndividualId === plant.id)
              const isHovered = hoveredSlot === posLabel
              const isDragOver = dragOverSlot === posLabel
              const isDimmedByFilter = Boolean(
                speciesFilterId && (!taxon || taxon.id !== speciesFilterId)
              )

              // Color de la baldosa según el Lente Visual activo
              let tileFill =
                location.type === 'field'
                  ? 'rgba(120, 53, 15, 0.55)'
                  : location.type === 'growth_chamber'
                    ? 'rgba(30, 27, 75, 0.72)'
                    : 'rgba(255, 255, 255, 0.85)'

              let tileStroke =
                location.type === 'field'
                  ? '#92400e'
                  : location.type === 'growth_chamber'
                    ? '#4c1d95'
                    : '#cbd5e1'

              if (plant) {
                if (lensMode === 'bbch') {
                  const heat = getBbchHeatmapColors(plant.currentBBCH)
                  tileFill = heat.fill
                  tileStroke = heat.stroke
                } else if (lensMode === 'climate') {
                  const comfort = evaluateMicroclimateComfort(taxon, location.type, ambientTempC)
                  tileFill = comfort.tileFill
                  tileStroke = comfort.tileStroke
                } else if (lensMode === 'genetics') {
                  tileFill = plant.generation ? '#f3e8ff' : '#f8fafc'
                  tileStroke = plant.generation ? '#9333ea' : '#cbd5e1'
                } else if (speciesFilterId && taxon?.id === speciesFilterId) {
                  tileFill = '#dcfce7'
                  tileStroke = profile.badgeColor
                }
              }

              if (isDragOver) {
                tileFill = '#bbf7d0'
                tileStroke = '#15803d'
              } else if (isSlotSelected || isPlantSelected) {
                tileFill = '#d8f3dc'
                tileStroke = '#15803d'
              } else if (isHovered && !plant) {
                tileFill = '#f0fdf4'
                tileStroke = '#4ade80'
              }

              const activeHighlight = isHovered || isSlotSelected || isDragOver

              return (
                <g
                  key={posLabel}
                  transform={`translate(${centerX}, ${centerY})`}
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
                      onSelectPlant(plant.id)
                    } else {
                      onClickEmptySlot(posLabel)
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (plant) {
                        onSelectPlant(plant.id)
                      } else {
                        onClickEmptySlot(posLabel)
                      }
                    }
                  }}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  {/* Baldosa / Celda Isométrica con bisel interior */}
                  <polygon
                    points={`0,${-halfH + 3} ${halfW - 4},0 0,${halfH - 3} ${-halfW + 4},0`}
                    fill={tileFill}
                    stroke={tileStroke}
                    strokeWidth={isSlotSelected || isPlantSelected || isDragOver ? '2.2' : '1.1'}
                  />

                  {/* Etiqueta de coordenada en la esquina inferior de la celda */}
                  <text
                    x="0"
                    y={halfH - 7}
                    textAnchor="middle"
                    fontSize="8.5"
                    fontFamily="monospace"
                    fontWeight="700"
                    fill={
                      isSlotSelected || isPlantSelected
                        ? '#166534'
                        : location.type === 'field' || location.type === 'growth_chamber'
                          ? '#e2e8f0'
                          : '#475569'
                    }
                  >
                    {posLabel}
                  </text>

                  {/* Contenido de la celda: Contenedor 3D vacío vs. Planta viva con su arquetipo de especie */}
                  {plant ? (
                    <IsometricPlantSprite
                      bbch={plant.currentBBCH}
                      status={plant.status}
                      label={plantDisplayName}
                      isSelected={isPlantSelected}
                      taxon={taxon}
                      locationType={location.type}
                      generation={plant.generation}
                      lensMode={lensMode}
                      dimmed={isDimmedByFilter}
                    />
                  ) : (
                    /* ── Contenedor Vacío 3D Volumétrico (Listo para Sembrar) ── */
                    <g data-empty-container="3d-pot">
                      {location.type === 'field' ? (
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
                      ) : location.type === 'growth_chamber' ? (
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
                          {/* Sombra elíptica bajo la maceta */}
                          <ellipse cx="0" cy="3" rx="16" ry="8" fill="rgba(15, 23, 42, 0.16)" />
                          {/* Cara izquierda iluminada del cuerpo de la maceta */}
                          <polygon
                            points="-13,-7 0,0 0,10 -11,3"
                            fill={activeHighlight ? '#15803d' : '#c2410c'}
                          />
                          {/* Cara derecha sombreada del cuerpo de la maceta */}
                          <polygon
                            points="13,-7 0,0 0,10 11,3"
                            fill={activeHighlight ? '#166534' : '#9a3412'}
                          />
                          {/* Borde / Labio superior 3D de la maceta */}
                          <polygon
                            points="0,-14 15,-6.5 0,1 -15,-6.5"
                            fill={activeHighlight ? '#4ade80' : '#ea580c'}
                            stroke={activeHighlight ? '#14532d' : '#7c2d12'}
                            strokeWidth="1"
                          />
                          {/* Sustrato fértil húmedo en el interior */}
                          <polygon
                            points="0,-12 11.5,-6.5 0,-1 -11.5,-6.5"
                            fill="#3e2723"
                          />
                          {/* Granos de perlita / textura de sustrato */}
                          <circle cx="-3" cy="-7" r="0.9" fill="rgba(255,255,255,0.55)" />
                          <circle cx="3.5" cy="-5.5" r="0.8" fill="rgba(255,255,255,0.45)" />
                        </>
                      )}

                      {/* Indicador flotante '+' de siembra sobre el sustrato */}
                      <g transform="translate(0, -15)">
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
            })
          )}

          {/* ── Arcos 2.5D de Parentesco (Lente Genético / Pedigrí In-Situ) ── */}
          {pedigreeLinks.map(link => {
            const midX = (link.fromX + link.toX) / 2
            const midY = Math.min(link.fromY, link.toY) - 42
            return (
              <g key={link.id} data-pedigree-link={link.role}>
                <path
                  d={`M ${link.fromX},${link.fromY} Q ${midX},${midY} ${link.toX},${link.toY}`}
                  fill="none"
                  stroke={link.role === 'Madre' ? '#db2777' : '#2563eb'}
                  strokeWidth="2.2"
                  strokeDasharray="5 3"
                />
                <circle cx={midX} cy={midY + 10} r="11" fill="#ffffff" stroke={link.role === 'Madre' ? '#db2777' : '#2563eb'} strokeWidth="1.2" />
                <text
                  x={midX}
                  y={midY + 13}
                  textAnchor="middle"
                  fontSize="7.5"
                  fontWeight="800"
                  fontFamily="monospace"
                  fill={link.role === 'Madre' ? '#be185d' : '#1d4ed8'}
                >
                  {link.role === 'Madre' ? '♀M' : '♂P'}
                </text>
              </g>
            )
          })}
        </svg>

        {/* ── Tira de Plantas en esta Sala (Con soporte Drag & Drop nativo para mover entre celdas/salas) ── */}
        {roomIndividuals.length > 0 && (
          <div
            style={{
              width: '100%',
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: location.type === 'growth_chamber' ? '#cbd5e1' : 'var(--text-tertiary)',
                textTransform: 'uppercase',
              }}
            >
              Plantas en sala (Arrastra hacia otra celda o sala para trasplantar):
            </span>
            {roomIndividuals.map(ind => {
              const acc = accessions.find(a => a.id === ind.accessionId)
              const taxon = acc ? accessionToTaxon.get(acc.id) : undefined
              const profile = resolveBotanicalArchetype(taxon)
              const dispName = getIndividualDisplayName(ind, acc?.accessionNumber)
              const isSelected = selectedIndividualId === ind.id
              const dragPayload = JSON.stringify({
                kind: 'PLANT',
                individualId: ind.id,
              })

              return (
                <div
                  key={ind.id}
                  draggable
                  aria-label={`Planta arrastrable ${dispName}`}
                  onDragStart={e => {
                    e.dataTransfer.setData('application/plantin-dnd', dragPayload)
                    e.dataTransfer.setData('text/plain', dragPayload)
                  }}
                  onClick={() => onSelectPlant(ind.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 99,
                    background: isSelected ? 'var(--accent)' : 'var(--surface-elevated)',
                    color: isSelected ? 'white' : 'var(--text-primary)',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                    fontSize: 11.5,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'grab',
                    userSelect: 'none',
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: isSelected ? '#ffffff' : profile.badgeColor,
                      display: 'inline-block',
                    }}
                  />
                  <span>{ind.position || 'S/P'}</span>
                  <strong>{dispName}</strong>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
