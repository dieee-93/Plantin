import React from 'react';
import {
  Check,
  Footprints,
  Layers,
  MapPin,
  Route,
  Ruler,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import type { FloorMaterialType } from '@/domain/spaceGeometry';

export interface SpacePathBuilderShelfProps {
  pathWidthCm: number;
  onChangePathWidth: (widthCm: number) => void;
  pathMaterial: FloorMaterialType;
  onChangePathMaterial: (mat: FloorMaterialType) => void;
  paths: Array<{ id: string; label?: string; widthCm: number }>;
  onRemovePath: (pathId: string) => void;
  draftStartCm?: { x: number; y: number } | null;
  onCancelDraft?: () => void;
  onClose?: () => void;
}

interface PathWidthArchetype {
  id: string;
  widthCm: number;
  title: string;
  subtitle: string;
  badge: string;
  iconText: string;
}

const WIDTH_ARCHETYPES: PathWidthArchetype[] = [
  {
    id: 'narrow',
    widthCm: 60,
    title: 'Sendero Angosto',
    subtitle: 'Paso peatonal unipersonal entre bancales',
    badge: '60 cm · Ahorro de Suelo',
    iconText: '🚶',
  },
  {
    id: 'wheelbarrow',
    widthCm: 80,
    title: 'Paso de Carretilla',
    subtitle: 'Acceso para transporte de sustrato y cosecha',
    badge: '80 cm · Huerta & Quintas',
    iconText: '🚜',
  },
  {
    id: 'wide',
    widthCm: 120,
    title: 'Paseo Principal',
    subtitle: 'Tránsito fluido de dos personas o carros',
    badge: '120 cm · Doble Sentido',
    iconText: '🏛️',
  },
];

const PATH_MATERIALS: Array<{
  value: FloorMaterialType;
  label: string;
  badge: string;
  iconText: string;
  bgColor: string;
}> = [
  {
    value: 'gravel',
    label: 'Grava Drenante',
    badge: 'Árido Natural Permeable',
    iconText: '🪨',
    bgColor: 'bg-slate-700 text-slate-100',
  },
  {
    value: 'wood',
    label: 'Deck de Madera',
    badge: 'Tablas Tratadas Elevadas',
    iconText: '🪵',
    bgColor: 'bg-amber-800 text-amber-50',
  },
  {
    value: 'tile',
    label: 'Adoquín / Baldosa',
    badge: 'Cerámica Rústica Tradicional',
    iconText: '🧱',
    bgColor: 'bg-orange-900/80 text-orange-100',
  },
  {
    value: 'concrete',
    label: 'Cemento Alisado',
    badge: 'Firme Industrial Impermeable',
    iconText: '🏗️',
    bgColor: 'bg-zinc-600 text-zinc-100',
  },
];

export const SpacePathBuilderShelf: React.FC<SpacePathBuilderShelfProps> = ({
  pathWidthCm,
  onChangePathWidth,
  pathMaterial,
  onChangePathMaterial,
  paths,
  onRemovePath,
  draftStartCm,
  onCancelDraft,
  onClose,
}) => {
  return (
    <div
      data-testid="space-path-builder-shelf"
      className="pointer-events-auto flex w-full max-w-2xl flex-col gap-3 rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
    >
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
            <Route size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>Caminos & Senderos</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                1:1 Trazado
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Diseña pasarelas peatonales, accesos de carretilla y veredas entre bancales
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-800 border border-emerald-200">
            {paths.length} {paths.length === 1 ? 'sendero' : 'senderos'}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Cerrar panel de caminos"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── 3 Width Archetype Cards (Width Selection) ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Ruler size={12} className="text-emerald-600" />
            <span>Ancho Ergonómico del Sendero:</span>
          </span>
          <div className="flex gap-1 font-mono text-[10px]">
            {[60, 80, 100, 120].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => onChangePathWidth(w)}
                className={`rounded-lg px-2 py-0.5 font-semibold transition ${
                  pathWidthCm === w
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {w} cm
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {WIDTH_ARCHETYPES.map((arch) => {
            const isActive =
              arch.widthCm === pathWidthCm ||
              (arch.id === 'wheelbarrow' && (pathWidthCm === 80 || pathWidthCm === 100));
            return (
              <button
                key={arch.id}
                type="button"
                onClick={() => onChangePathWidth(arch.widthCm)}
                className={`relative flex items-center gap-2.5 rounded-2xl border p-2 text-left transition-all duration-200 ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-md ring-2 ring-emerald-400/40'
                    : 'border-slate-200/80 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200 text-lg">
                  <span>{arch.iconText}</span>
                </div>

                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {arch.title}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium truncate">
                    {arch.badge}
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

      {/* ── Visual PBR Material Swatches ── */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
          <Layers size={12} className="text-emerald-600" />
          <span>Material de Pavimento del Camino:</span>
        </span>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PATH_MATERIALS.map((mat) => {
            const isSelected = pathMaterial === mat.value;
            return (
              <button
                key={mat.value}
                type="button"
                onClick={() => onChangePathMaterial(mat.value)}
                className={`flex items-center gap-2 rounded-2xl border p-2 transition ${
                  isSelected
                    ? 'border-emerald-500 bg-white font-bold text-emerald-900 shadow-md ring-2 ring-emerald-300'
                    : 'border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-inner ${mat.bgColor}`}
                >
                  <span className="text-sm select-none">{mat.iconText}</span>
                </div>
                <div className="flex flex-col overflow-hidden text-left">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {mat.label}
                  </span>
                  <span className="text-[9px] text-slate-500 truncate">
                    {mat.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Interactive Trazo Drafting Guidance Banner ── */}
      <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/50 p-2.5 text-xs">
        <div className="flex items-center gap-2">
          {draftStartCm ? (
            <>
              <Footprints size={15} className="text-emerald-600 animate-pulse" />
              <div>
                <span className="font-bold text-emerald-900">
                  Punto de inicio fijado (@ {draftStartCm.x / 100}m, {draftStartCm.y / 100}m)
                </span>
                <p className="text-[10px] text-emerald-700">
                  Haz clic en el segundo punto en el plano 3D para trazar el sendero de {pathWidthCm} cm
                </p>
              </div>
            </>
          ) : (
            <>
              <MapPin size={15} className="text-slate-500" />
              <div>
                <span className="font-semibold text-slate-700">
                  Modo de Trazado Continuo Activo
                </span>
                <p className="text-[10px] text-slate-500">
                  Haz clic en cualquier punto del terreno para fijar el inicio del sendero
                </p>
              </div>
            </>
          )}
        </div>

        {draftStartCm && onCancelDraft && (
          <button
            type="button"
            onClick={onCancelDraft}
            className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-xs"
          >
            <Undo2 size={12} />
            <span>Cancelar Trazo</span>
          </button>
        )}
      </div>

      {/* ── Gestor de Tramos Trazados (If any paths exist) ── */}
      {paths.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-600">
            Senderos existentes ({paths.length}):
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {paths.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-0.5 px-2.5 text-[11px] font-medium text-slate-700 shadow-xs"
              >
                <Route size={11} className="text-emerald-600" />
                <span>{p.label || 'Sendero'}</span>
                <span className="font-mono text-[10px] text-slate-400">({p.widthCm} cm)</span>
                <button
                  type="button"
                  aria-label={`Eliminar ${p.label || 'sendero'}`}
                  onClick={() => onRemovePath(p.id)}
                  className="ml-1 text-slate-400 hover:text-red-600 transition"
                >
                  <Trash2 size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
