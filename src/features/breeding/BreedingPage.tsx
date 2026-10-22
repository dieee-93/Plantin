import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAccessionStore } from '@/store/accessionStore'
import { useTaxonStore } from '@/store/taxonStore'
import { useIndividualStore } from '@/store/individualStore'
import { useObservationStore } from '@/store/observationStore'
import { useSeedLotStore } from '@/store/seedLotStore'
import { useCrossingStore } from '@/store/crossingStore'
import { getTraitsForCrop, getEffectiveCropCode } from '@/domain/ontology/index'
import type { Taxon } from '@/domain/taxon'
import type { CrossEventType } from '@/domain/crossingEvent'
import {
  Dna, GitMerge, Leaf, ArrowDown, CheckCircle2, ChevronRight,
  Sparkles, Package, FlaskConical
} from 'lucide-react'

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

const CROSS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  controlled:      { label: 'Controlado (Manual)',   bg: '#fce7f3', text: '#831843' },
  open_pollinated: { label: 'Polinización Abierta',  bg: '#dbeafe', text: '#1e3a5f' },
  self:            { label: 'Autofecundación (Self)', bg: '#ede9fe', text: '#4c1d95' },
}

function ParentPhenotypeHint({ accessionId }: { accessionId: string }) {
  const { accessions } = useAccessionStore()
  const { taxons } = useTaxonStore()
  const { individuals } = useIndividualStore()
  const { observations } = useObservationStore()

  if (!accessionId) return null
  const acc = accessions.find(a => a.id === accessionId)
  if (!acc) return null
  const taxon = taxons.find(t => t.id === acc.taxonId)
  const cropCode = taxon ? getEffectiveCropCode(taxon) : ''
  const traits = cropCode ? getTraitsForCrop(cropCode) : []

  const accIndividuals = individuals.filter(i => i.accessionId === accessionId)
  const floweringCount = accIndividuals.filter(i => i.currentBBCH !== undefined && i.currentBBCH >= 50 && i.currentBBCH <= 69).length
  const accObs = observations.filter(o => accIndividuals.some(i => i.id === o.individualId))

  if (accIndividuals.length === 0 && accObs.length === 0) return null

  return (
    <div
      style={{
        marginTop: 8,
        padding: '7px 10px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--surface-elevated)',
        border: '1px solid var(--border)',
        fontSize: 11,
        color: 'var(--text-secondary)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          {accIndividuals.length} planta{accIndividuals.length === 1 ? '' : 's'} en cultivo
          {floweringCount > 0 ? ` (${floweringCount} en floración)` : ''}
        </span>
        {accObs.length > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontWeight: 600 }}>
            <FlaskConical size={10} />
            {accObs.length} obs.
          </span>
        )}
      </div>
      {accObs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
          {accObs.slice(-3).map(o => {
            const tr = traits.find(t => t.id === o.traitId)
            return (
              <span
                key={o.id}
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: 'var(--surface-subtle)',
                  border: '1px solid var(--border)',
                }}
              >
                {tr?.name ?? o.traitId}: {String(o.value)}{tr?.unit ? ` ${tr.unit}` : ''}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function BreedingPage() {
  const navigate = useNavigate()
  const { accessions, add: addAccession } = useAccessionStore()
  const { taxons } = useTaxonStore()
  const { seedLots, add: addSeedLot } = useSeedLotStore()
  const { crossings, add: addCrossing } = useCrossingStore()

  const [maternalId, setMaternalId] = useState('')
  const [paternalId, setPaternalId] = useState('')
  const [newAccessionNumber, setNewAccessionNumber] = useState('')
  const [crossType, setCrossType] = useState('controlled')
  const [harvestedSeedCount, setHarvestedSeedCount] = useState('')
  const [remarks, setRemarks] = useState('')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleMaternalChange = (id: string) => {
    setMaternalId(id)
    if (!id) return
    const maternalAcc = accessions.find(a => a.id === id)
    if (!maternalAcc) return
    const taxon = taxons.find(t => t.id === maternalAcc.taxonId)
    const code = taxon?.cropCode || 'HYB'
    const year = new Date().getFullYear()
    const count = accessions.filter(a => a.acquisitionSource === 'breeding').length + 1
    if (!newAccessionNumber.trim()) {
      setNewAccessionNumber(`F1-${code}-${year}-${String(count).padStart(3, '0')}`)
    }
  }

  const handleCross = (e: React.FormEvent) => {
    e.preventDefault()
    if (!maternalId || !newAccessionNumber.trim()) return

    const maternalAcc = accessions.find(a => a.id === maternalId)
    const paternalAcc = accessions.find(a => a.id === paternalId)

    const pedigreeStr = paternalAcc
      ? `${maternalAcc?.accessionNumber} × ${paternalAcc.accessionNumber}`
      : `${maternalAcc?.accessionNumber} (${crossType === 'self' ? 'Self' : 'Open'})`

    const crossInfo = CROSS_LABELS[crossType]?.label ?? crossType
    const createdCode = newAccessionNumber.trim()

    // 1. Promover nueva Accesión F1 / S1 con genealogía bloqueada
    const createdAcc = addAccession({
      accessionNumber: createdCode,
      taxonId: maternalAcc?.taxonId || '',
      acquisitionSource: 'breeding',
      pedigree: pedigreeStr,
      maternalAccessionId: maternalId,
      paternalAccessionId: paternalId || undefined,
      acquisitionDate: new Date().toISOString().slice(0, 10),
      remarks: remarks.trim() ? `${crossInfo}. ${remarks.trim()}` : `Cruzamiento: ${crossInfo}.`,
    })

    // 2. Si se cosecharon semillas F1, crear automáticamente el Lote de Semillas F1 en inventario
    const parsedSeeds = harvestedSeedCount.trim() ? Number(harvestedSeedCount) : 0
    let createdLotId: string | undefined = undefined
    if (parsedSeeds > 0 && !Number.isNaN(parsedSeeds)) {
      const lot = addSeedLot({
        accessionId: createdAcc.id,
        lotCode: `${createdCode}-L1`,
        initialCount: parsedSeeds,
        harvestDate: new Date().toISOString().slice(0, 10),
      })
      createdLotId = lot.id
    }

    // 3. Registrar el CrossingEvent trazable en crossingStore
    const mappedCrossEventType: CrossEventType =
      crossType === 'self' || !paternalId
        ? (crossType === 'open_pollinated' ? 'open' : 'self')
        : 'biparental'

    addCrossing({
      crossName: `CROSS-${createdCode}`,
      maternalParentId: maternalId,
      paternalParentId: mappedCrossEventType === 'self' ? maternalId : (paternalId || maternalId),
      crossType: mappedCrossEventType,
      crossDate: new Date().toISOString().slice(0, 10),
      plannedOffspringCount: parsedSeeds > 0 ? parsedSeeds : undefined,
      resultingSeedLotId: createdLotId,
      successStatus: createdLotId ? 'successful' : 'pending',
      notes: remarks.trim() || undefined,
    })

    setMaternalId('')
    setPaternalId('')
    setNewAccessionNumber('')
    setHarvestedSeedCount('')
    setRemarks('')
    setSuccessMsg(
      createdLotId
        ? `Cruza promovida: línea ${createdCode} y lote ${createdCode}-L1 (${parsedSeeds} sem.) listos en el banco.`
        : `Cruza registrada: nueva línea genética ${createdCode} incorporada al banco.`
    )
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  const breedingAccessions = accessions.filter(a => a.acquisitionSource === 'breeding')

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--surface-base)' }}>
      {/* ── Sidebar Form ── */}
      <aside
        style={{
          width: 390,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-elevated)',
          borderRight: '1px solid var(--border)',
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: '24px 22px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: '#fce7f3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GitMerge size={15} color="#9d174d" strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Nuevo Cruzamiento
              </h2>
              <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                Paso 4 · Selección parental, promoción F1 y lote
              </p>
            </div>
          </div>

          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  marginTop: 14,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: '#d8f3dc',
                  border: '1px solid #b7e4c7',
                  color: '#1b4332',
                  fontSize: 12,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CheckCircle2 size={14} color="#2d6a4f" style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }} onSubmit={handleCross}>
            {/* Parental Materno (♀) */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ ...MONO_LABEL, color: '#9d174d' }}>♀ Parental Materno (Receptor) *</span>
              </div>
              <select
                aria-label="Parental Materno"
                style={INPUT_STYLE}
                value={maternalId}
                onChange={e => handleMaternalChange(e.target.value)}
                required
              >
                <option value="" disabled>Seleccione accesión madre...</option>
                {accessions.map(a => {
                  const t = taxons.find(tx => tx.id === a.taxonId)
                  return (
                    <option key={a.id} value={a.id}>
                      {a.accessionNumber}{a.cultivarName ? ` (${a.cultivarName})` : ''}{t ? ` · ${t.genus} ${t.species}` : ''}
                    </option>
                  )
                })}
              </select>
              <ParentPhenotypeHint accessionId={maternalId} />
            </div>

            {/* Parental Paterno (♂) */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ ...MONO_LABEL, color: '#1e6091' }}>♂ Parental Paterno (Donante Polen)</span>
              </div>
              <select
                aria-label="Parental Paterno"
                style={INPUT_STYLE}
                value={paternalId}
                onChange={e => setPaternalId(e.target.value)}
              >
                <option value="">(Ninguno / Polinización Abierta / Self)</option>
                {accessions.filter(a => a.id !== maternalId).map(a => {
                  const t = taxons.find(tx => tx.id === a.taxonId)
                  return (
                    <option key={a.id} value={a.id}>
                      {a.accessionNumber}{a.cultivarName ? ` (${a.cultivarName})` : ''}{t ? ` · ${t.genus} ${t.species}` : ''}
                    </option>
                  )
                })}
              </select>
              <ParentPhenotypeHint accessionId={paternalId} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
              <ArrowDown size={15} />
            </div>

            {/* Línea resultante + Lote F1 */}
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-subtle)',
                border: '1px solid #b7e4c7',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <span style={{ ...MONO_LABEL, color: 'var(--accent)' }}>Línea Genética Resultante (F1 / S1)</span>

              <div>
                <label htmlFor="breeding-acc-number" style={LABEL_STYLE}>
                  Código de Accesión Resultante *
                </label>
                <input
                  id="breeding-acc-number"
                  type="text"
                  style={{ ...INPUT_STYLE, fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
                  placeholder="Ej. F1-TOM-2026-001"
                  value={newAccessionNumber}
                  onChange={e => setNewAccessionNumber(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label htmlFor="breeding-cross-type" style={LABEL_STYLE}>
                    Método de Polinización
                  </label>
                  <select
                    id="breeding-cross-type"
                    style={INPUT_STYLE}
                    value={crossType}
                    onChange={e => setCrossType(e.target.value)}
                  >
                    <option value="controlled">Controlado (Manual)</option>
                    <option value="open_pollinated">Polinización Abierta</option>
                    <option value="self">Autofecundación (Self)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="breeding-f1-seeds" style={LABEL_STYLE}>
                    Semillas F1 Cosechadas
                  </label>
                  <input
                    id="breeding-f1-seeds"
                    aria-label="Semillas F1 Cosechadas"
                    type="number"
                    min="0"
                    style={INPUT_STYLE}
                    placeholder="Opcional (crea L1)"
                    value={harvestedSeedCount}
                    onChange={e => setHarvestedSeedCount(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="breeding-remarks" style={LABEL_STYLE}>
                  Notas de la Polinización
                </label>
                <textarea
                  id="breeding-remarks"
                  style={{ ...INPUT_STYLE, resize: 'none', height: 60 }}
                  placeholder="Observaciones de emasculación, viabilidad de polen, objetivos..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!maternalId || !newAccessionNumber.trim()}
              className="btn-press"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                background: (maternalId && newAccessionNumber.trim()) ? 'var(--accent)' : 'var(--surface-muted)',
                color: (maternalId && newAccessionNumber.trim()) ? 'white' : 'var(--text-tertiary)',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: (maternalId && newAccessionNumber.trim()) ? 'pointer' : 'not-allowed',
                boxShadow: (maternalId && newAccessionNumber.trim()) ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <GitMerge size={14} strokeWidth={2.2} />
              Generar Nueva Accesión
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main Area: Historial de Hibridación ── */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 40px',
          background: 'var(--surface-base)',
        }}
      >
        <header style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 10.5,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 6,
                  background: '#fce7f3',
                  color: '#9d174d',
                }}
              >
                PASO 04
              </span>
              <h1
                style={{
                  fontSize: 25,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                Laboratorio de Cruzas e Hibridación
              </h1>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
              Líneas genéticas F1/S1, eventos de polinización ({crossings.length}) y lotes de semillas híbridas.
            </p>
          </div>

          <span
            style={{
              fontSize: 11.5,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              padding: '4px 11px',
              borderRadius: 99,
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            {breedingAccessions.length} {breedingAccessions.length === 1 ? 'línea' : 'líneas'}
          </span>
        </header>

        {breedingAccessions.length === 0 ? (
          <div
            style={{
              padding: '56px 24px',
              textAlign: 'center',
              border: '1px dashed var(--border-strong)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface-elevated)',
            }}
          >
            <Dna size={42} strokeWidth={1.25} color="var(--text-tertiary)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              Sin Hibridaciones Registradas
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', maxWidth: 380, margin: '0 auto' }}>
              Utiliza el panel lateral para registrar tu primera cruza controlada o autofecundación entre variedades del banco.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 14,
            }}
          >
            {breedingAccessions.map((acc, i) => {
              const taxon = taxons.find((t: Taxon) => t.id === acc.taxonId)
              const mother = acc.maternalAccessionId
                ? accessions.find(a => a.id === acc.maternalAccessionId)
                : undefined
              const father = acc.paternalAccessionId
                ? accessions.find(a => a.id === acc.paternalAccessionId)
                : undefined
              const f1Lots = seedLots.filter(l => l.accessionId === acc.id)

              return (
                <motion.div
                  key={acc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 22px',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--accent-light)',
                          color: 'var(--accent)',
                          fontSize: 10.5,
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          border: '1px solid #b7e4c7',
                        }}
                      >
                        <Sparkles size={10} />
                        F1 / BREED
                      </span>
                      <Leaf size={14} color="var(--text-tertiary)" />
                    </div>

                    <h3
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        marginBottom: 2,
                      }}
                    >
                      {acc.accessionNumber}
                    </h3>
                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 14 }}>
                      {taxon ? `${taxon.genus} ${taxon.species}` : 'Taxón Desconocido'}
                    </p>

                    {/* Pedigree Box */}
                    <div
                      style={{
                        background: 'var(--surface-subtle)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 14px',
                        marginBottom: 12,
                      }}
                    >
                      <p style={{ ...MONO_LABEL, marginBottom: 6 }}>Árbol de Pedigrí</p>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <GitMerge size={13} color="#9d174d" />
                        <span>{acc.pedigree || 'Desconocido'}</span>
                      </div>

                      {(mother || father) && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                          {mother && (
                            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#9d174d', background: '#fce7f3', padding: '1px 6px', borderRadius: 4 }}>
                              ♀ {mother.accessionNumber}
                            </span>
                          )}
                          {father && (
                            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#1e6091', background: '#dbeafe', padding: '1px 6px', borderRadius: 4 }}>
                              ♂ {father.accessionNumber}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Lotes F1 cosechados */}
                    {f1Lots.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ ...MONO_LABEL, marginBottom: 5 }}>Lote F1 en Banco</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {f1Lots.map(lot => (
                            <span
                              key={lot.id}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-sm)',
                                background: '#ede9fe',
                                border: '1px solid #c4b5fd',
                                color: '#5b21b6',
                                fontSize: 11,
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 600,
                              }}
                            >
                              <Package size={10} />
                              {lot.lotCode}
                              {lot.currentCount !== undefined ? ` (${lot.currentCount} sem.)` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {acc.remarks && (
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.45 }}>
                        {acc.remarks}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const firstLot = f1Lots[0]
                        navigate(
                          firstLot
                            ? `/individuals?accessionId=${acc.id}&seedLotId=${firstLot.id}`
                            : `/individuals?accessionId=${acc.id}`
                        )
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      Sembrar F1
                      <ChevronRight size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate('/accessions')}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: 11.5,
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                      }}
                    >
                      Ver en Banco de Semillas
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
