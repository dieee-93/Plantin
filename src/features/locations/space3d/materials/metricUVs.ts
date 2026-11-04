import * as THREE from 'three';

export interface MetricShapeUVOptions {
  metersPerTileX?: number;
  metersPerTileY?: number;
  worldOffsetM?: { x: number; y: number };
}

export interface ContinuousWallPrismUVOptions {
  prismXStartM: number;
  prismYBottomM: number;
  prismLengthM: number;
  prismHeightM: number;
  thicknessM?: number;
  metersPerTileX?: number;
  metersPerTileY?: number;
}

const DEFAULT_METERS_PER_TILE_X = 1.0;
const DEFAULT_METERS_PER_TILE_Y = 1.0;

/**
 * Recalculates UV coordinates of a ShapeGeometry based on physical meter dimensions.
 * Prevents stretching when shapes have different bounding boxes.
 */
export function applyMetricUVsToShapeGeometry(
  geometry: THREE.ShapeGeometry,
  options: MetricShapeUVOptions = {},
): THREE.ShapeGeometry {
  const {
    metersPerTileX = DEFAULT_METERS_PER_TILE_X,
    metersPerTileY = DEFAULT_METERS_PER_TILE_Y,
    worldOffsetM = { x: 0, y: 0 },
  } = options;

  const posAttr = geometry.attributes.position;
  const uvAttr = geometry.attributes.uv;

  if (!posAttr || !uvAttr) return geometry;

  const vertex = new THREE.Vector3();

  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);
    // vertex.x is horizontal, vertex.y is in-plane vertical (maps to Z after -90deg rotation)
    const u = (worldOffsetM.x + vertex.x) / metersPerTileX;
    const v = (worldOffsetM.y - vertex.y) / metersPerTileY;
    uvAttr.setXY(i, u, v);
  }

  uvAttr.needsUpdate = true;
  geometry.setAttribute('uv1', uvAttr);
  geometry.setAttribute('uv2', uvAttr);
  return geometry;
}

/**
 * Maps continuous UV coordinates across wall segments / prisms in a wall.
 * BoxGeometry face vertex order:
 *  - Face +X (Right, indices 0..3)
 *  - Face -X (Left, indices 4..7)
 *  - Face +Y (Top, indices 8..11)
 *  - Face -Y (Bottom, indices 12..15)
 *  - Face +Z (Front, indices 16..19)
 *  - Face -Z (Back, indices 20..23)
 */
export function applyContinuousWallPrismUVs(
  geometry: THREE.BoxGeometry,
  options: ContinuousWallPrismUVOptions,
): THREE.BoxGeometry {
  const {
    prismXStartM,
    prismYBottomM,
    prismLengthM,
    prismHeightM,
    thicknessM = 0.2,
    metersPerTileX = DEFAULT_METERS_PER_TILE_X,
    metersPerTileY = DEFAULT_METERS_PER_TILE_Y,
  } = options;

  const uvAttr = geometry.attributes.uv;
  if (!uvAttr || uvAttr.count < 24) return geometry;

  const uStart = prismXStartM / metersPerTileX;
  const uEnd = (prismXStartM + prismLengthM) / metersPerTileX;
  const vBottom = prismYBottomM / metersPerTileY;
  const vTop = (prismYBottomM + prismHeightM) / metersPerTileY;
  const uThickness = thicknessM / metersPerTileX;

  // Face +X (Right jamb / side cap)
  uvAttr.setXY(0, 0, vTop);
  uvAttr.setXY(1, uThickness, vTop);
  uvAttr.setXY(2, 0, vBottom);
  uvAttr.setXY(3, uThickness, vBottom);

  // Face -X (Left jamb / side cap)
  uvAttr.setXY(4, 0, vTop);
  uvAttr.setXY(5, uThickness, vTop);
  uvAttr.setXY(6, 0, vBottom);
  uvAttr.setXY(7, uThickness, vBottom);

  // Face +Z (Front face of the wall)
  // Vertex 16: Top-Left (-x, +y)
  // Vertex 17: Top-Right (+x, +y)
  // Vertex 18: Bottom-Left (-x, -y)
  // Vertex 19: Bottom-Right (+x, -y)
  uvAttr.setXY(16, uStart, vTop);
  uvAttr.setXY(17, uEnd, vTop);
  uvAttr.setXY(18, uStart, vBottom);
  uvAttr.setXY(19, uEnd, vBottom);

  // Face -Z (Back face of the wall, mirrored X)
  uvAttr.setXY(20, uEnd, vTop);
  uvAttr.setXY(21, uStart, vTop);
  uvAttr.setXY(22, uEnd, vBottom);
  uvAttr.setXY(23, uStart, vBottom);

  // Face +Y (Top cap of the wall)
  uvAttr.setXY(8, uStart, 0);
  uvAttr.setXY(9, uEnd, 0);
  uvAttr.setXY(10, uStart, 1);
  uvAttr.setXY(11, uEnd, 1);

  uvAttr.needsUpdate = true;
  geometry.setAttribute('uv1', uvAttr);
  geometry.setAttribute('uv2', uvAttr);
  return geometry;
}
