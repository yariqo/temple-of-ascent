/**
 * Painting toolkit for the symbols: materials, bevels, inner shadows, texture and highlights.
 * Everything works on Path2D shapes so the same shape can be filled, bevelled, textured and
 * outlined without re-building it.
 * Light always comes from the top left.
 */

export type Ctx = CanvasRenderingContext2D;
export type Stops = [number, string][];

export function lg(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: Stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}
export function rg(ctx: Ctx, x: number, y: number, r0: number, r1: number, stops: Stops, fx = x, fy = y) {
  const g = ctx.createRadialGradient(fx, fy, r0, x, y, r1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

// ------------------------------------------------------------------ materials (top → bottom)
export const MAT: Record<string, Stops> = {
  gold: [
    [0, '#fff8d6'],
    [0.18, '#ffe07a'],
    [0.45, '#e9a92c'],
    [0.62, '#b8700f'],
    [0.8, '#dc9a26'],
    [1, '#7a4506'],
  ],
  goldDeep: [
    [0, '#ffe48a'],
    [0.4, '#d18e1c'],
    [1, '#6a3a04'],
  ],
  jade: [
    [0, '#c9ffe9'],
    [0.25, '#56e0b0'],
    [0.6, '#15946d'],
    [1, '#053d2c'],
  ],
  turquoise: [
    [0, '#d8ffff'],
    [0.3, '#4fdbe6'],
    [0.7, '#138aa6'],
    [1, '#063a52'],
  ],
  obsidian: [
    [0, '#6d6880'],
    [0.3, '#2c2838'],
    [0.7, '#141219'],
    [1, '#050407'],
  ],
  crimson: [
    [0, '#ff9a86'],
    [0.35, '#d9372c'],
    [0.75, '#8c1410'],
    [1, '#4a0806'],
  ],
  stone: [
    [0, '#d8cdb4'],
    [0.35, '#a89a80'],
    [0.75, '#6e6250'],
    [1, '#3e362b'],
  ],
  bronze: [
    [0, '#ffd2a6'],
    [0.3, '#d9894a'],
    [0.65, '#9a4f1c'],
    [1, '#4a2208'],
  ],
  ice: [
    [0, '#ffffff'],
    [0.3, '#bdefff'],
    [0.62, '#4fb6e8'],
    [1, '#123e70'],
  ],
};

export const INK = '#1c0e03';

// ------------------------------------------------------------------ texture
let NOISE: HTMLCanvasElement | null = null;
/** soft value-noise tile (grain + mottling) used as a material texture */
function noiseTile(): HTMLCanvasElement {
  if (NOISE) return NOISE;
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d')!;
  const img = x.createImageData(S, S);
  // coarse grid, bilinear up-sampled + fine grain
  const G = 8;
  const grid: number[] = Array.from({ length: (G + 1) * (G + 1) }, () => Math.random());
  const at = (i: number, j: number) => grid[(j % G) * (G + 1) + (i % G)];
  for (let y = 0; y < S; y++)
    for (let xx = 0; xx < S; xx++) {
      const gx = (xx / S) * G;
      const gy = (y / S) * G;
      const i = Math.floor(gx);
      const j = Math.floor(gy);
      const fx = gx - i;
      const fy = gy - j;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const v = (at(i, j) * (1 - sx) + at(i + 1, j) * sx) * (1 - sy) + (at(i, j + 1) * (1 - sx) + at(i + 1, j + 1) * sx) * sy;
      const n = Math.max(0, Math.min(255, (v * 0.6 + Math.random() * 0.4) * 255));
      const k = (y * S + xx) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = n;
      img.data[k + 3] = 255;
    }
  x.putImageData(img, 0, 0);
  NOISE = c;
  return c;
}
/** overlay grain / mottling inside the shape */
export function texture(ctx: Ctx, p: Path2D, alpha = 0.18, mode: GlobalCompositeOperation = 'overlay') {
  ctx.save();
  ctx.clip(p);
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = mode;
  ctx.fillStyle = ctx.createPattern(noiseTile(), 'repeat')!;
  ctx.fillRect(-100, -100, 1200, 1200);
  ctx.restore();
}

// ------------------------------------------------------------------ shading
const BIG = (() => {
  const p = new Path2D();
  p.rect(-2000, -2000, 4256, 4256);
  return p;
})();
function inverse(p: Path2D): Path2D {
  const q = new Path2D();
  q.addPath(BIG);
  q.addPath(p);
  return q;
}
/**
 * Inner shadow along the edges of a shape: offset (dx,dy) decides which side gets dark.
 * dx,dy > 0 darkens the TOP-LEFT inner edge, < 0 the BOTTOM-RIGHT one.
 */
export function innerShadow(ctx: Ctx, p: Path2D, color: string, blur: number, dx: number, dy: number) {
  ctx.save();
  ctx.clip(p);
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = dx;
  ctx.shadowOffsetY = dy;
  ctx.fillStyle = '#000';
  ctx.fill(inverse(p), 'evenodd');
  ctx.restore();
}
/** raised (embossed) look: bright top-left rim, dark bottom-right rim */
export function bevel(ctx: Ctx, p: Path2D, size = 6, hi = 'rgba(255,255,240,0.75)', lo = 'rgba(0,0,0,0.55)') {
  innerShadow(ctx, p, lo, size * 1.6, -size, -size);
  innerShadow(ctx, p, hi, size * 1.2, size * 0.7, size * 0.7);
}
/** engraved (carved-in) look: dark top-left rim, light bottom-right rim */
export function engrave(ctx: Ctx, p: Path2D, size = 4, dark = 'rgba(0,0,0,0.7)', light = 'rgba(255,255,255,0.35)') {
  innerShadow(ctx, p, dark, size * 1.4, size, size);
  innerShadow(ctx, p, light, size, -size * 0.6, -size * 0.6);
}
/** soft glossy highlight */
export function gloss(ctx: Ctx, x: number, y: number, rx: number, ry: number, a = 0.6, rot = -0.5, clip?: Path2D) {
  ctx.save();
  if (clip) ctx.clip(clip);
  ctx.globalCompositeOperation = 'screen';
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(rx, ry);
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fillStyle = rg(ctx, 0, 0, 0, 1, [
    [0, `rgba(255,255,255,${a})`],
    [0.5, `rgba(255,255,255,${a * 0.35})`],
    [1, 'rgba(255,255,255,0)'],
  ]);
  ctx.fill();
  ctx.restore();
}
/** four-point sparkle */
export function sparkle(ctx: Ctx, x: number, y: number, r: number, a = 0.95) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rg(ctx, x, y, 0, r * 0.9, [
    [0, `rgba(255,255,255,${a * 0.8})`],
    [1, 'rgba(255,255,255,0)'],
  ]);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${a})`;
  const w = r * 0.13;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + w, y - w, x + r, y);
  ctx.quadraticCurveTo(x + w, y + w, x, y + r);
  ctx.quadraticCurveTo(x - w, y + w, x - r, y);
  ctx.quadraticCurveTo(x - w, y - w, x, y - r);
  ctx.fill();
  ctx.restore();
}
export function dropShadow(ctx: Ctx, blur = 14, oy = 8, a = 0.6) {
  ctx.shadowColor = `rgba(0,0,0,${a})`;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = oy;
}
export function noShadow(ctx: Ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * Paint a solid object: drop shadow, material gradient, texture, bevel, outline.
 * y0/y1 = vertical extent of the gradient.
 */
export function solid(
  ctx: Ctx,
  p: Path2D,
  mat: Stops | string | CanvasGradient,
  o: { y0?: number; y1?: number; x0?: number; x1?: number; shadow?: number; bevel?: number; tex?: number; line?: number; ink?: string; hi?: string; lo?: string } = {},
) {
  const fill = typeof mat === 'string' || mat instanceof CanvasGradient ? mat : lg(ctx, o.x0 ?? 0, o.y0 ?? 0, o.x1 ?? 0, o.y1 ?? 256, mat);
  if (o.shadow) {
    ctx.save();
    dropShadow(ctx, o.shadow, o.shadow * 0.55, 0.6);
    ctx.fillStyle = fill;
    ctx.fill(p);
    ctx.restore();
  } else {
    ctx.fillStyle = fill;
    ctx.fill(p);
  }
  if (o.tex !== 0) texture(ctx, p, o.tex ?? 0.16);
  if (o.bevel !== 0) bevel(ctx, p, o.bevel ?? 5, o.hi, o.lo);
  if (o.line !== 0) {
    ctx.lineWidth = o.line ?? 4;
    ctx.strokeStyle = o.ink ?? INK;
    ctx.stroke(p);
  }
}

// ------------------------------------------------------------------ shapes
export function path(pts: [number, number][]): Path2D {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
}
export function circle(x: number, y: number, r: number): Path2D {
  const p = new Path2D();
  p.arc(x, y, r, 0, Math.PI * 2);
  return p;
}
export function oval(x: number, y: number, rx: number, ry: number, rot = 0): Path2D {
  const p = new Path2D();
  p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  return p;
}
export function rrect(x: number, y: number, w: number, h: number, r: number): Path2D {
  const p = new Path2D();
  p.roundRect(x, y, w, h, r);
  return p;
}
/** smooth closed shape through points (Catmull-Rom → bezier) */
export function blob(pts: [number, number][], tension = 0.5): Path2D {
  const p = new Path2D();
  const n = pts.length;
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const t = tension / 3;
    p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t, p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t, p2[0], p2[1]);
  }
  p.closePath();
  return p;
}
/** open smooth curve through points */
export function curve(pts: [number, number][], tension = 0.5): Path2D {
  const p = new Path2D();
  const n = pts.length;
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    const t = tension / 3;
    p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t, p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t, p2[0], p2[1]);
  }
  return p;
}
