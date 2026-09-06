import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameMode, GAME_MODES } from '../game/gameConfig';
import { getPlayerRank } from '../game/storage';
import { loadDailyChallengeState } from '../game/dailyChallenge';

interface ResultsScreenProps {
  wpm: number;
  accuracy: number;
  words: number;
  score: number;
  bestWpm: number;
  isNewPersonalBest: boolean;
  mode?: GameMode;
  maxCombo?: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  wpm,
  accuracy,
  words,
  score,
  bestWpm,
  isNewPersonalBest,
  mode = 'sprint',
  maxCombo = 0,
  onPlayAgain,
  onHome,
}) => {
  const rank = getPlayerRank(wpm);
  const [dailyStreak, setDailyStreak] = useState<number>(0);
  const [dailyCompletedNow, setDailyCompletedNow] = useState<boolean>(false);

  useEffect(() => {
    const state = loadDailyChallengeState();
    if (state.streak > 0) {
      setDailyStreak(state.streak);
      if (state.isCompletedToday) {
        setDailyCompletedNow(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isNewPersonalBest) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#111111', '#555555', '#888888', '#dcd8d0'],
          disableForReducedMotion: true,
        });
      } catch {
        // ignore if canvas-confetti fails
      }
    }
  }, [isNewPersonalBest]);

  return (
    <div className="app-container">
      <main className="results-screen">
        <h1 className="results-heading">TIME'S UP!</h1>
        <p className="results-subheading">{GAME_MODES[mode]?.name || 'SPRINT'} &middot; {rank.title}</p>

        <div className="results-hero-wpm">{wpm}</div>
        <div className="results-hero-unit">WPM</div>

        {isNewPersonalBest && (
          <div className="personal-best-badge">
            ★ NEW PERSONAL BEST ★
          </div>
        )}

        {dailyCompletedNow && dailyStreak > 0 && (
          <div className="daily-streak-badge" style={{ marginTop: '0.2rem', marginBottom: '0.5rem' }}>
            🔥 {dailyStreak} DAY STREAK!
          </div>
        )}

        {maxCombo >= 3 && (
          <div className="max-combo-callout">
            🔥 MAX COMBO: &times;{maxCombo}
          </div>
        )}

        <div className="results-grid">
          <div className="result-card">
            <span className="result-card-label">WORDS</span>
            <span className="result-card-value">{words}</span>
          </div>

          <div className="result-card">
            <span className="result-card-label">ACCURACY</span>
            <span className="result-card-value">{accuracy}%</span>
          </div>

          <div className="result-card">
            <span className="result-card-label">SCORE</span>
            <span className="result-card-value">{score}</span>
          </div>

          <div className="result-card">
            <span className="result-card-label">BEST</span>
            <span className="result-card-value">{bestWpm}</span>
          </div>
        </div>



        <div className="results-actions">
          <button
            type="button"
            onClick={onPlayAgain}
            className="btn-primary"
            autoFocus
            aria-label="Play another round"
          >
            PLAY AGAIN
          </button>
          <button
            type="button"
            onClick={onHome}
            className="btn-secondary"
            aria-label="Return to menu"
          >
            HOME
          </button>
        </div>

        <div className="results-keyboard-hint">
          [ENTER] or [SPACE] to Play Again
        </div>
      </main>
    </div>
  );
};

