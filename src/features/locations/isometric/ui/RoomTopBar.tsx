import React, { useState } from 'react'
import type { FacilityLocation } from '@/domain/location'
import {
  ArrowLeft,
  Move,
  ZoomIn,
  ZoomOut,
  Grid,
  Tag,
  Sun,
  Moon,
  Sprout,
  Pencil,
  Compass,
  Undo2,
  Redo2,
} from 'lucide-react'

export interface RoomTopBarProps {
  location: FacilityLocation
  roomIndividualsCount: number
  totalSlots: number
  rows: number
  cols: number
  zoom: number
  showPlantNames: boolean
  movingPlantId: string | null
  ambientLightingEnabled?: boolean
  mode?: 'plants' | 'space'
  viewMode?: 'iso' | 'plan'
  canUndo?: boolean
  canRedo?: boolean
  onToggleMode?: (mode: 'plants' | 'space') => void
  onToggleViewMode?: (viewMode: 'iso' | 'plan') => void
  onUndo?: () => void
  onRedo?: () => void
  onToggleAmbientLighting?: () => void
  onBackToMap: () => void
  onUpdateGridDimensions?: (rows: number, cols: number) => void
  setZoom: React.Dispatch<React.SetStateAction<number>>
  setShowPlantNames: React.Dispatch<React.SetStateAction<boolean>>
  setMovingPlantId: React.Dispatch<React.SetStateAction<string | null>>
}

export const RoomTopBar: React.FC<RoomTopBarProps> = React.memo(({
  location,
  roomIndividualsCount,
  totalSlots,
  rows,
  cols,
  zoom,
  showPlantNames,
  movingPlantId,
  ambientLightingEnabled = true,
  mode = 'plants',
  viewMode = 'iso',
  canUndo = false,
  canRedo = false,
  onToggleMode,
  onToggleViewMode,
  onUndo,
  onRedo,
  onToggleAmbientLighting,
  onBackToMap,
  onUpdateGridDimensions,
  setZoom,
  setShowPlantNames,
  setMovingPlantId,
}) => {
  const [showGridConfig, setShowGridConfig] = useState(false)
  const [customRows, setCustomRows] = useState<string>(String(rows))
  const [customCols, setCustomCols] = useState<string>(String(cols))

  return (
    <>
      <div
        style={{
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={onBackToMap}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--surface-subtle)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={13} />
            Mapa de Espacios
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                {location.name}
              </h2>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 8px',
                  borderRadius: 99,
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  fontWeight: 600,
                }}
              >
                {roomIndividualsCount} / {totalSlots} celdas ({rows}×{cols})
              </span>
              {onUpdateGridDimensions && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomRows(String(rows))
                    setCustomCols(String(cols))
                    setShowGridConfig(prev => !prev)
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: showGridConfig ? 'var(--surface-subtle)' : 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                  }}
                  title="Configurar filas y columnas de la sala"
                >
                  <Grid size={11} />
                  Dimensionar grilla
                </button>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Haz clic en una maceta 3D vacía para sembrar, arrastra semillas desde la bandeja, o cambia el Lente Visual para analizar especies, BBCH, genética y clima.
            </p>
          </div>
        </div>

        {/* Conmutador de Modos: Plantas vs Editar Espacio */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {onToggleMode && (
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--surface-subtle)',
                padding: 2,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}
            >
              <button
                type="button"
                onClick={() => onToggleMode('plants')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 4,
                  border: 'none',
                  background: mode === 'plants' ? 'var(--surface-elevated)' : 'transparent',
                  color: mode === 'plants' ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: mode === 'plants' ? 600 : 500,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  boxShadow: mode === 'plants' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <Sprout size={12} />
                Plantas
              </button>
              <button
                type="button"
                onClick={() => onToggleMode('space')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 4,
                  border: 'none',
                  background: mode === 'space' ? 'var(--accent)' : 'transparent',
                  color: mode === 'space' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: mode === 'space' ? 600 : 500,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  boxShadow: mode === 'space' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                }}
              >
                <Pencil size={12} />
                Editar Espacio
              </button>
            </div>
          )}

          {/* En modo Espacio: Conmutador Iso/Planta y Deshacer/Rehacer */}
          {mode === 'space' && onToggleViewMode && (
            <button
              type="button"
              onClick={() => onToggleViewMode(viewMode === 'iso' ? 'plan' : 'iso')}
              title="Alternar entre perspectiva Isométrica y Planta 2D"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--surface-subtle)',
                color: 'var(--text-primary)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Compass size={12} />
              {viewMode === 'iso' ? 'Vista: Isométrica' : 'Vista: Planta 2D'}
            </button>
          )}

          {mode === 'space' && onUndo && (
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Deshacer cambio (Ctrl+Z)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: 6,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--surface-subtle)',
                color: canUndo ? 'var(--text-primary)' : 'var(--text-tertiary)',
                opacity: canUndo ? 1 : 0.45,
                cursor: canUndo ? 'pointer' : 'not-allowed',
              }}
            >
              <Undo2 size={13} />
            </button>
          )}

          {mode === 'space' && onRedo && (
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Rehacer cambio (Ctrl+Y)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: 6,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--surface-subtle)',
                color: canRedo ? 'var(--text-primary)' : 'var(--text-tertiary)',
                opacity: canRedo ? 1 : 0.45,
                cursor: canRedo ? 'pointer' : 'not-allowed',
              }}
            >
              <Redo2 size={13} />
            </button>
          )}

          {movingPlantId && (
            <button
              type="button"
              onClick={() => setMovingPlantId(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 11px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #d97706',
                background: '#fef3c7',
                color: '#92400e',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Move size={12} />
              Selecciona celda o sala destino...
            </button>
          )}

          <button
            type="button"
            aria-label="Alternar visualización de nombres de plantas"
            aria-pressed={showPlantNames}
            onClick={() => setShowPlantNames(prev => !prev)}
            title="Mostrar u ocultar los nombres de todas las plantas"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 11px',
              borderRadius: 'var(--radius-sm)',
              border: showPlantNames ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: showPlantNames ? 'var(--accent-light)' : 'var(--surface-subtle)',
              color: showPlantNames ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Tag size={12} />
            Nombres
          </button>

          {onToggleAmbientLighting && (
            <button
              type="button"
              onClick={onToggleAmbientLighting}
              aria-label={ambientLightingEnabled ? 'Desactivar luz diurna ambiental' : 'Activar luz diurna ambiental'}
              title={ambientLightingEnabled ? 'Luz diurna activa (clic para desactivar)' : 'Luz diurna inactiva'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: ambientLightingEnabled ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: ambientLightingEnabled ? 'var(--accent-light)' : 'var(--surface-subtle)',
                color: ambientLightingEnabled ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {ambientLightingEnabled ? <Sun size={13} /> : <Moon size={13} />}
              Luz
            </button>
          )}

          <button
            type="button"
            aria-label="Alejar vista"
            onClick={() => setZoom(z => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
            style={{
              padding: 6,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--surface-subtle)',
              cursor: 'pointer',
            }}
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            aria-label="Restablecer zoom"
            onClick={() => setZoom(1)}
            style={{
              padding: '5px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--surface-subtle)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            aria-label="Acercar vista"
            onClick={() => setZoom(z => Math.min(1.45, Number((z + 0.15).toFixed(2))))}
            style={{
              padding: 6,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--surface-subtle)',
              cursor: 'pointer',
            }}
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* Popover de re-dimensionamiento de grilla */}
      {showGridConfig && onUpdateGridDimensions && (
        <div
          style={{
            background: 'var(--surface-elevated)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
            Redimensionar capacidad de {location.name}:
          </span>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            Filas (A-Z):
            <input
              aria-label="Filas de la sala"
              type="number"
              min="1"
              max="16"
              value={customRows}
              onChange={e => setCustomRows(e.target.value)}
              style={{
                width: 60,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
              }}
            />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            Columnas (01-16):
            <input
              aria-label="Columnas de la sala"
              type="number"
              min="1"
              max="16"
              value={customCols}
              onChange={e => setCustomCols(e.target.value)}
              style={{
                width: 60,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
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
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Aplicar dimensiones
          </button>
        </div>
      )}
    </>
  )
})
RoomTopBar.displayName = 'RoomTopBar'
