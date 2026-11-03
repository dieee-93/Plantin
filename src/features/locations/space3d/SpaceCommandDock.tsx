import React, { useCallback, useEffect, useState } from 'react';
import {
  BrickWall,
  ChevronUp,
  Grid3x3,
  Home,
  MousePointer2,
  Plus,
  Redo2,
  Route,
  Rows3,
  Spline,
  Sprout,
  Undo2,
  Wrench,
} from 'lucide-react';
import type { FloorMaterialType } from '@/domain/spaceGeometry';
import type { SpaceBuilderTool } from './spaceBuilderReducer';
import {
  HudRail,
  HudRailButton,
  HudRailDivider,
  HudStatusLine,
  HudTooltip,
} from '@/components/hud';

export interface SpaceCommandDockProps {
  mode: 'crop' | 'design';
  onChangeMode: (mode: 'crop' | 'design') => void;
  onOpenSowModalOrDrawer: () => void;
  isTrayOpen: boolean;
  onToggleTray: () => void;
  activeTool: SpaceBuilderTool;
  onChangeTool: (tool: SpaceBuilderTool) => void;
  pathWidthCm: number;
  onChangePathWidth: (widthCm: number) => void;
  pathMaterial: FloorMaterialType;
  onChangePathMaterial: (mat: FloorMaterialType) => void;
  paths: Array<{ id: string; label?: string; widthCm: number }>;
  onRemovePath: (pathId: string) => void;
  plantCropCode: string;
  onChangePlantCropCode: (cropCode: string) => void;
  plantSpacingCm: number;
  onChangePlantSpacing: (spacingCm: number) => void;
  cultivableSectorCount: number;
  onFillSector: (sectorIndex: number) => void;
  customWidthM: string;
  setCustomWidthM: (v: string) => void;
  customDepthM: string;
  setCustomDepthM: (v: string) => void;
  onApplyDimensions: () => void;
  onInsertVertex: () => void;
  onScaleParcel?: (factor: number) => void;
  vertexCount: number;
  baseMaterial?: FloorMaterialType;
  onChangeBaseMaterial?: (mat: FloorMaterialType) => void;
  onSetAllWallsHeight?: (heightCm: number) => void;
  selectedVertexIndex?: number | null;
  onRemoveSelectedVertex?: () => void;
  onSanitizeBoundary?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

interface ToolItemConfig {
  tool: SpaceBuilderTool;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  shortcut?: string;
}

const BASE_TOOL_ITEMS: ToolItemConfig[] = [
  {
    tool: 'inspect',
    label: 'Inspeccionar',
    icon: MousePointer2,
    description: 'Selecciona e inspecciona plantas, muros y cotas',
    shortcut: 'I',
  },
  {
    tool: 'draw_path',
    label: 'Trazar Camino',
    icon: Route,
    description: 'Diseña senderos y vías de circulación 1:1',
    shortcut: 'C',
  },
  {
    tool: 'walls',
    label: 'Muros',
    icon: BrickWall,
    description: 'Cerramientos perimetrales, medianeras y aberturas',
    shortcut: 'M',
  },
  {
    tool: 'roof',
    label: 'Techo',
    icon: Home,
    description: 'Cubiertas de invernadero, pérgolas y techos',
    shortcut: 'T',
  },
  {
    tool: 'edit_boundary',
    label: 'Editar Contorno',
    icon: Spline,
    description: 'Edita vértices, cotas y sustrato del terreno',
    shortcut: 'E',
  },
];

const PLANT_SUBTOOLS: ToolItemConfig[] = [
  {
    tool: 'plant_single',
    label: 'Plantar Individual',
    icon: Sprout,
    description: 'Siembra manual de una planta individual',
    shortcut: 'P',
  },
  {
    tool: 'plant_line',
    label: 'Surco/Fila',
    icon: Rows3,
    description: 'Traza una hilera o surco lineal de cultivo',
    shortcut: 'F',
  },
  {
    tool: 'plant_fill_sector',
    label: 'Rellenar Sector',
    icon: Grid3x3,
    description: 'Siembra masiva densa en sector cultivable',
    shortcut: 'R',
  },
];

const PATH_WIDTH_OPTIONS_CM = [60, 80, 100, 120];

export const SpaceCommandDock: React.FC<SpaceCommandDockProps> = ({
  mode,
  onChangeMode,
  onOpenSowModalOrDrawer,
  isTrayOpen,
  onToggleTray,
  activeTool,
  onChangeTool,
  pathWidthCm,
  onChangePathWidth,
  pathMaterial: _pathMaterial,
  onChangePathMaterial: _onChangePathMaterial,
  paths,
  onRemovePath: _onRemovePath,
  plantCropCode,
  onChangePlantCropCode: _onChangePlantCropCode,
  plantSpacingCm,
  onChangePlantSpacing: _onChangePlantSpacing,
  cultivableSectorCount: _cultivableSectorCount,
  onFillSector: _onFillSector,
  customWidthM: _customWidthM,
  setCustomWidthM: _setCustomWidthM,
  customDepthM: _customDepthM,
  setCustomDepthM: _setCustomDepthM,
  onApplyDimensions: _onApplyDimensions,
  onInsertVertex: _onInsertVertex,
  onScaleParcel: _onScaleParcel,
  vertexCount,
  baseMaterial: _baseMaterial,
  onChangeBaseMaterial: _onChangeBaseMaterial,
  onSetAllWallsHeight,
  selectedVertexIndex: _selectedVertexIndex,
  onRemoveSelectedVertex: _onRemoveSelectedVertex,
  onSanitizeBoundary: _onSanitizeBoundary,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
  const isPlantActive =
    activeTool === 'plant_single' ||
    activeTool === 'plant_line' ||
    activeTool === 'plant_fill_sector';

  const [isPlantSubmenuOpen, setIsPlantSubmenuOpen] = useState(false);
  const [lastPlantTool, setLastPlantTool] = useState<SpaceBuilderTool>('plant_single');
  const [prevActiveTool, setPrevActiveTool] = useState(activeTool);
  const [isStatusVisible, setIsStatusVisible] = useState(true);

  // Transient onboarding hints next to rail icons for ~4 seconds on first visit
  const [showRailHints, setShowRailHints] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const alreadyShown = localStorage.getItem('plantin_hud_rail_hints_shown');
      if (alreadyShown === 'true') return false;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return !prefersReducedMotion;
    } catch {
      return false;
    }
  });

  const dismissRailHints = useCallback(() => {
    setShowRailHints(false);
    try {
      localStorage.setItem('plantin_hud_rail_hints_shown', 'true');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!showRailHints) return;
    const timer = setTimeout(() => {
      dismissRailHints();
    }, 4000);
    return () => clearTimeout(timer);
  }, [showRailHints, dismissRailHints]);

  if (prevActiveTool !== activeTool) {
    setPrevActiveTool(activeTool);
    setIsStatusVisible(true);
    if (isPlantActive) {
      setLastPlantTool(activeTool);
    }
  }

  // Auto-hide HudStatusLine after 6s of no tool change
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsStatusVisible(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeTool]);

  const activePlantSubtool =
    PLANT_SUBTOOLS.find((p) => p.tool === (isPlantActive ? activeTool : lastPlantTool)) ??
    PLANT_SUBTOOLS[0];
  const PlantActiveIcon = activePlantSubtool.icon;

  const isSubmenuVisible = isPlantSubmenuOpen || isPlantActive;

  const renderStatusLineContent = () => {
    switch (activeTool) {
      case 'draw_path':
        return {
          icon: <Route size={14} className="text-emerald-600" />,
          tag: 'Camino',
          message: `${paths.length} tramos definidos · Clic en dos puntos para trazar`,
          actions: (
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-slate-500">Ancho:</span>
              {PATH_WIDTH_OPTIONS_CM.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onChangePathWidth(w)}
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold transition cursor-pointer ${
                    pathWidthCm === w
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {w} cm
                </button>
              ))}
            </div>
          ),
        };

      case 'walls':
        return {
          icon: <BrickWall size={14} className="text-emerald-600" />,
          tag: 'Muros',
          message: 'Cerramiento perimetral:',
          actions: onSetAllWallsHeight && (
            <div className="flex items-center gap-1">
              {[
                { label: '0m (Abierto)', h: 0 },
                { label: '1.2m (Cerco)', h: 120 },
                { label: '2.0m (Medianera)', h: 200 },
                { label: '2.5m (Pared)', h: 250 },
              ].map((p) => (
                <button
                  key={p.h}
                  type="button"
                  onClick={() => onSetAllWallsHeight(p.h)}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          ),
        };

      case 'roof':
        return {
          icon: <Home size={14} className="text-emerald-600" />,
          tag: 'Cubierta',
          message: 'Configuración de cubierta y pérgolas en panel superior',
        };

      case 'edit_boundary':
        return {
          icon: <Spline size={14} className="text-emerald-600" />,
          tag: 'Terreno',
          message: `${vertexCount} esquinas · Arrastra vértices para modelar el perímetro`,
        };

      case 'plant_single':
        return {
          icon: <Sprout size={14} className="text-emerald-600" />,
          tag: 'Siembra',
          message: `${plantCropCode} · Marco ${plantSpacingCm} cm · Clic en el suelo para plantar`,
        };

      case 'plant_line':
        return {
          icon: <Rows3 size={14} className="text-emerald-600" />,
          tag: 'Surco',
          message: `${plantCropCode} · Clic y arrastra para trazar hilera de cultivo`,
        };

      case 'plant_fill_sector':
        return {
          icon: <Grid3x3 size={14} className="text-emerald-600" />,
          tag: 'Sector',
          message: `${plantCropCode} · Siembra masiva por sector cultivable`,
        };

      case 'inspect':
      default:
        return {
          icon: <MousePointer2 size={14} className="text-emerald-600" />,
          tag: 'Inspección',
          message: 'Haz clic en plantas o elementos del plano para ver sus propiedades',
        };
    }
  };

  const statusConfig = renderStatusLineContent();

  return (
    <>
      {/* ── Left HUD Rail for Design Mode (Planet Zoo / Cities Skylines 2 Style) ── */}
      {mode === 'design' && (
        <div
          data-testid="hud-left-rail"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 z-30 pointer-events-auto flex flex-col items-center"
          onMouseEnter={dismissRailHints}
          onClick={dismissRailHints}
        >
          <HudRail orientation="vertical" className="shadow-2xl">
            {/* Base tools */}
            {BASE_TOOL_ITEMS.map(({ tool, label, icon: Icon, description, shortcut }) => (
              <div key={tool} className="relative flex items-center">
                <HudRailButton
                  icon={<Icon size={20} />}
                  title={label}
                  aria-label={label}
                  description={description}
                  shortcut={shortcut}
                  isActive={activeTool === tool}
                  variant="solid"
                  onClick={() => {
                    onChangeTool(tool);
                    setIsPlantSubmenuOpen(false);
                  }}
                />
                {showRailHints && (
                  <span className="pointer-events-none absolute left-full ml-2 z-40 whitespace-nowrap rounded-md bg-slate-900/85 px-2 py-0.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-xs transition-opacity duration-300">
                    {label}
                  </span>
                )}
              </div>
            ))}

            {/* Plant Group Button with Corner Submenu Indicator */}
            <div className="relative flex items-center">
              <HudRailButton
                icon={<PlantActiveIcon size={20} />}
                title="Plantar"
                aria-label="Plantar"
                description={`Herramientas de siembra (Activa: ${activePlantSubtool.label})`}
                shortcut={activePlantSubtool.shortcut}
                isActive={isPlantActive}
                variant="solid"
                onClick={() => {
                  setIsPlantSubmenuOpen((prev) => !prev);
                  if (!isPlantActive) {
                    onChangeTool(lastPlantTool);
                  }
                }}
              />
              <span className="pointer-events-none absolute bottom-1 right-1 flex h-2 w-2 items-center justify-center font-mono text-[8px] text-slate-400">
                ▾
              </span>
              {showRailHints && (
                <span className="pointer-events-none absolute left-full ml-2 z-40 whitespace-nowrap rounded-md bg-slate-900/85 px-2 py-0.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-xs transition-opacity duration-300">
                  Plantar
                </span>
              )}

              {/* Horizontal Mini-Flyout Submenu for Plant Tools */}
              {isSubmenuVisible && (
                <div
                  data-testid="plant-tools-submenu"
                  className="absolute left-full top-0 ml-2 z-40 flex items-center"
                >
                  <HudRail orientation="horizontal" className="shadow-2xl">
                    {PLANT_SUBTOOLS.map(
                      ({ tool, label, icon: SubIcon, description, shortcut }) => (
                        <HudRailButton
                          key={tool}
                          icon={<SubIcon size={18} />}
                          title={label}
                          aria-label={label}
                          description={description}
                          shortcut={shortcut}
                          isActive={activeTool === tool}
                          variant="solid"
                          onClick={() => {
                            onChangeTool(tool);
                            setLastPlantTool(tool);
                          }}
                        />
                      ),
                    )}
                  </HudRail>
                </div>
              )}
            </div>

            <HudRailDivider orientation="vertical" />

            <div className="relative flex items-center">
              <HudRailButton
                icon={<Undo2 size={18} />}
                title="Deshacer"
                description="Deshacer la última acción (Ctrl+Z)"
                shortcut="Ctrl+Z"
                aria-label="Deshacer (Undo)"
                disabled={!canUndo}
                onClick={onUndo}
              />
              {showRailHints && (
                <span className="pointer-events-none absolute left-full ml-2 z-40 whitespace-nowrap rounded-md bg-slate-900/85 px-2 py-0.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-xs transition-opacity duration-300">
                  Deshacer
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <HudRailButton
                icon={<Redo2 size={18} />}
                title="Rehacer"
                description="Rehacer la última acción deshecha (Ctrl+Y)"
                shortcut="Ctrl+Y"
                aria-label="Rehacer (Redo)"
                disabled={!canRedo}
                onClick={onRedo}
              />
              {showRailHints && (
                <span className="pointer-events-none absolute left-full ml-2 z-40 whitespace-nowrap rounded-md bg-slate-900/85 px-2 py-0.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-xs transition-opacity duration-300">
                  Rehacer
                </span>
              )}
            </div>
          </HudRail>
        </div>
      )}

      {/* ── Bottom HUD Dock (Fine Status Line & Mode Toggle) ── */}
      <div className="absolute bottom-3 inset-x-0 pointer-events-none flex flex-col items-center gap-1 z-30">
        {mode === 'design' && (
          <div
            onMouseEnter={() => setIsStatusVisible(true)}
            className={`pointer-events-auto max-w-xl w-full transition-all duration-300 motion-reduce:transition-none ${
              isStatusVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-1 pointer-events-none'
            }`}
          >
            <HudStatusLine
              icon={statusConfig.icon}
              tag={statusConfig.tag}
              message={statusConfig.message}
              actions={statusConfig.actions}
              className="text-[11px] py-0.5 px-3 min-h-[28px] justify-between shadow-md"
            />
          </div>
        )}

        {/* Main Glassmorphism Command Dock (Height ≤ 44px) */}
        <div className="pointer-events-auto flex h-10 max-h-10 items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-2.5 py-1 shadow-xl backdrop-blur-md">
          {/* Segmented Mode Toggle */}
          <div className="flex h-7 items-center rounded-full bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => onChangeMode('crop')}
              className={`flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold transition cursor-pointer ${
                mode === 'crop'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sprout size={12} />
              <span>🌱 Cultivo</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeMode('design')}
              className={`flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold transition cursor-pointer ${
                mode === 'design'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench size={12} />
              <span>📐 Diseñar</span>
            </button>
          </div>

          {/* Primary + Sembrar Button */}
          <button
            type="button"
            onClick={onOpenSowModalOrDrawer}
            className="flex h-7 items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 cursor-pointer"
          >
            <Plus size={13} />
            <span>+ Sembrar</span>
          </button>

          {/* Tray Toggle Button as Icon with Tooltip */}
          <HudTooltip
            title="Bandeja"
            description="Bandeja inferior de semillas y plantas"
            side="top"
          >
            <button
              type="button"
              aria-label="Bandeja"
              aria-pressed={isTrayOpen}
              onClick={onToggleTray}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition cursor-pointer ${
                isTrayOpen
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="Abrir bandeja inferior de semillas y plantas"
            >
              <ChevronUp size={13} className={`transition ${isTrayOpen ? 'rotate-180' : ''}`} />
              <span className="sr-only">Bandeja</span>
            </button>
          </HudTooltip>
        </div>
      </div>
    </>
  );
};
