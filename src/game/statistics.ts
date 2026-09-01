export interface GameStats {
  score: number;
  completedWords: number;
  correctCharacters: number;
  incorrectCharacters: number;
  wpm: number;
  accuracy: number;
  elapsedSeconds: number;
  remainingSeconds: number;
}

export function calculateWpm(correctCharacters: number, elapsedSeconds: number): number {
  if (elapsedSeconds <= 0 || correctCharacters <= 0) return 0;
  const minutes = elapsedSeconds / 60;
  const words = correctCharacters / 5;
  const rawWpm = words / minutes;
  return Math.max(0, Math.round(rawWpm));
}

export function calculateAccuracy(correctCharacters: number, incorrectCharacters: number): number {
  const total = correctCharacters + incorrectCharacters;
  if (total === 0) return 100;
  const rawAccuracy = (correctCharacters / total) * 100;
  return Math.min(100, Math.max(0, Math.round(rawAccuracy)));
}
