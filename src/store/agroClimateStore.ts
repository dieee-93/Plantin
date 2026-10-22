import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ClimateProfile, CurrentWeather, GeoCoordinates } from '@/domain/agroclimate/types'
import { fetchClimateProfile, fetchCurrentWeather } from '@/services/climate/openMeteoClient'
import { getBrowserPosition } from '@/services/climate/geolocation'
import { reverseGeocode } from '@/services/climate/geocodingClient'

interface AgroClimateState {
  farmCoordinates?: GeoCoordinates
  currentClimate?: ClimateProfile
  currentWeather?: CurrentWeather
  isLoadingClimate: boolean
  climateError?: string

  setFarmCoordinates: (coords: GeoCoordinates | undefined) => void
  loadClimateForCoordinates: (coords: GeoCoordinates) => Promise<ClimateProfile | undefined>
  detectBrowserLocation: () => Promise<GeoCoordinates | undefined>
}

export const useAgroClimateStore = create<AgroClimateState>()(
  persist(
    (set, get) => ({
      farmCoordinates: undefined,
      currentClimate: undefined,
      currentWeather: undefined,
      isLoadingClimate: false,
      climateError: undefined,

      setFarmCoordinates: (coords) => {
        set({ farmCoordinates: coords, climateError: undefined })
        if (coords) {
          get().loadClimateForCoordinates(coords)
          // Si el usuario ingresó coordenadas sin nombre, resolvemos la ubicación aproximada en segundo plano
          if (!coords.name) {
            reverseGeocode(coords.latitude, coords.longitude).then((approxName) => {
              if (approxName) {
                const current = get().farmCoordinates
                if (
                  current &&
                  current.latitude === coords.latitude &&
                  current.longitude === coords.longitude &&
                  !current.name
                ) {
                  set({ farmCoordinates: { ...current, name: approxName } })
                }
              }
            })
          }
        } else {
          set({ currentClimate: undefined, currentWeather: undefined })
        }
      },

      loadClimateForCoordinates: async (coords) => {
        set({ isLoadingClimate: true, climateError: undefined })
        try {
          const [profile, weather] = await Promise.all([
            fetchClimateProfile(coords),
            fetchCurrentWeather(coords),
          ])
          set({
            currentClimate: profile,
            currentWeather: weather,
            isLoadingClimate: false,
          })
          return profile
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Error desconocido al cargar clima'
          set({ climateError: msg, isLoadingClimate: false })
          return undefined
        }
      },

      detectBrowserLocation: async () => {
        set({ isLoadingClimate: true, climateError: undefined })
        try {
          const rawCoords = await getBrowserPosition()
          const approxName = await reverseGeocode(rawCoords.latitude, rawCoords.longitude)
          const coords: GeoCoordinates = approxName
            ? { ...rawCoords, name: approxName }
            : rawCoords

          set({ farmCoordinates: coords })
          const [profile, weather] = await Promise.all([
            fetchClimateProfile(coords),
            fetchCurrentWeather(coords),
          ])
          set({
            currentClimate: profile,
            currentWeather: weather,
            isLoadingClimate: false,
          })
          return coords
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'No se pudo obtener la geolocalización'
          set({ climateError: msg, isLoadingClimate: false })
          throw error
        }
      },
    }),
    {
      name: 'plantin-agroclimate-storage',
      partialize: (state) => ({ farmCoordinates: state.farmCoordinates }),
    },
  ),
)
