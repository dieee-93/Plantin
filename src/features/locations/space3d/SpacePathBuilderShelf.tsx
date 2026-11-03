import React from 'react';
import {
  Footprints,
  MapPin,
  Route,
  Trash2,
  Undo2,
} from 'lucide-react';
import type { FloorMaterialType } from '@/domain/spaceGeometry';
import { HudChipRow, HudFlyout, HudItemCard } from '@/components/hud';

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
    badge: '60 cm',
    iconText: '🚶',
  },
  {
    id: 'wheelbarrow',
    widthCm: 80,
    title: 'Paso de Carretilla',
    subtitle: 'Acceso para transporte de sustrato y cosecha',
    badge: '80 cm',
    iconText: '🚜',
  },
  {
    id: 'wide',
    widthCm: 120,
    title: 'Paseo Principal',
    subtitle: 'Tránsito fluido de dos personas o carros',
    badge: '120 cm',
    iconText: '🏛️',
  },
];

const PATH_MATERIALS: Array<{
  value: FloorMaterialType;
  label: string;
  badge: string;
  iconText: string;
}> = [
  {
    value: 'gravel',
    label: 'Grava Drenante',
    badge: 'Permeable',
    iconText: '🪨',
  },
  {
    value: 'wood',
    label: 'Deck de Madera',
    badge: 'Elevado',
    iconText: '🪵',
  },
  {
    value: 'tile',
    label: 'Adoquín / Baldosa',
    badge: 'Cerámica',
    iconText: '🧱',
  },
  {
    value: 'concrete',
    label: 'Cemento Alisado',
    badge: 'Firme',
    iconText: '🏗️',
  },
];

const WIDTH_CHIP_OPTIONS = [
  { value: 60, label: '60 cm' },
  { value: 80, label: '80 cm' },
  { value: 100, label: '100 cm' },
  { value: 120, label: '120 cm' },
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
    <div data-testid="space-path-builder-shelf">
      <HudFlyout
        icon={<Route size={16} />}
        title="Caminos & Senderos"
        subtitle={`${paths.length} ${paths.length === 1 ? 'sendero' : 'senderos'}`}
        closeAriaLabel="Cerrar panel de caminos"
        onClose={onClose}
      >
        {/* Width selection header + chips */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Ancho de Sendero
            </span>
            <HudChipRow
              options={WIDTH_CHIP_OPTIONS}
              value={pathWidthCm}
              onChange={(w) => onChangePathWidth(Number(w))}
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {WIDTH_ARCHETYPES.map((arch) => {
              const isActive =
                arch.widthCm === pathWidthCm ||
                (arch.id === 'wheelbarrow' && (pathWidthCm === 80 || pathWidthCm === 100));
              return (
                <HudItemCard
                  key={arch.id}
                  title={arch.title}
                  badge={arch.badge}
                  description={arch.subtitle}
                  icon={<span className="text-base select-none">{arch.iconText}</span>}
                  isActive={isActive}
                  onClick={() => onChangePathWidth(arch.widthCm)}
                />
              );
            })}
          </div>
        </div>

        {/* Material Selection */}
        <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Material de Pavimento
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {PATH_MATERIALS.map((mat) => (
              <HudItemCard
                key={mat.value}
                title={mat.label}
                badge={mat.badge}
                description={`${mat.label} · ${mat.badge}`}
                icon={<span className="text-base select-none">{mat.iconText}</span>}
                isActive={pathMaterial === mat.value}
                onClick={() => onChangePathMaterial(mat.value)}
              />
            ))}
          </div>
        </div>

        {/* Interactive Drafting Guidance Banner */}
        <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/60 p-2 text-xs mt-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {draftStartCm ? (
              <>
                <Footprints size={14} className="text-emerald-600 animate-pulse shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-emerald-900 block truncate text-[11px]">
                    Punto de inicio fijado (@ {draftStartCm.x / 100}m, {draftStartCm.y / 100}m)
                  </span>
                  <p className="text-[10px] text-emerald-700 truncate">
                    Haz clic en el segundo punto en el plano para trazar ({pathWidthCm} cm)
                  </p>
                </div>
              </>
            ) : (
              <>
                <MapPin size={14} className="text-slate-500 shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-slate-700 block truncate text-[11px]">
                    Modo de Trazado Continuo Activo
                  </span>
                  <p className="text-[10px] text-slate-500 truncate">
                    Haz clic en dos puntos para trazar senderos 1:1
                  </p>
                </div>
              </>
            )}
          </div>

          {draftStartCm && onCancelDraft && (
            <button
              type="button"
              onClick={onCancelDraft}
              className="ml-2 flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs shrink-0 cursor-pointer"
            >
              <Undo2 size={11} />
              <span>Cancelar Trazo</span>
            </button>
          )}
        </div>

        {/* Existing Paths Management */}
        {paths.length > 0 && (
          <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Senderos ({paths.length})
            </span>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {paths.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-0.5 px-2 text-[10px] font-medium text-slate-700 shadow-2xs"
                >
                  <Route size={10} className="text-emerald-600" />
                  <span>{p.label || 'Sendero'}</span>
                  <span className="font-mono text-[9px] text-slate-400">({p.widthCm} cm)</span>
                  <button
                    type="button"
                    aria-label={`Eliminar ${p.label || 'sendero'}`}
                    onClick={() => onRemovePath(p.id)}
                    className="ml-0.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <Trash2 size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </HudFlyout>
    </div>
  );
};
