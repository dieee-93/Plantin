import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAccessionStore } from '@/store/accessionStore'
import { useTaxonStore } from '@/store/taxonStore'
import { useIndividualStore } from '@/store/individualStore'
import { useObservationStore } from '@/store/observationStore'
import { useSeedLotStore } from '@/store/seedLotStore'
import { useCrossingStore } from '@/store/crossingStore'
import { getTraitsForCrop, getEffectiveCropCode } from '@/domain/ontology/index'
import type { CrossEventType } from '@/domain/crossingEvent'
import { HudChipRow, HudFlyout, type HudChipOption } from '@/components/hud'
import {
  Dna, GitMerge, ArrowDown, CheckCircle2,
  Sparkles, Package, FlaskConical, Search, Plus, X,
  Calendar, Layers, ChevronRight, Sprout
} from 'lucide-react'

const CROSS_LABELS: Record<string, { label: string; badgeClass: string }> = {
  controlled: {
    label: 'Controlada (Manual)',
    badgeClass: 'bg-pink-50 text-pink-700 border-pink-200/80',
  },
  open_pollinated: {
    label: 'Polinización Abierta',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
  },
  self: {
    label: 'Autofecundación (Self)',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
  },
}

const CROSS_FILTER_OPTIONS: HudChipOption<string>[] = [
  { value: 'all', label: 'Todas' },
  { value: 'controlled', label: 'Controlada (Manual)' },
  { value: 'open_pollinated', label: 'Polinización Abierta' },
  { value: 'self', label: 'Autofecundación (Self)' },
]

function ParentPhenotypeHint({ accessionId }: { accessionId: string }) {
  const { accessions } = useAccessionStore()
  const { taxons } = useTaxonStore()
  const { individuals } = useIndividualStore()
  const { observations } = useObservationStore()

  if (!accessionId) return null
  const acc = accessions.find(a => a.id === accessionId)
  if (!acc) return null
  const taxon = taxons.find(t => t.id === acc.taxonId)
  const cropCode = taxon ? getEffectiveCropCode(taxon) : ''
  const traits = cropCode ? getTraitsForCrop(cropCode) : []

  const accIndividuals = individuals.filter(i => i.accessionId === accessionId)
  const floweringCount = accIndividuals.filter(i => i.currentBBCH !== undefined && i.currentBBCH >= 50 && i.currentBBCH <= 69).length
  const accObs = observations.filter(o => accIndividuals.some(i => i.id === o.individualId))

  if (accIndividuals.length === 0 && accObs.length === 0) return null

  return (
    <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
      <div className="flex justify-between items-center">
        <span>
          {accIndividuals.length} planta{accIndividuals.length === 1 ? '' : 's'} en cultivo
          {floweringCount > 0 ? ` (${floweringCount} en floración)` : ''}
        </span>
        {accObs.length > 0 && (
          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
            <FlaskConical size={11} />
            {accObs.length} obs.
          </span>
        )}
      </div>
      {accObs.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {accObs.slice(-3).map(o => {
            const tr = traits.find(t => t.id === o.traitId)
            return (
              <span
                key={o.id}
                className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700"
              >
                {tr?.name ?? o.traitId}: {String(o.value)}{tr?.unit ? ` ${tr.unit}` : ''}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Cross type classification helper
function getCrossType(
  acc: { accessionNumber: string; remarks?: string; pedigree?: string },
  crossings: { crossName: string; crossType: CrossEventType }[]
): 'controlled' | 'open_pollinated' | 'self' {
  const crossing = crossings.find(c => c.crossName === `CROSS-${acc.accessionNumber}`)
  if (crossing) {
    if (crossing.crossType === 'self') return 'self'
    if (crossing.crossType === 'open') return 'open_pollinated'
    if (crossing.crossType === 'biparental') return 'controlled'
  }
  const lowerRemarks = (acc.remarks || '').toLowerCase()
  const lowerPedigree = (acc.pedigree || '').toLowerCase()
  if (lowerRemarks.includes('autofecundación') || lowerRemarks.includes('self') || lowerPedigree.includes('self')) {
    return 'self'
  }
  if (lowerRemarks.includes('abierta') || lowerRemarks.includes('open') || lowerPedigree.includes('open')) {
    return 'open_pollinated'
  }
  return 'controlled'
}

export function BreedingPage() {
  const navigate = useNavigate()
  const { accessions, add: addAccession } = useAccessionStore()
  const { taxons } = useTaxonStore()
  const { seedLots, add: addSeedLot } = useSeedLotStore()
  const { crossings, add: addCrossing } = useCrossingStore()

  // Selection & UI state
  const [selectedAccessionId, setSelectedAccessionId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [crossFilter, setCrossFilter] = useState('all')

  // New Cross form state
  const [maternalId, setMaternalId] = useState('')
  const [paternalId, setPaternalId] = useState('')
  const [newAccessionNumber, setNewAccessionNumber] = useState('')
  const [crossType, setCrossType] = useState('controlled')
  const [harvestedSeedCount, setHarvestedSeedCount] = useState('')
  const [remarks, setRemarks] = useState('')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleMaternalChange = (id: string) => {
    setMaternalId(id)
    if (!id) return
    const maternalAcc = accessions.find(a => a.id === id)
    if (!maternalAcc) return
    const taxon = taxons.find(t => t.id === maternalAcc.taxonId)
    const code = taxon?.cropCode || 'HYB'
    const year = new Date().getFullYear()
    const count = accessions.filter(a => a.acquisitionSource === 'breeding').length + 1
    if (!newAccessionNumber.trim()) {
      setNewAccessionNumber(`F1-${code}-${year}-${String(count).padStart(3, '0')}`)
    }
  }

  const handleCross = (e: React.FormEvent) => {
    e.preventDefault()
    if (!maternalId || !newAccessionNumber.trim()) return

    const maternalAcc = accessions.find(a => a.id === maternalId)
    const paternalAcc = accessions.find(a => a.id === paternalId)

    const pedigreeStr = paternalAcc
      ? `${maternalAcc?.accessionNumber} × ${paternalAcc.accessionNumber}`
      : `${maternalAcc?.accessionNumber} (${crossType === 'self' ? 'Self' : 'Open'})`

    const crossInfo = CROSS_LABELS[crossType]?.label ?? crossType
    const createdCode = newAccessionNumber.trim()

    // 1. Promover nueva Accesión F1 / S1 con genealogía bloqueada
    const createdAcc = addAccession({
      accessionNumber: createdCode,
      taxonId: maternalAcc?.taxonId || '',
      acquisitionSource: 'breeding',
      pedigree: pedigreeStr,
      maternalAccessionId: maternalId,
      paternalAccessionId: paternalId || undefined,
      acquisitionDate: new Date().toISOString().slice(0, 10),
      remarks: remarks.trim() ? `${crossInfo}. ${remarks.trim()}` : `Cruzamiento: ${crossInfo}.`,
    })

    // 2. Si se cosecharon semillas F1, crear automáticamente el Lote de Semillas F1 en inventario
    const parsedSeeds = harvestedSeedCount.trim() ? Number(harvestedSeedCount) : 0
    let createdLotId: string | undefined = undefined
    if (parsedSeeds > 0 && !Number.isNaN(parsedSeeds)) {
      const lot = addSeedLot({
        accessionId: createdAcc.id,
        lotCode: `${createdCode}-L1`,
        initialCount: parsedSeeds,
        harvestDate: new Date().toISOString().slice(0, 10),
      })
      createdLotId = lot.id
    }

    // 3. Registrar el CrossingEvent trazable en crossingStore
    const mappedCrossEventType: CrossEventType =
      crossType === 'self' || !paternalId
        ? (crossType === 'open_pollinated' ? 'open' : 'self')
        : 'biparental'

    addCrossing({
      crossName: `CROSS-${createdCode}`,
      maternalParentId: maternalId,
      paternalParentId: mappedCrossEventType === 'self' ? maternalId : (paternalId || maternalId),
      crossType: mappedCrossEventType,
      crossDate: new Date().toISOString().slice(0, 10),
      plannedOffspringCount: parsedSeeds > 0 ? parsedSeeds : undefined,
      resultingSeedLotId: createdLotId,
      successStatus: createdLotId ? 'successful' : 'pending',
      notes: remarks.trim() || undefined,
    })

    setMaternalId('')
    setPaternalId('')
    setNewAccessionNumber('')
    setHarvestedSeedCount('')
    setRemarks('')
    setSuccessMsg(
      createdLotId
        ? `Cruza promovida: línea ${createdCode} y lote ${createdCode}-L1 (${parsedSeeds} sem.) listos en el banco.`
        : `Cruza registrada: nueva línea genética ${createdCode} incorporada al banco.`
    )
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  // All breeding hybrid lines
  const breedingAccessions = useMemo(
    () => accessions.filter(a => a.acquisitionSource === 'breeding'),
    [accessions]
  )

  // Filtered hybrid lines by search & crossType chip
  const filteredAccessions = useMemo(() => {
    return breedingAccessions.filter(acc => {
      // Filter by cross type
      if (crossFilter !== 'all') {
        const type = getCrossType(acc, crossings)
        if (type !== crossFilter) return false
      }

      // Filter by search query
      const q = searchQuery.trim().toLowerCase()
      if (q) {
        const taxon = taxons.find(t => t.id === acc.taxonId)
        const mother = acc.maternalAccessionId ? accessions.find(a => a.id === acc.maternalAccessionId) : null
        const father = acc.paternalAccessionId ? accessions.find(a => a.id === acc.paternalAccessionId) : null
        const matchCode = acc.accessionNumber.toLowerCase().includes(q)
        const matchPedigree = (acc.pedigree || '').toLowerCase().includes(q)
        const matchRemarks = (acc.remarks || '').toLowerCase().includes(q)
        const matchCultivar = (acc.cultivarName || '').toLowerCase().includes(q)
        const matchTaxon = taxon ? `${taxon.genus} ${taxon.species} ${taxon.commonName || ''}`.toLowerCase().includes(q) : false
        const matchMother = mother ? mother.accessionNumber.toLowerCase().includes(q) : false
        const matchFather = father ? father.accessionNumber.toLowerCase().includes(q) : false

        if (!matchCode && !matchPedigree && !matchRemarks && !matchCultivar && !matchTaxon && !matchMother && !matchFather) {
          return false
        }
      }

      return true
    })
  }, [breedingAccessions, crossFilter, searchQuery, taxons, accessions, crossings])

  const selectedAccession = selectedAccessionId ? accessions.find(a => a.id === selectedAccessionId) : undefined
  const selectedTaxon = selectedAccession ? taxons.find(t => t.id === selectedAccession.taxonId) : undefined
  const selectedMother = selectedAccession?.maternalAccessionId ? accessions.find(a => a.id === selectedAccession.maternalAccessionId) : undefined
  const selectedFather = selectedAccession?.paternalAccessionId ? accessions.find(a => a.id === selectedAccession.paternalAccessionId) : undefined
  const selectedF1Lots = selectedAccession ? seedLots.filter(l => l.accessionId === selectedAccession.id) : []
  const selectedCrossing = selectedAccession
    ? crossings.find(c => c.crossName === `CROSS-${selectedAccession.accessionNumber}`) ||
      crossings.find(c => c.resultingSeedLotId && selectedF1Lots.some(l => l.id === c.resultingSeedLotId))
    : undefined

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* ── Top Agile HUD Toolbar ── */}
      <header className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 z-30 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-700 flex items-center justify-center shrink-0 border border-pink-200/60 shadow-xs">
              <GitMerge size={16} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                Laboratorio de Cruzas e Hibridación
              </h1>
              <p className="text-[11px] text-slate-500">
                Líneas F1/S1, genealogía y lotes ({crossings.length} cruzas)
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-52 sm:w-64">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar cruza, variedad, pedigrí..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl pl-8 pr-7 py-1.5 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Cross Type Filter Chips */}
          <HudChipRow
            options={CROSS_FILTER_OPTIONS}
            value={crossFilter}
            onChange={setCrossFilter}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-white/90 border border-slate-200/80 text-slate-600 hidden md:inline-block">
            {breedingAccessions.length} {breedingAccessions.length === 1 ? 'línea' : 'líneas'}
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedAccessionId(null)
              setIsFormOpen(true)
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-emerald-600/25 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>+ Nuevo Cruzamiento</span>
          </button>
        </div>
      </header>

      {/* ── Main Layout: Visual Hybrid Grid + Lateral HudFlyout ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Visual Hybrid Lines Grid */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 transition-all duration-200 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Líneas Genéticas F1 / S1
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-200/80 text-slate-700">
                {filteredAccessions.length}
              </span>
            </div>
            {crossFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setCrossFilter('all')}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer"
              >
                Mostrar todas
              </button>
            )}
          </div>

          {filteredAccessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center mb-3 border border-fuchsia-100 shadow-xs">
                <Dna size={28} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                {breedingAccessions.length === 0 ? 'Sin Hibridaciones Registradas' : 'Sin resultados para la búsqueda'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                {breedingAccessions.length === 0
                  ? 'Utiliza el panel lateral para registrar tu primera cruza controlada, autofecundación o polinización abierta entre variedades del banco.'
                  : 'Prueba buscando con otro término o limpiando los filtros de cruza.'}
              </p>
              {breedingAccessions.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAccessionId(null)
                    setIsFormOpen(true)
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/25 transition cursor-pointer"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>+ Registrar Primera Cruza</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredAccessions.map((acc, i) => {
                const taxon = taxons.find(t => t.id === acc.taxonId)
                const mother = acc.maternalAccessionId ? accessions.find(a => a.id === acc.maternalAccessionId) : undefined
                const father = acc.paternalAccessionId ? accessions.find(a => a.id === acc.paternalAccessionId) : undefined
                const f1Lots = seedLots.filter(l => l.accessionId === acc.id)
                const isSelected = selectedAccessionId === acc.id

                return (
                  <motion.div
                    key={acc.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => {
                      setSelectedAccessionId(acc.id)
                      setIsFormOpen(false)
                    }}
                    className={`bg-white/85 backdrop-blur-md rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/40'
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Top Header Badge & Date */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-800 text-[10px] font-mono font-bold">
                          <Sparkles size={10} className="text-fuchsia-600" />
                          F1 / BREED
                        </span>
                        {acc.acquisitionDate && (
                          <span className="text-[10.5px] font-mono text-slate-500 flex items-center gap-1">
                            <Calendar size={11} className="text-slate-400" />
                            {acc.acquisitionDate}
                          </span>
                        )}
                      </div>

                      {/* Accession Code & Taxon */}
                      <h3 className="font-mono text-base font-bold text-slate-900 group-hover:text-emerald-700 transition truncate">
                        {acc.accessionNumber}
                      </h3>
                      <p className="text-xs text-slate-500 italic mb-3 truncate">
                        {taxon ? `${taxon.genus} ${taxon.species}` : 'Taxón Desconocido'}
                        {taxon?.commonName && <span className="not-italic text-slate-400 ml-1">· {taxon.commonName}</span>}
                      </p>

                      {/* Pedigree Box */}
                      <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200/70 mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-800 mb-1.5 truncate">
                          <GitMerge size={12} className="text-pink-700 shrink-0" />
                          <span className="truncate">{acc.pedigree || 'Genealogía no especificada'}</span>
                        </div>

                        {(mother || father) && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {mother && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-pink-50 border border-pink-200/70 text-pink-900 font-mono text-[10px]">
                                ♀ {mother.accessionNumber}
                              </span>
                            )}
                            {father && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-50 border border-sky-200/70 text-sky-900 font-mono text-[10px]">
                                ♂ {father.accessionNumber}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* F1 Seed Lots */}
                      {f1Lots.length > 0 && (
                        <div className="mb-3">
                          <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Stock de Semillas F1
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {f1Lots.map(lot => (
                              <span
                                key={lot.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[11px] font-semibold"
                              >
                                <Package size={11} />
                                {lot.lotCode}
                                {lot.currentCount !== undefined ? ` (${lot.currentCount} sem.)` : ` (${lot.initialCount} sem.)`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {acc.remarks && (
                        <p className="text-[11.5px] text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                          {acc.remarks}
                        </p>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs mt-1">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          const firstLot = f1Lots[0]
                          navigate(
                            firstLot
                              ? `/individuals?accessionId=${acc.id}&seedLotId=${firstLot.id}`
                              : `/individuals?accessionId=${acc.id}`
                          )
                        }}
                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                      >
                        <Sprout size={13} />
                        <span>Sembrar F1</span>
                        <ChevronRight size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          navigate('/accessions')
                        }}
                        className="text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        Ver en Banco
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </main>

        {/* ── Lateral HudFlyout: New Cross Form OR Detailed Pedigree ── */}
        <AnimatePresence>
          {(isFormOpen || selectedAccession) && (
            <motion.aside
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full sm:w-[420px] md:w-[460px] p-3 flex flex-col shrink-0 border-l border-slate-200/80 bg-slate-50/90 backdrop-blur-md z-20 h-full overflow-hidden"
            >
              {isFormOpen ? (
                /* ── Mode 1: New Cross Form ── */
                <HudFlyout
                  icon={<GitMerge size={16} />}
                  title="Nuevo Cruzamiento"
                  subtitle="Paso 4 · Selección parental, promoción F1 y lote"
                  closeAriaLabel="Cerrar formulario de cruzamiento"
                  onClose={() => setIsFormOpen(false)}
                  className="w-full !max-h-full h-full"
                >
                  <form onSubmit={handleCross} className="flex flex-col gap-3 py-1">
                    <AnimatePresence>
                      {successMsg && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2"
                        >
                          <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                          <span>{successMsg}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Parental Materno (♀) */}
                    <div className="p-3 rounded-xl bg-white/95 border border-slate-200/90 shadow-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-pink-700">
                          ♀ Parental Materno (Receptor) *
                        </span>
                      </div>
                      <select
                        aria-label="Parental Materno"
                        className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl px-2.5 py-2 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                        value={maternalId}
                        onChange={e => handleMaternalChange(e.target.value)}
                        required
                      >
                        <option value="" disabled>Seleccione accesión madre...</option>
                        {accessions.map(a => {
                          const t = taxons.find(tx => tx.id === a.taxonId)
                          return (
                            <option key={a.id} value={a.id}>
                              {a.accessionNumber}{a.cultivarName ? ` (${a.cultivarName})` : ''}{t ? ` · ${t.genus} ${t.species}` : ''}
                            </option>
                          )
                        })}
                      </select>
                      <ParentPhenotypeHint accessionId={maternalId} />
                    </div>

                    {/* Parental Paterno (♂) */}
                    <div className="p-3 rounded-xl bg-white/95 border border-slate-200/90 shadow-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-700">
                          ♂ Parental Paterno (Donante Polen)
                        </span>
                      </div>
                      <select
                        aria-label="Parental Paterno"
                        className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl px-2.5 py-2 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                        value={paternalId}
                        onChange={e => setPaternalId(e.target.value)}
                      >
                        <option value="">(Ninguno / Polinización Abierta / Self)</option>
                        {accessions.filter(a => a.id !== maternalId).map(a => {
                          const t = taxons.find(tx => tx.id === a.taxonId)
                          return (
                            <option key={a.id} value={a.id}>
                              {a.accessionNumber}{a.cultivarName ? ` (${a.cultivarName})` : ''}{t ? ` · ${t.genus} ${t.species}` : ''}
                            </option>
                          )
                        })}
                      </select>
                      <ParentPhenotypeHint accessionId={paternalId} />
                    </div>

                    <div className="flex justify-center text-slate-400 py-0.5">
                      <ArrowDown size={14} />
                    </div>

                    {/* Resulting Line (F1 / S1) & SeedLot */}
                    <div className="p-3 rounded-xl bg-white/95 border border-emerald-200/80 shadow-xs flex flex-col gap-2.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700">
                        Línea Genética Resultante (F1 / S1)
                      </span>

                      <div>
                        <label htmlFor="breeding-acc-number" className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Código de Accesión Resultante *
                        </label>
                        <input
                          id="breeding-acc-number"
                          type="text"
                          className="w-full bg-white text-slate-900 font-mono text-xs rounded-xl px-2.5 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                          placeholder="Ej. F1-TOM-2026-001"
                          value={newAccessionNumber}
                          onChange={e => setNewAccessionNumber(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label htmlFor="breeding-cross-type" className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Método de Polinización
                          </label>
                          <select
                            id="breeding-cross-type"
                            className="w-full bg-white text-slate-900 text-xs rounded-xl px-2.5 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                            value={crossType}
                            onChange={e => setCrossType(e.target.value)}
                          >
                            <option value="controlled">Controlada (Manual)</option>
                            <option value="open_pollinated">Polinización Abierta</option>
                            <option value="self">Autofecundación (Self)</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="breeding-f1-seeds" className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Semillas F1 Cosechadas
                          </label>
                          <input
                            id="breeding-f1-seeds"
                            aria-label="Semillas F1 Cosechadas"
                            type="number"
                            min="0"
                            className="w-full bg-white text-slate-900 font-mono text-xs rounded-xl px-2.5 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                            placeholder="Opcional (crea L1)"
                            value={harvestedSeedCount}
                            onChange={e => setHarvestedSeedCount(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="breeding-remarks" className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Notas de la Polinización
                        </label>
                        <textarea
                          id="breeding-remarks"
                          rows={2}
                          className="w-full bg-white text-slate-900 text-xs rounded-xl px-2.5 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition resize-none"
                          placeholder="Observaciones de emasculación, viabilidad de polen, objetivos..."
                          value={remarks}
                          onChange={e => setRemarks(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!maternalId || !newAccessionNumber.trim()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs shadow-md shadow-emerald-600/25 transition cursor-pointer"
                    >
                      <GitMerge size={14} strokeWidth={2.2} />
                      <span>Generar Nueva Accesión</span>
                    </button>
                  </form>
                </HudFlyout>
              ) : selectedAccession ? (
                /* ── Mode 2: Detailed Cross Pedigree & Traceability ── */
                <HudFlyout
                  icon={<Dna size={16} />}
                  title={`Pedigrí: ${selectedAccession.accessionNumber}`}
                  subtitle={selectedTaxon ? `${selectedTaxon.genus} ${selectedTaxon.species}` : 'Línea Híbrida'}
                  closeAriaLabel="Cerrar detalle de línea"
                  onClose={() => setSelectedAccessionId(null)}
                  className="w-full !max-h-full h-full"
                  headerActions={
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAccessionId(null)
                        setIsFormOpen(true)
                      }}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 px-2 py-1 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                    >
                      + Nueva
                    </button>
                  }
                  footer={
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const firstLot = selectedF1Lots[0]
                          navigate(
                            firstLot
                              ? `/individuals?accessionId=${selectedAccession.id}&seedLotId=${firstLot.id}`
                              : `/individuals?accessionId=${selectedAccession.id}`
                          )
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/25 transition cursor-pointer"
                      >
                        <Sprout size={14} />
                        <span>Sembrar F1</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/accessions')}
                        className="inline-flex items-center justify-center py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
                      >
                        Ver en Banco
                      </button>
                    </div>
                  }
                >
                  <div className="flex flex-col gap-3 py-1">
                    {/* Header Summary Card */}
                    <div className="p-3 rounded-xl bg-white/95 border border-slate-200/90 shadow-xs">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-800 text-[10px] font-mono font-bold">
                          <Sparkles size={10} className="text-fuchsia-600" />
                          F1 / BREED
                        </span>
                        {selectedAccession.acquisitionDate && (
                          <span className="text-[10.5px] font-mono text-slate-500">
                            {selectedAccession.acquisitionDate}
                          </span>
                        )}
                      </div>

                      <h3 className="font-mono text-lg font-bold text-slate-900">
                        {selectedAccession.accessionNumber}
                      </h3>
                      {selectedAccession.cultivarName && (
                        <p className="text-xs font-semibold text-slate-700">
                          {selectedAccession.cultivarName}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 italic">
                        {selectedTaxon ? `${selectedTaxon.genus} ${selectedTaxon.species}` : 'Taxón no identificado'}
                        {selectedTaxon?.commonName && <span className="not-italic text-slate-400 ml-1">· {selectedTaxon.commonName}</span>}
                      </p>
                    </div>

                    {/* Pedigree & Parents */}
                    <div className="p-3 rounded-xl bg-white/95 border border-slate-200/90 shadow-xs flex flex-col gap-2.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-pink-700 flex items-center gap-1.5">
                        <GitMerge size={12} />
                        Árbol Genealógico y Parentales
                      </span>

                      <div className="p-2.5 rounded-lg bg-pink-50/60 border border-pink-200/60 font-mono text-xs font-semibold text-pink-900 flex items-center gap-1.5">
                        <GitMerge size={13} className="text-pink-700 shrink-0" />
                        <span>{selectedAccession.pedigree || 'No especificado'}</span>
                      </div>

                      {/* Maternal Parent ♀ */}
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-mono font-bold uppercase text-pink-700 block mb-1">
                          ♀ Madre (Receptor de polen)
                        </span>
                        {selectedMother ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-mono text-xs font-bold text-slate-900">
                                {selectedMother.accessionNumber}
                              </span>
                              {selectedMother.cultivarName && (
                                <span className="text-xs text-slate-500 ml-1.5">
                                  ({selectedMother.cultivarName})
                                </span>
                              )}
                            </div>
                            <ParentPhenotypeHint accessionId={selectedMother.id} />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">
                            {selectedAccession.maternalAccessionId || 'Accesión madre externa o desconocida'}
                          </span>
                        )}
                      </div>

                      {/* Paternal Parent ♂ */}
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-mono font-bold uppercase text-sky-700 block mb-1">
                          ♂ Padre (Donante de polen)
                        </span>
                        {selectedFather ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-mono text-xs font-bold text-slate-900">
                                {selectedFather.accessionNumber}
                              </span>
                              {selectedFather.cultivarName && (
                                <span className="text-xs text-slate-500 ml-1.5">
                                  ({selectedFather.cultivarName})
                                </span>
                              )}
                            </div>
                            <ParentPhenotypeHint accessionId={selectedFather.id} />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">
                            {selectedAccession.pedigree?.includes('Self')
                              ? 'Autofecundación (Self) - Línea materna autopolinizada'
                              : 'Polinización abierta / Libre'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* F1 Seed Lots Inventory Traceability */}
                    <div className="p-3 rounded-xl bg-white/95 border border-slate-200/90 shadow-xs flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                          <Package size={12} />
                          Trazabilidad de Semillas F1
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-semibold">
                          {selectedF1Lots.length} {selectedF1Lots.length === 1 ? 'lote' : 'lotes'}
                        </span>
                      </div>

                      {selectedF1Lots.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">
                          No se registraron semillas cosechadas inmediatas al momento de la cruza.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {selectedF1Lots.map(lot => (
                            <div
                              key={lot.id}
                              className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/80 flex items-center justify-between"
                            >
                              <div>
                                <span className="font-mono text-xs font-bold text-emerald-900 block">
                                  {lot.lotCode}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {lot.currentCount ?? lot.initialCount} semillas en stock
                                  {lot.harvestDate ? ` · Cosecha: ${lot.harvestDate}` : ''}
                                </span>
                              </div>
                              <span className="text-[9.5px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {lot.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Crossing Event Record */}
                    {selectedCrossing && (
                      <div className="p-3 rounded-xl bg-white/95 border border-slate-200/90 shadow-xs flex flex-col gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                          <Layers size={12} />
                          Registro del Evento de Hibridación
                        </span>
                        <div className="text-xs text-slate-600 flex flex-col gap-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Evento:</span>
                            <span className="font-mono font-semibold text-slate-800">{selectedCrossing.crossName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Fecha de Cruza:</span>
                            <span className="font-mono text-slate-800">{selectedCrossing.crossDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Tipo:</span>
                            <span className="font-semibold text-slate-800 capitalize">{selectedCrossing.crossType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Estado:</span>
                            <span className="font-semibold text-emerald-700 capitalize">{selectedCrossing.successStatus}</span>
                          </div>
                          {selectedCrossing.notes && (
                            <div className="mt-1 pt-1 border-t border-slate-100 text-[11.5px] text-slate-600">
                              <span className="text-slate-500 block mb-0.5 font-medium">Notas:</span>
                              {selectedCrossing.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedAccession.remarks && !selectedCrossing?.notes && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block mb-1">
                          Notas Registradas
                        </span>
                        {selectedAccession.remarks}
                      </div>
                    )}
                  </div>
                </HudFlyout>
              ) : null}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
