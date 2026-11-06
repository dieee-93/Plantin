import React from 'react';
import { Eye, EyeOff, Home, Sparkles } from 'lucide-react';
import type { RoofKind, SpaceRoofConfig } from '@/store/spaceLayoutStore';
import { HudFlyout, HudItemCard } from '@/components/hud';

export interface SpaceRoofActionBarProps {
  roofConfig?: SpaceRoofConfig;
  showRoof: boolean;
  onToggleShowRoof: () => void;
  onSelectRoofKind: (kind: RoofKind) => void;
  onUpdateRoofHeight: (heightCm: number) => void;
  onUpdateRoofMaterial: (material: 'polycarbonate' | 'glass' | 'concrete' | 'shade_mesh') => void;
  onToggleGrowLights?: (enabled: boolean) => void;
  onClose?: () => void;
}

interface RoofCardOption {
  kind: RoofKind;
  title: string;
  subtitle: string;
  badge: string;
  renderSvg: (isActive: boolean) => React.ReactNode;
}

const ROOF_CARDS: RoofCardOption[] = [
  {
    kind: 'gabled_greenhouse',
    title: 'Invernadero Dos Aguas',
    subtitle: 'Cerchas y cubierta translúcida',
    badge: '4 Estaciones',
    renderSvg: (isActive) => (
      <svg viewBox="0 0 40 24" className="h-6 w-10 select-none">
        <polygon
          points="4,20 20,4 36,20"
          fill={isActive ? '#dcfce7' : '#f1f5f9'}
          stroke={isActive ? '#10b981' : '#94a3b8'}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <line x1="20" y1="4" x2="20" y2="20" stroke={isActive ? '#059669' : '#64748b'} strokeWidth="1.2" strokeDasharray="1.5 1.5" />
      </svg>
    ),
  },
  {
    kind: 'shade_cloth',
    title: 'Pérgola Media-Sombra',
    subtitle: 'Postes y malla agrícola tensionada',
    badge: 'Sombra 70%',
    renderSvg: (isActive) => (
      <svg viewBox="0 0 40 24" className="h-6 w-10 select-none">
        <line x1="8" y1="8" x2="8" y2="22" stroke={isActive ? '#b45309' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" />
        <line x1="32" y1="8" x2="32" y2="22" stroke={isActive ? '#b45309' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" />
        <rect x="6" y="6" width="28" height="4" rx="1" fill={isActive ? '#065f46' : '#64748b'} fillOpacity={0.7} />
      </svg>
    ),
  },
  {
    kind: 'flat_ceiling',
    title: 'Losa Indoor Cerrada',
    subtitle: 'Cielorraso macizo aislado con luces',
    badge: 'Indoor Controlado',
    renderSvg: (isActive) => (
      <svg viewBox="0 0 40 24" className="h-6 w-10 select-none">
        <rect x="4" y="5" width="32" height="5" rx="1" fill={isActive ? '#334155' : '#94a3b8'} stroke="#0f172a" strokeWidth="1" />
        <line x1="14" y1="10" x2="14" y2="15" stroke="#64748b" strokeWidth="1" />
        <line x1="26" y1="10" x2="26" y2="15" stroke="#64748b" strokeWidth="1" />
        <rect x="11" y="15" width="6" height="2" rx="0.5" fill="#f59e0b" />
        <rect x="23" y="15" width="6" height="2" rx="0.5" fill="#f59e0b" />
      </svg>
    ),
  },
  {
    kind: 'none',
    title: 'Cielo Abierto',
    subtitle: 'Espacio exterior pleno sin techo',
    badge: '100% Sol',
    renderSvg: (isActive) => (
      <svg viewBox="0 0 40 24" className="h-6 w-10 select-none">
        <circle cx="20" cy="12" r="5" fill={isActive ? '#f59e0b' : '#94a3b8'} />
        <line x1="20" y1="3" x2="20" y2="1" stroke={isActive ? '#f59e0b' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="21" x2="20" y2="23" stroke={isActive ? '#f59e0b' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="11" y1="12" x2="9" y2="12" stroke={isActive ? '#f59e0b' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="29" y1="12" x2="31" y2="12" stroke={isActive ? '#f59e0b' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export const SpaceRoofActionBar: React.FC<SpaceRoofActionBarProps> = ({
  roofConfig,
  showRoof,
  onToggleShowRoof,
  onSelectRoofKind,
  onUpdateRoofHeight,
  onUpdateRoofMaterial,
  onToggleGrowLights,
  onClose,
}) => {
  const currentKind: RoofKind = roofConfig?.kind ?? 'none';
  const currentHeightCm = roofConfig?.heightCm ?? (currentKind === 'gabled_greenhouse' ? 140 : 240);
  const currentMaterial = roofConfig?.material ?? (currentKind === 'gabled_greenhouse' ? 'polycarbonate' : 'shade_mesh');
  const hasGrowLights = roofConfig?.hasGrowLights !== false;

  return (
    <div data-testid="space-roof-action-bar">
      <HudFlyout
        icon={<Home size={16} />}
        title="Cubiertas & Techos"
        subtitle="1:1 3D"
        closeAriaLabel="Cerrar panel de techos"
        onClose={onClose}
        headerActions={
          currentKind !== 'none' ? (
            <button
              type="button"
              onClick={onToggleShowRoof}
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
                showRoof
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
              title={showRoof ? 'Ocultar temporalmente para ver plantas' : 'Mostrar cubierta en el plano 3D'}
            >
              {showRoof ? <Eye size={12} /> : <EyeOff size={12} />}
              <span>{showRoof ? 'Visible' : 'Oculto'}</span>
            </button>
          ) : undefined
        }
      >
        {/* 4 Visual Silhouette Cards */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Tipo de Cubierta
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ROOF_CARDS.map((card) => {
              const isActive = currentKind === card.kind;
              return (
                <HudItemCard
                  key={card.kind}
                  title={card.title}
                  badge={card.badge}
                  description={card.subtitle}
                  icon={card.renderSvg(isActive)}
                  isActive={isActive}
                  onClick={() => onSelectRoofKind(card.kind)}
                />
              );
            })}
          </div>
        </div>

        {/* Greenhouse Contextual Parameters */}
        {currentKind === 'gabled_greenhouse' && (
          <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Altura cumbrera
              </span>
              <span className="font-mono font-bold text-emerald-800 text-[10px]">
                +{(currentHeightCm / 100).toFixed(1)}m
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                aria-label="Altura de cumbrera"
                min="80"
                max="240"
                step="10"
                value={currentHeightCm}
                onChange={(e) => onUpdateRoofHeight(parseInt(e.target.value, 10))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-emerald-200 accent-emerald-600"
              />
              <div className="flex gap-1">
                {[100, 140, 180, 220].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onUpdateRoofHeight(h)}
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
                      currentHeightCm === h
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {(h / 100).toFixed(1)}m
                  </button>
                ))}
              </div>
            </div>

            {/* Material and Grow Lights in a single compact row */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 text-[11px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                Material:
              </span>
              <button
                type="button"
                onClick={() => onUpdateRoofMaterial('polycarbonate')}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
                  currentMaterial === 'polycarbonate'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>🔘 Policarbonato Alveolar</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateRoofMaterial('glass')}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
                  currentMaterial === 'glass'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>🪟 Vidrio Templado</span>
              </button>

              {onToggleGrowLights && (
                <button
                  type="button"
                  onClick={() => onToggleGrowLights(!hasGrowLights)}
                  className={`ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
                    hasGrowLights
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Luces LED complementarias para invernadero"
                >
                  <Sparkles size={11} />
                  <span>{hasGrowLights ? 'Luces LED: ON 💡' : 'Luces LED: OFF'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Shade Cloth Contextual Parameters */}
        {currentKind === 'shade_cloth' && (
          <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Altura de postes de madera:
              </span>
              <span className="font-mono font-bold text-emerald-800 text-[10px]">
                {(currentHeightCm / 100).toFixed(1)}m
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                aria-label="Altura de postes de pérgola"
                min="200"
                max="320"
                step="10"
                value={currentHeightCm}
                onChange={(e) => onUpdateRoofHeight(parseInt(e.target.value, 10))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-emerald-200 accent-emerald-600"
              />
              <div className="flex gap-1">
                {[220, 240, 280, 300].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onUpdateRoofHeight(h)}
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
                      currentHeightCm === h
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {(h / 100).toFixed(1)}m
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 text-[11px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                Malla:
              </span>
              <button
                type="button"
                onClick={() => onUpdateRoofMaterial('shade_mesh')}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
                  currentMaterial === 'shade_mesh'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>🟢 Malla Sombra Verde 70%</span>
              </button>
            </div>
          </div>
        )}

        {/* Flat Ceiling Contextual Parameters */}
        {currentKind === 'flat_ceiling' && (
          <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Altura cielo
              </span>
              <span className="font-mono font-bold text-slate-800 text-[10px]">
                {(currentHeightCm / 100).toFixed(1)}m
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                aria-label="Altura libre cielorraso"
                min="200"
                max="400"
                step="10"
                value={currentHeightCm}
                onChange={(e) => onUpdateRoofHeight(parseInt(e.target.value, 10))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200 accent-slate-700"
              />
              <div className="flex gap-1">
                {[240, 270, 300, 350].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onUpdateRoofHeight(h)}
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
                      currentHeightCm === h
                        ? 'bg-slate-800 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {(h / 100).toFixed(1)}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </HudFlyout>
    </div>
  );
};
