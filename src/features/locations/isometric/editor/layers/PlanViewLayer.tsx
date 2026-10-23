import React from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import type { GhostObject } from '../editorTypes'
import { OBJECT_CATALOG } from '../../catalog'
import { getObjectBox } from '../collision'

export interface PlanViewLayerProps {
  roomWidthCm: number
  roomDepthCm: number
  placedObjects: PlacedObject[]
  selectedObjectId: string | null
  ghost: GhostObject | null
  drawPreview?: { tool: string; start: { x: number; y: number }; current: { x: number; y: number } } | null
  onSelectObject?: (objectId: string) => void
  onPointerDownOnFloor?: (e: React.PointerEvent<SVGRectElement>) => void
}

export const PlanViewLayer: React.FC<PlanViewLayerProps> = React.memo(({
  roomWidthCm,
  roomDepthCm,
  placedObjects,
  selectedObjectId,
  ghost,
  drawPreview,
  onSelectObject,
  onPointerDownOnFloor,
}) => {
  // Escala en píxeles de pantalla en vista planta: 1 cm = 1.2 px
  const pxPerCm = 1.2
  const planW = roomWidthCm * pxPerCm
  const planH = roomDepthCm * pxPerCm

  const grid50 = 50 * pxPerCm

  return (
    <g data-layer="plan-view">
      {/* Fondo del piso de la sala */}
      <rect
        x={-planW / 2}
        y={-planH / 2}
        width={planW}
        height={planH}
        fill="#f8fafc"
        stroke="#334155"
        strokeWidth="3"
        onPointerDown={onPointerDownOnFloor}
      />

      {/* Grilla ortogonal métrica (50 cm finas, 100 cm principales) */}
      <g opacity="0.45">
        {Array.from({ length: Math.floor(roomWidthCm / 50) + 1 }).map((_, i) => {
          const x = -planW / 2 + i * grid50
          const isMajor = (i * 50) % 100 === 0
          return (
            <line
              key={`grid-x-${i}`}
              x1={x}
              y1={-planH / 2}
              x2={x}
              y2={planH / 2}
              stroke={isMajor ? '#64748b' : '#cbd5e1'}
              strokeWidth={isMajor ? 1.4 : 0.8}
            />
          )
        })}
        {Array.from({ length: Math.floor(roomDepthCm / 50) + 1 }).map((_, i) => {
          const y = -planH / 2 + i * grid50
          const isMajor = (i * 50) % 100 === 0
          return (
            <line
              key={`grid-y-${i}`}
              x1={-planW / 2}
              y1={y}
              x2={planW / 2}
              y2={y}
              stroke={isMajor ? '#64748b' : '#cbd5e1'}
              strokeWidth={isMajor ? 1.4 : 0.8}
            />
          )
        })}
      </g>

      {/* Objetos colocados en planta */}
      {placedObjects.map(obj => {
        const box = getObjectBox(obj)
        const isSelected = obj.id === selectedObjectId
        const def = OBJECT_CATALOG[obj.typeId]

        const objPx = -planW / 2 + box.x * pxPerCm
        const objPy = -planH / 2 + box.y * pxPerCm
        const objPw = box.w * pxPerCm
        const objPh = box.d * pxPerCm

        return (
          <g
            key={obj.id}
            transform={`translate(${objPx}, ${objPy})`}
            onClick={(e) => {
              e.stopPropagation()
              onSelectObject?.(obj.id)
            }}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x="0"
              y="0"
              width={objPw}
              height={objPh}
              rx="3"
              fill={isSelected ? '#e0f2fe' : '#ffffff'}
              stroke={isSelected ? '#0284c7' : '#475569'}
              strokeWidth={isSelected ? 2.5 : 1.4}
            />
            {/* Etiqueta y cota del objeto en planta */}
            <text
              x={objPw / 2}
              y={objPh / 2 - 2}
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="600"
              fill="#1e293b"
            >
              {obj.label || def?.label || obj.typeId}
            </text>
            <text
              x={objPw / 2}
              y={objPh / 2 + 10}
              textAnchor="middle"
              fontSize="8"
              fontFamily="monospace"
              fill="#64748b"
            >
              {box.w}×{box.d} cm
            </text>
          </g>
        )
      })}

      {/* Fantasma en vista planta */}
      {ghost && (
        <g
          transform={`translate(${-planW / 2 + ghost.x * pxPerCm}, ${-planH / 2 + ghost.y * pxPerCm})`}
          style={{ pointerEvents: 'none' }}
        >
          {(() => {
            const def = OBJECT_CATALOG[ghost.typeId]
            const isRotated = ghost.rotation === 90 || ghost.rotation === 270
            const w = isRotated ? (def?.footprint.d ?? 50) : (def?.footprint.w ?? 50)
            const d = isRotated ? (def?.footprint.w ?? 50) : (def?.footprint.d ?? 50)
            const pw = w * pxPerCm
            const ph = d * pxPerCm

            return (
              <>
                <rect
                  x="0"
                  y="0"
                  width={pw}
                  height={ph}
                  rx="3"
                  fill={ghost.isValid ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'}
                  stroke={ghost.isValid ? '#22c55e' : '#ef4444'}
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
                {!ghost.isValid && ghost.reason && (
                  <text
                    x={pw / 2}
                    y={-8}
                    textAnchor="middle"
                    fill="#ef4444"
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {ghost.reason}
                  </text>
                )}
              </>
            )
          })()}
        </g>
      )}

      {/* Trazado interactivo en vista planta */}
      {drawPreview && (
        <g
          transform={`translate(${-planW / 2 + Math.min(drawPreview.start.x, drawPreview.current.x) * pxPerCm}, ${-planH / 2 + Math.min(drawPreview.start.y, drawPreview.current.y) * pxPerCm})`}
          style={{ pointerEvents: 'none' }}
        >
          {(() => {
            const w = Math.max(50, Math.abs(drawPreview.current.x - drawPreview.start.x))
            const d = drawPreview.tool === 'furrow' ? 40 : Math.max(40, Math.abs(drawPreview.current.y - drawPreview.start.y))
            const pw = w * pxPerCm
            const ph = d * pxPerCm
            const count = drawPreview.tool === 'furrow'
              ? Math.max(1, Math.floor(w / 40))
              : Math.max(1, Math.floor(w / 40)) * Math.max(1, Math.floor(d / 40))

            return (
              <>
                <rect
                  x="0"
                  y="0"
                  width={pw}
                  height={ph}
                  rx="3"
                  fill="rgba(56, 189, 248, 0.25)"
                  stroke="#0284c7"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
                <text
                  x={pw / 2}
                  y={ph / 2 + 3}
                  textAnchor="middle"
                  fill="#0369a1"
                  fontSize="9.5"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {drawPreview.tool === 'furrow' ? `${(w / 100).toFixed(1)} m · ${count} plantas` : `${(w / 100).toFixed(1)}×${(d / 100).toFixed(1)} m · ${count} plantas`}
                </text>
              </>
            )
          })()}
        </g>
      )}
    </g>
  )
})
PlanViewLayer.displayName = 'PlanViewLayer'
