import * as fs from 'fs';
import * as path from 'path';

interface CuratedAsset {
  asset: string;
  category: string;
  original_category: string;
  triangles: number;
  draw_calls: number;
  size_mb: number;
  glb: string;
  file_name: string;
}

interface CuratedDataset {
  total_curated: number;
  assets: CuratedAsset[];
}

const HF_BASE_URL = 'https://huggingface.co/datasets/codepawl/simready-glb/resolve/main';
const OUTPUT_DIR = path.resolve('public/models/simready');
const GLB_DIR = path.join(OUTPUT_DIR, 'glb');
const THUMBS_DIR = path.join(OUTPUT_DIR, 'thumbs');
const CATALOG_PATH = path.join(OUTPUT_DIR, 'catalog.json');

const CONCURRENCY = 8;

function formatLabel(assetName: string): string {
  // Convert e.g. "equipment_bench_vise_heavy_b01" -> "Bench Vise Heavy (B01)"
  const parts = assetName.split('_');
  if (parts.length <= 1) return assetName;
  // Remove category prefix if present
  const relevantParts = parts.slice(1);
  return relevantParts
    .map((p, idx) => {
      if (idx === relevantParts.length - 1 && /^[a-z]\d+$/i.test(p)) {
        return `(${p.toUpperCase()})`;
      }
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join(' ');
}

async function downloadFile(url: string, destPath: string, retries = 3): Promise<number> {
  if (fs.existsSync(destPath)) {
    const stat = fs.statSync(destPath);
    if (stat.size > 0) {
      return stat.size;
    }
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(destPath, buffer);
      return buffer.byteLength;
    } catch (err) {
      if (attempt === retries) {
        console.error(`[Error] Falló descarga de ${url} tras ${retries} intentos:`, err);
        return 0;
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return 0;
}

async function runBatchDownload() {
  const jsonPath = path.resolve('scripts/assets/curated_simready_assets.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('No se encontró curated_simready_assets.json');
    process.exit(1);
  }

  const rawData: CuratedDataset = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const assets = rawData.assets;

  console.log(`=== INICIANDO DESCARGA BATCH DE ${assets.length} ASSETS SIMREADY ===`);
  console.log(`Destino: ${OUTPUT_DIR}`);
  console.log(`Concurrencia: ${CONCURRENCY} descargas simultáneas`);

  if (!fs.existsSync(GLB_DIR)) fs.mkdirSync(GLB_DIR, { recursive: true });
  if (!fs.existsSync(THUMBS_DIR)) fs.mkdirSync(THUMBS_DIR, { recursive: true });

  let completed = 0;
  let totalBytes = 0;
  let skipped = 0;
  const startTime = Date.now();

  const catalogItems = [];

  // Pool de descarga concurrente
  const queue = [...assets];
  const workers = Array.from({ length: CONCURRENCY }).map(async (_, workerId) => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;

      const glbUrl = `${HF_BASE_URL}/${item.glb}`;
      const thumbUrl = `${HF_BASE_URL}/thumbs/${item.file_name}`;

      const glbDest = path.join(GLB_DIR, `${item.asset}.glb`);
      const thumbDest = path.join(THUMBS_DIR, `${item.asset}.webp`);

      const existed = fs.existsSync(glbDest) && fs.existsSync(thumbDest);

      const [glbBytes, thumbBytes] = await Promise.all([
        downloadFile(glbUrl, glbDest),
        downloadFile(thumbUrl, thumbDest),
      ]);

      if (existed) {
        skipped++;
      } else {
        totalBytes += glbBytes + thumbBytes;
      }

      completed++;

      if (completed % 25 === 0 || completed === assets.length) {
        const elapsedSec = (Date.now() - startTime) / 1000;
        const speedMb = totalBytes / 1024 / 1024 / Math.max(1, elapsedSec);
        const percent = ((completed / assets.length) * 100).toFixed(1);
        console.log(
          `[Batch] ${completed}/${assets.length} (${percent}%) | Descargados: ${(totalBytes / 1024 / 1024).toFixed(1)} MB (${speedMb.toFixed(1)} MB/s) | Omitidos: ${skipped}`,
        );
      }

      catalogItems.push({
        assetId: item.asset,
        label: formatLabel(item.asset),
        category: item.category,
        triangles: item.triangles,
        drawCalls: item.draw_calls,
        sizeMb: item.size_mb,
        glbUrl: `/models/simready/glb/${item.asset}.glb`,
        thumbnailUrl: `/models/simready/thumbs/${item.asset}.webp`,
      });
    }
  });

  await Promise.all(workers);

  // Guardar catálogo consolidado para uso instantáneo en el frontend
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalogItems, null, 2), 'utf-8');

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== DESCARGA COMPLETADA CON ÉXITO ===`);
  console.log(`Total archivos descargados: ${completed}`);
  console.log(`Tamaño total transferido: ${(totalBytes / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Tiempo total: ${totalTimeSec} segundos`);
  console.log(`Catálogo indexado guardado en: ${CATALOG_PATH}`);
}

runBatchDownload().catch((err) => {
  console.error('[Batch] Error fatal:', err);
  process.exit(1);
});
