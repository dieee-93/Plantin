import React, { useState, useEffect } from 'react'
import { useAgroClimateStore } from '@/store/agroClimateStore'
import { searchLocations, type GeocodingResult } from '@/services/climate/geocodingClient'
import { isValidCoordinates } from '@/domain/location'
import {
  MapPin, Navigation, Search, Sun, CloudRain, Snowflake,
  X, CheckCircle2, AlertTriangle, Loader2
} from 'lucide-react'

interface Props {
  /** Si se pasa isOpen=true, permite abrir el modal manualmente para cambiar una ubicación ya existente. */
  isOpen?: boolean
  onClose?: () => void
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '8px 12px',
  fontSize: 13,
  color: 'var(--text-primary)',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: 11.5,
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: 4,
}

export function LocationSetupModal({ isOpen, onClose }: Props) {
  const {
    farmCoordinates,
    isLoadingClimate,
    climateError,
    setFarmCoordinates,
    detectBrowserLocation,
  } = useAgroClimateStore()

  // Es obligatorio (gate inicial) cuando no hay farmCoordinates configuradas
  const isMandatoryGate = !farmCoordinates
  const shouldRender = isMandatoryGate || Boolean(isOpen)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const [placeName, setPlaceName] = useState(farmCoordinates?.name ?? '')
  const [latitude, setLatitude] = useState(farmCoordinates ? String(farmCoordinates.latitude) : '')
  const [longitude, setLongitude] = useState(farmCoordinates ? String(farmCoordinates.longitude) : '')
  const [elevation, setElevation] = useState(
    farmCoordinates?.elevation != null ? String(farmCoordinates.elevation) : '',
  )
  const [localError, setLocalError] = useState<string | null>(null)
  const [isDetectingGps, setIsDetectingGps] = useState(false)

  useEffect(() => {
    if (farmCoordinates) {
      setPlaceName(farmCoordinates.name ?? '')
      setLatitude(String(farmCoordinates.latitude))
      setLongitude(String(farmCoordinates.longitude))
      setElevation(farmCoordinates.elevation != null ? String(farmCoordinates.elevation) : '')
    }
  }, [farmCoordinates])

  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    let cancelled = false
    setIsSearching(true)
    searchLocations(q)
      .then((res) => {
        if (!cancelled) {
          setSearchResults(res)
          setIsSearching(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSearchResults([])
          setIsSearching(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [searchQuery])

  if (!shouldRender) return null

  const handleDetectGps = async () => {
    setLocalError(null)
    setIsDetectingGps(true)
    try {
      const coords = await detectBrowserLocation()
      if (coords && placeName.trim()) {
        setFarmCoordinates({ ...coords, name: placeName.trim() })
      }
      onClose?.()
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'No se pudo obtener la ubicación GPS.')
    } finally {
      setIsDetectingGps(false)
    }
  }

  const handleSelectCity = (city: GeocodingResult) => {
    const formattedName = [city.name, city.admin1, city.country].filter(Boolean).join(', ')
    setFarmCoordinates({
      name: formattedName,
      latitude: city.latitude,
      longitude: city.longitude,
      elevation: city.elevation,
    })
    setSearchQuery('')
    setSearchResults([])
    setLocalError(null)
    onClose?.()
  }

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    const latNum = Number(latitude)
    const lonNum = Number(longitude)
    const eleNum = elevation.trim() ? Number(elevation) : undefined

    if (!latitude.trim() || !longitude.trim() || !isValidCoordinates({ latitude: latNum, longitude: lonNum })) {
      setLocalError('Ingresa coordenadas válidas: Latitud entre -90 y 90, Longitud entre -180 y 180.')
      return
    }

    setFarmCoordinates({
      name: placeName.trim() || undefined,
      latitude: latNum,
      longitude: lonNum,
      elevation: eleNum,
    })
    onClose?.()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-setup-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '26px 28px',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MapPin size={20} color="var(--accent)" strokeWidth={2.2} />
            </div>
            <div>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: isMandatoryGate ? '#fef3c7' : 'var(--surface-subtle)',
                  color: isMandatoryGate ? '#92400e' : 'var(--text-tertiary)',
                  display: 'inline-block',
                  marginBottom: 4,
                }}
              >
                {isMandatoryGate ? 'Requisito Inicial de la App' : 'Configuración Agroclimática'}
              </span>
              <h2
                id="location-setup-title"
                style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}
              >
                Configura la ubicación de tu cultivo
              </h2>
            </div>
          </div>

          {!isMandatoryGate && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cancelar"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
          Plantin utiliza la ubicación de tu establecimiento para calcular el <strong>fotoperíodo</strong>, el{' '}
          <strong>régimen de lluvias y heladas (1991–2020)</strong> y recomendar la{' '}
          <strong>ventana óptima de siembra</strong> e instalación ideal (campo abierto, invernadero o cámara) para cada especie.
        </p>

        {/* Beneficios rápidos */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginBottom: 18,
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            fontSize: 11.5,
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sun size={13} color="#d97706" />
            <span>Fotoperíodo y Temp.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Snowflake size={13} color="#0284c7" />
            <span>Riesgo de Heladas</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CloudRain size={13} color="#2563eb" />
            <span>Calendario de Siembra</span>
          </div>
        </div>

        {/* Opción 1: GPS Automático */}
        <div style={{ marginBottom: 18 }}>
          <button
            type="button"
            onClick={handleDetectGps}
            disabled={isDetectingGps || isLoadingClimate}
            className="btn-press"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '11px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent)',
              color: 'white',
              fontSize: 13.5,
              fontWeight: 600,
              border: 'none',
              cursor: isDetectingGps || isLoadingClimate ? 'wait' : 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {isDetectingGps || isLoadingClimate ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Obteniendo coordenadas y perfil climático...
              </>
            ) : (
              <>
                <Navigation size={15} />
                Detectar mi ubicación actual (GPS)
              </>
            )}
          </button>
        </div>

        {/* Opción 2: Buscar Ciudad / Localidad */}
        <div style={{ marginBottom: 18, position: 'relative' }}>
          <label htmlFor="city-search-input" style={LABEL_STYLE}>
            O buscar por ciudad / localidad
          </label>
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              color="var(--text-tertiary)"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
            <input
              id="city-search-input"
              type="text"
              style={{ ...INPUT_STYLE, paddingLeft: 32 }}
              placeholder="Buscar ciudad o localidad (ej. Buenos Aires, Mendoza, Madrid...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </div>

          {(isSearching || searchResults.length > 0) && (
            <div
              style={{
                marginTop: 6,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'var(--surface-elevated)',
                boxShadow: 'var(--shadow-md)',
                maxHeight: 190,
                overflowY: 'auto',
              }}
            >
              {isSearching ? (
                <div style={{ padding: 12, fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                  Buscando localidades...
                </div>
              ) : (
                searchResults.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleSelectCity(city)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '9px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                        {city.name}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                        {[city.admin1, city.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Opción 3: Coordenadas Manuales */}
        <form
          onSubmit={handleManualSave}
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-tertiary)',
            }}
          >
            O ingresar coordenadas manualmente
          </span>

          <div>
            <label htmlFor="setup-place-name" style={LABEL_STYLE}>
              Nombre del lugar o ciudad (opcional)
            </label>
            <input
              id="setup-place-name"
              type="text"
              style={INPUT_STYLE}
              placeholder="Ej. Estación Experimental Pergamino"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div>
              <label htmlFor="setup-lat-input" style={LABEL_STYLE}>
                Latitud *
              </label>
              <input
                id="setup-lat-input"
                type="number"
                step="any"
                min="-90"
                max="90"
                style={{ ...INPUT_STYLE, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                placeholder="-34.60"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="setup-lon-input" style={LABEL_STYLE}>
                Longitud *
              </label>
              <input
                id="setup-lon-input"
                type="number"
                step="any"
                min="-180"
                max="180"
                style={{ ...INPUT_STYLE, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                placeholder="-58.38"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="setup-ele-input" style={LABEL_STYLE}>
                Altitud (m)
              </label>
              <input
                id="setup-ele-input"
                type="number"
                step="1"
                style={{ ...INPUT_STYLE, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                placeholder="25"
                value={elevation}
                onChange={(e) => setElevation(e.target.value)}
              />
            </div>
          </div>

          {(localError || climateError) && (
            <div
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span>{localError || climateError}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            {!isMandatoryGate && onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-elevated)',
                  color: 'var(--text-secondary)',
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                background: 'var(--surface-elevated)',
                color: 'var(--text-primary)',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <CheckCircle2 size={13} color="var(--accent)" />
              Guardar Ubicación
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
