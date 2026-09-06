import React, { useEffect, useState, useRef } from 'react';
import { sound } from '../game/sound';

interface CountdownScreenProps {
  onCountdownComplete: () => void;
}

export const CountdownScreen: React.FC<CountdownScreenProps> = ({ onCountdownComplete }) => {
  const [displayValue, setDisplayValue] = useState<'3' | '2' | '1' | 'GO!'>('3');
  const lastStepRef = useRef<string>('');
  const completedRef = useRef<boolean>(false);

  useEffect(() => {
    let startMs = performance.now();
    let hiddenAt: number | null = null;
    let totalPausedMs = 0;

    const triggerStep = (step: '3' | '2' | '1' | 'GO!') => {
      if (lastStepRef.current === step) return;
      lastStepRef.current = step;
      setDisplayValue(step);
      sound.playCountdownTick(step === 'GO!');
    };

    triggerStep('3');

    const checkInterval = setInterval(() => {
      if (completedRef.current) return;
      if (document.visibilityState === 'hidden') return;

      const elapsed = performance.now() - startMs - totalPausedMs;

      if (elapsed >= 3400) {
        completedRef.current = true;
        clearInterval(checkInterval);
        onCountdownComplete();
      } else if (elapsed >= 2600) {
        triggerStep('GO!');
      } else if (elapsed >= 1800) {
        triggerStep('1');
      } else if (elapsed >= 900) {
        triggerStep('2');
      }
    }, 50);

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = performance.now();
      } else if (document.visibilityState === 'visible') {
        if (hiddenAt !== null) {
          totalPausedMs += performance.now() - hiddenAt;
          hiddenAt = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(checkInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [onCountdownComplete]);

  return (
    <div className="countdown-overlay" aria-live="assertive">
      <div className="countdown-content">
        {displayValue !== 'GO!' ? (
          <div key={displayValue} className="countdown-number">
            {displayValue}
          </div>
        ) : (
          <div className="countdown-go">GO!</div>
        )}
        <p className="countdown-hint">Get Ready to Type</p>
      </div>
    </div>
  );
};

