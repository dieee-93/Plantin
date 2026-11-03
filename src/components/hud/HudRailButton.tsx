import React from 'react';
import { hudTokens } from './hudTokens';
import { HudTooltip } from './HudTooltip';

export interface HudRailButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  title: string;
  description?: string;
  shortcut?: string;
  isActive?: boolean;
  variant?: 'subtle' | 'solid';
  side?: 'top' | 'right' | 'bottom' | 'left';
  badge?: string | number;
}

export const HudRailButton = React.forwardRef<HTMLButtonElement, HudRailButtonProps>(
  (
    {
      icon,
      title,
      description,
      shortcut,
      isActive = false,
      variant = 'subtle',
      side = 'right',
      badge,
      disabled = false,
      className = '',
      onClick,
      ...buttonProps
    },
    ref,
  ) => {
    const ariaLabel = buttonProps['aria-label'] || title;

    const activeClasses =
      variant === 'solid'
        ? hudTokens.surfaces.activeSolid
        : hudTokens.surfaces.active;

    const stateClasses = disabled
      ? hudTokens.surfaces.disabled
      : isActive
        ? activeClasses
        : hudTokens.surfaces.subtle;

    return (
      <HudTooltip
        title={title}
        description={description}
        shortcut={shortcut}
        side={side}
        disabled={disabled && !title}
      >
        <button
          ref={ref}
          type="button"
          aria-label={ariaLabel}
          aria-pressed={isActive}
          disabled={disabled}
          onClick={onClick}
          className={`relative flex ${hudTokens.sizes.buttonClass} items-center justify-center ${hudTokens.radii.button} ${hudTokens.transitions.fast} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 cursor-pointer disabled:cursor-not-allowed ${stateClasses} ${className}`}
          {...buttonProps}
        >
          <span className="flex items-center justify-center">
            {icon}
          </span>
          <span className="sr-only">{title}</span>

          {badge !== undefined && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 font-mono text-[9px] font-bold text-white shadow-xs">
              {badge}
            </span>
          )}
        </button>
      </HudTooltip>
    );
  },
);

HudRailButton.displayName = 'HudRailButton';
