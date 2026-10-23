import type { BotanicalArchetypeId } from '../../botanicalArchetypes'
import type { PlantRenderer } from '../types'
import { SolanaceaeRenderer } from './SolanaceaeRenderer'
import { CerealRenderer } from './CerealRenderer'
import { RosetteRenderer } from './RosetteRenderer'
import { RootTuberRenderer } from './RootTuberRenderer'
import { HeliotropoRenderer } from './HeliotropoRenderer'
import { PalmateRenderer } from './PalmateRenderer'
import { VineRenderer } from './VineRenderer'
import { WoodyRenderer } from './WoodyRenderer'
import { GenericHerbRenderer } from './GenericHerbRenderer'

export const PROCEDURAL_RENDERERS: Record<BotanicalArchetypeId, PlantRenderer> = {
  solanaceae_tall: SolanaceaeRenderer,
  cereal_grass: CerealRenderer,
  rosette_leafy: RosetteRenderer,
  root_tuber: RootTuberRenderer,
  heliotropo_tall: HeliotropoRenderer,
  palmate_cane: PalmateRenderer,
  vine_climber: VineRenderer,
  woody_perennial: WoodyRenderer,
  generic_herb: GenericHerbRenderer,
}

export {
  SolanaceaeRenderer,
  CerealRenderer,
  RosetteRenderer,
  RootTuberRenderer,
  HeliotropoRenderer,
  PalmateRenderer,
  VineRenderer,
  WoodyRenderer,
  GenericHerbRenderer,
}
