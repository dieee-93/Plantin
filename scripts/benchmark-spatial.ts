import {
  computeCrowdedPlantIds,
  findNearestNeighbor,
  measurePlantNeighbors,
  type PlacedPlantSpatialCm,
} from '../src/domain/solarAndPlantSpatial';

function createTestPlants(count = 500): PlacedPlantSpatialCm[] {
  let seed = 42;
  function rnd() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }
  const plants: PlacedPlantSpatialCm[] = [];
  for (let i = 0; i < count; i++) {
    plants.push({
      id: `benchmark-plant-${i}`,
      label: `Crop ${i}`,
      cropCode: i % 2 === 0 ? 'TOM' : 'LETTUCE',
      xCm: Math.round(rnd() * 2000),
      yCm: Math.round(rnd() * 2000),
      canopyRadiusCm: Math.round(15 + rnd() * 25),
    });
  }
  return plants;
}

function runBenchmark() {
  const plants = createTestPlants(500);
  const iterations = 10;

  console.log(`\n======================================================`);
  console.log(`BENCHMARK DE RENDIMIENTO (Escenario con 500 plantas)`);
  console.log(`======================================================\n`);

  // 1. BEFORE: Loop O(N² log N) de measurePlantNeighbors en cada render
  let beforeTotalMs = 0;
  for (let iter = 0; iter < iterations; iter++) {
    const t0 = performance.now();
    const crowdedIdsBefore = new Set<string>();
    for (let i = 0; i < plants.length; i++) {
      const neighbors = measurePlantNeighbors(plants[i], plants);
      if (neighbors[0]?.isCrowded) {
        crowdedIdsBefore.add(plants[i].id);
      }
    }
    const t1 = performance.now();
    beforeTotalMs += (t1 - t0);
  }
  const beforeAvgMs = beforeTotalMs / iterations;

  // 2. AFTER: computeCrowdedPlantIds O(N) con Spatial Hash Grid
  let afterTotalMs = 0;
  for (let iter = 0; iter < iterations; iter++) {
    const t0 = performance.now();
    const crowdedIdsAfter = computeCrowdedPlantIds(plants);
    const t1 = performance.now();
    afterTotalMs += (t1 - t0);
  }
  const afterAvgMs = afterTotalMs / iterations;

  // 3. CURSOR PROBE: Before vs After
  const probe: PlacedPlantSpatialCm = {
    id: '__cursor_probe__',
    label: 'Cursor Probe',
    xCm: 1000,
    yCm: 1000,
    canopyRadiusCm: 25,
  };

  const cursorIterations = 1000;
  const tCursorBefore0 = performance.now();
  for (let i = 0; i < cursorIterations; i++) {
    const n = measurePlantNeighbors(probe, plants);
    const nearest = n[0] ?? null;
  }
  const tCursorBefore1 = performance.now();
  const cursorBeforeMs = (tCursorBefore1 - tCursorBefore0) / cursorIterations;

  const tCursorAfter0 = performance.now();
  for (let i = 0; i < cursorIterations; i++) {
    const nearest = findNearestNeighbor(probe, plants);
  }
  const tCursorAfter1 = performance.now();
  const cursorAfterMs = (tCursorAfter1 - tCursorAfter0) / cursorIterations;

  console.log(`1. Análisis completo de escena (500 plantas):`);
  console.log(`   - ANTES (measurePlantNeighbors por planta en render): ${beforeAvgMs.toFixed(2)} ms`);
  console.log(`   - DESPUÉS (computeCrowdedPlantIds Spatial Hash Grid):   ${afterAvgMs.toFixed(2)} ms`);
  console.log(`   - ACELERACIÓN: ${(beforeAvgMs / afterAvgMs).toFixed(1)}x más rápido (${(((beforeAvgMs - afterAvgMs) / beforeAvgMs) * 100).toFixed(1)}% reducción de tiempo)\n`);

  console.log(`2. Hover / movimiento del cursor (computeCursorPlantPreview):`);
  console.log(`   - ANTES (measurePlantNeighbors de 500 plantas):       ${(cursorBeforeMs * 1000).toFixed(1)} µs (${cursorBeforeMs.toFixed(3)} ms)`);
  console.log(`   - DESPUÉS (findNearestNeighbor Spatial Hash Grid):     ${(cursorAfterMs * 1000).toFixed(1)} µs (${cursorAfterMs.toFixed(3)} ms)`);
  console.log(`   - ACELERACIÓN: ${(cursorBeforeMs / cursorAfterMs).toFixed(1)}x más rápido\n`);

  console.log(`======================================================\n`);
}

runBenchmark();
