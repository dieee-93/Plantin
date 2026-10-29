import React, { useState, useMemo, useEffect, useContext, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientContext, QueryClientProvider } from '@tanstack/react-query'
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
import {
  type PropagationFormId,
  getPropagationFormSpec,
  getCompatiblePropagationForms,
  getVegetativeCloneCapability,
  MATURE_PLANT_STAGES,
  STARTER_SPECIES_PRESETS,
  type StarterSpeciesPreset,
} from '@/domain/propagationForm'
import { getIndividualDisplayName } from '@/domain/individual'
import { getEffectiveCropCode } from '@/domain/ontology/cropResolver'
import { useTaxonomySearch } from '@/hooks/useTaxonomySearch'
import { enrichTaxonomySearchResult, selectOrCreatePresetTaxon, hydrateTaxonWithApis } from '@/services/taxonomy/taxonEnrichment'
import type { Taxon } from '@/domain/taxon'

const modalFallbackQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

function SafeQueryWrapper({ children }: { children: React.ReactNode }) {
  const client = useContext(QueryClientContext)
  if (client) {
    return <>{children}</>
  }
  return <QueryClientProvider client={modalFallbackQueryClient}>{children}</QueryClientProvider>
}

interface TaxonSearchDropdownProps {
  query: string
  onSelectTaxon: (taxon: Taxon) => void
}

function TaxonSearchDropdown({ query, onSelectTaxon }: TaxonSearchDropdownProps) {
  const { add: addTaxon } = useTaxonStore()
  const { data: results, isLoading } = useTaxonomySearch(query)
  const [enriching, setEnriching] = useState(false)

  if (!query.trim()) return null

  const matchingPresets = STARTER_SPECIES_PRESETS.filter(p =>
    p.commonName.toLowerCase().includes(query.toLowerCase()) ||
    p.genus.toLowerCase().includes(query.toLowerCase()) ||
    p.species.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelectResult = async (res: any) => {
    try {
      setEnriching(true)
      const enriched = await enrichTaxonomySearchResult(res)
      const newTaxon = addTaxon({
        genus: enriched.genus,
        species: enriched.species,
        family: enriched.family || 'Desconocida',
        commonName: enriched.commonName,
        cropCode: enriched.cropCode,
        imageUrl: enriched.imageUrl,
        agronomicData: enriched.agronomicData,
        traits: enriched.traits,
      })
      onSelectTaxon(newTaxon)
    } catch {
      const newTaxon = addTaxon({
        genus: res.genus || res.scientificName?.split(' ')[0] || 'Unknown',
        species: res.species || res.scientificName?.split(' ')[1] || 'sp.',
        family: res.family || 'Desconocida',
        commonName: res.commonName,
      })
      onSelectTaxon(newTaxon)
    } finally {
      setEnriching(false)
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'var(--surface-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        maxHeight: 200,
        overflowY: 'auto',
        marginTop: 4,
        padding: 4,
      }}
    >
      {matchingPresets.length > 0 && (
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', padding: '2px 8px', fontWeight: 600 }}>
            Presets recomendados
          </div>
          {matchingPresets.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                const added = selectOrCreatePresetTaxon(p)
                onSelectTaxon(added)
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '5px 8px',
                borderRadius: 4,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 11.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.commonName}</span>
              <span style={{ fontSize: 10.5, fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                {p.genus} {p.species}
              </span>
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-tertiary)' }}>
          Buscando en GBIF...
        </div>
      )}

      {results && results.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', padding: '2px 8px', fontWeight: 600 }}>
            GBIF / Catálogo
          </div>
          {results.slice(0, 5).map((r, idx) => (
            <button
              key={r.id || idx}
              type="button"
              disabled={enriching}
              onClick={() => handleSelectResult(r)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '5px 8px',
                borderRadius: 4,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 11.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {r.commonName || r.scientificName}
              </span>
              <span style={{ fontSize: 10.5, fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                {r.scientificName}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

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

function getFormPluralNoun(formId: PropagationFormId): string {
  switch (formId) {
    case 'seed':
      return 'Semillas'
    case 'seedling':
      return 'Plantines'
    case 'cutting':
      return 'Gajos'
    case 'bulb_tuber':
      return 'Bulbos'
    case 'offset_division':
      return 'Hijuelos'
    case 'mature_grafted':
      return 'Plantas'
    default:
      return 'Plantas'
  }
}

export function LocationsPage() {
  const navigate = useNavigate()
  const { locations, add: addLocation, update: updateLocation, remove: removeLocation } = useLocationStore()
  const { individuals, add: addIndividual, update: updateIndividual, remove: removeIndividual } = useIndividualStore()
  const { accessions, add: addAccession } = useAccessionStore()
  const { seedLots, consumeSeeds, add: addSeedLot } = useSeedLotStore()
  const { taxons, add: addTaxon } = useTaxonStore()
  const { farmCoordinates, currentWeather, currentClimate } = useAgroClimateStore()

  // ── Auto-reparación de taxones incompletos (agrega fotos, descriptores fenotípicos y datos FAO EcoCrop) ──
  const hydratedTaxonIdsRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    for (const t of taxons) {
      if (!t.imageUrl || !t.traits || t.traits.length === 0 || !t.agronomicData?.phMinimum) {
        if (!hydratedTaxonIdsRef.current.has(t.id)) {
          hydratedTaxonIdsRef.current.add(t.id)
          void hydrateTaxonWithApis(t.id)
        }
      }
    }
  }, [taxons])

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

  // Sub-pestaña del Drawer de Siembra / Alta unificada: 'inventory' | 'new-material'
  const [sowSubTab, setSowSubTab] = useState<'inventory' | 'new-material'>('inventory')

  // Estado del formulario contextual de Siembra en Sala desde Inventario
  const [sowAccessionId, setSowAccessionId] = useState('')
  const [sowSeedLotId, setSowSeedLotId] = useState('')
  const [sowCount, setSowCount] = useState('1')
  const [sowPosition, setSowPosition] = useState('A-01')
  const [sowBbch, setSowBbch] = useState('0')
  const [sowGeneration, setSowGeneration] = useState('')
  const [sowNotes, setSowNotes] = useState('')

  // Estado del formulario unificado de Nuevo Cultivo / Material
  const [newMaterialTaxonId, setNewMaterialTaxonId] = useState<string>('')
  const [selectedFormId, setSelectedFormId] = useState<PropagationFormId>('seed')
  const [newMaterialCultivar, setNewMaterialCultivar] = useState<string>('')
  const [newMaterialCount, setNewMaterialCount] = useState<string>('50')
  const [newMaterialSeedAction, setNewMaterialSeedAction] = useState<'plant_and_save' | 'save_only'>('plant_and_save')
  const [newMaterialMatureBbch, setNewMaterialMatureBbch] = useState<number>(35)
  const [newMaterialMotherId, setNewMaterialMotherId] = useState<string>('')
  const [newMaterialPlacementMode, setNewMaterialPlacementMode] = useState<'auto_cells' | 'manual_tray'>('auto_cells')
  const [speciesSearchQuery, setSpeciesSearchQuery] = useState<string>('')

  const selectedRoom = useMemo(
    () => locations.find(l => l.id === selectedRoomId) ?? null,
    [locations, selectedRoomId]
  )

  const selectedIndividual = useMemo(
    () => individuals.find(i => i.id === selectedIndividualId) ?? null,
    [individuals, selectedIndividualId]
  )

  // Especie seleccionada para el flujo de Nuevo Cultivo / Material
  const selectedNewTaxon = useMemo(() => {
    if (newMaterialTaxonId) {
      const found = taxons.find(t => t.id === newMaterialTaxonId)
      if (found) return found
    }
    return taxons[0] ?? null
  }, [taxons, newMaterialTaxonId])

  // Plantas existentes de la misma especie para selección opcional como Planta Madre
  const motherCandidates = useMemo(() => {
    if (!selectedNewTaxon) return []
    return individuals.filter(ind => {
      const acc = accessions.find(a => a.id === ind.accessionId)
      return acc?.taxonId === selectedNewTaxon.id
    })
  }, [individuals, accessions, selectedNewTaxon])

  // Limpiar selección de madre si la planta ya no pertenece a la especie elegida
  useEffect(() => {
    if (newMaterialMotherId) {
      const valid = motherCandidates.some(c => c.id === newMaterialMotherId)
      if (!valid) setNewMaterialMotherId('')
    }
  }, [motherCandidates, newMaterialMotherId])

  // Formatos compatibles biológicamente según la especie seleccionada
  const compatibleForms = useMemo(() => {
    return getCompatiblePropagationForms(selectedNewTaxon)
  }, [selectedNewTaxon])

  // Ajuste biológico reactivo: si el formato actual no es compatible con el nuevo taxón, seleccionar el primero válido
  useEffect(() => {
    if (compatibleForms.length > 0 && !compatibleForms.some(f => f.id === selectedFormId)) {
      const fallback = compatibleForms[0]
      setSelectedFormId(fallback.id)
      setNewMaterialCount(fallback.id === 'seed' ? '50' : '1')
    }
  }, [compatibleForms, selectedFormId])

  const currentSpec = useMemo(() => {
    return getPropagationFormSpec(selectedFormId)
  }, [selectedFormId])

  // Código técnico autogenerado (ej. TOM-2026-001)
  const computedAccessionNumber = useMemo(() => {
    const code = (selectedNewTaxon ? getEffectiveCropCode(selectedNewTaxon) : '') || 'PLT'
    const year = new Date().getFullYear()
    const prefix = `${code}-${year}-`
    const matching = accessions.filter(a => a.accessionNumber.startsWith(prefix))
    const nextNum = String(matching.length + 1).padStart(3, '0')
    return `${prefix}${nextNum}`
  }, [selectedNewTaxon, accessions])

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
    setDrawerMode(prev => (prev === 'inspect' ? null : prev))
    setSowSubTab(accessions.length === 0 ? 'new-material' : 'inventory')
  }

  const handleSelectPlant = (individualId: string, posLabel?: string) => {
    setSelectedIndividualId(individualId)
    const ind = individuals.find(i => i.id === individualId)
    const resolvedPos = posLabel || ind?.position || ind?.location
    if (resolvedPos && resolvedPos.toUpperCase() !== 'SIN UBICAR') {
      setSelectedSlot(resolvedPos)
    }
  }

  const handleInspectPlant = (individualId: string, posLabel?: string) => {
    setSelectedIndividualId(individualId)
    const ind = individuals.find(i => i.id === individualId)
    const resolvedPos = posLabel || ind?.position || ind?.location
    if (resolvedPos && resolvedPos.toUpperCase() !== 'SIN UBICAR') {
      setSelectedSlot(resolvedPos)
    }
    setDrawerMode('inspect')
  }

  const handleAdvancePlantBbch = (individualId: string, nextBbch: number) => {
    updateIndividual(individualId, {
      currentBBCH: nextBbch,
    })
  }

  const handleQuickClonePlant = (motherId: string) => {
    if (!selectedRoom) return
    const mother = individuals.find(i => i.id === motherId)
    if (!mother) return
    const acc = accessions.find(a => a.id === mother.accessionId)
    const taxon = acc ? taxons.find(t => t.id === acc.taxonId) : undefined
    const cloneCap = getVegetativeCloneCapability(taxon)

    const freeSlots = getFreeSlotsForRoom(selectedRoom.id)
    const nextSlot = freeSlots[0] ?? 'A-01'
    const roomSlots = useRoomLayoutStore.getState().getSlots(selectedRoom.id)
    const matchingSlot = roomSlots.find(s => s.label === nextSlot)

    const existingClones = individuals.filter(i => i.maternalParentId === motherId).length
    const cloneLabel = `${mother.label || acc?.accessionNumber || 'Planta'} (Clon #${existingClones + 1})`
    const primaryTag = cloneCap.formId === 'offset_division' ? 'hijuelo' : 'esqueje'

    const newInd = addIndividual({
      accessionId: mother.accessionId,
      locationId: selectedRoom.id,
      position: nextSlot,
      location: nextSlot,
      slotId: matchingSlot?.id,
      maternalParentId: mother.id,
      label: cloneLabel,
      plantingDate: new Date().toISOString().slice(0, 10),
      currentBBCH: 10,
      status: 'active',
      tags: [primaryTag, 'clon'],
    })

    setSelectedSlot(nextSlot)
    setSelectedIndividualId(newInd.id)
  }

  const handleRemovePlantFromSlot = (individualId: string) => {
    removeIndividual(individualId)
    setSelectedIndividualId(null)
  }

  // Interacción 3: Drop de Semilla/Variedad sobre una celda vacía
  const handleDropSeedInSlot = (posLabel: string, accessionId: string, seedLotId?: string) => {
    setSelectedSlot(posLabel)
    setSowPosition(posLabel)
    setSowAccessionId(accessionId)
    setSowSeedLotId(seedLotId ?? '')
    setSelectedIndividualId(null)
    setDrawerMode('sow')
    setSowSubTab('inventory')
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

  // ── Selección rápida de Preset Botánico con auto-registro en TaxonStore ──
  const handleSelectOrAddPreset = (preset: StarterSpeciesPreset) => {
    const taxon = selectOrCreatePresetTaxon(preset)
    setNewMaterialTaxonId(taxon.id)
  }

  // ── Handler de Siembra Contextual en la Grilla Isométrica (Desde Inventario) ──
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

  // ── Handler de Alta Unificada "Nuevo Cultivo / Material" ──
  const handleNewMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedNewTaxon) return
    if (!newMaterialMotherId && !newMaterialCultivar.trim()) return

    const spec = currentSpec
    const parsedCount = Math.max(1, parseInt(newMaterialCount, 10) || (spec.id === 'seed' ? 50 : 1))

    // 1. Determinar Accession: reutilizar de la madre si existe, o crear nueva
    let targetAccId: string
    let targetAccNumber: string

    const motherInd = newMaterialMotherId ? individuals.find(i => i.id === newMaterialMotherId) : null
    const motherAcc = motherInd ? accessions.find(a => a.id === motherInd.accessionId) : null

    if (motherAcc) {
      targetAccId = motherAcc.id
      targetAccNumber = motherAcc.accessionNumber
    } else {
      const newAcc = addAccession({
        accessionNumber: computedAccessionNumber,
        taxonId: selectedNewTaxon.id,
        cultivarName: newMaterialCultivar.trim() || 'Cultivar',
        acquisitionSource: 'cultivated',
        acquisitionDate: new Date().toISOString().slice(0, 10),
      })
      targetAccId = newAcc.id
      targetAccNumber = newAcc.accessionNumber
    }

    const initialBBCH = spec.id === 'mature_grafted' ? newMaterialMatureBbch : spec.defaultBBCH
    const tags = newMaterialMotherId
      ? Array.from(new Set([spec.defaultTag, 'clon']))
      : [spec.defaultTag]

    // 2. Destino según el formato y si hay sala activa
    if (selectedRoom) {
      if (spec.id === 'seed') {
        const lot = addSeedLot({
          accessionId: targetAccId,
          lotCode: `${targetAccNumber}-L1`,
          initialCount: parsedCount,
          harvestDate: new Date().toISOString().slice(0, 10),
        })

        if (newMaterialSeedAction === 'plant_and_save') {
          consumeSeeds(lot.id, 1)
          const targetPos = (sowPosition || 'A-01').trim().toUpperCase()
          const roomSlots = useRoomLayoutStore.getState().getSlots(selectedRoom.id)
          const matchingSlot = roomSlots.find(s => s.label === targetPos)

          const ind = addIndividual({
            accessionId: targetAccId,
            seedLotId: lot.id,
            label: `${targetAccNumber} #01`,
            locationId: selectedRoom.id,
            location: targetPos,
            position: targetPos,
            slotId: matchingSlot?.id,
            plantingDate: new Date().toISOString().slice(0, 10),
            currentBBCH: 0,
            status: 'active',
            tags: ['semilla'],
          })
          setSelectedIndividualId(ind.id)
          setDrawerMode('inspect')
        } else {
          setDrawerMode(null)
        }
      } else {
        // seedling, cutting, bulb_tuber, offset_division, mature_grafted
        const existingForAcc = individuals.filter(ind => ind.accessionId === targetAccId).length
        const targetSlots = getFreeSlotsForRoom(selectedRoom.id, (sowPosition || 'A-01').trim().toUpperCase())
        const roomSlots = useRoomLayoutStore.getState().getSlots(selectedRoom.id)

        let firstCreatedId: string | null = null

        for (let i = 0; i < parsedCount; i++) {
          const seqNum = String(existingForAcc + i + 1).padStart(2, '0')
          const autoLabel = `${targetAccNumber} #${seqNum}`

          let assignedSlot = 'Sin ubicar'
          let matchingSlotId: string | undefined = undefined

          if (newMaterialPlacementMode === 'auto_cells') {
            assignedSlot = targetSlots[i] ?? `${sowPosition || 'A-01'}-${i + 1}`
            matchingSlotId = roomSlots.find(s => s.label === assignedSlot)?.id
          }

          const ind = addIndividual({
            accessionId: targetAccId,
            maternalParentId: newMaterialMotherId || undefined,
            label: autoLabel,
            locationId: selectedRoom.id,
            location: assignedSlot,
            position: assignedSlot,
            slotId: matchingSlotId,
            plantingDate: new Date().toISOString().slice(0, 10),
            currentBBCH: initialBBCH,
            status: 'active',
            tags,
          })
          if (i === 0) firstCreatedId = ind.id
        }

        if (firstCreatedId && newMaterialPlacementMode === 'auto_cells') {
          setSelectedIndividualId(firstCreatedId)
          setDrawerMode('inspect')
        } else {
          setDrawerMode(null)
        }
      }
    } else {
      // Sin sala activa (Nivel 1): catálogo / lote en inventario
      if (spec.id === 'seed') {
        addSeedLot({
          accessionId: targetAccId,
          lotCode: `${targetAccNumber}-L1`,
          initialCount: parsedCount,
          harvestDate: new Date().toISOString().slice(0, 10),
        })
      } else {
        const existingForAcc = individuals.filter(ind => ind.accessionId === targetAccId).length
        for (let i = 0; i < parsedCount; i++) {
          const seqNum = String(existingForAcc + i + 1).padStart(2, '0')
          addIndividual({
            accessionId: targetAccId,
            maternalParentId: newMaterialMotherId || undefined,
            label: `${targetAccNumber} #${seqNum}`,
            plantingDate: new Date().toISOString().slice(0, 10),
            currentBBCH: initialBBCH,
            status: 'active',
            tags,
          })
        }
      }
      setDrawerMode(null)
    }

    setNewMaterialCultivar('')
    setNewMaterialMotherId('')
  }

  return (
    <div style={{ position: 'relative', display: 'flex', height: '100%', width: '100%', background: 'var(--surface-base)', overflow: 'hidden' }}>
      {/* ── Panel Lateral Deslizante (Drawer: Nueva Sala | Sembrar en Celda | Inspector de Planta) ── */}
      {drawerMode && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            justifyContent: 'flex-end',
            pointerEvents: selectedRoom ? 'none' : 'auto',
          }}
        >
          {/* Backdrop con clic para cerrar solo en Nivel 1 (Campus Map) */}
          {!selectedRoom && (
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
          )}

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
              pointerEvents: 'auto',
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

        {/* ── MODO 2: Formulario Contextual de Siembra / Alta Unificada de Cultivo ── */}
        {drawerMode === 'sow' && (
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
                  {sowSubTab === 'new-material' || !selectedRoom
                    ? 'Nuevo Cultivo / Material'
                    : `Sembrar en ${selectedRoom.name}`}
                </h2>
                {selectedRoom ? (
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    Celda seleccionada: <strong>{sowPosition || 'A-01'}</strong>
                  </p>
                ) : (
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    Ingreso directo al catálogo y banco de germoplasma
                  </p>
                )}
              </div>
            </div>

            {/* Selector de Pestaña Superior (cuando hay sala activa) */}
            {selectedRoom && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  background: 'var(--surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 3,
                  gap: 4,
                  marginBottom: 16,
                }}
              >
                <button
                  type="button"
                  aria-label="De mi Inventario"
                  onClick={() => setSowSubTab('inventory')}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: sowSubTab === 'inventory' ? 'var(--surface-elevated)' : 'transparent',
                    color: sowSubTab === 'inventory' ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: sowSubTab === 'inventory' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  De mi Inventario
                </button>
                <button
                  type="button"
                  aria-label="+ Nuevo Cultivo / Material"
                  onClick={() => setSowSubTab('new-material')}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: sowSubTab === 'new-material' ? 'var(--surface-elevated)' : 'transparent',
                    color: sowSubTab === 'new-material' ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: sowSubTab === 'new-material' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  + Nuevo Cultivo / Material
                </button>
              </div>
            )}

            {/* Pestaña A: De mi Inventario */}
            {selectedRoom && sowSubTab === 'inventory' && (
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
                    <label htmlFor="sow-room-bbch" style={LABEL_STYLE}>Estadio BBCH inicial</label>
                    <select
                      id="sow-room-bbch"
                      aria-label="Estadio BBCH inicial"
                      style={INPUT_STYLE}
                      value={sowBbch}
                      onChange={e => setSowBbch(e.target.value)}
                    >
                      <option value="0">🌰 Semilla recién sembrada (BBCH 0)</option>
                      <option value="10">✂️ Esqueje / Brote inicial (BBCH 10)</option>
                      <option value="14">🌱 Plantín / Plántula (BBCH 14)</option>
                      <option value="30">🌿 Desarrollo vegetativo (BBCH 30)</option>
                      <option value="55">🌼 Botón floral (BBCH 55)</option>
                      <option value="65">🌸 En Floración (BBCH 65)</option>
                      <option value="75">🍅 Con Frutos (BBCH 75)</option>
                    </select>
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
            )}

            {/* Pestaña B: + Nuevo Cultivo / Material */}
            {(!selectedRoom || sowSubTab === 'new-material') && (
              <form onSubmit={handleNewMaterialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* 1° Especie Botánica */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={LABEL_STYLE}>1° Especie Botánica *</label>
                    <span style={{ fontSize: 10.5, color: 'var(--accent)', fontWeight: 600 }}>
                      {selectedNewTaxon?.commonName || selectedNewTaxon?.genus || 'Elige especie'}
                    </span>
                  </div>

                  {/* Chips de Especies Registradas */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {taxons.map(t => {
                      const isSelected = selectedNewTaxon?.id === t.id
                      return (
                        <button
                          key={t.id}
                          type="button"
                          role="button"
                          aria-pressed={isSelected}
                          aria-label={t.commonName || `${t.genus} ${t.species}`}
                          onClick={() => setNewMaterialTaxonId(t.id)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                            background: isSelected ? 'var(--accent-light)' : 'var(--surface-elevated)',
                            color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                            fontSize: 12,
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isSelected ? '✓ ' : ''}{t.commonName || `${t.genus} ${t.species}`}
                        </button>
                      )
                    })}
                  </div>

                  {/* Presets Botánicos de Inicio Rápido (1 Clic) */}
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>
                      + Especies recomendadas (1 clic):
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {STARTER_SPECIES_PRESETS.filter(preset =>
                        !taxons.some(t => t.genus.toLowerCase() === preset.genus.toLowerCase() && t.species.toLowerCase() === preset.species.toLowerCase())
                      ).map(preset => {
                        const isSelected =
                          selectedNewTaxon?.genus.toLowerCase() === preset.genus.toLowerCase() &&
                          selectedNewTaxon?.species.toLowerCase() === preset.species.toLowerCase()
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            role="button"
                            aria-pressed={isSelected}
                            aria-label={`${preset.commonName} (${preset.genus} ${preset.species})`}
                            onClick={() => handleSelectOrAddPreset(preset)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 'var(--radius-sm)',
                              border: isSelected ? '1.5px solid var(--accent)' : '1px dashed var(--border)',
                              background: isSelected ? 'var(--accent-light)' : 'var(--surface-subtle)',
                              color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                              fontSize: 11,
                              fontWeight: isSelected ? 700 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {preset.commonName} ({preset.genus} {preset.species})
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Buscador Rápido GBIF / Catálogo */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="🔍 Buscar otra especie (GBIF / catálogo)..."
                      aria-label="Buscar en GBIF / Catálogo"
                      value={speciesSearchQuery}
                      onChange={e => setSpeciesSearchQuery(e.target.value)}
                      style={{ ...INPUT_STYLE, fontSize: 11.5 }}
                    />
                    <SafeQueryWrapper>
                      <TaxonSearchDropdown
                        query={speciesSearchQuery}
                        onSelectTaxon={added => {
                          setNewMaterialTaxonId(added.id)
                          setSpeciesSearchQuery('')
                        }}
                      />
                    </SafeQueryWrapper>
                  </div>
                </div>

                {/* 2° Formato de Ingreso Biológico */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={LABEL_STYLE}>2° ¿En qué formato ingresa?</label>
                  </div>
                  <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontStyle: 'italic', margin: '0 0 6px 0' }}>
                    Formatos habilitados según la biología de {selectedNewTaxon?.commonName || selectedNewTaxon?.genus || 'la especie'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {compatibleForms.map(form => {
                      const isSelected = selectedFormId === form.id
                      return (
                        <button
                          key={form.id}
                          type="button"
                          role="button"
                          aria-pressed={isSelected}
                          aria-label={form.label}
                          onClick={() => {
                            setSelectedFormId(form.id)
                            setNewMaterialCount(form.id === 'seed' ? '50' : '1')
                            if (form.id === 'mature_grafted') {
                              setNewMaterialMatureBbch(35)
                            }
                          }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: 4,
                            padding: '10px 11px',
                            borderRadius: 'var(--radius-md)',
                            border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                            background: isSelected ? 'var(--accent-light)' : 'var(--surface-elevated)',
                            color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>
                              {form.icon} {form.label}
                            </span>
                            <span
                              style={{
                                fontSize: 9.5,
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: 4,
                                background: isSelected ? 'var(--accent)' : 'var(--surface-subtle)',
                                color: isSelected ? 'white' : 'var(--text-secondary)',
                              }}
                            >
                              BBCH {form.defaultBBCH}
                            </span>
                          </div>
                          <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.3 }}>
                            {form.description}
                          </p>
                        </button>
                      )
                    })}
                  </div>

                  {/* Selector de Etapa cuando elige mature_grafted */}
                  {selectedFormId === 'mature_grafted' && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label htmlFor="new-material-mature-stage" style={LABEL_STYLE}>
                        Etapa fenológica de desarrollo (BBCH)
                      </label>
                      <select
                        id="new-material-mature-stage"
                        aria-label="Etapa de desarrollo"
                        style={INPUT_STYLE}
                        value={newMaterialMatureBbch}
                        onChange={e => setNewMaterialMatureBbch(Number(e.target.value))}
                      >
                        {MATURE_PLANT_STAGES.map(stage => (
                          <option key={stage.bbch} value={stage.bbch}>
                            {stage.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Selector opcional de Planta Madre cuando elige cutting o offset_division */}
                  {(selectedFormId === 'cutting' || selectedFormId === 'offset_division') && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label htmlFor="new-material-mother" style={LABEL_STYLE}>
                        Planta Madre de Origen (opcional)
                      </label>
                      <select
                        id="new-material-mother"
                        aria-label="Planta Madre (Clon)"
                        style={INPUT_STYLE}
                        value={newMaterialMotherId}
                        onChange={e => {
                          const val = e.target.value
                          setNewMaterialMotherId(val)
                          if (val) {
                            const mother = individuals.find(i => i.id === val)
                            const motherAcc = accessions.find(a => a.id === mother?.accessionId)
                            if (motherAcc?.cultivarName && !newMaterialCultivar.trim()) {
                              setNewMaterialCultivar(motherAcc.cultivarName)
                            }
                          }
                        }}
                      >
                        <option value="">Nuevo material externo (sin planta madre registrada)</option>
                        {motherCandidates.map(ind => {
                          const acc = accessions.find(a => a.id === ind.accessionId)
                          const name = getIndividualDisplayName(ind, acc?.accessionNumber)
                          const pos = ind.position || ind.location || 'Sin ubicar'
                          return (
                            <option key={ind.id} value={ind.id}>
                              {name} ({pos})
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  )}
                </div>

                {/* 3° Identificación y Destino */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={LABEL_STYLE}>3° Identificación y Destino</label>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label htmlFor="new-material-cultivar" style={{ ...LABEL_STYLE, margin: 0 }}>
                        Nombre de Variedad / Cultivar {newMaterialMotherId ? '(Heredado de madre)' : '*'}
                      </label>
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: 'var(--font-mono)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: 'var(--surface-subtle)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        Código: {newMaterialMotherId ? (accessions.find(a => a.id === individuals.find(i => i.id === newMaterialMotherId)?.accessionId)?.accessionNumber ?? computedAccessionNumber) : computedAccessionNumber}
                      </span>
                    </div>
                    <input
                      id="new-material-cultivar"
                      aria-label="Nombre de variedad o cultivar"
                      type="text"
                      style={INPUT_STYLE}
                      placeholder={newMaterialMotherId ? 'Heredado de planta madre...' : 'Ej. Platense, Criollo, Valencia...'}
                      value={newMaterialCultivar}
                      onChange={e => setNewMaterialCultivar(e.target.value)}
                      required={!newMaterialMotherId}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: selectedRoom ? '1fr 1fr' : '1fr', gap: 10 }}>
                    <div>
                      <label htmlFor="new-material-count" style={LABEL_STYLE}>
                        {selectedFormId === 'seed' ? 'Semillas en el sobre' : 'Cantidad a ingresar'}
                      </label>
                      <input
                        id="new-material-count"
                        aria-label="Cantidad a ingresar"
                        type="number"
                        min="1"
                        max="10000"
                        style={INPUT_STYLE}
                        value={newMaterialCount}
                        onChange={e => setNewMaterialCount(e.target.value)}
                      />
                    </div>

                    {selectedRoom && (
                      <div>
                        <label htmlFor="new-material-position" style={LABEL_STYLE}>Celda / Coordenada destino</label>
                        <input
                          id="new-material-position"
                          aria-label="Celda en la grilla"
                          type="text"
                          style={{ ...INPUT_STYLE, fontFamily: 'var(--font-mono)' }}
                          value={sowPosition || 'A-01'}
                          onChange={e => {
                            setSowPosition(e.target.value)
                            setSelectedSlot(e.target.value.toUpperCase())
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Acciones para semillas en sala */}
                  {selectedRoom && selectedFormId === 'seed' && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface-subtle)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Acción para este lote de semillas:
                      </span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="seed-action"
                          value="plant_and_save"
                          checked={newMaterialSeedAction === 'plant_and_save'}
                          onChange={() => setNewMaterialSeedAction('plant_and_save')}
                        />
                        <span>Plantar ahora en <strong>{sowPosition || 'A-01'}</strong> y guardar resto en bandeja</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="seed-action"
                          value="save_only"
                          checked={newMaterialSeedAction === 'save_only'}
                          onChange={() => setNewMaterialSeedAction('save_only')}
                        />
                        <span>Solo guardar sobre en mi Bandeja</span>
                      </label>
                    </div>
                  )}

                  {/* Modo de plantación para no-semillas en sala */}
                  {selectedRoom && selectedFormId !== 'seed' && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface-subtle)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Destino de plantación:
                      </span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="placement-mode"
                          value="auto_cells"
                          checked={newMaterialPlacementMode === 'auto_cells'}
                          onChange={() => setNewMaterialPlacementMode('auto_cells')}
                        />
                        <span>Plantar automáticamente en celdas libres (desde {sowPosition || 'A-01'})</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="placement-mode"
                          value="manual_tray"
                          checked={newMaterialPlacementMode === 'manual_tray'}
                          onChange={() => setNewMaterialPlacementMode('manual_tray')}
                        />
                        <span>Dejar en la Bandeja Inferior para ubicar manualmente</span>
                      </label>
                    </div>
                  )}

                  {(() => {
                    const parsedCount = Math.max(1, parseInt(newMaterialCount, 10) || (selectedFormId === 'seed' ? 50 : 1))
                    const canSubmit = Boolean(selectedNewTaxon && (newMaterialMotherId || newMaterialCultivar.trim()))
                    let submitLabel = 'Confirmar e Ingresar Cultivo'
                    if (selectedRoom) {
                      if (selectedFormId === 'seed' && newMaterialSeedAction === 'save_only') {
                        submitLabel = 'Guardar sobre en Bandeja'
                      } else if (newMaterialPlacementMode === 'manual_tray' && selectedFormId !== 'seed') {
                        submitLabel = parsedCount > 1
                          ? `Dejar ${parsedCount} ${getFormPluralNoun(currentSpec.id)} en Bandeja`
                          : `Dejar ${currentSpec.shortLabel} en Bandeja`
                      } else {
                        submitLabel = parsedCount > 1
                          ? `Plantar ${parsedCount} ${getFormPluralNoun(currentSpec.id)} desde ${sowPosition || 'A-01'}`
                          : `Plantar ${currentSpec.shortLabel} en ${sowPosition || 'A-01'}`
                      }
                    }

                    return (
                      <button
                        type="submit"
                        disabled={!canSubmit}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 7,
                          padding: '10px 16px',
                          borderRadius: 'var(--radius-md)',
                          background: canSubmit ? 'var(--accent)' : 'var(--surface-muted)',
                          color: canSubmit ? 'white' : 'var(--text-tertiary)',
                          fontSize: 13,
                          fontWeight: 600,
                          border: 'none',
                          cursor: canSubmit ? 'pointer' : 'not-allowed',
                          boxShadow: canSubmit ? 'var(--shadow-sm)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Sprout size={14} />
                        {submitLabel}
                      </button>
                    )
                  })()}
                </div>
              </form>
            )}
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
                  aria-label="+ Nuevo Cultivo / Material"
                  onClick={() => {
                    setDrawerMode('sow')
                    setSowSubTab('new-material')
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 13px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--accent)',
                    background: 'var(--surface-elevated)',
                    color: 'var(--accent)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Sprout size={13} />
                  + Nuevo Cultivo / Material
                </button>
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
              setSowSubTab(accessions.length === 0 ? 'new-material' : 'inventory')
              if (!sowPosition) setSowPosition('A-01')
            }}
            onOpenNewMaterialDrawer={() => {
              setDrawerMode('sow')
              setSowSubTab('new-material')
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
            onInspectPlant={handleInspectPlant}
            onDropSeedInSlot={handleDropSeedInSlot}
            onMovePlantToSlot={handleMovePlantToSlot}
            onMovePlantToRoom={handleMovePlantToRoom}
            onUpdateGridDimensions={(r, c) =>
              updateLocation(selectedRoom.id, { rows: r, cols: c })
            }
            onNavigateSeedLot={lotId => navigate(`/seedlots?selectedId=${lotId}`)}
            onAdvancePlantBbch={handleAdvancePlantBbch}
            onQuickClonePlant={handleQuickClonePlant}
            onRemovePlantFromSlot={handleRemovePlantFromSlot}
            onOpenSowDrawerWithSlot={(slot, subTab) => {
              setSelectedSlot(slot)
              setSowPosition(slot)
              setDrawerMode('sow')
              setSowSubTab(subTab)
            }}
            onDeselectSlot={() => setSelectedSlot(null)}
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
