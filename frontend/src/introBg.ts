/**
 * Animated background of the start screen (Canvas2D, runs only while the intro is open):
 * night jungle sky, a huge sun rising behind the temple pyramid with slowly turning god rays,
 * drifting fog, swaying leaves in the corners and embers / fireflies floating up.
 */

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  hue: number;
  ph: number;
}

export class IntroBg {
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private t0 = performance.now();
  private motes: Mote[] = [];
  private w = 0;
  private h = 0;
  private dpr = 1;
  /** 0 → 1: brightness boost while the game is entered */
  surge = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  start() {
    this.t0 = performance.now();
    const loop = () => {
      this.frame();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(this.canvas.clientWidth * dpr);
    const h = Math.round(this.canvas.clientHeight * dpr);
    if (w !== this.canvas.width || h !== this.canvas.height) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.w = w;
    this.h = h;
    this.dpr = dpr;
  }

  private frame() {
    this.resize();
    const { ctx, w, h, dpr } = this;
    if (!w || !h) return;
    const t = (performance.now() - this.t0) / 1000;
    const S = Math.min(w, h * 1.4); // scene scale
    const cx = w / 2;
    const ground = h * 0.9;
    const intro = Math.min(1, t / 2.2); // sun rises during the first seconds
    const e = 1 - Math.pow(1 - intro, 3);

    // sky
    let g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#04110e');
    g.addColorStop(0.45, '#0b2a22');
    g.addColorStop(0.8, '#123a2c');
    g.addColorStop(1, '#07140f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // sun behind the temple
    const sunY = ground - S * (0.3 + 0.16 * e);
    const sunR = S * 0.12;
    const boost = 1 + this.surge * 1.5;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    g = ctx.createRadialGradient(cx, sunY, 0, cx, sunY, S * 0.95);
    g.addColorStop(0, `rgba(255,200,90,${0.45 * boost})`);
    g.addColorStop(0.25, `rgba(255,140,40,${0.14 * boost})`);
    g.addColorStop(1, 'rgba(255,120,30,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // god rays
    ctx.translate(cx, sunY);
    ctx.rotate(t * 0.05);
    const rays = 18;
    for (let i = 0; i < rays; i++) {
      ctx.rotate((Math.PI * 2) / rays);
      const len = S * (1.1 + 0.15 * Math.sin(t * 0.8 + i));
      const rg = ctx.createLinearGradient(0, 0, 0, -len);
      rg.addColorStop(0, `rgba(255,220,140,${(0.16 + 0.06 * Math.sin(t * 1.3 + i * 2)) * boost})`);
      rg.addColorStop(1, 'rgba(255,220,140,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.moveTo(-S * 0.03, 0);
      ctx.lineTo(-S * 0.1, -len);
      ctx.lineTo(S * 0.1, -len);
      ctx.lineTo(S * 0.03, 0);
      ctx.fill();
    }
    ctx.restore();
    // sun disc
    g = ctx.createRadialGradient(cx, sunY - sunR * 0.2, sunR * 0.1, cx, sunY, sunR);
    g.addColorStop(0, '#fff6d0');
    g.addColorStop(0.5, '#ffc454');
    g.addColorStop(1, '#e0741a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    // distant jungle hills
    ctx.fillStyle = '#0a2219';
    ctx.beginPath();
    ctx.moveTo(0, ground - S * 0.18);
    for (let x = 0; x <= w; x += w / 24) ctx.lineTo(x, ground - S * (0.16 + 0.05 * Math.sin(x / (S * 0.18) + 1.3)));
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    // step pyramid silhouette with glowing shrine door
    const steps = 6;
    const baseW = S * 0.9;
    const stepH = S * 0.055;
    ctx.fillStyle = '#061510';
    for (let i = 0; i < steps; i++) {
      const sw = baseW * (1 - i * 0.13);
      ctx.fillRect(cx - sw / 2, ground - (i + 1) * stepH, sw, stepH + 1);
    }
    // stairs
    ctx.fillStyle = '#0a1f17';
    ctx.beginPath();
    ctx.moveTo(cx - S * 0.07, ground);
    ctx.lineTo(cx + S * 0.07, ground);
    ctx.lineTo(cx + S * 0.035, ground - steps * stepH);
    ctx.lineTo(cx - S * 0.035, ground - steps * stepH);
    ctx.fill();
    // shrine
    const shY = ground - steps * stepH;
    const shW = baseW * (1 - steps * 0.13) * 0.9;
    ctx.fillStyle = '#061510';
    ctx.fillRect(cx - shW / 2, shY - stepH * 1.6, shW, stepH * 1.6);
    ctx.fillRect(cx - shW * 0.6, shY - stepH * 2, shW * 1.2, stepH * 0.45);
    const pulse = 0.75 + 0.25 * Math.sin(t * 2.2);
    ctx.save();
    ctx.shadowColor = `rgba(120,255,230,${0.9 * pulse})`;
    ctx.shadowBlur = 30 * dpr;
    ctx.fillStyle = `rgba(160,255,235,${0.85 * pulse * (0.5 + 0.5 * e)})`;
    ctx.fillRect(cx - shW * 0.14, shY - stepH * 1.25, shW * 0.28, stepH * 1.25);
    ctx.restore();
    // stair edge light
    ctx.strokeStyle = 'rgba(255,200,110,0.18)';
    ctx.lineWidth = 1.5 * dpr;
    for (let i = 1; i <= steps; i++) {
      const sw = baseW * (1 - (i - 1) * 0.13);
      ctx.beginPath();
      ctx.moveTo(cx - sw / 2, ground - i * stepH + 0.5);
      ctx.lineTo(cx + sw / 2, ground - i * stepH + 0.5);
      ctx.stroke();
    }

    // fog bands
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 4; i++) {
      const fy = ground - S * (0.05 + i * 0.07);
      const fx = ((t * (12 + i * 6) * dpr + i * w * 0.37) % (w * 1.6)) - w * 0.3;
      g = ctx.createRadialGradient(fx, fy, 0, fx, fy, S * 0.5);
      g.addColorStop(0, 'rgba(120,200,170,0.10)');
      g.addColorStop(1, 'rgba(120,200,170,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, fy - S * 0.5, w, S);
    }
    ctx.restore();
    // ground
    g = ctx.createLinearGradient(0, ground - 2, 0, h);
    g.addColorStop(0, '#04100b');
    g.addColorStop(1, '#010604');
    ctx.fillStyle = g;
    ctx.fillRect(0, ground, w, h - ground);

    // leaves in the corners (sway)
    this.leaves(ctx, 0, 0, S, t, 1);
    this.leaves(ctx, w, 0, S, t + 1.7, -1);
    this.leaves(ctx, 0, h, S * 0.9, t + 0.8, 1, true);
    this.leaves(ctx, w, h, S * 0.9, t + 2.4, -1, true);

    // embers / fireflies
    if (this.motes.length < 70) {
      this.motes.push({
        x: Math.random() * w,
        y: h + 10,
        vx: (Math.random() - 0.5) * 12 * dpr,
        vy: -(18 + Math.random() * 40) * dpr * (1 + this.surge * 3),
        r: (1 + Math.random() * 2.2) * dpr,
        a: 0,
        hue: Math.random() < 0.7 ? 38 : 168,
        ph: Math.random() * 6,
      });
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const dt = 1 / 60;
    this.motes = this.motes.filter((m) => m.y > -20);
    for (const m of this.motes) {
      m.x += (m.vx + Math.sin(t * 1.5 + m.ph) * 8 * dpr) * dt;
      m.y += m.vy * dt;
      m.a = Math.min(1, m.a + dt);
      const tw = 0.5 + 0.5 * Math.sin(t * 4 + m.ph);
      ctx.fillStyle = `hsla(${m.hue},100%,70%,${0.7 * m.a * tw})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `hsla(${m.hue},100%,92%,${m.a * tw})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // white-gold flash when entering the game
    if (this.surge > 0) {
      ctx.fillStyle = `rgba(255,236,190,${this.surge * 0.35})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  /** a bunch of big jungle leaves hanging into a corner */
  private leaves(ctx: CanvasRenderingContext2D, x: number, y: number, S: number, t: number, dir: number, bottom = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, bottom ? -1 : 1);
    const n = 5;
    for (let i = 0; i < n; i++) {
      const ang = 0.25 + i * 0.28 + Math.sin(t * 0.9 + i) * 0.035;
      const len = S * (0.34 + (i % 2) * 0.1);
      ctx.save();
      ctx.rotate(ang);
      const g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, '#02100a');
      g.addColorStop(1, i % 2 ? '#0d3a26' : '#0a2e1e');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(len * 0.5, -len * 0.2, len, 0);
      ctx.quadraticCurveTo(len * 0.5, len * 0.2, 0, 0);
      ctx.fill();
      ctx.strokeStyle = 'rgba(80,160,110,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len * 0.95, 0);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
}
