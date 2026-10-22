import type { ClimateProfile, GeoCoordinates } from '@/domain/agroclimate/types'
import type { AgronomicData } from '@/domain/taxon'
import { ecocropToAgronomicData, type EcocropRecord } from '@/services/taxonomy/ecocrop'

/**
 * Normales climáticas mensuales aproximadas (tablas publicadas: SMN Argentina, AEMET, IDEAM).
 * Los valores son literales de referencia, independientes del código bajo prueba.
 */
interface Normals {
  tmean: number[]; tmin: number[]; tmax: number[]; absMin: number[]; rain: number[]; frost: number[]
}

function profile(coords: GeoCoordinates, n: Normals): ClimateProfile {
  return {
    coordinates: coords,
    hemisphere: coords.latitude < 0 ? 'south' : 'north',
    annualRainfall: n.rain.reduce((a, b) => a + b, 0),
    annualFrostDays: n.frost.reduce((a, b) => a + b, 0),
    monthly: n.tmean.map((t, i) => ({
      month: i + 1, tempMean: t, tempMin: n.tmin[i], tempMax: n.tmax[i],
      tempAbsoluteMin: n.absMin[i], precipitation: n.rain[i], frostDays: n.frost[i],
    })),
    fetchedAt: '2026-10-20T00:00:00.000Z',
  }
}

/** Buenos Aires — templado húmedo (sin heladas relevantes). */
export const BUENOS_AIRES = profile({ latitude: -34.6, longitude: -58.4, name: 'Buenos Aires' }, {
  tmean:  [24.8, 23.7, 21.8, 17.9, 14.4, 11.4, 10.8, 12.3, 14.5, 17.8, 21.0, 23.5],
  tmin:   [19.3, 18.6, 17.0, 13.4, 10.4, 7.7, 7.1, 8.2, 10.4, 13.0, 15.9, 18.2],
  tmax:   [30.1, 28.8, 26.6, 22.6, 19.0, 15.8, 15.3, 17.4, 19.4, 22.6, 25.9, 28.6],
  absMin: [8, 7, 5, 1, -2, -4, -5.4, -4, -2, 1, 3, 7],
  rain:   [123, 118, 134, 108, 89, 60, 59, 71, 80, 120, 112, 100],
  frost:  [0, 0, 0, 0, 0, 0.1, 0.3, 0.1, 0, 0, 0, 0],
})

/** Mendoza — árido continental, heladas de abril a septiembre. */
export const MENDOZA = profile({ latitude: -32.9, longitude: -68.8, name: 'Mendoza' }, {
  tmean:  [25.2, 23.7, 20.4, 15.9, 11.3, 7.9, 7.8, 10.2, 13.1, 17.6, 21.4, 24.2],
  tmin:   [18.4, 17.4, 14.4, 9.8, 5.4, 1.5, 0.9, 3.6, 6.9, 11.2, 14.9, 17.7],
  tmax:   [31.6, 29.8, 26.4, 22.0, 17.6, 14.5, 14.5, 17.4, 20.0, 24.3, 28.1, 30.8],
  absMin: [3, 2, -1, -5, -8, -10, -12, -10, -7, -4, 0, 3],
  rain:   [31, 34, 31, 18, 12, 9, 12, 14, 18, 24, 26, 30],
  frost:  [0, 0, 0, 0.5, 2.5, 9, 11, 6, 1.5, 0.3, 0, 0],
})

/** Madrid — mediterráneo continental. */
export const MADRID = profile({ latitude: 40.4, longitude: -3.7, name: 'Madrid' }, {
  tmean:  [6.3, 8.0, 11.3, 13.1, 17.0, 22.2, 25.6, 25.2, 20.8, 14.9, 9.6, 6.9],
  tmin:   [2.8, 4.0, 6.6, 8.3, 11.8, 16.1, 19.2, 19.0, 15.3, 10.5, 5.9, 3.6],
  tmax:   [9.8, 12.0, 16.0, 18.0, 22.2, 28.3, 32.0, 31.4, 26.2, 19.4, 13.3, 10.2],
  absMin: [-10, -8, -7, -3, 0, 5, 9, 8, 2, -2, -6, -9],
  rain:   [34, 34, 27, 43, 46, 21, 11, 10, 25, 47, 52, 52],
  frost:  [6, 4, 1.5, 0.1, 0, 0, 0, 0, 0, 0, 1.8, 5],
})

/** Bogotá — tropical de altura (2600 m): térmicamente constante, heladas de radiación en dic–feb. */
export const BOGOTA = profile({ latitude: 4.7, longitude: -74.1, elevation: 2600, name: 'Bogotá' }, {
  tmean:  [13.4, 13.7, 14.0, 14.2, 14.2, 13.9, 13.4, 13.5, 13.6, 13.8, 13.9, 13.6],
  tmin:   [7.2, 7.6, 8.5, 9.3, 9.5, 9.1, 8.5, 8.4, 8.2, 8.8, 8.9, 8.0],
  tmax:   [19.4, 19.6, 19.5, 19.1, 18.8, 18.5, 18.3, 18.6, 19.0, 19.0, 18.9, 19.0],
  absMin: [-1, -0.5, 2, 3, 3, 3, 2, 2, 2, 2, 1, -1],
  rain:   [48, 62, 93, 142, 122, 63, 50, 52, 69, 142, 129, 76],
  frost:  [1.5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0.2, 1.2],
})

/** Clima tropical sintético constante: 25 °C todo el año, sin heladas, 1500 mm. */
export const TROPICAL_CONSTANT = profile({ latitude: 0, longitude: -78 }, {
  tmean: Array(12).fill(25), tmin: Array(12).fill(20), tmax: Array(12).fill(30),
  absMin: Array(12).fill(15), rain: Array(12).fill(125), frost: Array(12).fill(0),
})

const fromEcocrop = (rec: EcocropRecord): AgronomicData => ecocropToAgronomicData(rec)!

/** Registros reales de FAO EcoCrop (src/data/ecocrop.json). */
export const TOMATO = fromEcocrop({ n: 'Lycopersicon esculentum', t: [20, 27, 7, 35], r: [600, 1300, 400, 1800], g: [70, 150] })
export const WHEAT = fromEcocrop({ n: 'Triticum aestivum', t: [15, 23, 5, 27], r: [750, 900, 300, 1600], g: [90, 250], k: 0 })
export const QUINOA = fromEcocrop({ n: 'Chenopodium quinoa', t: [14, 18, 2, 35], r: [500, 1000, 250, 2600], g: [90, 240], k: -8 })
export const BANANA = fromEcocrop({ n: 'Musa textilis', t: [20, 29, 16, 33], r: [1800, 3000, 700, 4400], g: [365, 365] })
export const COFFEE = fromEcocrop({ n: 'Coffea arabica', t: [14, 28, 10, 34], r: [1400, 2300, 750, 4200], g: [210, 330] })
