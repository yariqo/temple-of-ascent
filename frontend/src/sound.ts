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
  private nextBeat = 0;
  private beat = 0;
  muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem('toa-muted') === '1';
      this.musicOn = localStorage.getItem('toa-music') !== '0';
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
    this.startMusic();
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
    this.duck(2.5);
    const seq = [0, 4, 7, 12, 7, 12, 16];
    seq.forEach((s, i) => this.tone(330 * Math.pow(2, s / 12), 0.35, { type: 'sawtooth', vol: 0.07, at: i * 0.11 }));
    seq.forEach((s, i) => this.tone(330 * Math.pow(2, s / 12), 0.35, { type: 'triangle', vol: 0.12, at: i * 0.11 }));
  }
  coin() {
    this.tone(1800 + Math.random() * 600, 0.08, { type: 'triangle', vol: 0.06 });
  }

  /** bell with inharmonic partials – used for chimes */
  private bell(f: number, at = 0, vol = 0.12, dest?: AudioNode) {
    this.tone(f, 1.3, { type: 'sine', vol, at, dest });
    this.tone(f * 2.76, 0.55, { type: 'sine', vol: vol * 0.35, at, dest });
    this.tone(f * 5.4, 0.25, { type: 'sine', vol: vol * 0.15, at, dest });
  }
  /** little sparkling chime when the bonus is triggered */
  bonusChime() {
    this.duck(2.2);
    [880, 1109, 1319, 1760, 2217, 2637].forEach((f, i) => this.bell(f, i * 0.07, 0.11));
    this.noise(1.2, { freq: 7000, sweep: 12000, vol: 0.05, type: 'highpass', at: 0.1 });
    this.bell(1760, 0.55, 0.08);
    this.bell(2637, 0.62, 0.06);
  }
  /** heavy stone door of the temple slides open */
  doorOpen() {
    this.noise(1.5, { freq: 500, sweep: 140, vol: 0.28, type: 'lowpass', q: 3 });
    this.tone(52, 1.5, { type: 'sine', vol: 0.22, slide: 0.8, attack: 0.2 });
    this.tone(880, 0.8, { type: 'sine', vol: 0.06, at: 1.2 });
    this.tone(1320, 0.9, { type: 'sine', vol: 0.05, at: 1.28 });
  }
  menuOpen() {
    this.noise(0.28, { freq: 500, sweep: 2200, vol: 0.09 });
    this.tone(660, 0.18, { type: 'triangle', vol: 0.07, at: 0.08 });
  }
  toggle(on: boolean) {
    const [a, b] = on ? [660, 990] : [880, 587];
    this.tone(a, 0.16, { type: 'triangle', vol: 0.12 });
    this.tone(b, 0.26, { type: 'triangle', vol: 0.12, at: 0.09 });
  }
  purchase() {
    for (let i = 0; i < 5; i++) this.tone(1900 + i * 180, 0.09, { type: 'triangle', vol: 0.07, at: i * 0.045 });
    this.bell(1319, 0.22, 0.1);
    this.bell(1760, 0.3, 0.08);
  }
  whoosh() {
    this.noise(0.3, { freq: 300, sweep: 1600, vol: 0.08 });
  }

  // ---------------------------------------------------------------- music
  /*
   * Generative jungle music, no audio files:
   *   base game  – soft pad, wooden marimba melody, shaker, low toms, bird calls
   *   free spins – tempo up, temple drums, denser melody; more layers each stage
   */
  musicOn = true;
  private musicStage = 0;
  private padBus: BiquadFilterNode | null = null;

  setMusic(on: boolean) {
    this.musicOn = on;
    try {
      localStorage.setItem('toa-music', on ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (this.ctx) this.music.gain.setTargetAtTime(on ? 0.35 : 0, this.t, 0.3);
  }

  private duck(sec: number) {
    if (!this.ok() || !this.musicOn) return;
    const g = this.music.gain;
    g.cancelScheduledValues(this.t);
    g.setTargetAtTime(0.1, this.t, 0.05);
    g.setTargetAtTime(0.35, this.t + sec, 0.6);
  }

  /** stage 0 = base game, 1..4 = free-spin stages */
  setLoop(stage: number) {
    this.musicStage = Math.max(0, stage);
  }

  private startMusic() {
    if (this.loopTimer) return;
    this.padBus = this.ctx!.createBiquadFilter();
    this.padBus.type = 'lowpass';
    this.padBus.frequency.value = 1100;
    this.padBus.connect(this.music);
    this.music.gain.value = this.musicOn ? 0.35 : 0;
    this.nextBeat = this.t + 0.2;
    this.beat = 0;
    this.loopTimer = window.setInterval(() => {
      if (!this.ok()) return;
      // after a long pause (hidden tab) don't try to catch up
      if (this.nextBeat < this.t) this.nextBeat = this.t + 0.05;
      while (this.nextBeat < this.t + 0.3) {
        const st = this.musicStage;
        if (this.musicOn) this.musicStep(this.beat, st, this.nextBeat - this.t);
        const bpm = st > 0 ? 100 + st * 6 : 84;
        this.nextBeat += 60 / bpm / 2; // eighth notes
        this.beat++;
      }
    }, 50);
  }

  private musicStep(b: number, stage: number, at: number) {
    const d = this.music;
    const i = b % 8; // eighth inside the bar
    const bar = Math.floor(b / 8);
    const A = 220;
    // A minor: Am – F – C – G
    const chords = [
      [0, 3, 7],
      [-4, 0, 3],
      [3, 7, 10],
      [-2, 2, 5],
    ];
    const chord = chords[bar % 4];
    const barLen = (60 / (stage > 0 ? 100 + stage * 6 : 84) / 2) * 8;
    if (i === 0) {
      // pad (two slightly detuned voices per note)
      for (const n of chord) {
        const f = A * Math.pow(2, n / 12);
        this.tone(f, barLen * 1.1, { type: 'triangle', vol: stage > 0 ? 0.045 : 0.035, at, attack: 0.7, dest: this.padBus! });
        this.tone(f * 1.004, barLen * 1.1, { type: 'sine', vol: 0.03, at, attack: 0.9, dest: this.padBus! });
      }
    }
    // bass
    const root = 55 * Math.pow(2, (((chord[0] % 12) + 12) % 12) / 12);
    if (i === 0 || i === 3 || (stage > 0 && i === 6)) this.tone(root * 2, 0.45, { type: 'sine', vol: stage > 0 ? 0.2 : 0.14, at, dest: d });
    // marimba melody – two phrases with a variation, pentatonic so it fits every chord
    const phrases: (number | null)[][] = [
      [4, null, 2, null, 3, 2, null, 0],
      [2, null, 3, 4, null, 5, null, null],
      [4, null, 5, null, 4, 2, 3, null],
      [2, null, 0, null, 1, null, 0, null],
    ];
    const ph = phrases[bar % 4];
    let note = ph[i];
    if (stage > 0 && note === null && i % 2 === 1) note = ph[(i + 3) % 8]; // denser in the bonus
    if (note !== null && note !== undefined && !(stage === 0 && bar % 8 >= 6)) {
      const f = 440 * Math.pow(2, PENTA[note] / 12);
      this.marimba(f, at, stage > 0 ? 0.075 : 0.06);
      if (stage >= 3) this.marimba(f * 2, at, 0.03);
    }
    if (stage === 0) {
      // shaker + soft toms
      this.noise(0.04, { freq: 7500, vol: i % 2 ? 0.022 : 0.012, at, type: 'highpass', dest: d });
      if (i === 0 || i === 5) this.tone(95, 0.3, { type: 'sine', vol: 0.16, slide: 0.55, at, dest: d });
      // bird call now and then
      if (i === 2 && Math.random() < 0.22) {
        const f = 2300 + Math.random() * 900;
        for (let k = 0; k < 3; k++) this.tone(f, 0.07, { type: 'sine', vol: 0.025, slide: 1.35, at: at + k * 0.1, dest: d });
      }
    } else {
      this.drum(b, stage, at);
    }
  }

  private marimba(f: number, at: number, vol: number) {
    const d = this.music;
    this.tone(f, 0.35, { type: 'sine', vol, at, dest: d });
    this.tone(f * 4, 0.08, { type: 'sine', vol: vol * 0.3, at, dest: d });
    // echo
    this.tone(f, 0.3, { type: 'sine', vol: vol * 0.3, at: at + 0.33, dest: d });
  }

  private drum(b: number, stage: number, at: number) {
    const i = (b * 2) % 16;
    const d = this.music;
    if (i % 4 === 0) this.tone(70, 0.3, { type: 'sine', vol: 0.45, slide: 0.45, at, dest: d });
    if (i === 6 || i === 14) this.tone(160, 0.2, { type: 'sine', vol: 0.28, slide: 0.6, at, dest: d });
    if (stage >= 2) this.noise(0.05, { freq: 5000, vol: 0.04, at, dest: d });
    if (stage >= 3 && (i === 2 || i === 10)) this.tone(240, 0.15, { type: 'triangle', vol: 0.18, slide: 0.7, at, dest: d });
    if (stage >= 4 && i % 4 === 2) this.tone(330, 0.12, { type: 'triangle', vol: 0.12, slide: 0.7, at: at + 0.06, dest: d });
  }
}

export const sound = new Sound();
export type { Tier };
