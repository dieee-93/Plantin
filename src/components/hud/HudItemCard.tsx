import React from 'react';
import { HudTooltip } from './HudTooltip';

export interface HudItemCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  badge?: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const HudItemCard: React.FC<HudItemCardProps> = ({
  title,
  subtitle,
  description,
  shortcut,
  icon,
  badge,
  isActive = false,
  disabled = false,
  onClick,
  className = '',
}) => {
  const content = (
    <button
      type="button"
      aria-label={title}
      aria-pressed={isActive}
      disabled={disabled}
      onClick={onClick}
      className={`group relative flex items-center gap-2 rounded-xl border p-2 text-left transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 w-full ${
        isActive
          ? 'border-emerald-600 bg-emerald-50/90 text-slate-900 shadow-sm ring-1 ring-emerald-500'
          : 'border-slate-200/80 bg-white/70 hover:bg-white text-slate-700 hover:text-slate-900 hover:shadow-xs'
      } ${className}`}
    >
      {icon && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-200">
          {icon}
        </div>
      )}

      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-xs font-bold text-slate-900">{title}</span>
          {badge && (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-emerald-800">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <span className="truncate text-[10px] text-slate-500 font-normal">
            {subtitle}
          </span>
        )}
      </div>
    </button>
  );

  if (description) {
    return (
      <HudTooltip title={badge || 'Detalles'} description={description} shortcut={shortcut} side="right">
        {content}
      </HudTooltip>
    );
  }

  return content;
};
