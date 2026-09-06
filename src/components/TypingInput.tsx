import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';

export interface TypingInputHandles {
  focus: () => void;
  blur: () => void;
  getElement: () => HTMLInputElement | null;
  clear: () => void;
}

interface TypingInputProps {
  value: string;
  onChange: (val: string) => void;
  onSpace: (typedVal?: string) => void;
  onEnter: (typedVal?: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isError: boolean;
  disabled?: boolean;
}

export const TypingInput = forwardRef<TypingInputHandles, TypingInputProps>(
  (
    {
      value,
      onChange,
      onSpace,
      onEnter,
      onKeyDown,
      isError,
      disabled = false,
    },
    ref
  ) => {
    const internalInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        if (internalInputRef.current && document.activeElement !== internalInputRef.current) {
          internalInputRef.current.focus({ preventScroll: true });
        }
      },
      blur: () => {
        internalInputRef.current?.blur();
      },
      getElement: () => internalInputRef.current,
      clear: () => {
        if (internalInputRef.current) {
          internalInputRef.current.value = '';
        }
      },
    }));

    // Keep native input DOM element strictly synchronized with controlled React state
    useEffect(() => {
      if (internalInputRef.current && internalInputRef.current.value !== value) {
        internalInputRef.current.value = value;
      }
    }, [value]);

    useEffect(() => {
      if (!disabled && internalInputRef.current) {
        internalInputRef.current.focus({ preventScroll: true });
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

      onKeyDown?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawVal = e.target.value;

      // Android Virtual Keyboard / Gboard support & predictive suggestion insertion:
      // When pressing spacebar or enter on Android, or tapping a predictive word suggestion,
      // the space character ' ' is inserted directly into the input value.
      if (rawVal.endsWith(' ') || rawVal.endsWith('\n') || rawVal.includes(' ')) {
        const word = rawVal.trim().toLowerCase().replace(/[^a-z]/g, '');
        if (internalInputRef.current) {
          internalInputRef.current.value = '';
        }
        // Ensure inserted characters are accounted for in WPM before completing
        onChange(word);
        onSpace(word);
        return;
      }

      // Sanitize: lowercase, alphabetical only, no spaces
      const sanitized = rawVal.toLowerCase().replace(/[^a-z]/g, '');
      onChange(sanitized);
    };

    // Block pasting & drag-and-drop to preserve typing integrity
    const handlePrevent = (e: React.SyntheticEvent) => {
      e.preventDefault();
    };

    const handleMobileSubmit = (e: React.PointerEvent | React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onSpace();
      internalInputRef.current?.focus({ preventScroll: true });
    };

    return (
      <div className="input-wrapper">
        <input
          ref={internalInputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePrevent}
          onDrop={handlePrevent}
          onCopy={handlePrevent}
          onCut={handlePrevent}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          inputMode="text"
          enterKeyHint="go"
          disabled={disabled}
          className={`typing-native-input ${isError ? 'error animate-shake' : ''}`}
          aria-label="Typing input field"
        />

        <div className="desktop-space-hint">
          <div className="press-space-badge">PRESS SPACE TO SUBMIT</div>
        </div>

        {/* Tactile On-Screen Action Bar for Mobile / Touch Users */}
        <div className="mobile-touch-actions" aria-label="Mobile typing controls">
          <button
            type="button"
            className="mobile-action-btn mobile-submit-btn"
            onPointerDown={handleMobileSubmit}
            onClick={(e) => e.preventDefault()}
            aria-label="Submit word"
          >
            SPACE / SUBMIT
          </button>
        </div>
      </div>
    );
  }
);

TypingInput.displayName = 'TypingInput';

