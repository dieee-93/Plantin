import React from 'react';
import { X } from 'lucide-react';
import { hudTokens } from './hudTokens';

export interface HudFlyoutProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onClose?: () => void;
  closeAriaLabel?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

export const HudFlyout: React.FC<HudFlyoutProps> = ({
  icon,
  title,
  subtitle,
  onClose,
  closeAriaLabel = 'Cerrar panel',
  headerActions,
  children,
  className = '',
  footer,
}) => {
  return (
    <div
      role="region"
      aria-label={title}
      className={`pointer-events-auto flex flex-col ${hudTokens.surfaces.base} ${hudTokens.radii.flyout} ${hudTokens.sizes.flyoutWidth} ${hudTokens.sizes.flyoutMaxHeight} overflow-hidden p-3 shadow-2xl backdrop-blur-md ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-50/90 -mx-3 -mt-3 px-3.5 py-2 mb-2.5 border-b border-slate-200/80">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="truncate text-xs font-bold text-slate-900 leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="truncate text-[10px] text-slate-500 font-normal">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {headerActions}
          {onClose && (
            <button
              type="button"
              aria-label={closeAriaLabel}
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
        {children}
      </div>

      {/* Optional Footer */}
      {footer && (
        <div className="mt-2 border-t border-slate-200/80 pt-2">
          {footer}
        </div>
      )}
    </div>
  );
};
