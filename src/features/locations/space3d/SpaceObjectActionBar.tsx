import React from 'react';
import {
  Box,
  Copy,
  Layers,
  RotateCw,
  Trash2,
  X,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import type { PlacedObjectSpatialCm } from '@/store/spaceLayoutStore';
import { getObjectDimensionsCm } from './objectsCatalog';

export interface SpaceObjectActionBarProps {
  object: PlacedObjectSpatialCm;
  onClose: () => void;
  onRotate: (nextDeg: number) => void;
  onUpdateElevation: (elevationM: number) => void;
  onRemove: () => void;
  onDuplicate?: () => void;
  isValidPlacement?: boolean;
}

const ELEVATION_PRESETS = [
  { label: 'Suelo 0 cm', elevationM: 0 },
  { label: 'Palet 21 cm', elevationM: 0.21 },
  { label: 'Rack 50 cm', elevationM: 0.5 },
  { label: 'Mesa 93 cm', elevationM: 0.93 },
];

export const SpaceObjectActionBar: React.FC<SpaceObjectActionBarProps> = ({
  object,
  onClose,
  onRotate,
  onUpdateElevation,
  onRemove,
  onDuplicate,
  isValidPlacement = true,
}) => {
  const currentDeg = object.rotationDeg ?? 0;
  const currentElevationM = object.elevationM ?? 0;
  const dims = getObjectDimensionsCm(object.assetId, object.category);
  const widthCm = object.widthCm ?? dims.widthCm;
  const depthCm = object.depthCm ?? dims.depthCm;
  const heightCm = object.heightCm ?? dims.heightCm;

  const handleStepElevation = (deltaM: number) => {
    const nextM = Math.max(0, Math.round((currentElevationM + deltaM) * 100) / 100);
    onUpdateElevation(nextM);
  };

  return (
    <div
      data-testid="selected-object-action-bar"
      className="pointer-events-auto flex flex-col gap-2 rounded-2xl border border-sky-300/80 bg-white/95 p-3 text-xs shadow-2xl backdrop-blur-md min-w-[300px] max-w-[360px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <Box size={16} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 leading-tight">
              {object.label}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              {object.category}
            </span>
          </div>
        </div>
        <button
          type="button"
          aria-label="Cerrar popover"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <X size={14} />
        </button>
      </div>

      {/* Metrics & Dimensions */}
      <div className="flex flex-col gap-1 rounded-xl bg-slate-50/80 p-2 font-mono text-[11px] text-slate-700 border border-slate-200/60">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-sans">Dimensiones:</span>
          <span className="font-bold text-slate-900">
            {widthCm} × {depthCm} × {heightCm} cm
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-sans">Ubicación CAD:</span>
          <span>
            Coord: ({object.xCm}, {object.yCm} cm)
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-sans">Elevación actual:</span>
          <span className="font-bold text-sky-700">
            {Math.round(currentElevationM * 100)} cm ({currentElevationM.toFixed(2)} m)
          </span>
        </div>
      </div>

      {/* Rotation Control */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
        <div className="flex items-center gap-1.5 text-slate-600">
          <RotateCw size={13} className="text-slate-400" />
          <span className="font-medium text-[11px]">Rotación:</span>
          <span className="font-mono font-bold text-slate-800">{currentDeg}°</span>
        </div>
        <button
          type="button"
          aria-label="Girar +90°"
          onClick={() => onRotate((currentDeg + 90) % 360)}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs"
        >
          <RotateCw size={12} />
          <span>Girar +90°</span>
        </button>
      </div>

      {/* Elevation Presets & Steppers */}
      <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Layers size={13} className="text-slate-400" />
            <span className="font-medium text-[11px]">Altura / Elevación:</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="-5 cm"
              onClick={() => handleStepElevation(-0.05)}
              className="flex h-5 w-6 items-center justify-center rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-[10px] font-mono font-bold"
              title="Bajar 5 cm"
            >
              <ArrowDown size={10} />
            </button>
            <button
              type="button"
              aria-label="+5 cm"
              onClick={() => handleStepElevation(+0.05)}
              className="flex h-5 w-6 items-center justify-center rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-[10px] font-mono font-bold"
              title="Subir 5 cm"
            >
              <ArrowUp size={10} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1">
          {ELEVATION_PRESETS.map((preset) => {
            const isActive = Math.abs(currentElevationM - preset.elevationM) < 0.01;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onUpdateElevation(preset.elevationM)}
                className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition text-center border ${
                  isActive
                    ? 'border-sky-500 bg-sky-50 text-sky-800 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {!isValidPlacement && (
        <div className="rounded-lg bg-red-50 p-1.5 text-[11px] text-red-700 border border-red-200">
          ⚠️ Posición en conflicto con muros o límites de la sala.
        </div>
      )}

      {/* Action Buttons: Duplicate & Delete */}
      <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2">
        {onDuplicate && (
          <button
            type="button"
            onClick={onDuplicate}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition"
            title="Duplicar objeto en el espacio"
          >
            <Copy size={12} />
            <span>Duplicar</span>
          </button>
        )}

        <button
          type="button"
          aria-label="Eliminar objeto"
          onClick={onRemove}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 font-semibold text-red-700 hover:bg-red-100 hover:border-red-300 transition"
          title="Eliminar objeto del espacio"
        >
          <Trash2 size={12} />
          <span>Eliminar</span>
        </button>
      </div>
    </div>
  );
};
