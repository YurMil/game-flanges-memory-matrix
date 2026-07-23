import Phaser from 'phaser';
import type { LayoutTokens } from '../layout/types';
import { THEME } from '../rendering/theme';

export interface AdaptiveButton {
  root: Phaser.GameObjects.Container;
  setLabel: (label: string) => void;
  layout: (x: number, y: number, tokens: LayoutTokens, stroke: string) => void;
  destroy: () => void;
}

/** Reusable menu/results button that reflows with layout tokens. */
export function createAdaptiveButton(
  scene: Phaser.Scene,
  label: string,
  strokeCss: string,
  onClick: () => void,
): AdaptiveButton {
  const g = scene.add.graphics();
  const text = scene.add
    .text(0, 0, label, {
      fontFamily: THEME.fontDisplay,
      fontSize: '18px',
      color: strokeCss,
      fontStyle: '700',
    })
    .setOrigin(0.5);

  const zone = scene.add.zone(0, 0, 10, 10).setInteractive({ useHandCursor: true });
  zone.on('pointerdown', onClick);
  zone.on('pointerover', () => text.setAlpha(0.75));
  zone.on('pointerout', () => text.setAlpha(1));

  const root = scene.add.container(0, 0, [g, text, zone]);

  const layout = (x: number, y: number, tokens: LayoutTokens, stroke: string): void => {
    text.setStyle({
      fontFamily: THEME.fontDisplay,
      fontSize: `${tokens.buttonSize}px`,
      color: stroke,
      fontStyle: '700',
    });
    text.setColor(stroke);

    const w = Math.max(
      tokens.minTouchTarget * 2.2,
      text.width + tokens.buttonPadX * 2,
    );
    const h = Math.max(tokens.minTouchTarget, text.height + tokens.buttonPadY * 2);

    g.clear();
    g.fillStyle(0x0b1218, 0.9);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    g.lineStyle(2, Phaser.Display.Color.HexStringToColor(stroke).color, 0.95);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

    zone.setSize(w, h);
    zone.setInteractive({ useHandCursor: true });
    root.setPosition(x, y);
  };

  return {
    root,
    setLabel: (next) => text.setText(next),
    layout,
    destroy: () => root.destroy(true),
  };
}
