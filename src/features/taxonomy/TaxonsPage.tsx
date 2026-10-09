import React, { useState } from 'react'
import { useTaxonStore } from '@/store/taxonStore'
import { useTaxonomySearch } from '@/hooks/useTaxonomySearch'
import type { TaxonomySearchResult } from '@/services/taxonomy/types'
import { resolveCropOntology, getTraitsForCrop } from '@/domain/ontology/index'
import type { ResolvedCrop } from '@/domain/ontology/cropResolver'
import type { TraitDefinition } from '@/domain/ontology/types'
import type { AgronomicData } from '@/domain/taxon'
import {
  Search, Plus, LeafyGreen, Info, Database, Trash2,
  Sparkles, CheckCircle2, AlertCircle, Thermometer, Droplets, Sun, Layers
} from 'lucide-react'

export function TaxonsPage() {
  const { taxons, add, remove } = useTaxonStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Search state
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

  const handleSelectResult = (result: TaxonomySearchResult) => {
    const resFamily = result.family || 'Desconocida'
    const resGenus = result.genus || ''
    const resSpecies = result.species || ''
    const resCommon = result.commonName || ''

    setFamily(resFamily)
    setGenus(resGenus)
    setSpecies(resSpecies)
    setCommonName(resCommon)
    setImageUrl(result.imageUrl)
    setAgronomicData(result.agronomicData)

    // Resolución automática de Ontología biológica
    const resolution = resolveCropOntology({
      genus: resGenus,
      species: resSpecies,
      commonName: resCommon,
      family: resFamily,
    })

    setResolvedCrop(resolution)
    if (resolution) {
      setResolvedTraits(getTraitsForCrop(resolution.cropCode))
    } else {
      setResolvedTraits([])
    }

    setSearchQuery(result.scientificName)
    setShowDropdown(false)
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

    const newTaxon = add({
      family,
      genus,
      species,
      commonName: commonName.trim() || undefined,
      cropCode: resolvedCrop?.cropCode,
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
    setResolvedCrop(null)
    setResolvedTraits([])
    setSelectedId(newTaxon.id)
  }

  const selectedTaxon = taxons.find(t => t.id === selectedId)
  const activeTraits = selectedTaxon?.traits || (selectedTaxon?.cropCode ? getTraitsForCrop(selectedTaxon.cropCode) : [])

  return (
    <div className="flex h-full animate-in fade-in duration-500">
      {/* Sidebar / Form List */}
      <aside className="w-[440px] flex flex-col border-r border-zinc-200/70 bg-zinc-50/60 overflow-hidden">
        <div className="p-6 border-b border-zinc-200/70 overflow-y-auto max-h-[58vh]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Nueva Especie</h2>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Ontología Auto
            </span>
          </div>

          <form className="space-y-3.5" onSubmit={handleAdd}>
            {/* Autocomplete Search */}
            <div className="relative">
              <label htmlFor="searchQuery" className="sr-only">Buscar Especie en GBIF</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  id="searchQuery"
                  type="text"
                  className="w-full bg-white border border-zinc-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all placeholder:text-zinc-400 shadow-sm"
                  placeholder="Buscar en GBIF (ej. Solanum, Zea...)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 250)}
                  autoComplete="off"
                />
              </div>

              {showDropdown && searchQuery.trim().length > 2 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                  {isLoading && <div className="p-4 text-sm text-zinc-500 text-center animate-pulse">Consultando GBIF / API botánica...</div>}
                  {!isLoading && searchResults?.length === 0 && (
                    <div className="p-4 text-sm text-zinc-500 text-center">No se encontraron especies con ese nombre</div>
                  )}
                  {!isLoading && searchResults?.map(result => (
                    <div
                      key={result.id}
                      className="flex items-center gap-3 p-3 hover:bg-emerald-50/50 cursor-pointer border-b border-zinc-100 last:border-0 transition-colors"
                      onClick={() => handleSelectResult(result)}
                    >
                      {result.imageUrl ? (
                        <img src={result.imageUrl} alt={result.commonName || result.scientificName} className="w-10 h-10 rounded-md object-cover bg-zinc-100 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <LeafyGreen className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-zinc-900 truncate">{result.commonName || result.scientificName}</span>
                        <span className="text-xs text-zinc-500 truncate"><i>{result.scientificName}</i> ({result.family})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Familia</label>
                <input
                  type="text"
                  className="w-full bg-zinc-100/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none"
                  value={family}
                  onChange={(e) => setFamily(e.target.value)}
                  placeholder="Ej. Solanaceae"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Género</label>
                <input
                  type="text"
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={genus}
                  onChange={(e) => handleManualGenusChange(e.target.value)}
                  placeholder="Ej. Solanum"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Especie</label>
                <input
                  type="text"
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={species}
                  onChange={(e) => handleManualSpeciesChange(e.target.value)}
                  placeholder="Ej. lycopersicum"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-700 mb-1 block">Nombre Vulgar</label>
                <input
                  type="text"
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={commonName}
                  onChange={(e) => setCommonName(e.target.value)}
                  placeholder="Ej. Tomate"
                />
              </div>
            </div>

            {/* Ficha de Resolución Automática de Ontología */}
            <div className="mt-2">
              {resolvedCrop ? (
                <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200/80 text-emerald-950">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Ontología: {resolvedCrop.cropName} ({resolvedCrop.cropCode})
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-800">
                      {resolvedCrop.confidence === 'exact' ? 'Exacto' : resolvedCrop.confidence === 'synonym' ? 'Sinónimo' : 'Género CWR'}
                    </span>
                  </div>
                  {resolvedCrop.notes && (
                    <p className="text-[11px] text-emerald-800/90 mb-1.5">{resolvedCrop.notes}</p>
                  )}
                  <p className="text-[11px] text-emerald-700">
                    <strong>{resolvedTraits.length}</strong> descriptores fenotípicos vinculados automáticamente.
                  </p>
                </div>
              ) : (genus || species) ? (
                <div className="p-3 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span>Sin ontología agronómica específica registrada. Se guardará con sus datos taxonómicos completos.</span>
                </div>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={!genus.trim() || !species.trim()}
              className="w-full mt-3 inline-flex items-center justify-center rounded-lg bg-emerald-700 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2 opacity-80" />
              Agregar al Catálogo
            </button>
          </form>
        </div>

        {/* List of registered taxons */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Catálogo Registrado ({taxons.length})
          </div>
          {taxons.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              No hay especies registradas en el catálogo.
            </div>
          ) : (
            taxons.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all border flex items-center justify-between ${
                  selectedId === t.id
                    ? 'bg-white border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/20'
                    : 'bg-transparent border-transparent hover:bg-zinc-100/70'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {t.imageUrl ? (
                    <img src={t.imageUrl} alt={t.commonName || t.genus} className="w-8 h-8 rounded-md object-cover bg-zinc-100 shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <LeafyGreen className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${selectedId === t.id ? 'text-emerald-950' : 'text-zinc-800'}`}>
                      {t.commonName || `${t.genus} ${t.species}`}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      <i>{t.genus} {t.species}</i> ({t.family})
                    </p>
                  </div>
                </div>

                {t.cropCode && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-100/70 text-emerald-800 shrink-0">
                    {t.cropCode}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Details Area */}
      <main className="flex-1 bg-white overflow-y-auto relative">
        {selectedTaxon ? (
          <div className="p-10 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <header className="mb-8 relative flex items-start justify-between">
              <div className="flex items-start gap-5">
                {selectedTaxon.imageUrl ? (
                  <img
                    src={selectedTaxon.imageUrl}
                    alt={selectedTaxon.commonName || selectedTaxon.genus}
                    className="w-20 h-20 rounded-2xl object-cover bg-zinc-100 border border-zinc-200 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <LeafyGreen className="w-10 h-10" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-1">
                    <i>{selectedTaxon.genus} {selectedTaxon.species}</i>
                  </h1>
                  <p className="text-base text-zinc-600 font-medium">
                    {selectedTaxon.commonName || 'Sin nombre común registrado'} · <span className="text-zinc-500 font-normal">{selectedTaxon.family}</span>
                  </p>
                  {selectedTaxon.cropCode && (
                    <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md bg-emerald-100/80 text-emerald-900 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      Ontología Vinculada: {selectedTaxon.cropCode}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de que quieres eliminar esta especie del catálogo?')) {
                    remove(selectedTaxon.id)
                    setSelectedId(null)
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {/* Botanical Info */}
              <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-200/70">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-4">
                  <Info className="w-4 h-4 text-emerald-600" />
                  Información Taxonómica
                </div>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-zinc-500 mb-0.5">Familia</dt>
                    <dd className="font-medium text-zinc-900">{selectedTaxon.family}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500 mb-0.5">Género</dt>
                    <dd className="font-medium text-zinc-900">{selectedTaxon.genus}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500 mb-0.5">Especie</dt>
                    <dd className="font-medium text-zinc-900">{selectedTaxon.species}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500 mb-0.5">Código Crop</dt>
                    <dd className="font-medium text-zinc-900">{selectedTaxon.cropCode || 'Sin código'}</dd>
                  </div>
                </dl>
              </div>

              {/* Agronomic Data */}
              <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-200/70">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-4">
                  <Sun className="w-4 h-4 text-amber-600" />
                  Datos Agronómicos (API)
                </div>
                {selectedTaxon.agronomicData ? (
                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    {selectedTaxon.agronomicData.minTemp !== undefined && (
                      <div>
                        <dt className="text-zinc-500 mb-0.5 flex items-center gap-1"><Thermometer className="w-3 h-3" /> Temp. Mín</dt>
                        <dd className="font-medium text-zinc-900">{selectedTaxon.agronomicData.minTemp} °C</dd>
                      </div>
                    )}
                    {selectedTaxon.agronomicData.maxTemp !== undefined && (
                      <div>
                        <dt className="text-zinc-500 mb-0.5 flex items-center gap-1"><Thermometer className="w-3 h-3" /> Temp. Máx</dt>
                        <dd className="font-medium text-zinc-900">{selectedTaxon.agronomicData.maxTemp} °C</dd>
                      </div>
                    )}
                    {selectedTaxon.agronomicData.phMinimum !== undefined && (
                      <div>
                        <dt className="text-zinc-500 mb-0.5 flex items-center gap-1"><Droplets className="w-3 h-3" /> pH Mín</dt>
                        <dd className="font-medium text-zinc-900">{selectedTaxon.agronomicData.phMinimum}</dd>
                      </div>
                    )}
                    {selectedTaxon.agronomicData.phMaximum !== undefined && (
                      <div>
                        <dt className="text-zinc-500 mb-0.5 flex items-center gap-1"><Droplets className="w-3 h-3" /> pH Máx</dt>
                        <dd className="font-medium text-zinc-900">{selectedTaxon.agronomicData.phMaximum}</dd>
                      </div>
                    )}
                  </dl>
                ) : (
                  <p className="text-xs text-zinc-500">Sin datos ecofisiológicos provistos por la API para esta especie.</p>
                )}
              </div>
            </div>

            {/* Ontology Traits Sheet */}
            <div className="p-6 rounded-xl bg-zinc-50/70 border border-zinc-200/80 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Ficha de Descriptores Fenotípicos ({activeTraits.length})
                </div>
                {selectedTaxon.cropCode && (
                  <span className="text-xs text-emerald-800 font-medium">
                    Crop Ontology: {selectedTaxon.cropCode}
                  </span>
                )}
              </div>

              {activeTraits.length === 0 ? (
                <div className="p-4 rounded-lg bg-zinc-100 text-zinc-500 text-xs">
                  No hay variables fenotípicas predefinidas para esta especie en el catálogo de ontologías.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeTraits.map(trait => (
                    <div key={trait.id} className="p-3 rounded-lg bg-white border border-zinc-200/80 shadow-xs">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-xs font-semibold text-zinc-900">{trait.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 uppercase">
                          {trait.type}
                        </span>
                      </div>
                      {trait.description && (
                        <p className="text-[11px] text-zinc-500 mb-1.5">{trait.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-mono">
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

            {/* Metadata */}
            <div className="text-xs text-zinc-400 font-mono flex items-center gap-2">
              <Database className="w-3.5 h-3.5" /> ID Interno: {selectedTaxon.id}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-400">
            <div className="text-center">
              <LeafyGreen className="w-12 h-12 mx-auto mb-3 opacity-20 text-emerald-600" />
              <p className="text-sm font-medium text-zinc-500">Seleccione una especie para ver su ficha biológica y ontológica</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
