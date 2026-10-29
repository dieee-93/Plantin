/**
 * build-ecocrop.mjs
 *
 * Descarga la base FAO EcoCrop (espejo OpenCLIM) y genera un JSON compacto
 * en src/data/ecocrop.json con sólo los rangos ecofisiológicos numéricos
 * y los sinónimos necesarios para resolver nombres científicos.
 *
 * Uso:  node scripts/build-ecocrop.mjs
 *
 * Fuente: FAO EcoCrop — https://gaez.fao.org/ (Tools → Ecocrop)
 * Espejo: https://github.com/OpenCLIM/ecocrop
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SOURCE_URL = 'https://raw.githubusercontent.com/OpenCLIM/ecocrop/main/EcoCrop_DB.csv'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_FILE = resolve(__dirname, '../src/data/ecocrop.json')

/** RFC-4180 CSV parser (soporta comillas, comas y saltos de línea dentro de campos). */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows.filter(r => r.length > 1)
}

const num = (v) => {
  if (v == null || v === '' || v === 'NA') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const LIGHT_MAP = {
  'very bright': 9,
  'clear skies': 8,
  'cloudy skies': 6,
  'light shade': 4,
  'heavy shade': 2,
}

function parseLight(r, get) {
  const vals = [get(r, 'LIOPMN'), get(r, 'LIOPMX'), get(r, 'LIMN'), get(r, 'LIMX')]
    .map(v => v?.trim().toLowerCase())
    .map(v => LIGHT_MAP[v])
    .filter(v => v !== undefined)
  if (!vals.length) return null
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}

const FER_MAP = {
  'high': 8,
  'moderate': 5,
  'medium': 5,
  'low': 2,
}

function parseFertility(r, get) {
  const v = (get(r, 'FER') || get(r, 'FERR') || '').trim().toLowerCase()
  for (const [k, score] of Object.entries(FER_MAP)) {
    if (v.includes(k)) return score
  }
  return null
}

function parseSalinity(r, get) {
  const v = (get(r, 'SAL') || get(r, 'SALR') || '').trim().toLowerCase()
  if (!v || v === 'na') return null
  if (v.includes('high')) return 8
  if (v.includes('medium') || v.includes('moderate')) return 5
  if (v.includes('low')) return 2
  if (v.includes('none') || v.includes('nil')) return 0
  return null
}

function parseHumidity(r, get, rain) {
  const cliz = (get(r, 'CLIZ') || '').toLowerCase()
  const optRain = rain && (rain[0] !== null || rain[1] !== null)
    ? ((rain[0] ?? rain[1]) + (rain[1] ?? rain[0])) / 2
    : null
  if (cliz.includes('tropical wet (ar)') || (optRain !== null && optRain >= 1800)) return 8
  if (cliz.includes('tropical wet & dry') || cliz.includes('subtropical humid') || (optRain !== null && optRain >= 1000)) return 7
  if (cliz.includes('oceanic') || cliz.includes('subtropical') || cliz.includes('temperate') || (optRain !== null && optRain >= 500)) return 5
  if (cliz.includes('semiarid') || cliz.includes('steppe') || (optRain !== null && optRain >= 250)) return 3
  if (cliz.includes('arid') || cliz.includes('desert') || (optRain !== null && optRain < 250)) return 2
  return null
}

/** "Solanum lycopersicum L., Lycopersicon lycopersicum (L.) Karst." → ["solanum lycopersicum", ...] */
function parseSynonyms(raw) {
  if (!raw || raw === 'NA') return []
  return raw
    .split(/[,;]/)
    .map(s => s.trim().split(/\s+/))
    .filter(parts => parts.length >= 2 && /^[A-Z][a-z-]+$/.test(parts[0]) && /^[a-z-]+$/.test(parts[1]))
    .map(parts => `${parts[0]} ${parts[1]}`.toLowerCase())
}

/** Devuelve [a,b,c,d] o null si todos son null (ahorra bytes). */
const quad = (...vals) => (vals.every(v => v === null) ? null : vals)

async function main() {
  console.log(`↓ Descargando ${SOURCE_URL}`)
  const res = await fetch(SOURCE_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  // El CSV está en Latin-1
  const text = new TextDecoder('latin1').decode(await res.arrayBuffer())

  const [header, ...data] = parseCsv(text)
  const col = Object.fromEntries(header.map((h, i) => [h.trim(), i]))
  const get = (r, k) => r[col[k]]

  const records = []
  for (const r of data) {
    const name = get(r, 'ScientificName')?.trim()
    if (!name) continue

    const rec = { n: name }
    const syn = [...new Set(parseSynonyms(get(r, 'SYNO')))].filter(s => s !== name.toLowerCase())
    if (syn.length) rec.s = syn

    // [óptimo mín, óptimo máx, absoluto mín, absoluto máx]
    const t = quad(num(get(r, 'TOPMN')), num(get(r, 'TOPMX')), num(get(r, 'TMIN')), num(get(r, 'TMAX')))
    const ph = quad(num(get(r, 'PHOPMN')), num(get(r, 'PHOPMX')), num(get(r, 'PHMIN')), num(get(r, 'PHMAX')))
    const rain = quad(num(get(r, 'ROPMN')), num(get(r, 'ROPMX')), num(get(r, 'RMIN')), num(get(r, 'RMAX')))
    if (t) rec.t = t
    if (ph) rec.ph = ph
    if (rain) rec.r = rain

    const gmin = num(get(r, 'GMIN'))
    const gmax = num(get(r, 'GMAX'))
    if (gmin !== null || gmax !== null) rec.g = [gmin, gmax]

    const ktmp = num(get(r, 'KTMP'))
    if (ktmp !== null) rec.k = ktmp

    const li = parseLight(r, get)
    const fe = parseFertility(r, get)
    const sa = parseSalinity(r, get)
    const hu = parseHumidity(r, get, rain)
    if (li !== null) rec.li = li
    if (fe !== null) rec.fe = fe
    if (sa !== null) rec.sa = sa
    if (hu !== null) rec.hu = hu

    // Registros sin ningún dato numérico no aportan nada como fallback
    if (rec.t || rec.ph || rec.r || rec.g || rec.li != null || rec.fe != null || rec.sa != null || rec.hu != null) records.push(rec)
  }

  await mkdir(dirname(OUT_FILE), { recursive: true })
  await writeFile(OUT_FILE, JSON.stringify(records))
  console.log(`✓ ${records.length} especies → ${OUT_FILE}`)
}

main().catch(err => { console.error(err); process.exit(1) })
