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
  private room!: GainNode;
  private lastCoin = 0;
  private lastTick = 0;
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
    // glue compressor: keeps stacked effects from getting harsh / clipping
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.006;
    comp.release.value = 0.2;
    this.master.connect(comp).connect(this.ctx.destination);
    this.sfx = this.ctx.createGain();
    this.sfx.gain.value = 0.9;
    this.sfx.connect(this.master);
    // a little room on the effects (short stone-hall reverb)
    const rl = Math.floor(this.ctx.sampleRate * 1.4);
    const rir = this.ctx.createBuffer(2, rl, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = rir.getChannelData(ch);
      for (let i = 0; i < rl; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 3.2);
    }
    const rv = this.ctx.createConvolver();
    rv.buffer = rir;
    this.room = this.ctx.createGain();
    this.room.gain.value = 0.22;
    this.room.connect(rv).connect(this.master);
    this.sfx.connect(this.room);
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
  /** wooden mallet on a marimba bar – the basic "Aztec" voice of the effects */
  private marimba(f: number, at = 0, vol = 0.12, len = 0.45) {
    this.tone(f, len, { type: 'sine', vol, at, attack: 0.004 });
    this.tone(f * 4, len * 0.35, { type: 'sine', vol: vol * 0.22, at, attack: 0.002 });
    this.tone(f * 10, 0.03, { type: 'sine', vol: vol * 0.12, at, attack: 0.001 });
  }
  /** short dry wood knock */
  private knock(at = 0, vol = 0.06, freq = 2400) {
    this.noise(0.035, { freq, q: 5, vol, at });
    this.tone(freq / 3.4, 0.05, { type: 'sine', vol: vol * 0.8, at, attack: 0.002 });
  }
  click() {
    this.knock(0, 0.07, 2200);
  }
  spinStart() {
    this.noise(0.32, { freq: 250, sweep: 1100, vol: 0.07, type: 'lowpass' });
    this.knock(0, 0.04, 1600);
  }
  reelStop(i: number) {
    // stone block settling into place: short low thunk + a little grit
    this.tone(118 - i * 5, 0.16, { type: 'sine', vol: 0.3, slide: 0.55, attack: 0.003 });
    this.noise(0.07, { freq: 700, vol: 0.1, type: 'lowpass' });
    this.knock(0.005, 0.025, 1800 - i * 80);
  }
  /** bonus tease: rising tension + heartbeat for the given time; higher level = later reel = more intense */
  tease(seconds: number, level = 1) {
    if (!this.ok()) return;
    const dur = Math.max(0.6, seconds);
    this.duck(dur + 0.3);
    const base = 180 * Math.pow(2, (level - 1) / 4);
    this.tone(base, dur, { type: 'triangle', vol: 0.05, slide: 2.4, attack: dur * 0.6 });
    this.tone(base * 1.5, dur, { type: 'sine', vol: 0.05, slide: 2.4, attack: dur * 0.7 });
    this.noise(dur, { freq: 400, sweep: 3500, vol: 0.045, type: 'bandpass' });
    // heartbeat, getting faster
    let at = 0.05;
    let gap = 0.5;
    while (at < dur - 0.1) {
      this.tone(62, 0.18, { type: 'sine', vol: 0.36, slide: 0.6, at });
      this.tone(58, 0.16, { type: 'sine', vol: 0.24, slide: 0.6, at: at + 0.14 });
      at += gap;
      gap = Math.max(0.28, gap * 0.9);
    }
  }
  anticipation() {
    this.tone(220, 1.1, { type: 'triangle', vol: 0.06, slide: 2, attack: 0.3 });
    this.noise(1.1, { freq: 600, sweep: 3000, vol: 0.04 });
  }
  scatterLand(n: number) {
    // BONUS symbol: bright marimba + bell, one step higher per symbol
    const f = 440 * Math.pow(2, PENTA[Math.min(n, 8)] / 12);
    this.marimba(f, 0, 0.16, 0.6);
    this.bell(f * 2, 0.04, 0.07);
  }
  steleTick() {
    const now = performance.now();
    if (now - this.lastTick < 45) return;
    this.lastTick = now;
    this.knock(0, 0.018, 2600 + Math.random() * 600);
  }
  steleReveal(tier: Tier) {
    const map: Record<Tier, number[]> = {
      stone: [392],
      jade: [523, 659],
      gold: [659, 784, 988],
      obsidian: [440, 554, 659, 880],
      sun: [523, 659, 784, 1047, 1319],
    };
    map[tier].forEach((f, i) => this.marimba(f, i * 0.06, 0.12, 0.55));
    if (tier === 'sun' || tier === 'obsidian') this.gong(0.25);
  }
  /** one stele added to the multiplier – rising pitch */
  multTick(i: number) {
    const f = 440 * Math.pow(2, PENTA[Math.min(i, 10)] / 12);
    this.marimba(f, 0, 0.14, 0.5);
    this.bell(f * 2, 0.02, 0.045);
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
    for (let i = 0; i < n; i++) this.marimba(440 * Math.pow(2, PENTA[i] / 12), i * 0.07, 0.1, 0.5);
    if (level >= 3) this.bell(440 * Math.pow(2, PENTA[n - 1] / 12) * 2, n * 0.07, 0.06);
  }
  multiply() {
    this.tone(180, 0.6, { type: 'sawtooth', vol: 0.08, slide: 3 });
    this.tone(660, 0.5, { type: 'triangle', vol: 0.18, at: 0.45 });
    this.tone(990, 0.6, { type: 'triangle', vol: 0.12, at: 0.5 });
  }
  /**
   * Big-cat roar: a buzzing vocal source (saw with a fast "flutter" in the amplitude) through
   * throat formants and a little distortion, plus breath noise and a sub rumble.
   * Pitch swells up and falls off like a real roar. Golden = longer, with a shimmer on top.
   */
  roar(golden: boolean, vol = 1) {
    if (!this.ok()) return;
    const c = this.ctx!;
    const t0 = this.t;
    const dur = golden ? 1.9 : 1.5;
    this.duck(dur + 0.3);
    const out = c.createGain();
    out.gain.value = 1.1 * vol;
    // dark and heavy: no fizz above ~2.6 kHz
    const dark = c.createBiquadFilter();
    dark.type = 'lowpass';
    dark.frequency.value = 2600;
    dark.Q.value = 0.7;
    out.connect(dark).connect(this.sfx);

    // envelope shared by voice and breath
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(1, t0 + 0.18);
    env.gain.setValueAtTime(1, t0 + dur * 0.45);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    // vocal source: two detuned saws, pitch contour 85 → 150 → 60 Hz
    const flutter = c.createGain(); // amplitude "rattle"
    flutter.gain.value = 0.6;
    const lfo = c.createOscillator();
    lfo.type = 'triangle';
    lfo.frequency.setValueAtTime(22, t0);
    lfo.frequency.linearRampToValueAtTime(34, t0 + dur * 0.4);
    lfo.frequency.linearRampToValueAtTime(16, t0 + dur);
    const lfoAmt = c.createGain();
    lfoAmt.gain.value = 0.45;
    lfo.connect(lfoAmt).connect(flutter.gain);
    const oscs = [0, 9].map((cents) => {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.detune.value = cents;
      o.frequency.setValueAtTime(85, t0);
      o.frequency.exponentialRampToValueAtTime(150, t0 + dur * 0.35);
      o.frequency.exponentialRampToValueAtTime(60, t0 + dur);
      o.connect(flutter);
      return o;
    });
    // growl distortion
    const shaper = c.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const x = (i / 1023) * 2 - 1;
      curve[i] = Math.tanh(x * 3.2);
    }
    shaper.curve = curve;
    flutter.connect(shaper);
    // throat formants (open "aaoo" that closes at the end)
    const formants: [number, number, number, number][] = [
      [320, 260, 4, 0.9],
      [850, 600, 6, 0.6],
      [1700, 1200, 8, 0.25],
    ];
    for (const [f0, f1, q, g] of formants) {
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = q;
      bp.frequency.setValueAtTime(f0 * 0.8, t0);
      bp.frequency.linearRampToValueAtTime(f0, t0 + dur * 0.35);
      bp.frequency.linearRampToValueAtTime(f1, t0 + dur);
      const gg = c.createGain();
      gg.gain.value = g * 0.55;
      shaper.connect(bp).connect(gg).connect(env);
    }
    // breath / rasp
    const br = c.createBufferSource();
    br.buffer = this.noiseBuf;
    br.loop = true;
    const bf = c.createBiquadFilter();
    bf.type = 'bandpass';
    bf.Q.value = 1.2;
    bf.frequency.setValueAtTime(700, t0);
    bf.frequency.linearRampToValueAtTime(1300, t0 + dur * 0.35);
    bf.frequency.linearRampToValueAtTime(450, t0 + dur);
    const bg = c.createGain();
    bg.gain.value = 0.28;
    br.connect(bf).connect(bg).connect(flutter);
    const bd = c.createGain();
    bd.gain.value = 0.35;
    br.connect(bf);
    bf.connect(bd).connect(env);
    env.connect(out);
    // chest rumble
    this.tone(48, dur, { type: 'sine', vol: 0.32 * vol, slide: 0.7, attack: 0.12 });
    for (const n of [...oscs, lfo, br]) {
      n.start(t0);
      n.stop(t0 + dur + 0.05);
    }
    if (golden) {
      // golden jaguar: shimmering bell cascade over the tail
      [1319, 1760, 2217, 2637].forEach((f, i) => this.bell(f, 0.55 + i * 0.08, 0.06));
      this.noise(1.2, { freq: 7000, sweep: 12000, vol: 0.04, type: 'highpass', at: 0.5 });
    }
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
    // taiko hit + brass swell + marimba run instead of a chiptune arpeggio
    this.tone(55, 0.9, { type: 'sine', vol: 0.45, slide: 0.5 });
    this.noise(0.25, { freq: 200, vol: 0.2, type: 'lowpass' });
    for (const st of [0, 7, 12, 16]) {
      const f = 220 * Math.pow(2, st / 12);
      this.tone(f, 1.4, { type: 'sawtooth', vol: 0.025, attack: 0.25 });
      this.tone(f, 1.5, { type: 'triangle', vol: 0.06, attack: 0.15 });
    }
    [0, 3, 5, 7, 10, 12, 15].forEach((st, i) => this.marimba(440 * Math.pow(2, st / 12), 0.1 + i * 0.06, 0.08, 0.4));
    this.noise(1.3, { freq: 7000, sweep: 4000, vol: 0.06, type: 'highpass', at: 0.05 });
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
    // soft gold "ting" – rate limited so count-ups do not turn into a buzz
    const now = performance.now();
    if (now - this.lastCoin < 70) return;
    this.lastCoin = now;
    const f = [1319, 1480, 1568, 1760][Math.floor(Math.random() * 4)];
    this.tone(f, 0.18, { type: 'sine', vol: 0.035, attack: 0.002 });
    this.tone(f * 2.76, 0.07, { type: 'sine', vol: 0.01, attack: 0.002 });
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
   * Adaptive temple score, generated live (no audio files).
   * One piece that grows with the game: an "energy" value (0 … 6) decides the tempo and which
   * layers play. Base game ≈ 0, jaguar spins ≈ 1.6, bonus stage 1–4 ≈ 2.2 … 4.6, and every big win
   * pushes it up for a while (hype) before it settles again. Stages also lift the key.
   *   0   strings + choir pads, cello, distant taiko, horn calls
   *   1+  pulse: low taiko on every half bar, shaker
   *   2+  taiko groove, string ostinato
   *   3+  high drums, brass stabs, choir always
   *   4+  16th ostinato, second brass hit, cymbal swell into every chord
   *   5+  taiko roll before every chord, choir an octave up
   */
  musicOn = true;
  private musicStage = 0;
  private jaguarMode = false;
  private hypeLevel = 0;
  private hypeFrom = 0;
  private hypeUntil = 0;
  private bpm = 66;
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
    const st = Math.max(0, stage);
    if (st > this.musicStage && st > 0 && this.ok() && this.musicOn) this.stinger(st);
    this.musicStage = st;
    if (st === 0) this.hypeLevel = Math.min(this.hypeLevel, 2); // leaving the bonus: calm down
  }
  /** jaguar spins are on: the base game music runs hotter */
  setJaguar(on: boolean) {
    this.jaguarMode = on;
  }
  /** a big win (tier 1..5) pushes the music up for a while, then it settles back */
  hype(level: number) {
    const now = performance.now();
    this.hypeLevel = Math.max(this.currentHype(), [0, 1.2, 2, 2.8, 3.6, 4.4][Math.max(0, Math.min(5, level))]);
    this.hypeFrom = now;
    this.hypeUntil = now + 12000 + level * 5000;
  }
  private currentHype() {
    const now = performance.now();
    if (now >= this.hypeUntil) return 0;
    // holds for the first 40 %, then fades out
    const k = (now - this.hypeFrom) / (this.hypeUntil - this.hypeFrom);
    return this.hypeLevel * (k < 0.4 ? 1 : 1 - (k - 0.4) / 0.6);
  }
  private energy() {
    const base = this.musicStage > 0 ? 1.6 + this.musicStage * 0.75 : this.jaguarMode ? 1.6 : 0;
    return Math.min(6, base + this.currentHype());
  }
  /** key lift per bonus stage (semitones) */
  private keyShift() {
    return [0, 0, 2, 3, 5][this.musicStage] ?? 5;
  }

  /** stage change: big hit – taiko roll, brass chord in the new key, cymbal */
  private stinger(stage: number, t0 = 0) {
    const k = [0, 0, 2, 3, 5][stage] ?? 5;
    for (let i = 0; i < 6; i++) this.taiko(t0 + i * 0.07, 0.18 + i * 0.05, 70 + i * 4);
    const at = t0 + 0.45;
    this.taiko(at, 0.6, 55);
    for (const st of [0, 7, 12, 15, 19]) {
      const f = 110 * Math.pow(2, (st + k) / 12);
      this.voice(f, at, 2.4, { vol: 0.045, attack: 0.04, release: 1.6, cutoff: 2400, detune: [-7, 0, 7] });
    }
    this.noise(2.2, { freq: 8000, sweep: 4000, vol: 0.08, type: 'highpass', at, dest: this.bus! });
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
    wet.gain.value = 0.5;
    const dry = c.createGain();
    dry.gain.value = 0.72;
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
        const en = this.energy();
        // tempo glides towards the target instead of jumping
        const target = 66 + en * 10;
        this.bpm += Math.max(-1.2, Math.min(1.2, target - this.bpm));
        if (this.musicOn) this.musicStep(this.beat, en, this.nextBeat - this.t);
        this.nextBeat += 60 / this.bpm / 2;
        this.beat++;
      }
    }, 60);
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
  private shaker(at: number, vol: number) {
    this.noise(0.06, { freq: 7000, q: 1.5, vol, at, type: 'bandpass', dest: this.bus! });
  }

  private musicStep(b: number, en: number, at: number) {
    const e = 60 / this.bpm / 2;
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
    const A = 220 * Math.pow(2, this.keyShift() / 12);
    const hz = (n: number, oct = 0) => A * Math.pow(2, n / 12 + oct);
    const chordLen = e * 16;
    const bass = ((chord[0] % 12) + 12) % 12;
    const i = step % 8;

    if (step === 0) {
      // strings: low chord, three detuned saws each (brighter with more energy)
      for (const n of chord) this.voice(hz(n, -1), at, chordLen + 0.6, { vol: 0.024, attack: en >= 3 ? 0.5 : 1.4, release: 1.6, cutoff: 1000 + en * 180, detune: [-8, 0, 8] });
      // cello / contrabass
      this.voice(hz(bass, -2), at, chordLen + 0.4, { vol: 0.05, attack: 0.9, release: 1.2, cutoff: 500, detune: [-5, 5] });
      // choir: every 2nd chord when calm, always from energy 2.5, an octave higher from 5
      if (en >= 2.5 || ci % 2 === 1)
        for (const n of chord.slice(1)) this.voice(hz(n, en >= 5 ? 1 : 0), at + 0.2, chordLen + 0.4, { vol: en >= 3 ? 0.048 : 0.035, attack: 2, release: 1.8, formant: true, detune: [-6, 6] });
    }

    if (en < 1) {
      // calm base game: distant taiko at every chord, soft double hit at the turnaround, horn calls
      if (step === 0) this.taiko(at, 0.28);
      if (ci === 7 && (step === 12 || step === 14)) this.taiko(at, 0.18, 70);
      if (ci % 4 === 2 && (step === 4 || step === 10)) {
        const n = step === 4 ? chord[2] : chord[1];
        this.voice(hz(n, -1), at, e * 6, { vol: 0.045, attack: 0.35, release: 0.8, cutoff: 900, type: 'sawtooth', detune: [0, 6] });
      }
      return;
    }

    // ---- energy 1+: pulse
    if (en < 2) {
      if (i === 0 || i === 4) this.taiko(at, i === 0 ? 0.34 : 0.22);
      if (i % 2 === 1) this.shaker(at, 0.012 + (en - 1) * 0.01);
      // horn line gets more frequent
      if (ci % 2 === 0 && step === 6) this.voice(hz(chord[2], -1), at, e * 5, { vol: 0.04, attack: 0.2, release: 0.6, cutoff: 1100, detune: [0, 6] });
      return;
    }

    // ---- energy 2+: groove + ostinato
    if (i === 0 || i === 3 || i === 6) this.taiko(at, i === 0 ? 0.42 : 0.26);
    this.shaker(at, i % 2 ? 0.02 : 0.012);
    const ost = [0, 0, 7, 0, 0, 7, 12, 7];
    this.voice(hz(bass + ost[i], -1), at, e * 0.9, { vol: 0.03, attack: 0.02, release: 0.12, cutoff: 1800, detune: [-6, 6] });
    if (en >= 4) this.voice(hz(bass + ost[(i + 3) % 8], 0), at + e / 2, e * 0.45, { vol: 0.018, attack: 0.01, release: 0.08, cutoff: 2600, detune: [-6, 6] });

    // ---- energy 3+: high drums + brass
    if (en >= 3) {
      if (i === 4 || i === 7) this.taiko(at, 0.18, 115);
      if (step === 0) for (const n of chord) this.voice(hz(n, -1), at, e * 3, { vol: 0.032, attack: 0.04, release: 0.5, cutoff: 1800, detune: [0, 7] });
    }
    // ---- energy 4+: second brass hit, cymbal swell into the next chord
    if (en >= 4) {
      if (step === 8) for (const n of chord) this.voice(hz(n), at, e * 2, { vol: 0.022, attack: 0.04, release: 0.4, cutoff: 2400, detune: [0, 7] });
      if (step === 12) this.noise(e * 4, { freq: 3000, sweep: 11000, vol: 0.05, type: 'highpass', at, dest: this.bus! });
    }
    // ---- energy 5+: taiko roll before every chord
    if (en >= 5 && step >= 13) {
      this.taiko(at, 0.22, 80);
      this.taiko(at + e / 2, 0.26, 84);
    }
  }
}

const MUSIC_VOL = 0.95;

export const sound = new Sound();
export type { Tier };
