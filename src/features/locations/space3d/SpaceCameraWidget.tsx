import React from 'react';
import { Compass, Minus, Plus } from 'lucide-react';
import type { SpaceViewMode } from './SpaceSceneGraph';

export interface SpaceCameraWidgetProps {
  viewMode: SpaceViewMode;
  onChangeViewMode: (mode: SpaceViewMode) => void;
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotateCamera: (deltaDeg: number) => void;
  onResetCameraNorth: () => void;
  cameraAzimuthDeg: number;
}

export const SpaceCameraWidget: React.FC<SpaceCameraWidgetProps> = ({
  viewMode,
  onChangeViewMode,
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onRotateCamera,
  onResetCameraNorth,
  cameraAzimuthDeg,
}) => {
  return (
    <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 p-1.5 shadow-lg backdrop-blur-md text-xs">
      {/* 3D / 2D Switcher */}
      <div className="flex items-center rounded-full bg-slate-100 p-0.5">
        <button
          type="button"
          onClick={() => onChangeViewMode('2d')}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
            viewMode === '2d'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Plano 2D (CAD)"
        >
          <span>📐 2D</span>
          <span className="sr-only">Plano 2D (CAD)</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeViewMode('3d')}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
            viewMode === '3d'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Vista 3D Isométrica"
        >
          <span>🎲 3D</span>
          <span className="sr-only">Vista 3D Isométrica</span>
        </button>
      </div>

      <div className="h-4 w-px bg-slate-200" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Disminuir zoom"
          onClick={onZoomOut}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
          title="Disminuir zoom"
        >
          <Minus size={12} />
        </button>
        <span className="min-w-9 text-center font-mono text-[11px] font-bold text-slate-700">
          {Math.round(zoomPercent)}%
        </span>
        <button
          type="button"
          aria-label="Aumentar zoom"
          onClick={onZoomIn}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
          title="Aumentar zoom"
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="h-4 w-px bg-slate-200" />

      {/* Camera Rotation */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onRotateCamera(-45)}
          className="rounded-full bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
          title="Girar cámara -45°"
        >
          -45°
        </button>
        <button
          type="button"
          onClick={onResetCameraNorth}
          className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
          title={`Azimut cámara: ${cameraAzimuthDeg}°`}
        >
          <Compass size={12} />
          <span>Norte</span>
        </button>
        <button
          type="button"
          onClick={() => onRotateCamera(45)}
          className="rounded-full bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
          title="Girar cámara +45°"
        >
          +45°
        </button>
      </div>
    </div>
  );
};
