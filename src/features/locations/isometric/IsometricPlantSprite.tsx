import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { IndividualStatus } from '@/domain/individual'
import type { Taxon } from '@/domain/taxon'
import type { LocationType } from '@/domain/location'
import type { IsometricLensMode } from './botanicalArchetypes'
import { buildPlantVisualSpec } from './visual/plantSpec'
import { getPlantRenderer, PROCEDURAL_RENDERERS } from './renderers/registry'
import { GenericHerbRenderer } from './renderers/procedural'
import { PlantContainer } from './renderers/procedural/containers'

export interface IsometricPlantSpriteProps {
  individualId?: string
  bbch?: number
  status: IndividualStatus
  label: string
  isSelected?: boolean
  taxon?: Taxon
  locationType?: LocationType
  generation?: string
  lensMode?: IsometricLensMode
  dimmed?: boolean
  forceProcedural?: boolean
}

/**
 * Renderiza un contenedor contextual y una planta procedural 2.5D en SVG
 * estructurada a partir de un PlantVisualSpec determinístico, con variación
 * botánica natural, crecimiento continuo dentro de fase, paleta OKLCH sombreada,
 * balanceo ambiental (.iso-sway) y animaciones de resorte al avanzar de fase BBCH.
 */
export const IsometricPlantSprite: React.FC<IsometricPlantSpriteProps> = React.memo(({
  individualId = 'plant-default',
  bbch,
  status,
  label,
  isSelected = false,
  taxon,
  locationType = 'greenhouse',
  generation,
  lensMode = 'species',
  dimmed = false,
  forceProcedural = false,
}) => {
  const spec = buildPlantVisualSpec({
    individualId,
    taxon,
    bbch,
    status,
    locationType,
  })

  const Renderer = forceProcedural
    ? (PROCEDURAL_RENDERERS[spec.archetype] ?? GenericHerbRenderer)
    : getPlantRenderer(spec)

  // Detección de cambio de fase BBCH para animación de crecimiento (resorte spring ~400ms)
  const prevPhaseRef = useRef<string | null>(null)
  const [phaseTrigger, setPhaseTrigger] = useState(0)

  useEffect(() => {
    if (prevPhaseRef.current !== null && prevPhaseRef.current !== spec.phase) {
      setPhaseTrigger(t => t + 1)
    }
    prevPhaseRef.current = spec.phase
  }, [spec.phase])

  // Crecimiento continuo dentro de la fase fenológica: 0.85 + 0.15 * phaseProgress
  const continuousScale = 0.85 + 0.15 * spec.phaseProgress
  const { heightScale, leanDeg, mirror } = spec.variation

  // Transformación botánica natural pivoteada en la base (0, -7)
  const foliageTransform = [
    'translate(0, -7)',
    mirror ? 'scale(-1, 1)' : '',
    `scale(1, ${heightScale})`,
    `scale(${continuousScale.toFixed(3)})`,
    `rotate(${leanDeg})`,
    'translate(0, 7)',
  ]
    .filter(Boolean)
    .join(' ')

  // Parámetros de balanceo ambiental (.iso-sway)
  const isDead = spec.vitality === 'dead'
  const swayAmp =
    locationType === 'field'
      ? 1.5
      : locationType === 'growth_chamber' || locationType === 'lab'
        ? 0.5
        : 1.0
  const swayDelay = `-${spec.seed % 5000}ms`
  const swayDuration = `${4000 + (spec.seed % 2000)}ms`

  const foliageStyle = (
    isDead
      ? {}
      : {
          '--sway-amp': swayAmp,
          '--sway-delay': swayDelay,
          '--sway-duration': swayDuration,
        }
  ) as React.CSSProperties

  const foliageContent = (
    <Renderer
      spec={spec}
      isSelected={isSelected}
      generation={generation}
      lensMode={lensMode}
    />
  )

  return (
    <g
      data-archetype={spec.archetype}
      data-container={locationType}
      style={{
        opacity: dimmed ? 0.25 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      {/* Halo de selección en la base isométrica con marcha de hormigas (Fase 5) */}
      {isSelected && (
        <polygon
          points="0,-20 38,0 0,20 -38,0"
          fill="rgba(45, 106, 79, 0.22)"
          stroke="#2d6a4f"
          strokeWidth="2"
          strokeDasharray="4 2"
          className="iso-selected-halo"
        />
      )}

      {/* Sombra de contacto suave con gradiente radial compartido */}
      <ellipse cx="0" cy="4" rx="20" ry="10" fill="url(#plant-contact-shadow)" />

      {/* ── CONTENEDOR SEGÚN TIPO DE SALA (LocationType) ── */}
      <PlantContainer locationType={locationType} isSelected={isSelected} />

      {/* ── MORFOLOGÍA BOTÁNICA PROCEDURAL CON VARIACIÓN, BALANCEO AMBIENTAL Y CRECIMIENTO ── */}
      <g
        transform={foliageTransform}
        className={isDead ? undefined : 'iso-sway'}
        style={foliageStyle}
      >
        {phaseTrigger > 0 ? (
          <motion.g
            key={phaseTrigger}
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.4 }}
            style={{ transformOrigin: '0px -7px' }}
          >
            {foliageContent}
          </motion.g>
        ) : (
          foliageContent
        )}
      </g>

      {/* ── Insignias fijas ancladas al contenedor (borde superior derecho, tamaño 12 px) ── */}
      {lensMode === 'genetics' && generation ? (
        <g transform="translate(14, -12)">
          <rect x="-10" y="-6" width="20" height="12" rx="3" fill="#6d28d9" stroke="#ffffff" strokeWidth="0.8" />
          <text
            x="0"
            y="2.5"
            textAnchor="middle"
            fontSize="7"
            fontWeight="700"
            fontFamily="monospace"
            fill="#ffffff"
          >
            {generation.slice(0, 4)}
          </text>
        </g>
      ) : spec.bbch >= 80 && spec.vitality === 'alive' ? (
        <g transform="translate(14, -12)">
          <circle cx="0" cy="0" r="6" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
          <text x="0" y="2.5" textAnchor="middle" fontSize="8" fontWeight="800" fill="#854d0e">
            ★
          </text>
        </g>
      ) : null}

      {/* ── Etiqueta Compacta en la Base con Indicador de Color por Especie ── */}
      <g transform="translate(0, 20)">
        <rect
          x="-30"
          y="-8"
          width="60"
          height="15"
          rx="4"
          fill={isSelected ? '#1b4332' : 'rgba(255, 255, 255, 0.94)'}
          stroke={isSelected ? '#2d6a4f' : '#cbd5e1'}
          strokeWidth="1"
        />
        <circle cx="-23" cy="-0.5" r="3" fill={spec.palette.badgeColor} />
        <text
          x="3"
          y="2.5"
          textAnchor="middle"
          fontSize="8.2"
          fontWeight="700"
          fontFamily="monospace"
          fill={isSelected ? '#ffffff' : '#1e293b'}
        >
          {label ? (label.length > 9 ? label.slice(-8) : label) : ''}
        </text>
      </g>
    </g>
  )
})

IsometricPlantSprite.displayName = 'IsometricPlantSprite'
