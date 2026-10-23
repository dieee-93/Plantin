import React from 'react'
import type { IsometricLensMode } from '../botanicalArchetypes'

export interface PedigreeLink {
  id: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  role: 'Madre' | 'Padre'
}

export interface OverlayLayerProps {
  pedigreeLinks: PedigreeLink[]
  lensMode: IsometricLensMode
  selectedIndividualId: string | null
}

export const OverlayLayer: React.FC<OverlayLayerProps> = React.memo(({
  pedigreeLinks,
}) => {
  if (pedigreeLinks.length === 0) return null

  return (
    <g data-layer="overlay" style={{ pointerEvents: 'none' }}>
      {/* ── Arcos 2.5D de Parentesco (Lente Genético / Pedigrí In-Situ) ── */}
      {pedigreeLinks.map(link => {
        const midX = (link.fromX + link.toX) / 2
        const midY = Math.min(link.fromY, link.toY) - 42
        const isMother = link.role === 'Madre'

        return (
          <g key={link.id} data-pedigree-link={link.role} opacity="0.85">
            <path
              d={`M ${link.fromX},${link.fromY} Q ${midX},${midY} ${link.toX},${link.toY}`}
              fill="none"
              stroke={isMother ? '#db2777' : '#2563eb'}
              strokeWidth="1.8"
              strokeDasharray="5 3"
            />
            <circle
              cx={midX}
              cy={midY + 10}
              r="10"
              fill="#ffffff"
              stroke={isMother ? '#db2777' : '#2563eb'}
              strokeWidth="1.2"
            />
            <text
              x={midX}
              y={midY + 13}
              textAnchor="middle"
              fontSize="7.5"
              fontWeight="800"
              fontFamily="monospace"
              fill={isMother ? '#be185d' : '#1d4ed8'}
            >
              {isMother ? '♀M' : '♂P'}
            </text>
          </g>
        )
      })}
    </g>
  )
})
OverlayLayer.displayName = 'OverlayLayer'
