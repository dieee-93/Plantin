import React, { useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';

export interface SpaceHeaderNavProps {
  locationName?: string;
  plantCount: number;
  capacity?: number;
  widthM: number;
  depthM: number;
  vertexCount?: number;
  onBackToCampus?: () => void;
  onApplyDimensions?: (widthM: number, depthM: number) => void;
  onInsertVertex?: () => void;
}

export const SpaceHeaderNav: React.FC<SpaceHeaderNavProps> = ({
  locationName = 'Espacio',
  plantCount,
  capacity,
  widthM,
  depthM,
  vertexCount,
  onBackToCampus,
  onApplyDimensions,
  onInsertVertex,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [draftWidthM, setDraftWidthM] = useState<string>(() => widthM.toFixed(1));
  const [draftDepthM, setDraftDepthM] = useState<string>(() => depthM.toFixed(1));

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Math.max(1, parseFloat(draftWidthM) || 10);
    const d = Math.max(1, parseFloat(draftDepthM) || 6);
    onApplyDimensions?.(w, d);
    setIsPopoverOpen(false);
  };

  return (
    <div className="relative pointer-events-auto flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 shadow-lg backdrop-blur-md">
        {onBackToCampus && (
          <button
            type="button"
            aria-label="← Volver al Mapa de Espacios"
            onClick={onBackToCampus}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
            title="← Volver al Mapa de Espacios"
          >
            <ArrowLeft size={14} />
            <span className="sr-only">← Volver al Mapa de Espacios</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 px-1">
          <span className="text-xs font-bold text-slate-900">{locationName}</span>
          <span
            data-testid="total-plants-counter"
            className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800 border border-emerald-200/70"
          >
            • {capacity ? `${plantCount} / ${capacity} plantas` : `${plantCount} plantas`}
          </span>
        </div>

        {/* Room Dimension Pill */}
        <button
          type="button"
          onClick={() => setIsPopoverOpen((prev) => !prev)}
          className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          title="Ajustar dimensiones de la sala"
        >
          <span>📐</span>
          <span>
            {widthM.toFixed(1)} × {depthM.toFixed(1)} m
          </span>
          <ChevronDown size={12} className={`transition ${isPopoverOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Popover to adjust width/depth */}
      {isPopoverOpen && (
        <form
          onSubmit={handleApply}
          className="absolute top-12 left-0 z-50 flex w-72 flex-col gap-2.5 rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-xl backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 text-xs font-bold text-slate-800">
            <span>Dimensiones del Espacio</span>
            {vertexCount !== undefined && (
              <span className="font-mono text-[10px] text-slate-500 font-normal">
                {vertexCount} vértices
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex flex-col gap-1 font-medium text-slate-600">
              <span>Ancho Terreno (m)</span>
              <input
                type="number"
                aria-label="Ancho Terreno (m)"
                step="0.5"
                min="1"
                max="100"
                value={draftWidthM}
                onChange={(e) => setDraftWidthM(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 font-medium text-slate-600">
              <span>Largo Terreno (m)</span>
              <input
                type="number"
                aria-label="Largo Terreno (m)"
                step="0.5"
                min="1"
                max="100"
                value={draftDepthM}
                onChange={(e) => setDraftDepthM(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {onInsertVertex && (
              <button
                type="button"
                onClick={onInsertVertex}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
              >
                Insertar Vértice (Ochava/L)
              </button>
            )}
            <button
              type="submit"
              className="ml-auto rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-xs"
            >
              Aplicar Dimensiones
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
