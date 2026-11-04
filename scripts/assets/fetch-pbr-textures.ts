import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

export interface MaterialSpec {
  id: string
  category: 'floors' | 'walls'
  polyhavenId: string
}

export interface MapEntry {
  url: string
  sizeBytes: number
  width: number
  height: number
}

export interface CatalogMaterialEntry {
  id: string
  category: 'floors' | 'walls'
  polyhavenId: string
  source: string
  license: 'CC0-1.0'
  resolution: 1024
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
  { id: 'soil', category: 'floors', polyhavenId: 'brown_mud_02' },
  { id: 'grass', category: 'floors', polyhavenId: 'leafy_grass' },
  { id: 'concrete', category: 'floors', polyhavenId: 'concrete_floor_worn_001' },
  { id: 'gravel', category: 'floors', polyhavenId: 'gravel_floor_02' },
  { id: 'tile', category: 'floors', polyhavenId: 'floor_tiles_06' },
  { id: 'wood', category: 'floors', polyhavenId: 'wood_floor_deck' },
  { id: 'mulch', category: 'floors', polyhavenId: 'bark_brown_02' },
  // Walls
  { id: 'brick', category: 'walls', polyhavenId: 'red_brick' },
  { id: 'concrete', category: 'walls', polyhavenId: 'concrete_wall_008' },
  { id: 'wood_fence', category: 'walls', polyhavenId: 'weathered_planks' },
  { id: 'drywall', category: 'walls', polyhavenId: 'painted_plaster_wall' },
]

const USER_AGENT = 'PlantinAssetPipeline/1.0'
const CONCURRENCY = 4
const MAX_RETRIES = 3

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
    const outputBuf = await sharp(inputBuf)
      .resize(1024, 1024, { fit: 'fill' })
      .webp({ quality: channelSpec.quality })
      .toBuffer()

    await fs.writeFile(outputPath, outputBuf)
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
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    source: 'Poly Haven / MatSynth (CC0-1.0)',
    license: 'CC0-1.0',
    resolution: 1024,
    materials: entries,
  }

  const catalogPath = path.join(publicDir, 'textures', 'catalog.json')
  await fs.writeFile(catalogPath, JSON.stringify(catalog, null, 2) + '\n', 'utf8')
  console.log(`\nCatalog written to ${catalogPath}`)
}

main().catch((err) => {
  console.error('PBR Texture Pipeline failed:', err)
  process.exitCode = 1
})
