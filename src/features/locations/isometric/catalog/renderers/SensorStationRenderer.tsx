import React from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { getBoxCorners } from './prismHelper'

export interface SensorStationRendererProps {
  obj: PlacedObject
  view: 'a' | 'b'
}

export const SensorStationRenderer: React.FC<SensorStationRendererProps> = React.memo(({ obj, view }) => {
  const isViewB = view === 'b'
  const w = isViewB ? 25 : 25
  const d = isViewB ? 25 : 25
  const totalH = 140

  const { p0, pX, pXY, pY, topPXY } = getBoxCorners(w, d, totalH)
  const { topP0: boxP0, topPX: boxPX, topPXY: boxPXY, topPY: boxPY } = getBoxCorners(w, d, totalH - 35)

  return (
    <g data-object-id={obj.id} data-object-type={obj.typeId} className="cursor-pointer">
      {/* Sombra base */}
      <ellipse
        cx={pXY.x / 2}
        cy={pXY.y / 2}
        rx="14"
        ry="7"
        fill="rgba(15, 23, 42, 0.22)"
      />

      {/* Poste / trípode soporte de aluminio */}
      <line
        x1={pXY.x / 2}
        y1={pXY.y / 2}
        x2={boxPXY.x / 2}
        y2={boxPXY.y / 2}
        stroke="#64748b"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Base triangular de fijación */}
      <line x1={p0.x} y1={p0.y} x2={pXY.x / 2} y2={pXY.y / 2} stroke="#475569" strokeWidth="1.5" />
      <line x1={pX.x} y1={pX.y} x2={pXY.x / 2} y2={pXY.y / 2} stroke="#475569" strokeWidth="1.5" />
      <line x1={pY.x} y1={pY.y} x2={pXY.x / 2} y2={pXY.y / 2} stroke="#334155" strokeWidth="1.5" />

      {/* Caja de sensores estanca superior */}
      <polygon
        points={`
          ${boxP0.x},${boxP0.y}
          ${boxPX.x},${boxPX.y}
          ${topPXY.x},${topPXY.y - 12}
          ${boxPY.x},${boxPY.y}
        `}
        fill="#f8fafc"
        stroke="#475569"
        strokeWidth="1.2"
      />

      {/* Lado frontal de la caja técnica */}
      <polygon
        points={`
          ${boxPY.x},${boxPY.y}
          ${boxPXY.x},${boxPXY.y}
          ${topPXY.x},${topPXY.y}
          ${boxP0.x},${boxP0.y}
        `}
        fill="#e2e8f0"
        stroke="#475569"
        strokeWidth="1.2"
      />

      {/* Pantalla digital / display LCD de telemetría */}
      <rect
        x={boxPXY.x / 2 - 8}
        y={boxPXY.y / 2 - 16}
        width="16"
        height="10"
        rx="2"
        fill="#0f172a"
        stroke="#0284c7"
        strokeWidth="0.8"
      />
      <text
        x={boxPXY.x / 2}
        y={boxPXY.y / 2 - 9}
        textAnchor="middle"
        fill="#38bdf8"
        fontSize="6"
        fontFamily="monospace"
        fontWeight="bold"
      >
        24°C
      </text>

      {/* Antena omnidireccional LoRa / IoT */}
      <line
        x1={topPXY.x / 2}
        y1={topPXY.y - 12}
        x2={topPXY.x / 2}
        y2={topPXY.y - 32}
        stroke="#1e293b"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx={topPXY.x / 2}
        cy={topPXY.y - 32}
        r="2"
        fill="#22c55e"
      />
    </g>
  )
})
SensorStationRenderer.displayName = 'SensorStationRenderer'
