import type { Taxon, AgronomicData } from '@/domain/taxon'
import { resolveBotanicalArchetype } from '@/features/locations/isometric/botanicalArchetypes'
import { getEffectiveCropCode } from '@/domain/ontology/cropResolver'

export type PropagationFormId =
  | 'seed'
  | 'seedling'
  | 'cutting'
  | 'bulb_tuber'
  | 'offset_division'
  | 'mature_grafted'

export interface PropagationFormSpec {
  id: PropagationFormId
  label: string
  shortLabel: string
  icon: string
  description: string
  defaultBBCH: number
  createsSeedLot: boolean
  createsIndividualImmediately: boolean
  defaultTag: string
}

export type TaxonPropagationInput = Partial<
  Pick<Taxon, 'genus' | 'species' | 'family' | 'cropCode' | 'commonName'>
>

export const PROPAGATION_FORM_SPECS: Record<PropagationFormId, PropagationFormSpec> = {
  seed: {
    id: 'seed',
    icon: '🌰',
    label: 'Semillas / Sobre',
    shortLabel: 'Semillas',
    description: 'Sobre o lote de semillas para siembra directa, almácigo o conservación en banco de germoplasma.',
    defaultBBCH: 0,
    createsSeedLot: true,
    createsIndividualImmediately: false,
    defaultTag: 'semilla',
  },
  seedling: {
    id: 'seedling',
    icon: '🌱',
    label: 'Plantín (en sustrato)',
    shortLabel: 'Plantín',
    description: 'Planta joven con raíz desarrollada en sustrato, lista para trasplante o seguimiento individual.',
    defaultBBCH: 14,
    createsSeedLot: false,
    createsIndividualImmediately: true,
    defaultTag: 'plantín',
  },
  cutting: {
    id: 'cutting',
    icon: '✂️',
    label: 'Gajo / Esqueje',
    shortLabel: 'Gajo / Esqueje',
    description: 'Corte vegetativo o clon en enraizamiento o recién cortado de planta madre.',
    defaultBBCH: 10,
    createsSeedLot: false,
    createsIndividualImmediately: true,
    defaultTag: 'esqueje',
  },
  bulb_tuber: {
    id: 'bulb_tuber',
    icon: '🧅',
    label: 'Bulbo / Tubérculo',
    shortLabel: 'Bulbo / Tubérculo',
    description: 'Diente, bulbo, rizoma o tubérculo subterráneo para plantación o brotación vegetativa.',
    defaultBBCH: 5,
    createsSeedLot: false,
    createsIndividualImmediately: true,
    defaultTag: 'bulbo/tubérculo',
  },
  offset_division: {
    id: 'offset_division',
    icon: '🌿',
    label: 'Hijuelo / División de Mata',
    shortLabel: 'Hijuelo / División',
    description: 'Estolón, hijuelo basal o división de mata con raíz propia.',
    defaultBBCH: 22,
    createsSeedLot: false,
    createsIndividualImmediately: true,
    defaultTag: 'hijuelo',
  },
  mature_grafted: {
    id: 'mature_grafted',
    icon: '🌳',
    label: 'Planta Joven / Adulta',
    shortLabel: 'Planta Adulta',
    description: 'Planta ya desarrollada, ejemplar de vivero o árbol injertado.',
    defaultBBCH: 35,
    createsSeedLot: false,
    createsIndividualImmediately: true,
    defaultTag: 'planta-adulta',
  },
}

export function getPropagationFormSpec(formId: PropagationFormId): PropagationFormSpec {
  const spec = PROPAGATION_FORM_SPECS[formId]
  if (!spec) {
    throw new Error(`Unknown propagation form id: ${formId}`)
  }
  return spec
}

export const MATURE_PLANT_STAGES = [
  { bbch: 35, label: 'Vegetativa / Joven (BBCH 35)' },
  { bbch: 55, label: 'Botón floral / Pre-floración (BBCH 55)' },
  { bbch: 65, label: 'En Floración (BBCH 65)' },
  { bbch: 75, label: 'Con Frutos (BBCH 75)' },
] as const

export interface VegetativeCloneCapability {
  canClone: boolean
  formId: 'cutting' | 'offset_division' | null
  actionLabel: string
  shortNoun: string
  defaultBBCH: number
  defaultTag: string
}

// Conjuntos botánicos de clasificación biológica
const BULB_TUBER_GENERA = new Set([
  'allium',
  'ipomoea',
  'manihot',
  'zingiber',
  'curcuma',
  'colocasia',
  'dioscorea',
  'tulipa',
  'lilium',
  'gladiolus',
  'iris',
  'narcissus',
  'crocus',
])

const BULB_TUBER_CROPS = new Set([
  'POT',
  'POT_TABLE',
  'SWEET_POTATO',
  'CASSAVA',
  'ONION',
  'GARLIC',
  'LEEK',
  'CHIVE',
  'GINGER',
  'TURMERIC',
  'TARO',
  'YAM',
])

const POTATO_LIKE_CROPS = new Set([
  'POT',
  'POT_TABLE',
  'SWEET_POTATO',
  'CASSAVA',
  'TARO',
  'YAM',
])

const POTATO_LIKE_GENERA = new Set([
  'ipomoea',
  'manihot',
  'colocasia',
  'dioscorea',
])

const GINGER_LIKE_CROPS = new Set(['GINGER', 'TURMERIC'])
const GINGER_LIKE_GENERA = new Set(['zingiber', 'curcuma'])

const DIRECT_ROOT_CROPS = new Set([
  'CARROT',
  'CARROT_WILD',
  'RADISH',
  'BEETROOT',
  'TURNIP',
  'MACA',
])

const DIRECT_ROOT_GENERA = new Set([
  'daucus',
  'raphanus',
  'beta',
  'lepidium',
])

const CEREAL_SUN_CROPS = new Set([
  'MAI',
  'MAI_SWEET',
  'MAI_POP',
  'WHT',
  'WHT_DURUM',
  'RIC_INDICA',
  'RIC',
  'BAR_MALT',
  'BAR',
  'OAT',
  'RYE',
  'SGH_GRAIN',
  'TEFF',
  'SUN',
  'SUN_OIL',
  'SAFFLOWER',
])

const CEREAL_SUN_GENERA = new Set([
  'zea',
  'triticum',
  'oryza',
  'hordeum',
  'avena',
  'secale',
  'sorghum',
  'helianthus',
  'carthamus',
])

const WOODY_CROPS = new Set([
  'APPLE',
  'PEAR',
  'PEACH',
  'CHERRY',
  'PLUM',
  'APRICOT',
  'ALMOND',
  'BLUEBERRY',
  'RASPBERRY',
  'FIG',
  'POMEGRANATE',
  'KIWI',
  'AVOCADO',
  'MANGO',
  'PAPAYA',
  'CITRUS_ORANGE',
  'LEMON',
  'MANDARIN',
  'GRAPEFRUIT',
  'LIME',
  'OLIVE',
  'COFFEE',
  'CACAO',
  'TEA',
  'YERBA_MATE',
  'WALNUT',
  'PECAN',
  'GRAPE',
  'GRAPEVINE',
])

const WOODY_GENERA = new Set([
  'malus',
  'pyrus',
  'prunus',
  'citrus',
  'coffea',
  'theobroma',
  'ilex',
  'olea',
  'persea',
  'mangifera',
  'vaccinium',
  'ficus',
  'punica',
  'actinidia',
  'vitis',
])

const ROSETTE_SEED_CROPS = new Set(['LETTUCE', 'SPINACH', 'CABBAGE', 'CAN', 'MUSTARD', 'CELERY'])
const ROSETTE_SEED_GENERA = new Set(['lactuca', 'spinacia', 'brassica', 'apium'])

const GRAIN_LEGUME_CROPS = new Set([
  'SOY',
  'SOY_SHORT',
  'BEA_DRY',
  'PEA_DRY',
  'PEA_NUT',
  'LEN',
  'CHI_KABULI',
  'FABA_BEAN',
  'COWPEA',
  'MUNG_BEAN',
  'LUPIN',
  'PIGEON_PEA',
])

const GRAIN_LEGUME_GENERA = new Set([
  'glycine',
  'phaseolus',
  'pisum',
  'vicia',
  'vigna',
  'lupinus',
  'cicer',
  'lens',
  'arachis',
  'cajanus',
])

const CUCURBIT_CROPS = new Set([
  'SQUASH',
  'ZUCCHINI',
  'CUCUMBER',
  'MELON',
  'WATERMELON',
])

const CUCURBIT_GENERA = new Set([
  'cucurbita',
  'cucumis',
  'citrullus',
])

/**
 * Personaliza un PropagationFormSpec según el contexto botánico específico del taxón.
 */
function contextualizeSpec(
  formId: PropagationFormId,
  taxon?: TaxonPropagationInput | null,
  options?: { isWoody?: boolean }
): PropagationFormSpec {
  const base = PROPAGATION_FORM_SPECS[formId]
  if (!taxon) return { ...base }

  const genus = (taxon.genus || '').trim().toLowerCase()
  const species = (taxon.species || '').trim().toLowerCase()
  const code = (taxon.cropCode || getEffectiveCropCode(taxon) || '').trim().toUpperCase()

  if (formId === 'bulb_tuber') {
    // Caso Ajo
    if (code === 'GARLIC' || (genus === 'allium' && species === 'sativum')) {
      return {
        ...base,
        icon: '🧄',
        label: 'Diente / Bulbo / Tubérculo',
        shortLabel: 'Diente / Bulbo',
      }
    }

    // Caso Papa / Batata / Mandioca / Taro / Ñame
    if (
      POTATO_LIKE_CROPS.has(code) ||
      POTATO_LIKE_GENERA.has(genus) ||
      (genus === 'solanum' && species === 'tuberosum')
    ) {
      return {
        ...base,
        icon: '🥔',
        label: 'Tubérculo / Bulbo',
        shortLabel: 'Tubérculo',
      }
    }

    // Caso Jengibre / Cúrcuma
    if (GINGER_LIKE_CROPS.has(code) || GINGER_LIKE_GENERA.has(genus)) {
      return {
        ...base,
        icon: '🫚',
        label: 'Rizoma / Tubérculo',
        shortLabel: 'Rizoma',
      }
    }

    return { ...base }
  }

  if (formId === 'offset_division') {
    // Caso Frutilla
    if (code === 'STRAWBERRY' || code === 'BERRY' || genus === 'fragaria') {
      return {
        ...base,
        icon: '🍓',
        label: 'Estolón / Hijuelo',
        shortLabel: 'Estolón',
      }
    }

    // Caso Alcachofa, Banano, Piña, Agave, Aloe o Aromáticas en mata
    return {
      ...base,
      icon: '🌿',
      label: 'Hijuelo / División de Mata',
      shortLabel: 'Hijuelo / División',
      defaultTag: 'hijuelo',
    }
  }

  if (formId === 'mature_grafted') {
    if (options?.isWoody) {
      return {
        ...base,
        icon: '🌳',
        label: 'Árbol de Vivero / Injerto',
        shortLabel: 'Vivero / Injerto',
        defaultTag: 'injerto',
      }
    }

    return {
      ...base,
      icon: '🌳',
      label: 'Planta Joven / Adulta',
      shortLabel: 'Planta Adulta',
      defaultTag: 'planta-adulta',
    }
  }

  return { ...base }
}

/**
 * Obtiene la lista de formatos de propagación compatibles con un taxón específico,
 * ordenados biológicamente por idoneidad recomendada y con etiquetas contextuales dinámicas.
 */
export function getCompatiblePropagationForms(
  taxon?: TaxonPropagationInput | null
): PropagationFormSpec[] {
  // Si no hay taxón definido, ofrecemos los formatos convencionales excepto bulbo/tubérculo
  if (!taxon) {
    return [
      PROPAGATION_FORM_SPECS.seed,
      PROPAGATION_FORM_SPECS.seedling,
      PROPAGATION_FORM_SPECS.cutting,
    ]
  }

  const genus = (taxon.genus || '').trim().toLowerCase()
  const species = (taxon.species || '').trim().toLowerCase()
  const family = (taxon.family || '').trim().toLowerCase()
  const code = (taxon.cropCode || getEffectiveCropCode(taxon) || '').trim().toUpperCase()
  const profile = resolveBotanicalArchetype(
    taxon
      ? {
          family: taxon.family ?? '',
          genus: taxon.genus ?? '',
          species: taxon.species ?? '',
          cropCode: taxon.cropCode,
          commonName: taxon.commonName,
        }
      : null
  )

  const spec = (formId: PropagationFormId, isWoody = false) =>
    contextualizeSpec(formId, taxon, { isWoody })

  // 1. Caso Frutilla (reproducción por estolones / hijuelos)
  const isStrawberry =
    code === 'STRAWBERRY' ||
    code === 'BERRY' ||
    genus === 'fragaria'

  if (isStrawberry) {
    return [
      spec('seedling'),
      spec('offset_division'),
      spec('mature_grafted'),
      spec('seed'),
    ]
  }

  // 2. Caso Banano, Alcachofa, Piña, Agave, Aloe (herbáceas o suculentas de hijuelos/división sin corte aéreo convencional)
  const isOffsetClonalHerb =
    code === 'BANANA' ||
    genus === 'musa' ||
    code === 'ARTICHOKE' ||
    genus === 'cynara' ||
    code === 'PINEAPPLE' ||
    genus === 'ananas' ||
    code === 'AGAVE' ||
    genus === 'agave' ||
    genus === 'aloe'

  if (isOffsetClonalHerb) {
    return [
      spec('seedling'),
      spec('offset_division'),
      spec('mature_grafted'),
      spec('seed'),
    ]
  }

  // 3. Especies de Bulbo / Tubérculo / Rizoma vegetativo
  const isBulbTuber =
    BULB_TUBER_GENERA.has(genus) ||
    BULB_TUBER_CROPS.has(code) ||
    (genus === 'solanum' && species === 'tuberosum')

  if (isBulbTuber) {
    const isSweetPotatoOrCassava =
      genus === 'ipomoea' ||
      genus === 'manihot' ||
      code === 'SWEET_POTATO' ||
      code === 'CASSAVA'

    if (isSweetPotatoOrCassava) {
      return [
        spec('bulb_tuber'),
        spec('seedling'),
        spec('cutting'),
        spec('seed'),
        spec('mature_grafted'),
      ]
    }

    const isChive = code === 'CHIVE' || (genus === 'allium' && species.includes('schoenoprasum'))
    if (isChive) {
      return [
        spec('bulb_tuber'),
        spec('offset_division'),
        spec('seedling'),
        spec('seed'),
        spec('mature_grafted'),
      ]
    }

    return [
      spec('bulb_tuber'),
      spec('seedling'),
      spec('seed'),
      spec('mature_grafted'),
    ]
  }

  // 4. Leñosas y Frutales Perennes (woody_perennial)
  const isWoody =
    (profile.archetype === 'woody_perennial' && code !== 'BANANA' && genus !== 'musa') ||
    WOODY_CROPS.has(code) ||
    WOODY_GENERA.has(genus)

  if (isWoody) {
    return [
      spec('seedling', true),
      spec('mature_grafted', true),
      spec('cutting', true),
      spec('seed', true),
    ]
  }

  // 5. Raíces de siembra directa (no forman bulbo de propagación ni esqueje)
  if (DIRECT_ROOT_CROPS.has(code) || DIRECT_ROOT_GENERA.has(genus)) {
    return [
      spec('seed'),
      spec('seedling'),
      spec('mature_grafted'),
    ]
  }

  // 6. Cereales / Gramíneas y Capítulo Solar
  if (code === 'SUG_CANE' || genus === 'saccharum') {
    return [
      spec('cutting'),
      spec('seedling'),
      spec('seed'),
      spec('mature_grafted'),
    ]
  }

  const isCerealOrSun =
    profile.archetype === 'cereal_grass' ||
    profile.archetype === 'heliotropo_tall' ||
    CEREAL_SUN_CROPS.has(code) ||
    CEREAL_SUN_GENERA.has(genus) ||
    family.includes('poaceae') ||
    family.includes('gramin')

  if (isCerealOrSun) {
    if (code === 'LEMONGRASS' || genus === 'cymbopogon') {
      return [
        spec('seedling'),
        spec('offset_division'),
        spec('seed'),
        spec('mature_grafted'),
      ]
    }

    return [
      spec('seed'),
      spec('seedling'),
      spec('mature_grafted'),
    ]
  }

  // 7. Hortalizas de Hoja / Roseta (rosette_leafy)
  const isRosetteLeafy =
    profile.archetype === 'rosette_leafy' ||
    ROSETTE_SEED_CROPS.has(code) ||
    ROSETTE_SEED_GENERA.has(genus) ||
    family.includes('brassic') ||
    (family.includes('aster') && genus === 'lactuca')

  if (isRosetteLeafy) {
    return [
      spec('seed'),
      spec('seedling'),
      spec('mature_grafted'),
    ]
  }

  // 8. Solanáceas de fruto, Enredaderas, Leguminosas de grano, Cucurbitáceas y Herbáceas
  const isGrainLegumeOrCucurbit =
    GRAIN_LEGUME_CROPS.has(code) ||
    GRAIN_LEGUME_GENERA.has(genus) ||
    CUCURBIT_CROPS.has(code) ||
    CUCURBIT_GENERA.has(genus) ||
    family.includes('cucurbit')

  if (isGrainLegumeOrCucurbit) {
    return [
      spec('seed'),
      spec('seedling'),
      spec('mature_grafted'),
    ]
  }

  // 9. Aromáticas de mata con hijuelo/división y esqueje (Menta, Orégano)
  const isClumpingAromatic =
    code === 'MINT' ||
    code === 'OREGANO' ||
    genus === 'mentha' ||
    genus === 'origanum'

  if (isClumpingAromatic) {
    return [
      spec('seedling'),
      spec('cutting'),
      spec('offset_division'),
      spec('seed'),
      spec('mature_grafted'),
    ]
  }

  // 10. Tomate, Pimiento, Berenjena, Cannabis/Cáñamo, Lúpulo, Vid, Maracuyá, Aromáticas y general
  return [
    spec('seed'),
    spec('seedling'),
    spec('cutting'),
    spec('mature_grafted'),
  ]
}

/**
 * Determina si la especie admite reproducción vegetativa asexual (clonación directa)
 * y retorna la configuración y nomenclatura adecuada ('cutting' o 'offset_division').
 */
export function getVegetativeCloneCapability(
  taxon?: TaxonPropagationInput | null
): VegetativeCloneCapability {
  if (!taxon) {
    return {
      canClone: false,
      formId: null,
      actionLabel: '',
      shortNoun: '',
      defaultBBCH: 0,
      defaultTag: '',
    }
  }

  const forms = getCompatiblePropagationForms(taxon)
  const hasCutting = forms.some(f => f.id === 'cutting')
  const hasOffsetDivision = forms.some(f => f.id === 'offset_division')

  if (hasCutting) {
    return {
      canClone: true,
      formId: 'cutting',
      actionLabel: 'Sacar Esqueje / Gajo',
      shortNoun: 'Esqueje',
      defaultBBCH: 10,
      defaultTag: 'esqueje',
    }
  }

  if (hasOffsetDivision) {
    return {
      canClone: true,
      formId: 'offset_division',
      actionLabel: 'Sacar Hijuelo / Estolón',
      shortNoun: 'Hijuelo',
      defaultBBCH: 22,
      defaultTag: 'hijuelo',
    }
  }

  return {
    canClone: false,
    formId: null,
    actionLabel: '',
    shortNoun: '',
    defaultBBCH: 0,
    defaultTag: '',
  }
}

/**
 * Helper para verificar si un formato de propagación específico es compatible con un taxón.
 */
export function isPropagationFormCompatible(
  taxon: TaxonPropagationInput | null | undefined,
  formId: PropagationFormId
): boolean {
  return getCompatiblePropagationForms(taxon).some(f => f.id === formId)
}

export interface StarterSpeciesPreset extends Taxon {
  id: string
  family: string
  genus: string
  species: string
  commonName: string
  cropCode: string
  agronomicData: AgronomicData
  badge?: string
  imageUrl?: string
}

export const STARTER_SPECIES_PRESETS: StarterSpeciesPreset[] = [
  {
    id: 'preset-tom',
    commonName: 'Tomate',
    family: 'Solanaceae',
    genus: 'Solanum',
    species: 'lycopersicum',
    cropCode: 'TOM',
    badge: 'Fruto',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Tomato_je.jpg',
    agronomicData: {
      minTemp: 7,
      maxTemp: 35,
      optTempMin: 20,
      optTempMax: 27,
      optPhMin: 5.5,
      optPhMax: 6.8,
      phMinimum: 5,
      phMaximum: 7.5,
      rainfallMin: 400,
      rainfallMax: 1800,
      cycleDaysMin: 70,
      cycleDaysMax: 150,
      sources: {
        minTemp: 'ecocrop',
        maxTemp: 'ecocrop',
        optTempMin: 'ecocrop',
        optTempMax: 'ecocrop',
        optPhMin: 'ecocrop',
        optPhMax: 'ecocrop',
        phMinimum: 'ecocrop',
        phMaximum: 'ecocrop',
        rainfallMin: 'ecocrop',
        rainfallMax: 'ecocrop',
        cycleDaysMin: 'ecocrop',
        cycleDaysMax: 'ecocrop',
      },
    },
  },
  {
    id: 'preset-pepper',
    commonName: 'Pimiento / Morrón',
    family: 'Solanaceae',
    genus: 'Capsicum',
    species: 'annuum',
    cropCode: 'PEPPER_SWEET',
    badge: 'Fruto',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Red_bell_pepper.jpg',
    agronomicData: {
      minTemp: 8,
      maxTemp: 35,
      optTempMin: 17,
      optTempMax: 30,
      optPhMin: 5.5,
      optPhMax: 6.8,
      phMinimum: 4.5,
      phMaximum: 7,
      rainfallMin: 500,
      rainfallMax: 1700,
      cycleDaysMin: 60,
      cycleDaysMax: 180,
      sources: {
        minTemp: 'ecocrop',
        maxTemp: 'ecocrop',
        optTempMin: 'ecocrop',
        optTempMax: 'ecocrop',
        optPhMin: 'ecocrop',
        optPhMax: 'ecocrop',
        phMinimum: 'ecocrop',
        phMaximum: 'ecocrop',
        rainfallMin: 'ecocrop',
        rainfallMax: 'ecocrop',
        cycleDaysMin: 'ecocrop',
        cycleDaysMax: 'ecocrop',
      },
    },
  },
  {
    id: 'preset-lettuce',
    commonName: 'Lechuga',
    family: 'Asteraceae',
    genus: 'Lactuca',
    species: 'sativa',
    cropCode: 'LETTUCE',
    badge: 'Hoja',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Iceberg_lettuce_in_SB.jpg',
    agronomicData: {
      minTemp: 5,
      maxTemp: 30,
      optTempMin: 12,
      optTempMax: 21,
      killTemp: 0,
      optPhMin: 6,
      optPhMax: 7,
      phMinimum: 4.2,
      phMaximum: 7.5,
      rainfallMin: 900,
      rainfallMax: 4100,
      cycleDaysMin: 35,
      cycleDaysMax: 85,
      sources: {
        minTemp: 'ecocrop',
        maxTemp: 'ecocrop',
        optTempMin: 'ecocrop',
        optTempMax: 'ecocrop',
        killTemp: 'ecocrop',
        optPhMin: 'ecocrop',
        optPhMax: 'ecocrop',
        phMinimum: 'ecocrop',
        phMaximum: 'ecocrop',
        rainfallMin: 'ecocrop',
        rainfallMax: 'ecocrop',
        cycleDaysMin: 'ecocrop',
        cycleDaysMax: 'ecocrop',
      },
    },
  },
  {
    id: 'preset-squash',
    commonName: 'Zapallo',
    family: 'Cucurbitaceae',
    genus: 'Cucurbita',
    species: 'maxima',
    cropCode: 'SQUASH',
    badge: 'Cucúrbita',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Cucurbita_maxima_Babosa_1.jpg',
    agronomicData: {
      minTemp: 9,
      maxTemp: 38,
      optTempMin: 20,
      optTempMax: 30,
      optPhMin: 5.5,
      optPhMax: 7.5,
      phMinimum: 5,
      phMaximum: 8.5,
      rainfallMin: 450,
      rainfallMax: 2700,
      cycleDaysMin: 80,
      cycleDaysMax: 140,
      sources: {
        minTemp: 'ecocrop',
        maxTemp: 'ecocrop',
        optTempMin: 'ecocrop',
        optTempMax: 'ecocrop',
        optPhMin: 'ecocrop',
        optPhMax: 'ecocrop',
        phMinimum: 'ecocrop',
        phMaximum: 'ecocrop',
        rainfallMin: 'ecocrop',
        rainfallMax: 'ecocrop',
        cycleDaysMin: 'ecocrop',
        cycleDaysMax: 'ecocrop',
      },
    },
  },
  {
    id: 'preset-corn',
    commonName: 'Maíz',
    family: 'Poaceae',
    genus: 'Zea',
    species: 'mays',
    cropCode: 'MAI',
    badge: 'Cereal',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Corn_cobs.jpg',
    agronomicData: {
      minTemp: 10,
      maxTemp: 47,
      optTempMin: 18,
      optTempMax: 33,
      optPhMin: 5,
      optPhMax: 7,
      phMinimum: 4.5,
      phMaximum: 8.5,
      rainfallMin: 400,
      rainfallMax: 1800,
      cycleDaysMin: 65,
      cycleDaysMax: 365,
      sources: {
        minTemp: 'ecocrop',
        maxTemp: 'ecocrop',
        optTempMin: 'ecocrop',
        optTempMax: 'ecocrop',
        optPhMin: 'ecocrop',
        optPhMax: 'ecocrop',
        phMinimum: 'ecocrop',
        phMaximum: 'ecocrop',
        rainfallMin: 'ecocrop',
        rainfallMax: 'ecocrop',
        cycleDaysMin: 'ecocrop',
        cycleDaysMax: 'ecocrop',
      },
    },
  },
  {
    id: 'preset-carrot',
    commonName: 'Zanahoria',
    family: 'Apiaceae',
    genus: 'Daucus',
    species: 'carota',
    cropCode: 'CARROT',
    badge: 'Raíz',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Carrots.jpg',
    agronomicData: {
      minTemp: 3,
      maxTemp: 30,
      optTempMin: 15,
      optTempMax: 24,
      killTemp: 0,
      optPhMin: 5.8,
      optPhMax: 6.8,
      phMinimum: 4.2,
      phMaximum: 8.7,
      rainfallMin: 400,
      rainfallMax: 4000,
      cycleDaysMin: 40,
      cycleDaysMax: 150,
      sources: {
        minTemp: 'ecocrop',
        maxTemp: 'ecocrop',
        optTempMin: 'ecocrop',
        optTempMax: 'ecocrop',
        killTemp: 'ecocrop',
        optPhMin: 'ecocrop',
        optPhMax: 'ecocrop',
        phMinimum: 'ecocrop',
        phMaximum: 'ecocrop',
        rainfallMin: 'ecocrop',
        rainfallMax: 'ecocrop',
        cycleDaysMin: 'ecocrop',
        cycleDaysMax: 'ecocrop',
      },
    },
  },
  {
    id: 'preset-orange',
    commonName: 'Naranjo Dulce',
    family: 'Rutaceae',
    genus: 'Citrus',
    species: 'sinensis',
    cropCode: 'CITRUS_ORANGE',
    badge: 'Cítrico',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Orange-Fruit-Pieces.jpg',
    agronomicData: {
      minTemp: 13,
      maxTemp: 38,
      optTempMin: 20,
      optTempMax: 30,
      killTemp: 0,
      optPhMin: 5,
      optPhMax: 6,
      phMinimum: 4,
      phMaximum: 8.3,
      rainfallMin: 450,
      rainfallMax: 2700,
      cycleDaysMin: 180,
      cycleDaysMax: 365,
      sources: {
        minTemp: 'ecocrop',
        maxTemp: 'ecocrop',
        optTempMin: 'ecocrop',
        optTempMax: 'ecocrop',
        killTemp: 'ecocrop',
        optPhMin: 'ecocrop',
        optPhMax: 'ecocrop',
        phMinimum: 'ecocrop',
        phMaximum: 'ecocrop',
        rainfallMin: 'ecocrop',
        rainfallMax: 'ecocrop',
        cycleDaysMin: 'ecocrop',
        cycleDaysMax: 'ecocrop',
      },
    },
  },
  {
    id: 'preset-potato',
    commonName: 'Papa / Patata',
    family: 'Solanaceae',
    genus: 'Solanum',
    species: 'tuberosum',
    cropCode: 'POT',
    badge: 'Tubérculo',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Patates.jpg',
    agronomicData: {
      minTemp: 7,
      maxTemp: 30,
      optTempMin: 15,
      optTempMax: 25,
      killTemp: 0,
      optPhMin: 5,
      optPhMax: 6.2,
      phMinimum: 4.2,
      phMaximum: 8.5,
      rainfallMin: 250,
      rainfallMax: 2000,
      cycleDaysMin: 90,
      cycleDaysMax: 160,
      sources: {
        minTemp: 'ecocrop',
        maxTemp: 'ecocrop',
        optTempMin: 'ecocrop',
        optTempMax: 'ecocrop',
        killTemp: 'ecocrop',
        optPhMin: 'ecocrop',
        optPhMax: 'ecocrop',
        phMinimum: 'ecocrop',
        phMaximum: 'ecocrop',
        rainfallMin: 'ecocrop',
        rainfallMax: 'ecocrop',
        cycleDaysMin: 'ecocrop',
        cycleDaysMax: 'ecocrop',
      },
    },
  },
  {
    id: 'preset-garlic',
    commonName: 'Ajo',
    family: 'Amaryllidaceae',
    genus: 'Allium',
    species: 'sativum',
    cropCode: 'GARLIC',
    badge: 'Aliácea',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Garlic_cloves.jpg',
    agronomicData: {
      minTemp: 7,
      maxTemp: 35,
      optTempMin: 18,
      optTempMax: 30,
      killTemp: -5,
      optPhMin: 6,
      optPhMax: 6.6,
      phMinimum: 5,
      phMaximum: 8.5,
      rainfallMin: 500,
      rainfallMax: 2700,
      cycleDaysMin: 90,
      cycleDaysMax: 120,
      sources: {
        minTemp: 'ecocrop',
        maxTemp: 'ecocrop',
        optTempMin: 'ecocrop',
        optTempMax: 'ecocrop',
        killTemp: 'ecocrop',
        optPhMin: 'ecocrop',
        optPhMax: 'ecocrop',
        phMinimum: 'ecocrop',
        phMaximum: 'ecocrop',
        rainfallMin: 'ecocrop',
        rainfallMax: 'ecocrop',
        cycleDaysMin: 'ecocrop',
        cycleDaysMax: 'ecocrop',
      },
    },
  },
  {
    id: 'preset-hemp',
    commonName: 'Cáñamo / Cannabis',
    family: 'Cannabaceae',
    genus: 'Cannabis',
    species: 'sativa',
    cropCode: 'HEMP',
    badge: 'Industrial',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Cannabis_sativa_Koehler.jpg',
    agronomicData: {
      minTemp: 6,
      maxTemp: 32,
      optTempMin: 15,
      optTempMax: 28,
      optPhMin: 6,
      optPhMax: 7,
      phMinimum: 4.5,
      phMaximum: 8.2,
      rainfallMin: 350,
      rainfallMax: 4000,
      cycleDaysMin: 90,
      cycleDaysMax: 170,
      sources: {
        minTemp: 'ecocrop',
        maxTemp: 'ecocrop',
        optTempMin: 'ecocrop',
        optTempMax: 'ecocrop',
        optPhMin: 'ecocrop',
        optPhMax: 'ecocrop',
        phMinimum: 'ecocrop',
        phMaximum: 'ecocrop',
        rainfallMin: 'ecocrop',
        rainfallMax: 'ecocrop',
        cycleDaysMin: 'ecocrop',
        cycleDaysMax: 'ecocrop',
      },
    },
  },
]
