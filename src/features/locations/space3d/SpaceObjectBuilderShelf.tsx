import React, { useMemo, useState } from 'react';
import { Boxes, Layers, RotateCw, Search, X } from 'lucide-react';
import {
  CATALOG_CATEGORIES,
  type CatalogCategoryId,
  FACILITY_OBJECTS_CATALOG,
} from './objectsCatalog';
import { HudChipRow, HudFlyout, HudItemCard } from '@/components/hud';

export interface SpaceObjectBuilderShelfProps {
  selectedAssetId: string;
  onSelectAssetId: (assetId: string) => void;
  rotationDeg: number;
  onChangeRotationDeg: (deg: number) => void;
  elevationM: number;
  onChangeElevationM: (elevationM: number) => void;
  onClose?: () => void;
}

const ROTATION_OPTIONS = [
  { value: 0, label: '0°' },
  { value: 90, label: '90°' },
  { value: 180, label: '180°' },
  { value: 270, label: '270°' },
];

const ELEVATION_OPTIONS = [
  { value: 0, label: 'Suelo (0 cm)' },
  { value: 0.209, label: 'Sobre Palet (21 cm)' },
  { value: 0.93, label: 'Sobre Mesa (93 cm)' },
];

const CATEGORY_ICONS: Record<string, string> = {
  logistics: '📦',
  mep_climate: '⚡',
  workbench_furniture: '🪑',
  harvest_produce: '🍎',
  hand_tools: '🔧',
  safety: '🦺',
  cultivation_container: '🪴',
  botanical: '🌿',
};

const ITEMS_PER_PAGE = 30;

export const SpaceObjectBuilderShelf: React.FC<SpaceObjectBuilderShelfProps> = ({
  selectedAssetId,
  onSelectAssetId,
  rotationDeg,
  onChangeRotationDeg,
  elevationM,
  onChangeElevationM,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(ITEMS_PER_PAGE);

  // Filter items by category and search term
  const filteredItems = useMemo(() => {
    let list = FACILITY_OBJECTS_CATALOG;

    if (selectedCategory !== 'all') {
      list = list.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.assetId.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [selectedCategory, searchQuery]);

  const displayedItems = useMemo(
    () => filteredItems.slice(0, visibleLimit),
    [filteredItems, visibleLimit],
  );

  return (
    <div data-testid="space-object-builder-shelf">
      <HudFlyout
        icon={<Boxes size={16} />}
        title="Equipamiento & Logística (999 Assets 3D)"
        subtitle="Hacé click en cualquier punto del plano para colocar"
        closeAriaLabel="Cerrar panel de equipamiento"
        onClose={onClose}
      >
        {/* Hidden accessible select for screen readers and tests */}
        <select
          aria-label="Objeto a colocar"
          value={selectedAssetId}
          onChange={(e) => onSelectAssetId(e.target.value)}
          className="sr-only"
        >
          {FACILITY_OBJECTS_CATALOG.map((item) => (
            <option key={item.assetId} value={item.assetId}>
              {item.label}
            </option>
          ))}
        </select>

        {/* Search input & clear button */}
        <div className="relative flex items-center">
          <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar entre 999 modelos (ej. pallet, fan, rack)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleLimit(ITEMS_PER_PAGE);
            }}
            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 pl-8 pr-7 py-1 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 backdrop-blur-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setVisibleLimit(ITEMS_PER_PAGE);
              }}
              className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {CATALOG_CATEGORIES.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setVisibleLimit(ITEMS_PER_PAGE);
                }}
                className={`whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                  isCatActive
                    ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3D Facility & Logistics Items Grid */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span>Resultados: {filteredItems.length}</span>
            {displayedItems.length < filteredItems.length && (
              <span className="text-slate-400 font-normal">
                Mostrando {displayedItems.length} de {filteredItems.length}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 max-h-64 overflow-y-auto pr-1">
            {displayedItems.map((item) => {
              const isSelected = selectedAssetId === item.assetId;
              const emoji = CATEGORY_ICONS[item.category] || '📦';
              const iconNode = item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.label}
                  className="w-7 h-7 object-contain rounded-xs bg-slate-800/10 dark:bg-slate-700/30"
                  loading="lazy"
                />
              ) : (
                <span className="text-base select-none">{emoji}</span>
              );

              return (
                <HudItemCard
                  key={item.assetId}
                  title={item.label}
                  badge={item.badge}
                  description={item.description || `${item.category} · ${item.sizeMb || 1} MB`}
                  icon={iconNode}
                  isActive={isSelected}
                  onClick={() => onSelectAssetId(item.assetId)}
                />
              );
            })}
          </div>

          {/* Load More Button */}
          {displayedItems.length < filteredItems.length && (
            <button
              type="button"
              onClick={() => setVisibleLimit((prev) => prev + ITEMS_PER_PAGE)}
              className="mt-1 w-full py-1 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition cursor-pointer"
            >
              Cargar más (+{Math.min(ITEMS_PER_PAGE, filteredItems.length - displayedItems.length)})...
            </button>
          )}
        </div>

        {/* Rotation & Elevation Controls */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <RotateCw size={11} className="text-sky-600" />
              <span>Giro:</span>
            </span>
            <HudChipRow
              options={ROTATION_OPTIONS}
              value={rotationDeg}
              onChange={(r) => onChangeRotationDeg(Number(r))}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Layers size={11} className="text-amber-600" />
              <span>Altura:</span>
            </span>
            <HudChipRow
              options={ELEVATION_OPTIONS}
              value={elevationM}
              onChange={(e) => onChangeElevationM(Number(e))}
            />
          </div>
        </div>
      </HudFlyout>
    </div>
  );
};
