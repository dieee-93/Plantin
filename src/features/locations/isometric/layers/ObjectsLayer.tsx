import React, { useMemo } from 'react'
import type { PlacedObject } from '@/domain/roomLayout'
import { OBJECT_CATALOG } from '../catalog'
import { projectWorld } from '../geometry/iso'
import { topologicalSortFootprints, type Footprint } from '../geometry/depth'

import { getObjectBox } from '../editor/collision'

export interface ObjectsLayerProps {
  placedObjects: PlacedObject[]
  selectedObjectId?: string | null
  onSelectObject?: (objectId: string) => void
  isSpaceMode?: boolean
}

interface PlacedObjectWithFootprint {
  obj: PlacedObject
  footprint: Footprint
}

export const ObjectsLayer: React.FC<ObjectsLayerProps> = React.memo(({
  placedObjects,
  selectedObjectId,
  onSelectObject,
  isSpaceMode = false,
}) => {
  const sortedObjects = useMemo(() => {
    const withFp: PlacedObjectWithFootprint[] = placedObjects.map(obj => {
      const box = getObjectBox(obj)
      return {
        obj,
        footprint: {
          x: box.x,
          y: box.y,
          z: box.z ?? obj.z,
          w: box.w,
          d: box.d,
          h: box.h ?? 30,
        },
      }
    })

    return topologicalSortFootprints(withFp)
  }, [placedObjects])

  if (placedObjects.length === 0) {
    return null
  }

  return (
    <g data-layer="placed-objects" style={{ pointerEvents: isSpaceMode ? 'auto' : 'none' }}>
      {sortedObjects.map(({ obj }) => {
        const def = OBJECT_CATALOG[obj.typeId]
        if (!def || !def.Renderer) return null

        const Renderer = def.Renderer
        const pos = projectWorld({ x: obj.x, y: obj.y, z: obj.z })
        const view = obj.rotation === 90 || obj.rotation === 270 ? 'b' : 'a'
        const isFlipped = obj.rotation === 180 || obj.rotation === 270

        const isSelected = obj.id === selectedObjectId

        return (
          <g
            key={obj.id}
            data-placed-object={obj.typeId}
            data-object-id={obj.id}
            aria-label={`Objeto colocado ${def.label || obj.typeId}`}
            role="button"
            style={{ cursor: isSpaceMode ? 'pointer' : 'default' }}
            transform={`translate(${pos.x}, ${pos.y}) ${isFlipped ? 'scale(-1, 1)' : ''}`}
            onClick={(e) => {
              if (!isSpaceMode) return
              e.stopPropagation()
              onSelectObject?.(obj.id)
            }}
          >
            {/* Halo de selección interactiva del objeto */}
            {isSelected && (
              <ellipse
                cx="0"
                cy="0"
                rx="32"
                ry="16"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeDasharray="4 3"
              />
            )}
            <Renderer obj={obj} view={view} />
          </g>
        )
      })}
    </g>
  )
})
ObjectsLayer.displayName = 'ObjectsLayer'
