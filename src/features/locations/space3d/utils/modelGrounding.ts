import * as THREE from 'three';

export interface ModelGroundingOffsetResult {
  xOffset: number;
  yOffset: number;
  zOffset: number;
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
}

/**
 * Normaliza y alinea la geometría 3D de un modelo GLTF:
 * 1. Auto-grounding: si min.y < 0 (como en mesas industriales o estanterías cuyo origen
 *    está en la superficie superior), eleva la malla para que su punto más bajo coincida
 *    exactamente con Y = 0 (el piso o la superficie de apoyo).
 * 2. Centrado X/Z: si el origen del modelo está en una esquina o desplazado, compensa
 *    el desfase para que el centro visual coincida con la coordenada CAD central (xCm, yCm).
 */
export function computeModelGroundingOffset(object: THREE.Object3D): ModelGroundingOffsetResult {
  const bbox = new THREE.Box3().setFromObject(object);
  if (bbox.isEmpty()) {
    return {
      xOffset: 0,
      yOffset: 0,
      zOffset: 0,
      boundingBox: {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
      },
    };
  }

  const yOffset = Number.isFinite(bbox.min.y) ? -bbox.min.y : 0;
  const xOffset =
    Number.isFinite(bbox.min.x) && Number.isFinite(bbox.max.x)
      ? -(bbox.min.x + bbox.max.x) / 2
      : 0;
  const zOffset =
    Number.isFinite(bbox.min.z) && Number.isFinite(bbox.max.z)
      ? -(bbox.min.z + bbox.max.z) / 2
      : 0;

  return {
    xOffset,
    yOffset,
    zOffset,
    boundingBox: {
      min: { x: bbox.min.x, y: bbox.min.y, z: bbox.min.z },
      max: { x: bbox.max.x, y: bbox.max.y, z: bbox.max.z },
    },
  };
}
