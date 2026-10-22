import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAgroSuitability } from '../useAgroSuitability'
import { useAgroClimateStore } from '@/store/agroClimateStore'
import { BUENOS_AIRES, TOMATO } from '@/domain/agroclimate/__tests__/fixtures'

describe('useAgroSuitability', () => {
  beforeEach(() => {
    useAgroClimateStore.setState({
      farmCoordinates: { latitude: -34.6, longitude: -58.4 },
      currentClimate: BUENOS_AIRES,
      isLoadingClimate: false,
      climateError: undefined,
    })
  })

  it('calcula la aptitud si hay clima y datos agronómicos', () => {
    const { result } = renderHook(() => useAgroSuitability(TOMATO))

    expect(result.current.assessment).toBeDefined()
    expect(result.current.assessment?.suitability).toBe('optimal')
    expect(result.current.assessment?.sowingWindow?.optimalMonths).toEqual(
      expect.arrayContaining([10, 11, 12]),
    )
  })

  it('devuelve undefined si no hay clima cargado', () => {
    useAgroClimateStore.setState({ currentClimate: undefined })
    const { result } = renderHook(() => useAgroSuitability(TOMATO))

    expect(result.current.assessment).toBeUndefined()
    expect(result.current.hasClimate).toBe(false)
  })

  it('devuelve assessment con insufficient_data si el taxón no tiene datos', () => {
    const { result } = renderHook(() => useAgroSuitability(undefined))

    expect(result.current.assessment?.suitability).toBe('insufficient_data')
  })
})
