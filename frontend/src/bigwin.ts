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

/** pre-rendered coin sprite (drawing gradients per particle per frame made taps stutter) */
const COIN = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d')!;
  const r = 30;
  x.translate(32, 32);
  const grd = x.createLinearGradient(0, -r, 0, r);
  grd.addColorStop(0, '#fff3b0');
  grd.addColorStop(0.5, '#e8a92c');
  grd.addColorStop(1, '#8a5a08');
  x.beginPath();
  x.arc(0, 0, r - 2.5, 0, Math.PI * 2);
  x.fillStyle = grd;
  x.fill();
  x.lineWidth = 5;
  x.strokeStyle = '#6b4204';
  x.stroke();
  x.beginPath();
  x.arc(0, 0, r * 0.55, 0, Math.PI * 2);
  x.strokeStyle = 'rgba(255,245,200,0.7)';
  x.lineWidth = 3;
  x.stroke();
  return c;
})();
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
      <div class="bw-shock"></div>
      <div class="bw-shock s2"></div>
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

  /** epic tier change: old title blasts away, shockwave, new title slams in */
  private transition(lv: number, max: boolean) {
    const old = this.title.cloneNode(true) as HTMLElement;
    old.classList.remove('pop', 'slam');
    old.classList.add('bw-ghost');
    old.style.top = `${this.title.offsetTop}px`;
    old.style.left = `${this.title.offsetLeft}px`;
    old.style.width = `${this.title.offsetWidth}px`;
    this.title.parentElement!.appendChild(old);
    window.setTimeout(() => old.remove(), 700);
    for (const sh of Array.from(this.el.querySelectorAll('.bw-shock')) as HTMLElement[]) {
      sh.classList.remove('go');
      void sh.offsetWidth;
      sh.classList.add('go');
    }
    this.setLevel(lv, max);
    this.title.classList.remove('pop');
    void this.title.offsetWidth;
    this.title.classList.add('slam');
    this.el.classList.remove('impact');
    void this.el.offsetWidth;
    this.el.classList.add('impact');
    // spark explosion (sparks and gems, only a few coins)
    const w = this.canvas.width;
    const h = this.canvas.height;
    for (let i = 0; i < 26 + lv * 8; i++) this.spawn(w / 2, h * 0.42, lv, true, true);
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

  private spawn(x: number, y: number, lv: number, burst = false, blast = false) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const gemColors = ['#3ee6c0', '#7ff3ff', '#ff5a7a', '#b58bff', '#ffe27a'];
    const r = Math.random();
    const kind: 0 | 1 | 2 = blast ? (r < 0.2 ? 1 : r < 0.85 ? 2 : 0) : lv >= 3 && r < 0.12 ? 1 : r < 0.3 ? 2 : 0;
    const ang = burst ? Math.random() * Math.PI * 2 : -Math.PI / 2 + (Math.random() - 0.5) * 0.9;
    const sp = (blast ? 10 + Math.random() * 16 : burst ? 4 + Math.random() * 6 : 9 + Math.random() * 6) * dpr;
    this.parts.push({
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp - (burst ? 4 * dpr : 0),
      r: (kind === 2 ? (blast ? 3 + Math.random() * 3 : 3) : 9 + Math.random() * 8) * dpr * (lv >= 4 ? 1.2 : 1),
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
    if (this.parts.length > 320) this.parts.splice(0, this.parts.length - 320);
    for (const p of this.parts) {
      p.vy += g;
      p.x += p.vx;
      p.y += p.vy;
      p.a += p.va;
      if (p.kind === 2) {
        p.life -= 0.018;
        p.vx *= 0.97;
        p.vy *= 0.97;
      }
      c.save();
      c.translate(p.x, p.y);
      if (p.kind === 0) {
        // spinning coin
        const sx = Math.abs(Math.cos(p.a));
        c.scale(Math.max(0.12, sx), 1);
        c.drawImage(COIN, -p.r, -p.r, p.r * 2, p.r * 2);
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
        const al = Math.max(0, p.life);
        c.globalAlpha = al * 0.3;
        c.beginPath();
        c.arc(0, 0, p.r * 2.4, 0, Math.PI * 2);
        c.fillStyle = '#ffe27a';
        c.fill();
        c.globalAlpha = al;
        c.beginPath();
        c.arc(0, 0, p.r, 0, Math.PI * 2);
        c.fillStyle = p.color;
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

    // every tap jumps one tier up (to the next threshold, with its tier change);
    // on the last stretch a tap jumps to the final amount
    let taps = 0;
    let lastTap = 0;
    const onClick = () => {
      const now = performance.now();
      if (now - lastTap < 180) return; // one double click = one tap
      lastTap = now;
      taps++;
    };
    this.el.addEventListener('pointerdown', onClick);
    const tapped = () => {
      if (taps > 0) {
        taps--;
        return true;
      }
      return false;
    };

    this.setLevel(1, false);
    sound.fanfare();
    opts.onTier?.(1);
    // Hacksaw style: count up to the next threshold, hold for a beat, then the next tier
    // slams in with its own look – repeated until the final amount.
    // BIG WIN is shown from the start; every further tier threshold below the final amount is a stop
    const pts = [0, ...BIG_TIERS.slice(1).map((tt) => tt.min).filter((m) => m < finalMult), finalMult];
    const segs = pts.length - 1;
    const segMs = DURATION[finalLv] / segs;
    const put = (v: number) => {
      this.amount.textContent = money(v);
      this.mult.textContent = `×${(v / bet).toFixed(v / bet >= 100 ? 0 : 1)}`;
    };
    // count that can be cut short by a tap (resolves true when tapped)
    const count = (ms: number, update: (k: number) => void, easing: (x: number) => number) =>
      new Promise<boolean>((resolve) => {
        let last = performance.now();
        let el = 0;
        const step = (now: number) => {
          if (tapped()) return resolve(true);
          el += Math.min(100, now - last) * speed.factor();
          last = now;
          const p = Math.min(1, el / Math.max(1, ms));
          update(easing(p));
          if (p < 1) requestAnimationFrame(step);
          else resolve(false);
        };
        requestAnimationFrame(step);
      });
    const pause = async (ms: number) => {
      const end = performance.now() + ms / speed.factor();
      while (performance.now() < end) {
        if (taps > 0) return true; // leave the tap for the next count → it jumps one tier
        await sleepReal(16);
      }
      return false;
    };
    for (let i = 0; i < segs; i++) {
      const from = pts[i] * bet;
      const to = pts[i + 1] * bet;
      const last = i === segs - 1;
      let lastCoin = 0;
      let charging = false;
      if (!last) sound.riser(segMs / 1000 / speed.factor());
      const cut = await count(
        segMs,
        (k) => {
          put(from + (to - from) * k);
          // the last stretch before a new tier: everything starts to tremble and glow
          if (!last && k > 0.6 && !charging) {
            charging = true;
            this.el.classList.add('charge');
          }
          if (charging) this.el.style.setProperty('--charge', String((k - 0.6) / 0.4));
          if (k - lastCoin > (last ? 0.08 : 0.05)) {
            lastCoin = k;
            sound.coin();
          }
        },
        // rushes up to the threshold, the last segment slows down to the final amount
        last ? ease.outCubic : (x) => x * x * x * 0.55 + x * 0.45,
      );
      this.el.classList.remove('charge');
      this.el.style.setProperty('--charge', '0');
      if (last) break;
      // threshold reached (or tapped): the new tier explodes in
      put(to);
      this.amount.classList.remove('hit');
      void this.amount.offsetWidth;
      this.amount.classList.add('hit');
      if (!cut) await pause(200);
      const lv = tierLevel(pts[i + 1]);
      this.transition(lv, false);
      sound.tierUp(lv);
      sound.boom(lv);
      opts.onTier?.(lv);
      // let the new tier breathe a moment; a tap here ends the pause and jumps the next tier
      await pause(cut ? 380 : 650);
    }
    if (this.level < finalLv) {
      this.transition(finalLv, opts.max === true && finalLv === 5);
      opts.onTier?.(finalLv);
    }
    put(win);
    if (opts.max) this.setLevel(5, true);
    this.amount.textContent = money(win);
    this.mult.textContent = `×${(win / bet).toFixed(finalMult >= 100 ? 0 : 1)}`;
    this.amount.classList.add('done');
    // hold, then close (tap closes earlier)
    taps = 0;
    const end = performance.now() + 2600 / speed.factor();
    while (!taps && !speed.skip && performance.now() < end) await sleepReal(30);
    this.el.removeEventListener('pointerdown', onClick);
    await tween(250, (p) => (this.el.style.opacity = String(1 - p)), ease.linear);
    this.el.hidden = true;
    this.el.style.opacity = '';
    this.amount.classList.remove('done');
    this.running = false;
    this.parts = [];
  }
}
