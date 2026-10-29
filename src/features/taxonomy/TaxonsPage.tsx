import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useTaxonStore } from '@/store/taxonStore'
import { useTaxonomySearch } from '@/hooks/useTaxonomySearch'
import { fetchTrefleSpeciesDetail } from '@/services/taxonomy/trefleApi'
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
  CloudRain, CalendarDays
} from 'lucide-react'
import { AgroSuitabilityCard } from '@/features/agroclimate/AgroSuitabilityCard'
import { useAgroSuitability } from '@/hooks/useAgroSuitability'
import { SeedBankTabs } from '@/components/SeedBankTabs'

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

const MONO_LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: 'var(--text-tertiary)',
  fontFamily: 'var(--font-mono)',
}

const CARD: React.CSSProperties = {
  background: 'var(--surface-subtle)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '18px 20px',
}

const SOURCE_LABEL: Record<AgronomicSource, string> = {
  trefle: 'Trefle',
  ecocrop: 'FAO EcoCrop',
  manual: 'Manual',
}

const SOURCE_COLORS: Record<AgronomicSource, { bg: string; text: string }> = {
  trefle:  { bg: '#dbeafe', text: '#1e3a5f' },
  ecocrop: { bg: '#fef3c7', text: '#78350f' },
  manual:  { bg: '#ede9fe', text: '#4c1d95' },
}

function SourceBadge({ source }: { source?: AgronomicSource }) {
  if (!source) return null
  const cfg = SOURCE_COLORS[source]
  return (
    <span
      style={{
        marginLeft: 5,
        padding: '1px 5px',
        borderRadius: 4,
        fontSize: 9,
        fontWeight: 600,
        textTransform: 'uppercase',
        fontFamily: 'var(--font-mono)',
        background: cfg.bg,
        color: cfg.text,
      }}
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
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

    // Resolución automática de Ontología biológica
    const resolution = resolveCropOntology({
      genus: resGenus,
      species: resSpecies,
      commonName: resCommon,
      family: resFamily,
    })
    setResolvedCrop(resolution)
    setResolvedTraits(resolution ? getTraitsForCrop(resolution.cropCode) : [])

    // Datos ecofisiológicos: Trefle (detalle) + FAO EcoCrop en paralelo, fusión campo a campo
    setIsFetchingDetail(true)
    setAgronomicData(undefined)
    setEcocropMatch(null)
    try {
      const [trefle, eco] = await Promise.all([
        result.trefleSlug ? fetchTrefleSpeciesDetail(result.trefleSlug) : Promise.resolve(result.agronomicData),
        lookupEcocrop(resGenus, resSpecies),
      ])
      setAgronomicData(mergeAgronomicData(trefle, eco?.data))
      setEcocropMatch(eco ? eco.matchedName : null)
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
    setSelectedId(newTaxon.id)
  }

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface-base)' }}>
      <SeedBankTabs active="taxons" />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* ── Sidebar / Form List ── */}
      <aside
        style={{
          width: 380,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-elevated)',
          borderRight: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 18px',
            borderBottom: '1px solid var(--border)',
            overflowY: 'auto',
            maxHeight: '58vh',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LeafyGreen size={14} color="var(--accent)" strokeWidth={2} />
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Nueva Especie
              </h2>
            </div>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: 'var(--accent)',
                background: 'var(--accent-light)',
                padding: '2px 8px',
                borderRadius: 99,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Sparkles size={11} /> Ontología Auto
            </span>
          </div>

          <form style={{ display: 'flex', flexDirection: 'column', gap: 12 }} onSubmit={handleAdd}>
            {/* Autocomplete Search */}
            <div style={{ position: 'relative' }}>
              <label htmlFor="searchQuery" className="sr-only">Buscar Especie en GBIF</label>
              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  color="var(--text-tertiary)"
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
                <input
                  id="searchQuery"
                  type="text"
                  style={{ ...INPUT_STYLE, paddingLeft: 32 }}
                  placeholder="Buscar en GBIF (ej. Solanum, Zea...)"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 250)}
                  autoComplete="off"
                />
              </div>

              {showDropdown && searchQuery.trim().length > 2 && (
                <div
                  style={{
                    position: 'absolute',
                    zIndex: 20,
                    width: '100%',
                    marginTop: 4,
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    overflow: 'hidden',
                    maxHeight: 240,
                    overflowY: 'auto',
                  }}
                >
                  {isLoading && (
                    <div style={{ padding: 14, fontSize: 12.5, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                      Consultando GBIF / API botánica...
                    </div>
                  )}
                  {!isLoading && searchResults?.length === 0 && (
                    <div style={{ padding: 14, fontSize: 12.5, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                      No se encontraron especies con ese nombre
                    </div>
                  )}
                  {!isLoading && searchResults?.map(result => (
                    <div
                      key={result.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                      }}
                      onClick={() => handleSelectResult(result)}
                    >
                      {result.imageUrl ? (
                        <img
                          src={result.imageUrl}
                          alt={result.commonName || result.scientificName}
                          style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 6,
                            background: 'var(--accent-light)',
                            color: 'var(--accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <LeafyGreen size={16} />
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.commonName || result.scientificName}
                        </span>
                        <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <i>{result.scientificName}</i> ({result.family})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={LABEL_STYLE}>Familia</label>
                <input
                  type="text"
                  style={{ ...INPUT_STYLE, background: 'var(--surface-subtle)', fontSize: 12.5 }}
                  value={family}
                  onChange={e => setFamily(e.target.value)}
                  placeholder="Ej. Solanaceae"
                  required
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Género</label>
                <input
                  type="text"
                  style={{ ...INPUT_STYLE, fontSize: 12.5 }}
                  value={genus}
                  onChange={e => handleManualGenusChange(e.target.value)}
                  placeholder="Ej. Solanum"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={LABEL_STYLE}>Especie</label>
                <input
                  type="text"
                  style={{ ...INPUT_STYLE, fontSize: 12.5 }}
                  value={species}
                  onChange={e => handleManualSpeciesChange(e.target.value)}
                  placeholder="Ej. lycopersicum"
                  required
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Nombre Vulgar</label>
                <input
                  type="text"
                  style={{ ...INPUT_STYLE, fontSize: 12.5 }}
                  value={commonName}
                  onChange={e => setCommonName(e.target.value)}
                  placeholder="Ej. Tomate"
                />
              </div>
            </div>

            {/* Ficha de Resolución Automática de Ontología */}
            {resolvedCrop ? (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-light)',
                  border: '1px solid #b7e4c7',
                  color: '#1b4332',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CheckCircle2 size={13} color="var(--accent)" />
                    Ontología: {resolvedCrop.cropName} ({resolvedCrop.cropCode})
                  </span>
                  <span
                    style={{
                      fontSize: 9.5,
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: '#b7e4c7',
                      color: '#1b4332',
                    }}
                  >
                    {resolvedCrop.confidence === 'exact' ? 'Exacto' : resolvedCrop.confidence === 'synonym' ? 'Sinónimo' : 'Género CWR'}
                  </span>
                </div>
                {resolvedCrop.notes && (
                  <p style={{ fontSize: 11, marginBottom: 4 }}>{resolvedCrop.notes}</p>
                )}
                <p style={{ fontSize: 11 }}>
                  <strong>{resolvedTraits.length}</strong> descriptores fenotípicos vinculados automáticamente.
                </p>
              </div>
            ) : (genus || species) ? (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: 11.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <Info size={14} color="var(--text-tertiary)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Sin ontología agronómica específica registrada. Se guardará con sus datos taxonómicos completos.</span>
              </div>
            ) : null}

            {/* Ecophysiological data loading indicator */}
            {isFetchingDetail && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: '#dbeafe',
                  border: '1px solid #bfdbfe',
                  color: '#1e3a5f',
                  fontSize: 11.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Loader2 size={14} className="animate-spin" style={{ flexShrink: 0 }} />
                Cargando datos ecofisiológicos (Trefle + FAO EcoCrop)...
              </div>
            )}

            {/* Editable ecophysiological data */}
            {!isFetchingDetail && (genus || species) && (
              <fieldset
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-subtle)',
                  border: '1px solid var(--border)',
                }}
              >
                <legend
                  style={{
                    padding: '0 4px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Thermometer size={12} color="#d97706" /> Datos ecofisiológicos
                </legend>
                {ecocropMatch && (
                  <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                    Complementado con FAO EcoCrop: <i>{ecocropMatch}</i>
                  </p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {EDITABLE_FIELDS.map(f => {
                    const value = agronomicData?.[f.key]
                    return (
                      <div key={f.key}>
                        <label
                          htmlFor={`agro-${f.key}`}
                          style={{
                            fontSize: 10.5,
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: 3,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {f.label}{f.unit ? ` (${f.unit})` : ''}
                          <SourceBadge source={agronomicData?.sources?.[f.key]} />
                        </label>
                        <input
                          id={`agro-${f.key}`}
                          type="number"
                          step={f.step}
                          style={{ ...INPUT_STYLE, padding: '5px 8px', fontSize: 12, fontFamily: 'var(--font-mono)' }}
                          value={typeof value === 'number' ? value : ''}
                          onChange={e => handleAgronomicEdit(f.key, e.target.value)}
                          placeholder="—"
                        />
                      </div>
                    )
                  })}
                </div>
              </fieldset>
            )}

            <button
              type="submit"
              disabled={!genus.trim() || !species.trim() || isFetchingDetail}
              className="btn-press"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: '9px 16px',
                borderRadius: 'var(--radius-md)',
                background: (genus.trim() && species.trim() && !isFetchingDetail) ? 'var(--accent)' : 'var(--surface-muted)',
                color: (genus.trim() && species.trim() && !isFetchingDetail) ? 'white' : 'var(--text-tertiary)',
                fontSize: 13,
                fontWeight: 500,
                border: 'none',
                cursor: (genus.trim() && species.trim() && !isFetchingDetail) ? 'pointer' : 'not-allowed',
                boxShadow: (genus.trim() && species.trim() && !isFetchingDetail) ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {isFetchingDetail ? (
                <><Loader2 size={14} className="animate-spin" />Cargando datos de la especie...</>
              ) : (
                <><Plus size={14} strokeWidth={2.5} />Agregar al Catálogo</>
              )}
            </button>
          </form>
        </div>

        {/* List of registered taxons */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 14px' }}>
          <div style={{ padding: '4px 8px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={MONO_LABEL}>Catálogo Registrado ({taxons.length})</span>
          </div>
          {taxons.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
              No hay especies registradas en el catálogo.
            </div>
          ) : (
            taxons.map(t => {
              const isSelected = selectedId === t.id
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--accent-light)' : 'transparent',
                    border: isSelected ? '1px solid #b7e4c7' : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 2,
                    transition: 'all 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    {t.imageUrl ? (
                      <img
                        src={t.imageUrl}
                        alt={t.commonName || t.genus}
                        style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          background: isSelected ? 'white' : 'var(--accent-light)',
                          color: 'var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <LeafyGreen size={15} />
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.commonName || `${t.genus} ${t.species}`}
                      </p>
                      <p
                        style={{
                          fontSize: 11.5,
                          color: 'var(--text-tertiary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <i>{t.genus} {t.species}</i> ({t.family})
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {t.cropCode && (
                      <span
                        style={{
                          padding: '2px 7px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 10.5,
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          background: isSelected ? 'white' : 'var(--surface-subtle)',
                          color: 'var(--accent)',
                          border: '1px solid #b7e4c7',
                        }}
                      >
                        {t.cropCode}
                      </span>
                    )}
                    <button
                      type="button"
                      title="Eliminar de la lista"
                      data-testid="delete-taxon-sidebar-btn"
                      onClick={e => {
                        e.stopPropagation()
                        remove(t.id)
                        if (selectedId === t.id) setSelectedId(null)
                      }}
                      style={{
                        padding: 4,
                        borderRadius: 'var(--radius-sm)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </aside>

      {/* ── Main Details Area ── */}
      <main style={{ flex: 1, minWidth: 0, background: 'var(--surface-base)', overflowY: 'auto' }}>
        <AnimatePresence>
          {selectedTaxon ? (
            <motion.div
              key={selectedTaxon.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ padding: '36px 44px', maxWidth: 860 }}
            >
              <header style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                  {selectedTaxon.imageUrl ? (
                    <img
                      src={selectedTaxon.imageUrl}
                      alt={selectedTaxon.commonName || selectedTaxon.genus}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 'var(--radius-lg)',
                        objectFit: 'cover',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--accent-light)',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #b7e4c7',
                      }}
                    >
                      <LeafyGreen size={34} />
                    </div>
                  )}
                  <div>
                    <h1
                      style={{
                        fontSize: 28,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.02em',
                        marginBottom: 4,
                      }}
                    >
                      <i>{selectedTaxon.genus} {selectedTaxon.species}</i>
                    </h1>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {selectedTaxon.commonName || 'Sin nombre común registrado'} ·{' '}
                      <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>{selectedTaxon.family}</span>
                    </p>
                    {selectedTaxon.cropCode && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          marginTop: 8,
                          padding: '3px 10px',
                          borderRadius: 99,
                          background: 'var(--accent-light)',
                          color: '#1b4332',
                          fontSize: 11.5,
                          fontWeight: 600,
                        }}
                      >
                        <Sparkles size={12} color="var(--accent)" />
                        {activeTraits.length > 0 ? (
                          <>Ontología Vinculada: {selectedTaxon.cropCode}</>
                        ) : (
                          <>Prefijo de Accesión: {selectedTaxon.cropCode}</>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {deletingId === selectedTaxon.id ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 10px',
                      background: '#fff1f2',
                      border: '1px solid #fca5a5',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <span style={{ fontSize: 12, color: '#991b1b', fontWeight: 500 }}>¿Eliminar especie?</span>
                    <button
                      type="button"
                      onClick={() => {
                        remove(selectedTaxon.id)
                        setSelectedId(null)
                        setDeletingId(null)
                      }}
                      style={{
                        padding: '4px 10px',
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: 'white',
                        background: '#dc2626',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                      }}
                    >
                      Sí, eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(null)}
                      style={{
                        padding: '4px 8px',
                        fontSize: 11.5,
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    data-testid="delete-taxon-header-btn"
                    onClick={() => setDeletingId(selectedTaxon.id)}
                    className="btn-press"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #fca5a5',
                      background: '#fff1f2',
                      color: '#991b1b',
                      fontSize: 12.5,
                      fontWeight: 500,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <Trash2 size={13} />
                    Eliminar especie
                  </button>
                )}
              </header>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                {/* Botanical Info */}
                <div style={CARD}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                    <Info size={13} color="var(--accent)" />
                    <span style={MONO_LABEL}>Información Taxonómica</span>
                  </div>
                  <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>FAMILIA</dt>
                      <dd style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}>{selectedTaxon.family}</dd>
                    </div>
                    <div>
                      <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>GÉNERO</dt>
                      <dd style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}>{selectedTaxon.genus}</dd>
                    </div>
                    <div>
                      <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>ESPECIE</dt>
                      <dd style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}>{selectedTaxon.species}</dd>
                    </div>
                    <div>
                      <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>CÓDIGO CROP</dt>
                      <dd style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                        {selectedTaxon.cropCode || 'Sin código'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Agronomic Data */}
                <div style={CARD}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                    <Sun size={13} color="#d97706" />
                    <span style={MONO_LABEL}>Datos Ecofisiológicos</span>
                  </div>
                  {selectedTaxon.agronomicData ? (
                    <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                            style={{
                              background: 'var(--surface-elevated)',
                              padding: '8px 10px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <dt style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                                <Icon size={11} color="var(--text-tertiary)" /> {row.label}
                              </span>
                              <SourceBadge source={src} />
                            </dt>
                            <dd style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                              {lo ?? '?'} – {hi ?? '?'}{row.unit}
                            </dd>
                          </div>
                        )
                      })}
                    </dl>
                  ) : (
                    <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>
                      Sin datos ecofisiológicos en Trefle ni FAO EcoCrop para esta especie.
                    </p>
                  )}
                </div>
              </div>

              {/* Ficha de Aptitud Agroclimática */}
              <div style={{ marginBottom: 18 }}>
                <AgroSuitabilityCard
                  assessment={agroAssessment}
                  climate={climate}
                  isLoading={isLoadingClimate}
                  error={climateError}
                  onDetectLocation={detectBrowserLocation}
                />
              </div>

              {/* Ontology Traits Sheet */}
              <div style={{ ...CARD, marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Layers size={13} color="var(--accent)" />
                    <span style={MONO_LABEL}>Ficha de Descriptores Fenotípicos ({activeTraits.length})</span>
                  </div>
                  {selectedTaxon.cropCode && (
                    <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>
                      Crop Ontology: {selectedTaxon.cropCode}
                    </span>
                  )}
                </div>

                {activeTraits.length === 0 ? (
                  <div style={{ padding: 14, borderRadius: 'var(--radius-sm)', background: 'var(--surface-elevated)', border: '1px solid var(--border)', color: 'var(--text-tertiary)', fontSize: 12.5 }}>
                    No hay variables fenotípicas predefinidas para esta especie en el catálogo de ontologías.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {activeTraits.map(trait => (
                      <div
                        key={trait.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--surface-elevated)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{trait.name}</span>
                          <span
                            style={{
                              fontSize: 9.5,
                              fontFamily: 'var(--font-mono)',
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: 'var(--surface-subtle)',
                              color: 'var(--text-secondary)',
                              textTransform: 'uppercase',
                            }}
                          >
                            {trait.type}
                          </span>
                        </div>
                        {trait.description && (
                          <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 6 }}>{trait.description}</p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
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
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Database size={12} /> ID Interno: {selectedTaxon.id}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <LeafyGreen size={52} strokeWidth={1} color="var(--surface-muted)" />
              <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-tertiary)' }}>
                Seleccione una especie para ver su ficha biológica y ontológica
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      </div>
    </div>
  )
}
