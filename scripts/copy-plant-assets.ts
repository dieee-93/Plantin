import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve(process.cwd(), 'assets-src/out');
const DEST_DIR = path.resolve(process.cwd(), 'public/textures/plants');

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function copyPlantAssets() {
  console.log('--- Copying 2.5D Plant Assets to Public Textures ---');
  ensureDir(DEST_DIR);

  if (!fs.existsSync(SRC_DIR)) {
    console.warn(`Source directory not found: ${SRC_DIR}`);
    return;
  }

  const entries = fs.readdirSync(SRC_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('plant.')) continue;

    const plantKey = entry.name.replace('plant.', '').toUpperCase(); // e.g. TOM, CARROT
    const plantSrcDir = path.join(SRC_DIR, entry.name);
    const plantDestDir = path.join(DEST_DIR, plantKey);

    ensureDir(plantDestDir);

    const files = fs.readdirSync(plantSrcDir);
    for (const file of files) {
      if (file.endsWith('.webp')) {
        const srcFile = path.join(plantSrcDir, file);
        const destFile = path.join(plantDestDir, file);
        fs.copyFileSync(srcFile, destFile);
        console.log(`[OK] Copied: ${plantKey}/${file}`);
      }
    }
  }

  console.log('--- Plant Assets Copy Completed ---');
}

copyPlantAssets().catch((err) => {
  console.error('Error copying plant assets:', err);
  process.exit(1);
});
