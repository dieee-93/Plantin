/**
 * HUD Design Tokens — Planet Zoo / Cities: Skylines 2 Inspired
 * Single source of truth for HUD surfaces, metrics, accents, and transitions.
 */

export const hudTokens = {
  surfaces: {
    base: 'bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl shadow-slate-900/5 text-slate-900',
    subtle: 'bg-white/70 hover:bg-white text-slate-700 hover:text-slate-900',
    hover: 'hover:bg-white/95',
    active: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500/50 shadow-xs',
    activeSolid: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/40',
    disabled: 'opacity-40 cursor-not-allowed text-slate-400 bg-white/40',
    tooltip: 'bg-white/95 text-slate-800 border border-slate-200/90 shadow-2xl backdrop-blur-md',
    statusLine: 'bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-md',
  },
  accents: {
    primary: 'emerald-600',
    primaryHover: 'emerald-700',
    ring: 'ring-emerald-500/40',
    subtleBg: 'bg-emerald-50',
    subtleText: 'text-emerald-700',
  },
  sizes: {
    buttonPx: 44,
    buttonClass: 'h-11 w-11 min-h-[44px] min-w-[44px]',
    iconPx: 20,
    iconClass: 'h-5 w-5',
    flyoutWidth: 'w-full max-w-4xl',
    flyoutMaxHeight: 'max-h-[32vh]',
  },
  radii: {
    rail: 'rounded-2xl',
    button: 'rounded-xl',
    flyout: 'rounded-2xl',
    statusLine: 'rounded-full',
    chip: 'rounded-full',
    tooltip: 'rounded-xl',
  },
  transitions: {
    fast: 'transition-all duration-150 ease-out',
    spring: 'transition-all duration-200 cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;

export type HudTokens = typeof hudTokens;
