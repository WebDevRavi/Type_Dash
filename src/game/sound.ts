// Zero-latency Web Audio API sound synthesizer for tactile mechanical keyboard and typewriter audio
// Hardened with full exception-safety, clamped parameters, and graceful degradation

export type SoundProfile = 'typewriter' | 'mechanical';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true; // User's preference
  private crazyGamesMuted: boolean = false; // CrazyGames platform mute state
  private adMuted: boolean = false; // Temporary ad playback mute state
  private profile: SoundProfile = 'mechanical';
  private volume: number = 0.8;
  private typewriterNoiseBuffer: AudioBuffer | null = null;
  private skipNoiseBuffer: AudioBuffer | null = null;

  constructor() {
    try {
      const savedEnabled = localStorage.getItem('typerush_sound_enabled');
      if (savedEnabled !== null) {
        this.soundEnabled = savedEnabled === 'true';
      }
      const savedProfile = localStorage.getItem('typerush_sound_profile');
      if (savedProfile === 'mechanical' || savedProfile === 'typewriter') {
        this.profile = savedProfile;
      }
      const savedVolume = localStorage.getItem('typerush_sound_volume');
      if (savedVolume !== null) {
        const parsed = parseFloat(savedVolume);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.volume = parsed;
        }
      }
    } catch {
      this.soundEnabled = true;
    }

    // CrazyGames compliance: Auto-suspend AudioContext on tab background/blur, and resume on restore
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      const handleVisibility = () => {
        if (!this.ctx) return;
        if (document.visibilityState === 'hidden') {
          if (this.ctx.state === 'running') {
            this.ctx.suspend().catch(() => {});
          }
        } else if (document.visibilityState === 'visible') {
          if (this.ctx.state === 'suspended' && this.isEffectiveEnabled()) {
            this.ctx.resume().catch(() => {});
          }
        }
      };

      const handleBlur = () => {
        if (this.ctx && this.ctx.state === 'running') {
          this.ctx.suspend().catch(() => {});
        }
      };

      const handleFocus = () => {
        if (this.ctx && this.ctx.state === 'suspended' && document.visibilityState === 'visible' && this.isEffectiveEnabled()) {
          this.ctx.resume().catch(() => {});
        }
      };

      document.addEventListener('visibilitychange', handleVisibility);
      window.addEventListener('blur', handleBlur);
      window.addEventListener('focus', handleFocus);

      // Prime/unlock AudioContext on first user interaction (touch, click, keydown)
      const unlockAudio = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
    }
  }

  /**
   * Automatically disconnects audio graph nodes when source finishes playback,
   * guaranteeing immediate garbage collection and zero graph memory leaks.
   */
  private disconnectWhenEnded(source: AudioNode, ...extraNodes: AudioNode[]): void {
    try {
      if ('onended' in source) {
        (source as AudioScheduledSourceNode).onended = () => {
          try {
            source.disconnect();
            for (const node of extraNodes) {
              node.disconnect();
            }
          } catch {
            // Ignore
          }
        };
      }
    } catch {
      // Ignore
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch (err) {
      console.warn('[SoundEngine] Could not initialize AudioContext:', err);
      return null;
    }
  }

  /**
   * Safely ramps an AudioParam exponentially with fallback to linear.
   * Guarantees target is always strictly positive to satisfy Web Audio specs.
   */
  private safeRamp(param: AudioParam, target: number, endTime: number, startTime: number): void {
    const safeTarget = Math.max(0.0001, target);
    const safeEndTime = Math.max(startTime + 0.002, endTime);
    try {
      param.exponentialRampToValueAtTime(safeTarget, safeEndTime);
    } catch {
      try {
        param.linearRampToValueAtTime(safeTarget, safeEndTime);
      } catch {
        // Param assignment failed gracefully
      }
    }
  }

  /**
   * Effective sound state evaluates both user preference and platform mute.
   * CrazyGames mute takes absolute priority over user setting without overwriting it.
   */
  public isEffectiveEnabled(): boolean {
    return this.soundEnabled && !this.crazyGamesMuted && !this.adMuted;
  }

  public isEnabled(): boolean {
    return this.isEffectiveEnabled();
  }

  public getUserSetting(): boolean {
    return this.soundEnabled;
  }

  public isPlatformMuted(): boolean {
    return this.crazyGamesMuted;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('typerush_sound_enabled', String(enabled));
    } catch {
      // ignore
    }
  }

  public setCrazyGamesMuted(muted: boolean): void {
    this.crazyGamesMuted = muted;
  }

  public setAdMuted(muted: boolean): void {
    this.adMuted = muted;
  }

  public getProfile(): SoundProfile {
    return this.profile;
  }

  public setProfile(profile: SoundProfile): void {
    this.profile = profile;
    try {
      localStorage.setItem('typerush_sound_profile', profile);
    } catch {
      // ignore
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('typerush_sound_volume', String(this.volume));
    } catch {
      // ignore
    }
  }

  private getTypewriterNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.typewriterNoiseBuffer || this.typewriterNoiseBuffer.sampleRate !== ctx.sampleRate) {
      const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * 0.025));
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
      }
      this.typewriterNoiseBuffer = buffer;
    }
    return this.typewriterNoiseBuffer;
  }

  private getSkipNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.skipNoiseBuffer || this.skipNoiseBuffer.sampleRate !== ctx.sampleRate) {
      const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * 0.12));
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      this.skipNoiseBuffer = buffer;
    }
    return this.skipNoiseBuffer;
  }

  // Tactile key switch click
  public playKeyClick(): void {
    if (!this.isEffectiveEnabled() || this.volume <= 0) return;
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state === 'closed') return;

      const t = ctx.currentTime;
      const masterGain = Math.max(0.01, this.volume);

      if (this.profile === 'typewriter') {
        // Vintage metallic hammer strike (reusing pre-allocated noise buffer)
        const noise = ctx.createBufferSource();
        noise.buffer = this.getTypewriterNoiseBuffer(ctx);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600 + Math.random() * 500, t);
        filter.Q.setValueAtTime(4.0, t);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.9 * masterGain, t);
        this.safeRamp(gain.gain, 0.001, t + 0.025, t);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        this.disconnectWhenEnded(noise, filter, gain);
        noise.start(t);
        noise.stop(t + 0.025);
      } else {
        // Clicky mechanical switch
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(3200 + Math.random() * 400, t);
        this.safeRamp(osc.frequency, 800, t + 0.008, t);

        gain.gain.setValueAtTime(0.85 * masterGain, t);
        this.safeRamp(gain.gain, 0.001, t + 0.012, t);

        osc.connect(gain);
        gain.connect(ctx.destination);

        this.disconnectWhenEnded(osc, gain);
        osc.start(t);
        osc.stop(t + 0.012);
      }
    } catch {
      // Degrade gracefully without crashing
    }
  }

  // Spacebar submit thud
  public playSpaceThud(): void {
    if (!this.isEffectiveEnabled() || this.volume <= 0) return;
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state === 'closed') return;

      const t = ctx.currentTime;
      const masterGain = Math.max(0.01, this.volume);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, t);
      this.safeRamp(osc.frequency, 40, t + 0.06, t);

      gain.gain.setValueAtTime(0.35 * masterGain, t);
      this.safeRamp(gain.gain, 0.001, t + 0.06, t);

      osc.connect(gain);
      gain.connect(ctx.destination);

      this.disconnectWhenEnded(osc, gain);
      osc.start(t);
      osc.stop(t + 0.06);
    } catch {
      // Degrade gracefully
    }
  }

  // Typewriter bell / ding on successful word completion, with optional combo pitch elevation
  public playWordDing(comboLevel: number = 0): void {
    if (!this.isEffectiveEnabled() || this.volume <= 0) return;
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state === 'closed') return;

      const t = ctx.currentTime;
      const masterGain = Math.max(0.01, this.volume);

      // Scale pitch slightly up as combo streak climbs (up to +3 semitones)
      const pitchMultiplier = 1 + Math.min(0.25, comboLevel * 0.03);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1864.66 * pitchMultiplier, t);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(3729.31 * pitchMultiplier, t);

      gain.gain.setValueAtTime(0.2 * masterGain, t);
      this.safeRamp(gain.gain, 0.0001, t + 0.35, t);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      this.disconnectWhenEnded(osc1, gain);
      this.disconnectWhenEnded(osc2, gain);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.35);
      osc2.stop(t + 0.35);
    } catch {
      // Degrade gracefully
    }
  }

  // Muted error buzz for mistyped character
  public playErrorSound(): void {
    if (!this.isEffectiveEnabled() || this.volume <= 0) return;
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state === 'closed') return;

      const t = ctx.currentTime;
      const masterGain = Math.max(0.01, this.volume);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);

      gain.gain.setValueAtTime(0.14 * masterGain, t);
      this.safeRamp(gain.gain, 0.001, t + 0.08, t);

      osc.connect(gain);
      gain.connect(ctx.destination);

      this.disconnectWhenEnded(osc, gain);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch {
      // Degrade gracefully
    }
  }

  // Countdown tick
  public playCountdownTick(isGo: boolean = false): void {
    if (!this.isEffectiveEnabled() || this.volume <= 0) return;
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state === 'closed') return;

      const t = ctx.currentTime;
      const masterGain = Math.max(0.01, this.volume);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isGo ? 880 : 440, t);

      gain.gain.setValueAtTime(0.22 * masterGain, t);
      this.safeRamp(gain.gain, 0.001, t + (isGo ? 0.3 : 0.15), t);

      osc.connect(gain);
      gain.connect(ctx.destination);

      this.disconnectWhenEnded(osc, gain);
      osc.start(t);
      osc.stop(t + (isGo ? 0.3 : 0.15));
    } catch {
      // Degrade gracefully
    }
  }

  // Collection of randomized short skip alert sounds (no immediate repeat)
  private lastSkipIndex: number = -1;

  public playRandomSkipSound(): void {
    if (!this.isEffectiveEnabled() || this.volume <= 0) return;
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state === 'closed') return;

      const soundCount = 4;
      let nextIndex: number;
      do {
        nextIndex = Math.floor(Math.random() * soundCount);
      } while (soundCount > 1 && nextIndex === this.lastSkipIndex);
      this.lastSkipIndex = nextIndex;

      const t = ctx.currentTime;
      const masterGain = Math.max(0.01, this.volume);

      switch (nextIndex) {
        case 0: {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(380, t);
          osc.frequency.setValueAtTime(240, t + 0.05);
          gain.gain.setValueAtTime(0.18 * masterGain, t);
          this.safeRamp(gain.gain, 0.001, t + 0.12, t);
          osc.connect(gain);
          gain.connect(ctx.destination);
          this.disconnectWhenEnded(osc, gain);
          osc.start(t);
          osc.stop(t + 0.12);
          break;
        }
        case 1: {
          const noise = ctx.createBufferSource();
          noise.buffer = this.getSkipNoiseBuffer(ctx);
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(900, t);
          this.safeRamp(filter.frequency, 250, t + 0.1, t);
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.25 * masterGain, t);
          this.safeRamp(gain.gain, 0.001, t + 0.1, t);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          this.disconnectWhenEnded(noise, filter, gain);
          noise.start(t);
          noise.stop(t + 0.1);
          break;
        }
        case 2: {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(280, t);
          this.safeRamp(osc.frequency, 120, t + 0.09, t);
          gain.gain.setValueAtTime(0.15 * masterGain, t);
          this.safeRamp(gain.gain, 0.001, t + 0.09, t);
          osc.connect(gain);
          gain.connect(ctx.destination);
          this.disconnectWhenEnded(osc, gain);
          osc.start(t);
          osc.stop(t + 0.09);
          break;
        }
        case 3:
        default: {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.type = 'triangle';
          osc1.frequency.setValueAtTime(320, t);
          this.safeRamp(osc1.frequency, 140, t + 0.11, t);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(160, t);
          this.safeRamp(osc2.frequency, 70, t + 0.11, t);
          gain.gain.setValueAtTime(0.22 * masterGain, t);
          this.safeRamp(gain.gain, 0.001, t + 0.11, t);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          this.disconnectWhenEnded(osc1, gain);
          this.disconnectWhenEnded(osc2, gain);
          osc1.start(t);
          osc2.start(t);
          osc1.stop(t + 0.11);
          osc2.stop(t + 0.11);
          break;
        }
      }
    } catch {
      // Degrade gracefully
    }
  }
}

export const sound = new SoundEngine();

