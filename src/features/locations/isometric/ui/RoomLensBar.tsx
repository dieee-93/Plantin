import React from 'react'
import type { Taxon } from '@/domain/taxon'
import type { IsometricLensMode } from '../botanicalArchetypes'
import { Eye, Activity, GitBranch, Thermometer, Filter } from 'lucide-react'

export interface RoomLensBarProps {
  lensMode: IsometricLensMode
  setLensMode: React.Dispatch<React.SetStateAction<IsometricLensMode>>
  speciesInRoom: { taxon: Taxon; count: number; badgeColor: string; archetypeLabel: string }[]
  speciesFilterId: string | null
  setSpeciesFilterId: React.Dispatch<React.SetStateAction<string | null>>
}

const LENS_OPTIONS: {
  id: IsometricLensMode
  label: string
  shortDesc: string
  icon: React.FC<{ size?: number; color?: string }>
}[] = [
  { id: 'species', label: 'Especies', shortDesc: 'Morfología y arquetipo por taxón', icon: Eye },
  { id: 'bbch', label: 'Fenología BBCH', shortDesc: 'Mapa de calor de desarrollo (0-99)', icon: Activity },
  { id: 'genetics', label: 'Genética / Pedigrí', shortDesc: 'Generación filial y vínculos parentales', icon: GitBranch },
  { id: 'climate', label: 'Confort Climático', shortDesc: 'Aptitud térmica especie vs. sala', icon: Thermometer },
]

export const RoomLensBar: React.FC<RoomLensBarProps> = React.memo(({
  lensMode,
  setLensMode,
  speciesInRoom,
  speciesFilterId,
  setSpeciesFilterId,
}) => {
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(226, 232, 240, 0.95)',
        borderRadius: 16,
        padding: '7px 12px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.08)',
        pointerEvents: 'auto',
      }}
    >
      {/* Selector de Capa Analítica */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-tertiary)',
            marginRight: 2,
          }}
        >
          Capa:
        </span>
        {LENS_OPTIONS.map(opt => {
          const Icon = opt.icon
          const active = lensMode === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              aria-label={`Lente ${opt.label}`}
              aria-pressed={active}
              onClick={() => setLensMode(opt.id)}
              title={opt.shortDesc}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 9px',
                borderRadius: 99,
                border: active ? '1px solid var(--accent)' : '1px solid transparent',
                background: active ? 'var(--accent-light)' : 'var(--surface-subtle)',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={12} />
              <span>{opt.label}</span>
            </button>
          )
        })}
      </div>

      {/* Filtro por Especie si hay plantas */}
      {speciesInRoom.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-tertiary)',
            }}
          >
            <Filter size={10} />
            <span>Filtrar:</span>
          </span>
          {speciesInRoom.map(({ taxon, count, badgeColor }) => {
            const isFiltered = speciesFilterId === taxon.id
            return (
              <button
                key={taxon.id}
                type="button"
                aria-label={`Filtrar especie ${taxon.commonName || `${taxon.genus} ${taxon.species}`}`}
                aria-pressed={isFiltered}
                onClick={() =>
                  setSpeciesFilterId(prev => (prev === taxon.id ? null : taxon.id))
                }
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  borderRadius: 99,
                  border: isFiltered ? `1.5px solid ${badgeColor}` : '1px solid var(--border)',
                  background: isFiltered ? 'var(--surface-elevated)' : 'var(--surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: 10.5,
                  fontWeight: isFiltered ? 700 : 500,
                  cursor: 'pointer',
                  boxShadow: isFiltered ? `0 0 0 2px ${badgeColor}22` : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: badgeColor,
                    display: 'inline-block',
                  }}
                />
                <span>{taxon.commonName || `${taxon.genus} ${taxon.species}`} ({count})</span>
              </button>
            )
          })}
          {speciesFilterId && (
            <button
              type="button"
              onClick={() => setSpeciesFilterId(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 10.5,
                color: 'var(--accent)',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 4px',
              }}
            >
              Ver todas
            </button>
          )}
        </div>
      )}
    </div>
  )
})

RoomLensBar.displayName = 'RoomLensBar'
