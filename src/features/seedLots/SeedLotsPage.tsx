import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useSeedLotStore } from '@/store/seedLotStore'
import { useAccessionStore } from '@/store/accessionStore'
import { useTaxonStore } from '@/store/taxonStore'
import { useLocationStore } from '@/store/locationStore'
import { useIndividualStore } from '@/store/individualStore'
import type { SeedLot, SeedLotStatus } from '@/domain/seedLot'
import { SeedBankTabs } from '@/components/SeedBankTabs'
import { HudChipRow, HudFlyout, type HudChipOption } from '@/components/hud'
import {
  Package, Plus, Search, Trash2, Thermometer, Droplets,
  Calendar, Sprout, Users, CheckCircle2, X, MapPin,
  Building2, Edit3, ExternalLink
} from 'lucide-react'

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  SeedLotStatus,
  { label: string; badgeClass: string; barClass: string }
> = {
  active: {
    label: 'Activo',
    badgeClass: 'bg-emerald-100/80 text-emerald-800 border-emerald-200/80',
    barClass: 'bg-emerald-600',
  },
  exhausted: {
    label: 'Agotado',
    badgeClass: 'bg-rose-100/80 text-rose-800 border-rose-200/80',
    barClass: 'bg-rose-600',
  },
  discarded: {
    label: 'Descartado',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    barClass: 'bg-slate-500',
  },
}

const STATUS_FILTER_OPTIONS: Array<HudChipOption<string>> = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'exhausted', label: 'Agotados' },
  { value: 'discarded', label: 'Descartados' },
]

// ─── Germination Gauge ────────────────────────────────────────────────────────

function GerminationBar({ rate }: { rate?: number }) {
  if (rate === undefined) {
    return <span className="text-xs text-slate-400 font-mono italic">Sin datos</span>
  }

  const bgBarClass =
    rate >= 70
      ? 'bg-emerald-500'
      : rate >= 40
      ? 'bg-amber-500'
      : 'bg-rose-500'

  const textClass =
    rate >= 70
      ? 'text-emerald-700'
      : rate >= 40
      ? 'text-amber-700'
      : 'text-rose-700'

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${bgBarClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${rate}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className={`text-xs font-mono font-bold shrink-0 ${textClass}`}>
        {rate}%
      </span>
    </div>
  )
}

// ─── Detail Subcomponent ──────────────────────────────────────────────────────

function SeedLotDetail({
  lot,
  onDelete,
}: {
  lot: SeedLot
  onDelete: () => void
}) {
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
  const cfg = STATUS_CONFIG[lot.status] || STATUS_CONFIG.active

  const stockPct =
    lot.initialCount && lot.currentCount !== undefined
      ? Math.round((lot.currentCount / lot.initialCount) * 100)
      : undefined

  const canSow =
    lot.status === 'active' &&
    (lot.currentCount === undefined || lot.currentCount > 0)

  const [editCount, setEditCount] = useState(false)
  const [newCount, setNewCount] = useState(() => String(lot.currentCount ?? ''))
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Viability test inline editor
  const [editViability, setEditViability] = useState(false)
  const [germRateDraft, setGermRateDraft] = useState(() => String(lot.germinationRate ?? ''))
  const [germDateDraft, setGermDateDraft] = useState(
    () => lot.lastGerminationTest ?? new Date().toISOString().slice(0, 10)
  )

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
    <div className="flex flex-col gap-3 py-1">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold font-mono text-slate-900 tracking-tight">
              {lot.lotCode}
            </h2>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 italic mt-0.5">
            {accession ? accession.accessionNumber : 'Sin accesión'}
            {taxon && (
              <span className="not-italic text-slate-400 ml-1">
                · {taxon.genus} {taxon.species}
              </span>
            )}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 flex-wrap justify-end">
          <button
            type="button"
            disabled={!canSow}
            onClick={() => navigate(`/individuals?accessionId=${lot.accessionId}&seedLotId=${lot.id}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-xs transition cursor-pointer shadow-xs"
            title="Sembrar una nueva planta descontando semilla de este lote"
          >
            <Sprout size={13} strokeWidth={2.2} />
            <span>Sembrar desde lote</span>
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[11px] text-rose-800 font-semibold">¿Eliminar?</span>
              <button
                type="button"
                onClick={onDelete}
                className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[11px] font-semibold hover:bg-rose-700 cursor-pointer transition"
              >
                Sí, eliminar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-0.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-[11px] hover:bg-slate-50 cursor-pointer transition"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200/80 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Eliminar</span>
            </button>
          )}
        </div>
      </div>

      {/* Accesión Vinculada */}
      <div className="p-3 rounded-xl bg-white/95 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            Accesión Vinculada
          </span>
          {accession && (
            <button
              type="button"
              onClick={() => navigate(`/accessions?selectedId=${accession.id}`)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              <span>Ver accesión</span>
              <ExternalLink size={11} />
            </button>
          )}
        </div>
        {accession ? (
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-slate-900">
                {accession.accessionNumber}
              </span>
              {accession.cultivarName && (
                <span className="text-xs font-semibold text-slate-600">
                  · {accession.cultivarName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 italic mt-0.5">
              {taxon ? `${taxon.genus} ${taxon.species}` : 'Especie botánica no asignada'}
              {taxon?.commonName && (
                <span className="not-italic text-slate-400 ml-1">
                  · {taxon.commonName}
                </span>
              )}
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Sin accesión asociada</p>
        )}
      </div>

      {/* Stock de Semillas */}
      <div className="p-3 rounded-xl bg-white/95 border border-slate-200/80 shadow-xs">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
          Stock de Semillas
        </span>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Inicial</span>
            <span className="text-xl font-bold font-mono text-slate-900">
              {lot.initialCount?.toLocaleString('es-AR') ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Actual</span>
            {editCount ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  aria-label="Stock actual"
                  className="w-16 bg-white border border-emerald-500 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-slate-900 outline-none"
                  value={newCount}
                  onChange={e => setNewCount(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  aria-label="Guardar stock"
                  onClick={handleSaveCount}
                  className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                >
                  <CheckCircle2 size={13} />
                </button>
                <button
                  type="button"
                  aria-label="Cancelar edición de stock"
                  onClick={() => setEditCount(false)}
                  className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className={`text-xl font-bold font-mono ${lot.currentCount === 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {lot.currentCount?.toLocaleString('es-AR') ?? 'N/A'}
                </span>
                <button
                  type="button"
                  aria-label="Editar stock actual"
                  onClick={() => { setEditCount(true); setNewCount(String(lot.currentCount ?? '')) }}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition"
                >
                  <Edit3 size={11} />
                </button>
              </div>
            )}
          </div>
          {stockPct !== undefined && (
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Restante</span>
              <span className={`text-xl font-bold font-mono ${stockPct > 30 ? 'text-slate-900' : 'text-rose-600'}`}>
                {stockPct}%
              </span>
            </div>
          )}
        </div>
        {stockPct !== undefined && (
          <div className="mt-3">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${stockPct > 50 ? 'bg-emerald-500' : stockPct > 20 ? 'bg-amber-500' : 'bg-rose-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${stockPct}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Pruebas de Viabilidad */}
      <div className="p-3 rounded-xl bg-white/95 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            Pruebas de Viabilidad
          </span>
          <button
            type="button"
            onClick={() => setEditViability(v => !v)}
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
          >
            {editViability ? 'Cancelar' : (lot.germinationRate !== undefined ? 'Actualizar Test' : 'Registrar Test')}
          </button>
        </div>

        {editViability ? (
          <div className="flex flex-col gap-2.5 pt-1">
            <div>
              <label htmlFor="viability-rate-input" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Tasa de Germinación (%)
              </label>
              <input
                id="viability-rate-input"
                aria-label="Tasa de Germinación (%)"
                type="number"
                min={0}
                max={100}
                value={germRateDraft}
                onChange={e => setGermRateDraft(e.target.value)}
                className="w-full bg-slate-100/90 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-1.5 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
              />
            </div>
            <div>
              <label htmlFor="viability-date-input" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Fecha del Ensayo
              </label>
              <input
                id="viability-date-input"
                aria-label="Fecha del Ensayo"
                type="date"
                value={germDateDraft}
                onChange={e => setGermDateDraft(e.target.value)}
                className="w-full bg-slate-100/90 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-1.5 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveViability}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer self-start"
            >
              Guardar Ensayo
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Tasa de Germinación</span>
              <GerminationBar rate={lot.germinationRate} />
            </div>
            {lot.lastGerminationTest && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                <Calendar size={12} className="text-slate-400 shrink-0" />
                <span>Último test: {new Date(lot.lastGerminationTest).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Almacenamiento y Condiciones */}
      <div className="p-3 rounded-xl bg-white/95 border border-slate-200/80 shadow-xs">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
          Almacenamiento y Condiciones
        </span>
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-[10px] font-mono text-slate-400 uppercase">Instalación / Sala</dt>
            <dd className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <Building2 size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">{location ? location.name : 'Sin asignar'}</span>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-mono text-slate-400 uppercase">Posición Física</dt>
            <dd className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <MapPin size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">{lot.storageLocation || 'No especificada'}</span>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-mono text-slate-400 uppercase">Temperatura</dt>
            <dd className="text-slate-800 font-mono flex items-center gap-1 mt-0.5">
              <Thermometer size={12} className="text-slate-400 shrink-0" />
              <span>{lot.storageTemperature !== undefined ? `${lot.storageTemperature} °C` : 'N/A'}</span>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-mono text-slate-400 uppercase">Humedad</dt>
            <dd className="text-slate-800 font-mono flex items-center gap-1 mt-0.5">
              <Droplets size={12} className="text-slate-400 shrink-0" />
              <span>{lot.moistureContent !== undefined ? `${lot.moistureContent}%` : 'N/A'}</span>
            </dd>
          </div>
          {lot.harvestDate && (
            <div className="col-span-2">
              <dt className="text-[10px] font-mono text-slate-400 uppercase">Fecha de Cosecha</dt>
              <dd className="text-slate-800 flex items-center gap-1 mt-0.5">
                <Calendar size={12} className="text-slate-400 shrink-0" />
                <span>{new Date(lot.harvestDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Trazabilidad: Madre y Plantas en campo */}
      {(harvestMother || sownIndividuals.length > 0) && (
        <div className="p-3 rounded-xl bg-white/95 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Trazabilidad de Plantas
          </span>
          {harvestMother && (
            <div className="mb-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                Planta Madre Cosechada
              </span>
              <button
                type="button"
                onClick={() => navigate(`/individuals?selectedId=${harvestMother.id}`)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-mono font-semibold transition cursor-pointer border border-emerald-200"
              >
                <Sprout size={11} className="text-emerald-600" />
                <span>{accession?.accessionNumber ?? 'Planta'} {harvestMother.location ? `(${harvestMother.location})` : ''}</span>
              </button>
            </div>
          )}
          {sownIndividuals.length > 0 && (
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                Plantas Sembradas en Campo ({sownIndividuals.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sownIndividuals.map((ind, idx) => (
                  <button
                    key={ind.id}
                    type="button"
                    onClick={() => navigate(`/individuals?selectedId=${ind.id}`)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-mono transition cursor-pointer border border-slate-200/80"
                  >
                    <Users size={11} className="text-emerald-600" />
                    <span>{ind.label || ind.location || ind.position || `Planta #${idx + 1}`}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ID Footer */}
      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>id: {lot.id}</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SeedLotsPage() {
  const navigate = useNavigate()
  const { seedLots, add, remove } = useSeedLotStore()
  const { accessions } = useAccessionStore()
  const { locations } = useLocationStore()
  const { taxons } = useTaxonStore()

  const [searchParams] = useSearchParams()
  const initialAccId = searchParams.get('accessionId')
  const initialSelectedId = searchParams.get('selectedId')

  const [selectedId, setSelectedId] = useState<string | null>(() => initialSelectedId)
  const [isFormOpen, setIsFormOpen] = useState(() => Boolean(initialAccId))
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Form state
  const [accessionId, setAccessionId] = useState(() => initialAccId || '')
  const [lotCode, setLotCode] = useState(() => {
    if (!initialAccId) return ''
    const acc = accessions.find(a => a.id === initialAccId)
    if (!acc) return ''
    const existing = seedLots.filter(l => l.accessionId === initialAccId).length + 1
    return `${acc.accessionNumber}-L${existing}`
  })
  const [initialCount, setInitialCount] = useState('')
  const [locationId, setLocationId] = useState('')
  const [storageLocation, setStorageLocation] = useState('')
  const [storageTemp, setStorageTemp] = useState('')
  const [moistureContent, setMoistureContent] = useState('')
  const [harvestDate, setHarvestDate] = useState('')

  // Auto-generate lot code when accession changes
  const handleAccessionChange = useCallback((id: string) => {
    setAccessionId(id)
    if (!id) return
    const acc = accessions.find(a => a.id === id)
    if (!acc) return
    const existing = seedLots.filter(l => l.accessionId === id).length + 1
    setLotCode(`${acc.accessionNumber}-L${existing}`)
  }, [accessions, seedLots])

  // Synchronize state if URL query params change dynamically
  /* oxlint-disable react/set-state-in-effect */
  useEffect(() => {
    if (initialAccId) {
      handleAccessionChange(initialAccId)
      setIsFormOpen(true)
      setSelectedId(null)
    } else if (initialSelectedId) {
      setSelectedId(initialSelectedId)
      setIsFormOpen(false)
    }
  }, [initialAccId, initialSelectedId, handleAccessionChange])
  /* oxlint-enable react/set-state-in-effect */

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessionId || !lotCode.trim()) return
    const newLot = add({
      accessionId,
      lotCode: lotCode.trim(),
      initialCount: initialCount ? Number(initialCount) : undefined,
      locationId: locationId || undefined,
      storageLocation: storageLocation.trim() || undefined,
      storageTemperature: storageTemp ? Number(storageTemp) : undefined,
      moistureContent: moistureContent ? Number(moistureContent) : undefined,
      harvestDate: harvestDate || undefined,
    })
    setSelectedId(newLot.id)
    setIsFormOpen(false)
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
    return seedLots.filter(lot => {
      // 1. Status filter
      if (statusFilter !== 'all' && lot.status !== statusFilter) {
        return false
      }
      // 2. Search query
      const q = search.toLowerCase().trim()
      if (!q) return true
      const acc = accessions.find(a => a.id === lot.accessionId)
      const taxon = acc ? taxons.find(t => t.id === acc.taxonId) : undefined
      return (
        lot.lotCode.toLowerCase().includes(q) ||
        (acc?.accessionNumber && acc.accessionNumber.toLowerCase().includes(q)) ||
        (acc?.cultivarName && acc.cultivarName.toLowerCase().includes(q)) ||
        (taxon?.genus && taxon.genus.toLowerCase().includes(q)) ||
        (taxon?.species && taxon.species.toLowerCase().includes(q)) ||
        (taxon?.commonName && taxon.commonName.toLowerCase().includes(q)) ||
        (lot.storageLocation && lot.storageLocation.toLowerCase().includes(q))
      )
    })
  }, [seedLots, accessions, taxons, search, statusFilter])

  const selectedLot = seedLots.find(l => l.id === selectedId)

  const handleDelete = () => {
    if (!selectedLot) return
    remove(selectedLot.id)
    setSelectedId(null)
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <SeedBankTabs active="seedlots" />

      {/* Top Agile HUD Toolbar */}
      <header className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 z-30 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200/60 shadow-xs">
              <Package size={16} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                Almacén de Lotes de Semillas
              </h1>
              <p className="text-[11px] text-slate-500">
                {seedLots.length === 0
                  ? 'No hay lotes en el almacén'
                  : `${seedLots.length} ${seedLots.length === 1 ? 'lote registrado' : 'lotes registrados'}`}
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-48 sm:w-60">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar por lote o accesión..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl pl-8 pr-7 py-1.5 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
            />
            {search && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Status Filter Chips (Desktop) */}
          <div className="hidden sm:block">
            <HudChipRow
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSelectedId(null)
              setIsFormOpen(true)
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-emerald-600/25 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>+ Nuevo Lote</span>
          </button>
        </div>
      </header>

      {/* Mobile Filter Chips Row */}
      <div className="sm:hidden px-4 py-2 border-b border-slate-200/80 bg-white/70 overflow-x-auto shrink-0">
        <HudChipRow
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* Main Layout: Visual Seed Lot Grid + Lateral HudFlyout */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 transition-all duration-200 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Inventario de Lotes
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-200/80 text-slate-700">
                {filtered.length}
              </span>
            </div>

            {statusFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer"
              >
                Mostrar todos
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            seedLots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 border border-purple-100 shadow-xs">
                  <Package size={28} />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1">
                  No hay lotes de semillas registrados
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  No hay lotes disponibles en este momento. Registra el primer sobre de semillas para gestionar el stock, viabilidad y siembras.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null)
                    setIsFormOpen(true)
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/25 transition cursor-pointer"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>Nuevo Lote</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3 border border-slate-200/80">
                  <Search size={22} />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1">
                  Sin resultados para la búsqueda
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mb-3">
                  No se encontraron lotes que coincidan con los criterios de búsqueda o filtro aplicados.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('all')
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
                >
                  Limpiar filtros
                </button>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filtered.map(lot => {
                const isSelected = selectedId === lot.id && !isFormOpen
                const acc = accessions.find(a => a.id === lot.accessionId)
                const taxon = acc ? taxons.find(t => t.id === acc.taxonId) : undefined
                const cfg = STATUS_CONFIG[lot.status] || STATUS_CONFIG.active
                const stockPct =
                  lot.initialCount && lot.currentCount !== undefined
                    ? Math.round((lot.currentCount / lot.initialCount) * 100)
                    : undefined
                const canSow =
                  lot.status === 'active' &&
                  (lot.currentCount === undefined || lot.currentCount > 0)

                return (
                  <div
                    key={lot.id}
                    onClick={() => {
                      setSelectedId(lot.id)
                      setIsFormOpen(false)
                    }}
                    className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/80 shadow-md ring-2 ring-emerald-500/40'
                        : 'border-slate-200/80 bg-white/85 hover:bg-white hover:border-slate-300 shadow-xs hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Top row: Code + Status Badge */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-mono text-sm font-bold text-slate-900 tracking-tight group-hover:text-emerald-700 transition">
                          {lot.lotCode}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${cfg.badgeClass}`}
                        >
                          {cfg.label}
                        </span>
                      </div>

                      {/* Accession + Cultivar */}
                      <p className="text-xs font-semibold text-slate-700 truncate mb-0.5">
                        {acc?.accessionNumber ?? 'Sin accesión'}
                        {acc?.cultivarName && (
                          <span className="text-slate-500 font-normal ml-1">
                            · {acc.cultivarName}
                          </span>
                        )}
                      </p>

                      {/* Taxon */}
                      <p className="text-xs text-slate-500 italic line-clamp-1">
                        {taxon ? `${taxon.genus} ${taxon.species}` : 'Especie no asignada'}
                        {taxon?.commonName && (
                          <span className="not-italic text-slate-400 ml-1">
                            · {taxon.commonName}
                          </span>
                        )}
                      </p>

                      {/* Storage location if any */}
                      {lot.storageLocation && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2 font-mono">
                          <MapPin size={11} className="text-slate-400 shrink-0" />
                          <span className="truncate">{lot.storageLocation}</span>
                        </div>
                      )}

                      {/* Stock stats */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-mono text-[10px] uppercase font-bold">
                            Stock Semillas
                          </span>
                          <span className="font-mono font-semibold text-slate-800">
                            {lot.currentCount !== undefined
                              ? `${lot.currentCount.toLocaleString('es-AR')}${lot.initialCount ? ` / ${lot.initialCount.toLocaleString('es-AR')}` : ''}`
                              : 'No especificado'}
                          </span>
                        </div>
                        {stockPct !== undefined && (
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${stockPct > 50 ? 'bg-emerald-500' : stockPct > 20 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(100, Math.max(0, stockPct))}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Germination rate if exists */}
                      {lot.germinationRate !== undefined && (
                        <div className="mt-2 flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            Germinación
                          </span>
                          <GerminationBar rate={lot.germinationRate} />
                        </div>
                      )}
                    </div>

                    {/* Footer of Card */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                        {lot.storageTemperature !== undefined ? (
                          <span className="inline-flex items-center gap-1">
                            <Thermometer size={12} className="text-slate-400" />
                            {lot.storageTemperature}°C
                          </span>
                        ) : lot.harvestDate ? (
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" />
                            {new Date(lot.harvestDate).toLocaleDateString('es-AR', { year: 'numeric', month: 'short' })}
                          </span>
                        ) : (
                          <span className="text-slate-400">Sobre registrado</span>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={!canSow}
                        onClick={e => {
                          e.stopPropagation()
                          navigate(`/individuals?accessionId=${lot.accessionId}&seedLotId=${lot.id}`)
                        }}
                        title={canSow ? 'Sembrar planta desde este lote' : 'Lote agotado o no activo'}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[11px] transition cursor-pointer ${
                          canSow
                            ? 'text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 hover:text-emerald-800'
                            : 'text-slate-400 bg-slate-100 cursor-not-allowed'
                        }`}
                      >
                        <Sprout size={12} />
                        <span>Sembrar</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>

        {/* Right-Side Lateral HudFlyout: New Lot Form OR Lot Detail Sheet */}
        <AnimatePresence>
          {(isFormOpen || selectedLot) && (
            <motion.aside
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full sm:w-[420px] md:w-[460px] p-3 flex flex-col shrink-0 border-l border-slate-200/80 bg-slate-50/90 backdrop-blur-md z-20 h-full overflow-hidden"
            >
              {isFormOpen ? (
                <HudFlyout
                  icon={<Package size={16} />}
                  title="Nuevo Lote de Semillas"
                  subtitle="Registro de sobre / almacén"
                  closeAriaLabel="Cerrar formulario de nuevo lote"
                  onClose={() => setIsFormOpen(false)}
                  className="w-full !max-h-full h-full"
                >
                  <form onSubmit={handleAdd} className="flex flex-col gap-3 py-1">
                    {/* Accesión */}
                    <div>
                      <label htmlFor="lot-accession-select" className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Accesión <span className="text-rose-600">*</span>
                      </label>
                      <select
                        id="lot-accession-select"
                        aria-label="Accesión"
                        value={accessionId}
                        onChange={e => handleAccessionChange(e.target.value)}
                        required
                        className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition cursor-pointer"
                      >
                        <option value="" disabled>Seleccionar accesión...</option>
                        {accessions.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.accessionNumber} {acc.cultivarName ? `(${acc.cultivarName})` : ''}
                          </option>
                        ))}
                      </select>
                      {accessions.length === 0 && (
                        <p className="text-[11px] text-amber-600 mt-1">
                          No hay accesiones disponibles. Crea una en la pestaña Variedades primero.
                        </p>
                      )}
                    </div>

                    {/* Código de Lote */}
                    <div>
                      <label htmlFor="lot-code-input" className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Código de Lote <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="lot-code-input"
                        aria-label="Código de Lote"
                        type="text"
                        placeholder="PLT-2026-001-L1"
                        value={lotCode}
                        onChange={e => setLotCode(e.target.value)}
                        required
                        className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs font-mono rounded-xl px-3 py-2 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                      />
                    </div>

                    {/* Cantidad inicial + Fecha de cosecha */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label htmlFor="lot-initial-count" className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Cantidad Inicial
                        </label>
                        <input
                          id="lot-initial-count"
                          aria-label="Cantidad Inicial"
                          type="number"
                          min={0}
                          placeholder="500"
                          value={initialCount}
                          onChange={e => setInitialCount(e.target.value)}
                          className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs font-mono rounded-xl px-3 py-2 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                        />
                      </div>
                      <div>
                        <label htmlFor="lot-harvest-date" className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Fecha de Cosecha
                        </label>
                        <input
                          id="lot-harvest-date"
                          aria-label="Fecha de Cosecha"
                          type="date"
                          value={harvestDate}
                          onChange={e => setHarvestDate(e.target.value)}
                          className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Instalación + Posición */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label htmlFor="lot-location-select" className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Instalación / Sala
                        </label>
                        <select
                          id="lot-location-select"
                          aria-label="Instalación / Sala"
                          value={locationId}
                          onChange={e => setLocationId(e.target.value)}
                          className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition cursor-pointer"
                        >
                          <option value="">Sin asignar</option>
                          {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="lot-storage-location" className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Posición / Cajón
                        </label>
                        <input
                          id="lot-storage-location"
                          aria-label="Posición / Cajón"
                          type="text"
                          placeholder="Heladera A / Cajón 3"
                          value={storageLocation}
                          onChange={e => setStorageLocation(e.target.value)}
                          className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Temperatura + Humedad */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label htmlFor="lot-temp-input" className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Temperatura (°C)
                        </label>
                        <input
                          id="lot-temp-input"
                          aria-label="Temperatura (°C)"
                          type="number"
                          placeholder="-18"
                          value={storageTemp}
                          onChange={e => setStorageTemp(e.target.value)}
                          className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs font-mono rounded-xl px-3 py-2 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                        />
                      </div>
                      <div>
                        <label htmlFor="lot-moisture-input" className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Humedad (%)
                        </label>
                        <input
                          id="lot-moisture-input"
                          aria-label="Humedad (%)"
                          type="number"
                          min={0}
                          max={100}
                          placeholder="6"
                          value={moistureContent}
                          onChange={e => setMoistureContent(e.target.value)}
                          className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs font-mono rounded-xl px-3 py-2 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={!accessionId || !lotCode.trim()}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>Registrar Lote</span>
                      </button>
                    </div>
                  </form>
                </HudFlyout>
              ) : selectedLot ? (
                <HudFlyout
                  icon={<Package size={16} />}
                  title={selectedLot.lotCode}
                  subtitle={
                    accessions.find(a => a.id === selectedLot.accessionId)
                      ? `Accesión: ${accessions.find(a => a.id === selectedLot.accessionId)?.accessionNumber}`
                      : 'Ficha de Lote'
                  }
                  closeAriaLabel="Cerrar ficha de lote"
                  onClose={() => setSelectedId(null)}
                  className="w-full !max-h-full h-full"
                >
                  <SeedLotDetail
                    key={selectedLot.id}
                    lot={selectedLot}
                    onDelete={handleDelete}
                  />
                </HudFlyout>
              ) : null}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
