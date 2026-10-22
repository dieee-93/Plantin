import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAccessionStore } from '@/store/accessionStore'
import { useTaxonStore } from '@/store/taxonStore'
import { useIndividualStore } from '@/store/individualStore'
import { useSeedLotStore } from '@/store/seedLotStore'
import { useTaxonomySearch } from '@/hooks/useTaxonomySearch'
import { enrichTaxonomySearchResult } from '@/services/taxonomy/taxonEnrichment'
import { getTraitsForCrop, getEffectiveCropCode } from '@/domain/ontology/index'
import { getIndividualDisplayName } from '@/domain/individual'
import type { Accession, AcquisitionSource } from '@/domain/accession'
import { SeedBankTabs } from '@/components/SeedBankTabs'
import { useAgroSuitability } from '@/hooks/useAgroSuitability'
import { AgroSuitabilityCard } from '@/features/agroclimate/AgroSuitabilityCard'
import {
  Sprout, Plus, Search, Trash2, Globe, GitBranch,
  ChevronRight, Package, Users, Calendar, MapPin, X, Sparkles, LeafyGreen, Loader2
} from 'lucide-react'

// ─── Config ───────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<AcquisitionSource, string> = {
  wild:      'Silvestre',
  cultivated:'Cultivada',
  market:    'Mercado',
  breeding:  'Mejoramiento',
  research:  'Investigacion',
  unknown:   'Desconocido',
}

const SOURCE_COLORS: Record<AcquisitionSource, { bg: string; text: string }> = {
  wild:      { bg: '#d8f3dc', text: '#1b4332' },
  cultivated:{ bg: '#dbeafe', text: '#1e3a5f' },
  market:    { bg: '#fef3c7', text: '#78350f' },
  breeding:  { bg: '#fce7f3', text: '#831843' },
  research:  { bg: '#ede9fe', text: '#4c1d95' },
  unknown:   { bg: '#f2f1ef', text: '#4a4946' },
}

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

const CARD: React.CSSProperties = {
  background: 'var(--surface-subtle)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '18px 20px',
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function AccessionDetail({
  accession,
  onDelete,
}: {
  accession: Accession
  onDelete: () => void
}) {
  const navigate = useNavigate()
  const { taxons } = useTaxonStore()
  const { accessions } = useAccessionStore()
  const { individuals } = useIndividualStore()
  const { seedLots, add: addSeedLot } = useSeedLotStore()

  const taxon = taxons.find(t => t.id === accession.taxonId)
  const {
    assessment: agroAssessment,
    climate,
    isLoadingClimate,
    climateError,
  } = useAgroSuitability(taxon?.agronomicData)
  const maternalAcc = accession.maternalAccessionId
    ? accessions.find(a => a.id === accession.maternalAccessionId)
    : null
  const paternalAcc = accession.paternalAccessionId
    ? accessions.find(a => a.id === accession.paternalAccessionId)
    : null

  const relatedIndividuals = individuals.filter(i => i.accessionId === accession.id)
  const relatedLots = seedLots.filter(l => l.accessionId === accession.id)
  const totalAvailableSeeds = relatedLots
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + (l.currentCount ?? 0), 0)

  const srcCfg = SOURCE_COLORS[accession.acquisitionSource]
  const effectiveCropCode = taxon ? getEffectiveCropCode(taxon) : ''
  const ontologyTraits = effectiveCropCode ? getTraitsForCrop(effectiveCropCode) : (taxon?.traits || [])

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showInlineLotForm, setShowInlineLotForm] = useState(false)
  const [inlineLotCount, setInlineLotCount] = useState('100')
  const [inlineLotStorage, setInlineLotStorage] = useState('')

  const handleCreateInlineLot = (e: React.FormEvent) => {
    e.preventDefault()
    const nextNum = relatedLots.length + 1
    addSeedLot({
      accessionId: accession.id,
      lotCode: `${accession.accessionNumber}-L${nextNum}`,
      initialCount: inlineLotCount ? Number(inlineLotCount) : undefined,
      storageLocation: inlineLotStorage.trim() || undefined,
      harvestDate: new Date().toISOString().slice(0, 10),
    })
    setShowInlineLotForm(false)
    setInlineLotCount('100')
    setInlineLotStorage('')
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 820, height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <header style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.025em',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {accession.accessionNumber}
              </h1>
              {accession.cultivarName && (
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  · {accession.cultivarName}
                </span>
              )}
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 500,
                  padding: '3px 9px',
                  borderRadius: 99,
                  background: srcCfg.bg,
                  color: srcCfg.text,
                }}
              >
                {SOURCE_LABELS[accession.acquisitionSource]}
              </span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              {taxon ? `${taxon.genus} ${taxon.species}` : 'Especie desconocida'}
              {taxon?.commonName && (
                <span style={{ fontStyle: 'normal', color: 'var(--text-tertiary)', marginLeft: 6 }}>
                  · {taxon.commonName}
                </span>
              )}
            </p>
            {effectiveCropCode && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '3px 10px', borderRadius: 99, background: '#d8f3dc', color: '#1b4332', fontSize: 11.5, fontWeight: 600 }}>
                <Sparkles size={12} color="#2d6a4f" />
                {ontologyTraits.length > 0 ? (
                  <>Ontología: {effectiveCropCode} · {ontologyTraits.length} descriptores activos</>
                ) : (
                  <>Prefijo de Accesión: {effectiveCropCode}</>
                )}
              </div>
            )}
          </div>
          {confirmDelete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 'var(--radius-md)', background: '#fff1f2', border: '1px solid #fca5a5' }}>
              <span style={{ fontSize: 11.5, color: '#991b1b', fontWeight: 500 }}>¿Eliminar?</span>
              <button
                type="button"
                onClick={onDelete}
                style={{
                  padding: '4px 9px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: '#dc2626',
                  color: 'white',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sí, eliminar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'white',
                  color: 'var(--text-secondary)',
                  fontSize: 11.5,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
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
              className="btn-press"
            >
              <Trash2 size={13} strokeWidth={2} />
              Eliminar
            </button>
          )}
        </div>
      </header>

      {/* Quick stats with actionable direct links */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            ...CARD,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: '#ede9fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Package size={15} color="#7b2d8b" strokeWidth={2} />
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
              {relatedLots.length}
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-tertiary)', marginLeft: 6 }}>
                ({totalAvailableSeeds} sem.)
              </span>
            </p>
            <p style={{ ...MONO_LABEL, marginBottom: 0, marginTop: 2 }}>Lotes de semillas</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setShowInlineLotForm(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 11px',
                borderRadius: 'var(--radius-sm)',
                background: '#7b2d8b',
                color: '#fff',
                fontSize: 11.5,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
              className="btn-press"
              title="Registrar nuevo lote de semillas de esta accesión"
            >
              <Plus size={12} strokeWidth={2.5} />
              Nuevo Lote
            </button>
          </div>
        </div>

        <div
          style={{
            ...CARD,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={15} color="var(--accent)" strokeWidth={2} />
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
              {relatedIndividuals.length}
            </p>
            <p style={{ ...MONO_LABEL, marginBottom: 0, marginTop: 2 }}>Plantas (Individuos)</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => navigate(`/individuals?accessionId=${accession.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 11px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 11.5,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
              className="btn-press"
              title="Sembrar nueva planta para esta accesión"
            >
              <Plus size={12} strokeWidth={2.5} />
              Sembrar
            </button>
          </div>
        </div>
      </div>

      {/* Inline form to add a new SeedLot */}
      {showInlineLotForm && (
        <div
          style={{
            ...CARD,
            marginBottom: 14,
            background: '#faf5ff',
            borderColor: '#d8b4fe',
          }}
        >
          <p style={{ ...MONO_LABEL, color: '#6b21a8', marginBottom: 10 }}>
            Agregar Sobre / Lote de Semillas para {accession.accessionNumber}
          </p>
          <form onSubmit={handleCreateInlineLot} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 130 }}>
              <label style={LABEL_STYLE}>Cantidad de Semillas</label>
              <input
                type="number"
                min={1}
                style={INPUT_STYLE}
                value={inlineLotCount}
                onChange={e => setInlineLotCount(e.target.value)}
                required
              />
            </div>
            <div style={{ flex: 2, minWidth: 180 }}>
              <label style={LABEL_STYLE}>Ubicación de Guardado</label>
              <input
                type="text"
                style={INPUT_STYLE}
                placeholder="Ej. Heladera 1 · Sobre B2"
                value={inlineLotStorage}
                onChange={e => setInlineLotStorage(e.target.value)}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: '#7b2d8b',
                color: 'white',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Guardar Lote
            </button>
          </form>
        </div>
      )}

      {/* Embedded SeedLots of this Accession */}
      <div style={{ ...CARD, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ ...MONO_LABEL, marginBottom: 0 }}>
            Sobres / Lotes de Semillas de esta Variedad ({relatedLots.length})
          </p>
          <button
            type="button"
            onClick={() => navigate(`/seedlots?accessionId=${accession.id}`)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 11.5,
              color: 'var(--accent)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Ver inventario completo →
          </button>
        </div>

        {relatedLots.length === 0 ? (
          <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>
            Esta variedad aún no tiene sobres de semillas registrados. Usa el botón "Nuevo Lote" para cargar stock.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {relatedLots.map(lot => {
              const canSow = lot.status === 'active' && (lot.currentCount === undefined || lot.currentCount > 0)
              return (
                <div
                  key={lot.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border)',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {lot.lotCode}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          padding: '1px 7px',
                          borderRadius: 99,
                          background: lot.status === 'active' ? '#d8f3dc' : '#fee2e2',
                          color: lot.status === 'active' ? '#1b4332' : '#7f1d1d',
                          fontWeight: 600,
                        }}
                      >
                        {lot.currentCount !== undefined ? `${lot.currentCount} sem.` : 'Stock abierto'}
                      </span>
                      {lot.germinationRate !== undefined && (
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                          · {lot.germinationRate}% germ.
                        </span>
                      )}
                    </div>
                    {lot.storageLocation && (
                      <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        Guardado en: {lot.storageLocation}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      disabled={!canSow}
                      onClick={() => navigate(`/individuals?accessionId=${accession.id}&seedLotId=${lot.id}`)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: canSow ? 'var(--accent)' : 'var(--surface-muted)',
                        color: canSow ? 'white' : 'var(--text-tertiary)',
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: canSow ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <Sprout size={11} />
                      Sembrar de este sobre
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Plantas sembradas de esta variedad */}
      {relatedIndividuals.length > 0 && (
        <div style={{ ...CARD, marginBottom: 14 }}>
          <p style={{ ...MONO_LABEL, marginBottom: 10 }}>
            Plantas sembradas de esta variedad ({relatedIndividuals.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {relatedIndividuals.map((ind, idx) => (
              <button
                key={ind.id}
                type="button"
                onClick={() => navigate(`/individuals?selectedId=${ind.id}`)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 9px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: 11.5,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                }}
              >
                <Users size={11} color="var(--accent)" />
                {getIndividualDisplayName(ind, accession.accessionNumber, idx)}
                {ind.currentBBCH !== undefined ? ` · BBCH ${ind.currentBBCH}` : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Aptitud agroclimática local de la variedad */}
      {taxon?.agronomicData && climate && (
        <div style={{ marginBottom: 14 }}>
          <AgroSuitabilityCard
            assessment={agroAssessment}
            climate={climate}
            isLoading={isLoadingClimate}
            error={climateError}
          />
        </div>
      )}

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        {/* Taxonomia */}
        <div style={CARD}>
          <p style={{ ...MONO_LABEL, marginBottom: 14 }}>Especie Botánica (Taxonomia)</p>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {taxon && (
              <>
                <div>
                  <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>FAMILIA</dt>
                  <dd style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 500 }}>{taxon.family}</dd>
                </div>
                <div>
                  <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>ESPECIE</dt>
                  <dd style={{ fontSize: 13.5, color: 'var(--text-primary)', fontStyle: 'italic' }}>
                    {taxon.genus} {taxon.species}
                  </dd>
                </div>
                {(() => {
                  const effectiveCode = getEffectiveCropCode(taxon)
                  if (!effectiveCode) return null
                  return (
                    <div>
                      <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>CROP CODE</dt>
                      <dd>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 7px',
                            background: 'var(--accent-light)',
                            color: 'var(--accent)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid #b7e4c7',
                          }}
                        >
                          {effectiveCode}
                        </span>
                      </dd>
                    </div>
                  )
                })()}
              </>
            )}
          </dl>
        </div>

        {/* Colecta */}
        <div style={CARD}>
          <p style={{ ...MONO_LABEL, marginBottom: 14 }}>Colecta y origen</p>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {accession.acquisitionDate && (
              <div>
                <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>FECHA DE INGRESO</dt>
                <dd style={{ fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar size={12} color="var(--text-tertiary)" />
                  {new Date(accession.acquisitionDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </dd>
              </div>
            )}
            {accession.originCountry && (
              <div>
                <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>PAIS DE ORIGEN</dt>
                <dd style={{ fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Globe size={12} color="var(--text-tertiary)" />
                  {accession.originCountry}
                </dd>
              </div>
            )}
            {accession.originLocality && (
              <div>
                <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>LOCALIDAD</dt>
                <dd style={{ fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={12} color="var(--text-tertiary)" />
                  {accession.originLocality}
                </dd>
              </div>
            )}
            {accession.donorCode && (
              <div>
                <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>CODIGO DONANTE</dt>
                <dd style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{accession.donorCode}</dd>
              </div>
            )}
            {accession.mlsStatus !== undefined && (
              <div>
                <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>ESTADO MLS</dt>
                <dd style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                  {accession.mlsStatus ? 'Bajo Tratado RFAA' : 'Sin MLS'}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Pedigree */}
      {(accession.pedigree || maternalAcc || paternalAcc) && (
        <div style={{ ...CARD, marginBottom: 10 }}>
          <p style={{ ...MONO_LABEL, marginBottom: 14 }}>Pedigri</p>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {accession.pedigree && (
              <div>
                <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>PEDIGREE</dt>
                <dd style={{ fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GitBranch size={12} color="var(--text-tertiary)" />
                  {accession.pedigree}
                </dd>
              </div>
            )}
            {maternalAcc && (
              <div>
                <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>MADRE</dt>
                <dd style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {maternalAcc.accessionNumber}
                </dd>
              </div>
            )}
            {paternalAcc && (
              <div>
                <dt style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>PADRE</dt>
                <dd style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {paternalAcc.accessionNumber}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Remarks */}
      {accession.remarks && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            fontSize: 13.5,
            color: '#78350f',
            marginBottom: 10,
          }}
        >
          {accession.remarks}
        </div>
      )}

      {/* ID */}
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 20 }}>
        id: {accession.id}
      </p>
    </div>
  )
}

// ─── Modal para agregar especie al vuelo desde GBIF + EcoCrop ─────────────────

function QuickAddTaxonModal({
  isOpen,
  onClose,
  onTaxonCreated,
}: {
  isOpen: boolean
  onClose: () => void
  onTaxonCreated: (taxonId: string) => void
}) {
  const { add } = useTaxonStore()
  const [query, setQuery] = useState('')
  const [isEnriching, setIsEnriching] = useState(false)
  const { data: results, isLoading } = useTaxonomySearch(query)

  if (!isOpen) return null

  const handleSelect = async (r: any) => {
    setIsEnriching(true)
    try {
      const enriched = await enrichTaxonomySearchResult(r)
      const created = add({
        family: enriched.family,
        genus: enriched.genus,
        species: enriched.species,
        commonName: enriched.commonName,
        cropCode: enriched.cropCode,
        imageUrl: enriched.imageUrl,
        agronomicData: enriched.agronomicData,
        traits: enriched.traits,
      })

      onTaxonCreated(created.id)
      onClose()
    } finally {
      setIsEnriching(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 480,
          boxShadow: 'var(--shadow-md)',
          padding: 22,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <LeafyGreen size={16} color="var(--accent)" />
            Descubrir Especie Botánica (GBIF + EcoCrop)
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre científico (ej. Solanum, Zea...)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            style={{ ...INPUT_STYLE, paddingLeft: 30 }}
          />
        </div>

        {isEnriching && (
          <div style={{ padding: 12, fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Loader2 size={14} className="animate-spin" />
            Enriqueciendo con ontología y datos climáticos FAO EcoCrop...
          </div>
        )}

        <div style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {isLoading && <p style={{ fontSize: 12, textAlign: 'center', color: 'var(--text-tertiary)', padding: 12 }}>Buscando en GBIF...</p>}
          {!isLoading && query.length > 2 && results?.length === 0 && (
            <p style={{ fontSize: 12, textAlign: 'center', color: 'var(--text-tertiary)', padding: 12 }}>No se encontraron especies.</p>
          )}
          {results?.map(r => (
            <div
              key={r.id}
              onClick={() => handleSelect(r)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--surface-base)',
                cursor: 'pointer',
              }}
              className="btn-press"
            >
              {r.imageUrl ? (
                <img src={r.imageUrl} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 28, height: 28, borderRadius: 4, background: '#d8f3dc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LeafyGreen size={14} color="#1b4332" />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {r.commonName || r.scientificName}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  {r.scientificName} ({r.family})
                </p>
              </div>
              <Plus size={14} color="var(--accent)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AccessionsPage() {
  const { accessions, add, remove } = useAccessionStore()
  const { taxons } = useTaxonStore()
  const { seedLots, add: addSeedLot } = useSeedLotStore()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showQuickAddTaxon, setShowQuickAddTaxon] = useState(false)

  // Form state
  const [accessionNumber, setAccessionNumber] = useState('')
  const [taxonId, setTaxonId] = useState('')
  const [source, setSource] = useState<AcquisitionSource>('unknown')
  const [cultivarName, setCultivarName] = useState('')
  const [acquisitionDate, setAcquisitionDate] = useState('')
  const [originCountry, setOriginCountry] = useState('')
  const [pedigree, setPedigree] = useState('')
  const [remarks, setRemarks] = useState('')

  // Stock inicial opcional (Crea Lote L1 en el mismo paso)
  const [initialSeedCount, setInitialSeedCount] = useState('')
  const [initialStorageLocation, setInitialStorageLocation] = useState('')

  // Auto-prefix number by crop code when taxon is selected
  const handleTaxonChange = (id: string) => {
    setTaxonId(id)
    if (!id) return
    const taxon = taxons.find(t => t.id === id)
    if (!taxon) return
    const effectiveCode = getEffectiveCropCode(taxon)
    if (!effectiveCode) return
    const year = new Date().getFullYear()
    // Replace existing prefix pattern or set fresh
    const numPart = accessionNumber.replace(/^[A-Z0-9_]+-\d+-/, '')
    setAccessionNumber(`${effectiveCode}-${year}-${numPart || '001'}`)
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessionNumber.trim() || !taxonId) return
    const newAcc = add({
      accessionNumber: accessionNumber.trim(),
      taxonId,
      acquisitionSource: source,
      cultivarName: cultivarName || undefined,
      acquisitionDate: acquisitionDate || undefined,
      originCountry: originCountry || undefined,
      pedigree: pedigree || undefined,
      remarks: remarks || undefined,
    })

    // Si el usuario ingresó un stock inicial de semillas, crear el Lote L1 automáticamente
    const parsedSeedCount = initialSeedCount.trim() ? Number(initialSeedCount) : 0
    if (parsedSeedCount > 0 && !Number.isNaN(parsedSeedCount)) {
      addSeedLot({
        accessionId: newAcc.id,
        lotCode: `${newAcc.accessionNumber}-L1`,
        initialCount: parsedSeedCount,
        storageLocation: initialStorageLocation.trim() || undefined,
        harvestDate: acquisitionDate || new Date().toISOString().slice(0, 10),
      })
    }

    setSelectedId(newAcc.id)
    setAccessionNumber('')
    setTaxonId('')
    setSource('unknown')
    setCultivarName('')
    setAcquisitionDate('')
    setOriginCountry('')
    setPedigree('')
    setRemarks('')
    setInitialSeedCount('')
    setInitialStorageLocation('')
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return accessions
    return accessions.filter(acc => {
      const taxon = taxons.find(t => t.id === acc.taxonId)
      return (
        acc.accessionNumber.toLowerCase().includes(q) ||
        acc.cultivarName?.toLowerCase().includes(q) ||
        taxon?.genus.toLowerCase().includes(q) ||
        taxon?.species.toLowerCase().includes(q) ||
        taxon?.commonName?.toLowerCase().includes(q)
      )
    })
  }, [accessions, taxons, search])

  const selectedAccession = accessions.find(a => a.id === selectedId)

  const handleDelete = () => {
    if (!selectedAccession) return
    remove(selectedAccession.id)
    setSelectedId(null)
  }

  const SECTION_MONO: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface-base)' }}>
      <SeedBankTabs active="accessions" />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Sidebar ── */}
        <aside
          style={{
            width: 360,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--surface-elevated)',
            borderRight: '1px solid var(--border)',
            overflow: 'hidden',
          }}
        >
          {/* Form */}
          <div
            style={{
              padding: '18px 18px',
              borderBottom: '1px solid var(--border)',
              overflowY: 'auto',
              maxHeight: '62vh',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
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
                <Sprout size={14} color="var(--accent)" strokeWidth={2} />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  Nueva Variedad (Accesion)
                </h2>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  Pasaporte genético + Lote inicial opcional
                </p>
              </div>
            </div>

            <form style={{ display: 'flex', flexDirection: 'column', gap: 11 }} onSubmit={handleAdd}>
              {/* Especie (Taxon) - matches test label */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <label htmlFor="taxon-select" style={{ ...LABEL_STYLE, marginBottom: 0 }}>
                    Especie (Taxon) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddTaxon(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      padding: '2px 4px',
                    }}
                    title="Buscar y agregar especie al vuelo desde GBIF"
                  >
                    <Plus size={11} strokeWidth={2.5} /> Buscar en GBIF
                  </button>
                </div>
                <select
                  id="taxon-select"
                  aria-label="Especie (Taxón)"
                  style={INPUT_STYLE}
                  value={taxonId}
                  onChange={e => handleTaxonChange(e.target.value)}
                  required
                >
                  <option value="" disabled>Seleccionar especie...</option>
                  {taxons.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.genus} {t.species}{t.commonName ? ` (${t.commonName})` : ''}
                    </option>
                  ))}
                </select>
                {taxons.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setShowQuickAddTaxon(true)}
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: '7px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px dashed var(--accent)',
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                    }}
                  >
                    <Plus size={13} /> Buscar y agregar especie al vuelo
                  </button>
                )}
              </div>

              {/* Accession Number - matches test aria */}
              <div>
                <label htmlFor="acc-number" style={LABEL_STYLE}>
                  Accession Number <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="acc-number"
                  aria-label="Accession Number"
                  type="text"
                  style={{ ...INPUT_STYLE, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  placeholder="PLT-2026-001"
                  value={accessionNumber}
                  onChange={e => setAccessionNumber(e.target.value)}
                  required
                />
              </div>

              {/* Origen de Adquisicion - matches test label */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label htmlFor="source-select" style={LABEL_STYLE}>Origen de Adquisicion</label>
                  <select
                    id="source-select"
                    aria-label="Origen de Adquisición"
                    style={INPUT_STYLE}
                    value={source}
                    onChange={e => setSource(e.target.value as AcquisitionSource)}
                  >
                    {(Object.entries(SOURCE_LABELS) as [AcquisitionSource, string][]).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Cultivar / Linea</label>
                  <input
                    type="text"
                    style={INPUT_STYLE}
                    placeholder="Ej. Platense..."
                    value={cultivarName}
                    onChange={e => setCultivarName(e.target.value)}
                  />
                </div>
              </div>

              {/* Stock Inicial de Semillas (crea Lote L1 en el mismo paso) */}
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: '#faf5ff',
                  border: '1px solid #e9d5ff',
                }}
              >
                <span
                  style={{
                    ...SECTION_MONO,
                    color: '#6b21a8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    marginBottom: 8,
                  }}
                >
                  <Package size={11} />
                  Sobre / Lote Inicial (Opcional)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label htmlFor="initial-seed-count" style={LABEL_STYLE}>
                      Stock Inicial de Semillas
                    </label>
                    <input
                      id="initial-seed-count"
                      aria-label="Stock Inicial de Semillas"
                      type="number"
                      min={0}
                      style={INPUT_STYLE}
                      placeholder="Ej. 100"
                      value={initialSeedCount}
                      onChange={e => setInitialSeedCount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="initial-seed-storage" style={LABEL_STYLE}>
                      Guardado en
                    </label>
                    <input
                      id="initial-seed-storage"
                      type="text"
                      style={INPUT_STYLE}
                      placeholder="Heladera 1..."
                      value={initialStorageLocation}
                      onChange={e => setInitialStorageLocation(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Pais + Pedigree */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={LABEL_STYLE}>Pais de origen (ISO 3)</label>
                  <input
                    type="text"
                    style={INPUT_STYLE}
                    placeholder="ARG"
                    maxLength={3}
                    value={originCountry}
                    onChange={e => setOriginCountry(e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Pedigree</label>
                  <input
                    type="text"
                    style={INPUT_STYLE}
                    placeholder="A x B"
                    value={pedigree}
                    onChange={e => setPedigree(e.target.value)}
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label style={LABEL_STYLE}>Observaciones</label>
                <textarea
                  style={{ ...INPUT_STYLE, resize: 'none', height: 50 }}
                  placeholder="Notas adicionales..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
              </div>

              <button
                type="submit"
                aria-label="Agregar"
                disabled={!accessionNumber.trim() || !taxonId}
                className="btn-press"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  padding: '9px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: (accessionNumber.trim() && taxonId) ? 'var(--accent)' : 'var(--surface-muted)',
                  color: (accessionNumber.trim() && taxonId) ? 'white' : 'var(--text-tertiary)',
                  fontSize: 13,
                  fontWeight: 500,
                  border: 'none',
                  cursor: (accessionNumber.trim() && taxonId) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={14} strokeWidth={2.5} />
                Agregar
              </button>
            </form>
          </div>

          {/* Search + List */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={13}
                  strokeWidth={2}
                  color="var(--text-tertiary)"
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
                <input
                  type="text"
                  style={{ ...INPUT_STYLE, paddingLeft: 30, fontSize: 12.5 }}
                  placeholder="Buscar variedad, especie..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div style={{ padding: '10px 14px 6px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={SECTION_MONO}>Variedades ({filtered.length})</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 12px' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <Sprout size={30} color="var(--surface-muted)" style={{ margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                    {accessions.length === 0 ? 'No hay accesiones' : 'Sin resultados.'}
                  </p>
                </div>
              ) : (
                filtered.map(acc => {
                  const taxon = taxons.find(t => t.id === acc.taxonId)
                  const srcCfg = SOURCE_COLORS[acc.acquisitionSource]
                  const isSelected = acc.id === selectedId
                  const accLotsCount = seedLots.filter(l => l.accessionId === acc.id && l.status === 'active').length

                  return (
                    <motion.button
                      key={acc.id}
                      onClick={() => setSelectedId(acc.id)}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'var(--accent-light)' : 'transparent',
                        border: isSelected ? '1px solid #b7e4c7' : '1px solid transparent',
                        cursor: 'pointer',
                        display: 'block',
                        marginBottom: 2,
                      }}
                      whileHover={!isSelected ? { backgroundColor: '#f2f1ef' } : {}}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                              fontFamily: 'var(--font-mono)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {acc.accessionNumber}
                          </p>
                          <p
                            style={{
                              fontSize: 11.5,
                              color: 'var(--text-tertiary)',
                              fontStyle: 'italic',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {taxon ? `${taxon.genus} ${taxon.species}` : 'Sin taxonomia'}
                            {accLotsCount > 0 ? ` · ${accLotsCount} lote${accLotsCount > 1 ? 's' : ''}` : ''}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, marginLeft: 8 }}>
                          <span
                            style={{
                              fontSize: 10.5,
                              padding: '2px 6px',
                              borderRadius: 99,
                              background: srcCfg.bg,
                              color: srcCfg.text,
                              fontWeight: 500,
                            }}
                          >
                            {SOURCE_LABELS[acc.acquisitionSource]}
                          </span>
                          <ChevronRight
                            size={12}
                            strokeWidth={2}
                            color={isSelected ? 'var(--accent)' : 'var(--text-tertiary)'}
                          />
                        </div>
                      </div>
                    </motion.button>
                  )
                })
              )}
            </div>
          </div>
        </aside>

        {/* ── Main detail area ── */}
        <main style={{ flex: 1, background: 'var(--surface-base)', overflow: 'hidden' }}>
          <AnimatePresence>
            {selectedAccession ? (
              <motion.div
                key={selectedAccession.id}
                style={{ height: '100%', overflowY: 'auto' }}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <AccessionDetail accession={selectedAccession} onDelete={handleDelete} />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                style={{
                  height: '100%',
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
                <Sprout size={52} strokeWidth={1} color="var(--surface-muted)" />
                <p style={{ fontSize: 13.5, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  {accessions.length === 0 ? 'No hay accesiones' : 'Selecciona una accesion'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {accessions.length === 0
                    ? 'Registra la primera usando el formulario.'
                    : 'para ver sus detalles aqui.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Modal para alta rápida de especies desde GBIF + EcoCrop */}
      <QuickAddTaxonModal
        isOpen={showQuickAddTaxon}
        onClose={() => setShowQuickAddTaxon(false)}
        onTaxonCreated={id => handleTaxonChange(id)}
      />
    </div>
  )
}
