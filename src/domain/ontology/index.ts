import type { TraitDefinition } from './types';
import { CEREALS_ONTOLOGY } from './categories/cereals';
import { LEGUMES_ONTOLOGY } from './categories/legumes';
import { OILSEEDS_ONTOLOGY } from './categories/oilseeds';
import { FORAGES_ONTOLOGY } from './categories/forages';
import { VEGETABLES_ONTOLOGY } from './categories/vegetables';
import { FRUITS_TREES_ONTOLOGY } from './categories/fruits_trees';
import { NUTS_ONTOLOGY } from './categories/nuts';
import { BERRIES_ONTOLOGY } from './categories/berries';
import { CITRUS_PALMS_ONTOLOGY } from './categories/citrus_palms';
import { SPICES_ONTOLOGY } from './categories/spices';
import { MEDICINAL_INDUSTRIAL_ONTOLOGY } from './categories/medicinal_industrial';
import { TUBERS_PSEUDOCEREALS_ONTOLOGY } from './categories/tubers_pseudocereals';
import { FUNGI_ONTOLOGY } from './categories/fungi';
import { FORESTRY_ONTOLOGY } from './categories/forestry';
import { ALGAE_ONTOLOGY } from './categories/algae';
import { ORNAMENTALS_ONTOLOGY } from './categories/ornamentals';
import { OTHERS_ONTOLOGY } from './categories/others';

export * from './types';

export const CROP_ONTOLOGY: Record<string, TraitDefinition[]> = {
  ...CEREALS_ONTOLOGY,
  ...LEGUMES_ONTOLOGY,
  ...OILSEEDS_ONTOLOGY,
  ...FORAGES_ONTOLOGY,
  ...VEGETABLES_ONTOLOGY,
  ...FRUITS_TREES_ONTOLOGY,
  ...NUTS_ONTOLOGY,
  ...BERRIES_ONTOLOGY,
  ...CITRUS_PALMS_ONTOLOGY,
  ...SPICES_ONTOLOGY,
  ...MEDICINAL_INDUSTRIAL_ONTOLOGY,
  ...TUBERS_PSEUDOCEREALS_ONTOLOGY,
  ...FUNGI_ONTOLOGY,
  ...FORESTRY_ONTOLOGY,
  ...ALGAE_ONTOLOGY,
  ...ORNAMENTALS_ONTOLOGY,
  ...OTHERS_ONTOLOGY,
};

// Funciones de utilidad para el motor
export function getTraitsForCrop(cropCode: string): TraitDefinition[] {
  return CROP_ONTOLOGY[cropCode.toUpperCase()] || []
}

export function validateTraitValue(trait: TraitDefinition, value: any): { valid: boolean; error?: string } {
  if (value === undefined || value === null || value === '') {
    return trait.required 
      ? { valid: false, error: `El campo ${trait.name} es obligatorio.` } 
      : { valid: true }
  }

  if (trait.type === 'numeric') {
    const numValue = Number(value)
    if (isNaN(numValue)) return { valid: false, error: 'Debe ser un número válido.' }
    if (trait.min !== undefined && numValue < trait.min) return { valid: false, error: `El valor mínimo es ${trait.min}.` }
    if (trait.max !== undefined && numValue > trait.max) return { valid: false, error: `El valor máximo es ${trait.max}.` }
  }

  if (trait.type === 'categorical' && trait.options) {
    const isValidOption = trait.options.some(opt => opt.value === value || opt.value === Number(value))
    if (!isValidOption) return { valid: false, error: 'La opción seleccionada no es válida.' }
  }

  if (trait.type === 'boolean') {
    if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
      return { valid: false, error: 'Debe ser Verdadero o Falso.' }
    }
  }

  return { valid: true }
}

