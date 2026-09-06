import React, { useState, useEffect, useCallback } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { CountdownScreen } from './components/CountdownScreen';
import { GameScreen } from './components/GameScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { StatsModal } from './components/StatsModal';
import { SettingsModal } from './components/SettingsModal';
import { loadUserStats, saveGameResult, UserStatsStorage } from './game/storage';
import { recordDailyChallengeCompletion } from './game/dailyChallenge';
import { crazyGames } from './game/crazyGames';
import { GameMode } from './game/gameConfig';

type GameState = 'HOME' | 'COUNTDOWN' | 'PLAYING' | 'RESULTS';

interface LastResult {
  score: number;
  wpm: number;
  accuracy: number;
  words: number;
  isNewPersonalBest: boolean;
  mode: GameMode;
  maxCombo: number;
}

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('HOME');
  const [selectedMode, setSelectedMode] = useState<GameMode>('sprint');
  const [userStats, setUserStats] = useState<UserStatsStorage>(() => loadUserStats());
  const [lastResult, setLastResult] = useState<LastResult>({
    score: 0,
    wpm: 0,
    accuracy: 100,
    words: 0,
    isNewPersonalBest: false,
    mode: 'sprint',
    maxCombo: 0,
  });

  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Initialize CrazyGames SDK lifecycle asynchronously on mount
  useEffect(() => {
    crazyGames.loadingStart();
    crazyGames
      .init()
      .then(() => {
        crazyGames.loadingStop();
      })
      .catch(() => {
        crazyGames.loadingStop();
      });


    setUserStats(loadUserStats());
    try {
      const savedTheme = localStorage.getItem('typerush_theme');
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
      }
    } catch {
      // ignore
    }
  }, []);

  // Start game flow
  const handleStart = useCallback((mode: GameMode = selectedMode) => {
    setSelectedMode(mode);
    setIsStatsOpen(false);
    setIsSettingsOpen(false);
    setGameState('COUNTDOWN');
  }, [selectedMode]);

  // Countdown finished -> Start playing (CrazyGames gameplayStart)
  const handleCountdownComplete = useCallback(() => {
    setGameState('PLAYING');
    crazyGames.gameplayStart();
  }, []);

  // Play again -> Safe midgame ad opportunity at natural round break
  const handlePlayAgain = useCallback(() => {
    crazyGames.requestMidgameAd({
      onAdFinished: () => {
        setGameState('COUNTDOWN');
      },
    });
  }, []);

  const handleHome = useCallback(() => {
    setGameState('HOME');
  }, []);

  // Shared exit function: leaves active gameplay cleanly
  const exitGame = useCallback(() => {
    crazyGames.gameplayStop();
    setGameState('HOME');
  }, []);

  // Game over -> Stop gameplay, save results, celebrate if PB, show results screen
  const handleGameOver = useCallback(
    (results: {
      score: number;
      wpm: number;
      accuracy: number;
      words: number;
      correctChars: number;
      incorrectChars: number;
      skippedWords: number;
      maxCombo: number;
      mode: GameMode;
    }) => {
      crazyGames.gameplayStop();

      const { isNewPersonalBest, updatedStats } = saveGameResult(
        results.score,
        results.wpm,
        results.accuracy,
        results.words,
        results.mode,
        results.maxCombo
      );

      if (isNewPersonalBest) {
        crazyGames.happytime();
      }

      // Record daily streak progress on valid gameplay
      if (results.words > 0 && results.wpm > 0) {
        recordDailyChallengeCompletion();
      }

      setUserStats(updatedStats);
      setLastResult({
        score: results.score,
        wpm: results.wpm,
        accuracy: results.accuracy,
        words: results.words,
        isNewPersonalBest,
        mode: results.mode,
        maxCombo: results.maxCombo,
      });

      setGameState('RESULTS');
    },
    []
  );

  // Global keyboard shortcuts (Modals, Space/Enter navigation)
  // NOTE: Escape during active PLAYING is NOT intercepted to allow CrazyGames fullscreen exit.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        // When actively playing, physical Escape exits fullscreen natively
      }

      // Guard against held-down repeating keys and browser modifier combinations
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;

      const activeTag = (document.activeElement?.tagName || '').toUpperCase();
      const isInteractiveFocused = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'A' || activeTag === 'BUTTON';

      // Quick start from Home with Enter or Space (if modals closed and not focused on interactive controls)
      if (gameState === 'HOME' && !isStatsOpen && !isSettingsOpen) {
        if ((e.key === 'Enter' || e.key === ' ') && !isInteractiveFocused) {
          e.preventDefault();
          handleStart(selectedMode);
        }
      }

      // Quick play again from Results with Enter or Space
      if (gameState === 'RESULTS') {
        if ((e.key === 'Enter' || e.key === ' ') && !isInteractiveFocused) {
          e.preventDefault();
          handlePlayAgain();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStatsOpen, isSettingsOpen, gameState, handleStart, handlePlayAgain, selectedMode]);

  return (
    <div className="typerush-app">
      {gameState === 'HOME' && (
        <HomeScreen
          onStart={handleStart}
          bestWpm={userStats.modeBests[selectedMode] || userStats.bestWpm}
          selectedMode={selectedMode}
          onSelectMode={setSelectedMode}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenStats={() => setIsStatsOpen(true)}
        />
      )}

      {gameState === 'COUNTDOWN' && (
        <CountdownScreen onCountdownComplete={handleCountdownComplete} />
      )}

      {gameState === 'PLAYING' && (
        <GameScreen
          mode={selectedMode}
          onGameOver={handleGameOver}
          onExit={exitGame}
        />
      )}

      {gameState === 'RESULTS' && (
        <ResultsScreen
          wpm={lastResult.wpm}
          accuracy={lastResult.accuracy}
          words={lastResult.words}
          score={lastResult.score}
          bestWpm={userStats.modeBests[lastResult.mode] || userStats.bestWpm}
          isNewPersonalBest={lastResult.isNewPersonalBest}
          mode={lastResult.mode}
          maxCombo={lastResult.maxCombo}
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

