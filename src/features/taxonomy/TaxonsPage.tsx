import React, { useState } from 'react'
import { useTaxonStore } from '@/store/taxonStore'
import { useTaxonomySearch } from '@/hooks/useTaxonomySearch'
import type { TaxonomySearchResult } from '@/services/taxonomy/types'
import { Search, Plus, LeafyGreen, Info, Database, Trash2 } from 'lucide-react'
import { CROP_ONTOLOGY } from '@/domain/ontology/index'

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
  const [cropCode, setCropCode] = useState('')

  const handleSelectResult = (result: TaxonomySearchResult) => {
    setFamily(result.family || 'Desconocida')
    setGenus(result.genus || '')
    setSpecies(result.species || '')
    setCommonName(result.commonName || '')
    
    setCropCode('')
    setSearchQuery(result.scientificName)
    setShowDropdown(false)
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!family.trim() || !genus.trim() || !species.trim()) return
    
    const newTaxon = add({
      family,
      genus,
      species,
      commonName,
      cropCode: cropCode.trim().toUpperCase()
    })
    
    setSearchQuery('')
    setFamily('')
    setGenus('')
    setSpecies('')
    setCommonName('')
    setCropCode('')
    setSelectedId(newTaxon.id)
  }

  const selectedTaxon = taxons.find(t => t.id === selectedId)

  return (
    <div className="flex h-full animate-in fade-in duration-500">
      {/* Sidebar / Form List */}
      <aside className="w-[400px] flex flex-col border-r border-zinc-200/60 bg-zinc-50/50">
        <div className="p-6 border-b border-zinc-200/60">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 mb-6">Nueva Especie</h2>
          
          <form className="space-y-4" onSubmit={handleAdd}>
            {/* Autocomplete Search */}
            <div className="relative">
              <label htmlFor="searchQuery" className="sr-only">Buscar Especie</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  id="searchQuery"
                  type="text" 
                  className="w-full bg-white border border-zinc-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-400 shadow-sm"
                  placeholder="Buscar en GBIF (ej. Solanum...)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  autoComplete="off"
                />
              </div>
              
              {showDropdown && searchQuery.trim().length > 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                  {isLoading && <div className="p-4 text-sm text-zinc-500 text-center animate-pulse">Buscando...</div>}
                  {!isLoading && searchResults?.length === 0 && (
                    <div className="p-4 text-sm text-zinc-500 text-center">No hay resultados</div>
                  )}
                  {!isLoading && searchResults?.map(result => (
                    <div 
                      key={result.id} 
                      className="flex items-center gap-3 p-3 hover:bg-zinc-50 cursor-pointer border-b border-zinc-100 last:border-0"
                      onClick={() => handleSelectResult(result)}
                    >
                      {result.imageUrl ? (
                        <img src={result.imageUrl} alt={result.commonName} className="w-10 h-10 rounded-md object-cover bg-zinc-100 shrink-0" />
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
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Familia</label>
                <input 
                  type="text"
                  className="w-full bg-zinc-100/50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-600 cursor-not-allowed focus:outline-none"
                  value={family}
                  readOnly
                  placeholder="-"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Género</label>
                <input 
                  type="text"
                  className="w-full bg-zinc-100/50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-600 cursor-not-allowed focus:outline-none"
                  value={genus}
                  readOnly
                  placeholder="-"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Especie</label>
                <input 
                  type="text"
                  className="w-full bg-zinc-100/50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-600 cursor-not-allowed focus:outline-none"
                  value={species}
                  readOnly
                  placeholder="-"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-700 mb-1.5 block">Nombre Vulgar</label>
                <input 
                  type="text"
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-400 shadow-sm"
                  value={commonName}
                  onChange={(e) => setCommonName(e.target.value)}
                  placeholder="Ej. Tomate"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 mb-1.5 block">Crop Code (Ontología)</label>
              <select 
                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all shadow-sm"
                value={cropCode}
                onChange={(e) => setCropCode(e.target.value)}
                required
              >
                <option value="" disabled>Seleccione el Código...</option>
                <option value="UNKNOWN">Sin Código Específico / Otro</option>
                {Object.keys(CROP_ONTOLOGY).sort().map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              disabled={!genus || !species}
              className="w-full mt-2 inline-flex items-center justify-center rounded-lg bg-zinc-950 text-white px-4 py-2.5 text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2 opacity-70" />
              Agregar al Catálogo
            </button>
          </form>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Catálogo Registrado
          </div>
          {taxons.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-500">
              No hay especies registradas.
            </div>
          ) : (
            taxons.map(t => (
              <div 
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all border ${
                  selectedId === t.id 
                    ? 'bg-white border-zinc-200 shadow-sm' 
                    : 'bg-transparent border-transparent hover:bg-zinc-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${selectedId === t.id ? 'text-zinc-900' : 'text-zinc-700'}`}>
                    {t.commonName || `${t.genus} ${t.species}`}
                  </span>
                  {t.cropCode && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                      {t.cropCode}
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 truncate">
                  <i>{t.genus} {t.species}</i>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Details Area */}
      <main className="flex-1 bg-white overflow-y-auto relative">
        {selectedTaxon ? (
          <div className="p-10 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <header className="mb-10 relative">
              <div className="absolute right-0 top-0">
                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de que quieres eliminar esta especie del catálogo?')) {
                      remove(selectedTaxon.id)
                      setSelectedId(null)
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
              
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 mb-6">
                <LeafyGreen className="w-6 h-6" />
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 mb-2">
                {selectedTaxon.genus} {selectedTaxon.species}
              </h1>
              <p className="text-lg text-zinc-500">
                {selectedTaxon.commonName || 'Sin nombre común'}
              </p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 mb-4">
                  <Info className="w-4 h-4 text-zinc-400" />
                  Información Botánica
                </div>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-xs text-zinc-500 mb-1">Familia</dt>
                    <dd className="text-sm font-medium text-zinc-900">{selectedTaxon.family}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500 mb-1">Código de Cultivo</dt>
                    <dd className="text-sm font-medium text-zinc-900">{selectedTaxon.cropCode || '-'}</dd>
                  </div>
                </dl>
              </div>
              
              <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
                 <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 mb-4">
                  <Database className="w-4 h-4 text-zinc-400" />
                  Metadatos
                </div>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-xs text-zinc-500 mb-1">ID Interno</dt>
                    <dd className="text-xs font-mono text-zinc-600 bg-zinc-200/50 px-2 py-1 rounded inline-block">{selectedTaxon.id}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-400">
            <div className="text-center">
              <LeafyGreen className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">Seleccione una especie para ver los detalles</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
