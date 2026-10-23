/**
 * Generador PRNG determinístico y hashing FNV-1a para derivar semillas y variaciones botánicas naturales.
 */

/**
 * Hashing FNV-1a de 32 bits a partir de cualquier string (ej. individualId o posLabel).
 * Devuelve un entero sin signo de 32 bits (uint32).
 */
export function hashString(str: string): number {
  let hash = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return hash >>> 0
}

/**
 * Generador pseudo-aleatorio de alta calidad Mulberry32.
 * Devuelve una función pura que produce floats uniformemente distribuidos en [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
