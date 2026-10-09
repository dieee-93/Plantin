/**
 * Accession — Entrada genética trazable (MCPD v2.1)
 * Representa el material genético como concepto, no una planta física.
 * Una accesión puede generar múltiples SeedLots e Individuals.
 */

/** Origen del material — MCPD COLLSRC codificado */
export type AcquisitionSource =
  | 'wild'
  | 'cultivated'
  | 'market'
  | 'breeding'
  | 'research'
  | 'unknown'

export interface Accession {
  id: string
  /** Código único del banco. Ej: "PLT-2024-001" — MCPD ACCENUMB */
  accessionNumber: string
  taxonId: string
  cultivarName?: string
  /** Fecha de ingreso al banco — MCPD ACQDATE */
  acquisitionDate?: string   // ISO 8601: YYYY-MM-DD
  /** MCPD COLLSRC */
  acquisitionSource: AcquisitionSource
  /** País de origen — ISO 3166-1 alpha-3. Ej: "ARG" — MCPD ORIGCTY */
  originCountry?: string
  /** 
   * Pedigree / Genealogía
   * Ej: "Tomboy x Rutgers" o IDs de accesiones parentales
   */
  pedigree?: string
  maternalAccessionId?: string
  paternalAccessionId?: string
  /** Descripción del sitio de colecta — MCPD COLLSITE */
  originLocality?: string
  /** GPS del sitio de colecta — MCPD LATITUDE */
  originLatitude?: number
  /** GPS del sitio de colecta — MCPD LONGITUDE */
  originLongitude?: number
  /** Código del donante si vino de otro banco — MCPD DONORCODE */
  donorCode?: string
  /** ¿Bajo el Tratado Internacional de RFAA? — MCPD MLSSTAT */
  mlsStatus?: boolean
  remarks?: string
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export type CreateAccessionInput = Omit<Accession, 'id' | 'acquisitionSource'> &
  Partial<Pick<Accession, 'acquisitionSource'>>

/**
 * Crea una nueva Accession validada.
 * - Genera un id único (crypto.randomUUID).
 * - Aplica 'unknown' como acquisitionSource por defecto.
 * - Rechaza accessionNumber vacío o solo espacios.
 */
export function createAccession(input: CreateAccessionInput): Accession {
  if (!input.accessionNumber.trim()) {
    throw new Error('accessionNumber is required')
  }
  return {
    ...input,
    id: crypto.randomUUID(),
    acquisitionSource: input.acquisitionSource ?? 'unknown',
  }
}
