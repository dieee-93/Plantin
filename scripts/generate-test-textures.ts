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

// 5. Stylized Grass Lawn SVG (1024x1024 seamless)
function generateGrassSvg(): string {
  const width = 1024;
  const height = 1024;
  const cols = 32;
  const rows = 32;
  const cellW = width / cols;
  const cellH = height / rows;

  let bladesSvg = '';
  const grassShades = ['#4d7c0f', '#65a30d', '#84cc16', '#3f6212', '#497e10', '#5b8e14'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = (r * 31 + c * 47) % 100;
      const x = c * cellW + (seed % 9) - 4;
      const y = r * cellH + ((seed * 3) % 9) - 4;
      const shade = grassShades[seed % grassShades.length];
      const shade2 = grassShades[(seed + 2) % grassShades.length];
      const bladeH = 18 + (seed % 14);

      // Clustered grass tuft
      bladesSvg += `
        <path d="M ${x} ${y + bladeH} Q ${x - 6} ${y + bladeH / 2} ${x - 4} ${y} Q ${x - 1} ${y + bladeH / 2} ${x + 2} ${y + bladeH}" fill="${shade}" opacity="0.9" />
        <path d="M ${x + 4} ${y + bladeH} Q ${x + 8} ${y + bladeH / 2} ${x + 9} ${y + 2} Q ${x + 5} ${y + bladeH / 2} ${x + 2} ${y + bladeH}" fill="${shade2}" opacity="0.85" />
      `;
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#365314" />
      ${bladesSvg}
    </svg>
  `;
}

// 6. Stylized Gravel / River Stones SVG (1024x1024 seamless)
function generateGravelSvg(): string {
  const width = 1024;
  const height = 1024;
  const cols = 20;
  const rows = 20;
  const cellW = width / cols;
  const cellH = height / rows;

  let stonesSvg = '';
  const stoneShades = ['#78716c', '#a8a29e', '#57534e', '#d6d3d1', '#44403c', '#8c857f'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = (r * 19 + c * 29) % 100;
      const cx = c * cellW + cellW / 2 + ((seed % 15) - 7);
      const cy = r * cellH + cellH / 2 + (((seed * 5) % 15) - 7);
      const rx = 14 + (seed % 10);
      const ry = 11 + ((seed * 3) % 9);
      const rot = (seed * 17) % 360;
      const color = stoneShades[seed % stoneShades.length];

      stonesSvg += `
        <g transform="translate(${cx}, ${cy}) rotate(${rot})">
          <!-- Ambient contact drop shadow -->
          <ellipse cx="2" cy="4" rx="${rx}" ry="${ry}" fill="#1c1917" opacity="0.45" />
          <!-- Pebble body -->
          <ellipse cx="0" cy="0" rx="${rx}" ry="${ry}" fill="${color}" />
          <!-- Specular bevel highlight -->
          <ellipse cx="${-rx * 0.25}" cy="${-ry * 0.25}" rx="${rx * 0.45}" ry="${ry * 0.35}" fill="#ffffff" opacity="0.22" />
        </g>
      `;
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#292524" />
      ${stonesSvg}
    </svg>
  `;
}

// 7. Stylized Tiles / Ceramic Pavers SVG (1024x1024 seamless)
function generateTilesSvg(): string {
  const width = 1024;
  const height = 1024;
  const gridCount = 4; // 4x4 tiles (256x256 each)
  const tileSize = width / gridCount;
  const groutWidth = 8;

  let tilesSvg = '';
  const tileShades = ['#cbd5e1', '#dbeafe', '#e2e8f0', '#c7d2fe', '#d1d5db'];

  for (let r = 0; r < gridCount; r++) {
    for (let c = 0; c < gridCount; c++) {
      const x = c * tileSize + groutWidth / 2;
      const y = r * tileSize + groutWidth / 2;
      const size = tileSize - groutWidth;
      const color = tileShades[(r * 3 + c * 2) % tileShades.length];

      tilesSvg += `
        <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="4" ry="4" fill="${color}" />
        <!-- Tile surface subtle highlight -->
        <rect x="${x + 4}" y="${y + 4}" width="${size - 8}" height="${size - 8}" fill="#ffffff" opacity="0.08" />
        <!-- Top and left bevel highlights -->
        <line x1="${x + 2}" y1="${y + 2}" x2="${x + size - 2}" y2="${y + 2}" stroke="#ffffff" stroke-width="2" opacity="0.6" />
        <line x1="${x + 2}" y1="${y + 2}" x2="${x + 2}" y2="${y + size - 2}" stroke="#ffffff" stroke-width="2" opacity="0.6" />
        <!-- Bottom and right bevel shadows -->
        <line x1="${x + 2}" y1="${y + size - 2}" x2="${x + size - 2}" y2="${y + size - 2}" stroke="#64748b" stroke-width="2" opacity="0.5" />
        <line x1="${x + size - 2}" y1="${y + 2}" x2="${x + size - 2}" y2="${y + size - 2}" stroke="#64748b" stroke-width="2" opacity="0.5" />
      `;
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#64748b" />
      ${tilesSvg}
    </svg>
  `;
}

// 8. Stylized Organic Mulch / Bark Chips SVG (1024x1024 seamless)
function generateMulchSvg(): string {
  const width = 1024;
  const height = 1024;
  const cols = 24;
  const rows = 24;
  const cellW = width / cols;
  const cellH = height / rows;

  let mulchSvg = '';
  const mulchShades = ['#582e0c', '#713f12', '#854d0e', '#451a03', '#623514', '#3d1d07'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = (r * 23 + c * 37) % 100;
      const x = c * cellW + cellW / 2 + ((seed % 11) - 5);
      const y = r * cellH + cellH / 2 + (((seed * 7) % 11) - 5);
      const chipW = 28 + (seed % 18);
      const chipH = 12 + ((seed * 3) % 10);
      const angle = ((seed * 29) % 180) - 90;
      const color = mulchShades[seed % mulchShades.length];

      mulchSvg += `
        <g transform="translate(${x}, ${y}) rotate(${angle})">
          <rect x="${-chipW / 2 + 1}" y="${-chipH / 2 + 2}" width="${chipW}" height="${chipH}" rx="3" ry="3" fill="#1c0f05" opacity="0.5" />
          <rect x="${-chipW / 2}" y="${-chipH / 2}" width="${chipW}" height="${chipH}" rx="3" ry="3" fill="${color}" />
          <line x1="${-chipW * 0.4}" y1="0" x2="${chipW * 0.3}" y2="0" stroke="#a16207" stroke-width="1.5" opacity="0.35" />
        </g>
      `;
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#291307" />
      ${mulchSvg}
    </svg>
  `;
}

// 9. Stylized Wood Fence Pickets SVG (1024x1024 seamless)
function generateWoodFenceSvg(): string {
  const width = 1024;
  const height = 1024;
  const pickets = 8;
  const picketWidth = width / pickets; // 128px per picket
  const margin = 5;

  let picketsSvg = '';
  const woodShades = ['#92400e', '#a16207', '#854d0e', '#78350f', '#b45309'];

  for (let i = 0; i < pickets; i++) {
    const x = i * picketWidth + margin;
    const w = picketWidth - margin * 2;
    const shade = woodShades[i % woodShades.length];

    picketsSvg += `
      <!-- Picket body -->
      <rect x="${x}" y="0" width="${w}" height="${height}" rx="4" ry="4" fill="${shade}" />
      <!-- Vertical wood grain lines -->
      <line x1="${x + w * 0.25}" y1="0" x2="${x + w * 0.25}" y2="${height}" stroke="#5e2908" stroke-width="2" opacity="0.35" />
      <line x1="${x + w * 0.6}" y1="0" x2="${x + w * 0.6}" y2="${height}" stroke="#5e2908" stroke-width="2" opacity="0.3" />
      <line x1="${x + w * 0.8}" y1="0" x2="${x + w * 0.8}" y2="${height}" stroke="#5e2908" stroke-width="1.5" opacity="0.25" />
      <!-- Left bevel highlight -->
      <line x1="${x + 2}" y1="0" x2="${x + 2}" y2="${height}" stroke="#fde68a" stroke-width="2" opacity="0.25" />
      <!-- Right bevel shadow -->
      <line x1="${x + w - 2}" y1="0" x2="${x + w - 2}" y2="${height}" stroke="#3b1a04" stroke-width="2" opacity="0.4" />
    `;
  }

  // Horizontal support rails across pickets
  const railH = 70;
  const rail1Y = 220;
  const rail2Y = 740;
  const railsSvg = `
    <rect x="0" y="${rail1Y}" width="${width}" height="${railH}" fill="#78350f" opacity="0.85" />
    <line x1="0" y1="${rail1Y + 2}" x2="${width}" y2="${rail1Y + 2}" stroke="#fde68a" stroke-width="2" opacity="0.2" />
    <line x1="0" y1="${rail1Y + railH - 2}" x2="${width}" y2="${rail1Y + railH - 2}" stroke="#291203" stroke-width="2" opacity="0.5" />
    <rect x="0" y="${rail2Y}" width="${width}" height="${railH}" fill="#78350f" opacity="0.85" />
    <line x1="0" y1="${rail2Y + 2}" x2="${width}" y2="${rail2Y + 2}" stroke="#fde68a" stroke-width="2" opacity="0.2" />
    <line x1="0" y1="${rail2Y + railH - 2}" x2="${width}" y2="${rail2Y + railH - 2}" stroke="#291203" stroke-width="2" opacity="0.5" />
  `;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#291406" />
      ${picketsSvg}
      ${railsSvg}
    </svg>
  `;
}

// 10. Stylized Drywall / Modern Architectural Plaster SVG (1024x1024 seamless)
function generateDrywallSvg(): string {
  const width = 1024;
  const height = 1024;

  let specksSvg = '';
  const cols = 32;
  const rows = 32;
  const cellW = width / cols;
  const cellH = height / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = (r * 29 + c * 43) % 100;
      const x = c * cellW + (seed % 17);
      const y = r * cellH + ((seed * 7) % 17);
      const opacity = 0.05 + ((seed % 10) * 0.015);
      const color = seed % 2 === 0 ? '#ffffff' : '#cbd5e1';

      specksSvg += `
        <circle cx="${x}" cy="${y}" r="2" fill="${color}" opacity="${opacity}" />
      `;
    }
  }

  // Subtle vertical panel seam
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#e2e8f0" />
      ${specksSvg}
      <!-- Subtle vertical drywall sheet joint -->
      <line x1="512" y1="0" x2="512" y2="${height}" stroke="#94a3b8" stroke-width="1.5" opacity="0.25" />
      <line x1="513" y1="0" x2="513" y2="${height}" stroke="#ffffff" stroke-width="1.5" opacity="0.25" />
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

  // 5. Grass Lawn Texture
  const grassDir = path.join(TEXTURES_DIR, 'floors/grass');
  ensureDir(grassDir);
  const grassSvg = generateGrassSvg();
  const grassWebpPath = path.join(grassDir, 'albedo.webp');
  await sharp(Buffer.from(grassSvg)).webp({ quality: 90 }).toFile(grassWebpPath);
  console.log(`[OK] Created: ${grassWebpPath}`);

  // 6. Gravel Texture
  const gravelDir = path.join(TEXTURES_DIR, 'floors/gravel');
  ensureDir(gravelDir);
  const gravelSvg = generateGravelSvg();
  const gravelWebpPath = path.join(gravelDir, 'albedo.webp');
  await sharp(Buffer.from(gravelSvg)).webp({ quality: 90 }).toFile(gravelWebpPath);
  console.log(`[OK] Created: ${gravelWebpPath}`);

  // 7. Tile Texture
  const tileDir = path.join(TEXTURES_DIR, 'floors/tile');
  ensureDir(tileDir);
  const tileSvg = generateTilesSvg();
  const tileWebpPath = path.join(tileDir, 'albedo.webp');
  await sharp(Buffer.from(tileSvg)).webp({ quality: 90 }).toFile(tileWebpPath);
  console.log(`[OK] Created: ${tileWebpPath}`);

  // 8. Mulch Texture
  const mulchDir = path.join(TEXTURES_DIR, 'floors/mulch');
  ensureDir(mulchDir);
  const mulchSvg = generateMulchSvg();
  const mulchWebpPath = path.join(mulchDir, 'albedo.webp');
  await sharp(Buffer.from(mulchSvg)).webp({ quality: 90 }).toFile(mulchWebpPath);
  console.log(`[OK] Created: ${mulchWebpPath}`);

  // 9. Wood Fence Texture
  const woodFenceDir = path.join(TEXTURES_DIR, 'walls/wood_fence');
  ensureDir(woodFenceDir);
  const woodFenceSvg = generateWoodFenceSvg();
  const woodFenceWebpPath = path.join(woodFenceDir, 'albedo.webp');
  await sharp(Buffer.from(woodFenceSvg)).webp({ quality: 90 }).toFile(woodFenceWebpPath);
  console.log(`[OK] Created: ${woodFenceWebpPath}`);

  // 10. Drywall Texture
  const drywallDir = path.join(TEXTURES_DIR, 'walls/drywall');
  ensureDir(drywallDir);
  const drywallSvg = generateDrywallSvg();
  const drywallWebpPath = path.join(drywallDir, 'albedo.webp');
  await sharp(Buffer.from(drywallSvg)).webp({ quality: 90 }).toFile(drywallWebpPath);
  console.log(`[OK] Created: ${drywallWebpPath}`);

  console.log('--- All test textures generated successfully ---');
}

buildTextures().catch((err) => {
  console.error('Error generating textures:', err);
  process.exit(1);
});
