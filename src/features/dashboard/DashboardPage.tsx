import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAccessionStore } from '@/store/accessionStore'
import { useIndividualStore } from '@/store/individualStore'
import { useTaxonStore } from '@/store/taxonStore'
import { useSeedLotStore } from '@/store/seedLotStore'
import { useLocationStore } from '@/store/locationStore'
import { useObservationStore } from '@/store/observationStore'
import { useCrossingStore } from '@/store/crossingStore'
import { useAgroClimateStore } from '@/store/agroClimateStore'
import { LocationClimateCard } from '@/components/LocationClimateCard'
import {
  Sprout, Users, Leaf, Package, Map, FlaskConical,
  GitBranch, ArrowRight, CheckCircle2, Sparkles, Compass
} from 'lucide-react'

// ─── Shared styles ────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: 'var(--surface-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '22px 24px',
  boxShadow: 'var(--shadow-sm)',
}

const MONO_LABEL: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: 'var(--text-tertiary)',
  fontFamily: 'var(--font-mono)',
  marginBottom: 10,
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accentColor,
  onClick,
  delay = 0,
}: {
  label: string
  value: number | string
  sub?: string
  icon: React.ElementType
  accentColor: string
  onClick?: () => void
  delay?: number
}) {
  return (
    <motion.div
      style={{
        ...CARD,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={MONO_LABEL}>{label}</p>
          <p
            style={{
              fontSize: 34,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1,
              letterSpacing: '-0.03em',
              fontFamily: 'var(--font-sans)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {value}
          </p>
          {sub && (
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>{sub}</p>
          )}
        </div>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-md)',
            background: `${accentColor}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={17} color={accentColor} strokeWidth={2} />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Workflow Stepper (Guía de Flujo del Usuario) ─────────────────────────────

function WorkflowPipeline() {
  const navigate = useNavigate()
  const { locations } = useLocationStore()
  const { currentClimate } = useAgroClimateStore()
  const { accessions } = useAccessionStore()
  const { seedLots } = useSeedLotStore()
  const { individuals } = useIndividualStore()
  const { observations } = useObservationStore()
  const { crossings } = useCrossingStore()

  const activePlants = individuals.filter(i => i.status === 'active').length
  const breedingLines = accessions.filter(a => a.acquisitionSource === 'breeding').length

  const steps = [
    {
      num: '01',
      title: 'Mis Espacios y Clima',
      desc: 'Define dónde cultivas (invernaderos, parcelas, heladeras) y el clima local para evaluar la aptitud de cada especie.',
      done: locations.length > 0 || Boolean(currentClimate),
      metric: `${locations.length} espacio${locations.length === 1 ? '' : 's'}${currentClimate ? ' · Clima activo' : ''}`,
      cta: locations.length === 0 ? 'Configurar primer espacio' : 'Ver mis espacios',
      to: '/locations',
      icon: Map,
      color: '#c0392b',
    },
    {
      num: '02',
      title: 'Banco de Semillas',
      desc: 'Registra tus Variedades (Accesiones), descubre su Especie Botánica en GBIF/EcoCrop y carga su Lote de Semillas inicial.',
      done: accessions.length > 0,
      metric: `${accessions.length} variedad${accessions.length === 1 ? '' : 'es'} · ${seedLots.length} lote${seedLots.length === 1 ? '' : 's'}`,
      cta: accessions.length === 0 ? 'Registrar primera semilla' : 'Abrir banco de semillas',
      to: '/accessions',
      icon: Sprout,
      color: 'var(--accent)',
    },
    {
      num: '03',
      title: 'Cultivo Activo y Fenotipado',
      desc: 'Siembra plantas en tus espacios descontando semillas del lote, sigue su estadio BBCH, mide rasgos y cosecha nuevos lotes.',
      done: individuals.length > 0,
      metric: `${activePlants} planta${activePlants === 1 ? '' : 's'} activa${activePlants === 1 ? '' : 's'} · ${observations.length} medicion${observations.length === 1 ? '' : 'es'}`,
      cta: individuals.length === 0 ? 'Sembrar plantas' : 'Gestionar cultivo activo',
      to: '/individuals',
      icon: Users,
      color: '#1e6091',
    },
    {
      num: '04',
      title: 'Laboratorio de Cruzas',
      desc: 'Cruza plantas o variedades seleccionadas por sus rasgos, cosecha el fruto híbrido y promueve nuevas líneas F1/S1.',
      done: crossings.length > 0 || breedingLines > 0,
      metric: `${crossings.length + breedingLines} cruza${(crossings.length + breedingLines) === 1 ? '' : 's'} / línea${(crossings.length + breedingLines) === 1 ? '' : 's'} F1`,
      cta: 'Ir al laboratorio de cruzas',
      to: '/breeding',
      icon: GitBranch,
      color: '#9d174d',
    },
  ]

  return (
    <div
      style={{
        ...CARD,
        marginBottom: 22,
        background: 'linear-gradient(180deg, var(--surface-elevated) 0%, var(--surface-subtle) 100%)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Compass size={16} color="var(--accent)" />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
            Flujo del Ciclo de Cultivo y Fitomejoramiento
          </span>
        </div>
        <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
          Sigue el orden de izquierda a derecha para mantener trazabilidad completa
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}
      >
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <div
              key={step.num}
              style={{
                background: 'var(--surface-elevated)',
                border: step.done ? '1px solid #b7e4c7' : '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 6,
                      background: step.done ? 'var(--accent-light)' : 'var(--surface-subtle)',
                      color: step.done ? 'var(--accent)' : 'var(--text-tertiary)',
                    }}
                  >
                    PASO {step.num}
                  </span>
                  {step.done ? (
                    <CheckCircle2 size={15} color="var(--accent)" />
                  ) : (
                    <Icon size={15} color={step.color} />
                  )}
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: 10 }}>
                  {step.desc}
                </p>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-tertiary)',
                    marginBottom: 10,
                    paddingTop: 8,
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  {step.metric}
                </div>

                <button
                  type="button"
                  onClick={() => navigate(step.to)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 11px',
                    borderRadius: 'var(--radius-sm)',
                    border: step.done ? '1px solid var(--border)' : 'none',
                    background: step.done ? 'var(--surface-subtle)' : 'var(--accent)',
                    color: step.done ? 'var(--text-primary)' : 'white',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>{step.cta}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ───Glossary Quick Reference ─────────────────────────────────────────────────

function SemanticGlossaryBanner() {
  const items = [
    { term: 'Especie (Catálogo Botánico)', def: 'Ficha biológica compartida (ej. Solanum lycopersicum / Tomate), con su clima ideal y diccionario de rasgos.' },
    { term: 'Variedad (Accesión)', def: 'Identidad genética única en tu banco (ej. TOM-2026-001 · Platense) y nodo del árbol genealógico.' },
    { term: 'Lote de Semillas', def: 'Sobre o frasco físico con semillas de una Variedad, con stock disponible y % de germinación.' },
    { term: 'Planta (Individuo)', def: 'Planta viva sembrada en un Espacio físico (ej. TOM-2026-001 #01), donde se mide el BBCH y su fenotipo.' },
  ]

  return (
    <div
      style={{
        ...CARD,
        padding: '16px 22px',
        marginBottom: 20,
        background: 'var(--surface-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Sparkles size={13} color="var(--accent)" />
        <span style={{ ...MONO_LABEL, marginBottom: 0, color: 'var(--accent)' }}>
          Glosario Unificado de Conceptos
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {items.map(item => (
          <div key={item.term}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
              {item.term}
            </p>
            <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {item.def}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function RecentAccessions() {
  const navigate = useNavigate()
  const { accessions } = useAccessionStore()
  const { taxons } = useTaxonStore()

  const recent = [...accessions].slice(-5).reverse()

  return (
    <div style={CARD}>
      <p style={MONO_LABEL}>Variedades (Accesiones) recientes</p>
      {recent.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Sin variedades registradas.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {recent.map((acc, i) => {
            const taxon = taxons.find(t => t.id === acc.taxonId)
            return (
              <motion.div
                key={acc.id}
                onClick={() => navigate('/accessions')}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Sprout size={13} color="var(--accent)" strokeWidth={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {acc.accessionNumber}
                    {acc.cultivarName ? ` · ${acc.cultivarName}` : ''}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                    {taxon ? `${taxon.genus} ${taxon.species}` : 'Sin especie botánica'}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    padding: '2px 7px',
                    borderRadius: 99,
                    background: 'var(--surface-subtle)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    flexShrink: 0,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {acc.acquisitionSource}
                </span>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Status Breakdown ─────────────────────────────────────────────────────────

function IndividualStatusChart() {
  const { individuals } = useIndividualStore()

  const statusCount = {
    active: individuals.filter(i => i.status === 'active').length,
    harvested: individuals.filter(i => i.status === 'harvested').length,
    dead: individuals.filter(i => i.status === 'dead').length,
    discarded: individuals.filter(i => i.status === 'discarded').length,
  }
  const total = individuals.length

  const STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
    active:    { color: '#2d6a4f', bg: '#d8f3dc', label: 'Activas en cultivo' },
    harvested: { color: '#1e6091', bg: '#dbeafe', label: 'Cosechadas' },
    dead:      { color: '#c0392b', bg: '#fee2e2', label: 'Muertas' },
    discarded: { color: '#7c7b78', bg: '#f2f1ef', label: 'Descartadas' },
  }

  return (
    <div style={CARD}>
      <p style={MONO_LABEL}>Estado de plantas (Individuos)</p>
      {total === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Sin plantas sembradas.</p>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              height: 8,
              borderRadius: 99,
              overflow: 'hidden',
              gap: 2,
              marginBottom: 16,
            }}
          >
            {Object.entries(statusCount).map(([key, count]) => {
              if (count === 0) return null
              const pct = (count / total) * 100
              return (
                <motion.div
                  key={key}
                  style={{
                    height: '100%',
                    background: STATUS_COLORS[key].color,
                    borderRadius: 99,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
              )
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(statusCount).map(([key, count]) => {
              const cfg = STATUS_COLORS[key]
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: cfg.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{cfg.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--text-tertiary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {pct}%
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        minWidth: 20,
                        textAlign: 'right',
                      }}
                    >
                      {count}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Top Taxa ─────────────────────────────────────────────────────────────────

function TopTaxa() {
  const { accessions } = useAccessionStore()
  const { taxons } = useTaxonStore()

  const countByTaxon: Record<string, number> = {}
  accessions.forEach(a => {
    countByTaxon[a.taxonId] = (countByTaxon[a.taxonId] ?? 0) + 1
  })

  const sorted = Object.entries(countByTaxon)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const max = sorted[0]?.[1] ?? 1

  return (
    <div style={CARD}>
      <p style={MONO_LABEL}>Variedades por especie botánica</p>
      {sorted.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Sin datos.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sorted.map(([taxonId, count], i) => {
            const taxon = taxons.find(t => t.id === taxonId)
            const pct = (count / max) * 100
            return (
              <motion.div
                key={taxonId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.06 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    {taxon ? `${taxon.genus} ${taxon.species}` : 'Desconocido'}
                    {taxon?.commonName ? ` (${taxon.commonName})` : ''}
                  </span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {count}
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: 'var(--surface-muted)',
                    borderRadius: 99,
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    style={{ height: '100%', background: 'var(--accent)', borderRadius: 99 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const navigate = useNavigate()
  const { accessions } = useAccessionStore()
  const { individuals } = useIndividualStore()
  const { taxons } = useTaxonStore()
  const { seedLots } = useSeedLotStore()
  const { locations } = useLocationStore()
  const { observations } = useObservationStore()

  const activeIndividuals = individuals.filter(i => i.status === 'active').length
  const activeLots = seedLots.filter(l => l.status === 'active').length
  const totalSeeds = seedLots
    .filter(l => l.status === 'active')
    .reduce((acc, l) => acc + (l.currentCount ?? 0), 0)

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '32px 40px',
        background: 'var(--surface-base)',
      }}
    >
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 24 }}
      >
        <h1
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: 4,
          }}
        >
          Centro de Control · Plantin
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
          Flujo integrado desde tus espacios y banco de semillas hasta el cultivo activo y mejoramiento genético.
        </p>
      </motion.div>

      {/* Tarjeta de Ubicación y Clima en Tiempo Real */}
      <div style={{ marginBottom: 20 }}>
        <LocationClimateCard />
      </div>

      {/* Workflow Stepper */}
      <WorkflowPipeline />

      {/* Semantic Glossary */}
      <SemanticGlossaryBanner />

      {/* Stat grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14,
          marginBottom: 20,
        }}
      >
        <StatCard
          label="1. Mis Espacios"
          value={locations.length}
          sub="Invernaderos, salas y parcelas"
          icon={Map}
          accentColor="#c0392b"
          onClick={() => navigate('/locations')}
          delay={0}
        />
        <StatCard
          label="2. Variedades (Accesiones)"
          value={accessions.length}
          sub={`En ${taxons.length} especie${taxons.length === 1 ? '' : 's'} botánica${taxons.length === 1 ? '' : 's'}`}
          icon={Sprout}
          accentColor="var(--accent)"
          onClick={() => navigate('/accessions')}
          delay={0.05}
        />
        <StatCard
          label="2b. Stock en Lotes de Semillas"
          value={activeLots}
          sub={`${totalSeeds.toLocaleString('es-AR')} semillas disponibles`}
          icon={Package}
          accentColor="#7b2d8b"
          onClick={() => navigate('/seedlots')}
          delay={0.1}
        />
        <StatCard
          label="2c. Catálogo Botánico (Especies)"
          value={taxons.length}
          sub="Fichas EcoCrop / Trefle y descriptores"
          icon={Leaf}
          accentColor="#2d6a4f"
          onClick={() => navigate('/taxons')}
          delay={0.15}
        />
        <StatCard
          label="3. Plantas en Cultivo Activo"
          value={activeIndividuals}
          sub={`${individuals.length} plantas históricas en total`}
          icon={Users}
          accentColor="#1e6091"
          onClick={() => navigate('/individuals')}
          delay={0.2}
        />
        <StatCard
          label="3b. Mediciones Fenotípicas"
          value={observations.length}
          sub="Observaciones registradas en plantas"
          icon={FlaskConical}
          accentColor="#e76f51"
          onClick={() => navigate('/phenotyping')}
          delay={0.25}
        />
      </div>

      {/* Bottom grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 14,
        }}
      >
        <div style={{ gridColumn: 'span 1' }}>
          <IndividualStatusChart />
        </div>
        <div style={{ gridColumn: 'span 1' }}>
          <TopTaxa />
        </div>
        <div style={{ gridColumn: 'span 1' }}>
          <RecentAccessions />
        </div>
      </div>
    </div>
  )
}
