import React from 'react';

interface StatsBarProps {
  wpm: number;
  accuracy: number;
  words: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ wpm, accuracy, words }) => {
  return (
    <div className="game-stats-bar">
      <div className="stat-item">
        <span className="stat-label">WPM</span>
        <span className="stat-value">{wpm}</span>
      </div>

      <div className="stat-divider-dotted" aria-hidden="true" />

      <div className="stat-item">
        <span className="stat-label">ACCURACY</span>
        <span className="stat-value">{accuracy}%</span>
      </div>

      <div className="stat-divider-dotted" aria-hidden="true" />

      <div className="stat-item">
        <span className="stat-label">WORDS</span>
        <span className="stat-value">{words}</span>
      </div>
    </div>
  );
};
