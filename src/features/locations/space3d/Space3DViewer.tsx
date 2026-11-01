import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import {
  calculatePolygonAreaM2,
  calculatePolygonPerimeterM,
  computeSpaceRegions,
  createDefaultDoorOpening,
  createDefaultWindowOpening,
  createLShapePolygon,
  createRectPolygon,
  findClosestEdgeOnPolygon,
  isRectangularPolygon,
  type Point2DCm,
  type Polygon2DCm,
} from '@/domain/spaceGeometry';
import { measurePlantNeighbors, type PlacedPlantSpatialCm } from '@/domain/solarAndPlantSpatial';
import type { Individual } from '@/domain/individual';
import { flushSpaceLayoutStorage, useSpaceLayoutStore } from '@/store/spaceLayoutStore';
import { useIndividualStore } from '@/store/individualStore';
import { useSeedLotStore } from '@/store/seedLotStore';
import { useTaxonStore } from '@/store/taxonStore';
import { SpaceSceneGraph, type SpaceViewMode } from './SpaceSceneGraph';
import { SpaceHeaderNav } from './SpaceHeaderNav';
import { SpaceLensBar, type AnalyticalLensType } from './SpaceLensBar';
import { SpaceCommandDock } from './SpaceCommandDock';
import { SpaceCameraWidget } from './SpaceCameraWidget';
import { SpacePlantActionBar } from './SpacePlantActionBar';
import { SpaceWallActionBar } from './SpaceWallActionBar';
import { SpaceRoofActionBar } from './SpaceRoofActionBar';
import { SpaceBottomDock } from './SpaceBottomDock';
import {
  computeCursorPlantPreview,
  computeDraftPathMetrics,
  createInitialBuilderState,
  spaceBuilderReducer,
  type PlantPresetKey,
} from './spaceBuilderReducer';

const CURSOR_TOOLS: string[] = [
  'draw_path',
  'plant_line',
  'edit_boundary',
  'plant_single',
  'plant_fill_sector',
];

export interface Space3DViewerProps {
  locationId: string;
  locationName?: string;
  locationType?: string;
  capacity?: number;
  initialMode?: 'crop' | 'design';
  onBackToCampus?: () => void;
  onOpenSowModal?: () => void;
  onInspectPlantDetails?: (individualId: string) => void;
  onAdvancePlantBBCH?: (individualId: string) => void;
  onTakeCutting?: (individualId: string) => void;
  onRemovePlantIndividual?: (individualId: string) => void;
}

function computeBoundingBoxCm(polygon: Polygon2DCm): {
  widthCm: number;
  depthCm: number;
  centerXCm: number;
  centerYCm: number;
} {
  if (polygon.length === 0) {
    return { widthCm: 1000, depthCm: 600, centerXCm: 500, centerYCm: 300 };
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
  const widthCm = Math.max(100, maxX - minX);
  const depthCm = Math.max(100, maxY - minY);
  return {
    widthCm,
    depthCm,
    centerXCm: (minX + maxX) / 2,
    centerYCm: (minY + maxY) / 2,
  };
}

function polygonToSvgPoints(polygon: Polygon2DCm): string {
  return polygon.map((p) => `${p.x},${p.y}`).join(' ');
}

function canUseWebGL(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl'),
    );
  } catch {
    return false;
  }
}

const INITIAL_CAMERA_POSITION_3D: [number, number, number] = [0, 8.5, 9.5];

export const Space3DViewer: React.FC<Space3DViewerProps> = ({
  locationId,
  locationName,
  locationType,
  capacity,
  initialMode,
  onBackToCampus,
  onOpenSowModal,
  onInspectPlantDetails,
  onAdvancePlantBBCH,
  onTakeCutting,
  onRemovePlantIndividual,
}) => {
  const layout = useSpaceLayoutStore((state) =>
    state.getOrCreateSpaceLayout(locationId, locationType),
  );
  const applyPreset = useSpaceLayoutStore((state) => state.applyPreset);
  const updateSolarConfig = useSpaceLayoutStore((state) => state.updateSolarConfig);
  const addPathStroke = useSpaceLayoutStore((state) => state.addPathStroke);
  const removePathStroke = useSpaceLayoutStore((state) => state.removePathStroke);
  const setBaseBoundary = useSpaceLayoutStore((state) => state.setBaseBoundary);
  const setBaseMaterial = useSpaceLayoutStore((state) => state.setBaseMaterial);
  const insertBoundaryVertex = useSpaceLayoutStore(
    (state) => state.insertBoundaryVertex,
  );
  const snapshotHistory = useSpaceLayoutStore((state) => state.snapshotHistory);
  const moveBoundaryVertex = useSpaceLayoutStore(
    (state) => state.moveBoundaryVertex,
  );
  const removeBoundaryVertex = useSpaceLayoutStore(
    (state) => state.removeBoundaryVertex,
  );
  const sanitizeBoundary = useSpaceLayoutStore((state) => state.sanitizeBoundary);
  const scaleBoundary = useSpaceLayoutStore((state) => state.scaleBoundary);
  const updateWall = useSpaceLayoutStore((state) => state.updateWall);
  const addWallOpening = useSpaceLayoutStore((state) => state.addWallOpening);
  const removeWallOpening = useSpaceLayoutStore((state) => state.removeWallOpening);
  const setAllWallsHeight = useSpaceLayoutStore(
    (state) => state.setAllWallsHeight,
  );
  const setAllWallsMaterial = useSpaceLayoutStore(
    (state) => state.setAllWallsMaterial,
  );
  const updateRoofConfig = useSpaceLayoutStore(
    (state) => state.updateRoofConfig,
  );
  const placePlant = useSpaceLayoutStore((state) => state.placePlant);
  const removePlant = useSpaceLayoutStore((state) => state.removePlant);
  const placePlantLine = useSpaceLayoutStore((state) => state.placePlantLine);
  const fillCultivableSector = useSpaceLayoutStore(
    (state) => state.fillCultivableSector,
  );
  const undo = useSpaceLayoutStore((state) => state.undo);
  const redo = useSpaceLayoutStore((state) => state.redo);
  const canUndo = useSpaceLayoutStore((state) => state.canUndo(locationId));
  const canRedo = useSpaceLayoutStore((state) => state.canRedo(locationId));

  // Store connections for full integration
  const individuals = useIndividualStore((state) => state.individuals);
  const updateIndividual = useIndividualStore((state) => state.update);
  const removeIndividual = useIndividualStore((state) => state.remove);
  const seedLots = useSeedLotStore((state) => state.seedLots);
  const taxons = useTaxonStore((state) => state.taxons);

  const [viewMode, setViewMode] = useState<SpaceViewMode>('3d');
  const [cameraAzimuthDeg, setCameraAzimuthDeg] = useState<number>(0);
  const cameraAzimuthDegRef = useRef(cameraAzimuthDeg);
  cameraAzimuthDegRef.current = cameraAzimuthDeg;
  const orbitControlsRef = useRef<any>(null);
  const [zoomPercent, setZoomPercent] = useState<number>(75);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showRoof, setShowRoof] = useState<boolean>(true);
  const [activeLens, setActiveLens] = useState<AnalyticalLensType | null>(null);
  const [speciesFilter, setSpeciesFilter] = useState<string | null>(null);
  const [dockMode, setDockMode] = useState<'crop' | 'design'>(initialMode ?? 'design');
  const [isTrayOpen, setIsTrayOpen] = useState<boolean>(false);

  // Undo Toast state for Cultivo mode
  interface PlantUndoToastState {
    plant: PlacedPlantSpatialCm;
    individual?: Individual | null;
  }
  const [undoToast, setUndoToast] = useState<PlantUndoToastState | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Global keyboard shortcuts (Ctrl+Z / Cmd+Z, Ctrl+Y / Cmd+Y, Ctrl+Shift+Z / Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (isInput) return;

      if (dockMode !== 'design') return;

      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo(locationId);
      } else if (
        (isMod && !e.shiftKey && e.key.toLowerCase() === 'y') ||
        (isMod && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        redo(locationId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dockMode, locationId, undo, redo]);

  const [builderState, dispatch] = useReducer(
    spaceBuilderReducer,
    undefined,
    createInitialBuilderState,
  );

  const bbox = useMemo(
    () => computeBoundingBoxCm(layout.baseBoundary),
    [layout.baseBoundary],
  );

  const areaM2 = useMemo(
    () => calculatePolygonAreaM2(layout.baseBoundary),
    [layout.baseBoundary],
  );

  const perimeterM = useMemo(
    () => calculatePolygonPerimeterM(layout.baseBoundary),
    [layout.baseBoundary],
  );

  const isRectangular = useMemo(
    () => isRectangularPolygon(layout.baseBoundary),
    [layout.baseBoundary],
  );

  const [customWidthM, setCustomWidthM] = useState<string>(() =>
    (bbox.widthCm / 100).toFixed(1),
  );
  const [customDepthM, setCustomDepthM] = useState<string>(() =>
    (bbox.depthCm / 100).toFixed(1),
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

  const draftMetrics = useMemo(
    () => computeDraftPathMetrics(builderState),
    [builderState],
  );

  const cursorPreview = useMemo(
    () =>
      computeCursorPlantPreview(builderState, regions, layout.placedPlants),
    [builderState, regions, layout.placedPlants],
  );

  const selectedPlant = useMemo(
    () =>
      layout.placedPlants.find((p) => p.id === builderState.selectedPlantId) ??
      null,
    [layout.placedPlants, builderState.selectedPlantId],
  );

  const selectedWall = useMemo(
    () =>
      layout.walls.find((w) => w.id === builderState.selectedWallId) ?? null,
    [layout.walls, builderState.selectedWallId],
  );

  const [draggingVertexIndex, setDraggingVertexIndex] = useState<number | null>(null);

  useEffect(() => {
    if (draggingVertexIndex === null) return;
    const handleGlobalPointerUp = () => {
      setDraggingVertexIndex(null);
      flushSpaceLayoutStorage();
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('mouseup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('mouseup', handleGlobalPointerUp);
    };
  }, [draggingVertexIndex]);

  const lastDispatchedCursorRef = useRef<Point2DCm | null>(null);
  const cursorRafIdRef = useRef<number | null>(null);
  const pendingCursorPointRef = useRef<Point2DCm | null>(null);
  const lastSvgPointerTimeRef = useRef<number>(0);

  const dispatchThrottledCursor = useCallback(
    (pt: Point2DCm) => {
      const isCursorNeeded =
        CURSOR_TOOLS.includes(builderState.activeTool) || draggingVertexIndex !== null;
      if (!isCursorNeeded) {
        return;
      }
      const last = lastDispatchedCursorRef.current;
      if (last && last.x === pt.x && last.y === pt.y) {
        return;
      }
      lastDispatchedCursorRef.current = pt;

      const isTestEnv =
        (typeof globalThis !== 'undefined' &&
          (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV ===
            'test') ||
        import.meta.env?.MODE === 'test';
      if (isTestEnv || typeof requestAnimationFrame === 'undefined') {
        dispatch({ type: 'MOVE_CURSOR', pointCm: pt });
        return;
      }

      pendingCursorPointRef.current = pt;
      if (cursorRafIdRef.current === null) {
        cursorRafIdRef.current = requestAnimationFrame(() => {
          cursorRafIdRef.current = null;
          const nextPt = pendingCursorPointRef.current;
          if (nextPt) {
            dispatch({ type: 'MOVE_CURSOR', pointCm: nextPt });
          }
        });
      }
    },
    [builderState.activeTool, draggingVertexIndex],
  );

  useEffect(() => {
    return () => {
      if (cursorRafIdRef.current !== null) {
        cancelAnimationFrame(cursorRafIdRef.current);
      }
    };
  }, []);

  const handleSelectPlant = useCallback((plantId: string) => {
    dispatch({ type: 'SELECT_PLANT', plantId });
  }, []);

  const handleSelectWall = useCallback((wallId: string) => {
    dispatch({ type: 'SELECT_WALL', wallId });
  }, []);

  const handleSelectVertex = useCallback((idx: number | null) => {
    dispatch({ type: 'SELECT_VERTEX', vertexIndex: idx });
    dispatch({ type: 'SELECT_WALL', wallId: null });
  }, []);

  const handleStartDragVertex = useCallback(
    (idx: number) => {
      snapshotHistory(locationId);
      setDraggingVertexIndex(idx);
      dispatch({ type: 'SELECT_VERTEX', vertexIndex: idx });
      dispatch({ type: 'SELECT_WALL', wallId: null });
    },
    [locationId, snapshotHistory],
  );

  const handleInsertVertexAtEdge = useCallback(
    (edgeIndex: number, pointCm: Point2DCm) => {
      insertBoundaryVertex(locationId, edgeIndex, pointCm);
    },
    [locationId, insertBoundaryVertex],
  );

  // Stable workspace coordinates with 1.2m margin around the terrain
  const canvasViewBox = useMemo(() => {
    let minX = 0;
    let maxX = 1000;
    let minY = 0;
    let maxY = 600;
    if (layout.baseBoundary.length > 0) {
      minX = Math.min(0, ...layout.baseBoundary.map((p) => p.x));
      maxX = Math.max(1000, ...layout.baseBoundary.map((p) => p.x));
      minY = Math.min(0, ...layout.baseBoundary.map((p) => p.y));
      maxY = Math.max(600, ...layout.baseBoundary.map((p) => p.y));
    }
    const pad = 120;
    return {
      minX: Math.round(minX - pad),
      minY: Math.round(minY - pad),
      width: Math.round(maxX - minX + pad * 2),
      height: Math.round(maxY - minY + pad * 2),
    };
  }, [
    // Freeze viewBox while dragging so origin/scale does not jitter under the mouse
    draggingVertexIndex === null ? layout.baseBoundary : null,
  ]);

  const edgeInsertionPreview = useMemo(() => {
    if (builderState.activeTool !== 'edit_boundary' || !builderState.cursorCm || draggingVertexIndex !== null) {
      return null;
    }
    const closest = findClosestEdgeOnPolygon(layout.baseBoundary, builderState.cursorCm);
    if (closest && closest.distanceCm <= 40) {
      const p1 = layout.baseBoundary[closest.edgeIndex];
      const p2 = layout.baseBoundary[(closest.edgeIndex + 1) % layout.baseBoundary.length];
      const edgeLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (edgeLen >= 120) {
        return closest;
      }
    }
    return null;
  }, [builderState.activeTool, builderState.cursorCm, layout.baseBoundary, draggingVertexIndex]);

  useEffect(() => {
    if (builderState.selectedPlantId && !selectedPlant) {
      dispatch({ type: 'SELECT_PLANT', plantId: null });
    }
  }, [builderState.selectedPlantId, selectedPlant]);

  useEffect(() => {
    if (builderState.selectedWallId && !selectedWall) {
      dispatch({ type: 'SELECT_WALL', wallId: null });
    }
  }, [builderState.selectedWallId, selectedWall]);

  useEffect(() => {
    if (layout.baseBoundary.length > 8) {
      sanitizeBoundary(locationId);
    }
  }, [locationId, layout.baseBoundary.length, sanitizeBoundary]);

  const matchingIndividual = useMemo(() => {
    if (!selectedPlant) return null;
    return (
      individuals.find(
        (ind) => ind.id === selectedPlant.id || ind.label === selectedPlant.label,
      ) ?? null
    );
  }, [individuals, selectedPlant]);

  const selectedPlantNeighbors = useMemo(() => {
    if (!selectedPlant) return [];
    return measurePlantNeighbors(selectedPlant, layout.placedPlants);
  }, [selectedPlant, layout.placedPlants]);

  const cameraGroundPosCm = useMemo<Point2DCm>(() => {
    const rad = (cameraAzimuthDeg * Math.PI) / 180;
    const distCm = Math.max(bbox.widthCm, bbox.depthCm) * 0.9;
    return {
      x: Math.round(bbox.centerXCm + Math.sin(rad) * distCm),
      y: Math.round(bbox.centerYCm + Math.cos(rad) * distCm),
    };
  }, [cameraAzimuthDeg, bbox]);

  const handleRotateCamera = (deltaDeg: number) => {
    const nextDeg = (((cameraAzimuthDeg + deltaDeg) % 360) + 360) % 360;
    cameraAzimuthDegRef.current = nextDeg;
    setCameraAzimuthDeg(nextDeg);
    if (orbitControlsRef.current) {
      const azRad = (nextDeg * Math.PI) / 180;
      orbitControlsRef.current.setAzimuthalAngle(azRad);
      orbitControlsRef.current.update();
    }
  };

  const handleResetCameraNorth = () => {
    cameraAzimuthDegRef.current = 0;
    setCameraAzimuthDeg(0);
    if (orbitControlsRef.current) {
      orbitControlsRef.current.setAzimuthalAngle(0);
      orbitControlsRef.current.update();
    }
  };

  useEffect(() => {
    if (viewMode === '3d' && orbitControlsRef.current && cameraAzimuthDeg !== 0) {
      orbitControlsRef.current.setAzimuthalAngle((cameraAzimuthDeg * Math.PI) / 180);
      orbitControlsRef.current.update();
    }
  }, [viewMode]);

  const webglSupported = useMemo(() => canUseWebGL(), []);

  // Filter species for lenses
  const availableSpecies = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ code: string; label: string }> = [];
    for (const p of layout.placedPlants) {
      if (p.cropCode && !seen.has(p.cropCode)) {
        seen.add(p.cropCode);
        const taxon = taxons.find((t) => t.cropCode === p.cropCode);
        list.push({
          code: p.cropCode,
          label: taxon?.commonName || p.label || p.cropCode,
        });
      }
    }
    return list;
  }, [layout.placedPlants, taxons]);

  // Active seed lots and available plants for the bottom tray
  const activeSeedLots = useMemo(() => {
    return seedLots
      .filter(
        (lot) =>
          lot.status === 'active' &&
          (lot.currentCount === undefined || lot.currentCount > 0),
      )
      .map((lot) => {
        const taxon = taxons.find((t) => t.id === lot.accessionId);
        return {
          id: lot.id,
          lotCode: lot.lotCode,
          cropName: taxon?.commonName || 'Semilla',
          currentCount: lot.currentCount,
          germinationRate: lot.germinationRate,
        };
      });
  }, [seedLots, taxons]);

  const availablePlantsForTray = useMemo(() => {
    return individuals
      .filter((ind) => ind.status === 'active')
      .map((ind) => ({
        id: ind.id,
        label: ind.label || 'Planta',
        cropName: ind.location || 'Planta',
        bbchStage: ind.currentBBCH,
        isPlaced: layout.placedPlants.some((p) => p.id === ind.id),
      }));
  }, [individuals, layout.placedPlants]);

  const handlePlanePointClick = useCallback(
    (pointCm: Point2DCm) => {
      const pt = {
        x: Math.max(0, Math.min(bbox.widthCm, Math.round(pointCm.x))),
        y: Math.max(0, Math.min(bbox.depthCm, Math.round(pointCm.y))),
      };

      if (builderState.activeTool === 'inspect') {
        dispatch({ type: 'SELECT_PLANT', plantId: null });
        dispatch({ type: 'SELECT_WALL', wallId: null });
        dispatch({ type: 'SELECT_VERTEX', vertexIndex: null });
        return;
      }

      if (builderState.activeTool === 'draw_path') {
        if (!builderState.draftStartCm) {
          dispatch({ type: 'SET_DRAFT_START', pointCm: pt });
          dispatch({ type: 'MOVE_CURSOR', pointCm: pt });
        } else {
          addPathStroke(locationId, {
            label: `Camino ${layout.paths.length + 1}`,
            material: builderState.pathMaterial,
            widthCm: builderState.pathWidthCm,
            points: [builderState.draftStartCm, pt],
          });
          dispatch({ type: 'SET_DRAFT_START', pointCm: null });
        }
        return;
      }

      if (builderState.activeTool === 'plant_single') {
        const newId = placePlant(locationId, {
          label: builderState.plantTemplate.label,
          cropCode: builderState.plantTemplate.cropCode,
          xCm: pt.x,
          yCm: pt.y,
          canopyRadiusCm: builderState.plantTemplate.canopyRadiusCm,
        });
        dispatch({ type: 'SELECT_PLANT', plantId: newId });
        return;
      }

      if (builderState.activeTool === 'edit_boundary') {
        dispatch({ type: 'SELECT_VERTEX', vertexIndex: null });
        dispatch({ type: 'SELECT_WALL', wallId: null });
        return;
      }

      if (builderState.activeTool === 'plant_line') {
        if (!builderState.draftStartCm) {
          dispatch({ type: 'SET_DRAFT_START', pointCm: pt });
          dispatch({ type: 'MOVE_CURSOR', pointCm: pt });
        } else {
          placePlantLine(
            locationId,
            builderState.draftStartCm,
            pt,
            builderState.plantTemplate.plantSpacingCm,
            {
              label: builderState.plantTemplate.label,
              cropCode: builderState.plantTemplate.cropCode,
              canopyRadiusCm: builderState.plantTemplate.canopyRadiusCm,
            },
          );
          dispatch({ type: 'SET_DRAFT_START', pointCm: null });
        }
      }
    },
    [
      bbox.widthCm,
      bbox.depthCm,
      builderState.activeTool,
      builderState.draftStartCm,
      builderState.pathMaterial,
      builderState.pathWidthCm,
      builderState.plantTemplate,
      layout.paths.length,
      locationId,
      addPathStroke,
      placePlant,
      placePlantLine,
    ],
  );

  const resolveEventPointCm = (
    e: React.MouseEvent<SVGSVGElement, MouseEvent> | React.PointerEvent<SVGSVGElement>,
  ): Point2DCm => {
    const svg = (e.currentTarget.ownerSVGElement || e.currentTarget) as unknown as SVGSVGElement;
    if (svg && typeof svg.createSVGPoint === 'function' && typeof svg.getScreenCTM === 'function') {
      try {
        const ctm = svg.getScreenCTM();
        if (ctm) {
          const pt = svg.createSVGPoint();
          pt.x = e.clientX;
          pt.y = e.clientY;
          const transformed = pt.matrixTransform(ctm.inverse());
          return {
            x: Math.round(transformed.x),
            y: Math.round(transformed.y),
          };
        }
      } catch {
        // Fall back to bounding rect calculation
      }
    }
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;
      return {
        x: Math.round(canvasViewBox.minX + relX * canvasViewBox.width),
        y: Math.round(canvasViewBox.minY + relY * canvasViewBox.height),
      };
    }
    return {
      x: Math.round(e.clientX),
      y: Math.round(e.clientY),
    };
  };

  // Actions for Contextual Popover
  const handleInspectPlant = () => {
    if (!selectedPlant) return;
    if (matchingIndividual) {
      onInspectPlantDetails?.(matchingIndividual.id);
    } else {
      onInspectPlantDetails?.(selectedPlant.id);
    }
  };

  const handleAdvanceBBCH = () => {
    if (matchingIndividual) {
      updateIndividual(matchingIndividual.id, {
        currentBBCH: Math.min(99, (matchingIndividual.currentBBCH || 0) + 10),
      });
    }
    onAdvancePlantBBCH?.(selectedPlant?.id || '');
  };

  const handleRemoveSelectedPlant = () => {
    if (!selectedPlant) return;
    const removedPlant = { ...selectedPlant };
    const removedIndividual = matchingIndividual ? { ...matchingIndividual } : null;

    removePlant(locationId, selectedPlant.id);
    if (matchingIndividual) {
      removeIndividual(matchingIndividual.id);
    }
    onRemovePlantIndividual?.(selectedPlant.id);
    dispatch({ type: 'SELECT_PLANT', plantId: null });

    if (dockMode === 'crop') {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      setUndoToast({ plant: removedPlant, individual: removedIndividual });
      toastTimerRef.current = setTimeout(() => {
        setUndoToast(null);
      }, 6000);
    }
  };

  const handleUndoToastAction = () => {
    if (!undoToast) return;
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    placePlant(locationId, undoToast.plant);
    if (undoToast.individual) {
      useIndividualStore.getState().add(undoToast.individual);
    }
    setUndoToast(null);
  };

  const handleFillSector = (sectorIndex: number) => {
    fillCultivableSector(
      locationId,
      sectorIndex,
      {
        plantSpacingCm: builderState.plantTemplate.plantSpacingCm,
        rowSpacingCm: builderState.plantTemplate.rowSpacingCm,
        marginCm: 20,
      },
      {
        label: builderState.plantTemplate.label,
        cropCode: builderState.plantTemplate.cropCode,
        canopyRadiusCm: builderState.plantTemplate.canopyRadiusCm,
      },
    );
  };

  const handleApplyDimensions = () => {
    const wCm = Math.max(
      100,
      Math.round((parseFloat(customWidthM) || 10) * 100),
    );
    const dCm = Math.max(
      100,
      Math.round((parseFloat(customDepthM) || 6) * 100),
    );
    setBaseBoundary(locationId, createRectPolygon(wCm, dCm));
  };

  const handleInsertVertex = () => {
    let bestEdge = 0;
    let maxLen = -1;
    const n = layout.baseBoundary.length;
    for (let i = 0; i < n; i++) {
      const a = layout.baseBoundary[i];
      const b = layout.baseBoundary[(i + 1) % n];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len > maxLen) {
        maxLen = len;
        bestEdge = i;
      }
    }
    if (maxLen >= 120) {
      const a = layout.baseBoundary[bestEdge];
      const b = layout.baseBoundary[(bestEdge + 1) % n];
      insertBoundaryVertex(locationId, bestEdge, {
        x: Math.round((a.x + b.x) / 2),
        y: Math.round((a.y + b.y) / 2),
      });
    }
  };

  return (
    <div
      data-testid="space-3d-viewer"
      className="relative flex h-full min-h-[580px] w-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-50 shadow-sm"
    >
      {/* ── 1. Top HUD Overlay (Navigation & Analytical Lenses) ── */}
      <div className="pointer-events-none absolute top-3 inset-x-3 z-30 flex items-start justify-between gap-2">
        {/* Top-Left: Nav & Room Dimensions */}
        <SpaceHeaderNav
          locationName={locationName || 'Espacio 1:1'}
          plantCount={layout.placedPlants.length}
          capacity={capacity}
          widthM={bbox.widthCm / 100}
          depthM={bbox.depthCm / 100}
          areaM2={areaM2}
          perimeterM={perimeterM}
          isRectangular={isRectangular}
          vertexCount={layout.baseBoundary.length}
          onBackToCampus={onBackToCampus}
          onApplyDimensions={(w, d) => {
            setCustomWidthM(w.toFixed(1));
            setCustomDepthM(d.toFixed(1));
            setBaseBoundary(
              locationId,
              createRectPolygon(Math.round(w * 100), Math.round(d * 100)),
            );
          }}
          onApplyShapePreset={(shape) => {
            if (shape === 'rect') {
              setBaseBoundary(locationId, createRectPolygon(1000, 600));
            } else {
              setBaseBoundary(locationId, createLShapePolygon(1000, 600, 0.4, 0.45));
            }
          }}
          onScaleParcel={(factor) => scaleBoundary(locationId, factor)}
          onInsertVertex={handleInsertVertex}
        />

        {/* Top-Right: Quick Pills (Nombres, Luz, Lentes) & Solar Panel */}
        <SpaceLensBar
          layout={layout}
          showLabels={showLabels}
          onToggleShowLabels={() => setShowLabels((v) => !v)}
          showRoof={showRoof}
          onToggleShowRoof={() => setShowRoof((v) => !v)}
          hasRoof={Boolean(layout.roofConfig && layout.roofConfig.kind !== 'none')}
          onOpenRoofBuilder={() => dispatch({ type: 'SET_TOOL', tool: 'roof' })}
          activeLens={activeLens}
          onSelectLens={setActiveLens}
          speciesFilter={speciesFilter}
          onSelectSpeciesFilter={setSpeciesFilter}
          availableSpecies={availableSpecies}
          onUpdateSolar={(partial) => updateSolarConfig(locationId, partial)}
          onApplyPreset={(presetId) => applyPreset(locationId, presetId)}
          onFillFirstSector={() => handleFillSector(0)}
          defaultSolarOpen={true}
        />
      </div>

      {/* ── 2. Full-Screen Central Viewport (3D R3F Canvas / 2D Vector CAD Plane) ── */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-50">
        {/* 3D WebGL Canvas Viewport */}
        {webglSupported && viewMode === '3d' && (
          <div className="absolute inset-0 h-full w-full">
            <Canvas
              shadows
              dpr={[1, 1.5]}
              gl={{ antialias: true, powerPreference: 'high-performance' }}
              onPointerMissed={() => {
                if (builderState.activeTool === 'inspect') {
                  dispatch({ type: 'SELECT_PLANT', plantId: null });
                  dispatch({ type: 'SELECT_WALL', wallId: null });
                  dispatch({ type: 'SELECT_VERTEX', vertexIndex: null });
                } else if (builderState.activeTool === 'edit_boundary') {
                  dispatch({ type: 'SELECT_VERTEX', vertexIndex: null });
                  dispatch({ type: 'SELECT_WALL', wallId: null });
                }
              }}
            >
              <color attach="background" args={['#f8fafc']} />
              <OrthographicCamera
                makeDefault
                position={INITIAL_CAMERA_POSITION_3D}
                zoom={42 * (zoomPercent / 100)}
                near={-50}
                far={100}
              />
              <OrbitControls
                ref={orbitControlsRef}
                makeDefault
                enabled={viewMode === '3d' && draggingVertexIndex === null}
                enableRotate={viewMode === '3d' && draggingVertexIndex === null}
                target={[0, 0, 0]}
                maxPolarAngle={Math.PI / 2 - 0.05}
                minPolarAngle={0.05}
                onChange={(e) => {
                  const controls = e?.target;
                  if (controls?.object) {
                    const cam = controls.object;
                    const azRad = Math.atan2(cam.position.x, cam.position.z);
                    const azDeg = Math.round((azRad * 180) / Math.PI);
                    const normDeg = ((azDeg % 360) + 360) % 360;
                    const diff = Math.abs(normDeg - cameraAzimuthDegRef.current);
                    const circularDiff = Math.min(diff, 360 - diff);
                    if (circularDiff >= 15) {
                      cameraAzimuthDegRef.current = normDeg;
                      setCameraAzimuthDeg(normDeg);
                    }
                  }
                }}
              />
              <SpaceSceneGraph
                layout={layout}
                viewMode={viewMode}
                cameraGroundPosCm={cameraGroundPosCm}
                showRoof={showRoof}
                selectedPlantId={builderState.selectedPlantId}
                selectedWallId={builderState.selectedWallId}
                selectedVertexIndex={builderState.selectedVertexIndex}
                isBoundaryEditMode={
                  builderState.activeTool === 'edit_boundary'
                }
                onSelectPlant={handleSelectPlant}
                onSelectWall={handleSelectWall}
                onSelectVertex={handleSelectVertex}
                onStartDragVertex={handleStartDragVertex}
                onInsertVertexAtEdge={handleInsertVertexAtEdge}
                onGroundPointClickCm={handlePlanePointClick}
              />
              {/* Active 3D ground drag capture plane (captures smooth drag across entire ground) */}
              {draggingVertexIndex !== null ? (
                <mesh
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[0, 0, 0]}
                  onPointerMove={(e) => {
                    e.stopPropagation();
                    const xCm = Math.round(e.point.x * 100 + bbox.centerXCm);
                    const yCm = Math.round(e.point.z * 100 + bbox.centerYCm);
                    moveBoundaryVertex(locationId, draggingVertexIndex, { x: xCm, y: yCm }, 10, false);
                    dispatchThrottledCursor({ x: xCm, y: yCm });
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    setDraggingVertexIndex(null);
                    flushSpaceLayoutStorage();
                  }}
                >
                  <planeGeometry args={[200, 200]} />
                  <meshBasicMaterial transparent opacity={0} />
                </mesh>
              ) : (
                <mesh
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[0, 0.001, 0]}
                  onPointerMove={(e) => {
                    e.stopPropagation();
                    const xCm = Math.round(e.point.x * 100 + bbox.centerXCm);
                    const yCm = Math.round(e.point.z * 100 + bbox.centerYCm);
                    dispatchThrottledCursor({ x: xCm, y: yCm });
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const xCm = Math.round(e.point.x * 100 + bbox.centerXCm);
                    const yCm = Math.round(e.point.z * 100 + bbox.centerYCm);
                    handlePlanePointClick({ x: xCm, y: yCm });
                  }}
                >
                  <planeGeometry args={[Math.max(30, (bbox.widthCm / 100) * 2), Math.max(30, (bbox.depthCm / 100) * 2)]} />
                  <meshBasicMaterial transparent opacity={0} />
                </mesh>
              )}
            </Canvas>
          </div>
        )}

        {/* 2D Interactive CAD Plane (only mounted in 2D mode or when webgl is unsupported, e.g. headless tests) */}
        {(viewMode === '2d' || !webglSupported) && (
          <div
            className="absolute inset-0 flex flex-col justify-between p-3 select-none transition-opacity duration-200 opacity-100 z-10 pointer-events-auto"
          >
            {/* Draft metrics indicator */}
            {draftMetrics && (
              <div
                data-testid="draft-path-metrics"
                className="absolute top-16 left-6 z-20 rounded-full border border-amber-300 bg-amber-50/95 px-3 py-1 font-mono text-xs font-bold text-amber-800 shadow-md backdrop-blur-sm"
              >
                Tramo: {draftMetrics.lengthCm} cm · {draftMetrics.angleDeg}°
              </div>
            )}

            {cursorPreview && !draftMetrics && (
              <div className="absolute top-16 left-6 z-20 rounded-full border border-emerald-300 bg-emerald-50/95 px-3 py-1 font-mono text-[11px] font-bold text-emerald-800 shadow-sm backdrop-blur-sm">
                Cursor ({cursorPreview.pointCm.x}, {cursorPreview.pointCm.y} cm) ·{' '}
                {cursorPreview.surface === 'cultivable'
                  ? 'Tierra Cultivable'
                  : 'Vereda/Camino'}
              </div>
            )}

            <svg
              data-testid="interactive-plane-1to1"
              viewBox={`${canvasViewBox.minX} ${canvasViewBox.minY} ${canvasViewBox.width} ${canvasViewBox.height}`}
              className="h-full w-full cursor-crosshair select-none"
              onPointerMove={(e) => {
                lastSvgPointerTimeRef.current = Date.now();
                const pt = resolveEventPointCm(e);
                if (draggingVertexIndex !== null) {
                  moveBoundaryVertex(locationId, draggingVertexIndex, pt, 10, false);
                }
                dispatchThrottledCursor(pt);
              }}
              onMouseMove={(e) => {
                if (Date.now() - lastSvgPointerTimeRef.current < 50) return;
                const pt = resolveEventPointCm(e);
                if (draggingVertexIndex !== null) {
                  moveBoundaryVertex(locationId, draggingVertexIndex, pt, 10, false);
                }
                dispatchThrottledCursor(pt);
              }}
              onPointerUp={() => {
                lastSvgPointerTimeRef.current = Date.now();
                if (draggingVertexIndex !== null) {
                  setDraggingVertexIndex(null);
                  flushSpaceLayoutStorage();
                }
              }}
              onMouseUp={() => {
                if (Date.now() - lastSvgPointerTimeRef.current < 50) return;
                if (draggingVertexIndex !== null) {
                  setDraggingVertexIndex(null);
                  flushSpaceLayoutStorage();
                }
              }}
              onClick={(e) => {
                if (draggingVertexIndex !== null) return;
                const pt = resolveEventPointCm(e);
                handlePlanePointClick(pt);
              }}
            >
            {/* Grid Pattern Definition */}
            <defs>
              <pattern
                id="cad-grid-pattern"
                width={100}
                height={100}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 100 0 L 0 0 0 100"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              </pattern>
            </defs>

            {/* Base Background Grid */}
            <rect
              x={canvasViewBox.minX}
              y={canvasViewBox.minY}
              width={canvasViewBox.width}
              height={canvasViewBox.height}
              fill="url(#cad-grid-pattern)"
            />

            {/* Base boundary */}
            <polygon
              points={polygonToSvgPoints(layout.baseBoundary)}
              fill="#f8fafc"
              stroke="#94a3b8"
              strokeWidth={3}
            />

            {/* Cultivable sectors */}
            {regions.cultivablePolygons.map((poly, idx) => (
              <polygon
                key={`svg-cultivable-${idx}`}
                points={polygonToSvgPoints(poly)}
                fill="#ecfdf5"
                stroke="#16a34a"
                strokeWidth={3}
              />
            ))}

            {/* Welded walkable surface */}
            {regions.walkablePolygons.map((poly, idx) => (
              <polygon
                key={`svg-walkable-${idx}`}
                points={polygonToSvgPoints(poly)}
                fill="#e2e8f0"
                stroke="#cbd5e1"
                strokeWidth={2}
              />
            ))}

            {/* 1:1 Perimeter Walls & Openings on 2D CAD Plane */}
            {layout.walls.map((wall) => {
              const isSelected = builderState.selectedWallId === wall.id;
              const isOpen = wall.heightCm === 0;
              const strokeColor = isSelected
                ? '#0284c7'
                : isOpen
                ? '#94a3b8'
                : wall.material === 'wood_fence'
                ? '#92400e'
                : wall.material === 'wire_fence'
                ? '#64748b'
                : wall.material === 'polycarbonate'
                ? '#38bdf8'
                : '#b45309';

              const dx = wall.end.x - wall.start.x;
              const dy = wall.end.y - wall.start.y;
              const wallLen = Math.hypot(dx, dy);
              const ux = wallLen > 0 ? dx / wallLen : 0;
              const uy = wallLen > 0 ? dy / wallLen : 0;
              const hasOpenings = Boolean(wall.openings && wall.openings.length > 0);

              return (
                <g key={`svg-wall-group-${wall.id}`}>
                  <line
                    data-testid={`wall-segment-${wall.id}`}
                    x1={wall.start.x}
                    y1={wall.start.y}
                    x2={wall.end.x}
                    y2={wall.end.y}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 14 : isOpen ? 5 : 9}
                    strokeDasharray={isOpen ? '10 8' : undefined}
                    strokeLinecap="round"
                    className="cursor-pointer hover:opacity-80 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: 'SELECT_WALL', wallId: wall.id });
                      dispatch({ type: 'SELECT_VERTEX', vertexIndex: null });
                    }}
                  />

                  {/* 2D Architectural CAD Symbols for Doors and Windows */}
                  {hasOpenings &&
                    wall.openings!.map((op) => {
                      const opStartX = wall.start.x + ux * op.offsetCm;
                      const opStartY = wall.start.y + uy * op.offsetCm;
                      const opEndX = wall.start.x + ux * (op.offsetCm + op.widthCm);
                      const opEndY = wall.start.y + uy * (op.offsetCm + op.widthCm);

                      if (op.kind === 'door') {
                        const nx = -uy;
                        const ny = ux;
                        const leafX = opStartX + nx * op.widthCm;
                        const leafY = opStartY + ny * op.widthCm;

                        return (
                          <g key={`svg-op-${op.id}`} className="pointer-events-none">
                            <line
                              x1={opStartX}
                              y1={opStartY}
                              x2={opEndX}
                              y2={opEndY}
                              stroke="#ffffff"
                              strokeWidth={11}
                            />
                            <line
                              x1={opStartX}
                              y1={opStartY}
                              x2={opEndX}
                              y2={opEndY}
                              stroke="#475569"
                              strokeWidth={2}
                            />
                            <line
                              x1={opStartX}
                              y1={opStartY}
                              x2={leafX}
                              y2={leafY}
                              stroke="#b45309"
                              strokeWidth={2.5}
                            />
                          </g>
                        );
                      }

                      return (
                        <g key={`svg-op-${op.id}`} className="pointer-events-none">
                          <line
                            x1={opStartX}
                            y1={opStartY}
                            x2={opEndX}
                            y2={opEndY}
                            stroke="#ffffff"
                            strokeWidth={11}
                          />
                          <line
                            x1={opStartX}
                            y1={opStartY}
                            x2={opEndX}
                            y2={opEndY}
                            stroke="#38bdf8"
                            strokeWidth={4.5}
                          />
                        </g>
                      );
                    })}
                </g>
              );
            })}

            {/* Interactive Wall Splitting Indicator */}
            {edgeInsertionPreview && draggingVertexIndex === null && (
              <g
                data-testid="edge-insertion-indicator"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  insertBoundaryVertex(
                    locationId,
                    edgeInsertionPreview.edgeIndex,
                    edgeInsertionPreview.projectedPoint,
                  );
                }}
              >
                <circle
                  cx={edgeInsertionPreview.projectedPoint.x}
                  cy={edgeInsertionPreview.projectedPoint.y}
                  r={12}
                  fill="#10b981"
                  fillOpacity={0.85}
                  stroke="#ffffff"
                  strokeWidth={2.5}
                />
                <text
                  x={edgeInsertionPreview.projectedPoint.x}
                  y={edgeInsertionPreview.projectedPoint.y + 4}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight="bold"
                  fill="#ffffff"
                  className="pointer-events-none select-none font-sans"
                >
                  +
                </text>
              </g>
            )}

            {/* Draggable Handles for Boundary Vertices (Edit Boundary Tool) */}
            {builderState.activeTool === 'edit_boundary' &&
              layout.baseBoundary.map((pt, idx) => {
                const isSelected = builderState.selectedVertexIndex === idx;
                const isDragging = draggingVertexIndex === idx;
                return (
                  <g key={`vertex-handle-${idx}`}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isDragging ? 14 : isSelected ? 12 : 9}
                      data-testid={`boundary-vertex-${idx}`}
                      fill={isDragging ? '#0284c7' : isSelected ? '#38bdf8' : '#ffffff'}
                      stroke="#0284c7"
                      strokeWidth={3}
                      className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        snapshotHistory(locationId);
                        setDraggingVertexIndex(idx);
                        dispatch({ type: 'SELECT_VERTEX', vertexIndex: idx });
                        dispatch({ type: 'SELECT_WALL', wallId: null });
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: 'SELECT_VERTEX', vertexIndex: idx });
                        dispatch({ type: 'SELECT_WALL', wallId: null });
                      }}
                    />
                    {isSelected && (
                      <text
                        x={pt.x}
                        y={pt.y - 14}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight="bold"
                        fill="#0284c7"
                        className="pointer-events-none select-none font-mono"
                      >
                        {(pt.x / 100).toFixed(1)}, {(pt.y / 100).toFixed(1)}m
                      </text>
                    )}
                  </g>
                );
              })}

            {/* Active draft line */}
            {draftMetrics && (
              <line
                x1={draftMetrics.start.x}
                y1={draftMetrics.start.y}
                x2={draftMetrics.end.x}
                y2={draftMetrics.end.y}
                stroke="#f59e0b"
                strokeWidth={
                  builderState.activeTool === 'draw_path'
                    ? builderState.pathWidthCm
                    : 6
                }
                strokeOpacity={0.8}
                strokeDasharray="15 10"
              />
            )}

            {/* Placed plants 1:1 canopy circles */}
            {layout.placedPlants.map((plant) => {
              const isSelected = builderState.selectedPlantId === plant.id;
              const isDimmed =
                speciesFilter !== null && plant.cropCode !== speciesFilter;
              return (
                <g
                  key={plant.id}
                  data-testid={`plane-plant-${plant.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'SELECT_PLANT', plantId: plant.id });
                  }}
                  className="cursor-pointer transition-opacity"
                  opacity={isDimmed ? 0.25 : 1}
                >
                  <circle
                    cx={plant.xCm}
                    cy={plant.yCm}
                    r={plant.canopyRadiusCm}
                    fill={isSelected ? '#0ea5e9' : '#22c55e'}
                    fillOpacity={0.35}
                    stroke={isSelected ? '#0284c7' : '#16a34a'}
                    strokeWidth={isSelected ? 4 : 2}
                  />
                  <circle
                    cx={plant.xCm}
                    cy={plant.yCm}
                    r={4}
                    fill={isSelected ? '#0284c7' : '#15803d'}
                  />
                  {showLabels && (
                    <text
                      x={plant.xCm}
                      y={plant.yCm - plant.canopyRadiusCm - 6}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight="bold"
                      fill="#0f172a"
                      className="pointer-events-none select-none font-sans"
                    >
                      {plant.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}
      </div>

      {/* ── 3. Floating Contextual Popover for Selected Plant ── */}
      {selectedPlant && (
        <div className="absolute top-20 right-4 z-40">
          <SpacePlantActionBar
            plant={selectedPlant}
            bbchStage={matchingIndividual?.currentBBCH ?? 15}
            neighbors={selectedPlantNeighbors}
            onClose={() => dispatch({ type: 'SELECT_PLANT', plantId: null })}
            onInspectDetails={handleInspectPlant}
            onAdvanceBBCH={handleAdvanceBBCH}
            onMovePlant={() =>
              dispatch({ type: 'SET_TOOL', tool: 'plant_single' })
            }
            onTakeCutting={() => onTakeCutting?.(selectedPlant.id)}
            onRemovePlant={handleRemoveSelectedPlant}
          />
        </div>
      )}

      {/* ── 3.5. Floating Contextual Popover for Selected Wall ── */}
      {selectedWall && (
        <div className="absolute top-20 right-4 z-40">
          <SpaceWallActionBar
            wall={selectedWall}
            onClose={() => dispatch({ type: 'SELECT_WALL', wallId: null })}
            onUpdateHeight={(heightCm) =>
              updateWall(locationId, selectedWall.id, { heightCm })
            }
            onUpdateMaterial={(material) =>
              updateWall(locationId, selectedWall.id, { material })
            }
            onApplyToAllWalls={() => {
              setAllWallsHeight(locationId, selectedWall.heightCm);
              setAllWallsMaterial(locationId, selectedWall.material);
            }}
            onAddDoor={() => {
              const dx = selectedWall.end.x - selectedWall.start.x;
              const dy = selectedWall.end.y - selectedWall.start.y;
              const wallLenCm = Math.round(Math.hypot(dx, dy));
              const door = createDefaultDoorOpening(
                wallLenCm,
                undefined,
                selectedWall.openings,
              );
              addWallOpening(locationId, selectedWall.id, door);
            }}
            onAddWindow={() => {
              const dx = selectedWall.end.x - selectedWall.start.x;
              const dy = selectedWall.end.y - selectedWall.start.y;
              const wallLenCm = Math.round(Math.hypot(dx, dy));
              const win = createDefaultWindowOpening(
                wallLenCm,
                undefined,
                selectedWall.openings,
              );
              addWallOpening(locationId, selectedWall.id, win);
            }}
            onRemoveOpening={(openingId) => {
              removeWallOpening(locationId, selectedWall.id, openingId);
            }}
          />
        </div>
      )}

      {/* ── 3.6. Contextual Builder Shelf for Roof Architecture ── */}
      {builderState.activeTool === 'roof' && (
        <div className="absolute bottom-20 z-40 flex justify-center inset-x-0 px-4 pointer-events-none">
          <SpaceRoofActionBar
            roofConfig={layout.roofConfig}
            showRoof={showRoof}
            onToggleShowRoof={() => setShowRoof((v) => !v)}
            onSelectRoofKind={(kind) => updateRoofConfig(locationId, { kind })}
            onUpdateRoofHeight={(heightCm) => updateRoofConfig(locationId, { heightCm })}
            onUpdateRoofMaterial={(material) => updateRoofConfig(locationId, { material })}
            onToggleGrowLights={(hasGrowLights) => updateRoofConfig(locationId, { hasGrowLights })}
            onClose={() => dispatch({ type: 'SET_TOOL', tool: 'inspect' })}
          />
        </div>
      )}

      {/* ── 4. Bottom Tray Drawer for Seeds and Plants ── */}
      {isTrayOpen && (
        <div className="absolute bottom-20 inset-x-0 z-40 flex justify-center px-4">
          <SpaceBottomDock
            isOpen={isTrayOpen}
            onClose={() => setIsTrayOpen(false)}
            seedLots={activeSeedLots}
            availablePlants={availablePlantsForTray}
            onSelectSeedLotToSow={(_lotId) => {
              if (onOpenSowModal) {
                onOpenSowModal();
              } else {
                dispatch({ type: 'SET_TOOL', tool: 'plant_single' });
              }
              setIsTrayOpen(false);
            }}
            onSelectPlantToPlace={(_indId) => {
              dispatch({ type: 'SET_TOOL', tool: 'plant_single' });
              setIsTrayOpen(false);
            }}
          />
        </div>
      )}

      {/* ── 4.5. Floating Glassmorphism Undo Toast for Cultivo Mode ── */}
      {undoToast && (
        <div className="absolute bottom-20 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
          <div
            data-testid="undo-delete-plant-toast"
            role="status"
            aria-live="polite"
            className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-2.5 text-xs text-slate-800 shadow-2xl backdrop-blur-md"
          >
            <span className="font-medium text-slate-700">
              Planta <strong className="font-semibold text-slate-900">{undoToast.plant.label}</strong> eliminada
            </span>
            <button
              type="button"
              onClick={handleUndoToastAction}
              className="cursor-pointer rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 font-bold text-emerald-800 transition hover:bg-emerald-100 hover:text-emerald-900"
            >
              Deshacer
            </button>
            <button
              type="button"
              aria-label="Cerrar notificación"
              onClick={() => {
                if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                setUndoToast(null);
              }}
              className="ml-1 cursor-pointer text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* ── 5. Bottom HUD Dock & Camera Widget ── */}
      <div className="pointer-events-none absolute bottom-3 inset-x-3 z-30 flex items-end justify-between gap-3">
        {/* Invisible spacer to center the command dock */}
        <div className="w-48 hidden md:block" />

        {/* Bottom-Center Command Dock */}
        <SpaceCommandDock
          mode={dockMode}
          onChangeMode={setDockMode}
          onOpenSowModalOrDrawer={() => {
            if (onOpenSowModal) {
              onOpenSowModal();
            } else {
              setIsTrayOpen(true);
            }
          }}
          isTrayOpen={isTrayOpen}
          onToggleTray={() => setIsTrayOpen((v) => !v)}
          activeTool={builderState.activeTool}
          onChangeTool={(tool) => dispatch({ type: 'SET_TOOL', tool })}
          pathWidthCm={builderState.pathWidthCm}
          onChangePathWidth={(w) =>
            dispatch({ type: 'SET_PATH_WIDTH', widthCm: w })
          }
          pathMaterial={builderState.pathMaterial}
          onChangePathMaterial={(mat) =>
            dispatch({ type: 'SET_PATH_MATERIAL', material: mat })
          }
          paths={layout.paths}
          onRemovePath={(pId) => removePathStroke(locationId, pId)}
          plantCropCode={builderState.plantTemplate.cropCode}
          onChangePlantCropCode={(c) =>
            dispatch({
              type: 'SET_PLANT_PRESET',
              presetKey: c as PlantPresetKey,
            })
          }
          plantSpacingCm={builderState.plantTemplate.plantSpacingCm}
          onChangePlantSpacing={(s) =>
            dispatch({ type: 'SET_PLANT_SPACING', plantSpacingCm: s })
          }
          cultivableSectorCount={regions.cultivablePolygons.length}
          onFillSector={handleFillSector}
          customWidthM={customWidthM}
          setCustomWidthM={setCustomWidthM}
          customDepthM={customDepthM}
          setCustomDepthM={setCustomDepthM}
          onApplyDimensions={handleApplyDimensions}
          onInsertVertex={handleInsertVertex}
          onScaleParcel={(factor) => scaleBoundary(locationId, factor)}
          vertexCount={layout.baseBoundary.length}
          baseMaterial={layout.baseMaterial}
          onChangeBaseMaterial={(mat) => setBaseMaterial(locationId, mat)}
          onSetAllWallsHeight={(h) => setAllWallsHeight(locationId, h)}
          selectedVertexIndex={builderState.selectedVertexIndex}
          onRemoveSelectedVertex={() => {
            if (builderState.selectedVertexIndex !== null) {
              removeBoundaryVertex(locationId, builderState.selectedVertexIndex);
              dispatch({ type: 'SELECT_VERTEX', vertexIndex: null });
            }
          }}
          onSanitizeBoundary={() => sanitizeBoundary(locationId)}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={() => undo(locationId)}
          onRedo={() => redo(locationId)}
        />

        {/* Bottom-Right Camera Widget */}
        <SpaceCameraWidget
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          zoomPercent={zoomPercent}
          onZoomIn={() => setZoomPercent((z) => Math.min(200, z + 15))}
          onZoomOut={() => setZoomPercent((z) => Math.max(30, z - 15))}
          onRotateCamera={handleRotateCamera}
          onResetCameraNorth={handleResetCameraNorth}
          cameraAzimuthDeg={cameraAzimuthDeg}
        />
      </div>
    </div>
  );
};
