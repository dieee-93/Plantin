// Barrel export de todas las entidades del dominio
export type { Taxon } from './taxon'
export type { Accession, AcquisitionSource } from './accession'
export type { SeedLot, SeedLotStatus } from './seedLot'
export type {
  Individual,
  IndividualStatus,
  CrossType,
  BBCHStage,
} from './individual'
export type {
  PhenotypicVariable,
  TraitClass,
  MethodType,
  ScaleType,
  ScaleCategory,
} from './phenotypicVariable'
export type { Observation } from './observation'
export type {
  CrossingEvent,
  CrossEventType,
  CrossSuccessStatus,
} from './crossingEvent'
