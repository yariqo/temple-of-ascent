import { lin, makeCanvas, rad } from './draw';

/** Background scene per pyramid stage (0 = base game). Drawn once, 1600×1000, scaled to cover. */
export const SCENE_W = 1600;
export const SCENE_H = 1000;

interface Palette {
  sky: [string, string, string];
  pyramid: string;
  pyramidLight: string;
  leaves: string;
  mist: string;
  glow?: string; // torches
  sun?: 'moon' | 'dusk' | 'eclipse';
}

const PALETTES: Record<number, Palette> = {
  0: { sky: ['#06140f', '#0c2a1f', '#154533'], pyramid: '#0c2219', pyramidLight: '#1c4332', leaves: '#03100a', mist: 'rgba(120,200,160,0.10)', sun: 'moon' },
  1: { sky: ['#07170f', '#0e3322', '#1c5a3a'], pyramid: '#0e281c', pyramidLight: '#24533a', leaves: '#031009', mist: 'rgba(140,220,170,0.12)', sun: 'moon' },
  2: { sky: ['#140d05', '#2e1f0c', '#4a3312'], pyramid: '#1d1609', pyramidLight: '#4b3818', leaves: '#0a0703', mist: 'rgba(255,190,90,0.10)', glow: '#ff9a2a', sun: 'moon' },
  3: { sky: ['#1a0707', '#5a1a0e', '#c2521c'], pyramid: '#1f0b07', pyramidLight: '#5a2410', leaves: '#0c0402', mist: 'rgba(255,120,60,0.14)', glow: '#ff7a1a', sun: 'dusk' },
  4: { sky: ['#020103', '#0d0718', '#26103d'], pyramid: '#07040c', pyramidLight: '#2a1b40', leaves: '#010102', mist: 'rgba(170,120,255,0.12)', glow: '#ffd24a', sun: 'eclipse' },
};

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function drawScene(stage: number): HTMLCanvasElement {
  const p = PALETTES[stage] ?? PALETTES[0];
  const [cv, ctx] = makeCanvas(SCENE_W, SCENE_H);
  const W = SCENE_W;
  const H = SCENE_H;
  const r = rng(7 + stage);

  // sky
  ctx.fillStyle = lin(ctx, 0, 0, 0, H, [
    [0, p.sky[0]],
    [0.55, p.sky[1]],
    [1, p.sky[2]],
  ]);
  ctx.fillRect(0, 0, W, H);

  // stars
  const starCount = stage === 4 ? 220 : stage === 3 ? 20 : 90;
  for (let i = 0; i < starCount; i++) {
    const x = r() * W;
    const y = r() * H * 0.55;
    const a = 0.2 + r() * 0.6;
    ctx.fillStyle = `rgba(255,255,240,${a})`;
    ctx.fillRect(x, y, r() < 0.1 ? 2.5 : 1.5, r() < 0.1 ? 2.5 : 1.5);
  }

  // sun / moon / eclipse behind the pyramid top
  const sx = W / 2;
  const sy = p.sun === 'eclipse' ? H * 0.17 : H * 0.3;
  if (p.sun === 'moon') {
    ctx.fillStyle = rad(ctx, sx + 380, sy - 120, 10, 160, [
      [0, 'rgba(220,255,235,0.35)'],
      [1, 'rgba(220,255,235,0)'],
    ]);
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    ctx.arc(sx + 380, sy - 120, 42, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(235,255,240,0.85)';
    ctx.fill();
  } else if (p.sun === 'dusk') {
    ctx.fillStyle = rad(ctx, sx, sy + 60, 20, 520, [
      [0, 'rgba(255,200,90,0.9)'],
      [0.25, 'rgba(255,120,40,0.45)'],
      [1, 'rgba(255,80,20,0)'],
    ]);
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    ctx.arc(sx, sy + 60, 90, 0, Math.PI * 2);
    ctx.fillStyle = '#ffcf6a';
    ctx.fill();
  } else if (p.sun === 'eclipse') {
    ctx.fillStyle = rad(ctx, sx, sy, 60, 460, [
      [0, 'rgba(255,230,140,0.95)'],
      [0.18, 'rgba(255,190,70,0.55)'],
      [0.45, 'rgba(160,90,255,0.22)'],
      [1, 'rgba(80,40,160,0)'],
    ]);
    ctx.fillRect(0, 0, W, H);
    // corona streaks
    ctx.save();
    ctx.translate(sx, sy);
    for (let i = 0; i < 48; i++) {
      ctx.rotate((Math.PI * 2) / 48);
      ctx.beginPath();
      ctx.moveTo(-3, -96);
      ctx.lineTo(0, -150 - r() * 120);
      ctx.lineTo(3, -96);
      ctx.fillStyle = 'rgba(255,225,150,0.35)';
      ctx.fill();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(sx, sy, 98, 0, Math.PI * 2);
    ctx.fillStyle = '#ffe8a0';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx, sy, 92, 0, Math.PI * 2);
    ctx.fillStyle = '#030206';
    ctx.fill();
  }

  // far jungle hills
  ctx.fillStyle = p.pyramid;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.62);
  for (let x = 0; x <= W; x += 40) ctx.lineTo(x, H * 0.6 + Math.sin(x * 0.012) * 18 + r() * 14);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.fill();
  ctx.globalAlpha = 1;

  // pyramid (stepped)
  const baseY = H * 0.86;
  const topY = H * 0.36;
  const steps = 8;
  const baseW = 1040;
  const topW = 230;
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const y0 = baseY - (baseY - topY) * t0;
    const y1 = baseY - (baseY - topY) * t1;
    const w0 = baseW - (baseW - topW) * t0;
    ctx.fillStyle = lin(ctx, sx - w0 / 2, 0, sx + w0 / 2, 0, [
      [0, p.pyramid],
      [0.45, p.pyramidLight],
      [1, p.pyramid],
    ]);
    ctx.fillRect(sx - w0 / 2, y1, w0, y0 - y1 + 1);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(sx - w0 / 2, y1, w0, 4);
  }
  // central staircase
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.moveTo(sx - 70, baseY);
  ctx.lineTo(sx - 34, topY);
  ctx.lineTo(sx + 34, topY);
  ctx.lineTo(sx + 70, baseY);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 2;
  for (let y = topY; y < baseY; y += 14) {
    const k = (y - topY) / (baseY - topY);
    ctx.beginPath();
    ctx.moveTo(sx - 34 - 36 * k, y);
    ctx.lineTo(sx + 34 + 36 * k, y);
    ctx.stroke();
  }
  // temple on top
  ctx.fillStyle = p.pyramidLight;
  ctx.fillRect(sx - 90, topY - 96, 180, 96);
  ctx.fillStyle = p.pyramid;
  ctx.fillRect(sx - 104, topY - 118, 208, 26);
  ctx.fillStyle = '#000';
  ctx.globalAlpha = 0.6;
  ctx.fillRect(sx - 26, topY - 62, 52, 62);
  ctx.globalAlpha = 1;

  // torches
  if (p.glow) {
    const torchY = [0.8, 0.66, 0.52, 0.4];
    for (const t of torchY) {
      const y = H * t;
      const k = (baseY - y) / (baseY - topY);
      const w = baseW - (baseW - topW) * k;
      for (const side of [-1, 1]) {
        const x = sx + side * (w / 2 - 20);
        ctx.fillStyle = rad(ctx, x, y - 10, 2, 60, [
          [0, 'rgba(255,220,140,0.9)'],
          [0.3, p.glow + '88'],
          [1, 'rgba(0,0,0,0)'],
        ]);
        ctx.fillRect(x - 60, y - 70, 120, 120);
      }
    }
    // doorway glow
    ctx.fillStyle = rad(ctx, sx, topY - 30, 4, 120, [
      [0, 'rgba(255,220,140,0.85)'],
      [1, 'rgba(255,160,40,0)'],
    ]);
    ctx.fillRect(sx - 120, topY - 150, 240, 240);
  }

  // mist
  ctx.fillStyle = lin(ctx, 0, H * 0.6, 0, H, [
    [0, 'rgba(0,0,0,0)'],
    [0.5, p.mist],
    [1, 'rgba(0,0,0,0.5)'],
  ]);
  ctx.fillRect(0, H * 0.55, W, H * 0.45);

  // foreground jungle leaves (left + right)
  const leaf = (x: number, y: number, len: number, ang: number, width: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(width, len * 0.45, 0, len);
    ctx.quadraticCurveTo(-width, len * 0.45, 0, 0);
    ctx.fill();
    ctx.restore();
  };
  ctx.fillStyle = p.leaves;
  for (let i = 0; i < 26; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const bx = side < 0 ? -40 + r() * 160 : W + 40 - r() * 160;
    const by = H * (0.05 + r() * 1.0);
    const ang = side < 0 ? -Math.PI / 2 - 0.3 + r() * 1.2 : Math.PI / 2 - 0.9 + r() * 1.2;
    leaf(bx, by, 180 + r() * 220, ang, 40 + r() * 50);
  }
  // hanging vines
  ctx.strokeStyle = p.leaves;
  ctx.lineWidth = 5;
  for (let i = 0; i < 9; i++) {
    const x = r() * W;
    const len = 60 + r() * 220;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.quadraticCurveTo(x + (r() - 0.5) * 60, len / 2, x + (r() - 0.5) * 30, len);
    ctx.stroke();
    for (let k = 20; k < len; k += 30) leaf(x + (r() - 0.5) * 16, k, 26, r() < 0.5 ? -0.9 : 0.9, 10);
  }

  // vignette
  ctx.fillStyle = rad(ctx, W / 2, H / 2, H * 0.35, H * 0.95, [
    [0, 'rgba(0,0,0,0)'],
    [1, 'rgba(0,0,0,0.65)'],
  ]);
  ctx.fillRect(0, 0, W, H);
  return cv;
}
