import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { center, getBounds, prune, reorder } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import * as fs from 'fs';
import * as path from 'path';

export interface AssetMetricMetadata {
  id: string;
  label: string;
  category: 'architecture' | 'cultivation_container' | 'mep' | 'logistics' | 'botanical';
  dimensionsCm: {
    width: number;
    height: number;
    depth: number;
  };
  occupancyCm: {
    width: number;
    depth: number;
  };
  snapAnchor: 'floor' | 'wall' | 'ceiling';
  stackable?: boolean;
  clearanceCm?: {
    front?: number;
    sides?: number;
  };
  source: string;
  sourceUrl?: string;
  normalizedAt: string;
  triangles?: number;
}

export interface NormalizeOptions {
  inputPathOrUrl: string;
  id: string;
  label: string;
  category: AssetMetricMetadata['category'];
  snapAnchor?: 'floor' | 'wall' | 'ceiling';
  stackable?: boolean;
  targetDir?: string;
}

export async function normalizeAsset(options: NormalizeOptions): Promise<AssetMetricMetadata> {
  const {
    inputPathOrUrl,
    id,
    label,
    category,
    snapAnchor = 'floor',
    stackable = false,
    targetDir = path.resolve('public/models'),
  } = options;

  await MeshoptDecoder.ready;
  await MeshoptEncoder.ready;

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'meshopt.decoder': MeshoptDecoder,
      'meshopt.encoder': MeshoptEncoder,
    });

  let buffer: Uint8Array;
  if (inputPathOrUrl.startsWith('http://') || inputPathOrUrl.startsWith('https://')) {
    console.log(`[normalize-asset] Descargando modelo desde: ${inputPathOrUrl}`);
    const res = await fetch(inputPathOrUrl);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }
    const arrayBuf = await res.arrayBuffer();
    buffer = new Uint8Array(arrayBuf);
  } else {
    console.log(`[normalize-asset] Leyendo archivo local: ${inputPathOrUrl}`);
    buffer = fs.readFileSync(path.resolve(inputPathOrUrl));
  }

  const document = await io.readBinary(buffer);

  // 1. Aplicar pivote en la base inferior (pivot: 'below' sitúa X/Z centrados y min Y = 0)
  console.log(`[normalize-asset] Ajustando pivote a 'below' (base en Y=0)...`);
  await document.transform(center({ pivot: 'below' }));

  // 2. Limpieza de elementos huérfanos y reordenamiento de caché
  await document.transform(prune(), reorder({ encoder: MeshoptEncoder }));

  // 3. Medir cotas métricas reales (en metros)
  const scene = document.getRoot().getDefaultScene() || document.getRoot().listScenes()[0];
  const bounds = getBounds(scene);
  const sizeM = [
    bounds.max[0] - bounds.min[0],
    bounds.max[1] - bounds.min[1],
    bounds.max[2] - bounds.min[2],
  ];

  const widthCm = Math.round(sizeM[0] * 100 * 10) / 10;
  const heightCm = Math.round(sizeM[1] * 100 * 10) / 10;
  const depthCm = Math.round(sizeM[2] * 100 * 10) / 10;

  console.log(`[normalize-asset] Cotas calculadas:`);
  console.log(`  - Ancho (X): ${widthCm} cm (${sizeM[0].toFixed(3)} m)`);
  console.log(`  - Alto  (Y): ${heightCm} cm (${sizeM[1].toFixed(3)} m)`);
  console.log(`  - Prof. (Z): ${depthCm} cm (${sizeM[2].toFixed(3)} m)`);
  console.log(`  - Piso  (min Y): ${bounds.min[1].toFixed(4)} m`);

  // 4. Inyectar metadata en gltf.asset.extras (capa interna auto-contenida)
  const meta: AssetMetricMetadata = {
    id,
    label,
    category,
    dimensionsCm: {
      width: widthCm,
      height: heightCm,
      depth: depthCm,
    },
    occupancyCm: {
      width: widthCm,
      depth: depthCm,
    },
    snapAnchor,
    stackable,
    source: inputPathOrUrl.startsWith('http') ? 'simready-glb' : 'local',
    sourceUrl: inputPathOrUrl.startsWith('http') ? inputPathOrUrl : undefined,
    normalizedAt: new Date().toISOString(),
  };

  const root = document.getRoot();
  root.setExtras({
    ...root.getExtras(),
    ...meta,
  });

  // 5. Escribir GLB normalizado y .meta.json
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const outGlbPath = path.join(targetDir, `${id}.glb`);
  const outMetaPath = path.join(targetDir, `${id}.meta.json`);

  const outGlbBytes = await io.writeBinary(document);
  fs.writeFileSync(outGlbPath, outGlbBytes);
  fs.writeFileSync(outMetaPath, JSON.stringify(meta, null, 2), 'utf-8');

  console.log(`[normalize-asset] ¡Completado!`);
  console.log(`  - GLB: ${outGlbPath} (${(outGlbBytes.byteLength / 1024).toFixed(1)} KB)`);
  console.log(`  - Meta: ${outMetaPath}`);

  return meta;
}

// Ejecución directa si se invoca desde CLI
if (process.argv[1] && process.argv[1].endsWith('normalize-asset.ts')) {
  const args = process.argv.slice(2);
  const urlOrPath = args[0] || 'https://huggingface.co/datasets/codepawl/simready-glb/resolve/main/glb/pallet_a01.glb';
  const id = args[1] || 'pallet_standard_wood_a01';
  const label = args[2] || 'Palet de Madera Estándar';
  const category = (args[3] as AssetMetricMetadata['category']) || 'logistics';

  normalizeAsset({
    inputPathOrUrl: urlOrPath,
    id,
    label,
    category,
    snapAnchor: 'floor',
    stackable: true,
  }).catch((err) => {
    console.error('[normalize-asset] Error:', err);
    process.exit(1);
  });
}
