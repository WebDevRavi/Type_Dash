import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ResultsScreenProps {
  wpm: number;
  accuracy: number;
  words: number;
  score: number;
  bestWpm: number;
  isNewPersonalBest: boolean;
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
  onPlayAgain,
  onHome,
}) => {
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
        <p className="results-subheading">YOUR SPEED</p>

        <div className="results-hero-wpm">{wpm}</div>
        <div className="results-hero-unit">WPM</div>

        {isNewPersonalBest && (
          <div className="personal-best-badge">
            ★ NEW PERSONAL BEST ★
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
          >
            PLAY AGAIN
          </button>
          <button
            type="button"
            onClick={onHome}
            className="btn-secondary"
          >
            HOME
          </button>
        </div>
      </main>
    </div>
  );
};
