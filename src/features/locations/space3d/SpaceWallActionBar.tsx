import React from 'react';
import {
  CheckCheck,
  DoorClosed,
  Layers,
  LayoutGrid,
  Ruler,
  Shield,
  Sliders,
  Trash2,
  X,
} from 'lucide-react';
import {
  findNextOpeningSlot,
  type WallMaterialType,
  type WallOpeningCm,
  type WallSegmentCm,
} from '@/domain/spaceGeometry';

export interface SpaceWallActionBarProps {
  wall: WallSegmentCm;
  onClose: () => void;
  onUpdateHeight: (heightCm: number) => void;
  onUpdateMaterial: (material: WallMaterialType) => void;
  onApplyToAllWalls?: () => void;
  onDeleteWall?: () => void;
  onAddDoor?: () => void;
  onAddWindow?: () => void;
  onRemoveOpening?: (openingId: string) => void;
  onUpdateOpening?: (openingId: string, partial: Partial<Omit<WallOpeningCm, 'id'>>) => void;
}

const HEIGHT_PRESETS = [
  { label: '0 cm (Abierto)', value: 0 },
  { label: '120 cm (Cerco)', value: 120 },
  { label: '200 cm (Medianera)', value: 200 },
  { label: '250 cm (Pared)', value: 250 },
];

const MATERIAL_SWATCHES: Array<{
  value: WallMaterialType;
  label: string;
  iconText: string;
  colorClass: string;
}> = [
  { value: 'brick', label: 'Ladrillo', iconText: '🧱', colorClass: 'border-red-300 text-red-900 bg-red-50/50' },
  { value: 'wood_fence', label: 'Madera', iconText: '🪵', colorClass: 'border-amber-300 text-amber-900 bg-amber-50/50' },
  { value: 'wire_fence', label: 'Alambrado', iconText: '⛓️', colorClass: 'border-slate-300 text-slate-800 bg-slate-50/50' },
  { value: 'concrete', label: 'Hormigón', iconText: '🏗️', colorClass: 'border-slate-300 text-slate-900 bg-slate-100/50' },
  { value: 'drywall', label: 'Mampostería', iconText: '⬜', colorClass: 'border-zinc-300 text-zinc-900 bg-zinc-50/50' },
  { value: 'glass_greenhouse', label: 'Vidrio', iconText: '🪟', colorClass: 'border-sky-300 text-sky-900 bg-sky-50/50' },
];

export const SpaceWallActionBar: React.FC<SpaceWallActionBarProps> = ({
  wall,
  onClose,
  onUpdateHeight,
  onUpdateMaterial,
  onApplyToAllWalls,
  onAddDoor,
  onAddWindow,
  onRemoveOpening,
  onUpdateOpening,
}) => {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const lengthCm = Math.round(Math.hypot(dx, dy));
  const lengthM = (lengthCm / 100).toFixed(2);
  const openings = wall.openings ?? [];
  const doorSlot = findNextOpeningSlot(lengthCm, 90, openings);
  const windowSlot = findNextOpeningSlot(lengthCm, 120, openings);

  return (
    <div
      data-testid="selected-wall-inspector"
      className="pointer-events-auto flex flex-col gap-3 rounded-3xl border border-sky-200/90 bg-white/95 p-3.5 text-xs shadow-2xl backdrop-blur-xl min-w-[300px] max-w-[360px] animate-in fade-in zoom-in-95 duration-200"
    >
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Shield size={15} />
          </div>
          <div>
            <span className="font-bold text-slate-900 block leading-tight">
              {wall.heightCm === 0 ? 'Límite Abierto' : 'Pared / Cerramiento'}
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              ID: {wall.id.slice(0, 8)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-sky-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-sky-800 border border-sky-200">
            {lengthM} m
          </span>
          <button
            type="button"
            aria-label="Cerrar inspector de pared"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Height Controls (Slider + Snap Presets) ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 font-semibold text-slate-700 text-[11px]">
            <Ruler size={12} className="text-sky-600" />
            <span>Altura del Muro:</span>
          </span>
          <span className="font-mono font-bold text-sky-800 text-[11px]">
            {(wall.heightCm / 100).toFixed(2)} m
          </span>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          aria-label="Altura de pared"
          min="0"
          max="300"
          step="10"
          value={wall.heightCm}
          onChange={(e) => onUpdateHeight(parseInt(e.target.value, 10))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-sky-100 accent-sky-600"
        />

        {/* Height Quick Presets */}
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {HEIGHT_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onUpdateHeight(preset.value)}
              className={`rounded-lg py-1 px-1.5 text-center text-[10px] font-semibold transition ${
                wall.heightCm === preset.value
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Visual Material Swatches ── */}
      {wall.heightCm > 0 && (
        <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 font-semibold text-slate-700 text-[11px]">
              <Layers size={12} className="text-sky-600" />
              <span>Material PBR:</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium capitalize">
              {wall.material.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {MATERIAL_SWATCHES.map((swatch) => {
              const isSelected = wall.material === swatch.value;
              return (
                <button
                  key={swatch.value}
                  type="button"
                  aria-label={`Material ${swatch.label}`}
                  onClick={() => onUpdateMaterial(swatch.value)}
                  className={`flex items-center gap-1.5 rounded-xl border p-1.5 text-left transition ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/70 font-bold text-sky-900 shadow-xs ring-2 ring-sky-300'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-sm">{swatch.iconText}</span>
                  <span className="text-[10px] truncate leading-none">{swatch.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Wall Openings (Doors & Windows) ── */}
      {wall.heightCm > 0 && (
        <div className="flex flex-col gap-2 pt-1.5 border-t border-slate-100">
          <div className="flex items-center justify-between font-semibold text-slate-700 text-[11px]">
            <span className="flex items-center gap-1">
              <DoorClosed size={12} className="text-amber-600" />
              <span>Aberturas & Carpinterías:</span>
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              {openings.length} {openings.length === 1 ? 'abertura' : 'aberturas'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              disabled={!doorSlot.canPlace}
              onClick={onAddDoor}
              className={`flex items-center justify-center gap-1.5 rounded-xl border p-1.5 font-semibold text-[11px] transition ${
                !doorSlot.canPlace
                  ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 bg-amber-50/40 text-amber-900 hover:bg-amber-100/60'
              }`}
              title={
                doorSlot.canPlace
                  ? 'Añadir puerta estándar (90 × 210 cm)'
                  : doorSlot.reason ?? 'Sin espacio libre suficiente para una puerta'
              }
            >
              <DoorClosed size={13} className={doorSlot.canPlace ? 'text-amber-600' : 'text-slate-300'} />
              <span>+ Puerta (90 cm)</span>
            </button>

            <button
              type="button"
              disabled={!windowSlot.canPlace}
              onClick={onAddWindow}
              className={`flex items-center justify-center gap-1.5 rounded-xl border p-1.5 font-semibold text-[11px] transition ${
                !windowSlot.canPlace
                  ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 bg-sky-50/40 text-sky-900 hover:bg-sky-100/60'
              }`}
              title={
                windowSlot.canPlace
                  ? 'Añadir ventana estándar (120 × 110 cm)'
                  : windowSlot.reason ?? 'Sin espacio libre suficiente para una ventana'
              }
            >
              <LayoutGrid size={13} className={windowSlot.canPlace ? 'text-sky-600' : 'text-slate-300'} />
              <span>+ Ventana (120 cm)</span>
            </button>
          </div>

          {/* List of existing openings on this wall with track slider */}
          {openings.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              {openings.map((op, idx) => {
                const maxOffset = Math.max(10, lengthCm - op.widthCm - 10);
                return (
                  <div
                    key={op.id}
                    className="flex flex-col gap-1.5 rounded-xl bg-slate-50/80 p-2 border border-slate-200/80 text-[10px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 font-bold text-slate-800">
                        {op.kind === 'door' ? (
                          <DoorClosed size={12} className="text-amber-600" />
                        ) : (
                          <LayoutGrid size={12} className="text-sky-600" />
                        )}
                        <span>
                          {op.kind === 'door' ? 'Puerta' : 'Ventana'} #{idx + 1} ({op.widthCm}×{op.heightCm} cm)
                        </span>
                      </span>

                      {onRemoveOpening && (
                        <button
                          type="button"
                          aria-label={`Eliminar ${op.kind === 'door' ? 'puerta' : 'ventana'} ${idx + 1}`}
                          onClick={() => onRemoveOpening(op.id)}
                          className="flex h-5 w-5 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                          title="Eliminar apertura"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>

                    {/* Position along wall track */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between text-slate-500 font-mono text-[9px]">
                        <span className="flex items-center gap-0.5">
                          <Sliders size={9} />
                          <span>Posición en muro:</span>
                        </span>
                        <span className="font-bold text-slate-700">
                          {(op.offsetCm / 100).toFixed(2)} m
                        </span>
                      </div>
                      <input
                        type="range"
                        aria-label={`Posición de ${op.kind === 'door' ? 'puerta' : 'ventana'} ${idx + 1}`}
                        min="10"
                        max={maxOffset}
                        step="5"
                        value={op.offsetCm}
                        disabled={!onUpdateOpening}
                        onChange={(e) => {
                          if (onUpdateOpening) {
                            onUpdateOpening(op.id, {
                              offsetCm: parseInt(e.target.value, 10),
                            });
                          }
                        }}
                        className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-sky-600"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Actions: Apply to all walls ── */}
      {onApplyToAllWalls && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-0.5">
          <button
            type="button"
            onClick={onApplyToAllWalls}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50/50 py-1.5 px-3 font-semibold text-sky-800 hover:bg-sky-100/70 transition text-[11px]"
            title="Aplica esta misma altura y material a todos los lados del perímetro"
          >
            <CheckCheck size={13} className="text-sky-600" />
            <span>Aplicar a todo el perímetro</span>
          </button>
        </div>
      )}
    </div>
  );
};
