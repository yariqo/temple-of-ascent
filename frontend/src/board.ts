import { Application, Container, Graphics, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { FILLER, REELS, ROWS, totemTier } from './config';
import type { BoardSymbol, Pos } from './types';
import { ease, lerp, speed, tween, wait } from './anim';
import { TEX } from './art/textures';
import { drawFrame } from './art/frame';
import { Particles } from './fx/particles';
import { sound, type Tier } from './sound';
import { Mascot } from './mascot';
import { MASCOT_GEO } from './art/mascot';
import { t } from './i18n';

export const CELL = 150;
const W = REELS * CELL;
const H = ROWS * CELL;
const MARGIN = 40;
/** room above the frame for the jaguar mascot, and to the right for its tail */
const TOP = 128;
const SIDE = 22;
const MASCOT_SCALE = 0.84;
const KEPT_SCALE = 0.95;
const SYM_SIZE = CELL * 0.94;
/** plate centre of the stele texture (y = 184 of 256) relative to the symbol centre */
const PLATE_Y = ((184 - 128) / 256) * SYM_SIZE;

const plateStyle = new TextStyle({
  fontFamily: 'Cinzel, Georgia, serif',
  fontWeight: '900',
  fontSize: 34,
  fill: 0xffffff,
  stroke: { color: 0x000000, width: 6 },
});
const bigStyle = new TextStyle({
  fontSize: 120,
  fontWeight: '900',
  fontFamily: 'Cinzel Decorative, Cinzel, Georgia, serif',
  fill: 0xffe27a,
  stroke: { color: 0x3a1c00, width: 12 },
  dropShadow: { color: 0x000000, blur: 16, distance: 0, alpha: 0.9 },
});
const subStyle = new TextStyle({
  fontSize: 36,
  fontWeight: '800',
  fontFamily: 'Alegreya Sans, Georgia, sans-serif',
  fill: 0xfff6dc,
  stroke: { color: 0x000000, width: 7 },
  align: 'center',
});
const winStyle = new TextStyle({
  fontSize: 104,
  fontWeight: '900',
  fontFamily: 'Cinzel, Georgia, serif',
  fill: 0xffe27a,
  stroke: { color: 0x2a1400, width: 9 },
  dropShadow: { color: 0x000000, blur: 10, distance: 0, alpha: 0.8 },
});

export function tierName(m: number): Tier {
  return totemTier(m).name as Tier;
}

let raysTex: Texture | null = null;
/** soft rotating light wheel shown behind every bonus (scatter) symbol */
function scatterRays(): Texture {
  if (raysTex) return raysTex;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.translate(128, 128);
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6);
    const g = ctx.createLinearGradient(0, 0, 0, -128);
    g.addColorStop(0, 'rgba(160,250,255,0.9)');
    g.addColorStop(1, 'rgba(160,250,255,0)');
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-16, -128);
    ctx.lineTo(16, -128);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
  }
  return (raysTex = Texture.from(c));
}

/** stele material by VALUE: stone < 10×, bronze 10×–25×, diamond 50×–100×, obsidian 250×+.
 *  Every stele lands as stone – strong ones burst into their material when the value is revealed. */
export function steleLevel(v: number): number {
  return v >= 250 ? 3 : v >= 50 ? 2 : v >= 10 ? 1 : 0;
}
const STELE_KEYS = ['T', 'TB', 'TD', 'TO'];
const STELE_COLORS = [0xc9c2b8, 0xf0a060, 0x9fe8ff, 0xffb030];
/** set by the board: particles / shake when a stele bursts into a stronger material */
let upgradeFx: ((v: SymbolView, lvl: number) => void) | null = null;

/** true while a spin is running */
let reelsSpinning = false;

/** One symbol on the board. */
class SymbolView extends Container {
  sym: BoardSymbol = { name: 'L1' };
  golden = false;
  /** material after the reveal (null = stone until revealed) */
  revealedKey: string | null = null;
  private glow = new Sprite(TEX.glow);
  private sprite = new Sprite(Texture.EMPTY);
  private _rays: Sprite | null = null;
  private _plate: Text | null = null;
  /** created on demand – only steles need a value plate */
  private get plate(): Text {
    if (!this._plate) {
      this._plate = new Text({ text: '', style: plateStyle.clone() });
      this._plate.anchor.set(0.5);
      this._plate.y = PLATE_Y;
      this.addChild(this._plate);
    }
    return this._plate;
  }

  constructor(sym: BoardSymbol, golden = false, blurred = false) {
    super();
    this.glow.anchor.set(0.5);
    this.glow.width = this.glow.height = CELL * 1.5;
    this.glow.visible = false;
    this.glow.blendMode = 'add';
    this.sprite.anchor.set(0.5);
    this.addChild(this.glow, this.sprite);
    this.set(sym, golden, blurred);
  }

  set(sym: BoardSymbol, golden = false, blurred = false) {
    this.sym = sym;
    this.golden = golden;
    const key = sym.name === 'T' ? (golden ? 'TG' : this.revealedKey ?? 'T') : sym.name;
    this.sprite.texture = (blurred ? TEX.blur[key] : TEX.sym[key]) ?? TEX.sym.L1;
    this.sprite.width = this.sprite.height = SYM_SIZE;
    const isS = sym.name === 'S' && !blurred;
    if (isS && !this._rays) {
      this._rays = new Sprite(scatterRays());
      this._rays.anchor.set(0.5);
      this._rays.width = this._rays.height = CELL * 1.25;
      this._rays.blendMode = 'add';
      this._rays.alpha = 0.55;
      this.addChildAt(this._rays, 0);
    }
    if (this._rays) this._rays.visible = isS;
    const isT = sym.name === 'T';
    if (isT) {
      this.plate.visible = !blurred;
      this.setPlate(sym.multiplier ?? 2);
    } else if (this._plate) this._plate.visible = false;
  }

  /** called every frame – bonus symbols glow and breathe */
  animate(time: number) {
    if (!this._rays?.visible) return;
    this._rays.rotation = time * 0.6;
    // while the reels spin (and during a bonus tease) the light ring is off – the only blue glow is the teased reel
    this._rays.alpha = reelsSpinning ? 0 : 0.45 + 0.25 * Math.sin(time * 3);
    this.sprite.width = this.sprite.height = SYM_SIZE * (1 + 0.045 * Math.sin(time * 3));
  }

  setBlur(b: boolean) {
    this.set(this.sym, this.golden, b);
  }

  setPlate(v: number, spinning = false) {
    this.plate.text = `×${v}`;
    const tier = totemTier(v);
    this.plate.style.fill = spinning ? 0xdcd2c0 : this.golden ? 0xfff0a0 : tier.color;
    this.plate.style.fontSize = String(v).length >= 3 ? 30 : 36;
  }

  /** Plate shows '?' until the stele is revealed. */
  hidePlate() {
    if (this.sym.name !== 'T') return;
    this.plate.text = '?';
    this.plate.style.fill = 0xdcd2c0;
    this.plate.style.fontSize = 38;
  }

  setGlow(on: boolean, color = 0xfff2a8) {
    this.glow.visible = on;
    this.glow.tint = color;
    this.glow.alpha = 0.75;
  }

  /** Rattle through values, then stop on the real multiplier. Strong steles rattle longer,
   *  shake harder and then burst into their material (bronze / diamond / obsidian). */
  async spinPlate(values: number[], final: number, ms = 650) {
    if (this.sym.name !== 'T' || this.destroyed) return;
    const lvl = this.golden ? 0 : steleLevel(final);
    const dur = ms + lvl * 280;
    let last = -1;
    const plate = this.plate;
    const baseX = this.sprite.x;
    await tween(
      dur,
      (t) => {
        if (this.destroyed) return;
        const step = Math.floor(t * (12 + lvl * 3));
        if (step !== last) {
          last = step;
          this.setPlate(values[Math.floor(Math.random() * values.length)], true);
          sound.steleTick();
        }
        plate.y = lerp(PLATE_Y - 10, PLATE_Y, (t * 12) % 1);
        // the stone starts to tremble and glow before it bursts
        if (lvl > 0 && t > 0.45) {
          const k = (t - 0.45) / 0.55;
          this.sprite.x = baseX + Math.sin(t * 90) * k * (1.5 + lvl * 1.6);
          this.setGlow(true, STELE_COLORS[lvl]);
          this.glow.alpha = 0.25 + 0.6 * k;
        }
      },
      ease.inCubic,
    );
    if (this.destroyed) return;
    this.sprite.x = baseX;
    if (lvl > 0) {
      this.revealedKey = STELE_KEYS[lvl];
      this.sprite.texture = TEX.sym[this.revealedKey];
      this.sprite.width = this.sprite.height = SYM_SIZE;
      upgradeFx?.(this, lvl);
      sound.steleUpgrade(lvl);
    }
    this.setPlate(final);
    plate.y = PLATE_Y;
    this.setGlow(true, lvl > 0 ? STELE_COLORS[lvl] : totemTier(final).color);
    this.glow.alpha = lvl > 0 ? 1 : 0.75;
    sound.steleReveal(tierName(final));
    await tween(
      lvl > 0 ? 380 : 260,
      (t) => {
        if (this.destroyed) return;
        plate.scale.set(lerp(1.7, 1, t));
        if (lvl > 0) this.sprite.width = this.sprite.height = SYM_SIZE * lerp(1.28, 1, t);
      },
      ease.outBack,
    );
    await tween(lvl > 0 ? 500 : 300, (t) => !this.destroyed && (this.glow.alpha = (lvl > 0 ? 1 : 0.75) * (1 - t)), ease.linear);
    if (!this.destroyed) this.setGlow(false);
  }
}

export class Board {
  readonly root = new Container();
  private frame: Sprite;
  private reelsLayer = new Container();
  private reels: Container[] = [];
  private antic: Container[] = [];
  private anticBorder: Graphics[] = [];
  private anticGlow: Sprite[] = [];
  private anticScan: Sprite[] = [];
  private dimmers: Graphics[] = [];
  private teaseReel = -1;
  private teaseT = 0;
  private baseScale = 1;
  private zoom = 1;
  private lines = new Graphics();
  private fx = new Container();
  private overlay = new Graphics();
  private eyes = new Container();
  /** Divine Bonus: collected multiplier that stays */
  private keptBox = new Container();
  private keptText = new Text({ text: '×0', style: winStyle.clone() });
  private keptValue = 0;
  private bigText = new Text({ text: '', style: bigStyle });
  private subText = new Text({ text: '', style: subStyle });
  private winText = new Text({ text: '', style: winStyle });
  readonly particles: Particles;
  readonly mascot: Mascot;
  cells: SymbolView[][] = [];
  private baseX = 0;
  private baseY = 0;
  onReelStop?: (reel: number, syms: BoardSymbol[]) => void;

  constructor(private app: Application) {
    this.particles = new Particles(app.ticker);
    app.stage.addChild(this.root);
    this.frame = new Sprite(Texture.from(drawFrame(W, H, MARGIN)));
    this.frame.position.set(-MARGIN, -MARGIN);

    const cellBg = new Container();
    for (let r = 0; r < REELS; r++)
      for (let w = 0; w < ROWS; w++) {
        const s = new Sprite(TEX.cell);
        s.width = s.height = CELL;
        s.position.set(r * CELL, w * CELL);
        cellBg.addChild(s);
      }

    this.overlay.rect(-MARGIN, -MARGIN, W + 2 * MARGIN, H + 2 * MARGIN).fill({ color: 0x000000 });
    this.overlay.alpha = 0;

    this.mascot = new Mascot(app.ticker);
    this.mascot.root.scale.set(MASCOT_SCALE);
    this.mascot.root.position.set(W + MARGIN - 6 - MASCOT_GEO.right * MASCOT_SCALE, -MARGIN + 14);
    this.root.addChild(this.frame, this.mascot.root, cellBg, this.reelsLayer, this.overlay, this.lines, this.fx, this.particles.layer, this.eyes, this.keptBox, this.winText, this.bigText, this.subText);
    for (const t of [this.bigText, this.subText, this.winText]) {
      t.anchor.set(0.5);
      t.visible = false;
    }
    this.bigText.position.set(W / 2, H / 2 - 20);
    this.subText.position.set(W / 2, H / 2 + 80);
    this.winText.position.set(W / 2, H / 2);

    for (let r = 0; r < REELS; r++) {
      // bonus tease ("bait") effect for this reel: glow, border, light scan (added above the symbols below)
      const a = new Container();
      const glow = new Sprite(TEX.glow);
      glow.anchor.set(0.5);
      glow.position.set(r * CELL + CELL / 2, H / 2);
      glow.width = CELL * 1.25;
      glow.height = H * 1.15;
      glow.tint = 0x6ff0ff;
      glow.blendMode = 'add';
      const scan = new Sprite(TEX.glow);
      scan.anchor.set(0.5);
      scan.width = CELL * 1.3;
      scan.height = 90;
      scan.x = r * CELL + CELL / 2;
      scan.tint = 0xe8ffff;
      scan.blendMode = 'add';
      const border = new Graphics();
      const scanMask = new Graphics().rect(r * CELL, 0, CELL, H).fill(0xffffff);
      const inner = new Container();
      inner.addChild(glow, scan);
      inner.mask = scanMask;
      a.addChild(scanMask, inner, border);
      a.visible = false;
      this.antic.push(a);
      this.anticBorder.push(border);
      this.anticGlow.push(glow);
      this.anticScan.push(scan);
      const dim = new Graphics().rect(r * CELL, 0, CELL, H).fill({ color: 0x000000 });
      dim.alpha = 0;
      this.dimmers.push(dim);
      const reel = new Container();
      reel.x = r * CELL;
      const mask = new Graphics().rect(r * CELL, 0, CELL, H).fill(0xffffff);
      this.reelsLayer.addChild(mask, reel);
      reel.mask = mask;
      this.reels.push(reel);
      this.cells.push([]);
      for (let w = 0; w < ROWS; w++) {
        const s = new SymbolView({ name: FILLER[(r * 3 + w * 5) % FILLER.length] });
        s.position.set(CELL / 2, w * CELL + CELL / 2);
        reel.addChild(s);
        this.cells[r].push(s);
      }
    }
    // dimmers and tease effects sit above the symbols
    for (const d of this.dimmers) this.reelsLayer.addChild(d);
    for (const a of this.antic) this.reelsLayer.addChild(a);
    this.buildEyes();
    this.buildKept();
    this.buildPlaque();
    upgradeFx = (v, lvl) => {
      const lp = this.root.toLocal(v.getGlobalPosition());
      const tint = [[0xc9c2b8], [0xffb070, 0xffe0b0, 0xc9c2b8], [0x9fe8ff, 0xffffff, 0x7fd6f5], [0xffb030, 0xffe27a, 0x2a2733]][lvl];
      this.particles.emit(TEX.spark, lp.x, lp.y, { n: 14 + lvl * 10, speed: [80, 220 + lvl * 80], life: [400, 900], scale: [0.7, 0.05], tint, blend: 'add' });
      this.particles.emit(TEX.dust, lp.x, lp.y + 20, { n: 8, speed: [40, 140], life: [300, 700], scale: [0.5, 1], alpha: 0.35 });
      if (lvl >= 2) void this.shake(6 + lvl * 4, 320);
    };
    this.layout();
    let time = 0;
    app.ticker.add((tk) => {
      time += tk.deltaMS / 1000;
      for (const col of this.cells) for (const v of col) if (!v.destroyed) v.animate(time);
      this.animateTease(tk.deltaMS / 1000);
    });
  }

  layout() {
    const sw = this.app.screen.width;
    const sh = this.app.screen.height;
    // the same room is reserved above and below, so the reels sit exactly in the centre
    const s = Math.min((sw - 8) / (W + 2 * MARGIN + 2 * SIDE), (sh - 8) / (H + 2 * MARGIN + 2 * TOP));
    this.baseScale = s;
    this.applyZoom();
  }

  /** zoom around the centre of the reels (used for the bonus tease) */
  private applyZoom() {
    const sw = this.app.screen.width;
    const sh = this.app.screen.height;
    const s = this.baseScale * this.zoom;
    this.root.scale.set(s);
    this.root.position.set((sw - W * s) / 2, (sh - H * s) / 2);
    this.baseX = this.root.x;
    this.baseY = this.root.y;
  }
  private zoomTo(z: number, ms: number) {
    const from = this.zoom;
    return tween(ms, (p) => {
      this.zoom = lerp(from, z, p);
      this.applyZoom();
    }, ease.inOutCubic);
  }

  setTheme(stage: number) {
    this.frame.tint = stage >= 4 ? 0xd8c8ff : stage === 3 ? 0xffc0a0 : stage === 2 ? 0xffe0b0 : 0xffffff;
  }

  static visibleFromReveal(board: BoardSymbol[][]): BoardSymbol[][] {
    return board.map((col) => col.slice(1, 1 + ROWS));
  }

  // ------------------------------------------------------------------ spinning
  // Timing of a spin (ms, at normal speed):
  //   reels start one after another (60 ms apart), kick up, accelerate, spin at full speed,
  //   and stop one after another with a small bounce. A reel with a bonus tease keeps spinning
  //   longer and visibly slows down while the rest of the board darkens.
  async spin(target: BoardSymbol[][], anticipation: number[] = []) {
    this.clearWins();
    reelsSpinning = true;
    sound.spinStart();
    const START_GAP = 60;
    const FIRST_STOP = 820;
    const STOP_GAP = 210;
    const TEASE = 1900;
    const stops: number[] = [];
    let extra = 0;
    for (let r = 0; r < REELS; r++) {
      const ant = (anticipation[r] ?? 0) > 0;
      if (ant) extra += TEASE;
      stops.push(FIRST_STOP + r * STOP_GAP + extra);
    }
    const jobs: Promise<void>[] = [];
    let teasing = false;
    for (let r = 0; r < REELS; r++) {
      const ant = (anticipation[r] ?? 0) > 0;
      const startAt = r * START_GAP;
      jobs.push(wait(startAt).then(() => this.spinReel(r, target[r], stops[r] - startAt, ant ? TEASE - 250 : 0)));
      if (ant) {
        const teaseFrom = r > 0 ? stops[r - 1] : 0;
        const level = anticipation[r];
        void wait(teaseFrom).then(() => {
          this.startTease(r, (stops[r] - teaseFrom) / 1000, level);
          if (!teasing) {
            teasing = true;
            void this.zoomTo(1.035, 700);
          }
        });
      }
    }
    await Promise.all(jobs);
    reelsSpinning = false;
    this.endTease();
    if (teasing) await this.zoomTo(1, 320);
  }

  /**
   * One reel: kick-up, acceleration, full speed, (optional slow-down for the tease), landing with a bounce.
   * The whole path is computed in advance so the reel lands exactly on its symbols.
   */
  private async spinReel(r: number, target: BoardSymbol[], duration: number, slowdown: number) {
    const reel = this.reels[r];
    const old = this.cells[r];
    const KICK = 26; // px the reel is pulled up before it starts
    const KICK_MS = 110;
    const ACC = 170; // acceleration time
    const LAND = 420; // landing time (with overshoot)
    const C1 = 1.25; // overshoot strength of the landing
    const SLOW = 0.62; // how much the reel slows down during a tease (fraction of full speed lost)
    const run = Math.max(ACC + 50, duration - KICK_MS - LAND); // time until the landing starts
    const slowFrom = slowdown > 0 ? Math.max(ACC, run - slowdown) : run;

    // distance travelled for speed v = 1 px/ms (everything scales linearly with v)
    const dist1 = (t: number): number => {
      if (t <= ACC) return (t * t) / (2 * ACC);
      const sAcc = ACC / 2;
      if (t <= slowFrom) return sAcc + (t - ACC);
      const sCruise = sAcc + (slowFrom - ACC);
      const L = run - slowFrom;
      const u = Math.min(1, (t - slowFrom) / L);
      return sCruise + L * (u - SLOW * (u * u * u - (u * u * u * u) / 2));
    };
    const endSpeed1 = slowdown > 0 ? 1 - SLOW : 1;
    const land1 = (endSpeed1 * LAND) / (C1 + 3); // landing distance keeps the speed continuous
    const k = dist1(run) + land1;
    const targetSpeed = 3.1; // px per ms at full speed ≈ 20 symbols per second
    const n = Math.max(ROWS + 3, Math.round((k * targetSpeed - KICK) / CELL));
    const v = (n * CELL + KICK) / k;

    const fresh = target.map((sym) => new SymbolView(sym, false, true));
    const fillers: SymbolView[] = [];
    for (let i = 0; i < n - ROWS; i++) fillers.push(new SymbolView({ name: FILLER[Math.floor(Math.random() * FILLER.length)] }, false, true));
    const strip = [...fresh, ...fillers, ...old];
    strip.forEach((sym, i) => {
      sym.position.set(CELL / 2, i * CELL + CELL / 2);
      if (!sym.parent) reel.addChild(sym);
    });
    const startY = -n * CELL;
    reel.y = startY;

    // kick up
    await tween(KICK_MS, (p) => (reel.y = startY - KICK * p), ease.outCubic);

    let blurred = false;
    let crisp = false;
    await new Promise<void>((resolve) => {
      let last = performance.now();
      let t = 0;
      const step = (now: number) => {
        if (reel.destroyed) return resolve();
        t += Math.min(100, now - last) * speed.factor();
        last = now;
        let y: number;
        if (t < run) {
          y = startY - KICK + v * dist1(t);
        } else {
          const p = Math.min(1, (t - run) / LAND);
          const e = 1 + (C1 + 1) * Math.pow(p - 1, 3) + C1 * Math.pow(p - 1, 2);
          y = startY - KICK + v * dist1(run) + v * land1 * e;
          if (!crisp) {
            crisp = true;
            fresh.forEach((f) => {
              f.setBlur(false);
              f.hidePlate();
            });
          }
        }
        reel.y = y;
        if (!blurred && t > ACC * 0.5) {
          blurred = true;
          old.forEach((o) => o.setBlur(true));
        }
        if (t >= run + LAND) return resolve();
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });

    for (const f of [...fillers, ...old]) f.destroy({ children: true });
    fresh.forEach((f, i) => {
      f.setBlur(false);
      f.hidePlate();
      f.position.set(CELL / 2, i * CELL + CELL / 2);
    });
    reel.y = 0;
    this.cells[r] = fresh;
    if (this.antic[r].visible) this.stopTease(r);
    sound.reelStop(r);
    // landed bonus symbols hop and flash
    fresh.forEach((f, i) => {
      if (f.sym.name !== 'S') return;
      this.particles.emit(TEX.spark, r * CELL + CELL / 2, i * CELL + CELL / 2, { n: 14, speed: [80, 240], life: [300, 700], scale: [0.6, 0.05], tint: [0x7ff3ff, 0xffffff], blend: 'add' });
      void tween(380, (p) => !f.destroyed && f.scale.set(1 + 0.22 * Math.sin(p * Math.PI)), ease.linear);
    });
    this.particles.emit(TEX.dust, r * CELL + CELL / 2, H - 6, {
      n: 5,
      speed: [20, 70],
      angle: [Math.PI * 1.1, Math.PI * 1.9],
      life: [300, 600],
      scale: [0.4, 0.8],
      alpha: 0.18,
    });
    this.onReelStop?.(r, target);
  }

  // ------------------------------------------------------------------ bonus tease
  /** Darken the reels (all except `except`), leaving BONUS symbols lit. */
  private dimReels(to: number, except = -1, ms = 300) {
    this.dimmers.forEach((d, i) => {
      d.clear();
      if (i === except) return;
      for (let w = 0; w < ROWS; w++) {
        if (this.cells[i]?.[w]?.sym.name === 'S') continue;
        d.rect(i * CELL, w * CELL, CELL, CELL).fill({ color: 0x000000 });
      }
      const from = d.alpha;
      void tween(ms, (p) => (d.alpha = lerp(from, to, p)));
    });
  }

  private startTease(r: number, seconds: number, level: number) {
    // only the reel that is still spinning glows – switch off every other tease glow
    this.antic.forEach((a, i) => {
      if (i !== r) a.visible = false;
    });
    this.teaseReel = r;
    this.teaseT = 0;
    this.antic[r].visible = true;
    this.antic[r].alpha = 0;
    void tween(250, (p) => (this.antic[r].alpha = p));
    // darken every other reel so all eyes are on the teased one – the BONUS symbols already there stay lit
    this.dimReels(0.55, r);
    sound.tease(seconds, level);
    this.mascot.watch();
  }

  private stopTease(r: number) {
    if (this.teaseReel === r) this.teaseReel = -1;
    const a = this.antic[r];
    void tween(200, (p) => (a.alpha = 1 - p)).then(() => (a.visible = false));
  }

  private endTease() {
    this.teaseReel = -1;
    this.dimmers.forEach((d) => {
      const from = d.alpha;
      if (from > 0) void tween(260, (p) => (d.alpha = lerp(from, 0, p)));
    });
    this.antic.forEach((a) => (a.visible = false));
  }

  private animateTease(dt: number) {
    const r = this.teaseReel;
    if (r < 0) return;
    this.teaseT += dt * speed.factor();
    const t = this.teaseT;
    const pulse = 0.5 + 0.5 * Math.sin(t * 9);
    this.anticGlow[r].alpha = 0.35 + 0.25 * pulse + Math.min(0.3, t * 0.12);
    // light scan runs up the reel, faster and faster
    const scan = this.anticScan[r];
    const rate = 1.1 + t * 0.9;
    scan.y = H + 45 - (((t * rate) % 1) * (H + 90));
    scan.alpha = 0.8;
    const b = this.anticBorder[r];
    b.clear();
    b.roundRect(r * CELL + 3, -3, CELL - 6, H + 6, 16).stroke({ width: 6 + 3 * pulse, color: 0x7ff3ff, alpha: 0.9 });
    b.roundRect(r * CELL + 9, 3, CELL - 18, H - 6, 12).stroke({ width: 2, color: 0xffffff, alpha: 0.5 + 0.5 * pulse });
    // sparks rising along both edges
    if (Math.random() < 0.55) {
      const side = Math.random() < 0.5 ? r * CELL + 14 : (r + 1) * CELL - 14;
      this.particles.emit(TEX.spark, side, Math.random() * H, {
        n: 1,
        speed: [60, 160],
        angle: [-Math.PI * 0.53, -Math.PI * 0.47],
        life: [400, 800],
        scale: [0.4, 0.05],
        tint: [0x7ff3ff, 0xffffff],
        blend: 'add',
      });
    }
  }

  setBoard(target: BoardSymbol[][]) {
    for (let r = 0; r < REELS; r++) for (let w = 0; w < ROWS; w++) this.cells[r][w].set(target[r][w]);
  }

  // ------------------------------------------------------------------ helpers
  private center(p: Pos) {
    return { x: p.reel * CELL + CELL / 2, y: (p.row - 1) * CELL + CELL / 2 };
  }
  private cellAt(p: Pos): SymbolView | undefined {
    return this.cells[p.reel]?.[p.row - 1];
  }
  /** Position of a board cell in page (CSS) pixels. */
  pagePoint(p: Pos): { x: number; y: number } {
    const g = this.root.toGlobal(this.center(p));
    const rect = (this.app.canvas as HTMLCanvasElement).getBoundingClientRect();
    return { x: rect.left + g.x, y: rect.top + g.y };
  }

  private async pulse(views: SymbolView[], to = 1.15, ms = 300) {
    await tween(ms, (t) => views.forEach((v) => !v.destroyed && v.scale.set(lerp(1, to, Math.sin(t * Math.PI)))), ease.linear);
    views.forEach((v) => !v.destroyed && v.scale.set(1));
  }

  async shake(strength = 12, ms = 450) {
    await tween(
      ms,
      (t) => {
        const k = (1 - t) * strength * this.root.scale.x;
        this.root.x = this.baseX + (Math.random() - 0.5) * k;
        this.root.y = this.baseY + (Math.random() - 0.5) * k;
      },
      ease.linear,
    );
    this.root.position.set(this.baseX, this.baseY);
  }

  private async dim(to: number, ms = 250) {
    const from = this.overlay.alpha;
    await tween(ms, (t) => (this.overlay.alpha = lerp(from, to, t)));
  }

  // ------------------------------------------------------------------ steles
  /** All steles on the board rattle through values and reveal their multiplier. */
  async revealSteles(values: number[]) {
    const jobs: Promise<void>[] = [];
    let i = 0;
    for (const col of this.cells)
      for (const v of col) {
        if (v.sym.name !== 'T') continue;
        const k = i++;
        jobs.push(wait(k * 120).then(() => v.spinPlate(values, v.sym.multiplier ?? 2)));
      }
    await Promise.all(jobs);
  }

  // ------------------------------------------------------------------ divine multiplier
  private buildKept() {
    const glow = new Sprite(TEX.glow);
    glow.anchor.set(0.5);
    glow.width = glow.height = 230;
    glow.tint = 0xffc23a;
    glow.blendMode = 'add';
    glow.alpha = 0.6;
    const disc = new Graphics();
    disc.circle(0, 0, 54).fill({ color: 0x2a1600 });
    disc.circle(0, 0, 50).fill({ color: 0xc88a18 });
    disc.circle(0, 0, 42).fill({ color: 0x3a2200 });
    disc.circle(0, 0, 50).stroke({ width: 4, color: 0xfff0a8 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      disc.moveTo(Math.cos(a) * 56, Math.sin(a) * 56).lineTo(Math.cos(a) * 70, Math.sin(a) * 70);
    }
    disc.stroke({ width: 6, color: 0xffd24a, cap: 'round' });
    const label = new Text({ text: t('keptLabel'), style: subStyle.clone() });
    label.style.fontSize = 20;
    label.style.fill = 0xfff0a8;
    label.anchor.set(0.5);
    label.y = 66;
    const plate = new Graphics();
    plate.roundRect(-62, 52, 124, 28, 10).fill({ color: 0x2a1600 }).stroke({ width: 2, color: 0xffd24a });
    this.keptText.style.fontSize = 36;
    this.keptText.anchor.set(0.5);
    this.keptBox.addChild(glow, disc, plate, label, this.keptText);
    this.keptBox.position.set(100, -MARGIN - 66);
    this.keptBox.visible = false;
    this.keptBox.scale.set(KEPT_SCALE);
  }

  /** null hides the display (not a Divine Bonus). */
  setKept(v: number | null) {
    this.keptBox.visible = v !== null;
    this.keptValue = v ?? 0;
    this.keptText.text = `×${this.keptValue}`;
    this.keptText.style.fontSize = String(this.keptValue).length >= 4 ? 26 : String(this.keptValue).length === 3 ? 30 : 36;
  }

  /** Steles that took part in a win fly into the divine display and stay there. */
  async collectKept(totems: { reel: number; row: number; multiplier: number }[], total: number) {
    const target = { x: this.keptBox.x, y: this.keptBox.y };
    const jobs = totems.map(async (tt, i) => {
      await wait(i * 90);
      const c = this.center(tt);
      const chip = new Text({ text: `×${tt.multiplier}`, style: plateStyle.clone() });
      chip.anchor.set(0.5);
      chip.style.fill = 0xfff0a0;
      chip.position.set(c.x, c.y + PLATE_Y);
      this.fx.addChild(chip);
      const sx = chip.x;
      const sy = chip.y;
      await tween(
        560,
        (p) => {
          chip.x = lerp(sx, target.x, p);
          chip.y = lerp(sy, target.y, p) - Math.sin(p * Math.PI) * 90;
          chip.scale.set(lerp(1.2, 0.6, p));
        },
        ease.inOutCubic,
      );
      chip.destroy();
      sound.rune();
    });
    await Promise.all(jobs);
    this.setKept(total);
    sound.multiply();
    this.particles.emit(TEX.spark, target.x, target.y, { n: 22, speed: [80, 260], life: [400, 800], scale: [0.6, 0.05], tint: [0xffe066, 0xfff3c4], blend: 'add' });
    await tween(320, (p) => this.keptBox.scale.set(KEPT_SCALE * lerp(1.45, 1, p)), ease.outBack);
  }

  // ------------------------------------------------------------------ jaguar
  private buildEyes() {
    const g = new Graphics();
    for (const sx of [-1, 1]) {
      g.ellipse(sx * 70, 0, 46, 20).fill({ color: 0xffd23a });
      g.ellipse(sx * 70, 0, 8, 18).fill({ color: 0x120800 });
    }
    const glow = new Sprite(TEX.glow);
    glow.anchor.set(0.5);
    glow.width = 520;
    glow.height = 220;
    glow.tint = 0xffb020;
    glow.alpha = 0.55;
    glow.blendMode = 'add';
    this.eyes.addChild(glow, g);
    this.eyes.position.set(W / 2, H * 0.3);
    this.eyes.alpha = 0;
  }

  private async jaguarRoar(golden: boolean) {
    // the golden jaguar (Jaguar Spin) already roared when the spin started
    if (!golden) {
      sound.roar(false);
      void this.mascot.roar();
    }
    const eyes = this.eyes;
    const dim = this.dim(0.55, 300);
    await tween(
      350,
      (t) => {
        eyes.alpha = t;
        eyes.scale.set(lerp(0.6, 1, t), lerp(0.1, 1, t));
      },
      ease.outBack,
    );
    await dim;
    await this.shake(golden ? 22 : 14, 600);
    await tween(300, (t) => (eyes.alpha = 1 - t));
  }

  /** Steles crash down onto the given positions, then reveal their value. */
  async dropTotems(totems: { reel: number; row: number; multiplier: number }[], golden: boolean, values: number[]) {
    await this.jaguarRoar(golden);
    for (const t of totems) {
      const cell = this.cellAt(t);
      if (!cell) continue;
      const c = this.center(t);
      const falling = new SymbolView({ name: 'T', multiplier: t.multiplier }, golden);
      falling.setPlate(values[0], true);
      falling.position.set(c.x, -CELL * 1.2);
      this.fx.addChild(falling);
      await tween(340, (p) => (falling.y = lerp(-CELL * 1.2, c.y, p)), ease.inCubic);
      sound.thud();
      this.particles.emit(golden ? TEX.spark : TEX.dust, c.x, c.y + CELL * 0.35, {
        n: golden ? 18 : 10,
        speed: [60, 200],
        angle: [Math.PI, Math.PI * 2],
        gravity: 300,
        life: [300, 700],
        scale: golden ? [0.5, 0.1] : [0.9, 1.4],
        tint: golden ? [0xffe066, 0xfff3c4] : 0xd8c8a8,
        blend: golden ? 'add' : 'normal',
        alpha: golden ? 1 : 0.5,
      });
      cell.set({ name: 'T', multiplier: t.multiplier }, golden);
      cell.setPlate(values[0], true);
      falling.destroy({ children: true });
      void this.pulse([cell], 1.12, 200);
      await wait(90);
    }
    await this.dim(0, 250);
    const jobs = totems.map((t, i) => wait(i * 110).then(() => this.cellAt(t)?.spinPlate(values, t.multiplier)));
    await Promise.all(jobs);
  }

  // ------------------------------------------------------------------ wins
  private drawLines(wins: { positions: Pos[] }[], progress: number) {
    const g = this.lines;
    g.clear();
    wins.forEach((w) => {
      const pts = w.positions.map((p) => this.center(p));
      const total = pts.length - 1;
      const upto = progress * total;
      const draw = (width: number, alpha: number, col: number) => {
        g.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k <= total; k++) {
          if (k <= upto) g.lineTo(pts[k].x, pts[k].y);
          else {
            const f = upto - (k - 1);
            if (f > 0) g.lineTo(lerp(pts[k - 1].x, pts[k].x, f), lerp(pts[k - 1].y, pts[k].y, f));
            break;
          }
        }
        g.stroke({ width, color: col, alpha, cap: 'round', join: 'round' });
      };
      // one calm gold line with a soft glow
      draw(14, 0.16, 0xffc94a);
      draw(5, 0.9, 0xf4c152);
      draw(1.6, 0.9, 0xfff6d6);
    });
  }

  // ------------------------------------------------------------------ win plaque
  /** the plaque on the bottom edge of the board: "$0.30  ×13  = $3.90" */
  private plaque = new Container();
  private plaqueBg = new Graphics();
  private pBase = new Text({ text: '', style: new TextStyle({ fontFamily: 'Cinzel, Georgia, serif', fontWeight: '900', fontSize: 40, fill: 0xfff4dc }) });
  private pMult = new Text({ text: '', style: new TextStyle({ fontFamily: 'Cinzel, Georgia, serif', fontWeight: '900', fontSize: 40, fill: 0xffc94a }) });
  private pTotal = new Text({ text: '', style: new TextStyle({ fontFamily: 'Cinzel, Georgia, serif', fontWeight: '900', fontSize: 46, fill: 0xffe08a }) });
  private pills = new Container();

  private buildPlaque() {
    for (const tx of [this.pBase, this.pMult, this.pTotal]) {
      tx.anchor.set(0, 0.5);
      this.plaque.addChild(tx);
    }
    this.plaque.addChildAt(this.plaqueBg, 0);
    this.plaque.position.set(W / 2, H + 6);
    this.plaque.visible = false;
    this.root.addChild(this.pills, this.plaque);
  }

  private layoutPlaque() {
    const gap = 14;
    const parts = [this.pBase, this.pMult, this.pTotal].filter((t) => t.text);
    const w = parts.reduce((s, t) => s + t.width, 0) + gap * Math.max(0, parts.length - 1);
    let x = -w / 2;
    for (const t of [this.pBase, this.pMult, this.pTotal]) {
      t.visible = !!t.text;
      if (!t.text) continue;
      t.x = x;
      x += t.width + gap;
    }
    const pw = Math.max(170, w + 64);
    const g = this.plaqueBg;
    g.clear();
    g.roundRect(-pw / 2, -35, pw, 70, 35).fill({ color: 0x120d07, alpha: 0.94 });
    g.roundRect(-pw / 2, -35, pw, 70, 35).stroke({ width: 3, color: 0xc8961e, alpha: 0.95 });
    g.roundRect(-pw / 2 + 6, -29, pw - 12, 58, 29).stroke({ width: 1.2, color: 0xfff0b0, alpha: 0.2 });
  }

  private setPlaque(base: string, mult = '', total = '') {
    this.pBase.text = base;
    this.pMult.text = mult;
    this.pTotal.text = total;
    this.layoutPlaque();
    const show = !!(base || mult || total);
    if (show && !this.plaque.visible) {
      this.plaque.visible = true;
      this.plaque.alpha = 0;
      void tween(220, (k) => {
        this.plaque.alpha = k;
        this.plaque.scale.set(lerp(0.85, 1, k));
      }, ease.outBack);
    }
    if (!show) this.plaque.visible = false;
  }

  /** total win pops up in the centre of the board for a moment */
  private async centerPop(text: string) {
    const t = this.winText;
    t.text = text;
    t.visible = true;
    t.alpha = 1;
    this.particles.emit(TEX.spark, W / 2, H / 2, { n: 22, speed: [100, 300], life: [400, 800], scale: [0.7, 0.05], tint: [0xffe066, 0xfff3c4], blend: 'add' });
    sound.coin();
    await tween(300, (k) => t.scale.set(lerp(0.3, 1.1, k)), ease.outBack);
    await tween(120, (k) => t.scale.set(lerp(1.1, 1, k)));
    await wait(750);
    await tween(220, (k) => {
      t.alpha = 1 - k;
      t.scale.set(lerp(1, 1.15, k));
    });
    t.visible = false;
  }

  private pop(t: Text) {
    void tween(260, (k) => t.scale.set(lerp(1.35, 1, k)), ease.outBack);
  }

  /** small amount tags at the end of every winning line */
  private linePills(wins: { positions: Pos[]; win?: number }[], fmt?: (w: number) => string) {
    this.pills.removeChildren().forEach((c) => c.destroy());
    if (!fmt || wins.length > 6) return;
    const used = new Map<string, number>();
    for (const w of wins) {
      if (!w.win) continue;
      const last = w.positions[w.positions.length - 1];
      const key = `${last.reel},${last.row}`;
      const n = used.get(key) ?? 0;
      used.set(key, n + 1);
      const c = this.center(last);
      const pill = new Container();
      const tx = new Text({ text: fmt(w.win), style: new TextStyle({ fontFamily: 'Alegreya Sans, sans-serif', fontWeight: '800', fontSize: 26, fill: 0xfff4dc }) });
      tx.anchor.set(0.5);
      const bg = new Graphics().roundRect(-tx.width / 2 - 11, -17, tx.width + 22, 34, 17).fill({ color: 0x120d07, alpha: 0.88 }).stroke({ width: 1.5, color: 0xc8961e });
      pill.addChild(bg, tx);
      pill.position.set(c.x + CELL * 0.3, c.y - CELL * 0.34 + n * 38);
      pill.alpha = 0;
      this.pills.addChild(pill);
      void tween(240, (k) => {
        pill.alpha = k;
        pill.scale.set(lerp(0.6, 1, k));
      }, ease.outBack);
    }
  }

  async showWins(wins: { positions: Pos[]; win?: number }[], amountText: string, fmt?: (w: number) => string) {
    const all = new Set<SymbolView>();
    wins.forEach((w) =>
      w.positions.forEach((p) => {
        const v = this.cellAt(p);
        if (v) all.add(v);
      }),
    );
    for (const col of this.cells) for (const v of col) v.alpha = all.has(v) || v.sym.name === 'T' ? 1 : 0.35;
    all.forEach((v) => v.setGlow(true, 0xfff2a8));
    sound.win(Math.min(6, wins.length));
    const lines = tween(380, (t) => this.drawLines(wins, t), ease.outCubic);
    await this.pulse([...all], 1.08, 420);
    await lines;
    if (amountText) {
      this.linePills(wins, fmt);
      this.setPlaque(amountText);
      this.pop(this.pBase);
      await wait(520);
    }
    all.forEach((v) => v.setGlow(false));
  }

  clearWins() {
    this.lines.clear();
    this.pills.removeChildren().forEach((c) => c.destroy());
    this.setPlaque('');
    for (const col of this.cells)
      for (const v of col) {
        v.alpha = 1;
        v.setGlow(false);
        v.scale.set(1);
      }
  }

  /**
   * The steles fly into the plaque one after another; the multiplier builds up (×5 → ×15 …),
   * then "= total" appears. With empty texts (big win follows) only the multiplier is shown.
   */
  async totemPower(totems: Pos[], totalMult: number, baseText: string, resultText: string) {
    const items = totems
      .map((p) => ({ p, v: this.cellAt(p), m: (p as any).multiplier as number | undefined }))
      .filter((x) => x.v) as { p: Pos; v: SymbolView; m?: number }[];
    const kept = this.keptBox.visible ? this.keptValue : 0;
    this.pills.children.forEach((c) => void tween(200, (k) => (c.alpha = 1 - k)));
    // the multiplier slot stays invisible until the first stele has really been counted
    this.setPlaque(baseText, '×0', '');
    this.pMult.alpha = 0;
    const target = () => ({ x: this.plaque.x + this.pMult.x + this.pMult.width / 2, y: this.plaque.y });
    let sum = 0;
    let i = 0;
    const show = (v: number) => {
      this.pMult.alpha = 1;
      this.pMult.text = `×${v}`;
      this.layoutPlaque();
      this.pop(this.pMult);
      sound.multTick(i++);
      const tg = target();
      this.particles.emit(TEX.spark, tg.x, tg.y, { n: 8, speed: [60, 180], life: [300, 600], scale: [0.5, 0.05], tint: [0xffe066, 0xfff3c4], blend: 'add' });
    };
    const beam = async (from: { x: number; y: number }) => {
      const g = new Graphics();
      this.fx.addChild(g);
      const to = target();
      await tween(
        190,
        (t) => {
          g.clear();
          g.moveTo(from.x, from.y).lineTo(lerp(from.x, to.x, t), lerp(from.y, to.y, t));
          g.stroke({ width: 10, color: 0xffc94a, alpha: 0.3, cap: 'round' });
          g.moveTo(from.x, from.y).lineTo(lerp(from.x, to.x, t), lerp(from.y, to.y, t));
          g.stroke({ width: 3, color: 0xfff6c8, alpha: 0.95, cap: 'round' });
        },
        ease.inCubic,
      );
      void tween(160, (t) => (g.alpha = 1 - t)).then(() => g.destroy());
    };
    if (kept > 0) {
      await beam({ x: this.keptBox.x, y: this.keptBox.y });
      sum += kept;
      show(sum);
      await wait(100);
    }
    for (const it of items) {
      it.v.alpha = 1;
      it.v.setGlow(true, 0xffd24a);
      void this.pulse([it.v], 1.14, 240);
      await beam(this.center(it.p));
      sum += it.m ?? it.v.sym.multiplier ?? 0;
      show(sum);
      await wait(80);
      it.v.setGlow(false);
    }
    if (sum !== totalMult) show(totalMult);
    sound.multiply();
    await wait(220);
    if (resultText) {
      this.pTotal.text = `= ${resultText}`;
      this.layoutPlaque();
      this.pop(this.pTotal);
      this.particles.emit(TEX.spark, this.plaque.x + this.pTotal.x + this.pTotal.width / 2, this.plaque.y, { n: 16, speed: [80, 220], life: [300, 700], scale: [0.6, 0.05], tint: [0xffe066, 0xfff3c4], blend: 'add' });
      await wait(380);
      // the result also pops up big in the middle of the board
      await this.centerPop(resultText);
    } else {
      await wait(300);
    }
  }

  async flashText(text: string, ms = 900, sub = '') {
    const b = this.bigText;
    const s = this.subText;
    b.text = text;
    b.visible = true;
    b.alpha = 1;
    s.text = sub;
    s.visible = !!sub;
    s.alpha = 1;
    await tween(280, (t) => b.scale.set(lerp(0.3, 1, t)), ease.outBack);
    await wait(ms);
    await tween(220, (t) => {
      b.alpha = 1 - t;
      s.alpha = 1 - t;
    });
    b.visible = false;
    s.visible = false;
  }

  /** Scatter / rune highlight with sparks. */
  async highlight(positions: Pos[], ms = 900, color = 0x7ff3ff) {
    const views = positions.map((p) => this.cellAt(p)).filter(Boolean) as SymbolView[];
    views.forEach((v) => v.setGlow(true, color));
    for (const p of positions) {
      const c = this.center(p);
      this.particles.emit(TEX.spark, c.x, c.y, { n: 10, speed: [60, 180], life: [400, 800], scale: [0.5, 0.05], tint: color, blend: 'add' });
    }
    await this.pulse(views, 1.2, ms);
    views.forEach((v) => v.setGlow(false));
  }

  /** The big moment when a bonus is triggered: board goes dark, BONUS symbols blaze up and link together. */
  async bonusHit(positions: Pos[]) {
    const views = positions.map((p) => this.cellAt(p)).filter(Boolean) as SymbolView[];
    const pts = [...positions].sort((a, b) => a.reel - b.reel).map((p) => this.center(p));
    this.dimReels(0.7, -1, 250);
    // white flash + shake
    const flash = new Graphics().rect(-MARGIN, -MARGIN, W + 2 * MARGIN, H + 2 * MARGIN).fill({ color: 0xffffff });
    flash.blendMode = 'add';
    this.fx.addChild(flash);
    void tween(420, (p) => (flash.alpha = 0.75 * (1 - p))).then(() => flash.destroy());
    void this.shake(18, 520);
    // light bursts behind each BONUS symbol
    const bursts: Sprite[] = [];
    for (const c of pts) {
      const b = new Sprite(scatterRays());
      b.anchor.set(0.5);
      b.position.set(c.x, c.y);
      b.blendMode = 'add';
      b.tint = 0x9ff8ff;
      b.scale.set(0);
      this.fx.addChild(b);
      bursts.push(b);
      this.particles.emit(TEX.spark, c.x, c.y, { n: 26, speed: [120, 420], life: [500, 1100], scale: [0.8, 0.05], tint: [0x7ff3ff, 0xffffff, 0xffe27a], blend: 'add' });
    }
    // the symbols move to the front and grow
    const lifted = views.map((v) => {
      const parent = v.parent!;
      const g = this.fx.toLocal(v.getGlobalPosition());
      const idx = parent.getChildIndex(v);
      parent.removeChild(v);
      v.position.set(g.x, g.y);
      this.fx.addChild(v);
      v.setGlow(true, 0x7ff3ff);
      return { v, parent, idx, home: parent.toLocal(this.fx.toGlobal(g)) };
    });
    const links = new Graphics();
    this.fx.addChildAt(links, 0);
    await tween(
      520,
      (p) => {
        views.forEach((v) => v.scale.set(lerp(1, 1.32, p)));
        bursts.forEach((b, i) => {
          b.scale.set(lerp(0, 2.2, p));
          b.rotation = p * 0.8 + i;
        });
        // a beam of light connects the symbols one after another
        links.clear();
        const seg = p * (pts.length - 1);
        for (let i = 0; i < pts.length - 1; i++) {
          const k = Math.max(0, Math.min(1, seg - i));
          if (k <= 0) break;
          const a = pts[i];
          const b = pts[i + 1];
          const x = lerp(a.x, b.x, k);
          const y = lerp(a.y, b.y, k);
          links.moveTo(a.x, a.y).lineTo(x, y).stroke({ width: 22, color: 0x5fe8ff, alpha: 0.35, cap: 'round' });
          links.moveTo(a.x, a.y).lineTo(x, y).stroke({ width: 6, color: 0xffffff, alpha: 0.95, cap: 'round' });
        }
      },
      ease.outBack,
    );
    // hold – symbols breathe, bursts keep turning
    await tween(
      1100,
      (p) => {
        views.forEach((v) => v.scale.set(1.32 + 0.06 * Math.sin(p * Math.PI * 4)));
        bursts.forEach((b, i) => (b.rotation = 0.8 + i + p * 1.2));
        links.alpha = 0.7 + 0.3 * Math.sin(p * Math.PI * 6);
      },
      ease.linear,
    );
    await tween(300, (p) => {
      views.forEach((v) => v.scale.set(lerp(1.32, 1, p)));
      bursts.forEach((b) => (b.alpha = 1 - p));
      links.alpha = 1 - p;
    });
    bursts.forEach((b) => b.destroy());
    links.destroy();
    for (const l of lifted) {
      if (l.v.destroyed) continue;
      this.fx.removeChild(l.v);
      l.v.position.set(l.home.x, l.home.y);
      l.parent.addChildAt(l.v, Math.min(l.idx, l.parent.children.length));
      l.v.setGlow(false);
    }
    this.dimReels(0, -1, 250);
  }

  /** Coin fountain over the board. */
  celebrate(n = 40) {
    for (let i = 0; i < 4; i++)
      this.particles.emit(TEX.coin, W * (0.2 + 0.2 * i), H + 10, {
        n: Math.ceil(n / 4),
        speed: [380, 720],
        angle: [-Math.PI * 0.62, -Math.PI * 0.38],
        gravity: 900,
        life: [1200, 1800],
        scale: [0.55, 0.45],
        spin: 8,
      });
  }

  /** One ambient particle (fireflies in the jungle, embers on the temple). */
  ambient(stage: number) {
    const tint = stage >= 4 ? [0xd9c2ff, 0xffe9a0] : stage >= 2 ? [0xffb04a, 0xffd27a] : [0xc8ff7a, 0x9dffc2];
    this.particles.emit(TEX.dot, Math.random() * W, Math.random() * H, {
      n: 1,
      speed: [8, 30],
      angle: stage >= 2 ? [-Math.PI * 0.7, -Math.PI * 0.3] : [0, Math.PI * 2],
      life: [2500, 4500],
      scale: [0.35, 0.15],
      tint,
      blend: 'add',
      blink: true,
      alpha: 0.7,
    });
  }
}
