export type TraitType = 'numeric' | 'categorical' | 'boolean' | 'color' | 'text'

export interface TraitOption {
  value: string | number
  label: string
}

export interface TraitDefinition {
  id: string
  name: string
  description?: string
  type: TraitType
  unit?: string // ej. '%', 'cm', 'kg'
  min?: number // Para tipo 'numeric'
  max?: number // Para tipo 'numeric'
  options?: TraitOption[] // Para tipo 'categorical'
  required?: boolean
}

// Diccionario principal (Crop Ontology) indexado por Crop Code (ej. 'TOM', 'WHT')
