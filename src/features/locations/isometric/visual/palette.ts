/**
 * Conversión sRGB ↔ OKLCH pura en TypeScript (sin dependencias).
 * Sombreado direccional ('top', 'left', 'right', 'highlight', 'shadow') con luz desde arriba-izquierda (NW).
 */

export type Face = 'top' | 'left' | 'right' | 'highlight' | 'shadow'

export interface Oklch {
  l: number // [0, 1]
  c: number // [0, ~0.4]
  h: number // [0, 360)
}

function parseHex(hex: string): [number, number, number] {
  let clean = hex.replace('#', '').trim()
  if (clean.length === 3) {
    clean = clean.split('').map(ch => ch + ch).join('')
  }
  const num = parseInt(clean, 16)
  if (Number.isNaN(num)) return [0.5, 0.5, 0.5]
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ]
}

function sRgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function linearToSRgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055
}

/**
 * Convierte un código hex (#rrggbb o #rgb) a coordenadas OKLCH.
 */
export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = parseHex(hex)
  const lr = sRgbToLinear(r)
  const lg = sRgbToLinear(g)
  const lb = sRgbToLinear(b)

  // sRGB linear -> Cone LMS (Oklab)
  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)

  // LMS -> Oklab
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const bOk = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_

  const C = Math.sqrt(a * a + bOk * bOk)
  let H = (Math.atan2(bOk, a) * 180) / Math.PI
  if (H < 0) H += 360

  return { l: Math.max(0, Math.min(1, L)), c: Math.max(0, C), h: H }
}

/**
 * Convierte coordenadas OKLCH a código hex (#rrggbb).
 */
export function oklchToHex(l: number, c: number, h: number): string {
  const clampedL = Math.max(0, Math.min(1, l))
  const clampedC = Math.max(0, c)
  const radH = (h * Math.PI) / 180

  const a = clampedC * Math.cos(radH)
  const bOk = clampedC * Math.sin(radH)

  // Oklab -> LMS
  const l_ = clampedL + 0.3963377774 * a + 0.2158037573 * bOk
  const m_ = clampedL - 0.1055613458 * a - 0.0638541728 * bOk
  const s_ = clampedL - 0.0894841775 * a - 1.291485548 * bOk

  const lr = l_ * l_ * l_
  const lg = m_ * m_ * m_
  const lb = s_ * s_ * s_

  // LMS -> sRGB linear
  const rLin = +4.0767416621 * lr - 3.3077115913 * lg + 0.2309699292 * lb
  const gLin = -1.2684380046 * lr + 2.6097574011 * lg - 0.3413193965 * lb
  const bLin = -0.0041960863 * lr - 0.7034186147 * lg + 1.707614701 * lb

  // Linear sRGB -> sRGB
  const r = Math.max(0, Math.min(255, Math.round(linearToSRgb(rLin) * 255)))
  const g = Math.max(0, Math.min(255, Math.round(linearToSRgb(gLin) * 255)))
  const b = Math.max(0, Math.min(255, Math.round(linearToSRgb(bLin) * 255)))

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Deriva las caras cromáticas de un objeto 2.5D según una fuente de luz cenital-noroeste (arriba-izquierda).
 * Reglas del spec:
 * - top: L +0.08, C ×0.95
 * - left: base
 * - right: L -0.10, C ×1.05
 * - highlight: L +0.18, C ×0.7
 * - shadow: L -0.20, C ×0.9, hue desplazado -10°
 */
export function shade(baseHex: string, face: Face): string {
  if (face === 'left') return baseHex

  const { l, c, h } = hexToOklch(baseHex)

  switch (face) {
    case 'top':
      return oklchToHex(l + 0.08, c * 0.95, h)
    case 'right':
      return oklchToHex(l - 0.1, c * 1.05, h)
    case 'highlight':
      return oklchToHex(l + 0.18, c * 0.7, h)
    case 'shadow':
      return oklchToHex(l - 0.2, c * 0.9, (h - 10 + 360) % 360)
  }
}

/**
 * Aplica mutación de color para plantas muertas (dead) o cosechadas (harvested).
 * Desatura (C ×0.35) y vira el tono hacia ocres / amarillentos secos (60-70°).
 */
export function adjustVitality(baseHex: string, vitality: 'alive' | 'harvested' | 'dead'): string {
  if (vitality === 'alive') return baseHex

  const { l, c } = hexToOklch(baseHex)
  const targetHue = vitality === 'dead' ? 62 : 68
  const targetLightness = vitality === 'dead' ? Math.max(0.35, l * 0.8) : Math.max(0.45, l * 0.95)
  return oklchToHex(targetLightness, c * 0.35, targetHue)
}

export interface ShadedColor {
  top: string
  left: string
  right: string
  highlight: string
  shadow: string
}

export function createShadedColor(baseHex: string): ShadedColor {
  return {
    top: shade(baseHex, 'top'),
    left: shade(baseHex, 'left'),
    right: shade(baseHex, 'right'),
    highlight: shade(baseHex, 'highlight'),
    shadow: shade(baseHex, 'shadow'),
  }
}
