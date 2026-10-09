import type { TraitDefinition } from '../types';

export const OTHERS_ONTOLOGY: Record<string, TraitDefinition[]> = {
  'TOM': [
    {
      id: 'TOM_BRIX',
      name: 'Grados Brix',
      description: 'Contenido de azúcar en el fruto',
      type: 'numeric',
      unit: '°Bx',
      min: 0,
      max: 15,
      required: true
    },
    {
      id: 'TOM_COLOR',
      name: 'Color del Fruto',
      description: 'Color predominante en estado de madurez comercial',
      type: 'categorical',
      options: [
        { value: 'red', label: 'Rojo' },
        { value: 'yellow', label: 'Amarillo' },
        { value: 'orange', label: 'Naranja' },
        { value: 'pink', label: 'Rosa' },
        { value: 'purple', label: 'Morado/Negro' }
      ]
    },
    {
      id: 'TOM_WEIGHT',
      name: 'Peso Medio del Fruto',
      type: 'numeric',
      unit: 'g',
      min: 1
    },
    {
      id: 'TOM_CRACKING',
      name: 'Resistencia al Agrietamiento (Cracking)',
      type: 'boolean'
    }
  ],
  'WHT': [
    {
      id: 'WHT_HEIGHT',
      name: 'Altura de Planta',
      type: 'numeric',
      unit: 'cm',
      min: 10,
      max: 200
    },
    {
      id: 'WHT_YIELD',
      name: 'Rendimiento por Hectárea',
      type: 'numeric',
      unit: 'kg/ha',
      min: 0
    },
    {
      id: 'WHT_RUST',
      name: 'Resistencia a Roya',
      type: 'categorical',
      options: [
        { value: 1, label: 'Muy Susceptible' },
        { value: 3, label: 'Susceptible' },
        { value: 5, label: 'Intermedio' },
        { value: 7, label: 'Resistente' },
        { value: 9, label: 'Muy Resistente' }
      ]
    }
  ],
  'MAI': [
    {
      id: 'MAI_GRAIN_YIELD',
      name: 'Rendimiento de Grano',
      description: 'Peso del grano cosechado por unidad de superficie, ajustado a humedad estándar',
      type: 'numeric',
      unit: 't/ha',
      min: 0,
      max: 25,
      required: true
    },
    {
      id: 'MAI_DAYS_ANTHESIS',
      name: 'Días a Antesis',
      description: 'Días desde la siembra hasta que el 50% de las plantas en la parcela liberan polen (floración masculina)',
      type: 'numeric',
      unit: 'días',
      min: 30,
      max: 120,
      required: true
    },
    {
      id: 'MAI_DAYS_SILKING',
      name: 'Días a Estigmas',
      description: 'Días desde la siembra hasta que el 50% de las plantas muestran estigmas visibles (floración femenina)',
      type: 'numeric',
      unit: 'días',
      min: 30,
      max: 120,
      required: true
    },
    {
      id: 'MAI_PLANT_HEIGHT',
      name: 'Altura de Planta',
      description: 'Distancia desde la superficie del suelo hasta la base de la panoja o primer nudo superior',
      type: 'numeric',
      unit: 'cm',
      min: 50,
      max: 450,
      required: false
    },
    {
      id: 'MAI_EAR_HEIGHT',
      name: 'Altura de Inserción de Mazorca',
      description: 'Distancia desde el nivel del suelo hasta el nudo de inserción de la mazorca principal',
      type: 'numeric',
      unit: 'cm',
      min: 10,
      max: 250,
      required: false
    },
    {
      id: 'MAI_ROOT_LODGING',
      name: 'Vuelco de Raíz',
      description: 'Porcentaje de plantas en la parcela inclinadas más de 30 grados desde la vertical',
      type: 'numeric',
      unit: '%',
      min: 0,
      max: 100,
      required: true
    },
    {
      id: 'MAI_STALK_LODGING',
      name: 'Quebrado de Tallo',
      description: 'Porcentaje de plantas con el tallo quebrado por debajo de la mazorca principal',
      type: 'numeric',
      unit: '%',
      min: 0,
      max: 100,
      required: true
    },
    {
      id: 'MAI_GRAIN_MOISTURE',
      name: 'Humedad de Grano al Cosechar',
      description: 'Contenido de humedad del grano medido al momento de la cosecha',
      type: 'numeric',
      unit: '%',
      min: 5,
      max: 45,
      required: true
    },
    {
      id: 'MAI_KERNEL_COLOR',
      name: 'Color de Grano',
      description: 'Color predominante del endospermo/pericarpio de los granos en la mazorca',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Blanco' },
        { value: 'yellow', label: 'Amarillo' },
        { value: 'orange', label: 'Naranja' },
        { value: 'red', label: 'Rojo' },
        { value: 'mixed', label: 'Mixto' }
      ],
      required: false
    },
    {
      id: 'MAI_FOLIAR_DISEASE_SCORE',
      name: 'Severidad de Enfermedades Foliares',
      description: 'Evaluación visual del daño general por enfermedades foliares (ej. Tizón, Roya) en una escala 1-9',
      type: 'categorical',
      options: [
        { value: 1, label: '1 - Sin síntomas (Altamente Resistente)' },
        { value: 3, label: '3 - Lesiones leves (Resistente)' },
        { value: 5, label: '5 - Lesiones moderadas (Intermedio)' },
        { value: 7, label: '7 - Lesiones severas (Susceptible)' },
        { value: 9, label: '9 - Planta muerta o casi muerta (Altamente Susceptible)' }
      ],
      required: false
    }
  ],
  'MAI_SWEET': [
    {
      id: 'MAIS_BRIX',
      name: 'Grados Brix (Contenido de Azúcar)',
      description: 'Medición del contenido de sólidos solubles (azúcares) en el endospermo',
      type: 'numeric',
      unit: '°Bx',
      min: 0,
      max: 30,
      required: true
    },
    {
      id: 'MAIS_EAR_LENGTH',
      name: 'Longitud de Mazorca',
      description: 'Longitud de la mazorca principal deschalada',
      type: 'numeric',
      unit: 'cm',
      min: 5,
      max: 40,
      required: false
    },
    {
      id: 'MAIS_KERNEL_ROWS',
      name: 'Hileras de Granos',
      description: 'Número de hileras de granos por mazorca',
      type: 'numeric',
      unit: 'count',
      min: 8,
      max: 30,
      required: true
    },
    {
      id: 'MAIS_TENDERNESS',
      name: 'Terneza (Eating Quality)',
      description: 'Evaluación sensorial de la terneza del pericarpio al masticar',
      type: 'categorical',
      options: [
        { value: 1, label: '1 - Muy Duro' },
        { value: 3, label: '3 - Duro' },
        { value: 5, label: '5 - Aceptable' },
        { value: 7, label: '7 - Tierno' },
        { value: 9, label: '9 - Muy Tierno' }
      ],
      required: false
    }
  ],
  'MAI_POP': [
    {
      id: 'MAIP_EXPANSION_VOL',
      name: 'Volumen de Expansión',
      description: 'Volumen de rosetas producidas por gramo de grano crudo (Popping expansion)',
      type: 'numeric',
      unit: 'mL/g',
      min: 10,
      max: 60,
      required: true
    },
    {
      id: 'MAIP_POPABILITY',
      name: 'Capacidad de Reventado',
      description: 'Porcentaje de granos que revientan exitosamente',
      type: 'numeric',
      unit: '%',
      min: 0,
      max: 100,
      required: true
    },
    {
      id: 'MAIP_FLAKE_TYPE',
      name: 'Tipo de Roseta',
      description: 'Forma predominante de la roseta expandida',
      type: 'categorical',
      options: [
        { value: 'butterfly', label: 'Mariposa (Butterfly)' },
        { value: 'mushroom', label: 'Hongo (Mushroom)' }
      ],
      required: false
    },
    {
      id: 'MAIP_TEST_WEIGHT',
      name: 'Peso Hectolítrico',
      description: 'Peso del grano por unidad de volumen',
      type: 'numeric',
      unit: 'kg/hL',
      min: 50,
      max: 90,
      required: false
    }
  ],
  'TOM_CHERRY': [
    {
      id: 'TOMC_FRUITS_CLUSTER',
      name: 'Frutos por Racimo',
      description: 'Número promedio de frutos cuajados por racimo',
      type: 'numeric',
      unit: 'count',
      min: 1,
      max: 50,
      required: true
    },
    {
      id: 'TOMC_FRUIT_DIAMETER',
      name: 'Diámetro Ecuatorial',
      description: 'Diámetro medio del fruto',
      type: 'numeric',
      unit: 'mm',
      min: 10,
      max: 40,
      required: true
    },
    {
      id: 'TOMC_CRACKING',
      name: 'Susceptibilidad a Cracking',
      description: 'Evaluación del agrietamiento del fruto',
      type: 'categorical',
      options: [
        { value: 1, label: '1 - Sin agrietamiento (Resistente)' },
        { value: 5, label: '5 - Agrietamiento leve' },
        { value: 9, label: '9 - Agrietamiento severo (Susceptible)' }
      ],
      required: true
    },
    {
      id: 'TOMC_BRIX',
      name: 'Grados Brix',
      description: 'Sólidos solubles totales (Sabor dulce)',
      type: 'numeric',
      unit: '°Bx',
      min: 4,
      max: 15,
      required: true
    }
  ],
  'TOM_ROMA': [
    {
      id: 'TOMR_FRUIT_SHAPE',
      name: 'Forma del Fruto',
      description: 'Clasificación visual de la forma predominante',
      type: 'categorical',
      options: [
        { value: 'pyriform', label: 'Piriforme / Pera' },
        { value: 'elliptical', label: 'Elíptica' },
        { value: 'oblong', label: 'Oblonga / Cilíndrica' }
      ],
      required: true
    },
    {
      id: 'TOMR_LOCULE_NUM',
      name: 'Número de Lóculos',
      description: 'Cantidad de cavidades (lóculos) en corte transversal',
      type: 'numeric',
      unit: 'count',
      min: 2,
      max: 4,
      required: true
    },
    {
      id: 'TOMR_FIRMNESS',
      name: 'Firmeza',
      description: 'Resistencia a la compresión (importante para transporte)',
      type: 'numeric',
      unit: 'N',
      min: 5,
      max: 50,
      required: false
    },
    {
      id: 'TOMR_BRIX',
      name: 'Grados Brix',
      description: 'Contenido de sólidos solubles para uso industrial (pasta/salsa)',
      type: 'numeric',
      unit: '°Bx',
      min: 4,
      max: 10,
      required: true
    }
  ],
  'WHT_DURUM': [
    {
      id: 'WHTD_TKW',
      name: 'Peso de Mil Granos (PMG)',
      description: 'Thousand Kernel Weight, indicador de rendimiento',
      type: 'numeric',
      unit: 'g',
      min: 25,
      max: 65,
      required: true
    },
    {
      id: 'WHTD_VITREOUSNESS',
      name: 'Vitrosidad',
      description: 'Porcentaje de granos con endospermo vítreo (cristalino)',
      type: 'numeric',
      unit: '%',
      min: 0,
      max: 100,
      required: true
    },
    {
      id: 'WHTD_YELLOW_INDEX',
      name: 'Índice de Amarillo (Color b*)',
      description: 'Intensidad del color amarillo por contenido de carotenoides (esencial en pastas)',
      type: 'numeric',
      unit: 'b*',
      min: 10,
      max: 30,
      required: true
    },
    {
      id: 'WHTD_PROTEIN',
      name: 'Contenido de Proteína',
      description: 'Porcentaje de proteína en base seca',
      type: 'numeric',
      unit: '%',
      min: 8,
      max: 20,
      required: true
    }
  ],
  'WHT_BREAD': [
    {
      id: 'WHTB_DAYS_ANTHESIS',
      name: 'Días a Antesis',
      description: 'Días desde emergencia hasta floración (Zadoks 65)',
      type: 'numeric',
      unit: 'días',
      min: 60,
      max: 150,
      required: true
    },
    {
      id: 'WHTB_BAKING_STRENGTH',
      name: 'Fuerza Panadera (W)',
      description: 'Trabajo de deformación de la masa (Alveógrafo de Chopin)',
      type: 'numeric',
      unit: '10E-4 J',
      min: 100,
      max: 500,
      required: true
    },
    {
      id: 'WHTB_TEST_WEIGHT',
      name: 'Peso Hectolítrico',
      description: 'Masa de un volumen fijo de grano (calidad molinera)',
      type: 'numeric',
      unit: 'kg/hL',
      min: 65,
      max: 85,
      required: true
    },
    {
      id: 'WHTB_SPIKE_LENGTH',
      name: 'Longitud de Espiga',
      description: 'Distancia desde el nudo basal hasta la espiguilla apical (sin aristas)',
      type: 'numeric',
      unit: 'cm',
      min: 5,
      max: 20,
      required: false
    }
  ],
  'SOY_SHORT': [
    {
      id: 'SOYS_DAYS_R1',
      name: 'Días a R1 (Floración)',
      description: 'Días desde emergencia hasta aparición de la primera flor',
      type: 'numeric',
      unit: 'días',
      min: 25,
      max: 60,
      required: true
    },
    {
      id: 'SOYS_DAYS_R8',
      name: 'Días a R8 (Madurez Fisiológica)',
      description: 'Días desde emergencia hasta que el 95% de las vainas alcanzan su color maduro',
      type: 'numeric',
      unit: 'días',
      min: 75,
      max: 120,
      required: true
    },
    {
      id: 'SOYS_NODE_COUNT',
      name: 'Número de Nudos en Tallo Principal',
      description: 'Fundamental para determinar potencial en ciclos cortos',
      type: 'numeric',
      unit: 'count',
      min: 10,
      max: 25,
      required: true
    },
    {
      id: 'SOYS_PODS_PER_PLANT',
      name: 'Vainas por Planta',
      description: 'Número total de vainas con al menos un grano normal',
      type: 'numeric',
      unit: 'count',
      min: 10,
      max: 150,
      required: true
    }
  ],
  'SUN_OIL': [
    {
      id: 'SUNO_OLEIC_ACID',
      name: 'Contenido de Ácido Oleico',
      description: 'Porcentaje de ácido oleico sobre el total de ácidos grasos',
      type: 'numeric',
      unit: '%',
      min: 50,
      max: 95,
      required: true
    },
    {
      id: 'SUNO_OIL_CONTENT',
      name: 'Contenido de Aceite',
      description: 'Porcentaje de aceite en la semilla entera',
      type: 'numeric',
      unit: '%',
      min: 30,
      max: 60,
      required: true
    },
    {
      id: 'SUNO_DOWNY_MILDEW',
      name: 'Resistencia a Downy Mildew (Plasmopara)',
      description: 'Resistencia a mildiú velloso',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Susceptible' },
        { value: 5, label: 'Resistencia Intermedia' },
        { value: 9, label: 'Altamente Resistente' }
      ],
      required: true
    },
    {
      id: 'SUNO_DAYS_FLOWERING',
      name: 'Días a Floración',
      description: 'Días desde la siembra hasta R5.1 (comienzo de floración)',
      type: 'numeric',
      unit: 'días',
      min: 40,
      max: 100,
      required: true
    }
  ],
  'SUN_CONF': [
    {
      id: 'SUNC_1000_SEED_WT',
      name: 'Peso de 1000 Semillas',
      description: 'Indicador clave de tamaño comercial para confitería',
      type: 'numeric',
      unit: 'g',
      min: 80,
      max: 200,
      required: true
    },
    {
      id: 'SUNC_HULL_CONTENT',
      name: 'Contenido de Cáscara',
      description: 'Proporción de cáscara (pericarpio) en la semilla entera',
      type: 'numeric',
      unit: '%',
      min: 20,
      max: 55,
      required: true
    },
    {
      id: 'SUNC_HEAD_DIAMETER',
      name: 'Diámetro del Capítulo',
      description: 'Diámetro de la cabeza en madurez fisiológica',
      type: 'numeric',
      unit: 'cm',
      min: 10,
      max: 40,
      required: true
    },
    {
      id: 'SUNC_SEED_INTEGRITY',
      name: 'Integridad de Semilla',
      description: 'Porcentaje de semillas sin daño mecánico o por insectos',
      type: 'numeric',
      unit: '%',
      min: 50,
      max: 100,
      required: false
    }
  ],
  'POT_FRY': [
    {
      id: 'POTF_DRY_MATTER',
      name: 'Materia Seca',
      description: 'Porcentaje de materia seca (crucial para fritura y textura)',
      type: 'numeric',
      unit: '%',
      min: 15,
      max: 30,
      required: true
    },
    {
      id: 'POTF_REDUCING_SUGARS',
      name: 'Azúcares Reductores',
      description: 'Contenido de glucosa+fructosa (niveles altos oscurecen la fritura)',
      type: 'numeric',
      unit: 'mg/g',
      min: 0,
      max: 10,
      required: true
    },
    {
      id: 'POTF_TUBER_SHAPE',
      name: 'Forma del Tubérculo',
      description: 'Para industria se requieren formas alargadas (oblongas/largas)',
      type: 'categorical',
      options: [
        { value: 'round', label: 'Redonda' },
        { value: 'oval', label: 'Oval' },
        { value: 'oblong', label: 'Oblonga' },
        { value: 'long', label: 'Larga (Alargada)' }
      ],
      required: true
    },
    {
      id: 'POTF_EYE_DEPTH',
      name: 'Profundidad de Ojos',
      description: 'Ojos profundos aumentan pérdida en pelado industrial',
      type: 'categorical',
      options: [
        { value: 1, label: 'Muy Superficiales' },
        { value: 5, label: 'Intermedios' },
        { value: 9, label: 'Muy Profundos' }
      ],
      required: true
    }
  ],
  'POT_TABLE': [
    {
      id: 'POTT_SKIN_COLOR',
      name: 'Color de Piel',
      description: 'Atributo visual para el mercado de consumo en fresco',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Blanca' },
        { value: 'yellow', label: 'Amarilla' },
        { value: 'red', label: 'Roja' },
        { value: 'purple', label: 'Morada' }
      ],
      required: true
    },
    {
      id: 'POTT_MATURITY_GROUP',
      name: 'Ciclo de Madurez',
      description: 'Clasificación de precocidad del cultivo',
      type: 'categorical',
      options: [
        { value: 'early', label: 'Temprana (Precoz)' },
        { value: 'medium', label: 'Media' },
        { value: 'late', label: 'Tardía' }
      ],
      required: true
    },
    {
      id: 'POTT_MARKETABLE_YIELD',
      name: 'Rendimiento Comercial',
      description: 'Peso de tubérculos con tamaño y apariencia aptos para venta',
      type: 'numeric',
      unit: 't/ha',
      min: 10,
      max: 80,
      required: true
    },
    {
      id: 'POTT_TASTE_TEXTURE',
      name: 'Calidad Culinaria (Textura)',
      description: 'Firmeza al hervir (ej. Tipo A: firme, Tipo C: harinosa)',
      type: 'categorical',
      options: [
        { value: 'A', label: 'Tipo A - Firme (Para ensalada)' },
        { value: 'B', label: 'Tipo B - Moderadamente firme' },
        { value: 'C', label: 'Tipo C - Harinosa' },
        { value: 'D', label: 'Tipo D - Muy Harinosa' }
      ],
      required: false
    }
  ],
  'RIC_INDICA': [
    {
      id: 'RICI_GRAIN_LENGTH',
      name: 'Longitud del Grano',
      description: 'Longitud del grano descascarado (suele ser largo en Índica)',
      type: 'numeric',
      unit: 'mm',
      min: 5,
      max: 12,
      required: true
    },
    {
      id: 'RICI_L_W_RATIO',
      name: 'Relación Largo/Ancho',
      description: 'Cociente entre la longitud y el ancho del grano',
      type: 'numeric',
      unit: 'ratio',
      min: 2,
      max: 5,
      required: true
    },
    {
      id: 'RICI_AMYLOSE',
      name: 'Contenido de Amilosa',
      description: 'Porcentaje de amilosa (determina la textura al cocinar, suele ser alta >25%)',
      type: 'numeric',
      unit: '%',
      min: 10,
      max: 35,
      required: true
    },
    {
      id: 'RICI_DAYS_FLOWERING',
      name: 'Días a Floración',
      description: 'Días desde la emergencia hasta que el 50% de las panículas han emergido',
      type: 'numeric',
      unit: 'días',
      min: 60,
      max: 150,
      required: true
    }
  ],
  'RIC_JAPONICA': [
    {
      id: 'RICJ_PANICLES_PLANT',
      name: 'Panículas por Planta',
      description: 'Número de panículas productivas (macollos fértiles)',
      type: 'numeric',
      unit: 'count',
      min: 1,
      max: 30,
      required: true
    },
    {
      id: 'RICJ_COLD_TOLERANCE',
      name: 'Tolerancia al Frío',
      description: 'Evaluación de daño foliar o esterilidad por bajas temperaturas',
      type: 'categorical',
      options: [
        { value: 1, label: 'Muy Tolerante' },
        { value: 5, label: 'Intermedio' },
        { value: 9, label: 'Muy Susceptible' }
      ],
      required: true
    },
    {
      id: 'RICJ_STICKINESS',
      name: 'Pegajosidad (Calidad Culinaria)',
      description: 'Evaluación sensorial o instrumental de la pegajosidad (baja amilosa)',
      type: 'categorical',
      options: [
        { value: 'low', label: 'Baja' },
        { value: 'medium', label: 'Media' },
        { value: 'high', label: 'Alta' }
      ],
      required: false
    },
    {
      id: 'RICJ_BLAST_RESISTANCE',
      name: 'Resistencia a Piricularia (Blast)',
      description: 'Resistencia al tizón del arroz (Pyricularia oryzae)',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Resistente' },
        { value: 5, label: 'Intermedio' },
        { value: 9, label: 'Altamente Susceptible' }
      ],
      required: true
    }
  ],
  'BAR_MALT': [
    {
      id: 'BARM_HOT_WATER_EXTRACT',
      name: 'Extracto de Malta (HWE)',
      description: 'Porcentaje de extracto obtenido (eficiencia industrial)',
      type: 'numeric',
      unit: '%',
      min: 70,
      max: 85,
      required: true
    },
    {
      id: 'BARM_PROTEIN',
      name: 'Contenido de Proteína',
      description: 'Proteína en grano (se prefieren niveles bajos a medios para maltería: 9.5-12.5%)',
      type: 'numeric',
      unit: '%',
      min: 8,
      max: 16,
      required: true
    },
    {
      id: 'BARM_FRIABILITY',
      name: 'Friabilidad',
      description: 'Facilidad de desintegración mecánica de la malta',
      type: 'numeric',
      unit: '%',
      min: 50,
      max: 100,
      required: false
    },
    {
      id: 'BARM_DIASTATIC_POWER',
      name: 'Poder Diastásico (DP)',
      description: 'Capacidad enzimática para degradar almidón',
      type: 'numeric',
      unit: '°WK',
      min: 150,
      max: 450,
      required: false
    }
  ],
  'BAR_FEED': [
    {
      id: 'BARF_GRAIN_YIELD',
      name: 'Rendimiento en Grano',
      description: 'Rendimiento ajustado a humedad estándar',
      type: 'numeric',
      unit: 'kg/ha',
      min: 1000,
      max: 10000,
      required: true
    },
    {
      id: 'BARF_TEST_WEIGHT',
      name: 'Peso Hectolítrico',
      description: 'Peso del grano por volumen (calidad forrajera)',
      type: 'numeric',
      unit: 'kg/hL',
      min: 55,
      max: 75,
      required: true
    },
    {
      id: 'BARF_FIBER_NDF',
      name: 'Fibra Detergente Neutro (FDN)',
      description: 'Indicador de digestibilidad para consumo animal',
      type: 'numeric',
      unit: '%',
      min: 15,
      max: 30,
      required: false
    },
    {
      id: 'BARF_NET_BLOTCH',
      name: 'Mancha en Red (Net Blotch)',
      description: 'Severidad de infección por Pyrenophora teres',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Resistente' },
        { value: 5, label: 'Moderadamente Resistente' },
        { value: 9, label: 'Altamente Susceptible' }
      ],
      required: true
    }
  ],
  'OAT': [
    {
      id: 'OAT_TEST_WEIGHT',
      name: 'Peso Hectolítrico',
      description: 'Densidad del grano, clave en calidad molinera',
      type: 'numeric',
      unit: 'kg/hL',
      min: 45,
      max: 65,
      required: true
    },
    {
      id: 'OAT_HULLING_INDEX',
      name: 'Índice de Descascarado (Groat %)',
      description: 'Porcentaje de grano desnudo (groat) respecto a la semilla con cáscara',
      type: 'numeric',
      unit: '%',
      min: 60,
      max: 85,
      required: true
    },
    {
      id: 'OAT_PLANT_HEIGHT',
      name: 'Altura de Planta',
      description: 'Asociada a resistencia al vuelco (lodging) y producción de biomasa',
      type: 'numeric',
      unit: 'cm',
      min: 50,
      max: 150,
      required: true
    },
    {
      id: 'OAT_CROWN_RUST',
      name: 'Resistencia a Roya de la Corona',
      description: 'Daño foliar causado por Puccinia coronata',
      type: 'categorical',
      options: [
        { value: 1, label: '1 - Sin síntomas' },
        { value: 5, label: '5 - Daño intermedio' },
        { value: 9, label: '9 - Daño severo' }
      ],
      required: true
    }
  ],
  'SGH_GRAIN': [
    {
      id: 'SGHG_DAYS_ANTHESIS',
      name: 'Días a Antesis',
      description: 'Días desde la emergencia hasta el 50% de floración',
      type: 'numeric',
      unit: 'días',
      min: 50,
      max: 120,
      required: true
    },
    {
      id: 'SGHG_PLANT_HEIGHT',
      name: 'Altura de Planta',
      description: 'Importante para cosecha mecánica (se prefieren alturas medias/bajas)',
      type: 'numeric',
      unit: 'cm',
      min: 80,
      max: 180,
      required: true
    },
    {
      id: 'SGHG_STAY_GREEN',
      name: 'Stay-Green (Tolerancia a Sequía)',
      description: 'Capacidad de retener área foliar verde post-floración bajo estrés',
      type: 'categorical',
      options: [
        { value: 1, label: 'Bajo (Senescencia rápida)' },
        { value: 5, label: 'Intermedio' },
        { value: 9, label: 'Alto (Alto Stay-Green)' }
      ],
      required: true
    },
    {
      id: 'SGHG_TANNIN',
      name: 'Contenido de Taninos',
      description: 'Presencia de taninos condensados (afecta palatabilidad y defensa contra aves)',
      type: 'categorical',
      options: [
        { value: 'low', label: 'Bajo / Sin taninos' },
        { value: 'high', label: 'Alto (Testa pigmentada)' }
      ],
      required: true
    }
  ],
  'SGH_FORAGE': [
    {
      id: 'SGHF_BIOMASS',
      name: 'Producción de Biomasa (Materia Seca)',
      description: 'Rendimiento de materia seca por hectárea',
      type: 'numeric',
      unit: 't/ha',
      min: 10,
      max: 40,
      required: true
    },
    {
      id: 'SGHF_BMR',
      name: 'Rasgo BMR (Brown Midrib)',
      description: 'Mutación BMR que reduce la lignina y mejora la digestibilidad',
      type: 'boolean',
      required: true
    },
    {
      id: 'SGHF_BRIX',
      name: 'Grados Brix en Tallo',
      description: 'Sólidos solubles en el jugo del tallo (energía para ensilaje)',
      type: 'numeric',
      unit: '°Bx',
      min: 5,
      max: 25,
      required: false
    },
    {
      id: 'SGHF_PLANT_HEIGHT',
      name: 'Altura de Planta',
      description: 'Altura total (puede superar los 3 metros en híbridos forrajeros)',
      type: 'numeric',
      unit: 'cm',
      min: 150,
      max: 400,
      required: true
    }
  ],
  'COT': [
    {
      id: 'COT_FIBER_LENGTH',
      name: 'Longitud de Fibra (UHML)',
      description: 'Upper Half Mean Length, determinante clave de la calidad',
      type: 'numeric',
      unit: 'pulgadas',
      min: 0.8,
      max: 1.5,
      required: true
    },
    {
      id: 'COT_MICRONAIRE',
      name: 'Índice Micronaire',
      description: 'Medida combinada de finura y madurez de la fibra',
      type: 'numeric',
      unit: 'mic',
      min: 2.5,
      max: 6.0,
      required: true
    },
    {
      id: 'COT_FIBER_STRENGTH',
      name: 'Resistencia de la Fibra',
      description: 'Fuerza necesaria para romper el haz de fibras',
      type: 'numeric',
      unit: 'g/tex',
      min: 20,
      max: 40,
      required: true
    },
    {
      id: 'COT_LINT_YIELD',
      name: 'Rendimiento de Fibra',
      description: 'Rendimiento de fibra desmotada por hectárea',
      type: 'numeric',
      unit: 'kg/ha',
      min: 500,
      max: 2500,
      required: true
    }
  ],
  'CAN': [
    {
      id: 'CAN_ERUCIC_ACID',
      name: 'Ácido Erúcico',
      description: 'Nivel de ácido erúcico (debe ser <2% para calificar como Canola)',
      type: 'numeric',
      unit: '%',
      min: 0,
      max: 5,
      required: true
    },
    {
      id: 'CAN_GLUCOSINOLATES',
      name: 'Glucosinolatos',
      description: 'Concentración en harina (debe ser <30 µmol/g para Canola)',
      type: 'numeric',
      unit: 'µmol/g',
      min: 5,
      max: 50,
      required: true
    },
    {
      id: 'CAN_OIL_CONTENT',
      name: 'Contenido de Aceite',
      description: 'Porcentaje de aceite en la semilla',
      type: 'numeric',
      unit: '%',
      min: 35,
      max: 55,
      required: true
    },
    {
      id: 'CAN_BLACKLEG',
      name: 'Resistencia a Blackleg (Phoma)',
      description: 'Resistencia a Leptosphaeria maculans (Pie negro)',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 5, label: 'Moderadamente Susceptible' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'PEA_DRY': [
    {
      id: 'PEAD_GRAIN_YIELD',
      name: 'Rendimiento de Grano Seco',
      description: 'Peso del grano cosechado ajustado a humedad estándar',
      type: 'numeric',
      unit: 'kg/ha',
      min: 500,
      max: 6000,
      required: true
    },
    {
      id: 'PEAD_PROTEIN',
      name: 'Contenido de Proteína',
      description: 'Proteína cruda en el grano seco',
      type: 'numeric',
      unit: '%',
      min: 15,
      max: 30,
      required: true
    },
    {
      id: 'PEAD_LODGING',
      name: 'Resistencia al Vuelco (Lodging)',
      description: 'Evaluación visual del grado de inclinación de las plantas en madurez',
      type: 'categorical',
      options: [
        { value: 1, label: 'Erecto (Sin vuelco)' },
        { value: 5, label: 'Vuelco intermedio' },
        { value: 9, label: 'Postrado (Vuelco severo)' }
      ],
      required: true
    },
    {
      id: 'PEAD_TSW',
      name: 'Peso de 1000 Semillas',
      description: 'Indicador de tamaño de semilla',
      type: 'numeric',
      unit: 'g',
      min: 100,
      max: 350,
      required: true
    }
  ],
  'PEA_GREEN': [
    {
      id: 'PEAG_POD_YIELD',
      name: 'Rendimiento de Vainas Verdes',
      description: 'Peso total de vainas cosechadas en madurez hortícola',
      type: 'numeric',
      unit: 't/ha',
      min: 2,
      max: 15,
      required: true
    },
    {
      id: 'PEAG_TENDEROMETER',
      name: 'Lectura Tenderométrica',
      description: 'Firmeza del grano verde (determina el momento óptimo de cosecha)',
      type: 'numeric',
      unit: 'TR',
      min: 80,
      max: 150,
      required: true
    },
    {
      id: 'PEAG_PODS_PER_NODE',
      name: 'Vainas por Nudo',
      description: 'Número de vainas desarrolladas por cada nudo reproductivo',
      type: 'numeric',
      unit: 'count',
      min: 1,
      max: 4,
      required: true
    },
    {
      id: 'PEAG_DAYS_FLOWERING',
      name: 'Días a Floración',
      description: 'Días desde la siembra hasta que el 50% de las plantas florecen',
      type: 'numeric',
      unit: 'días',
      min: 30,
      max: 80,
      required: true
    }
  ],
  'CHI_DESI': [
    {
      id: 'CHID_100_SEED_WT',
      name: 'Peso de 100 Semillas',
      description: 'Suele ser menor en tipo Desi (pequeño y anguloso)',
      type: 'numeric',
      unit: 'g',
      min: 10,
      max: 30,
      required: true
    },
    {
      id: 'CHID_SEED_COLOR',
      name: 'Color de Semilla',
      description: 'Color predominante de la testa',
      type: 'categorical',
      options: [
        { value: 'brown', label: 'Marrón' },
        { value: 'black', label: 'Negro' },
        { value: 'yellow', label: 'Amarillo/Marrón claro' }
      ],
      required: true
    },
    {
      id: 'CHID_ASCOCHYTA',
      name: 'Resistencia a Ascochyta',
      description: 'Severidad del tizón (Ascochyta rabiei) en hojas y tallos',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 5, label: 'Moderadamente Susceptible' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'CHID_PLANT_HEIGHT',
      name: 'Altura de Planta',
      description: 'Altura total en madurez fisiológica',
      type: 'numeric',
      unit: 'cm',
      min: 25,
      max: 80,
      required: false
    }
  ],
  'CHI_KABULI': [
    {
      id: 'CHIK_100_SEED_WT',
      name: 'Peso de 100 Semillas',
      description: 'Suele ser mayor en tipo Kabuli (calibre grande)',
      type: 'numeric',
      unit: 'g',
      min: 25,
      max: 70,
      required: true
    },
    {
      id: 'CHIK_CALIBER_8MM',
      name: 'Retención Zaranda 8mm',
      description: 'Porcentaje de granos retenidos en criba de 8mm',
      type: 'numeric',
      unit: '%',
      min: 0,
      max: 100,
      required: true
    },
    {
      id: 'CHIK_SEED_SHAPE',
      name: 'Forma de Semilla',
      description: 'Forma predominante (suele ser redondeada tipo lechuza)',
      type: 'categorical',
      options: [
        { value: 'owl', label: 'Cabeza de Lechuza (Redondeada)' },
        { value: 'angular', label: 'Angulosa' }
      ],
      required: true
    },
    {
      id: 'CHIK_ASCOCHYTA',
      name: 'Resistencia a Ascochyta',
      description: 'Severidad del tizón (Ascochyta rabiei) en hojas y tallos',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 5, label: 'Moderadamente Susceptible' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'BEA_DRY': [
    {
      id: 'BEAD_GROWTH_HABIT',
      name: 'Hábito de Crecimiento',
      description: 'Clasificación del porte (ej. CIAT tipos I a IV)',
      type: 'categorical',
      options: [
        { value: 'I', label: 'Tipo I - Determinado arbustivo' },
        { value: 'II', label: 'Tipo II - Indeterminado arbustivo erecto' },
        { value: 'III', label: 'Tipo III - Indeterminado postrado' },
        { value: 'IV', label: 'Tipo IV - Indeterminado trepador' }
      ],
      required: true
    },
    {
      id: 'BEAD_DAYS_MATURITY',
      name: 'Días a Madurez',
      description: 'Días desde siembra hasta madurez de cosecha (R9)',
      type: 'numeric',
      unit: 'días',
      min: 60,
      max: 130,
      required: true
    },
    {
      id: 'BEAD_SEED_COLOR',
      name: 'Color de Semilla',
      description: 'Color comercial (Negro, Blanco, Pinto, Cranberry, etc.)',
      type: 'categorical',
      options: [
        { value: 'black', label: 'Negro' },
        { value: 'white', label: 'Blanco (Alubia)' },
        { value: 'red', label: 'Rojo (Colorado)' },
        { value: 'pinto', label: 'Pinto / Moteado' }
      ],
      required: true
    },
    {
      id: 'BEAD_RUST',
      name: 'Resistencia a Roya',
      description: 'Severidad de infección por Uromyces appendiculatus',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente (Sin pústulas)' },
        { value: 5, label: 'Intermedio' },
        { value: 9, label: 'Susceptible (Pústulas grandes)' }
      ],
      required: true
    }
  ],
  'BEA_SNAP': [
    {
      id: 'BEAS_POD_LENGTH',
      name: 'Longitud de Vaina',
      description: 'Longitud de la vaina en madurez hortícola (comercial)',
      type: 'numeric',
      unit: 'cm',
      min: 5,
      max: 30,
      required: true
    },
    {
      id: 'BEAS_POD_CROSS_SECTION',
      name: 'Sección Transversal de la Vaina',
      description: 'Forma del corte transversal',
      type: 'categorical',
      options: [
        { value: 'flat', label: 'Plana' },
        { value: 'oval', label: 'Oval' },
        { value: 'round', label: 'Redonda' }
      ],
      required: true
    },
    {
      id: 'BEAS_STRINGINESS',
      name: 'Presencia de Hilo',
      description: 'Presencia de sutura fibrosa (hilo) en la vaina',
      type: 'boolean',
      required: true
    },
    {
      id: 'BEAS_POD_COLOR',
      name: 'Color de Vaina',
      description: 'Color comercial predominante',
      type: 'categorical',
      options: [
        { value: 'green', label: 'Verde' },
        { value: 'yellow', label: 'Amarillo (Cera)' },
        { value: 'purple', label: 'Morado' }
      ],
      required: true
    }
  ],
  'LEN': [
    {
      id: 'LEN_COTYLEDON_COLOR',
      name: 'Color de Cotiledón',
      description: 'Define el mercado de destino',
      type: 'categorical',
      options: [
        { value: 'red', label: 'Rojo / Naranja' },
        { value: 'yellow', label: 'Amarillo' },
        { value: 'green', label: 'Verde' }
      ],
      required: true
    },
    {
      id: 'LEN_SEED_SIZE_CLASS',
      name: 'Clase de Tamaño',
      description: 'Macrosperma (grande) vs Microsperma (pequeña)',
      type: 'categorical',
      options: [
        { value: 'macro', label: 'Macrosperma (>40g/1000)' },
        { value: 'micro', label: 'Microsperma (<40g/1000)' }
      ],
      required: true
    },
    {
      id: 'LEN_DAYS_FLOWERING',
      name: 'Días a Floración',
      description: 'Clave para escape a sequía y heladas',
      type: 'numeric',
      unit: 'días',
      min: 40,
      max: 90,
      required: true
    },
    {
      id: 'LEN_ASCOCHYTA',
      name: 'Resistencia a Ascochyta',
      description: 'Severidad del tizón (Ascochyta lentis)',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 5, label: 'Intermedio' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'PEA_NUT': [
    {
      id: 'PNUT_POD_YIELD',
      name: 'Rendimiento de Caja',
      description: 'Peso de vainas (cajas) limpias y secas',
      type: 'numeric',
      unit: 'kg/ha',
      min: 1000,
      max: 7000,
      required: true
    },
    {
      id: 'PNUT_SHELLING_PERCENTAGE',
      name: 'Rendimiento de Descascarado (Shelling %)',
      description: 'Porcentaje de peso de granos respecto al peso de la caja entera',
      type: 'numeric',
      unit: '%',
      min: 50,
      max: 85,
      required: true
    },
    {
      id: 'PNUT_OLEIC_LINOLEIC_RATIO',
      name: 'Relación Oleico/Linoleico (O/L)',
      description: 'Indicador de calidad de aceite y vida útil (High Oleic > 10)',
      type: 'numeric',
      unit: 'ratio',
      min: 1,
      max: 40,
      required: true
    },
    {
      id: 'PNUT_SEEDS_PER_POD',
      name: 'Granos por Caja',
      description: 'Promedio de semillas por vaina (depende del tipo Runner, Virginia, Valencia)',
      type: 'numeric',
      unit: 'count',
      min: 1,
      max: 5,
      required: true
    }
  ],
  'SUG_CANE': [
    {
      id: 'SUGC_CANE_YIELD',
      name: 'Rendimiento Cultural (TCH)',
      description: 'Toneladas de Caña por Hectárea',
      type: 'numeric',
      unit: 't/ha',
      min: 40,
      max: 200,
      required: true
    },
    {
      id: 'SUGC_POL_PERCENT',
      name: 'Pol % Caña',
      description: 'Sacarosa aparente en la caña (Calidad azucarera)',
      type: 'numeric',
      unit: '%',
      min: 10,
      max: 18,
      required: true
    },
    {
      id: 'SUGC_FIBER_PERCENT',
      name: 'Fibra % Caña',
      description: 'Importante para molienda y cogeneración de energía (bagazo)',
      type: 'numeric',
      unit: '%',
      min: 10,
      max: 20,
      required: true
    },
    {
      id: 'SUGC_STALK_DIAMETER',
      name: 'Diámetro de Tallo',
      description: 'Medido en el tercio medio',
      type: 'numeric',
      unit: 'mm',
      min: 15,
      max: 45,
      required: false
    }
  ],
  'SUG_BEET': [
    {
      id: 'SUGB_ROOT_YIELD',
      name: 'Rendimiento de Raíz',
      description: 'Peso de raíces lavadas y descoronadas',
      type: 'numeric',
      unit: 't/ha',
      min: 30,
      max: 120,
      required: true
    },
    {
      id: 'SUGB_SUGAR_CONTENT',
      name: 'Contenido de Azúcar (Polarización)',
      description: 'Porcentaje de sacarosa en la raíz fresca',
      type: 'numeric',
      unit: '%',
      min: 12,
      max: 22,
      required: true
    },
    {
      id: 'SUGB_ALPHA_AMINO_N',
      name: 'Nitrógeno Alfa-Amino',
      description: 'Impureza que reduce la extracción de azúcar en fábrica',
      type: 'numeric',
      unit: 'mmol/100g',
      min: 0,
      max: 5,
      required: true
    },
    {
      id: 'SUGB_CERCOSPORA',
      name: 'Resistencia a Cercospora',
      description: 'Mancha foliar por Cercospora beticola',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 5, label: 'Intermedio' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'TRT': [
    {
      id: 'TRT_GRAIN_YIELD',
      name: 'Rendimiento de Grano',
      description: 'Producción de grano para alimentación animal o doble propósito',
      type: 'numeric',
      unit: 'kg/ha',
      min: 2000,
      max: 9000,
      required: true
    },
    {
      id: 'TRT_FORAGE_YIELD',
      name: 'Rendimiento de Biomasa Forrajera',
      description: 'Materia seca acumulada (uso en pastoreo o silaje)',
      type: 'numeric',
      unit: 't/ha',
      min: 4,
      max: 15,
      required: true
    },
    {
      id: 'TRT_TEST_WEIGHT',
      name: 'Peso Hectolítrico',
      description: 'Densidad de grano (suele ser menor que el trigo)',
      type: 'numeric',
      unit: 'kg/hL',
      min: 65,
      max: 80,
      required: true
    },
    {
      id: 'TRT_LODGING',
      name: 'Resistencia al Vuelco',
      description: 'Problema frecuente por alta biomasa',
      type: 'categorical',
      options: [
        { value: 1, label: 'Erecto' },
        { value: 5, label: 'Intermedio' },
        { value: 9, label: 'Vuelco Severo' }
      ],
      required: true
    }
  ],
  'QUI': [
    {
      id: 'QUI_SAPONIN',
      name: 'Contenido de Saponina',
      description: 'Determina si es variedad "dulce" (baja saponina) o "amarga"',
      type: 'numeric',
      unit: '%',
      min: 0,
      max: 2,
      required: true
    },
    {
      id: 'QUI_PANICLE_TYPE',
      name: 'Tipo de Panoja',
      description: 'Forma arquitectónica de la panoja',
      type: 'categorical',
      options: [
        { value: 'glomerulate', label: 'Glomerulada' },
        { value: 'amaranthiform', label: 'Amarantiforme' },
        { value: 'intermediate', label: 'Intermedia' }
      ],
      required: true
    },
    {
      id: 'QUI_SEED_COLOR',
      name: 'Color del Grano',
      description: 'Clave comercial (blanco, rojo, negro)',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Blanco/Crema' },
        { value: 'red', label: 'Rojo' },
        { value: 'black', label: 'Negro' }
      ],
      required: true
    },
    {
      id: 'QUI_DAYS_MATURITY',
      name: 'Días a Madurez',
      description: 'Días desde emergencia hasta madurez fisiológica',
      type: 'numeric',
      unit: 'días',
      min: 90,
      max: 160,
      required: true
    }
  ],
  'AMA': [
    {
      id: 'AMA_INFLORESCENCE_COLOR',
      name: 'Color de Inflorescencia',
      description: 'Variabilidad fenotípica (rojo, verde, naranja)',
      type: 'categorical',
      options: [
        { value: 'red', label: 'Rojo/Morado' },
        { value: 'green', label: 'Verde' },
        { value: 'orange', label: 'Naranja/Amarillo' }
      ],
      required: false
    },
    {
      id: 'AMA_GRAIN_YIELD',
      name: 'Rendimiento de Grano',
      description: 'Semilla limpia ajustada a humedad comercial',
      type: 'numeric',
      unit: 'kg/ha',
      min: 500,
      max: 4000,
      required: true
    },
    {
      id: 'AMA_PROTEIN',
      name: 'Contenido de Proteína',
      description: 'Proteína cruda de alto valor biológico',
      type: 'numeric',
      unit: '%',
      min: 13,
      max: 18,
      required: true
    },
    {
      id: 'AMA_LODGING',
      name: 'Resistencia al Vuelco',
      description: 'Debido a panículas pesadas y tallos suculentos',
      type: 'categorical',
      options: [
        { value: 1, label: 'Erecto' },
        { value: 9, label: 'Vuelco' }
      ],
      required: true
    }
  ],
  'SES': [
    {
      id: 'SES_SHATTERING',
      name: 'Dehiscencia de Cápsula',
      description: 'Retención de semilla en madurez (clave para cosecha mecánica)',
      type: 'categorical',
      options: [
        { value: 'indehiscent', label: 'Indehiscente (No desgrana)' },
        { value: 'semi', label: 'Semi-indehiscente' },
        { value: 'dehiscent', label: 'Dehiscente (Desgrana fácil)' }
      ],
      required: true
    },
    {
      id: 'SES_SEED_COLOR',
      name: 'Color de Semilla',
      description: 'Blanco, negro, marrón',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Blanco' },
        { value: 'black', label: 'Negro' },
        { value: 'brown', label: 'Marrón' }
      ],
      required: true
    },
    {
      id: 'SES_OIL_CONTENT',
      name: 'Contenido de Aceite',
      description: 'Porcentaje de aceite en semilla seca',
      type: 'numeric',
      unit: '%',
      min: 40,
      max: 60,
      required: true
    },
    {
      id: 'SES_PLANT_HEIGHT',
      name: 'Altura de Planta',
      description: 'Distancia desde la base al ápice',
      type: 'numeric',
      unit: 'cm',
      min: 50,
      max: 200,
      required: true
    }
  ],
  'ALF': [
    {
      id: 'ALF_FALL_DORMANCY',
      name: 'Reposo Invernal (Fall Dormancy)',
      description: 'Grado de dormancia (1 = latencia alta/frío, 11 = sin latencia)',
      type: 'numeric',
      unit: 'grado',
      min: 1,
      max: 11,
      required: true
    },
    {
      id: 'ALF_FORAGE_YIELD',
      name: 'Rendimiento de Forraje',
      description: 'Materia seca acumulada por corte o temporada',
      type: 'numeric',
      unit: 't/ha',
      min: 5,
      max: 30,
      required: true
    },
    {
      id: 'ALF_APHID_RESISTANCE',
      name: 'Resistencia a Pulgones',
      description: 'Comportamiento ante pulgón verde o azul',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Resistente' },
        { value: 5, label: 'Moderadamente Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'ALF_CROWN_DEPTH',
      name: 'Profundidad de Corona',
      description: 'Coronas profundas mejoran la tolerancia al pastoreo y frío',
      type: 'categorical',
      options: [
        { value: 'deep', label: 'Profunda' },
        { value: 'medium', label: 'Media' },
        { value: 'shallow', label: 'Superficial' }
      ],
      required: true
    }
  ],
  'CLO': [
    {
      id: 'CLO_DRY_MATTER',
      name: 'Materia Seca',
      description: 'Rendimiento de forraje por hectárea',
      type: 'numeric',
      unit: 't/ha',
      min: 2,
      max: 15,
      required: true
    },
    {
      id: 'CLO_STOLON_DENSITY',
      name: 'Densidad de Estolones',
      description: 'Capacidad de propagación vegetativa (especial en Trébol Blanco)',
      type: 'numeric',
      unit: 'escala',
      min: 1,
      max: 9,
      required: false
    },
    {
      id: 'CLO_HARD_SEED',
      name: 'Porcentaje de Semilla Dura',
      description: 'Semillas con latencia física (importante para resiembra natural)',
      type: 'numeric',
      unit: '%',
      min: 0,
      max: 90,
      required: true
    },
    {
      id: 'CLO_DAYS_FLOWERING',
      name: 'Días a Floración',
      description: 'Días desde emergencia hasta aparición de primeros capítulos florales',
      type: 'numeric',
      unit: 'días',
      min: 60,
      max: 150,
      required: true
    }
  ],
  'FES': [
    {
      id: 'FES_ENDOPHYTE',
      name: 'Estatus de Endófito',
      description: 'Presencia de hongo Epichloë (afecta toxicidad animal vs resistencia a insectos)',
      type: 'categorical',
      options: [
        { value: 'free', label: 'Libre de Endófito' },
        { value: 'novel', label: 'Endófito Amigable (Novel)' },
        { value: 'toxic', label: 'Endófito Tóxico (Silvestre)' }
      ],
      required: true
    },
    {
      id: 'FES_DRY_MATTER',
      name: 'Producción de Materia Seca',
      description: 'Forraje total en la estación',
      type: 'numeric',
      unit: 't/ha',
      min: 3,
      max: 20,
      required: true
    },
    {
      id: 'FES_LEAF_SOFTNESS',
      name: 'Suavidad Foliar',
      description: 'Relacionado con la palatabilidad y digestibilidad',
      type: 'categorical',
      options: [
        { value: 'soft', label: 'Suave' },
        { value: 'medium', label: 'Intermedia' },
        { value: 'harsh', label: 'Áspera' }
      ],
      required: true
    },
    {
      id: 'FES_RUST',
      name: 'Resistencia a Roya',
      description: 'Susceptibilidad a Puccinia spp.',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 5, label: 'Intermedio' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'RYE_GRASS': [
    {
      id: 'RYG_PLOIDY',
      name: 'Ploidía',
      description: 'Tetraploides (mayor digestibilidad/agua) vs Diploides (mayor persistencia)',
      type: 'categorical',
      options: [
        { value: '2n', label: 'Diploide' },
        { value: '4n', label: 'Tetraploide' }
      ],
      required: true
    },
    {
      id: 'RYG_HEADING_DATE',
      name: 'Fecha de Espigazón (Heading Date)',
      description: 'Días desde fecha base hasta que asoma la espiga',
      type: 'numeric',
      unit: 'días',
      min: 30,
      max: 100,
      required: true
    },
    {
      id: 'RYG_TILLERING',
      name: 'Capacidad de Macollaje',
      description: 'Número de macollos por planta (persistencia y densidad de pradera)',
      type: 'numeric',
      unit: 'count',
      min: 10,
      max: 100,
      required: true
    },
    {
      id: 'RYG_FORAGE_YIELD',
      name: 'Rendimiento de Forraje',
      description: 'Materia seca por hectárea',
      type: 'numeric',
      unit: 't/ha',
      min: 5,
      max: 25,
      required: true
    }
  ],
  'PEPPER_SWEET': [
    {
      id: 'PEPS_FRUIT_SHAPE',
      name: 'Forma del Fruto',
      description: 'Clasificación de mercado (Cuadrado/Blocky, Lamuyo, Cónico)',
      type: 'categorical',
      options: [
        { value: 'blocky', label: 'Cuadrado (Blocky - 4 lóbulos)' },
        { value: 'lamuyo', label: 'Rectangular (Lamuyo)' },
        { value: 'conical', label: 'Cónico' }
      ],
      required: true
    },
    {
      id: 'PEPS_WALL_THICKNESS',
      name: 'Grosor de Pared',
      description: 'Espesor del pericarpo (mayor grosor = mejor postcosecha y peso)',
      type: 'numeric',
      unit: 'mm',
      min: 2,
      max: 12,
      required: true
    },
    {
      id: 'PEPS_MATURE_COLOR',
      name: 'Color en Madurez',
      description: 'Rojo, amarillo, naranja',
      type: 'categorical',
      options: [
        { value: 'red', label: 'Rojo' },
        { value: 'yellow', label: 'Amarillo' },
        { value: 'orange', label: 'Naranja' }
      ],
      required: true
    },
    {
      id: 'PEPS_TSWV',
      name: 'Resistencia a TSWV',
      description: 'Tomato Spotted Wilt Virus (Peste Negra)',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'PEPPER_HOT': [
    {
      id: 'PEPH_SHU',
      name: 'Unidades Scoville (SHU)',
      description: 'Medida del picor (capsaicina)',
      type: 'numeric',
      unit: 'SHU',
      min: 500,
      max: 3000000,
      required: true
    },
    {
      id: 'PEPH_FRUIT_POSITION',
      name: 'Posición del Fruto',
      description: 'Erecto (mirando hacia arriba) o Péndulo',
      type: 'categorical',
      options: [
        { value: 'erect', label: 'Erecto' },
        { value: 'pendant', label: 'Péndulo' }
      ],
      required: true
    },
    {
      id: 'PEPH_FRUIT_LENGTH',
      name: 'Longitud del Fruto',
      description: 'Desde la base hasta el ápice',
      type: 'numeric',
      unit: 'cm',
      min: 1,
      max: 35,
      required: true
    },
    {
      id: 'PEPH_MATURE_COLOR',
      name: 'Color en Madurez',
      description: 'Color fisiológicamente maduro',
      type: 'categorical',
      options: [
        { value: 'red', label: 'Rojo' },
        { value: 'orange', label: 'Naranja' },
        { value: 'yellow', label: 'Amarillo' },
        { value: 'brown', label: 'Marrón / Chocolate' }
      ],
      required: true
    }
  ],
  'MILLET': [
    {
      id: 'MIL_PANICLE_LENGTH',
      name: 'Longitud de Panoja',
      description: 'Indicador directo de potencial de rendimiento',
      type: 'numeric',
      unit: 'cm',
      min: 10,
      max: 100,
      required: true
    },
    {
      id: 'MIL_GRAIN_COLOR',
      name: 'Color de Grano',
      description: 'Gris, amarillo, blanco (importante para mercado local)',
      type: 'categorical',
      options: [
        { value: 'gray', label: 'Gris' },
        { value: 'yellow', label: 'Amarillo' },
        { value: 'white', label: 'Blanco' }
      ],
      required: true
    },
    {
      id: 'MIL_DOWNY_MILDEW',
      name: 'Resistencia a Mildiú (Sclerospora)',
      description: 'Principal enfermedad foliar sistémica',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Resistente' },
        { value: 9, label: 'Muy Susceptible' }
      ],
      required: true
    },
    {
      id: 'MIL_DROUGHT_TOL',
      name: 'Tolerancia a Sequía',
      description: 'Capacidad de escape o resistencia terminal',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 5, label: 'Intermedio' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'SPELT': [
    {
      id: 'SPE_HULLABILITY',
      name: 'Facilidad de Descascarado',
      description: 'Las glumas están muy adheridas; facilidad de separación mecánica',
      type: 'categorical',
      options: [
        { value: 1, label: 'Fácil' },
        { value: 5, label: 'Intermedia' },
        { value: 9, label: 'Muy Difícil' }
      ],
      required: true
    },
    {
      id: 'SPE_PROTEIN',
      name: 'Contenido de Proteína',
      description: 'Suele ser superior al trigo pan',
      type: 'numeric',
      unit: '%',
      min: 12,
      max: 20,
      required: true
    },
    {
      id: 'SPE_SPIKE_LENGTH',
      name: 'Longitud de Espiga',
      description: 'Largo total sin aristas',
      type: 'numeric',
      unit: 'cm',
      min: 5,
      max: 20,
      required: true
    },
    {
      id: 'SPE_WINTER_HARDINESS',
      name: 'Resistencia Invernal',
      description: 'Tolerancia a heladas y frío extremo',
      type: 'categorical',
      options: [
        { value: 1, label: 'Excelente' },
        { value: 9, label: 'Pobre' }
      ],
      required: true
    }
  ],
  'BROME_GRASS': [
    {
      id: 'BROG_FORAGE_YIELD',
      name: 'Rendimiento Forrajero',
      description: 'Materia seca por corte o anual',
      type: 'numeric',
      unit: 't/ha',
      min: 3,
      max: 15,
      required: true
    },
    {
      id: 'BROG_DROUGHT_TOL',
      name: 'Tolerancia a Sequía',
      description: 'Cebadilla pampeana y otras especies',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Tolerante' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'BROG_SEED_YIELD',
      name: 'Rendimiento de Semilla',
      description: 'Capacidad de multiplicación del cultivar',
      type: 'numeric',
      unit: 'kg/ha',
      min: 200,
      max: 1500,
      required: true
    },
    {
      id: 'BROG_HEADING_DATE',
      name: 'Fecha de Espigazón',
      description: 'Días hasta floración',
      type: 'numeric',
      unit: 'días',
      min: 60,
      max: 120,
      required: true
    }
  ],
  'CITRUS_ORANGE': [
    {
      id: 'CIT_FRUIT_SIZE',
      name: 'Diámetro del Fruto',
      description: 'Calibre',
      type: 'numeric',
      unit: 'mm',
      min: 50,
      max: 120,
      required: true
    },
    {
      id: 'CIT_JUICE',
      name: 'Porcentaje de Jugo',
      description: 'Rendimiento industrial',
      type: 'numeric',
      unit: '%',
      min: 30,
      max: 60,
      required: true
    },
    {
      id: 'CIT_SEEDLESS',
      name: 'Número de Semillas',
      description: 'Se prefieren seedless (< 5) para consumo fresco',
      type: 'numeric',
      unit: 'count',
      min: 0,
      max: 30,
      required: true
    },
    {
      id: 'CIT_PEELABILITY',
      name: 'Facilidad de Pelado',
      description: 'Cuán adherida está la cáscara al albedo',
      type: 'categorical',
      options: [
        { value: 'easy', label: 'Muy Fácil (Tipo Mandarina)' },
        { value: 'medium', label: 'Medio' },
        { value: 'hard', label: 'Difícil (Firmemente adherida)' }
      ],
      required: true
    }
  ],
  'BASIL': [
    {
      id: 'BAS_LEAF_SIZE',
      name: 'Tamaño de Hoja',
      description: 'Genovese (grande) vs Fina (pequeña)',
      type: 'categorical',
      options: [
        { value: 'large', label: 'Grande (Tipo Genovesa)' },
        { value: 'small', label: 'Pequeña (Fina)' }
      ],
      required: true
    },
    {
      id: 'BAS_OIL_YIELD',
      name: 'Rendimiento de Aceite Esencial',
      description: 'Destilación (kg/ha)',
      type: 'numeric',
      unit: 'kg/ha',
      min: 10,
      max: 50,
      required: true
    },
    {
      id: 'BAS_AROMA',
      name: 'Perfil Aromático',
      description: 'Dulce, Cítrico, Canela/Clavo',
      type: 'categorical',
      options: [
        { value: 'sweet', label: 'Dulce (Linalool)' },
        { value: 'citrus', label: 'Limón / Cítrico' },
        { value: 'spicy', label: 'Especiado (Eugenol)' }
      ],
      required: true
    },
    {
      id: 'BAS_FUSARIUM',
      name: 'Resistencia a Fusarium',
      description: 'Fusarium oxysporum f. sp. basilici',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'MINT': [
    {
      id: 'MIN_MENTHOL',
      name: 'Contenido de Mentol',
      description: 'Pureza del aceite (Mentha piperita/arvensis)',
      type: 'numeric',
      unit: '%',
      min: 30,
      max: 85,
      required: true
    },
    {
      id: 'MIN_BIOMASS',
      name: 'Biomasa Fresca',
      description: 'Rendimiento por corte',
      type: 'numeric',
      unit: 't/ha',
      min: 10,
      max: 40,
      required: true
    },
    {
      id: 'MIN_STOLON',
      name: 'Vigor de Estolones',
      description: 'Capacidad de rebrote y propagación',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Muy Vigoroso' },
        { value: 'low', label: 'Débil' }
      ],
      required: true
    },
    {
      id: 'MIN_RUST',
      name: 'Resistencia a Roya de la Menta',
      description: 'Puccinia menthae',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'CORIANDER': [
    {
      id: 'COR_TYPE',
      name: 'Tipo de Uso',
      description: 'Cilantro (Hoja fresca) vs Coriandro (Semilla/Aceite)',
      type: 'categorical',
      options: [
        { value: 'leaf', label: 'Follaje (Cilantro)' },
        { value: 'seed', label: 'Semilla (Coriandro)' }
      ],
      required: true
    },
    {
      id: 'COR_BOLTING',
      name: 'Tendencia a Floración (Bolting)',
      description: 'Para cilantro de hoja se busca resistencia al bolting',
      type: 'categorical',
      options: [
        { value: 'slow', label: 'Lenta (Slow Bolting)' },
        { value: 'fast', label: 'Rápida' }
      ],
      required: true
    },
    {
      id: 'COR_LINALOOL',
      name: 'Contenido de Linalol',
      description: 'Componente principal del aceite esencial de semilla',
      type: 'numeric',
      unit: '%',
      min: 50,
      max: 80,
      required: true
    },
    {
      id: 'COR_SEED_SIZE',
      name: 'Tamaño de Semilla',
      description: 'Marruecos (grande) vs Ruso (pequeña)',
      type: 'categorical',
      options: [
        { value: 'large', label: 'Grande' },
        { value: 'small', label: 'Pequeña (Microcarpa)' }
      ],
      required: true
    }
  ],
  'OREGANO': [
    {
      id: 'ORE_CARVACROL',
      name: 'Relación Carvacrol/Timol',
      description: 'Perfil de sabor (Carvacrol alto = orégano "griego" picante)',
      type: 'categorical',
      options: [
        { value: 'carvacrol', label: 'Dominancia Carvacrol' },
        { value: 'thymol', label: 'Dominancia Timol' }
      ],
      required: true
    },
    {
      id: 'ORE_HABIT',
      name: 'Hábito de Crecimiento',
      description: 'Rastrero vs Erecto',
      type: 'categorical',
      options: [
        { value: 'erect', label: 'Erecto (Fácil cosecha mecánica)' },
        { value: 'creeping', label: 'Rastrero' }
      ],
      required: true
    },
    {
      id: 'ORE_LEAF_COLOR',
      name: 'Color de Hoja',
      description: 'Verde oscuro vs grisáceo/pubescente',
      type: 'categorical',
      options: [
        { value: 'green', label: 'Verde Oscuro' },
        { value: 'grey', label: 'Grisáceo (Pubescente)' }
      ],
      required: true
    },
    {
      id: 'ORE_WINTER_SURVIVAL',
      name: 'Supervivencia Invernal',
      description: 'Para cultivos perennes en zonas templadas',
      type: 'categorical',
      options: [
        { value: 1, label: 'Excelente' },
        { value: 9, label: 'Pobre' }
      ],
      required: true
    }
  ],
  'STEVIA': [
    {
      id: 'STV_STEVIOSIDE',
      name: 'Contenido de Esteviósido',
      description: 'Edulcorante principal (puede tener dejo amargo)',
      type: 'numeric',
      unit: '%',
      min: 4,
      max: 15,
      required: true
    },
    {
      id: 'STV_REBAUDIOSIDE_A',
      name: 'Contenido de Rebaudiósido A (Reb-A)',
      description: 'Edulcorante de mejor perfil de sabor',
      type: 'numeric',
      unit: '%',
      min: 2,
      max: 12,
      required: true
    },
    {
      id: 'STV_BIOMASS',
      name: 'Rendimiento de Hoja Seca',
      description: 'Biomasa productiva',
      type: 'numeric',
      unit: 'kg/ha',
      min: 1000,
      max: 4000,
      required: true
    },
    {
      id: 'STV_FLOWERING',
      name: 'Sensibilidad al Fotoperiodo',
      description: 'Días cortos inducen floración deteniendo el crecimiento de hoja',
      type: 'categorical',
      options: [
        { value: 'highly_sensitive', label: 'Muy Sensible (Florece rápido)' },
        { value: 'less_sensitive', label: 'Menos Sensible (Mantiene crecimiento)' }
      ],
      required: true
    }
  ],
  'BAMBARA_GNUT': [
    {
      id: 'BAM_POD_YIELD',
      name: 'Rendimiento de Vainas',
      description: 'Subterráneas, similar al maní',
      type: 'numeric',
      unit: 'kg/ha',
      min: 500,
      max: 3000,
      required: true
    },
    {
      id: 'BAM_DROUGHT',
      name: 'Supervivencia a Sequía',
      description: 'Extremadamente rústica',
      type: 'categorical',
      options: [
        { value: 1, label: 'Excelente' },
        { value: 5, label: 'Buena' }
      ],
      required: true
    },
    {
      id: 'BAM_SEED_COLOR',
      name: 'Color del Tegumento',
      description: 'Alta diversidad fenotípica (crema, rojo, negro, moteado)',
      type: 'categorical',
      options: [
        { value: 'cream', label: 'Crema' },
        { value: 'red', label: 'Rojo' },
        { value: 'black', label: 'Negro' },
        { value: 'mottled', label: 'Moteado' }
      ],
      required: true
    },
    {
      id: 'BAM_MATURITY',
      name: 'Días a Madurez',
      description: 'Tiempo hasta el secado de la vaina bajo tierra',
      type: 'numeric',
      unit: 'días',
      min: 90,
      max: 160,
      required: true
    }
  ],
  'KONJAC': [
    {
      id: 'KON_GLUCOMANNAN',
      name: 'Contenido de Glucomanano',
      description: 'Fibra soluble principal, alto valor industrial/dietético',
      type: 'numeric',
      unit: '%',
      min: 40,
      max: 65,
      required: true
    },
    {
      id: 'KON_CORM_WEIGHT',
      name: 'Peso del Cormo',
      description: 'Cormos gigantes tras varios años de cultivo',
      type: 'numeric',
      unit: 'kg',
      min: 1,
      max: 15,
      required: true
    },
    {
      id: 'KON_SHADE',
      name: 'Tolerancia a Sombra',
      description: 'Planta de sotobosque',
      type: 'categorical',
      options: [
        { value: 'obligate_shade', label: 'Requiere Sombra' },
        { value: 'partial_sun', label: 'Tolera Sol Parcial' }
      ],
      required: true
    },
    {
      id: 'KON_SPROUT',
      name: 'Días a Brotación',
      description: 'Rompimiento de latencia del cormo',
      type: 'numeric',
      unit: 'días',
      min: 30,
      max: 90,
      required: true
    }
  ],
  'JER_ARTICHOKE': [
    {
      id: 'JER_INULIN',
      name: 'Contenido de Inulina',
      description: 'Fibra prebiótica',
      type: 'numeric',
      unit: '%',
      min: 10,
      max: 20,
      required: true
    },
    {
      id: 'JER_TUBER_SHAPE',
      name: 'Forma del Tubérculo',
      description: 'Nudoso/Irregular (difícil de pelar) vs Liso',
      type: 'categorical',
      options: [
        { value: 'knobby', label: 'Muy Nudoso' },
        { value: 'smooth', label: 'Liso' }
      ],
      required: true
    },
    {
      id: 'JER_WINTER',
      name: 'Supervivencia Invernal',
      description: 'Los tubérculos resisten congelamiento en el suelo',
      type: 'categorical',
      options: [
        { value: 1, label: 'Excelente' },
        { value: 5, label: 'Moderada' }
      ],
      required: true
    },
    {
      id: 'JER_INVASIVE',
      name: 'Potencial Invasivo',
      description: 'Dificultad para erradicar tubérculos residuales',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alto (Se vuelve maleza)' },
        { value: 'low', label: 'Bajo' }
      ],
      required: true
    }
  ],
  'YACON': [
    {
      id: 'YAC_FOS',
      name: 'Contenido de FOS (Fructooligosacáridos)',
      description: 'Edulcorante bajo en calorías',
      type: 'numeric',
      unit: '%',
      min: 40,
      max: 70,
      required: true
    },
    {
      id: 'YAC_ROOT_YIELD',
      name: 'Rendimiento de Raíz Reservante',
      description: 'Kg/planta o t/ha',
      type: 'numeric',
      unit: 't/ha',
      min: 15,
      max: 80,
      required: true
    },
    {
      id: 'YAC_CRISPNESS',
      name: 'Textura / Crocancia',
      description: 'Similar a manzana o jícama',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Muy Crocante y Jugosa' },
        { value: 'medium', label: 'Harinoso/Seco' }
      ],
      required: true
    },
    {
      id: 'YAC_FLOWERING',
      name: 'Época de Floración',
      description: 'Indica el fin del ciclo de crecimiento de la raíz',
      type: 'numeric',
      unit: 'días',
      min: 150,
      max: 240,
      required: true
    }
  ],
  'RUBBER_TREE': [
    {
      id: 'RUB_LATEX_YIELD',
      name: 'Rendimiento de Látex Seco',
      description: 'Kg/ha/año',
      type: 'numeric',
      unit: 'kg/ha/año',
      min: 800,
      max: 3000,
      required: true
    },
    {
      id: 'RUB_TPD',
      name: 'Resistencia a Secado del Panel (TPD)',
      description: 'Tapping Panel Dryness (Síndrome fisiológico)',
      type: 'categorical',
      options: [
        { value: 1, label: 'Baja Incidencia' },
        { value: 9, label: 'Alta Incidencia' }
      ],
      required: true
    },
    {
      id: 'RUB_SALB',
      name: 'Resistencia a SALB',
      description: 'Mal Suramericano de las Hojas (Microcyclus ulei)',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'RUB_GIRTH',
      name: 'Crecimiento de Circunferencia',
      description: 'Velocidad para alcanzar el tamaño de pica (tapping size)',
      type: 'numeric',
      unit: 'cm/año',
      min: 3,
      max: 10,
      required: true
    }
  ],
  'PROSO_MILLET': [
    {
      id: 'PRO_SEED_COLOR',
      name: 'Color de Semilla',
      description: 'Blanco, Rojo o Negro',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Blanco' },
        { value: 'red', label: 'Rojo' },
        { value: 'black', label: 'Negro' }
      ],
      required: true
    },
    {
      id: 'PRO_CYCLE',
      name: 'Ciclo a Madurez',
      description: 'Cultivo de ciclo ultra corto (catch crop)',
      type: 'numeric',
      unit: 'días',
      min: 60,
      max: 90,
      required: true
    },
    {
      id: 'PRO_PANICLE',
      name: 'Tipo de Panícula',
      description: 'Abierta, compacta o semi-compacta',
      type: 'categorical',
      options: [
        { value: 'open', label: 'Abierta (Laxa)' },
        { value: 'compact', label: 'Compacta' }
      ],
      required: true
    },
    {
      id: 'PRO_WATER_USE',
      name: 'Eficiencia Uso de Agua (WUE)',
      description: 'Uno de los cereales con menor requerimiento hídrico',
      type: 'numeric',
      unit: 'kg/mm',
      min: 10,
      max: 30,
      required: true
    }
  ],
  'FOXTAIL_MILLET': [
    {
      id: 'FOX_BRISTLE_LENGTH',
      name: 'Longitud de Cerdas (Bristles)',
      description: 'Cerdas largas protegen contra aves',
      type: 'categorical',
      options: [
        { value: 'long', label: 'Largas (Protección)' },
        { value: 'short', label: 'Cortas/Ausentes' }
      ],
      required: true
    },
    {
      id: 'FOX_FORAGE',
      name: 'Calidad Forrajera (Henificado)',
      description: 'Se usa mucho como heno de verano',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alta' },
        { value: 'low', label: 'Baja' }
      ],
      required: true
    },
    {
      id: 'FOX_DROUGHT',
      name: 'Tolerancia a Sequía',
      description: 'Sobrevive en suelos áridos',
      type: 'categorical',
      options: [
        { value: 1, label: 'Excelente' },
        { value: 5, label: 'Media' }
      ],
      required: true
    },
    {
      id: 'FOX_YIELD',
      name: 'Rendimiento de Grano',
      description: 'kg/ha',
      type: 'numeric',
      unit: 'kg/ha',
      min: 500,
      max: 2500,
      required: true
    }
  ],
  'KODO_MILLET': [
    {
      id: 'KOD_MATURITY',
      name: 'Días a Madurez',
      description: 'Ciclo más largo que otros mijos',
      type: 'numeric',
      unit: 'días',
      min: 100,
      max: 150,
      required: true
    },
    {
      id: 'KOD_POISONING',
      name: 'Riesgo de Intoxicación Fúngica',
      description: 'Susceptible a ergot (Kodo poisoning)',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistente a hongos de panícula' },
        { value: 'susceptible', label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'KOD_STORAGE',
      name: 'Vida Útil de Almacenaje',
      description: 'La cáscara dura le da años de conservación sin plagas',
      type: 'numeric',
      unit: 'años',
      min: 1,
      max: 10,
      required: true
    },
    {
      id: 'KOD_LODGING',
      name: 'Resistencia al Vuelco',
      description: 'Posee tallos fuertes y robustos',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'CLOVER': [
    {
      id: 'CLO_SPECIES',
      name: 'Tipo de Trébol (Especie)',
      description: 'Blanco (repens) vs Rojo (pratense) vs Subterráneo',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Trébol Blanco (Pastoreo)' },
        { value: 'red', label: 'Trébol Rojo (Corte)' },
        { value: 'sub', label: 'Trébol Subterráneo (Anual)' }
      ],
      required: true
    },
    {
      id: 'CLO_STOLON',
      name: 'Densidad de Estolones',
      description: 'En trébol blanco determina la persistencia',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alta (Hoja pequeña, persistente)' },
        { value: 'low', label: 'Baja (Hoja grande/Ladino)' }
      ],
      required: true
    },
    {
      id: 'CLO_ESTROGEN',
      name: 'Fitoestrógenos (Formononetina)',
      description: 'Puede causar problemas reproductivos en ovejas',
      type: 'categorical',
      options: [
        { value: 'safe', label: 'Bajo/Seguro' },
        { value: 'high', label: 'Alto (Riesgoso)' }
      ],
      required: true
    },
    {
      id: 'CLO_N_FIXATION',
      name: 'Tasa de Fijación de Nitrógeno',
      description: 'Asociación con Rhizobium leguminosarum',
      type: 'numeric',
      unit: 'kg N/ha',
      min: 50,
      max: 300,
      required: true
    }
  ],
  'LYCHEE': [
    {
      id: 'LYC_SEED_SIZE',
      name: 'Tamaño de Semilla (Chicken-tongue)',
      description: 'Semilla abortada pequeña (Chicken tongue) aumenta pulpa',
      type: 'categorical',
      options: [
        { value: 'large', label: 'Semilla Normal / Grande' },
        { value: 'chicken_tongue', label: 'Semilla Abortada (Premium)' }
      ],
      required: true
    },
    {
      id: 'LYC_FLOWERING',
      name: 'Requerimiento de Estrés para Floración',
      description: 'Necesita estrés hídrico y frío invernal',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Requiere mucho frío/estrés' },
        { value: 'low', label: 'Florece fácil (Zonas tropicales)' }
      ],
      required: true
    },
    {
      id: 'LYC_BRIX',
      name: 'Grados Brix',
      description: 'Nivel de dulzura',
      type: 'numeric',
      unit: '°Bx',
      min: 15,
      max: 22,
      required: true
    },
    {
      id: 'LYC_PERICARP_BROWN',
      name: 'Pardeamiento de la Piel (Browning)',
      description: 'La piel roja se vuelve marrón en 24h a temperatura ambiente (deshidratación)',
      type: 'categorical',
      options: [
        { value: 'fast', label: 'Rápido (Vida útil corta)' },
        { value: 'slow', label: 'Lento (Retiene color)' }
      ],
      required: true
    }
  ],
  'JACKFRUIT': [
    {
      id: 'JAC_FLESH_TEXTURE',
      name: 'Textura de la Pulpa',
      description: 'Firme/Crujiente (consumo fresco) vs Suave/Blanda (Mermeladas)',
      type: 'categorical',
      options: [
        { value: 'firm', label: 'Firme / Crujiente (Premium)' },
        { value: 'soft', label: 'Blanda / Resbaladiza' }
      ],
      required: true
    },
    {
      id: 'JAC_FRUIT_SIZE',
      name: 'Peso del Fruto',
      description: 'Puede superar los 40 kg. Para exportación se buscan de 5-10 kg',
      type: 'numeric',
      unit: 'kg',
      min: 5,
      max: 45,
      required: true
    },
    {
      id: 'JAC_LATEX',
      name: 'Producción de Látex',
      description: 'Variedades mejoradas secretan menos látex al cortar, facilitando el procesamiento',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Mucho Látex (Pegajoso)' },
        { value: 'low', label: 'Poco Látex' }
      ],
      required: true
    },
    {
      id: 'JAC_AROMA',
      name: 'Intensidad de Aroma',
      description: 'Aroma muy penetrante',
      type: 'categorical',
      options: [
        { value: 'mild', label: 'Suave' },
        { value: 'strong', label: 'Intenso / Penetrante' }
      ],
      required: true
    }
  ],
};
