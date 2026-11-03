import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { SPACE_PRESETS, useSpaceLayoutStore } from '@/store/spaceLayoutStore';
import { Space3DViewer } from '../Space3DViewer';

describe('Space3DViewer - Immersive Mode (Tab Toggle)', () => {
  const locationId = 'loc-immersive-test';

  beforeEach(() => {
    useSpaceLayoutStore.setState({
      layouts: {
        [locationId]: SPACE_PRESETS.patio_croquis.createLayout(locationId),
      },
    });
  });

  it('toggles HUD visibility when pressing Tab key and restores it via floating Eye button or second Tab', () => {
    render(
      <Space3DViewer
        locationId={locationId}
        locationName="Invernadero Inmersivo"
        locationType="indoor"
      />,
    );

    // Initial HUD elements present
    expect(screen.getByText('Invernadero Inmersivo')).toBeInTheDocument();
    expect(screen.getByTestId('hud-left-rail')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Plano 2D/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ Sembrar/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Salir de modo inmersivo/i })).not.toBeInTheDocument();

    // Press Tab key outside input
    fireEvent.keyDown(window, { key: 'Tab' });

    // All HUD elements should now be hidden
    expect(screen.queryByText('Invernadero Inmersivo')).not.toBeInTheDocument();
    expect(screen.queryByTestId('hud-left-rail')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Plano 2D/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\+ Sembrar/i })).not.toBeInTheDocument();

    // Floating Eye button appears with accessible label and Tab hint
    const exitBtn = screen.getByRole('button', { name: /Salir de modo inmersivo/i });
    expect(exitBtn).toBeInTheDocument();

    // Click floating button to restore HUD
    fireEvent.click(exitBtn);
    expect(screen.getByText('Invernadero Inmersivo')).toBeInTheDocument();
    expect(screen.getByTestId('hud-left-rail')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Salir de modo inmersivo/i })).not.toBeInTheDocument();

    // Press Tab again to re-hide, then press Tab once more to restore
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(screen.queryByTestId('hud-left-rail')).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Tab' });
    expect(screen.getByTestId('hud-left-rail')).toBeInTheDocument();
  });

  it('does NOT toggle immersive mode when focus is inside an input or textarea', () => {
    render(
      <div>
        <input data-testid="test-input" />
        <Space3DViewer
          locationId={locationId}
          locationName="Invernadero Input Test"
          locationType="indoor"
        />
      </div>,
    );

    const input = screen.getByTestId('test-input');
    input.focus();

    fireEvent.keyDown(window, { key: 'Tab' });

    // HUD remains visible
    expect(screen.getByText('Invernadero Input Test')).toBeInTheDocument();
    expect(screen.getByTestId('hud-left-rail')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Salir de modo inmersivo/i })).not.toBeInTheDocument();
  });

  it('does NOT toggle immersive mode when a modal dialog is open', () => {
    render(
      <div>
        <div role="dialog" aria-modal="true">Modal Dialog Content</div>
        <Space3DViewer
          locationId={locationId}
          locationName="Invernadero Modal Test"
          locationType="indoor"
        />
      </div>,
    );

    fireEvent.keyDown(window, { key: 'Tab' });

    expect(screen.getByText('Invernadero Modal Test')).toBeInTheDocument();
    expect(screen.getByTestId('hud-left-rail')).toBeInTheDocument();
  });
});
