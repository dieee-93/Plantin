import type { TraitDefinition } from '../types';

export const TUBERS_PSEUDOCEREALS_ONTOLOGY: Record<string, TraitDefinition[]> = {
  'SWEET_POTATO': [
    {
      id: 'SWP_FLESH_COLOR',
      name: 'Color de Pulpa',
      description: 'Blanca (seca/almidonosa) vs Naranja (húmeda/betacaroteno) vs Morada (antocianinas)',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Blanca / Amarilla' },
        { value: 'orange', label: 'Naranja' },
        { value: 'purple', label: 'Morada' }
      ],
      required: true
    },
    {
      id: 'SWP_WEEVIL',
      name: 'Resistencia a Picudo (Cylas formicarius)',
      description: 'Plaga devastadora del tubérculo',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Muy Susceptible' }
      ],
      required: true
    },
    {
      id: 'SWP_YIELD',
      name: 'Rendimiento de Raíces Comerciales',
      description: 't/ha',
      type: 'numeric',
      unit: 't/ha',
      min: 15,
      max: 60,
      required: true
    },
    {
      id: 'SWP_SHAPE',
      name: 'Forma del Tubérculo',
      description: 'Redondo, elíptico, alargado',
      type: 'categorical',
      options: [
        { value: 'blocky', label: 'Redondo / Bloque' },
        { value: 'long', label: 'Alargado' }
      ],
      required: true
    }
  ],
  'CASSAVA': [
    {
      id: 'CAS_CYANIDE',
      name: 'Contenido de Cianuro (HCN)',
      description: 'Yuca dulce (<50mg/kg) vs Yuca amarga (industrial)',
      type: 'categorical',
      options: [
        { value: 'sweet', label: 'Dulce (Bajo HCN, consumo directo)' },
        { value: 'bitter', label: 'Amarga (Alto HCN, industria/almidón)' }
      ],
      required: true
    },
    {
      id: 'CAS_STARCH',
      name: 'Contenido de Almidón',
      description: 'Porcentaje en peso fresco',
      type: 'numeric',
      unit: '%',
      min: 20,
      max: 35,
      required: true
    },
    {
      id: 'CAS_CMD',
      name: 'Resistencia a Virus CMD',
      description: 'Cassava Mosaic Disease',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'CAS_PPD',
      name: 'Deterioro Fisiológico Postcosecha (PPD)',
      description: 'Días hasta que la raíz se oxida y pudre',
      type: 'numeric',
      unit: 'días',
      min: 2,
      max: 10,
      required: true
    }
  ],
  'TARO': [
    {
      id: 'TAR_TYPE',
      name: 'Tipo de Cormo',
      description: 'Dasheen (Un cormo gigante) vs Eddoe (Muchos cormelos pequeños)',
      type: 'categorical',
      options: [
        { value: 'dasheen', label: 'Dasheen (Cormo principal grande)' },
        { value: 'eddoe', label: 'Eddoe (Cormelos laterales)' }
      ],
      required: true
    },
    {
      id: 'TAR_OXALATE',
      name: 'Contenido de Oxalato de Calcio',
      description: 'Causa picor en garganta si no se cocina bien (Acridity)',
      type: 'categorical',
      options: [
        { value: 'low', label: 'Bajo (Poco picor)' },
        { value: 'high', label: 'Alto (Acrid)' }
      ],
      required: true
    },
    {
      id: 'TAR_BLIGHT',
      name: 'Resistencia a Tizón Foliar (Phytophthora colocasiae)',
      description: 'Enfermedad devastadora',
      type: 'categorical',
      options: [
        { value: 1, label: 'Resistente' },
        { value: 9, label: 'Altamente Susceptible' }
      ],
      required: true
    },
    {
      id: 'TAR_WATER',
      name: 'Tolerancia a Inundación',
      description: 'Taro de secano vs Taro de agua (paddies)',
      type: 'categorical',
      options: [
        { value: 'aquatic', label: 'Cultivo Acuático (Paddy)' },
        { value: 'upland', label: 'Secano (Upland)' }
      ],
      required: true
    }
  ],
  'YAM': [
    {
      id: 'YAM_SPECIES',
      name: 'Especie (Dioscorea)',
      description: 'Ñame Blanco, Amarillo, Agua o Púrpura',
      type: 'categorical',
      options: [
        { value: 'rotundata', label: 'Blanco (D. rotundata)' },
        { value: 'alata', label: 'De Agua / Púrpura (D. alata)' }
      ],
      required: true
    },
    {
      id: 'YAM_TUBER_SHAPE',
      name: 'Forma del Tubérculo',
      description: 'Cilíndrico regular vs Irregular/Digitado',
      type: 'categorical',
      options: [
        { value: 'regular', label: 'Cilíndrico/Regular (Fácil cosecha)' },
        { value: 'irregular', label: 'Irregular/Ramificado' }
      ],
      required: true
    },
    {
      id: 'YAM_NEMATODE',
      name: 'Resistencia a Nematodos (Scutellonema / Meloidogyne)',
      description: 'Causa pudrición seca del tubérculo',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    },
    {
      id: 'YAM_DORMANCY',
      name: 'Período de Latencia (Dormancy)',
      description: 'Meses que dura el tubérculo sin brotar en almacén',
      type: 'numeric',
      unit: 'meses',
      min: 1,
      max: 6,
      required: true
    }
  ],
  'AMARANTH': [
    {
      id: 'AMR_USAGE',
      name: 'Tipo de Uso',
      description: 'Grano (Pseudocereal) vs Hoja (Verdura Tropical)',
      type: 'categorical',
      options: [
        { value: 'grain', label: 'Grano (A. cruentus, hypochondriacus)' },
        { value: 'leaf', label: 'Hoja / Verdura (A. tricolor)' }
      ],
      required: true
    },
    {
      id: 'AMR_SEED_COLOR',
      name: 'Color del Grano',
      description: 'Grano blanco/dorado es comercial; negro es maleza o no poppeable',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Blanco / Dorado' },
        { value: 'black', label: 'Negro' }
      ],
      required: true
    },
    {
      id: 'AMR_POPPING',
      name: 'Capacidad de Reventado (Popping)',
      description: 'Aumento de volumen al tostar (clave para dulces como Alegría)',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Excelente (Revienta grande)' },
        { value: 'low', label: 'Pobre / Grano duro' }
      ],
      required: true
    },
    {
      id: 'AMR_LODGING',
      name: 'Resistencia al Vuelco',
      description: 'Panojas pesadas doblan el tallo',
      type: 'categorical',
      options: [
        { value: 1, label: 'Muy Fuerte (No vuelca)' },
        { value: 9, label: 'Débil (Vuelca fácilmente)' }
      ],
      required: true
    }
  ],
  'BUCKWHEAT': [
    {
      id: 'BCK_SPECIES',
      name: 'Especie',
      description: 'Común (Fagopyrum esculentum) vs Tártaro (F. tataricum, alto en rutina)',
      type: 'categorical',
      options: [
        { value: 'common', label: 'Común (Dulce/Fresco)' },
        { value: 'tartary', label: 'Tártaro (Amargo/Medicinal)' }
      ],
      required: true
    },
    {
      id: 'BCK_RUTIN',
      name: 'Contenido de Rutina',
      description: 'Flavonoide (antioxidante/capilar)',
      type: 'numeric',
      unit: 'mg/100g',
      min: 10,
      max: 1500,
      required: true
    },
    {
      id: 'BCK_MATURITY',
      name: 'Días a Cosecha (Precocidad)',
      description: 'Cultivo de cobertura ultrarrápido',
      type: 'numeric',
      unit: 'días',
      min: 70,
      max: 100,
      required: true
    },
    {
      id: 'BCK_SHATTERING',
      name: 'Desgrane (Shattering)',
      description: 'Maduración despareja causa pérdida de grano',
      type: 'categorical',
      options: [
        { value: 1, label: 'Retiene el grano' },
        { value: 9, label: 'Desgrane severo' }
      ],
      required: true
    }
  ],
  'CHIA': [
    {
      id: 'CHI_PHOTOPERIOD',
      name: 'Sensibilidad al Fotoperíodo',
      description: 'Chía tradicional no florece con días largos, requiere tipos mutantes para latitudes altas',
      type: 'categorical',
      options: [
        { value: 'short_day', label: 'Día Corto (Solo latitudes bajas)' },
        { value: 'day_neutral', label: 'Día Neutro (Adaptada a zonas templadas)' }
      ],
      required: true
    },
    {
      id: 'CHI_SEED_COLOR',
      name: 'Color de Semilla',
      description: 'Pinta (gris/negra) vs Blanca pura',
      type: 'categorical',
      options: [
        { value: 'mixed', label: 'Pinta / Oscura' },
        { value: 'white', label: 'Blanca' }
      ],
      required: true
    },
    {
      id: 'CHI_OMEGA3',
      name: 'Contenido de Omega-3 (ALA)',
      description: 'Ácido alfa-linolénico en el aceite',
      type: 'numeric',
      unit: '%',
      min: 55,
      max: 68,
      required: true
    },
    {
      id: 'CHI_MUCILAGE',
      name: 'Producción de Mucílago',
      description: 'Capacidad de hidratación / gelificación',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alta (Gelifica rápido)' },
        { value: 'low', label: 'Baja' }
      ],
      required: true
    }
  ],
};
