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
  'physalis_philadelphica': { cropCode: 'TOMATILLO', cropName: 'Tomatillo Verde' },
  'nicotiana_tabacum':      { cropCode: 'TOBACCO', cropName: 'Tabaco' },
  'nicotiana_rustica':      { cropCode: 'TOBACCO', cropName: 'Tabaco Rústico' },

  // Cannabáceas e Industriales
  'cannabis_sativa':        { cropCode: 'HEMP', cropName: 'Cáñamo / Cannabis' },
  'cannabis_indica':        { cropCode: 'HEMP', cropName: 'Cannabis medicinal / Índica' },
  'cannabis_ruderalis':     { cropCode: 'HEMP', cropName: 'Cannabis silvestre / Ruderalis' },
  'humulus_lupulus':        { cropCode: 'HOPS', cropName: 'Lúpulo' },
  'agave_tequilana':        { cropCode: 'AGAVE', cropName: 'Agave Azul / Tequilero' },
  'agave_sisalana':         { cropCode: 'SISAL', cropName: 'Sisal' },
  'hevea_brasiliensis':     { cropCode: 'RUBBER', cropName: 'Árbol del Caucho' },
  'lepidium_meyenii':       { cropCode: 'MACA', cropName: 'Maca' },
  'panax_ginseng':          { cropCode: 'GINSENG', cropName: 'Ginseng' },
  'parthenium_argentatum':  { cropCode: 'GUAYULE', cropName: 'Guayule' },
  'jatropha_curcas':        { cropCode: 'JATROPHA', cropName: 'Jatrofa' },
  'corchorus_olitorius':    { cropCode: 'JUTE', cropName: 'Yute' },
  'corchorus_capsularis':   { cropCode: 'JUTE', cropName: 'Yute Blanco' },

  // Estimulantes y Bebidas
  'coffea_arabica':         { cropCode: 'COFFEE', cropName: 'Café Arábica' },
  'coffea_canephora':       { cropCode: 'COFFEE', cropName: 'Café Robusta' },
  'theobroma_cacao':        { cropCode: 'CACAO', cropName: 'Cacao' },
  'camellia_sinensis':      { cropCode: 'TEA', cropName: 'Té' },
  'ilex_paraguariensis':    { cropCode: 'YERBA_MATE', cropName: 'Yerba Mate' },

  // Poáceas / Cereales
  'zea_mays':               { cropCode: 'MAI', cropName: 'Maíz' },
  'triticum_aestivum':      { cropCode: 'WHT', cropName: 'Trigo Pan' },
  'triticum_durum':         { cropCode: 'WHT_DURUM', cropName: 'Trigo Candeal' },
  'oryza_sativa':           { cropCode: 'RIC_INDICA', cropName: 'Arroz' },
  'hordeum_vulgare':        { cropCode: 'BAR_MALT', cropName: 'Cebada' },
  'avena_sativa':           { cropCode: 'OAT', cropName: 'Avena' },
  'secale_cereale':         { cropCode: 'RYE', cropName: 'Centeno' },
  'sorghum_bicolor':        { cropCode: 'SGH_GRAIN', cropName: 'Sorgo' },
  'eragrostis_tef':         { cropCode: 'TEFF', cropName: 'Teff' },
  'saccharum_officinarum':  { cropCode: 'SUG_CANE', cropName: 'Caña de Azúcar' },

  // Leguminosas
  'glycine_max':            { cropCode: 'SOY', cropName: 'Soja' },
  'phaseolus_vulgaris':     { cropCode: 'BEA_DRY', cropName: 'Poroto / Frijol' },
  'phaseolus_lunatus':      { cropCode: 'BEA_DRY', cropName: 'Pallar' },
  'pisum_sativum':          { cropCode: 'PEA_DRY', cropName: 'Arveja / Guisante' },
  'arachis_hypogaea':       { cropCode: 'PEA_NUT', cropName: 'Maní / Cacahuate' },
  'lens_culinaris':         { cropCode: 'LEN', cropName: 'Lenteja' },
  'cicer_arietinum':        { cropCode: 'CHI_KABULI', cropName: 'Garbanzo' },
  'vicia_faba':             { cropCode: 'FABA_BEAN', cropName: 'Haba' },
  'vigna_unguiculata':      { cropCode: 'COWPEA', cropName: 'Caupí' },
  'vigna_radiata':          { cropCode: 'MUNG_BEAN', cropName: 'Poroto Mung' },
  'lupinus_albus':          { cropCode: 'LUPIN', cropName: 'Altramuz / Lupino' },
  'cajanus_cajan':          { cropCode: 'PIGEON_PEA', cropName: 'Gandul / Guandul' },

  // Aliáceas y Raíces / Tubérculos
  'allium_cepa':            { cropCode: 'ONION', cropName: 'Cebolla' },
  'allium_sativum':         { cropCode: 'GARLIC', cropName: 'Ajo' },
  'allium_porrum':          { cropCode: 'LEEK', cropName: 'Puerro' },
  'allium_schoenoprasum':   { cropCode: 'CHIVE', cropName: 'Ciboulette / Cebollino' },
  'daucus_carota':          { cropCode: 'CARROT', cropName: 'Zanahoria' },
  'ipomoea_batatas':        { cropCode: 'SWEET_POTATO', cropName: 'Batata / Camote' },
  'manihot_esculenta':      { cropCode: 'CASSAVA', cropName: 'Mandioca / Yuca' },
  'colocasia_esculenta':    { cropCode: 'TARO', cropName: 'Taro' },
  'dioscorea_alata':        { cropCode: 'YAM', cropName: 'Ñame' },

  // Hortalizas de Hoja y Brássicas
  'lactuca_sativa':         { cropCode: 'LETTUCE', cropName: 'Lechuga' },
  'spinacia_oleracea':      { cropCode: 'SPINACH', cropName: 'Espinaca' },
  'brassica_oleracea':      { cropCode: 'CABBAGE', cropName: 'Col / Repollo / Brócoli' },
  'brassica_napus':         { cropCode: 'CAN', cropName: 'Colza / Canola' },
  'brassica_rapa':          { cropCode: 'TURNIP', cropName: 'Nabo' },
  'brassica_juncea':        { cropCode: 'MUSTARD', cropName: 'Mostaza' },
  'raphanus_sativus':       { cropCode: 'RADISH', cropName: 'Rábano' },
  'beta_vulgaris':          { cropCode: 'BEETROOT', cropName: 'Remolacha' },
  'apium_graveolens':       { cropCode: 'CELERY', cropName: 'Apio' },
  'cynara_cardunculus':     { cropCode: 'ARTICHOKE', cropName: 'Alcachofa' },
  'asparagus_officinalis':  { cropCode: 'ASPARAGUS', cropName: 'Espárrago' },
  'foeniculum_vulgare':     { cropCode: 'FENNEL', cropName: 'Hinojo' },
  'abelmoschus_esculentus': { cropCode: 'OKRA', cropName: 'Okra' },

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
  'prunus_armeniaca':       { cropCode: 'APRICOT', cropName: 'Damasco / Albaricoque' },
  'fragaria_x_ananassa':    { cropCode: 'STRAWBERRY', cropName: 'Frutilla / Fresa' },
  'fragaria_vesca':         { cropCode: 'STRAWBERRY', cropName: 'Frutilla Silvestre' },
  'vaccinium_corymbosum':   { cropCode: 'BLUEBERRY', cropName: 'Arándano' },
  'rubus_idaeus':           { cropCode: 'RASPBERRY', cropName: 'Frambuesa' },
  'vitis_vinifera':         { cropCode: 'GRAPE', cropName: 'Vid / Uva' },
  'ficus_carica':           { cropCode: 'FIG', cropName: 'Higuera / Higo' },
  'punica_granatum':        { cropCode: 'POMEGRANATE', cropName: 'Granado / Granada' },
  'actinidia_deliciosa':    { cropCode: 'KIWI', cropName: 'Kiwi' },

  // Frutales Tropicales y Palmeras
  'persea_americana':       { cropCode: 'AVOCADO', cropName: 'Palto / Aguacate' },
  'mangifera_indica':       { cropCode: 'MANGO', cropName: 'Mango' },
  'musa_acuminata':         { cropCode: 'BANANA', cropName: 'Banano' },
  'musa_balbisiana':        { cropCode: 'BANANA', cropName: 'Plátano' },
  'musa_x_paradisiaca':     { cropCode: 'BANANA', cropName: 'Banano / Plátano' },
  'carica_papaya':          { cropCode: 'PAPAYA', cropName: 'Papaya' },
  'ananas_comosus':         { cropCode: 'PINEAPPLE', cropName: 'Piña / Ananá' },
  'passiflora_edulis':      { cropCode: 'PASSION_FRUIT', cropName: 'Maracuyá' },
  'psidium_guajava':        { cropCode: 'GUAVA', cropName: 'Guayaba' },
  'cocos_nucifera':         { cropCode: 'COCONUT', cropName: 'Cocotero' },
  'phoenix_dactylifera':    { cropCode: 'DATE_PALM', cropName: 'Palmera Datilera' },
  'elaeis_guineensis':      { cropCode: 'OIL_PALM', cropName: 'Palma Aceitera' },
  'olea_europaea':          { cropCode: 'OLIVE', cropName: 'Olivo' },

  // Cítricos
  'citrus_sinensis':        { cropCode: 'CITRUS_ORANGE', cropName: 'Naranjo Dulce' },
  'citrus_limon':           { cropCode: 'LEMON', cropName: 'Limonero' },
  'citrus_reticulata':      { cropCode: 'MANDARIN', cropName: 'Mandarino' },
  'citrus_paradisi':        { cropCode: 'GRAPEFRUIT', cropName: 'Pomelo' },
  'citrus_aurantifolia':    { cropCode: 'LIME', cropName: 'Limonero sutil / Lima' },

  // Frutos Secos
  'juglans_regia':          { cropCode: 'WALNUT', cropName: 'Nogal / Nuez' },
  'carya_illinoinensis':    { cropCode: 'PECAN', cropName: 'Pecán' },
  'corylus_avellana':       { cropCode: 'HAZELNUT', cropName: 'Avellano' },
  'pistacia_vera':          { cropCode: 'PISTACHIO', cropName: 'Pistacho' },
  'castanea_sativa':        { cropCode: 'CHESTNUT', cropName: 'Castaño' },
  'anacardium_occidentale': { cropCode: 'CASHEW', cropName: 'Castaña de Cajú' },
  'macadamia_integrifolia': { cropCode: 'MACADAMIA', cropName: 'Macadamia' },

  // Oleaginosas y Fibras
  'helianthus_annuus':      { cropCode: 'SUN_OIL', cropName: 'Girasol' },
  'medicago_sativa':        { cropCode: 'ALF', cropName: 'Alfalfa' },
  'trifolium_repens':       { cropCode: 'CLO', cropName: 'Trébol Blanco' },
  'trifolium_pratense':     { cropCode: 'CLO', cropName: 'Trébol Rojo' },
  'linum_usitatissimum':    { cropCode: 'FLAX', cropName: 'Lino' },
  'carthamus_tinctorius':   { cropCode: 'SAFFLOWER', cropName: 'Cártamo' },
  'ricinus_communis':       { cropCode: 'CASTOR', cropName: 'Ricino / Tártago' },
  'gossypium_hirsutum':     { cropCode: 'COT', cropName: 'Algodón Upland' },
  'gossypium_barbadense':   { cropCode: 'COT', cropName: 'Algodón Pima' },

  // Aromáticas, Especias y Pseudocereales
  'ocimum_basilicum':       { cropCode: 'BASIL', cropName: 'Albahaca' },
  'mentha_piperita':        { cropCode: 'MINT', cropName: 'Menta' },
  'coriandrum_sativum':     { cropCode: 'CORIANDER', cropName: 'Cilantro' },
  'origanum_vulgare':       { cropCode: 'OREGANO', cropName: 'Orégano' },
  'chenopodium_quinoa':     { cropCode: 'QUI', cropName: 'Quinua' },
  'amaranthus_cruentus':    { cropCode: 'AMA', cropName: 'Amaranto' },
  'sesamum_indicum':        { cropCode: 'SES', cropName: 'Sésamo' },
  'vanilla_planifolia':     { cropCode: 'VANILLA', cropName: 'Vainilla' },
  'cinnamomum_verum':       { cropCode: 'CINNAMON', cropName: 'Canela' },
  'piper_nigrum':           { cropCode: 'BLACK_PEPPER', cropName: 'Pimienta Negra' },
  'zingiber_officinale':    { cropCode: 'GINGER', cropName: 'Jengibre' },
  'curcuma_longa':          { cropCode: 'TURMERIC', cropName: 'Cúrcuma' },
  'syzygium_aromaticum':    { cropCode: 'CLOVE', cropName: 'Clavo de Olor' },
  'myristica_fragrans':     { cropCode: 'NUTMEG', cropName: 'Nuez Moscada' },
  'stevia_rebaudiana':      { cropCode: 'STEVIA', cropName: 'Estevia' },
  'salvia_hispanica':       { cropCode: 'CHIA', cropName: 'Chía' },
  'fagopyrum_esculentum':   { cropCode: 'BUCKWHEAT', cropName: 'Trigo Sarraceno' },
}

/**
 * Nivel 2: Sinónimos botánicos antiguos o nombres alternativos comunes
 */
const BOTANICAL_SYNONYMS: Record<string, { cropCode: string; cropName: string }> = {
  'lycopersicon_esculentum':       { cropCode: 'TOM', cropName: 'Tomate' },
  'lycopersicon_pimpinellifolium': { cropCode: 'TOM', cropName: 'Tomate Silvestre' },
  'solanum_esculentum':            { cropCode: 'TOM', cropName: 'Tomate' },
  'zea_saccharata':                { cropCode: 'MAI_SWEET', cropName: 'Maíz Dulce' },
  'zea_indurata':                  { cropCode: 'MAI_POP', cropName: 'Maíz Pisingallo' },
  'solanum_betaceum':              { cropCode: 'TOM', cropName: 'Tomate de Árbol / Chilto' },
  'coffea_canephora_robusta':      { cropCode: 'COFFEE', cropName: 'Café Robusta' },
}

/**
 * Nivel 3: Parientes silvestres por Género (CWR - Crop Wild Relatives)
 * Se aplica si el binomio específico no tuvo match exacto, pero pertenece
 * a un género agrícola emblemático con ontología establecida.
 */
const GENUS_FALLBACK_MAP: Record<string, { cropCode: string; cropName: string; label: string }> = {
  'solanum':     { cropCode: 'TOM', cropName: 'Tomate', label: 'Pariente silvestre de Solanum (afín a Tomate)' },
  'capsicum':    { cropCode: 'PEPPER_SWEET', cropName: 'Pimiento', label: 'Pariente silvestre de Capsicum' },
  'cannabis':    { cropCode: 'HEMP', cropName: 'Cáñamo / Cannabis', label: 'Especie del género Cannabis' },
  'humulus':     { cropCode: 'HOPS', cropName: 'Lúpulo', label: 'Especie del género Humulus' },
  'coffea':      { cropCode: 'COFFEE', cropName: 'Café', label: 'Especie del género Coffea' },
  'theobroma':   { cropCode: 'CACAO', cropName: 'Cacao', label: 'Especie del género Theobroma' },
  'camellia':    { cropCode: 'TEA', cropName: 'Té', label: 'Especie del género Camellia' },
  'ilex':        { cropCode: 'YERBA_MATE', cropName: 'Yerba Mate', label: 'Especie del género Ilex' },
  'nicotiana':   { cropCode: 'TOBACCO', cropName: 'Tabaco', label: 'Especie del género Nicotiana' },
  'zea':         { cropCode: 'MAI', cropName: 'Maíz', label: 'Pariente silvestre de Maíz (Teosinte/Zea)' },
  'triticum':    { cropCode: 'WHT', cropName: 'Trigo', label: 'Pariente silvestre de Trigo' },
  'oryza':       { cropCode: 'RIC_INDICA', cropName: 'Arroz', label: 'Pariente silvestre de Arroz' },
  'hordeum':     { cropCode: 'BAR_MALT', cropName: 'Cebada', label: 'Pariente silvestre de Cebada' },
  'phaseolus':   { cropCode: 'BEA_DRY', cropName: 'Poroto / Frijol', label: 'Pariente silvestre de Poroto' },
  'allium':      { cropCode: 'ONION', cropName: 'Cebolla', label: 'Pariente silvestre de Allium' },
  'brassica':    { cropCode: 'CABBAGE', cropName: 'Brássica', label: 'Especie del género Brassica' },
  'cucumis':     { cropCode: 'CUCUMBER', cropName: 'Cucumis', label: 'Pariente silvestre de Cucumis' },
  'cucurbita':   { cropCode: 'SQUASH', cropName: 'Cucúrbita', label: 'Pariente silvestre de Calabaza/Zapallo' },
  'citrus':      { cropCode: 'CITRUS_ORANGE', cropName: 'Cítrico', label: 'Especie del género Citrus' },
  'malus':       { cropCode: 'APPLE', cropName: 'Manzano', label: 'Pariente silvestre de Manzano' },
  'fragaria':    { cropCode: 'STRAWBERRY', cropName: 'Frutilla', label: 'Pariente silvestre de Fragaria' },
  'helianthus':  { cropCode: 'SUN_OIL', cropName: 'Girasol', label: 'Pariente silvestre de Girasol' },
  'persea':      { cropCode: 'AVOCADO', cropName: 'Aguacate / Palto', label: 'Especie del género Persea' },
  'mangifera':   { cropCode: 'MANGO', cropName: 'Mango', label: 'Especie del género Mangifera' },
  'musa':        { cropCode: 'BANANA', cropName: 'Banano', label: 'Especie del género Musa' },
  'carica':      { cropCode: 'PAPAYA', cropName: 'Papaya', label: 'Especie del género Carica' },
  'ananas':      { cropCode: 'PINEAPPLE', cropName: 'Piña', label: 'Especie del género Ananas' },
  'passiflora':  { cropCode: 'PASSION_FRUIT', cropName: 'Maracuyá', label: 'Especie del género Passiflora' },
  'olea':        { cropCode: 'OLIVE', cropName: 'Olivo', label: 'Especie del género Olea' },
  'gossypium':   { cropCode: 'COT', cropName: 'Algodón', label: 'Especie del género Gossypium' },
  'saccharum':   { cropCode: 'SUG_CANE', cropName: 'Caña de Azúcar', label: 'Especie del género Saccharum' },
  'linum':       { cropCode: 'FLAX', cropName: 'Lino', label: 'Especie del género Linum' },
  'carthamus':   { cropCode: 'SAFFLOWER', cropName: 'Cártamo', label: 'Especie del género Carthamus' },
  'ricinus':     { cropCode: 'CASTOR', cropName: 'Ricino', label: 'Especie del género Ricinus' },
  'vanilla':     { cropCode: 'VANILLA', cropName: 'Vainilla', label: 'Especie del género Vanilla' },
  'zingiber':    { cropCode: 'GINGER', cropName: 'Jengibre', label: 'Especie del género Zingiber' },
  'curcuma':     { cropCode: 'TURMERIC', cropName: 'Cúrcuma', label: 'Especie del género Curcuma' },
  'juglans':     { cropCode: 'WALNUT', cropName: 'Nogal', label: 'Especie del género Juglans' },
  'vicia':       { cropCode: 'FABA_BEAN', cropName: 'Haba / Vicia', label: 'Especie del género Vicia' },
  'vigna':       { cropCode: 'COWPEA', cropName: 'Caupí / Vigna', label: 'Especie del género Vigna' },
  'lupinus':     { cropCode: 'LUPIN', cropName: 'Lupino', label: 'Especie del género Lupinus' },
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

  // Sin match en ontología (sin Nivel 4 forzado en ontología)
  return null
}

/**
 * Genera un código de prefijo determinista para accesiones (estándar FAO MCPD / bancos de germoplasma)
 * para cualquier especie botánica, asegurando que ninguna quede sin prefijo de catálogo.
 * Ejemplos:
 * - Passiflora edulis -> PASE
 * - Cannabis sativa -> CANS
 * - Phalaenopsis sp -> PHAL
 */
export function generateFallbackCropCode(genus?: string, species?: string): string {
  const cleanGenus = (genus || '').replace(/[^a-zA-Z]/g, '').toUpperCase()
  const cleanSpecies = (species || '').replace(/[^a-zA-Z]/g, '').toUpperCase()

  if (!cleanGenus) return 'ACC'

  // Si género tiene al menos 3 letras y especie tiene al menos 1 letra significativa
  if (cleanGenus.length >= 3 && cleanSpecies.length >= 1 && !['SP', 'SPP', 'SPEC'].includes(cleanSpecies)) {
    return `${cleanGenus.slice(0, 3)}${cleanSpecies.slice(0, 1)}`
  }

  // Si no hay especie o es indeterminada (sp/spp), tomamos 3 o 4 letras del género
  if (cleanGenus.length >= 4) {
    return cleanGenus.slice(0, 4)
  }

  return cleanGenus.padEnd(3, 'X')
}

/**
 * Retorna el código de cultivo efectivo para prefijos de accesión y catalogación.
 * Prioridad:
 * 1. cropCode explícito del taxón
 * 2. cropCode resuelto de ontología canónica
 * 3. Fallback determinista derivado de género y especie
 */
export function getEffectiveCropCode(taxon?: { cropCode?: string; genus?: string; species?: string } | null): string {
  if (!taxon) return ''
  if (taxon.cropCode && taxon.cropCode.trim()) {
    return taxon.cropCode.trim().toUpperCase()
  }
  const resolved = resolveCropOntology({ genus: taxon.genus, species: taxon.species })
  if (resolved?.cropCode) {
    return resolved.cropCode.toUpperCase()
  }
  return generateFallbackCropCode(taxon.genus, taxon.species)
}
