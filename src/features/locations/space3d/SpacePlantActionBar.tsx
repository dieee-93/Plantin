import React from 'react';
import {
  ArrowRightLeft,
  Scissors,
  Search,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import type {
  PlantNeighborMeasurement,
  PlacedPlantSpatialCm,
} from '@/domain/solarAndPlantSpatial';

export interface SpacePlantActionBarProps {
  plant: PlacedPlantSpatialCm;
  bbchStage?: number;
  neighbors?: PlantNeighborMeasurement[];
  onClose: () => void;
  onInspectDetails: () => void;
  onAdvanceBBCH?: () => void;
  onMovePlant?: () => void;
  onTakeCutting?: () => void;
  onRemovePlant: () => void;
}

export const SpacePlantActionBar: React.FC<SpacePlantActionBarProps> = ({
  plant,
  bbchStage,
  neighbors = [],
  onClose,
  onInspectDetails,
  onAdvanceBBCH,
  onMovePlant,
  onTakeCutting,
  onRemovePlant,
}) => {
  return (
    <div
      data-testid="selected-plant-inspector"
      className="pointer-events-auto flex flex-col gap-2 rounded-2xl border border-sky-200/90 bg-white/95 p-3 text-xs shadow-2xl backdrop-blur-md min-w-[280px] max-w-[340px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-900">{plant.label}</span>
          {bbchStage !== undefined && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 border border-emerald-200">
              BBCH {bbchStage}
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label="Cerrar popover"
          onClick={onClose}
          className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <X size={13} />
        </button>
      </div>

      {/* Position and Canopy Metrics */}
      <div className="font-mono text-[11px] text-slate-600">
        Coord: ({plant.xCm}, {plant.yCm} cm) · Radio copa: {plant.canopyRadiusCm} cm
      </div>

      {/* Neighbor Distances with clearance / overlap */}
      {neighbors.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-slate-100 pt-1.5">
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Vecinas más cercanas (1:1):
          </span>
          <div className="flex flex-col gap-1">
            {neighbors.slice(0, 2).map((n) => (
              <div
                key={n.neighborId}
                className={`flex items-center justify-between rounded-lg px-2 py-1 font-mono text-[11px] ${
                  n.isCrowded
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/70'
                }`}
              >
                <span>Distancia a {n.neighborLabel}: {n.distanceCm} cm</span>
                <span className="font-bold">
                  {n.isCrowded
                    ? `(Solapamiento ${n.clearanceCm} cm)`
                    : `(Holgura +${n.clearanceCm} cm)`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-1 border-t border-slate-100 pt-2">
        <button
          type="button"
          onClick={onInspectDetails}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-sky-50 px-2 py-1.5 font-semibold text-sky-800 hover:bg-sky-100 transition"
          title="Ver ficha técnica completa del individuo"
        >
          <Search size={12} />
          <span>Detalles</span>
        </button>

        {onAdvanceBBCH && (
          <button
            type="button"
            onClick={onAdvanceBBCH}
            className="flex items-center justify-center gap-1 rounded-lg bg-emerald-50 px-2 py-1.5 font-semibold text-emerald-800 hover:bg-emerald-100 transition"
            title="Avanzar estadio fenológico BBCH"
          >
            <TrendingUp size={12} />
            <span>+Etapa</span>
          </button>
        )}

        {onMovePlant && (
          <button
            type="button"
            onClick={onMovePlant}
            className="flex items-center justify-center gap-1 rounded-lg bg-slate-100 px-2 py-1.5 font-semibold text-slate-700 hover:bg-slate-200 transition"
            title="Mover de posición en el espacio 1:1"
          >
            <ArrowRightLeft size={12} />
            <span>Mover</span>
          </button>
        )}

        {onTakeCutting && (
          <button
            type="button"
            onClick={onTakeCutting}
            className="flex items-center justify-center gap-1 rounded-lg bg-purple-50 px-2 py-1.5 font-semibold text-purple-800 hover:bg-purple-100 transition"
            title="Tomar esqueje de esta planta madre"
          >
            <Scissors size={12} />
            <span>Esqueje</span>
          </button>
        )}

        <button
          type="button"
          onClick={onRemovePlant}
          className="flex items-center justify-center rounded-lg bg-red-50 p-1.5 font-semibold text-red-600 hover:bg-red-100 transition"
          title="Eliminar planta"
        >
          <Trash2 size={13} />
          <span className="sr-only">Eliminar</span>
        </button>
      </div>
    </div>
  );
};
