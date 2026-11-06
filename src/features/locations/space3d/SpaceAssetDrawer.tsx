import React, { useMemo, useState } from 'react';
import {
  Boxes,
  Check,
  PanelLeftClose,
  Search,
  X,
} from 'lucide-react';
import {
  CATALOG_CATEGORIES,
  CATALOG_SUBCATEGORIES,
  type CatalogCategoryId,
  type AssetPlacementMode,
  FACILITY_OBJECTS_CATALOG,
  type FacilityCatalogItem,
  getCatalogItemsForMode,
  type TechnicalSpecLevel1,
} from './objectsCatalog';

export interface SpaceAssetDrawerProps {
  isOpen?: boolean;
  onToggleOpen?: () => void;
  onClose?: () => void;
  selectedAssetId: string;
  onSelectAssetId: (assetId: string) => void;
  placementMode?: AssetPlacementMode;
  className?: string;
}

const ITEMS_PER_BATCH = 24;

export const SpaceAssetDrawer: React.FC<SpaceAssetDrawerProps> = ({
  isOpen: controlledIsOpen,
  onToggleOpen,
  onClose,
  selectedAssetId,
  onSelectAssetId,
  placementMode,
  className,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (onToggleOpen) {
      onToggleOpen();
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const [selectedCategory, setSelectedCategory] = useState<CatalogCategoryId>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(ITEMS_PER_BATCH);

  const baseItems = useMemo(() => {
    if (!placementMode) {
      return FACILITY_OBJECTS_CATALOG;
    }
    return getCatalogItemsForMode(placementMode, FACILITY_OBJECTS_CATALOG);
  }, [placementMode]);

  const subcategories = useMemo(() => {
    return CATALOG_SUBCATEGORIES[selectedCategory] || CATALOG_SUBCATEGORIES.all;
  }, [selectedCategory]);

  // Filter items by category, subcategory and search term
  const filteredItems = useMemo(() => {
    let list = baseItems;

    if (selectedCategory !== 'all') {
      list = list.filter((item) => item.category === selectedCategory);
    }

    if (selectedSubcategory !== 'all') {
      list = list.filter((item) => item.subcategory === selectedSubcategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.assetId.toLowerCase().includes(q) ||
          (item.originalLabel && item.originalLabel.toLowerCase().includes(q)) ||
          (item.variantCode && item.variantCode.toLowerCase().includes(q)) ||
          (item.dimensionsBadge && item.dimensionsBadge.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [baseItems, selectedCategory, selectedSubcategory, searchQuery]);

  const displayedItems = useMemo(
    () => filteredItems.slice(0, visibleLimit),
    [filteredItems, visibleLimit],
  );

  const handleSelectCategory = (catId: CatalogCategoryId) => {
    setSelectedCategory(catId);
    setSelectedSubcategory('all');
    setVisibleLimit(ITEMS_PER_BATCH);
  };

  const handleSelectSubcategory = (subId: string) => {
    setSelectedSubcategory(subId);
    setVisibleLimit(ITEMS_PER_BATCH);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setVisibleLimit(ITEMS_PER_BATCH);
  };

  // If collapsed, display floating tab toggle button
  if (!isOpen) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
        <button
          type="button"
          onClick={handleToggle}
          aria-label="Abrir biblioteca de objetos 3D"
          data-testid="space-asset-drawer-open-btn"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <span className="text-sm">📐</span>
          <span>Biblioteca de Objetos</span>
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Biblioteca de Objetos 3D"
      data-testid="space-asset-drawer"
      className={
        className ??
        'fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-4xl max-h-[34vh] z-40 flex flex-col rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md text-slate-900 shadow-2xl overflow-hidden transition-all duration-300'
      }
    >
      {/* Hidden accessible select for screen readers and tests */}
      <select
        aria-label="Objeto a colocar"
        value={selectedAssetId}
        onChange={(e) => onSelectAssetId(e.target.value)}
        className="sr-only"
      >
        {baseItems.map((item) => (
          <option key={item.assetId} value={item.assetId}>
            {item.label}
          </option>
        ))}
      </select>

      {/* Compact Header style Planet Zoo */}
      <div className="bg-slate-100/90 px-3.5 py-2 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
            <Boxes size={18} />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-slate-900 leading-tight">
              Biblioteca de Objetos
            </h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              {filteredItems.length}
            </span>
          </div>
        </div>

        {/* Compact Search Bar in Header to save vertical height */}
        <div className="relative flex items-center flex-1 max-w-md mx-2">
          <Search
            size={14}
            className="absolute left-2.5 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            role="searchbox"
            placeholder="Buscar entre 999 modelos, códigos o medidas..."
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Buscar modelos 3D"
            className="w-full pl-8 pr-7 py-1 rounded-lg bg-white/90 text-xs text-slate-900 placeholder-slate-400 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setVisibleLimit(ITEMS_PER_BATCH);
              }}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 p-0.5 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleClose}
          aria-label="Minimizar panel de biblioteca"
          data-testid="space-asset-drawer-close-btn"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0 cursor-pointer"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Horizontal Body: Compact Left Column for Categories + Central Grid */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Column / Compact Categories & Subcategories Bar */}
        <div className="w-52 shrink-0 border-r border-slate-200/80 bg-slate-50/70 p-2.5 flex flex-col gap-2 overflow-y-auto">
          {/* Primary Categories */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Categorías
            </span>
            <div className="flex flex-col gap-0.5">
              {CATALOG_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                    }`}
                  >
                    <span className="text-sm select-none">{cat.emoji}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcategories (if > 1) */}
          {subcategories.length > 1 && (
            <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Filtros
              </span>
              <div className="flex flex-wrap gap-1">
                {subcategories.map((sub) => {
                  const isSubSelected = selectedSubcategory === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSelectSubcategory(sub.id)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        isSubSelected
                          ? 'bg-slate-800 text-white shadow-2xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {sub.emoji && <span>{sub.emoji}</span>}
                      <span>{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Central horizontal grid of cards + footer */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white/60">
          <div
            data-testid="space-asset-grid"
            className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 content-start"
          >
            {displayedItems.map((item) => {
              const isSelected = selectedAssetId === item.assetId;
              return (
                <AssetTileCard
                  key={item.assetId}
                  item={item}
                  isSelected={isSelected}
                  onSelect={() => onSelectAssetId(item.assetId)}
                />
              );
            })}

            {displayedItems.length === 0 && (
              <div className="col-span-full py-8 px-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Search size={18} />
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  No se encontraron objetos
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Prueba con otro término de búsqueda o cambia de categoría.
                </p>
              </div>
            )}
          </div>

          {/* Footer / Pagination */}
          {filteredItems.length > displayedItems.length && (
            <div className="px-3 py-1.5 border-t border-slate-200/80 bg-slate-50/90 shrink-0 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                Mostrando {displayedItems.length} de {filteredItems.length}
              </span>
              <button
                type="button"
                onClick={() => setVisibleLimit((v) => v + ITEMS_PER_BATCH)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
              >
                Cargar más (+{Math.min(ITEMS_PER_BATCH, filteredItems.length - displayedItems.length)})
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

interface AssetTileCardProps {
  item: FacilityCatalogItem;
  isSelected: boolean;
  onSelect: () => void;
}

function getTechnicalBadge(spec?: TechnicalSpecLevel1): string | null {
  if (!spec) return null;
  if (spec.waterCapacityLiters) return `${spec.waterCapacityLiters} L`;
  if (spec.substrateVolumeLiters) return `${spec.substrateVolumeLiters} L sustrato`;
  if (spec.compostCapacityLiters) return `${spec.compostCapacityLiters} L compost`;
  if (spec.thermalDeltaC) return `${spec.thermalDeltaC > 0 ? `+${spec.thermalDeltaC}` : spec.thermalDeltaC}°C`;
  if (spec.airflowM3h) return `${spec.airflowM3h} m³/h`;
  if (spec.flowRateLpm) return `${spec.flowRateLpm} L/min`;
  return null;
}

const AssetTileCard: React.FC<AssetTileCardProps> = ({
  item,
  isSelected,
  onSelect,
}) => {
  const techBadge = getTechnicalBadge(item.technicalSpec);

  return (
    <button
      type="button"
      role="button"
      onClick={onSelect}
      aria-label={`${item.label} (${item.assetId})`}
      aria-pressed={isSelected}
      data-testid={`asset-tile-${item.assetId}`}
      className={`group relative flex flex-col text-left rounded-xl border p-2 transition-all duration-200 hover:shadow-md cursor-pointer ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/40 shadow-md shadow-emerald-500/10'
          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/80'
      }`}
    >
      {/* Square Thumbnail Preview */}
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200/60 flex items-center justify-center p-2 mb-1.5">
        <img
          src={item.thumbnailUrl}
          alt={item.label}
          loading="lazy"
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            // Graceful fallback if webp is not found
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />

        {/* Selected Checkmark Badge */}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
            <Check size={12} strokeWidth={3} />
          </div>
        )}

        {/* Dimensions Badge */}
        {item.dimensionsBadge && (
          <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-900/85 text-white backdrop-blur-xs shadow-xs">
            {item.dimensionsBadge}
          </div>
        )}

        {/* Technical Spec Badges */}
        {item.technicalSpec && (
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 z-10">
            {item.technicalSpec.iotBindable && (
              <span
                data-testid="asset-tech-badge-iot"
                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-600 text-white shadow-xs"
              >
                IoT
              </span>
            )}
            {techBadge && (
              <span
                data-testid="asset-tech-badge"
                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-700 text-white shadow-xs"
              >
                {techBadge}
              </span>
            )}
          </div>
        )}

        {/* Variant sub-badge if present */}
        {item.variantCode && (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/95 text-slate-700 border border-slate-200/80 shadow-2xs">
            {item.variantCode}
          </div>
        )}
      </div>

      {/* Label and Polycount details */}
      <div className="flex-1 flex flex-col justify-between">
        <span
          title={item.label}
          className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2"
        >
          {item.label}
        </span>

        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
          <span>{item.triangles ? `${Math.round(item.triangles / 1000)}k tris` : '3D'}</span>
          {item.sizeMb && <span>{item.sizeMb.toFixed(1)} MB</span>}
        </div>
      </div>
    </button>
  );
};
