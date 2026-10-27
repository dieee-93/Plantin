import fs from 'node:fs'
import path from 'node:path'

interface CropConfig {
  label?: string
  source?: {
    pack?: string
    url?: string
    license?: string
    models?: string[]
  }
  stages: Record<string, string>
  modified?: boolean
  notes?: string
}

async function buildManifest() {
  const rootDir = process.cwd()
  const cropsJsonPath = path.resolve(rootDir, 'assets-src', 'crops.json')
  const rasterDir = path.resolve(
    rootDir,
    'src',
    'features',
    'locations',
    'isometric',
    'renderers',
    'raster'
  )
  const assetsDir = path.join(rasterDir, 'assets')
  const manifestGenPath = path.join(rasterDir, 'manifest.generated.ts')
  const attributionsPath = path.join(rasterDir, 'ATTRIBUTIONS.md')

  if (!fs.existsSync(cropsJsonPath)) {
    throw new Error(`No se encontró ${cropsJsonPath}`)
  }

  const cropsConfig: Record<string, CropConfig> = JSON.parse(
    fs.readFileSync(cropsJsonPath, 'utf-8')
  )

  // Escanear assets WebP disponibles
  const availableAssets = new Set<string>(
    fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir).filter(f => f.endsWith('.webp')) : []
  )

  const manifestEntries: Record<string, Record<string, string>> = {}

  for (const [cropCode, cfg] of Object.entries(cropsConfig)) {
    const phases = Object.keys(cfg.stages)
    for (const phase of phases) {
      const fileName = `${cropCode.toLowerCase()}-${phase}.webp`
      if (availableAssets.has(fileName)) {
        if (!manifestEntries[cropCode]) {
          manifestEntries[cropCode] = {}
        }
        manifestEntries[cropCode][phase] = fileName
      }
    }
  }

  // Generar manifest.generated.ts
  const lines: string[] = [
    '// Archivo generado por scripts/assets/build-manifest.ts — no editar a mano',
    "import type { BbchPhase } from '../../visual/plantSpec'",
    '',
    'export const RASTER_SPRITES: Partial<',
    "  Record<string /* cropCode */, Partial<Record<BbchPhase | 'dead' | 'harvested', string>>>",
    '> = {',
  ]

  for (const [cropCode, phaseMap] of Object.entries(manifestEntries)) {
    lines.push(`  ${cropCode}: {`)
    for (const [phase, fileName] of Object.entries(phaseMap)) {
      lines.push(
        `    ${phase}: new URL('./assets/${fileName}', import.meta.url).href,`
      )
    }
    lines.push('  },')
  }

  lines.push('}', '')

  fs.writeFileSync(manifestGenPath, lines.join('\n'), 'utf-8')
  console.log(`✅ Manifiesto generado en: ${manifestGenPath}`)

  // Generar ATTRIBUTIONS.md
  const attrLines: string[] = [
    '# Atribuciones y Procedencia de Assets Raster (Plantin v2)',
    '',
    '> Este archivo es generado automáticamente por `scripts/assets/build-manifest.ts`.',
    `> Fecha de generación: ${new Date().toISOString()}`,
    '',
    '| Cultivo | Código | Pack de Origen | Modelos | Licencia | Modificado | Notas |',
    '|---|---|---|---|---|---|---|',
  ]

  for (const [cropCode, cfg] of Object.entries(cropsConfig)) {
    const label = cfg.label || cropCode
    const pack = cfg.source?.url ? `[${cfg.source.pack || 'Pack'}](${cfg.source.url})` : (cfg.source?.pack || 'Local')
    const models = cfg.source?.models?.join(', ') || Object.values(cfg.stages).join(', ')
    const license = cfg.source?.license || 'CC0-1.0'
    const modified = cfg.modified ? 'Sí (Blender)' : 'No (Original)'
    const notes = cfg.notes || '—'

    attrLines.push(
      `| ${label} | \`${cropCode}\` | ${pack} | ${models} | ${license} | ${modified} | ${notes} |`
    )
  }

  attrLines.push('', '---', 'Todos los assets raster se compilan a formato WebP optimizado (≤ 20 KB).', '')
  fs.writeFileSync(attributionsPath, attrLines.join('\n'), 'utf-8')
  console.log(`✅ Atribuciones generadas en: ${attributionsPath}`)
}

buildManifest().catch(err => {
  console.error('❌ Error generando manifiesto:', err)
  process.exit(1)
})
