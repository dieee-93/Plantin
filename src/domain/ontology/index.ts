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
export * from './cropResolver';

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

export const CROP_ALIASES: Record<string, string> = {
  'POT': 'POT_TABLE',
  'POTATO': 'POT_TABLE',
  'SOY': 'SOY_SHORT',
  'SOYBEAN': 'SOY_SHORT',
  'RIC': 'RIC_INDICA',
  'RICE': 'RIC_INDICA',
  'BAR': 'BAR_MALT',
  'BARLEY': 'BAR_MALT',
  'BEA': 'BEA_DRY',
  'BEAN': 'BEA_DRY',
  'PEA': 'PEA_DRY',
  'SUN': 'SUN_OIL',
  'SUNFLOWER': 'SUN_OIL',
  'ONI': 'ONION',
  'GAR': 'GARLIC',
  'CAR': 'CARROT',
  'LET': 'LETTUCE',
  'CAB': 'CABBAGE',
  'EGG': 'EGGPLANT',
  'CUC': 'CUCUMBER',
  'MEL': 'MELON',
  'WAT': 'WATERMELON',
  'RAD': 'RADISH',
  'CEL': 'CELERY',
  'ART': 'ARTICHOKE',
  'PEP': 'PEPPER_SWEET',
  'CHILI': 'PEPPER_HOT',
  'TOMATO': 'TOM',
  'CORN': 'MAI',
  'MAIZE': 'MAI',
  'WHEAT': 'WHT',
  'ALFALFA': 'ALF',
  'CLOVER': 'CLO',
  'OATS': 'OAT',
  'CANNABIS': 'HEMP',
  'CAN_SAT': 'HEMP',
  'HEM': 'HEMP',
  'COF': 'COFFEE',
  'CAC': 'CACAO',
  'TOB': 'TOBACCO',
  'COTTON': 'COT',
  'TEA': 'TEA',
  'MATE': 'YERBA_MATE',
  'AVO': 'AVOCADO',
  'BAN': 'BANANA',
  'MAN': 'MANGO',
  'PIN': 'PINEAPPLE',
  'OLI': 'OLIVE',
  'HOP': 'HOPS',
  'SUG': 'SUG_CANE',
  'SUGARCANE': 'SUG_CANE',
};

// Funciones de utilidad para el motor
export function getTraitsForCrop(cropCode: string): TraitDefinition[] {
  const upper = cropCode.toUpperCase()
  if (CROP_ONTOLOGY[upper]) {
    return CROP_ONTOLOGY[upper]
  }
  const alias = CROP_ALIASES[upper]
  if (alias && CROP_ONTOLOGY[alias]) {
    return CROP_ONTOLOGY[alias]
  }
  return []
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

