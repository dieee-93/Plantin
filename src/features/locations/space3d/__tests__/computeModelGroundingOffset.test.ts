import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { computeModelGroundingOffset } from '../SpaceModelInstance';

describe('computeModelGroundingOffset - 3D Bounding Box Auto-Grounding & Centering', () => {
  it('corrects sunken models with negative min.y (e.g. table with origin at tabletop)', () => {
    // Simula una mesa con altura 85cm cuyo origen está arriba:
    // min.y = -0.80, max.y = +0.05
    const group = new THREE.Group();
    const geom = new THREE.BoxGeometry(1.8, 0.85, 0.7);
    // Mover la geometría para que su base esté en -0.80 y su tapa en +0.05
    geom.translate(0, -0.375, 0);
    const mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial());
    group.add(mesh);

    const offset = computeModelGroundingOffset(group);

    // Debe empujar el modelo hacia arriba exactamente 0.80m para que su base toque Y = 0
    expect(offset.yOffset).toBeCloseTo(0.80, 2);
    // Modelo ya centrado en X y Z
    expect(offset.xOffset).toBeCloseTo(0, 3);
    expect(offset.zOffset).toBeCloseTo(0, 3);
  });

  it('keeps models with origin at bottom intact (yOffset = 0)', () => {
    // Simula un cajón apoyado en el piso: min.y = 0, max.y = 0.25
    const group = new THREE.Group();
    const geom = new THREE.BoxGeometry(0.6, 0.25, 0.4);
    geom.translate(0, 0.125, 0);
    const mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial());
    group.add(mesh);

    const offset = computeModelGroundingOffset(group);

    expect(offset.yOffset).toBeCloseTo(0, 3);
  });

  it('centers models that have asymmetrical or corner origins', () => {
    // Simula un modelo con origen en una esquina:
    // X va de 0 a 1.20 (centro en +0.60)
    // Z va de 0 a 0.80 (centro en +0.40)
    // Y va de 0 a 0.20
    const group = new THREE.Group();
    const geom = new THREE.BoxGeometry(1.2, 0.2, 0.8);
    geom.translate(0.6, 0.1, 0.4);
    const mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial());
    group.add(mesh);

    const offset = computeModelGroundingOffset(group);

    expect(offset.xOffset).toBeCloseTo(-0.6, 3);
    expect(offset.zOffset).toBeCloseTo(-0.4, 3);
    expect(offset.yOffset).toBeCloseTo(0, 3);
  });

  it('handles empty or degenerate objects gracefully without NaN', () => {
    const emptyGroup = new THREE.Group();
    const offset = computeModelGroundingOffset(emptyGroup);

    expect(offset.xOffset).toBe(0);
    expect(offset.yOffset).toBe(0);
    expect(offset.zOffset).toBe(0);
  });
});
