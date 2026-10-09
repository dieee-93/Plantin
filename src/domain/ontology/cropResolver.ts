export interface CropResolutionInput {
  genus?: string
  species?: string
  commonName?: string
  family?: string
}

export type ResolutionConfidence = 'exact' | 'synonym' | 'genus'

export interface ResolvedCrop {
  cropCode: string
  cropName: string
  confidence: ResolutionConfidence
  notes?: string
}

/**
 * Nivel 1: Mapeo exacto por binomio científico (género_especie normalizado)
 */
const CANONICAL_SPECIES_MAP: Record<string, { cropCode: string; cropName: string }> = {
  // Solanáceas
  'solanum_lycopersicum':   { cropCode: 'TOM', cropName: 'Tomate' },
  'solanum_tuberosum':      { cropCode: 'POT', cropName: 'Papa / Patata' },
  'solanum_melongena':      { cropCode: 'EGGPLANT', cropName: 'Berenjena' },
  'capsicum_annuum':        { cropCode: 'PEPPER_SWEET', cropName: 'Pimiento / Morrón' },
  'capsicum_chinense':      { cropCode: 'PEPPER_HOT', cropName: 'Ají / Habanero' },
  'capsicum_baccatum':      { cropCode: 'PEPPER_HOT', cropName: 'Ají Criollo / Escabeche' },
  'capsicum_frutescens':    { cropCode: 'PEPPER_HOT', cropName: 'Tabasco / Ají' },

  // Poáceas / Cereales
  'zea_mays':               { cropCode: 'MAI', cropName: 'Maíz' },
  'triticum_aestivum':      { cropCode: 'WHT', cropName: 'Trigo Pan' },
  'triticum_durum':         { cropCode: 'WHT_DURUM', cropName: 'Trigo Candeal' },
  'oryza_sativa':           { cropCode: 'RIC_INDICA', cropName: 'Arroz' },
  'hordeum_vulgare':        { cropCode: 'BAR_MALT', cropName: 'Cebada' },
  'avena_sativa':           { cropCode: 'OAT', cropName: 'Avena' },
  'secale_cereale':         { cropCode: 'RYE', cropName: 'Centeno' },
  'sorghum_bicolor':        { cropCode: 'SGH_GRAIN', cropName: 'Sorgo' },

  // Leguminosas
  'glycine_max':            { cropCode: 'SOY', cropName: 'Soja' },
  'phaseolus_vulgaris':     { cropCode: 'BEA_DRY', cropName: 'Poroto / Frijol' },
  'phaseolus_lunatus':      { cropCode: 'BEA_DRY', cropName: 'Pallar' },
  'pisum_sativum':          { cropCode: 'PEA_DRY', cropName: 'Arveja / Guisante' },
  'arachis_hypogaea':       { cropCode: 'PEA_NUT', cropName: 'Maní / Cacahuate' },
  'lens_culinaris':         { cropCode: 'LEN', cropName: 'Lenteja' },
  'cicer_arietinum':        { cropCode: 'CHI_KABULI', cropName: 'Garbanzo' },

  // Aliáceas y Raíces / Tubérculos
  'allium_cepa':            { cropCode: 'ONION', cropName: 'Cebolla' },
  'allium_sativum':         { cropCode: 'GARLIC', cropName: 'Ajo' },
  'allium_porrum':          { cropCode: 'LEEK', cropName: 'Puerro' },
  'allium_schoenoprasum':   { cropCode: 'CHIVE', cropName: 'Ciboulette / Cebollino' },
  'daucus_carota':          { cropCode: 'CARROT', cropName: 'Zanahoria' },
  'ipomoea_batatas':        { cropCode: 'SWEET_POTATO', cropName: 'Batata / Camote' },
  'manihot_esculenta':      { cropCode: 'CASSAVA', cropName: 'Mandioca / Yuca' },

  // Hortalizas de Hoja y Brássicas
  'lactuca_sativa':         { cropCode: 'LETTUCE', cropName: 'Lechuga' },
  'spinacia_oleracea':      { cropCode: 'SPINACH', cropName: 'Espinaca' },
  'brassica_oleracea':      { cropCode: 'CABBAGE', cropName: 'Col / Repollo / Brócoli' },
  'brassica_napus':         { cropCode: 'CAN', cropName: 'Colza / Canola' },
  'brassica_rapa':          { cropCode: 'TURNIP', cropName: 'Nabo' },
  'raphanus_sativus':       { cropCode: 'RADISH', cropName: 'Rábano' },
  'beta_vulgaris':          { cropCode: 'BEETROOT', cropName: 'Remolacha' },
  'apium_graveolens':       { cropCode: 'CELERY', cropName: 'Apio' },
  'cynara_cardunculus':     { cropCode: 'ARTICHOKE', cropName: 'Alcachofa' },

  // Cucurbitáceas
  'cucumis_sativus':        { cropCode: 'CUCUMBER', cropName: 'Pepino' },
  'cucumis_melo':           { cropCode: 'MELON', cropName: 'Melón' },
  'citrullus_lanatus':      { cropCode: 'WATERMELON', cropName: 'Sandía' },
  'cucurbita_pepo':         { cropCode: 'ZUCCHINI', cropName: 'Calabacín / Zucchini' },
  'cucurbita_maxima':       { cropCode: 'SQUASH', cropName: 'Zapallo' },
  'cucurbita_moschata':     { cropCode: 'SQUASH', cropName: 'Calabaza anco' },

  // Frutales y Berries
  'malus_domestica':        { cropCode: 'APPLE', cropName: 'Manzano' },
  'pyrus_communis':         { cropCode: 'PEAR', cropName: 'Peral' },
  'prunus_persica':         { cropCode: 'PEACH', cropName: 'Duraznero / Melocotonero' },
  'prunus_avium':           { cropCode: 'CHERRY', cropName: 'Cerezo' },
  'prunus_dulcis':          { cropCode: 'ALMOND', cropName: 'Almendro' },
  'prunus_domestica':       { cropCode: 'PLUM', cropName: 'Ciruelo' },
  'fragaria_x_ananassa':    { cropCode: 'STRAWBERRY', cropName: 'Frutilla / Fresa' },
  'fragaria_vesca':         { cropCode: 'STRAWBERRY', cropName: 'Frutilla Silvestre' },
  'vaccinium_corymbosum':   { cropCode: 'BLUEBERRY', cropName: 'Arándano' },
  'rubus_idaeus':           { cropCode: 'RASPBERRY', cropName: 'Frambuesa' },
  'vitis_vinifera':         { cropCode: 'GRAPE', cropName: 'Vid / Uva' },

  // Cítricos
  'citrus_sinensis':        { cropCode: 'CITRUS_ORANGE', cropName: 'Naranjo dulce' },
  'citrus_limon':           { cropCode: 'LEMON', cropName: 'Limonero' },
  'citrus_reticulata':      { cropCode: 'MANDARIN', cropName: 'Mandarino' },
  'citrus_paradisi':        { cropCode: 'GRAPEFRUIT', cropName: 'Pomelo' },
  'citrus_aurantifolia':    { cropCode: 'LIME', cropName: 'Limonero sutil / Lima' },

  // Oleaginosas y Forrajeras
  'helianthus_annuus':      { cropCode: 'SUN_OIL', cropName: 'Girasol' },
  'medicago_sativa':        { cropCode: 'ALF', cropName: 'Alfalfa' },
  'trifolium_repens':       { cropCode: 'CLO', cropName: 'Trébol Blanco' },
  'trifolium_pratense':     { cropCode: 'CLO', cropName: 'Trébol Rojo' },

  // Aromáticas y Especias
  'ocimum_basilicum':       { cropCode: 'BASIL', cropName: 'Albahaca' },
  'mentha_piperita':        { cropCode: 'MINT', cropName: 'Menta' },
  'coriandrum_sativum':     { cropCode: 'CORIANDER', cropName: 'Cilantro' },
  'chenopodium_quinoa':     { cropCode: 'QUI', cropName: 'Quinua' },
  'amaranthus_cruentus':    { cropCode: 'AMA', cropName: 'Amaranto' },
  'sesamum_indicum':        { cropCode: 'SES', cropName: 'Sésamo' },
}

/**
 * Nivel 2: Sinónimos botánicos antiguos o nombres alternativos comunes
 */
const BOTANICAL_SYNONYMS: Record<string, { cropCode: string; cropName: string }> = {
  'lycopersicon_esculentum': { cropCode: 'TOM', cropName: 'Tomate' },
  'lycopersicon_pimpinellifolium': { cropCode: 'TOM', cropName: 'Tomate Silvestre' },
  'solanum_esculentum': { cropCode: 'TOM', cropName: 'Tomate' },
  'zea_saccharata': { cropCode: 'MAI_SWEET', cropName: 'Maíz Dulce' },
  'zea_indurata': { cropCode: 'MAI_POP', cropName: 'Maíz Pisingallo' },
  'solanum_betaceum': { cropCode: 'TOM', cropName: 'Tomate de Árbol / Chilto' },
}

/**
 * Nivel 3: Parientes silvestres por Género (CWR - Crop Wild Relatives)
 * Se aplica si el binomio específico no tuvo match exacto, pero pertenece
 * a un género agrícola emblemático con ontología establecida.
 */
const GENUS_FALLBACK_MAP: Record<string, { cropCode: string; cropName: string; label: string }> = {
  'solanum':    { cropCode: 'TOM', cropName: 'Tomate', label: 'Pariente silvestre de Solanum (afín a Tomate)' },
  'capsicum':   { cropCode: 'PEPPER_SWEET', cropName: 'Pimiento', label: 'Pariente silvestre de Capsicum' },
  'zea':        { cropCode: 'MAI', cropName: 'Maíz', label: 'Pariente silvestre de Maíz (Teosinte/Zea)' },
  'triticum':   { cropCode: 'WHT', cropName: 'Trigo', label: 'Pariente silvestre de Trigo' },
  'oryza':      { cropCode: 'RIC_INDICA', cropName: 'Arroz', label: 'Pariente silvestre de Arroz' },
  'hordeum':    { cropCode: 'BAR_MALT', cropName: 'Cebada', label: 'Pariente silvestre de Cebada' },
  'phaseolus':  { cropCode: 'BEA_DRY', cropName: 'Poroto / Frijol', label: 'Pariente silvestre de Poroto' },
  'allium':     { cropCode: 'ONION', cropName: 'Cebolla', label: 'Pariente silvestre de Allium' },
  'brassica':   { cropCode: 'CABBAGE', cropName: 'Brássica', label: 'Especie del género Brassica' },
  'cucumis':    { cropCode: 'CUCUMBER', cropName: 'Cucumis', label: 'Pariente silvestre de Cucumis' },
  'cucurbita':  { cropCode: 'SQUASH', cropName: 'Cucúrbita', label: 'Pariente silvestre de Calabaza/Zapallo' },
  'citrus':     { cropCode: 'CITRUS_ORANGE', cropName: 'Cítrico', label: 'Especie del género Citrus' },
  'malus':      { cropCode: 'APPLE', cropName: 'Manzano', label: 'Pariente silvestre de Manzano' },
  'fragaria':   { cropCode: 'STRAWBERRY', cropName: 'Frutilla', label: 'Pariente silvestre de Fragaria' },
  'helianthus': { cropCode: 'SUN_OIL', cropName: 'Girasol', label: 'Pariente silvestre de Girasol' },
}

/**
 * Resuelve la ontología agronómica correspondiente en 3 niveles biológicos.
 * Retorna null si la especie no tiene ontología específica registrada (sin fallback universal forzado).
 */
export function resolveCropOntology(input: CropResolutionInput): ResolvedCrop | null {
  const genus = input.genus?.trim().toLowerCase()
  const species = input.species?.trim().toLowerCase()

  if (!genus && !species) {
    return null
  }

  // 1. Nivel 1: Binomio canónico exacto
  if (genus && species) {
    const key = `${genus}_${species}`
    if (CANONICAL_SPECIES_MAP[key]) {
      const match = CANONICAL_SPECIES_MAP[key]
      return {
        cropCode: match.cropCode,
        cropName: match.cropName,
        confidence: 'exact',
      }
    }

    // 2. Nivel 2: Sinónimos botánicos
    if (BOTANICAL_SYNONYMS[key]) {
      const match = BOTANICAL_SYNONYMS[key]
      return {
        cropCode: match.cropCode,
        cropName: match.cropName,
        confidence: 'synonym',
        notes: `Sinónimo botánico de ${match.cropName}`,
      }
    }
  }

  // 3. Nivel 3: Pariente silvestre emparentado por Género
  if (genus && GENUS_FALLBACK_MAP[genus]) {
    const match = GENUS_FALLBACK_MAP[genus]
    return {
      cropCode: match.cropCode,
      cropName: match.cropName,
      confidence: 'genus',
      notes: match.label,
    }
  }

  // Sin match en ontología (sin Nivel 4)
  return null
}
