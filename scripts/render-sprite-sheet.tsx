import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import sharp from 'sharp'
import type { LocationType } from '@/domain/location'
import type { IndividualStatus } from '@/domain/individual'
import type { Taxon } from '@/domain/taxon'
import { IsometricPlantSprite } from '@/features/locations/isometric/IsometricPlantSprite'
import { SharedDefs } from '@/features/locations/isometric/visual/SharedDefs'
import { resolvePlantPalette, type PlantPaletteData } from '@/features/locations/isometric/visual/paletteKey'

interface RowFixture {
  label: string
  archetypeId: string
  taxon: Pick<Taxon, 'genus' | 'species' | 'family' | 'cropCode' | 'commonName'>
}

const ALL_ROWS: RowFixture[] = [
  { label: 'Tomate', archetypeId: 'solanaceae_tall', taxon: { genus: 'Solanum', species: 'lycopersicum', family: 'Solanaceae', cropCode: 'TOM', commonName: 'Tomate' } },
  { label: 'Pimiento', archetypeId: 'solanaceae_tall', taxon: { genus: 'Capsicum', species: 'annuum', family: 'Solanaceae', cropCode: 'PEPPER_SWEET', commonName: 'Pimiento dulce' } },
  { label: 'Berenjena', archetypeId: 'solanaceae_tall', taxon: { genus: 'Solanum', species: 'melongena', family: 'Solanaceae', cropCode: 'EGGPLANT', commonName: 'Berenjena' } },
  { label: 'Maíz', archetypeId: 'cereal_grass', taxon: { genus: 'Zea', species: 'mays', family: 'Poaceae', cropCode: 'MAI', commonName: 'Maíz' } },
  { label: 'Trigo', archetypeId: 'cereal_grass', taxon: { genus: 'Triticum', species: 'aestivum', family: 'Poaceae', cropCode: 'WHT', commonName: 'Trigo' } },
  { label: 'Girasol', archetypeId: 'heliotropo_tall', taxon: { genus: 'Helianthus', species: 'annuus', family: 'Asteraceae', cropCode: 'SUN_OIL', commonName: 'Girasol' } },
  { label: 'Lechuga', archetypeId: 'rosette_leafy', taxon: { genus: 'Lactuca', species: 'sativa', family: 'Asteraceae', cropCode: 'LETTUCE', commonName: 'Lechuga' } },
  { label: 'Frutilla', archetypeId: 'rosette_leafy', taxon: { genus: 'Fragaria', species: 'ananassa', family: 'Rosaceae', cropCode: 'STRAWBERRY', commonName: 'Frutilla' } },
  { label: 'Zanahoria', archetypeId: 'root_tuber', taxon: { genus: 'Daucus', species: 'carota', family: 'Apiaceae', cropCode: 'CARROT', commonName: 'Zanahoria' } },
  { label: 'Remolacha', archetypeId: 'root_tuber', taxon: { genus: 'Beta', species: 'vulgaris', family: 'Amaranthaceae', cropCode: 'BEETROOT', commonName: 'Remolacha' } },
  { label: 'Cebolla', archetypeId: 'root_tuber', taxon: { genus: 'Allium', species: 'cepa', family: 'Amaryllidaceae', cropCode: 'ONION', commonName: 'Cebolla' } },
  { label: 'Cáñamo', archetypeId: 'palmate_cane', taxon: { genus: 'Cannabis', species: 'sativa', family: 'Cannabaceae', cropCode: 'HEMP', commonName: 'Cáñamo' } },
  { label: 'Poroto', archetypeId: 'vine_climber', taxon: { genus: 'Phaseolus', species: 'vulgaris', family: 'Fabaceae', cropCode: 'BEA_DRY', commonName: 'Poroto' } },
  { label: 'Zapallo', archetypeId: 'vine_climber', taxon: { genus: 'Cucurbita', species: 'maxima', family: 'Cucurbitaceae', cropCode: 'SQUASH', commonName: 'Zapallo' } },
  { label: 'Vid', archetypeId: 'vine_climber', taxon: { genus: 'Vitis', species: 'vinifera', family: 'Vitaceae', cropCode: 'GRAPE', commonName: 'Vid' } },
  { label: 'Cítrico', archetypeId: 'woody_perennial', taxon: { genus: 'Citrus', species: 'sinensis', family: 'Rutaceae', cropCode: 'CITRUS_ORANGE', commonName: 'Naranjo' } },
  { label: 'Genérico', archetypeId: 'generic_herb', taxon: { genus: 'Arabidopsis', species: 'thaliana', family: 'Brassicaceae', cropCode: 'GEN', commonName: 'Arabidopsis' } },
]

interface ColumnFixture {
  label: string
  subLabel: string
  bbch: number
  status: IndividualStatus
  isRaster?: boolean
}

const DEFAULT_COLUMNS: ColumnFixture[] = [
  { label: 'BBCH 05', subLabel: 'Emergencia', bbch: 5, status: 'active' },
  { label: 'BBCH 15', subLabel: 'Desarrollo foliar', bbch: 15, status: 'active' },
  { label: 'BBCH 25', subLabel: 'Brotes laterales', bbch: 25, status: 'active' },
  { label: 'BBCH 35', subLabel: 'Elongación tallo', bbch: 35, status: 'active' },
  { label: 'BBCH 55', subLabel: 'Aparición inflorescencia', bbch: 55, status: 'active' },
  { label: 'BBCH 75', subLabel: 'Llenado de fruto', bbch: 75, status: 'active' },
  { label: 'BBCH 85', subLabel: 'Maduración fruto', bbch: 85, status: 'active' },
  { label: 'Cosechada', subLabel: 'Status: harvested', bbch: 85, status: 'harvested' },
  { label: 'Muerta', subLabel: 'Status: dead', bbch: 45, status: 'dead' },
  { label: 'Raster (Piloto)', subLabel: 'WebP 160×200', bbch: 85, status: 'active', isRaster: true },
]

const RASTER_ONLY_COLUMNS: ColumnFixture[] = [
  { label: 'Germinación (Proc)', subLabel: 'BBCH 05 · SVG', bbch: 5, status: 'active', isRaster: false },
  { label: 'Germinación (Rast)', subLabel: 'BBCH 05 · WebP', bbch: 5, status: 'active', isRaster: true },
  { label: 'Foliar (Proc)', subLabel: 'BBCH 15 · SVG', bbch: 15, status: 'active', isRaster: false },
  { label: 'Foliar (Rast)', subLabel: 'BBCH 15 · WebP', bbch: 15, status: 'active', isRaster: true },
  { label: 'Estructura (Proc)', subLabel: 'BBCH 35 · SVG', bbch: 35, status: 'active', isRaster: false },
  { label: 'Estructura (Rast)', subLabel: 'BBCH 35 · WebP', bbch: 35, status: 'active', isRaster: true },
  { label: 'Floración (Proc)', subLabel: 'BBCH 65 · SVG', bbch: 65, status: 'active', isRaster: false },
  { label: 'Floración (Rast)', subLabel: 'BBCH 65 · WebP', bbch: 65, status: 'active', isRaster: true },
  { label: 'Fructificación (Proc)', subLabel: 'BBCH 85 · SVG', bbch: 85, status: 'active', isRaster: false },
  { label: 'Fructificación (Rast)', subLabel: 'BBCH 85 · WebP', bbch: 85, status: 'active', isRaster: true },
]

function parseArgs() {
  const args = process.argv.slice(2)
  let container: LocationType = 'greenhouse'
  let silhouette = false
  let cropCodes: string[] | null = null
  let rasterOnly = false

  for (const arg of args) {
    if (arg.startsWith('--container=')) {
      const val = arg.split('=')[1] as LocationType
      if (['greenhouse', 'field', 'growth_chamber', 'lab', 'room', 'bench'].includes(val)) {
        container = val
      }
    } else if (arg === '--silhouette') {
      silhouette = true
    } else if (arg.startsWith('--crops=')) {
      const list = arg.split('=')[1]
      if (list) {
        cropCodes = list.split(',').map(s => s.trim().toUpperCase())
      }
    } else if (arg === '--raster-only') {
      rasterOnly = true
    }
  }

  return { container, silhouette, cropCodes, rasterOnly }
}

/**
 * Reemplaza imágenes raster externas o WebP por data URIs PNG decodificables por @resvg/resvg-js.
 */
async function embedRasterImages(svg: string): Promise<string> {
  const imageRegex = /<image\b([^>]*?)\bhref="([^"]+)"([^>]*?)>/g
  const matches = Array.from(svg.matchAll(imageRegex))
  let result = svg

  for (const match of matches) {
    let urlStr = match[2]
    if (urlStr.startsWith('file:///')) {
      urlStr = fileURLToPath(urlStr)
    } else if (urlStr.startsWith('file://')) {
      urlStr = fileURLToPath(urlStr)
    } else if (urlStr.startsWith('./') || urlStr.startsWith('../')) {
      urlStr = path.resolve(process.cwd(), urlStr)
    }

    if (urlStr.endsWith('.webp') && fs.existsSync(urlStr)) {
      const webpBuf = fs.readFileSync(urlStr)
      const pngBuf = await sharp(webpBuf).png().toBuffer()
      const dataUri = `data:image/png;base64,${pngBuf.toString('base64')}`
      const replacedTag = match[0].replace(`href="${match[2]}"`, `href="${dataUri}"`)
      result = result.replace(match[0], replacedTag)
    }
  }

  return result
}

async function generateSpriteSheet() {
  const { container, silhouette, cropCodes, rasterOnly } = parseArgs()
  console.log(`🌿 Generando hoja de contactos Plantin v2 (contenedor: ${container}, silueta: ${silhouette}, crops: ${cropCodes?.join(',') ?? 'todos'}, rasterOnly: ${rasterOnly})...`)

  const rows = cropCodes
    ? ALL_ROWS.filter(r => cropCodes.includes(r.taxon.cropCode.toUpperCase()))
    : ALL_ROWS

  const columns = rasterOnly ? RASTER_ONLY_COLUMNS : DEFAULT_COLUMNS

  const cellWidth = 140
  const cellHeight = 160
  const headerColWidth = 190
  const headerRowHeight = 55

  const totalWidth = headerColWidth + columns.length * cellWidth
  const variationRowHeight = cellHeight
  // Solo incluimos la fila de variación si no es raster-only o si el tomate está entre los cultivos filtrados
  const showVariation = !rasterOnly && (!cropCodes || cropCodes.includes('TOM'))
  const totalHeight = headerRowHeight + rows.length * cellHeight + (showVariation ? variationRowHeight : 0)

  // Recopilar paletas únicas para SharedDefs
  const palettesMap = new Map<string, PlantPaletteData>()
  for (const row of rows) {
    for (const col of columns) {
      const pal = resolvePlantPalette({
        taxon: row.taxon,
        status: col.status,
        bbch: col.bbch,
      })
      if (!palettesMap.has(pal.key)) {
        palettesMap.set(pal.key, pal)
      }
    }
  }
  const allPalettes = Array.from(palettesMap.values())

  const VARIATION_CLONES = [
    { id: 'tomato-clone-01', tag: 'Clon #1 (A1)' },
    { id: 'tomato-clone-02', tag: 'Clon #2 (B2)' },
    { id: 'tomato-clone-03', tag: 'Clon #3 (C3)' },
    { id: 'tomato-clone-04', tag: 'Clon #4 (D4)' },
    { id: 'tomato-clone-05', tag: 'Clon #5 (E5)' },
    { id: 'tomato-clone-06', tag: 'Clon #6 (F6)' },
  ]
  const tomatoTaxon = ALL_ROWS[0].taxon

  const rawSvgContent = renderToStaticMarkup(
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={totalWidth}
      height={totalHeight}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      style={{
        background: '#f8fafc',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <SharedDefs palettes={allPalettes} />

      {/* Estilos para silueta si está activa */}
      {silhouette && (
        <style>{`
          [data-archetype] {
            filter: brightness(0) !important;
          }
        `}</style>
      )}

      {/* Fondo global */}
      <rect width={totalWidth} height={totalHeight} fill="#f8fafc" />

      {/* Cabecera superior izquierda */}
      <rect x={0} y={0} width={headerColWidth} height={headerRowHeight} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth={1} />
      <text
        x={headerColWidth / 2}
        y={24}
        textAnchor="middle"
        fontSize="12.5"
        fontWeight="800"
        fill="#0f172a"
      >
        PLANTIN SPRITES
      </text>
      <text
        x={headerColWidth / 2}
        y={40}
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        fill="#64748b"
      >
        Contenedor: {container} {rasterOnly ? '· RASTER' : ''}
      </text>

      {/* Columnas Header */}
      {columns.map((col, colIdx) => {
        const x = headerColWidth + colIdx * cellWidth
        return (
          <g key={colIdx}>
            <rect
              x={x}
              y={0}
              width={cellWidth}
              height={headerRowHeight}
              fill={col.isRaster ? '#ecfdf5' : '#f1f5f9'}
              stroke={col.isRaster ? '#a7f3d0' : '#cbd5e1'}
              strokeWidth={col.isRaster ? 1.5 : 1}
            />
            <text
              x={x + cellWidth / 2}
              y={22}
              textAnchor="middle"
              fontSize="11.5"
              fontWeight="700"
              fill={col.isRaster ? '#047857' : col.status === 'dead' ? '#b91c1c' : col.status === 'harvested' ? '#d97706' : '#0f172a'}
            >
              {col.label}
            </text>
            <text
              x={x + cellWidth / 2}
              y={38}
              textAnchor="middle"
              fontSize="9"
              fontWeight="500"
              fill={col.isRaster ? '#059669' : '#64748b'}
            >
              {col.subLabel}
            </text>
          </g>
        )
      })}

      {/* Filas */}
      {rows.map((row, rowIdx) => {
        const y = headerRowHeight + rowIdx * cellHeight
        const isEven = rowIdx % 2 === 0

        return (
          <g key={rowIdx}>
            {/* Header de Fila */}
            <rect
              x={0}
              y={y}
              width={headerColWidth}
              height={cellHeight}
              fill={isEven ? '#f1f5f9' : '#e2e8f0'}
              stroke="#cbd5e1"
              strokeWidth={1}
            />
            <text
              x={16}
              y={y + 50}
              fontSize="14"
              fontWeight="700"
              fill="#0f172a"
            >
              {row.label}
            </text>
            <text
              x={16}
              y={y + 70}
              fontSize="10.5"
              fontWeight="700"
              fontFamily="monospace"
              fill="#0284c7"
            >
              {row.taxon.cropCode}
            </text>
            <text
              x={16}
              y={y + 86}
              fontSize="9.5"
              fontWeight="500"
              fontFamily="monospace"
              fill="#475569"
            >
              {row.archetypeId}
            </text>
            <text
              x={16}
              y={y + 104}
              fontSize="9.5"
              fontStyle="italic"
              fill="#475569"
            >
              {row.taxon.genus} {row.taxon.species}
            </text>
            <text
              x={16}
              y={y + 120}
              fontSize="8.5"
              fill="#64748b"
            >
              Fam: {row.taxon.family}
            </text>

            {/* Celdas de la fila */}
            {columns.map((col, colIdx) => {
              const x = headerColWidth + colIdx * cellWidth
              return (
                <g key={colIdx}>
                  <rect
                    x={x}
                    y={y}
                    width={cellWidth}
                    height={cellHeight}
                    fill={isEven ? '#ffffff' : '#f8fafc'}
                    stroke="#e2e8f0"
                    strokeWidth={1}
                  />
                  {/* Sprite posicionado dentro de la celda con escala 1.3x para apreciar micro-anatomía */}
                  <g transform={`translate(${x + cellWidth / 2}, ${y + 118}) scale(1.3)`}>
                    <IsometricPlantSprite
                      individualId={`sheet-${row.taxon.cropCode}-${col.bbch}-${col.status}${col.isRaster ? '-raster' : ''}`}
                      bbch={col.bbch}
                      status={col.status}
                      label={`${row.taxon.cropCode || 'PLT'} #${String(col.bbch).padStart(2, '0')}`}
                      taxon={row.taxon as Taxon}
                      locationType={container}
                      forceProcedural={!col.isRaster}
                    />
                  </g>
                  {/* Badge de pie de celda con código y fase completa */}
                  <text
                    x={x + cellWidth / 2}
                    y={y + cellHeight - 7}
                    textAnchor="middle"
                    fontSize="8.5"
                    fontFamily="monospace"
                    fontWeight="600"
                    fill={col.isRaster ? '#059669' : '#64748b'}
                  >
                    {col.isRaster ? 'RASTER 2.5D' : `${row.taxon.cropCode} · BBCH ${String(col.bbch).padStart(2, '0')}`}
                  </text>
                </g>
              )
            })}
          </g>
        )
      })}

      {/* Fila Especial: Variación Natural (Mismo Taxón y BBCH con 6 IDs distintos) */}
      {showVariation && (() => {
        const y = headerRowHeight + rows.length * cellHeight
        return (
          <g key="row-variation">
            <rect
              x={0}
              y={y}
              width={headerColWidth}
              height={variationRowHeight}
              fill="#fef3c7"
              stroke="#f59e0b"
              strokeWidth={1.5}
            />
            <text
              x={16}
              y={y + 45}
              fontSize="13"
              fontWeight="800"
              fill="#92400e"
            >
              Variación botánica
            </text>
            <text
              x={16}
              y={y + 65}
              fontSize="10.5"
              fontWeight="700"
              fontFamily="monospace"
              fill="#b45309"
            >
              Tomate BBCH 65 (6 IDs)
            </text>
            <text
              x={16}
              y={y + 85}
              fontSize="9.5"
              fill="#78350f"
            >
              Inclinación, altura, espejo
            </text>
            <text
              x={16}
              y={y + 102}
              fontSize="9"
              fontStyle="italic"
              fill="#92400e"
            >
              Seed determinístico FNV-1a
            </text>

            {columns.map((_col, colIdx) => {
              const x = headerColWidth + colIdx * cellWidth
              const clone = VARIATION_CLONES[colIdx]

              return (
                <g key={colIdx}>
                  <rect
                    x={x}
                    y={y}
                    width={cellWidth}
                    height={variationRowHeight}
                    fill={clone ? '#fffbeb' : '#f8fafc'}
                    stroke="#fde68a"
                    strokeWidth={1}
                  />
                  {clone ? (
                    <>
                      <g transform={`translate(${x + cellWidth / 2}, ${y + 118}) scale(1.3)`}>
                        <IsometricPlantSprite
                          individualId={clone.id}
                          bbch={65}
                          status="active"
                          label={clone.tag}
                          taxon={tomatoTaxon as Taxon}
                          locationType={container}
                          forceProcedural={true}
                        />
                      </g>
                      <text
                        x={x + cellWidth / 2}
                        y={y + variationRowHeight - 7}
                        textAnchor="middle"
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="700"
                        fill="#b45309"
                      >
                        {clone.tag}
                      </text>
                    </>
                  ) : (
                    <text
                      x={x + cellWidth / 2}
                      y={y + cellHeight / 2}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#94a3b8"
                    >
                      —
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        )
      })()}
    </svg>
  )

  const outDir = path.resolve(process.cwd(), 'scripts', 'out')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const svgPath = path.join(outDir, 'sprite-sheet.svg')
  const pngPath = path.join(outDir, 'sprite-sheet.png')

  // Procesar imágenes raster para que resvg las dibuje correctamente
  const svgContent = await embedRasterImages(rawSvgContent)

  fs.writeFileSync(svgPath, svgContent, 'utf-8')
  console.log(`✅ SVG generado en: ${svgPath} (${Math.round(svgContent.length / 1024)} KB)`)

  console.log('🖼️ Renderizando PNG con @resvg/resvg-js (escala 2x)...')
  const resvg = new Resvg(svgContent, {
    fitTo: {
      mode: 'zoom',
      value: 2,
    },
    font: {
      loadSystemFonts: true,
    },
  })

  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  fs.writeFileSync(pngPath, pngBuffer)
  console.log(`🎉 PNG generado en: ${pngPath} (${Math.round(pngBuffer.length / 1024)} KB, ${pngData.width}x${pngData.height} px)`)
}

generateSpriteSheet().catch(err => {
  console.error('❌ Error generando hoja de contactos:', err)
  process.exit(1)
})
