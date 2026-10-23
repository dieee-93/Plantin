import React from 'react'
import { ZoomIn, ZoomOut, Compass, Box, Square } from 'lucide-react'
import type { EditorViewMode } from '../editor/editorTypes'

export interface RoomCameraWidgetProps {
  zoom: number
  setZoom: React.Dispatch<React.SetStateAction<number>>
  viewMode: EditorViewMode
  onToggleViewMode: (viewMode: EditorViewMode) => void
  onResetCamera?: () => void
}

export const RoomCameraWidget: React.FC<RoomCameraWidgetProps> = React.memo(({
  zoom,
  setZoom,
  viewMode,
  onToggleViewMode,
  onResetCamera,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 18,
        right: 18,
        zIndex: 35,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        borderRadius: 999,
        padding: '3px 6px',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        pointerEvents: 'auto',
      }}
    >
      {/* Selector de Perspectiva 3D / 2D */}
      <div
        style={{
          display: 'inline-flex',
          background: 'var(--surface-subtle)',
          borderRadius: 99,
          padding: 2,
        }}
      >
        <button
          type="button"
          aria-label="Proyección isométrica 3D"
          title="Vista Isométrica 3D"
          onClick={() => onToggleViewMode('iso')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            padding: '3px 8px',
            borderRadius: 99,
            border: 'none',
            background: viewMode === 'iso' ? 'var(--surface-elevated)' : 'transparent',
            color: viewMode === 'iso' ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: viewMode === 'iso' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Box size={11} />
          <span>3D</span>
        </button>
        <button
          type="button"
          aria-label="Plano cenital 2D"
          title="Plano Cenital 2D"
          onClick={() => onToggleViewMode('plan')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            padding: '3px 8px',
            borderRadius: 99,
            border: 'none',
            background: viewMode === 'plan' ? 'var(--surface-elevated)' : 'transparent',
            color: viewMode === 'plan' ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: viewMode === 'plan' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Square size={11} />
          <span>2D</span>
        </button>
      </div>

      <div style={{ width: 1, height: 16, background: 'var(--border)' }} />

      {/* Controles de Zoom */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          height: 26,
        }}
      >
        <button
          type="button"
          aria-label="Alejar vista"
          title="Alejar vista"
          onClick={() => setZoom(z => Math.max(0.65, Number((z - 0.15).toFixed(2))))}
          style={{
            width: 24,
            height: 24,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            borderRadius: 4,
          }}
        >
          <ZoomOut size={12} />
        </button>
        <button
          type="button"
          aria-label="Restablecer zoom y encuadrar"
          title="Recentrar sala (100%)"
          onClick={() => {
            setZoom(1)
            onResetCamera?.()
          }}
          style={{
            height: '100%',
            padding: '0 6px',
            border: 'none',
            background: 'transparent',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            cursor: 'pointer',
            color: 'var(--text-primary)',
          }}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          aria-label="Acercar vista"
          title="Acercar vista"
          onClick={() => setZoom(z => Math.min(1.45, Number((z + 0.15).toFixed(2))))}
          style={{
            width: 24,
            height: 24,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            borderRadius: 4,
          }}
        >
          <ZoomIn size={12} />
        </button>
      </div>

      <div style={{ width: 1, height: 16, background: 'var(--border)' }} />

      {/* Botón Recentrar / Home */}
      <button
        type="button"
        aria-label="Recentrar cámara"
        title="Recentrar sala en el centro de la pantalla"
        onClick={() => {
          setZoom(1)
          onResetCamera?.()
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}
      >
        <Compass size={13} />
      </button>
    </div>
  )
})

RoomCameraWidget.displayName = 'RoomCameraWidget'
