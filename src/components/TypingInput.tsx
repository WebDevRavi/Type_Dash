import React, { useRef, useEffect } from 'react';

interface TypingInputProps {
  value: string;
  onChange: (val: string) => void;
  onSpace: () => void;
  onEnter: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isError: boolean;
  disabled?: boolean;
}

export const TypingInput: React.FC<TypingInputProps> = ({
  value,
  onChange,
  onSpace,
  onEnter,
  onKeyDown,
  isError,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // Guard against key-repeat firing multiple skip events from a single
    // held-down press (browsers repeat keydown while a key stays held).
    if (e.key === ' ') {
      e.preventDefault();
      if (e.repeat) return;
      onSpace();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.repeat) return;
      onEnter();
      return;
    }

    onKeyDown(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitize: lowercase, alphanumeric only, no spaces
    const sanitized = e.target.value.toLowerCase().replace(/[^a-z]/g, '');
    onChange(sanitized);
  };

  // Block pasting & drag-and-drop
  const handlePrevent = (e: React.SyntheticEvent) => {
    e.preventDefault();
  };

  return (
    <div className="input-wrapper">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePrevent}
        onDrop={handlePrevent}
        onCopy={handlePrevent}
        onCut={handlePrevent}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
        disabled={disabled}
        className={`typing-native-input ${isError ? 'error animate-shake' : ''}`}
        aria-label="Typing input field"
      />
      <div className="press-space-badge">PRESS SPACE TO SUBMIT</div>
    </div>
  );
};
