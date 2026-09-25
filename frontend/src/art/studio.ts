/**
 * Studio brand "SOLSTONE GAMES": a sun stone seen from above – a gold sun disc with a ring of
 * rays, a stepped temple (three nested diamonds) and a glowing eye in the centre.
 * drawStudioMark(size)            – the sign alone (app icon, favicon, small tile badge)
 * drawStudioLogo(layout, theme)   – sign + wordmark, horizontal or stacked, for dark or light ground
 */
import { MAT, circle, lg, path, rg, solid, sparkle } from './kit';

type Ctx = CanvasRenderingContext2D;

/** the sign, painted into a 256×256 box */
function mark(ctx: Ctx, mono = false) {
  const c = 128;
  const gold = mono ? [[0, '#ffffff'], [1, '#d8d8d8']] as [number, string][] : MAT.gold;
  // ray ring
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const long = i % 2 === 0;
    const R = long ? 124 : 110;
    const w = long ? 0.13 : 0.1;
    solid(ctx, path([
      [c + Math.cos(a - w) * 92, c + Math.sin(a - w) * 92],
      [c + Math.cos(a) * R, c + Math.sin(a) * R],
      [c + Math.cos(a + w) * 92, c + Math.sin(a + w) * 92],
    ]), long ? gold : mono ? '#bdbdbd' : MAT.goldDeep, { y0: c - R, y1: c + R, bevel: 2, tex: 0, line: 3 });
  }
  // disc
  solid(ctx, circle(c, c, 96), gold, { y0: 32, y1: 224, shadow: mono ? 0 : 10, bevel: 5, tex: mono ? 0 : 0.1, line: 5 });
  // three stepped diamonds (a temple seen from above)
  const dia = (r: number) => path([[c, c - r], [c + r, c], [c, c + r], [c - r, c]]);
  const tiers: [number, [number, string][] | string][] = mono
    ? [[78, '#e6e6e6'], [58, '#cfcfcf'], [38, '#e6e6e6']]
    : [[78, MAT.goldDeep], [58, [[0, '#5a3a10'], [1, '#1c0e03']]], [38, MAT.gold]];
  for (const [r, m] of tiers) solid(ctx, dia(r), m, { y0: c - r, y1: c + r, bevel: 3, tex: 0, line: 3.5 });
  // glowing core with an eye
  ctx.save();
  if (!mono) {
    ctx.shadowColor = 'rgba(255,220,120,1)';
    ctx.shadowBlur = 18;
  }
  ctx.fillStyle = mono ? '#ffffff' : rg(ctx, c, c - 4, 2, 26, [
    [0, '#ffffff'],
    [0.5, '#fff0b0'],
    [1, '#f0a020'],
  ]);
  ctx.fill(circle(c, c, 24));
  ctx.restore();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#1c0e03';
  ctx.stroke(circle(c, c, 24));
  const eye = new Path2D();
  eye.moveTo(c - 17, c);
  eye.quadraticCurveTo(c, c - 12, c + 17, c);
  eye.quadraticCurveTo(c, c + 12, c - 17, c);
  eye.closePath();
  ctx.fillStyle = '#1c0e03';
  ctx.fill(eye);
  ctx.fillStyle = mono ? '#ffffff' : '#ffd35a';
  ctx.fill(circle(c, c, 4.5));
  if (!mono) sparkle(ctx, c - 44, c - 58, 12);
}

export function drawStudioMark(size = 256, mono = false): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.scale(size / 256, size / 256);
  ctx.lineJoin = 'round';
  mark(ctx, mono);
  return cv;
}

/** sign + wordmark. theme 'dark' = for dark backgrounds (gold/cream text), 'light' = dark text */
export function drawStudioLogo(layout: 'row' | 'stack' = 'row', theme: 'dark' | 'light' = 'dark', height = 256): HTMLCanvasElement {
  const k = height / 256;
  const W = layout === 'row' ? 1160 : 820;
  const H = layout === 'row' ? 256 : 470;
  const cv = document.createElement('canvas');
  cv.width = Math.round(W * k);
  cv.height = Math.round(H * k);
  const ctx = cv.getContext('2d')!;
  ctx.scale(k, k);
  ctx.lineJoin = 'round';
  // sign
  ctx.save();
  if (layout === 'row') ctx.translate(0, 0);
  else ctx.translate((W - 256) / 2, 0);
  mark(ctx);
  ctx.restore();
  // wordmark
  const tx = layout === 'row' ? 290 : W / 2;
  const align: CanvasTextAlign = layout === 'row' ? 'left' : 'center';
  const y1 = layout === 'row' ? 150 : 372;
  const y2 = layout === 'row' ? 212 : 440;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.font = '900 118px Cinzel, Georgia, serif';
  (ctx as any).letterSpacing = '10px';
  if (theme === 'dark') {
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#140a02';
    ctx.strokeText('SOLSTONE', tx, y1);
    ctx.fillStyle = lg(ctx, 0, y1 - 96, 0, y1, [
      [0, '#fff8d6'],
      [0.45, '#ffd35a'],
      [0.55, '#c8861a'],
      [1, '#ffe39a'],
    ]);
  } else {
    ctx.fillStyle = '#1c1206';
  }
  ctx.fillText('SOLSTONE', tx, y1);
  ctx.font = '700 44px Cinzel, Georgia, serif';
  (ctx as any).letterSpacing = layout === 'row' ? '34px' : '30px';
  ctx.fillStyle = theme === 'dark' ? '#e9d7ac' : '#6a4a10';
  ctx.fillText('GAMES', tx + (layout === 'row' ? 6 : 15), y2);
  // thin gold rules beside GAMES
  if (layout === 'row') {
    ctx.fillStyle = theme === 'dark' ? 'rgba(255,211,90,0.7)' : 'rgba(106,74,16,0.7)';
    const gw = ctx.measureText('GAMES').width;
    ctx.fillRect(tx + gw + 40, y2 - 16, 300 - gw + 250, 3);
  }
  return cv;
}
