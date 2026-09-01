export interface GameConfig {
  durationSeconds: number;
  countdownSeconds: number;
  recentWordHistory: number;
}

export const GAME_CONFIG: GameConfig = {
  durationSeconds: 60,
  countdownSeconds: 3,
  recentWordHistory: 15,
};
