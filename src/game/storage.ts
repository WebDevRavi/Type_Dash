import { GameMode } from './gameConfig';

export interface StoredGameHistory {
  wpm: number;
  score: number;
  accuracy: number;
  words: number;
  timestamp: number;
  mode?: GameMode;
  maxCombo?: number;
}

export interface UserStatsStorage {
  bestScore: number;
  bestWpm: number;
  bestAccuracy: number;
  totalGames: number;
  totalWords: number;
  modeBests: Record<GameMode, number>;
  history: StoredGameHistory[];
}

export function getPlayerRank(wpm: number): { title: string; tier: string } {
  if (wpm >= 90) return { title: 'GODSPEED', tier: 'Tier V' };
  if (wpm >= 70) return { title: 'GRANDMASTER', tier: 'Tier IV' };
  if (wpm >= 50) return { title: 'WORDSMITH', tier: 'Tier III' };
  if (wpm >= 30) return { title: 'SPEEDSTER', tier: 'Tier II' };
  return { title: 'NOVICE TYPIST', tier: 'Tier I' };
}

const STORAGE_KEY = 'typerush_player_stats_v1';

const DEFAULT_STORAGE: UserStatsStorage = {
  bestScore: 0,
  bestWpm: 0,
  bestAccuracy: 0,
  totalGames: 0,
  totalWords: 0,
  modeBests: {
    sprint: 0,
    blitz: 0,
    streak: 0,
  },
  history: [],
};

export function loadUserStats(): UserStatsStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORAGE;
    const parsed = JSON.parse(raw);

    const modeBests: Record<GameMode, number> = {
      sprint: typeof parsed.modeBests?.sprint === 'number' ? parsed.modeBests.sprint : (parsed.bestWpm || 0),
      blitz: typeof parsed.modeBests?.blitz === 'number' ? parsed.modeBests.blitz : 0,
      streak: typeof parsed.modeBests?.streak === 'number' ? parsed.modeBests.streak : 0,
    };

    return {
      bestScore: typeof parsed.bestScore === 'number' && parsed.bestScore >= 0 ? parsed.bestScore : 0,
      bestWpm: typeof parsed.bestWpm === 'number' && parsed.bestWpm >= 0 ? parsed.bestWpm : 0,
      bestAccuracy: typeof parsed.bestAccuracy === 'number' && parsed.bestAccuracy >= 0 && parsed.bestAccuracy <= 100 ? parsed.bestAccuracy : 0,
      totalGames: typeof parsed.totalGames === 'number' && parsed.totalGames >= 0 ? parsed.totalGames : 0,
      totalWords: typeof parsed.totalWords === 'number' && parsed.totalWords >= 0 ? parsed.totalWords : 0,
      modeBests,
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 50) : [],
    };
  } catch {
    return DEFAULT_STORAGE;
  }
}

export function saveGameResult(
  score: number,
  wpm: number,
  accuracy: number,
  words: number,
  mode: GameMode = 'sprint',
  maxCombo: number = 0
): { isNewPersonalBest: boolean; updatedStats: UserStatsStorage } {
  const current = loadUserStats();

  const currentModeBest = current.modeBests[mode] || 0;
  const isNewPersonalBest = wpm > 0 && (wpm > currentModeBest || (wpm === currentModeBest && score > current.bestScore));

  const updatedModeBests = {
    ...current.modeBests,
    [mode]: Math.max(currentModeBest, wpm),
  };

  const updatedStats: UserStatsStorage = {
    bestScore: Math.max(current.bestScore, score),
    bestWpm: Math.max(current.bestWpm, wpm),
    bestAccuracy: current.bestAccuracy === 0 ? accuracy : Math.max(current.bestAccuracy, accuracy),
    totalGames: current.totalGames + 1,
    totalWords: current.totalWords + words,
    modeBests: updatedModeBests,
    history: [
      {
        wpm,
        score,
        accuracy,
        words,
        mode,
        maxCombo,
        timestamp: Date.now(),
      },
      ...current.history,
    ].slice(0, 50),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStats));
  } catch (err) {
    console.warn('Unable to persist stats to localStorage', err);
  }

  return { isNewPersonalBest, updatedStats };
}

