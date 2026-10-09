import type { TraitDefinition } from '../types';

export const VEGETABLES_ONTOLOGY: Record<string, TraitDefinition[]> = {
  'ONION': [
    {
      id: 'ONI_DAY_LENGTH',
      name: 'Requerimiento de Fotoperiodo',
      description: 'Días cortos, intermedios o largos para bulbificación',
      type: 'categorical',
      options: [
        { value: 'short', label: 'Día Corto' },
        { value: 'intermediate', label: 'Día Intermedio' },
        { value: 'long', label: 'Día Largo' }
      ],
      required: true
    },
    {
      id: 'ONI_PUNGENCY',
      name: 'Pungencia (Piruvato)',
      description: 'Medida del picor (micromoles de piruvato por gramo de peso fresco)',
      type: 'numeric',
      unit: 'µmol/g',
      min: 1,
      max: 15,
      required: true
    },
    {
      id: 'ONI_BULB_SHAPE',
      name: 'Forma del Bulbo',
      description: 'Globo, achatada, torpedo, etc.',
      type: 'categorical',
      options: [
        { value: 'globe', label: 'Globo' },
        { value: 'flat', label: 'Achatada' },
        { value: 'granex', label: 'Granex / Peonza' },
        { value: 'torpedo', label: 'Torpedo / Alargada' }
      ],
      required: true
    },
    {
      id: 'ONI_DRY_MATTER',
      name: 'Materia Seca del Bulbo',
      description: 'Crucial para deshidratado y conservación',
      type: 'numeric',
      unit: '%',
      min: 5,
      max: 25,
      required: true
    }
  ],
  'GARLIC': [
    {
      id: 'GAR_CLOVE_NUMBER',
      name: 'Número de Dientes por Bulbo',
      description: 'Depende del tipo ecofisiológico (blanco, morado, colorado)',
      type: 'numeric',
      unit: 'count',
      min: 4,
      max: 30,
      required: true
    },
    {
      id: 'GAR_BULB_WEIGHT',
      name: 'Peso del Bulbo',
      description: 'Peso fresco comercial del bulbo limpio',
      type: 'numeric',
      unit: 'g',
      min: 20,
      max: 150,
      required: true
    },
    {
      id: 'GAR_STORAGE_LIFE',
      name: 'Vida de Anaquel (Dormición)',
      description: 'Capacidad de almacenamiento sin brotación',
      type: 'numeric',
      unit: 'meses',
      min: 2,
      max: 12,
      required: true
    },
    {
      id: 'GAR_RUST',
      name: 'Resistencia a Roya',
      description: 'Susceptibilidad a Puccinia allii',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 5, label: 'Intermedio' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'CARROT': [
    {
      id: 'CAR_ROOT_SHAPE',
      name: 'Tipo de Raíz',
      description: 'Clasificación morfológica (Nantes, Chantenay, Imperator, Danvers)',
      type: 'categorical',
      options: [
        { value: 'nantes', label: 'Nantes (Cilíndrica)' },
        { value: 'chantenay', label: 'Chantenay (Cónica corta)' },
        { value: 'imperator', label: 'Imperator (Larga/Afinada)' },
        { value: 'danvers', label: 'Danvers (Cónica robusta)' }
      ],
      required: true
    },
    {
      id: 'CAR_CAROTENE',
      name: 'Contenido de Caroteno',
      description: 'Estimación de provitamina A y coloración (Naranja)',
      type: 'numeric',
      unit: 'mg/100g',
      min: 5,
      max: 25,
      required: true
    },
    {
      id: 'CAR_CORE_COLOR',
      name: 'Color del Corazón (Xilema)',
      description: 'Se prefiere coloración uniforme respecto al córtex',
      type: 'categorical',
      options: [
        { value: 'uniform', label: 'Uniforme con el córtex' },
        { value: 'pale', label: 'Pálido / Blanco' },
        { value: 'green', label: 'Verde (Hombros verdes)' }
      ],
      required: true
    },
    {
      id: 'CAR_ROOT_LENGTH',
      name: 'Longitud de Raíz',
      description: 'Distancia desde la corona hasta la punta',
      type: 'numeric',
      unit: 'cm',
      min: 10,
      max: 35,
      required: true
    }
  ],
  'LETTUCE': [
    {
      id: 'LET_HEAD_TYPE',
      name: 'Tipo de Lechuga',
      description: 'Iceberg, Romaine, Butterhead, Leaf',
      type: 'categorical',
      options: [
        { value: 'iceberg', label: 'Iceberg (Capuchina)' },
        { value: 'romaine', label: 'Romana' },
        { value: 'butterhead', label: 'Mantecosa' },
        { value: 'leaf', label: 'Crespa / Hoja Suelta' }
      ],
      required: true
    },
    {
      id: 'LET_BOLTING_RESISTANCE',
      name: 'Resistencia a Floración Prematura (Bolting)',
      description: 'Tolerancia al espigado bajo calor o días largos',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Resistente (Tardía)' },
        { value: 5, label: 'Intermedia' },
        { value: 9, label: 'Susceptible (Temprana)' }
      ],
      required: true
    },
    {
      id: 'LET_TIPBURN',
      name: 'Tolerancia a Tipburn',
      description: 'Necrosis marginal por deficiencia local de calcio',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante (Sin bordes quemados)' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'LET_HEAD_WEIGHT',
      name: 'Peso de Cabeza / Planta',
      description: 'Peso fresco comercial',
      type: 'numeric',
      unit: 'g',
      min: 100,
      max: 1500,
      required: true
    }
  ],
  'SPINACH': [
    {
      id: 'SPI_LEAF_TEXTURE',
      name: 'Textura de la Hoja',
      description: 'Lisa, Semi-Savoy, o Savoy (rugosa)',
      type: 'categorical',
      options: [
        { value: 'smooth', label: 'Lisa' },
        { value: 'semi_savoy', label: 'Semi-Savoy' },
        { value: 'savoy', label: 'Savoy (Muy rugosa)' }
      ],
      required: true
    },
    {
      id: 'SPI_DOWNY_MILDEW',
      name: 'Resistencia a Mildiú (Peronospora)',
      description: 'Evaluación contra cepas específicas de Peronospora farinosa',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'SPI_DAYS_BOLTING',
      name: 'Días a Espigazón',
      description: 'Días desde emergencia hasta emisión del tallo floral',
      type: 'numeric',
      unit: 'días',
      min: 25,
      max: 70,
      required: true
    },
    {
      id: 'SPI_LEAF_COLOR',
      name: 'Color Foliar',
      description: 'Se prefieren verdes oscuros',
      type: 'categorical',
      options: [
        { value: 'light_green', label: 'Verde Claro' },
        { value: 'medium_green', label: 'Verde Medio' },
        { value: 'dark_green', label: 'Verde Oscuro' }
      ],
      required: true
    }
  ],
  'CABBAGE': [
    {
      id: 'CAB_HEAD_SHAPE',
      name: 'Forma de la Cabeza',
      description: 'Redonda, chata, puntiaguda',
      type: 'categorical',
      options: [
        { value: 'round', label: 'Redonda' },
        { value: 'flat', label: 'Achatada' },
        { value: 'pointed', label: 'Cónica / Puntiaguda' }
      ],
      required: true
    },
    {
      id: 'CAB_HEAD_WEIGHT',
      name: 'Peso de la Cabeza',
      description: 'Depende de la densidad de siembra y variedad',
      type: 'numeric',
      unit: 'kg',
      min: 0.5,
      max: 6.0,
      required: true
    },
    {
      id: 'CAB_CORE_LENGTH',
      name: 'Longitud del Corazón (Core)',
      description: 'Se prefieren corazones cortos en proporción a la cabeza',
      type: 'numeric',
      unit: 'cm',
      min: 3,
      max: 15,
      required: false
    },
    {
      id: 'CAB_BLACK_ROT',
      name: 'Resistencia a Black Rot',
      description: 'Resistencia a Xanthomonas campestris',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 5, label: 'Tolerancia Intermedia' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'BROCCOLI': [
    {
      id: 'BRO_HEAD_DOME',
      name: 'Forma del Domo (Cabeza)',
      description: 'Se busca forma de domo pronunciada para que escurra el agua',
      type: 'categorical',
      options: [
        { value: 'flat', label: 'Plano' },
        { value: 'semi_dome', label: 'Semi-Domo' },
        { value: 'dome', label: 'Domo Profundo' }
      ],
      required: true
    },
    {
      id: 'BRO_BEAD_SIZE',
      name: 'Tamaño de Grano (Bead)',
      description: 'Tamaño de los botones florales (se prefiere fino)',
      type: 'categorical',
      options: [
        { value: 'fine', label: 'Fino' },
        { value: 'medium', label: 'Medio' },
        { value: 'coarse', label: 'Grueso' }
      ],
      required: true
    },
    {
      id: 'BRO_HOLLOW_STEM',
      name: 'Susceptibilidad a Tallo Hueco',
      description: 'Trastorno fisiológico por crecimiento rápido o boro',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente (Tallo macizo)' },
        { value: 5, label: 'Intermedio' },
        { value: 9, label: 'Muy susceptible' }
      ],
      required: true
    },
    {
      id: 'BRO_DAYS_MATURITY',
      name: 'Días a Cosecha',
      description: 'Días desde trasplante hasta cosecha del tallo principal',
      type: 'numeric',
      unit: 'días',
      min: 50,
      max: 120,
      required: true
    }
  ],
  'CAULIFLOWER': [
    {
      id: 'CAU_CURD_COLOR',
      name: 'Color de la Pella',
      description: 'Blanco, crema, verde, morado, naranja',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Blanco Puro' },
        { value: 'cream', label: 'Crema / Marfil' },
        { value: 'green', label: 'Verde (Romanesco/Broccoflower)' },
        { value: 'purple', label: 'Morado' }
      ],
      required: true
    },
    {
      id: 'CAU_WRAPPING',
      name: 'Cobertura Foliar (Wrapping)',
      description: 'Hojas internas envolviendo la pella (protege del sol)',
      type: 'categorical',
      options: [
        { value: 'poor', label: 'Pobre (Expuesta)' },
        { value: 'good', label: 'Buena' },
        { value: 'excellent', label: 'Excelente (Autocobertura)' }
      ],
      required: true
    },
    {
      id: 'CAU_CURD_WEIGHT',
      name: 'Peso de la Pella',
      description: 'Peso limpio sin hojas',
      type: 'numeric',
      unit: 'g',
      min: 300,
      max: 2000,
      required: true
    },
    {
      id: 'CAU_RICEINESS',
      name: 'Granulosidad (Riceiness)',
      description: 'Defecto donde la pella desarrolla textura granulosa/vellosa',
      type: 'categorical',
      options: [
        { value: 1, label: 'Ausente (Lisa y compacta)' },
        { value: 9, label: 'Presente (Descarte)' }
      ],
      required: true
    }
  ],
  'EGGPLANT': [
    {
      id: 'EGG_SHAPE',
      name: 'Forma del Fruto',
      description: 'Largo (Asiático) vs Lágrima/Globo (Italiano/Americano)',
      type: 'categorical',
      options: [
        { value: 'globe', label: 'Globo / Gota' },
        { value: 'long', label: 'Cilíndrico Largo' }
      ],
      required: true
    },
    {
      id: 'EGG_COLOR',
      name: 'Color de Piel',
      description: 'Morado oscuro, rayado, blanco, verde',
      type: 'categorical',
      options: [
        { value: 'dark_purple', label: 'Morado Oscuro / Negro' },
        { value: 'striped', label: 'Rayado (Listada de Gandia)' },
        { value: 'white', label: 'Blanco' }
      ],
      required: true
    },
    {
      id: 'EGG_SPINES',
      name: 'Espinas en el Cáliz',
      description: 'Dificulta la cosecha manual',
      type: 'categorical',
      options: [
        { value: 'spineless', label: 'Sin espinas' },
        { value: 'spiny', label: 'Con espinas' }
      ],
      required: true
    },
    {
      id: 'EGG_BITTERNESS',
      name: 'Amargor',
      description: 'Tendencia a generar solanina bajo estrés',
      type: 'categorical',
      options: [
        { value: 'low', label: 'Dulce / Sin amargor' },
        { value: 'high', label: 'Tiende a amargar' }
      ],
      required: true
    }
  ],
  'CUCUMBER': [
    {
      id: 'CUC_TYPE',
      name: 'Tipo de Mercado',
      description: 'Slicer (Fresco), Pickling (Encurtido), English (Invernadero/Partenocárpico)',
      type: 'categorical',
      options: [
        { value: 'slicer', label: 'Slicer (Mesa)' },
        { value: 'pickling', label: 'Pickle (Encurtido)' },
        { value: 'greenhouse', label: 'Inglés / Holandés (Invernadero)' }
      ],
      required: true
    },
    {
      id: 'CUC_PARTHENOCARPIC',
      name: 'Partenocarpia',
      description: 'Produce frutos sin polinización (indispensable en invernadero)',
      type: 'categorical',
      options: [
        { value: 'yes', label: 'Partenocárpico' },
        { value: 'no', label: 'Requiere Polinización' }
      ],
      required: true
    },
    {
      id: 'CUC_POWDERY_MILDEW',
      name: 'Resistencia a Oídio',
      description: 'Podosphaera xanthii',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'CUC_BITTER',
      name: 'Gen Libres de Amargor (bi)',
      description: 'Evita la formación de cucurbitacinas en los extremos del fruto',
      type: 'categorical',
      options: [
        { value: 'bitter_free', label: 'Libre de Amargor (Bi-free)' },
        { value: 'bitter', label: 'Normal (Puede amargar bajo estrés)' }
      ],
      required: true
    }
  ],
  'ZUCCHINI': [
    {
      id: 'ZUC_HABIT',
      name: 'Hábito de Planta',
      description: 'Matojo abierto (facilita cosecha) vs Denso',
      type: 'categorical',
      options: [
        { value: 'open', label: 'Abierto / Erecto' },
        { value: 'dense', label: 'Cerrado / Rastrero' }
      ],
      required: true
    },
    {
      id: 'ZUC_FRUIT_COLOR',
      name: 'Color de Fruto',
      description: 'Verde oscuro, verde claro, amarillo',
      type: 'categorical',
      options: [
        { value: 'dark_green', label: 'Verde Oscuro' },
        { value: 'light_green', label: 'Verde Claro (Gris)' },
        { value: 'yellow', label: 'Amarillo' }
      ],
      required: true
    },
    {
      id: 'ZUC_SPINES',
      name: 'Espinas en Pecíolos',
      description: 'Las espinas rayan los frutos durante la cosecha e incomodan al trabajador',
      type: 'categorical',
      options: [
        { value: 'spineless', label: 'Sin Espinas (Spineless)' },
        { value: 'spiny', label: 'Con Espinas' }
      ],
      required: true
    },
    {
      id: 'ZUC_PRECOCITY',
      name: 'Días a Primera Cosecha',
      description: 'Súper rápido (35-50 días)',
      type: 'numeric',
      unit: 'días',
      min: 35,
      max: 65,
      required: true
    }
  ],
  'SQUASH': [
    {
      id: 'SQA_SPECIES',
      name: 'Especie Principal',
      description: 'moschata (Butternut), maxima (Kabocha/Hubbard), pepo (Acorn)',
      type: 'categorical',
      options: [
        { value: 'moschata', label: 'C. moschata (Anco / Butternut)' },
        { value: 'maxima', label: 'C. maxima (Cabutia / Zapallo Plomo)' },
        { value: 'pepo', label: 'C. pepo (Acorn / Spaghetti)' }
      ],
      required: true
    },
    {
      id: 'SQA_STORAGE',
      name: 'Capacidad de Guarda',
      description: 'Meses que dura en postcosecha a temperatura ambiente',
      type: 'numeric',
      unit: 'meses',
      min: 1,
      max: 12,
      required: true
    },
    {
      id: 'SQA_FLESH_COLOR',
      name: 'Intensidad de Color de Pulpa',
      description: 'Mayor naranja = más betacaroteno y aceptación',
      type: 'categorical',
      options: [
        { value: 'deep_orange', label: 'Naranja Intenso' },
        { value: 'pale', label: 'Amarillo Pálido' }
      ],
      required: true
    },
    {
      id: 'SQA_VIRUS',
      name: 'Resistencia a Complejo de Virus',
      description: 'ZYMV, WMV, PRSV, CMV',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistencia Múltiple' },
        { value: 'susceptible', label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'MELON': [
    {
      id: 'MEL_TYPE',
      name: 'Tipo de Melón',
      description: 'Cantaloupe (reticulado), Honeydew (liso), Piel de Sapo',
      type: 'categorical',
      options: [
        { value: 'cantaloupe', label: 'Reticulado (Cantaloupe/Galia)' },
        { value: 'honeydew', label: 'Liso (Honeydew)' },
        { value: 'piel_sapo', label: 'Inodoro (Piel de Sapo / Amarillo)' }
      ],
      required: true
    },
    {
      id: 'MEL_NETTING',
      name: 'Densidad del Reticulado',
      description: 'En cantaloupes es clave comercialmente',
      type: 'categorical',
      options: [
        { value: 'dense', label: 'Denso / Grueso' },
        { value: 'sparse', label: 'Escaso' },
        { value: 'none', label: 'Liso (No aplica)' }
      ],
      required: true
    },
    {
      id: 'MEL_BRIX',
      name: 'Grados Brix',
      description: 'Dulzura (mínimo comercial 10-12)',
      type: 'numeric',
      unit: '°Bx',
      min: 8,
      max: 18,
      required: true
    },
    {
      id: 'MEL_SLIP',
      name: 'Desprendimiento (Slip)',
      description: 'Si se desprende del pedúnculo al madurar (Half-slip / Full-slip)',
      type: 'categorical',
      options: [
        { value: 'full_slip', label: 'Full Slip (Se suelta solo)' },
        { value: 'forced', label: 'Corte forzado (No slip)' }
      ],
      required: true
    }
  ],
  'WATERMELON': [
    {
      id: 'WAT_SEEDLESS',
      name: 'Ploidía (Con/Sin Semilla)',
      description: 'Diploide (con semilla) vs Triploide (sin semilla)',
      type: 'categorical',
      options: [
        { value: 'diploid', label: 'Diploide (Con Semilla)' },
        { value: 'triploid', label: 'Triploide (Seedless)' }
      ],
      required: true
    },
    {
      id: 'WAT_BRIX',
      name: 'Grados Brix (Dulzura)',
      description: 'Muy crítico, el mercado exige >11',
      type: 'numeric',
      unit: '°Bx',
      min: 8,
      max: 14,
      required: true
    },
    {
      id: 'WAT_RIND_THICKNESS',
      name: 'Grosor de Cáscara (Rind)',
      description: 'Muy gruesa (quita pulpa) vs muy fina (se rompe al transporte)',
      type: 'numeric',
      unit: 'cm',
      min: 0.5,
      max: 3,
      required: true
    },
    {
      id: 'WAT_HOLLOW_HEART',
      name: 'Tendencia a Corazón Hueco',
      description: 'Defecto de rajadura interna',
      type: 'categorical',
      options: [
        { value: 'low', label: 'Baja (Pulpa sólida)' },
        { value: 'high', label: 'Alta Incidencia' }
      ],
      required: true
    }
  ],
  'RADISH': [
    {
      id: 'RAD_SHAPE',
      name: 'Forma de la Raíz',
      description: 'Redondo, semi-largo, alargado (Daikon)',
      type: 'categorical',
      options: [
        { value: 'round', label: 'Redonda' },
        { value: 'icicle', label: 'Alargada (Tipo Icicle / Daikon)' }
      ],
      required: true
    },
    {
      id: 'RAD_SKIN_COLOR',
      name: 'Color de Piel',
      description: 'Rojo, blanco, rosado, bicolor',
      type: 'categorical',
      options: [
        { value: 'red', label: 'Rojo' },
        { value: 'white', label: 'Blanco' },
        { value: 'bicolor', label: 'Bicolor (Rojo punta blanca)' }
      ],
      required: true
    },
    {
      id: 'RAD_PITHINESS',
      name: 'Corchosis (Pithiness)',
      description: 'Ahuecamiento o textura esponjosa por madurez/calor',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Resistente (Carne firme)' },
        { value: 9, label: 'Muy Susceptible' }
      ],
      required: true
    },
    {
      id: 'RAD_DAYS_HARVEST',
      name: 'Días a Cosecha',
      description: 'Precocidad (algunos ciclos son < 30 días)',
      type: 'numeric',
      unit: 'días',
      min: 20,
      max: 60,
      required: true
    }
  ],
  'BEETROOT': [
    {
      id: 'BEE_ROOT_SHAPE',
      name: 'Forma de la Raíz',
      description: 'Globo, achatada o alargada',
      type: 'categorical',
      options: [
        { value: 'globe', label: 'Globo' },
        { value: 'flat', label: 'Achatada' },
        { value: 'cylindrical', label: 'Cilíndrica' }
      ],
      required: true
    },
    {
      id: 'BEE_INTERNAL_COLOR',
      name: 'Color Interno (Zonificación)',
      description: 'Se prefiere rojo oscuro uniforme sin anillos blancos (zonation)',
      type: 'categorical',
      options: [
        { value: 'uniform', label: 'Rojo Oscuro Uniforme' },
        { value: 'zoned', label: 'Con Anillos Blancos Visibles' }
      ],
      required: true
    },
    {
      id: 'BEE_BRIX',
      name: 'Contenido de Azúcar (Brix)',
      description: 'Dulzor (menor que remolacha azucarera, pero importante en mesa)',
      type: 'numeric',
      unit: '°Bx',
      min: 5,
      max: 15,
      required: true
    },
    {
      id: 'BEE_GEOSMIN',
      name: 'Contenido de Geosmina',
      description: 'Compuesto que da el sabor "a tierra" (puede ser indeseable en alto nivel)',
      type: 'numeric',
      unit: 'escala',
      min: 1,
      max: 9,
      required: false
    }
  ],
  'TURNIP': [
    {
      id: 'TUR_FLESH_COLOR',
      name: 'Color de Pulpa',
      description: 'Blanca vs Amarilla',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Blanco' },
        { value: 'yellow', label: 'Amarillo' }
      ],
      required: true
    },
    {
      id: 'TUR_ROOT_SHAPE',
      name: 'Forma de Raíz',
      description: 'Globo, achatada, alargada',
      type: 'categorical',
      options: [
        { value: 'flat', label: 'Achatada (Purple Top White Globe)' },
        { value: 'round', label: 'Redonda' }
      ],
      required: true
    },
    {
      id: 'TUR_LEAF_HAIR',
      name: 'Pubescencia Foliar',
      description: 'Importante si se consume la hoja (Greens) - se prefieren sin pelos',
      type: 'categorical',
      options: [
        { value: 'glabrous', label: 'Glauco/Sin pelos' },
        { value: 'hairy', label: 'Peludas' }
      ],
      required: true
    },
    {
      id: 'TUR_BOLTING',
      name: 'Resistencia a Floración',
      description: 'Tolerancia a subida prematura (Vernalización)',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Tolerante' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'CELERY': [
    {
      id: 'CEL_PETIOLE_LENGTH',
      name: 'Longitud de Penca (Pecíolo)',
      description: 'Largo útil comercial',
      type: 'numeric',
      unit: 'cm',
      min: 15,
      max: 40,
      required: true
    },
    {
      id: 'CEL_PETIOLE_COLOR',
      name: 'Color de Penca',
      description: 'Verde oscuro, verde claro, amarillo/blanco',
      type: 'categorical',
      options: [
        { value: 'dark_green', label: 'Verde Oscuro' },
        { value: 'light_green', label: 'Verde Claro' },
        { value: 'yellow', label: 'Amarillo / Blanqueado' }
      ],
      required: true
    },
    {
      id: 'CEL_STRINGINESS',
      name: 'Fibrosidad',
      description: 'Se prefieren variedades menos fibrosas (stringless)',
      type: 'categorical',
      options: [
        { value: 1, label: 'Muy Baja (Tierno)' },
        { value: 5, label: 'Media' },
        { value: 9, label: 'Alta (Fibroso)' }
      ],
      required: true
    },
    {
      id: 'CEL_HOLLOW_STEM',
      name: 'Tallo Hueco (Pithiness)',
      description: 'Defecto fisiológico por sobremadurez o estrés hídrico',
      type: 'categorical',
      options: [
        { value: 1, label: 'Ausente (Macizo)' },
        { value: 9, label: 'Presente (Descarte)' }
      ],
      required: true
    }
  ],
  'ASPARAGUS': [
    {
      id: 'ASP_SPEAR_DIAMETER',
      name: 'Diámetro del Turión',
      description: 'Grosor a nivel de la base de corte (calibre comercial)',
      type: 'numeric',
      unit: 'mm',
      min: 5,
      max: 30,
      required: true
    },
    {
      id: 'ASP_HEAD_TIGHTNESS',
      name: 'Compacidad de la Punta',
      description: 'Abertura de las brácteas apicales',
      type: 'categorical',
      options: [
        { value: 1, label: 'Muy Cerrada (Excelente)' },
        { value: 5, label: 'Ligeramente Abierta' },
        { value: 9, label: 'Abierta (Defecto)' }
      ],
      required: true
    },
    {
      id: 'ASP_BRACT_COLOR',
      name: 'Color del Turión',
      description: 'Verde, Morado o Blanco (etiolado)',
      type: 'categorical',
      options: [
        { value: 'green', label: 'Verde' },
        { value: 'purple', label: 'Morado' },
        { value: 'white', label: 'Blanco (Aporcado)' }
      ],
      required: true
    },
    {
      id: 'ASP_SEX',
      name: 'Sexo de la Planta',
      description: 'Se prefieren híbridos 100% machos por mayor rendimiento y sin maleza de semilla',
      type: 'categorical',
      options: [
        { value: 'male', label: 'Macho' },
        { value: 'female', label: 'Hembra' },
        { value: 'andromonoecious', label: 'Andromonoico' }
      ],
      required: true
    }
  ],
  'ARTICHOKE': [
    {
      id: 'ART_HEAD_SHAPE',
      name: 'Forma del Capítulo',
      description: 'Globo, oval, cónico',
      type: 'categorical',
      options: [
        { value: 'globe', label: 'Globo / Redondo' },
        { value: 'oval', label: 'Oval' },
        { value: 'conical', label: 'Cónico' }
      ],
      required: true
    },
    {
      id: 'ART_BRACT_COLOR',
      name: 'Color de Brácteas',
      description: 'Verde o Morado/Violeta',
      type: 'categorical',
      options: [
        { value: 'green', label: 'Verde' },
        { value: 'purple', label: 'Morado' }
      ],
      required: true
    },
    {
      id: 'ART_SPININESS',
      name: 'Presencia de Espinas',
      description: 'En el ápice de la bráctea',
      type: 'categorical',
      options: [
        { value: 'none', label: 'Sin Espinas' },
        { value: 'spiny', label: 'Con Espinas' }
      ],
      required: true
    },
    {
      id: 'ART_CHOKE_SIZE',
      name: 'Tamaño del "Pelusa" (Choke)',
      description: 'Proporción de flores inmaduras no comestibles (menor es mejor)',
      type: 'categorical',
      options: [
        { value: 'small', label: 'Pequeño' },
        { value: 'medium', label: 'Medio' },
        { value: 'large', label: 'Grande' }
      ],
      required: true
    }
  ],
  'KALE': [
    {
      id: 'KAL_LEAF_MARGIN',
      name: 'Tipo de Margen Foliar',
      description: 'Muy rizado (Curly), Liso/Rugoso (Dinosaur)',
      type: 'categorical',
      options: [
        { value: 'curly', label: 'Rizado (Curly)' },
        { value: 'flat', label: 'Plano / Rugoso (Lacinato/Dinosaur)' }
      ],
      required: true
    },
    {
      id: 'KAL_LEAF_COLOR',
      name: 'Color de Hoja',
      description: 'Verde claro, verde azulado, morado',
      type: 'categorical',
      options: [
        { value: 'green', label: 'Verde Claro' },
        { value: 'blue_green', label: 'Verde Azulado' },
        { value: 'purple', label: 'Morado/Rojo' }
      ],
      required: true
    },
    {
      id: 'KAL_WINTER_HARDINESS',
      name: 'Resistencia al Frío',
      description: 'Supervivencia a heladas (las heladas mejoran el sabor)',
      type: 'categorical',
      options: [
        { value: 1, label: 'Extrema (Sobrevive nieve)' },
        { value: 5, label: 'Intermedia' },
        { value: 9, label: 'Baja' }
      ],
      required: true
    },
    {
      id: 'KAL_DAYS_HARVEST',
      name: 'Días a Cosecha',
      description: 'Cosecha de hojas maduras o "baby leaf"',
      type: 'numeric',
      unit: 'días',
      min: 30,
      max: 90,
      required: true
    }
  ],
  'ARUGULA': [
    {
      id: 'ARU_LEAF_LOBATION',
      name: 'Lobulación de Hoja',
      description: 'Lisa vs profundamente serrada/lobulada',
      type: 'categorical',
      options: [
        { value: 'entire', label: 'Margen Entero/Liso' },
        { value: 'lobed', label: 'Profundamente Lobulada (Serrada)' }
      ],
      required: true
    },
    {
      id: 'ARU_PUNGENCY',
      name: 'Picor (Pungencia)',
      description: 'Intensidad del sabor "peppery/spicy" (glucosinolatos)',
      type: 'categorical',
      options: [
        { value: 'mild', label: 'Suave' },
        { value: 'medium', label: 'Medio' },
        { value: 'strong', label: 'Fuerte / Muy Picante' }
      ],
      required: true
    },
    {
      id: 'ARU_BOLTING',
      name: 'Resistencia a Floración',
      description: 'Tolerancia al calor y días largos',
      type: 'categorical',
      options: [
        { value: 1, label: 'Lenta Floración (Slow Bolting)' },
        { value: 9, label: 'Rápida Floración' }
      ],
      required: true
    },
    {
      id: 'ARU_DOWNY_MILDEW',
      name: 'Resistencia a Mildiú',
      description: 'Peronospora spp.',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'OKRA': [
    {
      id: 'OKR_POD_LENGTH',
      name: 'Longitud Óptima de Vaina',
      description: 'Tamaño de cosecha antes de ponerse fibrosa',
      type: 'numeric',
      unit: 'cm',
      min: 5,
      max: 20,
      required: true
    },
    {
      id: 'OKR_POD_COLOR',
      name: 'Color de Vaina',
      description: 'Verde, rojo/morado',
      type: 'categorical',
      options: [
        { value: 'green', label: 'Verde' },
        { value: 'red', label: 'Rojo / Morado' }
      ],
      required: true
    },
    {
      id: 'OKR_SPINELESS',
      name: 'Pubescencia Urticante (Espinocidad)',
      description: 'Presencia de tricomas que irritan la piel al cosechar',
      type: 'categorical',
      options: [
        { value: 'spineless', label: 'Sin Espinas (Spineless)' },
        { value: 'spiny', label: 'Con Tricomas Irritantes' }
      ],
      required: true
    },
    {
      id: 'OKR_DAYS_FLOWER',
      name: 'Días a Floración',
      description: 'Precocidad',
      type: 'numeric',
      unit: 'días',
      min: 40,
      max: 75,
      required: true
    }
  ],
  'TOMATILLO': [
    {
      id: 'TTO_FRUIT_SIZE',
      name: 'Diámetro del Fruto',
      description: 'Calibre del tomatillo',
      type: 'numeric',
      unit: 'cm',
      min: 2,
      max: 8,
      required: true
    },
    {
      id: 'TTO_HUSK',
      name: 'Cobertura del Cáliz (Husk)',
      description: 'El cáliz debe cubrir completamente el fruto y eventualmente romperse',
      type: 'categorical',
      options: [
        { value: 'complete', label: 'Completa (Cerrada)' },
        { value: 'split', label: 'Se rompe al madurar (Split)' }
      ],
      required: true
    },
    {
      id: 'TTO_COLOR',
      name: 'Color del Fruto',
      description: 'Verde (Tomate verde), Morado, Amarillo',
      type: 'categorical',
      options: [
        { value: 'green', label: 'Verde' },
        { value: 'purple', label: 'Morado' },
        { value: 'yellow', label: 'Amarillo' }
      ],
      required: true
    },
    {
      id: 'TTO_STICKINESS',
      name: 'Pegajosidad del Fruto',
      description: 'Sustancia cerosa/pegajosa bajo el cáliz',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Muy Pegajoso' },
        { value: 'low', label: 'Poco Pegajoso' }
      ],
      required: true
    }
  ],
  'PARSNIP': [
    {
      id: 'PAR_LENGTH',
      name: 'Longitud de Raíz',
      description: 'Raíces largas (>25cm) o cuña/cortas',
      type: 'numeric',
      unit: 'cm',
      min: 15,
      max: 35,
      required: true
    },
    {
      id: 'PAR_CANKER',
      name: 'Resistencia a Canker',
      description: 'Manchas negras/marrones en la raíz (Itersonilia)',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'PAR_WHITENESS',
      name: 'Blancura de Pulpa/Piel',
      description: 'Variedades modernas no se oxidan/amarillean fácilmente',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Blanco Puro' },
        { value: 'creamy', label: 'Crema / Marfil' }
      ],
      required: true
    },
    {
      id: 'PAR_CROWN',
      name: 'Hundimiento de Corona',
      description: 'Coronas poco profundas se lavan/pelan mejor',
      type: 'categorical',
      options: [
        { value: 'shallow', label: 'Poco Hundida' },
        { value: 'deep', label: 'Muy Hundida (Retiene tierra)' }
      ],
      required: true
    }
  ],
  'KOHLRABI': [
    {
      id: 'KOH_COLOR',
      name: 'Color de Tallo Bulbo',
      description: 'Verde pálido o morado',
      type: 'categorical',
      options: [
        { value: 'green', label: 'Verde Claro' },
        { value: 'purple', label: 'Morado' }
      ],
      required: true
    },
    {
      id: 'KOH_WOODINESS',
      name: 'Desarrollo de Fibra (Woodiness)',
      description: 'Se vuelve leñoso si se cosecha tarde o sufre sequía',
      type: 'categorical',
      options: [
        { value: 'low', label: 'Mantiene Textura Tierna' },
        { value: 'high', label: 'Se pone leñoso rápidamente' }
      ],
      required: true
    },
    {
      id: 'KOH_CRACKING',
      name: 'Resistencia a Agrietamiento',
      description: 'Rajaduras por riegos irregulares',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'KOH_DAYS',
      name: 'Días a Cosecha',
      description: 'Ciclo rápido',
      type: 'numeric',
      unit: 'días',
      min: 40,
      max: 70,
      required: true
    }
  ],
  'SWISS_CHARD': [
    {
      id: 'CHD_PETIOLE_COLOR',
      name: 'Color de Penca (Pecíolo)',
      description: 'Blanco (clásico), Rojo, Amarillo, Naranja',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Blanco (Ancha)' },
        { value: 'red', label: 'Rojo (Ruby)' },
        { value: 'mix', label: 'Arcoíris (Bright Lights)' }
      ],
      required: true
    },
    {
      id: 'CHD_BOLTING',
      name: 'Resistencia a Subida a Flor (Bolting)',
      description: 'La vernalización prematura arruina el cultivo',
      type: 'categorical',
      options: [
        { value: 1, label: 'Muy Resistente (Lento bolting)' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'CHD_LEAF_TEXTURE',
      name: 'Textura de Hoja',
      description: 'Lisa vs Ampollada (Savoy)',
      type: 'categorical',
      options: [
        { value: 'smooth', label: 'Lisa' },
        { value: 'savoy', label: 'Muy Rugosa / Ampollada' }
      ],
      required: true
    },
    {
      id: 'CHD_CERCOSPORA',
      name: 'Resistencia a Cercospora',
      description: 'Mancha foliar de la acelga',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alta' },
        { value: 'low', label: 'Baja' }
      ],
      required: true
    }
  ],
  'RADICCHIO': [
    {
      id: 'RAD_TYPE',
      name: 'Tipo de Radicchio',
      description: 'Rosso di Chioggia (redondo), Treviso (alargado), Castelfranco (variegado)',
      type: 'categorical',
      options: [
        { value: 'chioggia', label: 'Redondo (Chioggia)' },
        { value: 'treviso', label: 'Alargado (Treviso)' },
        { value: 'castelfranco', label: 'Variegado (Castelfranco)' }
      ],
      required: true
    },
    {
      id: 'RAD_COLOR_INTENSITY',
      name: 'Intensidad de Color Rojo/Morado',
      description: 'El frío mejora la pigmentación',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Morado Intenso' },
        { value: 'low', label: 'Pálido / Verdoso' }
      ],
      required: true
    },
    {
      id: 'RAD_BITTERNESS',
      name: 'Nivel de Amargor (Intibina)',
      description: 'Se busca amargor elegante y crujencia',
      type: 'categorical',
      options: [
        { value: 'pleasant', label: 'Amargor Equilibrado' },
        { value: 'harsh', label: 'Excesivamente Amargo' }
      ],
      required: true
    },
    {
      id: 'RAD_HEAD_WEIGHT',
      name: 'Peso del Cogollo',
      description: 'Gramos',
      type: 'numeric',
      unit: 'g',
      min: 150,
      max: 600,
      required: true
    }
  ],
  'FENNEL': [
    {
      id: 'FEN_BULB_SHAPE',
      name: 'Forma del Bulbo',
      description: 'Hinojo de Florencia (Bulbo redondo vs plano)',
      type: 'categorical',
      options: [
        { value: 'round', label: 'Redondo (Premium)' },
        { value: 'flat', label: 'Achatado / Plano' }
      ],
      required: true
    },
    {
      id: 'FEN_BOLTING',
      name: 'Resistencia a Espigado Precoz',
      description: 'Si espiga el bulbo pierde calidad comercial',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente (Siembra primavera)' },
        { value: 9, label: 'Susceptible (Solo siembra otoño)' }
      ],
      required: true
    },
    {
      id: 'FEN_ANISE_FLAVOR',
      name: 'Intensidad de Sabor Anisado',
      description: 'Contenido de anetol',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Dulce / Anisado Fuerte' },
        { value: 'low', label: 'Suave' }
      ],
      required: true
    },
    {
      id: 'FEN_MATURITY',
      name: 'Días a Cosecha',
      description: 'Días desde el trasplante',
      type: 'numeric',
      unit: 'días',
      min: 60,
      max: 110,
      required: true
    }
  ],
  'WATERCRESS': [
    {
      id: 'WTC_SPICINESS',
      name: 'Pungencia / Picor (Glucosinolatos)',
      description: 'Nivel de sabor picante tipo mostaza',
      type: 'categorical',
      options: [
        { value: 'mild', label: 'Suave' },
        { value: 'spicy', label: 'Picante Fuerte' }
      ],
      required: true
    },
    {
      id: 'WTC_WATER_FLOW',
      name: 'Requerimiento de Flujo de Agua',
      description: 'Berro verdadero crece sumergido en corrientes de agua limpia',
      type: 'categorical',
      options: [
        { value: 'flowing', label: 'Requiere agua corriente (Acuática estricta)' },
        { value: 'soil', label: 'Tolera suelo húmedo (Semi-acuática)' }
      ],
      required: true
    },
    {
      id: 'WTC_FLOWERING',
      name: 'Tendencia a Floración Prematura (Bolting)',
      description: 'Con días largos florece y la hoja se vuelve amarga/incomible',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Bolting Rápido' },
        { value: 'low', label: 'Lento a Florecer (Mejor para verano)' }
      ],
      required: true
    },
    {
      id: 'WTC_FROST',
      name: 'Tolerancia a Heladas',
      description: 'El agua corriente protege, pero las hojas superficiales pueden quemarse',
      type: 'categorical',
      options: [
        { value: 'hardy', label: 'Resistente a Frío' },
        { value: 'tender', label: 'Sensible' }
      ],
      required: true
    }
  ],
  'LOTUS_ROOT': [
    {
      id: 'LTR_HOLE_COUNT',
      name: 'Número de Agujeros Internos',
      description: 'Estética en la cocina asiática. Suele tener de 7 a 9.',
      type: 'numeric',
      unit: 'agujeros',
      min: 5,
      max: 11,
      required: true
    },
    {
      id: 'LTR_TEXTURE',
      name: 'Textura al Cocinar',
      description: 'Crujiente (para salteados) vs Harinosa (para sopas)',
      type: 'categorical',
      options: [
        { value: 'crispy', label: 'Crujiente / Firme (Ensaladas/Salteados)' },
        { value: 'starchy', label: 'Harinosa / Almidonosa (Sopas/Estofados)' }
      ],
      required: true
    },
    {
      id: 'LTR_ROOT_LENGTH',
      name: 'Longitud del Rizoma Engrosado',
      description: 'Centímetros por sección',
      type: 'numeric',
      unit: 'cm',
      min: 10,
      max: 30,
      required: true
    },
    {
      id: 'LTR_WATER_DEPTH',
      name: 'Profundidad de Agua Requerida',
      description: 'Variedades de aguas someras vs aguas profundas',
      type: 'categorical',
      options: [
        { value: 'shallow', label: 'Poco profunda (10-30 cm)' },
        { value: 'deep', label: 'Profunda (>50 cm)' }
      ],
      required: true
    }
  ],
  'LEEK': [
    {
      id: 'LEK_SHAFT_LENGTH',
      name: 'Longitud de Fuste (Blanco)',
      description: 'Porción blanca blanqueada comercial (cm)',
      type: 'numeric',
      unit: 'cm',
      min: 10,
      max: 40,
      required: true
    },
    {
      id: 'LEK_SEASON',
      name: 'Época de Cosecha',
      description: 'Verano (hoja verde clara/fuste largo) vs Invierno (hoja azulada/resistente a heladas)',
      type: 'categorical',
      options: [
        { value: 'summer', label: 'Verano/Otoño (Crecimiento rápido)' },
        { value: 'winter', label: 'Invierno (Resistente al frío)' }
      ],
      required: true
    },
    {
      id: 'LEK_BULBING',
      name: 'Tendencia a Formar Bulbo',
      description: 'Defecto en puerro (debe ser recto sin abultar)',
      type: 'categorical',
      options: [
        { value: 'low', label: 'Recto (Deseable)' },
        { value: 'high', label: 'Forma bulbo (Indeseable)' }
      ],
      required: true
    },
    {
      id: 'LEK_RUST',
      name: 'Resistencia a Roya (Puccinia allii)',
      description: 'Manchas naranjas en hojas',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Muy Susceptible' }
      ],
      required: true
    }
  ],
  'SHALLOT': [
    {
      id: 'SHA_MULTIPLIER',
      name: 'Tasa de Multiplicación',
      description: 'Bulbillos generados por bulbo madre',
      type: 'numeric',
      unit: 'bulbos',
      min: 3,
      max: 15,
      required: true
    },
    {
      id: 'SHA_SKIN_COLOR',
      name: 'Color de Catáfilas (Piel)',
      description: 'Rosa, Cobrizo, Amarillo',
      type: 'categorical',
      options: [
        { value: 'pink', label: 'Rosa / Roja (Tradicional francesa)' },
        { value: 'copper', label: 'Cobriza / Amarilla' }
      ],
      required: true
    },
    {
      id: 'SHA_SEED_GROWN',
      name: 'Propagación por Semilla Verdadera (TPS)',
      description: 'Chalotas modernas de semilla vs tradicionales vegetativas',
      type: 'categorical',
      options: [
        { value: 'seed', label: 'Semilla Verdadera (Híbridos)' },
        { value: 'vegetative', label: 'Vegetativa (Clon)' }
      ],
      required: true
    },
    {
      id: 'SHA_STORAGE',
      name: 'Vida de Guarda',
      description: 'Meses a temperatura ambiente',
      type: 'numeric',
      unit: 'meses',
      min: 3,
      max: 10,
      required: true
    }
  ],
  'CHIVE': [
    {
      id: 'CHV_LEAF_THICKNESS',
      name: 'Grosor de Hoja',
      description: 'Hoja fina (fresco/ensaladas) vs Gruesa (Procesado/Deshidratado)',
      type: 'categorical',
      options: [
        { value: 'fine', label: 'Fina' },
        { value: 'thick', label: 'Gruesa' }
      ],
      required: true
    },
    {
      id: 'CHV_REGROWTH',
      name: 'Velocidad de Rebrote post-corte',
      description: 'Para cortes múltiples en hidroponía o campo',
      type: 'categorical',
      options: [
        { value: 'fast', label: 'Rápido (Muchos cortes)' },
        { value: 'slow', label: 'Lento' }
      ],
      required: true
    },
    {
      id: 'CHV_GARLIC_FLAVOR',
      name: 'Sabor Aliáceo',
      description: 'Ciboulette común (Allium schoenoprasum) vs Ajo chino (Allium tuberosum)',
      type: 'categorical',
      options: [
        { value: 'onion', label: 'Sabor a Cebolla (Tubular)' },
        { value: 'garlic', label: 'Sabor a Ajo (Hoja plana)' }
      ],
      required: true
    },
    {
      id: 'CHV_WINTER_DORM',
      name: 'Latencia Invernal',
      description: 'Pérdida de follaje en invierno',
      type: 'categorical',
      options: [
        { value: 'dormant', label: 'Entra en latencia (Muere follaje)' },
        { value: 'evergreen', label: 'Siempreverde (Invernadero)' }
      ],
      required: true
    }
  ],
};
