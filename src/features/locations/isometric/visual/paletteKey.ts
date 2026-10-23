import type { IndividualStatus } from '@/domain/individual'
import type { Taxon } from '@/domain/taxon'
import { resolveBotanicalArchetype } from '../botanicalArchetypes'

export type PlantVitality = 'alive' | 'harvested' | 'dead'

export interface PlantPaletteData {
  key: string
  fruitBaseColor: string
  fruitShadowColor: string
  stemColor: string
  leafDark: string
  leafMid: string
  leafLight: string
}

/**
 * Resuelve la paleta cromática de una planta y su clave de gradiente estable (paletteKey).
 * La clave integra arquetipo, variante de fruto, estado vital y madurez fenológica.
 */
export function resolvePlantPalette(input: {
  taxon?: Pick<Taxon, 'genus' | 'species' | 'family' | 'cropCode' | 'commonName'> | null
  status?: IndividualStatus
  bbch?: number
}): PlantPaletteData {
  const stage = input.bbch ?? 14
  const status = input.status ?? 'active'
  const isDead = status === 'dead' || status === 'discarded'
  const isHarvested = status === 'harvested'
  const vitality: PlantVitality = isDead ? 'dead' : isHarvested ? 'harvested' : 'alive'
  const isRipe = stage >= 80
  const maturity = isRipe ? 'ripe' : 'unripe'

  const profile = resolveBotanicalArchetype(input.taxon)

  const stemColor = isDead
    ? '#8d6e63'
    : isHarvested
      ? '#b45309'
      : profile.stemColor

  const leafDark = isDead
    ? '#a1887f'
    : isHarvested
      ? '#d97706'
      : profile.leafDark

  const leafMid = isDead
    ? '#bcaaa4'
    : isHarvested
      ? '#f59e0b'
      : profile.leafMid

  const leafLight = isDead
    ? '#d7ccc8'
    : isHarvested
      ? '#fbbf24'
      : profile.leafLight

  const fruitBaseColor = isRipe ? profile.ripeFruitColor : profile.unripeFruitColor
  const fruitShadowColor = isRipe ? profile.ripeFruitStroke : '#365314'

  // Clave estable que incluye arquetipo, variante de fruto, madurez y estado vital
  const rawKey = `${profile.archetype}_${profile.fruitShape}_${vitality}_${maturity}`
  const key = rawKey.replace(/[^a-zA-Z0-9_-]/g, '_')

  return {
    key,
    fruitBaseColor,
    fruitShadowColor,
    stemColor,
    leafDark,
    leafMid,
    leafLight,
  }
}
