import { describe, it, expect } from 'vitest'
import { daylightHours, daylightByMonth } from '../photoperiod'

/** Duración del día en solsticios (valores publicados aprox., tolerancia ±0.35 h por refracción/modelo). */
const near = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThan(0.35)

describe('daylightHours', () => {
  it('Buenos Aires (34.6°S): ~14.2 h en el solsticio de diciembre, ~10.1 h en junio', () => {
    near(daylightHours(-34.6, 355), 14.2) // 21-dic
    near(daylightHours(-34.6, 172), 10.1) // 21-jun
  })

  it('Madrid (40.4°N): ~15.0 h en junio y ~9.3 h en diciembre (hemisferio invertido)', () => {
    near(daylightHours(40.4, 172), 15.0)
    near(daylightHours(40.4, 355), 9.3)
  })

  it('Bogotá (4.7°N): ~12 h todo el año', () => {
    for (const day of [1, 80, 172, 266, 355]) near(daylightHours(4.7, day), 12.1)
  })

  it('maneja día polar sin NaN (círculo polar)', () => {
    expect(daylightHours(78, 172)).toBe(24) // sol de medianoche
    expect(daylightHours(78, 355)).toBe(0)  // noche polar
  })
})

describe('daylightByMonth', () => {
  it('devuelve 12 valores, con máximo en enero (sur) y en julio/junio (norte)', () => {
    const south = daylightByMonth(-34.6)
    const north = daylightByMonth(40.4)
    expect(south).toHaveLength(12)
    expect([11, 0]).toContain(south.indexOf(Math.max(...south)))
    expect([5, 6]).toContain(north.indexOf(Math.max(...north)))
  })
})
