import React from 'react';

interface HeaderProps {
  score: number;
  remainingTime: number;
  bonusTimeAlert?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ score, remainingTime, bonusTimeAlert = false }) => {
  return (
    <header className="game-header">
      <div className="game-header-label">
        SCORE: <span className="game-header-value">{score}</span>
      </div>
      <div className="game-header-label time-label-wrapper">
        TIME: <span className="game-header-value">{Math.max(0, Math.ceil(remainingTime))}</span>
        {bonusTimeAlert && <span className="bonus-time-badge animate-bonus-pop">+3s</span>}
      </div>
    </header>
  );
};
