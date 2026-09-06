export type GameMode = 'sprint' | 'blitz' | 'streak';

export interface GameModeInfo {
  id: GameMode;
  name: string;
  durationSeconds: number;
  description: string;
}

export const GAME_MODES: Record<GameMode, GameModeInfo> = {
  sprint: {
    id: 'sprint',
    name: '60S SPRINT',
    durationSeconds: 60,
    description: 'Classic fixed 60-second typing test — think fast, type faster',
  },
  blitz: {
    id: 'blitz',
    name: '30S BLITZ',
    durationSeconds: 30,
    description: 'High-speed 30-second burst',
  },
  streak: {
    id: 'streak',
    name: 'STREAK MODE',
    durationSeconds: 15,
    description: '15s timer, +3s bonus per completed word',
  },
};

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

