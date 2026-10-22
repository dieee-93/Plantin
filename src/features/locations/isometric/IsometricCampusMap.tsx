import React, { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import type { FacilityLocation, LocationType } from '@/domain/location'
import { getLocationGridDimensions } from '@/domain/location'
import type { Individual } from '@/domain/individual'
import type { SeedLot } from '@/domain/seedLot'
import type { Accession } from '@/domain/accession'
import type { Taxon } from '@/domain/taxon'
import { getIndividualDisplayName } from '@/domain/individual'
import { resolveBotanicalArchetype, type BotanicalVisualProfile } from './botanicalArchetypes'
import {
  Plus, Trash2, Sprout, Package, Users, Eye
} from 'lucide-react'

export interface IsometricCampusMapProps {
  locations: FacilityLocation[]
  individuals: Individual[]
  seedLots: SeedLot[]
  accessions: Accession[]
  taxons?: Taxon[]
  onSelectRoom: (locationId: string) => void
  onSowInRoom: (locationId: string) => void
  onDeleteRoom: (locationId: string) => void
  onOpenNewRoomDrawer: () => void
  onSelectIndividual: (locationId: string, individualId: string) => void
  onNavigateSeedLot: (seedLotId: string) => void
}

const TYPE_LABELS: Record<LocationType, string> = {
  greenhouse: 'Invernadero',
  room: 'Sala / Almacén',
  field: 'Campo Abierto / Parcela',
  growth_chamber: 'Cámara de Crecimiento',
  bench: 'Mesa / Bancada',
  lab: 'Laboratorio / Cámara Fría',
}

const TYPE_AGRO_BUFFER: Record<LocationType, { label: string; bg: string; border: string; text: string }> = {
  greenhouse:     { label: 'Protección térmica (+5°C / anti-heladas)', bg: '#d8f3dc', border: '#b7e4c7', text: '#1b4332' },
  field:          { label: 'Exposición directa a intemperie',          bg: '#fef3c7', border: '#fde68a', text: '#78350f' },
  growth_chamber: { label: 'Ambiente climatizado total',               bg: '#dbeafe', border: '#bfdbfe', text: '#1e3a5f' },
  room:           { label: 'Protección interior pasiva',               bg: 'var(--surface-subtle)', border: 'var(--border)', text: 'var(--text-secondary)' },
  bench:          { label: 'Sub-espacio de instalación',               bg: 'var(--surface-subtle)', border: 'var(--border)', text: 'var(--text-secondary)' },
  lab:            { label: 'Laboratorio / Conservación controlada',    bg: '#ede9fe', border: '#ddd6fe', text: '#4c1d95' },
}

interface MiniPlantPreview {
  profile: BotanicalVisualProfile
  bbch: number
}

function renderMiniPlantGlyph(preview: MiniPlantPreview | undefined, isEmptySlot: boolean) {
  if (isEmptySlot) {
    // Maceta 3D vacía en miniatura
    return (
      <g>
        <ellipse cx="0" cy="3" rx="6.5" ry="3.2" fill="rgba(15,23,42,0.18)" />
        <polygon points="-5,-2 0,1 0,5 -4,2" fill="#c2410c" />
        <polygon points="5,-2 0,1 0,5 4,2" fill="#9a3412" />
        <polygon points="0,-5 6,-2 0,1 -6,-2" fill="#ea580c" stroke="#7c2d12" strokeWidth="0.5" />
        <polygon points="0,-4 4.5,-2 0,0 -4.5,-2" fill="#3e2723" />
      </g>
    )
  }

  const profile = preview?.profile
  const bbch = preview?.bbch ?? 35
  const leafMid = profile?.leafMid ?? '#16a34a'
  const leafDark = profile?.leafDark ?? '#14532d'
  const leafLight = profile?.leafLight ?? '#4ade80'

  return (
    <g>
      <ellipse cx="0" cy="3" rx="7" ry="3.5" fill="rgba(15,23,42,0.2)" />
      {/* Maceta 3D miniatura */}
      <polygon points="-5,-2 0,1 0,5 -4,2" fill="#c2410c" />
      <polygon points="5,-2 0,1 0,5 4,2" fill="#9a3412" />
      <polygon points="0,-5 6,-2 0,1 -6,-2" fill="#ea580c" />
      <polygon points="0,-4 4.5,-2 0,0 -4.5,-2" fill="#3e2723" />
      {/* Follaje volumétrico */}
      <path d="M 0,-3 L 0,-12" stroke={leafDark} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 0,-6 Q -7,-11 -8,-6 Q -4,-3 0,-6" fill={leafDark} />
      <path d="M 0,-6 Q 7,-11 8,-6 Q 4,-3 0,-6" fill={leafMid} />
      <path d="M 0,-10 Q -5,-16 -6,-11 Q -3,-8 0,-10" fill={leafLight} />
      <path d="M 0,-10 Q 5,-16 6,-11 Q 3,-8 0,-10" fill={leafMid} />
      <circle cx="0" cy="-13" r="2.8" fill={leafLight} />
      {bbch >= 50 && bbch < 70 && (
        <circle cx="0" cy="-14" r="2.4" fill={profile?.flowerPetalColor ?? '#fde047'} stroke="#ca8a04" strokeWidth="0.5" />
      )}
      {bbch >= 70 && (
        <>
          <circle cx="-3" cy="-8" r="2.2" fill={profile?.ripeFruitColor ?? '#ef4444'} />
          <circle cx="3" cy="-9" r="2.2" fill={profile?.ripeFruitColor ?? '#ef4444'} />
        </>
      )}
    </g>
  )
}

/**
 * Diorama arquitectónico 2.5D Isométrico con espesor 3D real, gradientes de luz
 * y equipamiento específico según el tipo de instalación.
 */
function IsometricBuildingGraphic({
  type,
  activeCount,
  miniPreviews = [],
  seedLotCount = 0,
}: {
  type: LocationType
  activeCount: number
  miniPreviews?: MiniPlantPreview[]
  seedLotCount?: number
}) {
  const uid = React.useId().replace(/:/g, '')

  // 6 posiciones isométricas internas para mostrar macetas vacías o plantas activas
  const slotCoords = [
    { x: -18, y: -12 },
    { x: 2, y: -2 },
    { x: 22, y: 8 },
    { x: -36, y: -2 },
    { x: -16, y: 8 },
    { x: 4, y: 18 },
  ]

  return (
    <svg
      viewBox="-115 -92 230 156"
      style={{ width: '100%', height: 158, display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`wall-left-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id={`wall-right-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id={`floor-room-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id={`glass-shine-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(224, 242, 254, 0.72)" />
          <stop offset="50%" stopColor="rgba(125, 211, 252, 0.35)" />
          <stop offset="100%" stopColor="rgba(186, 230, 253, 0.6)" />
        </linearGradient>
        <linearGradient id={`field-soil-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#5c2d0c" />
        </linearGradient>
        <radialGradient id={`led-glow-${uid}`} cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="rgba(232, 121, 249, 0.48)" />
          <stop offset="100%" stopColor="rgba(232, 121, 249, 0)" />
        </radialGradient>
      </defs>

      <g data-building-3d={type}>
        {/* Sombra proyectada suave bajo la plataforma 3D */}
        <polygon
          points="0,-38 96,10 0,58 -96,10"
          fill="rgba(15, 23, 42, 0.12)"
        />

        {/* ── Basamento 3D con espesor estratificado ── */}
        {/* Cara frontal-izquierda de la losa */}
        <polygon
          points="-88,2 0,46 0,57 -88,13"
          fill={type === 'field' ? '#78350f' : type === 'growth_chamber' ? '#312e81' : '#64748b'}
        />
        {/* Cara frontal-derecha de la losa (más oscura por sombra) */}
        <polygon
          points="88,2 0,46 0,57 88,13"
          fill={type === 'field' ? '#451a03' : type === 'growth_chamber' ? '#1e1b4b' : '#475569'}
        />
        {/* Bisel superior de la losa */}
        <polygon
          points="0,-42 88,2 0,46 -88,2"
          fill={
            type === 'field'
              ? `url(#field-soil-${uid})`
              : type === 'greenhouse'
                ? '#ecfdf5'
                : type === 'growth_chamber'
                  ? '#1e1b4b'
                  : `url(#floor-room-${uid})`
          }
          stroke={type === 'field' ? '#b45309' : type === 'growth_chamber' ? '#6366f1' : '#94a3b8'}
          strokeWidth="1.5"
        />

        {/* ── 1. INVERNADERO (greenhouse) ── */}
        {type === 'greenhouse' && (
          <g>
            {/* Murete perimetral bajo de ladrillo/hormigón */}
            <polygon points="-82,0 0,-41 0,-49 -82,-8" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
            <polygon points="0,-41 82,0 82,-8 0,-49" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />

            {/* Paredes traseras vidriadas con montantes de aluminio */}
            <polygon
              points="-82,-8 0,-49 0,-76 -82,-35"
              fill={`url(#glass-shine-${uid})`}
              stroke="#0284c7"
              strokeWidth="1.5"
            />
            <polygon
              points="0,-49 82,-8 82,-35 0,-76"
              fill="rgba(56, 189, 248, 0.28)"
              stroke="#0284c7"
              strokeWidth="1.5"
            />
            {/* Costillas metálicas del invernadero */}
            <line x1="-41" y1="-28.5" x2="-41" y2="-55.5" stroke="#0284c7" strokeWidth="1.2" />
            <line x1="41" y1="-28.5" x2="41" y2="-55.5" stroke="#0284c7" strokeWidth="1.2" />

            {/* Tanque de riego azul adosado al lateral izquierdo */}
            <g transform="translate(-68, -22)">
              <ellipse cx="0" cy="6" rx="7" ry="3.5" fill="#0369a1" />
              <rect x="-7" y="-8" width="14" height="14" fill="#0284c7" />
              <ellipse cx="0" cy="-8" rx="7" ry="3.5" fill="#38bdf8" stroke="#0369a1" strokeWidth="0.8" />
            </g>

            {/* Mesadas de cultivo y macetas 3D (ocupadas o vacías) */}
            {slotCoords.map((pt, idx) => (
              <g key={idx} transform={`translate(${pt.x}, ${pt.y})`}>
                {renderMiniPlantGlyph(miniPreviews[idx], idx >= activeCount)}
              </g>
            ))}

            {/* Pórticos y Techo a dos aguas de cristal con ventana cenital */}
            <polygon
              points="-82,-35 0,-76 0,-88 -42,-67"
              fill="rgba(224, 242, 254, 0.55)"
              stroke="#0369a1"
              strokeWidth="1.4"
            />
            <polygon
              points="0,-76 82,-35 42,-26 0,-88"
              fill="rgba(125, 211, 252, 0.45)"
              stroke="#0369a1"
              strokeWidth="1.4"
            />
            {/* Líneas de brillo especular sobre el vidrio */}
            <line x1="-58" y1="-38" x2="-46" y2="-52" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />
            <line x1="-28" y1="-53" x2="-16" y2="-67" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* ── 2. CAMPO ABIERTO / PARCELA (field) ── */}
        {type === 'field' && (
          <g>
            {/* Borde de pasto perimetral */}
            <polygon points="-88,2 0,-42 0,-36 -82,5" fill="#4ade80" opacity="0.65" />
            <polygon points="0,-42 88,2 82,5 0,-36" fill="#22c55e" opacity="0.65" />

            {/* Camellones 3D esculpidos con sombra y cinta de goteo */}
            {[-24, -8, 8, 24].map((offset, idx) => (
              <g key={idx}>
                <line
                  x1={-56 + offset}
                  y1={-6 + offset * 0.5}
                  x2={18 + offset}
                  y2={31 + offset * 0.5}
                  stroke="#3e1f08"
                  strokeWidth="7.5"
                  strokeLinecap="round"
                />
                <line
                  x1={-56 + offset}
                  y1={-7.5 + offset * 0.5}
                  x2={18 + offset}
                  y2={29.5 + offset * 0.5}
                  stroke="#78350f"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <line
                  x1={-56 + offset}
                  y1={-7.5 + offset * 0.5}
                  x2={18 + offset}
                  y2={29.5 + offset * 0.5}
                  stroke="#38bdf8"
                  strokeWidth="0.9"
                  strokeDasharray="3 2"
                />
              </g>
            ))}

            {/* Cerco perimetral de madera y alambre */}
            <line x1="-78" y1="-10" x2="0" y2="-49" stroke="#d97706" strokeWidth="1.2" strokeDasharray="4 2" />
            <line x1="0" y1="-49" x2="78" y2="-10" stroke="#b45309" strokeWidth="1.2" strokeDasharray="4 2" />
            {[
              { x: -78, y: -16 },
              { x: -40, y: -35 },
              { x: -2, y: -54 },
              { x: 38, y: -35 },
              { x: 74, y: -16 },
            ].map((post, idx) => (
              <g key={idx}>
                <rect x={post.x} y={post.y} width="5" height="16" rx="1" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />
                <ellipse cx={post.x + 2.5} cy={post.y} rx="2.5" ry="1.2" fill="#d97706" />
              </g>
            ))}

            {/* Plantas sembradas directamente en el camellón */}
            {slotCoords.map((pt, idx) => (
              <g key={idx} transform={`translate(${pt.x}, ${pt.y})`}>
                {idx < activeCount ? (
                  renderMiniPlantGlyph(miniPreviews[idx], false)
                ) : (
                  <ellipse cx="0" cy="0" rx="5" ry="2.5" fill="#451a03" stroke="#92400e" strokeWidth="0.8" />
                )}
              </g>
            ))}
          </g>
        )}

        {/* ── 3. CÁMARA DE CRECIMIENTO LED (growth_chamber) ── */}
        {type === 'growth_chamber' && (
          <g>
            {/* Paredes isotérmicas con espesor 3D metálico */}
            <polygon points="-80,0 0,-40 0,-76 -80,-36" fill="#312e81" stroke="#6366f1" strokeWidth="1.5" />
            <polygon points="0,-40 80,0 80,-36 0,-76" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="1.5" />
            {/* Coronamiento 3D superior de los muros */}
            <polygon points="-80,-36 0,-76 0,-81 -85,-38.5" fill="#818cf8" />
            <polygon points="0,-76 80,-36 85,-38.5 0,-81" fill="#6366f1" />

            {/* Haz de luz radial Full-Spectrum */}
            <ellipse cx="0" cy="-10" rx="68" ry="34" fill={`url(#led-glow-${uid})`} />

            {/* Bandejas técnicas y plantas */}
            {slotCoords.map((pt, idx) => (
              <g key={idx} transform={`translate(${pt.x}, ${pt.y})`}>
                {renderMiniPlantGlyph(miniPreviews[idx], idx >= activeCount)}
              </g>
            ))}

            {/* Panel LED Full-Spectrum suspendido con barras de diodos */}
            <polygon
              points="0,-68 54,-41 0,-14 -54,-41"
              fill="rgba(217, 70, 239, 0.38)"
              stroke="#f0abfc"
              strokeWidth="1.5"
            />
            <line x1="-26" y1="-41" x2="0" y2="-54" stroke="#fdf4ff" strokeWidth="2" />
            <line x1="-10" y1="-33" x2="16" y2="-46" stroke="#fdf4ff" strokeWidth="2" />
            <line x1="6" y1="-25" x2="32" y2="-38" stroke="#fdf4ff" strokeWidth="2" />
          </g>
        )}

        {/* ── 4. SALA / ALMACÉN / PATIO / LABORATORIO / BANCADA (room | lab | bench) ── */}
        {(type === 'room' || type === 'lab' || type === 'bench') && (
          <g>
            {/* Muros en corte con espesor 3D (Cara interior + Coronamiento superior + Bisel lateral) */}
            {/* Cara interior izquierda */}
            <polygon
              points="-82,0 0,-41 0,-74 -82,-33"
              fill={type === 'lab' ? '#ede9fe' : `url(#wall-left-${uid})`}
              stroke="#94a3b8"
              strokeWidth="1.4"
            />
            {/* Cara interior derecha */}
            <polygon
              points="0,-41 82,0 82,-33 0,-74"
              fill={type === 'lab' ? '#ddd6fe' : `url(#wall-right-${uid})`}
              stroke="#64748b"
              strokeWidth="1.4"
            />
            {/* Espesor superior (Top Cap 3D) del muro izquierdo y derecho */}
            <polygon
              points="-82,-33 0,-74 0,-80 -88,-36"
              fill="#f8fafc"
              stroke="#94a3b8"
              strokeWidth="1.2"
            />
            <polygon
              points="0,-74 82,-33 88,-36 0,-80"
              fill="#e2e8f0"
              stroke="#64748b"
              strokeWidth="1.2"
            />
            {/* Espesor lateral en los extremos del corte */}
            <polygon points="-88,-36 -82,-33 -82,0 -88,-3" fill="#94a3b8" />
            <polygon points="88,-36 82,-33 82,0 88,-3" fill="#475569" />

            {/* Zócalo arquitectónico interior */}
            <line x1="-81" y1="-2" x2="0" y2="-42.5" stroke="#64748b" strokeWidth="2.5" />
            <line x1="0" y1="-42.5" x2="81" y2="-2" stroke="#475569" strokeWidth="2.5" />

            {/* Ventana / Rejilla de ventilación en pared izquierda */}
            <polygon
              points="-54,-38 -24,-53 -24,-37 -54,-22"
              fill="#bae6fd"
              stroke="#0284c7"
              strokeWidth="1.2"
            />
            <line x1="-39" y1="-45.5" x2="-39" y2="-29.5" stroke="#0284c7" strokeWidth="1" />

            {/* Puerta / Panel técnico en pared derecha */}
            <polygon
              points="28,-46 52,-34 52,-12 28,-24"
              fill="#cbd5e1"
              stroke="#475569"
              strokeWidth="1.2"
            />
            <circle cx="48" cy="-22" r="1.5" fill="#334155" />

            {/* Si hay SeedLots almacenados, estantería con cajas en la pared */}
            {seedLotCount > 0 && (
              <g transform="translate(-26, -34)">
                <rect x="-13" y="-9" width="26" height="13" rx="2" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.1" />
                <text x="0" y="0" textAnchor="middle" fontSize="6.5" fontFamily="monospace" fontWeight="700" fill="#5b21b6">
                  {seedLotCount} LOTES
                </text>
              </g>
            )}

            {/* Grilla interior de cultivo con macetas 3D reales (vacías o con planta) */}
            {slotCoords.map((pt, idx) => (
              <g key={idx} transform={`translate(${pt.x}, ${pt.y})`}>
                {renderMiniPlantGlyph(miniPreviews[idx], idx >= activeCount)}
              </g>
            ))}
          </g>
        )}
      </g>
    </svg>
  )
}

export const IsometricCampusMap: React.FC<IsometricCampusMapProps> = ({
  locations,
  individuals,
  seedLots,
  accessions,
  taxons = [],
  onSelectRoom,
  onSowInRoom,
  onDeleteRoom,
  onOpenNewRoomDrawer,
  onSelectIndividual,
  onNavigateSeedLot,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const accessionToTaxon = useMemo(() => {
    const map = new Map<string, Taxon>()
    for (const acc of accessions) {
      const t = taxons.find(tx => tx.id === acc.taxonId)
      if (t) map.set(acc.id, t)
    }
    return map
  }, [accessions, taxons])

  if (locations.length === 0) {
    return (
      <div
        style={{
          padding: '56px 24px',
          textAlign: 'center',
          border: '1px dashed var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface-elevated)',
        }}
      >
        <div style={{ maxWidth: 240, margin: '0 auto 12px' }}>
          <IsometricBuildingGraphic type="greenhouse" activeCount={3} />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          No hay ubicaciones
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', maxWidth: 460, margin: '0 auto 16px' }}>
          Crea tu primera sala, invernadero o parcela experimental en el panel lateral para visualizar tu mapa isométrico 2.5D y sembrar tus plantas.
        </p>
        <button
          type="button"
          onClick={onOpenNewRoomDrawer}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          Construir primera instalación
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
        gap: 16,
      }}
    >
      {locations.map((loc, i) => {
        const locIndividuals = individuals.filter(ind => ind.locationId === loc.id)
        const activeLocIndividuals = locIndividuals.filter(ind => ind.status === 'active')
        const locSeedLots = seedLots.filter(lot => lot.locationId === loc.id && lot.status === 'active')
        const { rows, cols } = getLocationGridDimensions(loc, locIndividuals.length)

        // Previews botánicos por especie para el edificio 2.5D
        const miniPreviews: MiniPlantPreview[] = activeLocIndividuals.slice(0, 6).map(ind => {
          const taxon = accessionToTaxon.get(ind.accessionId)
          return {
            profile: resolveBotanicalArchetype(taxon),
            bbch: ind.currentBBCH ?? 14,
          }
        })

        // Resumen de especies cultivadas en esta sala
        const roomSpeciesMap = new Map<string, { label: string; count: number; color: string }>()
        for (const ind of activeLocIndividuals) {
          const taxon = accessionToTaxon.get(ind.accessionId)
          if (!taxon) continue
          const profile = resolveBotanicalArchetype(taxon)
          const existing = roomSpeciesMap.get(taxon.id)
          if (existing) {
            existing.count += 1
          } else {
            roomSpeciesMap.set(taxon.id, {
              label: taxon.commonName || `${taxon.genus} ${taxon.species}`,
              count: 1,
              color: profile.badgeColor,
            })
          }
        }
        const roomSpeciesList = Array.from(roomSpeciesMap.values())

        const indCount = locIndividuals.length
        const isFull = Boolean(loc.capacity && indCount >= loc.capacity)
        const capacityPercentage = loc.capacity ? Math.min(100, Math.round((indCount / loc.capacity) * 100)) : 0
        const buffer = TYPE_AGRO_BUFFER[loc.type]

        return (
          <motion.div
            key={loc.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
              position: 'relative',
            }}
          >
            <div>
              {/* Cabecera con título, grilla y acción de borrado */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        color: 'var(--accent)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {TYPE_LABELS[loc.type]}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: 'var(--surface-subtle)',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      Grilla {rows}×{cols}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                    {loc.name}
                  </h3>
                </div>

                {confirmDeleteId === loc.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteRoom(loc.id)
                        setConfirmDeleteId(null)
                      }}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: '#dc2626',
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      style={{
                        padding: '3px 7px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        background: 'white',
                        color: 'var(--text-secondary)',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(loc.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-tertiary)',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                    title="Eliminar ubicación"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {loc.description && (
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                  {loc.description}
                </p>
              )}

              {/* Escena Isométrica Clickeable (Drill-down al interior de la sala) */}
              <div
                role="button"
                tabIndex={0}
                aria-label={`Entrar a vista isométrica de ${loc.name}`}
                onClick={() => onSelectRoom(loc.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectRoom(loc.id)
                  }
                }}
                style={{
                  background: 'linear-gradient(180deg, var(--surface-subtle) 0%, #f1f5f9 100%)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px 10px',
                  marginBottom: 10,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'border-color 0.15s ease, transform 0.15s ease',
                }}
              >
                <IsometricBuildingGraphic
                  type={loc.type}
                  activeCount={activeLocIndividuals.length}
                  miniPreviews={miniPreviews}
                  seedLotCount={locSeedLots.length}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 4,
                    paddingTop: 6,
                    borderTop: '1px dashed var(--border)',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--accent)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Eye size={12} />
                    Abrir plano isométrico interior
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-secondary)' }}>
                    {activeLocIndividuals.length} activas
                  </span>
                </div>
              </div>

              {buffer && (
                <div
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: buffer.bg,
                    border: `1px solid ${buffer.border}`,
                    color: buffer.text,
                    fontSize: 11,
                    fontWeight: 500,
                    marginBottom: 10,
                  }}
                >
                  {buffer.label}
                </div>
              )}

              {/* Resumen de Especies Cultivadas en esta Sala */}
              {roomSpeciesList.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                  {roomSpeciesList.map(sp => (
                    <span
                      key={sp.label}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 7px',
                        borderRadius: 99,
                        background: 'var(--surface-subtle)',
                        border: '1px solid var(--border)',
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: sp.color,
                          display: 'inline-block',
                        }}
                      />
                      {sp.label} ({sp.count})
                    </span>
                  ))}
                </div>
              )}

              {/* Plantas alojadas en este espacio */}
              {activeLocIndividuals.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--text-tertiary)',
                      fontFamily: 'var(--font-mono)',
                      marginBottom: 5,
                    }}
                  >
                    Plantas activas aquí ({activeLocIndividuals.length})
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {activeLocIndividuals.slice(0, 4).map(ind => {
                      const acc = accessions.find(a => a.id === ind.accessionId)
                      const dispName = getIndividualDisplayName(ind, acc?.accessionNumber)
                      return (
                        <button
                          key={ind.id}
                          type="button"
                          onClick={() => onSelectIndividual(loc.id, ind.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--surface-subtle)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            fontSize: 11,
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer',
                          }}
                        >
                          <Users size={10} color="var(--accent)" />
                          {dispName}
                          {ind.currentBBCH !== undefined ? ` (BBCH ${ind.currentBBCH})` : ''}
                        </button>
                      )
                    })}
                    {activeLocIndividuals.length > 4 && (
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', alignSelf: 'center' }}>
                        +{activeLocIndividuals.length - 4} más
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Lotes guardados en este espacio */}
              {locSeedLots.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--text-tertiary)',
                      fontFamily: 'var(--font-mono)',
                      marginBottom: 5,
                    }}
                  >
                    Lotes almacenados ({locSeedLots.length})
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {locSeedLots.slice(0, 3).map(lot => (
                      <button
                        key={lot.id}
                        type="button"
                        onClick={() => onNavigateSeedLot(lot.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 7px',
                          borderRadius: 'var(--radius-sm)',
                          background: '#ede9fe',
                          border: '1px solid #c4b5fd',
                          color: '#5b21b6',
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer',
                        }}
                      >
                        <Package size={10} />
                        {lot.lotCode}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer con ocupación y acciones */}
            <div>
              <div
                style={{
                  background: 'var(--surface-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: loc.capacity ? 6 : 0 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--text-tertiary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    Ocupación
                  </span>
                  <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {indCount} {loc.capacity ? `/ ${loc.capacity}` : 'plantas'}
                  </span>
                </div>

                {loc.capacity && (
                  <div style={{ height: 4, background: 'var(--surface-muted)', borderRadius: 99, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${capacityPercentage}%`,
                        background: isFull ? '#c0392b' : 'var(--accent)',
                        borderRadius: 99,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => onSelectRoom(loc.id)}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    padding: '7px 11px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent)',
                    border: 'none',
                    color: 'white',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Eye size={12} />
                  Entrar a Sala
                </button>

                <button
                  type="button"
                  onClick={() => onSowInRoom(loc.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 11px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-light)',
                    border: '1px solid #b7e4c7',
                    color: 'var(--accent)',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Sprout size={12} />
                  Sembrar aquí
                </button>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
