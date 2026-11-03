import { useState } from 'react'
import { useAgroClimateStore } from '@/store/agroClimateStore'
import { daylightHours } from '@/domain/agroclimate/photoperiod'
import { LocationSetupModal } from './LocationSetupModal'
import {
  MapPin, Sun, CloudRain, Snowflake, Wind, Droplets,
  Thermometer, Compass, RefreshCw, Clock
} from 'lucide-react'

function getDayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

interface Props {
  compact?: boolean
  className?: string
}

export function LocationClimateCard({ compact = false, className = '' }: Props) {
  const {
    farmCoordinates,
    currentClimate,
    currentWeather,
    isLoadingClimate,
    loadClimateForCoordinates,
  } = useAgroClimateStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [now] = useState(() => new Date())

  if (!farmCoordinates) return null

  const dayOfYear = getDayOfYear(now)
  const todayPhotoperiod = daylightHours(farmCoordinates.latitude, dayOfYear)
  const currentMonthIdx = now.getMonth()
  const currentMonthNormal = currentClimate?.monthly?.[currentMonthIdx]
  const hemisphereLabel = farmCoordinates.latitude < 0 ? 'Hemisferio Sur' : 'Hemisferio Norte'
  const displayName =
    farmCoordinates.name ||
    currentClimate?.coordinates.name ||
    `Ubicación (${farmCoordinates.latitude.toFixed(2)}°, ${farmCoordinates.longitude.toFixed(2)}°)`

  return (
    <>
      <LocationSetupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <div
        className={`bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-md shadow-slate-900/5 rounded-2xl ${
          compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'
        } flex flex-col gap-3.5 transition-all ${className}`}
      >
        {/* Fila superior: Ubicación aproximada con nombre + Acciones */}
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center flex-shrink-0 text-emerald-700 shadow-xs">
              <MapPin size={18} strokeWidth={2.2} />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  Ubicación Aproximada
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {farmCoordinates.latitude.toFixed(2)}°, {farmCoordinates.longitude.toFixed(2)}°
                  {farmCoordinates.elevation != null ? ` · ${Math.round(farmCoordinates.elevation)} msnm` : ''}
                  {` · ${hemisphereLabel}`}
                </span>
              </div>

              <h3 className={`font-bold text-slate-900 tracking-tight mt-0.5 ${compact ? 'text-base' : 'text-lg'}`}>
                {displayName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadClimateForCoordinates(farmCoordinates)}
              disabled={isLoadingClimate}
              title="Actualizar clima actual"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={12} className={isLoadingClimate ? 'animate-spin' : ''} />
              {isLoadingClimate ? 'Actualizando...' : 'Actualizar clima'}
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Compass size={12} />
              Cambiar ubicación
            </button>
          </div>
        </div>

        {/* Fila inferior: Métricas de Clima Actual en Vivo + Fotoperíodo + Normales Anuales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* 1. Clima Actual (Tiempo Real) */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 flex items-center gap-3">
            <Sun size={20} className="text-amber-600 flex-shrink-0" />
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 block">
                Clima Actual Ahora
              </span>
              {currentWeather ? (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold font-mono text-amber-950">
                      {currentWeather.temperature.toFixed(1)}°C
                    </span>
                    <span className="text-xs font-semibold text-amber-800">
                      {currentWeather.conditionLabel}
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-700 font-mono block">
                    ST {currentWeather.apparentTemperature.toFixed(1)}°C
                  </span>
                </>
              ) : (
                <span className="text-xs text-amber-800">
                  {isLoadingClimate ? 'Consultando estación...' : 'Sin lectura en vivo'}
                </span>
              )}
            </div>
          </div>

          {/* 2. Humedad y Viento Actual */}
          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center gap-3">
            <Droplets size={18} className="text-sky-600 flex-shrink-0" />
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                Humedad y Viento
              </span>
              {currentWeather ? (
                <>
                  <div className="text-sm font-semibold font-mono text-slate-800">
                    {Math.round(currentWeather.humidity)}% HR · {Math.round(currentWeather.windSpeed)} km/h
                  </div>
                  <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                    <Wind size={11} /> Precip. hoy: {currentWeather.precipitation} mm
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </div>
          </div>

          {/* 3. Fotoperíodo y Temperatura Media de este Mes */}
          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center gap-3">
            <Clock size={18} className="text-emerald-600 flex-shrink-0" />
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                Fotoperíodo y Mes
              </span>
              <div className="text-sm font-semibold font-mono text-slate-800">
                {todayPhotoperiod.toFixed(1)} h de luz hoy
              </div>
              {currentMonthNormal ? (
                <span className="text-xs text-slate-500 font-mono inline-flex items-center gap-1">
                  <Thermometer size={11} /> Normal mes: {Math.round(currentMonthNormal.tempMin)}° a {Math.round(currentMonthNormal.tempMax)}°C
                </span>
              ) : (
                <span className="text-xs text-slate-400">Luz solar astronómica</span>
              )}
            </div>
          </div>

          {/* 4. Normales Agroclimáticas Anuales (1991-2020) */}
          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center gap-3">
            <CloudRain size={18} className="text-blue-600 flex-shrink-0" />
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                Régimen Anual (OMM)
              </span>
              {currentClimate ? (
                <>
                  <div className="text-sm font-semibold font-mono text-slate-800">
                    {Math.round(currentClimate.annualRainfall)} mm/año
                  </div>
                  <span className="text-xs text-slate-500 font-mono inline-flex items-center gap-1">
                    <Snowflake size={11} className="text-sky-600" /> {Math.round(currentClimate.annualFrostDays)} días helada/año
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-400">
                  {isLoadingClimate ? 'Calculando normales...' : 'Sin datos'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
