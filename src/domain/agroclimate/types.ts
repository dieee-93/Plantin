/**
 * Dominio agroclimático — tipos compartidos por la capa de Clima,
 * el Motor de Aptitud y la UI.
 */

export interface GeoCoordinates {
  latitude: number      // -90 a 90
  longitude: number     // -180 a 180
  elevation?: number    // metros s.n.m.
  name?: string
}

export interface MonthlyClimate {
  month: number           // 1..12 (1 = enero)
  tempMean: number        // °C media mensual
  tempMin: number         // °C media de mínimas diarias
  tempMax: number         // °C media de máximas diarias
  tempAbsoluteMin: number // °C mínima absoluta del período histórico
  precipitation: number   // mm promedio mensual
  frostDays: number       // días promedio por año con Tmin <= 0 °C
}

export interface ClimateProfile {
  coordinates: GeoCoordinates
  hemisphere: 'north' | 'south'
  annualRainfall: number  // mm/año
  annualFrostDays: number
  monthly: MonthlyClimate[] // 12 meses, índice 0 = enero
  fetchedAt: string
}

/** Estado meteorológico en tiempo real (Open-Meteo Forecast API). */
export interface CurrentWeather {
  temperature: number         // °C actual a 2m
  apparentTemperature: number // °C sensación térmica
  humidity: number            // % humedad relativa
  windSpeed: number           // km/h viento a 10m
  precipitation: number       // mm actuales
  weatherCode: number         // Código WMO
  conditionLabel: string      // Descripción en español (ej. 'Cielo despejado')
  isDay: boolean
  fetchedAt: string
}

/** Serie diaria cruda (formato columnar, igual al de Open-Meteo `daily`). */
export interface DailyClimateSeries {
  time: string[]                         // 'YYYY-MM-DD'
  temperature_2m_max: (number | null)[]
  temperature_2m_min: (number | null)[]
  temperature_2m_mean: (number | null)[]
  precipitation_sum: (number | null)[]
}

/** Clasificación de aptitud de un taxón en una ubicación. */
export type SuitabilityClass =
  | 'optimal'           // clima dentro del rango óptimo a campo abierto
  | 'suitable'          // viable con protección (almácigo o invernadero)
  | 'marginal'          // cerca de los límites fisiológicos
  | 'not_suitable'      // no viable ni protegido (solo ambiente controlado)
  | 'insufficient_data' // faltan datos ecofisiológicos del taxón

export type RecommendedEnvironment =
  | 'outdoor'        // campo abierto, siembra directa
  | 'indoor_starts'  // almácigo protegido y trasplante a exterior
  | 'greenhouse'     // invernadero pasivo
  | 'indoor'         // solo ambiente controlado (cámara / interior)

/** Meses de siembra (1..12) según calidad de la ventana. */
export interface MonthWindow {
  optimalMonths: number[]
  marginalMonths: number[]
}

export interface SowingWindow extends MonthWindow {
  recommendedEnvironment: RecommendedEnvironment
  byEnvironment: Record<'outdoor' | 'indoor_starts' | 'greenhouse', MonthWindow>
  /** Duración del ciclo considerada, en meses (null si el taxón no informa ciclo). */
  cycleMonths: number | null
}

export type Confidence = 'high' | 'medium' | 'low' | 'insufficient_data'

export interface SuitabilityAssessment {
  suitability: SuitabilityClass
  score: number // 0..100; 0 si no hay datos
  confidence: Confidence
  sowingWindow?: SowingWindow
  limitingFactors: string[]
  positiveFactors: string[]
  thermalFit: { status: 'optimal' | 'marginal' | 'incompatible' | 'unknown'; message: string }
  frostRisk: { hasRisk: boolean; criticalMonths: number[] }
  waterFit: { status: 'sufficient' | 'deficit' | 'excess' | 'unknown'; message?: string }
  /** Fotoperíodo local (h de luz). El taxón no informa sensibilidad: solo se reporta el régimen del sitio. */
  daylight: { byMonth: number[]; minHours: number; maxHours: number }
}
