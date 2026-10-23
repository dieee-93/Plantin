import React from 'react'
import type { FacilityLocation } from '@/domain/location'
import type { SeedLot } from '@/domain/seedLot'
import { halfW, halfH, wallHeight, roomCorners } from '../geometry/iso'

export interface SceneryLayerProps {
  location: FacilityLocation
  rows: number
  cols: number
  wallColors: {
    leftWall: string
    rightWall: string
    topCap: string
    sideCap: string
    wallStroke: string
    baseboard: string
  }
  roomSeedLots: SeedLot[]
  onNavigateSeedLot?: (seedLotId: string) => void
}

export const SceneryLayer: React.FC<SceneryLayerProps> = React.memo(({
  location,
  rows,
  cols,
  wallColors,
  roomSeedLots,
  onNavigateSeedLot,
}) => {
  const { topCorner, rightCorner, bottomCorner, leftCorner } = roomCorners(rows, cols)
  // Nombre formal en mayúsculas respetando locale 'es' para la letra Ñ (V6)
  const locationDisplayName = (location.name || '').toLocaleUpperCase('es')

  if (location.type === 'field') {
    return (
      <g data-layer="scenery">
        {/* CAMPO ABIERTO / PARCELA: Sin paredes cerradas; Cerco perimetral de postes de madera y alambre */}
        <g data-scenery="open-field-fence">
          {/* Franja de pasto exterior alrededor de la parcela */}
          <polygon
            points={`
              ${topCorner.x},${topCorner.y - 10}
              ${rightCorner.x + 14},${rightCorner.y}
              ${bottomCorner.x},${bottomCorner.y + 10}
              ${leftCorner.x - 14},${leftCorner.y}
            `}
            fill="#4ade80"
            opacity="0.45"
          />

          {/* Alambres perimetrales traseros */}
          <line
            x1={leftCorner.x}
            y1={leftCorner.y - 26}
            x2={topCorner.x}
            y2={topCorner.y - 26}
            stroke="#92400e"
            strokeWidth="1.5"
            strokeDasharray="6 3"
          />
          <line
            x1={leftCorner.x}
            y1={leftCorner.y - 14}
            x2={topCorner.x}
            y2={topCorner.y - 14}
            stroke="#92400e"
            strokeWidth="1.5"
          />
          <line
            x1={topCorner.x}
            y1={topCorner.y - 26}
            x2={rightCorner.x}
            y2={rightCorner.y - 26}
            stroke="#78350f"
            strokeWidth="1.5"
            strokeDasharray="6 3"
          />
          <line
            x1={topCorner.x}
            y1={topCorner.y - 14}
            x2={rightCorner.x}
            y2={rightCorner.y - 14}
            stroke="#78350f"
            strokeWidth="1.5"
          />

          {/* Postes de quebracho 3D a lo largo del borde izquierdo */}
          {Array.from({ length: rows + 1 }).map((_, idx) => {
            const px = -idx * halfW
            const py = idx * halfH
            return (
              <g key={`post-l-${idx}`}>
                <rect x={px - 3.5} y={py - 36} width="7" height="36" rx="1.5" fill="#78350f" stroke="#451a03" strokeWidth="1" />
                <ellipse cx={px} cy={py - 36} rx="3.5" ry="1.8" fill="#d97706" />
              </g>
            )
          })}

          {/* Postes de quebracho 3D a lo largo del borde derecho */}
          {Array.from({ length: cols + 1 }).map((_, idx) => {
            const px = idx * halfW
            const py = idx * halfH
            return (
              <g key={`post-r-${idx}`}>
                <rect x={px - 3.5} y={py - 36} width="7" height="36" rx="1.5" fill="#78350f" stroke="#451a03" strokeWidth="1" />
                <ellipse cx={px} cy={py - 36} rx="3.5" ry="1.8" fill="#d97706" />
              </g>
            )
          })}

          {/* Cartel de madera de la parcela */}
          <g transform={`translate(${rightCorner.x * 0.5}, ${rightCorner.y * 0.5 - 48})`}>
            <rect x="-62" y="-15" width="124" height="24" rx="4" fill="#fef3c7" stroke="#92400e" strokeWidth="1.8" />
            <text x="0" y="1" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" fill="#78350f">
              {locationDisplayName}
            </text>
          </g>
        </g>

        {/* Mangueras de riego por goteo (D1 resuelto: negro polietileno #1e293b, opacidad ~0.45) */}
        <g data-scenery="field-ridges">
          {Array.from({ length: rows }).map((_, r) => {
            const startX = (0 - r) * halfW
            const startY = (0 + r + 1) * halfH
            const endX = (cols - 1 - r) * halfW
            const endY = (cols - 1 + r + 1) * halfH
            return (
              <line
                key={`drip-${r}`}
                x1={startX}
                y1={startY + 2}
                x2={endX}
                y2={endY + 2}
                stroke="#1e293b"
                strokeWidth="1.6"
                strokeDasharray="4 3"
                opacity="0.45"
              />
            )
          })}
        </g>
      </g>
    )
  }

  return (
    <g data-layer="scenery">
      {/* ESTRUCTURAS CON MUROS 3D EXTRUIDOS (Invernadero, Cámara LED, Sala, Laboratorio, Bancada) */}
      <g data-scenery={`cutaway-${location.type}`} data-wall-volume="3d">
        {/* Cara interior Pared Izquierda */}
        <polygon
          points={`
            ${leftCorner.x},${leftCorner.y}
            ${topCorner.x},${topCorner.y}
            ${topCorner.x},${topCorner.y - wallHeight}
            ${leftCorner.x},${leftCorner.y - wallHeight}
          `}
          fill={wallColors.leftWall}
          stroke={wallColors.wallStroke}
          strokeWidth="1.8"
        />

        {/* Cara interior Pared Derecha */}
        <polygon
          points={`
            ${topCorner.x},${topCorner.y}
            ${rightCorner.x},${rightCorner.y}
            ${rightCorner.x},${rightCorner.y - wallHeight}
            ${topCorner.x},${topCorner.y - wallHeight}
          `}
          fill={wallColors.rightWall}
          stroke={wallColors.wallStroke}
          strokeWidth="1.8"
        />

        {/* ── Espesor 3D Superior de los Muros (Wall Top Caps) ── */}
        <polygon
          points={`
            ${leftCorner.x},${leftCorner.y - wallHeight}
            ${topCorner.x},${topCorner.y - wallHeight}
            ${topCorner.x},${topCorner.y - wallHeight - 9}
            ${leftCorner.x - 10},${leftCorner.y - wallHeight - 4}
          `}
          fill={wallColors.topCap}
          stroke={wallColors.wallStroke}
          strokeWidth="1.2"
        />
        <polygon
          points={`
            ${topCorner.x},${topCorner.y - wallHeight}
            ${rightCorner.x},${rightCorner.y - wallHeight}
            ${rightCorner.x + 10},${rightCorner.y - wallHeight - 4}
            ${topCorner.x},${topCorner.y - wallHeight - 9}
          `}
          fill={wallColors.topCap}
          stroke={wallColors.wallStroke}
          strokeWidth="1.2"
        />

        {/* ── Pilares 3D de Corte en los Extremos de los Muros ── */}
        <polygon
          points={`
            ${leftCorner.x - 10},${leftCorner.y - wallHeight - 4}
            ${leftCorner.x},${leftCorner.y - wallHeight}
            ${leftCorner.x},${leftCorner.y + 16}
            ${leftCorner.x - 10},${leftCorner.y + 11}
          `}
          fill={wallColors.sideCap}
          stroke={wallColors.wallStroke}
          strokeWidth="1.2"
        />
        <polygon
          points={`
            ${rightCorner.x},${rightCorner.y - wallHeight}
            ${rightCorner.x + 10},${rightCorner.y - wallHeight - 4}
            ${rightCorner.x + 10},${rightCorner.y + 11}
            ${rightCorner.x},${rightCorner.y + 16}
          `}
          fill={wallColors.sideCap}
          stroke={wallColors.wallStroke}
          strokeWidth="1.2"
        />

        {/* ── Zócalo Interior Arquitectónico ── */}
        <line
          x1={leftCorner.x}
          y1={leftCorner.y - 3}
          x2={topCorner.x}
          y2={topCorner.y - 3}
          stroke={wallColors.baseboard}
          strokeWidth="5"
        />
        <line
          x1={topCorner.x}
          y1={topCorner.y - 3}
          x2={rightCorner.x}
          y2={rightCorner.y - 3}
          stroke={wallColors.baseboard}
          strokeWidth="5"
        />

        {/* ── Equipamiento Específico según Tipo de Instalación ── */}
        {location.type === 'greenhouse' && (
          <g data-room-fixture="greenhouse-equipment">
            {/* Montantes estructurales de aluminio y reflejos diagonales */}
            {Array.from({ length: rows }).map((_, rIdx) => {
              const mx = -(rIdx + 0.5) * halfW
              const my = (rIdx + 0.5) * halfH
              return (
                <g key={`gh-l-${rIdx}`}>
                  <line x1={mx} y1={my} x2={mx} y2={my - wallHeight} stroke="#0284c7" strokeWidth="1.6" />
                  <line x1={mx - 8} y1={my - 28} x2={mx + 6} y2={my - 48} stroke="rgba(255,255,255,0.75)" strokeWidth="2.2" strokeLinecap="round" />
                </g>
              )
            })}
            {Array.from({ length: cols }).map((_, cIdx) => {
              const mx = (cIdx + 0.5) * halfW
              const my = (cIdx + 0.5) * halfH
              return (
                <line key={`gh-r-${cIdx}`} x1={mx} y1={my} x2={mx} y2={my - wallHeight} stroke="#0284c7" strokeWidth="1.6" />
              )
            })}
            {/* Tanque hidropónico / riego montado alto en el muro de fondo (V8: no tapado por plantas de fila 0) */}
            <g transform="translate(0, -48)">
              <ellipse cx="0" cy="8" rx="14" ry="7" fill="#0369a1" />
              <rect x="-14" y="-22" width="28" height="30" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
              <ellipse cx="0" cy="-22" rx="14" ry="7" fill="#38bdf8" stroke="#0369a1" strokeWidth="1.2" />
              <text x="0" y="-4" textAnchor="middle" fontSize="6.5" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" fontWeight="700" fill="#ffffff">
                H2O
              </text>
            </g>
          </g>
        )}

        {location.type === 'growth_chamber' && (
          <g data-room-fixture="growth_chamber-equipment" data-scenery="led-array">
            {/* Haz de luz magenta/violeta proyectado desde el techo */}
            <polygon
              points={`
                ${topCorner.x},${topCorner.y - wallHeight + 12}
                ${rightCorner.x * 0.85},${rightCorner.y * 0.85 - wallHeight + 12}
                ${bottomCorner.x * 0.85},${bottomCorner.y * 0.85}
                ${leftCorner.x * 0.85},${leftCorner.y * 0.85 - wallHeight + 12}
              `}
              fill="rgba(217, 70, 239, 0.12)"
            />
            {/* Luminaria LED 3D suspendida con barras de diodos */}
            <polygon
              points={`
                0,${-wallHeight + 8}
                ${cols * halfW * 0.58},${cols * halfH * 0.58 - wallHeight + 8}
                ${(cols - rows) * halfW * 0.58},${(cols + rows) * halfH * 0.58 - wallHeight + 8}
                ${-rows * halfW * 0.58},${rows * halfH * 0.58 - wallHeight + 8}
              `}
              fill="rgba(232, 121, 249, 0.42)"
              stroke="#f0abfc"
              strokeWidth="2"
            />
            {/* Display digital de clima en pared izquierda elevado */}
            <g transform={`translate(${leftCorner.x * 0.48}, ${leftCorner.y * 0.48 - wallHeight * 0.58})`}>
              <rect x="-40" y="-12" width="80" height="22" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.4" />
              <text x="0" y="2" textAnchor="middle" fontSize="8.5" fontFamily="monospace" fontWeight="700" fill="#4ade80">
                24°C · PAR 680
              </text>
            </g>
          </g>
        )}

        {(location.type === 'room' || location.type === 'lab' || location.type === 'bench') && (
          <g data-room-fixture={`${location.type}-equipment`}>
            {/* Ventana / Panel de ventilación con marco 3D en muro izquierdo */}
            <g transform={`translate(${leftCorner.x * 0.36}, ${leftCorner.y * 0.36 - wallHeight * 0.58}) skewY(-26.5)`}>
              <rect x="-26" y="-16" width="52" height="32" rx="3" fill="#e0f2fe" stroke="#475569" strokeWidth="2" />
              <line x1="0" y1="-16" x2="0" y2="16" stroke="#64748b" strokeWidth="1.5" />
              <line x1="-26" y1="0" x2="26" y2="0" stroke="#64748b" strokeWidth="1.5" />
              <line x1="-18" y1="-10" x2="-8" y2="8" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Tanque de riego / Estación hidrométrica en muro norte elevado */}
            <g transform="translate(0, -42)">
              <ellipse cx="0" cy="6" rx="12" ry="6" fill="#334155" />
              <rect x="-12" y="-18" width="24" height="24" fill="#475569" stroke="#1e293b" strokeWidth="1" />
              <ellipse cx="0" cy="-18" rx="12" ry="6" fill="#94a3b8" stroke="#1e293b" strokeWidth="1" />
              <circle cx="0" cy="-6" r="4" fill="#f8fafc" stroke="#0284c7" strokeWidth="1" />
            </g>

            {/* Puerta técnica de acceso en muro derecho */}
            <g transform={`translate(${rightCorner.x * 0.78}, ${rightCorner.y * 0.78 - 30}) skewY(26.5)`}>
              <rect x="-15" y="-26" width="30" height="52" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1.8" />
              <rect x="-10" y="-20" width="20" height="16" rx="1.5" fill="#bae6fd" stroke="#64748b" strokeWidth="1" />
              <circle cx="9" cy="4" r="2" fill="#1e293b" />
            </g>
          </g>
        )}

        {/* Estantería Isométrica de Lotes de Semillas (SeedLots almacenados en esta sala) */}
        {roomSeedLots.length > 0 && (
          <g
            data-scenery="seed-vault-shelf"
            transform={`translate(${leftCorner.x * 0.68}, ${leftCorner.y * 0.68 - wallHeight * 0.52})`}
          >
            <rect
              x="-46"
              y="-16"
              width="92"
              height="32"
              rx="4"
              fill="rgba(255, 255, 255, 0.94)"
              stroke="#7c3aed"
              strokeWidth="1.4"
            />
            <text x="0" y="-5" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fontWeight="700" fill="#5b21b6">
              LOTES EN SALA ({roomSeedLots.length})
            </text>
            {roomSeedLots.slice(0, 3).map((lot, idx) => (
              <g
                key={lot.id}
                transform={`translate(${-26 + idx * 26}, 5)`}
                style={{ cursor: 'pointer' }}
                onClick={() => onNavigateSeedLot?.(lot.id)}
              >
                <rect x="-11" y="-5" width="22" height="11" rx="2" fill="#ede9fe" stroke="#7c3aed" strokeWidth="0.9" />
                <text x="0" y="3" textAnchor="middle" fontSize="6.5" fontFamily="monospace" fontWeight="700" fill="#4c1d95">
                  {lot.lotCode.slice(-4)}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* Placa arquitectónica en el muro derecho con locale 'es' para soporte de Ñ */}
        <g transform={`translate(${rightCorner.x * 0.42}, ${rightCorner.y * 0.42 - wallHeight * 0.56}) skewY(26.5)`}>
          <rect
            x="-64"
            y="-13"
            width="128"
            height="22"
            rx="4"
            fill={location.type === 'growth_chamber' ? '#1e1b4b' : 'rgba(255,255,255,0.88)'}
            stroke={wallColors.wallStroke}
            strokeWidth="1.4"
          />
          <text
            x="0"
            y="2"
            textAnchor="middle"
            fontSize="10.5"
            fontWeight="800"
            fontFamily="monospace"
            fill={location.type === 'growth_chamber' ? '#f0abfc' : '#1e293b'}
          >
            {locationDisplayName}
          </text>
        </g>
      </g>
    </g>
  )
})
SceneryLayer.displayName = 'SceneryLayer'
