// Archivo generado por scripts/assets/build-manifest.ts — no editar a mano
import type { BbchPhase } from '../../visual/plantSpec'

export interface RasterSpriteMeta {
  href: string
  width: number
  height: number
  anchorX: number
  anchorY: number
}

export const RASTER_SPRITES: Partial<
  Record<string /* cropCode */, Partial<Record<BbchPhase | 'dead' | 'harvested', string>>>
> = {
  TOM: {
    germination: new URL('./assets/tom-germination.webp', import.meta.url).href,
    leaf: new URL('./assets/tom-leaf.webp', import.meta.url).href,
    structure: new URL('./assets/tom-structure.webp', import.meta.url).href,
    flowering: new URL('./assets/tom-flowering.webp', import.meta.url).href,
    fruiting: new URL('./assets/tom-fruiting.webp', import.meta.url).href,
    harvested: new URL('./assets/tom-harvested.webp', import.meta.url).href,
  },
  HEMP: {
    germination: new URL('./assets/hemp-germination.webp', import.meta.url).href,
    leaf: new URL('./assets/hemp-leaf.webp', import.meta.url).href,
    structure: new URL('./assets/hemp-structure.webp', import.meta.url).href,
    flowering: new URL('./assets/hemp-flowering.webp', import.meta.url).href,
    fruiting: new URL('./assets/hemp-fruiting.webp', import.meta.url).href,
  },
  MAI: {
    germination: new URL('./assets/mai-germination.webp', import.meta.url).href,
    leaf: new URL('./assets/mai-leaf.webp', import.meta.url).href,
    structure: new URL('./assets/mai-structure.webp', import.meta.url).href,
    flowering: new URL('./assets/mai-flowering.webp', import.meta.url).href,
    fruiting: new URL('./assets/mai-fruiting.webp', import.meta.url).href,
  },
  WHT: {
    germination: new URL('./assets/wht-germination.webp', import.meta.url).href,
    leaf: new URL('./assets/wht-leaf.webp', import.meta.url).href,
    structure: new URL('./assets/wht-structure.webp', import.meta.url).href,
    flowering: new URL('./assets/wht-flowering.webp', import.meta.url).href,
    fruiting: new URL('./assets/wht-fruiting.webp', import.meta.url).href,
  },
  LETTUCE: {
    germination: new URL('./assets/lettuce-germination.webp', import.meta.url).href,
    leaf: new URL('./assets/lettuce-leaf.webp', import.meta.url).href,
    structure: new URL('./assets/lettuce-structure.webp', import.meta.url).href,
    flowering: new URL('./assets/lettuce-flowering.webp', import.meta.url).href,
    fruiting: new URL('./assets/lettuce-fruiting.webp', import.meta.url).href,
  },
  CARROT: {
    germination: new URL('./assets/carrot-germination.webp', import.meta.url).href,
    leaf: new URL('./assets/carrot-leaf.webp', import.meta.url).href,
    structure: new URL('./assets/carrot-structure.webp', import.meta.url).href,
    flowering: new URL('./assets/carrot-flowering.webp', import.meta.url).href,
    fruiting: new URL('./assets/carrot-fruiting.webp', import.meta.url).href,
  },
  BEETROOT: {
    germination: new URL('./assets/beetroot-germination.webp', import.meta.url).href,
    leaf: new URL('./assets/beetroot-leaf.webp', import.meta.url).href,
    structure: new URL('./assets/beetroot-structure.webp', import.meta.url).href,
    flowering: new URL('./assets/beetroot-flowering.webp', import.meta.url).href,
    fruiting: new URL('./assets/beetroot-fruiting.webp', import.meta.url).href,
  },
  SQUASH: {
    germination: new URL('./assets/squash-germination.webp', import.meta.url).href,
    leaf: new URL('./assets/squash-leaf.webp', import.meta.url).href,
    structure: new URL('./assets/squash-structure.webp', import.meta.url).href,
    flowering: new URL('./assets/squash-flowering.webp', import.meta.url).href,
    fruiting: new URL('./assets/squash-fruiting.webp', import.meta.url).href,
    harvested: new URL('./assets/squash-harvested.webp', import.meta.url).href,
  },
  CITRUS_ORANGE: {
    germination: new URL('./assets/citrus_orange-germination.webp', import.meta.url).href,
    leaf: new URL('./assets/citrus_orange-leaf.webp', import.meta.url).href,
    structure: new URL('./assets/citrus_orange-structure.webp', import.meta.url).href,
    flowering: new URL('./assets/citrus_orange-flowering.webp', import.meta.url).href,
    fruiting: new URL('./assets/citrus_orange-fruiting.webp', import.meta.url).href,
  },
  STRAWBERRY: {
    germination: new URL('./assets/strawberry-germination.webp', import.meta.url).href,
    leaf: new URL('./assets/strawberry-leaf.webp', import.meta.url).href,
    structure: new URL('./assets/strawberry-structure.webp', import.meta.url).href,
    flowering: new URL('./assets/strawberry-flowering.webp', import.meta.url).href,
    fruiting: new URL('./assets/strawberry-fruiting.webp', import.meta.url).href,
  },
  SUN_OIL: {
    germination: new URL('./assets/sun_oil-germination.webp', import.meta.url).href,
    leaf: new URL('./assets/sun_oil-leaf.webp', import.meta.url).href,
    structure: new URL('./assets/sun_oil-structure.webp', import.meta.url).href,
    flowering: new URL('./assets/sun_oil-flowering.webp', import.meta.url).href,
    fruiting: new URL('./assets/sun_oil-fruiting.webp', import.meta.url).href,
  },
  PEPPER_SWEET: {
    fruiting: new URL('./assets/pepper_sweet-fruiting.webp', import.meta.url).href,
    flowering: new URL('./assets/pepper_sweet-flowering.webp', import.meta.url).href,
    structure: new URL('./assets/pepper_sweet-structure.webp', import.meta.url).href,
    leaf: new URL('./assets/pepper_sweet-leaf.webp', import.meta.url).href,
  },
  ONION: {
    fruiting: new URL('./assets/onion-fruiting.webp', import.meta.url).href,
  },
}

export const RASTER_SPRITES_META: Partial<
  Record<string, Partial<Record<BbchPhase | 'dead' | 'harvested', RasterSpriteMeta>>>
> = {
  PEPPER_SWEET: {
    fruiting: {
      href: new URL('./assets/pepper_sweet-fruiting.webp', import.meta.url).href,
      width: 80,
      height: 50,
      anchorX: -40,
      anchorY: -57,
    },
    flowering: {
      href: new URL('./assets/pepper_sweet-flowering.webp', import.meta.url).href,
      width: 80,
      height: 50,
      anchorX: -40,
      anchorY: -57,
    },
    structure: {
      href: new URL('./assets/pepper_sweet-structure.webp', import.meta.url).href,
      width: 80,
      height: 50,
      anchorX: -40,
      anchorY: -57,
    },
    leaf: {
      href: new URL('./assets/pepper_sweet-leaf.webp', import.meta.url).href,
      width: 80,
      height: 50,
      anchorX: -40,
      anchorY: -57,
    },
  },
  ONION: {
    fruiting: {
      href: new URL('./assets/onion-fruiting.webp', import.meta.url).href,
      width: 70,
      height: 26,
      anchorX: -35,
      anchorY: -33,
    },
  },
}
