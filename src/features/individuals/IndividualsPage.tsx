import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useIndividualStore } from '@/store/individualStore'
import { useAccessionStore } from '@/store/accessionStore'
import { useLocationStore } from '@/store/locationStore'
import { useTaxonStore } from '@/store/taxonStore'
import type { Individual, IndividualStatus, CrossType } from '@/domain/individual'
import {
  Sprout, Plus, Search, Trash2, Info, MapPin, GitBranch,
  Tag, Calendar, Activity, ChevronRight, Users, Leaf
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

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function IndividualDetail({ individual, onDelete }: { individual: Individual; onDelete: () => void }) {
  const { accessions } = useAccessionStore()
  const { locations } = useLocationStore()
  const { taxons } = useTaxonStore()
  const { individuals } = useIndividualStore()

  const accession = accessions.find(a => a.id === individual.accessionId)
  const taxon = accession ? taxons.find(t => t.id === accession.taxonId) : undefined
  const location = individual.locationId ? locations.find(l => l.id === individual.locationId) : undefined
  const mother = individual.maternalParentId ? individuals.find(i => i.id === individual.maternalParentId) : undefined
  const father = individual.paternalParentId ? individuals.find(i => i.id === individual.paternalParentId) : undefined

  return (
    <div style={{ padding: '36px 44px', maxWidth: 780, overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <header style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {accession?.accessionNumber ?? 'Sin accesion'}
              </h1>
              <StatusBadge status={individual.status} />
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

          <button
            onClick={onDelete}
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

      {/* BBCH */}
      {individual.currentBBCH !== undefined && (
        <Card style={{ marginBottom: 16 }}>
          <CardHeader icon={Activity} label="Estadio fenologico BBCH" />
          <BBCHBar stage={individual.currentBBCH} />
        </Card>
      )}

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
            <InfoRow label="Accesion">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                {accession?.accessionNumber ?? 'N/A'}
              </span>
            </InfoRow>
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
          </dl>
        </Card>

        {/* Ubicacion */}
        <Card>
          <CardHeader icon={MapPin} label="Ubicacion" />
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

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
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

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Form state
  const [accessionId, setAccessionId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [locationNote, setLocationNote] = useState('')
  const [plantingDate, setPlantingDate] = useState('')
  const [bbch, setBbch] = useState('')
  const [status, setStatus] = useState<IndividualStatus>('active')
  const [generation, setGeneration] = useState('')
  const [notes, setNotes] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessionId) return
    const newInd = add({
      accessionId,
      locationId: locationId || undefined,
      location: locationNote || undefined,
      plantingDate: plantingDate || undefined,
      currentBBCH: bbch !== '' ? Number(bbch) : undefined,
      status,
      generation: generation || undefined,
      notes: notes || undefined,
    })
    setSelectedId(newInd.id)
    setAccessionId('')
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
    if (confirm('Eliminar este individuo? Esta accion no se puede deshacer.')) {
      remove(selectedIndividual.id)
      setSelectedId(null)
    }
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
        height: '100%',
        background: 'var(--surface-base)',
      }}
    >
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
            padding: '24px 20px',
            borderBottom: '1px solid var(--border)',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
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
            <h2
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Nuevo Individuo
            </h2>
          </div>

          <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={handleAdd}>
            {/* Accesion */}
            <FieldGroup label="Accesion *">
              <select
                style={INPUT_STYLE}
                value={accessionId}
                onChange={e => setAccessionId(e.target.value)}
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
              {accessions.length === 0 && (
                <p style={{ fontSize: 11.5, color: '#b45309', marginTop: 4 }}>
                  No hay accesiones registradas aun.
                </p>
              )}
            </FieldGroup>

            {/* Instalacion + posicion */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FieldGroup label="Instalacion">
                <select style={INPUT_STYLE} value={locationId} onChange={e => setLocationId(e.target.value)}>
                  <option value="">Sin asignar</option>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="Posicion">
                <input
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
              <FieldGroup label="Fecha de siembra">
                <input
                  style={INPUT_STYLE}
                  type="date"
                  value={plantingDate}
                  onChange={e => setPlantingDate(e.target.value)}
                />
              </FieldGroup>
              <FieldGroup label="BBCH (0-99)">
                <input
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
                style={{ ...INPUT_STYLE, resize: 'none', height: 72 }}
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
                placeholder="Buscar por accesion, especie..."
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
            <span style={SECTION_HEAD_STYLE}>Individuos</span>
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
              filtered.map(ind => {
                const acc = getAccession(ind.accessionId)
                const taxon = getTaxon(ind.accessionId)
                const cfg = STATUS_CONFIG[ind.status]
                const bbchInfo = getBBCHInfo(ind.currentBBCH)
                const isSelected = ind.id === selectedId

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
                    whileHover={!isSelected ? { backgroundColor: 'var(--surface-subtle)' } : {}}
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
                            {acc?.accessionNumber ?? 'N/A'}
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
                            {ind.generation ? ` · ${ind.generation}` : ''}
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
        <AnimatePresence mode="wait">
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
                  : 'para ver sus detalles aqui.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
