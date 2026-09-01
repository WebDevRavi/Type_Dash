export interface StoredGameHistory {
  wpm: number;
  score: number;
  accuracy: number;
  words: number;
  timestamp: number;
}

export interface UserStatsStorage {
  bestScore: number;
  bestWpm: number;
  bestAccuracy: number;
  totalGames: number;
  totalWords: number;
  history: StoredGameHistory[];
}

const STORAGE_KEY = 'typerush_player_stats_v1';

const DEFAULT_STORAGE: UserStatsStorage = {
  bestScore: 0,
  bestWpm: 0,
  bestAccuracy: 0,
  totalGames: 0,
  totalWords: 0,
  history: []
};

export function loadUserStats(): UserStatsStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORAGE;
    const parsed = JSON.parse(raw);

    return {
      bestScore: typeof parsed.bestScore === 'number' && parsed.bestScore >= 0 ? parsed.bestScore : 0,
      bestWpm: typeof parsed.bestWpm === 'number' && parsed.bestWpm >= 0 ? parsed.bestWpm : 0,
      bestAccuracy: typeof parsed.bestAccuracy === 'number' && parsed.bestAccuracy >= 0 && parsed.bestAccuracy <= 100 ? parsed.bestAccuracy : 0,
      totalGames: typeof parsed.totalGames === 'number' && parsed.totalGames >= 0 ? parsed.totalGames : 0,
      totalWords: typeof parsed.totalWords === 'number' && parsed.totalWords >= 0 ? parsed.totalWords : 0,
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 50) : []
    };
  } catch {
    return DEFAULT_STORAGE;
  }
}

export function saveGameResult(
  score: number,
  wpm: number,
  accuracy: number,
  words: number
): { isNewPersonalBest: boolean; updatedStats: UserStatsStorage } {
  const current = loadUserStats();

  const isNewPersonalBest = wpm > current.bestWpm || (wpm === current.bestWpm && score > current.bestScore);

  const updatedStats: UserStatsStorage = {
    bestScore: Math.max(current.bestScore, score),
    bestWpm: Math.max(current.bestWpm, wpm),
    bestAccuracy: current.bestAccuracy === 0 ? accuracy : Math.max(current.bestAccuracy, accuracy),
    totalGames: current.totalGames + 1,
    totalWords: current.totalWords + words,
    history: [
      {
        wpm,
        score,
        accuracy,
        words,
        timestamp: Date.now()
      },
      ...current.history
    ].slice(0, 50)
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStats));
  } catch (err) {
    console.warn('Unable to persist stats to localStorage', err);
  }

  return { isNewPersonalBest, updatedStats };
}
