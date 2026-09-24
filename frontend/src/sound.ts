/**
 * Synthesised sound effects + drum loop (Web Audio, no audio files).
 * Starts silent; the context is created on the first user interaction (browser rule).
 */

type Tier = 'stone' | 'jade' | 'gold' | 'obsidian' | 'sun';

const PENTA = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24]; // minor pentatonic steps

class Sound {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private music!: GainNode;
  private noiseBuf!: AudioBuffer;
  private loopTimer = 0;
  private loopStage = -1;
  private nextBeat = 0;
  private beat = 0;
  muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem('toa-muted') === '1';
    } catch {
      /* storage blocked */
    }
  }

  /** Call from a click / key handler. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(this.ctx.destination);
    this.sfx = this.ctx.createGain();
    this.sfx.gain.value = 0.9;
    this.sfx.connect(this.master);
    this.music = this.ctx.createGain();
    this.music.gain.value = 0.35;
    this.music.connect(this.master);
    const len = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  setMuted(m: boolean) {
    this.muted = m;
    try {
      localStorage.setItem('toa-muted', m ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  private get t() {
    return this.ctx!.currentTime;
  }
  private ok() {
    return !!this.ctx && this.ctx.state === 'running';
  }

  private tone(freq: number, dur: number, o: { type?: OscillatorType; vol?: number; at?: number; slide?: number; attack?: number; dest?: AudioNode } = {}) {
    if (!this.ok()) return;
    const c = this.ctx!;
    const at = this.t + (o.at ?? 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, at);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * o.slide), at + dur);
    const v = o.vol ?? 0.3;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(v, at + (o.attack ?? 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g).connect(o.dest ?? this.sfx);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  private noise(dur: number, o: { vol?: number; at?: number; freq?: number; q?: number; type?: BiquadFilterType; sweep?: number; dest?: AudioNode } = {}) {
    if (!this.ok()) return;
    const c = this.ctx!;
    const at = this.t + (o.at ?? 0);
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = o.type ?? 'bandpass';
    f.frequency.setValueAtTime(o.freq ?? 1200, at);
    if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, at + dur);
    f.Q.value = o.q ?? 1;
    const g = c.createGain();
    g.gain.setValueAtTime(o.vol ?? 0.3, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(o.dest ?? this.sfx);
    src.start(at, Math.random() * 0.5);
    src.stop(at + dur + 0.05);
  }

  // ---------------------------------------------------------------- effects
  click() {
    this.tone(900, 0.05, { type: 'triangle', vol: 0.12 });
  }
  spinStart() {
    this.noise(0.35, { freq: 400, sweep: 2400, vol: 0.12, type: 'bandpass' });
  }
  reelStop(i: number) {
    this.tone(90 - i * 4, 0.18, { type: 'sine', vol: 0.45, slide: 0.5 });
    this.noise(0.08, { freq: 2200, vol: 0.08 });
  }
  anticipation() {
    this.tone(220, 1.1, { type: 'sawtooth', vol: 0.06, slide: 2, attack: 0.3 });
    this.noise(1.1, { freq: 600, sweep: 3000, vol: 0.05, attack: 0.3 } as any);
  }
  scatterLand(n: number) {
    const base = 440 * Math.pow(2, n / 6);
    this.tone(base, 0.5, { type: 'triangle', vol: 0.22 });
    this.tone(base * 1.5, 0.6, { type: 'sine', vol: 0.12, at: 0.05 });
  }
  steleTick() {
    this.tone(1400 + Math.random() * 300, 0.03, { type: 'square', vol: 0.03 });
  }
  steleReveal(tier: Tier) {
    const map: Record<Tier, number[]> = {
      stone: [392],
      jade: [523, 659],
      gold: [659, 784, 988],
      obsidian: [440, 554, 659, 880],
      sun: [523, 659, 784, 1047, 1319],
    };
    map[tier].forEach((f, i) => this.tone(f, 0.5 + i * 0.05, { type: 'triangle', vol: 0.16, at: i * 0.06 }));
    if (tier === 'sun' || tier === 'obsidian') this.gong(0.25);
  }
  win(level: number) {
    // short pentatonic run, longer for bigger wins
    const n = Math.min(3 + level, 9);
    for (let i = 0; i < n; i++) this.tone(392 * Math.pow(2, PENTA[i] / 12), 0.22, { type: 'triangle', vol: 0.14, at: i * 0.06 });
  }
  multiply() {
    this.tone(180, 0.6, { type: 'sawtooth', vol: 0.08, slide: 3 });
    this.tone(660, 0.5, { type: 'triangle', vol: 0.18, at: 0.45 });
    this.tone(990, 0.6, { type: 'triangle', vol: 0.12, at: 0.5 });
  }
  roar(golden: boolean) {
    this.noise(1.2, { freq: 220, sweep: 90, q: 2, vol: 0.55, type: 'lowpass' });
    this.tone(70, 1.0, { type: 'sawtooth', vol: 0.18, slide: 0.6 });
    if (golden) this.tone(880, 0.8, { type: 'triangle', vol: 0.12, at: 0.5 });
  }
  thud() {
    this.tone(60, 0.25, { type: 'sine', vol: 0.5, slide: 0.5 });
    this.noise(0.15, { freq: 300, vol: 0.2, type: 'lowpass' });
  }
  rune() {
    this.tone(1175, 0.35, { type: 'sine', vol: 0.14 });
    this.tone(1568, 0.4, { type: 'sine', vol: 0.1, at: 0.06 });
  }
  gong(vol = 0.35) {
    [110, 164.8, 220, 277].forEach((f, i) => this.tone(f, 2.2, { type: 'sine', vol: vol / (i + 1) }));
    this.noise(0.4, { freq: 800, vol: 0.08 });
  }
  fanfare() {
    const seq = [0, 4, 7, 12, 7, 12, 16];
    seq.forEach((s, i) => this.tone(330 * Math.pow(2, s / 12), 0.35, { type: 'sawtooth', vol: 0.07, at: i * 0.11 }));
    seq.forEach((s, i) => this.tone(330 * Math.pow(2, s / 12), 0.35, { type: 'triangle', vol: 0.12, at: i * 0.11 }));
  }
  coin() {
    this.tone(1800 + Math.random() * 600, 0.08, { type: 'triangle', vol: 0.06 });
  }

  // ---------------------------------------------------------------- drum loop
  /** stage 0 = off, 1..4 = free spin stages (more layers each stage) */
  setLoop(stage: number) {
    if (stage === this.loopStage) return;
    this.loopStage = stage;
    clearInterval(this.loopTimer);
    if (!this.ctx || stage <= 0) return;
    this.nextBeat = this.t + 0.1;
    this.beat = 0;
    const bpm = 96 + stage * 8;
    const spb = 60 / bpm / 2; // eighth notes
    this.loopTimer = window.setInterval(() => {
      if (!this.ok()) return;
      while (this.nextBeat < this.t + 0.25) {
        this.drum(this.beat, stage, this.nextBeat - this.t);
        this.nextBeat += spb;
        this.beat++;
      }
    }, 60);
  }

  private drum(b: number, stage: number, at: number) {
    const i = b % 16;
    const d = this.music;
    if (i % 4 === 0) this.tone(70, 0.3, { type: 'sine', vol: 0.5, slide: 0.45, at, dest: d });
    if (stage >= 1 && (i === 6 || i === 14)) this.tone(160, 0.2, { type: 'sine', vol: 0.3, slide: 0.6, at, dest: d });
    if (stage >= 2 && i % 2 === 1) this.noise(0.05, { freq: 5000, vol: 0.05, at, dest: d });
    if (stage >= 3 && (i === 3 || i === 11)) this.tone(240, 0.15, { type: 'triangle', vol: 0.2, slide: 0.7, at, dest: d });
    if (stage >= 4 && i % 4 === 2) {
      const f = 220 * Math.pow(2, PENTA[(b >> 2) % 5] / 12);
      this.tone(f, 0.4, { type: 'triangle', vol: 0.08, at, dest: d });
    }
  }
}

export const sound = new Sound();
export type { Tier };
