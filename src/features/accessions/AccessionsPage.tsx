import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAccessionStore } from '@/store/accessionStore'
import { useTaxonStore } from '@/store/taxonStore'
import { useIndividualStore } from '@/store/individualStore'
import { useSeedLotStore } from '@/store/seedLotStore'
import type { Accession, AcquisitionSource } from '@/domain/accession'
import {
  Sprout, Plus, Search, Trash2, Info, Globe, GitBranch,
  ChevronRight, Package, Users, Calendar, MapPin, Edit2, Check, X
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
  const { taxons } = useTaxonStore()
  const { accessions } = useAccessionStore()
  const { individuals } = useIndividualStore()
  const { seedLots } = useSeedLotStore()

  const taxon = taxons.find(t => t.id === accession.taxonId)
  const maternalAcc = accession.maternalAccessionId
    ? accessions.find(a => a.id === accession.maternalAccessionId)
    : null
  const paternalAcc = accession.paternalAccessionId
    ? accessions.find(a => a.id === accession.paternalAccessionId)
    : null

  const relatedIndividuals = individuals.filter(i => i.accessionId === accession.id)
  const relatedLots = seedLots.filter(l => l.accessionId === accession.id)
  const srcCfg = SOURCE_COLORS[accession.acquisitionSource]

  return (
    <div style={{ padding: '36px 44px', maxWidth: 780, height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <header style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
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
          </div>
          <button
            onClick={onDelete}
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
        </div>
      </header>

      {/* Quick stats */}
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
            <p style={{ ...MONO_LABEL, marginBottom: 0, marginTop: 2 }}>Individuos</p>
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
            </p>
            <p style={{ ...MONO_LABEL, marginBottom: 0, marginTop: 2 }}>Lotes de semillas</p>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        {/* Taxonomia */}
        <div style={CARD}>
          <p style={{ ...MONO_LABEL, marginBottom: 14 }}>Taxonomia</p>
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
                {taxon.cropCode && (
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
                        {taxon.cropCode}
                      </span>
                    </dd>
                  </div>
                )}
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AccessionsPage() {
  const { accessions, add, remove } = useAccessionStore()
  const { taxons } = useTaxonStore()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Form state
  const [accessionNumber, setAccessionNumber] = useState('')
  const [taxonId, setTaxonId] = useState('')
  const [source, setSource] = useState<AcquisitionSource>('unknown')
  const [cultivarName, setCultivarName] = useState('')
  const [acquisitionDate, setAcquisitionDate] = useState('')
  const [originCountry, setOriginCountry] = useState('')
  const [pedigree, setPedigree] = useState('')
  const [remarks, setRemarks] = useState('')

  // Auto-prefix number by crop code when taxon is selected
  const handleTaxonChange = (id: string) => {
    setTaxonId(id)
    if (!id) return
    const taxon = taxons.find(t => t.id === id)
    if (!taxon?.cropCode) return
    const year = new Date().getFullYear()
    // Replace existing prefix pattern or set fresh
    const numPart = accessionNumber.replace(/^[A-Z]+-\d+-/, '')
    setAccessionNumber(`${taxon.cropCode}-${year}-${numPart || '001'}`)
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
    setSelectedId(newAcc.id)
    setAccessionNumber('')
    setTaxonId('')
    setSource('unknown')
    setCultivarName('')
    setAcquisitionDate('')
    setOriginCountry('')
    setPedigree('')
    setRemarks('')
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
    if (confirm('Eliminar esta acesion? Esta accion no se puede deshacer.')) {
      remove(selectedAccession.id)
      setSelectedId(null)
    }
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
    <div style={{ display: 'flex', height: '100%', background: 'var(--surface-base)' }}>
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
            padding: '20px 18px',
            borderBottom: '1px solid var(--border)',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
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
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Nueva Accesion
            </h2>
          </div>

          <form style={{ display: 'flex', flexDirection: 'column', gap: 12 }} onSubmit={handleAdd}>
            {/* Especie (Taxon) - matches test label */}
            <div>
              <label htmlFor="taxon-select" style={LABEL_STYLE}>
                Especie (Taxon) <span style={{ color: '#dc2626' }}>*</span>
              </label>
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
                <p style={{ fontSize: 11, color: '#b45309', marginTop: 3 }}>
                  No hay taxones. Registra primero en Taxonomia.
                </p>
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

            {/* Cultivar + Fecha */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={LABEL_STYLE}>Cultivar / Linea</label>
                <input
                  type="text"
                  style={INPUT_STYLE}
                  placeholder="Nombre..."
                  value={cultivarName}
                  onChange={e => setCultivarName(e.target.value)}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Fecha de ingreso</label>
                <input
                  type="date"
                  style={INPUT_STYLE}
                  value={acquisitionDate}
                  onChange={e => setAcquisitionDate(e.target.value)}
                />
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
                style={{ ...INPUT_STYLE, resize: 'none', height: 60 }}
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
                placeholder="Buscar accesion, especie..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div style={{ padding: '10px 14px 6px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={SECTION_MONO}>Accesiones</span>
            <span
              style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                background: 'var(--surface-muted)',
                padding: '1px 7px',
                borderRadius: 99,
              }}
            >
              {filtered.length}
            </span>
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
                    whileHover={!isSelected ? { backgroundColor: 'var(--surface-subtle)' } : {}}
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
        <AnimatePresence mode="wait">
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
  )
}
