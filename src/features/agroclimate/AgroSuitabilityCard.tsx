import React from 'react'
import type { ClimateProfile, SuitabilityAssessment, RecommendedEnvironment, SuitabilityClass } from '@/domain/agroclimate/types'
import {
  MapPin, Calendar, Thermometer, Snowflake,
  CheckCircle2, AlertTriangle, HelpCircle,
  Sun, RefreshCw
} from 'lucide-react'

interface Props {
  assessment?: SuitabilityAssessment
  climate?: ClimateProfile
  isLoading?: boolean
  error?: string
  onDetectLocation?: () => void
}

const SHORT_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const SUITABILITY_BADGE: Record<SuitabilityClass, { label: string; bg: string; border: string; text: string; icon: React.ElementType }> = {
  optimal:           { label: 'Óptimo',              bg: '#d8f3dc', border: '#b7e4c7', text: '#1b4332', icon: CheckCircle2 },
  suitable:          { label: 'Apto',                bg: '#dbeafe', border: '#bfdbfe', text: '#1e3a5f', icon: CheckCircle2 },
  marginal:          { label: 'Marginal',            bg: '#fef3c7', border: '#fde68a', text: '#78350f', icon: AlertTriangle },
  not_suitable:      { label: 'No Apto',             bg: '#fee2e2', border: '#fca5a5', text: '#7f1d1d', icon: AlertTriangle },
  insufficient_data: { label: 'Datos insuficientes', bg: 'var(--surface-subtle)', border: 'var(--border)', text: 'var(--text-secondary)', icon: HelpCircle },
}

const ENV_LABELS: Record<RecommendedEnvironment, { label: string; desc: string }> = {
  outdoor:       { label: 'Campo abierto',       desc: 'Siembra o trasplante directo sin protección' },
  indoor_starts: { label: 'Almácigo protegido',  desc: 'Inicio en almácigo interior antes de la primavera' },
  greenhouse:    { label: 'Invernadero pasivo',  desc: 'Requiere estructura con amortiguación térmica' },
  indoor:        { label: 'Ambiente controlado', desc: 'Solo viable en cámara de cultivo o climatización total' },
}

const CARD_BASE: React.CSSProperties = {
  background: 'var(--surface-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '20px 22px',
  boxShadow: 'var(--shadow-sm)',
}

const MONO_LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: 'var(--text-tertiary)',
  fontFamily: 'var(--font-mono)',
}

export function AgroSuitabilityCard({
  assessment,
  climate,
  isLoading,
  error,
  onDetectLocation,
}: Props) {
  if (error) {
    return (
      <div
        style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          background: '#fffbeb',
          border: '1px solid #fde68a',
          color: '#78350f',
          fontSize: 12.5,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <AlertTriangle size={15} style={{ flexShrink: 0 }} />
        <span>{error}</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div
        style={{
          ...CARD_BASE,
          background: 'var(--surface-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          color: 'var(--text-secondary)',
          fontSize: 13,
        }}
      >
        <RefreshCw size={15} className="animate-spin" color="var(--text-tertiary)" />
        Consultando datos agroclimáticos y evaluando ventanas de cultivo...
      </div>
    )
  }

  if (!climate) {
    return (
      <div
        style={{
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface-subtle)',
          border: '1px dashed var(--border-strong)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            margin: '0 auto 10px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MapPin size={17} color="var(--text-tertiary)" />
        </div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Sin ubicación geográfica
        </h4>
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 380, margin: '0 auto 14px' }}>
          Definí las coordenadas de tu establecimiento para calcular la aptitud térmica, el riesgo de heladas y el calendario óptimo de siembra.
        </p>
        {onDetectLocation && (
          <button
            type="button"
            onClick={onDetectLocation}
            className="btn-press"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              fontSize: 12.5,
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <MapPin size={13} />
            Detectar mi ubicación
          </button>
        )}
      </div>
    )
  }

  if (!assessment || assessment.suitability === 'insufficient_data') {
    return (
      <div style={{ ...CARD_BASE, background: 'var(--surface-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HelpCircle size={14} color="var(--text-tertiary)" />
            <span style={MONO_LABEL}>Aptitud Agroclimática</span>
          </div>
          <span
            style={{
              padding: '2px 9px',
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 500,
              background: 'var(--surface-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            Datos insuficientes
          </span>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 6 }}>
          {assessment?.limitingFactors[0] ?? 'Sin datos ecofisiológicos suficientes para determinar aptitud.'}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          Ubicación activa: {climate.coordinates.name ?? `${climate.coordinates.latitude.toFixed(2)}°, ${climate.coordinates.longitude.toFixed(2)}°`} (Hemisferio {climate.hemisphere === 'south' ? 'Sur' : 'Norte'})
        </p>
      </div>
    )
  }

  const badge = SUITABILITY_BADGE[assessment.suitability]
  const envInfo = assessment.sowingWindow ? ENV_LABELS[assessment.sowingWindow.recommendedEnvironment] : undefined
  const BadgeIcon = badge.icon
  const criticalFrostSet = new Set(assessment.frostRisk.criticalMonths)
  const optMonthsSet = new Set(assessment.sowingWindow?.optimalMonths ?? [])
  const margMonthsSet = new Set(assessment.sowingWindow?.marginalMonths ?? [])

  return (
    <div style={{ ...CARD_BASE, display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header con Badge de Aptitud y Ubicación */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <Sun size={15} color="#d97706" />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Aptitud Agroclimática
            </h3>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 9px',
                borderRadius: 99,
                fontSize: 11.5,
                fontWeight: 600,
                background: badge.bg,
                border: `1px solid ${badge.border}`,
                color: badge.text,
              }}
            >
              <BadgeIcon size={12} />
              {badge.label}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <MapPin size={12} color="var(--text-tertiary)" />
            <span>{climate.coordinates.name ?? `${climate.coordinates.latitude.toFixed(2)}°, ${climate.coordinates.longitude.toFixed(2)}°`}</span>
            <span style={{ color: 'var(--text-tertiary)' }}>·</span>
            <span>{climate.hemisphere === 'south' ? 'Hemisferio Sur' : 'Hemisferio Norte'}</span>
            <span style={{ color: 'var(--text-tertiary)' }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>Lluvia: {Math.round(climate.annualRainfall)} mm/año</span>
          </p>
        </div>

        {/* Score Numérico */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1 }}>
            {assessment.score}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-tertiary)' }}>/100</span>
          </div>
          <div style={{ ...MONO_LABEL, marginTop: 3 }}>Índice Agroecológico</div>
        </div>
      </div>

      {/* Ambiente Recomendado */}
      {envInfo && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Thermometer size={15} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                Modalidad recomendada: {envInfo.label}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{envInfo.desc}</div>
            </div>
          </div>
          {assessment.sowingWindow?.cycleMonths && (
            <span
              style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                background: 'var(--surface-elevated)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                flexShrink: 0,
              }}
            >
              Ciclo est. {assessment.sowingWindow.cycleMonths} meses
            </span>
          )}
        </div>
      )}

      {/* Calendario de Siembra Mensual (1..12) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ ...MONO_LABEL, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Calendar size={12} color="var(--text-tertiary)" />
            Ventana Óptima de Siembra
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10.5, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent)' }} /> Óptimo
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b' }} /> Marginal
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Snowflake size={11} color="#0284c7" /> Helada
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4, textAlign: 'center' }}>
          {SHORT_MONTHS.map((name, i) => {
            const m = i + 1
            const isOpt = optMonthsSet.has(m)
            const isMarg = margMonthsSet.has(m)
            const isFrost = criticalFrostSet.has(m)

            let bg = 'var(--surface-subtle)'
            let color = 'var(--text-tertiary)'
            let fontWeight = 400
            if (isOpt) {
              bg = 'var(--accent)'
              color = 'white'
              fontWeight = 600
            } else if (isMarg) {
              bg = '#fde68a'
              color = '#78350f'
              fontWeight = 600
            }

            return (
              <div
                key={name}
                style={{
                  padding: '8px 2px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  background: bg,
                  color,
                  fontWeight,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: isOpt || isMarg ? 'none' : '1px solid var(--border)',
                }}
                title={`Mes ${m}: ${name.toUpperCase()} ${isOpt ? '(Óptimo)' : isMarg ? '(Marginal)' : '(No recomendado)'}${isFrost ? ' - Riesgo de Helada' : ''}`}
              >
                <span>{name}</span>
                {isFrost && (
                  <Snowflake size={10} style={{ marginTop: 2 }} color={isOpt ? '#d8f3dc' : '#0284c7'} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Factores Limitantes y Favorables */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 12.5 }}>
        {assessment.positiveFactors.map((f, i) => (
          <div key={`pos-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#1b4332' }}>
            <CheckCircle2 size={13} color="var(--accent)" style={{ flexShrink: 0 }} />
            <span>{f}</span>
          </div>
        ))}
        {assessment.limitingFactors.map((f, i) => (
          <div key={`lim-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-secondary)' }}>
            <AlertTriangle size={13} color="#d97706" style={{ flexShrink: 0 }} />
            <span>{f}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
