/**
 * Big-win celebration with escalating tiers.
 * The amount counts up; every time it passes the next threshold (× bet) the title upgrades
 * with a punch (flash, shake, sound, more coins).
 *   ≥20× BIG · ≥50× MEGA · ≥100× EPIC · ≥500× LEGENDARY · ≥1000× BALAM
 */
import { money } from './format';
import { t } from './i18n';
import { ease, sleepReal, speed, tween } from './anim';
import { sound } from './sound';
import { drawMascotHead } from './art/mascot';

export const BIG_TIERS = [
  { min: 20, key: 'winBig' },
  { min: 50, key: 'winMega' },
  { min: 100, key: 'winEpic' },
  { min: 500, key: 'winLegend' },
  { min: 1000, key: 'winBalam' },
];
/** count-up time per final tier (ms at normal speed) */
const DURATION = [0, 3000, 4600, 6200, 7800, 9400];

export function tierLevel(mult: number): number {
  let lv = 0;
  BIG_TIERS.forEach((tt, i) => {
    if (mult >= tt.min) lv = i + 1;
  });
  return lv;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  va: number;
  life: number;
  kind: 0 | 1 | 2; // coin, gem, spark
  color: string;
}

export class BigWin {
  private el: HTMLElement;
  private title: HTMLElement;
  private amount: HTMLElement;
  private mult: HTMLElement;
  private kicker: HTMLElement;
  private face: HTMLImageElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private parts: Particle[] = [];
  private level = 0;
  private running = false;
  private faceUrl = '';

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'bigwin';
    this.el.hidden = true;
    this.el.innerHTML = `
      <canvas class="bw-fx"></canvas>
      <div class="bw-rays"></div>
      <div class="bw-flash"></div>
      <div class="bw-card">
        <div class="bw-face"><img alt=""></div>
        <div class="bw-kicker"></div>
        <div class="bw-title"></div>
        <div class="bw-amount"></div>
        <div class="bw-mult"></div>
        <div class="bw-hint"></div>
      </div>`;
    document.body.appendChild(this.el);
    this.title = this.el.querySelector('.bw-title')!;
    this.amount = this.el.querySelector('.bw-amount')!;
    this.mult = this.el.querySelector('.bw-mult')!;
    this.kicker = this.el.querySelector('.bw-kicker')!;
    this.face = this.el.querySelector('.bw-face img')!;
    this.canvas = this.el.querySelector('.bw-fx')!;
    this.ctx = this.canvas.getContext('2d')!;
  }

  private setLevel(lv: number, max: boolean) {
    this.level = lv;
    this.el.className = `lv${lv}`;
    this.title.textContent = max ? t('maxWin') : t(BIG_TIERS[lv - 1].key);
    // restart the pop animation
    this.title.classList.remove('pop');
    void this.title.offsetWidth;
    this.title.classList.add('pop');
    const flash = this.el.querySelector('.bw-flash') as HTMLElement;
    flash.classList.remove('go');
    void flash.offsetWidth;
    flash.classList.add('go');
    if (lv >= 3) {
      this.el.classList.add('shake');
      window.setTimeout(() => this.el.classList.remove('shake'), 520);
    }
    this.burst(lv);
  }

  private burst(lv: number) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const n = 6 + lv * 5;
    for (let i = 0; i < n; i++) this.spawn(w / 2, h * 0.55, lv, true);
  }

  private spawn(x: number, y: number, lv: number, burst = false) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const gemColors = ['#3ee6c0', '#7ff3ff', '#ff5a7a', '#b58bff', '#ffe27a'];
    const r = Math.random();
    const kind: 0 | 1 | 2 = lv >= 3 && r < 0.12 ? 1 : r < 0.3 ? 2 : 0;
    const ang = burst ? Math.random() * Math.PI * 2 : -Math.PI / 2 + (Math.random() - 0.5) * 0.9;
    const sp = (burst ? 4 + Math.random() * 6 : 9 + Math.random() * 6) * dpr;
    this.parts.push({
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp - (burst ? 4 * dpr : 0),
      r: (kind === 2 ? 3 : 9 + Math.random() * 8) * dpr * (lv >= 4 ? 1.2 : 1),
      a: Math.random() * Math.PI * 2,
      va: 0.1 + Math.random() * 0.25,
      life: 1,
      kind,
      color: kind === 1 ? gemColors[Math.floor(Math.random() * gemColors.length)] : kind === 2 ? '#fff6c8' : '#ffd24a',
    });
  }

  private loop = () => {
    if (!this.running) return;
    const c = this.ctx;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.floor(innerWidth * dpr);
    const h = Math.floor(innerHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    c.clearRect(0, 0, w, h);
    // steady fountain + rain, more for higher tiers
    const lv = this.level;
    const rate = [0, 0.18, 0.3, 0.45, 0.6, 0.8][lv] ?? 0.2;
    if (Math.random() < rate) this.spawn(w * (0.3 + Math.random() * 0.4), h + 10, lv);
    if (lv >= 4 && Math.random() < rate / 3) this.parts.push({ x: Math.random() * w, y: -20, vx: (Math.random() - 0.5) * 2, vy: 2 * dpr, r: 10 * dpr, a: Math.random() * 6, va: 0.2, life: 1, kind: 0, color: '#ffd24a' });
    const g = 0.42 * dpr;
    this.parts = this.parts.filter((p) => p.y < h + 60 && p.life > 0);
    for (const p of this.parts) {
      p.vy += g;
      p.x += p.vx;
      p.y += p.vy;
      p.a += p.va;
      if (p.kind === 2) p.life -= 0.02;
      c.save();
      c.translate(p.x, p.y);
      if (p.kind === 0) {
        // spinning coin
        const sx = Math.abs(Math.cos(p.a));
        c.scale(Math.max(0.12, sx), 1);
        const grd = c.createLinearGradient(0, -p.r, 0, p.r);
        grd.addColorStop(0, '#fff3b0');
        grd.addColorStop(0.5, '#e8a92c');
        grd.addColorStop(1, '#8a5a08');
        c.beginPath();
        c.arc(0, 0, p.r, 0, Math.PI * 2);
        c.fillStyle = grd;
        c.fill();
        c.lineWidth = p.r * 0.18;
        c.strokeStyle = '#6b4204';
        c.stroke();
        c.beginPath();
        c.arc(0, 0, p.r * 0.55, 0, Math.PI * 2);
        c.strokeStyle = 'rgba(255,245,200,0.7)';
        c.lineWidth = p.r * 0.1;
        c.stroke();
      } else if (p.kind === 1) {
        c.rotate(p.a);
        c.beginPath();
        c.moveTo(0, -p.r);
        c.lineTo(p.r * 0.7, 0);
        c.lineTo(0, p.r);
        c.lineTo(-p.r * 0.7, 0);
        c.closePath();
        c.fillStyle = p.color;
        c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.7)';
        c.lineWidth = 1.5 * dpr;
        c.stroke();
      } else {
        c.globalAlpha = Math.max(0, p.life);
        c.beginPath();
        c.arc(0, 0, p.r, 0, Math.PI * 2);
        c.fillStyle = p.color;
        c.shadowColor = '#ffe27a';
        c.shadowBlur = 12;
        c.fill();
      }
      c.restore();
    }
    requestAnimationFrame(this.loop);
  };

  /**
   * Show the celebration. `onTier` is called for every tier reached (1..5) so the game can react
   * (jaguar jumps, board effects).
   */
  async show(win: number, bet: number, opts: { kicker?: string; max?: boolean; onTier?: (lv: number) => void } = {}) {
    const finalMult = win / bet;
    const finalLv = opts.max ? 5 : Math.max(1, tierLevel(finalMult));
    if (!this.faceUrl) this.faceUrl = drawMascotHead('roar').toDataURL();
    this.face.src = this.faceUrl;
    this.kicker.textContent = opts.kicker ?? '';
    (this.el.querySelector('.bw-hint') as HTMLElement).textContent = t('tapContinue');
    this.parts = [];
    this.el.hidden = false;
    this.running = true;
    requestAnimationFrame(this.loop);

    let skipped = false;
    const onClick = () => (skipped = true);
    this.el.addEventListener('click', onClick);

    this.setLevel(1, false);
    sound.fanfare();
    opts.onTier?.(1);
    let lastCoin = 0;
    // every tier gets the same share of the count-up time, so each upgrade gets its moment
    const pts = [0, ...BIG_TIERS.map((tt) => tt.min).filter((m) => m < finalMult), finalMult];
    const valueAt = (k: number) => {
      const segs = pts.length - 1;
      const x = Math.min(segs - 1e-9, k * segs);
      const i = Math.floor(x);
      const f = x - i;
      const e = i === segs - 1 ? 1 - Math.pow(1 - f, 2) : f; // the last part slows down
      return (pts[i] + (pts[i + 1] - pts[i]) * e) * bet;
    };
    // count up; the title upgrades whenever the next threshold is passed
    await tween(
      DURATION[finalLv],
      (k) => {
        if (skipped) k = 1;
        const v = k >= 1 ? win : valueAt(k);
        this.amount.textContent = money(v);
        this.mult.textContent = `×${(v / bet).toFixed(v / bet >= 100 ? 0 : 1)}`;
        const lv = k >= 1 ? finalLv : Math.min(finalLv, Math.max(1, tierLevel(v / bet)));
        if (lv > this.level) {
          this.setLevel(lv, opts.max === true && lv === 5);
          sound.tierUp(lv);
          opts.onTier?.(lv);
        }
        if (k - lastCoin > 0.035) {
          lastCoin = k;
          sound.coin();
        }
      },
      ease.linear,
    );
    if (opts.max) this.setLevel(5, true);
    this.amount.textContent = money(win);
    this.mult.textContent = `×${(win / bet).toFixed(finalMult >= 100 ? 0 : 1)}`;
    this.amount.classList.add('done');
    // hold, then close (tap closes earlier)
    skipped = false;
    const end = performance.now() + 2600 / speed.factor();
    while (!skipped && !speed.skip && performance.now() < end) await sleepReal(40);
    this.el.removeEventListener('click', onClick);
    await tween(250, (p) => (this.el.style.opacity = String(1 - p)), ease.linear);
    this.el.hidden = true;
    this.el.style.opacity = '';
    this.amount.classList.remove('done');
    this.running = false;
    this.parts = [];
  }
}
