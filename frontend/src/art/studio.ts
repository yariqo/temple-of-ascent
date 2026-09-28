/**
 * Studio brand "SOLSTONE GAMES": the sun rising behind a stepped temple, with short rays above.
 * Same sign as the white publisher logo on Stake – here in gold for the splash and loading screen.
 * drawStudioMark(size, mono)      – the sign alone (favicon, splash, small badges)
 * drawStudioLogo(layout, theme)   – sign + wordmark, horizontal or stacked
 * drawStudioWordmark(height)      – wordmark alone
 */
type Ctx = CanvasRenderingContext2D;

/** the sign in a 100×100 box */
function mark(ctx: Ctx, mono = false) {
  const base = 94;
  const h = 11;
  const gap = 4.5;
  const steps: [number, number, number][] = [
    [8, base - h, 84],
    [19, base - 2 * h, 62],
    [30, base - 3 * h, 40],
  ];
  const cy = base - 3 * h - 3;
  const r = 22;
  const gold = (y0: number, y1: number, stops: [number, string][]) => {
    if (mono) return '#ffffff';
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    for (const [o, c] of stops) g.addColorStop(o, c);
    return g;
  };
  // sun (cut by the temple with a clear gap)
  ctx.save();
  const clip = new Path2D();
  clip.rect(0, 0, 100, 100);
  for (const [x, y, w] of steps) clip.rect(x - gap, y - gap, w + 2 * gap, h + 2 * gap);
  ctx.clip(clip, 'evenodd');
  ctx.fillStyle = gold(cy - r, cy + r, [
    [0, '#fff1b8'],
    [0.5, '#ffc24a'],
    [1, '#e0781a'],
  ]);
  ctx.beginPath();
  ctx.arc(50, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // rays
  ctx.lineCap = 'round';
  ctx.lineWidth = 6.5;
  ctx.strokeStyle = gold(cy - r - 17, cy, [
    [0, '#fff1b8'],
    [1, '#ffb43a'],
  ]);
  for (const a of [-90, -50, -130, -15, -165]) {
    const t = (a * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(50 + Math.cos(t) * (r + 7.5), cy + Math.sin(t) * (r + 7.5));
    ctx.lineTo(50 + Math.cos(t) * (r + 17), cy + Math.sin(t) * (r + 17));
    ctx.stroke();
  }
  // temple
  ctx.fillStyle = gold(base - 3 * h, base, [
    [0, '#fff3cf'],
    [0.6, '#e9c77a'],
    [1, '#b88a3a'],
  ]);
  for (const [x, y, w] of steps) ctx.fillRect(x, y, w, h + 0.5);
}

export function drawStudioMark(size = 256, mono = false): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.scale(size / 100, size / 100);
  mark(ctx, mono);
  return cv;
}

function words(ctx: Ctx, x: number, y1: number, y2: number, big: number, align: CanvasTextAlign, theme: 'dark' | 'light') {
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = theme === 'dark' ? '#ffffff' : '#16110a';
  ctx.font = `800 ${big}px Outfit, "Alegreya Sans", sans-serif`;
  (ctx as any).letterSpacing = `${-big * 0.01}px`;
  ctx.fillText('SOLSTONE', x, y1);
  const small = big * 0.3;
  ctx.font = `600 ${small}px Outfit, "Alegreya Sans", sans-serif`;
  (ctx as any).letterSpacing = `${small * 0.62}px`;
  ctx.fillStyle = theme === 'dark' ? 'rgba(255,255,255,0.78)' : '#5a4a2a';
  // letter spacing adds space after the last letter – shift centred text back by half of it
  ctx.fillText('GAMES', x + (align === 'center' ? small * 0.31 : 3), y2);
}

/** sign + wordmark. theme 'dark' = for dark backgrounds, 'light' = dark text */
export function drawStudioLogo(layout: 'row' | 'stack' = 'row', theme: 'dark' | 'light' = 'dark', height = 256): HTMLCanvasElement {
  const k = height / 256;
  const W = layout === 'row' ? 1000 : 720;
  const H = layout === 'row' ? 256 : 470;
  const cv = document.createElement('canvas');
  cv.width = Math.round(W * k);
  cv.height = Math.round(H * k);
  const ctx = cv.getContext('2d')!;
  ctx.scale(k, k);
  ctx.save();
  if (layout === 'row') {
    ctx.translate(0, 18);
    ctx.scale(2.2, 2.2);
  } else {
    ctx.translate(W / 2 - 115, 0);
    ctx.scale(2.3, 2.3);
  }
  mark(ctx);
  ctx.restore();
  if (layout === 'row') words(ctx, 260, 150, 204, 132, 'left', theme);
  else words(ctx, W / 2, 360, 424, 132, 'center', theme);
  return cv;
}

/** wordmark alone (no sign) for the studio splash */
export function drawStudioWordmark(height = 160): HTMLCanvasElement {
  const k = height / 160;
  const W = 820;
  const cv = document.createElement('canvas');
  cv.width = Math.round(W * k);
  cv.height = Math.round(160 * k);
  const ctx = cv.getContext('2d')!;
  ctx.scale(k, k);
  words(ctx, W / 2, 100, 150, 112, 'center', 'dark');
  return cv;
}
