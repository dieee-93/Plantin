import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

function findBlenderPath(): string {
  if (process.env.BLENDER_PATH) {
    return process.env.BLENDER_PATH
  }

  const windowsAppsDir = path.resolve(
    process.env.LOCALAPPDATA || '',
    'Microsoft',
    'WindowsApps'
  )
  try {
    if (
      fs.existsSync(windowsAppsDir) &&
      fs.readdirSync(windowsAppsDir).includes('blender-launcher.exe')
    ) {
      return path.join(windowsAppsDir, 'blender-launcher.exe')
    }
  } catch {
    // ignorar error de lectura en WindowsApps
  }

  const standardPath = 'C:\\Program Files\\Blender Foundation\\Blender\\blender.exe'
  if (fs.existsSync(standardPath)) {
    return standardPath
  }

  return 'blender'
}

async function renderAll() {
  const args = process.argv.slice(2)
  let filterCrop: string | null = null
  let calibrateOnly = false

  for (const arg of args) {
    if (arg.startsWith('--crop=')) {
      filterCrop = arg.split('=')[1].toUpperCase()
    } else if (arg === '--calibrate') {
      calibrateOnly = true
    }
  }

  const blender = findBlenderPath()
  console.log(`🌿 Usando ejecutable de Blender: ${blender}`)

  const rootDir = process.cwd()
  const cropsJsonPath = path.resolve(rootDir, 'assets-src', 'crops.json')
  const outDir = path.resolve(rootDir, 'assets-src', 'out')
  const renderCropPy = path.resolve(rootDir, 'scripts', 'blender', 'render_crop.py')

  if (calibrateOnly) {
    console.log('🎯 Ejecutando calibración métrica...')
    execFileSync(
      blender,
      ['-b', '-P', renderCropPy, '--', '--calibrate', '--out', outDir],
      { stdio: 'inherit', shell: process.platform === 'win32' }
    )
    return
  }

  const cropsConfig: Record<string, { label?: string }> = JSON.parse(
    fs.readFileSync(cropsJsonPath, 'utf-8')
  )

  const cropsToRender = filterCrop
    ? [filterCrop].filter(c => cropsConfig[c])
    : Object.keys(cropsConfig)

  if (cropsToRender.length === 0) {
    console.log(`⚠️ No se encontró ningún cultivo a renderizar con filtro: ${filterCrop}`)
    return
  }

  console.log(`🌾 Cultivos a renderizar (${cropsToRender.length}): ${cropsToRender.join(', ')}\n`)

  for (const cropCode of cropsToRender) {
    console.log(`▶️ Renderizando ${cropCode} (${cropsConfig[cropCode]?.label || cropCode})...`)
    execFileSync(
      blender,
      [
        '-b',
        '-P',
        renderCropPy,
        '--',
        '--crop',
        cropCode,
        '--config',
        cropsJsonPath,
        '--out',
        outDir,
      ],
      { stdio: 'inherit', shell: process.platform === 'win32' }
    )
  }

  console.log('\n🎉 Renderizado completado para todos los cultivos seleccionados.')
}

renderAll().catch(err => {
  console.error('❌ Error en render-all:', err)
  process.exit(1)
})
