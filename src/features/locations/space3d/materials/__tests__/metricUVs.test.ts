import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  applyContinuousWallPrismUVs,
  applyMetricUVsToShapeGeometry,
} from '../metricUVs';

describe('metricUVs utilities', () => {
  describe('applyMetricUVsToShapeGeometry', () => {
    it('scales UV coordinates based on physical meter sizes instead of normalized 0..1 bounding box', () => {
      const shape = new THREE.Shape();
      // 4m wide x 2m high rectangle
      shape.moveTo(0, 0);
      shape.lineTo(4, 0);
      shape.lineTo(4, 2);
      shape.lineTo(0, 2);
      shape.closePath();

      const geom = new THREE.ShapeGeometry(shape);

      // Default tiles: 1 meter per tile
      applyMetricUVsToShapeGeometry(geom, {
        metersPerTileX: 1.0,
        metersPerTileY: 1.0,
      });

      const uvAttr = geom.attributes.uv;
      expect(uvAttr).toBeDefined();

      // Check max U is 4.0 and min U is 0.0
      let minU = Infinity;
      let maxU = -Infinity;
      for (let i = 0; i < uvAttr.count; i++) {
        const u = uvAttr.getX(i);
        if (u < minU) minU = u;
        if (u > maxU) maxU = u;
      }

      expect(minU).toBeCloseTo(0, 4);
      expect(maxU).toBeCloseTo(4, 4);
    });

    it('respects custom tile scale in meters', () => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(6, 0);
      shape.lineTo(6, 3);
      shape.lineTo(0, 3);
      shape.closePath();

      const geom = new THREE.ShapeGeometry(shape);

      // 2 meters per tile -> 6m should result in 3 repeats
      applyMetricUVsToShapeGeometry(geom, {
        metersPerTileX: 2.0,
        metersPerTileY: 2.0,
      });

      const uvAttr = geom.attributes.uv;
      let maxU = -Infinity;
      for (let i = 0; i < uvAttr.count; i++) {
        const u = uvAttr.getX(i);
        if (u > maxU) maxU = u;
      }

      expect(maxU).toBeCloseTo(3, 4);
    });
  });

  describe('applyContinuousWallPrismUVs', () => {
    it('maintains continuous UV alignment across adjacent wall prisms', () => {
      // Wall segment 1 (e.g. under window): 0m to 3m, 0m to 1m height
      const prism1Geom = new THREE.BoxGeometry(3, 1, 0.2);
      applyContinuousWallPrismUVs(prism1Geom, {
        prismXStartM: 0,
        prismYBottomM: 0,
        prismLengthM: 3,
        prismHeightM: 1,
        metersPerTileX: 1.0,
        metersPerTileY: 0.5,
      });

      // Wall segment 2 (adjacent wall beyond window): 3m to 6m, 0m to 1m height
      const prism2Geom = new THREE.BoxGeometry(3, 1, 0.2);
      applyContinuousWallPrismUVs(prism2Geom, {
        prismXStartM: 3,
        prismYBottomM: 0,
        prismLengthM: 3,
        prismHeightM: 1,
        metersPerTileX: 1.0,
        metersPerTileY: 0.5,
      });

      const uv1 = prism1Geom.attributes.uv;
      const uv2 = prism2Geom.attributes.uv;

      // In prism 1, front face right edge (Vertex 17 & 19) U should be 3.0
      expect(uv1.getX(17)).toBeCloseTo(3.0, 4);
      expect(uv1.getX(19)).toBeCloseTo(3.0, 4);

      // In prism 2, front face left edge (Vertex 16 & 18) U should start exactly at 3.0
      expect(uv2.getX(16)).toBeCloseTo(3.0, 4);
      expect(uv2.getX(18)).toBeCloseTo(3.0, 4);

      // And prism 2 right edge should end at 6.0
      expect(uv2.getX(17)).toBeCloseTo(6.0, 4);
      expect(uv2.getX(19)).toBeCloseTo(6.0, 4);
    });

    it('handles vertical alignment for headers above doors or windows', () => {
      // Header above window from 1m to 2.5m (height = 1.5m)
      const headerGeom = new THREE.BoxGeometry(2, 1.5, 0.2);
      applyContinuousWallPrismUVs(headerGeom, {
        prismXStartM: 1,
        prismYBottomM: 1.0,
        prismLengthM: 2,
        prismHeightM: 1.5,
        metersPerTileX: 1.0,
        metersPerTileY: 0.5, // 0.5m per tile vertical
      });

      const uv = headerGeom.attributes.uv;
      // Bottom of header: vBottom = 1.0 / 0.5 = 2.0
      expect(uv.getY(18)).toBeCloseTo(2.0, 4);
      expect(uv.getY(19)).toBeCloseTo(2.0, 4);

      // Top of header: vTop = (1.0 + 1.5) / 0.5 = 5.0
      expect(uv.getY(16)).toBeCloseTo(5.0, 4);
      expect(uv.getY(17)).toBeCloseTo(5.0, 4);
    });
  });
});
