import type { RoundResult } from './types';

/**
 * Deterministic scoring from the GDD:
 * base = 100 × targetCount × level
 * speedBonus = max(0, recallLimitMs - recallTimeMs) / 10
 * streakMultiplier = 1 + min(streak, 10) × 0.05
 */
export function scoreRound(params: {
  level: number;
  targetCount: number;
  recallTimeMs: number;
  recallLimitMs: number;
  streak: number;
  modeMultiplier: number;
}): RoundResult {
  const base = 100 * params.targetCount * params.level;
  const speedBonus = Math.max(0, params.recallLimitMs - params.recallTimeMs) / 10;
  const streakMultiplier = 1 + Math.min(params.streak, 10) * 0.05;
  const modeMultiplier = params.modeMultiplier;
  const roundScore = Math.round(
    (base + speedBonus) * streakMultiplier * modeMultiplier,
  );

  return {
    roundScore,
    base,
    speedBonus,
    streakMultiplier,
    modeMultiplier,
  };
}

export function accuracyPercent(correct: number, total: number): number {
  if (total <= 0) return 100;
  return Math.round((correct / total) * 1000) / 10;
}
