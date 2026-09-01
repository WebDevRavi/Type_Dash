import React, { useEffect, useState } from 'react';
import { sound } from '../game/sound';

interface CountdownScreenProps {
  onCountdownComplete: () => void;
}

export const CountdownScreen: React.FC<CountdownScreenProps> = ({ onCountdownComplete }) => {
  const [step, setStep] = useState<number>(3);
  const [isGo, setIsGo] = useState<boolean>(false);

  useEffect(() => {
    // Play initial sound
    sound.playCountdownTick(false);

    const timer3 = setTimeout(() => {
      setStep(2);
      sound.playCountdownTick(false);
    }, 1000);

    const timer2 = setTimeout(() => {
      setStep(1);
      sound.playCountdownTick(false);
    }, 2000);

    const timer1 = setTimeout(() => {
      setIsGo(true);
      sound.playCountdownTick(true);
    }, 3000);

    const timerGo = setTimeout(() => {
      onCountdownComplete();
    }, 3600);

    return () => {
      clearTimeout(timer3);
      clearTimeout(timer2);
      clearTimeout(timer1);
      clearTimeout(timerGo);
    };
  }, [onCountdownComplete]);

  return (
    <div className="countdown-overlay">
      <div className="countdown-content">
        {!isGo ? (
          <div key={step} className="countdown-number">
            {step}
          </div>
        ) : (
          <div className="countdown-go">GO!</div>
        )}
        <p className="countdown-hint">Get Ready to Type</p>
      </div>
    </div>
  );
};
