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
  /** bonus tease: rising tension + heartbeat for the given time; higher level = later reel = more intense */
  tease(seconds: number, level = 1) {
    if (!this.ok()) return;
    const dur = Math.max(0.6, seconds);
    this.duck(dur + 0.3);
    const base = 180 * Math.pow(2, (level - 1) / 4);
    this.tone(base, dur, { type: 'sawtooth', vol: 0.05, slide: 2.4, attack: dur * 0.6 });
    this.tone(base * 1.5, dur, { type: 'triangle', vol: 0.05, slide: 2.4, attack: dur * 0.7 });
    this.noise(dur, { freq: 500, sweep: 5000, vol: 0.06, type: 'bandpass' });
    // heartbeat, getting faster
    let at = 0.05;
    let gap = 0.5;
    while (at < dur - 0.1) {
      this.tone(62, 0.18, { type: 'sine', vol: 0.4, slide: 0.6, at });
      this.tone(58, 0.16, { type: 'sine', vol: 0.28, slide: 0.6, at: at + 0.14 });
      at += gap;
      gap = Math.max(0.28, gap * 0.9);
    }
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
  /** one stele added to the multiplier – rising pitch */
  multTick(i: number) {
    const f = 523 * Math.pow(2, Math.min(i, 12) * 2 / 12);
    this.tone(f, 0.22, { type: 'triangle', vol: 0.16 });
    this.tone(f * 1.5, 0.3, { type: 'sine', vol: 0.08, at: 0.03 });
  }
  /** a stele bursts into bronze (1), diamond (2) or obsidian (3) */
  steleUpgrade(lvl: number) {
    if (!this.ok()) return;
    this.noise(0.25, { freq: 900, sweep: 300, vol: 0.2, type: 'lowpass' });
    this.tone(90, 0.35, { type: 'sine', vol: 0.35, slide: 0.5 });
    const base = [0, 784, 1047, 1319][lvl];
    [0, 4, 7, 12].slice(0, 2 + lvl).forEach((st, i) => this.tone(base * Math.pow(2, st / 12), 0.6, { type: 'triangle', vol: 0.1, at: 0.04 + i * 0.05 }));
    this.noise(0.8, { freq: 6000, sweep: 12000, vol: 0.05 * lvl, type: 'highpass', at: 0.05 });
    if (lvl >= 3) this.gong(0.3);
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
  /** rising tension before the next big-win tier */
  riser(sec: number) {
    if (!this.ok()) return;
    const d = Math.max(0.3, sec);
    this.noise(d, { freq: 300, sweep: 6000, vol: 0.07, type: 'bandpass' });
    this.tone(110, d, { type: 'sawtooth', vol: 0.035, slide: 4, attack: d * 0.8 });
  }
  /** impact when a new big-win tier slams in */
  boom(level: number) {
    if (!this.ok()) return;
    this.tone(48, 1.2, { type: 'sine', vol: 0.6, slide: 0.4 });
    this.noise(0.9, { freq: 1800, sweep: 120, vol: 0.3, type: 'lowpass' });
    this.noise(1.4, { freq: 9000, sweep: 5000, vol: 0.06 + level * 0.02, type: 'highpass', at: 0.02 });
  }
  /** big-win tier upgrade: brass stab + cymbal, higher and fuller each tier */
  tierUp(level: number) {
    if (!this.ok()) return;
    this.duck(2);
    const root = 196 * Math.pow(2, (level - 1) * 2 / 12);
    for (const [i, st] of [0, 4, 7, 12].entries()) {
      const f = root * Math.pow(2, st / 12);
      this.tone(f, 0.9, { type: 'sawtooth', vol: 0.05, at: i * 0.02, attack: 0.02 });
      this.tone(f, 1.0, { type: 'triangle', vol: 0.09, at: i * 0.02 });
    }
    this.noise(1.2, { freq: 7000, sweep: 4000, vol: 0.12, type: 'highpass' });
    this.tone(55, 0.6, { type: 'sine', vol: 0.4, slide: 0.5 });
    if (level >= 4) this.gong(0.3);
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
   * Cinematic temple score, generated live (no audio files):
   *   base game  – slow string + choir chords in a big hall, deep cello bass, a distant taiko now and then,
   *                a soft horn call every few bars. No repeating jingle.
   *   free spins – faster, taiko groove, driving string ostinato; brass stabs and higher choir on later stages.
   */
  musicOn = true;
  private musicStage = 0;
  private bus: GainNode | null = null; // music -> dry + reverb

  setMusic(on: boolean) {
    this.musicOn = on;
    try {
      localStorage.setItem('toa-music', on ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (this.ctx) this.music.gain.setTargetAtTime(on ? MUSIC_VOL : 0, this.t, 0.4);
  }

  private duck(sec: number) {
    if (!this.ok() || !this.musicOn) return;
    const g = this.music.gain;
    g.cancelScheduledValues(this.t);
    g.setTargetAtTime(MUSIC_VOL * 0.3, this.t, 0.08);
    g.setTargetAtTime(MUSIC_VOL, this.t + sec, 0.8);
  }

  /** stage 0 = base game, 1..4 = free-spin stages */
  setLoop(stage: number) {
    this.musicStage = Math.max(0, stage);
  }

  private startMusic() {
    if (this.loopTimer) return;
    const c = this.ctx!;
    // hall reverb from a generated impulse response
    const len = Math.floor(c.sampleRate * 3.2);
    const ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    const verb = c.createConvolver();
    verb.buffer = ir;
    const wet = c.createGain();
    wet.gain.value = 0.55;
    const dry = c.createGain();
    dry.gain.value = 0.7;
    this.bus = c.createGain();
    this.bus.connect(dry).connect(this.music);
    this.bus.connect(verb).connect(wet).connect(this.music);
    this.music.gain.value = this.musicOn ? MUSIC_VOL : 0;
    this.nextBeat = this.t + 0.3;
    this.beat = 0;
    this.loopTimer = window.setInterval(() => {
      if (!this.ok()) return;
      if (this.nextBeat < this.t) this.nextBeat = this.t + 0.05; // no catch-up after a hidden tab
      while (this.nextBeat < this.t + 0.4) {
        const st = this.musicStage;
        if (this.musicOn) this.musicStep(this.beat, st, this.nextBeat - this.t);
        this.nextBeat += this.eighth(st);
        this.beat++;
      }
    }, 60);
  }

  private eighth(stage: number) {
    const bpm = stage > 0 ? 84 + stage * 5 : 66;
    return 60 / bpm / 2;
  }

  /** sustained voice with a real attack / sustain / release envelope */
  private voice(freq: number, at: number, dur: number, o: { type?: OscillatorType; vol: number; attack?: number; release?: number; cutoff?: number; detune?: number[]; formant?: boolean }) {
    const c = this.ctx!;
    const t0 = this.t + at;
    const a = o.attack ?? 0.8;
    const r = o.release ?? 1.2;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(o.vol, t0 + a);
    g.gain.setValueAtTime(o.vol, t0 + Math.max(a, dur - r));
    g.gain.linearRampToValueAtTime(0, t0 + dur);
    let out: AudioNode = g;
    if (o.formant) {
      // "aah" choir: two vowel formants
      const f1 = c.createBiquadFilter();
      f1.type = 'bandpass';
      f1.frequency.value = 750;
      f1.Q.value = 5;
      const f2 = c.createBiquadFilter();
      f2.type = 'bandpass';
      f2.frequency.value = 1150;
      f2.Q.value = 6;
      const mix = c.createGain();
      g.connect(f1).connect(mix);
      g.connect(f2).connect(mix);
      out = mix;
    } else {
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = o.cutoff ?? 1500;
      lp.Q.value = 0.5;
      g.connect(lp);
      out = lp;
    }
    out.connect(this.bus!);
    for (const cents of o.detune ?? [0]) {
      const osc = c.createOscillator();
      osc.type = o.type ?? 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = cents;
      // gentle vibrato
      const lfo = c.createOscillator();
      const lg = c.createGain();
      lfo.frequency.value = 4.5 + Math.random();
      lg.gain.value = 4;
      lfo.connect(lg).connect(osc.detune);
      osc.connect(g);
      osc.start(t0);
      osc.stop(t0 + dur + 0.1);
      lfo.start(t0);
      lfo.stop(t0 + dur + 0.1);
    }
  }

  private taiko(at: number, vol: number, pitch = 62) {
    this.tone(pitch, 0.9, { type: 'sine', vol, slide: 0.55, at, dest: this.bus! });
    this.noise(0.18, { freq: 180, vol: vol * 0.5, at, type: 'lowpass', dest: this.bus! });
  }

  private musicStep(b: number, stage: number, at: number) {
    const e = this.eighth(stage);
    // chords last 2 bars (16 eighths). A minor: Am – F – C – G, then Am – F – Dm – E (dramatic turn)
    const prog = [
      [0, 3, 7],
      [-4, 0, 3],
      [3, 7, 10],
      [-2, 2, 5],
      [0, 3, 7],
      [-4, 0, 3],
      [-7, -4, 0],
      [-5, -1, 2],
    ];
    const step = b % 16;
    const ci = Math.floor(b / 16) % prog.length;
    const chord = prog[ci];
    const A = 220;
    const hz = (n: number, oct = 0) => A * Math.pow(2, n / 12 + oct);
    const chordLen = e * 16;
    const bass = ((chord[0] % 12) + 12) % 12;

    if (step === 0) {
      // strings: low chord, three detuned saws each
      for (const n of chord) this.voice(hz(n, -1), at, chordLen + 0.6, { vol: 0.024, attack: 1.4, release: 1.6, cutoff: 1000, detune: [-8, 0, 8] });
      // cello / contrabass
      this.voice(hz(bass, -2), at, chordLen + 0.4, { vol: 0.05, attack: 0.9, release: 1.2, cutoff: 500, detune: [-5, 5] });
      // choir on top (from the 2nd chord on, or always in the bonus)
      if (stage > 0 || ci % 2 === 1)
        for (const n of chord.slice(1)) this.voice(hz(n), at + 0.2, chordLen + 0.4, { vol: stage >= 3 ? 0.05 : 0.035, attack: 2, release: 1.8, formant: true, detune: [-6, 6] });
    }

    if (stage === 0) {
      // distant taiko at the start of every chord, a soft double hit at the turnaround
      if (step === 0) this.taiko(at, 0.28);
      if (ci === 7 && (step === 12 || step === 14)) this.taiko(at, 0.18, 70);
      // horn call every 4 chords (long notes, no jingle)
      if (ci % 4 === 2 && (step === 4 || step === 10)) {
        const n = step === 4 ? chord[2] : chord[1];
        this.voice(hz(n, -1), at, e * 6, { vol: 0.045, attack: 0.35, release: 0.8, cutoff: 900, type: 'sawtooth', detune: [0, 6] });
      }
      return;
    }

    // ---- bonus: taiko groove + string ostinato
    const i = step % 8;
    if (i === 0 || i === 3 || i === 6) this.taiko(at, i === 0 ? 0.42 : 0.26);
    if (stage >= 2 && (i === 4 || i === 7)) this.taiko(at, 0.16, 110);
    if (stage >= 2) this.noise(0.05, { freq: 6000, vol: 0.02, at, type: 'highpass', dest: this.bus! });
    // staccato ostinato: root – root – fifth – root …
    const ost = [0, 0, 7, 0, 0, 7, 12, 7];
    this.voice(hz(bass + ost[i], -1), at, e * 0.9, { vol: 0.03, attack: 0.02, release: 0.12, cutoff: 1800, detune: [-6, 6] });
    // brass stabs on later stages
    if (stage >= 3 && step === 0) for (const n of chord) this.voice(hz(n, -1), at, e * 3, { vol: 0.03, attack: 0.05, release: 0.5, cutoff: 1600, detune: [0, 7] });
    if (stage >= 4 && step === 8) for (const n of chord) this.voice(hz(n), at, e * 2, { vol: 0.02, attack: 0.05, release: 0.4, cutoff: 2200, detune: [0, 7] });
  }
}

const MUSIC_VOL = 0.95;

export const sound = new Sound();
export type { Tier };
