import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PhenotypicVariable } from '@/domain/phenotypicVariable'

export const INITIAL_VARIABLES: PhenotypicVariable[] = [
  // ================= GENERALES (Sin allowedCropCodes) =================
  {
    id: 'var-gen-height',
    name: 'Altura de Planta (cm)',
    traitName: 'Plant height',
    traitClass: 'morphological',
    methodName: 'Medición desde la base hasta el ápice',
    methodType: 'measurement',
    scaleName: 'Centímetros (cm)',
    scaleType: 'numerical',
    scaleMinimum: 0,
  },
  {
    id: 'var-gen-vigor',
    name: 'Vigor de la Planta (1-9)',
    traitName: 'Plant vigor',
    traitClass: 'agronomical',
    methodName: 'Evaluación visual',
    methodType: 'estimation',
    scaleName: 'Escala 1 a 9',
    scaleType: 'ordinal',
    scaleCategories: [
      { value: '1', label: 'Muy Pobre' },
      { value: '3', label: 'Pobre' },
      { value: '5', label: 'Intermedio' },
      { value: '7', label: 'Bueno' },
      { value: '9', label: 'Excelente' },
    ]
  },
  {
    id: 'var-gen-flowering',
    name: 'Fecha de Floración',
    traitName: 'Flowering date',
    traitClass: 'phenological',
    methodName: 'Registro 50% de flores abiertas',
    methodType: 'measurement',
    scaleName: 'Fecha',
    scaleType: 'date',
  },

  // ================= TOMATE (TOM) & PIMIENTO (PEP) =================
  {
    id: 'var-tom-brix',
    name: 'Contenido de Azúcar (Grados Brix)',
    traitName: 'Fruit sugar content',
    traitClass: 'quality',
    methodName: 'Refractometría',
    methodType: 'measurement',
    scaleName: '% Brix',
    scaleType: 'numerical',
    scaleMinimum: 0,
    scaleMaximum: 20,
    allowedCropCodes: ['TOM', 'PEP'],
    cropOntologyId: 'CO_322:0000109' // Código real de tomate para Brix
  },
  {
    id: 'var-tom-shape',
    name: 'Forma del Fruto',
    traitName: 'Fruit shape',
    traitClass: 'morphological',
    methodName: 'Evaluación visual de la silueta',
    methodType: 'estimation',
    scaleName: 'Categorías de forma',
    scaleType: 'nominal',
    allowedCropCodes: ['TOM', 'PEP', 'EGG'], // Solanáceas de fruto
    scaleCategories: [
      { value: 'round', label: 'Redondo' },
      { value: 'flat', label: 'Achatado (Flat)' },
      { value: 'pear', label: 'Pera' },
      { value: 'plum', label: 'Ciruela (Plum)' },
      { value: 'elongated', label: 'Alargado' },
    ]
  },
  {
    id: 'var-tom-habit',
    name: 'Hábito de Crecimiento',
    traitName: 'Plant growth habit',
    traitClass: 'morphological',
    methodName: 'Evaluación visual del desarrollo del tallo',
    methodType: 'estimation',
    scaleName: 'Tipos de hábito',
    scaleType: 'nominal',
    allowedCropCodes: ['TOM', 'PEP', 'EGG', 'BEA'], // Tomate, Pimiento, Berenjena, Poroto
    scaleCategories: [
      { value: 'determinate', label: 'Determinado (Arbustivo)' },
      { value: 'indeterminate', label: 'Indeterminado (Trepador)' },
      { value: 'semi-determinate', label: 'Semi-determinado' },
    ]
  },

  // ================= CEREALES: TRIGO (WHT), ARROZ (RIC), MAÍZ (MAI) =================
  {
    id: 'var-cer-tkw',
    name: 'Peso de Mil Granos (TKW)',
    traitName: 'Thousand kernel weight',
    traitClass: 'agronomical',
    methodName: 'Pesaje de 1000 semillas',
    methodType: 'measurement',
    scaleName: 'Gramos (g)',
    scaleType: 'numerical',
    scaleMinimum: 0,
    allowedCropCodes: ['WHT', 'RIC', 'MAI', 'SOY'], 
    cropOntologyId: 'CO_321:0000045'
  },
  {
    id: 'var-cer-rust',
    name: 'Resistencia a Roya (1-9)',
    traitName: 'Rust disease resistance',
    traitClass: 'biotic_tolerance',
    methodName: 'Severidad visual en hoja',
    methodType: 'scoring',
    scaleName: 'Escala de resistencia (1-9)',
    scaleType: 'ordinal',
    allowedCropCodes: ['WHT', 'MAI'], // Muy típico en trigo
    scaleCategories: [
      { value: '1', label: 'Altamente Susceptible (Infección grave)' },
      { value: '3', label: 'Susceptible' },
      { value: '5', label: 'Intermedio' },
      { value: '7', label: 'Resistente' },
      { value: '9', label: 'Altamente Resistente (Inmune)' },
    ]
  },
  {
    id: 'var-cer-spike',
    name: 'Longitud de Espiga / Panoja (cm)',
    traitName: 'Spike length',
    traitClass: 'morphological',
    methodName: 'Medición con regla',
    methodType: 'measurement',
    scaleName: 'Centímetros (cm)',
    scaleType: 'numerical',
    scaleMinimum: 0,
    allowedCropCodes: ['WHT', 'RIC'],
  },

  // ================= PAPA (POT) =================
  {
    id: 'var-pot-flesh',
    name: 'Color de Pulpa del Tubérculo',
    traitName: 'Tuber flesh color',
    traitClass: 'morphological',
    methodName: 'Corte transversal y evaluación visual',
    methodType: 'estimation',
    scaleName: 'Colores base',
    scaleType: 'nominal',
    allowedCropCodes: ['POT'],
    scaleCategories: [
      { value: 'white', label: 'Blanco' },
      { value: 'cream', label: 'Crema' },
      { value: 'yellow', label: 'Amarillo' },
      { value: 'red', label: 'Rojo / Rosado' },
      { value: 'purple', label: 'Morado' },
    ]
  }
]

interface PhenotypicVariableState {
  variables: PhenotypicVariable[]
  add: (variable: Omit<PhenotypicVariable, 'id'>) => PhenotypicVariable
  update: (id: string, patch: Partial<PhenotypicVariable>) => void
  remove: (id: string) => void
  getById: (id: string) => PhenotypicVariable | undefined
  getByCropCode: (cropCode?: string) => PhenotypicVariable[]
}

export const usePhenotypicVariableStore = create<PhenotypicVariableState>()(
  persist(
    (set, get) => ({
      variables: INITIAL_VARIABLES,
      add: (input) => {
        const newVar = { ...input, id: crypto.randomUUID() }
        set((state) => ({ variables: [...state.variables, newVar] }))
        return newVar
      },
      update: (id, patch) => {
        set((state) => ({
          variables: state.variables.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        }))
      },
      remove: (id) => {
        set((state) => ({
          variables: state.variables.filter((v) => v.id !== id),
        }))
      },
      getById: (id) => {
        return get().variables.find((v) => v.id === id)
      },
      getByCropCode: (cropCode) => {
        const all = get().variables
        if (!cropCode) return all // Retorna todas si no se especifica cropCode
        
        // Retorna las genéricas (sin cropCode asignado) y las específicas del cultivo
        return all.filter(v => !v.allowedCropCodes || v.allowedCropCodes.length === 0 || v.allowedCropCodes.includes(cropCode))
      }
    }),
    {
      name: 'plantin-variables-storage',
    }
  )
)
