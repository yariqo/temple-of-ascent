import { GOLD, lin, makeCanvas, rad } from './draw';

/** Carved stone frame around the reels, with gold trim and step-fret corners.
 *  Returned canvas covers (w + 2m) × (h + 2m); the reel window is at (m, m). */
export function drawFrame(w: number, h: number, m: number): HTMLCanvasElement {
  const W = w + 2 * m;
  const H = h + 2 * m;
  const [c, ctx] = makeCanvas(W, H);
  // outer stone
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  ctx.beginPath();
  ctx.roundRect(4, 4, W - 8, H - 8, 30);
  ctx.fillStyle = lin(ctx, 0, 0, 0, H, [
    [0, '#6a5d48'],
    [0.5, '#4a4133'],
    [1, '#2e281f'],
  ]);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  // stone grain
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,240,210,0.06)';
    ctx.fillRect(x, y, 2 + Math.random() * 3, 1 + Math.random() * 2);
  }
  // step-fret band along the frame
  ctx.strokeStyle = 'rgba(20,14,8,0.55)';
  ctx.lineWidth = 3;
  const band = (x0: number, y0: number, len: number, horiz: boolean) => {
    const step = 22;
    for (let k = 0; k + step <= len; k += step) {
      ctx.beginPath();
      if (horiz) {
        const x = x0 + k;
        ctx.moveTo(x, y0 + 12);
        ctx.lineTo(x, y0 + 2);
        ctx.lineTo(x + 11, y0 + 2);
        ctx.lineTo(x + 11, y0 + 8);
        ctx.lineTo(x + 6, y0 + 8);
      } else {
        const y = y0 + k;
        ctx.moveTo(x0 + 12, y);
        ctx.lineTo(x0 + 2, y);
        ctx.lineTo(x0 + 2, y + 11);
        ctx.lineTo(x0 + 8, y + 11);
        ctx.lineTo(x0 + 8, y + 6);
      }
      ctx.stroke();
    }
  };
  band(m, 8, w, true);
  band(m, H - m + 12, w, true);
  band(8, m, h, false);
  band(W - m + 10, m, h, false);
  // inner gold trim
  ctx.beginPath();
  ctx.roundRect(m - 10, m - 10, w + 20, h + 20, 18);
  ctx.strokeStyle = lin(ctx, 0, m, 0, m + h, GOLD);
  ctx.lineWidth = 7;
  ctx.stroke();
  // reel window (dark, recessed)
  ctx.beginPath();
  ctx.roundRect(m - 6, m - 6, w + 12, h + 12, 14);
  ctx.fillStyle = rad(ctx, W / 2, H / 2, 40, Math.max(w, h) * 0.7, [
    [0, 'rgba(20,34,26,0.95)'],
    [1, 'rgba(5,10,8,0.97)'],
  ]);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.lineWidth = 3;
  ctx.stroke();
  // corner medallions
  for (const [x, y] of [
    [m / 2 + 2, m / 2 + 2],
    [W - m / 2 - 2, m / 2 + 2],
    [m / 2 + 2, H - m / 2 - 2],
    [W - m / 2 - 2, H - m / 2 - 2],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, m / 2 + 4, 0, Math.PI * 2);
    ctx.fillStyle = lin(ctx, 0, y - m / 2, 0, y + m / 2, GOLD);
    ctx.fill();
    ctx.strokeStyle = '#3a2204';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, m / 4, 0, Math.PI * 2);
    ctx.fillStyle = '#1aa6a0';
    ctx.fill();
    ctx.stroke();
  }
  return c;
}
