import React, { useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { HudTooltip } from '@/components/hud';

export interface SpaceHeaderNavProps {
  locationName?: string;
  plantCount: number;
  capacity?: number;
  widthM: number;
  depthM: number;
  areaM2?: number;
  perimeterM?: number;
  vertexCount?: number;
  isRectangular?: boolean;
  onBackToCampus?: () => void;
  onApplyDimensions?: (widthM: number, depthM: number) => void;
  onApplyShapePreset?: (shape: 'rect' | 'l_shape') => void;
  onScaleParcel?: (factor: number) => void;
  onInsertVertex?: () => void;
}

export const SpaceHeaderNav: React.FC<SpaceHeaderNavProps> = ({
  locationName = 'Espacio',
  plantCount,
  capacity,
  widthM,
  depthM,
  areaM2,
  perimeterM,
  vertexCount,
  isRectangular = true,
  onBackToCampus,
  onApplyDimensions,
  onApplyShapePreset,
  onScaleParcel,
  onInsertVertex,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [draftWidthM, setDraftWidthM] = useState<string>(() => widthM.toFixed(1));
  const [draftDepthM, setDraftDepthM] = useState<string>(() => depthM.toFixed(1));

  const computedArea = areaM2 ?? Math.round(widthM * depthM * 10) / 10;
  const computedPerimeter = perimeterM ?? Math.round(2 * (widthM + depthM) * 10) / 10;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Math.max(1, parseFloat(draftWidthM) || 10);
    const d = Math.max(1, parseFloat(draftDepthM) || 6);
    onApplyDimensions?.(w, d);
    setIsPopoverOpen(false);
  };

  const shapeDetail = isRectangular
    ? `${widthM.toFixed(1)} × ${depthM.toFixed(1)} m`
    : `Irregular (${vertexCount ?? 4} esquinas) · ${computedArea.toFixed(1)} m²`;

  return (
    <div className="relative pointer-events-auto flex items-center gap-2">
      <div className="flex h-9 max-h-9 items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-2.5 py-1 shadow-lg backdrop-blur-md">
        {onBackToCampus && (
          <button
            type="button"
            aria-label="← Volver al Mapa de Espacios"
            onClick={onBackToCampus}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 cursor-pointer"
            title="← Volver al Mapa de Espacios"
          >
            <ArrowLeft size={13} />
            <span className="sr-only">← Volver al Mapa de Espacios</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 px-0.5">
          <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{locationName}</span>
          <span
            data-testid="total-plants-counter"
            className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 border border-emerald-200/70 whitespace-nowrap"
          >
            • {capacity ? `${plantCount} / ${capacity} plantas` : `${plantCount} plantas`}
          </span>
        </div>

        {/* Room Dimension Pill (Compact Icon + m² with Tooltip Details) */}
        <HudTooltip
          title="Geometría del Terreno"
          description={shapeDetail}
          side="bottom"
        >
          <button
            type="button"
            aria-label={`Geometría: ${shapeDetail}`}
            onClick={() => setIsPopoverOpen((prev) => !prev)}
            className="flex h-7 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 cursor-pointer"
            title={shapeDetail}
          >
            <span className="text-xs">📐</span>
            <span className="font-mono text-xs font-semibold">{computedArea.toFixed(1)} m²</span>
            <ChevronDown size={11} className={`transition ${isPopoverOpen ? 'rotate-180' : ''}`} />
          </button>
        </HudTooltip>
      </div>

      {/* Popover to adjust width/depth / shape presets / scaling */}
      {isPopoverOpen && (
        <form
          onSubmit={handleApply}
          className="absolute top-11 left-0 z-50 flex w-80 flex-col gap-2.5 rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-xl backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 text-xs font-bold text-slate-800">
            <span>Geometría y Perímetro de Parcela</span>
            <span className="font-mono text-[10px] text-slate-500 font-normal">
              {isRectangular ? 'Rectangular' : 'Polígono Irregular'}
            </span>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] text-slate-600 border border-slate-100">
            <span>Área: <strong className="text-slate-900">{computedArea.toFixed(1)} m²</strong></span>
            <span>Perímetro: <strong className="text-slate-900">{computedPerimeter.toFixed(1)} m</strong></span>
            <span>Vértices: <strong className="text-slate-900">{vertexCount ?? 4}</strong></span>
          </div>

          {/* Shape Presets */}
          {onApplyShapePreset && (
            <div className="flex flex-col gap-1 text-[11px]">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                Plantillas de Parcela
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onApplyShapePreset('rect');
                    setIsPopoverOpen(false);
                  }}
                  className={`flex-1 rounded-lg border px-2 py-1 font-medium transition ${
                    isRectangular
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Rectangular
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApplyShapePreset('l_shape');
                    setIsPopoverOpen(false);
                  }}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-700 hover:bg-slate-100 transition"
                  title="Parcela en forma de L para patios con anexo"
                >
                  Forma en L (Anexo)
                </button>
              </div>
            </div>
          )}

          {/* Scale Parcel preserving shape */}
          {onScaleParcel && (
            <div className="flex flex-col gap-1 text-[11px] pt-1 border-t border-slate-100">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                Agrandar / Reducir sin deformar
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onScaleParcel(1.1)}
                  className="flex-1 rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-800 hover:bg-slate-200 transition"
                  title="Aumenta la superficie 10% conservando la forma actual"
                >
                  +10% Agrandar
                </button>
                <button
                  type="button"
                  onClick={() => onScaleParcel(0.9)}
                  className="flex-1 rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-800 hover:bg-slate-200 transition"
                  title="Reduce la superficie 10% conservando la forma actual"
                >
                  -10% Reducir
                </button>
              </div>
            </div>
          )}

          {/* Manual Width & Depth dimensions */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
            <label className="flex flex-col gap-1 font-medium text-slate-600">
              <span>Ancho Envolvente (m)</span>
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
              <span>Largo Envolvente (m)</span>
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

          <p className="text-[10px] text-slate-500 leading-tight">
            💡 En la vista 3D puedes arrastrar las esferas celestes en cualquier dirección o hacer clic en el botón '+' de cualquier pared para crear ochavas o alas.
          </p>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
            {onInsertVertex && (
              <button
                type="button"
                onClick={onInsertVertex}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
              >
                + Añadir Esquina
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
