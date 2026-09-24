import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { FILLER, REELS, ROWS, SYMBOL_STYLE, totemTier } from './config';
import type { BoardSymbol, Pos } from './types';
import { ease, lerp, tween, wait } from './anim';

const CELL = 150;
const PAD = 6; // inner padding of a symbol tile
const W = REELS * CELL;
const H = ROWS * CELL;

const iconStyle = new TextStyle({ fontSize: 64, fontFamily: 'Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif' });
const labelStyle = new TextStyle({ fontSize: 17, fontWeight: '800', fontFamily: 'Georgia, serif', letterSpacing: 2 });
const badgeStyle = new TextStyle({ fontSize: 34, fontWeight: '900', fontFamily: 'Georgia, serif', stroke: { color: 0x000000, width: 5 } });
const bigStyle = new TextStyle({
  fontSize: 110,
  fontWeight: '900',
  fontFamily: 'Georgia, serif',
  fill: 0xffe27a,
  stroke: { color: 0x3a1c00, width: 10 },
  dropShadow: { color: 0x000000, blur: 12, distance: 0, alpha: 0.8 },
});

/** One symbol tile (placeholder art). */
class SymbolView extends Container {
  sym: BoardSymbol = { name: 'L1' };
  private bg = new Graphics();
  private glow = new Graphics();
  private icon = new Text({ text: '', style: iconStyle.clone() });
  private caption = new Text({ text: '', style: labelStyle.clone() });
  private badge = new Text({ text: '', style: badgeStyle.clone() });

  constructor(sym: BoardSymbol, golden = false) {
    super();
    this.glow.visible = false;
    this.addChild(this.glow, this.bg, this.icon, this.caption, this.badge);
    for (const t of [this.icon, this.caption, this.badge]) t.anchor.set(0.5);
    this.pivot.set(CELL / 2, CELL / 2);
    this.set(sym, golden);
  }

  set(sym: BoardSymbol, golden = false) {
    this.sym = sym;
    const st = SYMBOL_STYLE[sym.name] ?? SYMBOL_STYLE.L1;
    const isTotem = sym.name === 'T';
    const tier = isTotem ? totemTier(sym.multiplier ?? 2) : null;
    const edge = golden ? 0xffd700 : tier ? tier.color : sym.name === 'W' ? 0xffe066 : sym.name === 'S' ? 0x5fe3ff : 0x000000;
    this.bg.clear();
    this.bg
      .roundRect(PAD, PAD, CELL - 2 * PAD, CELL - 2 * PAD, 18)
      .fill({ color: golden ? 0x6b4e00 : st.bg })
      .stroke({ width: isTotem || golden || sym.name === 'W' || sym.name === 'S' ? 5 : 2, color: edge, alpha: edge ? 1 : 0.35 });
    // inner sheen
    this.bg.roundRect(PAD + 6, PAD + 6, CELL - 2 * PAD - 12, (CELL - 2 * PAD) * 0.42, 14).fill({ color: 0xffffff, alpha: 0.07 });
    this.icon.text = st.icon;
    this.icon.style.fill = st.fg;
    this.icon.position.set(CELL / 2, isTotem ? CELL / 2 - 16 : CELL / 2 - 10);
    this.icon.scale.set(isTotem ? 0.85 : sym.name.startsWith('L') ? 0.9 : 1);
    this.caption.text = isTotem ? '' : st.label;
    this.caption.style.fill = st.fg;
    this.caption.position.set(CELL / 2, CELL - 28);
    this.badge.visible = isTotem;
    if (isTotem) {
      this.badge.text = `×${sym.multiplier ?? '?'}`;
      this.badge.style.fill = golden ? 0xffe066 : tier!.color;
      this.badge.position.set(CELL / 2, CELL - 34);
    }
    this.glow.clear();
    const glowColor = golden ? 0xffd700 : tier ? tier.color : sym.name === 'S' ? 0x5fe3ff : 0xfff3a0;
    this.glow.roundRect(PAD - 7, PAD - 7, CELL - 2 * PAD + 14, CELL - 2 * PAD + 14, 24).fill({ color: glowColor, alpha: 0.5 });
  }

  setGlow(on: boolean) {
    this.glow.visible = on;
  }
}

export class Board {
  readonly root = new Container();
  private bg = new Graphics();
  private frame = new Graphics();
  private reelsLayer = new Container();
  private fx = new Container();
  private lines = new Graphics();
  private anticip: Graphics[] = [];
  private reels: Container[] = [];
  /** visible symbols [reel][row] */
  cells: SymbolView[][] = [];
  private bigText = new Text({ text: '', style: bigStyle });
  private stage = 0;

  constructor(private app: Application) {
    app.stage.addChild(this.root);
    this.root.addChild(this.bg, this.frame, this.reelsLayer, this.lines, this.fx, this.bigText);
    this.bigText.anchor.set(0.5);
    this.bigText.position.set(W / 2, H / 2);
    this.bigText.visible = false;

    for (let r = 0; r < REELS; r++) {
      const a = new Graphics().roundRect(r * CELL + 2, -6, CELL - 4, H + 12, 16).fill({ color: 0xffd34d, alpha: 0.28 });
      a.visible = false;
      this.anticip.push(a);
      this.reelsLayer.addChild(a);
      const reel = new Container();
      reel.x = r * CELL;
      const mask = new Graphics().rect(r * CELL, 0, CELL, H).fill(0xffffff);
      this.reelsLayer.addChild(mask);
      reel.mask = mask;
      this.reels.push(reel);
      this.reelsLayer.addChild(reel);
      this.cells.push([]);
      for (let w = 0; w < ROWS; w++) {
        const s = new SymbolView({ name: FILLER[(r * 3 + w * 5) % FILLER.length] });
        s.position.set(CELL / 2, w * CELL + CELL / 2);
        reel.addChild(s);
        this.cells[r].push(s);
      }
    }
    this.drawFrame();
    app.renderer.on('resize', () => this.layout());
    this.layout();
  }

  layout() {
    const sw = this.app.screen.width;
    const sh = this.app.screen.height;
    const s = Math.min((sw - 16) / (W + 40), (sh - 16) / (H + 40));
    this.root.scale.set(s);
    this.root.position.set((sw - W * s) / 2, (sh - H * s) / 2);
  }

  setTheme(stage: number) {
    this.stage = stage;
    this.drawFrame();
  }

  private drawFrame() {
    const golden = this.stage >= 4;
    this.bg.clear();
    this.bg.roundRect(-20, -20, W + 40, H + 40, 28).fill({ color: golden ? 0x0b0712 : 0x07140e, alpha: 0.88 });
    this.frame.clear();
    const col = [0x3f6b3a, 0x4f7a3a, 0xb07a2a, 0xc0482a, 0xffd34d][this.stage] ?? 0x3f6b3a;
    this.frame.roundRect(-20, -20, W + 40, H + 40, 28).stroke({ width: 8, color: col });
    for (let r = 1; r < REELS; r++) this.frame.moveTo(r * CELL, 0).lineTo(r * CELL, H).stroke({ width: 1, color: 0xffffff, alpha: 0.06 });
  }

  /** Visible 4 rows from a padded reveal board (6 rows per reel). */
  static visibleFromReveal(board: BoardSymbol[][]): BoardSymbol[][] {
    return board.map((col) => col.slice(1, 1 + ROWS));
  }

  /** Spin all reels and stop on the given symbols. */
  async spin(target: BoardSymbol[][], anticipation: number[] = []) {
    this.clearWins();
    const jobs: Promise<void>[] = [];
    let extra = 0;
    for (let r = 0; r < REELS; r++) {
      if ((anticipation[r] ?? 0) > 0) extra += 650;
      jobs.push(this.spinReel(r, target[r], 420 + r * 150 + extra, (anticipation[r] ?? 0) > 0));
    }
    await Promise.all(jobs);
  }

  private async spinReel(r: number, target: BoardSymbol[], duration: number, anticipate: boolean) {
    const reel = this.reels[r];
    const old = this.cells[r];
    const nFill = 8 + Math.round(duration / 90);
    const fresh = target.map((s) => new SymbolView(s));
    const fillers: SymbolView[] = [];
    for (let i = 0; i < nFill; i++) fillers.push(new SymbolView({ name: FILLER[Math.floor(Math.random() * FILLER.length)] }));
    // strip top->bottom: fresh(4), fillers, old(4)
    const strip = [...fresh, ...fillers, ...old];
    strip.forEach((s, i) => {
      s.position.set(CELL / 2, i * CELL + CELL / 2);
      if (!s.parent) reel.addChild(s);
    });
    const startY = -(fresh.length + fillers.length) * CELL;
    reel.y = startY;
    if (anticipate) {
      await wait(duration - 650);
      this.anticip[r].visible = true;
      await tween(900, (t) => (reel.y = lerp(startY, 0, t)), ease.outBack);
      this.anticip[r].visible = false;
    } else {
      await tween(duration, (t) => (reel.y = lerp(startY, 0, t)), ease.outBack);
    }
    for (const s of [...fillers, ...old]) s.destroy({ children: true });
    fresh.forEach((s, i) => s.position.set(CELL / 2, i * CELL + CELL / 2));
    reel.y = 0;
    this.cells[r] = fresh;
  }

  /** Replace board instantly (resume / replay start). */
  setBoard(target: BoardSymbol[][]) {
    for (let r = 0; r < REELS; r++) for (let w = 0; w < ROWS; w++) this.cells[r][w].set(target[r][w]);
  }

  private cellCenter(p: Pos) {
    return { x: p.reel * CELL + CELL / 2, y: (p.row - 1) * CELL + CELL / 2 };
  }

  private cellAt(p: Pos): SymbolView | undefined {
    return this.cells[p.reel]?.[p.row - 1];
  }

  async shake(strength = 14, ms = 450) {
    const x0 = this.root.x;
    const y0 = this.root.y;
    await tween(ms, (t) => {
      const k = (1 - t) * strength * this.root.scale.x;
      this.root.x = x0 + (Math.random() - 0.5) * k;
      this.root.y = y0 + (Math.random() - 0.5) * k;
    }, ease.linear);
    this.root.position.set(x0, y0);
  }

  /** Jaguar roar: totems crash down onto the given positions. */
  async dropTotems(totems: { reel: number; row: number; multiplier: number }[], golden: boolean) {
    await this.shake(golden ? 20 : 12, 500);
    for (const t of totems) {
      const cell = this.cellAt(t);
      if (!cell) continue;
      const c = this.cellCenter(t);
      const falling = new SymbolView({ name: 'T', multiplier: t.multiplier }, golden);
      falling.position.set(c.x, -CELL);
      this.fx.addChild(falling);
      await tween(380, (p) => (falling.y = lerp(-CELL, c.y, p)), ease.outBounce);
      cell.set({ name: 'T', multiplier: t.multiplier }, golden);
      falling.destroy({ children: true });
      this.pulse([cell], 1.18, 220);
    }
    await wait(250);
  }

  private async pulse(views: SymbolView[], to = 1.15, ms = 300) {
    await tween(ms, (t) => views.forEach((v) => v.scale.set(lerp(1, to, Math.sin(t * Math.PI)))), ease.linear);
  }

  /** Highlight positions (e.g. runes / scatters). */
  async highlight(positions: Pos[], ms = 900) {
    const views = positions.map((p) => this.cellAt(p)).filter(Boolean) as SymbolView[];
    views.forEach((v) => v.setGlow(true));
    await this.pulse(views, 1.2, ms);
    views.forEach((v) => v.setGlow(false));
  }

  /** Show all winning lines at once. */
  async showWins(wins: { positions: Pos[]; symbol: string }[]) {
    this.lines.clear();
    const all = new Set<SymbolView>();
    wins.forEach((w, i) => {
      const color = [0xffe066, 0x5fe3ff, 0xff7ab8, 0x7dff8a, 0xffa94d][i % 5];
      const pts = w.positions.map((p) => this.cellCenter(p));
      this.lines.moveTo(pts[0].x, pts[0].y);
      for (const p of pts.slice(1)) this.lines.lineTo(p.x, p.y);
      this.lines.stroke({ width: 7, color, alpha: 0.9, cap: 'round', join: 'round' });
      w.positions.forEach((p) => {
        const v = this.cellAt(p);
        if (v) all.add(v);
      });
    });
    this.dimExcept(all);
    await this.pulse([...all], 1.1, 650);
  }

  private dimExcept(keep: Set<SymbolView>) {
    for (const col of this.cells) for (const v of col) v.alpha = keep.has(v) ? 1 : 0.35;
  }

  clearWins() {
    this.lines.clear();
    for (const col of this.cells) for (const v of col) {
      v.alpha = 1;
      v.setGlow(false);
    }
  }

  /** Totems add up and multiply the spin win. */
  async totemPower(totems: Pos[], totalMult: number) {
    const views = totems.map((p) => this.cellAt(p)).filter(Boolean) as SymbolView[];
    views.forEach((v) => {
      v.alpha = 1;
      v.setGlow(true);
    });
    await this.pulse(views, 1.25, 500);
    await this.flashText(`×${totalMult}`, 900);
    views.forEach((v) => v.setGlow(false));
  }

  async flashText(text: string, ms = 900) {
    this.bigText.text = text;
    this.bigText.visible = true;
    this.bigText.alpha = 1;
    await tween(260, (t) => this.bigText.scale.set(lerp(0.3, 1, t)), ease.outBack);
    await wait(ms);
    await tween(200, (t) => (this.bigText.alpha = 1 - t));
    this.bigText.visible = false;
  }
}
