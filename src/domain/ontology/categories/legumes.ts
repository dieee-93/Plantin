import type { TraitDefinition } from '../types';

export const LEGUMES_ONTOLOGY: Record<string, TraitDefinition[]> = {
  'COWPEA': [
    {
      id: 'COW_GROWTH_HABIT',
      name: 'Hábito de Crecimiento',
      description: 'Erecto (grano), Semi-erecto, Trepador (cobertura/forraje)',
      type: 'categorical',
      options: [
        { value: 'erect', label: 'Erecto' },
        { value: 'semi', label: 'Semi-erecto' },
        { value: 'climbing', label: 'Trepador / Rastrero' }
      ],
      required: true
    },
    {
      id: 'COW_SEED_COLOR',
      name: 'Color de Semilla',
      description: 'Con o sin el característico "ojo negro" u otros colores',
      type: 'categorical',
      options: [
        { value: 'black_eye', label: 'Blanco con Ojo Negro' },
        { value: 'brown', label: 'Marrón/Rojo' },
        { value: 'black', label: 'Negro' }
      ],
      required: true
    },
    {
      id: 'COW_DAYS_MATURITY',
      name: 'Días a Madurez',
      description: 'Ciclo completo',
      type: 'numeric',
      unit: 'días',
      min: 60,
      max: 150,
      required: true
    },
    {
      id: 'COW_POD_LENGTH',
      name: 'Longitud de Vaina',
      description: 'Variedades hortícolas (yardlong bean) vs grano corto',
      type: 'numeric',
      unit: 'cm',
      min: 10,
      max: 90,
      required: true
    }
  ],
  'FABA_BEAN': [
    {
      id: 'FAB_SEED_SIZE',
      name: 'Tamaño de Semilla (Tipo)',
      description: 'Minor (pequeña/forraje), Equina, Major (grande/consumo)',
      type: 'categorical',
      options: [
        { value: 'minor', label: 'Minor (< 1g)' },
        { value: 'equina', label: 'Equina (1-1.5g)' },
        { value: 'major', label: 'Major (> 1.5g)' }
      ],
      required: true
    },
    {
      id: 'FAB_VICINE',
      name: 'Contenido de Vicina/Convicina',
      description: 'Antinutrientes causantes de favismo',
      type: 'numeric',
      unit: '%',
      min: 0,
      max: 2,
      required: true
    },
    {
      id: 'FAB_FROST_TOL',
      name: 'Tolerancia a Heladas',
      description: 'Supervivencia en estadios vegetativos tempranos',
      type: 'categorical',
      options: [
        { value: 1, label: 'Alta (Soporta -10°C)' },
        { value: 5, label: 'Media' },
        { value: 9, label: 'Baja' }
      ],
      required: true
    },
    {
      id: 'FAB_PODS_NODE',
      name: 'Vainas por Nudo',
      description: 'Potencial de rendimiento en el racimo',
      type: 'numeric',
      unit: 'count',
      min: 1,
      max: 5,
      required: true
    }
  ],
  'MUNG_BEAN': [
    {
      id: 'MUN_SPROUTING',
      name: 'Porcentaje de Germinación (Sprouting)',
      description: 'Calidad clave para producción de brotes (soja)',
      type: 'numeric',
      unit: '%',
      min: 80,
      max: 100,
      required: true
    },
    {
      id: 'MUN_SEED_COLOR',
      name: 'Color del Tegumento',
      description: 'Verde brillante (mungo) vs otros Vigna',
      type: 'categorical',
      options: [
        { value: 'green_bright', label: 'Verde Brillante' },
        { value: 'green_dull', label: 'Verde Opaco' },
        { value: 'yellow', label: 'Amarillo' }
      ],
      required: true
    },
    {
      id: 'MUN_MYMV',
      name: 'Resistencia a MYMV',
      description: 'Mungbean Yellow Mosaic Virus',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 5, label: 'Tolerante' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'MUN_DAYS_FLOWERING',
      name: 'Días a Floración',
      description: 'Ciclo productivo muy corto',
      type: 'numeric',
      unit: 'días',
      min: 30,
      max: 60,
      required: true
    }
  ],
  'LUPIN': [
    {
      id: 'LUP_ALKALOID',
      name: 'Tipo de Alcaloide',
      description: 'Dulce (bajo alcaloide, <0.02%) vs Amargo (silvestre/abono)',
      type: 'categorical',
      options: [
        { value: 'sweet', label: 'Dulce' },
        { value: 'bitter', label: 'Amargo' }
      ],
      required: true
    },
    {
      id: 'LUP_GROWTH',
      name: 'Tipo de Crecimiento',
      description: 'Determinado (menor biomasa, madurez uniforme) vs Indeterminado',
      type: 'categorical',
      options: [
        { value: 'determinate', label: 'Determinado' },
        { value: 'indeterminate', label: 'Indeterminado' }
      ],
      required: true
    },
    {
      id: 'LUP_PROTEIN',
      name: 'Contenido de Proteína',
      description: 'Proteína en semilla sin cáscara',
      type: 'numeric',
      unit: '%',
      min: 28,
      max: 45,
      required: true
    },
    {
      id: 'LUP_ANTHRACNOSE',
      name: 'Resistencia a Antracnosis',
      description: 'Colletotrichum lupini',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 5, label: 'Intermedio' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'LIMA_BEAN': [
    {
      id: 'LIM_SEED_SIZE',
      name: 'Tamaño de Semilla',
      description: 'Baby lima (pequeña) vs Pallar andino (grande)',
      type: 'categorical',
      options: [
        { value: 'large', label: 'Grande (Andino/Pallar)' },
        { value: 'small', label: 'Pequeña (Baby Lima / Mesoamericana)' }
      ],
      required: true
    },
    {
      id: 'LIM_HCN',
      name: 'Contenido de Ácido Cianhídrico (HCN)',
      description: 'Variedades amargas tienen niveles tóxicos sin cocción',
      type: 'numeric',
      unit: 'ppm',
      min: 10,
      max: 400,
      required: true
    },
    {
      id: 'LIM_HABIT',
      name: 'Hábito de Crecimiento',
      description: 'Trepador vs Determinado (Arbusto)',
      type: 'categorical',
      options: [
        { value: 'pole', label: 'Trepador (Requiere tutor)' },
        { value: 'bush', label: 'Arbustivo' }
      ],
      required: true
    },
    {
      id: 'LIM_HEAT',
      name: 'Tolerancia al Calor Extremo',
      description: 'Tolera más calor que el frijol común (Phaseolus vulgaris)',
      type: 'categorical',
      options: [
        { value: 1, label: 'Excelente' },
        { value: 9, label: 'Pobre' }
      ],
      required: true
    }
  ],
  'ADZUKI_BEAN': [
    {
      id: 'ADZ_COLOR',
      name: 'Color de Semilla',
      description: 'Rojo (tradicional), verde, negro',
      type: 'categorical',
      options: [
        { value: 'red', label: 'Rojo Oscuro' },
        { value: 'green', label: 'Verde' },
        { value: 'black', label: 'Negro' }
      ],
      required: true
    },
    {
      id: 'ADZ_PASTE',
      name: 'Aptitud para Pasta Dulce (Anko)',
      description: 'Calidad de procesamiento y textura harinosa',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Excelente (Alta calidad Anko)' },
        { value: 'low', label: 'Baja' }
      ],
      required: true
    },
    {
      id: 'ADZ_MATURITY',
      name: 'Días a Madurez',
      description: 'Ciclo vegetativo',
      type: 'numeric',
      unit: 'días',
      min: 80,
      max: 120,
      required: true
    },
    {
      id: 'ADZ_LODGING',
      name: 'Resistencia al Vuelco',
      description: 'Plantas erectas facilitan cosecha mecánica',
      type: 'categorical',
      options: [
        { value: 1, label: 'Erecta / Resistente' },
        { value: 9, label: 'Postrada' }
      ],
      required: true
    }
  ],
  'WINGED_BEAN': [
    {
      id: 'WIN_POD_LENGTH',
      name: 'Longitud de Vaina Cuadrangular',
      description: 'Vainas aladas consumidas verdes',
      type: 'numeric',
      unit: 'cm',
      min: 15,
      max: 40,
      required: true
    },
    {
      id: 'WIN_TUBER',
      name: 'Producción de Tubérculo',
      description: 'Algunas líneas producen raíces tuberosas comestibles ricas en proteína',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alta producción radicular' },
        { value: 'low', label: 'Solo vainas/hojas' }
      ],
      required: true
    },
    {
      id: 'WIN_DAYLENGTH',
      name: 'Sensibilidad al Fotoperiodo',
      description: 'Generalmente requiere días cortos para florecer',
      type: 'categorical',
      options: [
        { value: 'sensitive', label: 'Muy Sensible (Días Cortos)' },
        { value: 'neutral', label: 'Día Neutro' }
      ],
      required: true
    },
    {
      id: 'WIN_PROTEIN',
      name: 'Proteína en Semilla Seca',
      description: 'Comparable a la soja (muy alta)',
      type: 'numeric',
      unit: '%',
      min: 30,
      max: 45,
      required: true
    }
  ],
  'VELVET_BEAN': [
    {
      id: 'VEL_L_DOPA',
      name: 'Contenido de L-DOPA',
      description: 'Compuesto medicinal/tóxico en la semilla',
      type: 'numeric',
      unit: '%',
      min: 3,
      max: 7,
      required: true
    },
    {
      id: 'VEL_TRICHOMES',
      name: 'Tricomas Urticantes en Vaina',
      description: 'El frijol terciopelo silvestre causa picazón extrema',
      type: 'categorical',
      options: [
        { value: 'absent', label: 'Ausentes (Variedades Agrícolas)' },
        { value: 'present', label: 'Presentes (Silvestres urticantes)' }
      ],
      required: true
    },
    {
      id: 'VEL_BIOMASS',
      name: 'Producción de Biomasa',
      description: 'Excelente abono verde / supresor de malezas',
      type: 'numeric',
      unit: 't/ha',
      min: 15,
      max: 40,
      required: true
    },
    {
      id: 'VEL_NEMATODE',
      name: 'Supresión de Nematodos',
      description: 'Efecto nematicida en rotación',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alta Eficacia' },
        { value: 'low', label: 'Baja' }
      ],
      required: true
    }
  ],
  'CAROB': [
    {
      id: 'CAR_POD_SUGAR',
      name: 'Contenido de Azúcar en Vaina',
      description: 'Mesocarpio dulce usado como sustituto de cacao',
      type: 'numeric',
      unit: '%',
      min: 30,
      max: 55,
      required: true
    },
    {
      id: 'CAR_GUM',
      name: 'Rendimiento de Goma Garrofín',
      description: 'Locust Bean Gum (LBG) extraído del endospermo',
      type: 'numeric',
      unit: '%',
      min: 35,
      max: 50,
      required: true
    },
    {
      id: 'CAR_HERMAPHRODITE',
      name: 'Presencia de Flores Hermafroditas',
      description: 'Árboles dioicos (requieren machos) vs Hermafroditas (auto-fértiles)',
      type: 'categorical',
      options: [
        { value: 'dioecious', label: 'Dioico (Hembra)' },
        { value: 'hermaphrodite', label: 'Hermafrodita' }
      ],
      required: true
    },
    {
      id: 'CAR_DROUGHT',
      name: 'Tolerancia a Sequía Estival',
      description: 'Cultivo mediterráneo de secano',
      type: 'categorical',
      options: [
        { value: 1, label: 'Excepcional' },
        { value: 9, label: 'Pobre' }
      ],
      required: true
    }
  ],
  'PIGEON_PEA': [
    {
      id: 'PIG_HABIT',
      name: 'Hábito de Crecimiento',
      description: 'Determinado (arbustivo corto) vs Indeterminado (árbol perenne)',
      type: 'categorical',
      options: [
        { value: 'determinate', label: 'Determinado (Anual)' },
        { value: 'indeterminate', label: 'Indeterminado (Perenne)' }
      ],
      required: true
    },
    {
      id: 'PIG_FLOWERING',
      name: 'Días a 50% Floración',
      description: 'Sensible al fotoperiodo',
      type: 'numeric',
      unit: 'días',
      min: 60,
      max: 200,
      required: true
    },
    {
      id: 'PIG_BORER',
      name: 'Resistencia a Barrenador (Helicoverpa)',
      description: 'Principal plaga del cultivo',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Resistente' },
        { value: 9, label: 'Muy Susceptible' }
      ],
      required: true
    },
    {
      id: 'PIG_SEED_COLOR',
      name: 'Color de Semilla',
      description: 'Blanco, marrón, rojizo',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Blanco/Crema' },
        { value: 'brown', label: 'Marrón' },
        { value: 'red', label: 'Rojo/Moteado' }
      ],
      required: true
    }
  ],
  'HORSE_GRAM': [
    {
      id: 'HOR_FORAGE_YIELD',
      name: 'Rendimiento Forrajero',
      description: 'Materia seca para animales',
      type: 'numeric',
      unit: 't/ha',
      min: 2,
      max: 8,
      required: true
    },
    {
      id: 'HOR_GRAIN_COLOR',
      name: 'Color de Grano',
      description: 'Marrón, negro, rojizo',
      type: 'categorical',
      options: [
        { value: 'brown', label: 'Marrón Claro' },
        { value: 'black', label: 'Negro' },
        { value: 'red', label: 'Rojizo' }
      ],
      required: true
    },
    {
      id: 'HOR_ANTINUT',
      name: 'Factores Antinutricionales',
      description: 'Inhibidores de tripsina / Fitatos',
      type: 'categorical',
      options: [
        { value: 'low', label: 'Bajo' },
        { value: 'high', label: 'Alto (Requiere remojo y cocción prolongada)' }
      ],
      required: true
    },
    {
      id: 'HOR_DROUGHT',
      name: 'Tolerancia a Sequía Extrema',
      description: 'Leguminosa de secano por excelencia en India',
      type: 'categorical',
      options: [
        { value: 1, label: 'Muy Alta' },
        { value: 5, label: 'Media' }
      ],
      required: true
    }
  ],
  'GRASS_PEA': [
    {
      id: 'GRP_ODAP',
      name: 'Contenido de ODAP (Neurotoxina)',
      description: 'Causa latirismo si se consume en exceso. Objetivo: variedades bajas en ODAP (<0.1%)',
      type: 'numeric',
      unit: '%',
      min: 0,
      max: 1.5,
      required: true
    },
    {
      id: 'GRP_DROUGHT',
      name: 'Tolerancia a Sequía',
      description: 'Cultivo de salvación (insurance crop)',
      type: 'categorical',
      options: [
        { value: 1, label: 'Excepcional' },
        { value: 3, label: 'Muy Alta' }
      ],
      required: true
    },
    {
      id: 'GRP_SEED_SIZE',
      name: 'Tamaño de Semilla (Peso 100 s)',
      description: 'Pequeña (macrosperma) vs Grande',
      type: 'numeric',
      unit: 'g',
      min: 4,
      max: 20,
      required: true
    },
    {
      id: 'GRP_FLOWER',
      name: 'Color de Flor',
      description: 'Azul, rosa, blanco',
      type: 'categorical',
      options: [
        { value: 'blue', label: 'Azul' },
        { value: 'pink', label: 'Rosa' },
        { value: 'white', label: 'Blanco' }
      ],
      required: true
    }
  ],
  'JACK_BEAN': [
    {
      id: 'JAC_CANAVANINE',
      name: 'Contenido de Canavanina',
      description: 'Aminoácido tóxico que defiende a la planta de insectos (antinutriente)',
      type: 'numeric',
      unit: '%',
      min: 1,
      max: 5,
      required: true
    },
    {
      id: 'JAC_BIOMASS',
      name: 'Biomasa / Abono Verde',
      description: 'Rendimiento de materia verde',
      type: 'numeric',
      unit: 't/ha',
      min: 10,
      max: 50,
      required: true
    },
    {
      id: 'JAC_POD_LENGTH',
      name: 'Longitud de Vaina',
      description: 'Vainas gigantes tipo espada',
      type: 'numeric',
      unit: 'cm',
      min: 15,
      max: 40,
      required: true
    },
    {
      id: 'JAC_HABIT',
      name: 'Hábito',
      description: 'Trepador vigoroso vs Arbustivo',
      type: 'categorical',
      options: [
        { value: 'climbing', label: 'Trepador (Enredadera)' },
        { value: 'bush', label: 'Arbustivo' }
      ],
      required: true
    }
  ],
  'MOTH_BEAN': [
    {
      id: 'MOT_YIELD',
      name: 'Rendimiento de Grano',
      description: 'Kg/ha',
      type: 'numeric',
      unit: 'kg/ha',
      min: 200,
      max: 1500,
      required: true
    },
    {
      id: 'MOT_DROUGHT',
      name: 'Tolerancia a Sequía',
      description: 'Una de las leguminosas más tolerantes al estrés hídrico',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Tolerante' },
        { value: 5, label: 'Moderada' }
      ],
      required: true
    },
    {
      id: 'MOT_PROTEIN',
      name: 'Contenido de Proteína',
      description: 'Calidad nutricional',
      type: 'numeric',
      unit: '%',
      min: 18,
      max: 25,
      required: true
    },
    {
      id: 'MOT_GROUND_COVER',
      name: 'Capacidad de Cobertura de Suelo',
      description: 'Hábito postrado que previene la erosión',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alta (Cubre rápido)' },
        { value: 'low', label: 'Baja' }
      ],
      required: true
    }
  ],
};
