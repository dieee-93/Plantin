import type { TraitDefinition } from '../types';

export const FORAGES_ONTOLOGY: Record<string, TraitDefinition[]> = {
  'ALFALFA': [
    {
      id: 'ALF_FALL_DORMANCY',
      name: 'Latencia Invernal (Fall Dormancy)',
      description: 'Escala 1 (muy latente, resiste frío) a 11 (sin latencia, crece en invierno)',
      type: 'numeric',
      unit: 'clase (1-11)',
      min: 1,
      max: 11,
      required: true
    },
    {
      id: 'ALF_PEST_RESISTANCE',
      name: 'Resistencia a Pulgones',
      description: 'Pulgón verde, moteado, azul',
      type: 'categorical',
      options: [
        { value: 'HR', label: 'Alta Resistencia (HR)' },
        { value: 'R', label: 'Resistente (R)' },
        { value: 'S', label: 'Susceptible (S)' }
      ],
      required: true
    },
    {
      id: 'ALF_CROWN',
      name: 'Profundidad de Corona',
      description: 'Coronas hundidas toleran pisoteo y pastoreo',
      type: 'categorical',
      options: [
        { value: 'deep', label: 'Hundida (Pastoreo)' },
        { value: 'surface', label: 'Superficial (Corte/Heno)' }
      ],
      required: true
    },
    {
      id: 'ALF_LIGNIN',
      name: 'Contenido de Lignina',
      description: 'Variedades bmr (brown midrib) o transgénicas con baja lignina para mayor digestibilidad',
      type: 'categorical',
      options: [
        { value: 'low', label: 'Baja Lignina (Alta Digestibilidad)' },
        { value: 'normal', label: 'Normal' }
      ],
      required: true
    }
  ],
  'RYEGRASS': [
    {
      id: 'RYG_PLOIDY',
      name: 'Ploidía',
      description: 'Diploides (más materia seca) vs Tetraploides (más jugosos, digestibles)',
      type: 'categorical',
      options: [
        { value: 'diploid', label: 'Diploide (2n)' },
        { value: 'tetraploid', label: 'Tetraploide (4n)' }
      ],
      required: true
    },
    {
      id: 'RYG_ENDOPHYTE',
      name: 'Endófito',
      description: 'Hongo que da resistencia a insectos pero puede ser tóxico (Ryegrass staggers)',
      type: 'categorical',
      options: [
        { value: 'none', label: 'Sin endófito' },
        { value: 'wild', label: 'Endófito Salvaje (Tóxico)' },
        { value: 'novel', label: 'Endófito Seguro (AR1/AR37)' }
      ],
      required: true
    },
    {
      id: 'RYG_HEADING',
      name: 'Fecha de Espigazón (Heading Date)',
      description: 'Determina ventana de calidad forrajera',
      type: 'categorical',
      options: [
        { value: 'early', label: 'Temprana' },
        { value: 'late', label: 'Tardía' }
      ],
      required: true
    },
    {
      id: 'RYG_WSC',
      name: 'Carbohidratos Solubles (WSC)',
      description: 'Azúcares en hoja (High Sugar Grasses mejoran conversión en leche)',
      type: 'numeric',
      unit: '%',
      min: 10,
      max: 30,
      required: true
    }
  ],
  'TIMOTHY': [
    {
      id: 'TIM_WINTER',
      name: 'Supervivencia Invernal (Winter Hardiness)',
      description: 'Gramínea extrema para climas muy fríos (Canadá, Escandinavia)',
      type: 'categorical',
      options: [
        { value: 1, label: 'Extrema' },
        { value: 5, label: 'Moderada' }
      ],
      required: true
    },
    {
      id: 'TIM_REGROWTH',
      name: 'Tasa de Rebrote tras Corte',
      description: 'Suele tener mal rebrote en verano respecto al raigrás',
      type: 'categorical',
      options: [
        { value: 'good', label: 'Buen Rebrote' },
        { value: 'poor', label: 'Pobre (Un solo corte fuerte)' }
      ],
      required: true
    },
    {
      id: 'TIM_PALATABILITY',
      name: 'Palatabilidad',
      description: 'Excelente para caballos',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Premium (Heno de Caballo)' },
        { value: 'medium', label: 'Estándar' }
      ],
      required: true
    },
    {
      id: 'TIM_MATURITY',
      name: 'Precocidad',
      description: 'Días al primer corte',
      type: 'numeric',
      unit: 'días',
      min: 40,
      max: 80,
      required: true
    }
  ],
  'TALL_FESCUE': [
    {
      id: 'FES_ENDOPHYTE',
      name: 'Endófito (Festucosis)',
      description: 'Problema de pie de festuca (Ergovalina)',
      type: 'categorical',
      options: [
        { value: 'toxic', label: 'Salvaje Tóxico (E+)' },
        { value: 'safe', label: 'Endófito Novel (MaxQ) o Sin (E-)' }
      ],
      required: true
    },
    {
      id: 'FES_LEAF_SOFTNESS',
      name: 'Suavidad de Hoja',
      description: 'Las festucas rústicas tienen bordes ásperos y baja palatabilidad',
      type: 'categorical',
      options: [
        { value: 'soft', label: 'Suave (Soft leaf)' },
        { value: 'rough', label: 'Áspera / Dura' }
      ],
      required: true
    },
    {
      id: 'FES_ROOT_DEPTH',
      name: 'Profundidad Radicular',
      description: 'Otorga enorme resistencia a sequía estival',
      type: 'numeric',
      unit: 'cm',
      min: 50,
      max: 200,
      required: true
    },
    {
      id: 'FES_SUMMER_DORM',
      name: 'Latencia Estival',
      description: 'Tipos mediterráneos se secan en verano para sobrevivir',
      type: 'categorical',
      options: [
        { value: 'active', label: 'Activa en Verano (Continental)' },
        { value: 'dormant', label: 'Latente en Verano (Mediterránea)' }
      ],
      required: true
    }
  ],
  'VETCH': [
    {
      id: 'VET_HARD_SEED',
      name: 'Porcentaje de Semilla Dura',
      description: 'Latencia física, afecta el establecimiento uniforme',
      type: 'numeric',
      unit: '%',
      min: 0,
      max: 95,
      required: true
    },
    {
      id: 'VET_BIOMASS',
      name: 'Producción de Biomasa',
      description: 'Forraje seco o abono verde',
      type: 'numeric',
      unit: 't/ha',
      min: 2,
      max: 10,
      required: true
    },
    {
      id: 'VET_SHATTERING',
      name: 'Dehiscencia de Vaina',
      description: 'Pérdida de semilla a la madurez (Shattering)',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente (Indehiscente)' },
        { value: 5, label: 'Intermedio' },
        { value: 9, label: 'Muy Susceptible' }
      ],
      required: true
    },
    {
      id: 'VET_WINTER_HARDINESS',
      name: 'Tolerancia al Frío',
      description: 'Clave para siembras otoñales de cobertura',
      type: 'categorical',
      options: [
        { value: 1, label: 'Excelente' },
        { value: 9, label: 'Susceptible (Heladas la matan)' }
      ],
      required: true
    }
  ],
  'ORCHARD_GRASS': [
    {
      id: 'ORC_DIGESTIBILITY',
      name: 'Digestibilidad In Vitro (DIVMS)',
      description: 'Calidad del forraje (% Materia Seca Digestible)',
      type: 'numeric',
      unit: '%',
      min: 50,
      max: 75,
      required: true
    },
    {
      id: 'ORC_RUST',
      name: 'Resistencia a Roya',
      description: 'Puccinia graminis',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 5, label: 'Intermedio' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'ORC_TILLER_DENSITY',
      name: 'Densidad de Macollos',
      description: 'Persistencia de la pastura y cubrimiento del suelo',
      type: 'numeric',
      unit: 'escala',
      min: 1,
      max: 9,
      required: false
    },
    {
      id: 'ORC_FALL_DORMANCY',
      name: 'Crecimiento Otoño/Invernal',
      description: 'Dormición en días cortos',
      type: 'categorical',
      options: [
        { value: 'active', label: 'Activo' },
        { value: 'dormant', label: 'Dormante' }
      ],
      required: true
    }
  ],
  'BERMUDA_GRASS': [
    {
      id: 'BER_ESTABLISHMENT',
      name: 'Velocidad de Establecimiento',
      description: 'Tasa de cubrimiento por estolones/rizomas',
      type: 'categorical',
      options: [
        { value: 1, label: 'Muy Rápido' },
        { value: 5, label: 'Medio' },
        { value: 9, label: 'Lento' }
      ],
      required: true
    },
    {
      id: 'BER_COLD_TOLERANCE',
      name: 'Tolerancia al Frío (Winterkill)',
      description: 'Sensibilidad a daños por heladas severas',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante (Sobrevive bien)' },
        { value: 9, label: 'Susceptible (Muerte invernal)' }
      ],
      required: true
    },
    {
      id: 'BER_DRY_MATTER',
      name: 'Rendimiento de Materia Seca',
      description: 'Uso para heno o pastoreo',
      type: 'numeric',
      unit: 't/ha',
      min: 5,
      max: 25,
      required: true
    },
    {
      id: 'BER_RHIZOME',
      name: 'Proporción Rizoma/Estolón',
      description: 'Afecta la persistencia y resistencia al pisoteo',
      type: 'categorical',
      options: [
        { value: 'rhizomatous', label: 'Altamente Rizomatoso' },
        { value: 'stoloniferous', label: 'Mayormente Estolonífero' }
      ],
      required: true
    }
  ],
  'SALTBUSH': [
    {
      id: 'SBU_SALT_TOLERANCE',
      name: 'Tolerancia a Salinidad Extrema',
      description: 'Capacidad de crecer en suelos sódicos donde nada más vive',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Halófita Extrema' },
        { value: 'moderate', label: 'Moderada' }
      ],
      required: true
    },
    {
      id: 'SBU_DROUGHT_TOL',
      name: 'Tolerancia a Sequía',
      description: 'Sobrevive con escasa precipitación (<200mm anuales)',
      type: 'categorical',
      options: [
        { value: 'extreme', label: 'Extrema (Sistemas áridos de Australia/África)' },
        { value: 'moderate', label: 'Semiárida' }
      ],
      required: true
    },
    {
      id: 'SBU_PALATABILITY',
      name: 'Palatabilidad para Ganado Ovino',
      description: 'Alto contenido de sal obliga a suplementar con agua dulce',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Buena (Seleccionada para menos cristales de sal)' },
        { value: 'low', label: 'Baja (Último recurso en sequía)' }
      ],
      required: true
    },
    {
      id: 'SBU_PROTEIN',
      name: 'Contenido de Proteína Bruta (Hojas)',
      description: 'A pesar del suelo pobre, acumula buena proteína',
      type: 'numeric',
      unit: '%',
      min: 10,
      max: 20,
      required: true
    }
  ],
  'LEUCAENA': [
    {
      id: 'LEU_MIMOSINE',
      name: 'Contenido de Mimosina',
      description: 'Aminoácido tóxico para rumiantes no adaptados (causa pérdida de pelo)',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alto (Requiere bacterias ruminales específicas)' },
        { value: 'low', label: 'Bajo (Variedades mejoradas)' }
      ],
      required: true
    },
    {
      id: 'LEU_PSYLLID',
      name: 'Resistencia al Psílido (Heteropsylla cubana)',
      description: 'Insecto defoliador letal',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistente' },
        { value: 'susceptible', label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'LEU_BIOMASS',
      name: 'Producción de Biomasa Forrajera',
      description: 'Materia seca por hectárea, clave en sistemas silvopastoriles intensivos',
      type: 'numeric',
      unit: 't MS/ha',
      min: 5,
      max: 20,
      required: true
    },
    {
      id: 'LEU_COLD_TOL',
      name: 'Tolerancia a Heladas',
      description: 'Normalmente es tropical. Heladas queman las hojas.',
      type: 'categorical',
      options: [
        { value: 'sensitive', label: 'Sensible (Cae la hoja a 0°C)' },
        { value: 'tolerant', label: 'Tolerante (Rebrota rápido post-helada)' }
      ],
      required: true
    }
  ],
  'OPUNTIA': [
    {
      id: 'OPU_SPINELESS',
      name: 'Presencia de Espinas (Cladodios)',
      description: 'Vital para uso forrajero directo sin quemar espinas',
      type: 'categorical',
      options: [
        { value: 'spineless', label: 'Inerme (Sin espinas)' },
        { value: 'spiny', label: 'Con Espinas (Rústica, evita herbivoría salvaje)' }
      ],
      required: true
    },
    {
      id: 'OPU_WATER_EFF',
      name: 'Eficiencia de Uso de Agua (CAM)',
      description: 'Metabolismo Ácido de las Crasuláceas, extrema eficiencia',
      type: 'categorical',
      options: [
        { value: 'very_high', label: 'Extrema (Zonas desérticas)' },
        { value: 'high', label: 'Alta' }
      ],
      required: true
    },
    {
      id: 'OPU_FRUIT_YIELD',
      name: 'Aptitud Doble Propósito (Tuna / Higo Chumbo)',
      description: 'Capacidad de dar forraje y fruto comercial',
      type: 'categorical',
      options: [
        { value: 'dual', label: 'Doble Propósito (Da fruto dulce comercial)' },
        { value: 'forage', label: 'Estrictamente Forrajera / Biomasa' }
      ],
      required: true
    },
    {
      id: 'OPU_COCHINEAL',
      name: 'Tolerancia a Cochinilla del Carmín',
      description: 'Dactylopius coccus (Puede ser plaga destructiva o cultivo comercial asociado)',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistente (Mala para producir colorante)' },
        { value: 'susceptible', label: 'Susceptible (Buena para producir Carmín)' }
      ],
      required: true
    }
  ],
  'MISCANTHUS': [
    {
      id: 'MIS_YIELD',
      name: 'Rendimiento de Biomasa',
      description: 'Toneladas de materia seca por hectárea para quema/etanol',
      type: 'numeric',
      unit: 't MS/ha',
      min: 15,
      max: 40,
      required: true
    },
    {
      id: 'MIS_STERILITY',
      name: 'Esterilidad (Triploides)',
      description: 'M. x giganteus es estéril, evitando que se vuelva maleza invasiva',
      type: 'categorical',
      options: [
        { value: 'sterile', label: 'Estéril (Multiplicación por rizomas)' },
        { value: 'fertile', label: 'Fértil (Riesgo invasivo alto)' }
      ],
      required: true
    },
    {
      id: 'MIS_COLD_TOL',
      name: 'Tolerancia al Frío Invernal',
      description: 'Sobrevive congelación del rizoma bajo tierra (zonas templadas/nórdicas)',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Resistente a heladas duras' },
        { value: 'moderate', label: 'Susceptible a congelamiento profundo' }
      ],
      required: true
    },
    {
      id: 'MIS_MOISTURE',
      name: 'Humedad a Cosecha',
      description: 'Baja humedad invernal ahorra costos de secado para peletización',
      type: 'numeric',
      unit: '%',
      min: 10,
      max: 30,
      required: true
    }
  ],
};
