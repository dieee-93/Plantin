import React from 'react';
import {
  Check,
  Compass,
  Maximize2,
  Minimize2,
  Plus,
  Sprout,
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
  cultivableSectorCount?: number;
  onFillSector?: (sectorIndex: number) => void;
  onClose?: () => void;
}

interface FloorMaterialCard {
  value: FloorMaterialType;
  title: string;
  badge: string;
  iconText: string;
  previewBg: string;
}

const FLOOR_MATERIALS: FloorMaterialCard[] = [
  {
    value: 'soil',
    title: 'Tierra de Cultivo',
    badge: 'Sustrato Fértil',
    iconText: '🤎',
    previewBg: 'bg-amber-950/80 text-amber-100',
  },
  {
    value: 'grass',
    title: 'Césped / Pasto',
    badge: 'Cubierta Viva',
    iconText: '🌿',
    previewBg: 'bg-emerald-900/80 text-emerald-100',
  },
  {
    value: 'gravel',
    title: 'Grava Drenante',
    badge: 'Árido Permeable',
    iconText: '🪨',
    previewBg: 'bg-slate-700 text-slate-100',
  },
  {
    value: 'concrete',
    title: 'Hormigón Alisado',
    badge: 'Base Firme',
    iconText: '🏗️',
    previewBg: 'bg-zinc-600 text-zinc-100',
  },
  {
    value: 'tile',
    title: 'Baldosas Rústicas',
    badge: 'Adoquín Cerámico',
    iconText: '🧱',
    previewBg: 'bg-orange-900/80 text-orange-100',
  },
  {
    value: 'wood',
    title: 'Deck de Madera',
    badge: 'Tablas Tratadas',
    iconText: '🪵',
    previewBg: 'bg-amber-800 text-amber-50',
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
  cultivableSectorCount = 1,
  onFillSector,
  onClose,
}) => {
  return (
    <div
      data-testid="space-terrain-builder-shelf"
      className="pointer-events-auto flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
    >
      {/* ── Top Header Strip (Planet Zoo / CS2 inspired) ── */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <Compass size={14} />
          </div>
          <span className="text-xs font-bold text-slate-800">Terreno & Pavimentos</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-600">
            {vertexCount} vértices
          </span>
        </div>

        {/* Quick CAD Actions & Restored Fill Space Button */}
        <div className="flex items-center gap-1.5">
          {onFillSector && (
            <button
              type="button"
              onClick={() => onFillSector(0)}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white hover:bg-emerald-700 transition shadow-xs"
              title="Poblar sector cultivable con plantas de prueba"
            >
              <Sprout size={12} />
              <span>Rellenar Espacio {cultivableSectorCount > 1 ? `(${cultivableSectorCount})` : ''}</span>
            </button>
          )}

          {onInsertVertex && (
            <button
              type="button"
              onClick={onInsertVertex}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition shadow-xs"
              title="Añadir nueva esquina al contorno"
            >
              <Plus size={11} className="text-emerald-600" />
              <span>+ Vértice</span>
            </button>
          )}

          {selectedVertexIndex !== null && selectedVertexIndex !== undefined && onRemoveSelectedVertex && (
            <button
              type="button"
              onClick={onRemoveSelectedVertex}
              className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 hover:bg-red-100 transition shadow-xs"
              title="Eliminar esquina seleccionada"
            >
              <Trash2 size={11} />
              <span>Eliminar Vértice #{selectedVertexIndex + 1}</span>
            </button>
          )}

          {onSanitizeBoundary && vertexCount > 4 && (
            <button
              type="button"
              onClick={onSanitizeBoundary}
              className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 transition shadow-xs"
              title="Limpiar vértices redundantes"
            >
              <Wand2 size={11} />
              <span>Sanear Vértices</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Cerrar panel de terreno"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Personalización: Materiales de Suelo PBR (Planet Zoo Compact Swatches) ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 pr-1">
          Suelo:
        </span>
        {FLOOR_MATERIALS.map((card) => {
          const isActive = currentMaterial === card.value;
          return (
            <button
              key={card.value}
              type="button"
              onClick={() => onChangeMaterial(card.value)}
              className={`group relative flex items-center gap-1.5 rounded-xl border px-2 py-1 transition-all duration-150 shrink-0 ${
                isActive
                  ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-400/40'
                  : 'border-slate-200/80 bg-slate-50/80 hover:border-slate-300 hover:bg-white'
              }`}
              title={`${card.title} (${card.badge})`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg shadow-inner ${card.previewBg}`}
              >
                <span className="text-xs select-none">{card.iconText}</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-800">
                {card.title}
              </span>
              {isActive && (
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs ml-0.5">
                  <Check size={9} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Configuración: Cotas & Presets de Parcela (Planet Zoo Sliders / Pills) ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 px-2.5 py-1.5 text-xs">
        {/* Presets & Scaling */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Presets:
          </span>
          <div className="flex items-center gap-1">
            {PARCEL_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setCustomWidthM(p.w);
                  setCustomDepthM(p.d);
                  onApplyDimensions();
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/50 transition shadow-xs"
                title={`${p.label} - ${p.desc}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {onScaleParcel && (
            <div className="flex items-center gap-1 pl-1.5 border-l border-slate-200">
              <button
                type="button"
                onClick={() => onScaleParcel(0.9)}
                className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 transition shadow-xs"
                title="Reducir 10% la superficie"
              >
                <Minimize2 size={10} />
                <span>-10%</span>
              </button>
              <button
                type="button"
                onClick={() => onScaleParcel(1.1)}
                className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 transition shadow-xs"
                title="Aumentar 10% la superficie"
              >
                <Maximize2 size={10} />
                <span>+10%</span>
              </button>
            </div>
          )}
        </div>

        {/* Manual Dimensions Form */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700">
            <span>Ancho:</span>
            <input
              type="number"
              aria-label="Ancho Terreno (m)"
              step="0.5"
              min="1"
              value={customWidthM}
              onChange={(e) => setCustomWidthM(e.target.value)}
              className="w-12 rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-900 focus:border-emerald-500 focus:outline-hidden"
            />
            <span className="text-slate-500 text-[10px]">m</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700">
            <span>Largo:</span>
            <input
              type="number"
              aria-label="Largo Terreno (m)"
              step="0.5"
              min="1"
              value={customDepthM}
              onChange={(e) => setCustomDepthM(e.target.value)}
              className="w-12 rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-900 focus:border-emerald-500 focus:outline-hidden"
            />
            <span className="text-slate-500 text-[10px]">m</span>
          </div>

          <button
            type="button"
            onClick={onApplyDimensions}
            className="rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-700 transition shadow-xs"
          >
            Aplicar Cotas
          </button>
        </div>
      </div>
    </div>
  );
};
