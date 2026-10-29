import React from 'react'
import type { PlantRendererProps } from '../types'
import { getRasterSprite, getRasterSpriteMeta } from './manifest'
import { PROCEDURAL_RENDERERS } from '../procedural'
import { GenericHerbRenderer } from '../procedural/GenericHerbRenderer'
import { PlantContainer } from '../procedural/containers'

export interface RasterPlantProps extends PlantRendererProps {
  /** Si es true, dibuja también el contenedor procedural (para uso aislado fuera de IsometricPlantSprite) */
  withContainer?: boolean
  /** Nivel de sustrato/tierra si la maceta es raster */
  soilY?: number
}

/**
 * Renderer híbrido de planta: proyecta un sprite raster de alta calidad en WebP
 * alineado a la base geométrica (0, -7 o soilY) con fallback transparente al renderer procedural.
 */
export const RasterPlant: React.FC<RasterPlantProps> = ({
  spec,
  isSelected,
  generation,
  lensMode,
  withContainer = false,
  soilY,
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

  const meta = getRasterSpriteMeta(spec.cropCode, spec.phase, spec.vitality)
  const width = meta?.width ?? 80
  const height = meta?.height ?? 100
  const baseY = soilY !== undefined ? soilY : -7
  const x = meta?.anchorX ?? -width / 2
  const y = meta?.anchorY !== undefined && soilY === undefined
    ? meta.anchorY
    : baseY - height

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
      data-base-y={baseY}
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
