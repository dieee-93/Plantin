import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import {
  computeSpaceRegions,
  createRectPolygon,
  type Point2DCm,
  type Polygon2DCm,
} from '@/domain/spaceGeometry';
import { measurePlantNeighbors, type PlacedPlantSpatialCm } from '@/domain/solarAndPlantSpatial';
import type { Individual } from '@/domain/individual';
import { useSpaceLayoutStore } from '@/store/spaceLayoutStore';
import { useIndividualStore } from '@/store/individualStore';
import { useSeedLotStore } from '@/store/seedLotStore';
import { useTaxonStore } from '@/store/taxonStore';
import { SpaceSceneGraph, type SpaceViewMode } from './SpaceSceneGraph';
import { SpaceHeaderNav } from './SpaceHeaderNav';
import { SpaceLensBar, type AnalyticalLensType } from './SpaceLensBar';
import { SpaceCommandDock } from './SpaceCommandDock';
import { SpaceCameraWidget } from './SpaceCameraWidget';
import { SpacePlantActionBar } from './SpacePlantActionBar';
import { SpaceBottomDock } from './SpaceBottomDock';
import {
  computeCursorPlantPreview,
  computeDraftPathMetrics,
  createInitialBuilderState,
  spaceBuilderReducer,
  type PlantPresetKey,
} from './spaceBuilderReducer';

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
  const insertBoundaryVertex = useSpaceLayoutStore(
    (state) => state.insertBoundaryVertex,
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
  const [zoomPercent, setZoomPercent] = useState<number>(75);
  const [showLabels, setShowLabels] = useState<boolean>(true);
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

  useEffect(() => {
    if (builderState.selectedPlantId && !selectedPlant) {
      dispatch({ type: 'SELECT_PLANT', plantId: null });
    }
  }, [builderState.selectedPlantId, selectedPlant]);

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

  const cameraPosition3D = useMemo<[number, number, number]>(() => {
    if (viewMode === '2d') {
      return [0, 14, 0.01];
    }
    const rad = (cameraAzimuthDeg * Math.PI) / 180;
    const horizontalDistM = 9.5;
    return [
      Math.sin(rad) * horizontalDistM,
      8.5,
      Math.cos(rad) * horizontalDistM,
    ];
  }, [viewMode, cameraAzimuthDeg]);

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

  const handlePlanePointClick = (pointCm: Point2DCm) => {
    const pt = {
      x: Math.max(0, Math.min(bbox.widthCm, Math.round(pointCm.x))),
      y: Math.max(0, Math.min(bbox.depthCm, Math.round(pointCm.y))),
    };

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
  };

  const resolveEventPointCm = (
    e: React.MouseEvent<SVGSVGElement, MouseEvent>,
  ): Point2DCm => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;
      return {
        x: Math.round(relX * bbox.widthCm),
        y: Math.round(relY * bbox.depthCm),
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
    const first = layout.baseBoundary[0] ?? { x: 0, y: 0 };
    const second = layout.baseBoundary[1] ?? { x: 200, y: 0 };
    insertBoundaryVertex(locationId, 0, {
      x: Math.round((first.x + second.x) / 2),
      y: Math.round((first.y + second.y) / 2 + 80),
    });
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
          onInsertVertex={handleInsertVertex}
        />

        {/* Top-Right: Quick Pills (Nombres, Luz, Lentes) & Solar Panel */}
        <SpaceLensBar
          layout={layout}
          showLabels={showLabels}
          onToggleShowLabels={() => setShowLabels((v) => !v)}
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
            <Canvas shadows>
              <color attach="background" args={['#f8fafc']} />
              <OrthographicCamera
                makeDefault
                position={cameraPosition3D}
                zoom={42 * (zoomPercent / 100)}
                near={-50}
                far={100}
              />
              <OrbitControls
                makeDefault
                enableRotate={viewMode === '3d'}
                target={[0, 0, 0]}
              />
              <SpaceSceneGraph
                layout={layout}
                viewMode={viewMode}
                cameraGroundPosCm={cameraGroundPosCm}
                selectedPlantId={builderState.selectedPlantId}
                onSelectPlant={(plantId) =>
                  dispatch({ type: 'SELECT_PLANT', plantId })
                }
                onGroundPointClickCm={handlePlanePointClick}
              />
              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.001, 0]}
                onPointerMove={(e) => {
                  e.stopPropagation();
                  const xCm = Math.round(e.point.x * 100 + bbox.centerXCm);
                  const yCm = Math.round(e.point.z * 100 + bbox.centerYCm);
                  dispatch({
                    type: 'MOVE_CURSOR',
                    pointCm: { x: xCm, y: yCm },
                  });
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  const xCm = Math.round(e.point.x * 100 + bbox.centerXCm);
                  const yCm = Math.round(e.point.z * 100 + bbox.centerYCm);
                  handlePlanePointClick({ x: xCm, y: yCm });
                }}
              >
                <planeGeometry args={[bbox.widthCm / 100, bbox.depthCm / 100]} />
                <meshBasicMaterial transparent opacity={0} />
              </mesh>
            </Canvas>
          </div>
        )}

        {/* 2D Interactive CAD Plane (always accessible in DOM for 1:1 precision & headless tests) */}
        <div
          className={`absolute inset-0 flex flex-col justify-between p-3 select-none transition-opacity duration-200 ${
            viewMode === '2d' || !webglSupported
              ? 'opacity-100 z-10 pointer-events-auto'
              : 'opacity-0 -z-10 pointer-events-none'
          }`}
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
            viewBox={`0 0 ${bbox.widthCm} ${bbox.depthCm}`}
            className="h-full w-full cursor-crosshair select-none"
            onMouseMove={(e) => {
              const pt = resolveEventPointCm(e);
              dispatch({ type: 'MOVE_CURSOR', pointCm: pt });
            }}
            onClick={(e) => {
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
              width={bbox.widthCm}
              height={bbox.depthCm}
              fill="url(#cad-grid-pattern)"
            />

            {/* Base boundary */}
            <polygon
              points={polygonToSvgPoints(layout.baseBoundary)}
              fill="#f8fafc"
              stroke="#94a3b8"
              strokeWidth={6}
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
          vertexCount={layout.baseBoundary.length}
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
          onRotateCamera={(delta) =>
            setCameraAzimuthDeg((prev) => (((prev + delta) % 360) + 360) % 360)
          }
          onResetCameraNorth={() => setCameraAzimuthDeg(0)}
          cameraAzimuthDeg={cameraAzimuthDeg}
        />
      </div>
    </div>
  );
};
