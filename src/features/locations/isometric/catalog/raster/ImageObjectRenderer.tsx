import React from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { RASTER_OBJECTS } from './manifest.generated'

export interface ImageObjectRendererProps {
  obj: PlacedObject
  view: 'a' | 'b'
}

/**
 * Renderer raster para objetos del catálogo con sprite ilustrado WebP.
 * Proyecta la imagen con anclaje al vértice frontal o centro de huella,
 * respetando el reflejo horizontal para view 'b' si mirrorForViewB está activo.
 */
export const ImageObjectRenderer: React.FC<ImageObjectRendererProps> = React.memo(({ obj, view }) => {
  const meta = RASTER_OBJECTS[obj.typeId]
  if (!meta) return null

  const isViewB = view === 'b'
  const shouldMirror = isViewB && meta.mirrorForViewB

  return (
    <g
      data-object-id={obj.id}
      data-object-type={obj.typeId}
      data-renderer="raster-object"
      className="cursor-pointer"
      transform={shouldMirror ? 'scale(-1, 1)' : undefined}
    >
      <image
        href={meta.href}
        x={meta.anchorX}
        y={meta.anchorY}
        width={meta.width}
        height={meta.height}
        preserveAspectRatio="xMidYMid meet"
      />
    </g>
  )
})
ImageObjectRenderer.displayName = 'ImageObjectRenderer'
