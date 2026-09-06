// TypeScript definitions for CrazyGames HTML5 SDK v3
// https://docs.crazygames.com/sdk/

export type CrazyGamesEnvironment = 'crazygames' | 'local' | 'disabled' | string;
export type CrazyGamesAdType = 'midgame' | 'rewarded';

export interface CrazyGamesAdCallbacks {
  adStarted?: () => void;
  adFinished?: () => void;
  adError?: (error: unknown) => void;
}

export interface CrazyGamesSettings {
  muteAudio?: boolean;
  [key: string]: unknown;
}

export interface CrazyGamesGameModule {
  loadingStart: () => void;
  loadingStop: () => void;
  gameplayStart: () => void;
  gameplayStop: () => void;
  happytime: () => void;
  settings: {
    muteAudio?: boolean;
    addSettingsListener?: (callback: (settings: CrazyGamesSettings) => void) => void;
    removeSettingsListener?: (callback: (settings: CrazyGamesSettings) => void) => void;
    [key: string]: unknown;
  };
}

export interface CrazyGamesAdModule {
  requestAd: (type: CrazyGamesAdType, callbacks?: CrazyGamesAdCallbacks) => Promise<void> | void;
  hasAdblock?: () => Promise<boolean>;
}

export interface CrazyGamesSDK {
  init: () => Promise<void>;
  game: CrazyGamesGameModule;
  ad: CrazyGamesAdModule;
  environment?: CrazyGamesEnvironment;
  [key: string]: unknown;
}

declare global {
  interface Window {
    CrazyGames?: {
      SDK: CrazyGamesSDK;
    };
  }
}
