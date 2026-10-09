import React, { useState } from 'react'
import { useAccessionStore } from '@/store/accessionStore'
import { useIndividualStore } from '@/store/individualStore'
import { useTaxonStore } from '@/store/taxonStore'
import { Dna, GitMerge, Search, Plus, Leaf, ArrowRight } from 'lucide-react'

export function BreedingPage() {
  const { accessions, add: addAccession } = useAccessionStore()
  const { individuals } = useIndividualStore()
  const { taxons } = useTaxonStore()

  const [maternalId, setMaternalId] = useState('')
  const [paternalId, setPaternalId] = useState('')
  const [newAccessionNumber, setNewAccessionNumber] = useState('')
  const [crossType, setCrossType] = useState('controlled')
  const [remarks, setRemarks] = useState('')

  const handleCross = (e: React.FormEvent) => {
    e.preventDefault()
    if (!maternalId || !newAccessionNumber.trim()) return

    const maternalAcc = accessions.find(a => a.id === maternalId)
    const paternalAcc = accessions.find(a => a.id === paternalId)

    const pedigreeStr = paternalAcc 
      ? `${maternalAcc?.accessionNumber} x ${paternalAcc.accessionNumber}`
      : `${maternalAcc?.accessionNumber} (Open/Self)`

    addAccession({
      accessionNumber: newAccessionNumber,
      taxonId: maternalAcc?.taxonId || '', // asumimos misma especie
      acquisitionSource: 'breeding',
      pedigree: pedigreeStr,
      maternalAccessionId: maternalId,
      paternalAccessionId: paternalId || undefined,
      remarks: `Cruzamiento de tipo: ${crossType}. ${remarks}`
    })

    setMaternalId('')
    setPaternalId('')
    setNewAccessionNumber('')
    setRemarks('')
    alert(`¡Cruzamiento registrado! Nueva accesión ${newAccessionNumber} creada exitosamente.`)
  }

  // Obtenemos solo accesiones que tengan individuos activos, o listamos todas para simplificar
  // Para breeding a nivel accesión (cruzamiento poblacional)
  
  return (
    <div className="flex h-full animate-in fade-in duration-500 bg-zinc-50/30">
      {/* Sidebar Form */}
      <aside className="w-[450px] flex flex-col border-r border-zinc-200/60 bg-white shadow-sm z-10 relative">
        <div className="p-8 border-b border-zinc-200/60 bg-white">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pink-50 text-pink-600 mb-6">
            <GitMerge className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-2">Nuevo Cruzamiento</h2>
          <p className="text-sm text-zinc-500 mb-8">
            Registra una hibridación para generar una nueva Accesión (línea genética).
          </p>
          
          <form className="space-y-6" onSubmit={handleCross}>
            {/* Maternal */}
            <div className="p-4 rounded-xl border border-pink-100 bg-pink-50/30 relative">
              <div className="absolute -left-3 top-4 w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold shadow-sm border border-pink-200">♀</div>
              <label className="text-xs font-bold text-pink-800 mb-2 block ml-2 uppercase tracking-wider">Parental Materno (Madre)</label>
              <select 
                className="w-full bg-white border border-pink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all shadow-sm"
                value={maternalId}
                onChange={(e) => setMaternalId(e.target.value)}
                required
              >
                <option value="" disabled>Seleccione accesión madre...</option>
                {accessions.map(a => (
                  <option key={a.id} value={a.id}>{a.accessionNumber}</option>
                ))}
              </select>
            </div>
            
            {/* Paternal */}
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 relative">
              <div className="absolute -left-3 top-4 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shadow-sm border border-blue-200">♂</div>
              <label className="text-xs font-bold text-blue-800 mb-2 block ml-2 uppercase tracking-wider">Parental Paterno (Padre)</label>
              <select 
                className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                value={paternalId}
                onChange={(e) => setPaternalId(e.target.value)}
              >
                <option value="">(Ninguno / Polinización Abierta / Self)</option>
                {accessions.filter(a => a.id !== maternalId).map(a => (
                  <option key={a.id} value={a.id}>{a.accessionNumber}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center py-2">
              <ArrowRight className="w-5 h-5 text-zinc-300 transform rotate-90" />
            </div>

            {/* Resultado */}
            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30">
              <label className="text-xs font-bold text-emerald-800 mb-2 block uppercase tracking-wider">Accesión Resultante (F1)</label>
              <input 
                type="text" 
                className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-emerald-300 shadow-sm mb-3 font-mono"
                placeholder="Ej. F1-TOM-2026-A"
                value={newAccessionNumber}
                onChange={(e) => setNewAccessionNumber(e.target.value)}
                required
              />

              <label className="text-xs font-medium text-emerald-700 mb-1.5 block">Tipo de Cruzamiento</label>
              <select 
                className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm mb-3"
                value={crossType}
                onChange={(e) => setCrossType(e.target.value)}
              >
                <option value="controlled">Controlado (Manual)</option>
                <option value="open_pollinated">Polinización Abierta</option>
                <option value="self">Autofecundación (Selfing)</option>
              </select>

              <label className="text-xs font-medium text-emerald-700 mb-1.5 block">Notas del Cruzamiento</label>
              <textarea 
                className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm min-h-[80px]"
                placeholder="Observaciones de la polinización..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={!maternalId || !newAccessionNumber}
              className="w-full mt-4 inline-flex items-center justify-center rounded-xl bg-zinc-950 text-white px-4 py-3 text-sm font-medium hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              <GitMerge className="w-4 h-4 mr-2" />
              Generar Nueva Accesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main Area: Árbol Genealógico / Lista de Cruces Recientes */}
      <main className="flex-1 overflow-y-auto p-10 relative">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-2">
            Historial de Hibridación
          </h1>
          <p className="text-zinc-500">
            Accesiones generadas a partir de programas de cría internos.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accessions.filter(a => a.acquisitionSource === 'breeding').length === 0 ? (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-zinc-200 rounded-3xl bg-white/50">
              <Dna className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
              <h3 className="text-lg font-medium text-zinc-900 mb-1">Sin Hibridaciones</h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                No has registrado ningún cruzamiento todavía. Utiliza el panel izquierdo para registrar tu primera cruza controlada.
              </p>
            </div>
          ) : (
            accessions.filter(a => a.acquisitionSource === 'breeding').map(acc => {
              const taxon = taxons.find(t => t.id === acc.taxonId)
              
              return (
                <div key={acc.id} className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold font-mono border border-emerald-100">
                      F1 / BREED
                    </div>
                    <Leaf className="w-4 h-4 text-zinc-300" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-zinc-900 mb-1">{acc.accessionNumber}</h3>
                  <p className="text-sm text-zinc-500 italic mb-4">{taxon ? `${taxon.genus} ${taxon.species}` : 'Taxón Desconocido'}</p>

                  <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100 mb-4">
                    <div className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">Pedigree</div>
                    <div className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
                      <GitMerge className="w-4 h-4 text-pink-500" />
                      {acc.pedigree || 'Desconocido'}
                    </div>
                  </div>

                  {acc.remarks && (
                    <p className="text-xs text-zinc-500 line-clamp-2">
                      {acc.remarks}
                    </p>
                  )}
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
