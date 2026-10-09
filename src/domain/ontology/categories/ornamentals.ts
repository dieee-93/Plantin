import type { TraitDefinition } from '../types';

export const ORNAMENTALS_ONTOLOGY: Record<string, TraitDefinition[]> = {
  'ROSE': [
    {
      id: 'ROS_STEM_LENGTH',
      name: 'Longitud de Tallo Florero',
      description: 'Grado comercial para flor de corte (cm)',
      type: 'numeric',
      unit: 'cm',
      min: 40,
      max: 120,
      required: true
    },
    {
      id: 'ROS_VASE_LIFE',
      name: 'Vida en Florero (Vase Life)',
      description: 'Días que la flor mantiene el capullo firme y hojas verdes',
      type: 'numeric',
      unit: 'días',
      min: 5,
      max: 25,
      required: true
    },
    {
      id: 'ROS_PETAL_COUNT',
      name: 'Número de Pétalos',
      description: 'Variedades estándar vs Premium col (cabbage roses)',
      type: 'numeric',
      unit: 'pétalos',
      min: 15,
      max: 120,
      required: true
    },
    {
      id: 'ROS_THORNS',
      name: 'Densidad de Espinas (Aguijones)',
      description: 'Variedades inermes reducen costos laborales',
      type: 'categorical',
      options: [
        { value: 'thornless', label: 'Sin Espinas (Inerme)' },
        { value: 'moderate', label: 'Moderadas' },
        { value: 'thorny', label: 'Muy Espinosa' }
      ],
      required: true
    }
  ],
  'TULIP': [
    {
      id: 'TUL_FORCING',
      name: 'Aptitud para Forzado (Forcing)',
      description: 'Facilidad para adelantar floración en hidroponía invernal',
      type: 'categorical',
      options: [
        { value: 'excellent', label: 'Excelente (Ciclo muy rápido)' },
        { value: 'poor', label: 'Solo exterior / Suelo' }
      ],
      required: true
    },
    {
      id: 'TUL_BULB_SIZE',
      name: 'Calibre de Bulbo Comercial',
      description: 'Circunferencia en cm (12+ es estándar de floración)',
      type: 'numeric',
      unit: 'cm',
      min: 10,
      max: 14,
      required: true
    },
    {
      id: 'TUL_VIRUS_BREAKING',
      name: 'Sensibilidad a Tulip Breaking Virus',
      description: 'Antiguamente deseado (Semper Augustus), hoy cuarentenado',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistente / Color sólido firme' },
        { value: 'susceptible', label: 'Susceptible (Se mancha el pétalo)' }
      ],
      required: true
    },
    {
      id: 'TUL_STEM_STRENGTH',
      name: 'Firmeza de Tallo',
      description: 'Evita el vuelco en maceta o en cámara de cultivo',
      type: 'categorical',
      options: [
        { value: 'strong', label: 'Tallo Fuerte' },
        { value: 'weak', label: 'Tallo Débil / Colgante' }
      ],
      required: true
    }
  ],
  'ORCHID': [
    {
      id: 'ORC_SPIKE_COUNT',
      name: 'Número de Varas Florales',
      description: 'Al inducir floración con frío, plantas de calidad emiten 2 o más varas',
      type: 'numeric',
      unit: 'varas',
      min: 1,
      max: 4,
      required: true
    },
    {
      id: 'ORC_FLOWER_SIZE',
      name: 'Diámetro de Flor',
      description: 'Miniatura vs Grandiflora',
      type: 'numeric',
      unit: 'cm',
      min: 3,
      max: 15,
      required: true
    },
    {
      id: 'ORC_BLOOM_DURATION',
      name: 'Duración de la Flor (Shelf life)',
      description: 'Semanas que la flor se mantiene intacta en interior',
      type: 'numeric',
      unit: 'semanas',
      min: 4,
      max: 16,
      required: true
    },
    {
      id: 'ORC_VIRUS',
      name: 'Sensibilidad a ORSV / CymMV',
      description: 'Virus de manchas anilladas / mosaico, intratables.',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Altamente Susceptible' }
      ],
      required: true
    }
  ],
  'MONSTERA': [
    {
      id: 'MON_FENESTRATION',
      name: 'Inicio de Fenestración',
      description: 'Número de hoja o tamaño a partir de la cual la hoja desarrolla cortes y agujeros',
      type: 'categorical',
      options: [
        { value: 'early', label: 'Temprano (M. deliciosa var. Borsigiana/Taurii)' },
        { value: 'late', label: 'Tardío (M. deliciosa gigante)' }
      ],
      required: true
    },
    {
      id: 'MON_VARIEGATION',
      name: 'Estabilidad de Variegación',
      description: 'Para cultivares Albo, Thai Constellation o Aurea',
      type: 'categorical',
      options: [
        { value: 'stable', label: 'Estable (Genética quimérica fuerte)' },
        { value: 'unstable', label: 'Inestable (Revierte a verde o blanco puro)' },
        { value: 'none', label: 'Sin variegación' }
      ],
      required: true
    },
    {
      id: 'MON_INTERNODE',
      name: 'Longitud de Entrenudos',
      description: 'Compacta (crecimiento arrastrado/grueso) vs Trepadora (largo)',
      type: 'categorical',
      options: [
        { value: 'short', label: 'Corto (Deliciosa forma grande)' },
        { value: 'long', label: 'Largo (Borsigiana - Trepa rápido)' }
      ],
      required: true
    },
    {
      id: 'MON_COLD_TOLERANCE',
      name: 'Tolerancia al Frío (Daño foliar)',
      description: 'Causa manchas negras en bordes',
      type: 'categorical',
      options: [
        { value: 1, label: 'Soporta ~5°C' },
        { value: 9, label: 'Daño bajo 15°C' }
      ],
      required: true
    }
  ],
  'POINSETTIA': [
    {
      id: 'POI_BRACT_COLOR',
      name: 'Color de Brácteas',
      description: 'Rojo clásico, Rosa, Blanco, Marmoleado',
      type: 'categorical',
      options: [
        { value: 'red', label: 'Rojo' },
        { value: 'white', label: 'Blanco / Crema' },
        { value: 'novelty', label: 'Rosa / Jaspeado' }
      ],
      required: true
    },
    {
      id: 'POI_RESPONSE_TIME',
      name: 'Tiempo de Respuesta de Días Cortos',
      description: 'Semanas de fotoperíodo corto (<12h) para coloración completa',
      type: 'numeric',
      unit: 'semanas',
      min: 6,
      max: 10,
      required: true
    },
    {
      id: 'POI_V_SHAPE',
      name: 'Arquitectura de Planta (V-shape)',
      description: 'Brotación en forma de V, tallos fuertes sin abrirse (romperse)',
      type: 'categorical',
      options: [
        { value: 'strong_v', label: 'Forma V fuerte (No se desparrama)' },
        { value: 'weak', label: 'Tallos caen por peso' }
      ],
      required: true
    },
    {
      id: 'POI_CYATHIA_DROP',
      name: 'Retención de Ciatios (Cyathia)',
      description: 'Las verdaderas flores en el centro; si caen temprano, la planta parece vieja',
      type: 'categorical',
      options: [
        { value: 'excellent', label: 'Excelente retención' },
        { value: 'poor', label: 'Caída prematura' }
      ],
      required: true
    }
  ],
  'CHRYSANTHEMUM': [
    {
      id: 'CHY_FLOWER_TYPE',
      name: 'Tipo de Flor (Inflorescencia)',
      description: 'Decorativo, Pompón, Margarita, Araña',
      type: 'categorical',
      options: [
        { value: 'decorative', label: 'Decorativo' },
        { value: 'pompon', label: 'Pompón (Esfera apretada)' },
        { value: 'spider', label: 'Spider (Pétalos tubulares)' },
        { value: 'daisy', label: 'Margarita (Centro visible)' }
      ],
      required: true
    },
    {
      id: 'CHY_RESPONSE_GROUP',
      name: 'Grupo de Respuesta (Días Cortos)',
      description: 'Semanas de días cortos para florecer (control en invernadero)',
      type: 'numeric',
      unit: 'semanas',
      min: 6,
      max: 14,
      required: true
    },
    {
      id: 'CHY_STEM_STRENGTH',
      name: 'Firmeza de Tallo',
      description: 'Esencial para flores de corte (Standard y Spray)',
      type: 'categorical',
      options: [
        { value: 'strong', label: 'Fuerte / Recto' },
        { value: 'weak', label: 'Débil / Requiere mucha red' }
      ],
      required: true
    },
    {
      id: 'CHY_WHITE_RUST',
      name: 'Resistencia a Roya Blanca',
      description: 'Puccinia horiana (Enfermedad cuarentenaria letal)',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistente' },
        { value: 'susceptible', label: 'Susceptible' }
      ],
      required: true
    }
  ],
};
