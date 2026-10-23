import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocationStore } from '@/store/locationStore'
import { useIndividualStore } from '@/store/individualStore'
import { useAccessionStore } from '@/store/accessionStore'
import { useSeedLotStore } from '@/store/seedLotStore'
import { useTaxonStore } from '@/store/taxonStore'
import { useAgroClimateStore } from '@/store/agroClimateStore'
import { useRoomLayoutStore } from '@/store/roomLayoutStore'
import {
  getTemplatesForLocationType,
  getTemplateById,
} from './isometric/templates'
import {
  getAllGridPositions,
  getLocationGridDimensions,
} from '@/domain/location'
import type { LocationType } from '@/domain/location'
import { LocationClimateCard } from '@/components/LocationClimateCard'
import { IndividualDetail } from '@/features/individuals/IndividualsPage'
import { IsometricCampusMap } from './isometric/IsometricCampusMap'
import { IsometricRoomInterior } from './isometric/IsometricRoomInterior'
import {
  Plus, Building2, Sprout, Layers, Sparkles, X
} from 'lucide-react'

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '8px 12px',
  fontSize: 13,
  color: 'var(--text-primary)',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: 11.5,
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: 5,
}

const TYPE_LABELS: Record<LocationType, string> = {
  greenhouse: 'Invernadero',
  room: 'Sala / Almacén',
  field: 'Campo Abierto / Parcela',
  growth_chamber: 'Cámara de Crecimiento',
  bench: 'Mesa / Bancada',
  lab: 'Laboratorio / Cámara Fría',
}

const TYPE_AGRO_BUFFER: Record<LocationType, { label: string; bg: string; border: string; text: string }> = {
  greenhouse:     { label: 'Protección térmica (+5°C / anti-heladas)', bg: '#d8f3dc', border: '#b7e4c7', text: '#1b4332' },
  field:          { label: 'Exposición directa a intemperie',          bg: '#fef3c7', border: '#fde68a', text: '#78350f' },
  growth_chamber: { label: 'Ambiente climatizado total',               bg: '#dbeafe', border: '#bfdbfe', text: '#1e3a5f' },
  room:           { label: 'Protección interior pasiva',               bg: 'var(--surface-subtle)', border: 'var(--border)', text: 'var(--text-secondary)' },
  bench:          { label: 'Sub-espacio de instalación',               bg: 'var(--surface-subtle)', border: 'var(--border)', text: 'var(--text-secondary)' },
  lab:            { label: 'Laboratorio / Conservación controlada',    bg: '#ede9fe', border: '#ddd6fe', text: '#4c1d95' },
}

type DrawerMode = 'new-location' | 'sow' | 'inspect' | null

export function LocationsPage() {
  const navigate = useNavigate()
  const { locations, add: addLocation, update: updateLocation, remove: removeLocation } = useLocationStore()
  const { individuals, add: addIndividual, update: updateIndividual, remove: removeIndividual } = useIndividualStore()
  const { accessions } = useAccessionStore()
  const { seedLots, consumeSeeds } = useSeedLotStore()
  const { taxons } = useTaxonStore()
  const { farmCoordinates, currentWeather, currentClimate } = useAgroClimateStore()

  // Temperatura ambiente actual de referencia para el Lente de Confort Agroclimático
  const ambientTempC = useMemo(() => {
    if (currentWeather?.temperature !== undefined) return currentWeather.temperature
    const monthIdx = new Date().getMonth()
    const monthlyMean = currentClimate?.monthly?.[monthIdx]?.tempMean
    return monthlyMean ?? 20
  }, [currentWeather, currentClimate])

  // Estado de navegación gráfica (Nivel 1: Mapa de Salas | Nivel 2: Interior Isométrico de Sala)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [selectedIndividualId, setSelectedIndividualId] = useState<string | null>(null)

  // Estado del formulario de Nueva Ubicación
  const [name, setName] = useState('')
  const [type, setType] = useState<LocationType>('greenhouse')
  const [capacity, setCapacity] = useState('')
  const [rowsInput, setRowsInput] = useState('')
  const [colsInput, setColsInput] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')

  const availableTemplates = useMemo(() => getTemplatesForLocationType(type), [type])
  const selectedTemplate = useMemo(
    () => (selectedTemplateId ? getTemplateById(selectedTemplateId) : null),
    [selectedTemplateId]
  )

  // Estado del formulario contextual de Siembra en Sala
  const [sowAccessionId, setSowAccessionId] = useState('')
  const [sowSeedLotId, setSowSeedLotId] = useState('')
  const [sowCount, setSowCount] = useState('1')
  const [sowPosition, setSowPosition] = useState('A-01')
  const [sowBbch, setSowBbch] = useState('0')
  const [sowGeneration, setSowGeneration] = useState('')
  const [sowNotes, setSowNotes] = useState('')

  const selectedRoom = useMemo(
    () => locations.find(l => l.id === selectedRoomId) ?? null,
    [locations, selectedRoomId]
  )

  const selectedIndividual = useMemo(
    () => individuals.find(i => i.id === selectedIndividualId) ?? null,
    [individuals, selectedIndividualId]
  )

  const availableSeedLots = useMemo(() => {
    if (!sowAccessionId) return []
    return seedLots.filter(
      lot =>
        lot.accessionId === sowAccessionId &&
        lot.status === 'active' &&
        (lot.currentCount === undefined || lot.currentCount > 0)
    )
  }, [seedLots, sowAccessionId])

  // Celdas libres en una sala determinada
  const getFreeSlotsForRoom = (roomId: string, preferredStart?: string): string[] => {
    const room = locations.find(l => l.id === roomId)
    if (!room) return ['A-01']
    const roomPlants = individuals.filter(i => i.locationId === roomId)
    const { rows, cols } = getLocationGridDimensions(room, roomPlants.length + 10)
    const allSlots = getAllGridPositions(rows, cols)
    const occupied = new Set(
      roomPlants.map(p => (p.position || p.location || '').trim().toUpperCase())
    )
    const free = allSlots.filter(s => !occupied.has(s))

    if (preferredStart && free.includes(preferredStart)) {
      const startIndex = allSlots.indexOf(preferredStart)
      const afterStart = allSlots.slice(startIndex).filter(s => !occupied.has(s))
      const beforeStart = allSlots.slice(0, startIndex).filter(s => !occupied.has(s))
      return [...afterStart, ...beforeStart]
    }
    return free.length > 0 ? free : ['A-01']
  }

  // ── Handlers de Creación de Sala ──
  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const parsedRows = rowsInput ? Math.max(1, Math.min(16, Number(rowsInput))) : undefined
    const parsedCols = colsInput ? Math.max(1, Math.min(16, Number(colsInput))) : undefined

    const newLoc = addLocation({
      name: name.trim(),
      type,
      description: description.trim() || undefined,
      capacity: capacity ? Number(capacity) : parsedRows && parsedCols ? parsedRows * parsedCols : undefined,
      rows: parsedRows,
      cols: parsedCols,
      coordinates: farmCoordinates,
    })

    if (selectedTemplateId) {
      useRoomLayoutStore.getState().createFromTemplate(newLoc.id, selectedTemplateId)
    } else {
      useRoomLayoutStore.getState().getOrCreateLayout(newLoc.id, newLoc.type, newLoc.rows, newLoc.cols)
    }

    setName('')
    setCapacity('')
    setRowsInput('')
    setColsInput('')
    setDescription('')
    setSelectedTemplateId('')
    setDrawerMode(null)
  }

  // ── Handlers de Navegación e Interacciones Gráficas ──
  const handleEnterRoom = (locationId: string) => {
    setSelectedRoomId(locationId)
    setSelectedSlot(null)
    setSowPosition('')
    setSelectedIndividualId(null)
    setDrawerMode(null)
  }

  const handleClickEmptySlot = (posLabel: string) => {
    setSelectedSlot(posLabel)
    setSowPosition(posLabel)
    setSelectedIndividualId(null)
    setDrawerMode('sow')
  }

  const handleSelectPlant = (individualId: string) => {
    setSelectedIndividualId(individualId)
    const ind = individuals.find(i => i.id === individualId)
    if (ind?.position) setSelectedSlot(ind.position)
    setDrawerMode('inspect')
  }

  // Interacción 3: Drop de Semilla/Variedad sobre una celda vacía
  const handleDropSeedInSlot = (posLabel: string, accessionId: string, seedLotId?: string) => {
    setSelectedSlot(posLabel)
    setSowPosition(posLabel)
    setSowAccessionId(accessionId)
    setSowSeedLotId(seedLotId ?? '')
    setSelectedIndividualId(null)
    setDrawerMode('sow')
  }

  // Interacción 4a: Mover planta a otra celda de la misma sala
  const handleMovePlantToSlot = (individualId: string, targetPosLabel: string) => {
    const slots = selectedRoomId ? useRoomLayoutStore.getState().getSlots(selectedRoomId) : []
    const matchingSlot = slots.find(s => s.label === targetPosLabel)
    updateIndividual(individualId, {
      position: targetPosLabel,
      location: targetPosLabel,
      slotId: matchingSlot?.id,
    })
    setSelectedSlot(targetPosLabel)
    setSelectedIndividualId(individualId)
    setDrawerMode('inspect')
  }

  // Interacción 4b: Trasplantar planta a otra sala
  const handleMovePlantToRoom = (individualId: string, targetLocationId: string) => {
    const freeSlots = getFreeSlotsForRoom(targetLocationId)
    const nextSlot = freeSlots[0] ?? 'A-01'
    const targetRoomSlots = useRoomLayoutStore.getState().getSlots(targetLocationId)
    const matchingSlot = targetRoomSlots.find(s => s.label === nextSlot)
    updateIndividual(individualId, {
      locationId: targetLocationId,
      position: nextSlot,
      location: nextSlot,
      slotId: matchingSlot?.id,
    })
  }

  // ── Handler de Siembra Contextual en la Grilla Isométrica ──
  const handleSowSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRoom || !sowAccessionId) return

    const acc = accessions.find(a => a.id === sowAccessionId)
    const existingForAcc = individuals.filter(ind => ind.accessionId === sowAccessionId).length
    const countToSow = Math.max(1, Math.min(100, parseInt(sowCount, 10) || 1))
    const targetSlots = getFreeSlotsForRoom(selectedRoom.id, sowPosition.trim().toUpperCase())
    const roomSlots = useRoomLayoutStore.getState().getSlots(selectedRoom.id)

    let firstCreatedId: string | null = null
    for (let i = 0; i < countToSow; i++) {
      const seqNum = String(existingForAcc + i + 1).padStart(2, '0')
      const autoLabel = `${acc?.accessionNumber ?? 'PLT'} #${seqNum}`
      const assignedSlot = targetSlots[i] ?? `${sowPosition}-${i + 1}`
      const matchingSlot = roomSlots.find(s => s.label === assignedSlot)

      const created = addIndividual({
        accessionId: sowAccessionId,
        seedLotId: sowSeedLotId || undefined,
        label: autoLabel,
        locationId: selectedRoom.id,
        location: assignedSlot,
        position: assignedSlot,
        slotId: matchingSlot?.id,
        plantingDate: new Date().toISOString().slice(0, 10),
        currentBBCH: sowBbch !== '' ? Number(sowBbch) : 0,
        status: 'active',
        generation: sowGeneration.trim() || undefined,
        notes: sowNotes.trim() || undefined,
      })
      if (i === 0) firstCreatedId = created.id
    }

    if (sowSeedLotId) {
      consumeSeeds(sowSeedLotId, countToSow)
    }

    if (firstCreatedId) {
      setSelectedIndividualId(firstCreatedId)
      setDrawerMode('inspect')
    }

    const nextFree = getFreeSlotsForRoom(selectedRoom.id)[0] ?? 'A-01'
    setSelectedSlot(nextFree)
    setSowPosition(nextFree)
    setSowCount('1')
    setSowNotes('')
  }

  return (
    <div style={{ position: 'relative', display: 'flex', height: '100%', width: '100%', background: 'var(--surface-base)', overflow: 'hidden' }}>
      {/* ── Panel Lateral Deslizante (Drawer: Nueva Sala | Sembrar en Celda | Inspector de Planta) ── */}
      {drawerMode && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          {/* Backdrop con clic para cerrar */}
          <div
            onClick={() => {
              setDrawerMode(null)
              setSelectedIndividualId(null)
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.35)',
              backdropFilter: 'blur(2px)',
            }}
          />

          <aside
            style={{
              position: 'relative',
              width: drawerMode === 'inspect' ? 440 : 380,
              maxWidth: '92vw',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--surface-elevated)',
              boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.16)',
              borderLeft: '1px solid var(--border)',
              overflowY: 'auto',
              zIndex: 10,
            }}
          >
            {/* Header del Drawer con selector y botón cerrar */}
            <div
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', gap: 6, flex: 1, alignItems: 'center' }}>
                {selectedRoom ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setDrawerMode('sow')}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: drawerMode === 'sow' ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: drawerMode === 'sow' ? 'var(--accent-light)' : 'var(--surface-elevated)',
                        color: drawerMode === 'sow' ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      + Sembrar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawerMode('new-location')}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: drawerMode === 'new-location' ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: drawerMode === 'new-location' ? 'var(--accent-light)' : 'var(--surface-elevated)',
                        color: drawerMode === 'new-location' ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      + Nueva Sala
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {drawerMode === 'new-location' && '🌱 Nueva Instalación / Sala'}
                    {drawerMode === 'sow' && '🌾 Sembrar en Celda'}
                    {drawerMode === 'inspect' && '🔍 Inspector de Planta'}
                  </span>
                )}
              </div>

              <button
                type="button"
                aria-label="Cerrar panel"
                onClick={() => {
                  setDrawerMode(null)
                  setSelectedIndividualId(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 16,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            {/* ── MODO 1: Formulario de Nueva Ubicación ── */}
            {drawerMode === 'new-location' && (
              <div style={{ padding: '24px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building2 size={14} color="var(--accent)" strokeWidth={2} />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  Nueva Ubicación
                </h2>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  Paso 1 · Espacio para cultivo o banco
                </p>
              </div>
            </div>

            <form style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }} onSubmit={handleAddLocation}>
              <div>
                <label style={LABEL_STYLE}>Nombre de Instalación *</label>
                <input
                  type="text"
                  style={INPUT_STYLE}
                  placeholder="Ej. Invernadero A"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={LABEL_STYLE}>Tipo de Espacio</label>
                  <select
                    style={INPUT_STYLE}
                    value={type}
                    onChange={e => setType(e.target.value as LocationType)}
                  >
                    {Object.entries(TYPE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={LABEL_STYLE}>Capacidad (Plantas)</label>
                  <input
                    type="number"
                    min="1"
                    style={INPUT_STYLE}
                    placeholder="Opcional"
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="location-template-select" style={LABEL_STYLE}>Plantilla de Espacio (Opcional)</label>
                <select
                  id="location-template-select"
                  aria-label="Plantilla de Espacio"
                  style={INPUT_STYLE}
                  value={selectedTemplateId}
                  onChange={e => setSelectedTemplateId(e.target.value)}
                >
                  <option value="">Grilla estándar / Personalizada</option>
                  {availableTemplates.map(tmpl => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.label} ({tmpl.widthCm / 100}×{tmpl.depthCm / 100} m)
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, lineHeight: 1.4 }}>
                    {selectedTemplate.description}
                  </p>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label htmlFor="location-rows-input" style={LABEL_STYLE}>Filas Grilla (A-Z)</label>
                  <input
                    id="location-rows-input"
                    aria-label="Filas iniciales"
                    type="number"
                    min="1"
                    max="16"
                    style={INPUT_STYLE}
                    placeholder="Auto (ej. 4)"
                    value={rowsInput}
                    onChange={e => setRowsInput(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="location-cols-input" style={LABEL_STYLE}>Columnas Grilla (01-16)</label>
                  <input
                    id="location-cols-input"
                    aria-label="Columnas iniciales"
                    type="number"
                    min="1"
                    max="16"
                    style={INPUT_STYLE}
                    placeholder="Auto (ej. 5)"
                    value={colsInput}
                    onChange={e => setColsInput(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="location-desc-input" style={LABEL_STYLE}>Descripción / Notas</label>
                <input
                  id="location-desc-input"
                  type="text"
                  style={INPUT_STYLE}
                  placeholder="Ej. Sector climatizado para solanáceas"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {TYPE_AGRO_BUFFER[type] && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: TYPE_AGRO_BUFFER[type].bg,
                    border: `1px solid ${TYPE_AGRO_BUFFER[type].border}`,
                    color: TYPE_AGRO_BUFFER[type].text,
                    fontSize: 11.5,
                    fontWeight: 500,
                  }}
                >
                  Efecto microclimático: {TYPE_AGRO_BUFFER[type].label}
                </div>
              )}

              <button
                type="submit"
                disabled={!name.trim()}
                className="btn-press"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  padding: '9px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: name.trim() ? 'var(--accent)' : 'var(--surface-muted)',
                  color: name.trim() ? 'white' : 'var(--text-tertiary)',
                  fontSize: 13,
                  fontWeight: 500,
                  border: 'none',
                  cursor: name.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: name.trim() ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={14} strokeWidth={2.5} />
                Crear Ubicación
              </button>
            </form>
          </div>
        )}

        {/* ── MODO 2: Formulario Contextual de Siembra en Celda Isométrica ── */}
        {drawerMode === 'sow' && selectedRoom && (
          <div style={{ padding: '22px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sprout size={14} color="var(--accent)" strokeWidth={2} />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Sembrar en {selectedRoom.name}
                </h2>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  Celda seleccionada: <strong>{sowPosition}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleSowSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 84px', gap: 8 }}>
                <div>
                  <label htmlFor="sow-room-accession" style={LABEL_STYLE}>Variedad (Accesión) *</label>
                  <select
                    id="sow-room-accession"
                    aria-label="Variedad a sembrar"
                    style={INPUT_STYLE}
                    value={sowAccessionId}
                    onChange={e => {
                      setSowAccessionId(e.target.value)
                      setSowSeedLotId('')
                    }}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {accessions.map(acc => {
                      const taxon = taxons.find(t => t.id === acc.taxonId)
                      return (
                        <option key={acc.id} value={acc.id}>
                          {acc.accessionNumber}{taxon ? ` · ${taxon.genus} ${taxon.species}` : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div>
                  <label htmlFor="sow-room-count" style={LABEL_STYLE}>Cantidad</label>
                  <input
                    id="sow-room-count"
                    aria-label="Cantidad de plantas"
                    type="number"
                    min="1"
                    max="100"
                    style={INPUT_STYLE}
                    value={sowCount}
                    onChange={e => setSowCount(e.target.value)}
                  />
                </div>
              </div>

              {sowAccessionId && availableSeedLots.length > 0 && (
                <div>
                  <label htmlFor="sow-room-seedlot" style={LABEL_STYLE}>Lote de Semillas (descuenta stock)</label>
                  <select
                    id="sow-room-seedlot"
                    aria-label="Lote de Semillas en sala"
                    style={INPUT_STYLE}
                    value={sowSeedLotId}
                    onChange={e => setSowSeedLotId(e.target.value)}
                  >
                    <option value="">Sin lote asociado (siembra libre)</option>
                    {availableSeedLots.map(lot => (
                      <option key={lot.id} value={lot.id}>
                        {lot.lotCode}{lot.currentCount !== undefined ? ` (${lot.currentCount} disp.)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label htmlFor="sow-room-position" style={LABEL_STYLE}>Celda / Coordenada</label>
                  <input
                    id="sow-room-position"
                    aria-label="Celda en la grilla"
                    type="text"
                    style={{ ...INPUT_STYLE, fontFamily: 'var(--font-mono)' }}
                    value={sowPosition}
                    onChange={e => {
                      setSowPosition(e.target.value)
                      setSelectedSlot(e.target.value.toUpperCase())
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="sow-room-bbch" style={LABEL_STYLE}>Estadio BBCH (0-99)</label>
                  <input
                    id="sow-room-bbch"
                    aria-label="Estadio BBCH inicial"
                    type="number"
                    min="0"
                    max="99"
                    style={INPUT_STYLE}
                    value={sowBbch}
                    onChange={e => setSowBbch(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label htmlFor="sow-room-gen" style={LABEL_STYLE}>Generación</label>
                  <input
                    id="sow-room-gen"
                    type="text"
                    placeholder="F1, F2, S1..."
                    style={INPUT_STYLE}
                    value={sowGeneration}
                    onChange={e => setSowGeneration(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="sow-room-notes" style={LABEL_STYLE}>Notas</label>
                  <input
                    id="sow-room-notes"
                    type="text"
                    placeholder="Sustrato, maceta..."
                    style={INPUT_STYLE}
                    value={sowNotes}
                    onChange={e => setSowNotes(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!sowAccessionId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  padding: '9px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: sowAccessionId ? 'var(--accent)' : 'var(--surface-muted)',
                  color: sowAccessionId ? 'white' : 'var(--text-tertiary)',
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: sowAccessionId ? 'pointer' : 'not-allowed',
                }}
              >
                <Sprout size={14} />
                Plantar en {sowPosition}
              </button>
            </form>
          </div>
        )}

        {/* ── MODO 3: Inspector In-Situ de Planta Seleccionada ── */}
        {drawerMode === 'inspect' && selectedIndividual && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div
              style={{
                padding: '10px 18px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--surface-subtle)',
              }}
            >
              <span
                style={{
                  fontSize: 10.5,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Sparkles size={12} />
                Inspector In-Situ · Posición {selectedIndividual.position || selectedIndividual.location || 'N/A'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedIndividualId(null)
                  setDrawerMode(selectedRoom ? 'sow' : 'new-location')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 11.5,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cerrar ×
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <IndividualDetail
                individual={selectedIndividual}
                compact
                onDelete={() => {
                  removeIndividual(selectedIndividual.id)
                  setSelectedIndividualId(null)
                  setDrawerMode(selectedRoom ? 'sow' : 'new-location')
                }}
              />
            </div>
          </div>
        )}
      </aside>
      </div>
      )}

      {/* ── Área Principal: Mapa Isométrico 2.5D de Salas (Nivel 1) o Interior Isométrico (Nivel 2) ── */}
      <main
        style={{
          flex: 1,
          height: '100%',
          overflowY: selectedRoom ? 'hidden' : 'auto',
          padding: selectedRoom ? 0 : '28px 36px',
          background: 'var(--surface-base)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {!selectedRoom && (
          <header style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 6,
                    background: 'var(--accent-light)',
                    color: 'var(--accent)',
                  }}
                >
                  PASO 01 · VISTA ISOMÉTRICA 2.5D
                </span>
                <h1
                  style={{
                    fontSize: 25,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    margin: 0,
                  }}
                >
                  Mis Espacios e Instalaciones
                </h1>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setDrawerMode('new-location')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 13px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--accent)',
                    background: 'var(--accent)',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Building2 size={13} />
                  + Nueva Ubicación
                </button>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 10px',
                    borderRadius: 99,
                    background: 'var(--surface-subtle)',
                    border: '1px solid var(--border)',
                    fontSize: 11.5,
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  <Layers size={13} color="var(--accent)" />
                  Haz clic en una sala para abrir su grilla isométrica
                </span>
              </div>
            </div>

            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Dónde crecen tus plantas y se conservan tus lotes de semillas, con soporte agroclimático local y plano interactivo 2.5D.
            </p>
            {/* Tarjeta de Ubicación Aproximada y Estación Agroclimática */}
            <LocationClimateCard />
          </header>
        )}

        {/* Renderizado de Nivel 1 (Mapa de Salas) vs Nivel 2 (Interior Isométrico de Sala) */}
        {selectedRoom ? (
          <IsometricRoomInterior
            location={selectedRoom}
            allLocations={locations}
            individuals={individuals}
            accessions={accessions}
            seedLots={seedLots}
            taxons={taxons}
            ambientTempC={ambientTempC}
            selectedSlot={selectedSlot}
            selectedIndividualId={selectedIndividualId}
            onOpenSowDrawer={() => {
              setDrawerMode('sow')
              if (!sowPosition) setSowPosition('A-01')
            }}
            onBackToMap={() => {
              setSelectedRoomId(null)
              setSelectedIndividualId(null)
              setDrawerMode(null)
            }}
            onSwitchRoom={roomId => handleEnterRoom(roomId)}
            onClickEmptySlot={handleClickEmptySlot}
            onSelectPlant={handleSelectPlant}
            onDropSeedInSlot={handleDropSeedInSlot}
            onMovePlantToSlot={handleMovePlantToSlot}
            onMovePlantToRoom={handleMovePlantToRoom}
            onUpdateGridDimensions={(r, c) =>
              updateLocation(selectedRoom.id, { rows: r, cols: c })
            }
            onNavigateSeedLot={lotId => navigate(`/seedlots?selectedId=${lotId}`)}
          />
        ) : (
          <IsometricCampusMap
            locations={locations}
            individuals={individuals}
            seedLots={seedLots}
            accessions={accessions}
            taxons={taxons}
            onSelectRoom={handleEnterRoom}
            onSowInRoom={handleEnterRoom}
            onDeleteRoom={locId => removeLocation(locId)}
            onOpenNewRoomDrawer={() => setDrawerMode('new-location')}
            onSelectIndividual={(locId, indId) => {
              setSelectedRoomId(locId)
              setSelectedIndividualId(indId)
              setDrawerMode('inspect')
            }}
            onNavigateSeedLot={lotId => navigate(`/seedlots?selectedId=${lotId}`)}
          />
        )}
      </main>
    </div>
  )
}
