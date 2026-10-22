import type { AgronomicData, AgronomicValues } from '@/domain/taxon'
import { tagAgronomicSource } from '@/domain/taxon'

/**
 * Registro compacto generado por scripts/build-ecocrop.mjs
 * Cuartetos: [óptimo mín, óptimo máx, absoluto mín, absoluto máx]
 */
export interface EcocropRecord {
  n: string                                   // nombre científico EcoCrop
  s?: string[]                                // sinónimos binomiales (lowercase)
  t?: (number | null)[]                       // temperatura °C
  ph?: (number | null)[]                      // pH
  r?: (number | null)[]                       // precipitación mm/año
  g?: (number | null)[]                       // ciclo [mín, máx] días
  k?: number                                  // temperatura letal °C
}

export type EcocropMatch = 'exact' | 'synonym' | 'infraspecific'

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

/**
 * Busca la especie en EcoCrop por prioridad:
 *  1. Nombre exacto ("Zea mays")
 *  2. Sinónimo ("Solanum lycopersicum" → "Lycopersicon esculentum")
 *  3. Infraespecífico ("Cannabis sativa" → "Cannabis sativa ssp. indica"), el más corto
 */
export function findEcocropRecord(
  genus: string,
  species: string,
  records: EcocropRecord[],
): { record: EcocropRecord; match: EcocropMatch } | undefined {
  if (!genus?.trim() || !species?.trim()) return undefined
  // Toma sólo el epíteto específico (descarta autoría o infraespecíficos)
  const binomial = norm(`${genus} ${species.trim().split(/\s+/)[0]}`)

  const exact = records.find(r => norm(r.n) === binomial)
  if (exact) return { record: exact, match: 'exact' }

  const synonym = records.find(r => r.s?.includes(binomial))
  if (synonym) return { record: synonym, match: 'synonym' }

  const infra = records
    .filter(r => norm(r.n).startsWith(binomial + ' '))
    .sort((a, b) => a.n.length - b.n.length)[0]
  if (infra) return { record: infra, match: 'infraspecific' }

  return undefined
}

const v = (x: number | null | undefined) => (x == null ? undefined : x)

/** Convierte un registro EcoCrop al modelo interno, etiquetado con source 'ecocrop'. */
export function ecocropToAgronomicData(rec: EcocropRecord): AgronomicData | undefined {
  const values: AgronomicValues = {
    optTempMin: v(rec.t?.[0]), optTempMax: v(rec.t?.[1]),
    minTemp: v(rec.t?.[2]),    maxTemp: v(rec.t?.[3]),
    killTemp: v(rec.k),
    optPhMin: v(rec.ph?.[0]),  optPhMax: v(rec.ph?.[1]),
    phMinimum: v(rec.ph?.[2]), phMaximum: v(rec.ph?.[3]),
    rainfallMin: v(rec.r?.[2]), rainfallMax: v(rec.r?.[3]),
    cycleDaysMin: v(rec.g?.[0]), cycleDaysMax: v(rec.g?.[1]),
  }
  return tagAgronomicSource(values, 'ecocrop')
}

let cache: Promise<EcocropRecord[]> | null = null

/** Carga perezosa del dataset (~277 KB) — sólo se descarga la primera vez que se usa. */
function loadEcocrop(): Promise<EcocropRecord[]> {
  cache ??= import('@/data/ecocrop.json').then(m => m.default as EcocropRecord[])
  return cache
}

/** Lookup completo: carga el dataset, resuelve el nombre y mapea los datos. */
export async function lookupEcocrop(
  genus: string,
  species: string,
): Promise<{ data: AgronomicData; matchedName: string; match: EcocropMatch } | undefined> {
  try {
    const found = findEcocropRecord(genus, species, await loadEcocrop())
    if (!found) return undefined
    const data = ecocropToAgronomicData(found.record)
    return data ? { data, matchedName: found.record.n, match: found.match } : undefined
  } catch (error) {
    console.error('EcoCrop lookup failed:', error)
    return undefined
  }
}
