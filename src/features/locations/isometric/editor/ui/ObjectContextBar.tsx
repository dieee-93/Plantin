import React from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { OBJECT_CATALOG } from '../../catalog'
import { getPlantSpacing } from '@/data/plantSpacing'
import { RotateCw, Copy, Trash2, X, AlertTriangle } from 'lucide-react'

export interface ObjectContextBarProps {
  selectedObject: PlacedObject
  activeCropCode?: string
  onRotate: () => void
  onDuplicate: () => void
  onDelete: () => void
  onDeselect: () => void
  onUpdateParams?: (patch: Record<string, number | string | boolean>) => void
}

export const ObjectContextBar: React.FC<ObjectContextBarProps> = React.memo(({
  selectedObject,
  activeCropCode,
  onRotate,
  onDuplicate,
  onDelete,
  onDeselect,
  onUpdateParams,
}) => {
  const def = OBJECT_CATALOG[selectedObject.typeId]
  const baseW = Number(selectedObject.params?.widthCm ?? selectedObject.params?.lengthCm ?? def?.footprint.w ?? 50)
  const baseD = Number(selectedObject.params?.depthCm ?? def?.footprint.d ?? 50)
  const h = def?.footprint.h ?? 30

  const isRotated = selectedObject.rotation === 90 || selectedObject.rotation === 270
  const w = isRotated ? baseD : baseW
  const d = isRotated ? baseW : baseD

  const currentSpacing = Number(selectedObject.params?.plantSpacingCm ?? (def?.id === 'furrow' || def?.id === 'raised_bed' ? 40 : null))
  const rec = getPlantSpacing(activeCropCode || 'TOM')
  const isSpacingBelowRec = currentSpacing && currentSpacing < rec.plantCm

  const handleSetSpacing = (cm: number) => {
    onUpdateParams?.({
      ...selectedObject.params,
      plantSpacingCm: cm,
    })
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(15, 23, 42, 0.94)',
        color: '#f8fafc',
        backdropFilter: 'blur(8px)',
        padding: '6px 14px',
        borderRadius: 99,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: 'var(--shadow-lg)',
        zIndex: 35,
        fontSize: 12,
        maxWidth: '95vw',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontWeight: 600, color: '#38bdf8' }}>
        {selectedObject.label || def?.label || selectedObject.typeId}
      </span>

      <span style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
        {w}×{d}×{h} cm · {selectedObject.rotation}°
      </span>

      {/* Control de espaciado interactivo para contenedores de cultivo */}
      {currentSpacing !== null && onUpdateParams && (
        <>
          <div style={{ width: 1, height: 16, background: '#334155' }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: '#cbd5e1', fontSize: 11 }}>Espaciado:</span>
            <input
              type="number"
              min={10}
              max={200}
              step={5}
              value={currentSpacing}
              onChange={(e) => {
                const val = Number(e.target.value)
                if (val > 0) handleSetSpacing(val)
              }}
              style={{
                width: 44,
                padding: '1px 4px',
                borderRadius: 4,
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #475569',
                fontSize: 11,
                textAlign: 'center',
              }}
            />
            <span style={{ color: '#94a3b8', fontSize: 11 }}>cm</span>

            {/* Chips rápidos de espaciado */}
            <div style={{ display: 'inline-flex', gap: 3, marginLeft: 4 }}>
              {[25, 40, 50].map((spacing) => (
                <button
                  key={spacing}
                  type="button"
                  onClick={() => handleSetSpacing(spacing)}
                  style={{
                    border: 'none',
                    background: currentSpacing === spacing ? '#0284c7' : '#334155',
                    color: '#f8fafc',
                    fontSize: 10,
                    padding: '2px 5px',
                    borderRadius: 3,
                    cursor: 'pointer',
                  }}
                >
                  {spacing}
                </button>
              ))}
              {rec.isRecommended && (
                <button
                  type="button"
                  onClick={() => handleSetSpacing(rec.plantCm)}
                  title={`Recomendado: ${rec.plantCm} cm (${rec.source})`}
                  style={{
                    border: 'none',
                    background: currentSpacing === rec.plantCm ? '#16a34a' : '#1e3a29',
                    color: '#86efac',
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 3,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ★ {rec.plantCm}cm
                </button>
              )}
            </div>

            {/* Aviso no bloqueante si está por debajo del recomendado */}
            {isSpacingBelowRec && (
              <span
                title={`Espaciado por debajo de lo recomendado (${rec.plantCm} cm según ${rec.source})`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  color: '#fbbf24',
                  fontSize: 10,
                  marginLeft: 4,
                }}
              >
                <AlertTriangle size={12} />
                Bajo marco
              </span>
            )}
          </div>
        </>
      )}

      <div style={{ width: 1, height: 16, background: '#334155' }} />

      <button
        type="button"
        onClick={onRotate}
        title="Rotar 90° (Tecla R)"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'transparent',
          border: 'none',
          color: '#f8fafc',
          cursor: 'pointer',
          padding: '2px 6px',
          borderRadius: 4,
        }}
      >
        <RotateCw size={13} />
        Rotar
      </button>

      <button
        type="button"
        onClick={onDuplicate}
        title="Duplicar objeto (Ctrl+D)"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'transparent',
          border: 'none',
          color: '#f8fafc',
          cursor: 'pointer',
          padding: '2px 6px',
          borderRadius: 4,
        }}
      >
        <Copy size={13} />
        Duplicar
      </button>

      <button
        type="button"
        onClick={onDelete}
        title="Eliminar objeto (Supr o Backspace)"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'transparent',
          border: 'none',
          color: '#f87171',
          cursor: 'pointer',
          padding: '2px 6px',
          borderRadius: 4,
        }}
      >
        <Trash2 size={13} />
        Borrar
      </button>

      <div style={{ width: 1, height: 16, background: '#334155' }} />

      <button
        type="button"
        onClick={onDeselect}
        title="Deseleccionar (Esc)"
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: 2,
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
})
ObjectContextBar.displayName = 'ObjectContextBar'
