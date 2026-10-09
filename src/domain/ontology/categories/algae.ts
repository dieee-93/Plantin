import type { TraitDefinition } from '../types';

export const ALGAE_ONTOLOGY: Record<string, TraitDefinition[]> = {
  'SPIRULINA': [
    {
      id: 'SPI_PROTEIN',
      name: 'Contenido de Proteína Seca',
      description: 'Es una de las fuentes proteicas más ricas del planeta (cianobacteria)',
      type: 'numeric',
      unit: '%',
      min: 55,
      max: 75,
      required: true
    },
    {
      id: 'SPI_PHYCOCYANIN',
      name: 'Contenido de Ficocianina',
      description: 'Pigmento azul con alto valor nutracéutico y colorante natural',
      type: 'numeric',
      unit: '%',
      min: 10,
      max: 25,
      required: true
    },
    {
      id: 'SPI_TEMP_TOLERANCE',
      name: 'Tolerancia a Temperatura del Agua',
      description: 'Prospera en climas cálidos y mueren con el frío',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Termófila (35-40°C)' },
        { value: 'moderate', label: 'Moderada (25-30°C)' }
      ],
      required: true
    },
    {
      id: 'SPI_SALINITY',
      name: 'Adaptación a Salinidad/Alcalinidad',
      description: 'Crece en medio altamente alcalino (pH 9-11) para evitar contaminación competitiva',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Soporta pH muy alto (Fácil manejo outdoor)' },
        { value: 'low', label: 'Requiere pH estricto' }
      ],
      required: true
    }
  ],
  'KELP': [
    {
      id: 'KLP_FROND_LENGTH',
      name: 'Longitud de la Fronda',
      description: 'Metros de largo. Kelp gigante puede crecer 30-50m.',
      type: 'numeric',
      unit: 'm',
      min: 2,
      max: 60,
      required: true
    },
    {
      id: 'KLP_GROWTH_RATE',
      name: 'Tasa de Crecimiento Diario',
      description: 'Una de las plantas de crecimiento más rápido del mundo',
      type: 'numeric',
      unit: 'cm/día',
      min: 10,
      max: 60,
      required: true
    },
    {
      id: 'KLP_ALGINATE',
      name: 'Contenido de Alginato',
      description: 'Agente gelificante usado en industria alimentaria y cosmética',
      type: 'numeric',
      unit: '%',
      min: 10,
      max: 45,
      required: true
    },
    {
      id: 'KLP_TEMP_REQ',
      name: 'Requerimiento de Agua Fría',
      description: 'El Kelp requiere aguas frías ricas en nutrientes (upwelling)',
      type: 'categorical',
      options: [
        { value: 'strict', label: 'Estricto (<15°C)' },
        { value: 'tolerant', label: 'Tolerante (Hasta 20°C temporalmente)' }
      ],
      required: true
    }
  ],
  'NORI': [
    {
      id: 'NOR_BLADE_THICKNESS',
      name: 'Grosor de la Lámina',
      description: 'Hojas delgadas dan un producto Nori más delicado (sushi)',
      type: 'numeric',
      unit: 'µm',
      min: 20,
      max: 70,
      required: true
    },
    {
      id: 'NOR_PIGMENT',
      name: 'Color / Pigmentación (Ficoeritrina)',
      description: 'Rojo púrpura intenso da un Nori oscuro de primera calidad al secar',
      type: 'categorical',
      options: [
        { value: 'dark', label: 'Oscuro (Premium - Kuro-nori)' },
        { value: 'light', label: 'Claro (Menor valor)' }
      ],
      required: true
    },
    {
      id: 'NOR_DISEASE_RES',
      name: 'Resistencia a Enfermedad del Hongo Rojo (Pythium)',
      description: 'Patógeno que devasta las redes de cultivo en el mar',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'NOR_UMAMI',
      name: 'Contenido de Ácido Glutámico (Umami)',
      description: 'Clave para el sabor característico del Nori',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alto (Sabor intenso)' },
        { value: 'low', label: 'Bajo' }
      ],
      required: true
    }
  ],
  'GRACILARIA': [
    {
      id: 'GRA_AGAR_YIELD',
      name: 'Rendimiento de Agar',
      description: 'Porcentaje en peso seco de este hidrocoloide vegetal',
      type: 'numeric',
      unit: '%',
      min: 15,
      max: 40,
      required: true
    },
    {
      id: 'GRA_GEL_STRENGTH',
      name: 'Fuerza del Gel de Agar',
      description: 'Medida en g/cm². Agart de calidad es firme.',
      type: 'numeric',
      unit: 'g/cm²',
      min: 200,
      max: 1200,
      required: true
    },
    {
      id: 'GRA_EPIPHYTE_TOLERANCE',
      name: 'Tolerancia a Epífitas',
      description: 'Otras algas que crecen sobre Gracilaria reducen su valor',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Resistente al fouling epífito' },
        { value: 'low', label: 'Susceptible (Requiere limpieza/pastoreo)' }
      ],
      required: true
    },
    {
      id: 'GRA_SALINITY_TOL',
      name: 'Tolerancia a Baja Salinidad (Estuarios)',
      description: 'Capacidad de crecer cerca de desembocaduras de ríos',
      type: 'categorical',
      options: [
        { value: 'euryhaline', label: 'Eurihalina (Tolera baja salinidad)' },
        { value: 'stenohaline', label: 'Estenohalina (Requiere mar abierto)' }
      ],
      required: true
    }
  ],
};
