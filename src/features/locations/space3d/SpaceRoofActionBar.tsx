import React from 'react';
import { Check, Eye, EyeOff, Home, Sparkles, X } from 'lucide-react';
import type { RoofKind, SpaceRoofConfig } from '@/store/spaceLayoutStore';

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
    subtitle: 'Cerchas estructurales y cubierta translúcida a dos aguas',
    badge: 'Protegido · 4 Estaciones',
    renderSvg: (isActive) => (
      <svg viewBox="0 0 100 50" className="h-12 w-full select-none">
        {/* Gable Silhouette */}
        <polygon
          points="10,40 50,10 90,40"
          fill={isActive ? '#dcfce7' : '#f1f5f9'}
          stroke={isActive ? '#10b981' : '#94a3b8'}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Ridge and Truss lines */}
        <line x1="50" y1="10" x2="50" y2="40" stroke={isActive ? '#059669' : '#64748b'} strokeWidth="1.8" strokeDasharray="2 2" />
        <line x1="10" y1="40" x2="90" y2="40" stroke={isActive ? '#059669' : '#64748b'} strokeWidth="2" />
        {/* Slanted glass ribs */}
        <line x1="30" y1="25" x2="30" y2="40" stroke={isActive ? '#34d399' : '#cbd5e1'} strokeWidth="1.2" />
        <line x1="70" y1="25" x2="70" y2="40" stroke={isActive ? '#34d399' : '#cbd5e1'} strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    kind: 'shade_cloth',
    title: 'Pérgola Media-Sombra',
    subtitle: 'Postes rústicos y malla agrícola tensionada contra el sol',
    badge: 'Sombra 50-80% · Fresco',
    renderSvg: (isActive) => (
      <svg viewBox="0 0 100 50" className="h-12 w-full select-none">
        {/* Corner timber posts */}
        <line x1="16" y1="18" x2="16" y2="46" stroke={isActive ? '#b45309' : '#94a3b8'} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="84" y1="18" x2="84" y2="46" stroke={isActive ? '#b45309' : '#94a3b8'} strokeWidth="3.5" strokeLinecap="round" />
        {/* Tension wire / Cross beam */}
        <line x1="12" y1="18" x2="88" y2="18" stroke={isActive ? '#059669' : '#64748b'} strokeWidth="2.5" />
        {/* Woven shade cloth pattern */}
        <rect
          x="16"
          y="15"
          width="68"
          height="8"
          rx="2"
          fill={isActive ? '#065f46' : '#64748b'}
          fillOpacity={isActive ? 0.75 : 0.45}
        />
        <line x1="26" y1="15" x2="26" y2="23" stroke="#ffffff" strokeWidth="1" strokeDasharray="1.5 1.5" />
        <line x1="42" y1="15" x2="42" y2="23" stroke="#ffffff" strokeWidth="1" strokeDasharray="1.5 1.5" />
        <line x1="58" y1="15" x2="58" y2="23" stroke="#ffffff" strokeWidth="1" strokeDasharray="1.5 1.5" />
        <line x1="74" y1="15" x2="74" y2="23" stroke="#ffffff" strokeWidth="1" strokeDasharray="1.5 1.5" />
      </svg>
    ),
  },
  {
    kind: 'flat_ceiling',
    title: 'Losa Indoor Cerrada',
    subtitle: 'Cielorraso macizo aislado con luminarias de cultivo suspendidas',
    badge: 'Ambiente Controlado',
    renderSvg: (isActive) => (
      <svg viewBox="0 0 100 50" className="h-12 w-full select-none">
        {/* Ceiling slab */}
        <rect
          x="12"
          y="12"
          width="76"
          height="9"
          rx="1.5"
          fill={isActive ? '#334155' : '#94a3b8'}
          stroke={isActive ? '#0f172a' : '#64748b'}
          strokeWidth="1.5"
        />
        {/* Hanging fixtures */}
        <line x1="32" y1="21" x2="32" y2="30" stroke="#64748b" strokeWidth="1.5" />
        <line x1="68" y1="21" x2="68" y2="30" stroke="#64748b" strokeWidth="1.5" />
        <rect x="25" y="30" width="14" height="4" rx="1" fill="#f59e0b" />
        <rect x="61" y="30" width="14" height="4" rx="1" fill="#f59e0b" />
        {/* Light glow cone */}
        <polygon points="25,34 39,34 46,46 18,46" fill="#fef08a" fillOpacity={isActive ? 0.6 : 0.25} />
        <polygon points="61,34 75,34 82,46 54,46" fill="#fef08a" fillOpacity={isActive ? 0.6 : 0.25} />
      </svg>
    ),
  },
  {
    kind: 'none',
    title: 'Cielo Abierto',
    subtitle: 'Espacio exterior pleno sin estructura de cubierta ni postes',
    badge: '100% Solar Directo',
    renderSvg: (isActive) => (
      <svg viewBox="0 0 100 50" className="h-12 w-full select-none">
        {/* Sun center */}
        <circle cx="50" cy="25" r="10" fill={isActive ? '#f59e0b' : '#94a3b8'} />
        {/* Sun rays */}
        <line x1="50" y1="8" x2="50" y2="3" stroke={isActive ? '#f59e0b' : '#94a3b8'} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50" y1="42" x2="50" y2="47" stroke={isActive ? '#f59e0b' : '#94a3b8'} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="33" y1="25" x2="28" y2="25" stroke={isActive ? '#f59e0b' : '#94a3b8'} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="67" y1="25" x2="72" y2="25" stroke={isActive ? '#f59e0b' : '#94a3b8'} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="38" y1="13" x2="34" y2="9" stroke={isActive ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" />
        <line x1="62" y1="37" x2="66" y2="41" stroke={isActive ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" />
        <line x1="62" y1="13" x2="66" y2="9" stroke={isActive ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" />
        <line x1="38" y1="37" x2="34" y2="41" stroke={isActive ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" />
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
    <div
      data-testid="space-roof-action-bar"
      className="pointer-events-auto flex w-full max-w-2xl flex-col gap-3 rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
    >
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
            <Home size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>Cubiertas & Techos</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                1:1 3D
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Configura la arquitectura superior, microclima y protección lumínica
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Visibility Eye Toggle */}
          {currentKind !== 'none' && (
            <button
              type="button"
              onClick={onToggleShowRoof}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                showRoof
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
              title={showRoof ? 'Ocultar temporalmente para ver plantas' : 'Mostrar cubierta en el plano 3D'}
            >
              {showRoof ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>{showRoof ? 'Visible' : 'Oculto'}</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Cerrar panel de techos"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── 4 Visual Silhouette Cards (Carousel Grid) ── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {ROOF_CARDS.map((card) => {
          const isActive = currentKind === card.kind;
          return (
            <button
              key={card.kind}
              type="button"
              onClick={() => onSelectRoofKind(card.kind)}
              className={`relative flex flex-col items-center justify-between rounded-2xl border p-2.5 text-center transition-all duration-200 ${
                isActive
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-400/40'
                  : 'border-slate-200/80 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/70'
              }`}
            >
              {/* Check indicator badge */}
              {isActive && (
                <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
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
                <span className="mt-0.5 block text-[10px] font-medium text-emerald-700">
                  {card.badge}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Contextual Tactile Parameter Inspector ── */}
      {currentKind === 'gabled_greenhouse' && (
        <div className="flex flex-col gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-slate-700">Altura de cumbrera (Flecha):</span>
            <div className="flex items-center gap-1 font-mono font-bold text-emerald-800">
              <span>+{(currentHeightCm / 100).toFixed(1)} m sobre muro</span>
              <span className="text-[11px] font-normal text-slate-500">
                (Tot: {((200 + currentHeightCm) / 100).toFixed(1)} m)
              </span>
            </div>
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
                  className={`rounded-lg px-1.5 py-0.5 text-[10px] font-semibold transition ${
                    currentHeightCm === h
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {(h / 100).toFixed(1)}m
                </button>
              ))}
            </div>
          </div>

          {/* Material Swatches */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-100">
            <span className="text-[11px] font-medium text-slate-600">Material de cobertura:</span>
            <button
              type="button"
              onClick={() => onUpdateRoofMaterial('polycarbonate')}
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition ${
                currentMaterial === 'polycarbonate'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>🔘 Policarbonato Alveolar</span>
              <span className="text-[9px] opacity-80">(Difuso 82%)</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateRoofMaterial('glass')}
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition ${
                currentMaterial === 'glass'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>🪟 Vidrio Templado</span>
              <span className="text-[9px] opacity-80">(Cristal 92%)</span>
            </button>

            {onToggleGrowLights && (
              <button
                type="button"
                onClick={() => onToggleGrowLights(!hasGrowLights)}
                className={`ml-auto flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition ${
                  hasGrowLights
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title="Luces LED complementarias para invernadero"
              >
                <Sparkles size={12} />
                <span>{hasGrowLights ? 'Luces LED: ON 💡' : 'Luces LED: OFF'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {currentKind === 'shade_cloth' && (
        <div className="flex flex-col gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-slate-700">Altura de postes de madera:</span>
            <div className="flex items-center gap-1 font-mono font-bold text-emerald-800">
              <span>{(currentHeightCm / 100).toFixed(1)} m de altura</span>
            </div>
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
                  className={`rounded-lg px-1.5 py-0.5 text-[10px] font-semibold transition ${
                    currentHeightCm === h
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {(h / 100).toFixed(1)}m
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-emerald-100">
            <span className="text-[11px] font-medium text-slate-600">Densidad de malla:</span>
            <button
              type="button"
              onClick={() => onUpdateRoofMaterial('shade_mesh')}
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition ${
                currentMaterial === 'shade_mesh'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>🌿 Malla Verde 50% Sombra</span>
            </button>
          </div>
        </div>
      )}

      {currentKind === 'flat_ceiling' && (
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <div>
                <span className="font-semibold text-slate-800">Luminarias LED de Cultivo:</span>
                <p className="text-[10px] text-slate-500">Paneles de espectro fotosintético suspendidos</p>
              </div>
            </div>
            {onToggleGrowLights && (
              <button
                type="button"
                onClick={() => onToggleGrowLights(!hasGrowLights)}
                className={`rounded-full px-3 py-1 font-semibold text-[11px] transition ${
                  hasGrowLights
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {hasGrowLights ? 'Encendidas 💡' : 'Apagadas'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
