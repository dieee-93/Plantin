import type { TraitDefinition } from '../types';

export const SPICES_ONTOLOGY: Record<string, TraitDefinition[]> = {
  'VANILLA': [
    {
      id: 'VAN_VANILLIN',
      name: 'Contenido de Vainillina',
      description: 'Principio activo aromático (V. planifolia vs V. tahitensis)',
      type: 'numeric',
      unit: '%',
      min: 1,
      max: 3.5,
      required: true
    },
    {
      id: 'VAN_FUSARIUM',
      name: 'Resistencia a Fusarium',
      description: 'Pudrición de raíz y tallo (Fusarium oxysporum f. sp. vanillae)',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Altamente Susceptible' }
      ],
      required: true
    },
    {
      id: 'VAN_POD_LENGTH',
      name: 'Longitud de Vaina Curada',
      description: 'Vainas largas (>15cm) son calidad Premium Gourmet',
      type: 'numeric',
      unit: 'cm',
      min: 10,
      max: 25,
      required: true
    },
    {
      id: 'VAN_FLOWERING',
      name: 'Densidad de Floración',
      description: 'Rendimiento potencial (requiere polinización manual extrema)',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alta (Muchos racimos)' },
        { value: 'low', label: 'Baja' }
      ],
      required: true
    }
  ],
  'CINNAMON': [
    {
      id: 'CIN_COUMARIN',
      name: 'Contenido de Cumarina',
      description: 'Tóxico hepático (Cassia alto vs Ceylán casi nulo)',
      type: 'categorical',
      options: [
        { value: 'low', label: 'Bajo/Traza (True Cinnamon - Ceylán)' },
        { value: 'high', label: 'Alto (Canela Cassia)' }
      ],
      required: true
    },
    {
      id: 'CIN_BARK_THICKNESS',
      name: 'Grosor y Calidad de Corteza',
      description: 'Ceylán forma capas finas quebradizas, Cassia es un tubo grueso duro',
      type: 'categorical',
      options: [
        { value: 'thin', label: 'Fina/Quebradiza (Premium Alba)' },
        { value: 'thick', label: 'Gruesa/Dura' }
      ],
      required: true
    },
    {
      id: 'CIN_OIL_YIELD',
      name: 'Aceite Esencial en Hoja/Corteza',
      description: 'Contenido de aldehído cinámico y eugenol',
      type: 'numeric',
      unit: '%',
      min: 1,
      max: 4,
      required: true
    },
    {
      id: 'CIN_COPPICE',
      name: 'Capacidad de Rebrote (Coppicing)',
      description: 'Esencial porque se poda a ras para cosechar tallos nuevos',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Excelente (Emite muchos chupones)' },
        { value: 'low', label: 'Pobre' }
      ],
      required: true
    }
  ],
  'BLACK_PEPPER': [
    {
      id: 'BPE_PIPERINE',
      name: 'Contenido de Piperina',
      description: 'Alcaloide responsable de la pungencia (picor)',
      type: 'numeric',
      unit: '%',
      min: 2,
      max: 8,
      required: true
    },
    {
      id: 'BPE_PHYTOPHTHORA',
      name: 'Resistencia a Phytophthora capsici',
      description: 'Pudrición del pie (Quick wilt), la enfermedad más grave mundialmente',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente/Tolerante' },
        { value: 9, label: 'Muy Susceptible' }
      ],
      required: true
    },
    {
      id: 'BPE_YIELD_SPIKE',
      name: 'Bayas por Espiga',
      description: 'Racimos densos vs laxos',
      type: 'numeric',
      unit: 'bayas',
      min: 30,
      max: 150,
      required: true
    },
    {
      id: 'BPE_BISEXUAL',
      name: 'Porcentaje de Flores Bisexuales',
      description: 'Garantiza buena polinización sin depender de lluvia intensa',
      type: 'numeric',
      unit: '%',
      min: 50,
      max: 100,
      required: true
    }
  ],
  'CARDAMOM': [
    {
      id: 'CAR_OIL_CONTENT',
      name: 'Aceite Esencial en Cápsula',
      description: 'Rendimiento aromático (cineol, acetato de terpinilo)',
      type: 'numeric',
      unit: '%',
      min: 4,
      max: 10,
      required: true
    },
    {
      id: 'CAR_POD_COLOR',
      name: 'Retención de Color Verde',
      description: 'Las cápsulas curadas que retienen verde intenso valen más',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Verde Intenso / Persistente' },
        { value: 'low', label: 'Palidece / Amarillea' }
      ],
      required: true
    },
    {
      id: 'CAR_THRIPS',
      name: 'Tolerancia a Trips',
      description: 'Los trips causan sarna en la cápsula y bajan el valor comercial',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'CAR_DROUGHT',
      name: 'Sensibilidad a Sequía Estival',
      description: 'Requiere humedad extrema, meses secos matan la mata',
      type: 'categorical',
      options: [
        { value: 1, label: 'Algo Tolerante' },
        { value: 9, label: 'Muy Sensible (Se seca rápido)' }
      ],
      required: true
    }
  ],
  'SAFFRON': [
    {
      id: 'SAF_CROCIN',
      name: 'Contenido de Crocina',
      description: 'Poder colorante (Norma ISO 3632)',
      type: 'numeric',
      unit: 'absorbancia',
      min: 150,
      max: 300,
      required: true
    },
    {
      id: 'SAF_SAFRANAL',
      name: 'Contenido de Safranal',
      description: 'Compuesto del aroma característico',
      type: 'numeric',
      unit: 'absorbancia',
      min: 20,
      max: 60,
      required: true
    },
    {
      id: 'SAF_STIGMA_LENGTH',
      name: 'Longitud del Estigma',
      description: 'Tres filamentos rojos por flor, más largos = mayor rendimiento',
      type: 'numeric',
      unit: 'mm',
      min: 20,
      max: 45,
      required: true
    },
    {
      id: 'SAF_CORMB_SIZE',
      name: 'Multiplicación de Cormos',
      description: 'Capacidad de generar bulbillos grandes anualmente',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alta (Renovación rápida)' },
        { value: 'low', label: 'Baja' }
      ],
      required: true
    }
  ],
  'GINGER': [
    {
      id: 'GIN_RHIZOME_SIZE',
      name: 'Tamaño de Rizoma',
      description: 'Jengibre gigante (mercado fresco) vs Pequeño (polvo/aceite)',
      type: 'categorical',
      options: [
        { value: 'large', label: 'Grande / Chino' },
        { value: 'small', label: 'Pequeño (Alto en pungencia)' }
      ],
      required: true
    },
    {
      id: 'GIN_FIBER',
      name: 'Contenido de Fibra',
      description: 'Baja fibra es esencial para consumo fresco y encurtido',
      type: 'categorical',
      options: [
        { value: 'low', label: 'Baja Fibra (Premium)' },
        { value: 'high', label: 'Alta Fibra' }
      ],
      required: true
    },
    {
      id: 'GIN_GINGEROL',
      name: 'Contenido de Gingerol',
      description: 'Principio activo picante',
      type: 'numeric',
      unit: '%',
      min: 1,
      max: 3,
      required: true
    },
    {
      id: 'GIN_RALSTONIA',
      name: 'Susceptibilidad a Marchitez Bacteriana (Ralstonia)',
      description: 'La enfermedad más limitante del cultivo',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Altamente Susceptible' }
      ],
      required: true
    }
  ],
  'TURMERIC': [
    {
      id: 'TUR_CURCUMIN',
      name: 'Contenido de Curcumina',
      description: 'Principio activo colorante y medicinal',
      type: 'numeric',
      unit: '%',
      min: 2,
      max: 9,
      required: true
    },
    {
      id: 'TUR_MATURITY',
      name: 'Ciclo de Cosecha (Meses)',
      description: 'Meses desde siembra hasta senescencia',
      type: 'numeric',
      unit: 'meses',
      min: 7,
      max: 10,
      required: true
    },
    {
      id: 'TUR_RHIZOME_COLOR',
      name: 'Color de Pulpa del Rizoma',
      description: 'Amarillo claro a Naranja oscuro/Rojizo',
      type: 'categorical',
      options: [
        { value: 'yellow', label: 'Amarillo Claro' },
        { value: 'deep_orange', label: 'Naranja Oscuro / Rojizo' }
      ],
      required: true
    },
    {
      id: 'TUR_SHOOT_BORER',
      name: 'Tolerancia al Barrenador del Tallo',
      description: 'Conogethes punctiferalis',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'CLOVE': [
    {
      id: 'CLO_EUGENOL',
      name: 'Contenido de Eugenol',
      description: 'Principal componente del aceite esencial del botón floral',
      type: 'numeric',
      unit: '%',
      min: 70,
      max: 90,
      required: true
    },
    {
      id: 'CLO_BUD_SIZE',
      name: 'Tamaño del Botón Floral',
      description: 'Botones gruesos e íntegros dan mayor peso',
      type: 'categorical',
      options: [
        { value: 'large', label: 'Grande' },
        { value: 'small', label: 'Pequeño' }
      ],
      required: true
    },
    {
      id: 'CLO_DIEBACK',
      name: 'Resistencia a Muerte Descendente (Die-back)',
      description: 'Valsa eugeniae',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistente' },
        { value: 'susceptible', label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'CLO_CANOPY',
      name: 'Forma de la Copa',
      description: 'Cilíndrica vs Cónica (afecta densidad de siembra y recolección manual)',
      type: 'categorical',
      options: [
        { value: 'conical', label: 'Cónica' },
        { value: 'bushy', label: 'Frondosa / Cilíndrica' }
      ],
      required: true
    }
  ],
  'NUTMEG': [
    {
      id: 'NUT_GENDER',
      name: 'Sexo de la Planta',
      description: 'Es una especie dioica. Los machos no producen fruto.',
      type: 'categorical',
      options: [
        { value: 'female', label: 'Hembra (Productiva)' },
        { value: 'male', label: 'Macho (Polinizador)' },
        { value: 'hermaphrodite', label: 'Bisexual (Rara)' }
      ],
      required: true
    },
    {
      id: 'NUT_MACE_YIELD',
      name: 'Proporción de Macis',
      description: 'El macis (arilo rojo) es una especia separada y muy valiosa',
      type: 'numeric',
      unit: 'g/fruto',
      min: 1,
      max: 4,
      required: true
    },
    {
      id: 'NUT_MYRISTICIN',
      name: 'Contenido de Miristicina',
      description: 'Compuesto psicoactivo y de sabor en el aceite de nuez',
      type: 'numeric',
      unit: '%',
      min: 2,
      max: 10,
      required: true
    },
    {
      id: 'NUT_FRUIT_ROT',
      name: 'Tolerancia a Pudrición del Fruto',
      description: 'Phytophthora',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'WASABI': [
    {
      id: 'WSB_RHIZOME_COLOR',
      name: 'Color Interno del Rizoma',
      description: 'El verde intenso fluorescente es el más valorado',
      type: 'categorical',
      options: [
        { value: 'emerald_green', label: 'Verde Esmeralda (Premium)' },
        { value: 'pale_green', label: 'Verde Pálido' }
      ],
      required: true
    },
    {
      id: 'WSB_CULTIVATION',
      name: 'Sistema de Cultivo (Sawa vs Oka)',
      description: 'Sawa (Arroyo de montaña de calidad superior) vs Oka (En campo/suelo)',
      type: 'categorical',
      options: [
        { value: 'sawa', label: 'Sawa (Acuático corriente - Alta Calidad)' },
        { value: 'oka', label: 'Oka (Tierra/Invernadero - Menor pungencia)' }
      ],
      required: true
    },
    {
      id: 'WSB_HEAT_SENSITIVITY',
      name: 'Sensibilidad al Calor Estival',
      description: 'Muere o se pudre si el agua o ambiente supera los 20°C',
      type: 'categorical',
      options: [
        { value: 'extreme', label: 'Extremadamente sensible (>15°C daña)' },
        { value: 'moderate', label: 'Tolera hasta 20°C con sombra' }
      ],
      required: true
    },
    {
      id: 'WSB_ROT',
      name: 'Resistencia a Pudrición de Raíz (Phoma / Erwinia)',
      description: 'Riesgo inmenso en sistemas Oka y mala oxigenación en Sawa',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Altamente Susceptible' }
      ],
      required: true
    }
  ],
  'HORSERADISH': [
    {
      id: 'HOR_ROOT_THICKNESS',
      name: 'Grosor de la Raíz Principal',
      description: 'Raíces gruesas lisas facilitan el pelado y procesamiento industrial',
      type: 'numeric',
      unit: 'cm',
      min: 2,
      max: 8,
      required: true
    },
    {
      id: 'HOR_PUNGENCY',
      name: 'Nivel de Pungencia (Alil Isotiocianato)',
      description: 'Compuesto que causa la reacción de "limpieza de senos nasales"',
      type: 'categorical',
      options: [
        { value: 'extreme', label: 'Extremo (Industrial / Imitación Wasabi)' },
        { value: 'mild', label: 'Suave' }
      ],
      required: true
    },
    {
      id: 'HOR_RUST',
      name: 'Tolerancia a Roya Blanca',
      description: 'Albugo candida (Daña hojas y reduce rendimiento de raíz)',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistente' },
        { value: 'susceptible', label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'HOR_INVASIVENESS',
      name: 'Capacidad de Regeneración (Invasividad)',
      description: 'Un solo trozo de raíz olvidado en campo genera una nueva planta',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Muy Difícil de Erradicar' },
        { value: 'moderate', label: 'Manejable' }
      ],
      required: true
    }
  ],
};
