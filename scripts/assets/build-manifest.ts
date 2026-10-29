import fs from 'node:fs'
import path from 'node:path'

interface PlantAsset {
  kind: 'plant'
  cropCode: string
  label: string
  targetHeightUnits: number
  displayWidthUnits: number
  phases: string[]
  status: Record<string, string>
  source?: { tool?: string; license?: string; date?: string }
}

interface ObjectAsset {
  kind: 'object'
  typeId: string
  label: string
  mirrorForViewB: boolean
  status: string
  anchor: { soilY: number | null; x?: number; y?: number; width?: number; height?: number }
  source?: { tool?: string; license?: string; date?: string }
}

type Catalog = Record<string, PlantAsset | ObjectAsset>

export async function buildManifest() {
  const rootDir = process.cwd()
  const catalogPath = path.resolve(rootDir, 'assets-src', 'assets.json')

  const plantRasterDir = path.resolve(
    rootDir,
    'src',
    'features',
    'locations',
    'isometric',
    'renderers',
    'raster'
  )
  const plantAssetsDir = path.join(plantRasterDir, 'assets')
  const plantManifestPath = path.join(plantRasterDir, 'manifest.generated.ts')
  const plantAttributionsPath = path.join(plantRasterDir, 'ATTRIBUTIONS.md')

  const objectRasterDir = path.resolve(
    rootDir,
    'src',
    'features',
    'locations',
    'isometric',
    'catalog',
    'raster'
  )
  const objectAssetsDir = path.join(objectRasterDir, 'assets')
  const objectManifestPath = path.join(objectRasterDir, 'manifest.generated.ts')
  const objectAttributionsPath = path.join(objectRasterDir, 'ATTRIBUTIONS.md')

  if (!fs.existsSync(objectRasterDir)) {
    fs.mkdirSync(objectRasterDir, { recursive: true })
  }
  if (!fs.existsSync(objectAssetsDir)) {
    fs.mkdirSync(objectAssetsDir, { recursive: true })
  }

  const catalog: Catalog = fs.existsSync(catalogPath)
    ? JSON.parse(fs.readFileSync(catalogPath, 'utf-8'))
    : {}

  // 1. Manifiesto de Plantas
  const plantFiles = new Set<string>(
    fs.existsSync(plantAssetsDir) ? fs.readdirSync(plantAssetsDir).filter(f => f.endsWith('.webp')) : []
  )

  const plantEntries: Record<string, Record<string, string>> = {}
  const plantMetaEntries: Record<string, Record<string, any>> = {}

  // Cargar con assets.json aprobados o generados con metadatos
  for (const [_key, asset] of Object.entries(catalog)) {
    if (asset.kind !== 'plant') continue
    const plant = asset as PlantAsset
    const cropCode = plant.cropCode

    for (const phase of plant.phases) {
      const fileName = `${cropCode.toLowerCase()}-${phase}.webp`
      const phaseStatus = plant.status?.[phase]
      const isAvailable = phaseStatus === 'approved' || phaseStatus === 'generated'

      if (plantFiles.has(fileName) && isAvailable) {
        if (!plantEntries[cropCode]) plantEntries[cropCode] = {}
        plantEntries[cropCode][phase] = fileName

        if (!plantMetaEntries[cropCode]) plantMetaEntries[cropCode] = {}
        plantMetaEntries[cropCode][phase] = {
          fileName,
          width: plant.displayWidthUnits,
          height: plant.targetHeightUnits,
          anchorX: -plant.displayWidthUnits / 2,
          anchorY: -7 - plant.targetHeightUnits,
        }
      }
    }
  }

  // Generar plant manifest.generated.ts
  const plantLines: string[] = [
    '// Archivo generado por scripts/assets/build-manifest.ts — no editar a mano',
    "import type { BbchPhase } from '../../visual/plantSpec'",
    '',
    'export interface RasterSpriteMeta {',
    '  href: string',
    '  width: number',
    '  height: number',
    '  anchorX: number',
    '  anchorY: number',
    '}',
    '',
    'export const RASTER_SPRITES: Partial<',
    "  Record<string /* cropCode */, Partial<Record<BbchPhase | 'dead' | 'harvested', string>>>",
    '> = {',
  ]

  for (const [cropCode, phaseMap] of Object.entries(plantEntries)) {
    plantLines.push(`  ${cropCode}: {`)
    for (const [phase, fileName] of Object.entries(phaseMap)) {
      plantLines.push(`    ${phase}: new URL('./assets/${fileName}', import.meta.url).href,`)
    }
    plantLines.push('  },')
  }
  plantLines.push('}', '')

  plantLines.push(
    'export const RASTER_SPRITES_META: Partial<',
    "  Record<string, Partial<Record<BbchPhase | 'dead' | 'harvested', RasterSpriteMeta>>>",
    '> = {'
  )

  for (const [cropCode, phaseMetaMap] of Object.entries(plantMetaEntries)) {
    plantLines.push(`  ${cropCode}: {`)
    for (const [phase, meta] of Object.entries(phaseMetaMap)) {
      plantLines.push(`    ${phase}: {`)
      plantLines.push(`      href: new URL('./assets/${meta.fileName}', import.meta.url).href,`)
      plantLines.push(`      width: ${meta.width},`)
      plantLines.push(`      height: ${meta.height},`)
      plantLines.push(`      anchorX: ${meta.anchorX},`)
      plantLines.push(`      anchorY: ${meta.anchorY},`)
      plantLines.push('    },')
    }
    plantLines.push('  },')
  }
  plantLines.push('}', '')

  fs.writeFileSync(plantManifestPath, plantLines.join('\n'), 'utf-8')
  console.log(`✅ Manifiesto de plantas generado en: ${path.relative(rootDir, plantManifestPath)}`)

  // 2. Manifiesto de Objetos
  const objectFiles = new Set<string>(
    fs.existsSync(objectAssetsDir) ? fs.readdirSync(objectAssetsDir).filter(f => f.endsWith('.webp')) : []
  )

  const objectEntries: Record<string, any> = {}

  for (const [_key, asset] of Object.entries(catalog)) {
    if (asset.kind !== 'object') continue
    const obj = asset as ObjectAsset
    const typeId = obj.typeId
    const fileName = `${typeId}.webp`

    // Entra al manifiesto si existe el archivo compilado y su status es 'approved' o 'generated' para pruebas
    if (objectFiles.has(fileName) && (obj.status === 'approved' || obj.status === 'generated')) {
      const a = obj.anchor || { soilY: null }
      objectEntries[typeId] = {
        fileName,
        width: a.width ?? 52,
        height: a.height ?? 48,
        anchorX: a.x ?? -26,
        anchorY: a.y ?? -22,
        mirrorForViewB: obj.mirrorForViewB,
        soilY: a.soilY ?? null,
      }
    }
  }

  const objectLines: string[] = [
    '// Archivo generado por scripts/assets/build-manifest.ts — no editar a mano',
    '',
    'export interface RasterObjectMeta {',
    '  href: string',
    '  width: number',
    '  height: number',
    '  anchorX: number',
    '  anchorY: number',
    '  mirrorForViewB: boolean',
    '  soilY?: number | null',
    '}',
    '',
    'export const RASTER_OBJECTS: Partial<Record<string, RasterObjectMeta>> = {',
  ]

  for (const [typeId, meta] of Object.entries(objectEntries)) {
    objectLines.push(`  ${typeId}: {`)
    objectLines.push(`    href: new URL('./assets/${meta.fileName}', import.meta.url).href,`)
    objectLines.push(`    width: ${meta.width},`)
    objectLines.push(`    height: ${meta.height},`)
    objectLines.push(`    anchorX: ${meta.anchorX},`)
    objectLines.push(`    anchorY: ${meta.anchorY},`)
    objectLines.push(`    mirrorForViewB: ${meta.mirrorForViewB},`)
    if (meta.soilY !== null && meta.soilY !== undefined) {
      objectLines.push(`    soilY: ${meta.soilY},`)
    }
    objectLines.push('  },')
  }
  objectLines.push('}', '')

  fs.writeFileSync(objectManifestPath, objectLines.join('\n'), 'utf-8')
  console.log(`✅ Manifiesto de objetos generado en: ${path.relative(rootDir, objectManifestPath)}`)

  // 3. Atribuciones
  const attrLines: string[] = [
    '# Atribuciones y Procedencia de Assets Raster (Plantin v2)',
    '',
    '> Este archivo es generado automáticamente por `scripts/assets/build-manifest.ts`.',
    `> Fecha de generación: ${new Date().toISOString()}`,
    '',
    '### Cultivos',
    '| Cultivo | Código | Herramienta / Pack | Licencia | Estado |',
    '|---|---|---|---|---|',
  ]

  for (const [code, _pMap] of Object.entries(plantEntries)) {
    const cat = catalog[`plant.${code}`] as PlantAsset | undefined
    const tool = cat?.source?.tool || 'Gemini (Nano Banana)'
    const lic = cat?.source?.license || 'Generado por el dueño; uso no comercial'
    const st = cat?.status ? Object.entries(cat.status).map(([k, v]) => `${k}:${v}`).join(', ') : 'pending'
    attrLines.push(`| ${cat?.label || code} | \`${code}\` | ${tool} | ${lic} | ${st} |`)
  }

  attrLines.push('', '### Objetos del Catálogo', '| Tipo | Nombre | Herramienta | Licencia | Estado |', '|---|---|---|---|---|')
  for (const [typeId, _meta] of Object.entries(objectEntries)) {
    const cat = catalog[`object.${typeId}`] as ObjectAsset | undefined
    const tool = cat?.source?.tool || 'Gemini (Nano Banana)'
    const lic = cat?.source?.license || 'Generado por el dueño; uso no comercial'
    attrLines.push(`| \`${typeId}\` | ${cat?.label || typeId} | ${tool} | ${lic} | ${cat?.status || 'pending'} |`)
  }

  attrLines.push('', '---', 'Todos los assets raster se compilan a formato WebP optimizado (≤ 30 KB).', '')
  fs.writeFileSync(plantAttributionsPath, attrLines.join('\n'), 'utf-8')
  fs.writeFileSync(objectAttributionsPath, attrLines.join('\n'), 'utf-8')
}

if (process.argv[1] && process.argv[1].endsWith('build-manifest.ts')) {
  buildManifest().catch(err => {
    console.error('❌ Error generando manifiesto:', err)
    process.exit(1)
  })
}
