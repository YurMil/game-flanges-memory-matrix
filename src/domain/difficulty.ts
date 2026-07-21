import type { GameModeId, RoundConfig } from './types';
import { MODES } from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Data-driven difficulty curve from the GDD. */
export function getRoundConfig(level: number, mode: GameModeId = 'standard'): RoundConfig {
  const modeCfg = MODES[mode];
  let rows = 3;
  let columns = 3;
  let targetCount = 3;
  let previewMs = 1800;

  if (level <= 2) {
    rows = 3;
    columns = 3;
    targetCount = level === 1 ? 3 : 4;
    previewMs = level === 1 ? 1800 : 1600;
  } else if (level <= 5) {
    rows = 4;
    columns = 4;
    targetCount = 4 + (level - 3);
    previewMs = 1500 - (level - 3) * 50;
  } else if (level <= 9) {
    rows = 5;
    columns = 5;
    targetCount = 6 + (level - 6);
    previewMs = 1250 - (level - 6) * 50;
  } else if (level <= 14) {
    rows = 6;
    columns = 6;
    targetCount = 8 + Math.floor((level - 10) * 0.9);
    previewMs = 1000 - (level - 10) * 30;
  } else {
    const side = clamp(6 + Math.floor((level - 15) / 3), 6, 8);
    rows = side;
    columns = side;
    const maxTargets = Math.floor(side * side * 0.4);
    targetCount = clamp(10 + (level - 15), 8, maxTargets);
    previewMs = clamp(850 - (level - 15) * 15, 700, 850);
  }

  previewMs = Math.round(previewMs * modeCfg.previewScale);

  return {
    level,
    rows,
    columns,
    targetCount,
    previewMs,
    settleMs: 280,
    successDelayMs: 900,
    scoreMultiplier: modeCfg.scoreMultiplier,
    recallLimitMs: 8000 + level * 400,
  };
}
