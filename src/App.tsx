import React, { useState, useEffect, useCallback } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { CountdownScreen } from './components/CountdownScreen';
import { GameScreen } from './components/GameScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { StatsModal } from './components/StatsModal';
import { SettingsModal } from './components/SettingsModal';
import { loadUserStats, saveGameResult, UserStatsStorage } from './game/storage';

type GameState = 'HOME' | 'COUNTDOWN' | 'PLAYING' | 'RESULTS';

interface LastResult {
  score: number;
  wpm: number;
  accuracy: number;
  words: number;
  isNewPersonalBest: boolean;
}

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('HOME');
  const [userStats, setUserStats] = useState<UserStatsStorage>(() => loadUserStats());
  const [lastResult, setLastResult] = useState<LastResult>({
    score: 0,
    wpm: 0,
    accuracy: 100,
    words: 0,
    isNewPersonalBest: false,
  });

  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Start game flow
  const handleStart = useCallback(() => {
    setIsStatsOpen(false);
    setIsSettingsOpen(false);
    setGameState('COUNTDOWN');
  }, []);

  // Countdown finished -> Start playing
  const handleCountdownComplete = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  const handlePlayAgain = useCallback(() => {
    setGameState('COUNTDOWN');
  }, []);

  const handleHome = useCallback(() => {
    setGameState('HOME');
  }, []);

  // Shared exit function: leaves an active gameplay session cleanly and
  // returns to the home screen. Used by BOTH the on-screen ESCAPE button
  // and the physical Escape key so there is a single source of truth.
  const exitGame = useCallback(() => {
    setGameState('HOME');
  }, []);

  // Game over -> Save results and show results screen
  const handleGameOver = useCallback((results: {
    score: number;
    wpm: number;
    accuracy: number;
    words: number;
    correctChars: number;
    incorrectChars: number;
    skippedWords: number;
  }) => {
    const { isNewPersonalBest, updatedStats } = saveGameResult(
      results.score,
      results.wpm,
      results.accuracy,
      results.words
    );

    setUserStats(updatedStats);
    setLastResult({
      score: results.score,
      wpm: results.wpm,
      accuracy: results.accuracy,
      words: results.words,
      isNewPersonalBest,
    });

    setGameState('RESULTS');
  }, []);

  // Reload user stats and theme from storage on mount
  useEffect(() => {
    setUserStats(loadUserStats());
    try {
      const savedTheme = localStorage.getItem('typerush_theme');
      if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch {
      // ignore
    }
  }, []);

  // Global keyboard shortcuts (ESC, Enter/Space navigation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If modal is open, ESC closes it
      if (e.key === 'Escape') {
        if (isStatsOpen) {
          setIsStatsOpen(false);
          return;
        }
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return;
        }
        if (gameState === 'RESULTS') {
          setGameState('HOME');
          return;
        }
        // Active gameplay: exit via the same shared function the
        // on-screen ESCAPE button uses. No skip/penalty side effects.
        if (gameState === 'PLAYING') {
          exitGame();
          return;
        }
      }

      // Quick start from Home with Enter or Space (if modals closed)
      if (gameState === 'HOME' && !isStatsOpen && !isSettingsOpen) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStart();
        }
      }

      // Quick play again from Results
      if (gameState === 'RESULTS') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handlePlayAgain();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStatsOpen, isSettingsOpen, gameState, handleStart, handlePlayAgain, exitGame]);

  return (
    <div className="typerush-app">
      {gameState === 'HOME' && (
        <HomeScreen
          onStart={handleStart}
          bestWpm={userStats.bestWpm}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenStats={() => setIsStatsOpen(true)}
        />
      )}

      {gameState === 'COUNTDOWN' && (
        <CountdownScreen onCountdownComplete={handleCountdownComplete} />
      )}

      {gameState === 'PLAYING' && (
        <GameScreen onGameOver={handleGameOver} onExit={exitGame} />
      )}

      {gameState === 'RESULTS' && (
        <ResultsScreen
          wpm={lastResult.wpm}
          accuracy={lastResult.accuracy}
          words={lastResult.words}
          score={lastResult.score}
          bestWpm={userStats.bestWpm}
          isNewPersonalBest={lastResult.isNewPersonalBest}
          onPlayAgain={handlePlayAgain}
          onHome={handleHome}
        />
      )}

      {/* Modals */}
      {isStatsOpen && (
        <StatsModal stats={userStats} onClose={() => setIsStatsOpen(false)} />
      )}

      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
};

export default App;
