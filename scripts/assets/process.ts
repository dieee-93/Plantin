import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { getBoxCorners } from '../../src/features/locations/isometric/catalog/renderers/prismHelper'

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
  anchor?: { x?: number; y?: number }
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
  anchor: { soilY: number | null; x?: number; y?: number; width?: number; height?: number }
}

type AssetEntry = PlantAsset | ObjectAsset
type AssetsCatalog = Record<string, AssetEntry>

function parseArgs() {
  const args = process.argv.slice(2)
  let targetId: string | null = null
  let targetVariant: string | null = null
  let useRembg = false

  for (const arg of args) {
    if (arg.startsWith('--id=')) {
      targetId = arg.split('=')[1].trim()
    } else if (arg.startsWith('--variant=')) {
      targetVariant = arg.split('=')[1].trim()
    } else if (arg === '--rembg') {
      useRembg = true
    }
  }

  return { targetId, targetVariant, useRembg }
}

// Conversión sRGB -> XYZ (D65) -> CIELAB para deltaE perceptual
export function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  let rL = r / 255
  let gL = g / 255
  let bL = b / 255
  rL = rL > 0.04045 ? Math.pow((rL + 0.055) / 1.055, 2.4) : rL / 12.92
  gL = gL > 0.04045 ? Math.pow((gL + 0.055) / 1.055, 2.4) : gL / 12.92
  bL = bL > 0.04045 ? Math.pow((bL + 0.055) / 1.055, 2.4) : bL / 12.92

  const x = (rL * 0.4124564 + gL * 0.3575761 + bL * 0.1804375) / 0.95047
  const y = (rL * 0.2126729 + gL * 0.7151522 + bL * 0.072175) / 1.0
  const z = (rL * 0.0193339 + gL * 0.119192 + bL * 0.9503041) / 1.08883
  return [x, y, z]
}

export function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const fx = f(x)
  const fy = f(y)
  const fz = f(z)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

export function deltaE(l1: [number, number, number], l2: [number, number, number]): number {
  return Math.sqrt((l1[0] - l2[0]) ** 2 + (l1[1] - l2[1]) ** 2 + (l1[2] - l2[2]) ** 2)
}

export interface RemoveBackgroundOptions {
  lowThreshold?: number
  highThreshold?: number
  isCyanKey?: boolean
}

export interface RemoveBackgroundResult {
  rgbaBuffer: Buffer
  width: number
  height: number
  minX: number
  maxX: number
  minY: number
  maxY: number
  touchesBorder: boolean
}

export async function removeBackground(
  imageBuffer: Buffer,
  options: RemoveBackgroundOptions = {}
): Promise<RemoveBackgroundResult> {
  const image = sharp(imageBuffer)
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  const hasNativeAlpha = channels === 4

  // Si ya tiene canal alfa y contiene píxeles transparentes, no aplicamos chroma key
  if (hasNativeAlpha) {
    let transparentCount = 0
    for (let i = 0; i < width * height; i++) {
      if (data[i * 4 + 3] < 240) transparentCount++
    }
    if (transparentCount > width * height * 0.05) {
      let minX = width, maxX = 0, minY = height, maxY = 0
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const a = data[(y * width + x) * 4 + 3]
          if (a > 20) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
      }
      const touchesBorder = minX <= 1 || maxX >= width - 2 || minY <= 1 || maxY >= height - 2
      return {
        rgbaBuffer: data,
        width,
        height,
        minX,
        maxX,
        minY,
        maxY,
        touchesBorder,
      }
    }
  }

  // Muestrear las 4 esquinas (10x10 px cada una) para detectar el color real del fondo
  const cornerSamples: [number, number, number][] = []
  const sampleCorner = (startX: number, startY: number) => {
    for (let y = startY; y < startY + 10; y++) {
      for (let x = startX; x < startX + 10; x++) {
        const idx = (y * width + x) * channels
        cornerSamples.push([data[idx], data[idx + 1], data[idx + 2]])
      }
    }
  }
  sampleCorner(0, 0)
  sampleCorner(width - 10, 0)
  sampleCorner(0, height - 10)
  sampleCorner(width - 10, height - 10)

  const bgRgb = cornerSamples
    .reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0])
    .map(v => Math.round(v / cornerSamples.length)) as [number, number, number]

  const bgLab = xyzToLab(...rgbToXyz(bgRgb[0], bgRgb[1], bgRgb[2]))

  const lowThresh = options.lowThreshold ?? 15
  const highThresh = options.highThreshold ?? 25
  const isCyan = options.isCyanKey ?? false

  const outRgba = Buffer.alloc(width * height * 4)
  let minX = width, maxX = 0, minY = height, maxY = 0

  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * channels
    const dstIdx = i * 4
    let r = data[srcIdx]
    let g = data[srcIdx + 1]
    let b = data[srcIdx + 2]

    const pixLab = xyzToLab(...rgbToXyz(r, g, b))
    const dist = deltaE(pixLab, bgLab)

    let alpha = 255
    if (dist <= lowThresh) {
      alpha = 0
    } else if (dist < highThresh) {
      alpha = Math.round(((dist - lowThresh) / (highThresh - lowThresh)) * 255)
    }

    if (alpha > 0) {
      // Algoritmo Despill (eliminar tinte de color clave en los bordes)
      if (!isCyan) {
        // Despill Magenta: exceso de (R + B) relativo a G
        const excess = Math.max(0, (r + b) / 2 - g)
        if (excess > 0) {
          r = Math.max(0, Math.round(r - excess * 0.75))
          b = Math.max(0, Math.round(b - excess * 0.75))
        }
      } else {
        // Despill Cian: exceso de (G + B) relativo a R
        const excess = Math.max(0, (g + b) / 2 - r)
        if (excess > 0) {
          g = Math.max(0, Math.round(g - excess * 0.75))
          b = Math.max(0, Math.round(b - excess * 0.75))
        }
      }

      if (alpha > 25) {
        const x = i % width
        const y = Math.floor(i / width)
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }

    outRgba[dstIdx] = r
    outRgba[dstIdx + 1] = g
    outRgba[dstIdx + 2] = b
    outRgba[dstIdx + 3] = alpha
  }

  // Suavizado de 1 px en el canal alfa (anti-aliasing)
  const smoothedRgba = Buffer.from(outRgba)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4 + 3
      const currentAlpha = outRgba[idx]
      if (currentAlpha > 0 && currentAlpha < 255) {
        const top = outRgba[((y - 1) * width + x) * 4 + 3]
        const bottom = outRgba[((y + 1) * width + x) * 4 + 3]
        const left = outRgba[(y * width + (x - 1)) * 4 + 3]
        const right = outRgba[(y * width + (x + 1)) * 4 + 3]
        smoothedRgba[idx] = Math.round((currentAlpha * 2 + top + bottom + left + right) / 6)
      }
    }
  }

  const touchesBorder = minX <= 1 || maxX >= width - 2 || minY <= 1 || maxY >= height - 2

  return {
    rgbaBuffer: smoothedRgba,
    width,
    height,
    minX: Math.max(0, minX),
    maxX: Math.min(width - 1, maxX),
    minY: Math.max(0, minY),
    maxY: Math.min(height - 1, maxY),
    touchesBorder,
  }
}

export async function compressToWebP(
  inputBuffer: Buffer,
  maxSizeBytes = 30 * 1024
): Promise<{ buffer: Buffer; quality: number; sizeBytes: number }> {
  let quality = 85
  let outBuf: Buffer = await sharp(inputBuffer)
    .webp({ quality, alphaQuality: 100, effort: 6 })
    .toBuffer()

  while (outBuf.length > maxSizeBytes && quality > 65) {
    quality -= 5
    outBuf = await sharp(inputBuffer)
      .webp({ quality, alphaQuality: 100, effort: 6 })
      .toBuffer()
  }

  return { buffer: outBuf, quality, sizeBytes: outBuf.length }
}

async function processPlantVariant(
  assetId: string,
  asset: PlantAsset,
  variantFile: string,
  variantName: string,
  inboxPath: string
) {
  console.log(`🌿 Procesando planta: ${assetId} [${variantName}]...`)
  const rawFileBuf = fs.readFileSync(path.join(inboxPath, variantFile))

  const isCyan = (asset.keyColor || '').toUpperCase() === '#00FFFF'
  const keyResult = await removeBackground(rawFileBuf, { isCyanKey: isCyan })

  if (keyResult.touchesBorder) {
    console.warn(`  ⚠️ Advertencia: el sujeto toca el borde de la imagen en ${variantFile}.`)
  }

  const cropW = keyResult.maxX - keyResult.minX + 1
  const cropH = keyResult.maxY - keyResult.minY + 1

  if (cropW <= 0 || cropH <= 0) {
    throw new Error(`Bounding box inválido para ${variantFile}: ${cropW}x${cropH}`)
  }

  // Recortar al bounding box
  const croppedRgba = await sharp(keyResult.rgbaBuffer, {
    raw: { width: keyResult.width, height: keyResult.height, channels: 4 },
  })
    .extract({
      left: keyResult.minX,
      top: keyResult.minY,
      width: cropW,
      height: cropH,
    })
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Encontrar el punto de base (fila inferior con alfa > 128, promedio X)
  let baseSumX = 0
  let baseCount = 0
  const bottomRows = Math.max(2, Math.floor(cropH * 0.04))
  const startY = cropH - bottomRows

  for (let y = startY; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const a = croppedRgba.data[(y * cropW + x) * 4 + 3]
      if (a > 128) {
        baseSumX += x
        baseCount++
      }
    }
  }
  const baseX = baseCount > 0 ? baseSumX / baseCount : cropW / 2
  const baseY = cropH - 1

  // Proporción por fase BBCH
  const phaseScaleMap: Record<string, number> = {
    germination: 0.25,
    leaf: 0.45,
    structure: 0.72,
    flowering: 0.9,
    fruiting: 1.0,
  }
  const phaseScale = phaseScaleMap[variantName] ?? 1.0

  const targetHeightPx = Math.round(asset.targetHeightUnits * phaseScale * 3)
  const maxDisplayWidthPx = Math.round(asset.displayWidthUnits * 3)

  let scale = targetHeightPx / cropH
  if (cropW * scale > maxDisplayWidthPx) {
    scale = maxDisplayWidthPx / cropW
  }

  const scaledW = Math.max(1, Math.round(cropW * scale))
  const scaledH = Math.max(1, Math.round(cropH * scale))

  const resizedBuffer = await sharp(croppedRgba.data, {
    raw: { width: cropW, height: cropH, channels: 4 },
  })
    .resize(scaledW, scaledH, { fit: 'fill' })
    .png()
    .toBuffer()

  // Lienzo transparente constante para todas las fases del cultivo
  const canvasW = Math.round(asset.displayWidthUnits * 3)
  const canvasH = Math.round(asset.targetHeightUnits * 3)

  // Alinear base en (canvasW / 2, canvasH)
  const targetBaseX = canvasW / 2
  const targetBaseY = canvasH

  const left = Math.round(targetBaseX - baseX * scale)
  const top = Math.round(targetBaseY - baseY * scale)

  const compositeCanvas = await sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: resizedBuffer,
        left: Math.max(0, Math.min(canvasW - scaledW, left)),
        top: Math.max(0, Math.min(canvasH - scaledH, top)),
      },
    ])
    .png()
    .toBuffer()

  // Comprimir a WebP con presupuesto ≤ 30 KB
  const { buffer: webpBuf, quality, sizeBytes } = await compressToWebP(compositeCanvas)

  // Guardar en directorio final de la app y en out/
  const appAssetDir = path.resolve(
    process.cwd(),
    'src',
    'features',
    'locations',
    'isometric',
    'renderers',
    'raster',
    'assets'
  )
  if (!fs.existsSync(appAssetDir)) {
    fs.mkdirSync(appAssetDir, { recursive: true })
  }

  const outAssetDir = path.resolve(process.cwd(), 'assets-src', 'out', assetId)
  if (!fs.existsSync(outAssetDir)) {
    fs.mkdirSync(outAssetDir, { recursive: true })
  }

  const appWebpPath = path.join(appAssetDir, `${asset.cropCode.toLowerCase()}-${variantName}.webp`)
  const outWebpPath = path.join(outAssetDir, `${variantName}.webp`)
  const thumbPath = path.join(outAssetDir, `${variantName}.thumb.png`)

  fs.writeFileSync(appWebpPath, webpBuf)
  fs.writeFileSync(outWebpPath, webpBuf)

  // Generar miniatura de control a 1x (dividir por 3)
  await sharp(compositeCanvas)
    .resize(Math.round(canvasW / 3), Math.round(canvasH / 3))
    .png()
    .toFile(thumbPath)

  console.log(
    `  ✅ WebP guardado: ${path.relative(process.cwd(), appWebpPath)} (${(sizeBytes / 1024).toFixed(1)} KB, Q${quality})`
  )
  console.log(`  🖼️ Miniatura 1x: ${path.relative(process.cwd(), thumbPath)}`)
}

async function processObjectVariant(
  assetId: string,
  asset: ObjectAsset,
  variantFile: string,
  variantName: string,
  inboxPath: string
) {
  console.log(`📦 Procesando objeto: ${assetId} [${variantName}]...`)
  const rawFileBuf = fs.readFileSync(path.join(inboxPath, variantFile))

  const isCyan = (asset.keyColor || '').toUpperCase() === '#00FFFF'
  const keyResult = await removeBackground(rawFileBuf, { isCyanKey: isCyan })

  if (keyResult.touchesBorder) {
    console.warn(`  ⚠️ Advertencia: el objeto toca el borde de la imagen en ${variantFile}.`)
  }

  const cropW = keyResult.maxX - keyResult.minX + 1
  const cropH = keyResult.maxY - keyResult.minY + 1

  const croppedRgba = await sharp(keyResult.rgbaBuffer, {
    raw: { width: keyResult.width, height: keyResult.height, channels: 4 },
  })
    .extract({
      left: keyResult.minX,
      top: keyResult.minY,
      width: cropW,
      height: cropH,
    })
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Proyección de la huella
  const { w, d, h } = asset.footprint
  const corners = getBoxCorners(w, d, h)
  const allCorners = [
    corners.p0, corners.pX, corners.pXY, corners.pY,
    corners.topP0, corners.topPX, corners.topPXY, corners.topPY,
  ]
  const minX = Math.min(...allCorners.map(p => p.x))
  const maxX = Math.max(...allCorners.map(p => p.x))

  const projectedW = maxX - minX // unidades SVG
  const targetW_px = Math.round(projectedW * 3)

  const scale = targetW_px / cropW
  const scaledW = targetW_px
  const scaledH = Math.round(cropH * scale)

  const resizedBuffer = await sharp(croppedRgba.data, {
    raw: { width: cropW, height: cropH, channels: 4 },
  })
    .resize(scaledW, scaledH, { fit: 'fill' })
    .png()
    .toBuffer()

  const { buffer: webpBuf, quality, sizeBytes } = await compressToWebP(resizedBuffer)

  // Guardar en catálogo raster y en out/
  const appAssetDir = path.resolve(
    process.cwd(),
    'src',
    'features',
    'locations',
    'isometric',
    'catalog',
    'raster',
    'assets'
  )
  if (!fs.existsSync(appAssetDir)) {
    fs.mkdirSync(appAssetDir, { recursive: true })
  }

  const outAssetDir = path.resolve(process.cwd(), 'assets-src', 'out', assetId)
  if (!fs.existsSync(outAssetDir)) {
    fs.mkdirSync(outAssetDir, { recursive: true })
  }

  const appWebpPath = path.join(appAssetDir, `${asset.typeId}.webp`)
  const outWebpPath = path.join(outAssetDir, `${asset.typeId}.webp`)
  const thumbPath = path.join(outAssetDir, `${asset.typeId}.thumb.png`)

  fs.writeFileSync(appWebpPath, webpBuf)
  fs.writeFileSync(outWebpPath, webpBuf)

  // Generar miniatura 1x
  await sharp(resizedBuffer)
    .resize(Math.round(scaledW / 3), Math.round(scaledH / 3))
    .png()
    .toFile(thumbPath)

  // Calcular anclajes en unidades SVG
  const svgW = Math.round(scaledW / 3)
  const svgH = Math.round(scaledH / 3)
  const anchorX = Math.round(-svgW / 2)
  const anchorY = Math.round(corners.pXY.y - svgH)
  // Nivel de sustrato: centro geométrico de la cara superior de la huella
  const topCenterY = (corners.topP0.y + corners.topPXY.y) / 2
  const soilY = asset.category === 'container' ? Math.round(topCenterY + 1) : null

  asset.anchor = {
    x: anchorX,
    y: anchorY,
    width: svgW,
    height: svgH,
    soilY,
  }

  console.log(
    `  ✅ WebP guardado: ${path.relative(process.cwd(), appWebpPath)} (${(sizeBytes / 1024).toFixed(1)} KB, Q${quality})`
  )
  console.log(`  📐 Metadatos anclaje: size ${svgW}×${svgH}, anchor (${anchorX}, ${anchorY}), soilY: ${soilY}`)
}

async function main() {
  const { targetId, targetVariant } = parseArgs()
  const root = process.cwd()
  const inboxDir = path.join(root, 'assets-src', 'inbox')
  const catalogPath = path.join(root, 'assets-src', 'assets.json')

  if (!fs.existsSync(catalogPath)) {
    throw new Error(`No se encontró ${catalogPath}`)
  }

  const catalog: AssetsCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'))

  if (!fs.existsSync(inboxDir)) {
    console.log('Directorio inbox vacío. Nada para procesar.')
    return
  }

  const entries = fs.readdirSync(inboxDir, { withFileTypes: true })
  const assetDirs = entries.filter(e => e.isDirectory()).map(e => e.name)

  console.log(`🚀 Iniciando procesamiento de inbox (${assetDirs.length} carpetas detectadas)...`)

  for (const assetId of assetDirs) {
    if (targetId && assetId !== targetId) continue
    const asset = catalog[assetId]
    if (!asset) {
      console.warn(`⚠️ Asset ${assetId} en inbox no existe en assets.json. Omitiendo.`)
      continue
    }

    const folderPath = path.join(inboxDir, assetId)
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.png'))

    // Filtrar archivos si hay variantes transparentes preferibles
    // ej. pot_5l_transparent.png sobre pot_5l.png
    const transparentFiles = files.filter(f => f.includes('transparent'))
    const filesToProcess = transparentFiles.length > 0 ? transparentFiles : files

    for (const f of filesToProcess) {
      const rawName = f.replace('.png', '').replace('_transparent', '')
      if (targetVariant && rawName !== targetVariant) continue

      if (asset.kind === 'plant') {
        await processPlantVariant(assetId, asset, f, rawName, folderPath)
        if (asset.status && typeof asset.status === 'object') {
          asset.status[rawName] = 'generated'
        }
      } else if (asset.kind === 'object') {
        await processObjectVariant(assetId, asset, f, rawName, folderPath)
        asset.status = 'generated'
      }
    }
  }

  // Guardar catálogo con estados y anclajes actualizados
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8')
  console.log('✅ assets.json actualizado con estados y anclajes normalizados.')
}

if (process.argv[1] && process.argv[1].endsWith('process.ts')) {
  main().catch(err => {
    console.error('❌ Error en process.ts:', err)
    process.exit(1)
  })
}
