import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import {
  computeObjectFootprintPolygon,
  computeSpaceRegions,
  decomposeWallIntoPrisms,
  type Point2DCm,
  type Polygon2DCm,
  type WallSegmentCm,
} from '@/domain/spaceGeometry';
import {
  computeCrowdedPlantIds,
  computeSunPosition,
  shouldCutawayWall,
  type PlacedPlantSpatialCm,
} from '@/domain/solarAndPlantSpatial';
import type {
  PlacedObjectSpatialCm,
  SpaceLayout1to1,
  SpaceRoofConfig,
} from '@/store/spaceLayoutStore';
import {
  applyContinuousWallPrismUVs,
  applyMetricUVsToShapeGeometry,
  getFloorMaterialConfig,
  getWallMaterialConfig,
  SpaceStandardMaterial,
} from './materials';
import { SpacePlantSprite } from './SpacePlantSprite';
import { SpaceModelInstance } from './SpaceModelInstance';
import { SpaceObjectGizmo } from './gizmo/SpaceObjectGizmo';
import type { GizmoSpatialResult } from './gizmo/calculateGizmoSpatialUpdate';
import { SurroundingGround } from './SurroundingGround';
import { CanopyRingsInstanced, type CanopyRingItem } from './CanopyRingsInstanced';
import { InstancedPlantGroup, type InstancedPlantItem } from './InstancedPlantSprites';
import type { AnalyticalLensType } from './SpaceLensBar';
import { roomLoadProfiler } from './telemetry/roomLoadProfiler';
import { PerfFrameTracker } from './telemetry/PerfFrameTracker';
import { getObjectDimensionsCm } from './objectsCatalog';

const CM_TO_M = 0.01;
const CUTAWAY_WALL_HEIGHT_M = 0.15;
const WALKABLE_ELEVATION_M = 0.015;
const SUN_DISTANCE_M = 20;

export type SpaceViewMode = '2d' | '3d';

export interface ObjectPlacementCursorPreviewData {
  footprint: Polygon2DCm;
  isValid: boolean;
  elevationM: number;
}

export interface SpaceSceneGraphProps {
  layout: SpaceLayout1to1;
  viewMode: SpaceViewMode;
  cameraGroundPosCm?: Point2DCm;
  selectedPlantId?: string | null;
  selectedWallId?: string | null;
  selectedObjectId?: string | null;
  transientObjectDrag?: TransientObjectDragData | null;
  selectedVertexIndex?: number | null;
  isBoundaryEditMode?: boolean;
  fixedCenterCm?: Point2DCm;
  transientBoundary?: Polygon2DCm;
  showRoof?: boolean;
  activeLens?: AnalyticalLensType | null;
  showDistancesConflict?: boolean;
  objectCursorPreview?: ObjectPlacementCursorPreviewData | null;
  activeTool?: string;
  onSelectPlant?: (plantId: string) => void;
  onSelectWall?: (wallId: string) => void;
  onSelectObject?: (objectId: string) => void;
  onStartDragObject?: (objectId: string, pointCm: Point2DCm) => void;
  onSelectVertex?: (vertexIndex: number | null) => void;
  onStartDragVertex?: (vertexIndex: number) => void;
  onInsertVertexAtEdge?: (edgeIndex: number, pointCm: Point2DCm) => void;
  onGroundPointClickCm?: (pointCm: Point2DCm) => void;
  onGizmoDragStart?: (objectId: string) => void;
  onGizmoDragChange?: (objectId: string, update: GizmoSpatialResult) => void;
  onGizmoDragCommit?: (objectId: string, update: GizmoSpatialResult) => void;
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

export function computeBoundingCenterCm(polygon: Polygon2DCm): Point2DCm {
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

function buildPathFromPolygonCm(
  polygon: Polygon2DCm,
  centerCm: Point2DCm,
): THREE.Path | null {
  if (polygon.length < 3) return null;
  const path = new THREE.Path();
  polygon.forEach((pt, idx) => {
    const xM = (pt.x - centerCm.x) * CM_TO_M;
    const yM = -(pt.y - centerCm.y) * CM_TO_M;
    if (idx === 0) {
      path.moveTo(xM, yM);
    } else {
      path.lineTo(xM, yM);
    }
  });
  path.closePath();
  return path;
}

function buildShapeWithHolesFromPolygonCm(
  outer: Polygon2DCm,
  holes: Polygon2DCm[] | undefined,
  centerCm: Point2DCm,
): THREE.Shape | null {
  const shape = buildShapeFromPolygonCm(outer, centerCm);
  if (!shape) return null;
  if (holes && holes.length > 0) {
    for (const hole of holes) {
      const holePath = buildPathFromPolygonCm(hole, centerCm);
      if (holePath) {
        shape.holes.push(holePath);
      }
    }
  }
  return shape;
}

// ─────────────────────────────────────────────────────────────
// Subcomponents memoizados con React.memo
// ─────────────────────────────────────────────────────────────

export interface PlantItemNodeProps {
  plant: PlacedPlantSpatialCm;
  centerCm: Point2DCm;
  isSelected: boolean;
  isCrowded: boolean;
  onSelectPlant?: (plantId: string) => void;
}

export const PlantItemNode: React.FC<PlantItemNodeProps> = React.memo(
  ({ plant, centerCm, isSelected, isCrowded, onSelectPlant }) => {
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
  },
);
PlantItemNode.displayName = 'PlantItemNode';

export interface PlantsLayerProps {
  placedPlants: PlacedPlantSpatialCm[];
  selectedPlantId?: string | null;
  crowdedPlantIds: Set<string>;
  centerCm: Point2DCm;
  activeLens?: AnalyticalLensType | null;
  showDistancesConflict?: boolean;
  onSelectPlant?: (plantId: string) => void;
}

export const PlantsLayer: React.FC<PlantsLayerProps> = React.memo(
  ({
    placedPlants,
    selectedPlantId,
    crowdedPlantIds,
    centerCm,
    activeLens,
    showDistancesConflict,
    onSelectPlant,
  }) => {
    // 1. Determine which plants should visibly display red conflict rings:
    // (a) Active lens 'distances' OR (b) simulator conflict panel/chip open: show all crowded plants
    // (c) Selected plant: show only the selected plant and its directly conflicting neighbors
    // Default: ZERO red rings shown for a clean, calm, world-first presentation
    const conflictingPlantIds = useMemo(() => {
      if (activeLens === 'distances' || showDistancesConflict) {
        return crowdedPlantIds;
      }
      if (selectedPlantId) {
        const selected = placedPlants.find((p) => p.id === selectedPlantId);
        if (!selected) return new Set<string>();
        const neighbors = new Set<string>();
        let hasConflict = false;
        for (let i = 0; i < placedPlants.length; i++) {
          const other = placedPlants[i];
          if (other.id === selectedPlantId) continue;
          const dx = other.xCm - selected.xCm;
          const dy = other.yCm - selected.yCm;
          const dist = Math.hypot(dx, dy);
          const reqDist = other.canopyRadiusCm + selected.canopyRadiusCm;
          if (dist < reqDist) {
            neighbors.add(other.id);
            hasConflict = true;
          }
        }
        if (hasConflict || crowdedPlantIds.has(selectedPlantId)) {
          neighbors.add(selectedPlantId);
        }
        return neighbors;
      }
      return new Set<string>();
    }, [activeLens, showDistancesConflict, selectedPlantId, placedPlants, crowdedPlantIds]);

    // 2. Prepare canopy ring items for instanced rendering (preallocated array for O(N) linear speed)
    // NOTE: selectedPlantId is intentionally excluded from dependencies so selecting a plant does NOT
    // reallocate 7,762 objects or re-run matrix layout buffers.
    const ringItems = useMemo<CanopyRingItem[]>(() => {
      const len = placedPlants.length;
      const items: CanopyRingItem[] = new Array(len);
      for (let i = 0; i < len; i++) {
        const p = placedPlants[i];
        items[i] = {
          id: p.id,
          xM: (p.xCm - centerCm.x) * CM_TO_M,
          zM: (p.yCm - centerCm.y) * CM_TO_M,
          radiusM: Math.max(0.08, p.canopyRadiusCm * CM_TO_M),
          isCrowded: crowdedPlantIds.has(p.id),
        };
      }
      return items;
    }, [placedPlants, centerCm, crowdedPlantIds]);

    // 3. Group plants by cropCode for instanced billboard rendering (1 draw call per cropCode)
    // NOTE: selectedPlantId is intentionally excluded so plantGroups is reference-stable on selection.
    const plantGroups = useMemo(() => {
      const groups = new Map<string, { cropCode: string; plants: InstancedPlantItem[] }>();
      const len = placedPlants.length;
      for (let i = 0; i < len; i++) {
        const p = placedPlants[i];
        const cropCode = p.cropCode || 'TOM';
        let group = groups.get(cropCode);
        if (!group) {
          group = { cropCode, plants: [] };
          groups.set(cropCode, group);
        }
        const radiusM = Math.max(0.08, p.canopyRadiusCm * CM_TO_M);
        group.plants.push({
          id: p.id,
          label: p.label,
          xM: (p.xCm - centerCm.x) * CM_TO_M,
          zM: (p.yCm - centerCm.y) * CM_TO_M,
          radiusM,
          bodyHeightM: Math.max(0.25, radiusM * 1.6),
          isCrowded: crowdedPlantIds.has(p.id),
        });
      }
      return Array.from(groups.values());
    }, [placedPlants, centerCm, crowdedPlantIds]);

    const selectedPlant = useMemo(
      () => placedPlants.find((p) => p.id === selectedPlantId),
      [placedPlants, selectedPlantId],
    );

    return (
      <group name="plants-layer">
        {/* GPU Instanced Canopy Rings (1 draw call for all rings) */}
        <CanopyRingsInstanced
          rings={ringItems}
          selectedPlantId={selectedPlantId}
          conflictingPlantIds={conflictingPlantIds}
          onSelectPlant={onSelectPlant}
        />

        {/* GPU Instanced Plant Billboards (1 draw call per cropCode) */}
        {plantGroups.map((group) => (
          <InstancedPlantGroup
            key={group.cropCode}
            cropCode={group.cropCode}
            plants={group.plants}
            selectedPlantId={selectedPlantId}
            onSelectPlant={onSelectPlant}
          />
        ))}

        {/* Selected plant visual highlight aura */}
        {selectedPlant && (
          <mesh
            name="selected-plant-highlight"
            position={[
              (selectedPlant.xCm - centerCm.x) * CM_TO_M,
              0.025,
              (selectedPlant.yCm - centerCm.y) * CM_TO_M,
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry
              args={[
                Math.max(0.08, selectedPlant.canopyRadiusCm * CM_TO_M) * 1.05,
                Math.max(0.08, selectedPlant.canopyRadiusCm * CM_TO_M) * 1.18,
                32,
              ]}
            />
            <meshBasicMaterial
              color="#38bdf8"
              side={THREE.DoubleSide}
              transparent
              opacity={0.9}
            />
          </mesh>
        )}
      </group>
    );
  },
);
PlantsLayer.displayName = 'PlantsLayer';

export interface TransientObjectDragData {
  objectId: string;
  xCm: number;
  yCm: number;
  rotationDeg?: number;
  elevationM?: number;
  isStacked?: boolean;
  stackedOnLabel?: string;
  isWallSnapped?: boolean;
  isValid: boolean;
  reasons: string[];
  footprint: Polygon2DCm;
}

export interface ObjectsLayerProps {
  placedObjects?: PlacedObjectSpatialCm[];
  centerCm: Point2DCm;
  selectedObjectId?: string | null;
  activeTool?: string;
  transientObjectDrag?: TransientObjectDragData | null;
  onSelectObject?: (objectId: string) => void;
  onStartDragObject?: (objectId: string, pointCm: Point2DCm) => void;
  onGroundPointClickCm?: (pointCm: Point2DCm) => void;
  onGizmoDragStart?: (objectId: string) => void;
  onGizmoDragChange?: (objectId: string, update: GizmoSpatialResult) => void;
  onGizmoDragCommit?: (objectId: string, update: GizmoSpatialResult) => void;
}

export const ObjectsLayer: React.FC<ObjectsLayerProps> = React.memo(
  ({
    placedObjects = [],
    centerCm,
    selectedObjectId,
    activeTool,
    transientObjectDrag,
    onSelectObject,
    onStartDragObject,
    onGroundPointClickCm,
    onGizmoDragStart,
    onGizmoDragChange,
    onGizmoDragCommit,
  }) => {
    if (!placedObjects || placedObjects.length === 0) return null;

    return (
      <group name="objects-layer">
        {placedObjects.map((obj) => {
          const isSelected = selectedObjectId === obj.id;
          const isDragging = transientObjectDrag?.objectId === obj.id;
          const posX = isDragging ? transientObjectDrag.xCm : obj.xCm;
          const posY = isDragging ? transientObjectDrag.yCm : obj.yCm;
          const posElevationM =
            isDragging && transientObjectDrag.elevationM !== undefined
              ? transientObjectDrag.elevationM
              : (obj.elevationM ?? 0);
          const dims = getObjectDimensionsCm(obj.assetId, obj.category);
          const w = obj.widthCm ?? dims.widthCm;
          const d = obj.depthCm ?? dims.depthCm;
          const rot =
            isDragging && transientObjectDrag.rotationDeg !== undefined
              ? transientObjectDrag.rotationDeg
              : (obj.rotationDeg ?? 0);
          const footprint = isDragging
            ? transientObjectDrag.footprint
            : computeObjectFootprintPolygon({ x: posX, y: posY }, w, d, rot);
          const footprintShape =
            isSelected || isDragging
              ? buildShapeFromPolygonCm(footprint, centerCm)
              : null;

          const currentSpatial: PlacedObjectSpatialCm = isDragging
            ? {
                ...obj,
                xCm: posX,
                yCm: posY,
                elevationM: posElevationM,
                rotationDeg: rot,
              }
            : obj;

          return (
            <group key={obj.id} name={`object-node-${obj.id}`}>
              <SpaceObjectGizmo
                object={currentSpatial}
                centerCm={centerCm}
                isSelected={isSelected}
                onDragStart={() => onGizmoDragStart?.(obj.id)}
                onTransformChange={(update) => onGizmoDragChange?.(obj.id, update)}
                onTransformCommit={(update) => onGizmoDragCommit?.(obj.id, update)}
              >
                <SpaceModelInstance
                  modelUrl={obj.modelUrl || `/models/${obj.assetId}.glb`}
                  positionCm={{ x: posX, y: posY }}
                  centerCm={centerCm}
                  elevationM={posElevationM}
                  rotationDeg={rot}
                  onClick={(e) => {
                    (e as { stopPropagation?: () => void })?.stopPropagation?.();
                    if (activeTool === 'place_object' && onGroundPointClickCm) {
                      const intersectPoint = (e as { point?: THREE.Vector3 }).point;
                      if (intersectPoint) {
                        onGroundPointClickCm({
                          x: Math.round(intersectPoint.x * 100 + centerCm.x),
                          y: Math.round(intersectPoint.z * 100 + centerCm.y),
                        });
                        return;
                      }
                    }
                    onSelectObject?.(obj.id);
                  }}
                  onPointerDown={(e) => {
                    if (activeTool === 'place_object') return;
                    (e as { stopPropagation?: () => void })?.stopPropagation?.();
                    onStartDragObject?.(obj.id, { x: posX, y: posY });
                  }}
                />
              </SpaceObjectGizmo>
              {footprintShape && (
                <mesh
                  name={
                    isDragging
                      ? 'dragging-object-footprint-mesh'
                      : 'selected-object-footprint-outline'
                  }
                  position={[0, posElevationM + 0.006, 0]}
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <shapeGeometry args={[footprintShape]} />
                  <meshBasicMaterial
                    color={
                      isDragging
                        ? transientObjectDrag.isValid
                          ? '#10b981'
                          : '#ef4444'
                        : '#0284c7'
                    }
                    opacity={
                      isDragging
                        ? transientObjectDrag.isValid
                          ? 0.45
                          : 0.65
                        : 0.45
                    }
                    transparent
                    depthWrite={false}
                  />
                </mesh>
              )}
            </group>
          );
        })}
      </group>
    );
  },
);
ObjectsLayer.displayName = 'ObjectsLayer';

export interface WallsLayerProps {
  walls: WallSegmentCm[];
  centerCm: Point2DCm;
  viewMode: SpaceViewMode;
  cameraGroundPosCm: Point2DCm;
  selectedWallId?: string | null;
  isBoundaryEditMode?: boolean;
  onSelectWall?: (wallId: string) => void;
}

export const WallsLayer: React.FC<WallsLayerProps> = React.memo(
  ({
    walls,
    centerCm,
    viewMode,
    cameraGroundPosCm,
    selectedWallId,
    isBoundaryEditMode,
    onSelectWall,
  }) => {
    return (
      <group name="walls-layer">
        {walls.map((wall) => {
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
      </group>
    );
  },
);
WallsLayer.displayName = 'WallsLayer';

export interface BoundaryLayerProps {
  baseBoundary: Polygon2DCm;
  centerCm: Point2DCm;
  isBoundaryEditMode?: boolean;
  selectedVertexIndex?: number | null;
  isDragging?: boolean;
  onSelectVertex?: (vertexIndex: number | null) => void;
  onStartDragVertex?: (vertexIndex: number) => void;
  onInsertVertexAtEdge?: (edgeIndex: number, pointCm: Point2DCm) => void;
}

const RubberBandSegment: React.FC<{
  start: Point2DCm;
  end: Point2DCm;
  centerCm: Point2DCm;
}> = ({ start, end, centerCm }) => {
  const dxCm = end.x - start.x;
  const dyCm = end.y - start.y;
  const lengthCm = Math.hypot(dxCm, dyCm);
  if (lengthCm < 1) return null;
  const lengthM = lengthCm * CM_TO_M;
  const midXCm = (start.x + end.x) / 2;
  const midYCm = (start.y + end.y) / 2;
  const xM = (midXCm - centerCm.x) * CM_TO_M;
  const zM = (midYCm - centerCm.y) * CM_TO_M;
  const angleRad = Math.atan2(dyCm, dxCm);

  return (
    <group position={[xM, 0.08, zM]} rotation={[0, -angleRad, 0]}>
      <mesh name="boundary-rubber-band-line">
        <boxGeometry args={[lengthM, 0.04, 0.04]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.8}
          roughness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
};

export const BoundaryLayer: React.FC<BoundaryLayerProps> = React.memo(
  ({
    baseBoundary,
    centerCm,
    isBoundaryEditMode = false,
    selectedVertexIndex,
    isDragging = false,
    onSelectVertex,
    onStartDragVertex,
    onInsertVertexAtEdge,
  }) => {
    if (!isBoundaryEditMode) return null;

    return (
      <group name="boundary-layer">
        {/* Rubber-band dynamic elastic guides when dragging a vertex */}
        {isDragging &&
          selectedVertexIndex !== null &&
          selectedVertexIndex !== undefined &&
          selectedVertexIndex >= 0 &&
          selectedVertexIndex < baseBoundary.length &&
          baseBoundary.length >= 3 && (
            <group name="boundary-rubber-band-guides">
              <RubberBandSegment
                start={
                  baseBoundary[
                    (selectedVertexIndex - 1 + baseBoundary.length) %
                      baseBoundary.length
                  ]
                }
                end={baseBoundary[selectedVertexIndex]}
                centerCm={centerCm}
              />
              <RubberBandSegment
                start={baseBoundary[selectedVertexIndex]}
                end={
                  baseBoundary[(selectedVertexIndex + 1) % baseBoundary.length]
                }
                centerCm={centerCm}
              />
            </group>
          )}

        {/* 3D Interactive Boundary Vertex Corner Handles */}
        {baseBoundary.map((pt, idx) => {
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
        {!isDragging &&
          baseBoundary.map((pt, idx) => {
          const nextPt = baseBoundary[(idx + 1) % baseBoundary.length];
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
              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                onPointerDown={handleSplitClick}
                onClick={handleSplitClick}
              >
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
      </group>
    );
  },
);
BoundaryLayer.displayName = 'BoundaryLayer';

export interface RoofLayerProps {
  roofConfig?: SpaceRoofConfig;
  bbox: { widthCm: number; depthCm: number };
  walls: WallSegmentCm[];
  viewMode: SpaceViewMode;
  showRoof?: boolean;
}

export const RoofLayer: React.FC<RoofLayerProps> = React.memo(
  ({ roofConfig, bbox, walls, viewMode, showRoof = true }) => {
    if (viewMode !== '3d' || !showRoof || !roofConfig || roofConfig.kind === 'none') {
      return null;
    }

    return (
      <group name="space-roof-root" renderOrder={2}>
        {/* Gabled Greenhouse Roof (Techo a dos aguas de invernadero) */}
        {roofConfig.kind === 'gabled_greenhouse' && (() => {
          const widthM = bbox.widthCm * CM_TO_M;
          const depthM = bbox.depthCm * CM_TO_M;
          const wallHM = (walls.find((w) => w.heightCm > 0)?.heightCm ?? 240) * CM_TO_M;
          const ridgeRiseM = Math.max(0.8, (roofConfig?.heightCm ?? 140) * CM_TO_M);
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
                {[-widthM / 2, 0, widthM / 2].map((xPos, idx) => (
                  <group key={`truss-x-${idx}`} position={[xPos, 0, 0]}>
                    <mesh position={[0, wallHM, 0]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[0.025, 0.025, depthM, 8]} />
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
          }
        })()}

        {/* Flat Ceiling / Indoor Room Slab (Techo plano para sala indoor / cultivo de interior) */}
        {roofConfig.kind === 'flat_ceiling' && (() => {
          const widthM = bbox.widthCm * CM_TO_M;
          const depthM = bbox.depthCm * CM_TO_M;
          const wallHM = (walls.find((w) => w.heightCm > 0)?.heightCm ?? 240) * CM_TO_M;

          // 2x2 to 3x3 light distribution grid depending on room dimensions
          const cols = widthM >= 5 ? 3 : 2;
          const rows = depthM >= 5 ? 3 : 2;
          const lights: { x: number; z: number }[] = [];
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const x = -widthM / 2 + ((c + 0.5) * widthM) / cols;
              const z = -depthM / 2 + ((r + 0.5) * depthM) / rows;
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
              {roofConfig.hasGrowLights !== false && (
                <>
                  {/* Single efficient downward cultivation light replacing multiple heavy pointLights */}
                  <pointLight
                    color="#fef9c3"
                    intensity={1.5}
                    distance={Math.max(12, Math.max(widthM, depthM) * 1.5)}
                    decay={2}
                    position={[0, wallHM - 0.4, 0]}
                  />

                  {lights.map((lPos, lIdx) => (
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
                    </group>
                  ))}
                </>
              )}
            </group>
          );
        })()}

        {/* Shade Cloth Pergola (Media-sombra) */}
        {roofConfig.kind === 'shade_cloth' && (() => {
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
    );
  },
);
RoofLayer.displayName = 'RoofLayer';

// ─────────────────────────────────────────────────────────────
// SpaceSceneGraph Root Component (React.memo)
// ─────────────────────────────────────────────────────────────

export const SpaceSceneGraph: React.FC<SpaceSceneGraphProps> = React.memo(({
  layout,
  viewMode,
  cameraGroundPosCm = { x: 500, y: 950 },
  selectedPlantId,
  selectedWallId,
  selectedObjectId,
  transientObjectDrag,
  selectedVertexIndex,
  isBoundaryEditMode = false,
  fixedCenterCm,
  transientBoundary,
  showRoof = true,
  activeLens,
  showDistancesConflict,
  objectCursorPreview,
  activeTool,
  onSelectPlant,
  onSelectWall,
  onSelectObject,
  onStartDragObject,
  onSelectVertex,
  onStartDragVertex,
  onInsertVertexAtEdge,
  onGroundPointClickCm,
  onGizmoDragStart,
  onGizmoDragChange,
  onGizmoDragCommit,
}) => {
  const centerCm = useMemo(
    () => fixedCenterCm ?? computeBoundingCenterCm(layout.baseBoundary),
    [fixedCenterCm, layout.baseBoundary],
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
    () => {
      const sectors = regions.cultivableSectors ?? [];
      if (sectors.length > 0) {
        return sectors
          .map((sector, index) => ({
            id: sector.id || `cultivable-${index}`,
            shape: buildShapeWithHolesFromPolygonCm(sector.outer, sector.holes, centerCm),
          }))
          .filter((item): item is { id: string; shape: THREE.Shape } => item.shape !== null);
      }
      return regions.cultivablePolygons
        .map((poly, index) => ({
          id: `cultivable-${index}`,
          shape: buildShapeFromPolygonCm(poly, centerCm),
        }))
        .filter((item): item is { id: string; shape: THREE.Shape } => item.shape !== null);
    },
    [regions.cultivableSectors, regions.cultivablePolygons, centerCm],
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

  const objectCursorShape = useMemo(() => {
    if (!objectCursorPreview || objectCursorPreview.footprint.length < 3) return null;
    return buildShapeFromPolygonCm(objectCursorPreview.footprint, centerCm);
  }, [objectCursorPreview, centerCm]);

  const sunPosition: [number, number, number] = [
    sun.sceneDirection.x * SUN_DISTANCE_M,
    sun.sceneDirection.y * SUN_DISTANCE_M,
    sun.sceneDirection.z * SUN_DISTANCE_M,
  ];

  // Base floor material configured from layout.baseMaterial instead of hardcoded 'soil'
  const baseFloorConfig = useMemo(
    () => getFloorMaterialConfig(layout.baseMaterial || 'soil'),
    [layout.baseMaterial],
  );
  const walkableConfig = useMemo(() => getFloorMaterialConfig('concrete'), []);

  // Progressive Plant Population:
  // For massive rooms (>1000 plants like "dos asad" with 5000), defer plant mounting to the next tick / RAF.
  // This allows the 3D infrastructure (floor, walls, roof, lights, camera, controls) to mount in 0 ms real-time.
  const plantCount = layout.placedPlants.length;
  const isMassive = plantCount > 1000;
  const [isPlantsReady, setIsPlantsReady] = useState(() => !isMassive);

  useEffect(() => {
    if (!isMassive) {
      setIsPlantsReady(true);
      return;
    }
    let rafId: number;
    if (typeof requestAnimationFrame !== 'undefined') {
      rafId = requestAnimationFrame(() => {
        setIsPlantsReady(true);
      });
    }
    const timerId = setTimeout(() => {
      setIsPlantsReady(true);
    }, 16);

    return () => {
      if (typeof cancelAnimationFrame !== 'undefined' && rafId) {
        cancelAnimationFrame(rafId);
      }
      clearTimeout(timerId);
    };
  }, [isMassive, layout.locationId]);

  // Precomputed crowded plant IDs using Spatial Hash Grid in O(N)
  const crowdedPlantIds = useMemo(() => {
    if (!isPlantsReady) return new Set<string>();
    roomLoadProfiler.markGeometryStart();
    const result = computeCrowdedPlantIds(layout.placedPlants);
    roomLoadProfiler.markGeometryEnd(layout.placedPlants.length);
    return result;
  }, [isPlantsReady, layout.placedPlants]);

  const isIndoorClosed = layout.roofConfig?.kind === 'flat_ceiling';
  const maxDimensionM = Math.max(bbox.widthCm, bbox.depthCm) * CM_TO_M;
  const shadowCamSize = Math.max(10, maxDimensionM * 0.8);

  return (
    <group name="space-scene-root">
      {/* Surrounding landscape ground plane blending seamlessly into the horizon fog */}
      <SurroundingGround />

      <ambientLight intensity={isIndoorClosed ? 0.45 : sun.isDaylight ? 0.55 : 0.2} />
      <directionalLight
        name="solar-directional-light"
        castShadow={!isIndoorClosed}
        position={sunPosition}
        intensity={isIndoorClosed ? 0.15 : sun.intensity * 2.2}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={SUN_DISTANCE_M * 2.5}
        shadow-camera-left={-shadowCamSize}
        shadow-camera-right={shadowCamSize}
        shadow-camera-top={shadowCamSize}
        shadow-camera-bottom={-shadowCamSize}
      />

      {/* Cultivable/base sectors with configurable material */}
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
                metersPerTileX: baseFloorConfig.metersPerTileX,
                metersPerTileY: baseFloorConfig.metersPerTileY,
              })
            }
          />
          <SpaceStandardMaterial config={baseFloorConfig} />
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

      {/* Perimeter walls layer */}
      <WallsLayer
        walls={layout.walls}
        centerCm={centerCm}
        viewMode={viewMode}
        cameraGroundPosCm={cameraGroundPosCm}
        selectedWallId={selectedWallId}
        isBoundaryEditMode={isBoundaryEditMode}
        onSelectWall={onSelectWall}
      />

      {/* 3D Interactive Boundary layer (Vertex and Edge split handles) */}
      <BoundaryLayer
        baseBoundary={transientBoundary ?? layout.baseBoundary}
        centerCm={centerCm}
        isBoundaryEditMode={isBoundaryEditMode}
        selectedVertexIndex={selectedVertexIndex}
        isDragging={Boolean(
          transientBoundary &&
            selectedVertexIndex !== null &&
            selectedVertexIndex !== undefined,
        )}
        onSelectVertex={onSelectVertex}
        onStartDragVertex={onStartDragVertex}
        onInsertVertexAtEdge={onInsertVertexAtEdge}
      />

      {/* 1:1 Placed plants layer (deferred/progressive for massive rooms > 1000 plants) */}
      {isPlantsReady && (
        <React.Suspense fallback={null}>
          <PlantsLayer
            placedPlants={layout.placedPlants}
            selectedPlantId={selectedPlantId}
            crowdedPlantIds={crowdedPlantIds}
            centerCm={centerCm}
            activeLens={activeLens}
            showDistancesConflict={showDistancesConflict}
            onSelectPlant={onSelectPlant}
          />
        </React.Suspense>
      )}

      {/* 1:1 Placed 3D Objects & Logistics layer */}
      {layout.placedObjects && layout.placedObjects.length > 0 && (
        <React.Suspense fallback={null}>
          <ObjectsLayer
            placedObjects={layout.placedObjects}
            centerCm={centerCm}
            selectedObjectId={selectedObjectId}
            activeTool={activeTool}
            transientObjectDrag={transientObjectDrag}
            onSelectObject={onSelectObject}
            onStartDragObject={onStartDragObject}
            onGroundPointClickCm={onGroundPointClickCm}
            onGizmoDragStart={onGizmoDragStart}
            onGizmoDragChange={onGizmoDragChange}
            onGizmoDragCommit={onGizmoDragCommit}
          />
        </React.Suspense>
      )}

      {/* Real-time 3D Object Footprint & Collision Validation Cursor */}
      {objectCursorPreview && objectCursorShape && (
        <group name="object-cursor-preview">
          <mesh
            name="object-placement-footprint-mesh"
            position={[0, (objectCursorPreview.elevationM ?? 0) + 0.005, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <shapeGeometry args={[objectCursorShape]} />
            <meshBasicMaterial
              color={objectCursorPreview.isValid ? '#10b981' : '#ef4444'}
              opacity={objectCursorPreview.isValid ? 0.35 : 0.55}
              transparent
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      {/* Frame Tracker for T4 WebGL paint profiling */}
      <PerfFrameTracker plantCount={plantCount} isReady={isPlantsReady} />

      {/* 3D Architectural Roof layer */}
      <RoofLayer
        roofConfig={layout.roofConfig}
        bbox={bbox}
        walls={layout.walls}
        viewMode={viewMode}
        showRoof={showRoof}
      />
    </group>
  );
});
SpaceSceneGraph.displayName = 'SpaceSceneGraph';
