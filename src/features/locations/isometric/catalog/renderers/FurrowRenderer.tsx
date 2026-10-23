import React from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { getBoxCorners } from './prismHelper'

export interface FurrowRendererProps {
  obj: PlacedObject
  view: 'a' | 'b'
}

export const FurrowRenderer: React.FC<FurrowRendererProps> = React.memo(({ obj, view }) => {
  const isViewB = view === 'b'
  const rawL = Number(obj.params?.lengthCm ?? 1000)
  const rawD = 40
  const w = isViewB ? rawD : rawL
  const d = isViewB ? rawL : rawD
  const h = 15

  const { p0, pX, pXY, pY, topP0, topPX, topPXY, topPY } = getBoxCorners(w, d, h)

  return (
    <g data-object-id={obj.id} data-object-type={obj.typeId} className="cursor-pointer">
      {/* Sombra base */}
      <polygon
        points={`${p0.x},${p0.y} ${pX.x},${pX.y} ${pXY.x},${pXY.y} ${pY.x},${pY.y}`}
        fill="rgba(15, 23, 42, 0.2)"
      />

      {/* Camellón de tierra - lateral frontal */}
      <polygon
        points={`${pY.x},${pY.y} ${pXY.x},${pXY.y} ${topPXY.x},${topPXY.y} ${topPY.x},${topPY.y}`}
        fill="#78350f"
        stroke="#451a03"
        strokeWidth="1"
      />
      <polygon
        points={`${pX.x},${pX.y} ${pXY.x},${pXY.y} ${topPXY.x},${topPXY.y} ${topPX.x},${topPX.y}`}
        fill="#92400e"
        stroke="#451a03"
        strokeWidth="1"
      />

      {/* Lomo superior del camellón */}
      <polygon
        points={`${topP0.x},${topP0.y} ${topPX.x},${topPX.y} ${topPXY.x},${topPXY.y} ${topPY.x},${topPY.y}`}
        fill="#b45309"
        stroke="#78350f"
        strokeWidth="1"
      />

      {/* Manguera de goteo negra longitudinal sobre el lomo */}
      <line
        x1={(topP0.x + topPY.x) / 2}
        y1={(topP0.y + topPY.y) / 2}
        x2={(topPX.x + topPXY.x) / 2}
        y2={(topPX.y + topPXY.y) / 2}
        stroke="#1e293b"
        strokeWidth="1.8"
        strokeDasharray="6 3"
      />
    </g>
  )
})
FurrowRenderer.displayName = 'FurrowRenderer'
