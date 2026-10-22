import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useSeedLotStore } from '@/store/seedLotStore'
import { useAccessionStore } from '@/store/accessionStore'
import { useTaxonStore } from '@/store/taxonStore'
import { useLocationStore } from '@/store/locationStore'
import { useIndividualStore } from '@/store/individualStore'
import type { SeedLot, SeedLotStatus } from '@/domain/seedLot'
import { SeedBankTabs } from '@/components/SeedBankTabs'
import {
  Package, Plus, Search, Trash2, Thermometer, Droplets,
  ChevronRight, Calendar, Activity, AlertTriangle, CheckCircle2,
  Sprout, Users
} from 'lucide-react'

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SeedLotStatus, { label: string; color: string; bg: string; text: string }> = {
  active:    { label: 'Activo',     color: '#2d6a4f', bg: '#d8f3dc', text: '#1b4332' },
  exhausted: { label: 'Agotado',   color: '#c0392b', bg: '#fee2e2', text: '#7f1d1d' },
  discarded: { label: 'Descartado',color: '#7c7b78', bg: '#f2f1ef', text: '#4a4946' },
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
  fontFamily: 'var(--font-sans)',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: 11.5,
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: 5,
}

const MONO_LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: 'var(--text-tertiary)',
  fontFamily: 'var(--font-mono)',
}

const CARD: React.CSSProperties = {
  background: 'var(--surface-subtle)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '18px 20px',
}

// ─── Germination gauge ────────────────────────────────────────────────────────

function GerminationBar({ rate }: { rate?: number }) {
  if (rate === undefined) return <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Sin datos</span>
  const color = rate >= 70 ? '#2d6a4f' : rate >= 40 ? '#e76f51' : '#c0392b'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: 'var(--surface-muted)', borderRadius: 99, overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', background: color, borderRadius: 99 }}
          initial={{ width: 0 }}
          animate={{ width: `${rate}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color }}>
        {rate}%
      </span>
    </div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function SeedLotDetail({ lot, onDelete }: { lot: SeedLot; onDelete: () => void }) {
  const navigate = useNavigate()
  const { accessions } = useAccessionStore()
  const { taxons } = useTaxonStore()
  const { locations } = useLocationStore()
  const { individuals } = useIndividualStore()
  const { update } = useSeedLotStore()

  const accession = accessions.find(a => a.id === lot.accessionId)
  const taxon = accession ? taxons.find(t => t.id === accession.taxonId) : undefined
  const location = lot.locationId ? locations.find(l => l.id === lot.locationId) : undefined
  const harvestMother = lot.harvestIndividualId
    ? individuals.find(i => i.id === lot.harvestIndividualId)
    : undefined
  const sownIndividuals = individuals.filter(i => i.seedLotId === lot.id)
  const cfg = STATUS_CONFIG[lot.status]

  const stockPct = lot.initialCount && lot.currentCount !== undefined
    ? Math.round((lot.currentCount / lot.initialCount) * 100)
    : undefined

  const canSow = lot.status === 'active' && (lot.currentCount === undefined || lot.currentCount > 0)

  const [editCount, setEditCount] = useState(false)
  const [newCount, setNewCount] = useState(String(lot.currentCount ?? ''))
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Viability test inline editor
  const [editViability, setEditViability] = useState(false)
  const [germRateDraft, setGermRateDraft] = useState(String(lot.germinationRate ?? ''))
  const [germDateDraft, setGermDateDraft] = useState(
    lot.lastGerminationTest ?? new Date().toISOString().slice(0, 10)
  )

  useEffect(() => {
    setEditCount(false)
    setConfirmDelete(false)
    setEditViability(false)
    setNewCount(String(lot.currentCount ?? ''))
    setGermRateDraft(String(lot.germinationRate ?? ''))
    setGermDateDraft(lot.lastGerminationTest ?? new Date().toISOString().slice(0, 10))
  }, [lot.id, lot.currentCount, lot.germinationRate, lot.lastGerminationTest])

  const handleSaveCount = () => {
    const n = parseInt(newCount, 10)
    if (!isNaN(n) && n >= 0) {
      update(lot.id, {
        currentCount: n,
        status: n === 0 ? 'exhausted' : lot.status,
      })
    }
    setEditCount(false)
  }

  const handleSaveViability = () => {
    const rate = parseFloat(germRateDraft)
    if (!isNaN(rate) && rate >= 0 && rate <= 100) {
      update(lot.id, {
        germinationRate: rate,
        lastGerminationTest: germDateDraft || new Date().toISOString().slice(0, 10),
      })
    }
    setEditViability(false)
  }

  return (
    <div style={{ padding: '36px 44px', maxWidth: 780, height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <header style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.025em',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {lot.lotCode}
              </h1>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 500,
                  padding: '3px 9px',
                  borderRadius: 99,
                  background: cfg.bg,
                  color: cfg.text,
                }}
              >
                {cfg.label}
              </span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              {accession?.accessionNumber ?? 'Sin accesion'}
              {taxon && (
                <span style={{ fontStyle: 'normal', color: 'var(--text-tertiary)', marginLeft: 6 }}>
                  · {taxon.genus} {taxon.species}
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={!canSow}
              onClick={() => navigate(`/individuals?accessionId=${lot.accessionId}&seedLotId=${lot.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: canSow ? 'var(--accent)' : 'var(--surface-muted)',
                color: canSow ? 'white' : 'var(--text-tertiary)',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: canSow ? 'pointer' : 'not-allowed',
              }}
              className="btn-press"
              title="Sembrar una nueva planta descontando semilla de este lote"
            >
              <Sprout size={13} strokeWidth={2.2} />
              Sembrar desde lote
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
      </header>

      {/* Stock card */}
      <div
        style={{
          ...CARD,
          marginBottom: 14,
        }}
      >
        <p style={{ ...MONO_LABEL, marginBottom: 16 }}>Stock de semillas</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          <div>
            <p style={{ ...MONO_LABEL, marginBottom: 4 }}>Inicial</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
              {lot.initialCount?.toLocaleString('es-AR') ?? 'N/A'}
            </p>
          </div>
          <div>
            <p style={{ ...MONO_LABEL, marginBottom: 4 }}>Actual</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              {editCount ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="number"
                    min={0}
                    style={{ ...INPUT_STYLE, width: 80, padding: '4px 8px', fontSize: 18, fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                    value={newCount}
                    onChange={e => setNewCount(e.target.value)}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveCount}
                    style={{ padding: '5px 8px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                  >
                    <CheckCircle2 size={14} />
                  </button>
                  <button
                    onClick={() => setEditCount(false)}
                    style={{ padding: '5px 8px', background: 'var(--surface-muted)', color: 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                  >
                    <AlertTriangle size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <p
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: lot.currentCount === 0 ? '#c0392b' : 'var(--accent)',
                      fontFamily: 'var(--font-mono)',
                      lineHeight: 1,
                    }}
                  >
                    {lot.currentCount?.toLocaleString('es-AR') ?? 'N/A'}
                  </p>
                  <button
                    onClick={() => { setEditCount(true); setNewCount(String(lot.currentCount ?? '')) }}
                    style={{
                      padding: '3px 6px',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    <Activity size={11} />
                  </button>
                </>
              )}
            </div>
          </div>
          {stockPct !== undefined && (
            <div>
              <p style={{ ...MONO_LABEL, marginBottom: 4 }}>Stock restante</p>
              <p style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', lineHeight: 1, color: stockPct > 30 ? 'var(--text-primary)' : '#c0392b' }}>
                {stockPct}%
              </p>
            </div>
          )}
        </div>
        {stockPct !== undefined && (
          <div style={{ marginTop: 16 }}>
            <div style={{ height: 6, background: 'var(--surface-muted)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                style={{
                  height: '100%',
                  borderRadius: 99,
                  background: stockPct > 50 ? 'var(--accent)' : stockPct > 20 ? '#e76f51' : '#c0392b',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${stockPct}%` }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        {/* Almacenamiento */}
        <div style={CARD}>
          <p style={{ ...MONO_LABEL, marginBottom: 14 }}>Almacenamiento y Trazabilidad</p>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {location && (
              <div>
                <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>INSTALACION</dt>
                <dd style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{location.name}</dd>
              </div>
            )}
            {lot.storageLocation && (
              <div>
                <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>POSICION</dt>
                <dd style={{ fontSize: 13, color: 'var(--text-primary)' }}>{lot.storageLocation}</dd>
              </div>
            )}
            {lot.storageTemperature !== undefined && (
              <div>
                <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>TEMPERATURA</dt>
                <dd style={{ fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Thermometer size={12} color="var(--text-tertiary)" />
                  {lot.storageTemperature} °C
                </dd>
              </div>
            )}
            {lot.moistureContent !== undefined && (
              <div>
                <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>HUMEDAD</dt>
                <dd style={{ fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Droplets size={12} color="var(--text-tertiary)" />
                  {lot.moistureContent}%
                </dd>
              </div>
            )}
            {harvestMother && (
              <div>
                <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>PLANTA MADRE COSECHADA</dt>
                <dd>
                  <button
                    type="button"
                    onClick={() => navigate(`/individuals?selectedId=${harvestMother.id}`)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                      border: '1px solid #b7e4c7',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Sprout size={11} />
                    {accession?.accessionNumber ?? 'Planta'} {harvestMother.location ? `(${harvestMother.location})` : ''}
                  </button>
                </dd>
              </div>
            )}
            {sownIndividuals.length > 0 && (
              <div>
                <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>
                  PLANTAS SEMBRADAS ({sownIndividuals.length})
                </dt>
                <dd style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {sownIndividuals.map(ind => (
                    <button
                      key={ind.id}
                      type="button"
                      onClick={() => navigate(`/individuals?selectedId=${ind.id}`)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface-elevated)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                      }}
                    >
                      <Users size={10} />
                      {ind.location || ind.position || ind.id.slice(0, 6)}
                    </button>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Viabilidad */}
        <div style={CARD}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ ...MONO_LABEL, marginBottom: 0 }}>Viabilidad</p>
            <button
              type="button"
              onClick={() => setEditViability(v => !v)}
              style={{
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--surface-elevated)',
                color: 'var(--text-secondary)',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {editViability ? 'Cancelar' : 'Registrar Test'}
            </button>
          </div>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {lot.harvestDate && (
              <div>
                <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>COSECHA</dt>
                <dd style={{ fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar size={12} color="var(--text-tertiary)" />
                  {new Date(lot.harvestDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </dd>
              </div>
            )}
            {lot.lastGerminationTest && !editViability && (
              <div>
                <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>ULTIMO TEST</dt>
                <dd style={{ fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar size={12} color="var(--text-tertiary)" />
                  {new Date(lot.lastGerminationTest).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </dd>
              </div>
            )}
            {editViability ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                <div>
                  <label htmlFor="viability-rate-input" style={LABEL_STYLE}>Tasa de Germinación (%)</label>
                  <input
                    id="viability-rate-input"
                    aria-label="Tasa de Germinación (%)"
                    type="number"
                    min={0}
                    max={100}
                    style={INPUT_STYLE}
                    value={germRateDraft}
                    onChange={e => setGermRateDraft(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="viability-date-input" style={LABEL_STYLE}>Fecha del Ensayo</label>
                  <input
                    id="viability-date-input"
                    type="date"
                    style={INPUT_STYLE}
                    value={germDateDraft}
                    onChange={e => setGermDateDraft(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveViability}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'var(--accent)',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Guardar Ensayo
                </button>
              </div>
            ) : (
              <div>
                <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>TASA DE GERMINACION</dt>
                <GerminationBar rate={lot.germinationRate} />
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* ID */}
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 20 }}>
        id: {lot.id}
      </p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SeedLotsPage() {
  const { seedLots, add, remove } = useSeedLotStore()
  const { accessions } = useAccessionStore()
  const { locations } = useLocationStore()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Form state
  const [accessionId, setAccessionId] = useState('')
  const [lotCode, setLotCode] = useState('')
  const [initialCount, setInitialCount] = useState('')
  const [locationId, setLocationId] = useState('')
  const [storageLocation, setStorageLocation] = useState('')
  const [storageTemp, setStorageTemp] = useState('')
  const [moistureContent, setMoistureContent] = useState('')
  const [harvestDate, setHarvestDate] = useState('')

  const [searchParams] = useSearchParams()
  const initialAccId = searchParams.get('accessionId')
  const initialSelectedId = searchParams.get('selectedId')

  // Auto-generate lot code when accession changes
  const handleAccessionChange = (id: string) => {
    setAccessionId(id)
    if (!id) return
    const acc = accessions.find(a => a.id === id)
    if (!acc) return
    const existing = seedLots.filter(l => l.accessionId === id).length + 1
    setLotCode(`${acc.accessionNumber}-L${existing}`)
  }

  useEffect(() => {
    if (initialAccId) {
      handleAccessionChange(initialAccId)
    }
    if (initialSelectedId) {
      setSelectedId(initialSelectedId)
    }
  }, [initialAccId, initialSelectedId, accessions])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessionId || !lotCode.trim()) return
    const newLot = add({
      accessionId,
      lotCode: lotCode.trim(),
      initialCount: initialCount ? Number(initialCount) : undefined,
      locationId: locationId || undefined,
      storageLocation: storageLocation || undefined,
      storageTemperature: storageTemp ? Number(storageTemp) : undefined,
      moistureContent: moistureContent ? Number(moistureContent) : undefined,
      harvestDate: harvestDate || undefined,
    })
    setSelectedId(newLot.id)
    setAccessionId('')
    setLotCode('')
    setInitialCount('')
    setLocationId('')
    setStorageLocation('')
    setStorageTemp('')
    setMoistureContent('')
    setHarvestDate('')
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return seedLots
    return seedLots.filter(lot => {
      const acc = accessions.find(a => a.id === lot.accessionId)
      return (
        lot.lotCode.toLowerCase().includes(q) ||
        acc?.accessionNumber.toLowerCase().includes(q)
      )
    })
  }, [seedLots, accessions, search])

  const selectedLot = seedLots.find(l => l.id === selectedId)

  const handleDelete = () => {
    if (!selectedLot) return
    remove(selectedLot.id)
    setSelectedId(null)
  }

  const SECTION_MONO: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface-base)' }}>
      <SeedBankTabs active="seedlots" />
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
        {/* Form */}
        <div style={{ padding: '20px 18px', borderBottom: '1px solid var(--border)', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 'var(--radius-md)',
                background: '#ede9fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={14} color="#7b2d8b" strokeWidth={2} />
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Nuevo Lote de Semillas
            </h2>
          </div>

          <form style={{ display: 'flex', flexDirection: 'column', gap: 12 }} onSubmit={handleAdd}>
            <div>
              <label style={LABEL_STYLE}>Accesion *</label>
              <select
                style={INPUT_STYLE}
                value={accessionId}
                onChange={e => handleAccessionChange(e.target.value)}
                required
              >
                <option value="" disabled>Seleccionar accesion...</option>
                {accessions.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.accessionNumber}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={LABEL_STYLE}>Codigo de Lote *</label>
              <input
                type="text"
                style={{ ...INPUT_STYLE, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                placeholder="PLT-2026-001-L1"
                value={lotCode}
                onChange={e => setLotCode(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={LABEL_STYLE}>Cantidad inicial</label>
                <input
                  type="number"
                  min={0}
                  style={INPUT_STYLE}
                  placeholder="500"
                  value={initialCount}
                  onChange={e => setInitialCount(e.target.value)}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Fecha de cosecha</label>
                <input
                  type="date"
                  style={INPUT_STYLE}
                  value={harvestDate}
                  onChange={e => setHarvestDate(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={LABEL_STYLE}>Instalacion</label>
                <select style={INPUT_STYLE} value={locationId} onChange={e => setLocationId(e.target.value)}>
                  <option value="">Sin asignar</option>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL_STYLE}>Posicion</label>
                <input
                  type="text"
                  style={INPUT_STYLE}
                  placeholder="Heladera A / Cajon 3"
                  value={storageLocation}
                  onChange={e => setStorageLocation(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={LABEL_STYLE}>Temperatura (°C)</label>
                <input
                  type="number"
                  style={INPUT_STYLE}
                  placeholder="-18"
                  value={storageTemp}
                  onChange={e => setStorageTemp(e.target.value)}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Humedad (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  style={INPUT_STYLE}
                  placeholder="6"
                  value={moistureContent}
                  onChange={e => setMoistureContent(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!accessionId || !lotCode.trim()}
              className="btn-press"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: '9px 16px',
                borderRadius: 'var(--radius-md)',
                background: (accessionId && lotCode.trim()) ? '#7b2d8b' : 'var(--surface-muted)',
                color: (accessionId && lotCode.trim()) ? 'white' : 'var(--text-tertiary)',
                fontSize: 13,
                fontWeight: 500,
                border: 'none',
                cursor: (accessionId && lotCode.trim()) ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
              }}
            >
              <Plus size={14} strokeWidth={2.5} />
              Registrar lote
            </button>
          </form>
        </div>

        {/* Search + List */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={13}
                strokeWidth={2}
                color="var(--text-tertiary)"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="text"
                style={{ ...INPUT_STYLE, paddingLeft: 30, fontSize: 12.5 }}
                placeholder="Buscar por codigo o accesion..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div style={{ padding: '10px 14px 6px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={SECTION_MONO}>Lotes</span>
            <span
              style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                background: 'var(--surface-muted)',
                padding: '1px 7px',
                borderRadius: 99,
              }}
            >
              {filtered.length}
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 12px' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Package size={30} color="var(--surface-muted)" style={{ margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                  {seedLots.length === 0 ? 'No hay lotes registrados' : 'Sin resultados.'}
                </p>
              </div>
            ) : (
              filtered.map(lot => {
                const acc = accessions.find(a => a.id === lot.accessionId)
                const cfg = STATUS_CONFIG[lot.status]
                const isSelected = lot.id === selectedId
                const stockPct = lot.initialCount && lot.currentCount !== undefined
                  ? Math.round((lot.currentCount / lot.initialCount) * 100)
                  : undefined

                return (
                  <motion.button
                    key={lot.id}
                    onClick={() => setSelectedId(lot.id)}
                    whileTap={{ scale: 0.99 }}
                    whileHover={!isSelected ? { backgroundColor: '#f2f1ef' } : {}}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? '#ede9fe' : 'transparent',
                      border: isSelected ? '1px solid #c4b5fd' : '1px solid transparent',
                      cursor: 'pointer',
                      display: 'block',
                      marginBottom: 2,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p
                          style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: isSelected ? '#7b2d8b' : 'var(--text-primary)',
                            fontFamily: 'var(--font-mono)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {lot.lotCode}
                        </p>
                        <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {acc?.accessionNumber ?? 'N/A'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, marginLeft: 8 }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            padding: '2px 6px',
                            borderRadius: 99,
                            background: cfg.bg,
                            color: cfg.text,
                            fontWeight: 500,
                          }}
                        >
                          {cfg.label}
                        </span>
                        <ChevronRight size={12} strokeWidth={2} color={isSelected ? '#7b2d8b' : 'var(--text-tertiary)'} />
                      </div>
                    </div>

                    {/* Stock mini bar */}
                    {stockPct !== undefined && (
                      <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ flex: 1, height: 2, background: 'var(--surface-muted)', borderRadius: 99, overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${stockPct}%`,
                              background: stockPct > 30 ? '#7b2d8b' : '#c0392b',
                              borderRadius: 99,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                          {lot.currentCount?.toLocaleString('es-AR')} u.
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
      <main style={{ flex: 1, background: 'var(--surface-base)', overflow: 'hidden' }}>
        <AnimatePresence>
          {selectedLot ? (
            <motion.div
              key={selectedLot.id}
              style={{ height: '100%', overflowY: 'auto' }}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <SeedLotDetail lot={selectedLot} onDelete={handleDelete} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Package size={52} strokeWidth={1} color="var(--surface-muted)" />
              <p style={{ fontSize: 13.5, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                {seedLots.length === 0 ? 'No hay lotes de semillas' : 'Selecciona un lote'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                {seedLots.length === 0 ? 'Registra el primero usando el formulario.' : 'para ver sus detalles aqui.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      </div>
    </div>
  )
}
