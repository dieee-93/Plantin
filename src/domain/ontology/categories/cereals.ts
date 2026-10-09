import type { TraitDefinition } from '../types';

export const CEREALS_ONTOLOGY: Record<string, TraitDefinition[]> = {
  'RYE': [
    {
      id: 'RYE_FALL_VIGOR',
      name: 'Vigor Otoñal',
      description: 'Crecimiento inicial rápido para cobertura/pastoreo',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alto' },
        { value: 'low', label: 'Bajo' }
      ],
      required: true
    },
    {
      id: 'RYE_ERGOT',
      name: 'Resistencia a Cornezuelo (Ergot)',
      description: 'Claviceps purpurea',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Resistente' },
        { value: 9, label: 'Muy Susceptible' }
      ],
      required: true
    },
    {
      id: 'RYE_FALLING_NUMBER',
      name: 'Falling Number',
      description: 'Indicador de daño por brotado (amilasa)',
      type: 'numeric',
      unit: 's',
      min: 60,
      max: 300,
      required: true
    },
    {
      id: 'RYE_WINTER_HARD',
      name: 'Resistencia al Frío',
      description: 'El cereal de invierno más rústico',
      type: 'categorical',
      options: [
        { value: 1, label: 'Excepcional (-30°C)' },
        { value: 9, label: 'Pobre' }
      ],
      required: true
    }
  ],
  'TRITICALE': [
    {
      id: 'TRI_USE',
      name: 'Tipo de Uso',
      description: 'Forrajero (pastoreo), Doble Propósito o Grano',
      type: 'categorical',
      options: [
        { value: 'forage', label: 'Forrajero' },
        { value: 'dual', label: 'Doble Propósito' },
        { value: 'grain', label: 'Grano' }
      ],
      required: true
    },
    {
      id: 'TRI_BIOMASS',
      name: 'Producción de Biomasa',
      description: 'Materia seca para silaje',
      type: 'numeric',
      unit: 't/ha',
      min: 5,
      max: 20,
      required: true
    },
    {
      id: 'TRI_TEST_WEIGHT',
      name: 'Peso Hectolítrico',
      description: 'Calidad del grano (suele ser menor que trigo)',
      type: 'numeric',
      unit: 'kg/hL',
      min: 65,
      max: 80,
      required: true
    },
    {
      id: 'TRI_LODGING',
      name: 'Resistencia al Vuelco',
      description: 'Tallo fuerte heredado del trigo',
      type: 'categorical',
      options: [
        { value: 1, label: 'Muy Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'TEFF': [
    {
      id: 'TEF_GRAIN_COLOR',
      name: 'Color del Grano',
      description: 'Blanco (mayor precio) vs Marrón/Rojo (más rústico)',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Blanco' },
        { value: 'brown', label: 'Marrón / Rojo' }
      ],
      required: true
    },
    {
      id: 'TEF_LODGING',
      name: 'Resistencia al Vuelco (Lodging)',
      description: 'Problema principal en teff por su tallo fino',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Resistente' },
        { value: 9, label: 'Muy Susceptible (Se vuelca fácil)' }
      ],
      required: true
    },
    {
      id: 'TEF_IRON',
      name: 'Contenido de Hierro',
      description: 'Alto valor nutricional característico',
      type: 'numeric',
      unit: 'mg/100g',
      min: 10,
      max: 40,
      required: true
    },
    {
      id: 'TEF_PLANT_HEIGHT',
      name: 'Altura de Planta',
      description: 'Relacionado con biomasa y riesgo de vuelco',
      type: 'numeric',
      unit: 'cm',
      min: 30,
      max: 120,
      required: true
    }
  ],
  'FONIO': [
    {
      id: 'FON_MATURITY',
      name: 'Ciclo de Madurez',
      description: 'Extra precoces (60 días) a tardíos',
      type: 'numeric',
      unit: 'días',
      min: 60,
      max: 150,
      required: true
    },
    {
      id: 'FON_SHATTERING',
      name: 'Desgrane Natural (Shattering)',
      description: 'Pérdida pre-cosecha',
      type: 'categorical',
      options: [
        { value: 'low', label: 'Bajo (Retiene grano)' },
        { value: 'high', label: 'Alto (Se desgrana)' }
      ],
      required: true
    },
    {
      id: 'FON_DROUGHT',
      name: 'Tolerancia a Sequía',
      description: 'Sobrevive en suelos muy pobres y secos',
      type: 'categorical',
      options: [
        { value: 1, label: 'Excepcional' },
        { value: 5, label: 'Media' }
      ],
      required: true
    },
    {
      id: 'FON_GRAIN_SIZE',
      name: 'Tamaño del Grano',
      description: 'El grano es diminuto, se busca mayor tamaño',
      type: 'numeric',
      unit: 'mm',
      min: 0.5,
      max: 1.5,
      required: true
    }
  ],
  'WILD_RICE': [
    {
      id: 'WIR_GRAIN_LENGTH',
      name: 'Longitud del Grano',
      description: 'Grano negro, largo y fino',
      type: 'numeric',
      unit: 'mm',
      min: 10,
      max: 25,
      required: true
    },
    {
      id: 'WIR_SHATTERING',
      name: 'Resistencia al Desgrane',
      description: 'Variedades modernas tienen el gen de retención de semilla',
      type: 'categorical',
      options: [
        { value: 'shattering', label: 'Se desgrana (Silvestre)' },
        { value: 'non_shattering', label: 'No se desgrana (Doméstico)' }
      ],
      required: true
    },
    {
      id: 'WIR_WATER_DEPTH',
      name: 'Adaptación a Profundidad de Agua',
      description: 'Cultivo acuático (Zizania palustris)',
      type: 'numeric',
      unit: 'cm',
      min: 15,
      max: 90,
      required: true
    },
    {
      id: 'WIR_PROTEIN',
      name: 'Contenido de Proteína',
      description: 'Mayor que el arroz común',
      type: 'numeric',
      unit: '%',
      min: 12,
      max: 18,
      required: true
    }
  ],
  'CANARY_SEED': [
    {
      id: 'CAN_GLABROUS',
      name: 'Cáscara Glabra (Sin pelos)',
      description: 'Mutación clave "itchless" para consumo humano y manejo',
      type: 'categorical',
      options: [
        { value: 'glabrous', label: 'Glauca (Sin pelos / Itchless)' },
        { value: 'pubescent', label: 'Pubescente (Tradicional)' }
      ],
      required: true
    },
    {
      id: 'CAN_YIELD',
      name: 'Rendimiento de Grano',
      description: 'Kg/ha',
      type: 'numeric',
      unit: 'kg/ha',
      min: 500,
      max: 3000,
      required: true
    },
    {
      id: 'CAN_TEST_WEIGHT',
      name: 'Peso Hectolítrico',
      description: 'Calidad de llenado',
      type: 'numeric',
      unit: 'kg/hL',
      min: 60,
      max: 80,
      required: true
    },
    {
      id: 'CAN_DAYS_MATURITY',
      name: 'Días a Madurez',
      description: 'Ciclo',
      type: 'numeric',
      unit: 'días',
      min: 85,
      max: 110,
      required: true
    }
  ],
  'JOB_TEARS': [
    {
      id: 'JOB_SHELL_HARD',
      name: 'Dureza de Cáscara',
      description: 'Dura (ornamental/cuentas) vs Blanda (Ma-yuen, comestible)',
      type: 'categorical',
      options: [
        { value: 'soft', label: 'Blanda (Comestible / Adlay)' },
        { value: 'hard', label: 'Dura (Ornamental / Beads)' }
      ],
      required: true
    },
    {
      id: 'JOB_HEIGHT',
      name: 'Altura de Planta',
      description: 'Suele ser muy alta, similar a un maíz forrajero',
      type: 'numeric',
      unit: 'm',
      min: 1,
      max: 3,
      required: true
    },
    {
      id: 'JOB_YIELD',
      name: 'Rendimiento de Grano',
      description: 'Producción de semilla comestible',
      type: 'numeric',
      unit: 't/ha',
      min: 1,
      max: 4,
      required: true
    },
    {
      id: 'JOB_FLOWERING',
      name: 'Días a Floración',
      description: 'Ciclo vegetativo',
      type: 'numeric',
      unit: 'días',
      min: 70,
      max: 140,
      required: true
    }
  ],
};
