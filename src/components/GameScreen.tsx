import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './Header';
import { TypingInput, TypingInputHandles } from './TypingInput';
import { StatsBar } from './StatsBar';
import { WordGenerator } from '../game/wordGenerator';
import { calculateWpm, calculateAccuracy } from '../game/statistics';
import { sound } from '../game/sound';
import { GAME_CONFIG, GameMode, GAME_MODES } from '../game/gameConfig';

interface GameScreenProps {
  mode?: GameMode;
  onGameOver: (results: {
    score: number;
    wpm: number;
    accuracy: number;
    words: number;
    correctChars: number;
    incorrectChars: number;
    skippedWords: number;
    maxCombo: number;
    mode: GameMode;
  }) => void;
  onExit: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  mode = 'sprint',
  onGameOver,
  onExit,
}) => {
  const inputHandleRef = useRef<TypingInputHandles>(null);
  const wordGenRef = useRef<WordGenerator>(new WordGenerator());
  const [currentWord, setCurrentWord] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [isInputError, setIsInputError] = useState<boolean>(false);
  const [isSkipFlashing, setIsSkipFlashing] = useState<boolean>(false);
  const skipFlashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Statistics & Combo state
  const [score, setScore] = useState<number>(0);
  const [completedWords, setCompletedWords] = useState<number>(0);
  const initialDuration = GAME_MODES[mode]?.durationSeconds || GAME_CONFIG.durationSeconds;
  const [remainingTime, setRemainingTime] = useState<number>(initialDuration);
  const [liveWpm, setLiveWpm] = useState<number>(0);
  const [liveAccuracy, setLiveAccuracy] = useState<number>(100);
  const [combo, setCombo] = useState<number>(0);
  const [bonusTimeAlert, setBonusTimeAlert] = useState<boolean>(false);
  const bonusAlertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Authoritative session metrics
  const startTimeRef = useRef<number>(0);
  const isGameOverRef = useRef<boolean>(false);
  const completedWordsCharsRef = useRef<number>(0);
  const incorrectCharsRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const wordsRef = useRef<number>(0);
  const skippedWordsRef = useRef<number>(0);
  const comboRef = useRef<number>(0);
  const maxComboRef = useRef<number>(0);
  const bonusSecondsRef = useRef<number>(0);
  const inputValueRef = useRef<string>('');
  const lastStatsUpdateRef = useRef<number>(0);

  // Maintain fresh currentWord ref for interval callbacks
  const currentWordRef = useRef<string>(currentWord);
  currentWordRef.current = currentWord;

  // Active word prefix matcher for cheat-proof live WPM
  const getActiveWordCorrectChars = (val: string, target: string): number => {
    let count = 0;
    for (let i = 0; i < val.length && i < target.length; i++) {
      if (val[i] === target[i]) {
        count++;
      } else {
        break; // Stop at first typo
      }
    }
    return count;
  };

  // Background tab tracking to prevent timer draining during tab switch
  const hiddenTimeRef = useRef<number | null>(null);

  // Focus restoration helper
  const restoreFocus = useCallback(() => {
    if (isGameOverRef.current) return;
    requestAnimationFrame(() => {
      inputHandleRef.current?.focus();
    });
  }, []);

  // Browser lifecycle, tab switching, and auto-focus management
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Tab backgrounded: capture timestamp
        hiddenTimeRef.current = performance.now();
      } else if (document.visibilityState === 'visible') {
        // Tab foregrounded: compensate elapsed time so user loses 0 seconds
        if (hiddenTimeRef.current !== null && !isGameOverRef.current) {
          const pausedDuration = performance.now() - hiddenTimeRef.current;
          startTimeRef.current += pausedDuration;
          hiddenTimeRef.current = null;
        }
        restoreFocus();
      }
    };

    const handleWindowFocus = () => {
      restoreFocus();
    };

    // Any pointer click anywhere on the page refocuses the input
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target?.closest?.('.escape-button') && !target?.closest?.('.mobile-action-btn')) {
        restoreFocus();
      }
    };

    // Global keystroke redirect: if focus slipped to body, capture and refocus
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isGameOverRef.current) return;
      const inputEl = inputHandleRef.current?.getElement();
      if (inputEl && document.activeElement !== inputEl) {
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter' || e.key === ' ') {
          inputHandleRef.current?.focus();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [restoreFocus]);

  // Initialize first word & session timer on mount
  useEffect(() => {
    const firstWord = wordGenRef.current.getNextWord();
    setCurrentWord(firstWord);
    startTimeRef.current = performance.now();
    restoreFocus();

    const timerInterval = setInterval(() => {
      if (isGameOverRef.current) return;

      // When tab is hidden, freeze tick calculation
      if (document.visibilityState === 'hidden') return;

      const elapsedMs = performance.now() - startTimeRef.current;
      const elapsedSeconds = elapsedMs / 1000;
      // Fixed duration for 60s sprint and 30s blitz — bonus seconds are exclusively for 'streak' mode
      const totalAllowedDuration = mode === 'streak' ? initialDuration + bonusSecondsRef.current : initialDuration;
      const left = Math.max(0, totalAllowedDuration - elapsedSeconds);

      // Only update remainingTime state when displayed whole second changes to avoid re-render churn
      const currentCeilSec = Math.ceil(left);
      setRemainingTime((prev) => {
        if (Math.ceil(prev) !== currentCeilSec) {
          return left;
        }
        return prev;
      });

      // Throttle live statistics recalculation
      const now = performance.now();
      if (now - lastStatsUpdateRef.current >= 150) {
        lastStatsUpdateRef.current = now;
        const currentCorrect =
          completedWordsCharsRef.current +
          getActiveWordCorrectChars(inputValueRef.current, currentWordRef.current);
        const currentWpm = calculateWpm(currentCorrect, elapsedSeconds);
        const currentAcc = calculateAccuracy(currentCorrect, incorrectCharsRef.current);
        setLiveWpm(currentWpm);
        setLiveAccuracy(currentAcc);
      }

      if (left <= 0) {
        isGameOverRef.current = true;
        clearInterval(timerInterval);

        const finalDuration = Math.max(1, elapsedSeconds);
        const finalCorrect =
          completedWordsCharsRef.current +
          getActiveWordCorrectChars(inputValueRef.current, currentWordRef.current);
        const finalWpm = calculateWpm(finalCorrect, finalDuration);
        const finalAcc = calculateAccuracy(finalCorrect, incorrectCharsRef.current);

        onGameOver({
          score: scoreRef.current,
          wpm: finalWpm,
          accuracy: finalAcc,
          words: wordsRef.current,
          correctChars: finalCorrect,
          incorrectChars: incorrectCharsRef.current,
          skippedWords: skippedWordsRef.current,
          maxCombo: maxComboRef.current,
          mode,
        });
      }
    }, 60);

    return () => {
      clearInterval(timerInterval);
      if (skipFlashTimeoutRef.current) {
        clearTimeout(skipFlashTimeoutRef.current);
      }
      if (bonusAlertTimeoutRef.current) {
        clearTimeout(bonusAlertTimeoutRef.current);
      }
    };
  }, [initialDuration, mode, onGameOver, restoreFocus]);

  // Robust universal character tracking across all desktop and mobile inputs
  const handleInputChange = (newVal: string) => {
    if (isGameOverRef.current) return;

    // Detect new typos when typing ahead
    let hasNewError = false;
    if (newVal.length > inputValue.length) {
      const added = newVal.slice(inputValue.length);
      for (let i = 0; i < added.length; i++) {
        const charIndex = inputValue.length + i;
        if (charIndex >= currentWord.length || added[i] !== currentWord[charIndex]) {
          incorrectCharsRef.current += 1;
          hasNewError = true;
        }
      }
      if (hasNewError) {
        sound.playErrorSound();
      } else {
        sound.playKeyClick();
      }
    } else {
      // Deletion / Backspace
      sound.playKeyClick();
    }

    // Check if typed prefix has a typo to trigger tactile error shake & highlight
    let isPrefixMismatch = false;
    for (let i = 0; i < newVal.length; i++) {
      if (i >= currentWord.length || newVal[i] !== currentWord[i]) {
        isPrefixMismatch = true;
        break;
      }
    }

    inputValueRef.current = newVal;
    setInputValue(newVal);
    setIsInputError(isPrefixMismatch);
  };

  // Shared submit/skip handler used identically by SPACE, ENTER, and on-screen button
  const submitOrSkipWord = useCallback(
    (overrideValue?: string) => {
      if (isGameOverRef.current) return;

      const valToProcess = overrideValue !== undefined ? overrideValue : inputValueRef.current;
      const trimmedInput = valToProcess.trim().toLowerCase();

      // STATE A — NOTHING TYPED: no-op, no penalty, stay on current word
      if (trimmedInput.length === 0) {
        return;
      }

      // STATE C — FULLY COMPLETED
      if (trimmedInput === currentWord) {
        wordsRef.current += 1;
        setCompletedWords(wordsRef.current);

        // Record all characters of completed word + 1 space keystroke
        completedWordsCharsRef.current += currentWord.length + 1;

        // Score multiplier based on combo streak
        comboRef.current += 1;
        if (comboRef.current > maxComboRef.current) {
          maxComboRef.current = comboRef.current;
        }
        setCombo(comboRef.current);

        const comboMultiplier = comboRef.current >= 10 ? 2 : comboRef.current >= 5 ? 1.5 : 1;
        scoreRef.current += Math.round(1 * comboMultiplier);
        setScore(scoreRef.current);

        // Streak mode rewards +3 seconds bonus time per word
        if (mode === 'streak') {
          bonusSecondsRef.current += 3.0;
          setBonusTimeAlert(true);
          if (bonusAlertTimeoutRef.current) clearTimeout(bonusAlertTimeoutRef.current);
          bonusAlertTimeoutRef.current = setTimeout(() => {
            setBonusTimeAlert(false);
          }, 650);
        }

        // Audio feedback scaled with combo
        sound.playWordDing(comboRef.current);

        // Next word
        const nextWord = wordGenRef.current.getNextWord();
        setCurrentWord(nextWord);
        inputValueRef.current = '';
        setInputValue('');
        setIsInputError(false);
        return;
      }

      // STATE B — PARTIALLY TYPED (>= 1 character typed, but incomplete -> SKIP)
      skippedWordsRef.current += 1;
      comboRef.current = 0;
      setCombo(0);

      const correctInThisWord = getActiveWordCorrectChars(trimmedInput, currentWord);
      completedWordsCharsRef.current += correctInThisWord;
      const uncompletedChars = Math.max(1, currentWord.length - correctInThisWord);
      incorrectCharsRef.current += uncompletedChars;

      // Visual red flash feedback (~220ms)
      setIsSkipFlashing(true);
      if (skipFlashTimeoutRef.current) clearTimeout(skipFlashTimeoutRef.current);
      skipFlashTimeoutRef.current = setTimeout(() => {
        setIsSkipFlashing(false);
      }, 220);

      sound.playRandomSkipSound();

      const nextWord = wordGenRef.current.getNextWord();
      setCurrentWord(nextWord);
      inputValueRef.current = '';
      setInputValue('');
      setIsInputError(false);
    },
    [currentWord, mode]
  );

  // Render target word with interactive per-character feedback
  const renderTargetWord = () => {
    const chars = currentWord.split('');
    const charElements = chars.map((char, index) => {
      let statusClass = 'untyped';
      if (index < inputValue.length) {
        if (inputValue[index] === char) {
          statusClass = 'correct';
        } else {
          statusClass = 'incorrect';
        }
      } else if (index === inputValue.length) {
        statusClass = 'active-char';
      }
      return (
        <span key={`${char}-${index}`} className={`target-char ${statusClass}`}>
          {char}
        </span>
      );
    });

    if (inputValue.length > currentWord.length) {
      const extraChars = inputValue.slice(currentWord.length).split('');
      extraChars.forEach((extra, i) => {
        charElements.push(
          <span key={`extra-${i}`} className="target-char extra-char">
            {extra}
          </span>
        );
      });
    }

    return charElements;
  };

  return (
    <div className="app-container" tabIndex={-1}>
      {/* Visual Red Screen Flash for Skipped Words */}
      <div
        className={`skip-feedback-overlay ${isSkipFlashing ? 'flash-active' : ''}`}
        aria-hidden="true"
      />

      {/* Escape gameplay - on-screen button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onExit();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        className="escape-button"
        aria-label="Exit to home screen"
      >
        ← EXIT
      </button>

      {/* Top Header */}
      <Header score={score} remainingTime={remainingTime} bonusTimeAlert={mode === 'streak' && bonusTimeAlert} />

      {/* Main Target & Input Screen */}
      <main className="screen-center">
        {/* Combo Streak Indicator */}
        {combo >= 3 && (
          <div className="combo-streak-container">
            <span className="combo-streak-badge">
              COMBO &times;{combo}
              {combo >= 10 ? ' (2X)' : combo >= 5 ? ' (1.5X)' : ''}
            </span>
          </div>
        )}

        <div className="gameplay-target-container">
          <div className="type-this-label">type this:</div>
          <div className="target-word-display" aria-live="polite">
            {renderTargetWord()}
          </div>
        </div>

        <TypingInput
          ref={inputHandleRef}
          value={inputValue}
          onChange={handleInputChange}
          onSpace={submitOrSkipWord}
          onEnter={submitOrSkipWord}
          isError={isInputError}
        />
      </main>

      {/* Bottom Live Stats */}
      <StatsBar wpm={liveWpm} accuracy={liveAccuracy} words={completedWords} />
    </div>
  );
};

