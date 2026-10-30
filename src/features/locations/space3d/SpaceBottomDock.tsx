import React, { useState } from 'react';
import { Sprout, X } from 'lucide-react';

export interface SeedLotSummary {
  id: string;
  lotCode: string;
  cropName?: string;
  currentCount?: number;
  germinationRate?: number;
}

export interface AvailablePlantSummary {
  id: string;
  label: string;
  cropName?: string;
  bbchStage?: number;
  isPlaced?: boolean;
}

export interface SpaceBottomDockProps {
  isOpen: boolean;
  onClose: () => void;
  seedLots?: SeedLotSummary[];
  availablePlants?: AvailablePlantSummary[];
  onSelectSeedLotToSow?: (seedLotId: string) => void;
  onSelectPlantToPlace?: (individualId: string) => void;
  onQuickSowPreset?: (cropCode: string) => void;
}

export const SpaceBottomDock: React.FC<SpaceBottomDockProps> = ({
  isOpen,
  onClose,
  seedLots = [],
  availablePlants = [],
  onSelectSeedLotToSow,
  onSelectPlantToPlace,
}) => {
  const [activeTab, setActiveTab] = useState<'seeds' | 'plants'>('seeds');

  if (!isOpen) return null;

  return (
    <div className="pointer-events-auto flex w-full max-w-2xl flex-col rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md text-xs">
      {/* Header with Tabs & Close Button */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('seeds')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition ${
              activeTab === 'seeds'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>🌾 Semillas</span>
            {seedLots.length > 0 && (
              <span className="rounded-full bg-white/20 px-1.5 text-[10px]">
                {seedLots.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plants')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition ${
              activeTab === 'plants'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>🌿 Plantas</span>
            {availablePlants.length > 0 && (
              <span className="rounded-full bg-white/20 px-1.5 text-[10px]">
                {availablePlants.length}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          aria-label="Cerrar bandeja"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <X size={14} />
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-2.5 max-h-48 overflow-y-auto">
        {activeTab === 'seeds' ? (
          seedLots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-slate-400">
              <Sprout size={24} className="mb-1 text-slate-300" />
              <span>No hay lotes de semillas activos en el inventario</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {seedLots.map((lot) => (
                <div
                  key={lot.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 transition hover:border-emerald-300 hover:bg-emerald-50/40"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{lot.lotCode}</span>
                    <span className="text-[11px] text-slate-600">
                      {lot.cropName || 'Semilla'} · {lot.currentCount ?? 0} semillas
                    </span>
                    {lot.germinationRate !== undefined && (
                      <span className="font-mono text-[10px] text-emerald-700">
                        PG: {lot.germinationRate}%
                      </span>
                    )}
                  </div>
                  {onSelectSeedLotToSow && (
                    <button
                      type="button"
                      onClick={() => onSelectSeedLotToSow(lot.id)}
                      className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
                    >
                      Sembrar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        ) : availablePlants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-slate-400">
            <Sprout size={24} className="mb-1 text-slate-300" />
            <span>No hay plantas o plántulas pendientes de ubicar</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {availablePlants.map((plant) => (
              <div
                key={plant.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 transition hover:border-emerald-300 hover:bg-emerald-50/40"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900">{plant.label}</span>
                  <span className="text-[11px] text-slate-600">
                    {plant.cropName || 'Planta'}
                    {plant.bbchStage !== undefined && ` · BBCH ${plant.bbchStage}`}
                  </span>
                </div>
                {onSelectPlantToPlace && (
                  <button
                    type="button"
                    onClick={() => onSelectPlantToPlace(plant.id)}
                    className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
                  >
                    Ubicar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
