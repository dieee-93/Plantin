import { useMemo, useEffect } from 'react'
import type { AgronomicData } from '@/domain/taxon'
import type { SuitabilityAssessment } from '@/domain/agroclimate/types'
import { assessCropSuitability } from '@/domain/agroclimate/suitabilityEngine'
import { useAgroClimateStore } from '@/store/agroClimateStore'

export function useAgroSuitability(agronomicData?: AgronomicData) {
  const {
    farmCoordinates,
    currentClimate,
    isLoadingClimate,
    climateError,
    setFarmCoordinates,
    loadClimateForCoordinates,
    detectBrowserLocation,
  } = useAgroClimateStore()

  // Si hay coordenadas guardadas pero aún no se cargó el clima en memoria (ej. al abrir la app)
  useEffect(() => {
    if (farmCoordinates && !currentClimate && !isLoadingClimate && !climateError) {
      loadClimateForCoordinates(farmCoordinates)
    }
  }, [farmCoordinates, currentClimate, isLoadingClimate, climateError, loadClimateForCoordinates])

  const assessment = useMemo<SuitabilityAssessment | undefined>(() => {
    if (!currentClimate) return undefined
    return assessCropSuitability(agronomicData, currentClimate)
  }, [agronomicData, currentClimate])

  return {
    assessment,
    climate: currentClimate,
    isLoadingClimate,
    climateError,
    farmCoordinates,
    hasClimate: Boolean(currentClimate),
    hasCoordinates: Boolean(farmCoordinates),
    setFarmCoordinates,
    detectBrowserLocation,
  }
}
