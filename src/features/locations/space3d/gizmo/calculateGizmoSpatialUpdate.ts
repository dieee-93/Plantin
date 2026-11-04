import * as THREE from 'three';
import { snapPointToMetricGrid, type Point2DCm } from '@/domain/spaceGeometry';

export interface CalculateGizmoSpatialUpdateParams {
  worldMatrix: THREE.Matrix4;
  centerCm: Point2DCm;
  initialElevationM?: number;
  isShiftKey?: boolean;
}

export interface GizmoSpatialResult {
  xCm: number;
  yCm: number;
  elevationM: number;
  rotationDeg: number;
}

const M_TO_CM = 100;

export function calculateGizmoSpatialUpdate({
  worldMatrix,
  centerCm,
  initialElevationM = 0,
  isShiftKey = false,
}: CalculateGizmoSpatialUpdateParams): GizmoSpatialResult {
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  worldMatrix.decompose(pos, quat, scale);

  // Mapeo Three.js (m) a CAD Plantin (cm)
  // Three.js X -> horizontal X en cm
  // Three.js Z -> profundidad Y en cm
  const rawXCm = pos.x * M_TO_CM + centerCm.x;
  const rawYCm = pos.z * M_TO_CM + centerCm.y;

  // Snapping métrico: 1 cm con Shift, 10 cm por defecto
  const metricSnap = isShiftKey ? 1 : 10;
  const snappedPt = snapPointToMetricGrid({ x: rawXCm, y: rawYCm }, metricSnap);

  // Extracción de ángulo de rotación Yaw (alrededor de Y)
  const euler = new THREE.Euler().setFromQuaternion(quat, 'YXZ');
  const rawDeg = THREE.MathUtils.radToDeg(euler.y);
  const normalizedDeg = ((Math.round(rawDeg) % 360) + 360) % 360;

  // Snapping angular: 5° con Shift, 15° por defecto
  const angularSnap = isShiftKey ? 5 : 15;
  const snappedRotationDeg = Math.round(normalizedDeg / angularSnap) * angularSnap % 360;

  return {
    xCm: snappedPt.x,
    yCm: snappedPt.y,
    elevationM: initialElevationM,
    rotationDeg: snappedRotationDeg,
  };
}
