/**
 * Synthesizes procedural African-inspired music and sound effects using Web Audio API.
 * Features multi-layered dynamic soundtrack that builds as memories are restored.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;
  private musicInterval: number | null = null;
  private memoryLevel: number = 0; // 0 to 4 layers

  // Pentatonic notes in Hz (African D-major pentatonic: D3, F#3, G3/A3, B3, D4, E4, F#4, A4, B4)
  private readonly KALIMBA_SCALE = [146.83, 185.00, 220.00, 246.94, 293.66, 329.63, 369.99, 440.00, 493.88, 587.33];
  private readonly KORA_SCALE = [220.00, 246.94, 277.18, 329.63, 369.99, 440.00, 554.37, 659.25];

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Start ambient wind
      this.startSavannaAmbience();
    } catch {
      // Audio not permitted yet
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMemoryLevel(level: number) {
    this.memoryLevel = Math.max(0, Math.min(4, level));
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }
  }

  public setVolumes(master: number, music: number, sfx: number) {
    if (!this.ctx) return;
    if (this.masterGain) this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : master, this.ctx.currentTime, 0.05);
    if (this.musicGain) this.musicGain.gain.setTargetAtTime(music, this.ctx.currentTime, 0.05);
    if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.05);
  }

  // --- Dynamic Procedural Music ---
  public startMusic() {
    this.init();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.resume();

    let step = 0;
    const tempoMs = 380; // Gentle savanna tempo

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.isMuted) return;

      // Base layer 0+: Gentle Kalimba arpeggios
      if (step % 2 === 0) {
        const noteIdx = [0, 2, 4, 3, 5, 4, 6, 5][(step / 2) % 8];
        const freq = this.KALIMBA_SCALE[noteIdx % this.KALIMBA_SCALE.length];
        this.playKalimbaNote(freq, 0.18, 0.8);
      }

      // Layer 1+: Percussive Udu / Log drum pulse (unlocked with Memory 1)
      if (this.memoryLevel >= 1) {
        if (step % 4 === 0) {
          this.playUduDrum(85, 0.22); // Low resonance
        } else if (step % 4 === 2) {
          this.playUduDrum(130, 0.14); // Mid snap
        }
      }

      // Layer 2+: Kora Harp counterpoint (unlocked with Memory 2)
      if (this.memoryLevel >= 2) {
        if (step % 3 === 0) {
          const koraIdx = [1, 3, 5, 2, 4, 6][(step / 3) % 6];
          const freq = this.KORA_SCALE[koraIdx % this.KORA_SCALE.length];
          this.playKoraNote(freq, 0.16);
        }
      }

      // Layer 3+: Ancestral flute/drone pads (unlocked with Memory 3)
      if (this.memoryLevel >= 3) {
        if (step % 16 === 0) {
          this.playDroneChime([146.83, 220.00, 329.63], 3.5, 0.12);
        }
      }

      // Layer 4+: Golden Baobab Full Bloom (Memory 4)
      if (this.memoryLevel >= 4) {
        if (step % 8 === 4) {
          this.playKalimbaNote(this.KALIMBA_SCALE[8], 0.22, 1.2);
        }
      }

      step++;
    }, tempoMs);
  }

  public stopMusic() {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
  }

  // --- Sound Effects ---

  /** The signature sound when player presses R to peek into the past */
  public playRememberActivate() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;

    // 1. Low mystic gong / sub swell
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(65, t);
    subOsc.frequency.exponentialRampToValueAtTime(110, t + 0.4);
    subGain.gain.setValueAtTime(0.4, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 1.3);

    // 2. Rising ethereal harmonic shimmer
    [293.66, 440.0, 587.33, 880.0].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq * 0.9, t + i * 0.06);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, t + 0.5 + i * 0.06);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2 - i * 0.03, t + 0.1 + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.6);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + i * 0.06);
      osc.stop(t + 1.8);
    });
  }

  /** Sound when REMEMBER ability expires or is dismissed */
  public playRememberDeactivate() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.6);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.75);
  }

  /** Satisfying pickup sound for Memory Fragments */
  public playMemoryCollected() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    // Chime arpeggio sequence
    const notes = [293.66, 369.99, 440.00, 587.33, 739.99, 880.00];
    notes.forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = index % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t + index * 0.1);

      gain.gain.setValueAtTime(0, t + index * 0.1);
      gain.gain.linearRampToValueAtTime(0.28, t + index * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + index * 0.1 + 1.4);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + index * 0.1);
      osc.stop(t + index * 0.1 + 1.5);
    });
  }

  /** Puzzle solve resonance (e.g. bridge connects, river gate turns) */
  public playPuzzleSolve() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Majestic chord
    [146.83, 220.00, 293.66, 440.00].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 2.6);
    });
  }

  /** Water gate activation & rushing river sound */
  public playWaterRush() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Filtered noise for rushing water
    const bufferSize = this.ctx.sampleRate * 3.0;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.linearRampToValueAtTime(1200, t + 1.5);
    filter.frequency.exponentialRampToValueAtTime(500, t + 3.0);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 3.0);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start(t);
    whiteNoise.stop(t + 3.1);
  }

  /** Shrine totem activation chord */
  public playShrineTone(stepIndex: number) {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const freqs = [329.63, 440.00, 587.33]; // E4, A4, D5
    const freq = freqs[stepIndex % freqs.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 1.3);
  }

  /** Gentle shrine error reset sound */
  public playGentleError() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.4);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  /** Jump / climb vault sound */
  public playJump() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.16);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  /** Footstep rustle sound */
  public playFootstep() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90 + Math.random() * 30, t);
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  /** UI click */
  public playButtonClick() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.08);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  /** Grand finale victory flourish when Baobab re-awakens */
  public playBaobabRestoration() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Harmonic triumphant chord progression
    const chords = [
      [220, 277.18, 329.63, 440],
      [246.94, 293.66, 369.99, 493.88],
      [293.66, 369.99, 440.00, 587.33],
      [440.00, 554.37, 659.25, 880.00]
    ];

    chords.forEach((chord, step) => {
      chord.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + step * 0.7);
        gain.gain.setValueAtTime(0, t + step * 0.7);
        gain.gain.linearRampToValueAtTime(0.2, t + step * 0.7 + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + step * 0.7 + 2.0);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t + step * 0.7);
        osc.stop(t + step * 0.7 + 2.2);
      });
    });
  }

  // --- Internal instrument synthesizers ---

  private playKalimbaNote(freq: number, volume: number, decaySec: number) {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    // Warm chime like wooden tines
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    // Initial click/strike transient
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(freq * 3.5, t);
    clickGain.gain.setValueAtTime(volume * 0.6, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decaySec);

    osc.connect(gain);
    click.connect(clickGain);
    gain.connect(this.musicGain);
    clickGain.connect(this.musicGain);

    osc.start(t);
    click.start(t);
    osc.stop(t + decaySec + 0.1);
    click.stop(t + 0.05);
  }

  private playKoraNote(freq: number, volume: number) {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';

    // Lowpass filter to simulate calabash gourd acoustic resonance
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(450, t + 0.6);

    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + 0.9);
  }

  private playUduDrum(pitch: number, volume: number) {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.6, t + 0.25);

    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  private playDroneChime(freqs: number[], duration: number, volume: number) {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;

    freqs.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume, t + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(gain);
      gain.connect(this.musicGain!);
      osc.start(t);
      osc.stop(t + duration + 0.1);
    });
  }

  private startSavannaAmbience() {
    if (!this.ctx || !this.masterGain) return;
    // Ambient gentle pink/filtered noise for savanna wind
    try {
      const bufferSize = this.ctx.sampleRate * 2.0;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.96 * b1 + white * 0.11;
        b2 = 0.86 * b2 + white * 0.25;
        data[i] = (b0 + b1 + b2) * 0.2;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start();
    } catch {
      // Ignored if browser policy blocks autoplay before interaction
    }
  }
}

export const soundEngine = new SoundEngine();
