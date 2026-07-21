import Phaser from 'phaser';
import { THEME } from '../rendering/theme';

const TICK_DIRS: ReadonlyArray<readonly [number, number]> = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];

/**
 * Floating industrial selection reticle.
 * Smoothly tracks pointer / touch / keyboard focus target.
 */
export class FocusCursor {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private x = 0;
  private y = 0;
  private r = 24;
  private targetX = 0;
  private targetY = 0;
  private targetR = 24;
  private visible = false;
  private pulse = 0;
  private snap = false;
  private dirty = true;
  private lastDrawX = Number.NaN;
  private lastDrawY = Number.NaN;
  private lastDrawR = Number.NaN;
  private lastPulseBucket = -1;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(40);
  }

  show(): void {
    this.visible = true;
    this.dirty = true;
  }

  hide(): void {
    this.visible = false;
    this.graphics.clear();
    this.lastDrawX = Number.NaN;
  }

  place(x: number, y: number, radius: number): void {
    this.x = x;
    this.y = y;
    this.r = radius * 1.28;
    this.targetX = x;
    this.targetY = y;
    this.targetR = this.r;
    this.snap = true;
    this.dirty = true;
    this.redraw(true);
  }

  moveTo(x: number, y: number, radius: number): void {
    this.targetX = x;
    this.targetY = y;
    this.targetR = radius * 1.28;
    this.snap = false;
    this.visible = true;
  }

  followPointer(x: number, y: number, radius: number): void {
    this.targetX = x;
    this.targetY = y;
    this.targetR = radius * 1.15;
    this.snap = false;
    this.visible = true;
  }

  get position(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  update(deltaMs: number): void {
    if (!this.visible) return;

    this.pulse = (this.pulse + deltaMs * 0.006) % (Math.PI * 2);

    if (this.snap) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.r = this.targetR;
      this.snap = false;
      this.dirty = true;
    } else {
      const k = 1 - Math.exp(-deltaMs * 0.018);
      const nx = this.x + (this.targetX - this.x) * k;
      const ny = this.y + (this.targetY - this.y) * k;
      const nr = this.r + (this.targetR - this.r) * k;
      if (
        Math.abs(nx - this.x) > 0.15 ||
        Math.abs(ny - this.y) > 0.15 ||
        Math.abs(nr - this.r) > 0.1
      ) {
        this.dirty = true;
      }
      this.x = nx;
      this.y = ny;
      this.r = nr;
    }

    this.redraw(false);
  }

  destroy(): void {
    this.graphics.destroy();
  }

  private redraw(force: boolean): void {
    if (!this.visible) return;

    const pulseBucket = (this.pulse * 8) | 0;
    const moved =
      force ||
      this.dirty ||
      pulseBucket !== this.lastPulseBucket ||
      Math.abs(this.x - this.lastDrawX) > 0.4 ||
      Math.abs(this.y - this.lastDrawY) > 0.4 ||
      Math.abs(this.r - this.lastDrawR) > 0.3;

    if (!moved) return;

    this.dirty = false;
    this.lastDrawX = this.x;
    this.lastDrawY = this.y;
    this.lastDrawR = this.r;
    this.lastPulseBucket = pulseBucket;

    const breathe = 1 + Math.sin(this.pulse) * 0.03;
    const rr = this.r * breathe;

    this.graphics.clear();
    this.graphics.fillStyle(THEME.cyan, 0.1);
    this.graphics.fillCircle(this.x, this.y, rr * 1.12);
    this.graphics.lineStyle(3.5, THEME.cyan, 0.95);
    this.graphics.strokeCircle(this.x, this.y, rr);
    this.graphics.lineStyle(1.5, THEME.cyanSoft, 0.7);
    this.graphics.strokeCircle(this.x, this.y, rr * 0.9);

    const tick = Math.max(5, rr * 0.12);
    this.graphics.lineStyle(2, THEME.cyanSoft, 0.95);
    for (let i = 0; i < TICK_DIRS.length; i += 1) {
      const dx = TICK_DIRS[i][0];
      const dy = TICK_DIRS[i][1];
      this.graphics.beginPath();
      this.graphics.moveTo(this.x + dx * (rr - tick), this.y + dy * (rr - tick));
      this.graphics.lineTo(
        this.x + dx * (rr + tick * 0.35),
        this.y + dy * (rr + tick * 0.35),
      );
      this.graphics.strokePath();
    }
  }
}
