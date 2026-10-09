import type { TraitDefinition } from '../types';

export const MEDICINAL_INDUSTRIAL_ONTOLOGY: Record<string, TraitDefinition[]> = {
  'GINSENG': [
    {
      id: 'GIN_GINSENOSIDE',
      name: 'Contenido de Ginsenósidos',
      description: 'Saponinas triterpénicas (Panaxoside)',
      type: 'numeric',
      unit: '%',
      min: 2,
      max: 8,
      required: true
    },
    {
      id: 'GIN_AGE',
      name: 'Edad Óptima de Cosecha',
      description: 'Ginseng de bosque vs sombra, requiere muchos años',
      type: 'numeric',
      unit: 'años',
      min: 3,
      max: 10,
      required: true
    },
    {
      id: 'GIN_ROOT_SHAPE',
      name: 'Morfología de Raíz',
      description: 'Forma humana (premium) vs Cilíndrica',
      type: 'categorical',
      options: [
        { value: 'man_like', label: 'Forma Humana (Antropoide)' },
        { value: 'cylindrical', label: 'Cilíndrica simple' }
      ],
      required: true
    },
    {
      id: 'GIN_DISEASE',
      name: 'Susceptibilidad a Enfermedades de Raíz',
      description: 'Alternaria, Rhizoctonia, Phytophthora (Replant disease)',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Extremadamente Susceptible (Solo suelo virgen)' }
      ],
      required: true
    }
  ],
  'COFFEE': [
    {
      id: 'COF_SPECIES',
      name: 'Especie Botánica',
      description: 'Arábica (suave/altura) vs Robusta (fuerte/bajura)',
      type: 'categorical',
      options: [
        { value: 'arabica', label: 'Coffea arabica' },
        { value: 'robusta', label: 'Coffea canephora (Robusta)' }
      ],
      required: true
    },
    {
      id: 'COF_RUST',
      name: 'Resistencia a Roya del Cafeto',
      description: 'Hemileia vastatrix',
      type: 'categorical',
      options: [
        { value: 1, label: 'Alta (Ej. Variedades Catimor)' },
        { value: 9, label: 'Muy Susceptible (Ej. Typica, Bourbon)' }
      ],
      required: true
    },
    {
      id: 'COF_CUP_QUALITY',
      name: 'Calidad en Taza (SCA Score)',
      description: 'Puntaje de catación',
      type: 'numeric',
      unit: 'puntos',
      min: 70,
      max: 95,
      required: true
    },
    {
      id: 'COF_ARCHITECTURE',
      name: 'Porte de Planta',
      description: 'Porte alto (requiere poda) vs Porte bajo (compacto/Caturra)',
      type: 'categorical',
      options: [
        { value: 'tall', label: 'Alto' },
        { value: 'dwarf', label: 'Bajo / Enano' }
      ],
      required: true
    }
  ],
  'CACAO': [
    {
      id: 'CAC_GENETIC_GROUP',
      name: 'Grupo Genético',
      description: 'Criollo (fino), Forastero (granel), Trinitario (híbrido)',
      type: 'categorical',
      options: [
        { value: 'criollo', label: 'Criollo (Aroma Fino, Almendra blanca)' },
        { value: 'forastero', label: 'Forastero (Resistente, Bulk)' },
        { value: 'trinitario', label: 'Trinitario (Equilibrado)' }
      ],
      required: true
    },
    {
      id: 'CAC_POD_COLOR',
      name: 'Color de Mazorca',
      description: 'Verde a Amarillo, o Rojo a Naranja',
      type: 'categorical',
      options: [
        { value: 'green_yellow', label: 'Verde -> Amarillo' },
        { value: 'red_orange', label: 'Rojo -> Naranja' }
      ],
      required: true
    },
    {
      id: 'CAC_FROSTY_POD',
      name: 'Resistencia a Moniliasis',
      description: 'Moniliophthora roreri',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Altamente Susceptible' }
      ],
      required: true
    },
    {
      id: 'CAC_FAT_CONTENT',
      name: 'Contenido de Manteca de Cacao',
      description: 'Porcentaje de grasa en la almendra seca',
      type: 'numeric',
      unit: '%',
      min: 45,
      max: 60,
      required: true
    }
  ],
  'TEA': [
    {
      id: 'TEA_VARIETY',
      name: 'Variedad Botánica',
      description: 'Sinensis (hoja pequeña/frío) vs Assamica (hoja grande/tropical)',
      type: 'categorical',
      options: [
        { value: 'sinensis', label: 'var. sinensis (Hoja pequeña)' },
        { value: 'assamica', label: 'var. assamica (Hoja grande)' }
      ],
      required: true
    },
    {
      id: 'TEA_FLUSHING',
      name: 'Vigor de Brotación (Flushing)',
      description: 'Capacidad de emitir brotes nuevos rápidamente tras cosecha',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Rápido / Abundante' },
        { value: 'low', label: 'Lento' }
      ],
      required: true
    },
    {
      id: 'TEA_CATECHINS',
      name: 'Contenido de Catequinas',
      description: 'Antioxidantes clave para té verde',
      type: 'numeric',
      unit: '%',
      min: 10,
      max: 25,
      required: true
    },
    {
      id: 'TEA_BLISTER_BLIGHT',
      name: 'Resistencia a Exobasidium vexans',
      description: 'Enfermedad grave de la hoja en Asia',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'YERBA_MATE': [
    {
      id: 'YBA_LEAF_SHAPE',
      name: 'Forma de Hoja',
      description: 'Ancha vs Estrecha (Afecta peso de cosecha)',
      type: 'categorical',
      options: [
        { value: 'broad', label: 'Ancha (Mayor biomasa)' },
        { value: 'narrow', label: 'Estrecha' }
      ],
      required: true
    },
    {
      id: 'YBA_CAFFEINE',
      name: 'Contenido de Cafeína/Mateína',
      description: 'Niveles de alcaloides',
      type: 'numeric',
      unit: '%',
      min: 0.5,
      max: 2.0,
      required: true
    },
    {
      id: 'YBA_FROST',
      name: 'Tolerancia a Heladas',
      description: 'Punto de daño foliar en invierno',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante (-6°C)' },
        { value: 9, label: 'Sensible' }
      ],
      required: true
    },
    {
      id: 'YBA_REGROWTH',
      name: 'Velocidad de Rebrote post-poda (Tarefa)',
      description: 'Capacidad de reponer copa rápidamente',
      type: 'categorical',
      options: [
        { value: 'fast', label: 'Rápido' },
        { value: 'slow', label: 'Lento' }
      ],
      required: true
    }
  ],
  'TOBACCO': [
    {
      id: 'TOB_TYPE',
      name: 'Tipo de Curado (Uso)',
      description: 'Flue-cured (Virginia), Burley (Air-cured), Oriental',
      type: 'categorical',
      options: [
        { value: 'virginia', label: 'Virginia (Flue-cured)' },
        { value: 'burley', label: 'Burley (Air-cured)' },
        { value: 'oriental', label: 'Oriental (Sun-cured)' }
      ],
      required: true
    },
    {
      id: 'TOB_NICOTINE',
      name: 'Contenido de Nicotina',
      description: 'Nivel del alcaloide',
      type: 'numeric',
      unit: '%',
      min: 0.5,
      max: 6.0,
      required: true
    },
    {
      id: 'TOB_TMV',
      name: 'Resistencia a Virus del Mosaico (TMV)',
      description: 'Virus muy contagioso',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistente' },
        { value: 'susceptible', label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'TOB_LEAF_NUMBER',
      name: 'Número de Hojas Útiles',
      description: 'Hojas por planta al capado (Topping)',
      type: 'numeric',
      unit: 'hojas',
      min: 15,
      max: 35,
      required: true
    }
  ],
  'HOPS': [
    {
      id: 'HOP_USAGE',
      name: 'Uso Cervecero',
      description: 'Aroma (Aceites) vs Amargor (Alfa ácidos) vs Dual',
      type: 'categorical',
      options: [
        { value: 'aroma', label: 'Aroma / Fino' },
        { value: 'bittering', label: 'Amargor (Alto Alfa)' },
        { value: 'dual', label: 'Doble Propósito' }
      ],
      required: true
    },
    {
      id: 'HOP_ALPHA_ACID',
      name: 'Alfa Ácidos',
      description: 'Porcentaje de alfa ácidos en cono seco',
      type: 'numeric',
      unit: '%',
      min: 3,
      max: 20,
      required: true
    },
    {
      id: 'HOP_OILS',
      name: 'Total Aceites Esenciales',
      description: 'Mililitros por 100g (Mirceno, Humuleno, etc.)',
      type: 'numeric',
      unit: 'mL/100g',
      min: 0.5,
      max: 4.0,
      required: true
    },
    {
      id: 'HOP_MILDEW',
      name: 'Resistencia a Mildiu (Downy Mildew)',
      description: 'Pseudoperonospora humuli',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Resistente' },
        { value: 9, label: 'Altamente Susceptible' }
      ],
      required: true
    }
  ],
  'AGAVE': [
    {
      id: 'AGA_SPECIES',
      name: 'Especie / Uso',
      description: 'Tequilana (Tequila), Angustifolia (Mezcal), Sisalana (Fibra)',
      type: 'categorical',
      options: [
        { value: 'tequila', label: 'A. tequilana (Tequila)' },
        { value: 'mezcal', label: 'A. angustifolia/potatorum (Mezcal)' },
        { value: 'fiber', label: 'A. sisalana (Sisal / Fibra)' }
      ],
      required: true
    },
    {
      id: 'AGA_MATURITY',
      name: 'Años a Cosecha (Piña/Jimado)',
      description: 'Años hasta acumulación óptima de azúcares (inulina)',
      type: 'numeric',
      unit: 'años',
      min: 4,
      max: 12,
      required: true
    },
    {
      id: 'AGA_BRIX',
      name: 'Grados Brix en Piña (Corazón)',
      description: 'Crucial para fermentación',
      type: 'numeric',
      unit: '°Bx',
      min: 20,
      max: 35,
      required: true
    },
    {
      id: 'AGA_WEEVIL',
      name: 'Resistencia al Picudo del Agave',
      description: 'Scyphophorus acupunctatus',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'RUBBER': [
    {
      id: 'RUB_YIELD',
      name: 'Rendimiento de Látex',
      description: 'Kg/ha/año de caucho seco',
      type: 'numeric',
      unit: 'kg/ha',
      min: 1000,
      max: 3500,
      required: true
    },
    {
      id: 'RUB_LEAF_BLIGHT',
      name: 'Resistencia a SALB (South American Leaf Blight)',
      description: 'Microcyclus ulei, letal en América',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistente' },
        { value: 'susceptible', label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'RUB_GIRTH',
      name: 'Velocidad de Crecimiento del Tronco',
      description: 'Determina precocidad para inicio de pica (tapping)',
      type: 'categorical',
      options: [
        { value: 'fast', label: 'Rápido (Apertura a 5 años)' },
        { value: 'slow', label: 'Lento (Apertura a 7+ años)' }
      ],
      required: true
    },
    {
      id: 'RUB_WIND',
      name: 'Resistencia al Quiebre por Viento',
      description: 'Tifones o tormentas destruyen plantaciones',
      type: 'categorical',
      options: [
        { value: 'strong', label: 'Madera fuerte / Copa compacta' },
        { value: 'weak', label: 'Copa pesada / Rompe fácil' }
      ],
      required: true
    }
  ],
  'MACA': [
    {
      id: 'MCA_HYPOCOTYL_COLOR',
      name: 'Color del Hipocótilo',
      description: 'Amarillo, Rojo, Negro (Asociado a diferentes propiedades nutracéuticas)',
      type: 'categorical',
      options: [
        { value: 'yellow', label: 'Amarilla / Crema (Más común)' },
        { value: 'red', label: 'Roja' },
        { value: 'black', label: 'Negra (Premium/Energía)' }
      ],
      required: true
    },
    {
      id: 'MCA_GLUCOSINOLATE',
      name: 'Contenido de Glucosinolatos',
      description: 'Metabolitos activos (Macamidas)',
      type: 'numeric',
      unit: '%',
      min: 0.5,
      max: 2.0,
      required: true
    },
    {
      id: 'MCA_FROST',
      name: 'Resistencia a Heladas Extremas',
      description: 'Cultivada a >4000 msnm',
      type: 'categorical',
      options: [
        { value: 'extreme', label: 'Tolerante a -10°C' },
        { value: 'moderate', label: 'Sensible' }
      ],
      required: true
    },
    {
      id: 'MCA_SIZE',
      name: 'Diámetro de Raíz',
      description: 'Centímetros',
      type: 'numeric',
      unit: 'cm',
      min: 2,
      max: 8,
      required: true
    }
  ],
  'GUAYULE': [
    {
      id: 'GUA_RUBBER_YIELD',
      name: 'Contenido de Caucho (Látex Hipoalergénico)',
      description: 'Porcentaje de caucho en peso seco de la planta',
      type: 'numeric',
      unit: '%',
      min: 4,
      max: 12,
      required: true
    },
    {
      id: 'GUA_RESIN',
      name: 'Contenido de Resina',
      description: 'Subproducto comercial (adhesivos/madera artificial)',
      type: 'numeric',
      unit: '%',
      min: 5,
      max: 15,
      required: true
    },
    {
      id: 'GUA_COLD_TOL',
      name: 'Tolerancia a Heladas',
      description: 'Guayule requiere adaptación al desierto con inviernos fríos (Chihuahua/Sonora)',
      type: 'categorical',
      options: [
        { value: 'tolerant', label: 'Tolerante (Induce acumulación de caucho)' },
        { value: 'sensitive', label: 'Sensible' }
      ],
      required: true
    },
    {
      id: 'GUA_APOMIXIS',
      name: 'Tipo de Reproducción (Apomixis)',
      description: 'Produce semilla clon sin fecundación',
      type: 'categorical',
      options: [
        { value: 'apomictic', label: 'Apomíctica Facultativa' },
        { value: 'sexual', label: 'Sexual' }
      ],
      required: true
    }
  ],
  'JATROPHA': [
    {
      id: 'JAT_OIL_CONTENT',
      name: 'Contenido de Aceite en Semilla',
      description: 'Aceite no comestible para biodiésel',
      type: 'numeric',
      unit: '%',
      min: 25,
      max: 45,
      required: true
    },
    {
      id: 'JAT_PHORBOL',
      name: 'Contenido de Ésteres de Forbol (Toxicidad)',
      description: 'Jatropha tóxica vs no tóxica (torta utilizable como forraje)',
      type: 'categorical',
      options: [
        { value: 'toxic', label: 'Tóxica (Uso exclusivo biocarburante/abono)' },
        { value: 'non_toxic', label: 'No Tóxica / Comestible (Variedades de México)' }
      ],
      required: true
    },
    {
      id: 'JAT_DROUGHT',
      name: 'Resistencia a Sequía Severa',
      description: 'Planta de desierto que pierde hojas para sobrevivir',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alta (Entra en latencia)' },
        { value: 'low', label: 'Requiere riego para dar fruto' }
      ],
      required: true
    },
    {
      id: 'JAT_FLOWERING',
      name: 'Patrón de Floración/Cosecha',
      description: 'Cosecha escalonada requiere recolección manual costosa. Floración síncrona es buscada.',
      type: 'categorical',
      options: [
        { value: 'continuous', label: 'Continua/Escalonada (Difícil mecanización)' },
        { value: 'synchronous', label: 'Sincrónica' }
      ],
      required: true
    }
  ],
  'HEMP': [
    {
      id: 'HEM_THC',
      name: 'Contenido de THC',
      description: 'Límite legal para cáñamo industrial (generalmente < 0.3%)',
      type: 'numeric',
      unit: '%',
      min: 0,
      max: 1,
      required: true
    },
    {
      id: 'HEM_CBD',
      name: 'Contenido de CBD',
      description: 'Cannabidiol, alto valor medicinal/cosmético',
      type: 'numeric',
      unit: '%',
      min: 0,
      max: 20,
      required: true
    },
    {
      id: 'HEM_FIBER_YIELD',
      name: 'Rendimiento de Fibra',
      description: 'Producción de tallo seco para bioplásticos, papel, textil',
      type: 'numeric',
      unit: 't/ha',
      min: 2,
      max: 15,
      required: true
    },
    {
      id: 'HEM_SEX',
      name: 'Expresión Sexual',
      description: 'Dioico vs Monoico (clave para polinización/producción de semilla)',
      type: 'categorical',
      options: [
        { value: 'dioecious', label: 'Dioico (M/H separadas)' },
        { value: 'monoecious', label: 'Monoico (M/H misma planta)' }
      ],
      required: true
    }
  ],
  'JUTE': [
    {
      id: 'JUT_FIBER_YIELD',
      name: 'Rendimiento de Fibra de Liber (Bast Fiber)',
      description: 'Fibra extraída tras enriado (t/ha)',
      type: 'numeric',
      unit: 't/ha',
      min: 1,
      max: 4,
      required: true
    },
    {
      id: 'JUT_HEIGHT',
      name: 'Altura de Planta',
      description: 'Mayor altura = fibras más largas',
      type: 'numeric',
      unit: 'm',
      min: 2,
      max: 5,
      required: true
    },
    {
      id: 'JUT_RETTING',
      name: 'Días de Enriado (Retting Time)',
      description: 'Días en agua para separar la fibra',
      type: 'numeric',
      unit: 'días',
      min: 10,
      max: 30,
      required: true
    },
    {
      id: 'JUT_STEM_DIAM',
      name: 'Diámetro del Tallo',
      description: 'Tallos demasiado gruesos bajan la calidad de fibra',
      type: 'numeric',
      unit: 'mm',
      min: 10,
      max: 30,
      required: true
    }
  ],
  'SISAL': [
    {
      id: 'SIS_LEAF_LENGTH',
      name: 'Longitud de Hoja',
      description: 'Determina el largo de la fibra',
      type: 'numeric',
      unit: 'cm',
      min: 80,
      max: 150,
      required: true
    },
    {
      id: 'SIS_FIBER',
      name: 'Contenido de Fibra',
      description: '% de fibra extraída por hoja verde',
      type: 'numeric',
      unit: '%',
      min: 3,
      max: 7,
      required: true
    },
    {
      id: 'SIS_SPINELESS',
      name: 'Márgenes sin Espinas',
      description: 'Clave para el manejo y cosecha manual',
      type: 'categorical',
      options: [
        { value: 'spineless', label: 'Bordes Lisos' },
        { value: 'spiny', label: 'Con Espinas Marginales' }
      ],
      required: true
    },
    {
      id: 'SIS_DROUGHT',
      name: 'Tolerancia a Sequía',
      description: 'Planta CAM, extrema resistencia',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Resistente' },
        { value: 5, label: 'Moderada' }
      ],
      required: true
    }
  ],
};
