import React, { useMemo, useState } from 'react'
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
import type { AcquisitionSource } from '@/domain/accession'
import {
  Sprout, Users, Leaf, Package, Map, FlaskConical,
  GitBranch, ArrowRight, CheckCircle2, Sparkles, Compass,
  Activity, ExternalLink
} from 'lucide-react'

// ─── Source Badges Configuration ─────────────────────────────────────────────

const SOURCE_BADGES: Record<AcquisitionSource, { label: string; badgeClass: string }> = {
  wild:       { label: 'Silvestre', badgeClass: 'bg-emerald-100/80 text-emerald-800 border-emerald-200/80' },
  cultivated: { label: 'Cultivada', badgeClass: 'bg-blue-100/80 text-blue-800 border-blue-200/80' },
  market:     { label: 'Mercado', badgeClass: 'bg-amber-100/80 text-amber-800 border-amber-200/80' },
  breeding:   { label: 'Mejoramiento', badgeClass: 'bg-pink-100/80 text-pink-800 border-pink-200/80' },
  research:   { label: 'Investigación', badgeClass: 'bg-purple-100/80 text-purple-800 border-purple-200/80' },
  unknown:    { label: 'Desconocido', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function getAgronomicGreeting(now: Date): string {
  const hour = now.getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function getAgronomicSeasonHint(latitude: number = -34.6, now: Date): { season: string; hint: string } {
  const month = now.getMonth() // 0-11
  const isSouth = latitude < 0

  if (isSouth) {
    if (month >= 8 && month <= 10) {
      return { season: 'Primavera', hint: 'Etapa óptima de siembra, germinación y trasplantes activos' }
    }
    if (month >= 11 || month <= 1) {
      return { season: 'Verano', hint: 'Monitoreo de estrés hídrico, floración y polinización dirigida' }
    }
    if (month >= 2 && month <= 4) {
      return { season: 'Otoño', hint: 'Cosecha de frutos híbridos y acondicionamiento de semillas' }
    }
    return { season: 'Invierno', hint: 'Descanso vegetativo, estratificación en frío y planificación' }
  } else {
    if (month >= 2 && month <= 4) {
      return { season: 'Primavera', hint: 'Etapa óptima de siembra, germinación y trasplantes activos' }
    }
    if (month >= 5 && month <= 7) {
      return { season: 'Verano', hint: 'Monitoreo de estrés hídrico, floración y polinización dirigida' }
    }
    if (month >= 8 && month <= 10) {
      return { season: 'Otoño', hint: 'Cosecha de frutos híbridos y acondicionamiento de semillas' }
    }
    return { season: 'Invierno', hint: 'Descanso vegetativo, estratificación en frío y planificación' }
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  step: string
  label: string
  value: number | string
  sub?: string
  icon: React.ElementType
  iconBgClass: string
  iconTextClass: string
  onClick?: () => void
  delay?: number
}

function StatCard({
  step,
  label,
  value,
  sub,
  icon: Icon,
  iconBgClass,
  iconTextClass,
  onClick,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative flex flex-col justify-between p-4 rounded-2xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-md shadow-slate-900/5 hover:shadow-xl hover:shadow-slate-900/10 hover:border-slate-300 hover:bg-white/95 transition-all duration-200 text-left ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0' : ''
      }`}
    >
      <div>
        {/* Top row: Stage Badge + Icon container */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors">
            {step}
          </span>
          <div
            className={`w-9 h-9 rounded-xl ${iconBgClass} border border-slate-200/60 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-1 transition-transform duration-200 shadow-xs`}
          >
            <Icon size={18} className={iconTextClass} strokeWidth={2.2} />
          </div>
        </div>

        {/* Title */}
        <p className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors line-clamp-1">
          {label}
        </p>

        {/* Big Tabular Numeric Metric */}
        <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans tabular-nums mt-1 leading-none">
          {value}
        </p>
      </div>

      {/* Subtitle / hint with interactive hover arrow */}
      <div className="flex items-center justify-between gap-1 mt-3 pt-2.5 border-t border-slate-100">
        <p className="text-[11px] text-slate-500 line-clamp-1 font-normal">
          {sub}
        </p>
        <ArrowRight
          size={13}
          className="text-emerald-600 opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 flex-shrink-0"
        />
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
      iconColor: 'text-rose-600',
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
      iconColor: 'text-emerald-600',
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
      iconColor: 'text-blue-600',
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
      iconColor: 'text-pink-600',
    },
  ]

  return (
    <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-md shadow-slate-900/5 rounded-2xl p-4 sm:p-5 lg:p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-xs">
            <Compass size={17} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Flujo del Ciclo de Cultivo y Fitomejoramiento
            </h2>
            <p className="text-xs text-slate-500">
              Sigue el orden de izquierda a derecha para mantener trazabilidad agronómica completa
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100/90 px-2.5 py-1 rounded-lg">
          Fases 01 a 04 Sincronizadas
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <div
              key={step.num}
              className={`rounded-xl p-4 flex flex-col justify-between gap-3 transition-all duration-200 border ${
                step.done
                  ? 'bg-emerald-50/40 border-emerald-200/90 shadow-xs hover:border-emerald-300 hover:bg-emerald-50/70'
                  : 'bg-white/80 border-slate-200/80 shadow-xs hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      step.done
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    PASO {step.num}
                  </span>
                  {step.done ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : (
                    <Icon size={16} className={step.iconColor} />
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {step.desc}
                </p>
              </div>

              <div>
                <div className="text-[11px] font-mono text-slate-500 pt-2.5 border-t border-slate-200/60 mb-2.5">
                  {step.metric}
                </div>

                <button
                  type="button"
                  onClick={() => navigate(step.to)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    step.done
                      ? 'border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 shadow-xs'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                  }`}
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

// ─── Glossary Quick Reference ─────────────────────────────────────────────────

function SemanticGlossaryBanner() {
  const items = [
    {
      term: 'Especie (Catálogo Botánico)',
      def: 'Ficha biológica compartida (ej. Solanum lycopersicum / Tomate), con su clima ideal EcoCrop y diccionario de rasgos.',
    },
    {
      term: 'Variedad (Accesión)',
      def: 'Identidad genética única en tu banco (ej. TOM-2026-001 · Platense) y nodo central del árbol genealógico.',
    },
    {
      term: 'Lote de Semillas',
      def: 'Sobre o frasco físico con semillas de una Variedad, con inventario disponible y % de poder germinativo.',
    },
    {
      term: 'Planta (Individuo)',
      def: 'Planta viva sembrada en un Espacio físico (ej. TOM-2026-001 #01), donde se monitorea el estadio BBCH y fenotipo.',
    },
  ]

  return (
    <div className="bg-white/70 backdrop-blur-md border border-slate-200/70 shadow-xs rounded-2xl p-4 sm:p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-emerald-600" />
        <span className="text-[10.5px] font-mono font-bold tracking-wider uppercase text-emerald-700">
          Glosario Unificado de Conceptos
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {items.map(item => (
          <div key={item.term} className="bg-white/60 rounded-xl p-3 border border-slate-200/50">
            <p className="text-xs font-bold text-slate-900 mb-1">
              {item.term}
            </p>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              {item.def}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Activity Feed (Recent Accessions) ────────────────────────────────────────

function RecentAccessions() {
  const navigate = useNavigate()
  const { accessions } = useAccessionStore()
  const { taxons } = useTaxonStore()

  const recent = useMemo(() => [...accessions].slice(-5).reverse(), [accessions])

  return (
    <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-md shadow-slate-900/5 rounded-2xl p-5 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700">
              <Sprout size={15} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Banco de Germoplasma
              </p>
              <h3 className="text-sm font-bold text-slate-900">
                Variedades Recientes
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/accessions')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Ver todas</span>
            <ExternalLink size={12} />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="py-8 text-center">
            <Sprout size={28} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs text-slate-500">Sin variedades registradas en el banco.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map((acc, i) => {
              const taxon = taxons.find(t => t.id === acc.taxonId)
              const badgeInfo = SOURCE_BADGES[acc.acquisitionSource] || SOURCE_BADGES.unknown
              return (
                <motion.div
                  key={acc.id}
                  onClick={() => navigate('/accessions')}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-xl hover:bg-slate-50/90 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                    <Sprout size={14} strokeWidth={2.2} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                      {acc.accessionNumber}
                      {acc.cultivarName ? ` · ${acc.cultivarName}` : ''}
                    </p>
                    <p className="text-[11px] text-slate-500 italic truncate">
                      {taxon ? `${taxon.genus} ${taxon.species}` : 'Sin especie botánica'}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex-shrink-0 ${badgeInfo.badgeClass}`}
                  >
                    {badgeInfo.label}
                  </span>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 mt-2 text-right">
        <span className="text-[11px] font-mono text-slate-400">
          Total registradas: {accessions.length}
        </span>
      </div>
    </div>
  )
}

// ─── Status Breakdown (Plant Individuals) ───────────────────────────────────

function IndividualStatusChart() {
  const navigate = useNavigate()
  const { individuals } = useIndividualStore()

  const statusCount = useMemo(() => ({
    active: individuals.filter(i => i.status === 'active').length,
    harvested: individuals.filter(i => i.status === 'harvested').length,
    dead: individuals.filter(i => i.status === 'dead').length,
    discarded: individuals.filter(i => i.status === 'discarded').length,
  }), [individuals])

  const total = individuals.length

  const STATUS_CONFIG: Record<string, { barClass: string; dotClass: string; label: string }> = {
    active:    { barClass: 'bg-emerald-500', dotClass: 'bg-emerald-500', label: 'Activas en cultivo' },
    harvested: { barClass: 'bg-blue-500', dotClass: 'bg-blue-500', label: 'Cosechadas' },
    dead:      { barClass: 'bg-rose-500', dotClass: 'bg-rose-500', label: 'Muertas' },
    discarded: { barClass: 'bg-slate-400', dotClass: 'bg-slate-400', label: 'Descartadas' },
  }

  return (
    <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-md shadow-slate-900/5 rounded-2xl p-5 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-700">
              <Users size={15} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Cultivo & Fenología
              </p>
              <h3 className="text-sm font-bold text-slate-900">
                Estado de Plantas (Individuos)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/individuals')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Ver plantas</span>
            <ExternalLink size={12} />
          </button>
        </div>

        {total === 0 ? (
          <div className="py-8 text-center">
            <Users size={28} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs text-slate-500">Sin plantas sembradas actualmente.</p>
          </div>
        ) : (
          <>
            {/* Multi-segment progress bar */}
            <div className="h-3 rounded-full overflow-hidden bg-slate-100 flex gap-0.5 mb-4 p-0.5 ring-1 ring-slate-200/60">
              {Object.entries(statusCount).map(([key, count]) => {
                if (count === 0) return null
                const pct = (count / total) * 100
                const cfg = STATUS_CONFIG[key]
                return (
                  <motion.div
                    key={key}
                    title={`${cfg.label}: ${count} (${Math.round(pct)}%)`}
                    className={`h-full rounded-full ${cfg.barClass}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  />
                )
              })}
            </div>

            {/* Legend list */}
            <div className="space-y-2">
              {Object.entries(statusCount).map(([key, count]) => {
                const cfg = STATUS_CONFIG[key]
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div
                    key={key}
                    className="flex justify-between items-center py-1 px-2 -mx-2 rounded-lg hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${cfg.dotClass} flex-shrink-0`} />
                      <span className="text-xs font-medium text-slate-700">{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[11px] text-slate-400">{pct}%</span>
                      <span className="text-xs font-bold text-slate-900 min-w-5 text-right">{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 mt-2 text-right">
        <span className="text-[11px] font-mono text-slate-400">
          Total plantas: {total}
        </span>
      </div>
    </div>
  )
}

// ─── Top Taxa (Species Breakdown) ─────────────────────────────────────────────

function TopTaxa() {
  const navigate = useNavigate()
  const { accessions } = useAccessionStore()
  const { taxons } = useTaxonStore()

  const { sorted, max } = useMemo(() => {
    const countByTaxon: Record<string, number> = {}
    accessions.forEach(a => {
      countByTaxon[a.taxonId] = (countByTaxon[a.taxonId] ?? 0) + 1
    })

    const items = Object.entries(countByTaxon)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const maxValue = items[0]?.[1] ?? 1
    return { sorted: items, max: maxValue }
  }, [accessions])

  return (
    <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-md shadow-slate-900/5 rounded-2xl p-5 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700">
              <Leaf size={15} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Taxonomía & GBIF
              </p>
              <h3 className="text-sm font-bold text-slate-900">
                Variedades por Especie Botánica
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/taxons')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Catálogo</span>
            <ExternalLink size={12} />
          </button>
        </div>

        {sorted.length === 0 ? (
          <div className="py-8 text-center">
            <Leaf size={28} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs text-slate-500">Sin datos de especies vinculadas.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map(([taxonId, count], i) => {
              const taxon = taxons.find(t => t.id === taxonId)
              const pct = (count / max) * 100
              return (
                <motion.div
                  key={taxonId}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-1"
                >
                  <div className="flex items-baseline justify-between mb-1 gap-2">
                    <span className="text-xs font-medium text-slate-800 truncate">
                      <span className="italic">{taxon ? `${taxon.genus} ${taxon.species}` : 'Desconocido'}</span>
                      {taxon?.commonName ? (
                        <span className="text-slate-500 not-italic ml-1 font-normal">
                          ({taxon.commonName})
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-md flex-shrink-0">
                      {count}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
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

      <div className="pt-3 border-t border-slate-100 mt-2 text-right">
        <span className="text-[11px] font-mono text-slate-400">
          Total especies: {taxons.length}
        </span>
      </div>
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
  const { crossings } = useCrossingStore()
  const { farmCoordinates, currentWeather } = useAgroClimateStore()

  const activeIndividuals = useMemo(
    () => individuals.filter(i => i.status === 'active').length,
    [individuals]
  )
  const activeLots = useMemo(
    () => seedLots.filter(l => l.status === 'active').length,
    [seedLots]
  )
  const totalSeeds = useMemo(
    () =>
      seedLots
        .filter(l => l.status === 'active')
        .reduce((acc, l) => acc + (l.currentCount ?? 0), 0),
    [seedLots]
  )
  const breedingLines = useMemo(
    () => accessions.filter(a => a.acquisitionSource === 'breeding').length,
    [accessions]
  )

  const [now] = useState(() => new Date())
  const greeting = useMemo(() => getAgronomicGreeting(now), [now])
  const { season, hint: seasonHint } = useMemo(
    () => getAgronomicSeasonHint(farmCoordinates?.latitude, now),
    [farmCoordinates?.latitude, now]
  )

  const capitalizedDate = useMemo(() => {
    const formatted = new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now)
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }, [now])

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50 space-y-6">
      {/* ── Cabecera HUD limpia con Saludo y Resumen Agronómico en Tiempo Real ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-1"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold uppercase tracking-wider bg-emerald-100/80 text-emerald-800 border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              HUD AGRONÓMICO · SISTEMA ACTIVO
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {capitalizedDate} · Temporada de {season}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {greeting}, Operador Agronómico
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            {seasonHint}. Flujo integrado desde tus espacios y banco de semillas hasta el cultivo activo y mejoramiento genético.
          </p>
        </div>

        {/* Resumen agronómico rápido en tiempo real */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-2 rounded-xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-xs flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <div className="text-left">
              <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase">
                Cultivo Activo
              </span>
              <span className="text-xs font-mono font-bold text-slate-800">
                {activeIndividuals} plantas · {locations.length} espacios
              </span>
            </div>
          </div>

          {currentWeather ? (
            <div className="px-3 py-2 rounded-xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-xs flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <div className="text-left">
                <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase">
                  Clima en Vivo
                </span>
                <span className="text-xs font-mono font-bold text-slate-800">
                  {currentWeather.temperature.toFixed(1)}°C · {currentWeather.conditionLabel}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>

      {/* ── Tarjeta de Ubicación y Clima en Tiempo Real ── */}
      <div>
        <LocationClimateCard />
      </div>

      {/* ── Workflow Stepper (Guía del Ciclo de Cultivo) ── */}
      <WorkflowPipeline />

      {/* ── Glosario Semántico Rápido ── */}
      <SemanticGlossaryBanner />

      {/* ── Métricas HUD Interactivas con Micro-interacciones y Badges de Etapa ── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-emerald-600" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              Métricas del Ciclo de Trabajo (Pasos 1 al 4)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Micro-interacciones interactivas · Clic para navegar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7 gap-3.5">
          {/* Paso 1: Espacios */}
          <StatCard
            step="Paso 1"
            label="Mis Espacios"
            value={locations.length}
            sub={`${locations.length === 1 ? '1 espacio activo' : `${locations.length} espacios activos`} · Invernaderos y salas`}
            icon={Map}
            iconBgClass="bg-rose-50 text-rose-700"
            iconTextClass="text-rose-600"
            onClick={() => navigate('/locations')}
            delay={0}
          />

          {/* Paso 2: Variedades (Accesiones) */}
          <StatCard
            step="Paso 2"
            label="Variedades (Accesiones)"
            value={accessions.length}
            sub={`En ${taxons.length} especie${taxons.length === 1 ? '' : 's'} botánica${taxons.length === 1 ? '' : 's'}`}
            icon={Sprout}
            iconBgClass="bg-emerald-50 text-emerald-700"
            iconTextClass="text-emerald-600"
            onClick={() => navigate('/accessions')}
            delay={0.04}
          />

          {/* Paso 2b: Lotes de Semillas */}
          <StatCard
            step="Paso 2b"
            label="Lotes de Semillas"
            value={activeLots}
            sub={`${totalSeeds.toLocaleString('es-AR')} semillas disponibles`}
            icon={Package}
            iconBgClass="bg-purple-50 text-purple-700"
            iconTextClass="text-purple-600"
            onClick={() => navigate('/seedlots')}
            delay={0.08}
          />

          {/* Paso 2c: Catálogo Botánico */}
          <StatCard
            step="Paso 2c"
            label="Catálogo Botánico"
            value={taxons.length}
            sub="Fichas FAO EcoCrop + GBIF"
            icon={Leaf}
            iconBgClass="bg-teal-50 text-teal-700"
            iconTextClass="text-teal-600"
            onClick={() => navigate('/taxons')}
            delay={0.12}
          />

          {/* Paso 3: Plantas en Cultivo Activo */}
          <StatCard
            step="Paso 3"
            label="Cultivo Activo"
            value={activeIndividuals}
            sub={`${individuals.length} plantas históricas totales`}
            icon={Users}
            iconBgClass="bg-blue-50 text-blue-700"
            iconTextClass="text-blue-600"
            onClick={() => navigate('/individuals')}
            delay={0.16}
          />

          {/* Paso 3b: Mediciones Fenotípicas */}
          <StatCard
            step="Paso 3b"
            label="Fenotipado"
            value={observations.length}
            sub="Mediciones fenotípicas registradas"
            icon={FlaskConical}
            iconBgClass="bg-amber-50 text-amber-700"
            iconTextClass="text-amber-600"
            onClick={() => navigate('/phenotyping')}
            delay={0.2}
          />

          {/* Paso 4: Cruzas y Fitomejoramiento */}
          <StatCard
            step="Paso 4"
            label="Cruzas y F1"
            value={crossings.length}
            sub={`${breedingLines} líneas F1/S1 registradas`}
            icon={GitBranch}
            iconBgClass="bg-pink-50 text-pink-700"
            iconTextClass="text-pink-600"
            onClick={() => navigate('/breeding')}
            delay={0.24}
          />
        </div>
      </div>

      {/* ── Sección Inferior: Distribución, Especies y Actividad Reciente ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <IndividualStatusChart />
        </div>
        <div className="lg:col-span-1">
          <TopTaxa />
        </div>
        <div className="lg:col-span-1">
          <RecentAccessions />
        </div>
      </div>
    </div>
  )
}
