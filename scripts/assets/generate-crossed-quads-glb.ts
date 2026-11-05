import fs from 'node:fs';
import path from 'node:path';

/**
 * Generates an optimized glTF 2.0 binary (.glb) asset using the Crossed-Quads (Star-Billboard) technique.
 * - Creates intersecting vertical planes in a radial star pattern (e.g. 3 planes at 60° angles)
 * - Sets alphaMode="MASK" (alphaCutoff 0.5) and doubleSided=true for crisp shadow casting and depth sorting
 * - Bends vertex normals outward/upward for soft volumetric foliage lighting
 * - Embeds high-resolution transparent textures directly into the self-contained GLB
 */
export function generateCrossedQuadsGlb(options: {
  imagePngPath: string;
  outputPath: string;
  widthM: number;
  heightM: number;
  numPlanes?: number;
}): void {
  const { imagePngPath, outputPath, widthM, heightM, numPlanes = 3 } = options;
  const imgBuffer = fs.readFileSync(imagePngPath);

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  let vertexOffset = 0;
  const minPos = [Infinity, Infinity, Infinity];
  const maxPos = [-Infinity, -Infinity, -Infinity];

  for (let p = 0; p < numPlanes; p++) {
    const angle = (p * Math.PI) / numPlanes;
    const dx = (widthM / 2) * Math.cos(angle);
    const dz = (widthM / 2) * Math.sin(angle);

    const verts = [
      { x: -dx, y: 0, z: -dz, u: 0, v: 1 },
      { x: dx, y: 0, z: dz, u: 1, v: 1 },
      { x: -dx, y: heightM, z: -dz, u: 0, v: 0 },
      { x: dx, y: heightM, z: dz, u: 1, v: 0 },
    ];

    for (const vert of verts) {
      positions.push(vert.x, vert.y, vert.z);
      uvs.push(vert.u, vert.v);

      const len = Math.hypot(vert.x, vert.z) || 1;
      const nx = (vert.x / len) * 0.85;
      const ny = 0.4;
      const nz = (vert.z / len) * 0.85;
      const nlen = Math.hypot(nx, ny, nz);
      normals.push(nx / nlen, ny / nlen, nz / nlen);

      minPos[0] = Math.min(minPos[0], vert.x);
      minPos[1] = Math.min(minPos[1], vert.y);
      minPos[2] = Math.min(minPos[2], vert.z);
      maxPos[0] = Math.max(maxPos[0], vert.x);
      maxPos[1] = Math.max(maxPos[1], vert.y);
      maxPos[2] = Math.max(maxPos[2], vert.z);
    }

    indices.push(
      vertexOffset + 0,
      vertexOffset + 1,
      vertexOffset + 2,
      vertexOffset + 1,
      vertexOffset + 3,
      vertexOffset + 2,
    );
    vertexOffset += 4;
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
    asset: { version: '2.0', generator: 'Plantin Crossed-Quads Generator' },
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
          roughnessFactor: 0.55,
        },
        alphaMode: 'MASK',
        alphaCutoff: 0.5,
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

// Run if called directly
if (process.argv[1] && process.argv[1].includes('generate-crossed-quads-glb')) {
  generateCrossedQuadsGlb({
    imagePngPath: 'public/textures/plants/TOM/fruiting_highres.png',
    outputPath: 'public/models/plants/plant_tomato_star_a01.glb',
    widthM: 0.68,
    heightM: 0.86,
    numPlanes: 3,
  });
}
