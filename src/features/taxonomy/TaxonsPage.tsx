import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useTaxonStore } from '@/store/taxonStore'
import { useTaxonomySearch } from '@/hooks/useTaxonomySearch'
import { fetchBotanicalImage } from '@/services/taxonomy/gbifApi'
import { lookupEcocrop } from '@/services/taxonomy/ecocrop'
import type { TaxonomySearchResult } from '@/services/taxonomy/types'
import { resolveCropOntology, getTraitsForCrop, generateFallbackCropCode } from '@/domain/ontology/index'
import type { ResolvedCrop } from '@/domain/ontology/cropResolver'
import type { TraitDefinition } from '@/domain/ontology/types'
import { mergeAgronomicData } from '@/domain/taxon'
import type { AgronomicData, AgronomicField, AgronomicSource } from '@/domain/taxon'
import { hydrateTaxonWithApis } from '@/services/taxonomy/taxonEnrichment'
import {
  Search, Plus, LeafyGreen, Info, Database, Trash2,
  Sparkles, CheckCircle2, Thermometer, Droplets, Sun, Layers, Loader2,
  CloudRain, CalendarDays, X
} from 'lucide-react'
import { AgroSuitabilityCard } from '@/features/agroclimate/AgroSuitabilityCard'
import { useAgroSuitability } from '@/hooks/useAgroSuitability'
import { SeedBankTabs } from '@/components/SeedBankTabs'
import { HudChipRow, HudFlyout } from '@/components/hud'

const SOURCE_LABEL: Record<AgronomicSource, string> = {
  trefle: 'Trefle',
  ecocrop: 'FAO EcoCrop',
  manual: 'Manual',
}

const FAMILY_SPANISH: Record<string, string> = {
  Solanaceae: 'Solanáceas',
  Poaceae: 'Poáceas',
  Fabaceae: 'Fabáceas',
  Brassicaceae: 'Brassicáceas',
  Rosaceae: 'Rosáceas',
  Cucurbitaceae: 'Cucurbitáceas',
  Asteraceae: 'Asteráceas',
  Apiaceae: 'Apiáceas',
  Lamiaceae: 'Lamiáceas',
  Alliaceae: 'Aliáceas',
  Amaryllidaceae: 'Amarilidáceas',
  Rutaceae: 'Rutáceas',
}

function SourceBadge({ source }: { source?: AgronomicSource }) {
  if (!source) return null
  const sourceStyles: Record<AgronomicSource, string> = {
    trefle: 'bg-blue-100 text-blue-800 border-blue-200',
    ecocrop: 'bg-amber-100 text-amber-800 border-amber-200',
    manual: 'bg-purple-100 text-purple-800 border-purple-200',
  }
  return (
    <span
      className={`ml-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase border ${
        sourceStyles[source] || 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {SOURCE_LABEL[source]}
    </span>
  )
}

/** Campos ecofisiológicos editables en el formulario. */
const EDITABLE_FIELDS: { key: AgronomicField; label: string; unit?: string; step: string }[] = [
  { key: 'minTemp', label: 'Temp. mín', unit: '°C', step: '0.5' },
  { key: 'maxTemp', label: 'Temp. máx', unit: '°C', step: '0.5' },
  { key: 'optTempMin', label: 'Óptima mín', unit: '°C', step: '0.5' },
  { key: 'optTempMax', label: 'Óptima máx', unit: '°C', step: '0.5' },
  { key: 'phMinimum', label: 'pH mín', step: '0.1' },
  { key: 'phMaximum', label: 'pH máx', step: '0.1' },
]

export function TaxonsPage() {
  const { taxons, add, remove } = useTaxonStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedFamily, setSelectedFamily] = useState<string>('all')
  const [isHydrating, setIsHydrating] = useState(false)

  // Auto-reparación de taxones incompletos
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

  // Search state (GBIF autocomplete + agile catalog search)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const { data: searchResults, isLoading } = useTaxonomySearch(searchQuery)

  // Form state
  const [family, setFamily] = useState('')
  const [genus, setGenus] = useState('')
  const [species, setSpecies] = useState('')
  const [commonName, setCommonName] = useState('')
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined)
  const [agronomicData, setAgronomicData] = useState<AgronomicData | undefined>(undefined)
  const [resolvedCrop, setResolvedCrop] = useState<ResolvedCrop | null>(null)
  const [resolvedTraits, setResolvedTraits] = useState<TraitDefinition[]>([])
  const [isFetchingDetail, setIsFetchingDetail] = useState(false)
  const [ecocropMatch, setEcocropMatch] = useState<string | null>(null)

  /** Edición manual de un campo: sobrescribe el valor y lo marca como 'manual'. */
  const handleAgronomicEdit = (key: AgronomicField, raw: string) => {
    setAgronomicData(prev => {
      const next: AgronomicData = { ...(prev ?? {}), sources: { ...(prev?.sources ?? {}) } }
      if (raw.trim() === '') {
        delete (next as Record<string, unknown>)[key]
        delete next.sources![key]
      } else {
        const n = Number(raw)
        if (!Number.isFinite(n)) return prev
        ;(next as Record<string, unknown>)[key] = n
        next.sources![key] = 'manual'
      }
      return next
    })
  }

  const handleSelectResult = async (result: TaxonomySearchResult) => {
    const resFamily = result.family || 'Desconocida'
    const resGenus = result.genus || ''
    const resSpecies = result.species || ''
    const resCommon = result.commonName || ''

    setFamily(resFamily)
    setGenus(resGenus)
    setSpecies(resSpecies)
    setCommonName(resCommon)
    setImageUrl(result.imageUrl)
    setSearchQuery(result.scientificName)
    setShowDropdown(false)
    setIsFormOpen(true)
    setSelectedId(null)

    // Resolución automática de Ontología biológica
    const resolution = resolveCropOntology({
      genus: resGenus,
      species: resSpecies,
      commonName: resCommon,
      family: resFamily,
    })
    setResolvedCrop(resolution)
    setResolvedTraits(resolution ? getTraitsForCrop(resolution.cropCode) : [])

    // Datos ecofisiológicos e imagen botánica: FAO EcoCrop + Wikipedia en paralelo
    setIsFetchingDetail(true)
    setAgronomicData(undefined)
    setEcocropMatch(null)
    try {
      const [eco, img] = await Promise.all([
        lookupEcocrop(resGenus, resSpecies),
        !result.imageUrl ? fetchBotanicalImage(resGenus, resSpecies) : Promise.resolve(undefined),
      ])
      setAgronomicData(mergeAgronomicData(result.agronomicData, eco?.data))
      setEcocropMatch(eco ? eco.matchedName : null)
      if (img && !result.imageUrl) {
        setImageUrl(img)
      }
    } finally {
      setIsFetchingDetail(false)
    }
  }

  const handleManualGenusChange = (newGenus: string) => {
    setGenus(newGenus)
    const resolution = resolveCropOntology({
      genus: newGenus,
      species,
      commonName,
      family,
    })
    setResolvedCrop(resolution)
    setResolvedTraits(resolution ? getTraitsForCrop(resolution.cropCode) : [])
  }

  const handleManualSpeciesChange = (newSpecies: string) => {
    setSpecies(newSpecies)
    const resolution = resolveCropOntology({
      genus,
      species: newSpecies,
      commonName,
      family,
    })
    setResolvedCrop(resolution)
    setResolvedTraits(resolution ? getTraitsForCrop(resolution.cropCode) : [])
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!family.trim() || !genus.trim() || !species.trim()) return

    const effectiveCropCode = resolvedCrop?.cropCode || generateFallbackCropCode(genus, species)

    const newTaxon = add({
      family,
      genus,
      species,
      commonName: commonName.trim() || undefined,
      cropCode: effectiveCropCode,
      imageUrl,
      agronomicData,
      traits: resolvedTraits.length > 0 ? resolvedTraits : undefined,
    })

    // Reset form
    setSearchQuery('')
    setFamily('')
    setGenus('')
    setSpecies('')
    setCommonName('')
    setImageUrl(undefined)
    setAgronomicData(undefined)
    setEcocropMatch(null)
    setResolvedCrop(null)
    setResolvedTraits([])
    setIsFormOpen(false)
    setSelectedId(newTaxon.id)
    setShowDropdown(false)
  }

  // Botanical family chips
  const familyOptions = useMemo(() => {
    const presentFamilies = Array.from(new Set(taxons.map(t => t.family).filter(Boolean)))
    return [
      { value: 'all', label: `Todas (${taxons.length})` },
      ...presentFamilies.map(f => ({
        value: f,
        label: `${FAMILY_SPANISH[f] || f} (${taxons.filter(t => t.family === f).length})`
      }))
    ]
  }, [taxons])

  // Filtered taxons for visual catalog
  const filteredTaxons = useMemo(() => {
    return taxons.filter(t => {
      if (selectedFamily !== 'all' && t.family !== selectedFamily) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        t.commonName?.toLowerCase().includes(q) ||
        t.genus?.toLowerCase().includes(q) ||
        t.species?.toLowerCase().includes(q) ||
        t.cropCode?.toLowerCase().includes(q) ||
        t.family?.toLowerCase().includes(q)
      )
    })
  }, [taxons, selectedFamily, searchQuery])

  const selectedTaxon = taxons.find(t => t.id === selectedId)
  const activeTraits = selectedTaxon?.traits || (selectedTaxon?.cropCode ? getTraitsForCrop(selectedTaxon.cropCode) : [])
  const {
    assessment: agroAssessment,
    climate,
    isLoadingClimate,
    climateError,
    detectBrowserLocation,
  } = useAgroSuitability(selectedTaxon?.agronomicData)

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Top Navigation Tabs */}
      <SeedBankTabs active="taxons" />

      {/* Main HUD Body */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        {/* Visual Catalog Top Toolbar */}
        <header className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 z-30 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Agile Search Input with GBIF Autocomplete */}
            <div className="relative w-72 sm:w-80">
              <label htmlFor="catalog-search" className="sr-only">Buscar especies</label>
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                id="catalog-search"
                type="text"
                placeholder="Buscar especie en catálogo o GBIF..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 250)}
                autoComplete="off"
                className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl pl-9 pr-8 py-2 border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => {
                    setSearchQuery('')
                    setShowDropdown(false)
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}

              {/* Floating GBIF Autocomplete Results */}
              {showDropdown && searchQuery.trim().length > 2 && (
                <div className="absolute left-0 top-full mt-1.5 w-80 sm:w-96 z-50 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
                  {isLoading && (
                    <div className="p-3.5 text-xs text-slate-500 text-center flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin text-emerald-600" />
                      Consultando GBIF / API botánica...
                    </div>
                  )}
                  {!isLoading && searchResults?.length === 0 && (
                    <div className="p-3.5 text-xs text-slate-500 text-center">
                      No se encontraron especies con ese nombre
                    </div>
                  )}
                  {!isLoading && searchResults?.map(result => (
                    <div
                      key={result.id}
                      onClick={() => handleSelectResult(result)}
                      className="flex items-center gap-2.5 p-2.5 hover:bg-emerald-50/70 border-b border-slate-100 last:border-b-0 cursor-pointer transition"
                    >
                      {result.imageUrl ? (
                        <img
                          src={result.imageUrl}
                          alt={result.commonName || result.scientificName}
                          className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                          <LeafyGreen size={15} />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {result.commonName || result.scientificName}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate">
                          <i>{result.scientificName}</i> ({result.family})
                        </span>
                      </div>
                      <span className="text-[9.5px] font-mono font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200/60 shrink-0">
                        {result.source || 'GBIF'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botanical Categories Filter (HudChipRow) */}
            <div className="hidden sm:block">
              <HudChipRow
                options={familyOptions}
                value={selectedFamily}
                onChange={setSelectedFamily}
              />
            </div>
          </div>

          {/* New Taxon Action Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedId(null)
              setIsFormOpen(true)
              setShowDropdown(false)
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-600/25 active:scale-95 transition cursor-pointer"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Nueva Especie</span>
          </button>
        </header>

        {/* Mobile Filter Chips Row */}
        <div className="sm:hidden px-4 py-2 border-b border-slate-200/80 bg-white/70 overflow-x-auto">
          <HudChipRow
            options={familyOptions}
            value={selectedFamily}
            onChange={setSelectedFamily}
          />
        </div>

        {/* Content Container: Visual Catalog (Left/Center) + HudFlyout (Right) */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* Visual Catalog Grid */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  Catálogo Botánico
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-200/80 text-slate-700">
                  {filteredTaxons.length}
                </span>
              </div>
              {selectedFamily !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedFamily('all')}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer"
                >
                  Mostrar todas
                </button>
              )}
            </div>

            {filteredTaxons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <LeafyGreen size={26} />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1">
                  {taxons.length === 0 ? 'No hay especies registradas' : 'Sin resultados para la búsqueda'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  {taxons.length === 0
                    ? 'Comienza agregando especies al catálogo botánico desde el botón "+ Nueva Especie" o buscando en GBIF.'
                    : 'Prueba buscando con otro término o limpiando los filtros botánicos.'}
                </p>
                {taxons.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(null)
                      setIsFormOpen(true)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                  >
                    <Plus size={14} /> Nueva Especie
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {filteredTaxons.map(t => {
                  const isSelected = selectedId === t.id
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedId(t.id)
                        setIsFormOpen(false)
                        setDeletingId(null)
                      }}
                      className={`group relative flex flex-col rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/90 text-slate-900 shadow-md ring-2 ring-emerald-500/40'
                          : 'border-slate-200/80 bg-white hover:bg-slate-50/80 text-slate-700 hover:text-slate-900 shadow-xs hover:shadow-md'
                      }`}
                    >
                      {/* Top: Photo/Icon + Info + Delete button */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          {t.imageUrl ? (
                            <img
                              src={t.imageUrl}
                              alt={t.commonName || t.genus}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200/90 shadow-xs"
                            />
                          ) : (
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                                isSelected
                                  ? 'bg-white text-emerald-600 border-emerald-200'
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100/60'
                              }`}
                            >
                              <LeafyGreen size={22} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-emerald-800 transition">
                              {t.commonName || `${t.genus} ${t.species}`}
                            </h4>
                            <p className="text-xs text-slate-500 truncate">
                              <i>{t.genus} {t.species}</i>
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {t.family}
                            </span>
                          </div>
                        </div>

                        {/* Right: CropCode badge & Discrete Delete Button */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {t.cropCode && (
                            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider border border-emerald-200/60">
                              {t.cropCode}
                            </span>
                          )}
                          <button
                            type="button"
                            title="Eliminar de la lista"
                            aria-label="Eliminar"
                            data-testid="delete-taxon-sidebar-btn"
                            onClick={e => {
                              e.stopPropagation()
                              remove(t.id)
                              if (selectedId === t.id) setSelectedId(null)
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Card Footer: Quick ecophysiological summary */}
                      <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          {t.agronomicData?.minTemp !== undefined && t.agronomicData?.maxTemp !== undefined ? (
                            <span className="flex items-center gap-1 text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              <Thermometer size={10} className="text-amber-500" />
                              {t.agronomicData.minTemp}° – {t.agronomicData.maxTemp}°C
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Sin datos eco</span>
                          )}
                        </div>
                        {t.traits && t.traits.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                            <Sparkles size={10} />
                            {t.traits.length} descriptores
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </main>

          {/* Right-Side Lateral HudFlyout: Compact Form / Detail Sheet */}
          <AnimatePresence>
            {(isFormOpen || selectedTaxon) && (
              <motion.aside
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full sm:w-[420px] md:w-[460px] p-3 flex flex-col shrink-0 border-l border-slate-200/80 bg-slate-50/90 backdrop-blur-md z-20 h-full overflow-hidden"
              >
                {/* 1. New Taxon Form in HudFlyout */}
                {isFormOpen ? (
                  <HudFlyout
                    icon={<LeafyGreen size={16} />}
                    title="Nueva Especie"
                    subtitle="Alta en Catálogo Taxonómico"
                    closeAriaLabel="Cerrar formulario de nueva especie"
                    onClose={() => {
                      setIsFormOpen(false)
                      setShowDropdown(false)
                    }}
                    className="w-full !max-h-full h-full"
                  >
                    <form onSubmit={handleAdd} className="flex flex-col gap-3 py-1">
                      {/* GBIF Autocomplete Search within form */}
                      <div className="relative">
                        <label htmlFor="formSearchQuery" className="sr-only">Buscar Especie en GBIF</label>
                        <div className="relative">
                          <Search
                            size={14}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          />
                          <input
                            id="formSearchQuery"
                            type="text"
                            placeholder="Buscar en GBIF (ej. Solanum, Zea...)"
                            value={searchQuery}
                            onChange={e => {
                              setSearchQuery(e.target.value)
                              setShowDropdown(true)
                            }}
                            onFocus={() => setShowDropdown(true)}
                            autoComplete="off"
                            className="w-full bg-white text-slate-900 text-xs rounded-xl pl-8 pr-3 py-2 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 outline-none transition"
                          />
                        </div>

                        {showDropdown && searchQuery.trim().length > 2 && (
                          <div className="absolute left-0 top-full mt-1.5 w-full z-50 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                            {isLoading && (
                              <div className="p-3 text-xs text-slate-500 text-center flex items-center justify-center gap-2">
                                <Loader2 size={13} className="animate-spin text-emerald-600" />
                                Consultando GBIF...
                              </div>
                            )}
                            {!isLoading && searchResults?.length === 0 && (
                              <div className="p-3 text-xs text-slate-500 text-center">
                                No se encontraron especies
                              </div>
                            )}
                            {!isLoading && searchResults?.map(result => (
                              <div
                                key={result.id}
                                onClick={() => handleSelectResult(result)}
                                className="flex items-center gap-2 p-2 hover:bg-emerald-50/70 border-b border-slate-100 last:border-b-0 cursor-pointer transition"
                              >
                                {result.imageUrl ? (
                                  <img
                                    src={result.imageUrl}
                                    alt={result.commonName || result.scientificName}
                                    className="w-7 h-7 rounded-md object-cover shrink-0"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <LeafyGreen size={13} />
                                  </div>
                                )}
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-xs font-semibold text-slate-900 truncate">
                                    {result.commonName || result.scientificName}
                                  </span>
                                  <span className="text-[10.5px] text-slate-500 truncate">
                                    <i>{result.scientificName}</i> ({result.family})
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Taxonomic Core Inputs */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Familia</label>
                          <input
                            type="text"
                            value={family}
                            onChange={e => setFamily(e.target.value)}
                            placeholder="Ej. Solanaceae"
                            required
                            className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl px-2.5 py-1.5 border border-slate-200 focus:bg-white focus:border-emerald-500 outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Género</label>
                          <input
                            type="text"
                            value={genus}
                            onChange={e => handleManualGenusChange(e.target.value)}
                            placeholder="Ej. Solanum"
                            required
                            className="w-full bg-white text-slate-900 text-xs rounded-xl px-2.5 py-1.5 border border-slate-200 focus:border-emerald-500 outline-none transition"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Especie</label>
                          <input
                            type="text"
                            value={species}
                            onChange={e => handleManualSpeciesChange(e.target.value)}
                            placeholder="Ej. lycopersicum"
                            required
                            className="w-full bg-white text-slate-900 text-xs rounded-xl px-2.5 py-1.5 border border-slate-200 focus:border-emerald-500 outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nombre Vulgar</label>
                          <input
                            type="text"
                            value={commonName}
                            onChange={e => setCommonName(e.target.value)}
                            placeholder="Ej. Tomate"
                            className="w-full bg-white text-slate-900 text-xs rounded-xl px-2.5 py-1.5 border border-slate-200 focus:border-emerald-500 outline-none transition"
                          />
                        </div>
                      </div>

                      {/* Ontology Resolution Box */}
                      {resolvedCrop ? (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold flex items-center gap-1.5">
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              Ontología: {resolvedCrop.cropName} ({resolvedCrop.cropCode})
                            </span>
                            <span className="text-[9.5px] uppercase font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-900">
                              {resolvedCrop.confidence === 'exact' ? 'Exacto' : resolvedCrop.confidence === 'synonym' ? 'Sinónimo' : 'Género CWR'}
                            </span>
                          </div>
                          {resolvedCrop.notes && <p className="text-[11px] text-emerald-800 mb-1">{resolvedCrop.notes}</p>}
                          <p className="text-[11px] text-emerald-800">
                            <strong>{resolvedTraits.length}</strong> descriptores fenotípicos vinculados automáticamente.
                          </p>
                        </div>
                      ) : (genus || species) ? (
                        <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-start gap-2">
                          <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
                          <span>Sin ontología agronómica específica registrada. Se guardará con sus datos taxonómicos completos.</span>
                        </div>
                      ) : null}

                      {/* Ecophysiological data loading indicator */}
                      {isFetchingDetail && (
                        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin text-blue-600 shrink-0" />
                          <span>Cargando datos ecofisiológicos (FAO EcoCrop)...</span>
                        </div>
                      )}

                      {/* Editable ecophysiological data */}
                      {!isFetchingDetail && (genus || species) && (
                        <fieldset className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200">
                          <legend className="px-1 text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                            <Thermometer size={12} className="text-amber-500" /> Datos ecofisiológicos
                          </legend>
                          {ecocropMatch && (
                            <p className="text-[10.5px] text-slate-500 mb-2">
                              Complementado con FAO EcoCrop: <i>{ecocropMatch}</i>
                            </p>
                          )}
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            {EDITABLE_FIELDS.map(f => {
                              const value = agronomicData?.[f.key]
                              return (
                                <div key={f.key}>
                                  <label
                                    htmlFor={`agro-${f.key}`}
                                    className="block text-[10.5px] font-medium text-slate-600 mb-0.5"
                                  >
                                    {f.label}{f.unit ? ` (${f.unit})` : ''}
                                    <SourceBadge source={agronomicData?.sources?.[f.key]} />
                                  </label>
                                  <input
                                    id={`agro-${f.key}`}
                                    type="number"
                                    step={f.step}
                                    value={typeof value === 'number' ? value : ''}
                                    onChange={e => handleAgronomicEdit(f.key, e.target.value)}
                                    placeholder="—"
                                    className="w-full bg-white text-slate-900 text-xs font-mono rounded-lg px-2 py-1 border border-slate-200 focus:border-emerald-500 outline-none transition"
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </fieldset>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={!genus.trim() || !species.trim() || isFetchingDetail}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm shadow-emerald-600/20 active:scale-98 transition cursor-pointer mt-1"
                      >
                        {isFetchingDetail ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Cargando datos de la especie...</span>
                          </>
                        ) : (
                          <>
                            <Plus size={14} strokeWidth={2.5} />
                            <span>Agregar al Catálogo</span>
                          </>
                        )}
                      </button>
                    </form>
                  </HudFlyout>
                ) : selectedTaxon ? (
                  /* 2. Taxon Detail in HudFlyout */
                  <HudFlyout
                    icon={<LeafyGreen size={16} />}
                    title="Ficha Biológica"
                    subtitle={`${selectedTaxon.family} · ${selectedTaxon.commonName || 'Sin nombre común'}`}
                    closeAriaLabel="Cerrar detalle de especie"
                    onClose={() => {
                      setSelectedId(null)
                      setDeletingId(null)
                    }}
                    className="w-full !max-h-full h-full"
                  >
                    {/* Header: Photo + Scientific Name + CropCode + Inline Delete */}
                    <div className="flex flex-col gap-2.5 pb-3 border-b border-slate-200/80">
                      <div className="flex items-start gap-3">
                        {selectedTaxon.imageUrl ? (
                          <img
                            src={selectedTaxon.imageUrl}
                            alt={selectedTaxon.commonName || selectedTaxon.genus}
                            className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200 shadow-xs"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                            <LeafyGreen size={28} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h2 className="text-base sm:text-lg font-bold text-slate-900 italic leading-snug">
                            {selectedTaxon.genus} {selectedTaxon.species}
                          </h2>
                          <p className="text-xs text-slate-600 font-medium">
                            {selectedTaxon.commonName || 'Sin nombre común registrado'} · <span className="text-slate-400">{selectedTaxon.family}</span>
                          </p>
                          {selectedTaxon.cropCode && (
                            <span className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10.5px] font-semibold font-mono border border-emerald-200/70">
                              <Sparkles size={11} className="text-emerald-600" />
                              {activeTraits.length > 0 ? `Ontología: ${selectedTaxon.cropCode}` : `Prefijo: ${selectedTaxon.cropCode}`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Header Actions: Delete with Inline Confirmation */}
                      <div className="flex items-center justify-end">
                        {deletingId === selectedTaxon.id ? (
                          <div className="flex items-center gap-2 p-1.5 bg-rose-50 border border-rose-200 rounded-xl">
                            <span className="text-xs text-rose-800 font-medium">¿Eliminar especie?</span>
                            <button
                              type="button"
                              onClick={() => {
                                remove(selectedTaxon.id)
                                setSelectedId(null)
                                setDeletingId(null)
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition cursor-pointer"
                            >
                              Sí, eliminar
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 bg-white border border-slate-200 rounded-lg transition cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            data-testid="delete-taxon-header-btn"
                            onClick={() => setDeletingId(selectedTaxon.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-rose-200/80 bg-rose-50/80 hover:bg-rose-100 text-rose-700 text-xs font-medium transition cursor-pointer"
                          >
                            <Trash2 size={12} />
                            <span>Eliminar especie</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Section 1: Taxonomic Data */}
                    <div className="rounded-xl border border-slate-200/80 bg-white/70 p-3 shadow-xs">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Info size={13} className="text-emerald-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                          Información Taxonómica
                        </span>
                      </div>
                      <dl className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <dt className="text-[10px] font-mono text-slate-400">FAMILIA</dt>
                          <dd className="font-semibold text-slate-800">{selectedTaxon.family}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-mono text-slate-400">GÉNERO</dt>
                          <dd className="font-semibold text-slate-800">{selectedTaxon.genus}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-mono text-slate-400">ESPECIE</dt>
                          <dd className="font-semibold text-slate-800">{selectedTaxon.species}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-mono text-slate-400">CÓDIGO CROP</dt>
                          <dd className="font-bold font-mono text-emerald-700">
                            {selectedTaxon.cropCode || 'Sin código'}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Section 2: Agronomic / Ecophysiological Requirements + API Enrichment */}
                    <div className="rounded-xl border border-slate-200/80 bg-white/70 p-3 shadow-xs">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <Sun size={13} className="text-amber-500" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                            Datos Ecofisiológicos
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={isHydrating}
                          onClick={async () => {
                            setIsHydrating(true)
                            try {
                              await hydrateTaxonWithApis(selectedTaxon.id)
                            } finally {
                              setIsHydrating(false)
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2 py-0.5 rounded font-medium border border-emerald-200/60 transition cursor-pointer disabled:opacity-50"
                          title="Consultar y enriquecer con APIs botánicas"
                        >
                          {isHydrating ? (
                            <Loader2 size={10} className="animate-spin text-emerald-600" />
                          ) : (
                            <Sparkles size={10} className="text-emerald-600" />
                          )}
                          <span>Enriquecer APIs</span>
                        </button>
                      </div>

                      {selectedTaxon.agronomicData ? (
                        <dl className="grid grid-cols-2 gap-2 text-xs">
                          {([
                            { min: 'minTemp', max: 'maxTemp', label: 'Temp. absoluta', unit: ' °C', icon: Thermometer },
                            { min: 'optTempMin', max: 'optTempMax', label: 'Temp. óptima', unit: ' °C', icon: Thermometer },
                            { min: 'phMinimum', max: 'phMaximum', label: 'pH absoluto', unit: '', icon: Droplets },
                            { min: 'optPhMin', max: 'optPhMax', label: 'pH óptimo', unit: '', icon: Droplets },
                            { min: 'rainfallMin', max: 'rainfallMax', label: 'Precipitación', unit: ' mm/año', icon: CloudRain },
                            { min: 'cycleDaysMin', max: 'cycleDaysMax', label: 'Ciclo', unit: ' días', icon: CalendarDays },
                          ] as const).map(row => {
                            const a = selectedTaxon.agronomicData!
                            const lo = a[row.min]
                            const hi = a[row.max]
                            if (lo === undefined && hi === undefined) return null
                            const Icon = row.icon
                            const src = a.sources?.[row.min] ?? a.sources?.[row.max]
                            return (
                              <div
                                key={row.label}
                                className="bg-slate-50/80 p-2 rounded-lg border border-slate-200/80 flex flex-col justify-between"
                              >
                                <dt className="text-[10.5px] text-slate-500 mb-1 flex items-center justify-between">
                                  <span className="inline-flex items-center gap-1 font-medium">
                                    <Icon size={11} className="text-slate-400" /> {row.label}
                                  </span>
                                  <SourceBadge source={src} />
                                </dt>
                                <dd className="text-xs font-bold font-mono text-slate-800">
                                  {lo ?? '?'} – {hi ?? '?'}{row.unit}
                                </dd>
                              </div>
                            )
                          })}
                        </dl>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          Sin datos ecofisiológicos registrados para esta especie.
                        </p>
                      )}
                    </div>

                    {/* Section 3: Agroclimatic Suitability Card */}
                    <div className="overflow-hidden rounded-xl">
                      <AgroSuitabilityCard
                        assessment={agroAssessment}
                        climate={climate}
                        isLoading={isLoadingClimate}
                        error={climateError}
                        onDetectLocation={detectBrowserLocation}
                      />
                    </div>

                    {/* Section 4: Ontological Traits Sheet */}
                    <div className="rounded-xl border border-slate-200/80 bg-white/70 p-3 shadow-xs">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <Layers size={13} className="text-emerald-600" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                            Descriptores Fenotípicos ({activeTraits.length})
                          </span>
                        </div>
                        {selectedTaxon.cropCode && (
                          <span className="text-[10.5px] font-mono text-emerald-700 font-semibold">
                            Ontología: {selectedTaxon.cropCode}
                          </span>
                        )}
                      </div>

                      {activeTraits.length === 0 ? (
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-400 text-xs text-center">
                          No hay variables fenotípicas predefinidas para esta especie en el catálogo de ontologías.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {activeTraits.map(trait => (
                            <div
                              key={trait.id}
                              className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/80"
                            >
                              <div className="flex items-start justify-between gap-1 mb-1">
                                <span className="text-xs font-bold text-slate-800">{trait.name}</span>
                                <span className="text-[9px] font-mono uppercase bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                                  {trait.type}
                                </span>
                              </div>
                              {trait.description && (
                                <p className="text-[11px] text-slate-500 mb-1.5">{trait.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-mono">
                                {trait.unit && <span>Unidad: {trait.unit}</span>}
                                {trait.min !== undefined && <span>Mín: {trait.min}</span>}
                                {trait.max !== undefined && <span>Máx: {trait.max}</span>}
                                {trait.options && <span>Opciones: {trait.options.length}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section 5: Internal Metadata */}
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 pt-1">
                      <Database size={11} /> ID Interno: {selectedTaxon.id}
                    </div>
                  </HudFlyout>
                ) : null}
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
