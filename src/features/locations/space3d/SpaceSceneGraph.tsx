import React, { useMemo } from 'react';
import * as THREE from 'three';
import {
  computeSpaceRegions,
  decomposeWallIntoPrisms,
  type Point2DCm,
  type Polygon2DCm,
} from '@/domain/spaceGeometry';
import {
  computeSunPosition,
  measurePlantNeighbors,
  shouldCutawayWall,
} from '@/domain/solarAndPlantSpatial';
import type { SpaceLayout1to1 } from '@/store/spaceLayoutStore';
import {
  applyContinuousWallPrismUVs,
  applyMetricUVsToShapeGeometry,
  getFloorMaterialConfig,
  getWallMaterialConfig,
  SpaceStandardMaterial,
} from './materials';
import { SpacePlantSprite } from './SpacePlantSprite';

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
  selectedWallId?: string | null;
  selectedVertexIndex?: number | null;
  isBoundaryEditMode?: boolean;
  showRoof?: boolean;
  onSelectPlant?: (plantId: string) => void;
  onSelectWall?: (wallId: string) => void;
  onSelectVertex?: (vertexIndex: number | null) => void;
  onStartDragVertex?: (vertexIndex: number) => void;
  onInsertVertexAtEdge?: (edgeIndex: number, pointCm: Point2DCm) => void;
  onGroundPointClickCm?: (pointCm: Point2DCm) => void;
}

function computeBoundingBoxCm(polygon: Polygon2DCm): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  widthCm: number;
  depthCm: number;
} {
  if (polygon.length === 0) {
    return { minX: 0, maxX: 1000, minY: 0, maxY: 600, widthCm: 1000, depthCm: 600 };
  }
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
    minX,
    maxX,
    minY,
    maxY,
    widthCm: Math.max(100, maxX - minX),
    depthCm: Math.max(100, maxY - minY),
  };
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


export const SpaceSceneGraph: React.FC<SpaceSceneGraphProps> = ({
  layout,
  viewMode,
  cameraGroundPosCm = { x: 500, y: 950 },
  selectedPlantId,
  selectedWallId,
  selectedVertexIndex,
  isBoundaryEditMode = false,
  showRoof = true,
  onSelectPlant,
  onSelectWall,
  onSelectVertex,
  onStartDragVertex,
  onInsertVertexAtEdge,
  onGroundPointClickCm,
}) => {
  const centerCm = useMemo(
    () => computeBoundingCenterCm(layout.baseBoundary),
    [layout.baseBoundary],
  );

  const bbox = useMemo(
    () => computeBoundingBoxCm(layout.baseBoundary),
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

  const soilConfig = useMemo(() => getFloorMaterialConfig('soil'), []);
  const walkableConfig = useMemo(() => getFloorMaterialConfig('concrete'), []);

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
          onClick={(e) => {
            e.stopPropagation();
            onGroundPointClickCm?.({
              x: Math.round(e.point.x * 100 + centerCm.x),
              y: Math.round(e.point.z * 100 + centerCm.y),
            });
          }}
        >
          <shapeGeometry
            args={[sector.shape]}
            onUpdate={(self) =>
              applyMetricUVsToShapeGeometry(self, {
                metersPerTileX: soilConfig.metersPerTileX,
                metersPerTileY: soilConfig.metersPerTileY,
              })
            }
          />
          <SpaceStandardMaterial config={soilConfig} />
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
          onClick={(e) => {
            e.stopPropagation();
            onGroundPointClickCm?.({
              x: Math.round(e.point.x * 100 + centerCm.x),
              y: Math.round(e.point.z * 100 + centerCm.y),
            });
          }}
        >
          <shapeGeometry
            args={[surface.shape]}
            onUpdate={(self) =>
              applyMetricUVsToShapeGeometry(self, {
                metersPerTileX: walkableConfig.metersPerTileX,
                metersPerTileY: walkableConfig.metersPerTileY,
              })
            }
          />
          <SpaceStandardMaterial config={walkableConfig} />
        </mesh>
      ))}

      {/* Perimeter walls with automatic wall cutaway & architectural openings */}
      {layout.walls.map((wall) => {
        const dxCm = wall.end.x - wall.start.x;
        const dyCm = wall.end.y - wall.start.y;
        const lengthCm = Math.hypot(dxCm, dyCm);
        const lengthM = lengthCm * CM_TO_M;
        const thicknessM = Math.max(0.08, wall.thicknessCm * CM_TO_M);
        const angleRad = Math.atan2(dyCm, dxCm);

        const midXCm = (wall.start.x + wall.end.x) / 2;
        const midYCm = (wall.start.y + wall.end.y) / 2;
        const posXM = (midXCm - centerCm.x) * CM_TO_M;
        const posZM = (midYCm - centerCm.y) * CM_TO_M;

        const isSelected = selectedWallId === wall.id;

        if (wall.heightCm <= 0) {
          // Open boundary demarcator (curb strip) with polygonOffset and onClick support in 3D
          return (
            <group
              key={wall.id}
              name="wall-node-group"
              position={[posXM, 0.005, posZM]}
              rotation={[0, -angleRad, 0]}
              onClick={(e) => {
                e.stopPropagation();
                onSelectWall?.(wall.id);
              }}
            >
              <mesh
                name="open-boundary-line-mesh"
                receiveShadow
                userData={{ wallId: wall.id, isSelected, isOpen: true }}
              >
                <boxGeometry args={[lengthM, 0.015, 0.08]} />
                <meshStandardMaterial
                  color={isSelected ? '#38bdf8' : '#cbd5e1'}
                  emissive={isSelected ? '#0284c7' : '#000000'}
                  emissiveIntensity={isSelected ? 0.6 : 0}
                  polygonOffset
                  polygonOffsetFactor={-1}
                  polygonOffsetUnits={-4}
                  roughness={0.7}
                  transparent
                  opacity={0.75}
                />
              </mesh>
            </group>
          );
        }

        const isCutaway =
          viewMode === '2d' ||
          shouldCutawayWall(wall.start, wall.end, cameraGroundPosCm, centerCm);
        const heightM = isCutaway ? CUTAWAY_WALL_HEIGHT_M : wall.heightCm * CM_TO_M;
        const wallConfig = getWallMaterialConfig(wall.material);

        const hasOpenings = Boolean(wall.openings && wall.openings.length > 0);
        const effectiveHeightCm = isCutaway ? Math.min(15, wall.heightCm) : wall.heightCm;
        const prisms = hasOpenings
          ? decomposeWallIntoPrisms(lengthCm, effectiveHeightCm, wall.openings)
          : [
              {
                xStartM: 0,
                xEndM: lengthM,
                yBottomM: 0,
                yTopM: heightM,
              },
            ];

        return (
          <group
            key={wall.id}
            name="wall-node-group"
            position={[posXM, 0, posZM]}
            rotation={[0, -angleRad, 0]}
            onClick={(e) => {
              if (isBoundaryEditMode) return;
              e.stopPropagation();
              onSelectWall?.(wall.id);
            }}
          >
            {/* Solid Wall Sub-Meshes */}
            {prisms.map((prism, pIdx) => {
              const pLenM = prism.xEndM - prism.xStartM;
              const pHM = prism.yTopM - prism.yBottomM;
              if (pLenM <= 0.001 || pHM <= 0.001) return null;
              const localXM = (prism.xStartM + prism.xEndM) / 2 - lengthM / 2;
              const localYM = (prism.yBottomM + prism.yTopM) / 2;

              return (
                <mesh
                  key={`wall-prism-${pIdx}`}
                  name="wall-segment-mesh"
                  castShadow
                  receiveShadow
                  position={[localXM, localYM, 0]}
                  userData={{
                    wallId: wall.id,
                    wallHeightM: heightM,
                    isCutaway,
                    isSelected,
                  }}
                >
                  <boxGeometry
                    args={[pLenM, pHM, thicknessM]}
                    onUpdate={(self) =>
                      applyContinuousWallPrismUVs(self, {
                        prismXStartM: prism.xStartM,
                        prismYBottomM: prism.yBottomM,
                        prismLengthM: pLenM,
                        prismHeightM: pHM,
                        metersPerTileX: wallConfig.metersPerTileX,
                        metersPerTileY: wallConfig.metersPerTileY,
                      })
                    }
                  />
                  <SpaceStandardMaterial
                    config={wallConfig}
                    isSelected={isSelected}
                  />
                </mesh>
              );
            })}

            {/* Architectural Openings: Carpentry, Frames, Leaves & Panes */}
            {hasOpenings &&
              wall.openings!.map((op) => {
                const opStartM = Math.max(0, op.offsetCm * CM_TO_M);
                const opWidthM = Math.min(lengthM - opStartM, op.widthCm * CM_TO_M);
                const opHeightM = op.heightCm * CM_TO_M;
                const opSillM = op.sillHeightCm * CM_TO_M;
                const localOpXM = opStartM + opWidthM / 2 - lengthM / 2;

                if (isCutaway) {
                  return (
                    <mesh
                      key={`op-threshold-${op.id}`}
                      name="opening-threshold-mesh"
                      position={[localOpXM, 0.01, 0]}
                    >
                      <boxGeometry args={[opWidthM, 0.02, thicknessM * 1.05]} />
                      <meshStandardMaterial color="#475569" roughness={0.5} />
                    </mesh>
                  );
                }

                if (op.kind === 'door') {
                  return (
                    <group
                      key={`door-group-${op.id}`}
                      name="door-opening-node"
                      position={[localOpXM, 0, 0]}
                    >
                      {/* Left jamb */}
                      <mesh position={[-opWidthM / 2 + 0.02, opHeightM / 2, 0]}>
                        <boxGeometry args={[0.04, opHeightM, thicknessM * 1.06]} />
                        <meshStandardMaterial color="#334155" roughness={0.4} />
                      </mesh>
                      {/* Right jamb */}
                      <mesh position={[opWidthM / 2 - 0.02, opHeightM / 2, 0]}>
                        <boxGeometry args={[0.04, opHeightM, thicknessM * 1.06]} />
                        <meshStandardMaterial color="#334155" roughness={0.4} />
                      </mesh>
                      {/* Top header */}
                      <mesh position={[0, opHeightM - 0.02, 0]}>
                        <boxGeometry args={[opWidthM, 0.04, thicknessM * 1.06]} />
                        <meshStandardMaterial color="#334155" roughness={0.4} />
                      </mesh>
                      {/* Door leaf (warm wood, slightly ajar at 15°) */}
                      <mesh
                        position={[-opWidthM / 2 + 0.04, opHeightM / 2, 0.02]}
                        rotation={[0, 0.25, 0]}
                      >
                        <boxGeometry args={[opWidthM * 0.92, opHeightM * 0.96, 0.04]} />
                        <meshStandardMaterial color="#78350f" roughness={0.5} />
                      </mesh>
                    </group>
                  );
                }

                // Window opening
                return (
                  <group
                    key={`window-group-${op.id}`}
                    name="window-opening-node"
                    position={[localOpXM, opSillM + opHeightM / 2, 0]}
                  >
                    {/* Left & Right frame bars */}
                    <mesh position={[-opWidthM / 2 + 0.02, 0, 0]}>
                      <boxGeometry args={[0.04, opHeightM, thicknessM * 1.05]} />
                      <meshStandardMaterial color="#334155" roughness={0.3} />
                    </mesh>
                    <mesh position={[opWidthM / 2 - 0.02, 0, 0]}>
                      <boxGeometry args={[0.04, opHeightM, thicknessM * 1.05]} />
                      <meshStandardMaterial color="#334155" roughness={0.3} />
                    </mesh>
                    <mesh position={[0, -opHeightM / 2 + 0.02, 0]}>
                      <boxGeometry args={[opWidthM, 0.04, thicknessM * 1.05]} />
                      <meshStandardMaterial color="#334155" roughness={0.3} />
                    </mesh>
                    <mesh position={[0, opHeightM / 2 - 0.02, 0]}>
                      <boxGeometry args={[opWidthM, 0.04, thicknessM * 1.05]} />
                      <meshStandardMaterial color="#334155" roughness={0.3} />
                    </mesh>
                    {/* Glass pane */}
                    <mesh>
                      <boxGeometry args={[opWidthM - 0.08, opHeightM - 0.08, 0.015]} />
                      <meshStandardMaterial
                        color="#bae6fd"
                        transparent
                        opacity={0.35}
                        roughness={0.1}
                        metalness={0.1}
                      />
                    </mesh>
                  </group>
                );
              })}
          </group>
        );
      })}

      {/* 3D Interactive Boundary Vertex Corner Handles */}
      {isBoundaryEditMode &&
        layout.baseBoundary.map((pt, idx) => {
          const isSelected = selectedVertexIndex === idx;
          const xM = (pt.x - centerCm.x) * CM_TO_M;
          const zM = (pt.y - centerCm.y) * CM_TO_M;
          const handleColor = isSelected ? '#38bdf8' : '#0284c7';
          const emissiveColor = isSelected ? '#38bdf8' : '#0369a1';

          return (
            <group
              key={`vertex-3d-${idx}`}
              name="boundary-vertex-handle-3d"
              position={[xM, 0, zM]}
              userData={{ vertexIndex: idx, isSelected }}
            >
              {/* Ground anchor ring */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[0.22, 0.36, 24]} />
                <meshBasicMaterial
                  color={handleColor}
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.8}
                />
              </mesh>

              {/* Vertical beacon guide post */}
              <mesh position={[0, 0.225, 0]}>
                <cylinderGeometry args={[0.045, 0.045, 0.45, 12]} />
                <meshStandardMaterial color="#64748b" roughness={0.4} />
              </mesh>

              {/* High-visibility 3D Sphere Handle */}
              <mesh
                name="boundary-vertex-sphere"
                position={[0, 0.48, 0]}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSelectVertex?.(idx);
                  onStartDragVertex?.(idx);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectVertex?.(idx);
                }}
              >
                <sphereGeometry args={[0.26, 24, 24]} />
                <meshStandardMaterial
                  color={handleColor}
                  emissive={emissiveColor}
                  emissiveIntensity={isSelected ? 0.9 : 0.45}
                  roughness={0.2}
                  metalness={0.1}
                />
              </mesh>
            </group>
          );
        })}

      {/* 3D Interactive Edge Midpoint Handles ("+ Corner" / Split Wall) */}
      {isBoundaryEditMode &&
        layout.baseBoundary.map((pt, idx) => {
          const nextPt = layout.baseBoundary[(idx + 1) % layout.baseBoundary.length];
          const edgeLenCm = Math.hypot(nextPt.x - pt.x, nextPt.y - pt.y);
          if (edgeLenCm < 100) return null; // Allow splitting segments of 1.0 m or longer
          const midXCm = (pt.x + nextPt.x) / 2;
          const midYCm = (pt.y + nextPt.y) / 2;
          const xM = (midXCm - centerCm.x) * CM_TO_M;
          const zM = (midYCm - centerCm.y) * CM_TO_M;

          const handleSplitClick = (e: any) => {
            e.stopPropagation();
            onInsertVertexAtEdge?.(idx, {
              x: Math.round(midXCm),
              y: Math.round(midYCm),
            });
          };

          return (
            <group
              key={`edge-split-3d-${idx}`}
              name="edge-split-indicator-3d"
              position={[xM, 0.42, zM]}
            >
              {/* Invisible generous click hitbox (radius 0.35m = 70cm diameter) */}
              <mesh
                position={[0, 0, 0]}
                onPointerDown={handleSplitClick}
                onClick={handleSplitClick}
              >
                <sphereGeometry args={[0.35, 12, 12]} />
                <meshBasicMaterial transparent opacity={0} />
              </mesh>

              {/* High-visibility Octahedron Diamond */}
              <mesh
                rotation={[0, Math.PI / 4, 0]}
                onPointerDown={handleSplitClick}
                onClick={handleSplitClick}
              >
                <octahedronGeometry args={[0.18, 0]} />
                <meshStandardMaterial
                  color="#10b981"
                  emissive="#059669"
                  emissiveIntensity={0.8}
                  roughness={0.2}
                />
              </mesh>

              {/* Glowing anchor ring */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} onPointerDown={handleSplitClick} onClick={handleSplitClick}>
                <ringGeometry args={[0.20, 0.30, 20]} />
                <meshBasicMaterial
                  color="#10b981"
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            </group>
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

            <SpacePlantSprite
              cropCode={plant.cropCode}
              label={plant.label}
              radiusM={radiusM}
              bodyHeightM={bodyHeightM}
              isCrowded={isCrowded}
            />
          </group>
        );
      })}

      {/* ── 3D Architectural Roof / Ceiling Systems ── */}
      {viewMode === '3d' &&
        showRoof &&
        layout.roofConfig &&
        layout.roofConfig.kind !== 'none' && (
          <group name="space-roof-root" renderOrder={2}>
            {/* Gabled Greenhouse Roof (Techo a dos aguas de invernadero) */}
            {layout.roofConfig.kind === 'gabled_greenhouse' && (() => {
              const widthM = bbox.widthCm * CM_TO_M;
              const depthM = bbox.depthCm * CM_TO_M;
              const wallHM = (layout.walls.find((w) => w.heightCm > 0)?.heightCm ?? 240) * CM_TO_M;
              const ridgeRiseM = Math.max(0.8, (layout.roofConfig?.heightCm ?? 140) * CM_TO_M);
              const ridgeApexYM = wallHM + ridgeRiseM;
              const isDepthLonger = depthM >= widthM;

              if (isDepthLonger) {
                const halfSpanM = widthM / 2;
                const slopeHypotM = Math.hypot(halfSpanM, ridgeRiseM);
                const slopeAngleRad = Math.atan2(ridgeRiseM, halfSpanM);

                return (
                  <group name="gabled-greenhouse-roof-group">
                    {/* Ridge structural beam */}
                    <mesh position={[0, ridgeApexYM, 0]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[0.04, 0.04, depthM, 12]} />
                      <meshStandardMaterial color="#334155" roughness={0.4} />
                    </mesh>

                    {/* Left translucent slope */}
                    <mesh
                      name="greenhouse-roof-slope-left"
                      position={[-halfSpanM / 2, wallHM + ridgeRiseM / 2, 0]}
                      rotation={[0, 0, -slopeAngleRad]}
                    >
                      <boxGeometry args={[slopeHypotM, 0.02, depthM]} />
                      <meshStandardMaterial
                        color="#bae6fd"
                        transparent
                        opacity={0.32}
                        depthWrite={false}
                        roughness={0.15}
                        side={THREE.DoubleSide}
                      />
                    </mesh>

                    {/* Right translucent slope */}
                    <mesh
                      name="greenhouse-roof-slope-right"
                      position={[halfSpanM / 2, wallHM + ridgeRiseM / 2, 0]}
                      rotation={[0, 0, slopeAngleRad]}
                    >
                      <boxGeometry args={[slopeHypotM, 0.02, depthM]} />
                      <meshStandardMaterial
                        color="#bae6fd"
                        transparent
                        opacity={0.32}
                        depthWrite={false}
                        roughness={0.15}
                        side={THREE.DoubleSide}
                      />
                    </mesh>

                    {/* Gable Trusses (Cabriadas estructurales) */}
                    {[-depthM / 2, 0, depthM / 2].map((zPos, idx) => (
                      <group key={`truss-${idx}`} position={[0, 0, zPos]}>
                        <mesh position={[0, wallHM, 0]} rotation={[0, 0, Math.PI / 2]}>
                          <cylinderGeometry args={[0.025, 0.025, widthM, 8]} />
                          <meshStandardMaterial color="#334155" roughness={0.4} />
                        </mesh>
                        <mesh position={[0, wallHM + ridgeRiseM / 2, 0]}>
                          <cylinderGeometry args={[0.025, 0.025, ridgeRiseM, 8]} />
                          <meshStandardMaterial color="#334155" roughness={0.4} />
                        </mesh>
                      </group>
                    ))}
                  </group>
                );
              } else {
                const halfSpanM = depthM / 2;
                const slopeHypotM = Math.hypot(halfSpanM, ridgeRiseM);
                const slopeAngleRad = Math.atan2(ridgeRiseM, halfSpanM);

                return (
                  <group name="gabled-greenhouse-roof-group">
                    <mesh position={[0, ridgeApexYM, 0]} rotation={[0, 0, Math.PI / 2]}>
                      <cylinderGeometry args={[0.04, 0.04, widthM, 12]} />
                      <meshStandardMaterial color="#334155" roughness={0.4} />
                    </mesh>
                    <mesh
                      name="greenhouse-roof-slope-left"
                      position={[0, wallHM + ridgeRiseM / 2, -halfSpanM / 2]}
                      rotation={[slopeAngleRad, 0, 0]}
                    >
                      <boxGeometry args={[widthM, 0.02, slopeHypotM]} />
                      <meshStandardMaterial
                        color="#bae6fd"
                        transparent
                        opacity={0.32}
                        depthWrite={false}
                        roughness={0.15}
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                    <mesh
                      name="greenhouse-roof-slope-right"
                      position={[0, wallHM + ridgeRiseM / 2, halfSpanM / 2]}
                      rotation={[-slopeAngleRad, 0, 0]}
                    >
                      <boxGeometry args={[widthM, 0.02, slopeHypotM]} />
                      <meshStandardMaterial
                        color="#bae6fd"
                        transparent
                        opacity={0.32}
                        depthWrite={false}
                        roughness={0.15}
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                  </group>
                );
              }
            })()}

            {/* Flat Ceiling with Suspended Grow Lights (Indoor Room / Lab) */}
            {layout.roofConfig.kind === 'flat_ceiling' && (() => {
              const widthM = bbox.widthCm * CM_TO_M;
              const depthM = bbox.depthCm * CM_TO_M;
              const wallHM = (layout.walls.find((w) => w.heightCm > 0)?.heightCm ?? 250) * CM_TO_M;
              const lightCountX = widthM >= 6 ? 3 : 2;
              const lightCountZ = depthM >= 6 ? 3 : 2;
              const lights: Array<{ x: number; z: number }> = [];

              for (let ix = 0; ix < lightCountX; ix++) {
                const fracX = (ix + 1) / (lightCountX + 1);
                const x = -widthM / 2 + fracX * widthM;
                for (let iz = 0; iz < lightCountZ; iz++) {
                  const fracZ = (iz + 1) / (lightCountZ + 1);
                  const z = -depthM / 2 + fracZ * depthM;
                  lights.push({ x, z });
                }
              }

              return (
                <group name="flat-ceiling-indoor-group">
                  {/* Translucent ceiling slab allowing internal view */}
                  <mesh
                    name="flat-ceiling-mesh"
                    position={[0, wallHM, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                  >
                    <planeGeometry args={[widthM, depthM]} />
                    <meshStandardMaterial
                      color="#94a3b8"
                      transparent
                      opacity={0.25}
                      depthWrite={false}
                      side={THREE.DoubleSide}
                      roughness={0.8}
                    />
                  </mesh>

                  {/* Suspended Grow Lights (Luminarias Quantum Board) */}
                  {layout.roofConfig?.hasGrowLights !== false &&
                    lights.map((lPos, lIdx) => (
                      <group
                        key={`grow-light-${lIdx}`}
                        name="suspended-grow-light-node"
                        position={[lPos.x, wallHM - 0.45, lPos.z]}
                      >
                        {/* 4 suspension cables */}
                        {[
                          [-0.28, -0.18],
                          [0.28, -0.18],
                          [-0.28, 0.18],
                          [0.28, 0.18],
                        ].map(([cx, cz], cIdx) => (
                          <mesh key={`cable-${cIdx}`} position={[cx, 0.225, cz]}>
                            <cylinderGeometry args={[0.005, 0.005, 0.45, 6]} />
                            <meshStandardMaterial color="#64748b" roughness={0.3} />
                          </mesh>
                        ))}

                        {/* Aluminum heatsink plate */}
                        <mesh position={[0, 0.015, 0]}>
                          <boxGeometry args={[0.62, 0.03, 0.42]} />
                          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
                        </mesh>

                        {/* Glowing LED Diode Panel */}
                        <mesh position={[0, -0.005, 0]}>
                          <boxGeometry args={[0.58, 0.01, 0.38]} />
                          <meshStandardMaterial
                            color="#fef08a"
                            emissive="#fde047"
                            emissiveIntensity={1.8}
                            roughness={0.1}
                          />
                        </mesh>

                        {/* Downward cultivation light */}
                        <pointLight
                          color="#fef9c3"
                          intensity={0.65}
                          distance={3.5}
                          decay={2}
                          position={[0, -0.1, 0]}
                        />
                      </group>
                    ))}
                </group>
              );
            })()}

            {/* Shade Cloth Pergola (Media-sombra) */}
            {layout.roofConfig.kind === 'shade_cloth' && (() => {
              const widthM = bbox.widthCm * CM_TO_M;
              const depthM = bbox.depthCm * CM_TO_M;
              const postHM = 2.3;

              return (
                <group name="shade-cloth-roof-group">
                  {/* 4 Corner Timber Posts */}
                  {[
                    [-widthM / 2, -depthM / 2],
                    [widthM / 2, -depthM / 2],
                    [-widthM / 2, depthM / 2],
                    [widthM / 2, depthM / 2],
                  ].map(([px, pz], pIdx) => (
                    <mesh key={`shade-post-${pIdx}`} position={[px, postHM / 2, pz]}>
                      <cylinderGeometry args={[0.06, 0.06, postHM, 8]} />
                      <meshStandardMaterial color="#78350f" roughness={0.7} />
                    </mesh>
                  ))}

                  {/* Porous Dark Green Shade Mesh at 50% opacity */}
                  <mesh position={[0, postHM, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[widthM, depthM]} />
                    <meshStandardMaterial
                      color="#14532d"
                      transparent
                      opacity={0.52}
                      depthWrite={false}
                      side={THREE.DoubleSide}
                      roughness={0.9}
                    />
                  </mesh>
                </group>
              );
            })()}
          </group>
        )}
    </group>
  );
};
