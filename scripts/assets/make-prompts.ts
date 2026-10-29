import fs from 'node:fs'
import path from 'node:path'

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

const ARCHETYPE_LABELS: Record<string, string> = {
  solanaceae_tall: 'Solanácea Erecta / Tomate & Pimiento',
  cereal_grass: 'Gramínea & Cereal / Caña con Espiga',
  rosette_leafy: 'Roseta Foliar Basal / Brássica & Hortaliza de Hoja',
  root_tuber: 'Raíz, Tubérculo & Bulbo Subterráneo',
  heliotropo_tall: 'Capítulo Floral Alto / Girasol',
  palmate_cane: 'Palmeada Erecta / Cannabis & Cáñamo',
  vine_climber: 'Enredadera & Cucurbitácea / Guía Rastrera o Trepadora',
  woody_perennial: 'Leñosa Perenne / Frutal & Cítrico',
  generic_herb: 'Herbácea General / Porte Compacto',
}

const STAGE_DETAILS: Record<string, { name: string; bbch: string; percent: number; desc: string }> = {
  flowering: {
    name: 'Floración (Flowering)',
    bbch: '50–69',
    percent: 90,
    desc: '- Flores abiertas llamativas en sus posiciones naturales.\n  - Frutos inmaduros muy pequeños o incipientes (recién cuajados), color verde pálido.\n  - Follaje vigoroso completamente desarrollado pero ligeramente menos denso que en plena fructificación.\n  - Mantener la misma morfología general de tallo y hojas.',
  },
  structure: {
    name: 'Estructura Vegetativa (Vegetative Structure)',
    bbch: '20–49',
    percent: 72,
    desc: '- Estructura principal y ramificaciones bien definidas.\n  - Follaje vegetativo abundante y juvenil.\n  - Botones florales cerrados y diminutos o ausentes.\n  - NINGÚN fruto ni flor abierta visible.',
  },
  leaf: {
    name: 'Desarrollo Foliar Temprano (Leaf Development)',
    bbch: '10–19',
    percent: 45,
    desc: '- Planta juvenil pequeña con tallos delgados y tiernos.\n  - De 3 a 6 hojas verdaderas con la silueta característica pero en miniatura.\n  - Sin ramificaciones complejas, sin flores ni frutos.',
  },
  germination: {
    name: 'Germinación / Emergencia (Germination & Sprout)',
    bbch: '00–09',
    percent: 25,
    desc: '- Brote plántula tierno emergiendo del punto de anclaje base.\n  - 2 cotiledones redondeados carnosos abiertos más el primer par diminuto de hojas verdaderas.\n  - Tallo tierno verde claro translúcido.',
  },
}

function getApprovedReferences(referencesDir: string): string[] {
  if (!fs.existsSync(referencesDir)) return []
  return fs.readdirSync(referencesDir)
    .filter(f => f.endsWith('.webp') || f.endsWith('.png'))
    .map(f => `- \`docs/art/references/${f}\`: Imagen de referencia de estilo y material 3D aprobada.`)
}

function buildPlantAdultPrompt(
  assetId: string,
  asset: PlantAsset,
  baseTemplate: string,
  adultTemplate: string,
  references: string[]
): string {
  const archetypeLabel = ARCHETYPE_LABELS[asset.archetype] || asset.archetype
  const refBlock = references.length > 0 ? references.join('\n') : '- *(No hay referencias de estilo previas fijadas aún; este asset piloto definirá el estándar de arte)*.'

  let prompt = adultTemplate.replace('{{BASE_STYLE}}', baseTemplate)
  prompt = prompt.replaceAll('{{ASSET_ID}}', assetId)
  prompt = prompt.replaceAll('{{LABEL}}', asset.label)
  prompt = prompt.replaceAll('{{CROP_CODE}}', asset.cropCode)
  prompt = prompt.replaceAll('{{ARCHETYPE_LABEL}}', archetypeLabel)
  prompt = prompt.replaceAll('{{STRUCTURE}}', asset.structure)
  prompt = prompt.replaceAll('{{KEY_COLOR}}', asset.keyColor)
  prompt = prompt.replaceAll('{{REFERENCES_BLOCK}}', refBlock)

  return prompt
}

function buildPlantStagePrompt(
  assetId: string,
  stage: string,
  asset: PlantAsset,
  baseTemplate: string,
  stageTemplate: string,
  references: string[]
): string {
  const info = STAGE_DETAILS[stage] ?? {
    name: stage,
    bbch: 'Fase intermedia',
    percent: 50,
    desc: `Morfología botánica correspondiente a la fase ${stage}.`,
  }

  const refBlock = references.length > 0 ? references.join('\n') : '- *(Fijada por la fase adulta aprobada)*.'

  let prompt = stageTemplate.replace('{{BASE_STYLE}}', baseTemplate)
  prompt = prompt.replaceAll('{{ASSET_ID}}', assetId)
  prompt = prompt.replaceAll('{{STAGE}}', stage)
  prompt = prompt.replaceAll('{{TARGET_STAGE_NAME}}', info.name)
  prompt = prompt.replaceAll('{{BBCH_RANGE}}', info.bbch)
  prompt = prompt.replaceAll('{{STAGE_HEIGHT_PERCENT}}', String(info.percent))
  prompt = prompt.replaceAll('{{STAGE_DESCRIPTION}}', info.desc)
  prompt = prompt.replaceAll('{{LABEL}}', asset.label)
  prompt = prompt.replaceAll('{{CROP_CODE}}', asset.cropCode)
  prompt = prompt.replaceAll('{{KEY_COLOR}}', asset.keyColor)
  prompt = prompt.replaceAll('{{REFERENCES_BLOCK}}', refBlock)

  return prompt
}

function buildObjectPrompt(
  assetId: string,
  asset: ObjectAsset,
  baseTemplate: string,
  objectTemplate: string,
  references: string[]
): string {
  const refBlock = references.length > 0 ? references.join('\n') : '- *(Fijar estilo 3D clay mate acorde al catálogo)*.'
  const mirrorNote = asset.mirrorForViewB
    ? 'El objeto debe ser geométricamente simétrico en el plano horizontal (o funcionar naturalmente al espejarse horizontalmente para la vista inversa).'
    : 'Este objeto es asimétrico en la vista B; mantener orientación estricta.'

  let prompt = objectTemplate.replace('{{BASE_STYLE}}', baseTemplate)
  prompt = prompt.replaceAll('{{ASSET_ID}}', assetId)
  prompt = prompt.replaceAll('{{TYPE_ID}}', asset.typeId)
  prompt = prompt.replaceAll('{{LABEL}}', asset.label)
  prompt = prompt.replaceAll('{{CATEGORY}}', asset.category)
  prompt = prompt.replaceAll('{{FOOTPRINT_W}}', String(asset.footprint.w))
  prompt = prompt.replaceAll('{{FOOTPRINT_D}}', String(asset.footprint.d))
  prompt = prompt.replaceAll('{{FOOTPRINT_H}}', String(asset.footprint.h))
  prompt = prompt.replaceAll('{{STRUCTURE}}', asset.structure)
  prompt = prompt.replaceAll('{{MIRROR_NOTE}}', mirrorNote)
  prompt = prompt.replaceAll('{{KEY_COLOR}}', asset.keyColor)
  prompt = prompt.replaceAll('{{REFERENCES_BLOCK}}', refBlock)

  return prompt
}

function main() {
  const { targetId } = parseArgs()
  const root = process.cwd()

  const catalogPath = path.join(root, 'assets-src', 'assets.json')
  const promptsDir = path.join(root, 'docs', 'art', 'prompts')
  const referencesDir = path.join(root, 'docs', 'art', 'references')
  const outDir = path.join(root, 'assets-src', 'prompts')

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const baseTemplate = fs.readFileSync(path.join(promptsDir, '_base.md'), 'utf-8')
  const plantAdultTemplate = fs.readFileSync(path.join(promptsDir, 'plant-adult.md'), 'utf-8')
  const plantStageTemplate = fs.readFileSync(path.join(promptsDir, 'plant-stage-edit.md'), 'utf-8')
  const objectTemplate = fs.readFileSync(path.join(promptsDir, 'object.md'), 'utf-8')

  const catalog: AssetsCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'))
  const references = getApprovedReferences(referencesDir)

  const assetKeys = targetId ? [targetId] : Object.keys(catalog)
  console.log(`📝 Generando prompts de producción (${assetKeys.length} assets)...`)

  for (const id of assetKeys) {
    const asset = catalog[id]
    if (!asset) {
      console.warn(`⚠️ Asset no encontrado en catalog: ${id}`)
      continue
    }

    if (asset.kind === 'plant') {
      // Prompt fase adulta principal
      const adultPrompt = buildPlantAdultPrompt(id, asset, baseTemplate, plantAdultTemplate, references)
      const adultPath = path.join(outDir, `${id}.md`)
      fs.writeFileSync(adultPath, adultPrompt, 'utf-8')
      console.log(`  ✅ Prompt planta adulta: ${path.relative(root, adultPath)}`)

      // Si es el piloto o target específico, generamos prompts para las 4 fases restantes
      if (id === 'plant.SQUASH' || targetId) {
        for (const stage of ['flowering', 'structure', 'leaf', 'germination']) {
          const stagePrompt = buildPlantStagePrompt(id, stage, asset, baseTemplate, plantStageTemplate, references)
          const stagePath = path.join(outDir, `${id}-${stage}.md`)
          fs.writeFileSync(stagePath, stagePrompt, 'utf-8')
        }
        console.log(`  ✅ Prompts de fases para ${id}: flowering, structure, leaf, germination`)
      }
    } else if (asset.kind === 'object') {
      const objPrompt = buildObjectPrompt(id, asset, baseTemplate, objectTemplate, references)
      const objPath = path.join(outDir, `${id}.md`)
      fs.writeFileSync(objPath, objPrompt, 'utf-8')
      console.log(`  ✅ Prompt objeto: ${path.relative(root, objPath)}`)
    }
  }

  console.log(`🎉 Prompts listos en: ${path.relative(root, outDir)}`)
}

main()
