import { WORDS_DICTIONARY } from '../data/words';

export interface DailyChallengeState {
  todayDate: string; // YYYY-MM-DD
  isCompletedToday: boolean;
  streak: number;
  lastCompletedDate: string;
}

const DAILY_STORAGE_KEY = 'typerush_daily_challenge_v1';

// Format current date in YYYY-MM-DD local format
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Simple deterministic hash for daily word generation
function pseudoRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

export function getDailyWords(count: number = 50): string[] {
  const dateStr = getTodayDateString();
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed = (seed << 5) - seed + dateStr.charCodeAt(i);
    seed |= 0;
  }

  const rng = pseudoRandom(Math.abs(seed));
  const pool = [...WORDS_DICTIONARY];
  const selected: string[] = [];

  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * pool.length);
    selected.push(pool[idx]);
    pool.splice(idx, 1);
    if (pool.length === 0) {
      pool.push(...WORDS_DICTIONARY);
    }
  }

  return selected;
}

// Parse YYYY-MM-DD to UTC epoch day number for exact integer day difference
function parseDateToEpochDay(dateStr: string): number {
  const parts = dateStr.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return 0;
  }
  return Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000);
}

export function loadDailyChallengeState(): DailyChallengeState {
  const today = getTodayDateString();
  const defaultState: DailyChallengeState = {
    todayDate: today,
    isCompletedToday: false,
    streak: 0,
    lastCompletedDate: '',
  };

  try {
    const raw = localStorage.getItem(DAILY_STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);

    const isCompletedToday = parsed.lastCompletedDate === today;

    // Check if streak was broken (missed more than 1 day)
    let streak = typeof parsed.streak === 'number' ? parsed.streak : 0;
    if (parsed.lastCompletedDate) {
      const lastDay = parseDateToEpochDay(parsed.lastCompletedDate);
      const currentDay = parseDateToEpochDay(today);
      const diffDays = currentDay - lastDay;
      if (diffDays > 1) {
        streak = isCompletedToday ? 1 : 0;
      }
    }

    return {
      todayDate: today,
      isCompletedToday,
      streak,
      lastCompletedDate: parsed.lastCompletedDate || '',
    };
  } catch {
    return defaultState;
  }
}

export function recordDailyChallengeCompletion(): DailyChallengeState {
  const today = getTodayDateString();
  const current = loadDailyChallengeState();

  if (current.isCompletedToday) {
    return current;
  }

  const newStreak = current.streak + 1;
  const updated: DailyChallengeState = {
    todayDate: today,
    isCompletedToday: true,
    streak: newStreak,
    lastCompletedDate: today,
  };

  try {
    localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Unable to persist daily challenge state', err);
  }

  return updated;
}
