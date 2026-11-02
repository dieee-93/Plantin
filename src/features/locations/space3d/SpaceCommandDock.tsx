import React from 'react';
import { ChevronUp, Plus, Redo2, Sprout, Undo2, Wrench } from 'lucide-react';
import type { FloorMaterialType } from '@/domain/spaceGeometry';
import type { SpaceBuilderTool } from './spaceBuilderReducer';

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

const TOOL_BUTTONS: Array<{ tool: SpaceBuilderTool; label: string }> = [
  { tool: 'inspect', label: 'Inspeccionar' },
  { tool: 'draw_path', label: 'Trazar Camino' },
  { tool: 'walls', label: 'Muros' },
  { tool: 'roof', label: 'Techo' },
  { tool: 'edit_boundary', label: 'Editar Contorno' },
  { tool: 'plant_single', label: 'Plantar Individual' },
  { tool: 'plant_line', label: 'Surco/Fila' },
  { tool: 'plant_fill_sector', label: 'Rellenar Sector' },
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
  return (
    <div className="pointer-events-auto flex flex-col items-center gap-2">
      {/* Sub-bar for Design Mode */}
      {mode === 'design' && (
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-xl backdrop-blur-md text-xs">
          {/* Tool selector pills and Undo/Redo */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              <span className="mr-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Herramientas 1:1
              </span>
              {TOOL_BUTTONS.map(({ tool, label }) => (
                <button
                  key={tool}
                  type="button"
                  onClick={() => onChangeTool(tool)}
                  className={`rounded-full px-3 py-1 font-semibold transition ${
                    activeTool === tool
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
              <button
                type="button"
                aria-label="Deshacer (Undo)"
                disabled={!canUndo}
                onClick={onUndo}
                title="Deshacer (Ctrl+Z)"
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold transition ${
                  canUndo
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'
                    : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                }`}
              >
                <Undo2 size={13} />
                <span>Deshacer</span>
              </button>
              <button
                type="button"
                aria-label="Rehacer (Redo)"
                disabled={!canRedo}
                onClick={onRedo}
                title="Rehacer (Ctrl+Y / Ctrl+Shift+Z)"
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold transition ${
                  canRedo
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'
                    : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                }`}
              >
                <Redo2 size={13} />
                <span>Rehacer</span>
              </button>
            </div>
          </div>

          {/* Contextual Options for Path Tool */}
          {activeTool === 'draw_path' && (
            <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-1.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>🛣️ Trazar Caminos & Senderos</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    ({paths.length} tramos · Selección visual en el panel superior)
                  </span>
                </span>
                <div className="flex items-center gap-1">
                  {PATH_WIDTH_OPTIONS_CM.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => onChangePathWidth(w)}
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold transition ${
                        pathWidthCm === w
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {w} cm
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Contextual Options for Roof Tool */}
          {activeTool === 'roof' && (
            <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-1.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>🏠 Configuración de Cubierta</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    (Selecciona estilo arquitectónico en el panel superior)
                  </span>
                </span>
                <span className="text-[11px] text-emerald-600 font-medium italic">
                  💡 Invernadero, Pérgola Media-Sombra, Losa Indoor o Cielo Abierto
                </span>
              </div>
            </div>
          )}

          {/* Contextual Options for Walls Tool */}
          {activeTool === 'walls' && (
            <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-1.5 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-700">Cerramiento perimetral:</span>
                {onSetAllWallsHeight && (
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
                        className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}

                <span className="ml-auto text-[11px] text-slate-500 italic">
                  💡 Haz clic en cualquier pared en el plano para ajustarla o añadir aberturas
                </span>
              </div>
            </div>
          )}

          {/* Contextual Options for Boundary & Terrain Tool */}
          {activeTool === 'edit_boundary' && (
            <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-1.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>📐 Terreno & Pavimentos</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    ({vertexCount} esquinas · Cotas, sustratos y presets en el panel superior)
                  </span>
                </span>
                <span className="text-[11px] text-emerald-600 font-medium italic">
                  💡 Arrastra los vértices azules en el plano 3D para modelar formas libres
                </span>
              </div>
            </div>
          )}

          {/* Contextual Options for Planting Tools */}
          {(activeTool === 'plant_single' ||
            activeTool === 'plant_line' ||
            activeTool === 'plant_fill_sector') && (
            <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-1.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>🌱 Siembra & Cultivo</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    ({plantCropCode} · Marco {plantSpacingCm} cm)
                  </span>
                </span>
                <span className="text-[11px] text-emerald-600 font-medium italic">
                  💡 Ajusta especies botánicas y marco de plantación en la bandeja superior
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Glassmorphism Command Dock */}
      <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 p-1.5 shadow-xl backdrop-blur-md">
        {/* Segmented Mode Toggle */}
        <div className="flex items-center rounded-full bg-slate-100 p-0.5">
          <button
            type="button"
            onClick={() => onChangeMode('crop')}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              mode === 'crop'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sprout size={13} />
            <span>🌱 Cultivo</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('design')}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              mode === 'design'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench size={13} />
            <span>📐 Diseñar</span>
          </button>
        </div>

        {/* Primary + Sembrar Button */}
        <button
          type="button"
          onClick={onOpenSowModalOrDrawer}
          className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-95"
        >
          <Plus size={14} />
          <span>+ Sembrar</span>
        </button>

        {/* Tray Toggle Button */}
        <button
          type="button"
          onClick={onToggleTray}
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            isTrayOpen
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          title="Abrir bandeja inferior de semillas y plantas"
        >
          <span>Bandeja</span>
          <ChevronUp size={13} className={`transition ${isTrayOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
};
