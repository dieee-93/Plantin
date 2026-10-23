import type React from 'react'
import type { PlantVisualSpec } from '../visual/plantSpec'
import type { IsometricLensMode } from '../botanicalArchetypes'

export interface PlantRendererProps {
  spec: PlantVisualSpec
  isSelected: boolean
  generation?: string
  lensMode?: IsometricLensMode
}

export type PlantRenderer = React.ComponentType<PlantRendererProps>
