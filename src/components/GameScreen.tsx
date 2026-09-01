import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './Header';
import { TypingInput } from './TypingInput';
import { StatsBar } from './StatsBar';
import { WordGenerator } from '../game/wordGenerator';
import { calculateWpm, calculateAccuracy } from '../game/statistics';
import { sound } from '../game/sound';
import { GAME_CONFIG } from '../game/gameConfig';

interface GameScreenProps {
  onGameOver: (results: {
    score: number;
    wpm: number;
    accuracy: number;
    words: number;
    correctChars: number;
    incorrectChars: number;
    skippedWords: number;
  }) => void;
  onExit: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onGameOver, onExit }) => {
  const wordGenRef = useRef<WordGenerator>(new WordGenerator());
  const [currentWord, setCurrentWord] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [isInputError, setIsInputError] = useState<boolean>(false);
  const [isSkipFlashing, setIsSkipFlashing] = useState<boolean>(false);
  const skipFlashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Statistics state
  const [score, setScore] = useState<number>(0);
  const [completedWords, setCompletedWords] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>(GAME_CONFIG.durationSeconds);
  const [liveWpm, setLiveWpm] = useState<number>(0);
  const [liveAccuracy, setLiveAccuracy] = useState<number>(100);

  // Authoritative session metrics
  const startTimeRef = useRef<number>(0);
  const isGameOverRef = useRef<boolean>(false);
  const correctCharsRef = useRef<number>(0);
  const incorrectCharsRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const wordsRef = useRef<number>(0);
  const skippedWordsRef = useRef<number>(0);

  // Initialize first word & timer on mount
  useEffect(() => {
    const firstWord = wordGenRef.current.getNextWord();
    setCurrentWord(firstWord);
    startTimeRef.current = performance.now();

    const timerInterval = setInterval(() => {
      if (isGameOverRef.current) return;

      const elapsedMs = performance.now() - startTimeRef.current;
      const elapsedSeconds = elapsedMs / 1000;
      const left = Math.max(0, GAME_CONFIG.durationSeconds - elapsedSeconds);

      setRemainingTime(left);

      // Cumulative live statistics across session
      const currentWpm = calculateWpm(correctCharsRef.current, elapsedSeconds);
      const currentAcc = calculateAccuracy(correctCharsRef.current, incorrectCharsRef.current);
      setLiveWpm(currentWpm);
      setLiveAccuracy(currentAcc);

      if (left <= 0) {
        isGameOverRef.current = true;
        clearInterval(timerInterval);

        // Finalize authoritative cumulative results
        const finalWpm = calculateWpm(correctCharsRef.current, GAME_CONFIG.durationSeconds);
        const finalAcc = calculateAccuracy(correctCharsRef.current, incorrectCharsRef.current);

        onGameOver({
          score: scoreRef.current,
          wpm: finalWpm,
          accuracy: finalAcc,
          words: wordsRef.current,
          correctChars: correctCharsRef.current,
          incorrectChars: incorrectCharsRef.current,
          skippedWords: skippedWordsRef.current,
        });
      }
    }, 50);

    return () => {
      clearInterval(timerInterval);
      if (skipFlashTimeoutRef.current) {
        clearTimeout(skipFlashTimeoutRef.current);
      }
    };
  }, [onGameOver]);

  const handleInputChange = (val: string) => {
    if (isGameOverRef.current) return;
    setInputValue(val);
    setIsInputError(false);

    // Play tactile mechanical key click
    sound.playKeyClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isGameOverRef.current) return;

    // Track accuracy on printable alphabet keys
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      const nextIndex = inputValue.length;
      const typedChar = e.key.toLowerCase();

      if (nextIndex < currentWord.length && typedChar === currentWord[nextIndex]) {
        correctCharsRef.current += 1;
      } else {
        incorrectCharsRef.current += 1;
        sound.playErrorSound();
      }
    }
  };

  // Shared submit/skip handler used identically by BOTH the ENTER key and
  // the SPACE key (per the game's skip rules). Single implementation so
  // the two input methods can never diverge and a single keypress can
  // never double-trigger a skip.
  //
  // STATE A: 0 characters typed -> DO NOTHING (no skip, no penalty, stay on current word)
  // STATE B: >=1 characters typed and incomplete -> SKIP WORD (accuracy reduced, word count +0, next word)
  // STATE C: Fully completed -> SUCCESS (word count +1, accuracy updated, next word)
  const skipCurrentWord = useCallback(() => {
    if (isGameOverRef.current) return;

    const trimmedInput = inputValue.trim().toLowerCase();

    // STATE A — NOTHING TYPED: no-op, no penalty, no sound.
    if (trimmedInput.length === 0) {
      return;
    }

    // STATE C — FULLY COMPLETED
    if (trimmedInput === currentWord) {
      // 1. Count word as completed
      wordsRef.current += 1;
      setCompletedWords(wordsRef.current);

      // 2. Increase score
      scoreRef.current += 1;
      setScore(scoreRef.current);

      // 3. Audio feedback
      sound.playWordDing();

      // 4. Generate new non-repeating word
      const nextWord = wordGenRef.current.getNextWord();
      setCurrentWord(nextWord);

      // 5. Clear input
      setInputValue('');
      setIsInputError(false);
      return;
    }

    // STATE B — PARTIALLY TYPED (>= 1 character typed, but incomplete)
    // 1. Skip current word (completedWords does NOT increase)
    skippedWordsRef.current += 1;

    // 2. Apply accuracy penalty for uncompleted portion
    let correctInThisWord = 0;
    for (let i = 0; i < Math.min(trimmedInput.length, currentWord.length); i++) {
      if (trimmedInput[i] === currentWord[i]) {
        correctInThisWord++;
      }
    }
    const uncompletedChars = Math.max(1, currentWord.length - correctInThisWord);
    incorrectCharsRef.current += uncompletedChars;

    // 3. Visual red flash feedback (brief, ~200ms)
    setIsSkipFlashing(true);
    if (skipFlashTimeoutRef.current) clearTimeout(skipFlashTimeoutRef.current);
    skipFlashTimeoutRef.current = setTimeout(() => {
      setIsSkipFlashing(false);
    }, 220);

    // 4. Audio feedback: randomized short skip alert sound (respects audio settings)
    sound.playRandomSkipSound();

    // 5. Move immediately to next word
    const nextWord = wordGenRef.current.getNextWord();
    setCurrentWord(nextWord);

    // 6. Clear input
    setInputValue('');
    setIsInputError(false);
  }, [inputValue, currentWord]);

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

    // If user typed extra letters past word length, display them in red
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
    <div className="app-container">
      {/* Visual Red Screen Flash for Skipped Words */}
      <div
        className={`skip-feedback-overlay ${isSkipFlashing ? 'flash-active' : ''}`}
        aria-hidden="true"
      />

      {/* Escape gameplay - top-left, mirrors the physical Escape key */}
      <button
        type="button"
        onClick={onExit}
        className="escape-button"
        aria-label="Exit to home screen"
      >
        ← ESCAPE
      </button>

      {/* Top Header */}
      <Header score={score} remainingTime={remainingTime} />

      {/* Main Target & Input Screen */}
      <main className="screen-center">
        <div className="gameplay-target-container">
          <div className="type-this-label">type this:</div>
          <div className="target-word-display" aria-live="polite">
            {renderTargetWord()}
          </div>
        </div>

        <TypingInput
          value={inputValue}
          onChange={handleInputChange}
          onSpace={skipCurrentWord}
          onEnter={skipCurrentWord}
          onKeyDown={handleKeyDown}
          isError={isInputError}
        />
      </main>

      {/* Bottom Live Stats */}
      <StatsBar wpm={liveWpm} accuracy={liveAccuracy} words={completedWords} />
    </div>
  );
};
