import React from 'react'
import { Sprout, Wrench, Undo2, Redo2, ChevronUp, ChevronDown } from 'lucide-react'
import type { EditorMode } from '../editor/editorTypes'

export interface RoomCommandDockProps {
  mode: EditorMode
  onToggleMode: (mode: EditorMode) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onOpenSowDrawer?: () => void
  hasDockContent?: boolean
  isDockOpen?: boolean
  onToggleDockOpen?: () => void
}

export const RoomCommandDock: React.FC<RoomCommandDockProps> = React.memo(({
  mode,
  onToggleMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenSowDrawer,
  hasDockContent = false,
  isDockOpen = false,
  onToggleDockOpen,
}) => {
  const isCultivate = mode === 'plants'

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 18,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 35,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(24px) saturate(190%)',
        WebkitBackdropFilter: 'blur(24px) saturate(190%)',
        border: '1px solid rgba(226, 232, 240, 0.95)',
        borderRadius: 999,
        padding: '5px 8px',
        boxShadow: '0 8px 30px -4px rgba(15, 23, 42, 0.12), 0 2px 8px -2px rgba(15, 23, 42, 0.06)',
        pointerEvents: 'auto',
      }}
    >
      {/* Switcher de Modo de Trabajo [ 🌱 Cultivo | 🛠️ Diseñar ] */}
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
          aria-label="Modo Cultivo y Manejo de Plantas"
          title="Modo Cultivo (Monitoreo, siembra y fenología)"
          onClick={() => onToggleMode('plants')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 11px',
            borderRadius: 99,
            border: 'none',
            background: isCultivate ? 'var(--surface-elevated)' : 'transparent',
            color: isCultivate ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: isCultivate ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Sprout size={13} />
          <span>Cultivo</span>
        </button>
        <button
          type="button"
          aria-label="Modo Diseñar Espacio y Mobiliario"
          title="Modo Diseñar (Colocar contenedores, surcos y equipamiento)"
          onClick={() => onToggleMode('space')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 11px',
            borderRadius: 99,
            border: 'none',
            background: !isCultivate ? 'var(--surface-elevated)' : 'transparent',
            color: !isCultivate ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: !isCultivate ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Wrench size={13} />
          <span>Diseñar</span>
        </button>
      </div>

      <div style={{ width: 1, height: 18, background: 'var(--border)' }} />

      {/* Controles Contextuales según el Modo */}
      {isCultivate ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {/* Botón Principal de Siembra */}
          {onOpenSowDrawer && (
            <button
              type="button"
              aria-label="Sembrar en Celda"
              onClick={onOpenSowDrawer}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                height: 28,
                padding: '0 12px',
                borderRadius: 99,
                border: 'none',
                background: 'var(--accent)',
                color: 'white',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none'
              }}
            >
              <Sprout size={13} />
              <span>+ Sembrar</span>
            </button>
          )}

          {/* Toggle de la bandeja inferior de semillas/plantas */}
          {hasDockContent && onToggleDockOpen && (
            <button
              type="button"
              aria-label={isDockOpen ? 'Ocultar bandeja de semillas y plantas' : 'Mostrar bandeja de semillas y plantas'}
              title={isDockOpen ? 'Ocultar bandeja inferior' : 'Abrir bandeja de semillas y plantas'}
              onClick={onToggleDockOpen}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                height: 28,
                padding: '0 9px',
                borderRadius: 99,
                border: '1px solid var(--border)',
                background: isDockOpen ? 'var(--surface-subtle)' : 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>Bandeja</span>
              {isDockOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {/* Deshacer / Rehacer */}
          <button
            type="button"
            aria-label="Deshacer"
            title="Deshacer (Ctrl+Z)"
            disabled={!canUndo}
            onClick={onUndo}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              color: canUndo ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: canUndo ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Undo2 size={13} />
          </button>
          <button
            type="button"
            aria-label="Rehacer"
            title="Rehacer (Ctrl+Y)"
            disabled={!canRedo}
            onClick={onRedo}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              color: canRedo ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: canRedo ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Redo2 size={13} />
          </button>
        </div>
      )}
    </div>
  )
})

RoomCommandDock.displayName = 'RoomCommandDock'
