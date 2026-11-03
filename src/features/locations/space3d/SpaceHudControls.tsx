import React, { useState } from 'react';
import type { SpaceLayout1to1, SpaceSolarConfig } from '@/store/spaceLayoutStore';
import type { SpaceViewMode } from './SpaceSceneGraph';
import { SpaceCameraWidget } from './SpaceCameraWidget';
import { SpaceLensBar, type AnalyticalLensType } from './SpaceLensBar';

export interface SpaceHudControlsProps {
  layout: SpaceLayout1to1;
  viewMode: SpaceViewMode;
  cameraAzimuthDeg: number;
  onChangeViewMode: (mode: SpaceViewMode) => void;
  onRotateCamera: (deltaDeg: number) => void;
  onResetCameraNorth: () => void;
  onUpdateSolar: (partial: Partial<SpaceSolarConfig>) => void;
  onApplyPreset: (presetId: string) => void;
  onFillFirstSector?: () => void;
  zoomPercent?: number;
  minZoomPercent?: number;
  maxZoomPercent?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  showLabels?: boolean;
  onToggleShowLabels?: () => void;
}

export const SpaceHudControls: React.FC<SpaceHudControlsProps> = ({
  layout,
  viewMode,
  cameraAzimuthDeg,
  onChangeViewMode,
  onRotateCamera,
  onResetCameraNorth,
  onUpdateSolar,
  onApplyPreset,
  onFillFirstSector,
  zoomPercent = 75,
  minZoomPercent,
  maxZoomPercent,
  onZoomIn = () => {},
  onZoomOut = () => {},
  showLabels = true,
  onToggleShowLabels = () => {},
}) => {
  const [activeLens, setActiveLens] = useState<AnalyticalLensType | null>(null);
  const [speciesFilter, setSpeciesFilter] = useState<string | null>(null);

  return (
    <div className="pointer-events-none flex w-full flex-col justify-between gap-3 text-xs text-slate-800">
      {/* Top Bar: Lens and Solar Pills */}
      <div className="flex w-full items-start justify-end">
        <SpaceLensBar
          layout={layout}
          showLabels={showLabels}
          onToggleShowLabels={onToggleShowLabels}
          activeLens={activeLens}
          onSelectLens={setActiveLens}
          speciesFilter={speciesFilter}
          onSelectSpeciesFilter={setSpeciesFilter}
          onUpdateSolar={onUpdateSolar}
          onApplyPreset={onApplyPreset}
          onFillFirstSector={onFillFirstSector}
          defaultSolarOpen={true}
        />
      </div>

      {/* Bottom Bar: Camera Widget */}
      <div className="flex w-full items-end justify-end">
        <SpaceCameraWidget
          viewMode={viewMode}
          onChangeViewMode={onChangeViewMode}
          zoomPercent={zoomPercent}
          minZoomPercent={minZoomPercent}
          maxZoomPercent={maxZoomPercent}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onRotateCamera={onRotateCamera}
          onResetCameraNorth={onResetCameraNorth}
          cameraAzimuthDeg={cameraAzimuthDeg}
        />
      </div>
    </div>
  );
};
