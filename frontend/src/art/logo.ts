/**
 * Game logo "BALAM" – drawn once on a canvas (gold letters with a carved 3D edge,
 * sun rays behind and jaguar medallions on both sides).
 */
import { drawMascotHead, MASCOT_GEO } from './mascot';
import { lin, makeCanvas, rad } from './draw';

type Ctx = CanvasRenderingContext2D;

function medallion(ctx: Ctx, x: number, y: number, r: number, head: HTMLCanvasElement, flip: boolean) {
  ctx.save();
  // outer gold ring with step pattern
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = lin(ctx, 0, y - r, 0, y + r, [
    [0, '#fff3b8'],
    [0.45, '#e2a73a'],
    [0.55, '#9a6110'],
    [1, '#e8b54a'],
  ]);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#1a0d02';
  ctx.stroke();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82);
    ctx.lineTo(x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95);
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(90,50,4,0.75)';
    ctx.stroke();
  }
  // jade inner disc
  ctx.beginPath();
  ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
  ctx.fillStyle = rad(ctx, x, y - r * 0.2, 4, r * 0.8, [
    [0, '#2fbf92'],
    [1, '#063b2c'],
  ]);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#1a0d02';
  ctx.stroke();
  // jaguar head inside
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.76, 0, Math.PI * 2);
  ctx.clip();
  const H = MASCOT_GEO.head;
  const s = (r * 1.5) / H.w;
  ctx.translate(x, y + r * 0.12);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(head, -H.ax * s, -H.ay * s, H.w * s, H.h * s);
  ctx.restore();
  ctx.restore();
}

export function drawLogo(text = 'BALAM'): HTMLCanvasElement {
  const W = 1500;
  const Hh = 320;
  const [c, ctx] = makeCanvas(W, Hh);
  const cx = W / 2;
  const base = 250;

  // sun rays behind the word
  ctx.save();
  ctx.translate(cx, 160);
  for (let i = 0; i < 36; i++) {
    ctx.rotate((Math.PI * 2) / 36);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-22, -300);
    ctx.lineTo(22, -300);
    ctx.closePath();
    ctx.fillStyle = rad(ctx, 0, 0, 0, 158, [
      [0, i % 2 ? 'rgba(255,215,120,0.28)' : 'rgba(255,235,170,0.14)'],
      [1, 'rgba(255,215,120,0)'],
    ]);
    ctx.fill();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(cx, 160, 560, 158, 0, 0, Math.PI * 2);
  ctx.save();
  ctx.translate(cx, 160);
  ctx.scale(1, 158 / 560);
  ctx.translate(-cx, -160);
  ctx.fillStyle = rad(ctx, cx, 160, 10, 560, [
    [0, 'rgba(255,200,90,0.32)'],
    [1, 'rgba(255,200,90,0)'],
  ]);
  ctx.fill();
  ctx.restore();

  ctx.font = '900 232px "Cinzel Decorative", Cinzel, Georgia, serif';
  (ctx as any).letterSpacing = '10px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // carved 3D edge (extrusion)
  for (let i = 16; i >= 1; i--) {
    ctx.fillStyle = i > 12 ? '#0d0601' : `rgb(${60 - i * 2},${32 - i},${6})`;
    ctx.fillText(text, cx, base + i);
  }
  // dark outline
  ctx.lineJoin = 'round';
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#140a02';
  ctx.strokeText(text, cx, base);
  // gold body with a metallic horizon
  ctx.fillStyle = lin(ctx, 0, base - 190, 0, base, [
    [0, '#fffbe0'],
    [0.28, '#ffe486'],
    [0.52, '#e4a634'],
    [0.53, '#a8680e'],
    [0.75, '#dc9a24'],
    [1, '#ffe39a'],
  ]);
  ctx.fillText(text, cx, base);
  // thin bright inner line
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,250,220,0.85)';
  ctx.strokeText(text, cx, base - 1);
  // glossy diagonal highlight on the letters only
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = lin(ctx, cx - 400, 0, cx + 200, 260, [
    [0, 'rgba(255,255,255,0)'],
    [0.42, 'rgba(255,255,255,0)'],
    [0.5, 'rgba(255,255,255,0.45)'],
    [0.58, 'rgba(255,255,255,0)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  ctx.fillRect(0, 0, W, Hh);
  ctx.restore();

  // jade gems at the ends
  const tw = ctx.measureText(text).width;
  const head = drawMascotHead('open');
  medallion(ctx, cx - tw / 2 - 100, 164, 92, head, false);
  medallion(ctx, cx + tw / 2 + 100, 164, 92, head, true);
  return c;
}
