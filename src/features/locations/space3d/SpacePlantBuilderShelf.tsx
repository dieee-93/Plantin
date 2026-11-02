import React from 'react';
import {
  Check,
  Ruler,
  Sparkles,
  Sprout,
  X,
} from 'lucide-react';
import type {
  PlantPresetKey,
  SpaceBuilderTool,
} from './spaceBuilderReducer';

export interface SpacePlantBuilderShelfProps {
  activeTool: SpaceBuilderTool;
  plantCropCode: string;
  onChangePlantCropCode: (cropCode: string) => void;
  plantSpacingCm: number;
  onChangePlantSpacing: (spacingCm: number) => void;
  cultivableSectorCount: number;
  onFillSector: (sectorIndex: number) => void;
  onClose?: () => void;
}

interface CropCardOption {
  code: PlantPresetKey;
  title: string;
  scientificName: string;
  badge: string;
  iconText: string;
  recommendedSpacing: number;
  sunBadge: string;
  accentColor: string;
}

const CROP_CARDS: CropCardOption[] = [
  {
    code: 'tomato',
    title: 'Tomate Redondo',
    scientificName: 'Solanum lycopersicum',
    badge: 'Sol Pleno · Tutorado',
    iconText: '🍅',
    recommendedSpacing: 50,
    sunBadge: '☀️ 6+ hrs sol',
    accentColor: 'border-red-400 bg-red-50/50 text-red-950',
  },
  {
    code: 'lettuce',
    title: 'Lechuga Mantecosa',
    scientificName: 'Lactuca sativa',
    badge: 'Media Sombra · Ciclo Corto',
    iconText: '🥬',
    recommendedSpacing: 25,
    sunBadge: '⛅ Riego regular',
    accentColor: 'border-emerald-400 bg-emerald-50/50 text-emerald-950',
  },
  {
    code: 'basil',
    title: 'Albahaca Genovesa',
    scientificName: 'Ocimum basilicum',
    badge: 'Aromática · Repelente Natural',
    iconText: '🌿',
    recommendedSpacing: 30,
    sunBadge: '☀️ Aromática reina',
    accentColor: 'border-teal-400 bg-teal-50/50 text-teal-950',
  },
  {
    code: 'corn',
    title: 'Maíz Dulce',
    scientificName: 'Zea mays',
    badge: 'Gramínea Alta · Gran Biomasa',
    iconText: '🌽',
    recommendedSpacing: 40,
    sunBadge: '☀️ Viento polinizador',
    accentColor: 'border-amber-400 bg-amber-50/50 text-amber-950',
  },
  {
    code: 'carrot',
    title: 'Zanahoria Criolla',
    scientificName: 'Daucus carota',
    badge: 'Raíz Profunda · Suelo Drenante',
    iconText: '🥕',
    recommendedSpacing: 20,
    sunBadge: '🌱 Siembra directa',
    accentColor: 'border-orange-400 bg-orange-50/50 text-orange-950',
  },
];

const SPACING_PRESETS = [20, 25, 30, 40, 50, 60];

export const SpacePlantBuilderShelf: React.FC<SpacePlantBuilderShelfProps> = ({
  activeTool,
  plantCropCode,
  onChangePlantCropCode,
  plantSpacingCm,
  onChangePlantSpacing,
  cultivableSectorCount,
  onFillSector,
  onClose,
}) => {
  const activeCrop =
    CROP_CARDS.find((c) => c.code === plantCropCode) ?? CROP_CARDS[0];

  const handleSelectCrop = (crop: CropCardOption) => {
    onChangePlantCropCode(crop.code);
    onChangePlantSpacing(crop.recommendedSpacing);
  };

  const getToolTitle = () => {
    switch (activeTool) {
      case 'plant_line':
        return 'Surco / Hilera en Línea';
      case 'plant_fill_sector':
        return 'Población Automática de Sector';
      case 'plant_single':
      default:
        return 'Plantar Ejemplar Individual';
    }
  };

  const getToolSubtitle = () => {
    switch (activeTool) {
      case 'plant_line':
        return 'Haz clic en el punto de inicio y punto final para sembrar una hilera continua';
      case 'plant_fill_sector':
        return 'Siembra masiva en mosaico agronómico para cubrir un sector cultivable';
      case 'plant_single':
      default:
        return 'Haz clic en cualquier punto de tierra cultivable en el visor 3D para ubicar la planta';
    }
  };

  return (
    <div
      data-testid="space-plant-builder-shelf"
      className="pointer-events-auto flex w-full max-w-2xl flex-col gap-3 rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
    >
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
            <Sprout size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>Siembra & Cultivo</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                {getToolTitle()}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">{getToolSubtitle()}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-slate-700">
            Marco: {plantSpacingCm} cm
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Cerrar panel de siembra"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── 5 Botanical Crop Cards (Grid) ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Sparkles size={12} className="text-emerald-600" />
            <span>Especie Vegetal a Sembrar:</span>
          </span>
          {/* Accessible hidden select for screen readers and automated test queries */}
          <select
            aria-label="Cultivo a sembrar"
            value={plantCropCode}
            onChange={(e) => {
              const matched = CROP_CARDS.find((c) => c.code === e.target.value);
              if (matched) {
                handleSelectCrop(matched);
              } else {
                onChangePlantCropCode(e.target.value);
              }
            }}
            className="sr-only"
          >
            {CROP_CARDS.map((crop) => (
              <option key={crop.code} value={crop.code}>
                {crop.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {CROP_CARDS.map((crop) => {
            const isSelected = plantCropCode === crop.code;
            return (
              <button
                key={crop.code}
                type="button"
                onClick={() => handleSelectCrop(crop)}
                className={`relative flex flex-col items-center justify-between rounded-2xl border p-2 text-center transition-all duration-200 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-md ring-2 ring-emerald-400/40'
                    : 'border-slate-200/80 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/70'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}

                {/* Botanical Icon */}
                <div className="my-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-100 text-2xl select-none">
                  {crop.iconText}
                </div>

                {/* Title & Badge */}
                <div className="w-full">
                  <span className="block text-xs font-bold text-slate-800 truncate">
                    {crop.title}
                  </span>
                  <span className="mt-0.5 block text-[9px] font-medium text-emerald-700 truncate">
                    {crop.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Contextual Controls (Spacing & Sector Filling) ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-2.5 text-xs">
        {/* Spacing presets */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Ruler size={13} className="text-emerald-600" />
            <span>Marco de Plantación:</span>
          </span>

          <div className="flex items-center gap-1 font-mono text-[11px]">
            {SPACING_PRESETS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChangePlantSpacing(s)}
                className={`rounded-lg px-2 py-0.5 font-semibold transition ${
                  plantSpacingCm === s
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {s} cm
              </button>
            ))}
          </div>
        </div>

        {/* Sector auto-fill controls */}
        {activeTool === 'plant_fill_sector' && (
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700 text-[11px]">
              Sectores ({cultivableSectorCount}):
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.max(1, cultivableSectorCount) }).map(
                (_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onFillSector(idx)}
                    className="flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 transition shadow-xs"
                    title={`Rellenar sector cultivable #${idx + 1}`}
                    aria-label={`Rellenar Sector ${idx + 1}`}
                  >
                    <Sprout size={11} />
                    <span>Rellenar Sector {idx + 1}</span>
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        {activeTool !== 'plant_fill_sector' && (
          <span className="text-[11px] text-slate-500 italic">
            💡 {activeCrop.sunBadge} · Espaciamiento óptimo: {activeCrop.recommendedSpacing} cm
          </span>
        )}
      </div>
    </div>
  );
};
