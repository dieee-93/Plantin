// Este archivo sirve como base de datos botánica temporal (Mock) 
// hasta que integremos APIs oficiales como GBIF o NCBI Taxonomy.

export const BOTANICAL_FAMILIES = [
  'Solanaceae',
  'Poaceae',
  'Fabaceae',
  'Cucurbitaceae',
  'Brassicaceae',
  'Rosaceae',
  'Rutaceae',
  'Apiaceae',
  'Liliaceae',
  'Asteraceae'
] as const;

export const BOTANICAL_DB: Record<string, Record<string, string[]>> = {
  Solanaceae: {
    Solanum: ['lycopersicum (Tomate) [TOM]', 'tuberosum (Papa) [POT]', 'melongena (Berenjena) [EGG]'],
    Capsicum: ['annuum (Pimiento) [PEP]', 'chinense (Ají) [PEP]', 'frutescens (Tabasco) [PEP]'],
    Nicotiana: ['tabacum (Tabaco)']
  },
  Poaceae: {
    Zea: ['mays (Maíz) [MAI]'],
    Triticum: ['aestivum (Trigo) [WHT]', 'durum (Trigo Candeal) [WHT]'],
    Oryza: ['sativa (Arroz) [RIC]'],
    Hordeum: ['vulgare (Cebada) [BAR]'],
    Avena: ['sativa (Avena) [OAT]']
  },
  Fabaceae: {
    Glycine: ['max (Soja) [SOY]'],
    Phaseolus: ['vulgaris (Frijol/Poroto) [BEA]', 'lunatus (Pallar) [BEA]'],
    Pisum: ['sativum (Arveja/Guisante) [PEA]'],
    Arachis: ['hypogaea (Maní) [PNT]'],
    Lens: ['culinaris (Lenteja) [LNT]']
  },
  Cucurbitaceae: {
    Cucurbita: ['pepo (Calabacín) [SQU]', 'maxima (Zapallo) [SQU]', 'moschata (Calabaza) [SQU]'],
    Cucumis: ['sativus (Pepino) [CUC]', 'melo (Melón) [MEL]'],
    Citrullus: ['lanatus (Sandía) [WAT]']
  },
  Brassicaceae: {
    Brassica: ['oleracea (Col/Brócoli) [CAB]', 'napus (Canola) [CAN]', 'rapa (Nabo) [TRN]'],
    Raphanus: ['sativus (Rábano) [RAD]']
  },
  Rosaceae: {
    Malus: ['domestica (Manzano) [APP]'],
    Prunus: ['persica (Durazno) [PCH]', 'avium (Cerezo) [CHR]', 'dulcis (Almendro) [ALM]'],
    Fragaria: ['x ananassa (Frutilla/Fresa) [STR]'],
    Pyrus: ['communis (Peral) [PEA]']
  },
  Rutaceae: {
    Citrus: ['sinensis (Naranjo) [ORG]', 'limon (Limonero) [LEM]', 'reticulata (Mandarino) [MAN]']
  },
  Apiaceae: {
    Daucus: ['carota (Zanahoria) [CAR]'],
    Apium: ['graveolens (Apio) [CEL]'],
    Coriandrum: ['sativum (Cilantro) [COR]']
  },
  Liliaceae: {
    Allium: ['cepa (Cebolla) [ONI]', 'sativum (Ajo) [GAR]', 'porrum (Puerro) [LEE]']
  },
  Asteraceae: {
    Lactuca: ['sativa (Lechuga) [LET]'],
    Helianthus: ['annuus (Girasol) [SUN]'],
    Cynara: ['cardunculus (Alcachofa) [ART]']
  }
}

// Función helper para extraer la especie, el nombre común y el crop code
// Ej: "lycopersicum (Tomate) [TOM]" -> { species: "lycopersicum", commonName: "Tomate", cropCode: "TOM" }
export function parseSpeciesString(combined: string) {
  // Regex: Captura especie, (nombre comun) opcional, [crop code] opcional
  const match = combined.match(/^([^\(\[]+)(?:\s*\((.*?)\))?(?:\s*\[(.*?)\])?$/)
  if (!match) return { species: combined.trim(), commonName: '', cropCode: '' }
  
  return {
    species: match[1].trim(),
    commonName: match[2] ? match[2].trim() : '',
    cropCode: match[3] ? match[3].trim() : ''
  }
}
