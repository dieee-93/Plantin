import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useIndividualStore } from '@/store/individualStore'
import { useAccessionStore } from '@/store/accessionStore'
import { useTaxonStore } from '@/store/taxonStore'
import { useObservationStore } from '@/store/observationStore'
import { useLocationStore } from '@/store/locationStore'
import { getTraitsForCrop } from '@/domain/ontology/index'
import type { TraitDefinition } from '@/domain/ontology/types'
import { getIndividualDisplayName } from '@/domain/individual'
import { ActiveCropTabs } from '@/components/ActiveCropTabs'
import { Search, FlaskConical, CheckCircle2, History, Sprout, ChevronRight } from 'lucide-react'

// ─── Shared styles ────────────────────────────────────────────────────────────

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
  marginBottom: 5,
}

const MONO_LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: 'var(--text-tertiary)',
  fontFamily: 'var(--font-mono)',
}

// ─── Trait Field ──────────────────────────────────────────────────────────────

function TraitField({
  trait,
  value,
  onChange,
}: {
  trait: TraitDefinition
  value: any
  onChange: (v: any) => void
}) {
  if (trait.type === 'categorical' && trait.options) {
    return (
      <select
        style={INPUT_STYLE}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        required={trait.required}
      >
        <option value="">Seleccionar...</option>
        {trait.options.map(opt => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }

  if (trait.type === 'boolean') {
    return (
      <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
        {['true', 'false'].map(v => (
          <label
            key={v}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 13,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: value === v ? 600 : 400,
            }}
          >
            <input
              type="radio"
              name={trait.id}
              value={v}
              checked={value === v}
              onChange={e => onChange(e.target.value)}
              required={trait.required}
              style={{ accentColor: 'var(--accent)' }}
            />
            {v === 'true' ? 'Si' : 'No'}
          </label>
        ))}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        type={trait.type === 'numeric' ? 'number' : 'text'}
        min={trait.min}
        max={trait.max}
        step={trait.type === 'numeric' ? 'any' : undefined}
        style={{ ...INPUT_STYLE, paddingRight: trait.unit ? 44 : 12 }}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        required={trait.required}
        placeholder={trait.type === 'numeric' ? '0.00' : ''}
      />
      {trait.unit && (
        <span
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-tertiary)',
            fontWeight: 500,
            pointerEvents: 'none',
          }}
        >
          {trait.unit}
        </span>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PhenotypingPage() {
  const { individuals } = useIndividualStore()
  const { accessions } = useAccessionStore()
  const { taxons } = useTaxonStore()
  const { observations, add: addObservation } = useObservationStore()
  const { locations } = useLocationStore()

  const [searchParams] = useSearchParams()
  const initialIndividualId = searchParams.get('individualId')

  const [selectedId, setSelectedId] = useState<string | null>(initialIndividualId)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (initialIndividualId) {
      setSelectedId(initialIndividualId)
    }
  }, [initialIndividualId])

  const resolveLocationName = (locId?: string) => {
    if (!locId) return null
    return locations.find(l => l.id === locId)?.name ?? null
  }

  const filteredIndividuals = individuals.filter(ind => {
    if (!searchQuery) return true
    const acc = accessions.find(a => a.id === ind.accessionId)
    const locName = resolveLocationName(ind.locationId)
    const q = searchQuery.toLowerCase()
    return (
      acc?.accessionNumber.toLowerCase().includes(q) ||
      locName?.toLowerCase().includes(q)
    )
  })

  const selectedIndividual = individuals.find(i => i.id === selectedId)
  const selectedAccession = selectedIndividual
    ? accessions.find(a => a.id === selectedIndividual.accessionId)
    : null
  const selectedTaxon = selectedAccession
    ? taxons.find(t => t.id === selectedAccession.taxonId)
    : null

  const traits = selectedTaxon?.cropCode ? getTraitsForCrop(selectedTaxon.cropCode) : []
  const individualObservations = selectedId
    ? observations.filter(o => o.individualId === selectedId)
    : []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId) return
    let added = 0
    traits.forEach(trait => {
      const val = formData[trait.id]
      if (val !== undefined && val !== '') {
        addObservation({
          individualId: selectedId,
          traitId: trait.id,
          value: val,
          date: new Date().toISOString(),
          bbchAtObservation: selectedIndividual?.currentBBCH,
        })
        added++
      }
    })
    if (added > 0) {
      setSuccessMsg(`${added} observacion${added > 1 ? 'es' : ''} registrada${added > 1 ? 's' : ''}.`)
      setFormData({})
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  const formatObsValue = (obs: typeof observations[0], trait?: TraitDefinition) => {
    if (!trait) return String(obs.value)
    if (trait.type === 'categorical') {
      const opt = trait.options?.find(o => String(o.value) === String(obs.value))
      return opt?.label ?? String(obs.value)
    }
    if (trait.type === 'boolean') {
      return obs.value === 'true' || obs.value === true ? 'Si' : 'No'
    }
    return `${obs.value}${trait.unit ? ` ${trait.unit}` : ''}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface-base)' }}>
      <ActiveCropTabs active="phenotyping" />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* ── Individual list (left sidebar) ── */}
      <aside
        style={{
          width: 280,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-elevated)',
          borderRight: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <FlaskConical size={14} color="var(--text-tertiary)" strokeWidth={2} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Plantas
            </h2>
          </div>
          <div style={{ position: 'relative' }}>
            <Search
              size={13}
              strokeWidth={2}
              color="var(--text-tertiary)"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
            <input
              type="text"
              style={{ ...INPUT_STYLE, paddingLeft: 30, fontSize: 12 }}
              placeholder="Buscar planta..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
          {filteredIndividuals.length === 0 ? (
            <div style={{ padding: '30px 12px', textAlign: 'center' }}>
              <Sprout size={26} color="var(--surface-muted)" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                {individuals.length === 0 ? 'Sin individuos registrados.' : 'Sin resultados.'}
              </p>
            </div>
          ) : (
            filteredIndividuals.map((ind, idx) => {
              const acc = accessions.find(a => a.id === ind.accessionId)
              const locName = resolveLocationName(ind.locationId)
              const isSelected = ind.id === selectedId
              const obsCount = observations.filter(o => o.individualId === ind.id).length
              const dispName = getIndividualDisplayName(ind, acc?.accessionNumber, idx)

              return (
                <motion.button
                  key={ind.id}
                  onClick={() => { setSelectedId(ind.id); setFormData({}); setSuccessMsg('') }}
                  whileTap={{ scale: 0.99 }}
                  whileHover={!isSelected ? { backgroundColor: '#f2f1ef' } : {}}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 11px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--accent-light)' : 'transparent',
                    border: isSelected ? '1px solid #b7e4c7' : '1px solid transparent',
                    cursor: 'pointer',
                    display: 'block',
                    marginBottom: 2,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {dispName}
                      </p>
                      {locName && (
                        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {locName}{ind.position ? ` · ${ind.position}` : ''}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {obsCount > 0 && (
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: 'var(--font-mono)',
                            padding: '1px 6px',
                            borderRadius: 99,
                            background: 'var(--accent-light)',
                            color: 'var(--accent)',
                            fontWeight: 600,
                          }}
                        >
                          {obsCount}
                        </span>
                      )}
                      <ChevronRight size={11} strokeWidth={2} color={isSelected ? 'var(--accent)' : 'var(--text-tertiary)'} />
                    </div>
                  </div>
                </motion.button>
              )
            })
          )}
        </div>
      </aside>

      {/* ── Main area ── */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          {selectedIndividual && selectedAccession && selectedTaxon ? (
            <motion.div
              key={selectedId}
              style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Top bar */}
              <div
                style={{
                  padding: '18px 32px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <h1
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {selectedAccession.accessionNumber}
                    </h1>
                    <span
                      style={{
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        fontStyle: 'italic',
                      }}
                    >
                      {selectedTaxon.genus} {selectedTaxon.species}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {resolveLocationName(selectedIndividual.locationId) ?? 'Sin ubicacion'}
                    {selectedIndividual.position ? ` · ${selectedIndividual.position}` : ''}
                    {selectedIndividual.currentBBCH !== undefined ? ` · BBCH ${selectedIndividual.currentBBCH}` : ''}
                  </p>
                </div>

                {traits.length > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      padding: '4px 10px',
                      borderRadius: 99,
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                      fontWeight: 600,
                    }}
                  >
                    {traits.length} traits · {selectedTaxon.cropCode}
                  </span>
                )}
              </div>

              <div
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  display: 'grid',
                  gridTemplateColumns: '1fr 380px',
                }}
              >
                {/* Observation form */}
                <div
                  style={{
                    overflowY: 'auto',
                    padding: '28px 32px',
                  }}
                >
                  <h2
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: 20,
                    }}
                  >
                    Registrar Observacion
                  </h2>

                  {traits.length === 0 ? (
                    <div
                      style={{
                        padding: '32px 24px',
                        background: 'var(--surface-subtle)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        textAlign: 'center',
                      }}
                    >
                      <FlaskConical size={28} color="var(--surface-muted)" style={{ margin: '0 auto 10px' }} />
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        No hay diccionario de fenotipado para el Crop Code{' '}
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>{selectedTaxon.cropCode}</strong>.
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                        Configura los traits en la ontologia del cultivo.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <AnimatePresence>
                        {successMsg && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{
                              marginBottom: 20,
                              padding: '12px 16px',
                              borderRadius: 'var(--radius-md)',
                              background: '#d8f3dc',
                              border: '1px solid #b7e4c7',
                              color: '#1b4332',
                              fontSize: 13,
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <CheckCircle2 size={15} color="#2d6a4f" />
                            {successMsg}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                          gap: 18,
                          marginBottom: 24,
                        }}
                      >
                        {traits.map(trait => (
                          <div key={trait.id}>
                            <label style={LABEL_STYLE}>
                              {trait.name}
                              {trait.required && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
                            </label>
                            {trait.description && (
                              <p
                                style={{
                                  fontSize: 11,
                                  color: 'var(--text-tertiary)',
                                  marginBottom: 5,
                                  lineHeight: 1.4,
                                }}
                              >
                                {trait.description}
                              </p>
                            )}
                            <TraitField
                              trait={trait}
                              value={formData[trait.id]}
                              onChange={v => setFormData(prev => ({ ...prev, [trait.id]: v }))}
                            />
                          </div>
                        ))}
                      </div>

                      <button
                        type="submit"
                        className="btn-press"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 20px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--accent)',
                          color: 'white',
                          fontSize: 13.5,
                          fontWeight: 500,
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <CheckCircle2 size={15} />
                        Guardar observaciones
                      </button>
                    </form>
                  )}
                </div>

                {/* History sidebar */}
                <div
                  style={{
                    borderLeft: '1px solid var(--border)',
                    background: 'var(--surface-elevated)',
                    overflowY: 'auto',
                    padding: '28px 22px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                    <History size={13} color="var(--text-tertiary)" strokeWidth={2} />
                    <p style={{ ...MONO_LABEL, marginBottom: 0 }}>Historial</p>
                    {individualObservations.length > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          background: 'var(--surface-muted)',
                          color: 'var(--text-secondary)',
                          padding: '1px 6px',
                          borderRadius: 99,
                          marginLeft: 'auto',
                        }}
                      >
                        {individualObservations.length}
                      </span>
                    )}
                  </div>

                  {individualObservations.length === 0 ? (
                    <div
                      style={{
                        padding: '24px 16px',
                        textAlign: 'center',
                        borderRadius: 'var(--radius-md)',
                        border: '1px dashed var(--border)',
                      }}
                    >
                      <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>
                        Sin observaciones registradas.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[...individualObservations]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((obs, i) => {
                          const trait = traits.find(t => t.id === obs.traitId)
                          const traitName = trait?.name ?? obs.traitId
                          const displayVal = formatObsValue(obs, trait)

                          return (
                            <motion.div
                              key={obs.id}
                              initial={{ opacity: 0, x: 8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04 }}
                              style={{
                                padding: '10px 12px',
                                background: 'var(--surface-subtle)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>
                                  {traitName}
                                </span>
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    fontFamily: 'var(--font-mono)',
                                    color: 'var(--accent)',
                                    background: 'var(--accent-light)',
                                    padding: '1px 6px',
                                    borderRadius: 'var(--radius-sm)',
                                    flexShrink: 0,
                                    marginLeft: 8,
                                  }}
                                >
                                  {displayVal}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p
                                  style={{
                                    fontSize: 10.5,
                                    color: 'var(--text-tertiary)',
                                    fontFamily: 'var(--font-mono)',
                                  }}
                                >
                                  {new Date(obs.date).toLocaleString('es-AR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                                {obs.bbchAtObservation !== undefined && (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontFamily: 'var(--font-mono)',
                                      color: 'var(--text-secondary)',
                                      background: 'var(--surface-elevated)',
                                      border: '1px solid var(--border)',
                                      borderRadius: 99,
                                      padding: '1px 6px',
                                    }}
                                  >
                                    BBCH {obs.bbchAtObservation}
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 10,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FlaskConical size={52} strokeWidth={1} color="var(--surface-muted)" />
              <p style={{ fontSize: 13.5, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                Selecciona una planta
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                para registrar observaciones fenotipicas.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      </div>
    </div>
  )
}
