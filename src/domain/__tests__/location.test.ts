import { describe, it, expect } from 'vitest'
import { createLocation } from '../location'

describe('createLocation con coordenadas', () => {
  it('conserva las coordenadas válidas de la ubicación', () => {
    const loc = createLocation({
      name: 'Lote Norte', type: 'field',
      coordinates: { latitude: -33.89, longitude: -60.57, elevation: 65 },
    })

    expect(loc.coordinates).toEqual({ latitude: -33.89, longitude: -60.57, elevation: 65 })
  })

  it('permite ubicaciones sin coordenadas (opcional)', () => {
    expect(createLocation({ name: 'Sala 1', type: 'room' }).coordinates).toBeUndefined()
  })

  it.each([
    [91, 0], [-91, 0], [0, 181], [0, -181], [NaN, 0], [0, Infinity],
  ])('rechaza coordenadas fuera de rango (%s, %s)', (latitude, longitude) => {
    expect(() => createLocation({ name: 'X', type: 'field', coordinates: { latitude, longitude } }))
      .toThrow(/Coordenadas inválidas/)
  })
})
