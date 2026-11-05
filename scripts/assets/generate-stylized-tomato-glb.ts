import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Polyfill FileReader for Three.js GLTFExporter in Node.js
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    result: ArrayBuffer | null = null;
    onloadend: (() => void) | null = null;

    async readAsArrayBuffer(blob: Blob) {
      this.result = await blob.arrayBuffer();
      if (this.onloadend) this.onloadend();
    }
  } as unknown as typeof globalThis.FileReader;
}

// ── PBR Materials (Clay / Stylized Palette) ──
const matStem = new THREE.MeshStandardMaterial({
  name: 'Mat_Tomato_Stem',
  color: new THREE.Color('#437834'),
  roughness: 0.52,
  metalness: 0.02,
});

const matLeaf = new THREE.MeshStandardMaterial({
  name: 'Mat_Tomato_Leaf',
  color: new THREE.Color('#2d6325'),
  roughness: 0.38,
  metalness: 0.0,
  side: THREE.DoubleSide,
});

const matLeafUnder = new THREE.MeshStandardMaterial({
  name: 'Mat_Tomato_Leaf_Under',
  color: new THREE.Color('#3b7931'),
  roughness: 0.45,
  metalness: 0.0,
});

const matTomatoRipe = new THREE.MeshStandardMaterial({
  name: 'Mat_Tomato_Ripe',
  color: new THREE.Color('#d9241c'),
  roughness: 0.12, // High-gloss wet skin
  metalness: 0.03,
});

const matTomatoOrange = new THREE.MeshStandardMaterial({
  name: 'Mat_Tomato_Orange',
  color: new THREE.Color('#f07c1a'),
  roughness: 0.16,
  metalness: 0.03,
});

const matTomatoGreen = new THREE.MeshStandardMaterial({
  name: 'Mat_Tomato_Green',
  color: new THREE.Color('#6ba331'),
  roughness: 0.22,
  metalness: 0.02,
});

const matFlowerYellow = new THREE.MeshStandardMaterial({
  name: 'Mat_Tomato_Flower',
  color: new THREE.Color('#ffcc00'),
  roughness: 0.35,
  metalness: 0.0,
});

const matFlowerCenter = new THREE.MeshStandardMaterial({
  name: 'Mat_Tomato_Flower_Center',
  color: new THREE.Color('#98be38'),
  roughness: 0.5,
  metalness: 0.0,
});

// ── Helper 1: Tapered Spline Tube ──
function createTaperedTube(
  curve: THREE.Curve<THREE.Vector3>,
  radiusStart: number,
  radiusEnd: number,
  tubularSegments = 24,
  radialSegments = 10,
): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const frames = curve.computeFrenetFrames(tubularSegments, false);

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    const pt = curve.getPointAt(t);
    const radius = radiusStart + (radiusEnd - radiusStart) * t;
    const N = frames.normals[i];
    const B = frames.binormals[i];

    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;
      const sin = Math.sin(theta);
      const cos = Math.cos(theta);

      const normal = new THREE.Vector3()
        .addScaledVector(N, cos)
        .addScaledVector(B, sin)
        .normalize();

      const vertex = new THREE.Vector3()
        .copy(pt)
        .addScaledVector(normal, radius);

      positions.push(vertex.x, vertex.y, vertex.z);
      normals.push(normal.x, normal.y, normal.z);
      uvs.push(j / radialSegments, t);
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = (i + 1) * (radialSegments + 1) + (j + 1);
      const d = i * (radialSegments + 1) + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

// ── Helper 2: Stylized Clay Leaflet (with V-crease, arch & thickness) ──
function createStylizedLeaflet(lengthM: number, widthM: number, thicknessM = 0.003): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const segX = 8;
  const segY = 4;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Top surface and bottom surface to form a soft volumetric cushion
  for (let layer = 0; layer < 2; layer++) {
    const isTop = layer === 0;
    const zOffset = isTop ? thicknessM * 0.5 : -thicknessM * 0.5;

    for (let i = 0; i <= segX; i++) {
      const u = i / segX; // 0 (base) to 1 (tip)
      // Teardrop / lanceolate silhouette profile
      const widthFactor = Math.sin(u * Math.PI) * Math.pow(1 - u * 0.35, 0.7);
      const currentHalfWidth = (widthM * 0.5) * widthFactor;
      // Arch: leaf arches downward under gravity
      const archY = -Math.pow(u, 1.8) * (lengthM * 0.28);
      const posX = u * lengthM;

      for (let j = 0; j <= segY; j++) {
        const v = (j / segY) * 2 - 1; // -1 (left edge) to 0 (midrib) to 1 (right edge)
        const posZ = v * currentHalfWidth;
        // Central V-crease: midrib (v=0) is slightly depressed
        const vCrease = (1 - Math.abs(v)) * (widthM * 0.12) * (isTop ? -1 : 0.6);
        const posY = archY + vCrease + zOffset;

        positions.push(posX, posY, posZ);
        uvs.push(u, (v + 1) * 0.5);
      }
    }
  }

  const stride = (segX + 1) * (segY + 1);

  // Top surface faces
  for (let i = 0; i < segX; i++) {
    for (let j = 0; j < segY; j++) {
      const a = i * (segY + 1) + j;
      const b = (i + 1) * (segY + 1) + j;
      const c = (i + 1) * (segY + 1) + (j + 1);
      const d = i * (segY + 1) + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  // Bottom surface faces (reversed winding)
  for (let i = 0; i < segX; i++) {
    for (let j = 0; j < segY; j++) {
      const a = stride + i * (segY + 1) + j;
      const b = stride + (i + 1) * (segY + 1) + j;
      const c = stride + (i + 1) * (segY + 1) + (j + 1);
      const d = stride + i * (segY + 1) + (j + 1);
      indices.push(a, d, b);
      indices.push(b, d, c);
    }
  }

  // Edge sewing between top and bottom layers for closed solid
  for (let i = 0; i < segX; i++) {
    // Left edge (j = 0)
    const tA = i * (segY + 1);
    const tB = (i + 1) * (segY + 1);
    const bA = stride + tA;
    const bB = stride + tB;
    indices.push(tA, bA, tB);
    indices.push(tB, bA, bB);

    // Right edge (j = segY)
    const tC = i * (segY + 1) + segY;
    const tD = (i + 1) * (segY + 1) + segY;
    const bC = stride + tC;
    const bD = stride + tD;
    indices.push(tC, tD, bC);
    indices.push(tD, bD, bC);
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

// ── Helper 3: Compound Pinnate Tomato Leaf Assembly ──
function createCompoundTomatoLeaf(leafLengthM = 0.22): THREE.Group {
  const leafGroup = new THREE.Group();
  leafGroup.name = 'Compound_Tomato_Leaf';

  // Central petiole (rachis)
  const petiolePoints = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(leafLengthM * 0.35, -leafLengthM * 0.03, 0),
    new THREE.Vector3(leafLengthM * 0.7, -leafLengthM * 0.12, 0),
    new THREE.Vector3(leafLengthM, -leafLengthM * 0.25, 0),
  ];
  const petioleCurve = new THREE.CatmullRomCurve3(petiolePoints);
  const petioleGeom = createTaperedTube(petioleCurve, 0.0035, 0.0015, 12, 6);
  const petioleMesh = new THREE.Mesh(petioleGeom, matStem);
  petioleMesh.castShadow = true;
  leafGroup.add(petioleMesh);

  // 1. Terminal Leaflet (tip)
  const terminalGeom = createStylizedLeaflet(leafLengthM * 0.35, leafLengthM * 0.18);
  const terminalMesh = new THREE.Mesh(terminalGeom, matLeaf);
  terminalMesh.position.copy(petiolePoints[3]);
  terminalMesh.rotation.z = -0.4;
  terminalMesh.castShadow = true;
  terminalMesh.receiveShadow = true;
  leafGroup.add(terminalMesh);

  // 2. Lateral pairs (2 pairs of leaflets)
  const pairs = [
    { t: 0.42, length: leafLengthM * 0.28, width: leafLengthM * 0.15, angleDeg: 50 },
    { t: 0.72, length: leafLengthM * 0.24, width: leafLengthM * 0.13, angleDeg: 45 },
  ];

  for (const pair of pairs) {
    const attachPt = petioleCurve.getPointAt(pair.t);

    // Left leaflet
    const leftLeafGeom = createStylizedLeaflet(pair.length, pair.width);
    const leftMesh = new THREE.Mesh(leftLeafGeom, matLeaf);
    leftMesh.position.copy(attachPt);
    leftMesh.rotation.y = THREE.MathUtils.degToRad(pair.angleDeg);
    leftMesh.rotation.x = THREE.MathUtils.degToRad(15);
    leftMesh.rotation.z = THREE.MathUtils.degToRad(-10);
    leftMesh.castShadow = true;
    leftMesh.receiveShadow = true;
    leafGroup.add(leftMesh);

    // Right leaflet
    const rightLeafGeom = createStylizedLeaflet(pair.length, pair.width);
    const rightMesh = new THREE.Mesh(rightLeafGeom, matLeaf);
    rightMesh.position.copy(attachPt);
    rightMesh.rotation.y = THREE.MathUtils.degToRad(-pair.angleDeg);
    rightMesh.rotation.x = THREE.MathUtils.degToRad(-15);
    rightMesh.rotation.z = THREE.MathUtils.degToRad(-10);
    rightMesh.castShadow = true;
    rightMesh.receiveShadow = true;
    leafGroup.add(rightMesh);
  }

  return leafGroup;
}

// ── Helper 4: Tomato Fruit with 5-Pointed Star Calyx & Pedicel ──
function createTomatoFruit(diameterM: number, mat: THREE.Material): THREE.Group {
  const fruitGroup = new THREE.Group();
  fruitGroup.name = 'Tomato_Fruit';

  // 1. Tomato body: Oblate spheroid with top indentation
  const sphereGeom = new THREE.SphereGeometry(diameterM * 0.5, 20, 16);
  // Flatten slightly on Y and expand slightly on X/Z for juicy oblate shape
  sphereGeom.scale(1.05, 0.92, 1.05);

  const fruitMesh = new THREE.Mesh(sphereGeom, mat);
  fruitMesh.castShadow = true;
  fruitMesh.receiveShadow = true;
  fruitGroup.add(fruitMesh);

  // 2. Calyx (5 sepals forming a star on top)
  const calyxGroup = new THREE.Group();
  calyxGroup.position.set(0, diameterM * 0.44, 0);

  const sepalCount = 5;
  const sepalLength = diameterM * 0.42;
  const sepalWidth = diameterM * 0.16;

  for (let i = 0; i < sepalCount; i++) {
    const angle = (i / sepalCount) * Math.PI * 2;
    const sepalGeom = createStylizedLeaflet(sepalLength, sepalWidth, 0.0015);
    const sepalMesh = new THREE.Mesh(sepalGeom, matStem);
    sepalMesh.rotation.y = angle;
    // Angle downward over tomato shoulder
    sepalMesh.rotation.z = THREE.MathUtils.degToRad(35);
    sepalMesh.castShadow = true;
    calyxGroup.add(sepalMesh);
  }
  fruitGroup.add(calyxGroup);

  // 3. Pedicel (small green harvest joint)
  const pedicelPoints = [
    new THREE.Vector3(0, diameterM * 0.44, 0),
    new THREE.Vector3(0, diameterM * 0.44 + 0.015, 0),
    new THREE.Vector3(0.008, diameterM * 0.44 + 0.03, 0),
  ];
  const pedicelCurve = new THREE.CatmullRomCurve3(pedicelPoints);
  const pedicelGeom = createTaperedTube(pedicelCurve, 0.0025, 0.002, 8, 5);
  const pedicelMesh = new THREE.Mesh(pedicelGeom, matStem);
  fruitGroup.add(pedicelMesh);

  return fruitGroup;
}

// ── Helper 5: Yellow Star Flower ──
function createTomatoFlower(): THREE.Group {
  const flowerGroup = new THREE.Group();
  flowerGroup.name = 'Tomato_Flower';

  // 5 pointed yellow petals
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const petalGeom = new THREE.ConeGeometry(0.007, 0.018, 4);
    petalGeom.rotateX(Math.PI / 2);
    const petalMesh = new THREE.Mesh(petalGeom, matFlowerYellow);
    petalMesh.rotation.y = angle;
    petalMesh.rotation.x = 0.35; // flared outward
    flowerGroup.add(petalMesh);
  }

  // Center anther cone
  const coneGeom = new THREE.ConeGeometry(0.004, 0.014, 8);
  coneGeom.rotateX(Math.PI / 2);
  const coneMesh = new THREE.Mesh(coneGeom, matFlowerCenter);
  flowerGroup.add(coneMesh);

  return flowerGroup;
}

// ── Helper 6: Tomato Truss (Cluster of Fruits & Flowers) ──
function createTomatoTruss(isUpperTruss = false): THREE.Group {
  const trussGroup = new THREE.Group();
  trussGroup.name = isUpperTruss ? 'Upper_Tomato_Truss' : 'Lower_Tomato_Truss';

  // Arching stem
  const archPoints = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.04, -0.01, 0.02),
    new THREE.Vector3(0.09, -0.05, 0.03),
    new THREE.Vector3(0.14, -0.11, 0.04),
  ];
  const archCurve = new THREE.CatmullRomCurve3(archPoints);
  const archGeom = createTaperedTube(archCurve, 0.0035, 0.0018, 12, 5);
  const archMesh = new THREE.Mesh(archGeom, matStem);
  trussGroup.add(archMesh);

  if (!isUpperTruss) {
    // Lower cluster: Big Ripe Red, Medium Red, Medium Orange, Small Green
    const f1 = createTomatoFruit(0.062, matTomatoRipe); // 6.2 cm
    f1.position.set(0.045, -0.06, 0.015);
    trussGroup.add(f1);

    const f2 = createTomatoFruit(0.052, matTomatoRipe); // 5.2 cm
    f2.position.set(0.085, -0.09, 0.035);
    trussGroup.add(f2);

    const f3 = createTomatoFruit(0.044, matTomatoOrange); // 4.4 cm
    f3.position.set(0.125, -0.13, 0.02);
    trussGroup.add(f3);

    const f4 = createTomatoFruit(0.034, matTomatoGreen); // 3.4 cm
    f4.position.set(0.155, -0.16, 0.045);
    trussGroup.add(f4);
  } else {
    // Upper cluster: Medium Red, Orange, Green + 2 Flowers
    const f1 = createTomatoFruit(0.050, matTomatoRipe);
    f1.position.set(0.045, -0.05, 0.015);
    trussGroup.add(f1);

    const f2 = createTomatoFruit(0.042, matTomatoOrange);
    f2.position.set(0.085, -0.08, 0.03);
    trussGroup.add(f2);

    const f3 = createTomatoFruit(0.032, matTomatoGreen);
    f3.position.set(0.125, -0.11, 0.015);
    trussGroup.add(f3);

    const fl1 = createTomatoFlower();
    fl1.position.set(0.145, -0.12, 0.035);
    fl1.rotation.y = 0.5;
    trussGroup.add(fl1);

    const fl2 = createTomatoFlower();
    fl2.position.set(0.165, -0.14, 0.05);
    fl2.rotation.y = -0.3;
    trussGroup.add(fl2);
  }

  return trussGroup;
}

// ── Master Tomato Plant Builder ──
export function buildStylizedTomatoPlantScene(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'Stylized_Tomato_Plant_Fruiting';

  // 1. Main Central Stem with organic S-curve
  const stemHeight = 0.74; // 74 cm tall
  const stemPoints = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.012, 0.15, 0.008),
    new THREE.Vector3(-0.018, 0.32, -0.012),
    new THREE.Vector3(0.014, 0.50, 0.015),
    new THREE.Vector3(-0.008, 0.65, -0.005),
    new THREE.Vector3(0, stemHeight, 0),
  ];
  const mainCurve = new THREE.CatmullRomCurve3(stemPoints);
  const mainStemGeom = createTaperedTube(mainCurve, 0.014, 0.004, 32, 10);
  const mainStemMesh = new THREE.Mesh(mainStemGeom, matStem);
  mainStemMesh.castShadow = true;
  mainStemMesh.receiveShadow = true;
  root.add(mainStemMesh);

  // 2. Support Bamboo / Wooden Stake (típico tutor de tomatera en huertas/viveros)
  const stakeGeom = new THREE.CylinderGeometry(0.009, 0.011, 0.85, 12);
  const stakeMat = new THREE.MeshStandardMaterial({
    name: 'Mat_Tomato_Tutor_Wood',
    color: new THREE.Color('#9e7846'),
    roughness: 0.75,
    metalness: 0.0,
  });
  const stakeMesh = new THREE.Mesh(stakeGeom, stakeMat);
  stakeMesh.position.set(-0.025, 0.425, 0.02);
  stakeMesh.rotation.z = -0.02;
  stakeMesh.castShadow = true;
  stakeMesh.receiveShadow = true;
  root.add(stakeMesh);

  // 3. Foliage: 7 Compound Pinnate Leaves arranged spirally along the stem
  const leafConfigs = [
    // [Y height, Azimuth deg, Pitch deg, Length M]
    { y: 0.18, azimuth: 25, pitch: 35, length: 0.28 },
    { y: 0.26, azimuth: 140, pitch: 30, length: 0.27 },
    { y: 0.36, azimuth: 245, pitch: 25, length: 0.26 },
    { y: 0.46, azimuth: 40, pitch: 25, length: 0.25 },
    { y: 0.54, azimuth: 160, pitch: 20, length: 0.23 },
    { y: 0.62, azimuth: 275, pitch: 20, length: 0.21 },
    { y: 0.70, azimuth: 80, pitch: 15, length: 0.18 },
  ];

  for (const cfg of leafConfigs) {
    const leaf = createCompoundTomatoLeaf(cfg.length);
    // Find point on stem curve corresponding to Y
    const t = cfg.y / stemHeight;
    const stemPt = mainCurve.getPointAt(t);

    leaf.position.copy(stemPt);
    leaf.rotation.y = THREE.MathUtils.degToRad(cfg.azimuth);
    leaf.rotation.z = THREE.MathUtils.degToRad(cfg.pitch);
    root.add(leaf);
  }

  // 4. Two Fruit Trusses
  // Truss 1: Lower main ripe cluster (facing towards user / positive Z)
  const truss1 = createTomatoTruss(false);
  const truss1Pt = mainCurve.getPointAt(0.38 / stemHeight);
  truss1.position.copy(truss1Pt);
  truss1.rotation.y = THREE.MathUtils.degToRad(85);
  truss1.rotation.z = THREE.MathUtils.degToRad(-15);
  root.add(truss1);

  // Truss 2: Upper cluster with ripening tomatoes and flowers
  const truss2 = createTomatoTruss(true);
  const truss2Pt = mainCurve.getPointAt(0.55 / stemHeight);
  truss2.position.copy(truss2Pt);
  truss2.rotation.y = THREE.MathUtils.degToRad(-110);
  truss2.rotation.z = THREE.MathUtils.degToRad(-10);
  root.add(truss2);

  // Grounding & Centering verification (Contrato Métrico Plantin)
  let box = new THREE.Box3().setFromObject(root);
  if (box.min.y !== 0) {
    root.position.y -= box.min.y;
    box = new THREE.Box3().setFromObject(root);
  }

  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  console.log(`[Tomato 3D Generator] Bounding Box Dimensions:`);
  console.log(`- Width (X):  ${(size.x * 100).toFixed(1)} cm`);
  console.log(`- Height (Y): ${(size.y * 100).toFixed(1)} cm`);
  console.log(`- Depth (Z):  ${(size.z * 100).toFixed(1)} cm`);
  console.log(`- Lowest Y:   ${box.min.y.toFixed(4)} m (ideal 0.0000 m)`);

  return root;
}

// ── CLI Main Execution ──
async function main() {
  const outputDir = path.resolve('public/models/plants');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'plant_tomato_clay_a01.glb');
  console.log(`[Tomato 3D Generator] Generando modelo 3D estilizado en ${outputPath}...`);

  const scene = new THREE.Scene();
  const plant = buildStylizedTomatoPlantScene();
  scene.add(plant);

  const exporter = new GLTFExporter();
  exporter.parse(
    scene,
    (glb) => {
      const buffer = Buffer.from(glb as ArrayBuffer);
      fs.writeFileSync(outputPath, buffer);
      const sizeKb = (buffer.byteLength / 1024).toFixed(1);
      console.log(`[Tomato 3D Generator] ¡ÉXITO! Archivo GLB generado: ${outputPath} (${sizeKb} KB)`);
    },
    (error) => {
      console.error('[Tomato 3D Generator] Error al exportar GLB:', error);
      process.exit(1);
    },
    { binary: true },
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
