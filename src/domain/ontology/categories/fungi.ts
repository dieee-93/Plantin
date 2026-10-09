import type { TraitDefinition } from '../types';

export const FUNGI_ONTOLOGY: Record<string, TraitDefinition[]> = {
  'BUTTON_MUSHROOM': [
    {
      id: 'BUT_CAP_COLOR',
      name: 'Color del Sombrero',
      description: 'Blanco (Champiñón París) vs Marrón (Cremini / Portobello)',
      type: 'categorical',
      options: [
        { value: 'white', label: 'Blanco Puro' },
        { value: 'brown', label: 'Marrón (Portobello/Cremini)' }
      ],
      required: true
    },
    {
      id: 'BUT_FLUSHING',
      name: 'Patrón de Oleadas (Flushes)',
      description: 'Distribución de cosecha en el compost',
      type: 'categorical',
      options: [
        { value: 'concentrated', label: 'Concentrado (Pocos flushes intensos)' },
        { value: 'spread', label: 'Espaciado' }
      ],
      required: true
    },
    {
      id: 'BUT_BRUISING',
      name: 'Susceptibilidad al Manchado (Bruising)',
      description: 'Se mancha con la manipulación mecánica',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alta (Cosecha manual estricta)' },
        { value: 'low', label: 'Baja (Resistente)' }
      ],
      required: true
    },
    {
      id: 'BUT_TRICHODERMA',
      name: 'Resistencia a Moho Verde (Trichoderma)',
      description: 'Contaminante principal de las camas de cultivo',
      type: 'categorical',
      options: [
        { value: 1, label: 'Tolerante' },
        { value: 9, label: 'Susceptible' }
      ],
      required: true
    }
  ],
  'SHIITAKE': [
    {
      id: 'SHI_TEMP_FRUITING',
      name: 'Temperatura de Fructificación',
      description: 'Cepas de frío vs cálidas',
      type: 'categorical',
      options: [
        { value: 'cold', label: 'Frío (10-15°C) - Donggu (Gruesos)' },
        { value: 'warm', label: 'Cálido (15-25°C)' },
        { value: 'wide', label: 'Rango Amplio' }
      ],
      required: true
    },
    {
      id: 'SHI_CAP_CRACKING',
      name: 'Agrietamiento del Sombrero (Flower mushroom)',
      description: 'El patrón agrietado blanco (Huagu/Donko) tiene precio premium',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Forma grietas fácilmente con humedad baja' },
        { value: 'low', label: 'Sombrero liso oscuro' }
      ],
      required: true
    },
    {
      id: 'SHI_WOOD_TYPE',
      name: 'Sustrato de Cultivo Ideal',
      description: 'Troncos naturales vs Bloques de aserrín',
      type: 'categorical',
      options: [
        { value: 'log', label: 'Tronco de roble/encina (Lento)' },
        { value: 'sawdust', label: 'Bloque aserrín (Rápido)' }
      ],
      required: true
    },
    {
      id: 'SHI_THICKNESS',
      name: 'Grosor de la Carne',
      description: 'Milímetros de sombrero',
      type: 'numeric',
      unit: 'mm',
      min: 5,
      max: 20,
      required: true
    }
  ],
  'OYSTER_MUSHROOM': [
    {
      id: 'OYS_SPECIES_COLOR',
      name: 'Especie / Color',
      description: 'P. ostreatus (Gris/Blanco), P. djamor (Rosa), P. citrinopileatus (Amarillo), P. eryngii (Eryngii/Rey)',
      type: 'categorical',
      options: [
        { value: 'grey', label: 'Gris/Marrón Oscuro (Ostreatus - Frío)' },
        { value: 'pink', label: 'Rosa (Tropical)' },
        { value: 'yellow', label: 'Amarillo (Tropical)' },
        { value: 'king', label: 'Rey / Eryngii (Tallo grueso)' }
      ],
      required: true
    },
    {
      id: 'OYS_SPORE_LOAD',
      name: 'Producción de Esporas',
      description: 'Altas esporas causan alergias respiratorias a los trabajadores',
      type: 'categorical',
      options: [
        { value: 'high', label: 'Alta (Normal)' },
        { value: 'low', label: 'Baja o Sporeless (Mutantes)' }
      ],
      required: true
    },
    {
      id: 'OYS_SUBSTRATE_FLEX',
      name: 'Flexibilidad de Sustrato',
      description: 'Capacidad de crecer en paja, café, cartón, aserrín',
      type: 'categorical',
      options: [
        { value: 'very_high', label: 'Extrema (Crece en casi cualquier celulosa)' },
        { value: 'moderate', label: 'Requiere sustratos enriquecidos' }
      ],
      required: true
    },
    {
      id: 'OYS_CO2_TOLERANCE',
      name: 'Tolerancia al CO2',
      description: 'Mucho CO2 deforma el hongo (tallo largo, sombrero enano)',
      type: 'categorical',
      options: [
        { value: 'low', label: 'Sensible (Requiere alta ventilación)' },
        { value: 'high', label: 'Tolerante' }
      ],
      required: true
    }
  ],
};
