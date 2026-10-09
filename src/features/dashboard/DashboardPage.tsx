import { motion } from 'motion/react'
import { useAccessionStore } from '@/store/accessionStore'
import { useIndividualStore } from '@/store/individualStore'
import { useTaxonStore } from '@/store/taxonStore'
import { useSeedLotStore } from '@/store/seedLotStore'
import { useLocationStore } from '@/store/locationStore'
import { useObservationStore } from '@/store/observationStore'
import { Sprout, Users, Leaf, Package, Map, FlaskConical, TrendingUp, Activity } from 'lucide-react'

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
  delay = 0,
}: {
  label: string
  value: number | string
  sub?: string
  icon: React.ElementType
  accentColor: string
  delay?: number
}) {
  return (
    <motion.div
      style={CARD}
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

// ─── Activity Feed ────────────────────────────────────────────────────────────

function RecentAccessions() {
  const { accessions } = useAccessionStore()
  const { taxons } = useTaxonStore()

  const recent = [...accessions].slice(-5).reverse()

  return (
    <div style={CARD}>
      <p style={MONO_LABEL}>Accesiones recientes</p>
      {recent.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Sin accesiones registradas.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {recent.map((acc, i) => {
            const taxon = taxons.find(t => t.id === acc.taxonId)
            return (
              <motion.div
                key={acc.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
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
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                    {taxon ? `${taxon.genus} ${taxon.species}` : 'Sin taxonomia'}
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
    active:    { color: '#2d6a4f', bg: '#d8f3dc', label: 'Activos' },
    harvested: { color: '#1e6091', bg: '#dbeafe', label: 'Cosechados' },
    dead:      { color: '#c0392b', bg: '#fee2e2', label: 'Muertos' },
    discarded: { color: '#7c7b78', bg: '#f2f1ef', label: 'Descartados' },
  }

  return (
    <div style={CARD}>
      <p style={MONO_LABEL}>Estado de individuos</p>
      {total === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Sin individuos registrados.</p>
      ) : (
        <>
          {/* Bar */}
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

          {/* Legend */}
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
      <p style={MONO_LABEL}>Accesiones por especie</p>
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

import React from 'react'

export function DashboardPage() {
  const { accessions } = useAccessionStore()
  const { individuals } = useIndividualStore()
  const { taxons } = useTaxonStore()
  const { seedLots } = useSeedLotStore()
  const { locations } = useLocationStore()
  const { observations } = useObservationStore()

  const activeIndividuals = individuals.filter(i => i.status === 'active').length
  const activeLots = seedLots.filter(l => l.status === 'active').length

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '36px 44px',
        background: 'var(--surface-base)',
      }}
    >
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 32 }}
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
          Banco Genetico
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
          Vision general de accesiones, individuos y lotes de semillas.
        </p>
      </motion.div>

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
          label="Accesiones"
          value={accessions.length}
          sub={`${taxons.length} especies`}
          icon={Sprout}
          accentColor="var(--accent)"
          delay={0}
        />
        <StatCard
          label="Individuos activos"
          value={activeIndividuals}
          sub={`${individuals.length} total`}
          icon={Users}
          accentColor="#1e6091"
          delay={0.05}
        />
        <StatCard
          label="Lotes de semillas"
          value={activeLots}
          sub={`${seedLots.length} total`}
          icon={Package}
          accentColor="#7b2d8b"
          delay={0.1}
        />
        <StatCard
          label="Instalaciones"
          value={locations.length}
          icon={Map}
          accentColor="#c0392b"
          delay={0.15}
        />
        <StatCard
          label="Observaciones"
          value={observations.length}
          icon={FlaskConical}
          accentColor="#e76f51"
          delay={0.2}
        />
        <StatCard
          label="Genotipos en banco"
          value={taxons.length}
          icon={Leaf}
          accentColor="#2d6a4f"
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
