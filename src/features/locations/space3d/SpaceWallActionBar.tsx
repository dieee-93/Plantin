import React from 'react';
import { CheckCheck, DoorClosed, Layers, LayoutGrid, Ruler, Shield, Trash2, X } from 'lucide-react';
import {
  findNextOpeningSlot,
  type WallMaterialType,
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
}

const HEIGHT_PRESETS = [
  { label: '0 cm (Abierto)', value: 0 },
  { label: '120 cm (Cerco)', value: 120 },
  { label: '200 cm (Medianera)', value: 200 },
  { label: '250 cm (Muro alto)', value: 250 },
];

const MATERIAL_OPTIONS: Array<{ value: WallMaterialType; label: string }> = [
  { value: 'brick', label: 'Ladrillo' },
  { value: 'concrete', label: 'Hormigón' },
  { value: 'wood_fence', label: 'Cerco Madera' },
  { value: 'wire_fence', label: 'Alambrado' },
  { value: 'polycarbonate', label: 'Policarbonato' },
  { value: 'glass_greenhouse', label: 'Vidrio' },
  { value: 'drywall', label: 'Drywall' },
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
      className="pointer-events-auto flex flex-col gap-2 rounded-2xl border border-sky-200/90 bg-white/95 p-3 text-xs shadow-2xl backdrop-blur-md min-w-[280px] max-w-[340px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
        <div className="flex items-center gap-1.5">
          <Shield size={14} className="text-sky-600" />
          <span className="font-bold text-slate-900">
            {wall.heightCm === 0 ? 'Límite Abierto' : 'Pared / Cerramiento'}
          </span>
          <span className="rounded-full bg-sky-50 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-800 border border-sky-200">
            {lengthM} m
          </span>
        </div>
        <button
          type="button"
          aria-label="Cerrar inspector de pared"
          onClick={onClose}
          className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <X size={13} />
        </button>
      </div>

      {/* Height presets */}
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1 font-semibold text-slate-600 text-[11px]">
          <Ruler size={12} />
          <span>Altura del Cerramiento:</span>
        </span>
        <div className="grid grid-cols-2 gap-1">
          {HEIGHT_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onUpdateHeight(preset.value)}
              className={`rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                wall.heightCm === preset.value
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Material selector */}
      {wall.heightCm > 0 && (
        <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
          <label className="flex items-center justify-between font-semibold text-slate-600 text-[11px]">
            <span className="flex items-center gap-1">
              <Layers size={12} />
              <span>Material:</span>
            </span>
            <select
              aria-label="Material de pared"
              value={wall.material}
              onChange={(e) => onUpdateMaterial(e.target.value as WallMaterialType)}
              className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-800"
            >
              {MATERIAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Wall Openings (Doors & Windows) */}
      {wall.heightCm > 0 && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between font-semibold text-slate-600 text-[11px]">
            <span className="flex items-center gap-1">
              <DoorClosed size={12} />
              <span>Aperturas / Vanos:</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {openings.length} {openings.length === 1 ? 'abertura' : 'aberturas'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              disabled={!doorSlot.canPlace}
              onClick={onAddDoor}
              className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-1 font-semibold text-[11px] transition ${
                !doorSlot.canPlace
                  ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
              title={
                doorSlot.canPlace
                  ? 'Añadir puerta estándar (90 × 210 cm)'
                  : doorSlot.reason ?? 'Sin espacio libre suficiente para una puerta'
              }
            >
              <DoorClosed size={12} className={doorSlot.canPlace ? 'text-amber-600' : 'text-slate-300'} />
              <span>+ Puerta</span>
            </button>

            <button
              type="button"
              disabled={!windowSlot.canPlace}
              onClick={onAddWindow}
              className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-1 font-semibold text-[11px] transition ${
                !windowSlot.canPlace
                  ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
              title={
                windowSlot.canPlace
                  ? 'Añadir ventana estándar (120 × 110 cm)'
                  : windowSlot.reason ?? 'Sin espacio libre suficiente para una ventana'
              }
            >
              <LayoutGrid size={12} className={windowSlot.canPlace ? 'text-sky-600' : 'text-slate-300'} />
              <span>+ Ventana</span>
            </button>
          </div>

          {/* List of existing openings on this wall */}
          {openings.length > 0 && (
            <div className="flex flex-col gap-1 mt-0.5">
              {openings.map((op, idx) => (
                <div
                  key={op.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1 border border-slate-100 text-[10px]"
                >
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    {op.kind === 'door' ? (
                      <DoorClosed size={11} className="text-amber-600" />
                    ) : (
                      <LayoutGrid size={11} className="text-sky-600" />
                    )}
                    <span>
                      {op.kind === 'door' ? 'Puerta' : 'Ventana'} {op.widthCm}×{op.heightCm} cm
                    </span>
                    <span className="font-mono text-slate-400">
                      (@ {op.offsetCm} cm)
                    </span>
                  </span>

                  {onRemoveOpening && (
                    <button
                      type="button"
                      aria-label={`Eliminar ${op.kind === 'door' ? 'puerta' : 'ventana'} ${idx + 1}`}
                      onClick={() => onRemoveOpening(op.id)}
                      className="text-slate-400 hover:text-red-600 transition"
                      title="Eliminar apertura"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions: Apply to all walls */}
      {onApplyToAllWalls && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-0.5">
          <button
            type="button"
            onClick={onApplyToAllWalls}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100 transition text-[11px]"
            title="Aplica esta misma altura y material a todos los lados del perímetro"
          >
            <CheckCheck size={13} className="text-emerald-600" />
            <span>Aplicar a todo el perímetro</span>
          </button>
        </div>
      )}
    </div>
  );
};
