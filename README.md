# TypeRush — Think Fast, Type Faster

A minimalist, tactile, typewriter-inspired browser typing-speed game.

---

## Overview

**TypeRush** is a clean, focused, and competitive web game designed to test how many words you can type in 60 seconds. Combining classic typewriter aesthetics with modern browser performance, TypeRush delivers an immediate, distraction-free typing sprint with real-time statistics and mechanical audio feedback.

---

## Features

- **Vintage Minimalist Design**: Warm paper palette, typewriter display typography, monospaced scoreboards, and subtle paper grain.
- **Precision 60-Second Clock**: High-accuracy `performance.now()` delta calculation immune to browser frame drops or tab throttling.
- **550+ Curated English Dictionary**: Common, recognizable 4–10 letter words chosen specifically for touch-typing flow.
- **Intelligent Non-Repeating Word Engine**: Rolling history queue ensures words don't repeat within active rounds.
- **Live Per-Character Visual Feedback**: Real-time letter matching, visual caret, and clear error cues.
- **Zero-Latency Web Audio API Synthesizer**: Native mechanical keyboard clicks, spacebar clacks, typewriter completion bell, and error cues with 0 external sound asset dependencies.
- **Comprehensive Statistics**: Real-time and end-of-game tracking of WPM (Words Per Minute), Accuracy %, Words completed, and Score.
- **Safe Local Persistence**: High scores, all-time records, and session history stored locally in `localStorage` with error handling.
- **Anti-Cheat Protection**: Clipboard paste, drag-and-drop, and context menu insertions are blocked during active gameplay.
- **Responsive & Accessible**: Works across desktop and mobile, with dark mode and reduced-motion support.

---

## Gameplay & Rules

1. **Home**: View your all-time best WPM score and click **START** (or press Enter).
2. **Countdown**: Watch the `3` → `2` → `1` → `GO!` countdown.
3. **Typing**: The target word is displayed centered on the screen. Type into the focused input box.
4. **Submitting Words**: Press **SPACE** or **ENTER** to submit.
   - If the typed word exactly matches the target word: Score increases by 1, word count increases, audio bell rings, and the next word appears instantly.
   - If the input does not match: The word is not submitted, an error state is indicated, and accuracy updates accordingly.
5. **Results**: At 60 seconds, the game automatically completes and displays your final WPM, Accuracy, Words, Score, and Personal Best celebration.
6. **Play Again**: Instantly restart a new sprint with no page refresh.

---

## Calculations

### Standard WPM (Words Per Minute)

$$\text{WPM} = \frac{\text{Correct Characters} / 5}{\text{Elapsed Minutes}}$$

Calculated continuously during the game and strictly finalized on the 60.0-second boundary.

### Accuracy

$$\text{Accuracy} = \frac{\text{Correct Characters}}{\text{Correct Characters} + \text{Incorrect Characters}} \times 100$$

### Score

$$\text{Score} = \text{Correctly Completed Words}$$

---

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Pure CSS / CSS Custom Properties
- **Audio**: Native Web Audio API (real-time procedural synthesis)
- **Effects**: canvas-confetti (celebration effects)

---

## Installation & Development

### 1. Clone or navigate to the repository:
```bash
cd "type dash"
```

### 2. Install dependencies:
```bash
npm install
```

### 3. Start development server:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Build for production:
```bash
npm run build
```

### 5. Preview production build:
```bash
npm run preview
```

---

## Project Structure

```text
type dash/
├── public/
│   ├── favicon.svg             # TypeRush T-key icon
│   └── logo.png                # Reference brand logo
├── src/
│   ├── assets/                 # Brand assets
│   ├── components/
│   │   ├── TypeRushLogo.tsx    # Logo rendering component
│   │   ├── Header.tsx          # SCORE & TIME top status bar
│   │   ├── HomeScreen.tsx      # Main menu & CTA
│   │   ├── CountdownScreen.tsx # 3 -> 2 -> 1 -> GO! sequence
│   │   ├── GameScreen.tsx      # Core typing screen
│   │   ├── TypingInput.tsx     # Underlined input with anti-cheat
│   │   ├── StatsBar.tsx        # Bottom live stats bar
│   │   ├── ResultsScreen.tsx   # Final score & summary
│   │   ├── StatsModal.tsx      # All-time statistics modal
│   │   └── SettingsModal.tsx   # Audio & theme settings
│   ├── data/
│   │   └── words.ts            # 550+ curated word dictionary
│   ├── game/
│   │   ├── gameConfig.ts       # Central game constants
│   │   ├── wordGenerator.ts    # Non-repeating random word engine
│   │   ├── statistics.ts       # WPM and accuracy formulas
│   │   ├── storage.ts          # LocalStorage management
│   │   └── sound.ts            # Web Audio API synthesizer
│   ├── styles/
│   │   ├── index.css           # Global layout & aesthetics
│   │   ├── variables.css       # Palette & font definitions
│   │   └── animations.css      # Restrained retro animations
│   ├── App.tsx                 # Root state machine
│   └── main.tsx                # Entrypoint
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## License

MIT License. Designed and built for the TypeRush typing sprint challenge.
