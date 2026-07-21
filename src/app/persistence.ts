const STORAGE_KEY = 'fmm.v1';

export interface PersistedData {
  version: 1;
  bestScore: number;
  tutorialDone: boolean;
  muted: boolean;
  mode: 'standard' | 'relaxed' | 'expert';
}

const DEFAULTS: PersistedData = {
  version: 1,
  bestScore: 0,
  tutorialDone: false,
  muted: false,
  mode: 'standard',
};

export function loadPersistence(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<PersistedData>;
    if (parsed.version !== 1) return { ...DEFAULTS };
    return {
      ...DEFAULTS,
      ...parsed,
      version: 1,
      bestScore: Number(parsed.bestScore) || 0,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function savePersistence(data: PersistedData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota / private mode
  }
}

export function updateBestScore(score: number): number {
  const data = loadPersistence();
  if (score > data.bestScore) {
    data.bestScore = score;
    savePersistence(data);
  }
  return data.bestScore;
}
