import type {
  ClimateProfile,
  MonthWindow,
  RecommendedEnvironment,
  SowingWindow,
  SuitabilityAssessment,
  SuitabilityClass,
} from './types'
import type { AgronomicData } from '@/domain/taxon'
import { daylightByMonth } from './photoperiod'

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export function assessCropSuitability(
  agronomicData: AgronomicData | undefined,
  climate: ClimateProfile,
): SuitabilityAssessment {
  const daylightArr = daylightByMonth(climate.coordinates.latitude)
  const daylight = {
    byMonth: daylightArr,
    minHours: Math.min(...daylightArr),
    maxHours: Math.max(...daylightArr),
  }

  // 1. Guardia de incertidumbre agronómica
  if (!agronomicData || (agronomicData.optTempMin == null && agronomicData.minTemp == null)) {
    return {
      suitability: 'insufficient_data',
      score: 0,
      confidence: 'insufficient_data',
      limitingFactors: ['Datos insuficientes para determinar aptitud'],
      positiveFactors: [],
      thermalFit: {
        status: 'unknown',
        message: 'No hay datos de requerimientos térmicos para este taxón',
      },
      frostRisk: { hasRisk: false, criticalMonths: [] },
      waterFit: { status: 'unknown' },
      daylight,
    }
  }

  const limitingFactors: string[] = []
  const positiveFactors: string[] = []

  // Confianza
  const hasUpperThermal = agronomicData.optTempMax != null || agronomicData.maxTemp != null
  const hasCycle = agronomicData.cycleDaysMin != null || agronomicData.cycleDaysMax != null
  if (!hasCycle) {
    limitingFactors.push('Ciclo de cultivo desconocido (se evalúa ventana mensual individual)')
  }
  if (!hasUpperThermal) {
    limitingFactors.push('Sin límite térmico superior documentado')
  }

  const confidence = (!hasUpperThermal || !hasCycle) ? 'low' : 'high'

  // Parámetros térmicos del cultivo
  const optMin = agronomicData.optTempMin ?? agronomicData.minTemp!
  const optMax = agronomicData.optTempMax ?? (agronomicData.maxTemp ?? optMin + 15)
  const minLimit = agronomicData.minTemp ?? optMin - 5
  const maxLimit = agronomicData.maxTemp ?? optMax + 10
  const killT = agronomicData.killTemp

  // Duración del ciclo en meses
  let cycleMonths: number | null = null
  if (hasCycle) {
    const avgDays = ((agronomicData.cycleDaysMin ?? agronomicData.cycleDaysMax!) +
      (agronomicData.cycleDaysMax ?? agronomicData.cycleDaysMin!)) / 2
    cycleMonths = Math.max(1, Math.min(12, Math.round(avgDays / 30)))
  }
  const cycleLen = cycleMonths ?? 1

  // 2. Detección de meses con riesgo crítico de helada
  const criticalFrostMonths: number[] = []
  climate.monthly.forEach((m) => {
    if (m.frostDays >= 0.5) {
      if (killT != null) {
        if (killT >= 0 || m.tempAbsoluteMin <= killT) {
          criticalFrostMonths.push(m.month)
        }
      } else {
        const isFrostSensitive = minLimit > 0 || optMin >= 10
        if (isFrostSensitive) {
          criticalFrostMonths.push(m.month)
        }
      }
    }
  })

  const hasFrostRisk = criticalFrostMonths.length > 0
  if (hasFrostRisk) {
    limitingFactors.push(`Riesgo de heladas críticas en meses: ${criticalFrostMonths.map(m => MONTH_NAMES[m - 1]).join(', ')}`)
  }

  // 3. Evaluación de ciclos para cada ambiente
  // outdoor: sin modificación
  // indoor_starts: mes 0 en almácigo protegido (+6°C y sin heladas)
  // greenhouse: +7°C y sin heladas todo el ciclo

  function evaluateCycle(env: 'outdoor' | 'indoor_starts' | 'greenhouse'): MonthWindow {
    const optimalMonths: number[] = []
    const marginalMonths: number[] = []

    for (let startM = 1; startM <= 12; startM++) {
      let isViable = true
      let optMonthsCount = 0
      let totalMean = 0

      for (let offset = 0; offset < cycleLen; offset++) {
        const mIdx = (startM - 1 + offset) % 12
        const m = climate.monthly[mIdx]

        let tMean = m.tempMean
        let tMin = m.tempMin
        let isMonthFrostProtected = false

        if (env === 'greenhouse') {
          tMean += 7
          tMin += 7
          isMonthFrostProtected = true
        } else if (env === 'indoor_starts' && offset === 0) {
          tMean += 6
          tMin += 6
          isMonthFrostProtected = true
        }

        // Helada destructiva en el ciclo
        if (!isMonthFrostProtected) {
          if (killT != null) {
            // Si la temperatura media mínima es letal, el cultivo muere
            if (tMin <= killT) {
              isViable = false
              break
            }
          } else {
            const isFrostSensitive = minLimit > 0 || optMin >= 10
            if (isFrostSensitive && m.frostDays >= 0.5) {
              isViable = false
              break
            }
          }
        }

        // Límites absolutos fisiológicos
        if (tMean < minLimit || tMean > maxLimit) {
          isViable = false
          break
        }

        if (tMean >= optMin && tMean <= optMax) {
          optMonthsCount++
        }
        totalMean += tMean
      }

      if (!isViable) continue

      const avgCycleTemp = totalMean / cycleLen

      // Condiciones para óptimo:
      // Para cultivos anuales estivales o invernales:
      // - Si cycleLen == 1: tMean dentro de [optMin, optMax]
      // - Si cycleLen > 1:
      //   * la media del ciclo está en rango óptimo expandido [optMin - 1.5, optMax + 1.5]
      //   * y al menos 1 mes toca el rango óptimo (o todo el ciclo está en [optMin - 1, optMax + 1])
      const isOptimal = cycleLen === 1
        ? (totalMean >= optMin && totalMean <= optMax)
        : (avgCycleTemp >= optMin - 1.5 && avgCycleTemp <= optMax + 1.5 &&
            (optMonthsCount > 0 || (avgCycleTemp >= optMin - 0.8 && avgCycleTemp <= optMax + 0.8)))

      if (isOptimal) {
        optimalMonths.push(startM)
      } else {
        marginalMonths.push(startM)
      }
    }

    return { optimalMonths, marginalMonths }
  }

  const outdoorWin = evaluateCycle('outdoor')
  const indoorStartsWin = evaluateCycle('indoor_starts')
  const greenhouseWin = evaluateCycle('greenhouse')

  // 4. Determinación de Ambiente Recomendado y Clase de Aptitud
  let recommendedEnvironment: RecommendedEnvironment = 'outdoor'
  let activeWindow: MonthWindow = outdoorWin
  let suitability: SuitabilityClass = 'optimal'

  const outdoorHasOpt = outdoorWin.optimalMonths.length > 0
  const outdoorHasMarg = outdoorWin.marginalMonths.length > 0
  const indoorStartsHasOpt = indoorStartsWin.optimalMonths.length > 0
  const greenhouseHasOpt = greenhouseWin.optimalMonths.length > 0
  const greenhouseHasMarg = greenhouseWin.marginalMonths.length > 0

  if (outdoorHasOpt) {
    recommendedEnvironment = 'outdoor'
    activeWindow = outdoorWin
    suitability = 'optimal'
    positiveFactors.push('Condiciones térmicas óptimas a campo abierto')
  } else if (indoorStartsHasOpt && outdoorWin.optimalMonths.length === 0 && outdoorWin.marginalMonths.length <= 1) {
    // Si a campo abierto no hay ventana óptima, pero con almácigo sí
    recommendedEnvironment = 'indoor_starts'
    activeWindow = indoorStartsWin
    suitability = 'suitable'
    const sMonth = indoorStartsWin.optimalMonths[0]
    limitingFactors.push(`Requiere inicio en almácigo protegido en ${MONTH_NAMES[sMonth - 1]}`)
  } else if (greenhouseHasOpt && outdoorWin.optimalMonths.length === 0) {
    recommendedEnvironment = 'greenhouse'
    activeWindow = greenhouseWin
    suitability = 'suitable'
    limitingFactors.push('Recomendado cultivo en invernadero para alcanzar temperaturas óptimas')
  } else if (greenhouseHasMarg && greenhouseWin.marginalMonths.length > outdoorWin.marginalMonths.length) {
    recommendedEnvironment = 'greenhouse'
    activeWindow = greenhouseWin
    suitability = 'marginal'
    limitingFactors.push('Térmicamente marginal incluso bajo invernadero')
  } else if (outdoorHasMarg) {
    recommendedEnvironment = 'outdoor'
    activeWindow = outdoorWin
    suitability = 'marginal'
    limitingFactors.push('Régimen térmico subóptimo a campo abierto')
  } else if (indoorStartsHasOpt) {
    recommendedEnvironment = 'indoor_starts'
    activeWindow = indoorStartsWin
    suitability = 'suitable'
  } else if (greenhouseHasMarg) {
    recommendedEnvironment = 'greenhouse'
    activeWindow = greenhouseWin
    suitability = 'marginal'
    limitingFactors.push('Térmicamente marginal bajo invernadero')
  } else {
    recommendedEnvironment = 'indoor'
    activeWindow = { optimalMonths: [], marginalMonths: [] }
    suitability = 'not_suitable'
    limitingFactors.push('Clima incompatible para cultivo exterior o invernadero pasivo (requiere ambiente controlado)')
  }

  // Si el ciclo es continuo (365 días) y en ningún ambiente exterior/invernadero es apto
  if (cycleLen >= 12 && outdoorWin.optimalMonths.length === 0 && outdoorWin.marginalMonths.length === 0 && greenhouseWin.optimalMonths.length === 0 && greenhouseWin.marginalMonths.length === 0) {
    recommendedEnvironment = 'indoor'
    suitability = 'not_suitable'
  }

  // ThermalFit
  let thermalStatus: 'optimal' | 'marginal' | 'incompatible' = 'incompatible'
  let thermalMessage = 'Régimen térmico incompatible con el taxón'

  if (outdoorHasOpt) {
    thermalStatus = 'optimal'
    thermalMessage = 'Temperatura adecuada para desarrollo en campo abierto'
  } else if (outdoorHasMarg || indoorStartsHasOpt || greenhouseHasOpt || greenhouseHasMarg) {
    thermalStatus = 'marginal'
    thermalMessage = 'Temperaturas medias fuera del rango óptimo a campo abierto'
  } else {
    thermalStatus = 'incompatible'
    thermalMessage = 'Temperaturas incompatibles con los límites fisiológicos del taxón'
  }

  // 5. Evaluación de Agua / Precipitación
  let waterStatus: 'sufficient' | 'deficit' | 'excess' | 'unknown' = 'unknown'
  let waterMessage: string | undefined = undefined

  if (agronomicData.rainfallMin != null || agronomicData.rainfallMax != null) {
    const rain = climate.annualRainfall
    if (agronomicData.rainfallMin != null && rain < agronomicData.rainfallMin) {
      waterStatus = 'deficit'
      waterMessage = `Precipitación insuficiente (${Math.round(rain)} mm < mín ${agronomicData.rainfallMin} mm)`
      limitingFactors.push('Déficit hídrico natural: requiere riego suplementario')
    } else if (agronomicData.rainfallMax != null && rain > agronomicData.rainfallMax) {
      waterStatus = 'excess'
      waterMessage = `Precipitación excesiva (${Math.round(rain)} mm > máx ${agronomicData.rainfallMax} mm)`
      limitingFactors.push('Exceso de precipitación: requiere buen drenaje')
    } else {
      waterStatus = 'sufficient'
      waterMessage = 'Precipitación anual dentro del rango adecuado'
      positiveFactors.push('Régimen de lluvias adecuado')
    }
  }

  // 6. Cálculo de Score (0 a 100)
  let score = 0
  if (suitability === 'optimal') {
    score = Math.min(100, 75 + Math.round((activeWindow.optimalMonths.length / 12) * 25))
  } else if (suitability === 'suitable') {
    score = 70 + Math.round((activeWindow.optimalMonths.length / 12) * 10)
  } else if (suitability === 'marginal') {
    score = 35 + Math.round((activeWindow.marginalMonths.length / 12) * 25)
  } else {
    score = 0
  }

  if (waterStatus === 'deficit' && score > 30) {
    score = Math.max(30, score - 15)
  }

  const sowingWindow: SowingWindow = {
    optimalMonths: activeWindow.optimalMonths,
    marginalMonths: activeWindow.marginalMonths,
    recommendedEnvironment,
    byEnvironment: {
      outdoor: outdoorWin,
      indoor_starts: indoorStartsWin,
      greenhouse: greenhouseWin,
    },
    cycleMonths,
  }

  return {
    suitability,
    score,
    confidence,
    sowingWindow,
    limitingFactors,
    positiveFactors,
    thermalFit: {
      status: thermalStatus,
      message: thermalMessage,
    },
    frostRisk: {
      hasRisk: hasFrostRisk,
      criticalMonths: criticalFrostMonths,
    },
    waterFit: {
      status: waterStatus,
      message: waterMessage,
    },
    daylight,
  }
}
