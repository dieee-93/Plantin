import React, { useMemo } from 'react';
import * as THREE from 'three';
import {
  computeSpaceRegions,
  type Point2DCm,
  type Polygon2DCm,
  type WallMaterialType,
} from '@/domain/spaceGeometry';
import {
  computeSunPosition,
  measurePlantNeighbors,
  shouldCutawayWall,
} from '@/domain/solarAndPlantSpatial';
import type { SpaceLayout1to1 } from '@/store/spaceLayoutStore';

const CM_TO_M = 0.01;
const CUTAWAY_WALL_HEIGHT_M = 0.15;
const WALKABLE_ELEVATION_M = 0.015;
const SUN_DISTANCE_M = 20;

export type SpaceViewMode = '2d' | '3d';

export interface SpaceSceneGraphProps {
  layout: SpaceLayout1to1;
  viewMode: SpaceViewMode;
  cameraGroundPosCm?: Point2DCm;
  selectedPlantId?: string | null;
  onSelectPlant?: (plantId: string) => void;
  onGroundPointClickCm?: (pointCm: Point2DCm) => void;
}

function computeBoundingCenterCm(polygon: Polygon2DCm): Point2DCm {
  if (polygon.length === 0) return { x: 0, y: 0 };
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const pt of polygon) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }
  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  };
}

function buildShapeFromPolygonCm(
  polygon: Polygon2DCm,
  centerCm: Point2DCm,
): THREE.Shape | null {
  if (polygon.length < 3) return null;
  const shape = new THREE.Shape();
  polygon.forEach((pt, idx) => {
    const xM = (pt.x - centerCm.x) * CM_TO_M;
    // Negate Y so that rotation={[-Math.PI / 2, 0, 0]} maps shapeY -> +Z in scene coordinates
    const yM = -(pt.y - centerCm.y) * CM_TO_M;
    if (idx === 0) {
      shape.moveTo(xM, yM);
    } else {
      shape.lineTo(xM, yM);
    }
  });
  shape.closePath();
  return shape;
}

function getWallColorAndOpacity(material: WallMaterialType): {
  color: string;
  opacity: number;
  transparent: boolean;
} {
  switch (material) {
    case 'polycarbonate':
    case 'glass_greenhouse':
      return { color: '#bae6fd', opacity: 0.45, transparent: true };
    case 'wood_fence':
      return { color: '#92400e', opacity: 1, transparent: false };
    case 'wire_fence':
      return { color: '#94a3b8', opacity: 0.55, transparent: true };
    case 'concrete':
      return { color: '#9ca3af', opacity: 1, transparent: false };
    case 'drywall':
      return { color: '#e5e7eb', opacity: 1, transparent: false };
    case 'brick':
    default:
      return { color: '#b45309', opacity: 1, transparent: false };
  }
}

export const SpaceSceneGraph: React.FC<SpaceSceneGraphProps> = ({
  layout,
  viewMode,
  cameraGroundPosCm = { x: 500, y: 950 },
  selectedPlantId,
  onSelectPlant,
}) => {
  const centerCm = useMemo(
    () => computeBoundingCenterCm(layout.baseBoundary),
    [layout.baseBoundary],
  );

  const regions = useMemo(
    () =>
      computeSpaceRegions(
        layout.baseBoundary,
        layout.hardscapeZones,
        layout.paths,
      ),
    [layout.baseBoundary, layout.hardscapeZones, layout.paths],
  );

  const sun = useMemo(
    () => computeSunPosition(layout.solarConfig),
    [layout.solarConfig],
  );

  const cultivableShapes = useMemo(
    () =>
      regions.cultivablePolygons
        .map((poly, index) => ({
          id: `cultivable-${index}`,
          shape: buildShapeFromPolygonCm(poly, centerCm),
        }))
        .filter((item): item is { id: string; shape: THREE.Shape } => item.shape !== null),
    [regions.cultivablePolygons, centerCm],
  );

  const walkableShapes = useMemo(
    () =>
      regions.walkablePolygons
        .map((poly, index) => ({
          id: `walkable-${index}`,
          shape: buildShapeFromPolygonCm(poly, centerCm),
        }))
        .filter((item): item is { id: string; shape: THREE.Shape } => item.shape !== null),
    [regions.walkablePolygons, centerCm],
  );

  const sunPosition: [number, number, number] = [
    sun.sceneDirection.x * SUN_DISTANCE_M,
    sun.sceneDirection.y * SUN_DISTANCE_M,
    sun.sceneDirection.z * SUN_DISTANCE_M,
  ];

  return (
    <group name="space-scene-root">
      <ambientLight intensity={sun.isDaylight ? 0.55 : 0.2} />
      <directionalLight
        name="solar-directional-light"
        castShadow
        position={sunPosition}
        intensity={sun.intensity * 2.2}
      />

      {/* Cultivable soil sectors */}
      {cultivableShapes.map((sector) => (
        <mesh
          key={sector.id}
          name="cultivable-sector-mesh"
          receiveShadow
          position={[0, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <shapeGeometry args={[sector.shape]} />
          <meshStandardMaterial color="#5c4033" roughness={0.92} />
        </mesh>
      ))}

      {/* Welded walkable surface elevated +0.015 m to prevent z-fighting */}
      {walkableShapes.map((surface) => (
        <mesh
          key={surface.id}
          name="walkable-surface-mesh"
          receiveShadow
          position={[0, WALKABLE_ELEVATION_M, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <shapeGeometry args={[surface.shape]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.75} />
        </mesh>
      ))}

      {/* Perimeter walls with automatic wall cutaway */}
      {layout.walls.map((wall) => {
        const dxCm = wall.end.x - wall.start.x;
        const dyCm = wall.end.y - wall.start.y;
        const lengthM = Math.hypot(dxCm, dyCm) * CM_TO_M;
        const thicknessM = Math.max(0.08, wall.thicknessCm * CM_TO_M);
        const angleRad = Math.atan2(dyCm, dxCm);

        const isCutaway =
          viewMode === '2d' ||
          shouldCutawayWall(wall.start, wall.end, cameraGroundPosCm, centerCm);
        const heightM = isCutaway ? CUTAWAY_WALL_HEIGHT_M : wall.heightCm * CM_TO_M;

        const midXCm = (wall.start.x + wall.end.x) / 2;
        const midYCm = (wall.start.y + wall.end.y) / 2;
        const posXM = (midXCm - centerCm.x) * CM_TO_M;
        const posZM = (midYCm - centerCm.y) * CM_TO_M;

        const matStyle = getWallColorAndOpacity(wall.material);

        return (
          <mesh
            key={wall.id}
            name="wall-segment-mesh"
            castShadow
            receiveShadow
            position={[posXM, heightM / 2, posZM]}
            rotation={[0, -angleRad, 0]}
            userData={{
              wallId: wall.id,
              wallHeightM: heightM,
              isCutaway,
            }}
          >
            <boxGeometry args={[lengthM, heightM, thicknessM]} />
            <meshStandardMaterial
              color={matStyle.color}
              transparent={matStyle.transparent}
              opacity={matStyle.opacity}
              roughness={0.65}
            />
          </mesh>
        );
      })}

      {/* 1:1 Placed plants with canopy radius ring and 2.5D vertical body */}
      {layout.placedPlants.map((plant) => {
        const neighbors = measurePlantNeighbors(plant, layout.placedPlants);
        const nearest = neighbors[0];
        const isCrowded = nearest ? nearest.isCrowded : false;
        const isSelected = selectedPlantId === plant.id;

        const xM = (plant.xCm - centerCm.x) * CM_TO_M;
        const zM = (plant.yCm - centerCm.y) * CM_TO_M;
        const radiusM = Math.max(0.08, plant.canopyRadiusCm * CM_TO_M);
        const bodyHeightM = Math.max(0.25, radiusM * 1.6);

        const ringColor = isCrowded ? '#ef4444' : isSelected ? '#38bdf8' : '#22c55e';

        return (
          <group
            key={plant.id}
            name="placed-plant-node"
            position={[xM, 0.02, zM]}
            userData={{
              plantId: plant.id,
              label: plant.label,
              isCrowded,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectPlant?.(plant.id);
            }}
          >
            <mesh
              name="plant-canopy-ring"
              rotation={[-Math.PI / 2, 0, 0]}
              userData={{ isCrowded, ringColor }}
            >
              <ringGeometry args={[radiusM * 0.82, radiusM, 24]} />
              <meshBasicMaterial
                color={ringColor}
                side={THREE.DoubleSide}
                transparent
                opacity={0.85}
              />
            </mesh>

            <mesh
              name="plant-billboard-mesh"
              castShadow
              receiveShadow
              position={[0, bodyHeightM / 2, 0]}
            >
              <cylinderGeometry args={[radiusM * 0.45, radiusM * 0.3, bodyHeightM, 12]} />
              <meshStandardMaterial
                color={isCrowded ? '#f59e0b' : '#16a34a'}
                roughness={0.6}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
