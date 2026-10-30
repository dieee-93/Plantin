import type { Taxon } from '@/domain/taxon'
import type { LocationType } from '@/domain/location'
import { getEffectiveCropCode } from '@/domain/ontology/cropResolver'

export type BotanicalArchetypeId =
  | 'solanaceae_tall'
  | 'cereal_grass'
  | 'rosette_leafy'
  | 'root_tuber'
  | 'heliotropo_tall'
  | 'palmate_cane'
  | 'vine_climber'
  | 'woody_perennial'
  | 'generic_herb'

export type FruitShape =
  | 'round'
  | 'elongated_pod'
  | 'ear_cob'
  | 'root_shoulder'
  | 'berry_cluster'
  | 'capitulum_disc'
  | 'resin_cola'
  | 'gourd'

export type IsometricLensMode = 'species' | 'bbch' | 'genetics' | 'climate'

export interface BotanicalVisualProfile {
  archetype: BotanicalArchetypeId
  archetypeLabel: string
  cropCode: string
  badgeColor: string
  stemColor: string
  leafDark: string
  leafMid: string
  leafLight: string
  flowerPetalColor: string
  flowerCenterColor: string
  unripeFruitColor: string
  ripeFruitColor: string
  ripeFruitStroke: string
  fruitShape: FruitShape
}

const DEFAULT_PROFILE: BotanicalVisualProfile = {
  archetype: 'generic_herb',
  archetypeLabel: 'Herbácea / General',
  cropCode: 'GEN',
  badgeColor: '#16a34a',
  stemColor: '#2d6a4f',
  leafDark: '#1b4332',
  leafMid: '#40916c',
  leafLight: '#74c69d',
  flowerPetalColor: '#fde047',
  flowerCenterColor: '#ca8a04',
  unripeFruitColor: '#84cc16',
  ripeFruitColor: '#ef4444',
  ripeFruitStroke: '#991b1b',
  fruitShape: 'round',
}

/**
 * Resuelve el perfil morfológico y cromático de una planta en base a su Taxon.
 * Combina el cropCode canónico (ontología), el género y la familia botánica.
 */
export function resolveBotanicalArchetype(
  taxon?: Pick<Taxon, 'genus' | 'species' | 'family' | 'cropCode' | 'commonName'> | null
): BotanicalVisualProfile {
  if (!taxon) return DEFAULT_PROFILE

  const code = getEffectiveCropCode(taxon)
  const genus = (taxon.genus || '').trim().toLowerCase()
  const species = (taxon.species || '').trim().toLowerCase()
  const family = (taxon.family || '').trim().toLowerCase()

  // 1. Capítulo Solar / Girasol / Cártamo
  if (
    code === 'SUN_OIL' ||
    code === 'SUN' ||
    code === 'SAFFLOWER' ||
    genus === 'helianthus' ||
    genus === 'carthamus'
  ) {
    return {
      archetype: 'heliotropo_tall',
      archetypeLabel: 'Capítulo Solar / Oleaginosa',
      cropCode: code || 'SUN',
      badgeColor: '#eab308',
      stemColor: '#3f6212',
      leafDark: '#365314',
      leafMid: '#4d7c0f',
      leafLight: '#84cc16',
      flowerPetalColor: '#facc15',
      flowerCenterColor: '#451a03',
      unripeFruitColor: '#ca8a04',
      ripeFruitColor: '#451a03',
      ripeFruitStroke: '#facc15',
      fruitShape: 'capitulum_disc',
    }
  }

  // 2. Palmeada / Cannabis / Cáñamo / Lúpulo / Ricino
  if (
    code === 'HEMP' ||
    code === 'HOPS' ||
    code === 'CASTOR' ||
    genus === 'cannabis' ||
    genus === 'humulus' ||
    genus === 'ricinus' ||
    family.includes('cannab')
  ) {
    return {
      archetype: 'palmate_cane',
      archetypeLabel: 'Palmeada / Industrial',
      cropCode: code || 'HEMP',
      badgeColor: '#059669',
      stemColor: '#14532d',
      leafDark: '#064e3b',
      leafMid: '#059669',
      leafLight: '#34d399',
      flowerPetalColor: '#a7f3d0',
      flowerCenterColor: '#d97706',
      unripeFruitColor: '#10b981',
      ripeFruitColor: '#047857',
      ripeFruitStroke: '#b45309',
      fruitShape: 'resin_cola',
    }
  }

  // 3. Gramíneas y Cereales (Maíz, Trigo, Arroz, Cebada, Avena, Sorgo, Caña)
  if (
    ['MAI', 'MAI_SWEET', 'MAI_POP', 'WHT', 'WHT_DURUM', 'RIC_INDICA', 'RIC', 'BAR_MALT', 'BAR', 'OAT', 'RYE', 'SGH_GRAIN', 'TEFF', 'SUG_CANE'].includes(code) ||
    ['zea', 'triticum', 'oryza', 'hordeum', 'avena', 'secale', 'sorghum', 'saccharum'].includes(genus) ||
    family.includes('poaceae') ||
    family.includes('gramin')
  ) {
    const isMaize = code.startsWith('MAI') || genus === 'zea'
    return {
      archetype: 'cereal_grass',
      archetypeLabel: isMaize ? 'Maíz / Gramínea C4' : 'Cereal / Espiga',
      cropCode: code || 'CER',
      badgeColor: '#d97706',
      stemColor: '#65a30d',
      leafDark: '#3f6212',
      leafMid: '#65a30d',
      leafLight: '#a3e635',
      flowerPetalColor: '#fde68a',
      flowerCenterColor: '#b45309',
      unripeFruitColor: '#bef264',
      ripeFruitColor: isMaize ? '#facc15' : '#eab308',
      ripeFruitStroke: '#a16207',
      fruitShape: 'ear_cob',
    }
  }

  // 4. Raíces, Tubérculos y Bulbos (Zanahoria, Remolacha, Rábano, Cebolla, Ajo, Papa, Batata, Mandioca)
  if (
    ['CARROT', 'BEETROOT', 'RADISH', 'TURNIP', 'ONION', 'GARLIC', 'LEEK', 'CHIVE', 'POT', 'POT_TABLE', 'SWEET_POTATO', 'CASSAVA', 'MACA', 'GINGER', 'TURMERIC'].includes(code) ||
    ['daucus', 'beta', 'raphanus', 'allium', 'ipomoea', 'manihot'].includes(genus) ||
    (genus === 'solanum' && species === 'tuberosum')
  ) {
    const isCarrot = code === 'CARROT' || genus === 'daucus'
    const isBeetOrRadish = code === 'BEETROOT' || code === 'RADISH' || genus === 'beta' || genus === 'raphanus'
    const isAllium = ['ONION', 'GARLIC', 'LEEK', 'CHIVE'].includes(code) || genus === 'allium'

    return {
      archetype: 'root_tuber',
      archetypeLabel: isAllium ? 'Aliácea / Bulbo' : 'Raíz / Tubérculo',
      cropCode: code || 'ROOT',
      badgeColor: isCarrot ? '#f97316' : isBeetOrRadish ? '#be123c' : '#a16207',
      stemColor: '#15803d',
      leafDark: isAllium ? '#0f766e' : '#166534',
      leafMid: isAllium ? '#14b8a6' : '#22c55e',
      leafLight: isAllium ? '#5eead4' : '#86efac',
      flowerPetalColor: '#f8fafc',
      flowerCenterColor: '#cbd5e1',
      unripeFruitColor: isCarrot ? '#fb923c' : isBeetOrRadish ? '#f43f5e' : '#d97706',
      ripeFruitColor: isCarrot ? '#ea580c' : isBeetOrRadish ? '#9f1239' : '#b45309',
      ripeFruitStroke: isCarrot ? '#9a3412' : isBeetOrRadish ? '#881337' : '#78350f',
      fruitShape: 'root_shoulder',
    }
  }

  // 5. Hortalizas de Hoja / Roseta Basal (Lechuga, Espinaca, Repollo/Brássicas, Frutilla, Apio)
  if (
    ['LETTUCE', 'SPINACH', 'CABBAGE', 'CAN', 'MUSTARD', 'CELERY', 'ARTICHOKE', 'STRAWBERRY'].includes(code) ||
    ['lactuca', 'spinacia', 'brassica', 'fragaria', 'apium', 'cynara'].includes(genus) ||
    family.includes('brassic') ||
    (family.includes('aster') && genus === 'lactuca')
  ) {
    const isStrawberry = code === 'STRAWBERRY' || genus === 'fragaria'
    return {
      archetype: 'rosette_leafy',
      archetypeLabel: isStrawberry ? 'Roseta / Frutilla' : 'Roseta Foliar / Brássica',
      cropCode: code || 'LEAF',
      badgeColor: '#22c55e',
      stemColor: '#4ade80',
      leafDark: '#15803d',
      leafMid: '#22c55e',
      leafLight: '#86efac',
      flowerPetalColor: isStrawberry ? '#ffffff' : '#fef08a',
      flowerCenterColor: '#eab308',
      unripeFruitColor: '#86efac',
      ripeFruitColor: isStrawberry ? '#ef4444' : '#4ade80',
      ripeFruitStroke: isStrawberry ? '#991b1b' : '#166534',
      fruitShape: isStrawberry ? 'berry_cluster' : 'round',
    }
  }

  // 6. Leguminosas y Cucurbitáceas / Enredaderas (Poroto, Soja, Arveja, Pepino, Zapallo, Sandía, Melón, Vid)
  if (
    ['SOY', 'SOY_SHORT', 'BEA_DRY', 'PEA_DRY', 'PEA_NUT', 'LEN', 'CHI_KABULI', 'FABA_BEAN', 'COWPEA', 'MUNG_BEAN', 'LUPIN', 'CUCUMBER', 'MELON', 'WATERMELON', 'ZUCCHINI', 'SQUASH', 'GRAPE', 'PASSION_FRUIT'].includes(code) ||
    ['glycine', 'phaseolus', 'pisum', 'vicia', 'vigna', 'lupinus', 'cucumis', 'cucurbita', 'citrullus', 'vitis', 'passiflora'].includes(genus) ||
    family.includes('fabaceae') ||
    family.includes('legumin') ||
    family.includes('cucurbit')
  ) {
    const isCucurbit = ['CUCUMBER', 'MELON', 'WATERMELON', 'ZUCCHINI', 'SQUASH'].includes(code) || ['cucumis', 'cucurbita', 'citrullus'].includes(genus) || family.includes('cucurbit')
    const isGrape = code === 'GRAPE' || genus === 'vitis'
    return {
      archetype: 'vine_climber',
      archetypeLabel: isCucurbit ? 'Cucurbitácea / Guía' : isGrape ? 'Vid / Trepadora' : 'Leguminosa / Vaina',
      cropCode: code || 'LEG',
      badgeColor: isGrape ? '#7c3aed' : isCucurbit ? '#0d9488' : '#65a30d',
      stemColor: '#3f6212',
      leafDark: '#14532d',
      leafMid: '#16a34a',
      leafLight: '#4ade80',
      flowerPetalColor: isCucurbit ? '#facc15' : '#e9d5ff',
      flowerCenterColor: '#ca8a04',
      unripeFruitColor: '#84cc16',
      ripeFruitColor: isGrape ? '#6d28d9' : isCucurbit ? '#f59e0b' : '#a3e635',
      ripeFruitStroke: isGrape ? '#4c1d95' : isCucurbit ? '#b45309' : '#3f6212',
      fruitShape: isCucurbit ? 'gourd' : 'elongated_pod',
    }
  }

  // 7. Leñosas, Frutales, Cítricos y Estimulantes (Manzano, Cítricos, Café, Cacao, Olivo, Yerba Mate, Arándano)
  if (
    ['APPLE', 'PEAR', 'PEACH', 'CHERRY', 'PLUM', 'APRICOT', 'ALMOND', 'BLUEBERRY', 'RASPBERRY', 'FIG', 'POMEGRANATE', 'KIWI', 'AVOCADO', 'MANGO', 'BANANA', 'PAPAYA', 'CITRUS_ORANGE', 'LEMON', 'MANDARIN', 'GRAPEFRUIT', 'LIME', 'OLIVE', 'COFFEE', 'CACAO', 'TEA', 'YERBA_MATE', 'WALNUT', 'PECAN'].includes(code) ||
    ['malus', 'pyrus', 'prunus', 'citrus', 'coffea', 'theobroma', 'ilex', 'olea', 'persea', 'mangifera', 'vaccinium'].includes(genus)
  ) {
    const isCitrus = ['CITRUS_ORANGE', 'LEMON', 'MANDARIN', 'GRAPEFRUIT', 'LIME'].includes(code) || genus === 'citrus'
    const isBlueberry = code === 'BLUEBERRY' || genus === 'vaccinium'
    return {
      archetype: 'woody_perennial',
      archetypeLabel: 'Leñosa / Frutal Perenne',
      cropCode: code || 'TREE',
      badgeColor: isCitrus ? '#f59e0b' : isBlueberry ? '#3b82f6' : '#b45309',
      stemColor: '#78350f',
      leafDark: '#064e3b',
      leafMid: '#15803d',
      leafLight: '#4ade80',
      flowerPetalColor: '#ffffff',
      flowerCenterColor: '#fde047',
      unripeFruitColor: '#84cc16',
      ripeFruitColor: isCitrus ? '#f97316' : isBlueberry ? '#2563eb' : '#dc2626',
      ripeFruitStroke: isCitrus ? '#c2410c' : isBlueberry ? '#1d4ed8' : '#991b1b',
      fruitShape: 'round',
    }
  }

  // 8. Solanáceas de Fruto (Tomate, Pimiento, Ají, Berenjena, Tomatillo)
  if (
    ['TOM', 'PEPPER_SWEET', 'PEPPER_HOT', 'EGGPLANT', 'TOMATILLO', 'TOBACCO'].includes(code) ||
    ['solanum', 'capsicum', 'physalis', 'nicotiana'].includes(genus) ||
    family.includes('solan')
  ) {
    const isEggplant = code === 'EGGPLANT' || species === 'melongena'
    const isPepper = code.startsWith('PEPPER') || genus === 'capsicum'
    return {
      archetype: 'solanaceae_tall',
      archetypeLabel: isPepper ? 'Capsicum / Pimiento' : isEggplant ? 'Berenjena / Solanácea' : 'Tomate / Solanácea',
      cropCode: code || 'SOL',
      badgeColor: isEggplant ? '#7e22ce' : isPepper ? '#ea580c' : '#dc2626',
      stemColor: '#2d6a4f',
      leafDark: '#1b4332',
      leafMid: '#40916c',
      leafLight: '#74c69d',
      flowerPetalColor: isEggplant ? '#c084fc' : '#fde047',
      flowerCenterColor: '#ca8a04',
      unripeFruitColor: '#84cc16',
      ripeFruitColor: isEggplant ? '#581c87' : isPepper ? '#ea580c' : '#ef4444',
      ripeFruitStroke: isEggplant ? '#3b0764' : isPepper ? '#9a3412' : '#991b1b',
      fruitShape: isPepper || isEggplant ? 'elongated_pod' : 'round',
    }
  }

  return {
    ...DEFAULT_PROFILE,
    cropCode: code || 'GEN',
  }
}

export interface MicroclimateComfortResult {
  status: 'optimal' | 'marginal' | 'stress' | 'unknown'
  label: string
  tileFill: string
  tileStroke: string
  badgeBg: string
  badgeText: string
}

/**
 * Calcula el confort térmico de un Taxon dentro de un tipo de sala específico,
 * considerando el efecto microclimático de la instalación.
 */
export function evaluateMicroclimateComfort(
  taxon: Taxon | undefined,
  locationType: LocationType,
  ambientTempC = 20
): MicroclimateComfortResult {
  // Cámaras de crecimiento y laboratorios tienen control climático activo total
  if (locationType === 'growth_chamber' || locationType === 'lab') {
    return {
      status: 'optimal',
      label: 'Clima controlado óptimo',
      tileFill: '#dcfce7',
      tileStroke: '#16a34a',
      badgeBg: '#166534',
      badgeText: '#ffffff',
    }
  }

  const agro = taxon?.agronomicData
  if (!agro || (agro.optTempMin === undefined && agro.minTemp === undefined)) {
    const isProtected = locationType === 'greenhouse' || locationType === 'room' || locationType === 'bench'
    return {
      status: isProtected ? 'optimal' : 'unknown',
      label: isProtected ? 'Protección térmica activa' : 'Intemperie (sin umbrales)',
      tileFill: isProtected ? '#ecfdf5' : '#f8fafc',
      tileStroke: isProtected ? '#34d399' : '#94a3b8',
      badgeBg: isProtected ? '#065f46' : '#475569',
      badgeText: '#ffffff',
    }
  }

  const bufferDelta =
    locationType === 'greenhouse'
      ? 6
      : locationType === 'room' || locationType === 'bench'
        ? 3
        : 0

  const effectiveTemp = ambientTempC + bufferDelta
  const optMin = agro.optTempMin ?? (agro.minTemp ?? 10) + 5
  const optMax = agro.optTempMax ?? (agro.maxTemp ?? 35) - 5
  const minLimit = agro.minTemp ?? optMin - 6
  const maxLimit = agro.maxTemp ?? optMax + 8

  if (effectiveTemp >= optMin && effectiveTemp <= optMax) {
    return {
      status: 'optimal',
      label: `Confort óptimo (${Math.round(effectiveTemp)}°C)`,
      tileFill: '#dcfce7',
      tileStroke: '#16a34a',
      badgeBg: '#15803d',
      badgeText: '#ffffff',
    }
  }

  if (effectiveTemp >= minLimit && effectiveTemp <= maxLimit) {
    return {
      status: 'marginal',
      label: `Rango subóptimo (${Math.round(effectiveTemp)}°C)`,
      tileFill: '#fef9c3',
      tileStroke: '#eab308',
      badgeBg: '#a16207',
      badgeText: '#ffffff',
    }
  }

  return {
    status: 'stress',
    label: `Alerta térmica (${Math.round(effectiveTemp)}°C)`,
    tileFill: '#fee2e2',
    tileStroke: '#dc2626',
    badgeBg: '#b91c1c',
    badgeText: '#ffffff',
  }
}
