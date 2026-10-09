import React, { useState } from 'react'
import { useLocationStore } from '@/store/locationStore'
import { useIndividualStore } from '@/store/individualStore'
import type { LocationType, FacilityLocation } from '@/domain/location'
import { Map, Plus, Building2, Grid, FlaskConical, Droplets, ArrowRight } from 'lucide-react'

const TYPE_ICONS: Record<LocationType, React.ElementType> = {
  greenhouse: Droplets, // o algo como Sun
  room: Building2,
  field: Map,
  growth_chamber: FlaskConical,
  bench: Grid,
  lab: FlaskConical
}

const TYPE_LABELS: Record<LocationType, string> = {
  greenhouse: 'Invernadero',
  room: 'Sala',
  field: 'Campo Abierto',
  growth_chamber: 'Cámara de Crecimiento',
  bench: 'Mesa / Bancada',
  lab: 'Laboratorio'
}

export function LocationsPage() {
  const { locations, add, remove } = useLocationStore()
  const { individuals } = useIndividualStore()

  const [name, setName] = useState('')
  const [type, setType] = useState<LocationType>('greenhouse')
  const [capacity, setCapacity] = useState('')
  const [description, setDescription] = useState('')
  
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    add({
      name,
      type,
      description,
      capacity: capacity ? Number(capacity) : undefined
    })

    setName('')
    setCapacity('')
    setDescription('')
  }

  return (
    <div className="flex h-full animate-in fade-in duration-500">
      {/* Sidebar Form */}
      <aside className="w-[350px] flex flex-col border-r border-zinc-200/60 bg-zinc-50/50">
        <div className="p-6 border-b border-zinc-200/60">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 mb-6 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-zinc-400" />
            Nueva Ubicación
          </h2>
          
          <form className="space-y-4" onSubmit={handleAdd}>
            <div>
              <label className="text-xs font-medium text-zinc-700 mb-1.5 block">Nombre de Instalación</label>
              <input 
                type="text" 
                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-400 shadow-sm"
                placeholder="Ej. Invernadero A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-zinc-700 mb-1.5 block">Tipo</label>
              <select 
                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all shadow-sm"
                value={type}
                onChange={(e) => setType(e.target.value as LocationType)}
              >
                {Object.entries(TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 mb-1.5 block">Capacidad Máxima (Plantas)</label>
              <input 
                type="number" 
                min="1"
                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-400 shadow-sm"
                placeholder="Opcional"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={!name}
              className="w-full mt-2 inline-flex items-center justify-center rounded-lg bg-zinc-950 text-white px-4 py-2.5 text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2 opacity-70" />
              Crear Ubicación
            </button>
          </form>
        </div>
      </aside>

      {/* Main Map/List */}
      <main className="flex-1 bg-zinc-100/30 overflow-y-auto p-10">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-2">
            Mapa de Instalaciones
          </h1>
          <p className="text-zinc-500">
            Gestiona los espacios físicos donde se alojan los individuos.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.length === 0 ? (
            <div className="col-span-full p-10 text-center border-2 border-dashed border-zinc-200 rounded-2xl">
              <Map className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
              <h3 className="text-sm font-medium text-zinc-900">No hay ubicaciones</h3>
              <p className="text-sm text-zinc-500 mt-1">Crea tu primera sala o invernadero en el panel lateral.</p>
            </div>
          ) : (
            locations.map(loc => {
              const Icon = TYPE_ICONS[loc.type] || Building2
              const indCount = individuals.filter(i => i.locationId === loc.id).length
              const isFull = loc.capacity && indCount >= loc.capacity
              const capacityPercentage = loc.capacity ? Math.min(100, Math.round((indCount / loc.capacity) * 100)) : 0

              return (
                <div key={loc.id} className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <button 
                      onClick={() => {
                        if (confirm('¿Eliminar esta ubicación?')) remove(loc.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-700 transition-opacity"
                    >
                      Eliminar
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-zinc-900 mb-1">{loc.name}</h3>
                  <p className="text-xs text-zinc-500 mb-4">{TYPE_LABELS[loc.type]}</p>

                  <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                    <div className="flex justify-between items-end mb-2">
                      <div className="text-xs font-medium text-zinc-700">Ocupación</div>
                      <div className="text-xs font-semibold text-zinc-900">
                        {indCount} {loc.capacity ? `/ ${loc.capacity}` : 'plantas'}
                      </div>
                    </div>
                    
                    {loc.capacity && (
                      <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${capacityPercentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
