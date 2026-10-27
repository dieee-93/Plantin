import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

interface CropConfig {
  label?: string
  stages: Record<string, string>
}

async function buildSprites() {
  const args = process.argv.slice(2)
  const prune = args.includes('--prune')
  const cropsJsonPath = path.resolve(process.cwd(), 'assets-src', 'crops.json')
  const outDir = path.resolve(process.cwd(), 'assets-src', 'out')
  const targetDir = path.resolve(
    process.cwd(),
    'src',
    'features',
    'locations',
    'isometric',
    'renderers',
    'raster',
    'assets'
  )

  if (!fs.existsSync(cropsJsonPath)) {
    throw new Error(`No se encontró ${cropsJsonPath}`)
  }

  const cropsConfig: Record<string, CropConfig> = JSON.parse(
    fs.readFileSync(cropsJsonPath, 'utf-8')
  )
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  console.log('\n🌿 Procesando sprites PNG → WebP (con sharp)...')
  console.log(`📁 Destino: ${targetDir}\n`)

  const tableRows: Array<{
    crop: string
    phase: string
    file: string
    kb: string
    status: string
  }> = []

  const generatedFiles = new Set<string>()

  for (const [cropCode, cfg] of Object.entries(cropsConfig)) {
    const cropOutDir = path.join(outDir, cropCode)
    if (!fs.existsSync(cropOutDir)) {
      console.log(`⚠️ Directorio de salida no encontrado para ${cropCode}: ${cropOutDir}`)
      continue
    }

    const phases = Object.keys(cfg.stages)
    for (const phase of phases) {
      const pngPath = path.join(cropOutDir, `${phase}.png`)
      if (!fs.existsSync(pngPath)) {
        tableRows.push({
          crop: cropCode,
          phase,
          file: '-',
          kb: '-',
          status: '❌ PNG no existe',
        })
        continue
      }

      const image = sharp(pngPath)
      const metadata = await image.metadata()

      // 1. Verificar resolución 160×200 y canal alfa
      if (metadata.width !== 160 || metadata.height !== 200) {
        throw new Error(
          `Resolución inválida para ${pngPath}: esperado 160x200, obtenido ${metadata.width}x${metadata.height}`
        )
      }
      if (!metadata.hasAlpha) {
        throw new Error(`El archivo ${pngPath} no contiene canal alfa transparente.`)
      }

      // 2. Verificar anclaje: fila inferior con alfa > 0 debe estar en y >= 196
      const rawPixels = await image.raw().toBuffer()
      const width = 160
      const height = 200
      const channels = metadata.channels || 4

      let lowestAlphaY = -1
      for (let y = height - 1; y >= 0; y--) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * channels
          const alpha = rawPixels[idx + 3]
          if (alpha > 10) {
            lowestAlphaY = y
            break
          }
        }
        if (lowestAlphaY !== -1) break
      }

      if (lowestAlphaY < 196) {
        throw new Error(
          `Anclaje fuera de tolerancia en ${pngPath}: base detectada en y = ${lowestAlphaY} (requerido: y >= 196).`
        )
      }

      // 3. Conversión a WebP con control de presupuesto (<= 20 KB)
      const outFileName = `${cropCode.toLowerCase()}-${phase}.webp`
      const outWebpPath = path.join(targetDir, outFileName)
      generatedFiles.add(outFileName)

      let quality = 85
      let webpBuf: Buffer | null = null

      while (quality >= 70) {
        webpBuf = await sharp(pngPath)
          .webp({
            quality,
            alphaQuality: 100,
            effort: 6,
          })
          .toBuffer()

        if (webpBuf.length <= 20 * 1024) {
          break
        }
        quality -= 5
      }

      if (!webpBuf || webpBuf.length > 20 * 1024) {
        throw new Error(
          `Presupuesto excedido para ${outFileName}: ${Math.round((webpBuf?.length || 0) / 1024)} KB > 20 KB`
        )
      }

      fs.writeFileSync(outWebpPath, webpBuf)
      const finalKb = (webpBuf.length / 1024).toFixed(1)

      tableRows.push({
        crop: cropCode,
        phase,
        file: outFileName,
        kb: `${finalKb} KB`,
        status: `✅ OK (base y=${lowestAlphaY}, q=${quality})`,
      })
    }
  }

  // Opcional: --prune borra WebP que ya no estén en crops.json
  if (prune) {
    const existingWebps = fs
      .readdirSync(targetDir)
      .filter(f => f.endsWith('.webp'))
    for (const f of existingWebps) {
      if (!generatedFiles.has(f)) {
        fs.unlinkSync(path.join(targetDir, f))
        console.log(`🧹 Podado asset huérfano: ${f}`)
      }
    }
  }

  console.table(tableRows)
  console.log('🎉 Todos los sprites WebP fueron generados y verificados exitosamente.\n')
}

buildSprites().catch(err => {
  console.error('❌ Error en build-sprites:', err)
  process.exit(1)
})
