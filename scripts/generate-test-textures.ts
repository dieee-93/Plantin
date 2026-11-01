import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const TEXTURES_DIR = path.resolve(process.cwd(), 'public/textures');

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 1. Stylized Brick Wall SVG (1024x1024 seamless)
function generateBrickSvg(): string {
  const width = 1024;
  const height = 1024;
  const rows = 8;
  const rowHeight = height / rows; // 128px per row
  const brickWidth = 256; // 4 bricks per row
  const mortarColor = '#57534e'; // warm grey stone mortar

  let bricksSvg = '';
  const brickColors = ['#c2410c', '#b45309', '#9a3412', '#a16207', '#c85a17'];

  for (let r = 0; r < rows; r++) {
    const y = r * rowHeight;
    const isShifted = r % 2 === 1;
    const xOffset = isShifted ? -brickWidth / 2 : 0;
    const count = isShifted ? 5 : 4;

    for (let c = 0; c <= count; c++) {
      const x = xOffset + c * brickWidth;
      const color = brickColors[(r * 3 + c * 5) % brickColors.length];
      const margin = 8;
      const bW = brickWidth - margin * 2;
      const bH = rowHeight - margin * 2;
      const bX = x + margin;
      const bY = y + margin;

      // Stylized rounded clay brick with gradient
      bricksSvg += `
        <rect x="${bX}" y="${bY}" width="${bW}" height="${bH}" rx="10" ry="10" fill="${color}" filter="url(#shadow)" />
        <rect x="${bX + 4}" y="${bY + 4}" width="${bW - 8}" height="${bH / 2}" rx="6" ry="6" fill="#ffffff" opacity="0.12" />
      `;
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="#1c1917" flood-opacity="0.45" />
        </filter>
      </defs>
      <rect width="${width}" height="${height}" fill="${mortarColor}" />
      ${bricksSvg}
    </svg>
  `;
}

// 2. Stylized Wood Planks SVG (1024x1024 seamless, neutral tintable)
function generateWoodPlanksSvg(): string {
  const width = 1024;
  const height = 1024;
  const plankCount = 4;
  const plankHeight = height / plankCount; // 256px per plank

  let planksSvg = '';
  const woodShades = ['#e7dec8', '#ded3bb', '#ebd9c0', '#e2d6be'];

  for (let i = 0; i < plankCount; i++) {
    const y = i * plankHeight;
    const shade = woodShades[i % woodShades.length];
    const margin = 4;
    const pY = y + margin;
    const pH = plankHeight - margin * 2;

    planksSvg += `
      <rect x="0" y="${pY}" width="${width}" height="${pH}" fill="${shade}" />
      <!-- Subtle plank wood grain stripes -->
      <path d="M 0 ${pY + 40} Q 256 ${pY + 35} 512 ${pY + 42} T 1024 ${pY + 40}" stroke="#bfa98e" stroke-width="2" fill="none" opacity="0.4" />
      <path d="M 0 ${pY + 110} Q 300 ${pY + 115} 600 ${pY + 105} T 1024 ${pY + 110}" stroke="#bfa98e" stroke-width="3" fill="none" opacity="0.35" />
      <path d="M 0 ${pY + 180} Q 200 ${pY + 175} 700 ${pY + 185} T 1024 ${pY + 180}" stroke="#bfa98e" stroke-width="2" fill="none" opacity="0.3" />
      <!-- Highlight bevel top -->
      <line x1="0" y1="${pY}" x2="${width}" y2="${pY}" stroke="#fff" stroke-width="3" opacity="0.3" />
      <!-- Shadow bevel bottom -->
      <line x1="0" y1="${pY + pH}" x2="${width}" y2="${pY + pH}" stroke="#574c3d" stroke-width="3" opacity="0.4" />
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#443a2e" />
      ${planksSvg}
    </svg>
  `;
}

// 3. Stylized Fertile Loam Soil SVG (1024x1024 seamless)
function generateSoilSvg(): string {
  const width = 1024;
  const height = 1024;

  let clodsSvg = '';
  const cols = 16;
  const rows = 16;
  const cellW = width / cols;
  const cellH = height / rows;

  const soilColors = ['#452a1d', '#553424', '#3d2317', '#503222', '#361e13'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = (r * 17 + c * 31) % 100;
      const radius = 18 + (seed % 14);
      const cx = c * cellW + cellW / 2 + ((seed % 15) - 7);
      const cy = r * cellH + cellH / 2 + (((seed * 7) % 15) - 7);
      const color = soilColors[seed % soilColors.length];

      clodsSvg += `
        <ellipse cx="${cx}" cy="${cy}" rx="${radius}" ry="${radius * 0.8}" fill="${color}" opacity="0.85" />
        <ellipse cx="${cx - radius * 0.2}" cy="${cy - radius * 0.2}" rx="${radius * 0.4}" ry="${radius * 0.3}" fill="#6b4430" opacity="0.5" />
      `;
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#2e190f" />
      ${clodsSvg}
    </svg>
  `;
}

// 4. Stylized Concrete Pavers SVG (1024x1024 seamless)
function generateConcreteSvg(): string {
  const width = 1024;
  const height = 1024;
  const slabs = 2; // 2x2 large slabs of 512x512
  const slabSize = width / slabs;
  const margin = 6;

  let slabsSvg = '';
  const slabColors = ['#94a3b8', '#8b9ab0', '#9aa7ba', '#90a0b5'];

  for (let r = 0; r < slabs; r++) {
    for (let c = 0; c < slabs; c++) {
      const x = c * slabSize + margin;
      const y = r * slabSize + margin;
      const w = slabSize - margin * 2;
      const h = slabSize - margin * 2;
      const color = slabColors[(r * 2 + c) % slabColors.length];

      slabsSvg += `
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" ry="6" fill="${color}" />
        <!-- Top bevel highlight -->
        <line x1="${x + 2}" y1="${y + 2}" x2="${x + w - 2}" y2="${y + 2}" stroke="#cbd5e1" stroke-width="2" opacity="0.6" />
        <!-- Left bevel highlight -->
        <line x1="${x + 2}" y1="${y + 2}" x2="${x + 2}" y2="${y + h - 2}" stroke="#cbd5e1" stroke-width="2" opacity="0.6" />
        <!-- Bottom bevel shadow -->
        <line x1="${x + 2}" y1="${y + h - 2}" x2="${x + w - 2}" y2="${y + h - 2}" stroke="#475569" stroke-width="2" opacity="0.7" />
        <!-- Right bevel shadow -->
        <line x1="${x + w - 2}" y1="${y + 2}" x2="${x + w - 2}" y2="${y + h - 2}" stroke="#475569" stroke-width="2" opacity="0.7" />
      `;
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#334155" />
      ${slabsSvg}
    </svg>
  `;
}

async function buildTextures() {
  console.log('--- Generating Stylized 3D Test Textures ---');

  // 1. Soil Texture
  const soilDir = path.join(TEXTURES_DIR, 'floors/soil');
  ensureDir(soilDir);
  const soilSvg = generateSoilSvg();
  const soilWebpPath = path.join(soilDir, 'albedo.webp');
  await sharp(Buffer.from(soilSvg)).webp({ quality: 90 }).toFile(soilWebpPath);
  console.log(`[OK] Created: ${soilWebpPath}`);

  // 2. Brick Wall Texture
  const brickDir = path.join(TEXTURES_DIR, 'walls/brick');
  ensureDir(brickDir);
  const brickSvg = generateBrickSvg();
  const brickWebpPath = path.join(brickDir, 'albedo.webp');
  await sharp(Buffer.from(brickSvg)).webp({ quality: 90 }).toFile(brickWebpPath);
  console.log(`[OK] Created: ${brickWebpPath}`);

  // 3. Wood Planks Texture
  const woodDir = path.join(TEXTURES_DIR, 'floors/wood');
  ensureDir(woodDir);
  const woodSvg = generateWoodPlanksSvg();
  const woodWebpPath = path.join(woodDir, 'albedo.webp');
  await sharp(Buffer.from(woodSvg)).webp({ quality: 90 }).toFile(woodWebpPath);
  console.log(`[OK] Created: ${woodWebpPath}`);

  // 4. Concrete Pavers (Floors and Walls)
  const concreteFloorDir = path.join(TEXTURES_DIR, 'floors/concrete');
  const concreteWallDir = path.join(TEXTURES_DIR, 'walls/concrete');
  ensureDir(concreteFloorDir);
  ensureDir(concreteWallDir);
  const concreteSvg = generateConcreteSvg();
  const concreteFloorPath = path.join(concreteFloorDir, 'albedo.webp');
  const concreteWallPath = path.join(concreteWallDir, 'albedo.webp');
  await sharp(Buffer.from(concreteSvg)).webp({ quality: 90 }).toFile(concreteFloorPath);
  await sharp(Buffer.from(concreteSvg)).webp({ quality: 90 }).toFile(concreteWallPath);
  console.log(`[OK] Created: ${concreteFloorPath}`);
  console.log(`[OK] Created: ${concreteWallPath}`);

  console.log('--- All test textures generated successfully ---');
}

buildTextures().catch((err) => {
  console.error('Error generating textures:', err);
  process.exit(1);
});
