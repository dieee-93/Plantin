import React, { useState } from 'react';
import { Check, CheckCheck, Fence } from 'lucide-react';
import type { WallMaterialType } from '@/domain/spaceGeometry';
import { HudChipRow, HudFlyout, HudItemCard } from '@/components/hud';

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
    subtitle: 'Sin muros, delimitación a nivel de suelo',
    badge: '0m · Abierto',
    renderSvg: (isActive) => (
      <svg viewBox="0 0 40 24" className="h-6 w-10 select-none">
        <line x1="4" y1="20" x2="36" y2="20" stroke={isActive ? '#10b981' : '#94a3b8'} strokeWidth="2" />
        <circle cx="12" cy="18" r="2" fill={isActive ? '#059669' : '#64748b'} />
        <circle cx="20" cy="17" r="2.5" fill={isActive ? '#059669' : '#64748b'} />
        <circle cx="28" cy="18" r="2" fill={isActive ? '#059669' : '#64748b'} />
      </svg>
    ),
  },
  {
    id: 'wood_fence',
    heightCm: 120,
    defaultMaterial: 'wood_fence',
    title: 'Cerco de Huerta',
    subtitle: 'Postes y listones de madera rústicos',
    badge: '1.2m · Huerta',
    renderSvg: (isActive) => (
      <svg viewBox="0 0 40 24" className="h-6 w-10 select-none">
        <rect x="6" y="8" width="3" height="14" rx="0.5" fill={isActive ? '#b45309' : '#94a3b8'} />
        <rect x="19" y="8" width="3" height="14" rx="0.5" fill={isActive ? '#b45309' : '#94a3b8'} />
        <rect x="31" y="8" width="3" height="14" rx="0.5" fill={isActive ? '#b45309' : '#94a3b8'} />
        <rect x="4" y="10" width="32" height="2.5" rx="0.5" fill={isActive ? '#d97706' : '#cbd5e1'} />
        <rect x="4" y="16" width="32" height="2.5" rx="0.5" fill={isActive ? '#d97706' : '#cbd5e1'} />
      </svg>
    ),
  },
  {
    id: 'brick',
    heightCm: 200,
    defaultMaterial: 'brick',
    title: 'Medianera Urbana',
    subtitle: 'Muro macizo de ladrillo con inercia térmica',
    badge: '2.0m · Medianera',
    renderSvg: (isActive) => (
      <svg viewBox="0 0 40 24" className="h-6 w-10 select-none">
        <rect
          x="5"
          y="4"
          width="30"
          height="18"
          rx="1"
          fill={isActive ? '#dc2626' : '#94a3b8'}
          fillOpacity={isActive ? 0.75 : 0.5}
          stroke={isActive ? '#991b1b' : '#64748b'}
          strokeWidth="1"
        />
        <line x1="5" y1="10" x2="35" y2="10" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.8" />
        <line x1="5" y1="16" x2="35" y2="16" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.8" />
      </svg>
    ),
  },
  {
    id: 'concrete',
    heightCm: 250,
    defaultMaterial: 'concrete',
    title: 'Pared Galpón',
    subtitle: 'Muro alto de hormigón encofrado',
    badge: '2.5m · Aislante',
    renderSvg: (isActive) => (
      <svg viewBox="0 0 40 24" className="h-6 w-10 select-none">
        <rect
          x="6"
          y="2"
          width="28"
          height="20"
          rx="1"
          fill={isActive ? '#475569' : '#94a3b8'}
          stroke={isActive ? '#0f172a' : '#64748b'}
          strokeWidth="1"
        />
        <line x1="16" y1="2" x2="16" y2="22" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
        <line x1="24" y1="2" x2="24" y2="22" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
      </svg>
    ),
  },
];

const MATERIAL_SWATCHES: Array<{
  value: WallMaterialType;
  label: string;
  iconText: string;
}> = [
  { value: 'brick', label: 'Ladrillo', iconText: '🧱' },
  { value: 'wood_fence', label: 'Madera', iconText: '🪵' },
  { value: 'wire_fence', label: 'Alambrado', iconText: '⛓️' },
  { value: 'concrete', label: 'Hormigón', iconText: '🏗️' },
  { value: 'drywall', label: 'Mampostería', iconText: '⬜' },
  { value: 'glass_greenhouse', label: 'Vidrio', iconText: '🪟' },
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

  const materialChipOptions = MATERIAL_SWATCHES.map((s) => ({
    value: s.value,
    label: (
      <span className="inline-flex items-center gap-1">
        <span>{s.iconText}</span>
        <span>{s.label}</span>
      </span>
    ),
  }));

  return (
    <div data-testid="space-wall-builder-shelf">
      <HudFlyout
        icon={<Fence size={16} />}
        title="Cerramientos & Muros"
        subtitle={`Perímetro ${(selectedHeight / 100).toFixed(1)}m`}
        closeAriaLabel="Cerrar panel de muros"
        onClose={onClose}
        footer={
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-medium">
              {(selectedHeight / 100).toFixed(1)}m · {selectedMaterial}
            </span>
            <button
              type="button"
              onClick={handleApplyCurrent}
              className={`flex items-center gap-1 rounded-xl px-3 py-1 text-[11px] font-semibold transition cursor-pointer ${
                justApplied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
              }`}
            >
              {justApplied ? <CheckCheck size={12} /> : <Check size={12} />}
              <span>{justApplied ? '¡Perímetro Actualizado!' : 'Aplicar a Todo el Perímetro'}</span>
            </button>
          </div>
        }
      >
        {/* 4 Visual Archetype Cards */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Arquetipos Perimetrales
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {WALL_ARCHETYPES.map((card) => {
              const isActive = selectedHeight === card.heightCm;
              return (
                <HudItemCard
                  key={card.id}
                  title={card.title}
                  badge={card.badge}
                  description={card.subtitle}
                  icon={card.renderSvg(isActive)}
                  isActive={isActive}
                  onClick={() => handleSelectArchetype(card)}
                />
              );
            })}
          </div>
        </div>

        {/* Material Swatches (Single Chip Row) when height > 0 */}
        {selectedHeight > 0 && (
          <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Material del Muro
            </span>
            <HudChipRow
              options={materialChipOptions}
              value={selectedMaterial}
              onChange={(mat) => {
                const nextMat = mat as WallMaterialType;
                setSelectedMaterial(nextMat);
                onApplyPerimeter(selectedHeight, nextMat);
                setJustApplied(true);
                setTimeout(() => setJustApplied(false), 2000);
              }}
            />
          </div>
        )}
      </HudFlyout>
    </div>
  );
};
