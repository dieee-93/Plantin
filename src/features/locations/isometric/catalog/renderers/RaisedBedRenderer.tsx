import React from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { getBoxCorners } from './prismHelper'

export interface RaisedBedRendererProps {
  obj: PlacedObject
  view: 'a' | 'b'
}

export const RaisedBedRenderer: React.FC<RaisedBedRendererProps> = React.memo(({ obj, view }) => {
  const isViewB = view === 'b'
  const rawW = Number(obj.params?.widthCm ?? 200)
  const rawD = Number(obj.params?.depthCm ?? 80)
  const w = isViewB ? rawD : rawW
  const d = isViewB ? rawW : rawD
  const h = 40

  const { p0, pX, pXY, pY, topP0, topPX, topPXY, topPY } = getBoxCorners(w, d, h)

  return (
    <g data-object-id={obj.id} data-object-type={obj.typeId} className="cursor-pointer">
      {/* Sombra base */}
      <polygon
        points={`${p0.x},${p0.y} ${pX.x},${pX.y} ${pXY.x},${pXY.y} ${pY.x},${pY.y}`}
        fill="rgba(15, 23, 42, 0.3)"
      />

      {/* Cara frontal izquierda (madera sombreada) */}
      <polygon
        points={`${pY.x},${pY.y} ${pXY.x},${pXY.y} ${topPXY.x},${topPXY.y} ${topPY.x},${topPY.y}`}
        fill="#78350f"
        stroke="#451a03"
        strokeWidth="1.4"
      />

      {/* Cara frontal derecha (madera iluminada) */}
      <polygon
        points={`${pX.x},${pX.y} ${pXY.x},${pXY.y} ${topPXY.x},${topPXY.y} ${topPX.x},${topPX.y}`}
        fill="#92400e"
        stroke="#451a03"
        strokeWidth="1.4"
      />

      {/* Tablones horizontales simulados */}
      <line
        x1={pY.x}
        y1={(pY.y + topPY.y) / 2}
        x2={pXY.x}
        y2={(pXY.y + topPXY.y) / 2}
        stroke="#451a03"
        strokeWidth="1"
        opacity="0.75"
      />
      <line
        x1={pX.x}
        y1={(pX.y + topPX.y) / 2}
        x2={pXY.x}
        y2={(pXY.y + topPXY.y) / 2}
        stroke="#451a03"
        strokeWidth="1"
        opacity="0.75"
      />

      {/* Esquinero de refuerzo metálico frontal */}
      <line
        x1={pXY.x}
        y1={pXY.y}
        x2={topPXY.x}
        y2={topPXY.y}
        stroke="#1e293b"
        strokeWidth="2.5"
      />

      {/* Reborde superior de madera */}
      <polygon
        points={`${topP0.x},${topP0.y} ${topPX.x},${topPX.y} ${topPXY.x},${topPXY.y} ${topPY.x},${topPY.y}`}
        fill="#b45309"
        stroke="#451a03"
        strokeWidth="1.4"
      />

      {/* Sustrato / tierra orgánica interior */}
      <polygon
        points={`
          ${topP0.x * 0.9 + topPXY.x * 0.1},${topP0.y * 0.9 + topPXY.y * 0.1}
          ${topPX.x * 0.9 + topPY.x * 0.1},${topPX.y * 0.9 + topPY.y * 0.1}
          ${topPXY.x * 0.9 + topP0.x * 0.1},${topPXY.y * 0.9 + topP0.y * 0.1}
          ${topPY.x * 0.9 + topPX.x * 0.1},${topPY.y * 0.9 + topPX.y * 0.1}
        `}
        fill="#451a03"
        stroke="#290e02"
        strokeWidth="1"
      />
    </g>
  )
})
RaisedBedRenderer.displayName = 'RaisedBedRenderer'
