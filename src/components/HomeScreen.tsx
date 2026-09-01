import React from 'react';
import { TypeRushLogo } from './TypeRushLogo';

interface HomeScreenProps {
  onStart: () => void;
  bestWpm: number;
  onOpenSettings: () => void;
  onOpenStats: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStart,
  bestWpm,
  onOpenSettings,
  onOpenStats,
}) => {
  return (
    <div className="app-container">
      <main className="screen-center">
        {/* Brand & Logo Header */}
        <div className="home-brand-wrapper">
          <TypeRushLogo size="large" />

          <div className="home-tagline-container">
            <div className="home-tagline-line" />
            <span className="home-tagline-text">THINK FAST &middot; TYPE FASTER</span>
            <div className="home-tagline-line" />
          </div>

          <p className="home-challenge-desc">
            How many words can you type in 60 seconds?
          </p>
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={onStart}
          className="btn-primary"
          autoFocus
          aria-label="Start TypeRush challenge"
        >
          START
        </button>

        {/* Best Score Section */}
        <div className="best-score-section">
          <div className="best-score-divider">
            <div className="best-score-dots" />
            <span className="best-score-heading">BEST SCORE</span>
            <div className="best-score-dots" />
          </div>

          <div className="best-score-number">{bestWpm}</div>
          <div className="best-score-unit">WPM</div>
        </div>

        {/* Creator Social Credits */}
        <div className="home-creator-credits-wrapper">
          <a
            href="https://www.instagram.com/blue3d_/"
            target="_blank"
            rel="noopener noreferrer"
            className="home-creator-credit"
            aria-label="Creator Instagram profile @blue3d_"
            onClick={(e) => e.stopPropagation()}
          >
            @[blue3d_]
          </a>
          <a
            href="https://www.linkedin.com/in/ravi-solanki-bb2420375/"
            target="_blank"
            rel="noopener noreferrer"
            className="home-creator-credit"
            aria-label="Creator LinkedIn profile ravi-solanki"
            onClick={(e) => e.stopPropagation()}
          >
            LinkedIn: ravi-solanki
          </a>
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="home-footer">
        <button
          type="button"
          onClick={onOpenSettings}
          className="icon-button"
          aria-label="Open Settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          SETTINGS
        </button>

        <button
          type="button"
          onClick={onOpenStats}
          className="icon-button"
          aria-label="Open Statistics"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="12" width="4" height="8" rx="1" />
            <rect x="10" y="8" width="4" height="12" rx="1" />
            <rect x="17" y="4" width="4" height="16" rx="1" />
          </svg>
          STATS
        </button>
      </footer>
    </div>
  );
};
