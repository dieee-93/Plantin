import React, { useMemo } from 'react';
import { AlertCircle, AlertTriangle, Check, CheckCircle2, Sparkles, Trash2 } from 'lucide-react';
import type { PlacedPlantSpatialCm } from '@/domain/solarAndPlantSpatial';
import type { PlantingValidationReport } from '@/domain/plantingStagingDiagnostics';

export interface SpacePlantingStagingBarProps {
  stagedPlants: PlacedPlantSpatialCm[];
  report: PlantingValidationReport;
  onConfirm: () => void;
  onDiscard: () => void;
  className?: string;
}

export const SpacePlantingStagingBar: React.FC<SpacePlantingStagingBarProps> = ({
  stagedPlants,
  report,
  onConfirm,
  onDiscard,
  className = '',
}) => {
  const stagedCount = stagedPlants.length;

  const issueCounts = useMemo(() => {
    return {
      invalid_surface: report.issues.filter((i) => i.kind === 'invalid_surface').length,
      crowding: report.issues.filter((i) => i.kind === 'crowding').length,
      sunlight_deficit: report.issues.filter((i) => i.kind === 'sunlight_deficit').length,
      companion_conflict: report.issues.filter((i) => i.kind === 'companion_conflict').length,
      companion_synergy: report.issues.filter((i) => i.kind === 'companion_synergy').length,
    };
  }, [report.issues]);

  const canCommit = report.canCommit && stagedCount > 0;

  return (
    <div
      data-testid="planting-staging-bar"
      role="region"
      aria-label="Borrador de plantación y diagnóstico agronómico"
      className={`pointer-events-auto flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 dark:border-emerald-500/40 shadow-2xl ring-1 ring-emerald-500/20 max-w-2xl w-full transition-all ${className}`}
    >
      {/* Left: Staged Plants Counter & Status */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
          🌱
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {stagedCount === 1 ? '1 planta en borrador' : `${stagedCount} plantas en borrador`}
            </span>
            {canCommit && report.issues.length === 0 && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 size={11} /> Lista para confirmar
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            Revisa el diagnóstico antes de registrar en campo
          </p>
        </div>
      </div>

      {/* Middle: Diagnostic Badges */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        {issueCounts.invalid_surface > 0 && (
          <span
            data-testid="staging-chip-invalid-surface"
            className="flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-0.5 font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60"
            title="Plantas ubicadas fuera de la superficie cultivable"
          >
            <AlertCircle size={12} />
            <span>{issueCounts.invalid_surface} fuera de superficie cultivable</span>
          </span>
        )}

        {issueCounts.crowding > 0 && (
          <span
            data-testid="staging-chip-crowding"
            className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60"
            title="Solapamiento de copas o distanciamiento menor al recomendado"
          >
            <AlertTriangle size={12} />
            <span>{issueCounts.crowding} densidad excesiva</span>
          </span>
        )}

        {issueCounts.sunlight_deficit > 0 && (
          <span
            data-testid="staging-chip-sunlight"
            className="flex items-center gap-1 rounded-lg bg-yellow-50 px-2 py-0.5 font-medium text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-900/60"
            title="Déficit de luz solar proyectado por sombra de muros"
          >
            <span>☀️</span>
            <span>{issueCounts.sunlight_deficit} sombra de muro</span>
          </span>
        )}

        {issueCounts.companion_conflict > 0 && (
          <span
            data-testid="staging-chip-conflict"
            className="flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-0.5 font-medium text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-900/60"
            title="Asociación desfavorable entre cultivos vecinos"
          >
            <span>⚡</span>
            <span>{issueCounts.companion_conflict} conflicto de asociación</span>
          </span>
        )}

        {issueCounts.companion_synergy > 0 && (
          <span
            data-testid="staging-chip-synergy"
            className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60"
            title="Sinergia botánica benéfica entre cultivos vecinos"
          >
            <Sparkles size={12} />
            <span>{issueCounts.companion_synergy} sinergia benéfica</span>
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-testid="discard-planting-btn"
          onClick={onDiscard}
          className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
          title="Descartar borrador de plantación"
        >
          <Trash2 size={13} />
          <span>Descartar</span>
        </button>

        <button
          type="button"
          data-testid="confirm-planting-btn"
          onClick={onConfirm}
          disabled={!canCommit}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-md ${
            canCommit
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95 shadow-emerald-600/20'
              : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed shadow-none'
          }`}
          title={
            !canCommit
              ? 'Corrige los errores antes de confirmar'
              : 'Confirmar siembra y registrar individuos'
          }
        >
          <Check size={14} strokeWidth={2.5} />
          <span>Confirmar Plantación</span>
        </button>
      </div>
    </div>
  );
};
