import React from 'react';
import { TypeRushLogo } from './TypeRushLogo';
import { GameMode, GAME_MODES } from '../game/gameConfig';
import { getPlayerRank } from '../game/storage';
import { loadDailyChallengeState } from '../game/dailyChallenge';

interface HomeScreenProps {
  onStart: (mode: GameMode) => void;
  bestWpm: number;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStart,
  bestWpm,
  selectedMode,
  onSelectMode,
  onOpenSettings,
  onOpenStats,
}) => {
  const rank = getPlayerRank(bestWpm);
  const dailyState = loadDailyChallengeState();

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
            {GAME_MODES[selectedMode].description}
          </p>
        </div>

        {/* Game Mode Selector Pills */}
        <div className="mode-selector-group" role="tablist" aria-label="Game Modes">
          {(Object.keys(GAME_MODES) as GameMode[]).map((modeKey) => {
            const isSelected = selectedMode === modeKey;
            return (
              <button
                key={modeKey}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectMode(modeKey)}
                className={`mode-pill-btn ${isSelected ? 'active' : ''}`}
              >
                {GAME_MODES[modeKey].name}
              </button>
            );
          })}
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={() => onStart(selectedMode)}
          className="btn-primary"
          autoFocus
          aria-label={`Start ${GAME_MODES[selectedMode].name} challenge`}
        >
          START
        </button>

        {/* Daily Challenge & Best Score Section */}
        <div className="best-score-section">
          <div
            className={`daily-streak-badge ${dailyState.streak > 0 ? 'active-streak' : 'start-streak'}`}
            title={dailyState.isCompletedToday ? 'Daily session completed today!' : 'Play today to build your streak!'}
          >
            {dailyState.streak > 0
              ? `🔥 ${dailyState.streak} DAY STREAK ${dailyState.isCompletedToday ? '✓' : ''}`
              : '⚡ START YOUR DAILY STREAK TODAY'}
          </div>

          <div className="best-score-divider">
            <div className="best-score-dots" />
            <span className="best-score-heading">BEST SPEED</span>
            <div className="best-score-dots" />
          </div>

          <div className="best-score-number">{bestWpm}</div>
          <div className="best-score-unit">WPM &middot; {rank.title}</div>
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

