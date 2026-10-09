import type { TraitDefinition } from '../types';

export const NUTS_ONTOLOGY: Record<string, TraitDefinition[]> = {
  'ALMOND': [
    {
      id: 'ALM_SHELL_SEAL',
      name: 'Sellado de Cáscara',
      description: 'Cáscara bien sellada previene entrada de Navel Orangeworm',
      type: 'categorical',
      options: [
        { value: 'well_sealed', label: 'Bien Sellada' },
        { value: 'poorly_sealed', label: 'Mal Sellada (Riesgo plagas)' }
      ],
      required: true
    },
    {
      id: 'ALM_KERNEL_DOUBLE',
      name: 'Porcentaje de Almendras Dobles',
      description: 'Defecto comercial (se busca semilla única)',
      type: 'numeric',
      unit: '%',
      min: 0,
      max: 30,
      required: true
    },
    {
      id: 'ALM_POLLINATION',
      name: 'Requerimiento de Polinización',
      description: 'Auto-fértil (Independence) vs Requiere abejas/cruce (Nonpareil)',
      type: 'categorical',
      options: [
        { value: 'self_fertile', label: 'Auto-fértil' },
        { value: 'cross', label: 'Requiere Cruzada (Incompatible)' }
      ],
      required: true
    },
    {
      id: 'ALM_FLAVOR',
      name: 'Perfil de Sabor',
      description: 'Dulce vs Amargo (Amigdalina)',
      type: 'categorical',
      options: [
        { value: 'sweet', label: 'Dulce (Consumo)' },
        { value: 'bitter', label: 'Amargo (Aceites/Esencias)' }
      ],
      required: true
    }
  ],
  'WALNUT': [
    {
      id: 'WAL_SHELL_THICKNESS',
      name: 'Grosor de Cáscara',
      description: 'Cáscara de papel (Premium) vs Dura',
      type: 'categorical',
      options: [
        { value: 'paper', label: 'Cáscara de papel (Fácil partido)' },
        { value: 'hard', label: 'Dura' }
      ],
      required: true
    },
    {
      id: 'WAL_KERNEL_COLOR',
      name: 'Color de la Mariposa (Kernel)',
      description: 'Extra Light es el estándar más alto',
      type: 'categorical',
      options: [
        { value: 'extra_light', label: 'Extra Light' },
        { value: 'light', label: 'Light' },
        { value: 'amber', label: 'Light Amber' }
      ],
      required: true
    },
    {
      id: 'WAL_LATERAL_FRUITING',
      name: 'Fructificación Lateral',
      description: 'Porcentaje de yemas laterales fructíferas (rendimiento)',
      type: 'numeric',
      unit: '%',
      min: 0,
      max: 100,
      required: true
    },
    {
      id: 'WAL_BLIGHT',
      name: 'Susceptibilidad a Bacteriosis (Xanthomonas)',
      description: 'La principal enfermedad del nogal en primaveras húmedas',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Muy Susceptible' }
      ],
      required: true
    }
  ],
  'PECAN': [
    {
      id: 'PEC_NUT_SIZE',
      name: 'Tamaño de Nuez (Nueces/libra)',
      description: 'Menos nueces por libra = mayor tamaño (Mammoth vs Small)',
      type: 'numeric',
      unit: 'nuts/lb',
      min: 35,
      max: 80,
      required: true
    },
    {
      id: 'PEC_SCAB',
      name: 'Resistencia a Sarna (Pecan Scab)',
      description: 'Venturia effusa, enfermedad fúngica limitante',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Resistente' },
        { value: 9, label: 'Altamente Susceptible' }
      ],
      required: true
    },
    {
      id: 'PEC_DICHOGAMY',
      name: 'Tipo de Dicogamia',
      description: 'Protándrica (Polen primero - Tipo I) vs Protógina (Estigma primero - Tipo II)',
      type: 'categorical',
      options: [
        { value: 'type1', label: 'Tipo I (Protándrica)' },
        { value: 'type2', label: 'Tipo II (Protógina)' }
      ],
      required: true
    },
    {
      id: 'PEC_KERNEL_PERCENT',
      name: 'Rendimiento de Nuez Pelada (Kernel %)',
      description: 'Porcentaje de carne respecto a la nuez entera',
      type: 'numeric',
      unit: '%',
      min: 40,
      max: 65,
      required: true
    }
  ],
  'HAZELNUT': [
    {
      id: 'HAZ_BLIGHT',
      name: 'Resistencia a Tizón del Este (EFB)',
      description: 'Anisogramma anomala',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistente (Gasaway gene)' },
        { value: 'susceptible', label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'HAZ_KERNEL_BLANCH',
      name: 'Capacidad de Pelado Térmico (Blanching)',
      description: 'Facilidad para remover el hollejo al tostar (clave para chocolates)',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Excelente (Queda blanco)' },
        { value: 'low', label: 'Pobre (Retiene hollejo)' }
      ],
      required: true
    },
    {
      id: 'HAZ_SHAPE',
      name: 'Forma de la Avellana',
      description: 'Redonda (Industria chocolate) vs Larga/Oval (Fresco)',
      type: 'categorical',
      options: [
        { value: 'round', label: 'Redonda (Ferrero/Industria)' },
        { value: 'long', label: 'Alargada (Fresco)' }
      ],
      required: true
    },
    {
      id: 'HAZ_SUCKERING',
      name: 'Hábito de Emisión de Sierpes',
      description: 'Manejo del huerto (se prefieren árboles de un solo tronco)',
      type: 'categorical',
      options: [
        { value: 'low', label: 'Poca emisión (Fácil manejo)' },
        { value: 'high', label: 'Alta emisión de sierpes' }
      ],
      required: true
    }
  ],
  'PISTACHIO': [
    {
      id: 'PIS_SHELL_SPLIT',
      name: 'Porcentaje de Apertura de Cáscara (Split)',
      description: 'Apertura natural en el árbol (Deseable)',
      type: 'numeric',
      unit: '%',
      min: 50,
      max: 95,
      required: true
    },
    {
      id: 'PIS_BLANKING',
      name: 'Porcentaje de Frutos Vanos (Blanks)',
      description: 'Frutos sin semilla adentro (Defecto por falta polinización/estrés)',
      type: 'numeric',
      unit: '%',
      min: 0,
      max: 20,
      required: true
    },
    {
      id: 'PIS_KERNEL_COLOR',
      name: 'Color Interno del Kernel',
      description: 'Verde intenso es de mayor valor comercial',
      type: 'categorical',
      options: [
        { value: 'deep_green', label: 'Verde Intenso (Premium)' },
        { value: 'yellowish', label: 'Verde Amarillento' }
      ],
      required: true
    },
    {
      id: 'PIS_CHILLING',
      name: 'Horas Frío',
      description: 'El pistacho requiere inviernos muy marcados',
      type: 'numeric',
      unit: 'HF',
      min: 600,
      max: 1200,
      required: true
    }
  ],
  'CHESTNUT': [
    {
      id: 'CHB_BLIGHT',
      name: 'Resistencia a Tizón del Castaño',
      description: 'Cryphonectria parasitica',
      type: 'categorical',
      options: [
        { value: 'resistant', label: 'Resistente (Asiático/Híbrido)' },
        { value: 'susceptible', label: 'Susceptible (Americano puro)' }
      ],
      required: true
    },
    {
      id: 'CHB_PEELING',
      name: 'Facilidad para Pelar (Pellicle)',
      description: 'Película interna (episperma) adherida',
      type: 'categorical',
      options: [
        { value: 'easy', label: 'Fácil desprendimiento' },
        { value: 'hard', label: 'Muy adherida (Difícil consumo)' }
      ],
      required: true
    },
    {
      id: 'CHB_NUT_SIZE',
      name: 'Calibre de Castaña',
      description: 'Gramos por fruto',
      type: 'numeric',
      unit: 'g',
      min: 8,
      max: 35,
      required: true
    },
    {
      id: 'CHB_GALL_WASP',
      name: 'Tolerancia a Avispilla del Castaño',
      description: 'Dryocosmus kuriphilus',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'MACADAMIA': [
    {
      id: 'MAC_SPECIES',
      name: 'Especie Principal',
      description: 'Integrifolia (cáscara lisa) vs Tetraphylla (cáscara rugosa/más frío)',
      type: 'categorical',
      options: [
        { value: 'integrifolia', label: 'M. integrifolia (Lisa)' },
        { value: 'tetraphylla', label: 'M. tetraphylla (Rugosa)' }
      ],
      required: true
    },
    {
      id: 'MAC_KERNEL_RECOVERY',
      name: 'Rendimiento de Almendra Pelada (KR)',
      description: 'Porcentaje de nuez útil',
      type: 'numeric',
      unit: '%',
      min: 25,
      max: 45,
      required: true
    },
    {
      id: 'MAC_FIRST_GRADE',
      name: 'Almendras de Primera Calidad (Grade 1)',
      description: 'Alto contenido de aceite (>72%), flotan en agua',
      type: 'numeric',
      unit: '%',
      min: 70,
      max: 95,
      required: true
    },
    {
      id: 'MAC_DROP',
      name: 'Patrón de Caída',
      description: 'Caída natural temprana vs Retención en árbol',
      type: 'categorical',
      options: [
        { value: 'early_drop', label: 'Cae sola (Fácil recolección del suelo)' },
        { value: 'stick_tight', label: 'Retenida en árbol (Requiere vareo)' }
      ],
      required: true
    }
  ],
  'CASHEW': [
    {
      id: 'CSH_APPLE_COLOR',
      name: 'Color del Pseudofruto (Manzana)',
      description: 'Amarillo o Rojo',
      type: 'categorical',
      options: [
        { value: 'yellow', label: 'Amarillo' },
        { value: 'red', label: 'Rojo' }
      ],
      required: true
    },
    {
      id: 'CSH_NUT_WEIGHT',
      name: 'Peso de la Nuez Bruta',
      description: 'Gramos por nuez con cáscara',
      type: 'numeric',
      unit: 'g',
      min: 4,
      max: 12,
      required: true
    },
    {
      id: 'CSH_KERNEL_YIELD',
      name: 'Rendimiento de Almendra Pelada',
      description: 'Proporción útil',
      type: 'numeric',
      unit: '%',
      min: 20,
      max: 32,
      required: true
    },
    {
      id: 'CSH_CNSL',
      name: 'Contenido de Líquido de la Cáscara (CNSL)',
      description: 'Cashew Nut Shell Liquid, subproducto industrial corrosivo',
      type: 'numeric',
      unit: '%',
      min: 15,
      max: 30,
      required: true
    }
  ],
};
