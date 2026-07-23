import Phaser from 'phaser';
import type { FlangeVisualState } from '../../domain/types';
import { THEME } from './theme';

export interface FlangeGeometry {
  x: number;
  y: number;
  radius: number;
  boltCount: number;
  coverAngle: number;
  openAmount: number;
}

/** Reused across draws to avoid per-frame allocations. */
const HEX_SCRATCH: Array<{ x: number; y: number }> = [
  { x: 0, y: 0 },
  { x: 0, y: 0 },
  { x: 0, y: 0 },
  { x: 0, y: 0 },
  { x: 0, y: 0 },
  { x: 0, y: 0 },
];

const BOLT_CACHE = new Map<string, Array<{ x: number; y: number; a: number }>>();

function boltPositions(radius: number, count: number): Array<{ x: number; y: number; a: number }> {
  // Bucket radius to keep cache small and stable across tiny reflows
  const bucket = Math.round(radius * 2) / 2;
  const key = `${count}:${bucket}`;
  const hit = BOLT_CACHE.get(key);
  if (hit) return hit;

  const ring = bucket * 0.78;
  const out: Array<{ x: number; y: number; a: number }> = [];
  for (let i = 0; i < count; i += 1) {
    const a = (Math.PI * 2 * i) / count - Math.PI / 2;
    out.push({ x: Math.cos(a) * ring, y: Math.sin(a) * ring, a });
  }
  BOLT_CACHE.set(key, out);
  return out;
}

function drawBolt(
  g: Phaser.GameObjects.Graphics,
  bx: number,
  by: number,
  size: number,
  rotation: number,
): void {
  const r = size * 1.15;
  g.fillStyle(0x000000, 0.4);
  g.fillCircle(bx + r * 0.15, by + r * 0.22, r * 1.1);

  g.fillStyle(THEME.steelDark, 1);
  g.fillCircle(bx, by, r * 1.25);
  g.lineStyle(Math.max(1, r * 0.15), THEME.steelLight, 0.45);
  g.strokeCircle(bx, by, r * 1.25);

  g.fillStyle(THEME.boltShade, 1);
  drawHex(g, bx + r * 0.04, by + r * 0.06, r, rotation, true);
  g.fillStyle(THEME.boltHead, 1);
  drawHex(g, bx - r * 0.08, by - r * 0.1, r * 0.92, rotation, true);

  g.fillStyle(THEME.steelBright, 0.65);
  drawHex(g, bx - r * 0.22, by - r * 0.28, r * 0.38, rotation, true);

  g.lineStyle(Math.max(1, r * 0.12), THEME.steelShadow, 0.95);
  drawHex(g, bx, by, r, rotation, false);

  g.lineStyle(Math.max(1.4, r * 0.24), THEME.steelShadow, 1);
  g.beginPath();
  g.moveTo(bx - r * 0.42, by);
  g.lineTo(bx + r * 0.42, by);
  g.strokePath();
  g.beginPath();
  g.moveTo(bx, by - r * 0.42);
  g.lineTo(bx, by + r * 0.42);
  g.strokePath();
}

function drawHex(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  radius: number,
  rotation: number,
  fill: boolean,
): void {
  for (let i = 0; i < 6; i += 1) {
    const a = rotation + (Math.PI / 3) * i;
    HEX_SCRATCH[i].x = cx + Math.cos(a) * radius;
    HEX_SCRATCH[i].y = cy + Math.sin(a) * radius;
  }
  if (fill) g.fillPoints(HEX_SCRATCH, true);
  else g.strokePoints(HEX_SCRATCH, true);
}

/** Fewer rings than before — still reads as brushed steel. */
function drawBrushedDisk(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  baseColor: number,
): void {
  g.fillStyle(baseColor, 1);
  g.fillCircle(x, y, radius);

  const rings = Math.max(4, Math.min(10, Math.floor(radius / 4)));
  for (let i = 0; i < rings; i += 1) {
    const t = i / rings;
    const rr = radius * (0.98 - t * 0.9);
    const light = i % 2 === 0;
    g.lineStyle(
      Math.max(1, radius * 0.03),
      light ? THEME.steelLight : THEME.steelDark,
      light ? 0.12 : 0.16,
    );
    g.strokeCircle(x, y, rr);
  }

  g.lineStyle(Math.max(2, radius * 0.06), THEME.steelBright, 0.26);
  strokeArc(g, x, y, radius * 0.88, -Math.PI * 0.95, -Math.PI * 0.4);

  g.lineStyle(Math.max(2, radius * 0.07), THEME.steelShadow, 0.32);
  strokeArc(g, x, y, radius * 0.9, Math.PI * 0.15, Math.PI * 0.85);
}

function strokeArc(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  start: number,
  end: number,
): void {
  g.beginPath();
  const steps = 12;
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

export function drawFlange(
  g: Phaser.GameObjects.Graphics,
  geometry: FlangeGeometry,
  visualState: FlangeVisualState,
): void {
  const { x, y, radius, boltCount, coverAngle, openAmount } = geometry;
  g.clear();

  const rimColor =
    visualState === 'preview'
      ? THEME.amber
      : visualState === 'selected' || visualState === 'correct'
        ? THEME.green
        : visualState === 'wrong'
          ? THEME.red
          : visualState === 'missed'
            ? THEME.amberSoft
            : THEME.steelBlue;

  const glowAlpha =
    visualState === 'preview'
      ? 0.32
      : visualState === 'selected' || visualState === 'correct'
        ? 0.26
        : visualState === 'wrong'
          ? 0.28
          : visualState === 'missed'
            ? 0.2
            : 0.05;

  g.fillStyle(0x000000, 0.45);
  g.fillEllipse(x + radius * 0.04, y + radius * 0.12, radius * 2.15, radius * 1.85);

  g.fillStyle(rimColor, glowAlpha);
  g.fillCircle(x, y, radius * 1.2);

  g.fillStyle(THEME.steelShadow, 1);
  g.fillCircle(x, y, radius);
  drawBrushedDisk(g, x - radius * 0.03, y - radius * 0.04, radius * 0.97, THEME.steelMid);

  g.lineStyle(Math.max(2, radius * 0.06), THEME.steelBright, 0.55);
  g.strokeCircle(x, y, radius * 0.98);
  g.lineStyle(Math.max(2, radius * 0.05), THEME.steelShadow, 0.85);
  g.strokeCircle(x, y, radius * 0.9);

  g.lineStyle(Math.max(1.5, radius * 0.035), THEME.gasket, 0.9);
  g.strokeCircle(x, y, radius * 0.78);

  g.fillStyle(THEME.steelDark, 1);
  g.fillCircle(x, y, radius * 0.58);
  drawBrushedDisk(g, x - radius * 0.02, y - radius * 0.03, radius * 0.55, THEME.steelBlue);

  g.fillStyle(THEME.gasket, 1);
  g.fillCircle(x, y, radius * 0.42);
  g.lineStyle(Math.max(1.5, radius * 0.04), THEME.steelDark, 1);
  g.strokeCircle(x, y, radius * 0.42);
  g.lineStyle(1, THEME.steelLight, 0.25);
  g.strokeCircle(x, y, radius * 0.36);

  const bolts = boltPositions(radius, boltCount);
  for (let i = 0; i < bolts.length; i += 1) {
    const bolt = bolts[i];
    drawBolt(g, x + bolt.x, y + bolt.y, radius * 0.095, bolt.a * 0.35);
  }

  const boreVisible = openAmount > 0.05 || visualState === 'preview';
  if (boreVisible) {
    const boreR = radius * 0.26 * (0.5 + openAmount * 0.5);
    g.fillStyle(THEME.cyan, 0.12 + openAmount * 0.28);
    g.fillCircle(x, y, boreR * 1.45);
    g.fillStyle(0x03080c, 1);
    g.fillCircle(x, y, boreR);
    g.lineStyle(Math.max(1.5, radius * 0.04), THEME.steelMid, 0.9);
    g.strokeCircle(x, y, boreR * 1.08);
    g.lineStyle(Math.max(1.5, radius * 0.035), THEME.cyan, 0.5 + openAmount * 0.4);
    g.strokeCircle(x, y, boreR);

    if (openAmount > 0.35 || visualState === 'preview') {
      g.fillStyle(THEME.cyanSoft, 0.1 + openAmount * 0.18);
      g.fillCircle(x, y - boreR * 0.25, boreR * 0.5);
    }
  }

  const coverOpen = Phaser.Math.Clamp(openAmount, 0, 1);
  if (coverOpen < 0.98) {
    const coverR = radius * 0.4 * (1 - coverOpen * 0.32);
    const ox = Math.cos(coverAngle) * radius * 0.14 * coverOpen;
    const oy = Math.sin(coverAngle) * radius * 0.14 * coverOpen - coverOpen * radius * 0.1;

    const coverBase =
      visualState === 'wrong'
        ? THEME.redSoft
        : visualState === 'preview'
          ? THEME.amberSoft
          : THEME.steelLight;

    g.fillStyle(0x000000, 0.35 * (1 - coverOpen));
    g.fillCircle(x + ox + 2, y + oy + 3, coverR);

    drawBrushedDisk(g, x + ox, y + oy, coverR, coverBase);

    g.fillStyle(THEME.steelDark, 0.95);
    g.fillCircle(x + ox, y + oy, coverR * 0.28);
    g.lineStyle(Math.max(1.5, radius * 0.04), THEME.steelBright, 0.7);
    g.strokeCircle(x + ox, y + oy, coverR * 0.28);
    g.lineStyle(Math.max(2, radius * 0.05), THEME.steelShadow, 0.95);
    g.beginPath();
    g.moveTo(x + ox - coverR * 0.38, y + oy);
    g.lineTo(x + ox + coverR * 0.38, y + oy);
    g.strokePath();
  }

  g.lineStyle(Math.max(2, radius * 0.07), rimColor, visualState === 'closed' ? 0.4 : 0.95);
  g.strokeCircle(x, y, radius * 0.995);

  if (visualState === 'missed') {
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8;
      g.lineStyle(2, THEME.amber, 0.95);
      g.beginPath();
      g.moveTo(x + Math.cos(a) * radius * 1.04, y + Math.sin(a) * radius * 1.04);
      g.lineTo(x + Math.cos(a) * radius * 1.18, y + Math.sin(a) * radius * 1.18);
      g.strokePath();
    }
  }

  if (visualState === 'wrong') {
    const s = radius * 0.28;
    g.lineStyle(Math.max(2.5, radius * 0.08), THEME.red, 1);
    g.beginPath();
    g.moveTo(x - s, y - s);
    g.lineTo(x + s, y + s);
    g.moveTo(x + s, y - s);
    g.lineTo(x - s, y + s);
    g.strokePath();
  }

  if (visualState === 'correct' || visualState === 'selected') {
    const s = radius * 0.22;
    g.lineStyle(Math.max(2.5, radius * 0.08), THEME.green, 1);
    g.beginPath();
    g.moveTo(x - s, y + s * 0.1);
    g.lineTo(x - s * 0.2, y + s);
    g.lineTo(x + s, y - s);
    g.strokePath();
  }
}
