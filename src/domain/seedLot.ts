import { uuidv7 } from 'uuidv7'

export type SeedLotStatus = 'active' | 'exhausted' | 'discarded'

export interface SeedLot {
  id: string
  accessionId: string
  /** Ej: "PLT-2024-001-L1" */
  lotCode: string
  /** Fecha de cosecha de la semilla — ISO 8601 */
  harvestDate?: string
  /** Planta madre que produjo este lote */
  harvestIndividualId?: string
  /** Cantidad inicial de semillas */
  initialCount?: number
  /** Stock actual (se descuenta al registrar siembras) */
  currentCount?: number
  /** Porcentaje de humedad al almacenar — FAO/IPGRI */
  moistureContent?: number
  /** ID Estructural de la locación (FacilityLocation) */
  locationId?: string
  /** Descripción del lugar físico o sub-ubicación (Ej: "Heladera A / Cajón 3") */
  storageLocation?: string
  /** °C de almacenaje */
  storageTemperature?: number
  /** Fecha del último test de viabilidad */
  lastGerminationTest?: string
  /** Porcentaje de germinación (0–100) */
  germinationRate?: number
  status: SeedLotStatus
}

export type CreateSeedLotInput = Omit<SeedLot, 'id' | 'status' | 'currentCount'> & {
  status?: SeedLotStatus
}

export function createSeedLot(input: CreateSeedLotInput): SeedLot {
  if (!input.lotCode.trim()) throw new Error("Lot code is required")
  if (!input.accessionId) throw new Error("Accession ID is required")
    
  return {
    ...input,
    id: uuidv7(),
    currentCount: input.initialCount,
    status: input.status || 'active',
  }
}
