import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpaceCameraWidget } from '../SpaceCameraWidget';

describe('SpaceCameraWidget - Bottom-Right Floating Camera Controls', () => {
  it('toggles 3D / 2D camera view, adjusts zoom, and rotates camera orientation', () => {
    const onChangeViewMode = vi.fn();
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onRotateCamera = vi.fn();
    const onResetCameraNorth = vi.fn();

    render(
      <SpaceCameraWidget
        viewMode="3d"
        onChangeViewMode={onChangeViewMode}
        zoomPercent={75}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onRotateCamera={onRotateCamera}
        onResetCameraNorth={onResetCameraNorth}
        cameraAzimuthDeg={45}
      />,
    );

    // 3D / 2D toggle
    const toggle2d = screen.getByRole('button', { name: /2D|Plano 2D/i });
    fireEvent.click(toggle2d);
    expect(onChangeViewMode).toHaveBeenCalledWith('2d');

    // Zoom buttons
    expect(screen.getByText('75%')).toBeInTheDocument();
    const zoomInBtn = screen.getByRole('button', { name: /Aumentar zoom/i });
    const zoomOutBtn = screen.getByRole('button', { name: /Disminuir zoom/i });
    fireEvent.click(zoomInBtn);
    expect(onZoomIn).toHaveBeenCalled();
    fireEvent.click(zoomOutBtn);
    expect(onZoomOut).toHaveBeenCalled();

    // Rotation buttons
    fireEvent.click(screen.getByRole('button', { name: '-45°' }));
    expect(onRotateCamera).toHaveBeenCalledWith(-45);

    fireEvent.click(screen.getByRole('button', { name: '+45°' }));
    expect(onRotateCamera).toHaveBeenCalledWith(45);

    fireEvent.click(screen.getByRole('button', { name: /Norte/i }));
    expect(onResetCameraNorth).toHaveBeenCalled();
  });

  it('disables zoom out button when minimum zoom (50%) is reached', () => {
    const onZoomOut = vi.fn();
    render(
      <SpaceCameraWidget
        viewMode="3d"
        onChangeViewMode={vi.fn()}
        zoomPercent={50}
        onZoomIn={vi.fn()}
        onZoomOut={onZoomOut}
        onRotateCamera={vi.fn()}
        onResetCameraNorth={vi.fn()}
        cameraAzimuthDeg={0}
      />,
    );

    const zoomOutBtn = screen.getByRole('button', { name: /Disminuir zoom/i });
    expect(zoomOutBtn).toBeDisabled();
    fireEvent.click(zoomOutBtn);
    expect(onZoomOut).not.toHaveBeenCalled();
  });

  it('disables zoom in button when maximum zoom (200%) is reached', () => {
    const onZoomIn = vi.fn();
    render(
      <SpaceCameraWidget
        viewMode="3d"
        onChangeViewMode={vi.fn()}
        zoomPercent={200}
        onZoomIn={onZoomIn}
        onZoomOut={vi.fn()}
        onRotateCamera={vi.fn()}
        onResetCameraNorth={vi.fn()}
        cameraAzimuthDeg={0}
      />,
    );

    const zoomInBtn = screen.getByRole('button', { name: /Aumentar zoom/i });
    expect(zoomInBtn).toBeDisabled();
    fireEvent.click(zoomInBtn);
    expect(onZoomIn).not.toHaveBeenCalled();
  });
});
