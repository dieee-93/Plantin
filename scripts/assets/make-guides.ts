import fs from 'node:fs'
import path from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { getBoxCorners } from '../../src/features/locations/isometric/catalog/renderers/prismHelper'
import { halfW, CELL_CM } from '../../src/features/locations/isometric/geometry/iso'

interface PlantAsset {
  kind: 'plant'
  cropCode: string
  label: string
  archetype: string
  targetHeightUnits: number
  displayWidthUnits: number
  keyColor: string
  structure: string
  phases: string[]
  status: Record<string, string>
}

interface ObjectAsset {
  kind: 'object'
  typeId: string
  label: string
  category: string
  footprint: { w: number; d: number; h: number }
  mirrorForViewB: boolean
  keyColor: string
  structure: string
  status: string
  anchor: { soilY: number | null }
}

type AssetEntry = PlantAsset | ObjectAsset
type AssetsCatalog = Record<string, AssetEntry>

function parseArgs() {
  const args = process.argv.slice(2)
  let targetId: string | null = null
  for (const arg of args) {
    if (arg.startsWith('--id=')) {
      targetId = arg.split('=')[1].trim()
    }
  }
  return { targetId }
}

function renderPlantGuideSvg(asset: PlantAsset, phase = 'fruiting'): string {
  const width = 600
  const height = 600
  const keyColor = asset.keyColor || '#FF00FF'

  // Proporción de altura según fase
  const phaseScaleMap: Record<string, number> = {
    germination: 0.25,
    leaf: 0.45,
    structure: 0.72,
    flowering: 0.9,
    fruiting: 1.0,
  }
  const phaseScale = phaseScaleMap[phase] ?? 1.0

  // Escala para ajustar en canvas de 600x600 px
  // 80 unidades de ancho * 4.5 = 360 px
  const scale = 5.0
  const plantW = asset.displayWidthUnits * scale * Math.max(0.6, phaseScale)
  const plantH = asset.targetHeightUnits * scale * phaseScale

  const baseX = width / 2
  const baseY = 480
  const topY = baseY - plantH

  // Dimensiones de la maceta de referencia (boca de maceta estándar 25 cm)
  const potRadiusCm = 12.5
  const potScale = halfW / (CELL_CM / 2) // px por cm
  const rx = potRadiusCm * potScale * 0.48 * 2.2
  const ry = rx * 0.5 // Relación 2:1 dimétrica

  const strokeColor = keyColor.toUpperCase() === '#00FFFF' ? '#0f172a' : '#ffffff'
  const accentColor = keyColor.toUpperCase() === '#00FFFF' ? '#7c2d12' : '#facc15'

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <!-- Fondo clave plano sin gradientes -->
      <rect width="${width}" height="${height}" fill="${keyColor}" />

      <!-- Rejilla guía dimétrica 2:1 en el piso -->
      <g stroke="${strokeColor}" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="4,4">
        <line x1="${baseX - rx * 2}" y1="${baseY - ry * 2}" x2="${baseX + rx * 2}" y2="${baseY + ry * 2}" />
        <line x1="${baseX - rx * 2}" y1="${baseY + ry * 2}" x2="${baseX + rx * 2}" y2="${baseY - ry * 2}" />
      </g>

      <!-- Elipse / Rombo de borde de maceta de referencia en el suelo -->
      <ellipse cx="${baseX}" cy="${baseY}" rx="${rx}" ry="${ry}"
        fill="${accentColor}" fill-opacity="0.15"
        stroke="${accentColor}" stroke-width="2.5" stroke-dasharray="6,4" />

      <!-- Bounding box punteado del tamaño objetivo de la planta -->
      <rect x="${baseX - plantW / 2}" y="${topY}" width="${plantW}" height="${plantH}"
        fill="none" stroke="${strokeColor}" stroke-width="2" stroke-dasharray="6,6" stroke-opacity="0.85" rx="8" />

      <!-- Eje vertical central -->
      <line x1="${baseX}" y1="${baseY}" x2="${baseX}" y2="${topY}"
        stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="3,3" stroke-opacity="0.6" />

      <!-- Punto de base único (anclaje al centro inferior) -->
      <circle cx="${baseX}" cy="${baseY}" r="7" fill="${accentColor}" stroke="${strokeColor}" stroke-width="2" />
      <circle cx="${baseX}" cy="${baseY}" r="2.5" fill="${strokeColor}" />

      <!-- Rótulos explicativos técnicos -->
      <text x="${baseX}" y="${topY - 14}" text-anchor="middle"
        font-family="sans-serif" font-size="14" font-weight="bold" fill="${strokeColor}">
        ${asset.label.toUpperCase()} · FASE: ${phase.toUpperCase()} (H: ${Math.round(asset.targetHeightUnits * phaseScale)} u)
      </text>

      <text x="${baseX}" y="${baseY + 36}" text-anchor="middle"
        font-family="sans-serif" font-size="12" font-weight="600" fill="${strokeColor}">
        ▲ CUELLO DE RAÍZ ENRAIZADO (NO SECCIONADO NI CORTADO) ▲
      </text>

      <text x="${baseX}" y="40" text-anchor="middle"
        font-family="sans-serif" font-size="12" font-weight="500" fill="${strokeColor}" fill-opacity="0.9">
        GUÍA DE PERSPECTIVA DIMÉTRICA 2:1 (~30° ELEVACIÓN) — NO DIBUJAR LÍNEAS
      </text>
    </svg>
  `
}

function renderObjectGuideSvg(asset: ObjectAsset): string {
  const width = 600
  const height = 600
  const keyColor = asset.keyColor || '#FF00FF'
  const { w, d, h } = asset.footprint

  // Obtener esquinas 3D proyectadas con el helper oficial
  const corners = getBoxCorners(w, d, h)

  // Encontrar bounding box de las esquinas en coords del helper
  const allPoints = [
    corners.p0, corners.pX, corners.pXY, corners.pY,
    corners.topP0, corners.topPX, corners.topPXY, corners.topPY,
  ]
  const minX = Math.min(...allPoints.map(p => p.x))
  const maxX = Math.max(...allPoints.map(p => p.x))
  const minY = Math.min(...allPoints.map(p => p.y))
  const maxY = Math.max(...allPoints.map(p => p.y))

  const boxW = maxX - minX
  const boxH = maxY - minY

  // Escalar para que entre cómodo en 600x600 con margen (máx 420 px)
  const maxDim = Math.max(boxW, boxH)
  const scale = Math.min(3.2, 420 / Math.max(1, maxDim))

  const offsetX = (width - boxW * scale) / 2 - minX * scale
  const offsetY = (height - boxH * scale) / 2 - minY * scale

  const tr = (p: { x: number; y: number }) => `${p.x * scale + offsetX},${p.y * scale + offsetY}`

  const strokeColor = keyColor.toUpperCase() === '#00FFFF' ? '#0f172a' : '#ffffff'
  const topFaceFill = keyColor.toUpperCase() === '#00FFFF' ? '#38bdf8' : '#facc15'

  const topFacePoints = `${tr(corners.topP0)} ${tr(corners.topPX)} ${tr(corners.topPXY)} ${tr(corners.topPY)}`
  const bottomFacePoints = `${tr(corners.p0)} ${tr(corners.pX)} ${tr(corners.pXY)} ${tr(corners.pY)}`

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <!-- Fondo clave plano sin gradientes -->
      <rect width="${width}" height="${height}" fill="${keyColor}" />

      <!-- Cara inferior (base) -->
      <polygon points="${bottomFacePoints}"
        fill="none" stroke="${strokeColor}" stroke-width="2" stroke-dasharray="5,5" stroke-opacity="0.6" />

      <!-- Pilares verticales -->
      <line x1="${corners.p0.x * scale + offsetX}" y1="${corners.p0.y * scale + offsetY}"
            x2="${corners.topP0.x * scale + offsetX}" y2="${corners.topP0.y * scale + offsetY}"
            stroke="${strokeColor}" stroke-width="2" stroke-dasharray="5,5" stroke-opacity="0.7" />
      <line x1="${corners.pX.x * scale + offsetX}" y1="${corners.pX.y * scale + offsetY}"
            x2="${corners.topPX.x * scale + offsetX}" y2="${corners.topPX.y * scale + offsetY}"
            stroke="${strokeColor}" stroke-width="2" stroke-dasharray="5,5" stroke-opacity="0.7" />
      <line x1="${corners.pXY.x * scale + offsetX}" y1="${corners.pXY.y * scale + offsetY}"
            x2="${corners.topPXY.x * scale + offsetX}" y2="${corners.topPXY.y * scale + offsetY}"
            stroke="${strokeColor}" stroke-width="2" stroke-dasharray="5,5" stroke-opacity="0.7" />
      <line x1="${corners.pY.x * scale + offsetX}" y1="${corners.pY.y * scale + offsetY}"
            x2="${corners.topPY.x * scale + offsetX}" y2="${corners.topPY.y * scale + offsetY}"
            stroke="${strokeColor}" stroke-width="2" stroke-dasharray="5,5" stroke-opacity="0.7" />

      <!-- Cara superior destacada -->
      <polygon points="${topFacePoints}"
        fill="${topFaceFill}" fill-opacity="0.25"
        stroke="${topFaceFill}" stroke-width="3" />

      <!-- Vértice frontal inferior destacado (anclaje del motor) -->
      <circle cx="${corners.pXY.x * scale + offsetX}" cy="${corners.pXY.y * scale + offsetY}"
        r="6" fill="${topFaceFill}" stroke="${strokeColor}" stroke-width="2" />

      <!-- Rótulos explicativos -->
      <text x="${width / 2}" y="42" text-anchor="middle"
        font-family="sans-serif" font-size="14" font-weight="bold" fill="${strokeColor}">
        ${asset.label.toUpperCase()} (${w} × ${d} × ${h} cm)
      </text>

      <text x="${width / 2}" y="64" text-anchor="middle"
        font-family="sans-serif" font-size="11" font-weight="500" fill="${strokeColor}" fill-opacity="0.85">
        VISTA A (FRENTE HACIA ABAJO-IZQUIERDA) · PROYECCIÓN DIMÉTRICA 2:1
      </text>

      <text x="${corners.pXY.x * scale + offsetX}" y="${corners.pXY.y * scale + offsetY + 24}" text-anchor="middle"
        font-family="sans-serif" font-size="11" font-weight="600" fill="${strokeColor}">
        ▲ VÉRTICE FRONTAL ▲
      </text>
    </svg>
  `
}

async function renderSvgToPng(svgStr: string, outPath: string) {
  const resvg = new Resvg(svgStr, {
    fitTo: { mode: 'original' },
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  fs.writeFileSync(outPath, pngBuffer)
}

async function main() {
  const { targetId } = parseArgs()
  const catalogPath = path.resolve(process.cwd(), 'assets-src', 'assets.json')
  const outDir = path.resolve(process.cwd(), 'assets-src', 'guides')

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const catalog: AssetsCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'))
  const assetKeys = targetId ? [targetId] : Object.keys(catalog)

  console.log(`📐 Generando guías de perspectiva (${assetKeys.length} assets)...`)

  for (const id of assetKeys) {
    const asset = catalog[id]
    if (!asset) {
      console.warn(`⚠️ Asset no encontrado en catalog: ${id}`)
      continue
    }

    if (asset.kind === 'plant') {
      // Guía para fase adulta principal
      const svg = renderPlantGuideSvg(asset, 'fruiting')
      const outPng = path.join(outDir, `${id}.png`)
      await renderSvgToPng(svg, outPng)
      console.log(`  ✅ Guía planta generada: ${path.relative(process.cwd(), outPng)}`)

      // También guías por fase si es el piloto o se pide específicamente
      if (id === 'plant.SQUASH' || targetId) {
        for (const phase of asset.phases) {
          if (phase === 'fruiting') continue
          const phaseSvg = renderPlantGuideSvg(asset, phase)
          const phasePng = path.join(outDir, `${id}-${phase}.png`)
          await renderSvgToPng(phaseSvg, phasePng)
        }
        console.log(`  ✅ Guías de fases para ${id} generadas (${asset.phases.join(', ')})`)
      }
    } else if (asset.kind === 'object') {
      const svg = renderObjectGuideSvg(asset)
      const outPng = path.join(outDir, `${id}.png`)
      await renderSvgToPng(svg, outPng)
      console.log(`  ✅ Guía objeto generada: ${path.relative(process.cwd(), outPng)}`)
    }
  }

  console.log(`🎉 Guías completadas en: ${path.relative(process.cwd(), outDir)}`)
}

main().catch(err => {
  console.error('Error generando guías:', err)
  process.exit(1)
})
