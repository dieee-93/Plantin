import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

export interface ColorGradingSpec {
  brightness: number
  saturation: number
  rgbScale?: [number, number, number]
}

export interface MaterialSpec {
  id: string
  category: 'floors' | 'walls'
  polyhavenId: string
  macroEqualizeStrength?: number
  colorGrading?: ColorGradingSpec
}

export interface CatalogMaterialEntry {
  id: string
  category: 'floors' | 'walls'
  polyhavenId: string
  source: string
  license: 'CC0-1.0'
  resolution: 1024
  macroEqualized: boolean
  maps: {
    albedo: string
    normal: string
    arm: string
  }
  sizes: {
    albedo: number
    normal: number
    arm: number
  }
  sizeBytes: number
}

export interface TextureCatalog {
  version: string
  generatedAt: string
  source: string
  license: 'CC0-1.0'
  resolution: 1024
  materials: CatalogMaterialEntry[]
}

const MATERIALS: MaterialSpec[] = [
  // Floors
  {
    id: 'soil',
    category: 'floors',
    polyhavenId: 'brown_mud_02',
    macroEqualizeStrength: 0.78,
    colorGrading: {
      brightness: 1.22,
      saturation: 1.35,
      rgbScale: [1.12, 1.02, 0.88],
    },
  },
  {
    id: 'grass',
    category: 'floors',
    polyhavenId: 'leafy_grass',
    macroEqualizeStrength: 0.78,
    colorGrading: {
      brightness: 1.12,
      saturation: 1.25,
    },
  },
  {
    id: 'concrete',
    category: 'floors',
    polyhavenId: 'concrete_pavement',
    macroEqualizeStrength: 0.55,
    colorGrading: {
      brightness: 1.12,
      saturation: 1.08,
      rgbScale: [1.04, 1.02, 0.95],
    },
  },
  {
    id: 'gravel',
    category: 'floors',
    polyhavenId: 'gravel_floor_02',
    macroEqualizeStrength: 0.78,
    colorGrading: {
      brightness: 1.12,
      saturation: 1.08,
      rgbScale: [1.04, 1.02, 0.95],
    },
  },
  {
    id: 'tile',
    category: 'floors',
    polyhavenId: 'patio_tiles',
    macroEqualizeStrength: 0.55,
  },
  { id: 'wood', category: 'floors', polyhavenId: 'wood_floor_deck' },
  { id: 'mulch', category: 'floors', polyhavenId: 'bark_brown_02', macroEqualizeStrength: 0.78 },
  // Walls
  { id: 'brick', category: 'walls', polyhavenId: 'red_brick' },
  {
    id: 'concrete',
    category: 'walls',
    polyhavenId: 'concrete_wall_008',
    macroEqualizeStrength: 0.55,
  },
  { id: 'wood_fence', category: 'walls', polyhavenId: 'weathered_planks' },
  { id: 'drywall', category: 'walls', polyhavenId: 'painted_plaster_wall' },
]

const USER_AGENT = 'PlantinAssetPipeline/1.0'
const CONCURRENCY = 4
const MAX_RETRIES = 3
const TILE_SIZE = 1024
const MACRO_BLUR_SIGMA = 48

type ChannelKey = 'diff' | 'nor_gl' | 'arm'
type OutputMapName = 'albedo' | 'normal' | 'arm'

const CHANNEL_SPECS: Array<{
  channel: ChannelKey
  apiKeys: string[]
  outputName: OutputMapName
  quality: number
}> = [
  { channel: 'diff', apiKeys: ['Diffuse', 'diff', 'col', 'albedo'], outputName: 'albedo', quality: 88 },
  { channel: 'nor_gl', apiKeys: ['nor_gl', 'Normal (GL)'], outputName: 'normal', quality: 88 },
  { channel: 'arm', apiKeys: ['arm', 'ARM'], outputName: 'arm', quality: 85 },
]

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function writeFileWithRetry(
  filePath: string,
  data: Buffer | string,
  retries = 5,
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await fs.writeFile(filePath, data)
      return
    } catch (err) {
      if (attempt === retries) throw err
      await sleep(150 * attempt)
    }
  }
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  let lastError: unknown
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: '*/*',
        },
      })
      if (response.ok) {
        return response
      }
      if (response.status === 404) {
        throw new Error(`HTTP 404 Not Found: ${url}`)
      }
      lastError = new Error(`HTTP ${response.status} ${response.statusText} for ${url}`)
    } catch (err) {
      lastError = err
      if (err instanceof Error && err.message.includes('HTTP 404')) {
        throw err
      }
    }
    if (attempt < retries) {
      await sleep(400 * attempt)
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

type PolyHavenFilesApi = Record<
  string,
  Record<
    string,
    Record<
      string,
      {
        url?: string
      }
    >
  >
>

const apiCache = new Map<string, PolyHavenFilesApi>()

async function resolveFallbackUrl(polyhavenId: string, apiKeys: string[]): Promise<string> {
  let data = apiCache.get(polyhavenId)
  if (!data) {
    const apiUrl = `https://api.polyhaven.com/files/${polyhavenId}`
    const res = await fetchWithRetry(apiUrl)
    data = (await res.json()) as PolyHavenFilesApi
    apiCache.set(polyhavenId, data)
  }

  for (const key of apiKeys) {
    const channelNode = data[key]
    if (!channelNode) continue
    const resNode = channelNode['1k'] ?? channelNode['2k']
    if (!resNode) continue
    const formatNode = resNode['jpg'] ?? resNode['png']
    if (formatNode?.url) {
      return formatNode.url
    }
  }

  throw new Error(
    `Could not resolve fallback URL from Poly Haven API for ${polyhavenId} (keys: ${apiKeys.join(', ')})`,
  )
}

async function downloadChannelBuffer(
  polyhavenId: string,
  channel: ChannelKey,
  apiKeys: string[],
): Promise<Buffer> {
  const directUrl = `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/${polyhavenId}/${polyhavenId}_${channel}_1k.jpg`
  try {
    const res = await fetchWithRetry(directUrl)
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    console.warn(`[Fallback] Direct URL failed for ${polyhavenId}/${channel}, querying Poly Haven API...`)
    const fallbackUrl = await resolveFallbackUrl(polyhavenId, apiKeys)
    const res = await fetchWithRetry(fallbackUrl)
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }
}

function clampByte(val: number): number {
  if (val <= 0) return 0
  if (val >= 255) return 255
  return Math.round(val)
}

/**
 * Computes the standard deviation of mean luminance across a 4x4 grid of macro patches (256x256 each)
 * and across 2x2 quadrants (512x512 each) to quantify macro brightness variance.
 */
function computeMacroLumaStats(rawRgb: Buffer, size = TILE_SIZE): {
  quadrantStdDev: number
  grid4x4StdDev: number
  quadrantSpread: number
  meanRgb: [number, number, number]
} {
  let totalR = 0
  let totalG = 0
  let totalB = 0
  const totalPixels = size * size
  for (let i = 0; i < rawRgb.length; i += 3) {
    totalR += rawRgb[i]!
    totalG += rawRgb[i + 1]!
    totalB += rawRgb[i + 2]!
  }

  const calcPatchStdDev = (gridCount: number): { stdDev: number; spread: number } => {
    const patchSize = size / gridCount
    const means: number[] = []
    for (let gy = 0; gy < gridCount; gy++) {
      for (let gx = 0; gx < gridCount; gx++) {
        let sumLuma = 0
        const startY = gy * patchSize
        const startX = gx * patchSize
        for (let y = startY; y < startY + patchSize; y++) {
          const rowOffset = y * size * 3
          for (let x = startX; x < startX + patchSize; x++) {
            const idx = rowOffset + x * 3
            const r = rawRgb[idx]!
            const g = rawRgb[idx + 1]!
            const b = rawRgb[idx + 2]!
            sumLuma += 0.299 * r + 0.587 * g + 0.114 * b
          }
        }
        means.push(sumLuma / (patchSize * patchSize))
      }
    }
    const avg = means.reduce((a, b) => a + b, 0) / means.length
    const variance = means.reduce((acc, m) => acc + (m - avg) ** 2, 0) / means.length
    const min = Math.min(...means)
    const max = Math.max(...means)
    return { stdDev: Math.sqrt(variance), spread: max - min }
  }

  const q2 = calcPatchStdDev(2)
  const q4 = calcPatchStdDev(4)
  return {
    quadrantStdDev: q2.stdDev,
    quadrantSpread: q2.spread,
    grid4x4StdDev: q4.stdDev,
    meanRgb: [
      Math.round(totalR / totalPixels),
      Math.round(totalG / totalPixels),
      Math.round(totalB / totalPixels),
    ],
  }
}

/**
 * Seamless Low-Frequency Equalization (High-Pass Macro Normalization) + Optional Warm Color Grading:
 * 1. Resizes input buffer to 1024x1024 RGB raw bytes.
 * 2. If strength is defined, builds a 3072x3072 (3x3 tiled) wrap-around image, applies Gaussian blur(48),
 *    and extracts the central 1024x1024 block so edges remain 100% seamless, then attenuates macro blotches.
 * 3. If colorGrading is defined, applies brightness/saturation modulation and warm RGB channel scaling.
 */
async function processAlbedoMap(
  inputBuf: Buffer,
  spec: MaterialSpec,
  quality: number,
): Promise<Buffer> {
  const label = `${spec.category}/${spec.id}`
  let workingRaw: Buffer = await sharp(inputBuf)
    .resize(TILE_SIZE, TILE_SIZE, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer()

  if (spec.macroEqualizeStrength !== undefined) {
    const strength = spec.macroEqualizeStrength
    const beforeStats = computeMacroLumaStats(workingRaw, TILE_SIZE)

    // Build 3x3 wrap-around canvas (3072x3072x3)
    const tiledSize = TILE_SIZE * 3
    const rowBytes = TILE_SIZE * 3
    const tiledRowBytes = tiledSize * 3
    const tiledBuf = Buffer.allocUnsafe(tiledSize * tiledSize * 3)

    for (let y = 0; y < TILE_SIZE; y++) {
      const srcStart = y * rowBytes
      const srcEnd = srcStart + rowBytes
      for (let ty = 0; ty < 3; ty++) {
        const dstY = ty * TILE_SIZE + y
        const dstRowOffset = dstY * tiledRowBytes
        workingRaw.copy(tiledBuf, dstRowOffset, srcStart, srcEnd)
        workingRaw.copy(tiledBuf, dstRowOffset + rowBytes, srcStart, srcEnd)
        workingRaw.copy(tiledBuf, dstRowOffset + rowBytes * 2, srcStart, srcEnd)
      }
    }

    const blurredCenterRaw = await sharp(tiledBuf, {
      raw: { width: tiledSize, height: tiledSize, channels: 3 },
    })
      .blur(MACRO_BLUR_SIGMA)
      .extract({ left: TILE_SIZE, top: TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE })
      .raw()
      .toBuffer()

    const pixelCount = TILE_SIZE * TILE_SIZE
    let sumR = 0
    let sumG = 0
    let sumB = 0
    for (let i = 0; i < workingRaw.length; i += 3) {
      sumR += workingRaw[i]!
      sumG += workingRaw[i + 1]!
      sumB += workingRaw[i + 2]!
    }
    const meanR = sumR / pixelCount
    const meanG = sumG / pixelCount
    const meanB = sumB / pixelCount

    const outRaw = Buffer.allocUnsafe(workingRaw.length)
    for (let i = 0; i < workingRaw.length; i += 3) {
      outRaw[i] = clampByte(workingRaw[i]! - strength * (blurredCenterRaw[i]! - meanR))
      outRaw[i + 1] = clampByte(workingRaw[i + 1]! - strength * (blurredCenterRaw[i + 1]! - meanG))
      outRaw[i + 2] = clampByte(workingRaw[i + 2]! - strength * (blurredCenterRaw[i + 2]! - meanB))
    }

    workingRaw = outRaw
    const afterStats = computeMacroLumaStats(workingRaw, TILE_SIZE)
    console.log(
      `[De-light] ${label} (strength=${strength}) | 2x2 Quadrant StdDev: ${beforeStats.quadrantStdDev.toFixed(2)} -> ${afterStats.quadrantStdDev.toFixed(2)} (spread ${beforeStats.quadrantSpread.toFixed(2)} -> ${afterStats.quadrantSpread.toFixed(2)}) | 4x4 Patch StdDev: ${beforeStats.grid4x4StdDev.toFixed(2)} -> ${afterStats.grid4x4StdDev.toFixed(2)}`,
    )
  }

  if (spec.colorGrading) {
    const { brightness, saturation, rgbScale } = spec.colorGrading
    const modulatedRaw = await sharp(workingRaw, {
      raw: { width: TILE_SIZE, height: TILE_SIZE, channels: 3 },
    })
      .modulate({ brightness, saturation })
      .raw()
      .toBuffer()

    if (rgbScale) {
      const [rMul, gMul, bMul] = rgbScale
      for (let i = 0; i < modulatedRaw.length; i += 3) {
        modulatedRaw[i] = clampByte(modulatedRaw[i]! * rMul)
        modulatedRaw[i + 1] = clampByte(modulatedRaw[i + 1]! * gMul)
        modulatedRaw[i + 2] = clampByte(modulatedRaw[i + 2]! * bMul)
      }
    }
    workingRaw = modulatedRaw
    const gradedStats = computeMacroLumaStats(workingRaw, TILE_SIZE)
    console.log(
      `[ColorGrade] ${label} -> meanRGB=(${gradedStats.meanRgb.join(', ')}) (brightness=${brightness}, saturation=${saturation}${rgbScale ? `, rgbScale=[${rgbScale.join(',')}]` : ''})`,
    )
  }

  return sharp(workingRaw, {
    raw: { width: TILE_SIZE, height: TILE_SIZE, channels: 3 },
  })
    .webp({ quality })
    .toBuffer()
}

/**
 * Matte Roughness Floor in ARM map (R = Ambient Occlusion, G = Roughness, B = Metalness):
 * Ensures every pixel has G >= 200 (roughness >= 0.78) via G = Math.max(200, Math.round(200 + (G / 255) * 55))
 * and B = 0 (metalness = 0), preserving channel R (AO) intact to prevent specular glare in orthographic camera.
 */
async function processArmMap(inputBuf: Buffer, quality: number): Promise<Buffer> {
  const armRaw = await sharp(inputBuf)
    .resize(TILE_SIZE, TILE_SIZE, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer()

  for (let i = 0; i < armRaw.length; i += 3) {
    const g = armRaw[i + 1]!
    armRaw[i + 1] = clampByte(Math.max(200, Math.round(200 + (g / 255) * 55)))
    armRaw[i + 2] = 0
  }

  return sharp(armRaw, {
    raw: { width: TILE_SIZE, height: TILE_SIZE, channels: 3 },
  })
    .webp({ quality })
    .toBuffer()
}

async function processMaterial(
  spec: MaterialSpec,
  publicDir: string,
): Promise<CatalogMaterialEntry> {
  const targetDir = path.join(publicDir, 'textures', spec.category, spec.id)
  await fs.mkdir(targetDir, { recursive: true })

  const sizes: Record<OutputMapName, number> = {
    albedo: 0,
    normal: 0,
    arm: 0,
  }

  for (const channelSpec of CHANNEL_SPECS) {
    const inputBuf = await downloadChannelBuffer(
      spec.polyhavenId,
      channelSpec.channel,
      channelSpec.apiKeys,
    )

    const outputPath = path.join(targetDir, `${channelSpec.outputName}.webp`)
    let outputBuf: Buffer

    if (channelSpec.outputName === 'albedo') {
      outputBuf = await processAlbedoMap(inputBuf, spec, channelSpec.quality)
    } else if (channelSpec.outputName === 'arm') {
      outputBuf = await processArmMap(inputBuf, channelSpec.quality)
    } else {
      outputBuf = await sharp(inputBuf)
        .resize(TILE_SIZE, TILE_SIZE, { fit: 'fill' })
        .webp({ quality: channelSpec.quality })
        .toBuffer()
    }

    await writeFileWithRetry(outputPath, outputBuf)
    sizes[channelSpec.outputName] = outputBuf.byteLength
  }

  const basePublicPath = `/textures/${spec.category}/${spec.id}`
  const totalBytes = sizes.albedo + sizes.normal + sizes.arm

  console.log(
    `[OK] ${spec.category}/${spec.id} (${spec.polyhavenId}) -> albedo: ${(sizes.albedo / 1024).toFixed(1)}KB, normal: ${(sizes.normal / 1024).toFixed(1)}KB, arm: ${(sizes.arm / 1024).toFixed(1)}KB`,
  )

  return {
    id: spec.id,
    category: spec.category,
    polyhavenId: spec.polyhavenId,
    source: `https://polyhaven.com/a/${spec.polyhavenId}`,
    license: 'CC0-1.0',
    resolution: 1024,
    macroEqualized: spec.macroEqualizeStrength !== undefined,
    maps: {
      albedo: `${basePublicPath}/albedo.webp`,
      normal: `${basePublicPath}/normal.webp`,
      arm: `${basePublicPath}/arm.webp`,
    },
    sizes,
    sizeBytes: totalBytes,
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let nextIndex = 0

  async function runner(): Promise<void> {
    while (nextIndex < items.length) {
      const current = nextIndex++
      results[current] = await worker(items[current]!, current)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runner())
  await Promise.all(workers)
  return results
}

async function main(): Promise<void> {
  const rootDir = process.cwd()
  const publicDir = path.join(rootDir, 'public')

  console.log(`Starting PBR Texture Pipeline (${MATERIALS.length} materials, concurrency=${CONCURRENCY})...`)
  const entries = await runWithConcurrency(MATERIALS, CONCURRENCY, (spec) =>
    processMaterial(spec, publicDir),
  )

  const catalog: TextureCatalog = {
    version: '1.2.0',
    generatedAt: new Date().toISOString(),
    source: 'Poly Haven / MatSynth (CC0-1.0)',
    license: 'CC0-1.0',
    resolution: 1024,
    materials: entries,
  }

  const catalogPath = path.join(publicDir, 'textures', 'catalog.json')
  await writeFileWithRetry(catalogPath, JSON.stringify(catalog, null, 2) + '\n')
  console.log(`\nCatalog written to ${catalogPath}`)
}

main().catch((err) => {
  console.error('PBR Texture Pipeline failed:', err)
  process.exitCode = 1
})
