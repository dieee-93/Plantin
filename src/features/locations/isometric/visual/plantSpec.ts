import type { Taxon } from '@/domain/taxon'
import type { LocationType } from '@/domain/location'
import type { IndividualStatus } from '@/domain/individual'
import {
  resolveBotanicalArchetype,
  type BotanicalArchetypeId,
  type FruitShape,
} from '../botanicalArchetypes'
import { hashString, mulberry32 } from './seed'
import {
  adjustVitality,
  createShadedColor,
  type ShadedColor,
} from './palette'

export type BbchPhase = 'germination' | 'leaf' | 'structure' | 'flowering' | 'fruiting'
export type PlantVitality = 'alive' | 'harvested' | 'dead'

export interface PlantPalette {
  stem: ShadedColor
  leaf: ShadedColor
  leafDark: ShadedColor
  leafLight: ShadedColor
  fruit: ShadedColor
  flower: ShadedColor
  badgeColor: string
}

export interface PlantVisualSpec {
  archetype: BotanicalArchetypeId
  cropCode: string
  fruitShape: FruitShape
  bbch: number // 0–99
  phase: BbchPhase
  phaseProgress: number // 0–1 dentro de la fase (crecimiento continuo)
  vitality: PlantVitality
  palette: PlantPalette
  paletteKey: string // clave para SharedDefs
  seed: number
  variation: {
    heightScale: number // 0.9–1.1
    leanDeg: number // -4..4 deg
    leafJitterDeg: number // -8..8 deg
    mirror: boolean // espejo horizontal
  }
  container: LocationType
  containerScale: number // Escala según tipo de instalación (ej. 1.15 en field para ocupar 55–75% de baldosa)
}

/**
 * Resuelve la fase fenológica y el progreso continuo [0, 1] dentro de la fase a partir del código BBCH.
 */
export function resolveBbchPhase(bbch: number): { phase: BbchPhase; phaseProgress: number } {
  const stage = Math.max(0, Math.min(99, bbch))

  if (stage < 10) {
    return { phase: 'germination', phaseProgress: stage / 10 }
  }
  if (stage < 30) {
    return { phase: 'leaf', phaseProgress: (stage - 10) / 20 }
  }
  if (stage < 50) {
    return { phase: 'structure', phaseProgress: (stage - 30) / 20 }
  }
  if (stage < 70) {
    return { phase: 'flowering', phaseProgress: (stage - 50) / 20 }
  }
  return { phase: 'fruiting', phaseProgress: Math.min(1, (stage - 70) / 30) }
}

/**
 * Construye el PlantVisualSpec determinístico y puro para renderizar cualquier planta.
 */
export function buildPlantVisualSpec(input: {
  individualId: string
  taxon?: Pick<Taxon, 'genus' | 'species' | 'family' | 'cropCode' | 'commonName'> | null
  bbch?: number
  status?: IndividualStatus
  locationType: LocationType
}): PlantVisualSpec {
  const bbch = input.bbch ?? 14
  const status = input.status ?? 'active'
  const isDead = status === 'dead' || status === 'discarded'
  const isHarvested = status === 'harvested'
  const vitality: PlantVitality = isDead ? 'dead' : isHarvested ? 'harvested' : 'alive'

  const { phase, phaseProgress } = resolveBbchPhase(bbch)

  // Seed derivado del ID
  const seed = hashString(input.individualId || 'plant-default')
  const rng = mulberry32(seed)

  // Variación botánica natural
  const heightScale = 0.9 + rng() * 0.2 // 0.9–1.1
  const leanDeg = -4 + rng() * 8 // -4..4
  const leafJitterDeg = -8 + rng() * 16 // -8..8
  const mirror = rng() > 0.5

  const profile = resolveBotanicalArchetype(input.taxon)
  const isRipe = bbch >= 80

  // Paleta botánica base con ajuste de vitalidad (desaturación + viraje ocre si dead/harvested)
  const baseStem = adjustVitality(profile.stemColor, vitality)
  const baseLeafMid = adjustVitality(profile.leafMid, vitality)
  const baseLeafDark = adjustVitality(profile.leafDark, vitality)
  const baseLeafLight = adjustVitality(profile.leafLight, vitality)
  const rawFruit = isRipe ? profile.ripeFruitColor : profile.unripeFruitColor
  const baseFruit = adjustVitality(rawFruit, vitality)
  const baseFlower = adjustVitality(profile.flowerPetalColor, vitality)

  const palette: PlantPalette = {
    stem: createShadedColor(baseStem),
    leaf: createShadedColor(baseLeafMid),
    leafDark: createShadedColor(baseLeafDark),
    leafLight: createShadedColor(baseLeafLight),
    fruit: createShadedColor(baseFruit),
    flower: createShadedColor(baseFlower),
    badgeColor: profile.badgeColor,
  }

  const rawKey = `${profile.archetype}_${profile.fruitShape}_${vitality}_${isRipe ? 'ripe' : 'unripe'}`
  const paletteKey = rawKey.replace(/[^a-zA-Z0-9_-]/g, '_')

  return {
    archetype: profile.archetype,
    cropCode: profile.cropCode,
    fruitShape: profile.fruitShape,
    bbch,
    phase,
    phaseProgress,
    vitality,
    palette,
    paletteKey,
    seed,
    variation: {
      heightScale: Number(heightScale.toFixed(3)),
      leanDeg: Number(leanDeg.toFixed(2)),
      leafJitterDeg: Number(leafJitterDeg.toFixed(2)),
      mirror,
    },
    container: input.locationType,
    containerScale: input.locationType === 'field' ? 1.15 : 1.0,
  }
}
