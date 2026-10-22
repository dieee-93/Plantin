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
}

export function LocationClimateCard({ compact = false }: Props) {
  const {
    farmCoordinates,
    currentClimate,
    currentWeather,
    isLoadingClimate,
    loadClimateForCoordinates,
  } = useAgroClimateStore()
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!farmCoordinates) return null

  const dayOfYear = getDayOfYear()
  const todayPhotoperiod = daylightHours(farmCoordinates.latitude, dayOfYear)
  const currentMonthIdx = new Date().getMonth()
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
        style={{
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: compact ? '14px 16px' : '18px 22px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Fila superior: Ubicación aproximada con nombre + Acciones */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-light)',
                border: '1px solid #b7e4c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MapPin size={18} color="var(--accent)" strokeWidth={2.2} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'var(--surface-subtle)',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  Ubicación Aproximada
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {farmCoordinates.latitude.toFixed(2)}°, {farmCoordinates.longitude.toFixed(2)}°
                  {farmCoordinates.elevation != null ? ` · ${Math.round(farmCoordinates.elevation)} msnm` : ''}
                  {` · ${hemisphereLabel}`}
                </span>
              </div>

              <h3
                style={{
                  fontSize: compact ? 15 : 17,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  marginTop: 3,
                }}
              >
                {displayName}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => loadClimateForCoordinates(farmCoordinates)}
              disabled={isLoadingClimate}
              title="Actualizar clima actual"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--surface-subtle)',
                color: 'var(--text-secondary)',
                fontSize: 11.5,
                fontWeight: 500,
                cursor: isLoadingClimate ? 'wait' : 'pointer',
              }}
            >
              <RefreshCw size={12} className={isLoadingClimate ? 'animate-spin' : ''} />
              {isLoadingClimate ? 'Actualizando...' : 'Actualizar clima'}
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 11px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #b7e4c7',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Compass size={12} />
              Cambiar ubicación
            </button>
          </div>
        </div>

        {/* Fila inferior: Métricas de Clima Actual en Vivo + Fotoperíodo + Normales Anuales */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
            gap: 10,
          }}
        >
          {/* 1. Clima Actual (Tiempo Real) */}
          <div
            style={{
              padding: '10px 13px',
              borderRadius: 'var(--radius-md)',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Sun size={20} color="#d97706" style={{ flexShrink: 0 }} />
            <div>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#92400e',
                  display: 'block',
                }}
              >
                Clima Actual Ahora
              </span>
              {currentWeather ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#78350f' }}>
                      {currentWeather.temperature.toFixed(1)}°C
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#92400e' }}>
                      {currentWeather.conditionLabel}
                    </span>
                  </div>
                  <span style={{ fontSize: 10.5, color: '#b45309', fontFamily: 'var(--font-mono)' }}>
                    ST {currentWeather.apparentTemperature.toFixed(1)}°C
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 12, color: '#92400e' }}>
                  {isLoadingClimate ? 'Consultando estación...' : 'Sin lectura en vivo'}
                </span>
              )}
            </div>
          </div>

          {/* 2. Humedad y Viento Actual */}
          <div
            style={{
              padding: '10px 13px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Droplets size={18} color="#0284c7" style={{ flexShrink: 0 }} />
            <div>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                  display: 'block',
                }}
              >
                Humedad y Viento
              </span>
              {currentWeather ? (
                <>
                  <div style={{ fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {Math.round(currentWeather.humidity)}% HR · {Math.round(currentWeather.windSpeed)} km/h
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Wind size={11} /> Precip. hoy: {currentWeather.precipitation} mm
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>—</span>
              )}
            </div>
          </div>

          {/* 3. Fotoperíodo y Temperatura Media de este Mes */}
          <div
            style={{
              padding: '10px 13px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Clock size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
            <div>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                  display: 'block',
                }}
              >
                Fotoperíodo y Mes
              </span>
              <div style={{ fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {todayPhotoperiod.toFixed(1)} h de luz hoy
              </div>
              {currentMonthNormal ? (
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Thermometer size={11} /> Normal mes: {Math.round(currentMonthNormal.tempMin)}° a {Math.round(currentMonthNormal.tempMax)}°C
                </span>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Luz solar astronómica</span>
              )}
            </div>
          </div>

          {/* 4. Normales Agroclimáticas Anuales (1991-2020) */}
          <div
            style={{
              padding: '10px 13px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <CloudRain size={18} color="#2563eb" style={{ flexShrink: 0 }} />
            <div>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                  display: 'block',
                }}
              >
                Régimen Anual (OMM)
              </span>
              {currentClimate ? (
                <>
                  <div style={{ fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {Math.round(currentClimate.annualRainfall)} mm/año
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Snowflake size={11} color="#0284c7" /> {Math.round(currentClimate.annualFrostDays)} días helada/año
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
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
