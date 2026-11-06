import React, { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useIndividualStore } from '@/store/individualStore'
import { useAccessionStore } from '@/store/accessionStore'
import { useLocationStore } from '@/store/locationStore'
import { useTaxonStore } from '@/store/taxonStore'
import { useSeedLotStore } from '@/store/seedLotStore'
import { useObservationStore } from '@/store/observationStore'
import { getTraitsForCrop, getEffectiveCropCode } from '@/domain/ontology/index'
import type { TraitDefinition } from '@/domain/ontology/types'
import { getIndividualDisplayName } from '@/domain/individual'
import type { Individual, IndividualStatus, CrossType } from '@/domain/individual'
import { getVegetativeCloneCapability } from '@/domain/propagationForm'
import { useSpaceLayoutStore } from '@/store/spaceLayoutStore'
import { bbchToPhase } from '@/features/locations/space3d/SpacePlantSprite'
import { ActiveCropTabs } from '@/components/ActiveCropTabs'
import { HudChipRow, HudFlyout, type HudChipOption } from '@/components/hud'
import {
  Sprout, Plus, Search, Trash2, Info, MapPin, GitBranch,
  Tag, Calendar, Activity, Leaf,
  Package, FlaskConical, CheckCircle2, Sparkles, History, X
} from 'lucide-react'

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── BBCH helpers ────────────────────────────────────────────────────────────

const BBCH_STAGES: { range: [number, number]; label: string; color: string }[] = [
  { range: [0,  9],  label: 'Germinación',       color: '#74c69d' },
  { range: [10, 19], label: 'Hoja',               color: '#52b788' },
  { range: [20, 29], label: 'Brotes laterales',   color: '#40916c' },
  { range: [30, 39], label: 'Elongación',          color: '#2d6a4f' },
  { range: [40, 49], label: 'Partes vegetativas', color: '#1b4332' },
  { range: [50, 59], label: 'Inflorescencia',     color: '#7b2d8b' },
  { range: [60, 69], label: 'Floración',           color: '#9b5de5' },
  { range: [70, 79], label: 'Fruto',              color: '#e76f51' },
  { range: [80, 89], label: 'Maduración',          color: '#f4a261' },
  { range: [90, 99], label: 'Senescencia',         color: '#8d8d8d' },
]

function getBBCHInfo(stage?: number) {
  if (stage === undefined) return null
  return BBCH_STAGES.find(s => stage >= s.range[0] && stage <= s.range[1]) ?? null
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<IndividualStatus, { label: string; color: string; badgeClass: string }> = {
  active:    { label: 'Activo',     color: '#10b981', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  harvested: { label: 'Cosechado', color: '#0284c7', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200' },
  dead:      { label: 'Muerto',    color: '#ef4444', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
  discarded: { label: 'Descartado',color: '#64748b', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' },
}

const CROSS_TYPE_LABELS: Record<CrossType, string> = {
  open_pollinated: 'Polinización abierta',
  self: 'Autopolinización',
  controlled: 'Controlada',
  unknown: 'Desconocido',
}

const STAGE_MILESTONES = [
  { stage: 0,  icon: '🌰', shortLabel: 'Germinación', ariaLabel: '0 · Germinación' },
  { stage: 14, icon: '🌱', shortLabel: 'Plántula', ariaLabel: '14 · Hoja' },
  { stage: 30, icon: '🌿', shortLabel: 'Vegetativo', ariaLabel: '30 · Elongación' },
  { stage: 55, icon: '🌼', shortLabel: 'Botón floral', ariaLabel: '55 · Inflorescencia' },
  { stage: 65, icon: '🌸', shortLabel: 'Floración', ariaLabel: '65 · Floración' },
  { stage: 75, icon: '🍅', shortLabel: 'Fruto', ariaLabel: '75 · Fruto' },
  { stage: 89, icon: '🌾', shortLabel: 'Maduración', ariaLabel: '89 · Maduración' },
] as const

const VITAL_STATUS_OPTIONS: { value: IndividualStatus; label: string }[] = [
  { value: 'active',    label: '🟢 En cultivo (Activo)' },
  { value: 'harvested', label: '🌾 Cosechado' },
  { value: 'dead',      label: '🥀 Muerto / Baja' },
  { value: 'discarded', label: '🗑️ Descartado' },
]

// ─── Micro HUD components ────────────────────────────────────────────────────

function StatusBadge({ status }: { status: IndividualStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.badgeClass}`}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  )
}

function BBCHBar({ stage }: { stage?: number }) {
  const info = getBBCHInfo(stage)
  if (stage === undefined || !info) {
    return <span className="text-slate-400 text-xs italic">Sin datos</span>
  }
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: info.color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, stage))}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-[11px] font-mono font-medium text-slate-600 shrink-0 min-w-14 text-right">
        {stage} · {info.label}
      </span>
    </div>
  )
}

function HudCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3.5 shadow-xs ${className}`}>
      {children}
    </div>
  )
}

function HudCardHeader({ icon: Icon, label, right }: { icon: React.ElementType; label: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
        <Icon size={13} className="text-emerald-600" />
        <span>{label}</span>
      </div>
      {right}
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] text-slate-400 uppercase font-mono tracking-wider mb-0.5">
        {label}
      </dt>
      <dd className="text-xs font-medium text-slate-800">
        {children}
      </dd>
    </div>
  )
}

function InlineTraitInput({
  trait,
  value,
  onChange,
}: {
  trait: TraitDefinition
  value: any
  onChange: (v: any) => void
}) {
  const inputId = `inline-trait-${trait.id}`

  if (trait.type === 'categorical' && trait.options) {
    return (
      <select
        id={inputId}
        aria-label={trait.name}
        className="w-full bg-slate-50 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Seleccionar...</option>
        {trait.options.map(opt => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }

  if (trait.type === 'boolean') {
    return (
      <select
        id={inputId}
        aria-label={trait.name}
        className="w-full bg-slate-50 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Seleccionar...</option>
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>
    )
  }

  return (
    <div className="relative">
      <input
        id={inputId}
        aria-label={trait.name}
        type={trait.type === 'numeric' ? 'number' : 'text'}
        min={trait.min}
        max={trait.max}
        step={trait.type === 'numeric' ? 'any' : undefined}
        className="w-full bg-slate-50 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition pr-10"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={trait.type === 'numeric' ? '0.00' : ''}
      />
      {trait.unit && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 font-semibold pointer-events-none">
          {trait.unit}
        </span>
      )}
    </div>
  )
}

// ─── Individual Detail Component ──────────────────────────────────────────────

export function IndividualDetail({
  individual,
  onDelete,
  compact = false,
}: {
  individual: Individual
  onDelete: () => void
  compact?: boolean
}) {
  const navigate = useNavigate()
  const { accessions } = useAccessionStore()
  const { locations } = useLocationStore()
  const { taxons } = useTaxonStore()
  const { individuals, update: updateIndividual, add: addIndividual } = useIndividualStore()
  const { seedLots, add: addSeedLot } = useSeedLotStore()
  const { observations, add: addObservation } = useObservationStore()

  const accession = accessions.find(a => a.id === individual.accessionId)
  const taxon = accession ? taxons.find(t => t.id === accession.taxonId) : undefined
  const location = individual.locationId ? locations.find(l => l.id === individual.locationId) : undefined
  const mother = individual.maternalParentId ? individuals.find(i => i.id === individual.maternalParentId) : undefined
  const father = individual.paternalParentId ? individuals.find(i => i.id === individual.paternalParentId) : undefined
  const originSeedLot = individual.seedLotId ? seedLots.find(l => l.id === individual.seedLotId) : undefined
  const harvestedSeedLots = seedLots.filter(l => l.harvestIndividualId === individual.id)

  const effectiveCropCode = taxon ? getEffectiveCropCode(taxon) : ''
  const traits = effectiveCropCode ? getTraitsForCrop(effectiveCropCode) : (taxon?.traits || [])
  const plantObservations = observations.filter(o => o.individualId === individual.id)
  const cloneCap = getVegetativeCloneCapability(taxon)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showFineBbch, setShowFineBbch] = useState(false)
  const [bbchDraft, setBbchDraft] = useState(() => (
    individual.currentBBCH !== undefined ? String(individual.currentBBCH) : ''
  ))
  const [showHarvestPanel, setShowHarvestPanel] = useState(false)
  const [harvestLotCode, setHarvestLotCode] = useState('')
  const [harvestCount, setHarvestCount] = useState('100')
  const [harvestStorage, setHarvestStorage] = useState('')
  const [harvestGermRate, setHarvestGermRate] = useState('')
  const [harvestSuccessMsg, setHarvestSuccessMsg] = useState<string | null>(null)

  const [showClonePanel, setShowClonePanel] = useState(false)
  const [cloneCount, setCloneCount] = useState('1')
  const [clonePlacementMode, setClonePlacementMode] = useState<'auto_cells' | 'manual_tray'>(
    individual.locationId ? 'auto_cells' : 'manual_tray'
  )
  const [cloneSuccessMsg, setCloneSuccessMsg] = useState<string | null>(null)

  const [traitForm, setTraitForm] = useState<Record<string, any>>({})
  const [phenoSuccessMsg, setPhenoSuccessMsg] = useState<string | null>(null)

  const displayName = getIndividualDisplayName(individual, accession?.accessionNumber)

  const handleOpenClonePanel = () => {
    setCloneCount('1')
    setClonePlacementMode(individual.locationId ? 'auto_cells' : 'manual_tray')
    setShowClonePanel(prev => !prev)
    setShowHarvestPanel(false)
  }

  const handleCloneSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedCount = Math.max(1, Math.min(50, parseInt(cloneCount, 10) || 1))
    const existingForAcc = individuals.filter(ind => ind.accessionId === individual.accessionId).length

    let freeSlots: Array<{ id: string; label: string }> = []

    if (individual.locationId && clonePlacementMode === 'auto_cells') {
      const store = useSpaceLayoutStore.getState()
      const layout = store.layouts[individual.locationId] ?? store.getOrCreateSpaceLayout(individual.locationId)
      const occupiedSlotIds = new Set(
        individuals
          .filter(i => i.locationId === individual.locationId && i.slotId)
          .map(i => i.slotId!)
      )
      freeSlots = (layout?.placedPlants ?? [])
        .filter(slot => !occupiedSlotIds.has(slot.id))
        .map(slot => ({ id: slot.id, label: slot.label }))
    }

    const todayStr = getTodayIsoDate()
    for (let i = 0; i < parsedCount; i++) {
      const seqNum = String(existingForAcc + i + 1).padStart(2, '0')
      const autoLabel = `${accession?.accessionNumber ?? 'PLT'} #${seqNum}`

      let pos = 'Sin ubicar'
      let slotId: string | undefined = undefined

      if (individual.locationId && clonePlacementMode === 'auto_cells' && i < freeSlots.length) {
        const slot = freeSlots[i]
        slotId = slot.id
        pos = slot.label || 'Sin ubicar'
      }

      addIndividual({
        accessionId: individual.accessionId,
        maternalParentId: individual.id,
        locationId: individual.locationId,
        position: pos,
        location: pos,
        slotId,
        label: autoLabel,
        plantingDate: todayStr,
        currentBBCH: cloneCap.defaultBBCH,
        status: 'active',
        tags: [cloneCap.defaultTag, 'clon'],
      })
    }

    setShowClonePanel(false)
    setCloneSuccessMsg(
      `${parsedCount} ${cloneCap.shortNoun}${parsedCount > 1 ? 's' : ''} creado${parsedCount > 1 ? 's' : ''} exitosamente desde ${displayName}.`
    )
  }

  const handleOpenHarvestPanel = () => {
    const existingCount = seedLots.filter(l => l.accessionId === individual.accessionId).length + 1
    const defaultCode = `${accession?.accessionNumber ?? 'LOT'}-L${existingCount}`
    setHarvestLotCode(defaultCode)
    setHarvestCount('100')
    setHarvestStorage('')
    setHarvestGermRate('')
    setShowHarvestPanel(true)
    setShowClonePanel(false)
  }

  const handleSaveBBCH = (newStage: number) => {
    if (Number.isNaN(newStage) || newStage < 0 || newStage > 99) return
    updateIndividual(individual.id, { currentBBCH: newStage })
    setBbchDraft(String(newStage))
    if (individual.locationId) {
      const store = useSpaceLayoutStore.getState()
      const layout = store.layouts[individual.locationId]
      if (layout) {
        const matchingPlant = layout.placedPlants.find(
          (p) => p.id === individual.id || p.label === individual.label
        )
        if (matchingPlant) {
          store.updatePlant(individual.locationId, matchingPlant.id, {
            bbchStage: newStage,
            phase: bbchToPhase(newStage),
          })
        }
      }
    }
  }

  const handleHarvestSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!harvestLotCode.trim()) return

    const createdLot = addSeedLot({
      accessionId: individual.accessionId,
      lotCode: harvestLotCode.trim(),
      harvestIndividualId: individual.id,
      harvestDate: getTodayIsoDate(),
      initialCount: harvestCount ? Number(harvestCount) : undefined,
      locationId: individual.locationId,
      storageLocation: harvestStorage.trim() || undefined,
      germinationRate: harvestGermRate ? Number(harvestGermRate) : undefined,
    })

    updateIndividual(individual.id, {
      status: 'harvested',
      currentBBCH: (individual.currentBBCH === undefined || individual.currentBBCH < 80) ? 89 : individual.currentBBCH,
    })

    setShowHarvestPanel(false)
    setHarvestSuccessMsg(`Lote ${createdLot.lotCode} cosechado y registrado en el banco.`)
  }

  const handlePhenotypeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let added = 0
    traits.forEach(trait => {
      const val = traitForm[trait.id]
      if (val !== undefined && val !== '') {
        addObservation({
          individualId: individual.id,
          traitId: trait.id,
          value: val,
          date: new Date().toISOString(),
          bbchAtObservation: individual.currentBBCH,
        })
        added++
      }
    })
    if (added > 0) {
      setTraitForm({})
      setPhenoSuccessMsg(`${added} medición${added > 1 ? 'es' : ''} guardada${added > 1 ? 's' : ''} en la bitácora de la planta.`)
      setTimeout(() => setPhenoSuccessMsg(null), 3500)
    }
  }

  const formatObsValue = (obs: typeof observations[0], trait?: TraitDefinition) => {
    if (!trait) return String(obs.value)
    if (trait.type === 'categorical') {
      const opt = trait.options?.find(o => String(o.value) === String(obs.value))
      return opt?.label ?? String(obs.value)
    }
    if (trait.type === 'boolean') {
      return obs.value === 'true' || obs.value === true ? 'Sí' : 'No'
    }
    return `${obs.value}${trait.unit ? ` ${trait.unit}` : ''}`
  }

  return (
    <div className={`overflow-y-auto w-full flex flex-col gap-3 text-xs text-slate-700 ${compact ? 'p-1' : 'p-2 sm:p-3'}`}>
      {/* Detail Header */}
      <header className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3.5 shadow-xs">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-base font-bold text-slate-900 font-mono truncate">
                  {displayName}
                </h2>
                <span className="text-xs font-mono text-slate-500">
                  ({accession?.accessionNumber ?? 'Sin accesion'})
                </span>
                <StatusBadge status={individual.status} />
                {individual.generation && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {individual.generation}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 italic truncate">
                {taxon ? `${taxon.genus} ${taxon.species}` : 'Especie desconocida'}
                {taxon?.commonName && (
                  <span className="not-italic text-slate-400 font-normal ml-1">
                    · {taxon.commonName}
                  </span>
                )}
              </p>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {cloneCap.canClone && (
                <button
                  type="button"
                  onClick={handleOpenClonePanel}
                  aria-label={cloneCap.actionLabel}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs px-2.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1"
                >
                  ✂️ <span>{cloneCap.actionLabel}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenHarvestPanel}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold text-xs px-2.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1"
              >
                <Package size={13} strokeWidth={2} />
                <span>Cosechar Semillas</span>
              </button>

              {confirmDelete ? (
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-[11px] text-rose-800 font-semibold px-1">¿Eliminar?</span>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-2 py-1 rounded-lg transition cursor-pointer"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs px-2 py-1 rounded-lg transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer"
                >
                  <Trash2 size={13} strokeWidth={2} />
                  <span>Eliminar</span>
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          {individual.tags && individual.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {individual.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full border border-slate-200 font-mono"
                >
                  <Tag size={9} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Clone feedback message */}
      {cloneSuccessMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          <span>{cloneSuccessMsg}</span>
        </div>
      )}

      {/* Vegetative Clone Panel */}
      {showClonePanel && (
        <HudCard className="bg-emerald-50/70 border-emerald-300">
          <HudCardHeader
            icon={Sprout}
            label={`Multiplicación Vegetativa · ${cloneCap.actionLabel} de ${displayName}`}
          />
          <form onSubmit={handleCloneSubmit} className="flex flex-col gap-3">
            <div>
              <label htmlFor="clone-count" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Cantidad de {cloneCap.shortNoun}s
              </label>
              <input
                id="clone-count"
                aria-label="Cantidad de clones"
                type="number"
                min={1}
                max={50}
                className="w-full bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                value={cloneCount}
                onChange={e => setCloneCount(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-slate-700">
                Destino de los clones:
              </span>
              {individual.locationId ? (
                <>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="clone-placement-mode"
                      aria-label="Destino de los clones"
                      value="auto_cells"
                      checked={clonePlacementMode === 'auto_cells'}
                      onChange={() => setClonePlacementMode('auto_cells')}
                    />
                    <span>Plantar automáticamente en puestos libres de esta sala</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="clone-placement-mode"
                      value="manual_tray"
                      checked={clonePlacementMode === 'manual_tray'}
                      onChange={() => setClonePlacementMode('manual_tray')}
                    />
                    <span>Dejar en Bandeja (Sin ubicar) para ubicar manualmente</span>
                  </label>
                </>
              ) : (
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="clone-placement-mode"
                    aria-label="Destino de los clones"
                    value="manual_tray"
                    checked
                    readOnly
                  />
                  <span>Dejar en Bandeja (Sin ubicar) para ubicar manualmente</span>
                </label>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-emerald-200">
              <button
                type="button"
                onClick={() => setShowClonePanel(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
              >
                Confirmar {cloneCap.shortNoun}s
              </button>
            </div>
          </form>
        </HudCard>
      )}

      {/* Harvest feedback message */}
      {harvestSuccessMsg && (
        <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 size={15} className="text-purple-600 shrink-0" />
          <span>{harvestSuccessMsg}</span>
        </div>
      )}

      {/* Harvest SeedLot Panel */}
      {showHarvestPanel && (
        <HudCard className="bg-purple-50/70 border-purple-300">
          <HudCardHeader icon={Package} label="Cosechar Semillas hacia Banco de Germoplasma" />
          <form onSubmit={handleHarvestSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="harvest-lot-code" className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Código del Nuevo Lote *
                </label>
                <input
                  id="harvest-lot-code"
                  aria-label="Código del Nuevo Lote"
                  type="text"
                  className="w-full bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 outline-none font-mono transition"
                  value={harvestLotCode}
                  onChange={e => setHarvestLotCode(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="harvest-seed-count" className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Cantidad de Semillas Cosechadas
                </label>
                <input
                  id="harvest-seed-count"
                  aria-label="Cantidad de Semillas Cosechadas"
                  type="number"
                  min={1}
                  className="w-full bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 outline-none transition"
                  value={harvestCount}
                  onChange={e => setHarvestCount(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="harvest-storage" className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Posición en Banco / Heladera
                </label>
                <input
                  id="harvest-storage"
                  type="text"
                  placeholder="Ej. Cámara Fría 1 · Sobre A4"
                  className="w-full bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 outline-none transition"
                  value={harvestStorage}
                  onChange={e => setHarvestStorage(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="harvest-germ" className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Germinación Estimada (%)
                </label>
                <input
                  id="harvest-germ"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Ej. 92"
                  className="w-full bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 outline-none transition"
                  value={harvestGermRate}
                  onChange={e => setHarvestGermRate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-purple-200">
              <button
                type="button"
                onClick={() => setShowHarvestPanel(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 size={13} />
                <span>Confirmar Cosecha</span>
              </button>
            </div>
          </form>
        </HudCard>
      )}

      {/* ── Card: Ciclo de Vida y Desarrollo ── */}
      <HudCard>
        <HudCardHeader
          icon={Activity}
          label="Ciclo de Vida y Desarrollo"
          right={
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              BBCH {individual.currentBBCH ?? 0}
            </span>
          }
        />

        {/* Vital Status Selector */}
        <div className="mb-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 uppercase font-mono mr-1">
                Estado:
              </span>
              {VITAL_STATUS_OPTIONS.map(opt => {
                const isSelected = individual.status === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateIndividual(individual.id, { status: opt.value })}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-semibold shadow-xs ring-1 ring-emerald-500'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>

            <select
              aria-label="Cambiar estado"
              className="sr-only"
              value={individual.status}
              onChange={e => updateIndividual(individual.id, { status: e.target.value as IndividualStatus })}
            >
              {VITAL_STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* BBCH bar & milestones */}
        <div className="flex flex-col gap-2">
          <BBCHBar stage={individual.currentBBCH} />

          <div className="flex flex-wrap gap-1.5 mt-2">
            {STAGE_MILESTONES.map(m => {
              const isCurrent = individual.currentBBCH === m.stage
              return (
                <button
                  key={m.stage}
                  type="button"
                  aria-label={m.ariaLabel}
                  onClick={() => handleSaveBBCH(m.stage)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-600 text-white font-bold shadow-xs ring-2 ring-emerald-400/50'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span>{m.shortLabel}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Expert BBCH Fine-Tuning */}
        <div className="mt-3 pt-2.5 border-t border-dashed border-slate-200">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowFineBbch(prev => !prev)}
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
            >
              <span>⚙️ Ajuste fino BBCH ({individual.currentBBCH ?? 0}/99)</span>
              <span className="text-[10px] text-slate-400">{showFineBbch ? '▲ Ocultar' : '▼ Calibrar'}</span>
            </button>
          </div>

          {showFineBbch && (
            <div className="flex items-center gap-2 mt-2">
              <input
                aria-label="Actualizar BBCH"
                type="number"
                min={0}
                max={99}
                placeholder="0-99"
                value={bbchDraft}
                onChange={e => setBbchDraft(e.target.value)}
                className="w-20 bg-slate-50 focus:bg-white text-slate-900 text-xs rounded-xl px-2.5 py-1.5 border border-slate-200 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
              />
              <button
                type="button"
                onClick={() => {
                  if (bbchDraft.trim() !== '') handleSaveBBCH(Number(bbchDraft))
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Guardar BBCH
              </button>
            </div>
          )}
        </div>
      </HudCard>

      {/* ── Card: Evaluación Fenotípica y Bitácora In-Situ ── */}
      <HudCard>
        <HudCardHeader
          icon={FlaskConical}
          label="Evaluación Fenotípica y Bitácora In-Situ"
          right={
            effectiveCropCode ? (
              <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {traits.length} rasgos ({effectiveCropCode})
              </span>
            ) : undefined
          }
        />

        {phenoSuccessMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span>{phenoSuccessMsg}</span>
          </div>
        )}

        {traits.length > 0 ? (
          <form onSubmit={handlePhenotypeSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {traits.map(trait => (
                <div key={trait.id}>
                  <label htmlFor={`inline-trait-${trait.id}`} className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {trait.name}
                  </label>
                  <InlineTraitInput
                    trait={trait}
                    value={traitForm[trait.id]}
                    onChange={v => setTraitForm(prev => ({ ...prev, [trait.id]: v }))}
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer mt-1"
            >
              <CheckCircle2 size={13} />
              <span>Guardar Medición Fenotípica</span>
            </button>
          </form>
        ) : (
          <p className="text-xs text-slate-400 italic">
            Esta especie no tiene descriptores fenotípicos configurados en la ontología.
          </p>
        )}

        {/* Observations history logbook */}
        {plantObservations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-2.5">
              <History size={12} className="text-slate-400" />
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">
                Bitácora de Mediciones ({plantObservations.length})
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[...plantObservations].reverse().map(obs => {
                const trait = traits.find(t => t.id === obs.traitId)
                return (
                  <div
                    key={obs.id}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {trait?.name ?? obs.traitId}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {obs.bbchAtObservation !== undefined ? `BBCH ${obs.bbchAtObservation}` : 'Medición'}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0">
                      {formatObsValue(obs, trait)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </HudCard>

      {/* ── Traceability & Physical Space Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Traceability */}
        <HudCard>
          <HudCardHeader icon={Info} label="Trazabilidad" />
          <dl className="flex flex-col gap-2.5">
            <InfoRow label="Variedad (Accesión)">
              <span className="font-mono text-xs font-semibold text-slate-900">
                {accession?.accessionNumber ?? 'N/A'}
              </span>
            </InfoRow>
            {originSeedLot && (
              <InfoRow label="Lote de semilla (origen)">
                <button
                  type="button"
                  onClick={() => navigate(`/seedlots?selectedId=${originSeedLot.id}`)}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-mono text-[11px] font-semibold hover:bg-purple-100 transition cursor-pointer"
                >
                  <Package size={11} />
                  <span>{originSeedLot.lotCode}</span>
                </button>
              </InfoRow>
            )}
            {individual.plantingDate && (
              <InfoRow label="Siembra">
                <span className="inline-flex items-center gap-1 text-slate-700">
                  <Calendar size={11} className="text-slate-400" />
                  {new Date(individual.plantingDate).toLocaleDateString('es-AR', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </span>
              </InfoRow>
            )}
            {individual.generation && (
              <InfoRow label="Generación">{individual.generation}</InfoRow>
            )}
            {harvestedSeedLots.length > 0 && (
              <InfoRow label="Lotes cosechados de esta planta">
                <div className="flex flex-wrap gap-1 mt-1">
                  {harvestedSeedLots.map(lot => (
                    <button
                      key={lot.id}
                      type="button"
                      onClick={() => navigate(`/seedlots?selectedId=${lot.id}`)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-semibold hover:bg-emerald-100 transition cursor-pointer"
                    >
                      <Sparkles size={10} />
                      <span>{lot.lotCode}</span>
                      {lot.currentCount !== undefined && <span className="text-slate-400">({lot.currentCount} u.)</span>}
                    </button>
                  ))}
                </div>
              </InfoRow>
            )}
          </dl>
        </HudCard>

        {/* Physical Space */}
        <HudCard>
          <HudCardHeader icon={MapPin} label="Espacio Físico" />
          <dl className="flex flex-col gap-2.5">
            <InfoRow label="Instalación">
              {location ? location.name : <span className="text-slate-400 italic">Sin ubicación asignada</span>}
            </InfoRow>
            {individual.location && (
              <InfoRow label="Posición">{individual.location}</InfoRow>
            )}
            {individual.position && (
              <InfoRow label="Pos. experimental">
                <span className="font-mono text-xs">{individual.position}</span>
              </InfoRow>
            )}
          </dl>
        </HudCard>
      </div>

      {/* Pedigree (if exists) */}
      {(mother || father || individual.crossType) && (
        <HudCard>
          <HudCardHeader icon={GitBranch} label="Pedigrí" />
          <dl className="flex flex-col gap-2.5">
            {individual.crossType && (
              <InfoRow label="Tipo de cruce">{CROSS_TYPE_LABELS[individual.crossType]}</InfoRow>
            )}
            {mother && (
              <InfoRow label="Planta madre (sf)">
                <span className="font-mono text-xs">
                  {accessions.find(a => a.id === mother.accessionId)?.accessionNumber ?? mother.id}
                </span>
              </InfoRow>
            )}
            {father && (
              <InfoRow label="Planta padre (sm)">
                <span className="font-mono text-xs">
                  {accessions.find(a => a.id === father.accessionId)?.accessionNumber ?? father.id}
                </span>
              </InfoRow>
            )}
          </dl>
        </HudCard>
      )}

      {/* Notes */}
      {individual.notes && (
        <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs">
          <p className="font-semibold mb-0.5 text-amber-800">Notas:</p>
          <p>{individual.notes}</p>
        </div>
      )}

      {/* Footer ID */}
      <p className="text-[10px] text-slate-400 font-mono mt-1">
        id: {individual.id}
      </p>
    </div>
  )
}

// ─── Main IndividualsPage ─────────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'harvested' | 'dead_discarded'

export function IndividualsPage() {
  const { individuals, add, remove } = useIndividualStore()
  const { accessions } = useAccessionStore()
  const { locations } = useLocationStore()
  const { taxons } = useTaxonStore()
  const { seedLots, consumeSeeds } = useSeedLotStore()

  const [searchParams] = useSearchParams()
  const initialAccId = searchParams.get('accessionId') || ''
  const initialSeedLotId = searchParams.get('seedLotId') || ''
  const initialLocationId = searchParams.get('locationId') || ''
  const initialSelectedId = searchParams.get('selectedId')

  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId)
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Form state
  const [accessionId, setAccessionId] = useState(() => {
    if (initialAccId) return initialAccId
    if (initialSeedLotId) {
      const lot = seedLots.find(l => l.id === initialSeedLotId)
      return lot ? lot.accessionId : ''
    }
    return ''
  })
  const [seedLotId, setSeedLotId] = useState(initialSeedLotId)
  const [plantCount, setPlantCount] = useState('1')
  const [locationId, setLocationId] = useState(initialLocationId)
  const [locationNote, setLocationNote] = useState('')
  const [plantingDate, setPlantingDate] = useState('')
  const [bbch, setBbch] = useState('')
  const [status, setStatus] = useState<IndividualStatus>('active')
  const [generation, setGeneration] = useState('')
  const [notes, setNotes] = useState('')

  const availableSeedLots = useMemo(() => {
    if (!accessionId) return []
    return seedLots.filter(
      lot =>
        lot.accessionId === accessionId &&
        lot.status === 'active' &&
        (lot.currentCount === undefined || lot.currentCount > 0)
    )
  }, [seedLots, accessionId])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessionId) return

    const acc = accessions.find(a => a.id === accessionId)
    const existingForAcc = individuals.filter(ind => ind.accessionId === accessionId).length
    const countToSow = Math.max(1, Math.min(100, parseInt(plantCount, 10) || 1))

    let lastCreatedId: string | null = null
    for (let i = 0; i < countToSow; i++) {
      const seqNum = String(existingForAcc + i + 1).padStart(2, '0')
      const autoLabel = `${acc?.accessionNumber ?? 'PLT'} #${seqNum}`
      const posLabel = countToSow > 1 && locationNote.trim()
        ? `${locationNote.trim()} (${i + 1})`
        : (locationNote || undefined)

      const newInd = add({
        accessionId,
        seedLotId: seedLotId || undefined,
        label: autoLabel,
        locationId: locationId || undefined,
        location: posLabel,
        plantingDate: plantingDate || undefined,
        currentBBCH: bbch !== '' ? Number(bbch) : undefined,
        status,
        generation: generation || undefined,
        notes: notes || undefined,
      })
      if (i === 0) lastCreatedId = newInd.id
    }

    if (seedLotId) {
      consumeSeeds(seedLotId, countToSow)
    }

    if (lastCreatedId) {
      setSelectedId(lastCreatedId)
      setIsFlyoutOpen(true)
    }
    setAccessionId('')
    setSeedLotId('')
    setPlantCount('1')
    setLocationId('')
    setLocationNote('')
    setPlantingDate('')
    setBbch('')
    setStatus('active')
    setGeneration('')
    setNotes('')
  }

  const handleDelete = () => {
    if (!selectedId) return
    remove(selectedId)
    setSelectedId(null)
    setIsFlyoutOpen(false)
  }

  const statusFilterOptions: Array<HudChipOption<StatusFilter>> = useMemo(() => [
    { value: 'all', label: `Todas (${individuals.length})` },
    { value: 'active', label: `Activas (${individuals.filter(i => i.status === 'active').length})` },
    { value: 'harvested', label: `Cosechadas (${individuals.filter(i => i.status === 'harvested').length})` },
    { value: 'dead_discarded', label: `Bajas (${individuals.filter(i => i.status === 'dead' || i.status === 'discarded').length})` },
  ], [individuals])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return individuals.filter(ind => {
      if (statusFilter === 'active' && ind.status !== 'active') return false
      if (statusFilter === 'harvested' && ind.status !== 'harvested') return false
      if (statusFilter === 'dead_discarded' && ind.status !== 'dead' && ind.status !== 'discarded') return false

      if (!q) return true
      const acc = accessions.find(a => a.id === ind.accessionId)
      const taxon = acc ? taxons.find(t => t.id === acc.taxonId) : undefined
      return (
        ind.label?.toLowerCase().includes(q) ||
        acc?.accessionNumber.toLowerCase().includes(q) ||
        taxon?.genus.toLowerCase().includes(q) ||
        taxon?.species.toLowerCase().includes(q) ||
        taxon?.commonName?.toLowerCase().includes(q) ||
        ind.generation?.toLowerCase().includes(q) ||
        ind.location?.toLowerCase().includes(q)
      )
    })
  }, [individuals, accessions, taxons, search, statusFilter])

  const selectedIndividual = individuals.find(i => i.id === selectedId)
  const selectedAccession = selectedIndividual ? accessions.find(a => a.id === selectedIndividual.accessionId) : undefined
  const selectedTaxon = selectedAccession ? taxons.find(t => t.id === selectedAccession.taxonId) : undefined

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Top Navigation Tabs */}
      <ActiveCropTabs active="individuals" />

      {/* Main HUD Body */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        {/* Header Toolbar */}
        <header className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 z-30 shadow-xs">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            {/* Search Input */}
            <div className="relative w-64 sm:w-72">
              <label htmlFor="plant-search" className="sr-only">Buscar plantas</label>
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                id="plant-search"
                type="text"
                placeholder="Buscar planta (#01), variedad..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl pl-9 pr-8 py-2 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Status Filter ChipRow */}
            <HudChipRow
              options={statusFilterOptions}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedId(null)
                setIsFlyoutOpen(true)
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-emerald-600/25 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>+ Nueva Planta</span>
            </button>
          </div>
        </header>

        {/* Content area: grid + flyout */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* Main Visual Plant & Field Grid */}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto min-w-0">
            {individuals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100 shadow-xs">
                  <Sprout size={32} />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  No hay individuos registrados
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  Registra el primero usando el formulario. Crea 1 o varias plantas numeradas (#01, #02...) a partir de una accesión.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null)
                    setIsFlyoutOpen(true)
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center gap-2"
                >
                  <Plus size={14} />
                  <span>Sembrar Primera Planta</span>
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8">
                <Search size={32} className="text-slate-300 mb-3" />
                <h3 className="text-sm font-semibold text-slate-700 mb-1">
                  Sin resultados para "{search}"
                </h3>
                <p className="text-xs text-slate-400">
                  Intenta con otro término o limpia los filtros de búsqueda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 pb-12">
                {filtered.map((ind, idx) => {
                  const acc = accessions.find(a => a.id === ind.accessionId)
                  const taxon = acc ? taxons.find(t => t.id === acc.taxonId) : undefined
                  const statusCfg = STATUS_CONFIG[ind.status] || STATUS_CONFIG.active
                  const bbchInfo = getBBCHInfo(ind.currentBBCH)
                  const isSelected = ind.id === selectedId
                  const displayName = getIndividualDisplayName(ind, acc?.accessionNumber, idx)

                  return (
                    <motion.button
                      key={ind.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(ind.id)
                        setIsFlyoutOpen(true)
                      }}
                      className={`group relative flex flex-col justify-between text-left rounded-2xl border p-3.5 transition-all duration-150 cursor-pointer w-full ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500/30'
                          : 'border-slate-200/80 bg-white/85 hover:bg-white hover:border-slate-300 shadow-xs hover:shadow-md backdrop-blur-md'
                      }`}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {/* Card Header: BBCH stage & Vital Status badge */}
                      <div className="flex items-center justify-between gap-2 mb-2.5 w-full">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow-xs"
                            style={{ backgroundColor: bbchInfo?.color ?? '#94a3b8' }}
                          />
                          <span className="text-[11px] font-semibold text-slate-700 truncate font-mono">
                            BBCH {ind.currentBBCH ?? 0}
                            {bbchInfo?.label && <span className="text-slate-400 font-sans font-normal ml-1">· {bbchInfo.label}</span>}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${statusCfg.badgeClass}`}
                        >
                          {statusCfg.label}
                        </span>
                      </div>

                      {/* Card Body: Plant name, accession, species */}
                      <div className="mb-3 w-full">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition font-mono truncate">
                          {ind.label ? displayName : (acc?.accessionNumber ?? 'N/A')}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 italic">
                          {taxon ? `${taxon.genus} ${taxon.species}` : 'Especie desconocida'}
                          {taxon?.commonName && <span className="not-italic text-slate-400"> ({taxon.commonName})</span>}
                        </p>
                        {acc?.accessionNumber && ind.label && (
                          <span className="inline-block mt-1 font-mono text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200/70 rounded-md px-1.5 py-0.2">
                            {acc.accessionNumber}
                          </span>
                        )}
                      </div>

                      {/* BBCH mini progress bar */}
                      {ind.currentBBCH !== undefined && (
                        <div className="mt-auto mb-2.5 w-full">
                          <div className="flex items-center justify-between text-[10px] mb-1 font-mono">
                            <span className="text-slate-400">Desarrollo</span>
                            <span className="font-semibold text-slate-600">{ind.currentBBCH}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(100, Math.max(0, ind.currentBBCH))}%`,
                                backgroundColor: bbchInfo?.color ?? '#10b981'
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Card Footer: Location and Planting Date */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 gap-1 w-full">
                        <div className="flex items-center gap-1 truncate text-slate-600">
                          <MapPin size={11} className="text-slate-400 shrink-0" />
                          <span className="truncate">{ind.location || 'Sin ubicar'}</span>
                        </div>
                        {ind.plantingDate && (
                          <div className="flex items-center gap-1 shrink-0 text-slate-400">
                            <Calendar size={11} />
                            <span>
                              {new Date(ind.plantingDate).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            )}
          </main>

          {/* Right-Side Lateral HudFlyout */}
          <AnimatePresence>
            {isFlyoutOpen && (
              <motion.aside
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full sm:w-[440px] md:w-[480px] p-3 flex flex-col shrink-0 border-l border-slate-200/80 bg-slate-50/90 backdrop-blur-md z-20 h-full overflow-hidden"
              >
                {selectedIndividual ? (
                  <HudFlyout
                    icon={<Leaf size={16} />}
                    title={getIndividualDisplayName(selectedIndividual, selectedAccession?.accessionNumber)}
                    subtitle={selectedTaxon ? `${selectedTaxon.genus} ${selectedTaxon.species}${selectedTaxon.commonName ? ` · ${selectedTaxon.commonName}` : ''}` : 'Planta en cultivo'}
                    closeAriaLabel="Cerrar detalle de planta"
                    onClose={() => {
                      setSelectedId(null)
                      setIsFlyoutOpen(false)
                    }}
                    className="w-full !max-h-full h-full"
                  >
                    <IndividualDetail
                      key={selectedIndividual.id}
                      individual={selectedIndividual}
                      onDelete={handleDelete}
                      compact
                    />
                  </HudFlyout>
                ) : (
                  <HudFlyout
                    icon={<Sprout size={16} />}
                    title="Sembrar Planta(s)"
                    subtitle="Alta de individuos en cultivo"
                    closeAriaLabel="Cerrar formulario de siembra"
                    onClose={() => setIsFlyoutOpen(false)}
                    className="w-full !max-h-full h-full"
                  >
                    <form onSubmit={handleAdd} className="flex flex-col gap-3 py-1">
                      {/* Accesión & Cantidad */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2">
                          <label htmlFor="individual-accession" className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Variedad (Accesión) *
                          </label>
                          <select
                            id="individual-accession"
                            aria-label="Accesión Origen"
                            className="w-full bg-slate-50 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                            value={accessionId}
                            onChange={e => {
                              setAccessionId(e.target.value)
                              setSeedLotId('')
                            }}
                            required
                          >
                            <option value="" disabled>Seleccionar accesión...</option>
                            {accessions.map(acc => {
                              const taxon = taxons.find(t => t.id === acc.taxonId)
                              return (
                                <option key={acc.id} value={acc.id}>
                                  {acc.accessionNumber}{taxon ? ` - ${taxon.genus} ${taxon.species}` : ''}
                                </option>
                              )
                            })}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="individual-plant-count" className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Cantidad
                          </label>
                          <input
                            id="individual-plant-count"
                            aria-label="Cantidad de Plantas a Sembrar"
                            type="number"
                            min="1"
                            max="100"
                            className="w-full bg-slate-50 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                            value={plantCount}
                            onChange={e => setPlantCount(e.target.value)}
                          />
                        </div>
                      </div>

                      {accessions.length === 0 && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200/80 rounded-xl p-2.5">
                          No hay accesiones registradas aún. Registra primero una accesión en el banco de semillas.
                        </p>
                      )}

                      {/* Lote de Semillas (opcional) */}
                      {accessionId && availableSeedLots.length > 0 && (
                        <div>
                          <label htmlFor="individual-seedlot" className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Lote de Semillas (descuenta semillas)
                          </label>
                          <select
                            id="individual-seedlot"
                            aria-label="Lote de Semillas"
                            className="w-full bg-slate-50 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                            value={seedLotId}
                            onChange={e => setSeedLotId(e.target.value)}
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

                      {/* Instalación & Posición */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label htmlFor="individual-location" className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Instalación
                          </label>
                          <select
                            id="individual-location"
                            aria-label="Ubicación"
                            className="w-full bg-slate-50 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                            value={locationId}
                            onChange={e => setLocationId(e.target.value)}
                          >
                            <option value="">Sin asignar</option>
                            {locations.map(loc => (
                              <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="individual-position" className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Posición
                          </label>
                          <input
                            id="individual-position"
                            aria-label="Posición"
                            type="text"
                            placeholder="Maceta 14..."
                            className="w-full bg-slate-50 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                            value={locationNote}
                            onChange={e => setLocationNote(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Fecha de siembra & BBCH */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label htmlFor="individual-planting-date" className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Fecha de siembra
                          </label>
                          <input
                            id="individual-planting-date"
                            type="date"
                            className="w-full bg-slate-50 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                            value={plantingDate}
                            onChange={e => setPlantingDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <label htmlFor="individual-bbch" className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Estadio BBCH (0-99)
                          </label>
                          <input
                            id="individual-bbch"
                            aria-label="Estadio BBCH"
                            type="number"
                            min="0"
                            max="99"
                            placeholder="14"
                            className="w-full bg-slate-50 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                            value={bbch}
                            onChange={e => setBbch(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Estado & Generación */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label htmlFor="individual-status" className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Estado
                          </label>
                          <select
                            id="individual-status"
                            className="w-full bg-slate-50 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                            value={status}
                            onChange={e => setStatus(e.target.value as IndividualStatus)}
                          >
                            {(Object.entries(STATUS_CONFIG) as [IndividualStatus, typeof STATUS_CONFIG[IndividualStatus]][]).map(([key, cfg]) => (
                              <option key={key} value={key}>{cfg.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="individual-generation" className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Generación
                          </label>
                          <input
                            id="individual-generation"
                            type="text"
                            placeholder="F1, F2, BC1..."
                            className="w-full bg-slate-50 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                            value={generation}
                            onChange={e => setGeneration(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Notas */}
                      <div>
                        <label htmlFor="individual-notes" className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Notas
                        </label>
                        <textarea
                          id="individual-notes"
                          rows={2}
                          placeholder="Observaciones generales..."
                          className="w-full bg-slate-50 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition resize-none"
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!accessionId}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition cursor-pointer mt-1"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>Registrar individuo</span>
                      </button>
                    </form>
                  </HudFlyout>
                )}
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
