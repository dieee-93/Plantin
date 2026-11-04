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
});
