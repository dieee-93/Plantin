import type { TraitDefinition } from '../types';

export const CITRUS_PALMS_ONTOLOGY: Record<string, TraitDefinition[]> = {
  'LEMON': [
    {
      id: 'LEM_SEEDLESS',
      name: 'Presencia de Semillas',
      description: 'Limones sin semilla tienen mayor valor en mercado fresco',
      type: 'categorical',
      options: [
        { value: 'seeded', label: 'Con Semillas' },
        { value: 'seedless', label: 'Sin Semillas (Seedless)' }
      ],
      required: true
    },
    {
      id: 'LEM_JUICE_YIELD',
      name: 'Rendimiento de Jugo',
      description: 'Porcentaje del peso del fruto (ideal >30%)',
      type: 'numeric',
      unit: '%',
      min: 20,
      max: 55,
      required: true
    },
    {
      id: 'LEM_MAL_SECCO',
      name: 'Resistencia a Mal Secco (Phoma tracheiphila)',
      description: 'Enfermedad letal en el Mediterráneo',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente (Ej. Monachello)' },
        { value: 9, label: 'Muy Susceptible (Ej. Femminello)' }
      ],
      required: true
    },
    {
      id: 'LEM_REFLORESCENCE',
      name: 'Hábito de Refloración (Everblooming)',
      description: 'Capacidad de florecer varias veces al año (verdelli)',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alta (Varios cortes al año)' },
        { value: 'low', label: 'Un solo pico de cosecha' }
      ],
      required: true
    }
  ],
  'LIME': [
    {
      id: 'LIM_TYPE',
      name: 'Tipo de Lima',
      description: 'Tahití/Persa (grande, sin semilla) vs Sutil/Key (pequeña, aromática, con semilla)',
      type: 'categorical',
      options: [
        { value: 'persian', label: 'Lima Tahití/Persa (Citrus latifolia)' },
        { value: 'key', label: 'Lima Sutil/Key (Citrus aurantiifolia)' }
      ],
      required: true
    },
    {
      id: 'LIM_PEEL_THICKNESS',
      name: 'Grosor de Cáscara',
      description: 'Milímetros (corteza fina es preferida)',
      type: 'numeric',
      unit: 'mm',
      min: 1,
      max: 4,
      required: true
    },
    {
      id: 'LIM_CTV',
      name: 'Tolerancia al Virus de la Tristeza (CTV)',
      description: 'Especialmente clave si se injerta sobre naranjo amargo',
      type: 'categorical',
      options: [
        { value: 'tolerant', label: 'Tolerante' },
        { value: 'susceptible', label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'LIM_GREEN_COLOR',
      name: 'Retención de Color Verde',
      description: 'En mercado de frescos el amarillo deprecia el precio',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Excelente (Tarda en amarillear)' },
        { value: 'low', label: 'Pobre (Amarillea rápido)' }
      ],
      required: true
    }
  ],
  'MANDARIN': [
    {
      id: 'MAN_GROUP',
      name: 'Grupo Varietal',
      description: 'Clementinas, Satsumas, Híbridos (Tangelos/Murcott), Mediterráneas',
      type: 'categorical',
      options: [
        { value: 'clementina', label: 'Clementina' },
        { value: 'satsuma', label: 'Satsuma' },
        { value: 'hybrid', label: 'Híbrido (Tangelo, W. Murcott)' }
      ],
      required: true
    },
    {
      id: 'MAN_PEELING',
      name: 'Facilidad de Pelado (Easy-peeler)',
      description: 'Atributo crítico para consumo infantil/snack',
      type: 'categorical',
      options: [
        { value: 'very_easy', label: 'Muy Fácil (Satsuma)' },
        { value: 'moderate', label: 'Moderada' },
        { value: 'hard', label: 'Difícil' }
      ],
      required: true
    },
    {
      id: 'MAN_SEEDLESS_CROSS',
      name: 'Apirenia bajo Polinización Cruzada',
      description: 'Algunas clementinas dan semillas si hay abejas y polen compatible cerca',
      type: 'categorical',
      options: [
        { value: 'sterile', label: '100% Sin Semilla siempre (Polen y óvulo estéril)' },
        { value: 'conditional', label: 'Hace semilla con polinización cruzada' }
      ],
      required: true
    },
    {
      id: 'MAN_ALTERNATION',
      name: 'Alternancia de Producción (Vecería)',
      description: 'Un año mucho fruto pequeño, otro año poco fruto grande',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Mucha vecería (Requiere raleo floral intensivo)' },
        { value: 'low', label: 'Producción estable' }
      ],
      required: true
    }
  ],
  'GRAPEFRUIT': [
    {
      id: 'GRP_FLESH_COLOR',
      name: 'Color de Pulpa',
      description: 'Blanco/Amarillo vs Rosado/Rojo Oscuro',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Blanco' },
        { value: 'pink', label: 'Rosado' },
        { value: 'ruby', label: 'Rojo Oscuro (Star Ruby / Rio Red)' }
      ],
      required: true
    },
    {
      id: 'GRP_BITTERNESS',
      name: 'Amargor (Naringina)',
      description: 'Nivel del flavonoide que da el sabor amargo característico',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alto (Tradicional)' },
        { value: 'low', label: 'Bajo (Dulce)' }
      ],
      required: true
    },
    {
      id: 'GRP_HEAT_REQ',
      name: 'Requerimiento de Calor (Unidades Térmicas)',
      description: 'Pomelos necesitan mucho calor para madurar y endulzar',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Muy Alto (Zonas tropicales/desérticas)' },
        { value: 'moderate', label: 'Moderado (Clima Mediterráneo)' }
      ],
      required: true
    },
    {
      id: 'GRP_PEST_MITE',
      name: 'Tolerancia a Ácaros (Rust Mite)',
      description: 'Causan daño estético severo (bronceado) en cáscara',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'COCONUT': [
    {
      id: 'COC_TYPE',
      name: 'Tipo (Variedad botánica)',
      description: 'Enano (Precoz/Agua) vs Alto (Tardío/Copra) vs Híbrido',
      type: 'categorical',
      options: [
        { value: 'dwarf', label: 'Enano (Agua, dulce, autógamo)' },
        { value: 'tall', label: 'Alto (Copra, aceite, rústico)' },
        { value: 'hybrid', label: 'Híbrido (PB121 - Rendimiento)' }
      ],
      required: true
    },
    {
      id: 'COC_LY',
      name: 'Resistencia a Amarillamiento Letal (Lethal Yellowing)',
      description: 'Fitoplasma devastador transmitido por insectos',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistente (Malayan Dwarf)' },
        { value: 'susceptible', label: 'Altamente Susceptible (Altos tradicionales)' }
      ],
      required: true
    },
    {
      id: 'COC_WATER_VOL',
      name: 'Volumen de Agua por Nuez',
      description: 'Mililitros por coco tierno',
      type: 'numeric',
      unit: 'mL',
      min: 200,
      max: 800,
      required: true
    },
    {
      id: 'COC_COPRA_YIELD',
      name: 'Rendimiento de Copra (Pulpa seca)',
      description: 'Gramos de copra por nuez madura',
      type: 'numeric',
      unit: 'g',
      min: 150,
      max: 400,
      required: true
    }
  ],
  'DATE_PALM': [
    {
      id: 'DAT_MOISTURE',
      name: 'Contenido de Humedad (Tipo de consumo)',
      description: 'Suave, Semiseco, Seco',
      type: 'categorical',
      options: [
        { value: 'soft', label: 'Suave (Medjool)' },
        { value: 'semi_dry', label: 'Semiseco (Deglet Noor)' },
        { value: 'dry', label: 'Seco (Thoory)' }
      ],
      required: true
    },
    {
      id: 'DAT_FRUIT_SIZE',
      name: 'Tamaño de Fruto',
      description: 'Gramos por fruto',
      type: 'numeric',
      unit: 'g',
      min: 5,
      max: 30,
      required: true
    },
    {
      id: 'DAT_BAYOUD',
      name: 'Resistencia a Enfermedad del Bayoud (Fusarium oxysporum albedinis)',
      description: 'Marchitez vascular devastadora en África del Norte',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistente' },
        { value: 'susceptible', label: 'Susceptible (Medjool es muy susceptible)' }
      ],
      required: true
    },
    {
      id: 'DAT_OFFSHOOTS',
      name: 'Producción de Hijuelos (Offshoots)',
      description: 'Vital para propagación clonal vegetativa rápida',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alta (Muchos hijuelos)' },
        { value: 'low', label: 'Baja' }
      ],
      required: true
    }
  ],
  'OIL_PALM': [
    {
      id: 'OIL_GENOME',
      name: 'Forma Genómica (Grosor de Cáscara)',
      description: 'Dura (Gruesa), Pisifera (Sin cáscara/estéril), Tenera (Híbrida D x P, la más productiva)',
      type: 'categorical',
      options: [
        { value: 'dura', label: 'Dura (Cáscara gruesa)' },
        { value: 'pisifera', label: 'Pisifera (Sin cáscara)' },
        { value: 'tenera', label: 'Tenera (Cáscara fina / Alta extracción)' }
      ],
      required: true
    },
    {
      id: 'OIL_EXTRACTION_RATE',
      name: 'Tasa de Extracción de Aceite (OER)',
      description: 'Porcentaje de aceite extraído del racimo de fruta fresca',
      type: 'numeric',
      unit: '%',
      min: 15,
      max: 32,
      required: true
    },
    {
      id: 'OIL_TRUNK_GROWTH',
      name: 'Tasa de Crecimiento del Estípite (Tronco)',
      description: 'Metros por año. Crecimiento lento extiende vida útil (facilita cosecha)',
      type: 'numeric',
      unit: 'm/año',
      min: 0.2,
      max: 0.8,
      required: true
    },
    {
      id: 'OIL_GANODERMA',
      name: 'Resistencia a Pudrición Basal del Tronco',
      description: 'Ganoderma boninense',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Altamente Susceptible' }
      ],
      required: true
    }
  ],
};
