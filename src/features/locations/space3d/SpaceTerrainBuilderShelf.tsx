import React from 'react';
import {
  Compass,
  Maximize2,
  Minimize2,
  Plus,
  Sprout,
  Trash2,
  Wand2,
} from 'lucide-react';
import type { FloorMaterialType } from '@/domain/spaceGeometry';
import { HudFlyout, HudItemCard, HudTooltip } from '@/components/hud';

export interface SpaceTerrainBuilderShelfProps {
  currentMaterial?: FloorMaterialType;
  onChangeMaterial: (mat: FloorMaterialType) => void;
  customWidthM: string;
  setCustomWidthM: (v: string) => void;
  customDepthM: string;
  setCustomDepthM: (v: string) => void;
  onApplyDimensions: () => void;
  onScaleParcel?: (factor: number) => void;
  vertexCount: number;
  selectedVertexIndex?: number | null;
  onInsertVertex?: () => void;
  onRemoveSelectedVertex?: () => void;
  onSanitizeBoundary?: () => void;
  cultivableSectorCount?: number;
  onFillSector?: (sectorIndex: number) => void;
  onClose?: () => void;
}

interface FloorMaterialCard {
  value: FloorMaterialType;
  title: string;
  badge: string;
  iconText: string;
}

const FLOOR_MATERIALS: FloorMaterialCard[] = [
  {
    value: 'soil',
    title: 'Tierra de Cultivo',
    badge: 'Sustrato Fértil',
    iconText: '🤎',
  },
  {
    value: 'grass',
    title: 'Césped / Pasto',
    badge: 'Cubierta Viva',
    iconText: '🌿',
  },
  {
    value: 'gravel',
    title: 'Grava Drenante',
    badge: 'Árido Permeable',
    iconText: '🪨',
  },
  {
    value: 'concrete',
    title: 'Hormigón Alisado',
    badge: 'Base Firme',
    iconText: '🏗️',
  },
  {
    value: 'tile',
    title: 'Baldosas Rústicas',
    badge: 'Adoquín Cerámico',
    iconText: '🧱',
  },
  {
    value: 'wood',
    title: 'Deck de Madera',
    badge: 'Tablas Tratadas',
    iconText: '🪵',
  },
];

const PARCEL_PRESETS = [
  { label: '4 × 6 m', desc: 'Huerta Urbana', w: '4.0', d: '6.0' },
  { label: '6 × 10 m', desc: 'Estándar Familiar', w: '6.0', d: '10.0' },
  { label: '8 × 12 m', desc: 'Invernadero Mediano', w: '8.0', d: '12.0' },
  { label: '10 × 15 m', desc: 'Parcela Productiva', w: '10.0', d: '15.0' },
];

export const SpaceTerrainBuilderShelf: React.FC<SpaceTerrainBuilderShelfProps> = ({
  currentMaterial = 'soil',
  onChangeMaterial,
  customWidthM,
  setCustomWidthM,
  customDepthM,
  setCustomDepthM,
  onApplyDimensions,
  onScaleParcel,
  vertexCount,
  selectedVertexIndex,
  onInsertVertex,
  onRemoveSelectedVertex,
  onSanitizeBoundary,
  cultivableSectorCount = 1,
  onFillSector,
  onClose,
}) => {
  return (
    <div data-testid="space-terrain-builder-shelf">
      <HudFlyout
        icon={<Compass size={16} />}
        title="Terreno & Pavimentos"
        subtitle={`${vertexCount} vértices`}
        closeAriaLabel="Cerrar panel de terreno"
        onClose={onClose}
        headerActions={
          onFillSector ? (
            <button
              type="button"
              onClick={() => onFillSector(0)}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer"
              title="Poblar sector cultivable con plantas de prueba"
            >
              <Sprout size={11} />
              <span>Rellenar Espacio {cultivableSectorCount > 1 ? `(${cultivableSectorCount})` : ''}</span>
            </button>
          ) : undefined
        }
      >
        {/* Quick CAD actions row */}
        {(onInsertVertex || selectedVertexIndex !== null || onSanitizeBoundary) && (
          <div className="flex flex-wrap items-center gap-1 pb-1">
            {onInsertVertex && (
              <button
                type="button"
                onClick={onInsertVertex}
                className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                title="Añadir nueva esquina al contorno"
              >
                <Plus size={10} className="text-emerald-600" />
                <span>+ Vértice</span>
              </button>
            )}

            {selectedVertexIndex !== null && selectedVertexIndex !== undefined && onRemoveSelectedVertex && (
              <button
                type="button"
                onClick={onRemoveSelectedVertex}
                className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 hover:bg-red-100 transition shadow-2xs cursor-pointer"
                title="Eliminar esquina seleccionada"
              >
                <Trash2 size={10} />
                <span>Eliminar Vértice #{selectedVertexIndex + 1}</span>
              </button>
            )}

            {onSanitizeBoundary && vertexCount > 4 && (
              <button
                type="button"
                onClick={onSanitizeBoundary}
                className="flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 hover:bg-amber-100 transition shadow-2xs cursor-pointer"
                title="Limpiar vértices redundantes"
              >
                <Wand2 size={10} />
                <span>Sanear Vértices</span>
              </button>
            )}
          </div>
        )}

        {/* Floor materials (compact HudItemCard grid) */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Material de Suelo
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {FLOOR_MATERIALS.map((card) => (
              <HudItemCard
                key={card.value}
                title={card.title}
                badge={card.badge}
                description={`${card.title} · ${card.badge}`}
                icon={<span className="text-sm select-none">{card.iconText}</span>}
                isActive={currentMaterial === card.value}
                onClick={() => onChangeMaterial(card.value)}
              />
            ))}
          </div>
        </div>

        {/* Presets & Scaling (Single chips row) */}
        <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Dimensiones & Escala
          </span>

          <div className="flex flex-wrap items-center gap-1">
            {PARCEL_PRESETS.map((p) => (
              <HudTooltip key={p.label} title={p.label} description={p.desc} side="top">
                <button
                  type="button"
                  onClick={() => {
                    setCustomWidthM(p.w);
                    setCustomDepthM(p.d);
                    onApplyDimensions();
                  }}
                  className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 transition shadow-2xs cursor-pointer"
                >
                  {p.label}
                </button>
              </HudTooltip>
            ))}

            {onScaleParcel && (
              <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
                <button
                  type="button"
                  onClick={() => onScaleParcel(0.9)}
                  className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                  title="Reducir 10% la superficie"
                >
                  <Minimize2 size={9} />
                  <span>-10%</span>
                </button>
                <button
                  type="button"
                  onClick={() => onScaleParcel(1.1)}
                  className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                  title="Aumentar 10% la superficie"
                >
                  <Maximize2 size={9} />
                  <span>+10%</span>
                </button>
              </div>
            )}
          </div>

          {/* Dimension inputs row */}
          <div className="flex items-center gap-1.5 pt-1 text-[11px]">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[10px]">Ancho:</span>
              <input
                type="number"
                aria-label="Ancho Terreno (m)"
                step="0.5"
                min="1"
                value={customWidthM}
                onChange={(e) => setCustomWidthM(e.target.value)}
                className="w-11 rounded border border-slate-200 bg-white px-1 py-0.5 font-mono text-[10px] text-slate-900 focus:border-emerald-500 focus:outline-hidden"
              />
              <span className="text-slate-400 text-[9px]">m</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[10px]">Largo:</span>
              <input
                type="number"
                aria-label="Largo Terreno (m)"
                step="0.5"
                min="1"
                value={customDepthM}
                onChange={(e) => setCustomDepthM(e.target.value)}
                className="w-11 rounded border border-slate-200 bg-white px-1 py-0.5 font-mono text-[10px] text-slate-900 focus:border-emerald-500 focus:outline-hidden"
              />
              <span className="text-slate-400 text-[9px]">m</span>
            </div>

            <button
              type="button"
              onClick={onApplyDimensions}
              className="ml-auto rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer"
            >
              Aplicar Cotas
            </button>
          </div>
        </div>
      </HudFlyout>
    </div>
  );
};
