import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAccessionStore } from '@/store/accessionStore'
import { useTaxonStore } from '@/store/taxonStore'
import { useIndividualStore } from '@/store/individualStore'
import { useSeedLotStore } from '@/store/seedLotStore'
import { useTaxonomySearch } from '@/hooks/useTaxonomySearch'
import { enrichTaxonomySearchResult } from '@/services/taxonomy/taxonEnrichment'
import type { TaxonomySearchResult } from '@/services/taxonomy/types'
import { getTraitsForCrop, getEffectiveCropCode } from '@/domain/ontology/index'
import { getIndividualDisplayName } from '@/domain/individual'
import type { Accession, AcquisitionSource } from '@/domain/accession'
import { SeedBankTabs } from '@/components/SeedBankTabs'
import { useAgroSuitability } from '@/hooks/useAgroSuitability'
import { AgroSuitabilityCard } from '@/features/agroclimate/AgroSuitabilityCard'
import { HudChipRow, HudFlyout, type HudChipOption } from '@/components/hud'
import {
  Sprout, Plus, Search, Trash2, Globe, GitBranch,
  Package, Users, Calendar, MapPin, X, Sparkles, LeafyGreen, Loader2
} from 'lucide-react'

// ─── Config ───────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<AcquisitionSource, string> = {
  wild:       'Silvestre',
  cultivated: 'Cultivada',
  market:     'Mercado',
  breeding:   'Mejoramiento',
  research:   'Investigación',
  unknown:    'Desconocido',
}

const SOURCE_BADGES: Record<AcquisitionSource, { label: string; badgeClass: string }> = {
  wild:       { label: 'Silvestre', badgeClass: 'bg-emerald-100/80 text-emerald-800 border-emerald-200/80' },
  cultivated: { label: 'Cultivada', badgeClass: 'bg-blue-100/80 text-blue-800 border-blue-200/80' },
  market:     { label: 'Mercado', badgeClass: 'bg-amber-100/80 text-amber-800 border-amber-200/80' },
  breeding:   { label: 'Mejoramiento', badgeClass: 'bg-pink-100/80 text-pink-800 border-pink-200/80' },
  research:   { label: 'Investigación', badgeClass: 'bg-purple-100/80 text-purple-800 border-purple-200/80' },
  unknown:    { label: 'Desconocido', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
}

const ORIGIN_FILTER_OPTIONS: Array<HudChipOption<string>> = [
  { value: 'all', label: 'Todas' },
  { value: 'wild', label: 'Silvestre' },
  { value: 'cultivated', label: 'Cultivada' },
  { value: 'research', label: 'Banco de Germoplasma' },
  { value: 'breeding', label: 'Fitomejoramiento' },
  { value: 'market', label: 'Mercado' },
]

// ─── Detail Subcomponent ──────────────────────────────────────────────────────

function AccessionDetail({
  accession,
  onDelete,
}: {
  accession: Accession
  onDelete: () => void
}) {
  const navigate = useNavigate()
  const { taxons } = useTaxonStore()
  const { accessions } = useAccessionStore()
  const { individuals } = useIndividualStore()
  const { seedLots, add: addSeedLot } = useSeedLotStore()

  const taxon = taxons.find(t => t.id === accession.taxonId)
  const {
    assessment: agroAssessment,
    climate,
    isLoadingClimate,
    climateError,
  } = useAgroSuitability(taxon?.agronomicData)
  const maternalAcc = accession.maternalAccessionId
    ? accessions.find(a => a.id === accession.maternalAccessionId)
    : null
  const paternalAcc = accession.paternalAccessionId
    ? accessions.find(a => a.id === accession.paternalAccessionId)
    : null

  const relatedIndividuals = individuals.filter(i => i.accessionId === accession.id)
  const relatedLots = seedLots.filter(l => l.accessionId === accession.id)
  const totalAvailableSeeds = relatedLots
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + (l.currentCount ?? 0), 0)

  const srcCfg = SOURCE_BADGES[accession.acquisitionSource] || SOURCE_BADGES.unknown
  const effectiveCropCode = taxon ? getEffectiveCropCode(taxon) : ''
  const ontologyTraits = effectiveCropCode ? getTraitsForCrop(effectiveCropCode) : (taxon?.traits || [])

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showInlineLotForm, setShowInlineLotForm] = useState(false)
  const [inlineLotCount, setInlineLotCount] = useState('100')
  const [inlineLotStorage, setInlineLotStorage] = useState('')

  const handleCreateInlineLot = (e: React.FormEvent) => {
    e.preventDefault()
    const nextNum = relatedLots.length + 1
    addSeedLot({
      accessionId: accession.id,
      lotCode: `${accession.accessionNumber}-L${nextNum}`,
      initialCount: inlineLotCount ? Number(inlineLotCount) : undefined,
      storageLocation: inlineLotStorage.trim() || undefined,
      harvestDate: new Date().toISOString().slice(0, 10),
    })
    setShowInlineLotForm(false)
    setInlineLotCount('100')
    setInlineLotStorage('')
  }

  return (
    <div className="flex flex-col gap-3 py-1">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold font-mono text-slate-900 tracking-tight">
              {accession.accessionNumber}
            </h2>
            {accession.cultivarName && (
              <span className="text-sm font-semibold text-slate-600">
                · {accession.cultivarName}
              </span>
            )}
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${srcCfg.badgeClass}`}>
              {srcCfg.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 italic mt-0.5">
            {taxon ? `${taxon.genus} ${taxon.species}` : 'Especie botánica no asignada'}
            {taxon?.commonName && (
              <span className="not-italic text-slate-400 ml-1">
                · {taxon.commonName}
              </span>
            )}
          </p>
          {effectiveCropCode && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-[11px] font-semibold">
              <Sparkles size={11} className="text-emerald-600" />
              {ontologyTraits.length > 0 ? (
                <span>Ontología: {effectiveCropCode} · {ontologyTraits.length} descriptores activos</span>
              ) : (
                <span>Prefijo de Accesión: {effectiveCropCode}</span>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-xs text-rose-800 font-semibold px-1">¿Eliminar?</span>
              <button
                type="button"
                onClick={onDelete}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition"
              >
                Sí, eliminar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium cursor-pointer transition"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium transition cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Eliminar</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick stats cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Lotes de semillas */}
        <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Package size={14} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-700">Lotes de Semillas</span>
              <p className="text-base font-bold font-mono text-purple-950 leading-none mt-0.5">
                {relatedLots.length}
                <span className="text-[11px] font-normal text-purple-700 ml-1 font-sans">
                  ({totalAvailableSeeds} sem.)
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowInlineLotForm(v => !v)}
            className="mt-2.5 w-full py-1 px-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
          >
            <Plus size={12} strokeWidth={2.5} />
            <span>Nuevo Lote</span>
          </button>
        </div>

        {/* Plantas (Individuos) */}
        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Users size={14} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700">Plantas en Campo</span>
              <p className="text-base font-bold font-mono text-emerald-950 leading-none mt-0.5">
                {relatedIndividuals.length}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/individuals?accessionId=${accession.id}`)}
            className="mt-2.5 w-full py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
          >
            <Plus size={12} strokeWidth={2.5} />
            <span>Sembrar</span>
          </button>
        </div>
      </div>

      {/* Inline Form to add SeedLot */}
      {showInlineLotForm && (
        <form onSubmit={handleCreateInlineLot} className="p-3 rounded-xl bg-purple-50/90 border border-purple-200 text-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-900">
              Nuevo Lote para {accession.accessionNumber}
            </span>
            <button
              type="button"
              onClick={() => setShowInlineLotForm(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-purple-900 mb-1">Cantidad de Semillas</label>
              <input
                type="number"
                min={1}
                value={inlineLotCount}
                onChange={e => setInlineLotCount(e.target.value)}
                required
                className="w-full bg-white text-slate-900 text-xs rounded-lg px-2.5 py-1.5 border border-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-purple-900 mb-1">Ubicación</label>
              <input
                type="text"
                placeholder="Heladera 1 · B2"
                value={inlineLotStorage}
                onChange={e => setInlineLotStorage(e.target.value)}
                className="w-full bg-white text-slate-900 text-xs rounded-lg px-2.5 py-1.5 border border-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="py-1.5 px-3 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
          >
            Guardar Lote
          </button>
        </form>
      )}

      {/* Embedded SeedLots of this Accession */}
      <div className="p-3 rounded-xl bg-white/95 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            Lotes de Semillas ({relatedLots.length})
          </span>
          <button
            type="button"
            onClick={() => navigate(`/seedlots?accessionId=${accession.id}`)}
            className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
          >
            Ver en inventario →
          </button>
        </div>

        {relatedLots.length === 0 ? (
          <p className="text-xs text-slate-500 py-1">
            Sin sobres de semillas registrados. Usa "Nuevo Lote" para cargar stock inicial.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {relatedLots.map(lot => {
              const canSow = lot.status === 'active' && (lot.currentCount === undefined || lot.currentCount > 0)
              return (
                <div
                  key={lot.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {lot.lotCode}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full ${
                          lot.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {lot.currentCount !== undefined ? `${lot.currentCount} sem.` : 'Stock abierto'}
                      </span>
                      {lot.germinationRate !== undefined && (
                        <span className="text-[10px] font-mono text-slate-500">
                          · {lot.germinationRate}% germ.
                        </span>
                      )}
                    </div>
                    {lot.storageLocation && (
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        Ubicación: {lot.storageLocation}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={!canSow}
                    onClick={() => navigate(`/individuals?accessionId=${accession.id}&seedLotId=${lot.id}`)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[10px] font-semibold shrink-0 transition cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <Sprout size={10} />
                    <span>Sembrar</span>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Plantas sembradas de esta variedad */}
      {relatedIndividuals.length > 0 && (
        <div className="p-3 rounded-xl bg-white/95 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Plantas Sembradas ({relatedIndividuals.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {relatedIndividuals.map((ind, idx) => (
              <button
                key={ind.id}
                type="button"
                onClick={() => navigate(`/individuals?selectedId=${ind.id}`)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-mono transition cursor-pointer border border-slate-200/80"
              >
                <Users size={11} className="text-emerald-600" />
                <span>{getIndividualDisplayName(ind, accession.accessionNumber, idx)}</span>
                {ind.currentBBCH !== undefined && (
                  <span className="text-slate-500">· BBCH {ind.currentBBCH}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Aptitud agroclimática local de la variedad */}
      {taxon?.agronomicData && climate && (
        <AgroSuitabilityCard
          assessment={agroAssessment}
          climate={climate}
          isLoading={isLoadingClimate}
          error={climateError}
        />
      )}

      {/* Info grid: Taxonomía + Colecta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Taxonomía */}
        <div className="p-3 rounded-xl bg-white/95 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Taxonomía Botánica
          </span>
          <dl className="flex flex-col gap-1.5 text-xs">
            {taxon && (
              <>
                <div>
                  <dt className="text-[10px] font-mono text-slate-400 uppercase">Familia</dt>
                  <dd className="font-semibold text-slate-800">{taxon.family}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono text-slate-400 uppercase">Especie</dt>
                  <dd className="italic text-slate-800">{taxon.genus} {taxon.species}</dd>
                </div>
                {taxon.commonName && (
                  <div>
                    <dt className="text-[10px] font-mono text-slate-400 uppercase">Nombre Común</dt>
                    <dd className="text-slate-700">{taxon.commonName}</dd>
                  </div>
                )}
                {effectiveCropCode && (
                  <div>
                    <dt className="text-[10px] font-mono text-slate-400 uppercase">Crop Code</dt>
                    <dd className="mt-0.5">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {effectiveCropCode}
                      </span>
                    </dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </div>

        {/* Colecta y Origen */}
        <div className="p-3 rounded-xl bg-white/95 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Colecta y Origen
          </span>
          <dl className="flex flex-col gap-1.5 text-xs">
            {accession.acquisitionDate && (
              <div>
                <dt className="text-[10px] font-mono text-slate-400 uppercase">Fecha Ingreso</dt>
                <dd className="text-slate-800 flex items-center gap-1">
                  <Calendar size={11} className="text-slate-400" />
                  {new Date(accession.acquisitionDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </dd>
              </div>
            )}
            {accession.originCountry && (
              <div>
                <dt className="text-[10px] font-mono text-slate-400 uppercase">País de Origen</dt>
                <dd className="text-slate-800 flex items-center gap-1 font-mono">
                  <Globe size={11} className="text-slate-400" />
                  {accession.originCountry}
                </dd>
              </div>
            )}
            {accession.originLocality && (
              <div>
                <dt className="text-[10px] font-mono text-slate-400 uppercase">Localidad</dt>
                <dd className="text-slate-800 flex items-center gap-1">
                  <MapPin size={11} className="text-slate-400" />
                  {accession.originLocality}
                </dd>
              </div>
            )}
            {accession.donorCode && (
              <div>
                <dt className="text-[10px] font-mono text-slate-400 uppercase">Código Donante</dt>
                <dd className="font-mono text-slate-800">{accession.donorCode}</dd>
              </div>
            )}
            {accession.mlsStatus !== undefined && (
              <div>
                <dt className="text-[10px] font-mono text-slate-400 uppercase">Estado MLS</dt>
                <dd className="text-slate-800">{accession.mlsStatus ? 'Bajo Tratado RFAA' : 'Sin MLS'}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Pedigree */}
      {(accession.pedigree || maternalAcc || paternalAcc) && (
        <div className="p-3 rounded-xl bg-white/95 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Pedigrí y Genealogía
          </span>
          <dl className="flex flex-col gap-1.5 text-xs">
            {accession.pedigree && (
              <div>
                <dt className="text-[10px] font-mono text-slate-400 uppercase">Pedigree</dt>
                <dd className="text-slate-800 flex items-center gap-1.5">
                  <GitBranch size={12} className="text-slate-400" />
                  {accession.pedigree}
                </dd>
              </div>
            )}
            {maternalAcc && (
              <div>
                <dt className="text-[10px] font-mono text-slate-400 uppercase">Madre (♀)</dt>
                <dd className="font-mono font-semibold text-slate-800">{maternalAcc.accessionNumber}</dd>
              </div>
            )}
            {paternalAcc && (
              <div>
                <dt className="text-[10px] font-mono text-slate-400 uppercase">Padre (♂)</dt>
                <dd className="font-mono font-semibold text-slate-800">{paternalAcc.accessionNumber}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Remarks */}
      {accession.remarks && (
        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 block mb-1">
            Observaciones
          </span>
          <p>{accession.remarks}</p>
        </div>
      )}

      {/* ID footer */}
      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>id: {accession.id}</span>
      </div>
    </div>
  )
}

// ─── Modal para agregar especie al vuelo desde GBIF + EcoCrop ─────────────────

function QuickAddTaxonModal({
  isOpen,
  onClose,
  onTaxonCreated,
}: {
  isOpen: boolean
  onClose: () => void
  onTaxonCreated: (taxonId: string) => void
}) {
  const { add } = useTaxonStore()
  const [query, setQuery] = useState('')
  const [isEnriching, setIsEnriching] = useState(false)
  const { data: results, isLoading } = useTaxonomySearch(query)

  if (!isOpen) return null

  const handleSelect = async (r: TaxonomySearchResult) => {
    setIsEnriching(true)
    try {
      const enriched = await enrichTaxonomySearchResult(r)
      const created = add({
        family: enriched.family,
        genus: enriched.genus,
        species: enriched.species,
        commonName: enriched.commonName,
        cropCode: enriched.cropCode,
        imageUrl: enriched.imageUrl,
        agronomicData: enriched.agronomicData,
        traits: enriched.traits,
      })

      onTaxonCreated(created.id)
      onClose()
    } finally {
      setIsEnriching(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-lg p-5 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <LeafyGreen size={15} />
            </div>
            <span>Descubrir Especie Botánica (GBIF + EcoCrop)</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre científico (ej. Solanum, Zea...)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
          />
        </div>

        {isEnriching && (
          <div className="p-3 mb-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-center gap-2 font-medium">
            <Loader2 size={14} className="animate-spin text-emerald-600" />
            <span>Enriqueciendo con ontología y datos agroclimáticos FAO EcoCrop...</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
          {isLoading && (
            <p className="text-xs text-center text-slate-400 py-6">
              Buscando en GBIF...
            </p>
          )}
          {!isLoading && query.length > 2 && results?.length === 0 && (
            <p className="text-xs text-center text-slate-400 py-6">
              No se encontraron especies botánicas.
            </p>
          )}
          {results?.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelect(r)}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 bg-white/70 hover:bg-emerald-50/70 hover:border-emerald-300 transition text-left cursor-pointer w-full group"
            >
              {r.imageUrl ? (
                <img src={r.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <LeafyGreen size={15} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-800 transition">
                  {r.commonName || r.scientificName}
                </p>
                <p className="text-[11px] text-slate-500 italic truncate">
                  {r.scientificName} ({r.family})
                </p>
              </div>
              <Plus size={14} className="text-slate-400 group-hover:text-emerald-600 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AccessionsPage() {
  const navigate = useNavigate()
  const { accessions, add, remove } = useAccessionStore()
  const { taxons } = useTaxonStore()
  const { seedLots, add: addSeedLot } = useSeedLotStore()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [originFilter, setOriginFilter] = useState('all')
  const [showQuickAddTaxon, setShowQuickAddTaxon] = useState(false)

  // Form state
  const [accessionNumber, setAccessionNumber] = useState('')
  const [taxonId, setTaxonId] = useState('')
  const [source, setSource] = useState<AcquisitionSource>('unknown')
  const [cultivarName, setCultivarName] = useState('')
  const [acquisitionDate, setAcquisitionDate] = useState('')
  const [originCountry, setOriginCountry] = useState('')
  const [pedigree, setPedigree] = useState('')
  const [remarks, setRemarks] = useState('')

  // Stock inicial opcional (Crea Lote L1 en el mismo paso)
  const [initialSeedCount, setInitialSeedCount] = useState('')
  const [initialStorageLocation, setInitialStorageLocation] = useState('')

  // Auto-prefix number by crop code when taxon is selected
  const handleTaxonChange = (id: string) => {
    setTaxonId(id)
    if (!id) return
    const taxon = taxons.find(t => t.id === id)
    if (!taxon) return
    const effectiveCode = getEffectiveCropCode(taxon)
    if (!effectiveCode) return
    const year = new Date().getFullYear()
    // Replace existing prefix pattern or set fresh
    const numPart = accessionNumber.replace(/^[A-Z0-9_]+-\d+-/, '')
    setAccessionNumber(`${effectiveCode}-${year}-${numPart || '001'}`)
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessionNumber.trim() || !taxonId) return
    const newAcc = add({
      accessionNumber: accessionNumber.trim(),
      taxonId,
      acquisitionSource: source,
      cultivarName: cultivarName || undefined,
      acquisitionDate: acquisitionDate || undefined,
      originCountry: originCountry || undefined,
      pedigree: pedigree || undefined,
      remarks: remarks || undefined,
    })

    // Si el usuario ingresó un stock inicial de semillas, crear el Lote L1 automáticamente
    const parsedSeedCount = initialSeedCount.trim() ? Number(initialSeedCount) : 0
    if (parsedSeedCount > 0 && !Number.isNaN(parsedSeedCount)) {
      addSeedLot({
        accessionId: newAcc.id,
        lotCode: `${newAcc.accessionNumber}-L1`,
        initialCount: parsedSeedCount,
        storageLocation: initialStorageLocation.trim() || undefined,
        harvestDate: acquisitionDate || new Date().toISOString().slice(0, 10),
      })
    }

    setSelectedId(newAcc.id)
    setIsFormOpen(false)
    setAccessionNumber('')
    setTaxonId('')
    setSource('unknown')
    setCultivarName('')
    setAcquisitionDate('')
    setOriginCountry('')
    setPedigree('')
    setRemarks('')
    setInitialSeedCount('')
    setInitialStorageLocation('')
  }

  const filtered = useMemo(() => {
    return accessions.filter(acc => {
      // 1. Origin filter
      if (originFilter !== 'all' && acc.acquisitionSource !== originFilter) {
        return false
      }
      // 2. Search query
      const q = search.toLowerCase().trim()
      if (!q) return true
      const taxon = taxons.find(t => t.id === acc.taxonId)
      return (
        acc.accessionNumber.toLowerCase().includes(q) ||
        acc.cultivarName?.toLowerCase().includes(q) ||
        taxon?.genus.toLowerCase().includes(q) ||
        taxon?.species.toLowerCase().includes(q) ||
        taxon?.commonName?.toLowerCase().includes(q)
      )
    })
  }, [accessions, taxons, search, originFilter])

  const selectedAccession = accessions.find(a => a.id === selectedId)

  const handleDelete = () => {
    if (!selectedAccession) return
    remove(selectedAccession.id)
    setSelectedId(null)
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <SeedBankTabs active="accessions" />

      {/* Top Agile HUD Toolbar */}
      <header className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 z-30 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-xs">
              <Sprout size={16} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                Banco de Germoplasma
              </h1>
              <p className="text-[11px] text-slate-500">
                {accessions.length === 0 ? 'No hay accesiones en el catálogo' : `${accessions.length} ${accessions.length === 1 ? 'accesión' : 'accesiones'}`}
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
              placeholder="Buscar accesión, cultivar, especie..."
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

          {/* Origin Filter Chips (Desktop) */}
          <div className="hidden sm:block">
            <HudChipRow
              options={ORIGIN_FILTER_OPTIONS}
              value={originFilter}
              onChange={setOriginFilter}
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
            <span>+ Nueva Accesión</span>
          </button>
        </div>
      </header>

      {/* Mobile Filter Chips Row */}
      <div className="sm:hidden px-4 py-2 border-b border-slate-200/80 bg-white/70 overflow-x-auto shrink-0">
        <HudChipRow
          options={ORIGIN_FILTER_OPTIONS}
          value={originFilter}
          onChange={setOriginFilter}
        />
      </div>

      {/* Main Layout: Visual Accession Catalog Grid + Lateral HudFlyout */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 transition-all duration-200 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Colección de Accesiones
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-200/80 text-slate-700">
                {filtered.length}
              </span>
            </div>
            {originFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setOriginFilter('all')}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer"
              >
                Mostrar todas
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            accessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100 shadow-xs">
                  <Sprout size={28} />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1">
                  No hay accesiones registradas
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  No hay accesiones disponibles en este momento. Registra la primera accesión usando el formulario lateral o descubriendo especies en GBIF.
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
                  <span>Nueva Accesión</span>
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
                  No se encontraron accesiones que coincidan con los criterios de búsqueda o filtro aplicados.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setOriginFilter('all')
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
                >
                  Limpiar filtros
                </button>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filtered.map(acc => {
                const isSelected = selectedId === acc.id && !isFormOpen
                const taxon = taxons.find(t => t.id === acc.taxonId)
                const accLots = seedLots.filter(l => l.accessionId === acc.id)
                const activeLots = accLots.filter(l => l.status === 'active')
                const totalSeeds = activeLots.reduce((sum, l) => sum + (l.currentCount ?? 0), 0)
                const badgeCfg = SOURCE_BADGES[acc.acquisitionSource] || SOURCE_BADGES.unknown
                const effectiveCode = taxon ? getEffectiveCropCode(taxon) : ''

                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      setSelectedId(acc.id)
                      setIsFormOpen(false)
                    }}
                    className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/80 shadow-md ring-2 ring-emerald-500/40'
                        : 'border-slate-200/80 bg-white/85 hover:bg-white hover:border-slate-300 shadow-xs hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Top row: Code + Source Badge */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-mono text-sm font-bold text-slate-900 tracking-tight group-hover:text-emerald-700 transition">
                          {acc.accessionNumber}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${badgeCfg.badgeClass}`}>
                          {badgeCfg.label}
                        </span>
                      </div>

                      {/* Cultivar Name */}
                      {acc.cultivarName && (
                        <p className="text-xs font-semibold text-slate-700 truncate mb-1">
                          · {acc.cultivarName}
                        </p>
                      )}

                      {/* Taxon name */}
                      <p className="text-xs text-slate-500 italic line-clamp-1">
                        {taxon ? `${taxon.genus} ${taxon.species}` : 'Especie no asignada'}
                        {taxon?.commonName && (
                          <span className="not-italic text-slate-400 ml-1">
                            · {taxon.commonName}
                          </span>
                        )}
                      </p>

                      {/* Crop Code badge if available */}
                      {effectiveCode && (
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-[10px] font-mono font-semibold">
                            <Sparkles size={10} className="text-emerald-600" />
                            {effectiveCode}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer of Card */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                        <Package size={13} className="text-purple-600 shrink-0" />
                        <span>
                          {accLots.length > 0
                            ? `${totalSeeds} sem. (${accLots.length} lotes)`
                            : '0 lotes'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/individuals?accessionId=${acc.id}`)
                        }}
                        title="Sembrar planta de esta accesión"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-emerald-700 hover:bg-emerald-50 font-semibold text-[11px] transition"
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

        {/* Right-Side Lateral HudFlyout: New Accession Form OR Detailed Sheet */}
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
                <HudFlyout
                  icon={<Sprout size={16} />}
                  title="Nueva Accesión"
                  subtitle="Pasaporte genético + Lote inicial"
                  closeAriaLabel="Cerrar formulario de nueva accesión"
                  onClose={() => setIsFormOpen(false)}
                  className="w-full !max-h-full h-full"
                >
                  <form onSubmit={handleAdd} className="flex flex-col gap-3 py-1">
                    {/* Especie (Taxón) */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="taxon-select" className="block text-[11px] font-semibold text-slate-700">
                          Especie (Taxón) <span className="text-rose-600">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowQuickAddTaxon(true)}
                          className="text-emerald-700 hover:text-emerald-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          title="Buscar y agregar especie al vuelo desde GBIF"
                        >
                          <Plus size={11} strokeWidth={2.5} />
                          <span>Buscar en GBIF</span>
                        </button>
                      </div>
                      <select
                        id="taxon-select"
                        aria-label="Especie (Taxón)"
                        value={taxonId}
                        onChange={e => handleTaxonChange(e.target.value)}
                        required
                        className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition cursor-pointer"
                      >
                        <option value="" disabled>Seleccionar especie...</option>
                        {taxons.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.genus} {t.species}{t.commonName ? ` (${t.commonName})` : ''}
                          </option>
                        ))}
                      </select>
                      {taxons.length === 0 && (
                        <button
                          type="button"
                          onClick={() => setShowQuickAddTaxon(true)}
                          className="w-full mt-1.5 p-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/70 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-100/80 transition cursor-pointer"
                        >
                          <Plus size={13} />
                          <span>Buscar y agregar especie al vuelo</span>
                        </button>
                      )}
                    </div>

                    {/* Accession Number */}
                    <div>
                      <label htmlFor="acc-number" className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Accession Number <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="acc-number"
                        aria-label="Accession Number"
                        type="text"
                        placeholder="PLT-2026-001"
                        value={accessionNumber}
                        onChange={e => setAccessionNumber(e.target.value)}
                        required
                        className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs font-mono rounded-xl px-3 py-2 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                      />
                    </div>

                    {/* Origen de Adquisición + Cultivar */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label htmlFor="source-select" className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Origen de Adquisición
                        </label>
                        <select
                          id="source-select"
                          aria-label="Origen de Adquisición"
                          value={source}
                          onChange={e => setSource(e.target.value as AcquisitionSource)}
                          className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl px-2.5 py-2 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition cursor-pointer"
                        >
                          {(Object.entries(SOURCE_LABELS) as [AcquisitionSource, string][]).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Cultivar / Línea
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Platense..."
                          value={cultivarName}
                          onChange={e => setCultivarName(e.target.value)}
                          className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Sobre / Lote Inicial (Opcional) */}
                    <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/80">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1.5 mb-2">
                        <Package size={12} className="text-purple-600" />
                        Sobre / Lote Inicial (Opcional)
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label htmlFor="initial-seed-count" className="block text-[11px] font-semibold text-purple-900 mb-1">
                            Stock Inicial de Semillas
                          </label>
                          <input
                            id="initial-seed-count"
                            aria-label="Stock Inicial de Semillas"
                            type="number"
                            min={0}
                            placeholder="Ej. 100"
                            value={initialSeedCount}
                            onChange={e => setInitialSeedCount(e.target.value)}
                            className="w-full bg-white text-slate-900 text-xs rounded-lg px-2.5 py-1.5 border border-purple-200/80 focus:border-purple-500 focus:outline-none transition"
                          />
                        </div>
                        <div>
                          <label htmlFor="initial-seed-storage" className="block text-[11px] font-semibold text-purple-900 mb-1">
                            Guardado en
                          </label>
                          <input
                            id="initial-seed-storage"
                            type="text"
                            placeholder="Heladera 1..."
                            value={initialStorageLocation}
                            onChange={e => setInitialStorageLocation(e.target.value)}
                            className="w-full bg-white text-slate-900 text-xs rounded-lg px-2.5 py-1.5 border border-purple-200/80 focus:border-purple-500 focus:outline-none transition"
                          />
                        </div>
                      </div>
                    </div>

                    {/* País de Origen + Pedigree */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          País de Origen (ISO 3)
                        </label>
                        <input
                          type="text"
                          placeholder="ARG"
                          maxLength={3}
                          value={originCountry}
                          onChange={e => setOriginCountry(e.target.value.toUpperCase())}
                          className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs uppercase font-mono rounded-xl px-3 py-2 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Pedigree
                        </label>
                        <input
                          type="text"
                          placeholder="A x B"
                          value={pedigree}
                          onChange={e => setPedigree(e.target.value)}
                          className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Fecha de Ingreso */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Fecha de Ingreso
                      </label>
                      <input
                        type="date"
                        value={acquisitionDate}
                        onChange={e => setAcquisitionDate(e.target.value)}
                        className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                      />
                    </div>

                    {/* Observaciones */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Observaciones
                      </label>
                      <textarea
                        placeholder="Notas adicionales..."
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                        className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition h-16 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      aria-label="Agregar"
                      disabled={!accessionNumber.trim() || !taxonId}
                      className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 mt-1"
                    >
                      <Plus size={14} strokeWidth={2.5} />
                      <span>Agregar Accesión</span>
                    </button>
                  </form>
                </HudFlyout>
              ) : selectedAccession ? (
                <HudFlyout
                  icon={<Sprout size={16} />}
                  title="Ficha de Accesión"
                  subtitle={`${selectedAccession.cultivarName ? `${selectedAccession.cultivarName} · ` : ''}Pasaporte Genético`}
                  closeAriaLabel="Cerrar ficha de accesión"
                  onClose={() => {
                    setSelectedId(null)
                  }}
                  className="w-full !max-h-full h-full"
                >
                  <AccessionDetail
                    accession={selectedAccession}
                    onDelete={handleDelete}
                  />
                </HudFlyout>
              ) : null}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Modal para alta rápida de especies desde GBIF + EcoCrop */}
      <QuickAddTaxonModal
        isOpen={showQuickAddTaxon}
        onClose={() => setShowQuickAddTaxon(false)}
        onTaxonCreated={id => handleTaxonChange(id)}
      />
    </div>
  )
}
