import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate, useInRouterContext } from 'react-router-dom'
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
import { ActiveCropTabs } from '@/components/ActiveCropTabs'
import {
  Sprout, Plus, Search, Trash2, Info, MapPin, GitBranch,
  Tag, Calendar, Activity, ChevronRight, Users, Leaf,
  Package, FlaskConical, CheckCircle2, Sparkles, History
} from 'lucide-react'

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

const STATUS_CONFIG: Record<IndividualStatus, { label: string; color: string; bg: string; text: string }> = {
  active:    { label: 'Activo',     color: '#2d6a4f', bg: '#d8f3dc', text: '#1b4332' },
  harvested: { label: 'Cosechado', color: '#1e6091', bg: '#dbeafe', text: '#1e3a5f' },
  dead:      { label: 'Muerto',    color: '#c0392b', bg: '#fee2e2', text: '#7f1d1d' },
  discarded: { label: 'Descartado',color: '#7c7b78', bg: '#f2f1ef', text: '#4a4946' },
}

const CROSS_TYPE_LABELS: Record<CrossType, string> = {
  open_pollinated: 'Polinizacion abierta',
  self: 'Autopolinizacion',
  controlled: 'Controlada',
  unknown: 'Desconocido',
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '8px 12px',
  fontSize: 13,
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'border-color 0.15s ease',
  fontFamily: 'var(--font-sans)',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: 11.5,
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: 5,
  letterSpacing: '0.01em',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: IndividualStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 99,
        fontSize: 11.5,
        fontWeight: 500,
        background: cfg.bg,
        color: cfg.text,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: cfg.color,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  )
}

function BBCHBar({ stage }: { stage?: number }) {
  const info = getBBCHInfo(stage)
  if (stage === undefined || !info) return (
    <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Sin datos</span>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          background: 'var(--surface-muted)',
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <motion.div
          style={{
            height: '100%',
            borderRadius: 99,
            background: info.color,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${stage}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          flexShrink: 0,
          minWidth: 52,
        }}
      >
        {stage} · {info.label}
      </span>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 3, fontFamily: 'var(--font-mono)' }}>
        {label.toUpperCase()}
      </dt>
      <dd style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 450 }}>
        {children}
      </dd>
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--surface-subtle)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 22px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function CardHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <Icon size={13} strokeWidth={2} color="var(--text-tertiary)" />
      {label}
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
        style={INPUT_STYLE}
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
        style={INPUT_STYLE}
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
    <div style={{ position: 'relative' }}>
      <input
        id={inputId}
        aria-label={trait.name}
        type={trait.type === 'numeric' ? 'number' : 'text'}
        min={trait.min}
        max={trait.max}
        step={trait.type === 'numeric' ? 'any' : undefined}
        style={{ ...INPUT_STYLE, paddingRight: trait.unit ? 44 : 12 }}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={trait.type === 'numeric' ? '0.00' : ''}
      />
      {trait.unit && (
        <span
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-tertiary)',
            fontWeight: 500,
            pointerEvents: 'none',
          }}
        >
          {trait.unit}
        </span>
      )}
    </div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

const QUICK_BBCH_MILESTONES = [
  { stage: 0,  label: '0 · Germinación' },
  { stage: 14, label: '14 · Hoja' },
  { stage: 30, label: '30 · Elongación' },
  { stage: 55, label: '55 · Inflorescencia' },
  { stage: 65, label: '65 · Floración' },
  { stage: 75, label: '75 · Fruto' },
  { stage: 89, label: '89 · Maduración' },
]

export function IndividualDetail({
  individual,
  onDelete,
  compact = false,
}: {
  individual: Individual
  onDelete: () => void
  compact?: boolean
}) {
  const inRouter = useInRouterContext()
  const routerNavigate = inRouter ? useNavigate() : null
  const navigate = (to: string) => {
    if (routerNavigate) routerNavigate(to)
  }
  const { accessions } = useAccessionStore()
  const { locations } = useLocationStore()
  const { taxons } = useTaxonStore()
  const { individuals, update: updateIndividual } = useIndividualStore()
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

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [bbchDraft, setBbchDraft] = useState<string>(
    individual.currentBBCH !== undefined ? String(individual.currentBBCH) : ''
  )
  const [showHarvestPanel, setShowHarvestPanel] = useState(false)
  const [harvestLotCode, setHarvestLotCode] = useState('')
  const [harvestCount, setHarvestCount] = useState('100')
  const [harvestStorage, setHarvestStorage] = useState('')
  const [harvestGermRate, setHarvestGermRate] = useState('')
  const [harvestSuccessMsg, setHarvestSuccessMsg] = useState<string | null>(null)

  // Inline phenotyping state
  const [traitForm, setTraitForm] = useState<Record<string, any>>({})
  const [phenoSuccessMsg, setPhenoSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    setBbchDraft(individual.currentBBCH !== undefined ? String(individual.currentBBCH) : '')
    setConfirmDelete(false)
    setShowHarvestPanel(false)
    setHarvestSuccessMsg(null)
    setTraitForm({})
    setPhenoSuccessMsg(null)
  }, [individual.id, individual.currentBBCH])

  const handleOpenHarvestPanel = () => {
    const existingCount = seedLots.filter(l => l.accessionId === individual.accessionId).length + 1
    const defaultCode = `${accession?.accessionNumber ?? 'LOT'}-L${existingCount}`
    setHarvestLotCode(defaultCode)
    setHarvestCount('100')
    setHarvestStorage('')
    setHarvestGermRate('')
    setShowHarvestPanel(true)
  }

  const handleSaveBBCH = (newStage: number) => {
    if (Number.isNaN(newStage) || newStage < 0 || newStage > 99) return
    updateIndividual(individual.id, { currentBBCH: newStage })
    setBbchDraft(String(newStage))
  }

  const handleHarvestSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!harvestLotCode.trim()) return

    const createdLot = addSeedLot({
      accessionId: individual.accessionId,
      lotCode: harvestLotCode.trim(),
      harvestIndividualId: individual.id,
      harvestDate: new Date().toISOString().slice(0, 10),
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

  const displayName = getIndividualDisplayName(individual, accession?.accessionNumber)

  return (
    <div style={{ padding: compact ? '20px 18px' : '32px 40px', maxWidth: 820, overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <header style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: 27,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {displayName}
              </h1>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-tertiary)',
                }}
              >
                ({accession?.accessionNumber ?? 'Sin accesion'})
              </span>
              <StatusBadge status={individual.status} />
              <select
                aria-label="Cambiar estado"
                value={individual.status}
                onChange={e => updateIndividual(individual.id, { status: e.target.value as IndividualStatus })}
                style={{
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-elevated)',
                  fontSize: 11.5,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {(Object.entries(STATUS_CONFIG) as [IndividualStatus, typeof STATUS_CONFIG[IndividualStatus]][]).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
              {individual.generation && (
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {individual.generation}
                </span>
              )}
            </div>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
              }}
            >
              {taxon ? `${taxon.genus} ${taxon.species}` : 'Especie desconocida'}
              {taxon?.commonName && (
                <span style={{ fontStyle: 'normal', color: 'var(--text-tertiary)', marginLeft: 6 }}>
                  · {taxon.commonName}
                </span>
              )}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleOpenHarvestPanel}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 13px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #c4b5fd',
                background: '#ede9fe',
                color: '#5b21b6',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              className="btn-press"
            >
              <Package size={13} strokeWidth={2} />
              Cosechar Semillas
            </button>

            {confirmDelete ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 'var(--radius-md)', background: '#fff1f2', border: '1px solid #fca5a5' }}>
                <span style={{ fontSize: 11.5, color: '#991b1b', fontWeight: 500 }}>¿Eliminar?</span>
                <button
                  type="button"
                  onClick={onDelete}
                  style={{
                    padding: '4px 9px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: '#dc2626',
                    color: 'white',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Sí, eliminar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'white',
                    color: 'var(--text-secondary)',
                    fontSize: 11.5,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #fca5a5',
                  background: '#fff1f2',
                  color: '#991b1b',
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                className="btn-press"
              >
                <Trash2 size={13} strokeWidth={2} />
                Eliminar
              </button>
            )}
          </div>
        </div>

        {/* Tags */}
        {individual.tags && individual.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 12 }}>
            {individual.tags.map(tag => (
              <span
                key={tag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  background: 'var(--surface-muted)',
                  color: 'var(--text-secondary)',
                  fontSize: 11.5,
                  borderRadius: 99,
                  border: '1px solid var(--border)',
                }}
              >
                <Tag size={10} strokeWidth={2} />
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Harvest success feedback */}
      {harvestSuccessMsg && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: '#d8f3dc',
            border: '1px solid #b7e4c7',
            color: '#1b4332',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={15} color="#2d6a4f" />
          <span>{harvestSuccessMsg}</span>
        </div>
      )}

      {/* Harvest SeedLot Panel */}
      {showHarvestPanel && (
        <Card style={{ marginBottom: 16, background: '#faf5ff', borderColor: '#d8b4fe' }}>
          <CardHeader icon={Package} label="Cosechar Semillas hacia Banco de Germoplasma" />
          <form onSubmit={handleHarvestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label htmlFor="harvest-lot-code" style={LABEL_STYLE}>Código del Nuevo Lote *</label>
                <input
                  id="harvest-lot-code"
                  aria-label="Código del Nuevo Lote"
                  type="text"
                  style={{ ...INPUT_STYLE, fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
                  value={harvestLotCode}
                  onChange={e => setHarvestLotCode(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="harvest-seed-count" style={LABEL_STYLE}>Cantidad de Semillas Cosechadas</label>
                <input
                  id="harvest-seed-count"
                  aria-label="Cantidad de Semillas Cosechadas"
                  type="number"
                  min={1}
                  style={INPUT_STYLE}
                  value={harvestCount}
                  onChange={e => setHarvestCount(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label htmlFor="harvest-storage" style={LABEL_STYLE}>Posición en Banco / Heladera</label>
                <input
                  id="harvest-storage"
                  type="text"
                  style={INPUT_STYLE}
                  placeholder="Ej. Cámara Fría 1 · Sobre A4"
                  value={harvestStorage}
                  onChange={e => setHarvestStorage(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="harvest-germ" style={LABEL_STYLE}>Germinación Estimada (%)</label>
                <input
                  id="harvest-germ"
                  type="number"
                  min={0}
                  max={100}
                  style={INPUT_STYLE}
                  placeholder="Ej. 92"
                  value={harvestGermRate}
                  onChange={e => setHarvestGermRate(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setShowHarvestPanel(false)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'white',
                  color: 'var(--text-secondary)',
                  fontSize: 12.5,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: '#7b2d8b',
                  color: 'white',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <CheckCircle2 size={13} />
                Confirmar Cosecha
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* BBCH Interactive Card */}
      <Card style={{ marginBottom: 16 }}>
        <CardHeader icon={Activity} label="Estadio fenologico BBCH" />
        <BBCHBar stage={individual.currentBBCH} />

        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {QUICK_BBCH_MILESTONES.map(m => {
              const isCurrent = individual.currentBBCH === m.stage
              return (
                <button
                  key={m.stage}
                  type="button"
                  onClick={() => handleSaveBBCH(m.stage)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 99,
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    border: isCurrent ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: isCurrent ? 'var(--accent-light)' : 'var(--surface-elevated)',
                    color: isCurrent ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: isCurrent ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {m.label}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              aria-label="Actualizar BBCH"
              type="number"
              min={0}
              max={99}
              placeholder="0-99"
              value={bbchDraft}
              onChange={e => setBbchDraft(e.target.value)}
              style={{
                ...INPUT_STYLE,
                width: 68,
                padding: '4px 8px',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (bbchDraft.trim() !== '') handleSaveBBCH(Number(bbchDraft))
              }}
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Guardar BBCH
            </button>
          </div>
        </div>
      </Card>

      {/* ── Integrated Phenotyping & Logbook Card ── */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FlaskConical size={14} color="var(--accent)" />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Evaluación Fenotípica y Bitácora In-Situ
            </span>
          </div>
          {effectiveCropCode && (
            <span
              style={{
                fontSize: 10.5,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 99,
                background: 'var(--accent-light)',
                color: 'var(--accent)',
              }}
            >
              {traits.length} rasgos ({effectiveCropCode})
            </span>
          )}
        </div>

        {phenoSuccessMsg && (
          <div
            style={{
              marginBottom: 14,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: '#d8f3dc',
              border: '1px solid #b7e4c7',
              color: '#1b4332',
              fontSize: 12.5,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 size={14} color="#2d6a4f" />
            <span>{phenoSuccessMsg}</span>
          </div>
        )}

        {traits.length > 0 ? (
          <form onSubmit={handlePhenotypeSubmit} style={{ marginBottom: plantObservations.length > 0 ? 18 : 0 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                gap: 12,
                marginBottom: 14,
              }}
            >
              {traits.map(trait => (
                <div key={trait.id}>
                  <label htmlFor={`inline-trait-${trait.id}`} style={LABEL_STYLE}>
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
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 15px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'var(--accent)',
                color: 'white',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <CheckCircle2 size={13} />
              Guardar Medición Fenotípica
            </button>
          </form>
        ) : (
          <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>
            Esta especie no tiene descriptores fenotípicos configurados en la ontología.
          </p>
        )}

        {/* Logbook of observations recorded on this plant */}
        {plantObservations.length > 0 && (
          <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <History size={12} color="var(--text-tertiary)" />
              <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                Bitácora de Mediciones ({plantObservations.length})
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 8 }}>
              {[...plantObservations].reverse().map(obs => {
                const trait = traits.find(t => t.id === obs.traitId)
                return (
                  <div
                    key={obs.id}
                    style={{
                      padding: '8px 11px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {trait?.name ?? obs.traitId}
                      </p>
                      <p style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                        {obs.bbchAtObservation !== undefined ? `BBCH ${obs.bbchAtObservation}` : 'Medición'}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--accent-light)',
                        color: 'var(--accent)',
                      }}
                    >
                      {formatObsValue(obs, trait)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Info grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 12,
        }}
      >
        {/* Trazabilidad */}
        <Card>
          <CardHeader icon={Info} label="Trazabilidad" />
          <dl style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <InfoRow label="Variedad (Accesion)">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                {accession?.accessionNumber ?? 'N/A'}
              </span>
            </InfoRow>
            {originSeedLot && (
              <InfoRow label="Lote de semilla (origen)">
                <button
                  type="button"
                  onClick={() => navigate(`/seedlots?selectedId=${originSeedLot.id}`)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#ede9fe',
                    color: '#5b21b6',
                    border: '1px solid #c4b5fd',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Package size={11} />
                  {originSeedLot.lotCode}
                </button>
              </InfoRow>
            )}
            {individual.plantingDate && (
              <InfoRow label="Siembra">
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar size={12} color="var(--text-tertiary)" />
                  {new Date(individual.plantingDate).toLocaleDateString('es-AR', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </span>
              </InfoRow>
            )}
            {individual.generation && (
              <InfoRow label="Generacion">{individual.generation}</InfoRow>
            )}
            {harvestedSeedLots.length > 0 && (
              <InfoRow label="Lotes cosechados de esta planta">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                  {harvestedSeedLots.map(lot => (
                    <button
                      key={lot.id}
                      type="button"
                      onClick={() => navigate(`/seedlots?selectedId=${lot.id}`)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: '#d8f3dc',
                        color: '#1b4332',
                        border: '1px solid #b7e4c7',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Sparkles size={10} />
                      {lot.lotCode}
                      {lot.currentCount !== undefined ? ` (${lot.currentCount} u.)` : ''}
                    </button>
                  ))}
                </div>
              </InfoRow>
            )}
          </dl>
        </Card>

        {/* Ubicacion */}
        <Card>
          <CardHeader icon={MapPin} label="Espacio Físico" />
          <dl style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {location ? (
              <InfoRow label="Instalacion">{location.name}</InfoRow>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Sin ubicacion asignada</p>
            )}
            {individual.location && (
              <InfoRow label="Posicion">{individual.location}</InfoRow>
            )}
            {individual.position && (
              <InfoRow label="Pos. experimental">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{individual.position}</span>
              </InfoRow>
            )}
          </dl>
        </Card>
      </div>

      {/* Pedigree */}
      {(mother || father || individual.crossType) && (
        <Card style={{ marginBottom: 12 }}>
          <CardHeader icon={GitBranch} label="Pedigri" />
          <dl style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {individual.crossType && (
              <InfoRow label="Tipo de cruce">{CROSS_TYPE_LABELS[individual.crossType]}</InfoRow>
            )}
            {mother && (
              <InfoRow label="Planta madre (sf)">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                  {accessions.find(a => a.id === mother.accessionId)?.accessionNumber ?? mother.id}
                </span>
              </InfoRow>
            )}
            {father && (
              <InfoRow label="Planta padre (sm)">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                  {accessions.find(a => a.id === father.accessionId)?.accessionNumber ?? father.id}
                </span>
              </InfoRow>
            )}
          </dl>
        </Card>
      )}

      {/* Notes */}
      {individual.notes && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            fontSize: 13.5,
            color: '#78350f',
            marginBottom: 12,
          }}
        >
          {individual.notes}
        </div>
      )}

      {/* ID */}
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 20 }}>
        id: {individual.id}
      </p>
    </div>
  )
}

// ─── Form Input wrapper ───────────────────────────────────────────────────────

function FieldGroup({ label, children, htmlFor }: { label: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} style={LABEL_STYLE}>{label}</label>
      {children}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function IndividualsPage() {
  const { individuals, add, remove } = useIndividualStore()
  const { accessions } = useAccessionStore()
  const { locations } = useLocationStore()
  const { taxons } = useTaxonStore()
  const { seedLots, consumeSeeds } = useSeedLotStore()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [searchParams] = useSearchParams()
  const initialAccId = searchParams.get('accessionId')
  const initialSeedLotId = searchParams.get('seedLotId')
  const initialLocationId = searchParams.get('locationId')
  const initialSelectedId = searchParams.get('selectedId')

  // Form state
  const [accessionId, setAccessionId] = useState('')
  const [seedLotId, setSeedLotId] = useState('')
  const [plantCount, setPlantCount] = useState('1')
  const [locationId, setLocationId] = useState('')
  const [locationNote, setLocationNote] = useState('')
  const [plantingDate, setPlantingDate] = useState('')
  const [bbch, setBbch] = useState('')
  const [status, setStatus] = useState<IndividualStatus>('active')
  const [generation, setGeneration] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (initialAccId) {
      setAccessionId(initialAccId)
    }
    if (initialSeedLotId) {
      setSeedLotId(initialSeedLotId)
      const lot = seedLots.find(l => l.id === initialSeedLotId)
      if (lot && !initialAccId) {
        setAccessionId(lot.accessionId)
      }
    }
    if (initialLocationId) {
      setLocationId(initialLocationId)
    }
    if (initialSelectedId) {
      setSelectedId(initialSelectedId)
    }
  }, [initialAccId, initialSeedLotId, initialLocationId, initialSelectedId, seedLots])

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

    if (lastCreatedId) setSelectedId(lastCreatedId)
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

  const getAccession = (id: string) => accessions.find(a => a.id === id)
  const getTaxon = (accId: string) => {
    const acc = getAccession(accId)
    return acc ? taxons.find(t => t.id === acc.taxonId) : undefined
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return individuals
    return individuals.filter(ind => {
      const acc = getAccession(ind.accessionId)
      const taxon = acc ? taxons.find(t => t.id === acc.taxonId) : undefined
      return (
        ind.label?.toLowerCase().includes(q) ||
        acc?.accessionNumber.toLowerCase().includes(q) ||
        taxon?.genus.toLowerCase().includes(q) ||
        taxon?.species.toLowerCase().includes(q) ||
        taxon?.commonName?.toLowerCase().includes(q) ||
        ind.generation?.toLowerCase().includes(q)
      )
    })
  }, [individuals, accessions, taxons, search])

  const selectedIndividual = individuals.find(i => i.id === selectedId)

  const handleDelete = () => {
    if (!selectedIndividual) return
    remove(selectedIndividual.id)
    setSelectedId(null)
  }

  const bbchInfo = bbch !== '' ? getBBCHInfo(Number(bbch)) : null

  const SECTION_HEAD_STYLE: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--surface-base)',
      }}
    >
      <ActiveCropTabs active="individuals" />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Sidebar ── */}
        <aside
          style={{
            width: 360,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--surface-elevated)',
            borderRight: '1px solid var(--border)',
            overflow: 'hidden',
          }}
        >
          {/* Form section */}
          <div
            style={{
              padding: '20px 18px',
              borderBottom: '1px solid var(--border)',
              overflowY: 'auto',
              maxHeight: '60vh',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
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
                <h2
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Sembrar Planta(s)
                </h2>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  Crea 1 o varias plantas numeradas (#01, #02...)
                </p>
              </div>
            </div>

            <form style={{ display: 'flex', flexDirection: 'column', gap: 12 }} onSubmit={handleAdd}>
              {/* Accesion */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 8 }}>
                <FieldGroup label="Variedad (Accesion) *" htmlFor="individual-accession">
                  <select
                    id="individual-accession"
                    aria-label="Accesión Origen"
                    style={INPUT_STYLE}
                    value={accessionId}
                    onChange={e => {
                      setAccessionId(e.target.value)
                      setSeedLotId('')
                    }}
                    required
                  >
                    <option value="" disabled>Seleccionar...</option>
                    {accessions.map(acc => {
                      const taxon = taxons.find(t => t.id === acc.taxonId)
                      return (
                        <option key={acc.id} value={acc.id}>
                          {acc.accessionNumber}{taxon ? ` - ${taxon.genus} ${taxon.species}` : ''}
                        </option>
                      )
                    })}
                  </select>
                </FieldGroup>

                <FieldGroup label="Cantidad" htmlFor="individual-plant-count">
                  <input
                    id="individual-plant-count"
                    aria-label="Cantidad de Plantas a Sembrar"
                    type="number"
                    min="1"
                    max="100"
                    style={INPUT_STYLE}
                    value={plantCount}
                    onChange={e => setPlantCount(e.target.value)}
                  />
                </FieldGroup>
              </div>

              {accessions.length === 0 && (
                <p style={{ fontSize: 11.5, color: '#b45309', marginTop: -4 }}>
                  No hay accesiones registradas aun.
                </p>
              )}

              {/* Lote de Semillas (opcional, filtra por accesión) */}
              {accessionId && availableSeedLots.length > 0 && (
                <FieldGroup label="Lote de Semillas (descuenta semillas)" htmlFor="individual-seedlot">
                  <select
                    id="individual-seedlot"
                    aria-label="Lote de Semillas"
                    style={INPUT_STYLE}
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
                </FieldGroup>
              )}

              {/* Instalacion + posicion */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <FieldGroup label="Instalacion" htmlFor="individual-location">
                  <select id="individual-location" aria-label="Ubicación" style={INPUT_STYLE} value={locationId} onChange={e => setLocationId(e.target.value)}>
                    <option value="">Sin asignar</option>
                    {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                  </select>
                </FieldGroup>
                <FieldGroup label="Posicion" htmlFor="individual-position">
                  <input
                    id="individual-position"
                    aria-label="Posición"
                    style={INPUT_STYLE}
                    type="text"
                    placeholder="Maceta 14..."
                    value={locationNote}
                    onChange={e => setLocationNote(e.target.value)}
                  />
                </FieldGroup>
              </div>

              {/* Fecha + BBCH */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <FieldGroup label="Fecha de siembra" htmlFor="individual-planting-date">
                  <input
                    id="individual-planting-date"
                    style={INPUT_STYLE}
                    type="date"
                    value={plantingDate}
                    onChange={e => setPlantingDate(e.target.value)}
                  />
                </FieldGroup>
                <FieldGroup label="BBCH (0-99)" htmlFor="individual-bbch">
                  <input
                    id="individual-bbch"
                    aria-label="Estadio BBCH"
                    style={INPUT_STYLE}
                    type="number"
                    min="0"
                    max="99"
                    placeholder="14"
                    value={bbch}
                    onChange={e => setBbch(e.target.value)}
                  />
                  {bbchInfo && (
                    <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                      {bbchInfo.label}
                    </p>
                  )}
                </FieldGroup>
              </div>

              {/* Estado + Generacion */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <FieldGroup label="Estado">
                  <select
                    style={INPUT_STYLE}
                    value={status}
                    onChange={e => setStatus(e.target.value as IndividualStatus)}
                  >
                    {(Object.entries(STATUS_CONFIG) as [IndividualStatus, typeof STATUS_CONFIG[IndividualStatus]][]).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </FieldGroup>
                <FieldGroup label="Generacion">
                  <input
                    style={INPUT_STYLE}
                    type="text"
                    placeholder="F1, F2, BC1..."
                    value={generation}
                    onChange={e => setGeneration(e.target.value)}
                  />
                </FieldGroup>
              </div>

              {/* Notas */}
              <FieldGroup label="Notas">
                <textarea
                  style={{ ...INPUT_STYLE, resize: 'none', height: 54 }}
                  placeholder="Observaciones generales..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </FieldGroup>

              <button
                type="submit"
                disabled={!accessionId}
                className="btn-press"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  padding: '9px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: accessionId ? 'var(--accent)' : 'var(--surface-muted)',
                  color: accessionId ? 'white' : 'var(--text-tertiary)',
                  fontSize: 13,
                  fontWeight: 500,
                  border: 'none',
                  cursor: accessionId ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s ease',
                  boxShadow: accessionId ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Plus size={14} strokeWidth={2.5} />
                Registrar individuo
              </button>
            </form>
          </div>

          {/* Search + List */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Search bar */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={13}
                  strokeWidth={2}
                  color="var(--text-tertiary)"
                  style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
                <input
                  type="text"
                  style={{ ...INPUT_STYLE, paddingLeft: 32, fontSize: 12.5 }}
                  placeholder="Buscar planta (#01), variedad..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Count header */}
            <div
              style={{
                padding: '10px 20px 6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={SECTION_HEAD_STYLE}>Plantas (Individuos)</span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  background: 'var(--surface-muted)',
                  padding: '2px 7px',
                  borderRadius: 99,
                }}
              >
                {filtered.length}
              </span>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 12px' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <Users size={32} color="var(--surface-muted)" style={{ margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                    {individuals.length === 0 ? 'Sin individuos registrados.' : 'Sin resultados.'}
                  </p>
                </div>
              ) : (
                filtered.map((ind, idx) => {
                  const acc = getAccession(ind.accessionId)
                  const taxon = getTaxon(ind.accessionId)
                  const cfg = STATUS_CONFIG[ind.status]
                  const bbchInfo = getBBCHInfo(ind.currentBBCH)
                  const isSelected = ind.id === selectedId
                  const displayName = getIndividualDisplayName(ind, acc?.accessionNumber, idx)

                  return (
                    <motion.button
                      key={ind.id}
                      onClick={() => setSelectedId(ind.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '11px 13px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'var(--accent-light)' : 'transparent',
                        border: isSelected ? '1px solid #b7e4c7' : '1px solid transparent',
                        cursor: 'pointer',
                        display: 'block',
                        marginBottom: 3,
                        transition: 'all 0.12s ease',
                      }}
                      whileHover={!isSelected ? { backgroundColor: '#f2f1ef' } : {}}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, minWidth: 0 }}>
                          {/* BBCH dot */}
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: bbchInfo?.color ?? 'var(--surface-muted)',
                              flexShrink: 0,
                              marginTop: 4,
                            }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                                fontFamily: 'var(--font-mono)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {ind.label ? displayName : (acc?.accessionNumber ?? 'N/A')}
                            </p>
                            <p
                              style={{
                                fontSize: 11.5,
                                color: 'var(--text-tertiary)',
                                fontStyle: 'italic',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {taxon ? `${taxon.genus} ${taxon.species}` : 'Especie desconocida'}
                              {ind.location ? ` · ${ind.location}` : ''}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 500,
                              padding: '2px 7px',
                              borderRadius: 99,
                              background: cfg.bg,
                              color: cfg.text,
                            }}
                          >
                            {cfg.label}
                          </span>
                          <ChevronRight
                            size={13}
                            strokeWidth={2}
                            color={isSelected ? 'var(--accent)' : 'var(--text-tertiary)'}
                          />
                        </div>
                      </div>

                      {/* BBCH mini bar */}
                      {ind.currentBBCH !== undefined && (
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div
                            style={{
                              flex: 1,
                              height: 2,
                              background: 'var(--surface-muted)',
                              borderRadius: 99,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${ind.currentBBCH}%`,
                                background: bbchInfo?.color ?? 'var(--text-tertiary)',
                                borderRadius: 99,
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--text-tertiary)',
                            }}
                          >
                            {ind.currentBBCH}
                          </span>
                        </div>
                      )}
                    </motion.button>
                  )
                })
              )}
            </div>
          </div>
        </aside>

        {/* ── Main detail area ── */}
        <main
          style={{
            flex: 1,
            background: 'var(--surface-base)',
            overflow: 'hidden',
          }}
        >
          <AnimatePresence>
            {selectedIndividual ? (
              <motion.div
                key={selectedIndividual.id}
                style={{ height: '100%', overflowY: 'auto' }}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <IndividualDetail
                  individual={selectedIndividual}
                  onDelete={handleDelete}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 10,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Leaf
                  size={52}
                  strokeWidth={1}
                  color="var(--surface-muted)"
                />
                <p style={{ fontSize: 13.5, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  {individuals.length === 0 ? 'No hay individuos registrados' : 'Selecciona un individuo'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {individuals.length === 0
                    ? 'Registra el primero usando el formulario.'
                    : 'para ver su ficha, estadio BBCH y fenotipado aqui.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
