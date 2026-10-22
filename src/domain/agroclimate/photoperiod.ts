const DEG = Math.PI / 180
/** Elevación solar al orto/ocaso: refracción atmosférica + semidiámetro del disco. */
const SUNRISE_ELEVATION = -0.833 * DEG

/**
 * Duración astronómica del día (horas) para una latitud y día del año (1..365).
 * Declinación solar de Cooper; devuelve 24 (sol de medianoche) o 0 (noche polar) en latitudes extremas.
 */
export function daylightHours(latitude: number, dayOfYear: number): number {
  const phi = latitude * DEG
  const declination = 23.44 * DEG * Math.sin((2 * Math.PI * (284 + dayOfYear)) / 365)
  const x = (Math.sin(SUNRISE_ELEVATION) - Math.sin(phi) * Math.sin(declination)) /
    (Math.cos(phi) * Math.cos(declination))
  if (x <= -1) return 24
  if (x >= 1) return 0
  return (24 / Math.PI) * Math.acos(x)
}

/** Día del año representativo (mitad) de cada mes. */
const MID_MONTH_DAY = [15, 45, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349]

/** Horas de luz promedio por mes (índice 0 = enero) para una latitud. */
export function daylightByMonth(latitude: number): number[] {
  return MID_MONTH_DAY.map(day => daylightHours(latitude, day))
}
