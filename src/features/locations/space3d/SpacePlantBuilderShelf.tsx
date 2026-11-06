import React from 'react';
import { Ruler, Sprout } from 'lucide-react';
import type {
  PlantPresetKey,
  SpaceBuilderTool,
} from './spaceBuilderReducer';
import { HudChipRow, HudFlyout, HudItemCard } from '@/components/hud';

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
}

const CROP_CARDS: CropCardOption[] = [
  {
    code: 'tomato',
    title: 'Tomate Redondo',
    scientificName: 'Solanum lycopersicum',
    badge: '50 cm',
    iconText: '🍅',
    recommendedSpacing: 50,
    sunBadge: '☀️ Sol Pleno',
  },
  {
    code: 'lettuce',
    title: 'Lechuga Mantecosa',
    scientificName: 'Lactuca sativa',
    badge: '25 cm',
    iconText: '🥬',
    recommendedSpacing: 25,
    sunBadge: '⛅ Media Sombra',
  },
  {
    code: 'basil',
    title: 'Albahaca Genovesa',
    scientificName: 'Ocimum basilicum',
    badge: '30 cm',
    iconText: '🌿',
    recommendedSpacing: 30,
    sunBadge: '☀️ Aromática',
  },
  {
    code: 'corn',
    title: 'Maíz Dulce',
    scientificName: 'Zea mays',
    badge: '40 cm',
    iconText: '🌽',
    recommendedSpacing: 40,
    sunBadge: '☀️ Biomasa',
  },
  {
    code: 'carrot',
    title: 'Zanahoria Criolla',
    scientificName: 'Daucus carota',
    badge: '20 cm',
    iconText: '🥕',
    recommendedSpacing: 20,
    sunBadge: '🌱 Directa',
  },
];

const SPACING_PRESETS = [20, 25, 30, 40, 50, 60];

const SPACING_CHIP_OPTIONS = SPACING_PRESETS.map((s) => ({
  value: s,
  label: `${s} cm`,
}));

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

  return (
    <div data-testid="space-plant-builder-shelf">
      <HudFlyout
        icon={<Sprout size={16} />}
        title="Siembra & Cultivo"
        subtitle={getToolTitle()}
        closeAriaLabel="Cerrar panel de siembra"
        onClose={onClose}
      >
        {/* Hidden accessible select for screen readers and test queries */}
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

        {/* 5 Botanical Crop Cards */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Especie Vegetal
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {CROP_CARDS.map((crop) => {
              const isSelected = plantCropCode === crop.code;
              return (
                <HudItemCard
                  key={crop.code}
                  title={crop.title}
                  badge={crop.badge}
                  description={`${crop.title} (${crop.scientificName}) · Marco óptimo: ${crop.recommendedSpacing} cm`}
                  icon={<span className="text-base select-none">{crop.iconText}</span>}
                  isActive={isSelected}
                  onClick={() => handleSelectCrop(crop)}
                />
              );
            })}
          </div>
        </div>

        {/* Spacing Presets (HudChipRow) */}
        <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Ruler size={11} className="text-emerald-600" />
              <span>Marco:</span>
            </span>
            <HudChipRow
              options={SPACING_CHIP_OPTIONS}
              value={plantSpacingCm}
              onChange={(s) => onChangePlantSpacing(Number(s))}
            />
          </div>
        </div>

        {/* Sector auto-fill controls (when in plant_fill_sector mode) */}
        {activeTool === 'plant_fill_sector' && (
          <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Sectores ({cultivableSectorCount}):
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {Array.from({ length: Math.max(1, cultivableSectorCount) }).map(
                (_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onFillSector(idx)}
                    className="flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-semibold text-white hover:bg-emerald-700 transition shadow-2xs cursor-pointer"
                    title={`Rellenar sector cultivable #${idx + 1}`}
                    aria-label={`Rellenar Sector ${idx + 1}`}
                  >
                    <Sprout size={10} />
                    <span>Rellenar Sector {idx + 1}</span>
                  </button>
                ),
              )}
            </div>
          </div>
        )}
      </HudFlyout>
    </div>
  );
};
