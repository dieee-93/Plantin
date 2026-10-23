import React from 'react'
import type { PlantRendererProps } from '../types'
import { getRasterSprite } from './manifest'
import { PROCEDURAL_RENDERERS } from '../procedural'
import { GenericHerbRenderer } from '../procedural/GenericHerbRenderer'
import { PlantContainer } from '../procedural/containers'

export interface RasterPlantProps extends PlantRendererProps {
  /** Si es true, dibuja también el contenedor procedural (para uso aislado fuera de IsometricPlantSprite) */
  withContainer?: boolean
}

/**
 * Renderer híbrido de planta: proyecta un sprite raster de alta calidad en WebP
 * alineado a la base geométrica (0, -7) con fallback transparente al renderer procedural.
 */
export const RasterPlant: React.FC<RasterPlantProps> = ({
  spec,
  isSelected,
  generation,
  lensMode,
  withContainer = false,
}) => {
  const spriteUrl = getRasterSprite(spec.cropCode, spec.phase, spec.vitality)

  // Fallback transparente al renderer procedural si no existe asset raster para el taxón o fase
  if (!spriteUrl) {
    const ProceduralRenderer = PROCEDURAL_RENDERERS[spec.archetype] ?? GenericHerbRenderer
    return (
      <ProceduralRenderer
        spec={spec}
        isSelected={isSelected}
        generation={generation}
        lensMode={lensMode}
      />
    )
  }

  // Dimensiones 1x para asset 2x (160×200 px -> 80×100 px)
  // Anclado a la base geométrica botánica: x centrado en 0, base inferior en y = -7
  const width = 80
  const height = 100
  const x = -width / 2
  const y = -7 - height

  // Estilo de vitalidad en caso de no tener asset dedicado de 'dead'/'harvested'
  const filterStyle =
    spec.vitality === 'dead'
      ? { filter: 'grayscale(0.85) sepia(0.35) brightness(0.85)' }
      : spec.vitality === 'harvested'
        ? { filter: 'grayscale(0.4) sepia(0.2) opacity(0.8)' }
        : undefined

  return (
    <g
      data-renderer="raster-plant"
      data-crop={spec.cropCode}
      data-phase={spec.phase}
      data-vitality={spec.vitality}
    >
      {withContainer && (
        <PlantContainer locationType={spec.container} isSelected={isSelected} />
      )}
      <image
        href={spriteUrl}
        x={x}
        y={y}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMax meet"
        style={filterStyle}
      />
    </g>
  )
}
