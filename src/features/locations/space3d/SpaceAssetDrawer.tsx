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
  FACILITY_OBJECTS_CATALOG,
  type FacilityCatalogItem,
} from './objectsCatalog';

export interface SpaceAssetDrawerProps {
  isOpen?: boolean;
  onToggleOpen?: () => void;
  onClose?: () => void;
  selectedAssetId: string;
  onSelectAssetId: (assetId: string) => void;
}

const ITEMS_PER_BATCH = 24;

export const SpaceAssetDrawer: React.FC<SpaceAssetDrawerProps> = ({
  isOpen: controlledIsOpen,
  onToggleOpen,
  onClose,
  selectedAssetId,
  onSelectAssetId,
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

  const subcategories = useMemo(() => {
    return CATALOG_SUBCATEGORIES[selectedCategory] || CATALOG_SUBCATEGORIES.all;
  }, [selectedCategory]);

  // Filter items by category, subcategory and search term
  const filteredItems = useMemo(() => {
    let list = FACILITY_OBJECTS_CATALOG;

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
  }, [selectedCategory, selectedSubcategory, searchQuery]);

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

  // If collapsed, display floating tab toggle button on the left edge
  if (!isOpen) {
    return (
      <div className="fixed top-20 left-4 z-40 pointer-events-auto">
        <button
          type="button"
          onClick={handleToggle}
          aria-label="Abrir biblioteca de objetos 3D"
          data-testid="space-asset-drawer-open-btn"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-xl text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all hover:scale-[1.02] active:scale-95"
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
      className="fixed top-0 bottom-0 left-0 w-96 md:w-[420px] z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800 flex flex-col shadow-2xl transition-all duration-300"
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

      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Boxes size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Biblioteca de Objetos
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                {filteredItems.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
              Haz clic para seleccionar y colocar en el plano
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          aria-label="Minimizar panel de biblioteca"
          data-testid="space-asset-drawer-close-btn"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="p-3 border-b border-slate-200/60 dark:border-slate-800/60 shrink-0">
        <div className="relative flex items-center">
          <Search
            size={15}
            className="absolute left-3 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            role="searchbox"
            placeholder="Buscar entre 999 modelos, códigos o medidas..."
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Buscar modelos 3D"
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setVisibleLimit(ITEMS_PER_BATCH);
              }}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Primary Category Horizontal Scroll Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-2.5 border-b border-slate-200/60 dark:border-slate-800/60 shrink-0 no-scrollbar">
        {CATALOG_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Secondary Subcategory Filter Chips */}
      {subcategories.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 shrink-0 no-scrollbar">
          {subcategories.map((sub) => {
            const isSubSelected = selectedSubcategory === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => handleSelectSubcategory(sub.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  isSubSelected
                    ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {sub.emoji && <span>{sub.emoji}</span>}
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Grid of 3D Asset Cards */}
      <div
        data-testid="space-asset-grid"
        className="flex-1 overflow-y-auto p-3.5 grid grid-cols-2 gap-3 content-start"
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
          <div className="col-span-2 py-12 px-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Search size={20} />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No se encontraron objetos
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Prueba con otro término de búsqueda o cambia de categoría.
            </p>
          </div>
        )}
      </div>

      {/* Footer / Pagination */}
      {filteredItems.length > displayedItems.length && (
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Mostrando {displayedItems.length} de {filteredItems.length}
          </span>
          <button
            type="button"
            onClick={() => setVisibleLimit((v) => v + ITEMS_PER_BATCH)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
          >
            Cargar más (+{Math.min(ITEMS_PER_BATCH, filteredItems.length - displayedItems.length)})
          </button>
        </div>
      )}
    </aside>
  );
};

interface AssetTileCardProps {
  item: FacilityCatalogItem;
  isSelected: boolean;
  onSelect: () => void;
}

const AssetTileCard: React.FC<AssetTileCardProps> = ({
  item,
  isSelected,
  onSelect,
}) => {
  return (
    <button
      type="button"
      role="button"
      onClick={onSelect}
      aria-label={`${item.label} (${item.assetId})`}
      aria-pressed={isSelected}
      data-testid={`asset-tile-${item.assetId}`}
      className={`group relative flex flex-col text-left rounded-xl border p-2 transition-all duration-200 hover:shadow-md ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/50 shadow-md shadow-emerald-500/10'
          : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/70'
      }`}
    >
      {/* Square Thumbnail Preview */}
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center p-2 mb-2">
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

        {/* Variant sub-badge if present */}
        {item.variantCode && (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 shadow-xs">
            {item.variantCode}
          </div>
        )}
      </div>

      {/* Label and Polycount details */}
      <div className="flex-1 flex flex-col justify-between">
        <span
          title={item.label}
          className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2"
        >
          {item.label}
        </span>

        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
          <span>{item.triangles ? `${Math.round(item.triangles / 1000)}k tris` : '3D'}</span>
          {item.sizeMb && <span>{item.sizeMb.toFixed(1)} MB</span>}
        </div>
      </div>
    </button>
  );
};
