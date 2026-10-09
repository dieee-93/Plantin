import type { TraitDefinition } from '../types';

export const FRUITS_TREES_ONTOLOGY: Record<string, TraitDefinition[]> = {
  'APPLE': [
    {
      id: 'APP_OVERCOLOR',
      name: 'Color de Cobertura',
      description: 'Rojo, Verde, Bicolor',
      type: 'categorical',
      options: [
        { value: 'red', label: 'Rojo Sólido' },
        { value: 'bicolor', label: 'Bicolor (Rojo/Amarillo)' },
        { value: 'green', label: 'Verde/Amarillo' }
      ],
      required: true
    },
    {
      id: 'APP_FIRMNESS',
      name: 'Firmeza de Pulpa',
      description: 'Presión a cosecha (Penetrómetro)',
      type: 'numeric',
      unit: 'lb/in2',
      min: 10,
      max: 25,
      required: true
    },
    {
      id: 'APP_CRISPNESS',
      name: 'Crocancia (Crispness)',
      description: 'Evaluación sensorial al quiebre de la pulpa',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Muy Crocante' },
        { value: 'medium', label: 'Media' },
        { value: 'mealy', label: 'Harinoso' }
      ],
      required: true
    },
    {
      id: 'APP_SCAB',
      name: 'Resistencia a Sarna (Venturia)',
      description: 'Venturia inaequalis (Gen Vf, etc.)',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Resistente (Gen Vf)' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'GRAPE': [
    {
      id: 'GRA_SKIN_COLOR',
      name: 'Color de Baya',
      description: 'Blanca/Verde, Roja, Negra',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Blanca / Verde' },
        { value: 'red', label: 'Roja / Rosada' },
        { value: 'black', label: 'Negra / Azul' }
      ],
      required: true
    },
    {
      id: 'GRA_SEEDLESS',
      name: 'Apirénesis (Sin Semilla)',
      description: 'Importante para mesa y pasas',
      type: 'categorical',
      options: [
        { value: 'seedless', label: 'Sin Semillas (Apirena)' },
        { value: 'seeded', label: 'Con Semillas' }
      ],
      required: true
    },
    {
      id: 'GRA_COMPACTNESS',
      name: 'Compacidad del Racimo',
      description: 'Muy compacto = riesgo de pudrición',
      type: 'categorical',
      options: [
        { value: 1, label: 'Muy Suelto' },
        { value: 5, label: 'Medio' },
        { value: 9, label: 'Muy Compacto' }
      ],
      required: true
    },
    {
      id: 'GRA_POWDERY_MILDEW',
      name: 'Resistencia a Oídio',
      description: 'Erysiphe necator',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'OLIVE': [
    {
      id: 'OLI_OIL_YIELD',
      name: 'Rendimiento Graso (Aceite)',
      description: 'Porcentaje de aceite sobre materia fresca/seca',
      type: 'numeric',
      unit: '%',
      min: 10,
      max: 30,
      required: true
    },
    {
      id: 'OLI_FRUIT_WEIGHT',
      name: 'Peso del Fruto',
      description: 'Importante para aceituna de mesa (g)',
      type: 'numeric',
      unit: 'g',
      min: 1,
      max: 15,
      required: true
    },
    {
      id: 'OLI_ALTERNANCE',
      name: 'Vecería (Alternance)',
      description: 'Tendencia a alternar años de alta y baja producción',
      type: 'categorical',
      options: [
        { value: 'low', label: 'Baja (Producción Constante)' },
        { value: 'high', label: 'Alta (Muy Vecera)' }
      ],
      required: true
    },
    {
      id: 'OLI_VERTICILLIUM',
      name: 'Resistencia a Verticillium',
      description: 'Verticillium dahliae',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'PEACH': [
    {
      id: 'PEA_FLESH_COLOR',
      name: 'Color de Pulpa',
      description: 'Amarillo, Blanco o Rojo (Sanguino)',
      type: 'categorical',
      options: [
        { value: 'yellow', label: 'Amarilla' },
        { value: 'white', label: 'Blanca (Más dulce/ácido bajo)' },
        { value: 'red', label: 'Roja (Sanguina)' }
      ],
      required: true
    },
    {
      id: 'PEA_STONE',
      name: 'Adherencia del Carozo (Stone)',
      description: 'Prisco (Freestone) vs Pavía (Clingstone)',
      type: 'categorical',
      options: [
        { value: 'freestone', label: 'Prisco (Carozo suelto - Mercado Fresco)' },
        { value: 'clingstone', label: 'Pavía (Carozo adherido - Industria)' }
      ],
      required: true
    },
    {
      id: 'PEA_CHILLING',
      name: 'Requerimiento de Horas Frío',
      description: 'Bajo frío (subtropical) vs Alto frío (templado)',
      type: 'numeric',
      unit: 'HF',
      min: 150,
      max: 1200,
      required: true
    }
  ],
  'PLUM': [
    {
      id: 'PLU_TYPE',
      name: 'Tipo de Ciruela',
      description: 'Japonesa (consumo fresco) vs Europea (secado/ciruela pasa)',
      type: 'categorical',
      options: [
        { value: 'japanese', label: 'Japonesa (Prunus salicina)' },
        { value: 'european', label: 'Europea (Prunus domestica)' }
      ],
      required: true
    },
    {
      id: 'PLU_SKIN_COLOR',
      name: 'Color de Piel',
      description: 'Roja, negra, amarilla o verde (Reina Claudia)',
      type: 'categorical',
      options: [
        { value: 'red', label: 'Roja' },
        { value: 'black', label: 'Negra/Morada oscura' },
        { value: 'yellow', label: 'Amarilla' },
        { value: 'green', label: 'Verde' }
      ],
      required: true
    },
    {
      id: 'PLU_BRIX',
      name: 'Dulzura (Brix)',
      description: 'Crucial para ciruelas pasas (>20)',
      type: 'numeric',
      unit: '°Bx',
      min: 12,
      max: 30,
      required: true
    },
    {
      id: 'PLU_POLLINATION',
      name: 'Requerimiento de Polinización',
      description: 'Muchas japonesas requieren polinizador cruzado',
      type: 'categorical',
      options: [
        { value: 'self_fertile', label: 'Auto-fértil' },
        { value: 'cross', label: 'Requiere Polinizador (Auto-incompatible)' }
      ],
      required: true
    }
  ],
  'CHERRY': [
    {
      id: 'CHE_FRUIT_SIZE',
      name: 'Calibre del Fruto (Row size / mm)',
      description: 'Premium exige calibres enormes (>28mm)',
      type: 'numeric',
      unit: 'mm',
      min: 22,
      max: 34,
      required: true
    },
    {
      id: 'CHE_CRACKING',
      name: 'Resistencia al Agrietamiento (Cracking)',
      description: 'Lluvia en precosecha hace explotar el fruto',
      type: 'categorical',
      options: [
        { value: 1, label: 'Muy Tolerante' },
        { value: 9, label: 'Muy Susceptible (Se raja fácilmente)' }
      ],
      required: true
    },
    {
      id: 'CHE_FIRMNESS',
      name: 'Firmeza de Pulpa',
      description: 'Crucial para exportación marítima',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Firmeza Excelente (Exportación)' },
        { value: 'low', label: 'Blanda (Mercado local)' }
      ],
      required: true
    },
    {
      id: 'CHE_STEM',
      name: 'Retención de Pedicelo (Stem)',
      description: 'Un pedicelo verde y adherido es signo de frescura',
      type: 'categorical',
      options: [
        { value: 'strong', label: 'Fuerte (No se desprende)' },
        { value: 'weak', label: 'Débil (Se cae al cosechar)' }
      ],
      required: true
    }
  ],
  'APRICOT': [
    {
      id: 'APR_SHARKA',
      name: 'Resistencia a Sharka (PPV)',
      description: 'Plum Pox Virus, devastador en carozo',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistente' },
        { value: 'susceptible', label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'APR_FLESH',
      name: 'Firmeza y Textura',
      description: 'El damasco madura muy rápido (baja postcosecha)',
      type: 'categorical',
      options: [
        { value: 'firm', label: 'Firme (Mejor vida útil)' },
        { value: 'melting', label: 'Fundente / Blanda' }
      ],
      required: true
    },
    {
      id: 'APR_ACIDITY',
      name: 'Acidez de la Piel',
      description: 'Piel ácida contrasta con pulpa dulce',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alta (Cítrica)' },
        { value: 'low', label: 'Baja (Piel dulce)' }
      ],
      required: true
    },
    {
      id: 'APR_CHILLING',
      name: 'Horas Frío',
      description: 'Suelen florecer muy temprano (riesgo heladas)',
      type: 'numeric',
      unit: 'HF',
      min: 300,
      max: 1000,
      required: true
    }
  ],
  'PEAR': [
    {
      id: 'PER_FIRE_BLIGHT',
      name: 'Resistencia a Fuego Bacteriano (Erwinia)',
      description: 'Enfermedad letal en pomáceas',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Resistente' },
        { value: 9, label: 'Altamente Susceptible' }
      ],
      required: true
    },
    {
      id: 'PER_SKIN_RUSSET',
      name: 'Russeting (Roña)',
      description: 'Piel corchosa (Deseable en Bosc, indeseable en Williams)',
      type: 'categorical',
      options: [
        { value: 'smooth', label: 'Lisa (Limpia)' },
        { value: 'russet', label: 'Russet completo (Marrón áspero)' }
      ],
      required: true
    },
    {
      id: 'PER_SHAPE',
      name: 'Forma Típica',
      description: 'Piriforme vs Redonda (Pera Asiática / Nashi)',
      type: 'categorical',
      options: [
        { value: 'pyriform', label: 'Piriforme (Europea)' },
        { value: 'round', label: 'Redonda (Nashi)' }
      ],
      required: true
    },
    {
      id: 'PER_STORAGE',
      name: 'Vida de Guarda',
      description: 'Meses en frío convencional o atmósfera controlada',
      type: 'numeric',
      unit: 'meses',
      min: 1,
      max: 10,
      required: true
    }
  ],
  'FIG': [
    {
      id: 'FIG_PARTHENOCARPY',
      name: 'Fructificación Partenocárpica',
      description: 'Tipo Común (sin polinizar) vs Esmirna (requiere avispa Blastophaga)',
      type: 'categorical',
      options: [
        { value: 'common', label: 'Tipo Común (No requiere avispa)' },
        { value: 'smyrna', label: 'Tipo Esmirna (Requiere caprificación)' }
      ],
      required: true
    },
    {
      id: 'FIG_BREBA',
      name: 'Producción de Brevas',
      description: 'Primer cultivo de la temporada en madera del año anterior',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alta (Bífera)' },
        { value: 'none', label: 'Nula (Solo higos de otoño / Unífera)' }
      ],
      required: true
    },
    {
      id: 'FIG_OSTIOLE',
      name: 'Tamaño del Ostíolo (Ojo)',
      description: 'Ojo cerrado previene entrada de insectos y fermentación (souring)',
      type: 'categorical',
      options: [
        { value: 'closed', label: 'Cerrado/Estrecho (Resistente)' },
        { value: 'open', label: 'Abierto (Susceptible)' }
      ],
      required: true
    },
    {
      id: 'FIG_SKIN_COLOR',
      name: 'Color de Piel',
      description: 'Negro/Morado, Verde/Amarillo, Marrón',
      type: 'categorical',
      options: [
        { value: 'black', label: 'Morado/Negro (Mission)' },
        { value: 'green', label: 'Verde/Blanco (Kadota/Adriatic)' },
        { value: 'brown', label: 'Marrón (Turkey)' }
      ],
      required: true
    }
  ],
  'POMEGRANATE': [
    {
      id: 'POM_ARIL_COLOR',
      name: 'Color de Arilos',
      description: 'Rosa pálido hasta Rojo profundo',
      type: 'categorical',
      options: [
        { value: 'dark_red', label: 'Rojo Oscuro (Wonderful)' },
        { value: 'pink', label: 'Rosa / Rojo claro' }
      ],
      required: true
    },
    {
      id: 'POM_SEED_HARDNESS',
      name: 'Dureza de Semilla',
      description: 'Semilla blanda es preferida para consumo fresco',
      type: 'categorical',
      options: [
        { value: 'soft', label: 'Blanda (Masticable)' },
        { value: 'semi_soft', label: 'Semi-blanda' },
        { value: 'hard', label: 'Dura (Madera)' }
      ],
      required: true
    },
    {
      id: 'POM_ACIDITY',
      name: 'Relación Dulce/Ácido',
      description: 'Se busca equilibrio (ni muy agria ni sosa)',
      type: 'categorical',
      options: [
        { value: 'sweet', label: 'Dulce' },
        { value: 'sweet_tart', label: 'Agridulce (Sweet-tart)' },
        { value: 'sour', label: 'Agria (Acid)' }
      ],
      required: true
    },
    {
      id: 'POM_CRACKING',
      name: 'Rajado de Fruto (Splitting)',
      description: 'Problema severo ante fluctuaciones de riego antes de cosecha',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Muy Susceptible' }
      ],
      required: true
    }
  ],
  'PASSION_FRUIT': [
    {
      id: 'PAS_SPECIES',
      name: 'Tipo / Especie',
      description: 'Amarillo (edulis f. flavicarpa) vs Morado (edulis f. edulis) vs Granadilla',
      type: 'categorical',
      options: [
        { value: 'yellow', label: 'Maracuyá Amarillo (Industria/Ácido)' },
        { value: 'purple', label: 'Maracuyá Morado (Fresco/Dulce)' },
        { value: 'ligularis', label: 'Granadilla Dulce' }
      ],
      required: true
    },
    {
      id: 'PAS_BRIX',
      name: 'Grados Brix de la Pulpa',
      description: 'Importante para jugo',
      type: 'numeric',
      unit: '°Bx',
      min: 12,
      max: 20,
      required: true
    },
    {
      id: 'PAS_POLLINATION',
      name: 'Auto-compatibilidad',
      description: 'Amarillos suelen requerir polinización manual o abejas carpinteras',
      type: 'categorical',
      options: [
        { value: 'self_compatible', label: 'Auto-compatible' },
        { value: 'cross', label: 'Auto-incompatible (Requiere cruzada)' }
      ],
      required: true
    },
    {
      id: 'PAS_VIRUS',
      name: 'Resistencia a Virus de la Madera (Woodiness)',
      description: 'Enfermedad limitante',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'GUAVA': [
    {
      id: 'GUA_FLESH_COLOR',
      name: 'Color de Pulpa',
      description: 'Blanca (crujiente/asiática) vs Rosa/Roja (industria/suave)',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Blanca (Crujiente)' },
        { value: 'pink', label: 'Rosa / Roja (Suave/Aromática)' }
      ],
      required: true
    },
    {
      id: 'GUA_SEED_RATIO',
      name: 'Relación Semilla/Pulpa',
      description: 'Variedades mejoradas tienen cavidad seminal pequeña o sin semillas',
      type: 'categorical',
      options: [
        { value: 'low', label: 'Baja (Mucha pulpa, Seedless)' },
        { value: 'high', label: 'Alta (Muy semillada)' }
      ],
      required: true
    },
    {
      id: 'GUA_NEMATODE',
      name: 'Resistencia a Nematodos (Meloidogyne)',
      description: 'Principal limitante edáfica, suele injertarse',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente (Ej. BRS)' },
        { value: 9, label: 'Muy Susceptible' }
      ],
      required: true
    },
    {
      id: 'GUA_FRUIT_WEIGHT',
      name: 'Peso del Fruto',
      description: 'Gramos (Tipos Thai gigantes >500g)',
      type: 'numeric',
      unit: 'g',
      min: 50,
      max: 800,
      required: true
    }
  ],
  'DRAGON_FRUIT': [
    {
      id: 'DRA_TYPE',
      name: 'Tipo de Pitahaya / Color',
      description: 'Piel roja/pulpa blanca (undatus), Piel roja/pulpa roja (costaricensis), Piel amarilla (megalanthus)',
      type: 'categorical',
      options: [
        { value: 'red_white', label: 'Roja pulpa Blanca' },
        { value: 'red_red', label: 'Roja pulpa Roja (Magenta)' },
        { value: 'yellow', label: 'Amarilla (Dulce, con espinas)' }
      ],
      required: true
    },
    {
      id: 'DRA_POLLINATION',
      name: 'Auto-fertilidad',
      description: 'Crucial para evitar polinización manual nocturna',
      type: 'categorical',
      options: [
        { value: 'self_fertile', label: 'Auto-fértil (No requiere mano)' },
        { value: 'sterile', label: 'Auto-incompatible (Requiere manual)' }
      ],
      required: true
    },
    {
      id: 'DRA_BRIX',
      name: 'Grados Brix',
      description: 'La amarilla puede llegar a 20+, las rojas a 12-15',
      type: 'numeric',
      unit: '°Bx',
      min: 10,
      max: 22,
      required: true
    },
    {
      id: 'DRA_THORNS',
      name: 'Presencia de Espinas en Fruto',
      description: 'La pitahaya amarilla (Selenicereus) requiere cepillado',
      type: 'categorical',
      options: [
        { value: 'spineless', label: 'Fruto liso (Hylocereus)' },
        { value: 'thorny', label: 'Fruto espinoso (Megalanthus)' }
      ],
      required: true
    }
  ],
  'BANANA': [
    {
      id: 'BAN_BUNCH_WEIGHT',
      name: 'Peso del Racimo',
      description: 'Rendimiento comercial (kg)',
      type: 'numeric',
      unit: 'kg',
      min: 10,
      max: 60,
      required: true
    },
    {
      id: 'BAN_TR4',
      name: 'Resistencia a Mal de Panamá (TR4)',
      description: 'Fusarium oxysporum f. sp. cubense Tropical Race 4',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistente' },
        { value: 'susceptible', label: 'Susceptible (Ej. Cavendish)' }
      ],
      required: true
    },
    {
      id: 'BAN_FINGER_LENGTH',
      name: 'Longitud del Dedo (Fruto)',
      description: 'Tamaño individual',
      type: 'numeric',
      unit: 'cm',
      min: 10,
      max: 30,
      required: true
    },
    {
      id: 'BAN_WIND',
      name: 'Tolerancia al Viento',
      description: 'Plantas enanas sufren menos acame por viento',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alta (Enanos)' },
        { value: 'low', label: 'Baja (Altos)' }
      ],
      required: true
    }
  ],
  'MANGO': [
    {
      id: 'MGO_WEIGHT',
      name: 'Peso del Fruto',
      description: 'Gramos promedio',
      type: 'numeric',
      unit: 'g',
      min: 150,
      max: 1000,
      required: true
    },
    {
      id: 'MGO_FIBER',
      name: 'Contenido de Fibra',
      description: 'Pulpa sin fibra (exportación) vs fibrosa',
      type: 'categorical',
      options: [
        { value: 'fiberless', label: 'Sin Fibra' },
        { value: 'fibrous', label: 'Fibroso' }
      ],
      required: true
    },
    {
      id: 'MGO_ANTHRACNOSE',
      name: 'Resistencia a Antracnosis',
      description: 'Colletotrichum gloeosporioides',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'MGO_BLUSH',
      name: 'Chapa Roja (Blush)',
      description: 'Color rojo/rosado en la piel (atractivo comercial)',
      type: 'numeric',
      unit: '%',
      min: 0,
      max: 100,
      required: true
    }
  ],
  'PAPAYA': [
    {
      id: 'PAP_PRSV',
      name: 'Resistencia a PRSV',
      description: 'Papaya Ringspot Virus',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistente / Transgénica' },
        { value: 'susceptible', label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'PAP_SHAPE',
      name: 'Forma del Fruto',
      description: 'Frutos hermafroditas (piriformes) vs femeninos (redondos)',
      type: 'categorical',
      options: [
        { value: 'pyriform', label: 'Piriforme (Hermafrodita)' },
        { value: 'round', label: 'Redondo (Femenino)' }
      ],
      required: true
    },
    {
      id: 'PAP_FLESH_COLOR',
      name: 'Color de Pulpa',
      description: 'Amarillo/Naranja o Rojo/Salmón',
      type: 'categorical',
      options: [
        { value: 'yellow', label: 'Amarillo/Naranja' },
        { value: 'red', label: 'Rojo/Salmón' }
      ],
      required: true
    },
    {
      id: 'PAP_BRIX',
      name: 'Grados Brix',
      description: 'Dulzura',
      type: 'numeric',
      unit: '°Bx',
      min: 8,
      max: 16,
      required: true
    }
  ],
  'PINEAPPLE': [
    {
      id: 'PIN_CROWN',
      name: 'Tamaño de Corona',
      description: 'Proporción de la corona respecto al fruto',
      type: 'categorical',
      options: [
        { value: 'small', label: 'Pequeña/Deseable' },
        { value: 'large', label: 'Grande' }
      ],
      required: true
    },
    {
      id: 'PIN_SPINELESS',
      name: 'Hojas Sin Espinas',
      description: 'Mejora el manejo laboral (ej. MD-2)',
      type: 'categorical',
      options: [
        { value: 'spineless', label: 'Sin Espinas (Piping)' },
        { value: 'spiny', label: 'Con Espinas' }
      ],
      required: true
    },
    {
      id: 'PIN_TRANSLUCENCY',
      name: 'Translucidez de Pulpa',
      description: 'Indicador de madurez y calidad en cultivares dulces',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alta (Agua/Translúcida)' },
        { value: 'low', label: 'Opaca' }
      ],
      required: true
    },
    {
      id: 'PIN_BROWNING',
      name: 'Pardeamiento Interno',
      description: 'Resistencia a pardeamiento por frío en postcosecha',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'AVOCADO': [
    {
      id: 'AVO_OIL',
      name: 'Contenido de Aceite',
      description: 'Indicador legal de madurez comercial (%)',
      type: 'numeric',
      unit: '%',
      min: 8,
      max: 30,
      required: true
    },
    {
      id: 'AVO_SKIN',
      name: 'Textura de Piel',
      description: 'Rugosa (Hass) vs Lisa (Fuerte/Zutano)',
      type: 'categorical',
      options: [
        { value: 'rough', label: 'Rugosa (Se pela fácil)' },
        { value: 'smooth', label: 'Lisa / Verde' }
      ],
      required: true
    },
    {
      id: 'AVO_FLOWER',
      name: 'Tipo de Floración',
      description: 'Dicotogamia (Tipo A o B)',
      type: 'categorical',
      options: [
        { value: 'A', label: 'Tipo A' },
        { value: 'B', label: 'Tipo B' }
      ],
      required: true
    },
    {
      id: 'AVO_CHILLING',
      name: 'Daño por Frío Postcosecha',
      description: 'Resistencia a manchas oscuras por refrigeración',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Sensible' }
      ],
      required: true
    }
  ],
  'KIWI': [
    {
      id: 'KIW_FLESH_COLOR',
      name: 'Color de Pulpa',
      description: 'Verde (Hayward), Amarillo o Rojo',
      type: 'categorical',
      options: [
        { value: 'green', label: 'Verde' },
        { value: 'yellow', label: 'Amarilla' },
        { value: 'red', label: 'Roja' }
      ],
      required: true
    },
    {
      id: 'KIW_PSA',
      name: 'Resistencia a PSA',
      description: 'Pseudomonas syringae pv. actinidiae (Cáncer bacteriano)',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Altamente Susceptible' }
      ],
      required: true
    },
    {
      id: 'KIW_DRY_MATTER',
      name: 'Materia Seca',
      description: 'Relacionado directamente al sabor/dulzura final',
      type: 'numeric',
      unit: '%',
      min: 12,
      max: 22,
      required: true
    },
    {
      id: 'KIW_HAIRINESS',
      name: 'Vellosidad de Piel',
      description: 'Mucha pelusa (Verdes) vs Lisa (Amarillos/Rojos)',
      type: 'categorical',
      options: [
        { value: 'hairy', label: 'Vellosa (Peluda)' },
        { value: 'smooth', label: 'Lisa / Glabra' }
      ],
      required: true
    }
  ],
};
