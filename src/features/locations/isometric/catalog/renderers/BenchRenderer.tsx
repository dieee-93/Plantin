import React from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { getBoxCorners } from './prismHelper'

export interface BenchRendererProps {
  obj: PlacedObject
  view: 'a' | 'b'
}

export const BenchRenderer: React.FC<BenchRendererProps> = React.memo(({ obj, view }) => {
  const isViewB = view === 'b'
  const rawW = Number(obj.params?.widthCm ?? 120)
  const rawD = Number(obj.params?.depthCm ?? 60)
  const w = isViewB ? rawD : rawW
  const d = isViewB ? rawW : rawD
  const h = 80

  const { p0, pX, pXY, pY, topP0, topPX, topPXY, topPY } = getBoxCorners(w, d, h)

  return (
    <g data-object-id={obj.id} data-object-type={obj.typeId} className="cursor-pointer">
      {/* Sombra en el piso de las patas y estructura */}
      <polygon
        points={`${p0.x},${p0.y} ${pX.x},${pX.y} ${pXY.x},${pXY.y} ${pY.x},${pY.y}`}
        fill="rgba(15, 23, 42, 0.15)"
      />

      {/* 4 patas metálicas de la mesada */}
      {/* Pata trasera P0 */}
      <line x1={p0.x} y1={p0.y} x2={topP0.x} y2={topP0.y} stroke="#475569" strokeWidth="3" />
      {/* Pata lateral PX */}
      <line x1={pX.x} y1={pX.y} x2={topPX.x} y2={topPX.y} stroke="#475569" strokeWidth="3" />
      {/* Pata lateral PY */}
      <line x1={pY.x} y1={pY.y} x2={topPY.x} y2={topPY.y} stroke="#334155" strokeWidth="3" />
      {/* Pata frontal PXY */}
      <line x1={pXY.x} y1={pXY.y} x2={topPXY.x} y2={topPXY.y} stroke="#1e293b" strokeWidth="3.5" />

      {/* Travesaños inferiores de refuerzo a media altura */}
      <line
        x1={(pY.x + topPY.x) * 0.25}
        y1={(pY.y + topPY.y) * 0.25}
        x2={(pXY.x + topPXY.x) * 0.25}
        y2={(pXY.y + topPXY.y) * 0.25}
        stroke="#475569"
        strokeWidth="2"
      />
      <line
        x1={(pX.x + topPX.x) * 0.25}
        y1={(pX.y + topPX.y) * 0.25}
        x2={(pXY.x + topPXY.x) * 0.25}
        y2={(pXY.y + topPXY.y) * 0.25}
        stroke="#475569"
        strokeWidth="2"
      />

      {/* Faldón perimetral superior del tablero */}
      <polygon
        points={`
          ${topPY.x},${topPY.y}
          ${topPXY.x},${topPXY.y}
          ${topPXY.x},${topPXY.y + 6}
          ${topPY.x},${topPY.y + 6}
        `}
        fill="#475569"
        stroke="#334155"
        strokeWidth="1"
      />
      <polygon
        points={`
          ${topPX.x},${topPX.y}
          ${topPXY.x},${topPXY.y}
          ${topPXY.x},${topPXY.y + 6}
          ${topPX.x},${topPX.y + 6}
        `}
        fill="#64748b"
        stroke="#334155"
        strokeWidth="1"
      />

      {/* Tablero superior de rejilla galvanizada */}
      <polygon
        points={`${topP0.x},${topP0.y} ${topPX.x},${topPX.y} ${topPXY.x},${topPXY.y} ${topPY.x},${topPY.y}`}
        fill="#cbd5e1"
        stroke="#475569"
        strokeWidth="1.5"
      />

      {/* Patrón de rejilla técnica metálica */}
      <line
        x1={(topP0.x + topPX.x) / 2}
        y1={(topP0.y + topPX.y) / 2}
        x2={(topPY.x + topPXY.x) / 2}
        y2={(topPY.y + topPXY.y) / 2}
        stroke="#94a3b8"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <line
        x1={(topP0.x + topPY.x) / 2}
        y1={(topP0.y + topPY.y) / 2}
        x2={(topPX.x + topPXY.x) / 2}
        y2={(topPX.y + topPXY.y) / 2}
        stroke="#94a3b8"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
    </g>
  )
})
BenchRenderer.displayName = 'BenchRenderer'
