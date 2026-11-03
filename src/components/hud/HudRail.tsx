import React from 'react';
import { hudTokens } from './hudTokens';

export interface HudRailProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal';
  children: React.ReactNode;
}

export const HudRail: React.FC<HudRailProps> = ({
  orientation = 'vertical',
  children,
  className = '',
  ...props
}) => {
  const isVertical = orientation === 'vertical';

  return (
    <div
      role="toolbar"
      aria-orientation={orientation}
      className={`pointer-events-auto flex ${
        isVertical ? 'flex-col' : 'flex-row'
      } items-center gap-1.5 ${hudTokens.surfaces.base} ${
        hudTokens.radii.rail
      } p-1.5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface HudRailDividerProps {
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export const HudRailDivider: React.FC<HudRailDividerProps> = ({
  orientation = 'vertical',
  className = '',
}) => {
  const isVertical = orientation === 'vertical';
  return (
    <div
      role="separator"
      className={`${
        isVertical ? 'my-1 h-px w-6' : 'mx-1 h-6 w-px'
      } bg-slate-200/80 self-center ${className}`}
    />
  );
};
