import { sound } from './sound';
import type { CrazyGamesSettings } from '../types/crazygames';

class CrazyGamesManager {
  private isSdkInitialized = false;
  private isGameplayActive = false;
  private pendingLoadingStart = false;
  private pendingLoadingStop = false;

  constructor() {
    // Automatically guarantee gameplayStop() is dispatched if user navigates away or closes tab
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (this.isGameplayActive) {
          this.gameplayStop();
        }
      });
      window.addEventListener('pagehide', () => {
        if (this.isGameplayActive) {
          this.gameplayStop();
        }
      });
    }
  }

  /**
   * Safely checks if the CrazyGames SDK script object is present on window.
   */
  public isAvailable(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof (window as unknown as { CrazyGames?: { SDK?: { init: () => Promise<void> } } }).CrazyGames?.SDK?.init === 'function'
    );
  }

  /**
   * Asynchronously awaits SDK availability up to timeoutMs to handle script loading delays.
   */
  private async waitForSdk(timeoutMs = 2500): Promise<boolean> {
    if (this.isAvailable()) return true;
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (this.isAvailable()) return true;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return this.isAvailable();
  }

  /**
   * Initialize CrazyGames SDK v3.
   * Safe to call in any environment (localhost, preview, iframe, standalone).
   * Failure will NEVER crash the game.
   */
  public async init(): Promise<void> {
    if (this.isSdkInitialized) return;

    const available = await this.waitForSdk();
    if (!available) {
      console.info('[CrazyGames SDK] Running in standalone/offline mode (SDK not detected).');
      return;
    }

    try {
      // Await official SDK initialization with a 3000ms safety race
      await Promise.race([
        window.CrazyGames!.SDK.init(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('CrazyGames SDK init timed out after 3000ms')), 3000)
        ),
      ]);

      this.isSdkInitialized = true;
      console.info('[CrazyGames SDK] Successfully initialized.');

      // Hook into platform settings to support platform mute
      const settings = window.CrazyGames?.SDK?.game?.settings;
      if (settings) {
        if (typeof settings.muteAudio === 'boolean') {
          sound.setCrazyGamesMuted(settings.muteAudio);
        }

        if (typeof settings.addSettingsListener === 'function') {
          settings.addSettingsListener((newSettings: CrazyGamesSettings) => {
            if (typeof newSettings?.muteAudio === 'boolean') {
              sound.setCrazyGamesMuted(newSettings.muteAudio);
            }
          });
        }
      }

      // Flush any queued loading events now that SDK is safely initialized
      if (this.pendingLoadingStart) {
        window.CrazyGames?.SDK?.game?.loadingStart?.();
      }
      if (this.pendingLoadingStop) {
        window.CrazyGames?.SDK?.game?.loadingStop?.();
      }
    } catch (err) {
      console.info('[CrazyGames SDK] Standalone/offline mode active:', err);
    }
  }

  /**
   * Call while game assets/components are loading.
   */
  public loadingStart(): void {
    this.pendingLoadingStart = true;
    if (!this.isSdkInitialized) return;

    try {
      window.CrazyGames?.SDK?.game?.loadingStart?.();
    } catch (err) {
      console.warn('[CrazyGames SDK] loadingStart error:', err);
    }
  }

  /**
   * Call when the game is fully loaded and ready to play.
   */
  public loadingStop(): void {
    this.pendingLoadingStop = true;
    if (!this.isSdkInitialized) return;

    try {
      window.CrazyGames?.SDK?.game?.loadingStop?.();
    } catch (err) {
      console.warn('[CrazyGames SDK] loadingStop error:', err);
    }
  }

  /**
   * Call when the active typing session begins (AFTER countdown finishes and player can type).
   */
  public gameplayStart(): void {
    if (this.isGameplayActive) return;
    this.isGameplayActive = true;

    if (!this.isSdkInitialized) return;
    try {
      window.CrazyGames?.SDK?.game?.gameplayStart?.();
    } catch (err) {
      console.warn('[CrazyGames SDK] gameplayStart error:', err);
    }
  }

  /**
   * Call when the active typing session ends (timer reaches 0, player exits to home).
   */
  public gameplayStop(): void {
    if (!this.isGameplayActive) return;
    this.isGameplayActive = false;

    if (!this.isSdkInitialized) return;
    try {
      window.CrazyGames?.SDK?.game?.gameplayStop?.();
    } catch (err) {
      console.warn('[CrazyGames SDK] gameplayStop error:', err);
    }
  }

  /**
   * Trigger celebration for meaningful accomplishments (e.g. New Personal Best).
   */
  public happytime(): void {
    if (!this.isSdkInitialized) return;
    try {
      window.CrazyGames?.SDK?.game?.happytime?.();
    } catch (err) {
      console.warn('[CrazyGames SDK] happytime error:', err);
    }
  }

  /**
   * Request a midgame video ad at a natural break (e.g., after completing a 60s sprint).
   * Safe for Basic Launch (no ads active) and full launch.
   */
  public requestMidgameAd(callbacks?: {
    onAdStarted?: () => void;
    onAdFinished?: () => void;
  }): void {
    if (!this.isSdkInitialized || !window.CrazyGames?.SDK?.ad?.requestAd) {
      callbacks?.onAdFinished?.();
      return;
    }

    let hasFinished = false;
    const safeFinish = () => {
      if (hasFinished) return;
      hasFinished = true;
      sound.setAdMuted(false);
      callbacks?.onAdFinished?.();
    };

    try {
      const adPromise = window.CrazyGames!.SDK.ad.requestAd('midgame', {
        adStarted: () => {
          sound.setAdMuted(true);
          callbacks?.onAdStarted?.();
        },
        adFinished: () => {
          safeFinish();
        },
        adError: (err) => {
          console.warn('[CrazyGames SDK] Ad error/unavailable:', err);
          safeFinish();
        },
      });

      if (adPromise && typeof (adPromise as Promise<void>).catch === 'function') {
        (adPromise as Promise<void>).catch((err) => {
          console.warn('[CrazyGames SDK] requestAd promise rejected:', err);
          safeFinish();
        });
      }
    } catch (err) {
      console.warn('[CrazyGames SDK] requestAd threw an exception:', err);
      safeFinish();
    }
  }
}

export const crazyGames = new CrazyGamesManager();

