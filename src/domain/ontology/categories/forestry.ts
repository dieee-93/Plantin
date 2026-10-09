import type { TraitDefinition } from '../types';

export const FORESTRY_ONTOLOGY: Record<string, TraitDefinition[]> = {
  'TEAK': [
    {
      id: 'TEK_WOOD_DENSITY',
      name: 'Densidad de la Madera',
      description: 'Gramos por centímetro cúbico (g/cm³). Teca de calidad es densa.',
      type: 'numeric',
      unit: 'g/cm³',
      min: 0.5,
      max: 0.9,
      required: true
    },
    {
      id: 'TEK_HEARTWOOD',
      name: 'Porcentaje de Duramen (Heartwood)',
      description: 'El duramen es la madera valiosa, resistente a termitas. La albura (sapwood) vale menos.',
      type: 'numeric',
      unit: '%',
      min: 30,
      max: 90,
      required: true
    },
    {
      id: 'TEK_GROWTH_RATE',
      name: 'Tasa de Incremento Medio Anual (IMA)',
      description: 'Metros cúbicos de madera por hectárea al año',
      type: 'numeric',
      unit: 'm³/ha/año',
      min: 5,
      max: 25,
      required: true
    },
    {
      id: 'TEK_RUST',
      name: 'Resistencia a Roya de la Teca',
      description: 'Olivea tectonae',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistente' },
        { value: 'susceptible', label: 'Susceptible (Defoliación severa)' }
      ],
      required: true
    }
  ],
  'MAHOGANY': [
    {
      id: 'MAH_SPECIES',
      name: 'Especie (Swietenia)',
      description: 'Macrophylla (Hondureña), Mahagoni (Antillana), Humilis (Pacífico)',
      type: 'categorical',
      options: [
        { value: 'macrophylla', label: 'S. macrophylla (Genuina/Honduras)' },
        { value: 'mahagoni', label: 'S. mahagoni (Cubana/Antillas)' }
      ],
      required: true
    },
    {
      id: 'MAH_SHOOT_BORER',
      name: 'Resistencia al Barrenador de Meliáceas (Hypsipyla grandella)',
      description: 'La plaga forestal más destructiva; destruye el ápice causando ramificación múltiple',
      type: 'categorical',
      options: [
        { value: 'tolerant', label: 'Tolerante (Raro, híbridos selectos)' },
        { value: 'susceptible', label: 'Muy Susceptible (Requiere sombra/asociación)' }
      ],
      required: true
    },
    {
      id: 'MAH_STRAIGHTNESS',
      name: 'Rectitud del Fuste',
      description: 'Capacidad natural de formar un tronco recto sin podas extremas',
      type: 'categorical',
      options: [
        { value: 'excellent', label: 'Excelente (Fuste limpio largo)' },
        { value: 'poor', label: 'Pobre (Torcido / Ramificado)' }
      ],
      required: true
    },
    {
      id: 'MAH_WOOD_COLOR',
      name: 'Color del Duramen',
      description: 'El color rojizo intenso es el más cotizado',
      type: 'categorical',
      options: [
        { value: 'deep_red', label: 'Rojo Oscuro / Caoba Claro' },
        { value: 'light', label: 'Marrón Claro' }
      ],
      required: true
    }
  ],
  'OAK': [
    {
      id: 'OAK_TYPE',
      name: 'Tipo de Roble',
      description: 'Blanco (Quercus alba - Barriles de vino) vs Rojo (Quercus rubra - Muebles)',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Roble Blanco (Impermeable - Tonelería)' },
        { value: 'red', label: 'Roble Rojo (Poroso)' }
      ],
      required: true
    },
    {
      id: 'OAK_TANNIN',
      name: 'Contenido de Taninos',
      description: 'Alto contenido de taninos da sabor al vino y protege contra insectos',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alto' },
        { value: 'moderate', label: 'Moderado' }
      ],
      required: true
    },
    {
      id: 'OAK_WILT',
      name: 'Resistencia a Marchitez del Roble',
      description: 'Oak wilt (Bretziella fagacearum)',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistente (Robles blancos toleran más)' },
        { value: 'susceptible', label: 'Susceptible (Robles rojos mueren rápido)' }
      ],
      required: true
    },
    {
      id: 'OAK_MASTING',
      name: 'Producción de Bellotas (Masting)',
      description: 'Afecta la regeneración natural y el ecosistema silvopastoril (cerdo ibérico)',
      type: 'categorical',
      options: [
        { value: 'heavy', label: 'Alta Producción (Mast years fuertes)' },
        { value: 'low', label: 'Baja' }
      ],
      required: true
    }
  ],
  'POPLAR': [
    {
      id: 'POP_PROPAGATION',
      name: 'Facilidad de Enraizamiento (Estacas)',
      description: 'Los álamos se propagan principalmente por estacado directo sin raíz',
      type: 'categorical',
      options: [
        { value: 'easy', label: 'Muy Fácil (P. deltoides, híbridos)' },
        { value: 'hard', label: 'Difícil (P. tremula)' }
      ],
      required: true
    },
    {
      id: 'POP_BIOMASS_YIELD',
      name: 'Rendimiento de Biomasa',
      description: 'Toneladas secas por hectárea al año (rotaciones cortas SRC)',
      type: 'numeric',
      unit: 't/ha/año',
      min: 10,
      max: 30,
      required: true
    },
    {
      id: 'POP_RUST',
      name: 'Resistencia a Roya (Melampsora spp.)',
      description: 'Principal limitante en plantaciones clonales',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Resistente' },
        { value: 9, label: 'Altamente Susceptible' }
      ],
      required: true
    },
    {
      id: 'POP_WOOD_DENSITY',
      name: 'Densidad Básica de Madera',
      description: 'Alamo es madera blanda, útil para palets, fósforos, pulpa',
      type: 'numeric',
      unit: 'kg/m³',
      min: 300,
      max: 450,
      required: true
    }
  ],
  'RADIATA_PINE': [
    {
      id: 'RAD_GROWTH_FORM',
      name: 'Forma y Rectitud',
      description: 'Selección genética para fustes rectos y baja ramificación',
      type: 'categorical',
      options: [
        { value: 'excellent', label: 'Recto (Madera de aserrío)' },
        { value: 'poor', label: 'Torcido (Sólo para pulpa)' }
      ],
      required: true
    },
    {
      id: 'RAD_WOOD_DENSITY',
      name: 'Densidad de Madera',
      description: 'Afecta la resistencia mecánica estructural',
      type: 'numeric',
      unit: 'kg/m³',
      min: 350,
      max: 550,
      required: true
    },
    {
      id: 'RAD_DOTHISTROMA',
      name: 'Resistencia a Tizón de las Agujas',
      description: 'Dothistroma septosporum',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'RAD_BRANCH_SIZE',
      name: 'Grosor de Ramas',
      description: 'Ramas gruesas dejan nudos grandes que deprecian la madera',
      type: 'categorical',
      options: [
        { value: 'small', label: 'Ramas finas / Nudos pequeños' },
        { value: 'large', label: 'Ramas gruesas' }
      ],
      required: true
    }
  ],
  'BAMBOO_TIMBER': [
    {
      id: 'BAM_CLUMP_TYPE',
      name: 'Tipo de Crecimiento',
      description: 'Simpodial (Forma matas/clump - Guadua) vs Monopodial (Invasivo/Corredor - Moso)',
      type: 'categorical',
      options: [
        { value: 'clumping', label: 'Simpodial (No invasivo, trópicos)' },
        { value: 'running', label: 'Monopodial (Invasivo, templado)' }
      ],
      required: true
    },
    {
      id: 'BAM_CULM_DIAMETER',
      name: 'Diámetro del Culmo (Caña)',
      description: 'Centímetros a la altura del pecho',
      type: 'numeric',
      unit: 'cm',
      min: 5,
      max: 20,
      required: true
    },
    {
      id: 'BAM_WALL_THICKNESS',
      name: 'Grosor de la Pared del Culmo',
      description: 'Paredes gruesas o macizas son mejores para construcción pesada',
      type: 'numeric',
      unit: 'mm',
      min: 5,
      max: 40,
      required: true
    },
    {
      id: 'BAM_MATURITY_TIME',
      name: 'Tiempo de Maduración para Cosecha',
      description: 'Años que tarda una caña en endurecer y lignificar para construcción',
      type: 'numeric',
      unit: 'años',
      min: 3,
      max: 7,
      required: true
    }
  ],
  'EUCALYPTUS': [
    {
      id: 'EUC_WOOD_DENSITY',
      name: 'Densidad Básica de Madera',
      description: 'kg/m³ (Importante para pulpa/celulosa vs madera sólida)',
      type: 'numeric',
      unit: 'kg/m3',
      min: 400,
      max: 800,
      required: true
    },
    {
      id: 'EUC_GROWTH',
      name: 'Tasa de Crecimiento (IMA)',
      description: 'Incremento Medio Anual m³/ha/año',
      type: 'numeric',
      unit: 'm3/ha/año',
      min: 15,
      max: 50,
      required: true
    },
    {
      id: 'EUC_FROST',
      name: 'Tolerancia al Frío (Heladas)',
      description: 'Grandis (Susceptible) vs Dunnii / Globulus / Nitens (Tolerantes)',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente (-10°C)' },
        { value: 9, label: 'Sensible (Daño a 0°C)' }
      ],
      required: true
    },
    {
      id: 'EUC_PULP_YIELD',
      name: 'Rendimiento Pulpable',
      description: 'Eficiencia en la fábrica Kraft',
      type: 'numeric',
      unit: '%',
      min: 45,
      max: 55,
      required: true
    }
  ],
  'PINE': [
    {
      id: 'PIN_WOOD_QUALITY',
      name: 'Calidad de Madera (Rigidez/MOE)',
      description: 'Módulo de Elasticidad, clave en madera estructural (Pinus radiata, taeda)',
      type: 'numeric',
      unit: 'GPa',
      min: 5,
      max: 15,
      required: true
    },
    {
      id: 'PIN_RESIN',
      name: 'Rendimiento de Resina',
      description: 'Producción de miera (Colofonia/Trementina) en especies resineras como P. elliottii',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alto (Uso resinero)' },
        { value: 'low', label: 'Bajo (Solo aserrío)' }
      ],
      required: true
    },
    {
      id: 'PIN_FUSIFORM',
      name: 'Resistencia a Roya Fusiforme',
      description: 'Cronartium quercuum, letal en el sureste',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'PIN_DROUGHT',
      name: 'Tolerancia a Sequía Extrema',
      description: 'Sobrevivencia en suelos arenosos pobres',
      type: 'categorical',
      options: [
        { value: 1, label: 'Excelente (Suelos secos)' },
        { value: 9, label: 'Pobre' }
      ],
      required: true
    }
  ],
  'BAMBOO': [
    {
      id: 'BAM_GROWTH_TYPE',
      name: 'Tipo de Rizoma',
      description: 'Simpodial (Clumping - no invasivo) vs Monopodial (Running - invasivo)',
      type: 'categorical',
      options: [
        { value: 'clumping', label: 'Matojo (Simpodial - Tropical)' },
        { value: 'running', label: 'Invasivo (Monopodial - Templado)' }
      ],
      required: true
    },
    {
      id: 'BAM_CULM_DIAMETER',
      name: 'Diámetro de Caña (Culm)',
      description: 'Cañas gigantes (Guadua, Dendrocalamus) vs Ornamentales/Varas (Phyllostachys)',
      type: 'numeric',
      unit: 'cm',
      min: 1,
      max: 25,
      required: true
    },
    {
      id: 'BAM_SHOOT_EDIBLE',
      name: 'Calidad de Brote Comestible',
      description: 'Amargor y textura para consumo humano (Phyllostachys edulis)',
      type: 'categorical',
      options: [
        { value: 'sweet', label: 'Dulce / Comestible Excelente' },
        { value: 'bitter', label: 'Amargo / Solo estructural' }
      ],
      required: true
    },
    {
      id: 'BAM_STRENGTH',
      name: 'Resistencia Mecánica',
      description: 'Tracción y compresión equivalente al acero (Acero vegetal)',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Extrema (Construcción pesada)' },
        { value: 'low', label: 'Decorativa / Papel' }
      ],
      required: true
    }
  ],
};
