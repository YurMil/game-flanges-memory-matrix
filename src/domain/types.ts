export type PlayState =
  | 'idle'
  | 'round-intro'
  | 'preview'
  | 'recall'
  | 'success'
  | 'failure'
  | 'paused'
  | 'game-over';

export type GameModeId = 'standard' | 'relaxed' | 'expert';

export type FlangeVisualState =
  | 'closed'
  | 'preview'
  | 'selected'
  | 'correct'
  | 'missed'
  | 'wrong';

export interface CellCoord {
  row: number;
  col: number;
}

export interface RoundConfig {
  level: number;
  rows: number;
  columns: number;
  targetCount: number;
  previewMs: number;
  settleMs: number;
  successDelayMs: number;
  scoreMultiplier: number;
  recallLimitMs: number;
}

export interface ModeConfig {
  id: GameModeId;
  label: string;
  lives: number;
  previewScale: number;
  scoreMultiplier: number;
  allowOneMistake: boolean;
}

export interface SessionStats {
  score: number;
  level: number;
  streak: number;
  longestStreak: number;
  correctSelections: number;
  totalSelections: number;
  lives: number;
  bestScore: number;
}

export interface RoundResult {
  roundScore: number;
  base: number;
  speedBonus: number;
  streakMultiplier: number;
  modeMultiplier: number;
}

export const MODES: Record<GameModeId, ModeConfig> = {
  standard: {
    id: 'standard',
    label: 'STANDARD',
    lives: 3,
    previewScale: 1,
    scoreMultiplier: 1,
    allowOneMistake: false,
  },
  relaxed: {
    id: 'relaxed',
    label: 'RELAXED',
    lives: 4,
    previewScale: 1.35,
    scoreMultiplier: 0.85,
    allowOneMistake: true,
  },
  expert: {
    id: 'expert',
    label: 'EXPERT',
    lives: 1,
    previewScale: 0.75,
    scoreMultiplier: 1.45,
    allowOneMistake: false,
  },
};

export function cellKey(cell: CellCoord): string {
  return `${cell.row}:${cell.col}`;
}

export function parseCellKey(key: string): CellCoord {
  const [row, col] = key.split(':').map(Number);
  return { row, col };
}
