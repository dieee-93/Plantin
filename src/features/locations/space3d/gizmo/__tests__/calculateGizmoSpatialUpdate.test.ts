import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calculateGizmoSpatialUpdate } from '../calculateGizmoSpatialUpdate';

describe('calculateGizmoSpatialUpdate - 3D World Matrix to 2D Metric CAD Coordinates', () => {
  const centerCm = { x: 500, y: 300 };

  it('converts a world matrix at origin to centerCm and preserves elevationM', () => {
    const matrix = new THREE.Matrix4().makeTranslation(0, 0, 0);

    const result = calculateGizmoSpatialUpdate({
      worldMatrix: matrix,
      centerCm,
      initialElevationM: 0.21,
      isShiftKey: false,
    });

    expect(result.xCm).toBe(500);
    expect(result.yCm).toBe(300);
    expect(result.elevationM).toBe(0.21);
    expect(result.rotationDeg).toBe(0);
    expect(result.isShiftKey).toBe(false);
  });

  it('translates meters to centimeters relative to centerCm with default 10 cm snapping', () => {
    // Three.js: X = 1.05m -> +105cm -> 500 + 105 = 605cm -> snapped to 10cm = 610cm (or 600)
    // Z = -0.52m -> -52cm -> 300 - 52 = 248cm -> snapped to 10cm = 250cm
    const matrix = new THREE.Matrix4().makeTranslation(1.05, 0.45, -0.52);

    const result = calculateGizmoSpatialUpdate({
      worldMatrix: matrix,
      centerCm,
      initialElevationM: 0,
      isShiftKey: false,
    });

    expect(result.xCm).toBe(610);
    expect(result.yCm).toBe(250);
    expect(result.elevationM).toBe(0);
  });

  it('applies fine 1 cm snapping when isShiftKey is true', () => {
    // Three.js: X = 1.053m -> +105.3cm -> 500 + 105.3 = 605.3cm -> snapped to 1cm = 605cm
    // Z = -0.527m -> -52.7cm -> 300 - 52.7 = 247.3cm -> snapped to 1cm = 247cm
    const matrix = new THREE.Matrix4().makeTranslation(1.053, 0, -0.527);

    const result = calculateGizmoSpatialUpdate({
      worldMatrix: matrix,
      centerCm,
      initialElevationM: 0,
      isShiftKey: true,
    });

    expect(result.xCm).toBe(605);
    expect(result.yCm).toBe(247);
    expect(result.isShiftKey).toBe(true);
  });

  it('extracts Yaw rotation around Y axis with default 15° snapping', () => {
    // 47 degrees yaw -> snapped to 15° = 45°
    const rad = (47 * Math.PI) / 180;
    const matrix = new THREE.Matrix4().makeRotationY(rad);

    const result = calculateGizmoSpatialUpdate({
      worldMatrix: matrix,
      centerCm,
      initialElevationM: 0,
      isShiftKey: false,
    });

    expect(result.rotationDeg).toBe(45);
  });

  it('applies 5° angular snapping when isShiftKey is true and normalizes negative angles to [0, 360)', () => {
    // -22 degrees yaw -> 338° -> with shift (5° snap) -> 340°
    const rad = (-22 * Math.PI) / 180;
    const matrix = new THREE.Matrix4().makeRotationY(rad);

    const result = calculateGizmoSpatialUpdate({
      worldMatrix: matrix,
      centerCm,
      initialElevationM: 0,
      isShiftKey: true,
    });

    expect(result.rotationDeg).toBe(340);
  });

  it('preserves in-place position invariance when rotating around Y axis', () => {
    // Position at X=700cm (2m), Y=200cm (-1m), with 45 deg rotation applied in-place
    const posX = (700 - centerCm.x) * 0.01; // 2m
    const posZ = (200 - centerCm.y) * 0.01; // -1m
    const bi = new THREE.Matrix4().setPosition(posX, 0, posZ);

    const origin = new THREE.Vector3(posX, 0, posZ);
    const normal = new THREE.Vector3(0, 1, 0);
    const angle = Math.PI / 4; // 45 deg

    const ii = new THREE.Matrix4().makeRotationAxis(normal, angle);
    const si = origin.clone().applyMatrix4(ii).sub(origin).negate();
    ii.setPosition(si);

    const Si = bi.clone().premultiply(ii);

    const result = calculateGizmoSpatialUpdate({
      worldMatrix: Si,
      centerCm,
      initialElevationM: 0,
      initialRotationDeg: 0,
      isShiftKey: false,
    });

    expect(result.xCm).toBe(700);
    expect(result.yCm).toBe(200);
    expect(result.rotationDeg).toBe(45);
  });

  it('accumulates delta yaw rotation onto initialRotationDeg with snapping', () => {
    // Initial rotation 45°, delta rotation 30° -> 75°
    const rad = (30 * Math.PI) / 180;
    const matrix = new THREE.Matrix4().makeRotationY(rad);

    const result = calculateGizmoSpatialUpdate({
      worldMatrix: matrix,
      centerCm,
      initialElevationM: 0,
      initialRotationDeg: 45,
      isShiftKey: false,
    });

    expect(result.rotationDeg).toBe(75);
  });

  it('preserves custom initialRotationDeg when dragging purely translation (no rotation delta)', () => {
    // Custom non-multiple angle (e.g. 37°) should not be rounded to 30° or 45° if user only translates
    const matrix = new THREE.Matrix4().makeTranslation(1, 0, 0);

    const result = calculateGizmoSpatialUpdate({
      worldMatrix: matrix,
      centerCm,
      initialElevationM: 0,
      initialRotationDeg: 37,
      isShiftKey: false,
    });

    expect(result.rotationDeg).toBe(37);
  });
});
