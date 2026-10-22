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

    // Registros sin ningún dato numérico no aportan nada como fallback
    if (rec.t || rec.ph || rec.r || rec.g) records.push(rec)
  }

  await mkdir(dirname(OUT_FILE), { recursive: true })
  await writeFile(OUT_FILE, JSON.stringify(records))
  console.log(`✓ ${records.length} especies → ${OUT_FILE}`)
}

main().catch(err => { console.error(err); process.exit(1) })
