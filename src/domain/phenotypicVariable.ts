/**
 * PhenotypicVariable — Variable de observación (Crop Ontology)
 * Modelo canónico: Variable = Trait × Method × Scale
 * Permite crear un vocabulario de observaciones reutilizable,
 * eventualmente compatible con Crop Ontology IDs reales.
 */

export type TraitClass =
  | 'morphological'
  | 'agronomical'
  | 'phenological'
  | 'abiotic_tolerance'
  | 'biotic_tolerance'
  | 'quality'

export type MethodType =
  | 'measurement'
  | 'counting'
  | 'estimation'
  | 'scoring'
  | 'extraction'

export type ScaleType = 'numerical' | 'ordinal' | 'nominal' | 'date' | 'text'

export interface ScaleCategory {
  value: string  // código interno. Ej: "1", "2", "3"
  label: string  // etiqueta. Ej: "Bajo", "Medio", "Alto"
}

export interface PhenotypicVariable {
  id: string
  name: string            // Nombre completo. Ej: "Plant Height"
  traitName: string       // Ej: "Plant height"
  traitClass: TraitClass
  methodName: string      // Ej: "Measurement with ruler"
  methodType: MethodType
  scaleName: string       // Ej: "cm"
  scaleType: ScaleType
  /** Solo para ordinal/nominal */
  scaleCategories?: ScaleCategory[]
  /** Solo para numerical */
  scaleMinimum?: number
  /** Solo para numerical */
  scaleMaximum?: number
  /** ID externo para interoperabilidad. Ej: "CO_322:0000394" */
  cropOntologyId?: string
  /** Códigos de cultivo permitidos. Ej: ["TOM", "PEP"]. Si está vacío, aplica a todos. */
  allowedCropCodes?: string[]
}
