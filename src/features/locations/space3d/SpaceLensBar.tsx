import React, { useMemo, useState } from 'react';
import { Eye, Home, Sun, Tag } from 'lucide-react';
import { computeSpaceRegions } from '@/domain/spaceGeometry';
import {
  computeShadowLengthCm,
  computeSunPosition,
  findNearestNeighbor,
  type SolarSeason,
} from '@/domain/solarAndPlantSpatial';
import {
  SPACE_PRESETS,
  type SpaceLayout1to1,
  type SpaceSolarConfig,
} from '@/store/spaceLayoutStore';

export type AnalyticalLensType = 'species' | 'phenology' | 'genetics' | 'comfort';

export interface SpaceLensBarProps {
  layout: SpaceLayout1to1;
  showLabels: boolean;
  onToggleShowLabels: () => void;
  showRoof?: boolean;
  onToggleShowRoof?: () => void;
  hasRoof?: boolean;
  onOpenRoofBuilder?: () => void;
  activeLens: AnalyticalLensType | null;
  onSelectLens: (lens: AnalyticalLensType | null) => void;
  speciesFilter: string | null;
  onSelectSpeciesFilter: (species: string | null) => void;
  availableSpecies?: Array<{ code: string; label: string }>;
  onUpdateSolar: (partial: Partial<SpaceSolarConfig>) => void;
  onApplyPreset: (presetId: string) => void;
  onFillFirstSector?: () => void;
  defaultSolarOpen?: boolean;
}

const SEASON_OPTIONS: Array<{ value: SolarSeason; label: string }> = [
  { value: 'summer', label: 'Verano' },
  { value: 'autumn', label: 'Otoño' },
  { value: 'winter', label: 'Invierno' },
  { value: 'spring', label: 'Primavera' },
];

function formatHourLabel(hour: number): string {
  const wholeHours = Math.floor(hour);
  const mins = Math.round((hour - wholeHours) * 60);
  return `${String(wholeHours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export const SpaceLensBar: React.FC<SpaceLensBarProps> = ({
  layout,
  showLabels,
  onToggleShowLabels,
  showRoof = true,
  onToggleShowRoof,
  hasRoof = Boolean(layout.roofConfig && layout.roofConfig.kind !== 'none'),
  onOpenRoofBuilder,
  activeLens,
  onSelectLens,
  speciesFilter,
  onSelectSpeciesFilter,
  availableSpecies = [],
  onUpdateSolar,
  onApplyPreset,
  onFillFirstSector,
  defaultSolarOpen = false,
}) => {
  const [isLensesOpen, setIsLensesOpen] = useState(false);
  const [isSolarOpen, setIsSolarOpen] = useState(defaultSolarOpen);

  const regions = useMemo(
    () =>
      computeSpaceRegions(
        layout.baseBoundary,
        layout.hardscapeZones,
        layout.paths,
      ),
    [layout.baseBoundary, layout.hardscapeZones, layout.paths],
  );

  const sun = useMemo(
    () => computeSunPosition(layout.solarConfig),
    [layout.solarConfig],
  );

  const shadow1mCm = useMemo(
    () => computeShadowLengthCm(100, sun.elevationDeg),
    [sun.elevationDeg],
  );

  const plantRows = useMemo(() => {
    if (!isSolarOpen) return [];
    const sample = layout.placedPlants.slice(0, 30);
    return sample.map((plant) => {
      const nearest = findNearestNeighbor(plant, layout.placedPlants);
      return { plant, nearest };
    });
  }, [isSolarOpen, layout.placedPlants]);

  // Derive unique species from placed plants if availableSpecies is empty
  const computedSpecies = useMemo(() => {
    if (availableSpecies.length > 0) return availableSpecies;
    const seen = new Set<string>();
    const list: Array<{ code: string; label: string }> = [];
    for (const p of layout.placedPlants) {
      if (p.cropCode && !seen.has(p.cropCode)) {
        seen.add(p.cropCode);
        list.push({ code: p.cropCode, label: p.label || p.cropCode });
      }
    }
    return list;
  }, [availableSpecies, layout.placedPlants]);

  const roofKindLabel = useMemo(() => {
    switch (layout.roofConfig?.kind) {
      case 'gabled_greenhouse':
        return 'Invernadero (A dos aguas)';
      case 'flat_ceiling':
        return 'Indoor (Losa + Luces Quantum)';
      case 'shade_cloth':
        return 'Pérgola (Media-sombra)';
      default:
        return 'Estructura superior';
    }
  }, [layout.roofConfig?.kind]);

  return (
    <div className="relative pointer-events-auto flex items-center gap-2">
      {/* Quick Pills Bar */}
      <div className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 p-1.5 shadow-lg backdrop-blur-md">
        {/* 🏷️ Nombres Toggle */}
        <button
          type="button"
          onClick={onToggleShowLabels}
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
            showLabels
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          title="Mostrar / ocultar nombres de plantas"
        >
          <Tag size={12} />
          <span>🏷️ Nombres</span>
        </button>

        {/* ☀️ Luz Toggle */}
        <button
          type="button"
          onClick={() => {
            setIsSolarOpen((prev) => !prev);
            if (!isSolarOpen) setIsLensesOpen(false);
          }}
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
            isSolarOpen
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          title="Simulador solar en vivo y métricas"
        >
          <Sun size={12} />
          <span>☀️ Luz</span>
        </button>

        {/* 👁️ Lentes Toggle */}
        <button
          type="button"
          onClick={() => {
            setIsLensesOpen((prev) => !prev);
            if (!isLensesOpen) setIsSolarOpen(false);
          }}
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
            isLensesOpen || activeLens !== null
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          title="Lentes analíticos y filtros de cultivo"
        >
          <Eye size={12} />
          <span>👁️ Lentes</span>
        </button>

        {/* 🏠 Techo Toggle & Builder shortcut */}
        {(hasRoof || onOpenRoofBuilder) && (
          <button
            type="button"
            data-testid="toggle-roof-btn"
            onClick={() => {
              if (onOpenRoofBuilder && !hasRoof) {
                onOpenRoofBuilder();
              } else if (onToggleShowRoof) {
                onToggleShowRoof();
              }
            }}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
              showRoof && hasRoof
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title={
              hasRoof
                ? showRoof
                  ? `Ocultar ${roofKindLabel} para inspección interior`
                  : `Mostrar ${roofKindLabel}`
                : 'Configurar Techo o Cubierta'
            }
          >
            <Home size={12} />
            <span>🏠 {hasRoof ? 'Techo' : '+ Techo'}</span>
          </button>
        )}
      </div>

      {/* Floating Panel: Analytical Lenses */}
      {isLensesOpen && (
        <div className="absolute top-12 right-0 z-50 flex w-80 flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 text-xs shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-800">Lentes Analíticos 1:1</span>
            {activeLens && (
              <button
                type="button"
                onClick={() => onSelectLens(null)}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onSelectLens(activeLens === 'species' ? null : 'species')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                activeLens === 'species'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>🌿</span>
              <span>Especies</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectLens(activeLens === 'phenology' ? null : 'phenology')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                activeLens === 'phenology'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>📈</span>
              <span>Fenología BBCH</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectLens(activeLens === 'genetics' ? null : 'genetics')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                activeLens === 'genetics'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>🧬</span>
              <span>Genética / Pedigrí</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectLens(activeLens === 'comfort' ? null : 'comfort')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                activeLens === 'comfort'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>🌡️</span>
              <span>Confort Climático</span>
            </button>
          </div>

          {/* Section: FILTRAR ESPECIE */}
          <div className="border-t border-slate-100 pt-2">
            <div className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              FILTRAR ESPECIE:
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSelectSpeciesFilter(null)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition ${
                  speciesFilter === null
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Todas
              </button>
              {computedSpecies.map((s) => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => onSelectSpeciesFilter(speciesFilter === s.code ? null : s.code)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition ${
                    speciesFilter === s.code
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Panel: Live Solar Simulator & 1:1 Metrics */}
      {isSolarOpen && (
        <div className="absolute top-12 right-0 z-50 flex w-96 flex-col gap-3 rounded-2xl border border-amber-200/90 bg-white/95 p-3.5 text-xs shadow-xl backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-100 pb-2">
            <span className="font-bold text-amber-950">Simulador Solar en Vivo</span>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-800">
              <span>Elevación: {sun.elevationDeg.toFixed(1)}°</span>
              <span>·</span>
              <span>Sombra 1m: {Math.round(shadow1mCm)} cm</span>
            </div>
          </div>

          {/* Solar Hour Slider */}
          <div className="flex items-center gap-2">
            <label htmlFor="solar-hour-slider" className="w-28 font-medium text-slate-700">
              Hora Solar ({formatHourLabel(layout.solarConfig.hourOfDay)})
            </label>
            <input
              id="solar-hour-slider"
              aria-label="Hora Solar"
              type="range"
              min={6}
              max={20}
              step={0.5}
              value={layout.solarConfig.hourOfDay}
              onChange={(e) => onUpdateSolar({ hourOfDay: parseFloat(e.target.value) })}
              className="h-1.5 flex-1 cursor-pointer accent-amber-500"
            />
          </div>

          {/* Season Buttons */}
          <div className="flex items-center gap-1">
            {SEASON_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => onUpdateSolar({ season: s.value })}
                className={`flex-1 rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                  layout.solarConfig.season === s.value
                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* North Orientation & Template Presets */}
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
            <label className="flex items-center gap-1 text-slate-600 font-medium text-[11px]">
              <span>Orientación Norte</span>
              <input
                type="number"
                aria-label="Orientación Norte"
                min={0}
                max={359}
                step={15}
                value={layout.solarConfig.northAngleDeg}
                onChange={(e) =>
                  onUpdateSolar({ northAngleDeg: Number(e.target.value) || 0 })
                }
                className="w-14 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-right font-mono text-xs"
              />
              <span>°</span>
            </label>

            <div className="flex items-center gap-1">
              <label htmlFor="space-preset-select" className="text-[11px] font-medium text-slate-600">
                Plantilla 1:1
              </label>
              <select
                id="space-preset-select"
                aria-label="Plantilla 1:1"
                value={layout.presetId}
                onChange={(e) => onApplyPreset(e.target.value)}
                className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-800"
              >
                {Object.values(SPACE_PRESETS).map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 1:1 Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2 text-[11px] border border-slate-100">
            <div>
              <div className="text-slate-500">Área Total</div>
              <div className="font-mono font-bold text-slate-800">
                {regions.baseAreaM2.toFixed(1)} m²
              </div>
            </div>
            <div>
              <div className="text-slate-500">Tierra Cultivable</div>
              <div
                data-testid="metric-cultivable-area"
                className="font-mono font-bold text-emerald-700"
              >
                {regions.cultivableAreaM2.toFixed(1)} m² · {regions.cultivablePolygons.length} sectores
              </div>
            </div>
            <div>
              <div className="text-slate-500">Caminos/Veredas</div>
              <div
                data-testid="metric-walkable-area"
                className="font-mono font-bold text-slate-700"
              >
                {regions.walkableAreaM2.toFixed(1)} m²
              </div>
            </div>
          </div>

          {/* Nearest Plant Distances & Auto-populate */}
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-700">Distancias entre Plantas</span>
              {onFillFirstSector && (
                <button
                  type="button"
                  onClick={onFillFirstSector}
                  className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  Auto-poblar sector
                </button>
              )}
            </div>
            <ul className="max-h-24 space-y-1 overflow-y-auto text-[11px]">
              {plantRows.length === 0 ? (
                <li className="text-slate-400 italic">No hay plantas sembradas en este espacio</li>
              ) : (
                <>
                  {plantRows.map(({ plant, nearest }) => (
                    <li
                      key={plant.id}
                      className={`flex items-center justify-between rounded px-2 py-0.5 font-mono ${
                        nearest?.isCrowded
                          ? 'bg-red-50 text-red-800'
                          : 'bg-emerald-50/70 text-emerald-900'
                      }`}
                    >
                      {nearest ? (
                        <span>
                          {plant.label} ↔ {nearest.neighborLabel}: {nearest.distanceCm} cm
                          {nearest.isCrowded
                            ? ` (Solapamiento ${nearest.clearanceCm} cm)`
                            : ` (Holgura +${nearest.clearanceCm} cm)`}
                        </span>
                      ) : (
                        <span>{plant.label}: Sin vecinos cercanos</span>
                      )}
                    </li>
                  ))}
                  {layout.placedPlants.length > 30 && (
                    <li className="py-1 text-center text-[10px] text-slate-500 italic">
                      Mostrando 30 de {layout.placedPlants.length} plantas
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
