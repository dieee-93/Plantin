import React from 'react'
import type { FacilityLocation } from '@/domain/location'
import { halfW, halfH, roomCorners } from '../geometry/iso'

export interface FloorLayerProps {
  rows: number
  cols: number
  locationType: FacilityLocation['type']
  wallColors: {
    floor: string
    floorSideLeft: string
    floorSideRight: string
    wallStroke: string
  }
}

export const FloorLayer: React.FC<FloorLayerProps> = React.memo(({
  rows,
  cols,
  locationType,
  wallColors,
}) => {
  const { topCorner, rightCorner, bottomCorner, leftCorner } = roomCorners(rows, cols)

  return (
    <g data-layer="floor">
      {/* Sombra exterior proyectada bajo el diorama */}
      <polygon
        points={`
          ${topCorner.x},${topCorner.y + 18}
          ${rightCorner.x + 12},${rightCorner.y + 24}
          ${bottomCorner.x},${bottomCorner.y + 30}
          ${leftCorner.x - 12},${leftCorner.y + 24}
        `}
        fill="rgba(15, 23, 42, 0.14)"
      />

      {/* Patas metálicas si es Bancada/Mesa */}
      {locationType === 'bench' && (
        <g data-scenery="bench-legs">
          <rect x={leftCorner.x} y={leftCorner.y + 12} width="8" height="36" fill="#475569" />
          <rect x={bottomCorner.x - 4} y={bottomCorner.y + 12} width="8" height="36" fill="#334155" />
          <rect x={rightCorner.x - 8} y={rightCorner.y + 12} width="8" height="36" fill="#475569" />
        </g>
      )}

      {/* Espesor 3D de la Losa del Piso (lado izquierdo y derecho) */}
      <polygon
        points={`
          ${leftCorner.x},${leftCorner.y}
          ${bottomCorner.x},${bottomCorner.y}
          ${bottomCorner.x},${bottomCorner.y + 16}
          ${leftCorner.x},${leftCorner.y + 16}
        `}
        fill={wallColors.floorSideLeft}
      />
      <polygon
        points={`
          ${rightCorner.x},${rightCorner.y}
          ${bottomCorner.x},${bottomCorner.y}
          ${bottomCorner.x},${bottomCorner.y + 16}
          ${rightCorner.x},${rightCorner.y + 16}
        `}
        fill={wallColors.floorSideRight}
      />

      {/* Superficie principal del piso isométrico */}
      <polygon
        points={`
          ${topCorner.x},${topCorner.y}
          ${rightCorner.x},${rightCorner.y}
          ${bottomCorner.x},${bottomCorner.y}
          ${leftCorner.x},${leftCorner.y}
        `}
        fill={wallColors.floor}
        stroke={wallColors.wallStroke}
        strokeWidth="1.8"
      />

      {/* Camellones base de tierra continua si es Campo Abierto (field) */}
      {locationType === 'field' && (
        <g data-scenery="field-ridges-soil">
          {Array.from({ length: rows }).map((_, r) => {
            const startX = (0 - r) * halfW
            const startY = (0 + r + 1) * halfH
            const endX = (cols - 1 - r) * halfW
            const endY = (cols - 1 + r + 1) * halfH
            return (
              <g key={`ridge-soil-${r}`}>
                <line
                  x1={startX}
                  y1={startY + 2}
                  x2={endX}
                  y2={endY + 2}
                  stroke="#3e1f08"
                  strokeWidth="26"
                  strokeLinecap="round"
                />
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="#78350f"
                  strokeWidth="20"
                  strokeLinecap="round"
                />
              </g>
            )
          })}
        </g>
      )}
    </g>
  )
})
FloorLayer.displayName = 'FloorLayer'
