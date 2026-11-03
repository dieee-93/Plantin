import React from 'react';
import { hudTokens } from './hudTokens';

export interface HudStatusLineProps {
  icon?: React.ReactNode;
  message: React.ReactNode;
  tag?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const HudStatusLine: React.FC<HudStatusLineProps> = ({
  icon,
  message,
  tag,
  actions,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto flex items-center justify-between gap-2.5 ${hudTokens.surfaces.statusLine} ${hudTokens.radii.statusLine} px-3.5 py-1 text-xs text-slate-700 ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon && <span className="flex-shrink-0 text-slate-600">{icon}</span>}
        {tag && (
          <span className="flex-shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700 uppercase">
            {tag}
          </span>
        )}
        <div className="truncate text-slate-700 font-medium">
          {message}
        </div>
      </div>

      {actions && (
        <div className="flex-shrink-0 flex items-center gap-1.5 border-l border-slate-200/80 pl-2">
          {actions}
        </div>
      )}
    </div>
  );
};
