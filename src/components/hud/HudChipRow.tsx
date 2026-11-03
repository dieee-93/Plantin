import React from 'react';
import { hudTokens } from './hudTokens';

export interface HudChipOption<T = string | number> {
  value: T;
  label: React.ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
}

export interface HudChipRowProps<T = string | number> {
  label?: string;
  options: Array<HudChipOption<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function HudChipRow<T extends string | number>({
  label,
  options,
  value,
  onChange,
  className = '',
}: HudChipRowProps<T>) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${className}`}>
      {label && (
        <span className="text-[11px] font-semibold text-slate-600 mr-1 whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="flex flex-wrap items-center gap-1">
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              disabled={opt.disabled}
              aria-label={opt.ariaLabel || (typeof opt.label === 'string' ? opt.label : undefined)}
              aria-pressed={isSelected}
              onClick={() => onChange(opt.value)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                isSelected
                  ? `${hudTokens.surfaces.active} shadow-xs`
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
