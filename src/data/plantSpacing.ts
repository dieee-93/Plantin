import { getEffectiveCropCode } from '@/domain/ontology/cropResolver'

export interface CropSpacingRecommendation {
  cropCode: string
  plantCm: number
  rowCm: number
  source: string
}

/**
 * Tabla curada de marcos de plantación recomendados por cultivo.
 * Fuentes: INTA (Argentina), FAO y manuales agronómicos oficiales.
 */
export const PLANT_SPACING_TABLE: Record<string, CropSpacingRecommendation> = {
  TOM: { cropCode: 'TOM', plantCm: 40, rowCm: 70, source: 'INTA ProHuerta' },
  PEPPER_SWEET: { cropCode: 'PEPPER_SWEET', plantCm: 40, rowCm: 70, source: 'INTA Horticultura' },
  EGGPLANT: { cropCode: 'EGGPLANT', plantCm: 50, rowCm: 80, source: 'INTA Horticultura' },
  MAI: { cropCode: 'MAI', plantCm: 25, rowCm: 70, source: 'FAO Corn Production Manual' },
  WHT: { cropCode: 'WHT', plantCm: 15, rowCm: 20, source: 'FAO Cereal Guide' },
  SUN_OIL: { cropCode: 'SUN_OIL', plantCm: 30, rowCm: 70, source: 'INTA Girasol' },
  LETTUCE: { cropCode: 'LETTUCE', plantCm: 25, rowCm: 30, source: 'INTA Horticultura' },
  STRAWBERRY: { cropCode: 'STRAWBERRY', plantCm: 30, rowCm: 35, source: 'Manual de Frutilla INTA' },
  CARROT: { cropCode: 'CARROT', plantCm: 10, rowCm: 25, source: 'INTA Hortalizas de Raíz' },
  BEETROOT: { cropCode: 'BEETROOT', plantCm: 15, rowCm: 30, source: 'INTA Hortalizas de Raíz' },
  ONION: { cropCode: 'ONION', plantCm: 15, rowCm: 30, source: 'INTA Guía de Cultivo de Cebolla' },
  HEMP: { cropCode: 'HEMP', plantCm: 50, rowCm: 100, source: 'FAO Industrial Hemp Guide' },
  BEA_DRY: { cropCode: 'BEA_DRY', plantCm: 20, rowCm: 50, source: 'FAO Grain Legumes' },
  SQUASH: { cropCode: 'SQUASH', plantCm: 100, rowCm: 150, source: 'INTA Cucurbitáceas' },
  GRAPE: { cropCode: 'GRAPE', plantCm: 120, rowCm: 250, source: 'Manual de Viticultura INTA' },
  CITRUS_ORANGE: { cropCode: 'CITRUS_ORANGE', plantCm: 300, rowCm: 400, source: 'INTA Fruticultura' },
  SOY: { cropCode: 'SOY', plantCm: 10, rowCm: 40, source: 'INTA Soja' },
  POTATO: { cropCode: 'POTATO', plantCm: 30, rowCm: 70, source: 'INTA Papa' },
  GARLIC: { cropCode: 'GARLIC', plantCm: 12, rowCm: 30, source: 'INTA Ajo' },
  SPINACH: { cropCode: 'SPINACH', plantCm: 15, rowCm: 25, source: 'INTA Hortalizas de Hoja' },
  CHARD: { cropCode: 'CHARD', plantCm: 25, rowCm: 40, source: 'INTA Acelga' },
  PEA: { cropCode: 'PEA', plantCm: 10, rowCm: 40, source: 'INTA Arveja' },
  CUCUMBER: { cropCode: 'CUCUMBER', plantCm: 40, rowCm: 80, source: 'INTA Pepino' },
  CABBAGE: { cropCode: 'CABBAGE', plantCm: 40, rowCm: 60, source: 'INTA Repollo' },
  BROCCOLI: { cropCode: 'BROCCOLI', plantCm: 45, rowCm: 70, source: 'INTA Brócoli' },
  CAULIFLOWER: { cropCode: 'CAULIFLOWER', plantCm: 50, rowCm: 70, source: 'INTA Coliflor' },
  MELON: { cropCode: 'MELON', plantCm: 80, rowCm: 150, source: 'INTA Melón' },
  WATERMELON: { cropCode: 'WATERMELON', plantCm: 100, rowCm: 200, source: 'INTA Sandía' },
  RADISH: { cropCode: 'RADISH', plantCm: 5, rowCm: 15, source: 'INTA Rabanito' },
  BASIL: { cropCode: 'BASIL', plantCm: 25, rowCm: 35, source: 'INTA Aromáticas' },
}

export const DEFAULT_PLANT_SPACING = {
  plantCm: 40,
  rowCm: 70,
  source: 'Estándar',
  isRecommended: false,
}

/**
 * Obtiene el espaciado recomendado para un taxón o código de cultivo.
 */
export function getPlantSpacing(
  cropCodeOrTaxon?: string | { cropCode?: string; genus?: string; species?: string } | null
): { plantCm: number; rowCm: number; source: string; isRecommended: boolean } {
  if (!cropCodeOrTaxon) {
    return DEFAULT_PLANT_SPACING
  }

  const code =
    typeof cropCodeOrTaxon === 'string'
      ? cropCodeOrTaxon
      : getEffectiveCropCode(cropCodeOrTaxon)

  if (code && PLANT_SPACING_TABLE[code]) {
    const entry = PLANT_SPACING_TABLE[code]
    return {
      plantCm: entry.plantCm,
      rowCm: entry.rowCm,
      source: entry.source,
      isRecommended: true,
    }
  }

  return DEFAULT_PLANT_SPACING
}
