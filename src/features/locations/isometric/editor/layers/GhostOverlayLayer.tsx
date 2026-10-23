import React from 'react'
import type { GhostObject } from '../editorTypes'
import { OBJECT_CATALOG } from '../../catalog'
import { projectWorld } from '../../geometry/iso'
import { getBoxCorners } from '../../catalog/renderers/prismHelper'

export interface DrawPreviewData {
  tool: string
  start: { x: number; y: number }
  current: { x: number; y: number }
}

export interface GhostOverlayLayerProps {
  ghost: GhostObject | null
  drawPreview?: DrawPreviewData | null
}

export const GhostOverlayLayer: React.FC<GhostOverlayLayerProps> = React.memo(({ ghost, drawPreview }) => {
  if (!ghost && !drawPreview) return null

  if (drawPreview) {
    const minX = Math.min(drawPreview.start.x, drawPreview.current.x)
    const minY = Math.min(drawPreview.start.y, drawPreview.current.y)
    const w = Math.max(50, Math.abs(drawPreview.current.x - drawPreview.start.x))
    const d = drawPreview.tool === 'furrow' ? 40 : Math.max(40, Math.abs(drawPreview.current.y - drawPreview.start.y))
    const pos = projectWorld({ x: minX, y: minY, z: 0 })
    const { p0, pX, pXY, pY } = getBoxCorners(w, d, 20)

    const count = drawPreview.tool === 'furrow'
      ? Math.max(1, Math.floor(w / 40))
      : Math.max(1, Math.floor(w / 40)) * Math.max(1, Math.floor(d / 40))
    const label = drawPreview.tool === 'furrow'
      ? `${(w / 100).toFixed(1)} m · ${count} plantas (40 cm)`
      : `${(w / 100).toFixed(1)}×${(d / 100).toFixed(1)} m · ${count} plantas`

    return (
      <g data-layer="draw-preview" style={{ pointerEvents: 'none' }}>
        <g transform={`translate(${pos.x}, ${pos.y})`}>
          <polygon
            points={`${p0.x},${p0.y} ${pX.x},${pX.y} ${pXY.x},${pXY.y} ${pY.y ? `${pY.x},${pY.y}` : ''}`}
            fill="rgba(56, 189, 248, 0.25)"
            stroke="#0284c7"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          {/* Badge con cotas en vivo y contador de plantas */}
          <g transform={`translate(${pXY.x / 2}, ${pXY.y / 2 - 20})`}>
            <rect
              x="-65"
              y="-12"
              width="130"
              height="22"
              rx="4"
              fill="#0f172a"
              stroke="#0284c7"
              strokeWidth="1.2"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill="#38bdf8"
              fontSize="10"
              fontWeight="700"
              fontFamily="monospace"
            >
              {label}
            </text>
          </g>
        </g>
      </g>
    )
  }

  if (!ghost) return null

  const def = OBJECT_CATALOG[ghost.typeId]
  if (!def) return null

  const baseW = def.footprint.w
  const baseD = def.footprint.d
  const baseH = def.footprint.h

  const isRotated90or270 = ghost.rotation === 90 || ghost.rotation === 270
  const w = isRotated90or270 ? baseD : baseW
  const d = isRotated90or270 ? baseW : baseD

  const pos = projectWorld({ x: ghost.x, y: ghost.y, z: ghost.z })
  const view = isRotated90or270 ? 'b' : 'a'
  const isFlipped = ghost.rotation === 180 || ghost.rotation === 270

  const { p0, pX, pXY, pY } = getBoxCorners(w, d, baseH)

  const strokeColor = ghost.isValid ? '#22c55e' : '#ef4444'
  const fillColor = ghost.isValid ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'

  return (
    <g data-layer="ghost-overlay" style={{ pointerEvents: 'none' }}>
      <g transform={`translate(${pos.x}, ${pos.y})`}>
        {/* Huella en el piso del fantasma */}
        <polygon
          points={`${p0.x},${p0.y} ${pX.x},${pX.y} ${pXY.x},${pXY.y} ${pY.x},${pY.y}`}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2"
          strokeDasharray="4 3"
        />

        {/* Modelo fantasma renderizado con opacidad */}
        {def.Renderer && (
          <g opacity="0.65" transform={isFlipped ? 'scale(-1, 1)' : undefined}>
            <def.Renderer obj={{ id: 'ghost', typeId: ghost.typeId, x: ghost.x, y: ghost.y, z: ghost.z, rotation: ghost.rotation }} view={view} />
          </g>
        )}

        {/* Tooltip de error si no es válido */}
        {!ghost.isValid && ghost.reason && (
          <g transform="translate(0, -50)">
            <rect
              x="-80"
              y="-12"
              width="160"
              height="24"
              rx="4"
              fill="#ef4444"
              stroke="#991b1b"
              strokeWidth="1.2"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="10"
              fontWeight="700"
              fontFamily="monospace"
            >
              {ghost.reason}
            </text>
          </g>
        )}
      </g>
    </g>
  )
})
GhostOverlayLayer.displayName = 'GhostOverlayLayer'
