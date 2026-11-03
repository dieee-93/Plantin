import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  HudChipRow,
  HudFlyout,
  HudItemCard,
  HudRail,
  HudRailButton,
  HudRailDivider,
  HudStatusLine,
  hudTokens,
  HudTooltip,
} from '../index';

describe('HUD Primitives — Planet Zoo / Cities: Skylines 2 Inspired', () => {
  describe('hudTokens', () => {
    it('defines standard surfaces, 44px button sizes, and emerald accents', () => {
      expect(hudTokens.sizes.buttonPx).toBe(44);
      expect(hudTokens.sizes.buttonClass).toContain('h-11 w-11');
      expect(hudTokens.surfaces.base).toContain('backdrop-blur');
      expect(hudTokens.surfaces.active).toContain('bg-emerald-50');
      expect(hudTokens.surfaces.activeSolid).toContain('bg-emerald-600');
    });
  });

  describe('HudTooltip', () => {
    it('shows tooltip title, description, and shortcut on hover and focus', () => {
      render(
        <HudTooltip
          title="Trazar Camino"
          description="Diseña senderos 1:1"
          shortcut="C"
          side="right"
        >
          <button type="button">Trigger</button>
        </HudTooltip>,
      );

      const trigger = screen.getByRole('button', { name: 'Trigger' });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      expect(screen.getByText('Trazar Camino')).toBeInTheDocument();
      expect(screen.getByText('Diseña senderos 1:1')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();

      // Trigger hover / focus
      fireEvent.mouseEnter(trigger.parentElement!);
      fireEvent.focus(trigger.parentElement!);
      fireEvent.mouseLeave(trigger.parentElement!);
    });

    it('bypasses tooltip container when disabled is true', () => {
      render(
        <HudTooltip title="Disabled Tooltip" disabled>
          <button type="button">Plain Button</button>
        </HudTooltip>,
      );

      expect(screen.getByRole('button', { name: 'Plain Button' })).toBeInTheDocument();
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('HudRailButton', () => {
    it('renders 44px accessible icon button with aria-label, aria-pressed, and handles clicks', () => {
      const onClick = vi.fn();
      render(
        <HudRailButton
          icon={<span data-testid="icon-mock">ICON</span>}
          title="Muros"
          description="Cerramientos y paredes"
          shortcut="M"
          isActive={true}
          onClick={onClick}
        />,
      );

      const btn = screen.getByRole('button', { name: 'Muros' });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveAttribute('aria-pressed', 'true');
      expect(btn.className).toContain('h-11');
      expect(btn.className).toContain('w-11');
      expect(btn.className).toContain('bg-emerald-50');

      fireEvent.click(btn);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('supports solid variant for active tool in rail', () => {
      render(
        <HudRailButton
          icon={<span>TOOL</span>}
          title="Herramienta Sólida"
          isActive={true}
          variant="solid"
        />,
      );

      const btn = screen.getByRole('button', { name: 'Herramienta Sólida' });
      expect(btn.className).toContain('bg-emerald-600');
      expect(btn.className).toContain('text-white');
    });

    it('respects disabled state and prevents click execution', () => {
      const onClick = vi.fn();
      render(
        <HudRailButton
          icon={<span>UNDO</span>}
          title="Deshacer"
          disabled={true}
          onClick={onClick}
        />,
      );

      const btn = screen.getByRole('button', { name: 'Deshacer' });
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('renders badge counter when provided', () => {
      render(
        <HudRailButton
          icon={<span>ROUTE</span>}
          title="Caminos"
          badge={3}
        />,
      );

      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('HudRail and HudRailDivider', () => {
    it('renders toolbar container with vertical orientation and divider', () => {
      render(
        <HudRail orientation="vertical" data-testid="test-rail">
          <HudRailButton icon={<span>1</span>} title="Tool 1" />
          <HudRailDivider orientation="vertical" />
          <HudRailButton icon={<span>2</span>} title="Tool 2" />
        </HudRail>,
      );

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('aria-orientation', 'vertical');
      expect(screen.getByRole('separator')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Tool 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Tool 2' })).toBeInTheDocument();
    });
  });

  describe('HudStatusLine', () => {
    it('renders single fine status line with tag, message, and contextual actions', () => {
      const onAction = vi.fn();
      render(
        <HudStatusLine
          tag="Camino"
          message="Clic en dos puntos para trazar"
          actions={
            <button type="button" onClick={onAction}>
              100 cm
            </button>
          }
        />,
      );

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
      expect(screen.getByText('Camino')).toBeInTheDocument();
      expect(screen.getByText('Clic en dos puntos para trazar')).toBeInTheDocument();

      const actionBtn = screen.getByRole('button', { name: '100 cm' });
      fireEvent.click(actionBtn);
      expect(onAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('HudChipRow', () => {
    it('renders row of chips and calls onChange on selection', () => {
      const onChange = vi.fn();
      render(
        <HudChipRow
          label="Ancho:"
          value={80}
          options={[
            { value: 60, label: '60 cm' },
            { value: 80, label: '80 cm' },
            { value: 100, label: '100 cm' },
          ]}
          onChange={onChange}
        />,
      );

      expect(screen.getByText('Ancho:')).toBeInTheDocument();
      const chip80 = screen.getByRole('button', { name: '80 cm' });
      expect(chip80).toHaveAttribute('aria-pressed', 'true');

      const chip100 = screen.getByRole('button', { name: '100 cm' });
      fireEvent.click(chip100);
      expect(onChange).toHaveBeenCalledWith(100);
    });
  });

  describe('HudFlyout', () => {
    it('renders anchored compact flyout with header, title, close button and children', () => {
      const onClose = vi.fn();
      render(
        <HudFlyout
          title="Arquitectura de Cubierta"
          subtitle="Invernaderos y pérgolas"
          onClose={onClose}
        >
          <div data-testid="flyout-body">Contenido de prueba</div>
        </HudFlyout>,
      );

      expect(screen.getByRole('region', { name: 'Arquitectura de Cubierta' })).toBeInTheDocument();
      expect(screen.getByText('Arquitectura de Cubierta')).toBeInTheDocument();
      expect(screen.getByText('Invernaderos y pérgolas')).toBeInTheDocument();
      expect(screen.getByTestId('flyout-body')).toBeInTheDocument();

      const closeBtn = screen.getByRole('button', { name: 'Cerrar panel' });
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('HudItemCard', () => {
    it('renders compact item card with title, subtitle, badge, and handles selection', () => {
      const onClick = vi.fn();
      render(
        <HudItemCard
          title="Tomatera Criolla"
          subtitle="Solanum lycopersicum"
          badge="Hortaliza"
          isActive={true}
          onClick={onClick}
        />,
      );

      const card = screen.getByRole('button', { name: 'Tomatera Criolla' });
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('Solanum lycopersicum')).toBeInTheDocument();
      expect(screen.getByText('Hortaliza')).toBeInTheDocument();

      fireEvent.click(card);
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
