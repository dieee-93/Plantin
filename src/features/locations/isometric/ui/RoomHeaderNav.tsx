import React, { useState } from 'react'
import type { FacilityLocation } from '@/domain/location'
import { ArrowLeft, Grid3X3, Check } from 'lucide-react'

export interface RoomHeaderNavProps {
  location: FacilityLocation
  roomIndividualsCount: number
  totalSlots: number
  rows: number
  cols: number
  onBackToMap: () => void
  onUpdateGridDimensions?: (rows: number, cols: number) => void
}

export const RoomHeaderNav: React.FC<RoomHeaderNavProps> = React.memo(({
  location,
  roomIndividualsCount,
  totalSlots,
  rows,
  cols,
  onBackToMap,
  onUpdateGridDimensions,
}) => {
  const [showGridConfig, setShowGridConfig] = useState(false)
  const [customRows, setCustomRows] = useState(String(rows))
  const [customCols, setCustomCols] = useState(String(cols))

  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        left: 14,
        zIndex: 35,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        pointerEvents: 'auto',
      }}
    >
      {/* Píldora Principal de Navegación y Estado */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          borderRadius: 999,
          padding: '4px 12px 4px 6px',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        }}
      >
        {/* Botón Volver al Mapa de Espacios */}
        <button
          type="button"
          onClick={onBackToMap}
          aria-label="Mapa de Espacios"
          title="Volver al Mapa de Espacios"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: 'none',
            background: 'var(--surface-subtle)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--surface-elevated)'
            e.currentTarget.style.transform = 'translateX(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--surface-subtle)'
            e.currentTarget.style.transform = 'none'
          }}
        >
          <ArrowLeft size={15} />
        </button>

        {/* Separador vertical fino */}
        <div style={{ width: 1, height: 18, background: 'var(--border)' }} />

        {/* Nombre de la Sala */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              maxWidth: 200,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={location.name}
          >
            {location.name}
          </span>

          {/* Badge de Ocupación */}
          <span
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 99,
              background: 'rgba(16, 185, 129, 0.10)',
              color: 'var(--accent)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
            title={`Ocupación: ${roomIndividualsCount} de ${totalSlots} celdas`}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--accent)',
              }}
            />
            {roomIndividualsCount}/{totalSlots}
          </span>
        </div>

        {/* Botón de Ajuste de Grilla (4×5) */}
        {onUpdateGridDimensions && (
          <button
            type="button"
            onClick={() => setShowGridConfig(prev => !prev)}
            aria-label="Ajustar dimensiones de la grilla"
            title="Ajustar dimensiones de la sala"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 99,
              border: showGridConfig ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: showGridConfig ? 'var(--accent-light)' : 'transparent',
              color: showGridConfig ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Grid3X3 size={11} />
            <span>{rows}×{cols}</span>
          </button>
        )}
      </div>

      {/* Popover Compacto de Configuración de Grilla */}
      {showGridConfig && onUpdateGridDimensions && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '10px 14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
            animation: 'fadeIn 0.15s ease-out',
            marginTop: 4,
          }}
        >
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 500 }}>
            Filas:
            <input
              aria-label="Filas de la sala"
              type="number"
              min="1"
              max="16"
              value={customRows}
              onChange={e => setCustomRows(e.target.value)}
              style={{
                width: 44,
                padding: '3px 6px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11.5,
                textAlign: 'center',
              }}
            />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 500 }}>
            Cols:
            <input
              aria-label="Columnas de la sala"
              type="number"
              min="1"
              max="16"
              value={customCols}
              onChange={e => setCustomCols(e.target.value)}
              style={{
                width: 44,
                padding: '3px 6px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11.5,
                textAlign: 'center',
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              const r = Math.max(1, Math.min(16, parseInt(customRows, 10) || rows))
              const c = Math.max(1, Math.min(16, parseInt(customCols, 10) || cols))
              onUpdateGridDimensions(r, c)
              setShowGridConfig(false)
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 6,
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Check size={12} />
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
})

RoomHeaderNav.displayName = 'RoomHeaderNav'
