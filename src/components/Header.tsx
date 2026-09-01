import React from 'react';

interface HeaderProps {
  score: number;
  remainingTime: number;
}

export const Header: React.FC<HeaderProps> = ({ score, remainingTime }) => {
  return (
    <header className="game-header">
      <div className="game-header-label">
        SCORE: <span className="game-header-value">{score}</span>
      </div>
      <div className="game-header-label">
        TIME: <span className="game-header-value">{Math.max(0, Math.ceil(remainingTime))}</span>
      </div>
    </header>
  );
};
