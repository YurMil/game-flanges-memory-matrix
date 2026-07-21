import Phaser from 'phaser';
import type { LayoutTokens } from '../layout/types';
import { THEME } from './theme';

export interface VesselDrawOptions {
  timeMs?: number;
  vessel?: LayoutTokens['vessel'];
  /** Include moving scanline (default false — draw once, animate separately). */
  shimmer?: boolean;
}

const DEFAULT_VESSEL: LayoutTokens['vessel'] = {
  widthRatio: 0.86,
  heightRatio: 0.78,
  maxWidth: 920,
  maxHeight: 720,
  radius: 28,
  inset: 18,
  showPipes: true,
  rivetCount: 14,
};

/** Industrial vessel plate with rivets, pipes, and pressure atmosphere. */
export function drawVesselBackground(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  options: VesselDrawOptions | number = 0,
): void {
  const opts: VesselDrawOptions =
    typeof options === 'number' ? { timeMs: options, shimmer: true } : options;
  const vesselCfg = opts.vessel ?? DEFAULT_VESSEL;

  g.clear();

  g.fillStyle(THEME.bgDeep, 1);
  g.fillRect(0, 0, width, height);

  const cx = width * 0.5;
  const cy = height * 0.52;
  const vesselW = Math.min(width * vesselCfg.widthRatio, vesselCfg.maxWidth, width - 4);
  const vesselH = Math.min(height * vesselCfg.heightRatio, vesselCfg.maxHeight, height - 4);
  const radius = Math.min(vesselCfg.radius, vesselW * 0.08, vesselH * 0.08);

  g.fillStyle(0x1a3044, 0.35);
  g.fillEllipse(cx, cy, vesselW * 1.08, vesselH * 1.02);

  g.fillStyle(0x151d28, 1);
  g.fillRoundedRect(cx - vesselW / 2, cy - vesselH / 2, vesselW, vesselH, radius);
  g.lineStyle(Math.max(2, radius * 0.12), THEME.steelMid, 0.55);
  g.strokeRoundedRect(cx - vesselW / 2, cy - vesselH / 2, vesselW, vesselH, radius);

  const inset = Math.min(vesselCfg.inset, vesselW * 0.06);
  g.fillStyle(THEME.bgPanel, 0.92);
  g.fillRoundedRect(
    cx - vesselW / 2 + inset,
    cy - vesselH / 2 + inset,
    vesselW - inset * 2,
    vesselH - inset * 2,
    Math.max(8, radius - 6),
  );

  g.lineStyle(1.5, THEME.steelDark, 0.55);
  for (let i = 1; i < 4; i += 1) {
    const y = cy - vesselH / 2 + (vesselH * i) / 4;
    g.beginPath();
    g.moveTo(cx - vesselW / 2 + inset + 8, y);
    g.lineTo(cx + vesselW / 2 - inset - 8, y);
    g.strokePath();
  }

  const rivetR = Math.max(2.2, Math.min(3.2, vesselW * 0.008));
  g.fillStyle(THEME.steelMid, 0.85);
  const rivets = vesselCfg.rivetCount;
  for (let i = 0; i < rivets; i += 1) {
    const t = rivets === 1 ? 0.5 : i / (rivets - 1);
    const leftX = cx - vesselW / 2 + Math.max(6, inset * 0.55);
    const rightX = cx + vesselW / 2 - Math.max(6, inset * 0.55);
    const y = cy - vesselH / 2 + 18 + t * (vesselH - 36);
    g.fillCircle(leftX, y, rivetR);
    g.fillCircle(rightX, y, rivetR);
  }

  if (vesselCfg.showPipes) {
    drawPipe(g, cx - vesselW / 2 - 8, cy - 40, 40, 16, -1);
    drawPipe(g, cx + vesselW / 2 + 8, cy + 20, 40, 16, 1);
  }

  const mountW = Math.min(140, vesselW * 0.35);
  g.fillStyle(0x1c2733, 0.9);
  g.fillRoundedRect(cx - mountW / 2, cy - vesselH / 2 - 6, mountW, 18, 6);

  if (opts.shimmer) {
    drawShimmerScanline(g, width, height, opts.timeMs ?? 0);
  }
}

/** Cheap overlay — call on a dedicated Graphics each tick instead of redrawing the vessel. */
export function drawShimmerScanline(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  timeMs: number,
): void {
  g.clear();
  if (height <= 0) return;
  const shimmer = (timeMs / 40) % height;
  g.fillStyle(THEME.cyan, 0.035);
  g.fillRect(0, shimmer, width, 18);
}

function drawPipe(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  length: number,
  thickness: number,
  dir: 1 | -1,
): void {
  const x0 = dir < 0 ? x - length : x;
  g.fillStyle(THEME.steelDark, 1);
  g.fillRoundedRect(x0, y - thickness / 2, length, thickness, 4);
  g.lineStyle(1.5, THEME.steelLight, 0.4);
  g.strokeRoundedRect(x0, y - thickness / 2, length, thickness, 4);
  g.fillStyle(THEME.steelMid, 0.7);
  g.fillCircle(dir < 0 ? x0 : x0 + length, y, thickness * 0.55);
}

export function drawPressureGauge(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  pressure01: number,
  safe: boolean,
): void {
  g.clear();
  const p = Phaser.Math.Clamp(pressure01, 0, 1);

  g.fillStyle(0x0a1016, 0.95);
  g.fillCircle(x, y, radius);
  g.lineStyle(3, THEME.steelLight, 0.7);
  g.strokeCircle(x, y, radius);

  drawArc(g, x, y, radius * 0.78, -Math.PI * 0.75, -Math.PI * 0.15, THEME.green, 6);
  drawArc(g, x, y, radius * 0.78, -Math.PI * 0.15, Math.PI * 0.25, THEME.amber, 6);
  drawArc(g, x, y, radius * 0.78, Math.PI * 0.25, Math.PI * 0.75, THEME.red, 6);

  const angle = -Math.PI * 0.75 + p * Math.PI * 1.5;
  const nx = x + Math.cos(angle) * radius * 0.62;
  const ny = y + Math.sin(angle) * radius * 0.62;
  g.lineStyle(3, safe ? THEME.cyanSoft : THEME.redSoft, 1);
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(nx, ny);
  g.strokePath();

  g.fillStyle(THEME.steelBright, 1);
  g.fillCircle(x, y, 5);
  g.fillStyle(safe ? THEME.cyan : THEME.red, 0.35);
  g.fillCircle(x, y, radius * 0.95);
}

function drawArc(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  start: number,
  end: number,
  color: number,
  thickness: number,
): void {
  g.lineStyle(thickness, color, 0.85);
  g.beginPath();
  const steps = 14;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const a = start + (end - start) * t;
    const px = x + Math.cos(a) * radius;
    const py = y + Math.sin(a) * radius;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.strokePath();
}
