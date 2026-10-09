import type { TraitDefinition } from '../types';

export const OILSEEDS_ONTOLOGY: Record<string, TraitDefinition[]> = {
  'FLAX': [
    {
      id: 'FLA_TYPE',
      name: 'Uso Principal',
      description: 'Linaza (Aceite/Semilla) o Lino Textil (Fibra)',
      type: 'categorical',
      options: [
        { value: 'oil', label: 'Aceitero (Linaza)' },
        { value: 'fiber', label: 'Fibra (Textil)' }
      ],
      required: true
    },
    {
      id: 'FLA_OIL_CONTENT',
      name: 'Contenido de Aceite',
      description: 'Rendimiento industrial',
      type: 'numeric',
      unit: '%',
      min: 35,
      max: 50,
      required: true
    },
    {
      id: 'FLA_ALA',
      name: 'Contenido de Ácido Alfa-Linolénico (ALA)',
      description: 'Calidad del aceite (Omega-3)',
      type: 'numeric',
      unit: '%',
      min: 40,
      max: 65,
      required: true
    },
    {
      id: 'FLA_PLANT_HEIGHT',
      name: 'Altura de Planta',
      description: 'Las variedades de fibra son mucho más altas (hasta 120cm)',
      type: 'numeric',
      unit: 'cm',
      min: 40,
      max: 130,
      required: true
    }
  ],
  'SAFFLOWER': [
    {
      id: 'SAF_FLOWER_COLOR',
      name: 'Color de Flor',
      description: 'Importante para uso como colorante/tintura',
      type: 'categorical',
      options: [
        { value: 'yellow', label: 'Amarillo' },
        { value: 'orange', label: 'Naranja' },
        { value: 'red', label: 'Rojo' },
        { value: 'white', label: 'Blanco' }
      ],
      required: true
    },
    {
      id: 'SAF_OIL_TYPE',
      name: 'Perfil de Ácidos Grasos',
      description: 'Alto Oleico vs Alto Linoleico',
      type: 'categorical',
      options: [
        { value: 'oleic', label: 'Alto Oleico (Monoinstaurado)' },
        { value: 'linoleic', label: 'Alto Linoleico (Poliinsaturado)' }
      ],
      required: true
    },
    {
      id: 'SAF_SPININESS',
      name: 'Grado de Espinosidad',
      description: 'Hojas y brácteas (las variedades sin espinas rinden algo menos)',
      type: 'categorical',
      options: [
        { value: 'none', label: 'Sin Espinas' },
        { value: 'intermediate', label: 'Intermedio' },
        { value: 'spiny', label: 'Muy Espinoso' }
      ],
      required: true
    },
    {
      id: 'SAF_ALTERNARIA',
      name: 'Resistencia a Alternaria',
      description: 'Enfermedad foliar prevalente',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'CASTOR': [
    {
      id: 'CST_RICIN',
      name: 'Contenido de Ricina',
      description: 'Toxina letal presente en la semilla (algunas líneas mutantes son bajas)',
      type: 'numeric',
      unit: 'mg/g',
      min: 0,
      max: 15,
      required: true
    },
    {
      id: 'CST_OIL_CONTENT',
      name: 'Contenido de Aceite',
      description: 'Alto valor en ácido ricinoleico (industria química y lubricantes)',
      type: 'numeric',
      unit: '%',
      min: 40,
      max: 60,
      required: true
    },
    {
      id: 'CST_ARCHITECTURE',
      name: 'Arquitectura',
      description: 'Enana/Anual (mecanizable) vs Árbol/Perenne',
      type: 'categorical',
      options: [
        { value: 'dwarf', label: 'Enano (Anual Mecanizable)' },
        { value: 'tall', label: 'Alto / Arbustivo' }
      ],
      required: true
    },
    {
      id: 'CST_DEHISCENCE',
      name: 'Dehiscencia de Cápsula',
      description: 'Pérdida de semilla en cosecha mecánica',
      type: 'categorical',
      options: [
        { value: 'indehiscent', label: 'Indehiscente (Retiene semilla)' },
        { value: 'dehiscent', label: 'Dehiscente (Shattering)' }
      ],
      required: true
    }
  ],
  'SESAME': [
    {
      id: 'SES_SHATTERING',
      name: 'Resistencia a Dehiscencia (Shattering)',
      description: 'El gen indehiscente es clave para cosecha mecánica',
      type: 'categorical',
      options: [
        { value: 'shattering', label: 'Dehiscente (Cosecha manual)' },
        { value: 'non_shattering', label: 'Indehiscente (Mecánica)' }
      ],
      required: true
    },
    {
      id: 'SES_SEED_COLOR',
      name: 'Color de Semilla',
      description: 'Blanco (mayor valor confitería), Dorado, Negro (Asia)',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Blanco / Perla' },
        { value: 'brown', label: 'Dorado / Marrón' },
        { value: 'black', label: 'Negro' }
      ],
      required: true
    },
    {
      id: 'SES_OIL',
      name: 'Contenido de Aceite',
      description: 'Rendimiento industrial',
      type: 'numeric',
      unit: '%',
      min: 40,
      max: 60,
      required: true
    },
    {
      id: 'SES_BRANCHING',
      name: 'Hábito de Ramificación',
      description: 'Monocaule (un tallo) vs Ramificado',
      type: 'categorical',
      options: [
        { value: 'unbranched', label: 'Sin ramas (Alta densidad)' },
        { value: 'branched', label: 'Ramificado' }
      ],
      required: true
    }
  ],
  'MUSTARD': [
    {
      id: 'MUS_GLUCOSINOLATE',
      name: 'Nivel de Glucosinolatos',
      description: 'Picor de la semilla (Allyl isothiocyanate)',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alto (Condimento Picante)' },
        { value: 'low', label: 'Bajo (Tipo Canola / Aceite dulce)' }
      ],
      required: true
    },
    {
      id: 'MUS_ERUCIC',
      name: 'Ácido Erúcico',
      description: 'Tóxico alimentario, útil para biopolímeros',
      type: 'numeric',
      unit: '%',
      min: 0,
      max: 50,
      required: true
    },
    {
      id: 'MUS_POD_SHATTER',
      name: 'Resistencia a Apertura de Silicua',
      description: 'Pérdida al viento antes de cosecha',
      type: 'categorical',
      options: [
        { value: 1, label: 'Muy Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'MUS_NEMATODE',
      name: 'Efecto Biofumigante',
      description: 'Uso como cultivo de servicio para suprimir nematodos',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alto Potencial Fumigante' },
        { value: 'low', label: 'Bajo' }
      ],
      required: true
    }
  ],
  'POPPY': [
    {
      id: 'POP_MORPHINE',
      name: 'Contenido de Morfina en Cápsula',
      description: 'Cultivos farmacéuticos requieren perfiles específicos',
      type: 'numeric',
      unit: '%',
      min: 0,
      max: 3,
      required: true
    },
    {
      id: 'POP_THEBAINE',
      name: 'Variedad mutante alta en Tebaína',
      description: 'Mutante top1 (thebaine, oripavine) sin morfina',
      type: 'categorical',
      options: [
        { value: 'morphine', label: 'Tipo Morfina/Codeína' },
        { value: 'thebaine', label: 'Tipo Tebaína (Norman)' }
      ],
      required: true
    },
    {
      id: 'POP_SEED_YIELD',
      name: 'Rendimiento de Semilla',
      description: 'Para uso culinario (bajas en alcaloides)',
      type: 'numeric',
      unit: 'kg/ha',
      min: 500,
      max: 2000,
      required: true
    },
    {
      id: 'POP_LODGING',
      name: 'Resistencia al Vuelco',
      description: 'Tallo floral pesado',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'TUNG': [
    {
      id: 'TUN_OIL_QUALITY',
      name: 'Contenido de Ácido Eleoesteárico',
      description: 'Ácido graso secante que da valor al aceite (barnices/pinturas)',
      type: 'numeric',
      unit: '%',
      min: 70,
      max: 85,
      required: true
    },
    {
      id: 'TUN_NUT_YIELD',
      name: 'Rendimiento de Nueces',
      description: 'Kg/árbol',
      type: 'numeric',
      unit: 'kg',
      min: 10,
      max: 50,
      required: true
    },
    {
      id: 'TUN_FROST',
      name: 'Resistencia a Heladas Tardías',
      description: 'Floración temprana suele ser dañada',
      type: 'categorical',
      options: [
        { value: 'late_flower', label: 'Floración Tardía (Escapa helada)' },
        { value: 'early_flower', label: 'Floración Temprana (Susceptible)' }
      ],
      required: true
    },
    {
      id: 'TUN_OIL_CONTENT',
      name: 'Contenido de Aceite en Semilla',
      description: 'Rendimiento industrial',
      type: 'numeric',
      unit: '%',
      min: 15,
      max: 30,
      required: true
    }
  ],
  'JOJOBA': [
    {
      id: 'JOJ_WAX',
      name: 'Contenido de Ésteres de Cera',
      description: 'El "aceite" de jojoba (cera líquida)',
      type: 'numeric',
      unit: '%',
      min: 40,
      max: 60,
      required: true
    },
    {
      id: 'JOJ_SEX_RATIO',
      name: 'Expresión Sexual',
      description: 'Cultivo dioico, se plantan machos y hembras',
      type: 'categorical',
      options: [
        { value: 'female', label: 'Hembra (Productiva)' },
        { value: 'male', label: 'Macho (Polinizador)' }
      ],
      required: true
    },
    {
      id: 'JOJ_SEED_YIELD',
      name: 'Rendimiento de Semilla',
      description: 'kg/planta o t/ha',
      type: 'numeric',
      unit: 't/ha',
      min: 1,
      max: 4,
      required: true
    },
    {
      id: 'JOJ_FROST',
      name: 'Tolerancia a Heladas Primaverales',
      description: 'Flores muy susceptibles a heladas',
      type: 'categorical',
      options: [
        { value: 1, label: 'Floración Tardía (Escapa)' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'CAMELINA': [
    {
      id: 'CAM_OIL',
      name: 'Contenido de Aceite',
      description: 'Semilla oleaginosa para biocombustible/alimentación',
      type: 'numeric',
      unit: '%',
      min: 30,
      max: 45,
      required: true
    },
    {
      id: 'CAM_OMEGA3',
      name: 'Contenido de Omega-3',
      description: 'Ácido alfa-linolénico (ALA)',
      type: 'numeric',
      unit: '%',
      min: 30,
      max: 40,
      required: true
    },
    {
      id: 'CAM_CYCLE',
      name: 'Días a Cosecha',
      description: 'Cultivo de ciclo ultra corto (60-100 días)',
      type: 'numeric',
      unit: 'días',
      min: 60,
      max: 110,
      required: true
    },
    {
      id: 'CAM_SHATTER',
      name: 'Resistencia a Dehiscencia',
      description: 'Pérdida en madurez',
      type: 'categorical',
      options: [
        { value: 1, label: 'Altamente Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
};
