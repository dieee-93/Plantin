import React, { useState, useEffect, useContext } from 'react'
import { useAgroClimateStore } from '@/store/agroClimateStore'
import { useTaxonStore } from '@/store/taxonStore'
import { searchLocations, type GeocodingResult } from '@/services/climate/geocodingClient'
import { isValidCoordinates } from '@/domain/location'
import { useTaxonomySearch } from '@/hooks/useTaxonomySearch'
import { enrichTaxonomySearchResult, selectOrCreatePresetTaxon } from '@/services/taxonomy/taxonEnrichment'
import { STARTER_SPECIES_PRESETS, type StarterSpeciesPreset } from '@/domain/propagationForm'
import type { TaxonomySearchResult } from '@/services/taxonomy/types'
import { QueryClient, QueryClientContext, QueryClientProvider } from '@tanstack/react-query'
import {
  MapPin, Navigation, Search, Sun, CloudRain, Snowflake,
  X, CheckCircle2, AlertTriangle, Loader2, Plus, Check, ArrowRight
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

const modalFallbackQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

function SafeQueryWrapper({ children }: { children: React.ReactNode }) {
  const client = useContext(QueryClientContext)
  if (client) {
    return <>{children}</>
  }
  return <QueryClientProvider client={modalFallbackQueryClient}>{children}</QueryClientProvider>
}

interface SpeciesStepContentProps {
  onBackToLocation: () => void
  onFinish: () => void
}

function SpeciesStepContent({ onBackToLocation, onFinish }: SpeciesStepContentProps) {
  const { taxons, add, remove } = useTaxonStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingSearchResult, setIsAddingSearchResult] = useState(false)
  const { data: searchResults, isLoading: isSearching } = useTaxonomySearch(searchQuery)

  const isCropSelected = (genus: string, species: string) => {
    return taxons.some(
      (t) => t.genus.toLowerCase() === genus.toLowerCase() && t.species.toLowerCase() === species.toLowerCase(),
    )
  }

  const handleTogglePreset = (preset: StarterSpeciesPreset) => {
    const existing = taxons.find(
      (t) => t.genus.toLowerCase() === preset.genus.toLowerCase() && t.species.toLowerCase() === preset.species.toLowerCase(),
    )
    if (existing) {
      remove(existing.id)
    } else {
      selectOrCreatePresetTaxon(preset)
    }
  }

  const handleSelectSearchResult = async (result: TaxonomySearchResult) => {
    setIsAddingSearchResult(true)
    try {
      const enriched = await enrichTaxonomySearchResult(result)
      add({
        family: enriched.family,
        genus: enriched.genus,
        species: enriched.species,
        commonName: enriched.commonName,
        cropCode: enriched.cropCode,
        imageUrl: enriched.imageUrl,
        agronomicData: enriched.agronomicData,
        traits: enriched.traits,
      })
      setSearchQuery('')
    } catch {
      // fallback
    } finally {
      setIsAddingSearchResult(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2
          id="species-setup-title"
          style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}
        >
          Selecciona las especies con las que vas a trabajar
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4 }}>
          Elige especies frecuentes con un clic o busca cualquier variedad botánica en GBIF y FAO EcoCrop para cargar automáticamente sus perfiles fenotípicos y requerimientos bioclimáticos.
        </p>
      </div>

      {/* Especies Frecuentes */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-tertiary)',
            }}
          >
            Especies Frecuentes (Selección Rápida)
          </span>
          <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            {taxons.length} seleccionada{taxons.length === 1 ? '' : 's'}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 8,
          }}
        >
          {STARTER_SPECIES_PRESETS.map((crop) => {
            const selected = isCropSelected(crop.genus, crop.species)
            return (
              <button
                key={crop.cropCode + crop.genus}
                type="button"
                onClick={() => handleTogglePreset(crop)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: selected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  background: selected ? 'var(--accent-light)' : 'var(--surface-subtle)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: selected ? 'var(--accent)' : 'var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: 'white',
                  }}
                >
                  {selected ? <Check size={12} strokeWidth={3} /> : <Plus size={12} color="var(--text-tertiary)" />}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12.5,
                      fontWeight: selected ? 600 : 500,
                      color: selected ? 'var(--accent)' : 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {crop.commonName}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-tertiary)',
                      fontStyle: 'italic',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {crop.genus} {crop.species}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Buscador Botánico GBIF + FAO EcoCrop */}
      <div style={{ marginBottom: 20, position: 'relative' }}>
        <label htmlFor="species-search-input" style={LABEL_STYLE}>
          O buscar cualquier otra especie (GBIF / FAO EcoCrop)
        </label>
        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            color="var(--text-tertiary)"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            id="species-search-input"
            type="text"
            style={{ ...INPUT_STYLE, paddingLeft: 32 }}
            placeholder="Buscar por nombre científico o común (ej. Fragaria, Ocimum, Manzano...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
          {(isSearching || isAddingSearchResult) && (
            <Loader2
              size={14}
              className="animate-spin"
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }}
            />
          )}
        </div>

        {searchQuery.trim().length > 2 && searchResults && searchResults.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 30,
              marginTop: 4,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--surface-elevated)',
              boxShadow: 'var(--shadow-md)',
              maxHeight: 180,
              overflowY: 'auto',
            }}
          >
            {searchResults.map((item) => {
              const alreadyInStore = isCropSelected(item.genus || '', item.species || '')
              return (
                <button
                  key={item.id + item.scientificName}
                  type="button"
                  disabled={alreadyInStore || isAddingSearchResult}
                  onClick={() => handleSelectSearchResult(item)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    cursor: alreadyInStore ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    opacity: alreadyInStore ? 0.6 : 1,
                  }}
                >
                  <div>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                      {item.scientificName} {item.commonName ? `(${item.commonName})` : ''}
                    </span>
                    <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                      Familia: {item.family || 'Desconocida'} · Fuente: {item.source}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: alreadyInStore ? '#059669' : 'var(--accent)' }}>
                    {alreadyInStore ? 'Agregada ✓' : '+ Agregar'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Lista de especies añadidas */}
      {taxons.length > 0 && (
        <div
          style={{
            marginBottom: 20,
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-tertiary)',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Especies listas en tu catálogo ({taxons.length}):
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {taxons.map((t) => (
              <span
                key={t.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  fontSize: 11.5,
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                }}
              >
                <span>{t.commonName || `${t.genus} ${t.species}`}</span>
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Quitar especie"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Acciones del Paso 2 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 10 }}>
        <button
          type="button"
          onClick={onBackToLocation}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--surface-elevated)',
            color: 'var(--text-secondary)',
            fontSize: 12.5,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          ← Volver a Ubicación
        </button>

        <button
          type="button"
          onClick={onFinish}
          className="btn-press"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 18px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent)',
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <CheckCircle2 size={15} />
          Comenzar en el Mapa Isométrico
        </button>
      </div>
    </div>
  )
}

export function LocationSetupModal({ isOpen, onClose }: Props) {
  const {
    farmCoordinates,
    isLoadingClimate,
    climateError,
    setFarmCoordinates,
    detectBrowserLocation,
  } = useAgroClimateStore()
  const { taxons } = useTaxonStore()

  // Si al montar no hay farmCoordinates, es el onboarding obligatorio de 2 pasos
  const [isOnboarding] = useState(() => !useAgroClimateStore.getState().farmCoordinates)
  const [wizardStep, setWizardStep] = useState<'location' | 'species'>('location')
  const [wizardCompleted, setWizardCompleted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setWizardCompleted(false)
    }
  }, [isOpen])

  // Es obligatorio (gate inicial) cuando arrancó como onboarding y no fue abierto manualmente
  const isMandatoryGate = isOnboarding && !isOpen
  const shouldRender = !wizardCompleted && (isOnboarding || Boolean(isOpen))

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

  const handleAfterLocationSaved = () => {
    if (taxons.length === 0 || !onClose) {
      setWizardStep('species')
    } else {
      onClose()
    }
  }

  const handleDetectGps = async () => {
    setLocalError(null)
    setIsDetectingGps(true)
    try {
      const coords = await detectBrowserLocation()
      if (coords && placeName.trim()) {
        setFarmCoordinates({ ...coords, name: placeName.trim() })
      }
      handleAfterLocationSaved()
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
    handleAfterLocationSaved()
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
    handleAfterLocationSaved()
  }

  const handleFinishWizard = () => {
    setWizardCompleted(true)
    onClose?.()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={wizardStep === 'location' ? 'location-setup-title' : 'species-setup-title'}
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
          maxWidth: 600,
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '24px 28px',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Header Superior con Tabs y Botón Cerrar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          {/* Selector de Pasos en Cabecera */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px',
              background: 'var(--surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={() => setWizardStep('location')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: wizardStep === 'location' ? 'var(--surface-elevated)' : 'transparent',
                boxShadow: wizardStep === 'location' ? 'var(--shadow-sm)' : 'none',
                color: wizardStep === 'location' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: wizardStep === 'location' ? 600 : 500,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 17,
                  height: 17,
                  borderRadius: '50%',
                  background: farmCoordinates ? 'var(--accent)' : 'var(--border)',
                  color: farmCoordinates ? 'white' : 'var(--text-tertiary)',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                }}
              >
                {farmCoordinates ? '✓' : '1'}
              </span>
              1. Ubicación y Clima
            </button>

            <button
              type="button"
              onClick={() => setWizardStep('species')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: wizardStep === 'species' ? 'var(--surface-elevated)' : 'transparent',
                boxShadow: wizardStep === 'species' ? 'var(--shadow-sm)' : 'none',
                color: wizardStep === 'species' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: wizardStep === 'species' ? 600 : 500,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 17,
                  height: 17,
                  borderRadius: '50%',
                  background: taxons.length > 0 ? 'var(--accent)' : 'var(--border)',
                  color: taxons.length > 0 ? 'white' : 'var(--text-tertiary)',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                }}
              >
                {taxons.length > 0 ? '✓' : '2'}
              </span>
              2. Especies a Cultivar {taxons.length > 0 && `(${taxons.length})`}
            </button>
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

        {wizardStep === 'location' ? (
          <div>
            {/* Header del Paso 1 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MapPin size={19} color="var(--accent)" strokeWidth={2.2} />
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
                    marginBottom: 3,
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

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
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
                marginBottom: 16,
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
            <div style={{ marginBottom: 16 }}>
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
            <div style={{ marginBottom: 16, position: 'relative' }}>
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
                    maxHeight: 180,
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
                {farmCoordinates && (
                  <button
                    type="button"
                    onClick={() => setWizardStep('species')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--accent)',
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <span>Paso 2: Especies</span>
                    <ArrowRight size={13} />
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
        ) : (
          <SafeQueryWrapper>
            <SpeciesStepContent
              onBackToLocation={() => setWizardStep('location')}
              onFinish={handleFinishWizard}
            />
          </SafeQueryWrapper>
        )}
      </div>
    </div>
  )
}
