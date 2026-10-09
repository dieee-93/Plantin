import type { TraitDefinition } from '../types';

export const BERRIES_ONTOLOGY: Record<string, TraitDefinition[]> = {
  'STRAWBERRY': [
    {
      id: 'STR_DAY_LENGTH',
      name: 'Respuesta al Fotoperíodo',
      description: 'Día corto (Junebearing) vs Día neutro (Remontante)',
      type: 'categorical',
      options: [
        { value: 'short_day', label: 'Día Corto (Una gran cosecha)' },
        { value: 'neutral', label: 'Día Neutro (Producción continua)' }
      ],
      required: true
    },
    {
      id: 'STR_BRIX',
      name: 'Grados Brix',
      description: 'Dulzura del fruto',
      type: 'numeric',
      unit: '°Bx',
      min: 6,
      max: 12,
      required: true
    },
    {
      id: 'STR_FIRMNESS',
      name: 'Firmeza del Fruto',
      description: 'Crucial para transporte y exportación',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Muy Firme (Exportación)' },
        { value: 'low', label: 'Blanda (Sabor intenso / Local)' }
      ],
      required: true
    },
    {
      id: 'STR_BOTRYTIS',
      name: 'Susceptibilidad a Botrytis',
      description: 'Moho gris en fruto',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Muy Susceptible' }
      ],
      required: true
    }
  ],
  'BLUEBERRY': [
    {
      id: 'BLU_TYPE',
      name: 'Tipo de Arbusto',
      description: 'Highbush (Norte/Sur), Rabbiteye, Lowbush',
      type: 'categorical',
      options: [
        { value: 'northern_highbush', label: 'Highbush Norte (Mucho frío)' },
        { value: 'southern_highbush', label: 'Highbush Sur (Poco frío)' },
        { value: 'rabbiteye', label: 'Rabbiteye (Tolerante sequía/suelo)' }
      ],
      required: true
    },
    {
      id: 'BLU_BLOOM',
      name: 'Presencia de Pruina (Bloom)',
      description: 'Cera blanca que da el color celeste opaco (muy deseable)',
      type: 'categorical',
      options: [
        { value: 'heavy', label: 'Abundante (Celeste claro)' },
        { value: 'light', label: 'Escasa (Azul oscuro/Negro)' }
      ],
      required: true
    },
    {
      id: 'BLU_BERRY_SIZE',
      name: 'Calibre de Baya',
      description: 'Diámetro en mm (Jumbo >18mm)',
      type: 'numeric',
      unit: 'mm',
      min: 10,
      max: 25,
      required: true
    },
    {
      id: 'BLU_CRISP',
      name: 'Textura Crujiente (Crispness)',
      description: 'Las variedades modernas hacen "pop" al morder',
      type: 'categorical',
      options: [
        { value: 'crisp', label: 'Muy Crujiente' },
        { value: 'soft', label: 'Harinoso / Blando' }
      ],
      required: true
    }
  ],
  'RASPBERRY': [
    {
      id: 'RAS_BEARING',
      name: 'Hábito de Producción',
      description: 'Floricane (produce en cañas 2do año) vs Primocane (remontante en 1er año)',
      type: 'categorical',
      options: [
        { value: 'floricane', label: 'Floricane (Verano)' },
        { value: 'primocane', label: 'Primocane (Otoño / Remontante)' }
      ],
      required: true
    },
    {
      id: 'RAS_FRUIT_COLOR',
      name: 'Color del Fruto',
      description: 'Roja, Negra (Black cap), Amarilla/Dorada',
      type: 'categorical',
      options: [
        { value: 'red', label: 'Roja' },
        { value: 'black', label: 'Negra' },
        { value: 'yellow', label: 'Dorada / Amarilla' }
      ],
      required: true
    },
    {
      id: 'RAS_CRUMBLING',
      name: 'Desgrane (Crumbling)',
      description: 'Susceptibilidad a desarmarse al cosechar',
      type: 'categorical',
      options: [
        { value: 'firm', label: 'Cohesión Fuerte (Deseable)' },
        { value: 'crumbly', label: 'Se desgrana fácil (Defecto/Virus)' }
      ],
      required: true
    },
    {
      id: 'RAS_THORNS',
      name: 'Presencia de Espinas',
      description: 'Facilidad de cosecha',
      type: 'categorical',
      options: [
        { value: 'spineless', label: 'Sin espinas' },
        { value: 'thorny', label: 'Con espinas' }
      ],
      required: true
    }
  ],
  'BLACKBERRY': [
    {
      id: 'BKB_GROWTH_HABIT',
      name: 'Hábito de Crecimiento',
      description: 'Erecto, Semi-erecto o Rastrero (Trailing)',
      type: 'categorical',
      options: [
        { value: 'erect', label: 'Erecto (Soporte mínimo)' },
        { value: 'trailing', label: 'Rastrero (Requiere alambre)' }
      ],
      required: true
    },
    {
      id: 'BKB_THORNS',
      name: 'Espinas',
      description: 'Variedades modernas inermes',
      type: 'categorical',
      options: [
        { value: 'thornless', label: 'Inerme (Sin espinas)' },
        { value: 'thorny', label: 'Espinosa' }
      ],
      required: true
    },
    {
      id: 'BKB_RED_CELL',
      name: 'Reversión de Color (Red Cell Defect)',
      description: 'Drupéolas que se tornan rojas post-cosecha (defecto frío)',
      type: 'categorical',
      options: [
        { value: 'low', label: 'Retiene color negro' },
        { value: 'high', label: 'Alta susceptibilidad a ponerse roja' }
      ],
      required: true
    },
    {
      id: 'BKB_PRIMOCANE',
      name: 'Fructificación Primocane',
      description: 'Fructifica en cañas del primer año',
      type: 'categorical',
      options: [
        { value: 'yes', label: 'Remontante (Otoño)' },
        { value: 'no', label: 'Floricane (Tradicional)' }
      ],
      required: true
    }
  ],
  'CRANBERRY': [
    {
      id: 'CRA_BERRY_COLOR',
      name: 'Intensidad de Color',
      description: 'Rojo brillante a Rojo muy oscuro (antocianinas)',
      type: 'categorical',
      options: [
        { value: 'dark_red', label: 'Rojo Oscuro' },
        { value: 'light_red', label: 'Rojo Claro / Rosado' }
      ],
      required: true
    },
    {
      id: 'CRA_VINE_GROWTH',
      name: 'Vigor de la Guía (Vine Runner)',
      description: 'Importante para establecer la cama (bog) rápidamente',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Vigoroso' },
        { value: 'low', label: 'Débil' }
      ],
      required: true
    },
    {
      id: 'CRA_EARLINESS',
      name: 'Precocidad de Cosecha',
      description: 'Temprano, Medio, Tardío',
      type: 'categorical',
      options: [
        { value: 'early', label: 'Temprana' },
        { value: 'late', label: 'Tardía' }
      ],
      required: true
    },
    {
      id: 'CRA_FRUIT_ROT',
      name: 'Susceptibilidad a Pudrición de Fruto',
      description: 'Field rot / Storage rot',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'GOOSEBERRY': [
    {
      id: 'GOO_FRUIT_COLOR',
      name: 'Color de Baya',
      description: 'Verde, Amarilla, Roja/Púrpura',
      type: 'categorical',
      options: [
        { value: 'green', label: 'Verde/Blanca' },
        { value: 'red', label: 'Roja/Púrpura' },
        { value: 'yellow', label: 'Amarilla' }
      ],
      required: true
    },
    {
      id: 'GOO_MILDEW',
      name: 'Resistencia a Oídio Americano',
      description: 'Sphaerotheca mors-uvae',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistente' },
        { value: 'susceptible', label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'GOO_SPINES',
      name: 'Vigor de Espinas',
      description: 'Las espinas dificultan mucho la cosecha',
      type: 'categorical',
      options: [
        { value: 'few', label: 'Casi inerme / Espinas suaves' },
        { value: 'many', label: 'Espinas muy agresivas' }
      ],
      required: true
    },
    {
      id: 'GOO_FLAVOR',
      name: 'Balance Dulce/Ácido',
      description: 'Para postre (dulce) o cocina (ácida)',
      type: 'categorical',
      options: [
        { value: 'sweet', label: 'Dulce (Postre/Fresco)' },
        { value: 'tart', label: 'Ácida (Mermeladas)' }
      ],
      required: true
    }
  ],
};
