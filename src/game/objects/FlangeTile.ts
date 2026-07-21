import Phaser from 'phaser';
import type { FlangeVisualState } from '../../domain/types';
import { drawFlange } from '../rendering/drawFlange';

/** Scratch geometry object reused by every tile redraw. */
const GEO = {
  x: 0,
  y: 0,
  radius: 0,
  boltCount: 8,
  coverAngle: 0,
  openAmount: 0,
};

export class FlangeTile {
  readonly row: number;
  readonly col: number;
  readonly key: string;

  /** Public for hot pointer loops — avoid allocating getters. */
  cx: number;
  cy: number;
  radius: number;

  private container: Phaser.GameObjects.Container;
  private graphics: Phaser.GameObjects.Graphics;
  private hitZone: Phaser.GameObjects.Zone;
  private visualState: FlangeVisualState = 'closed';
  private openAmount = 0;
  private coverAngle = 0;
  private scene: Phaser.Scene;
  private lastDrawnOpen = -1;

  constructor(
    scene: Phaser.Scene,
    row: number,
    col: number,
    x: number,
    y: number,
    radius: number,
    onSelect: (tile: FlangeTile) => void,
    onHover: (tile: FlangeTile) => void,
  ) {
    this.scene = scene;
    this.row = row;
    this.col = col;
    this.key = `${row}:${col}`;
    this.cx = x;
    this.cy = y;
    this.radius = radius;

    this.graphics = scene.add.graphics();
    this.container = scene.add.container(x, y, [this.graphics]);
    this.hitZone = scene.add
      .zone(x, y, radius * 2.2, radius * 2.2)
      .setInteractive({ useHandCursor: true });

    this.hitZone.on('pointerdown', () => onSelect(this));
    this.hitZone.on('pointerover', () => onHover(this));
    this.redraw(true);
  }

  get state(): FlangeVisualState {
    return this.visualState;
  }

  setPosition(x: number, y: number, radius: number): void {
    const moved =
      Math.abs(x - this.cx) > 0.5 ||
      Math.abs(y - this.cy) > 0.5 ||
      Math.abs(radius - this.radius) > 0.5;
    if (!moved) return;

    this.cx = x;
    this.cy = y;
    this.radius = radius;
    this.container.setPosition(x, y);
    this.hitZone.setPosition(x, y);
    this.hitZone.setSize(radius * 2.2, radius * 2.2);
    this.redraw(true);
  }

  setVisualState(state: FlangeVisualState, animate = true): void {
    this.visualState = state;
    const targetOpen =
      state === 'preview' ||
      state === 'selected' ||
      state === 'correct' ||
      state === 'missed'
        ? 1
        : state === 'wrong'
          ? 0.35
          : 0;

    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.container);

    if (!animate) {
      this.openAmount = targetOpen;
      this.container.setScale(1);
      this.redraw(true);
      return;
    }

    this.scene.tweens.add({
      targets: this,
      openAmount: targetOpen,
      coverAngle: this.coverAngle + Math.PI * (0.35 + Math.random() * 0.4),
      duration: 280,
      ease: 'Back.easeOut',
      onUpdate: () => {
        if (Math.abs(this.openAmount - this.lastDrawnOpen) >= 0.045) {
          this.redraw(false);
        }
      },
      onComplete: () => this.redraw(true),
    });

    if (state === 'preview') {
      // Pulse via container scale around flange center — no drawFlange spam
      this.container.setScale(1);
      this.scene.tweens.add({
        targets: this.container,
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 420,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      this.container.setScale(1);
    }
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.container);
    this.container.destroy(true);
    this.hitZone.destroy();
  }

  private redraw(force: boolean): void {
    if (!force && Math.abs(this.openAmount - this.lastDrawnOpen) < 0.02) return;
    this.lastDrawnOpen = this.openAmount;

    // Draw in local container space so scale pulses around the flange center
    GEO.x = 0;
    GEO.y = 0;
    GEO.radius = this.radius;
    GEO.boltCount = this.radius > 26 ? 8 : 6;
    GEO.coverAngle = this.coverAngle;
    GEO.openAmount = this.openAmount;
    drawFlange(this.graphics, GEO, this.visualState);
  }
}
