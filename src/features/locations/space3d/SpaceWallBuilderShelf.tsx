import React, { useState } from 'react';
import { Check, CheckCheck, Fence, Sparkles, X } from 'lucide-react';
import type { WallMaterialType } from '@/domain/spaceGeometry';

export interface SpaceWallBuilderShelfProps {
  currentHeightCm?: number;
  currentMaterial?: WallMaterialType;
  onApplyPerimeter: (heightCm: number, material: WallMaterialType) => void;
  onClose?: () => void;
}

interface WallArchetypeCard {
  id: string;
  heightCm: number;
  defaultMaterial: WallMaterialType;
  title: string;
  subtitle: string;
  badge: string;
  renderSvg: (isActive: boolean) => React.ReactNode;
}

const WALL_ARCHETYPES: WallArchetypeCard[] = [
  {
    id: 'open',
    heightCm: 0,
    defaultMaterial: 'wood_fence',
    title: 'Cantero Abierto',
    subtitle: 'Sin muros perimetrales, delimitación a nivel de suelo',
    badge: '100% Sol Directo',
    renderSvg: (isActive) => (
      <svg viewBox="0 0 100 50" className="h-12 w-full select-none">
        {/* Ground baseline */}
        <line x1="10" y1="42" x2="90" y2="42" stroke={isActive ? '#10b981' : '#94a3b8'} strokeWidth="2.5" />
        {/* Ground border dashed guide */}
        <line x1="10" y1="36" x2="90" y2="36" stroke={isActive ? '#34d399' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray="3 3" />
        {/* Small sprout symbols on ground */}
        <circle cx="30" cy="40" r="3" fill={isActive ? '#059669' : '#64748b'} />
        <circle cx="50" cy="40" r="3.5" fill={isActive ? '#059669' : '#64748b'} />
        <circle cx="70" cy="40" r="3" fill={isActive ? '#059669' : '#64748b'} />
      </svg>
    ),
  },
  {
    id: 'wood_fence',
    heightCm: 120,
    defaultMaterial: 'wood_fence',
    title: 'Cerco de Huerta',
    subtitle: 'Postes rústicos con listones horizontales de madera',
    badge: '1.2m · Huerta & Quintas',
    renderSvg: (isActive) => (
      <svg viewBox="0 0 100 50" className="h-12 w-full select-none">
        {/* Posts */}
        <rect x="15" y="14" width="6" height="32" rx="1" fill={isActive ? '#b45309' : '#94a3b8'} />
        <rect x="47" y="14" width="6" height="32" rx="1" fill={isActive ? '#b45309' : '#94a3b8'} />
        <rect x="79" y="14" width="6" height="32" rx="1" fill={isActive ? '#b45309' : '#94a3b8'} />
        {/* Horizontal Planks */}
        <rect x="10" y="20" width="80" height="5" rx="1" fill={isActive ? '#d97706' : '#cbd5e1'} />
        <rect x="10" y="32" width="80" height="5" rx="1" fill={isActive ? '#d97706' : '#cbd5e1'} />
      </svg>
    ),
  },
  {
    id: 'brick',
    heightCm: 200,
    defaultMaterial: 'brick',
    title: 'Medianera Urbana',
    subtitle: 'Muro macizo de ladrillo visto con gran inercia térmica',
    badge: '2.0m · Cortaviento',
    renderSvg: (isActive) => (
      <svg viewBox="0 0 100 50" className="h-12 w-full select-none">
        {/* Wall body */}
        <rect
          x="12"
          y="10"
          width="76"
          height="34"
          rx="1"
          fill={isActive ? '#dc2626' : '#94a3b8'}
          fillOpacity={isActive ? 0.75 : 0.5}
          stroke={isActive ? '#991b1b' : '#64748b'}
          strokeWidth="1.5"
        />
        {/* Brick rows */}
        <line x1="12" y1="18" x2="88" y2="18" stroke={isActive ? '#ffffff' : '#f1f5f9'} strokeWidth="1" strokeOpacity="0.8" />
        <line x1="12" y1="27" x2="88" y2="27" stroke={isActive ? '#ffffff' : '#f1f5f9'} strokeWidth="1" strokeOpacity="0.8" />
        <line x1="12" y1="36" x2="88" y2="36" stroke={isActive ? '#ffffff' : '#f1f5f9'} strokeWidth="1" strokeOpacity="0.8" />
        {/* Vertical mortar cuts */}
        <line x1="32" y1="10" x2="32" y2="18" stroke={isActive ? '#ffffff' : '#f1f5f9'} strokeWidth="1" strokeOpacity="0.8" />
        <line x1="68" y1="10" x2="68" y2="18" stroke={isActive ? '#ffffff' : '#f1f5f9'} strokeWidth="1" strokeOpacity="0.8" />
        <line x1="50" y1="18" x2="50" y2="27" stroke={isActive ? '#ffffff' : '#f1f5f9'} strokeWidth="1" strokeOpacity="0.8" />
        <line x1="32" y1="27" x2="32" y2="36" stroke={isActive ? '#ffffff' : '#f1f5f9'} strokeWidth="1" strokeOpacity="0.8" />
        <line x1="68" y1="27" x2="68" y2="36" stroke={isActive ? '#ffffff' : '#f1f5f9'} strokeWidth="1" strokeOpacity="0.8" />
      </svg>
    ),
  },
  {
    id: 'concrete',
    heightCm: 250,
    defaultMaterial: 'concrete',
    title: 'Pared Galpón',
    subtitle: 'Muro alto de hormigón encofrado o sala de cultivo cerrada',
    badge: '2.5m · Aislamiento Total',
    renderSvg: (isActive) => (
      <svg viewBox="0 0 100 50" className="h-12 w-full select-none">
        {/* Tall wall */}
        <rect
          x="14"
          y="6"
          width="72"
          height="40"
          rx="1"
          fill={isActive ? '#475569' : '#94a3b8'}
          stroke={isActive ? '#0f172a' : '#64748b'}
          strokeWidth="1.5"
        />
        {/* Vertical formwork seams */}
        <line x1="38" y1="6" x2="38" y2="46" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 3" />
        <line x1="62" y1="6" x2="62" y2="46" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 3" />
        {/* Reinforcement cap beam */}
        <rect x="12" y="6" width="76" height="5" rx="1" fill={isActive ? '#334155' : '#64748b'} />
      </svg>
    ),
  },
];

const MATERIAL_SWATCHES: Array<{
  value: WallMaterialType;
  label: string;
  iconText: string;
  bgColor: string;
}> = [
  { value: 'brick', label: 'Ladrillo', iconText: '🧱', bgColor: 'bg-red-50 text-red-900 border-red-200' },
  { value: 'wood_fence', label: 'Madera', iconText: '🪵', bgColor: 'bg-amber-50 text-amber-900 border-amber-200' },
  { value: 'wire_fence', label: 'Alambrado', iconText: '⛓️', bgColor: 'bg-slate-50 text-slate-800 border-slate-300' },
  { value: 'concrete', label: 'Hormigón', iconText: '🏗️', bgColor: 'bg-slate-100 text-slate-900 border-slate-300' },
  { value: 'drywall', label: 'Mampostería', iconText: '⬜', bgColor: 'bg-zinc-50 text-zinc-800 border-zinc-200' },
  { value: 'glass_greenhouse', label: 'Vidrio', iconText: '🪟', bgColor: 'bg-sky-50 text-sky-900 border-sky-200' },
];

export const SpaceWallBuilderShelf: React.FC<SpaceWallBuilderShelfProps> = ({
  currentHeightCm = 200,
  currentMaterial = 'brick',
  onApplyPerimeter,
  onClose,
}) => {
  const [selectedHeight, setSelectedHeight] = useState<number>(currentHeightCm);
  const [selectedMaterial, setSelectedMaterial] = useState<WallMaterialType>(currentMaterial);
  const [justApplied, setJustApplied] = useState<boolean>(false);

  const handleSelectArchetype = (archetype: WallArchetypeCard) => {
    setSelectedHeight(archetype.heightCm);
    if (archetype.heightCm > 0) {
      setSelectedMaterial(archetype.defaultMaterial);
    }
    onApplyPerimeter(archetype.heightCm, archetype.defaultMaterial);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2000);
  };

  const handleApplyCurrent = () => {
    onApplyPerimeter(selectedHeight, selectedMaterial);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2000);
  };

  return (
    <div
      data-testid="space-wall-builder-shelf"
      className="pointer-events-auto flex w-full max-w-2xl flex-col gap-3 rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
    >
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-800">
            <Fence size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>Cerramientos & Muros</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                Perímetro 1:1
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Configura el cerco perimetral, altura de paredes y material de muros
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Cerrar panel de muros"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── 4 Visual Silhouette Cards (Carousel Grid) ── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {WALL_ARCHETYPES.map((card) => {
          const isActive = selectedHeight === card.heightCm;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleSelectArchetype(card)}
              className={`relative flex flex-col items-center justify-between rounded-2xl border p-2.5 text-center transition-all duration-200 ${
                isActive
                  ? 'border-sky-500 bg-sky-50/50 shadow-md ring-2 ring-sky-400/40'
                  : 'border-slate-200/80 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/70'
              }`}
            >
              {/* Check indicator badge */}
              {isActive && (
                <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-white shadow-xs">
                  <Check size={10} strokeWidth={3} />
                </div>
              )}

              {/* Illustration */}
              <div className="my-1 w-full">{card.renderSvg(isActive)}</div>

              {/* Title & Badge */}
              <div className="w-full">
                <span className="block text-xs font-bold text-slate-800">
                  {card.title}
                </span>
                <span className="mt-0.5 block text-[10px] font-medium text-sky-700">
                  {card.badge}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Contextual Material Swatches & Actions (When height > 0) ── */}
      {selectedHeight > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-sky-100 bg-sky-50/40 p-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Sparkles size={13} className="text-amber-500" />
              <span>Material para todo el perímetro:</span>
            </span>
            <span className="font-mono text-[11px] font-bold text-sky-800">
              Altura actual: {(selectedHeight / 100).toFixed(1)} m
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {MATERIAL_SWATCHES.map((swatch) => {
              const isSelected = selectedMaterial === swatch.value;
              return (
                <button
                  key={swatch.value}
                  type="button"
                  onClick={() => {
                    setSelectedMaterial(swatch.value);
                    onApplyPerimeter(selectedHeight, swatch.value);
                    setJustApplied(true);
                    setTimeout(() => setJustApplied(false), 2000);
                  }}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-xl border p-1.5 transition ${
                    isSelected
                      ? 'border-sky-500 bg-white font-bold text-sky-900 shadow-xs ring-2 ring-sky-300'
                      : 'border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base">{swatch.iconText}</span>
                  <span className="text-[10px] truncate max-w-full">{swatch.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-sky-100 mt-1">
            <span className="text-[11px] text-slate-500 italic">
              💡 Haz clic en cualquier pared en 3D para editarla o añadir puertas y ventanas
            </span>
            <button
              type="button"
              onClick={handleApplyCurrent}
              className={`flex items-center gap-1 rounded-xl px-3 py-1 font-semibold text-[11px] transition ${
                justApplied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-sky-600 text-white hover:bg-sky-700 shadow-xs'
              }`}
            >
              {justApplied ? <CheckCheck size={13} /> : <Check size={13} />}
              <span>{justApplied ? '¡Perímetro Actualizado!' : 'Aplicar a Todo el Perímetro'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
