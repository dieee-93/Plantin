import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SPACE_PRESETS } from '@/store/spaceLayoutStore';
import { SpaceHudControls } from '../SpaceHudControls';

describe('SpaceHudControls - Slice 3: Dual Camera, Solar Simulator, Presets & 1:1 Metrics HUD', () => {
  it('renders 1:1 space metrics (60 m2 total, 3 cultivable sectors) and nearest neighbor plant distances with overlap warning', () => {
    const layout = SPACE_PRESETS.patio_croquis.createLayout('loc-hud-1');

    render(
      <SpaceHudControls
        layout={layout}
        viewMode="3d"
        cameraAzimuthDeg={0}
        onChangeViewMode={vi.fn()}
        onRotateCamera={vi.fn()}
        onResetCameraNorth={vi.fn()}
        onUpdateSolar={vi.fn()}
        onApplyPreset={vi.fn()}
      />,
    );

    // Metrics panel
    expect(screen.getByText(/60(\.0)?\s*m²/i)).toBeInTheDocument();
    expect(screen.getByText(/3\s*sectores/i)).toBeInTheDocument();

    // Plant distances: Tomatera <-> Morrón at 45 cm (Solapamiento -5 cm) and Lechuga at 120 cm
    expect(
      screen.getByText(/Tomatera\s*↔\s*Morrón:\s*45\s*cm\s*\(Solapamiento\s*-5\s*cm\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Lechuga\s*↔\s*Tomatera:\s*120\s*cm/i)).toBeInTheDocument();
  });

  it('toggles dual camera (Plano 2D (CAD) / Vista 3D Isométrica), rotates camera (-45°, +45°, Norte), and updates northAngleDeg', () => {
    const layout = SPACE_PRESETS.patio_croquis.createLayout('loc-hud-2');
    const onChangeViewMode = vi.fn();
    const onRotateCamera = vi.fn();
    const onResetCameraNorth = vi.fn();
    const onUpdateSolar = vi.fn();

    render(
      <SpaceHudControls
        layout={layout}
        viewMode="3d"
        cameraAzimuthDeg={45}
        onChangeViewMode={onChangeViewMode}
        onRotateCamera={onRotateCamera}
        onResetCameraNorth={onResetCameraNorth}
        onUpdateSolar={onUpdateSolar}
        onApplyPreset={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Plano 2D \(CAD\)/i }));
    expect(onChangeViewMode).toHaveBeenCalledWith('2d');

    fireEvent.click(screen.getByRole('button', { name: /Vista 3D Isométrica/i }));
    expect(onChangeViewMode).toHaveBeenCalledWith('3d');

    fireEvent.click(screen.getByRole('button', { name: '-45°' }));
    expect(onRotateCamera).toHaveBeenCalledWith(-45);

    fireEvent.click(screen.getByRole('button', { name: '+45°' }));
    expect(onRotateCamera).toHaveBeenCalledWith(45);

    fireEvent.click(screen.getByRole('button', { name: /Norte/i }));
    expect(onResetCameraNorth).toHaveBeenCalled();

    const northInput = screen.getByLabelText(/Orientación Norte/i);
    fireEvent.change(northInput, { target: { value: '90' } });
    expect(onUpdateSolar).toHaveBeenCalledWith({ northAngleDeg: 90 });
  });

  it('controls live solar simulator (hour slider 06:00-20:00, season buttons Verano/Otoño/Invierno/Primavera, solar elevation & 1m shadow length) and switches 1:1 preset', () => {
    const layout = SPACE_PRESETS.patio_croquis.createLayout('loc-hud-3');
    const onUpdateSolar = vi.fn();
    const onApplyPreset = vi.fn();

    render(
      <SpaceHudControls
        layout={layout}
        viewMode="3d"
        cameraAzimuthDeg={0}
        onChangeViewMode={vi.fn()}
        onRotateCamera={vi.fn()}
        onResetCameraNorth={vi.fn()}
        onUpdateSolar={onUpdateSolar}
        onApplyPreset={onApplyPreset}
      />,
    );

    // Displays solar elevation (°) and shadow of 1m object (cm)
    // At summer noon (-34.6°), elevation is ~78.8° and 100cm shadow is ~19.7 - 20 cm
    expect(screen.getByText(/78\.8°/)).toBeInTheDocument();
    expect(screen.getByText(/Sombra 1m:\s*20\s*cm/i)).toBeInTheDocument();

    // Hour slider
    const hourSlider = screen.getByLabelText(/Hora Solar/i);
    fireEvent.change(hourSlider, { target: { value: '16.5' } });
    expect(onUpdateSolar).toHaveBeenCalledWith({ hourOfDay: 16.5 });

    // Season buttons
    fireEvent.click(screen.getByRole('button', { name: 'Invierno' }));
    expect(onUpdateSolar).toHaveBeenCalledWith({ season: 'winter' });

    fireEvent.click(screen.getByRole('button', { name: 'Otoño' }));
    expect(onUpdateSolar).toHaveBeenCalledWith({ season: 'autumn' });

    fireEvent.click(screen.getByRole('button', { name: 'Primavera' }));
    expect(onUpdateSolar).toHaveBeenCalledWith({ season: 'spring' });

    fireEvent.click(screen.getByRole('button', { name: 'Verano' }));
    expect(onUpdateSolar).toHaveBeenCalledWith({ season: 'summer' });

    // Preset selector
    const presetSelect = screen.getByLabelText(/Plantilla 1:1/i);
    fireEvent.change(presetSelect, { target: { value: 'greenhouse_1to1' } });
    expect(onApplyPreset).toHaveBeenCalledWith('greenhouse_1to1');
  });
});
