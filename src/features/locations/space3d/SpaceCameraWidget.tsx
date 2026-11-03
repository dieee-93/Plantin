import React from 'react';
import { Compass, Focus, Minus, Plus } from 'lucide-react';
import { HudTooltip } from '@/components/hud';
import type { SpaceViewMode } from './SpaceSceneGraph';

export interface SpaceCameraWidgetProps {
  viewMode: SpaceViewMode;
  onChangeViewMode: (mode: SpaceViewMode) => void;
  zoomPercent: number;
  minZoomPercent?: number;
  maxZoomPercent?: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotateCamera: (deltaDeg: number) => void;
  onResetCameraNorth: () => void;
  cameraAzimuthDeg: number;
  onFitToBounds?: () => void;
}

export const MIN_SPACE_ZOOM_PERCENT = 50;
export const MAX_SPACE_ZOOM_PERCENT = 200;

export const SpaceCameraWidget: React.FC<SpaceCameraWidgetProps> = ({
  viewMode,
  onChangeViewMode,
  zoomPercent,
  minZoomPercent = MIN_SPACE_ZOOM_PERCENT,
  maxZoomPercent = MAX_SPACE_ZOOM_PERCENT,
  onZoomIn,
  onZoomOut,
  onRotateCamera,
  onResetCameraNorth,
  cameraAzimuthDeg,
  onFitToBounds,
}) => {
  const isMinZoom = zoomPercent <= minZoomPercent;
  const isMaxZoom = zoomPercent >= maxZoomPercent;
  return (
    <div className="pointer-events-auto flex h-9 max-h-9 items-center gap-1 rounded-full border border-slate-200/80 bg-white/90 px-2 py-0.5 shadow-lg backdrop-blur-md text-xs">
      {/* 3D / 2D Switcher */}
      <div className="flex h-7 items-center rounded-full bg-slate-100 p-0.5">
        <HudTooltip title="Plano 2D (CAD)" side="top">
          <button
            type="button"
            aria-label="Plano 2D (CAD)"
            onClick={() => onChangeViewMode('2d')}
            className={`flex h-6 items-center px-2 text-[11px] font-semibold rounded-full transition cursor-pointer ${
              viewMode === '2d'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📐 2D</span>
          </button>
        </HudTooltip>
        <HudTooltip title="Vista 3D Isométrica" side="top">
          <button
            type="button"
            aria-label="Vista 3D Isométrica"
            onClick={() => onChangeViewMode('3d')}
            className={`flex h-6 items-center px-2 text-[11px] font-semibold rounded-full transition cursor-pointer ${
              viewMode === '3d'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🎲 3D</span>
          </button>
        </HudTooltip>
      </div>

      <div className="h-4 w-px bg-slate-200/80 mx-0.5" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <HudTooltip
          title={isMinZoom ? `Zoom mínimo alcanzado (${minZoomPercent}%)` : 'Disminuir zoom'}
          side="top"
        >
          <button
            type="button"
            aria-label="Disminuir zoom"
            onClick={onZoomOut}
            disabled={isMinZoom}
            className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
              isMinZoom
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'
            }`}
          >
            <Minus size={11} />
          </button>
        </HudTooltip>

        <span className="min-w-7 text-center font-mono text-[10px] font-bold text-slate-700">
          {Math.round(zoomPercent)}%
        </span>

        <HudTooltip
          title={isMaxZoom ? `Zoom máximo alcanzado (${maxZoomPercent}%)` : 'Aumentar zoom'}
          side="top"
        >
          <button
            type="button"
            aria-label="Aumentar zoom"
            onClick={onZoomIn}
            disabled={isMaxZoom}
            className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
              isMaxZoom
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'
            }`}
          >
            <Plus size={11} />
          </button>
        </HudTooltip>
      </div>

      <div className="h-4 w-px bg-slate-200/80 mx-0.5" />

      {/* Camera Rotation */}
      <div className="flex items-center gap-1">
        <HudTooltip title="Girar cámara -45°" side="top">
          <button
            type="button"
            aria-label="-45°"
            onClick={() => onRotateCamera(-45)}
            className="h-6 rounded-full bg-slate-100 px-1.5 font-mono text-[10px] font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            -45°
          </button>
        </HudTooltip>

        <HudTooltip title={`Azimut cámara: ${cameraAzimuthDeg}° (Restablecer Norte)`} side="top">
          <button
            type="button"
            aria-label="Norte"
            onClick={onResetCameraNorth}
            className="flex h-6 items-center gap-1 rounded-full bg-slate-100 px-2 text-[10px] font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <Compass size={11} />
            <span>Norte</span>
          </button>
        </HudTooltip>

        <HudTooltip title="Girar cámara +45°" side="top">
          <button
            type="button"
            aria-label="+45°"
            onClick={() => onRotateCamera(45)}
            className="h-6 rounded-full bg-slate-100 px-1.5 font-mono text-[10px] font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            +45°
          </button>
        </HudTooltip>
      </div>

      {/* Optional Fit to Bounds action */}
      {onFitToBounds && (
        <>
          <div className="h-4 w-px bg-slate-200/80 mx-0.5" />
          <HudTooltip title="Encuadrar parcela (Fit to bounds)" side="top">
            <button
              type="button"
              aria-label="Encuadrar parcela"
              onClick={onFitToBounds}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              <Focus size={12} />
            </button>
          </HudTooltip>
        </>
      )}
    </div>
  );
};
