import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export interface CrossedQuadsOptions {
  inputImagePath: string;
  outputPath: string;
  widthM: number;
  heightM: number;
  numPlanes?: number; // 2 for 90° orthogonal cross
  cols?: number;      // subdivision columns
  rows?: number;      // subdivision rows
  stemToleranceAlpha?: number;
}

/**
 * Centers the stem base of a transparent plant texture on the horizontal canvas axis (U = 0.5)
 * so that when crossed planes intersect at (0, 0, 0), the plant stems meet at the exact same point in space.
 */
async function createCenteredPlantTexture(inputPath: string, outputPath: string): Promise<string> {
  const img = sharp(inputPath);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

  // Find lowest row with plant pixels
  let bottomRow = info.height - 1;
  for (let y = info.height - 1; y >= 0; y--) {
    let hasPixel = false;
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 30) {
        hasPixel = true;
        break;
      }
    }
    if (hasPixel) {
      bottomRow = y;
      break;
    }
  }

  // Find stem bounds in the bottom 12% of the plant
  const scanStartY = Math.max(0, bottomRow - Math.floor(info.height * 0.12));
  let minStemX = info.width;
  let maxStemX = 0;
  for (let y = scanStartY; y <= bottomRow; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 40) {
        if (x < minStemX) minStemX = x;
        if (x > maxStemX) maxStemX = x;
      }
    }
  }

  const stemCenterX = (minStemX + maxStemX) / 2;
  const halfWidth = Math.ceil(Math.max(stemCenterX, info.width - stemCenterX));
  const newWidth = halfWidth * 2;
  const leftPad = Math.round(halfWidth - stemCenterX);
  const rightPad = Math.max(0, newWidth - info.width - leftPad);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  await sharp(inputPath)
    .extend({
      top: 0,
      bottom: 0,
      left: Math.max(0, leftPad),
      right: Math.max(0, rightPad),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  return outputPath;
}

/**
 * Generates an optimized glTF 2.0 binary (.glb) asset using the Crossed-Quads technique:
 * - 2 orthogonal planes at 90° for clear silhouettes and minimal self-overlap
 * - 4x4 subdivision grid with subtle curvature
 * - Sphere-projected normals (proxy sphere workflow) with upward bias to unify lighting across intersections
 * - AlphaMode="MASK" (alphaCutoff 0.45), doubleSided=true
 */
export async function generateCrossedQuadsGlb(options: CrossedQuadsOptions): Promise<void> {
  const {
    inputImagePath,
    outputPath,
    widthM,
    heightM,
    numPlanes = 2,
    cols = 4,
    rows = 4,
  } = options;

  // 1. Ensure texture has stem centered at U = 0.5
  const tempCenteredPng = path.join(path.dirname(outputPath), '_temp_centered.png');
  await createCenteredPlantTexture(inputImagePath, tempCenteredPng);
  const imgBuffer = fs.readFileSync(tempCenteredPng);
  try {
    fs.unlinkSync(tempCenteredPng);
  } catch {
    // Non-critical cleanup
  }

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  let vertexOffset = 0;
  const minPos = [Infinity, Infinity, Infinity];
  const maxPos = [-Infinity, -Infinity, -Infinity];
  const sphereCenterY = heightM * 0.45;

  for (let p = 0; p < numPlanes; p++) {
    const angle = (p * Math.PI) / numPlanes; // 0 and 90 deg
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const startIdx = vertexOffset;

    for (let r = 0; r <= rows; r++) {
      const v = r / rows; // 0 at top, 1 at bottom for glTF UV
      const y = (1 - v) * heightM; // 0 at bottom, heightM at top

      for (let c = 0; c <= cols; c++) {
        const u = c / cols; // 0 at left, 1 at right
        const t = (u - 0.5) * widthM; // -width/2 to +width/2

        // Subtle organic curvature: bend outer edges slightly backward (~2.5 cm max at tips)
        const curveDist = Math.pow(Math.abs(u - 0.5) * 2, 2) * 0.025;
        const curveX = -sinA * curveDist * (p === 0 ? 1 : -1);
        const curveZ = cosA * curveDist * (p === 0 ? 1 : -1);

        const x = t * cosA + curveX;
        const z = t * sinA + curveZ;

        positions.push(x, y, z);
        uvs.push(u, v);

        // Spherical normal from proxy sphere center + upward bias
        // This ensures the intersection seam (where x~0, z~0) has identical upward normals,
        // completely eliminating the harsh split lighting seam!
        const dx = x;
        const dy = (y - sphereCenterY) * 0.6 + heightM * 0.25;
        const dz = z;
        const dist = Math.hypot(dx, dy, dz) || 1;

        const nx = (dx / dist) * 0.6;
        const ny = Math.max(0.35, (dy / dist) * 0.6 + 0.4);
        const nz = (dz / dist) * 0.6;
        const nLen = Math.hypot(nx, ny, nz);

        normals.push(nx / nLen, ny / nLen, nz / nLen);

        minPos[0] = Math.min(minPos[0], x);
        minPos[1] = Math.min(minPos[1], y);
        minPos[2] = Math.min(minPos[2], z);
        maxPos[0] = Math.max(maxPos[0], x);
        maxPos[1] = Math.max(maxPos[1], y);
        maxPos[2] = Math.max(maxPos[2], z);
      }
    }

    const stride = cols + 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i0 = startIdx + r * stride + c;
        const i1 = i0 + 1;
        const i2 = i0 + stride;
        const i3 = i2 + 1;

        indices.push(i0, i2, i1);
        indices.push(i1, i2, i3);
      }
    }
    vertexOffset += (rows + 1) * stride;
  }

  const posBuf = Buffer.from(new Float32Array(positions).buffer);
  const normBuf = Buffer.from(new Float32Array(normals).buffer);
  const uvBuf = Buffer.from(new Float32Array(uvs).buffer);
  const indBuf = Buffer.from(new Uint16Array(indices).buffer);

  function pad4(buf: Buffer): Buffer {
    const rem = buf.length % 4;
    if (rem === 0) return buf;
    return Buffer.concat([buf, Buffer.alloc(4 - rem)]);
  }

  const paddedPos = pad4(posBuf);
  const paddedNorm = pad4(normBuf);
  const paddedUv = pad4(uvBuf);
  const paddedInd = pad4(indBuf);
  const paddedImg = pad4(imgBuffer);

  const bv0_offset = 0;
  const bv0_len = posBuf.length;

  const bv1_offset = bv0_offset + paddedPos.length;
  const bv1_len = normBuf.length;

  const bv2_offset = bv1_offset + paddedNorm.length;
  const bv2_len = uvBuf.length;

  const bv3_offset = bv2_offset + paddedUv.length;
  const bv3_len = indBuf.length;

  const bv4_offset = bv3_offset + paddedInd.length;
  const bv4_len = imgBuffer.length;

  const totalBinLen = bv4_offset + paddedImg.length;
  const binChunkData = Buffer.concat([
    paddedPos,
    paddedNorm,
    paddedUv,
    paddedInd,
    paddedImg,
  ]);

  const gltf = {
    asset: { version: '2.0', generator: 'Plantin Crossed-Quads Spherical Normals Generator' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: 'plant_crossed_quads_mesh' }],
    meshes: [
      {
        primitives: [
          {
            attributes: {
              POSITION: 0,
              NORMAL: 1,
              TEXCOORD_0: 2,
            },
            indices: 3,
            material: 0,
          },
        ],
      },
    ],
    materials: [
      {
        name: 'Mat_Botanical_CrossedQuads',
        pbrMetallicRoughness: {
          baseColorTexture: { index: 0 },
          metallicFactor: 0.0,
          roughnessFactor: 0.65,
        },
        alphaMode: 'MASK',
        alphaCutoff: 0.45,
        doubleSided: true,
      },
    ],
    textures: [{ sampler: 0, source: 0 }],
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
    images: [{ bufferView: 4, mimeType: 'image/png', name: 'tex_diffuse' }],
    bufferViews: [
      { buffer: 0, byteOffset: bv0_offset, byteLength: bv0_len, target: 34962 },
      { buffer: 0, byteOffset: bv1_offset, byteLength: bv1_len, target: 34962 },
      { buffer: 0, byteOffset: bv2_offset, byteLength: bv2_len, target: 34962 },
      { buffer: 0, byteOffset: bv3_offset, byteLength: bv3_len, target: 34963 },
      { buffer: 0, byteOffset: bv4_offset, byteLength: bv4_len },
    ],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: 5126,
        count: positions.length / 3,
        type: 'VEC3',
        min: minPos,
        max: maxPos,
      },
      {
        bufferView: 1,
        byteOffset: 0,
        componentType: 5126,
        count: normals.length / 3,
        type: 'VEC3',
      },
      {
        bufferView: 2,
        byteOffset: 0,
        componentType: 5126,
        count: uvs.length / 2,
        type: 'VEC2',
      },
      {
        bufferView: 3,
        byteOffset: 0,
        componentType: 5123,
        count: indices.length,
        type: 'SCALAR',
      },
    ],
    buffers: [{ byteLength: totalBinLen }],
  };

  const jsonStr = JSON.stringify(gltf);
  let jsonBuf = Buffer.from(jsonStr, 'utf8');
  const jsonRem = jsonBuf.length % 4;
  if (jsonRem !== 0) {
    jsonBuf = Buffer.concat([jsonBuf, Buffer.from(' '.repeat(4 - jsonRem), 'utf8')]);
  }

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 4, 'ascii');
  header.writeUInt32LE(2, 4);
  const totalLength = 12 + 8 + jsonBuf.length + 8 + binChunkData.length;
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonBuf.length, 0);
  jsonHeader.write('JSON', 4, 4, 'ascii');

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunkData.length, 0);
  binHeader.write('BIN\0', 4, 4, 'ascii');

  const glbBuffer = Buffer.concat([header, jsonHeader, jsonBuf, binHeader, binChunkData]);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, glbBuffer);
  console.log(`[CrossedQuads] Exported ${outputPath} (${(glbBuffer.length / 1024).toFixed(1)} KB)`);
}

// Execute generator
generateCrossedQuadsGlb({
  inputImagePath: 'public/textures/plants/TOM/fruiting_highres.png',
  outputPath: 'public/models/plants/plant_tomato_star_a01.glb',
  widthM: 0.72,
  heightM: 0.86,
  numPlanes: 2,
  cols: 4,
  rows: 4,
});
