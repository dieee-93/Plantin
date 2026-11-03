import React, { useId, useState } from 'react';
import { hudTokens } from './hudTokens';

export interface HudTooltipProps {
  title: string;
  description?: string;
  shortcut?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  disabled?: boolean;
  children: React.ReactNode;
}

export const HudTooltip: React.FC<HudTooltipProps> = ({
  title,
  description,
  shortcut,
  side = 'right',
  disabled = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipId = useId();

  if (disabled) {
    return <>{children}</>;
  }

  const sideClasses = {
    right: 'left-full ml-3 top-1/2 -translate-y-1/2',
    left: 'right-full mr-3 top-1/2 -translate-y-1/2',
    top: 'bottom-full mb-3 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-3 left-1/2 -translate-x-1/2',
  }[side];

  return (
    <div
      className="relative inline-flex items-center group/hud-tooltip"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children}

      <div
        id={tooltipId}
        role="tooltip"
        className={`pointer-events-none absolute ${sideClasses} z-50 w-max max-w-[240px] min-w-[150px] ${hudTokens.surfaces.tooltip} ${hudTokens.radii.tooltip} p-2.5 text-xs transition-all duration-150 ease-out ${
          isOpen
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-slate-900 tracking-tight">{title}</span>
          {shortcut && (
            <kbd className="rounded border border-slate-200/90 bg-slate-100/90 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 shadow-2xs">
              {shortcut}
            </kbd>
          )}
        </div>
        {description && (
          <p className="mt-1 text-[11px] leading-snug text-slate-600 font-normal">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
