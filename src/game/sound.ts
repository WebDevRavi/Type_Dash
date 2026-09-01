// Zero-latency Web Audio API sound synthesizer for tactile mechanical keyboard and typewriter audio

export type SoundProfile = 'typewriter' | 'mechanical';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private profile: SoundProfile = 'typewriter';
  private volume: number = 0.8;

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
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('typerush_sound_enabled', String(enabled));
    } catch {
      // ignore
    }
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

  // Tactile key switch click
  public playKeyClick(): void {
    if (!this.soundEnabled || this.volume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const masterGain = this.volume;

    if (this.profile === 'typewriter') {
      // Vintage metallic hammer strike
      const bufferSize = ctx.sampleRate * 0.02;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600 + Math.random() * 500, t);
      filter.Q.setValueAtTime(4.0, t);

      const gain = ctx.createGain();
      // Boosted from 0.65 -> 0.9 so the mechanical strike is clearly
      // audible during gameplay while staying below the 1.0 headroom
      // ceiling (avoids clipping/distortion) and below the peak levels
      // used for skip/error/ding feedback sounds.
      gain.gain.setValueAtTime(0.9 * masterGain, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(t);
    } else {
      // Clicky mechanical switch
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(3200 + Math.random() * 400, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.008);

      // Boosted from 0.60 -> 0.85 for clearer, more satisfying audibility.
      gain.gain.setValueAtTime(0.85 * masterGain, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.012);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.012);
    }
  }

  // Spacebar submit thud
  public playSpaceThud(): void {
    if (!this.soundEnabled || this.volume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const masterGain = this.volume;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.06);

    gain.gain.setValueAtTime(0.35 * masterGain, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Typewriter bell / ding on successful word completion
  public playWordDing(): void {
    if (!this.soundEnabled || this.volume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const masterGain = this.volume;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1864.66, t); // A#6 high bell tone

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(3729.31, t); // overtone

    gain.gain.setValueAtTime(0.2 * masterGain, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.35);
    osc2.stop(t + 0.35);
  }

  // Muted error buzz for mistyped character
  public playErrorSound(): void {
    if (!this.soundEnabled || this.volume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const masterGain = this.volume;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);

    gain.gain.setValueAtTime(0.14 * masterGain, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Countdown tick
  public playCountdownTick(isGo: boolean = false): void {
    if (!this.soundEnabled || this.volume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const masterGain = this.volume;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, t);

    gain.gain.setValueAtTime(0.22 * masterGain, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isGo ? 0.3 : 0.15));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + (isGo ? 0.3 : 0.15));
  }

  // Collection of randomized short skip alert sounds (no immediate repeat)
  private lastSkipIndex: number = -1;

  public playRandomSkipSound(): void {
    if (!this.soundEnabled || this.volume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const soundCount = 4;
    let nextIndex: number;
    do {
      nextIndex = Math.floor(Math.random() * soundCount);
    } while (soundCount > 1 && nextIndex === this.lastSkipIndex);
    this.lastSkipIndex = nextIndex;

    const t = ctx.currentTime;
    const masterGain = this.volume;

    switch (nextIndex) {
      case 0: {
        // Descending double-blip alert (380Hz -> 240Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, t);
        osc.frequency.setValueAtTime(240, t + 0.05);
        gain.gain.setValueAtTime(0.18 * masterGain, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
        break;
      }
      case 1: {
        // Carriage tape slide / friction rip
        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, t);
        filter.frequency.exponentialRampToValueAtTime(250, t + 0.1);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25 * masterGain, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(t);
        break;
      }
      case 2: {
        // Fast dual-strike ratchet skip
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(280, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.09);
        gain.gain.setValueAtTime(0.15 * masterGain, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.09);
        break;
      }
      case 3:
      default: {
        // Muted low warning thud + downward chirp
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(320, t);
        osc1.frequency.exponentialRampToValueAtTime(140, t + 0.11);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(160, t);
        osc2.frequency.exponentialRampToValueAtTime(70, t + 0.11);
        gain.gain.setValueAtTime(0.22 * masterGain, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.11);
        osc2.stop(t + 0.11);
        break;
      }
    }
  }
}

export const sound = new SoundEngine();
