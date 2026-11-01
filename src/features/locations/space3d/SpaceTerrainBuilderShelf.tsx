import React from 'react';
import {
  Check,
  Compass,
  Grid3X3,
  Layers,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import type { FloorMaterialType } from '@/domain/spaceGeometry';

export interface SpaceTerrainBuilderShelfProps {
  currentMaterial?: FloorMaterialType;
  onChangeMaterial: (mat: FloorMaterialType) => void;
  customWidthM: string;
  setCustomWidthM: (v: string) => void;
  customDepthM: string;
  setCustomDepthM: (v: string) => void;
  onApplyDimensions: () => void;
  onScaleParcel?: (factor: number) => void;
  vertexCount: number;
  selectedVertexIndex?: number | null;
  onInsertVertex?: () => void;
  onRemoveSelectedVertex?: () => void;
  onSanitizeBoundary?: () => void;
  onClose?: () => void;
}

interface FloorMaterialCard {
  value: FloorMaterialType;
  title: string;
  badge: string;
  iconText: string;
  previewBg: string;
  borderActive: string;
}

const FLOOR_MATERIALS: FloorMaterialCard[] = [
  {
    value: 'soil',
    title: 'Tierra de Cultivo',
    badge: 'Sustrato Fértil · Siembra Directa',
    iconText: '🤎',
    previewBg: 'bg-amber-950/80 text-amber-100',
    borderActive: 'border-amber-700 ring-amber-600/40',
  },
  {
    value: 'grass',
    title: 'Césped / Pasto',
    badge: 'Cubierta Viva · Patios & Quintas',
    iconText: '🌿',
    previewBg: 'bg-emerald-900/80 text-emerald-100',
    borderActive: 'border-emerald-600 ring-emerald-500/40',
  },
  {
    value: 'gravel',
    title: 'Grava Drenante',
    badge: 'Árido Permeable · Pasillos & Caminos',
    iconText: '🪨',
    previewBg: 'bg-slate-700 text-slate-100',
    borderActive: 'border-slate-500 ring-slate-400/40',
  },
  {
    value: 'concrete',
    title: 'Hormigón Alisado',
    badge: 'Base Firme · Indoor & Galpones',
    iconText: '🏗️',
    previewBg: 'bg-zinc-600 text-zinc-100',
    borderActive: 'border-zinc-500 ring-zinc-400/40',
  },
  {
    value: 'tile',
    title: 'Baldosas Rústicas',
    badge: 'Adoquín Cerámico · Terrazas Urbanas',
    iconText: '🧱',
    previewBg: 'bg-orange-900/80 text-orange-100',
    borderActive: 'border-orange-600 ring-orange-500/40',
  },
  {
    value: 'wood',
    title: 'Deck de Madera',
    badge: 'Tablas Tratadas · Pérgolas & Relax',
    iconText: '🪵',
    previewBg: 'bg-amber-800 text-amber-50',
    borderActive: 'border-amber-600 ring-amber-500/40',
  },
];

const PARCEL_PRESETS = [
  { label: '4 × 6 m', desc: 'Huerta Urbana', w: '4.0', d: '6.0' },
  { label: '6 × 10 m', desc: 'Estándar Familiar', w: '6.0', d: '10.0' },
  { label: '8 × 12 m', desc: 'Invernadero Mediano', w: '8.0', d: '12.0' },
  { label: '10 × 15 m', desc: 'Parcela Productiva', w: '10.0', d: '15.0' },
];

export const SpaceTerrainBuilderShelf: React.FC<SpaceTerrainBuilderShelfProps> = ({
  currentMaterial = 'soil',
  onChangeMaterial,
  customWidthM,
  setCustomWidthM,
  customDepthM,
  setCustomDepthM,
  onApplyDimensions,
  onScaleParcel,
  vertexCount,
  selectedVertexIndex,
  onInsertVertex,
  onRemoveSelectedVertex,
  onSanitizeBoundary,
  onClose,
}) => {
  return (
    <div
      data-testid="space-terrain-builder-shelf"
      className="pointer-events-auto flex w-full max-w-2xl flex-col gap-3 rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
    >
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <Compass size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>Terreno & Pavimentos</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                Suelo 1:1
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Sustrato agronómico base, proporciones de parcela y edición geométrica
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-slate-700">
            {vertexCount} vértices
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Cerrar panel de terreno"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── 6 Visual PBR Material Cards (Grid) ── */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
          <Layers size={12} className="text-amber-600" />
          <span>Sustrato Agronómico / Material de Suelo:</span>
        </span>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FLOOR_MATERIALS.map((card) => {
            const isActive = currentMaterial === card.value;
            return (
              <button
                key={card.value}
                type="button"
                onClick={() => onChangeMaterial(card.value)}
                className={`relative flex items-center gap-2.5 rounded-2xl border p-2 text-left transition-all duration-200 ${
                  isActive
                    ? `border-emerald-500 bg-emerald-50/60 shadow-md ring-2 ring-emerald-400/40`
                    : 'border-slate-200/80 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/70'
                }`}
              >
                {/* Circular Texture Preview */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-inner ${card.previewBg}`}
                >
                  <span className="text-base select-none">{card.iconText}</span>
                </div>

                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {card.title}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">
                    {card.badge}
                  </span>
                </div>

                {isActive && (
                  <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Dimension Presets & Metric Scalers ── */}
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Grid3X3 size={13} className="text-emerald-600" />
            <span>Dimensiones de la Parcela:</span>
          </span>

          <div className="flex items-center gap-1.5">
            {onScaleParcel && (
              <>
                <button
                  type="button"
                  onClick={() => onScaleParcel(0.9)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition shadow-xs"
                  title="Reducir 10% el tamaño de la parcela"
                >
                  <Minimize2 size={11} />
                  <span>-10%</span>
                </button>
                <button
                  type="button"
                  onClick={() => onScaleParcel(1.1)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition shadow-xs"
                  title="Aumentar 10% el tamaño de la parcela"
                >
                  <Maximize2 size={11} />
                  <span>+10%</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {PARCEL_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setCustomWidthM(p.w);
                setCustomDepthM(p.d);
                onApplyDimensions();
              }}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-1.5 px-2 hover:border-emerald-400 hover:bg-emerald-50/40 transition shadow-xs"
            >
              <span className="font-mono text-xs font-bold text-slate-800">{p.label}</span>
              <span className="text-[9px] text-slate-500">{p.desc}</span>
            </button>
          ))}
        </div>

        {/* Custom Width & Depth Form */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 mt-0.5">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 font-medium text-slate-700 text-[11px]">
              <span>Ancho:</span>
              <div className="flex items-center">
                <input
                  type="number"
                  aria-label="Ancho Terreno (m)"
                  step="0.5"
                  min="1"
                  value={customWidthM}
                  onChange={(e) => setCustomWidthM(e.target.value)}
                  className="w-16 rounded-l-lg border border-slate-300 bg-white px-2 py-1 font-mono text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                />
                <span className="rounded-r-lg border border-l-0 border-slate-300 bg-slate-100 px-1.5 py-1 text-[11px] text-slate-600">
                  m
                </span>
              </div>
            </label>

            <label className="flex items-center gap-1.5 font-medium text-slate-700 text-[11px]">
              <span>Largo:</span>
              <div className="flex items-center">
                <input
                  type="number"
                  aria-label="Largo Terreno (m)"
                  step="0.5"
                  min="1"
                  value={customDepthM}
                  onChange={(e) => setCustomDepthM(e.target.value)}
                  className="w-16 rounded-l-lg border border-slate-300 bg-white px-2 py-1 font-mono text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                />
                <span className="rounded-r-lg border border-l-0 border-slate-300 bg-slate-100 px-1.5 py-1 text-[11px] text-slate-600">
                  m
                </span>
              </div>
            </label>
          </div>

          <button
            type="button"
            onClick={onApplyDimensions}
            className="rounded-xl bg-emerald-600 px-3 py-1 font-semibold text-white hover:bg-emerald-700 transition shadow-xs text-[11px]"
          >
            Aplicar Cotas
          </button>
        </div>
      </div>

      {/* ── CAD Vertex Controls Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          {onInsertVertex && (
            <button
              type="button"
              onClick={onInsertVertex}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition shadow-xs"
              title="Añadir nueva esquina al contorno del terreno"
            >
              <Plus size={12} className="text-emerald-600" />
              <span>+ Vértice</span>
            </button>
          )}

          {selectedVertexIndex !== null && selectedVertexIndex !== undefined && onRemoveSelectedVertex && (
            <button
              type="button"
              onClick={onRemoveSelectedVertex}
              className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100 transition shadow-xs"
              title="Eliminar esquina seleccionada"
            >
              <Trash2 size={12} />
              <span>Eliminar Vértice #{selectedVertexIndex + 1}</span>
            </button>
          )}

          {onSanitizeBoundary && vertexCount > 4 && (
            <button
              type="button"
              onClick={onSanitizeBoundary}
              className="flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 transition shadow-xs"
              title="Fusiona vértices amontonados a menos de 40 cm y limpia puntos colineales redundantes"
            >
              <Wand2 size={12} />
              <span>Sanear Vértices</span>
            </button>
          )}
        </div>

        <span className="text-[11px] text-slate-500 italic">
          💡 Arrastra los círculos azules en 3D para modelar formas libres en L, T o irregulares
        </span>
      </div>
    </div>
  );
};
