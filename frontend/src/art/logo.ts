/**
 * Game logo "BALAM" – drawn once on a canvas (gold letters with a carved 3D edge,
 * sun rays behind and jaguar medallions on both sides).
 */
import { drawMascotHead, MASCOT_GEO } from './mascot';
import { lin, makeCanvas, rad } from './draw';

type Ctx = CanvasRenderingContext2D;

/* ------------------------------------------------------------------ custom lettering
 * Hand-built letters instead of a font: blocky Mesoamerican glyph shapes on a 12-unit grid,
 * with chamfered (chiselled) corners and a stepped notch on the stems – they read as carved stone.
 */
type Pt = [number, number];
const GLYPHS: Record<string, { w: number; outer: Pt[]; holes?: Pt[][] }> = {
  A: { w: 11, outer: [[0, 12], [0, 3], [3, 0], [8, 0], [11, 3], [11, 12], [7.8, 12], [7.8, 8.6], [3.2, 8.6], [3.2, 12]], holes: [[[3.2, 5.9], [7.8, 5.9], [7.8, 4.1], [6.7, 3], [4.3, 3], [3.2, 4.1]]] },
  B: { w: 10.6, outer: [[0, 0], [8, 0], [10, 2], [10, 4.4], [8.8, 5.8], [10.6, 7.4], [10.6, 10], [8.6, 12], [0, 12]], holes: [[[3.2, 2.9], [6.5, 2.9], [6.9, 3.3], [6.9, 4.4], [6.5, 4.8], [3.2, 4.8]], [[3.2, 7.2], [7, 7.2], [7.4, 7.6], [7.4, 8.8], [7, 9.2], [3.2, 9.2]]] },
  L: { w: 8.8, outer: [[0, 0], [3.2, 0], [3.2, 8.8], [8.8, 8.8], [8.8, 12], [0, 12]] },
  M: { w: 13.4, outer: [[0, 12], [0, 0], [3.6, 0], [6.7, 4.2], [9.8, 0], [13.4, 0], [13.4, 12], [10.2, 12], [10.2, 5.2], [6.7, 9.6], [3.2, 5.2], [3.2, 12]] },
  R: { w: 10.6, outer: [[0, 0], [8, 0], [10.4, 2.4], [10.4, 5.2], [8.7, 6.9], [10.6, 12], [7.2, 12], [5.6, 7.5], [3.2, 7.5], [3.2, 12], [0, 12]], holes: [[[3.2, 2.9], [6.8, 2.9], [7.2, 3.3], [7.2, 4.4], [6.8, 4.8], [3.2, 4.8]]] },
  I: { w: 3.2, outer: [[0, 0], [3.2, 0], [3.2, 12], [0, 12]] },
  S: { w: 10, outer: [[1.8, 0], [10, 0], [10, 2.9], [3.2, 2.9], [3.2, 4.6], [8.2, 4.6], [10, 6.4], [10, 10.2], [8.2, 12], [0, 12], [0, 9.1], [6.8, 9.1], [6.8, 7.4], [1.8, 7.4], [0, 5.6], [0, 1.8]] },
  N: { w: 11, outer: [[0, 0], [3.2, 0], [7.8, 6.6], [7.8, 0], [11, 0], [11, 12], [7.8, 12], [3.2, 5.4], [3.2, 12], [0, 12]] },
  G: { w: 10.6, outer: [[1.8, 0], [10.6, 0], [10.6, 2.9], [3.2, 2.9], [3.2, 9.1], [7.4, 9.1], [7.4, 7.7], [5.4, 7.7], [5.4, 5], [10.6, 5], [10.6, 10.2], [8.8, 12], [1.8, 12], [0, 10.2], [0, 1.8]] },
};
/** cut every corner by c units (chisel look) */
function chamfer(pts: Pt[], c: number): Pt[] {
  const out: Pt[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const a = pts[(i + n - 1) % n];
    const b = pts[(i + 1) % n];
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]);
    const lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const ca = Math.min(c, la / 3);
    const cb = Math.min(c, lb / 3);
    out.push([p[0] + ((a[0] - p[0]) / la) * ca, p[1] + ((a[1] - p[1]) / la) * ca]);
    out.push([p[0] + ((b[0] - p[0]) / lb) * cb, p[1] + ((b[1] - p[1]) / lb) * cb]);
  }
  return out;
}
/** letters of `text` as one path; returns the path and its width in px */
function lettering(text: string, u: number, gap: number): { path: Path2D; width: number; marks: Pt[] } {
  let w = 0;
  for (const ch of text) w += (GLYPHS[ch]?.w ?? 6) + gap;
  w -= gap;
  const path = new Path2D();
  const marks: Pt[] = [];
  let x = -w / 2;
  for (const ch of text) {
    const g = GLYPHS[ch];
    if (!g) {
      x += 6 + gap;
      continue;
    }
    const add = (pts: Pt[], c: number) => {
      const q = chamfer(pts, c);
      path.moveTo((x + q[0][0]) * u, q[0][1] * u);
      for (const [px, py] of q.slice(1)) path.lineTo((x + px) * u, py * u);
      path.closePath();
    };
    add(g.outer, 0.55);
    for (const h of g.holes ?? []) add(h, 0.35);
    // carved mark on the left stem of every letter (small stepped notch), not on I
    if (ch !== 'I' && ch !== 'S' && ch !== 'G') marks.push([(x + 1.6) * u, 10.3 * u]);
    x += g.w + gap;
  }
  return { path, width: w * u, marks };
}

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
  const s = (r * 1.5) / 240; // head drawing is ~240 wide inside its canvas
  ctx.translate(x, y + r * 0.12);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(head, -H.ax * s, -H.ay * s, H.w * s, H.h * s);
  ctx.restore();
  ctx.restore();
}

/** second word: carved jade plaque with gold letters, hanging under the main word */
function subtitle(ctx: Ctx, cx: number, cy: number, text: string) {
  ctx.save();
  const SU = 5.2;
  const SL = lettering(text, SU, 2.6);
  const tw = SL.width;
  const hw = tw / 2 + 70;
  const h = 44;
  // plaque with stepped (Aztec) ends
  const plaque = () => {
    ctx.beginPath();
    ctx.moveTo(cx - hw, cy - h);
    ctx.lineTo(cx + hw, cy - h);
    ctx.lineTo(cx + hw, cy - h / 2);
    ctx.lineTo(cx + hw + 22, cy - h / 2);
    ctx.lineTo(cx + hw + 22, cy + h / 2);
    ctx.lineTo(cx + hw, cy + h / 2);
    ctx.lineTo(cx + hw, cy + h);
    ctx.lineTo(cx - hw, cy + h);
    ctx.lineTo(cx - hw, cy + h / 2);
    ctx.lineTo(cx - hw - 22, cy + h / 2);
    ctx.lineTo(cx - hw - 22, cy - h / 2);
    ctx.lineTo(cx - hw, cy - h / 2);
    ctx.closePath();
  };
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;
  plaque();
  ctx.fillStyle = lin(ctx, 0, cy - h, 0, cy + h, [
    [0, '#3fe0b8'],
    [0.45, '#118a70'],
    [1, '#053d31'],
  ]);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#140a02';
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = lin(ctx, 0, cy - h, 0, cy + h, [
    [0, '#fff3b8'],
    [0.5, '#d9a030'],
    [1, '#8a5a10'],
  ]);
  plaque();
  ctx.stroke();
  // little carved step marks on the plaque
  ctx.fillStyle = 'rgba(0,40,30,0.45)';
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 3; i++) ctx.fillRect(cx + sx * (hw - 28 - i * 14) - 4, cy - 8 + (i % 2) * 8, 8, 8);
  }
  // letters: dark edge + gold body (same hand-built lettering as the main word)
  const sy = cy - 6 * SU + 2;
  ctx.setTransform(1, 0, 0, 1, cx, sy + 4);
  ctx.fillStyle = '#0d0601';
  ctx.fill(SL.path, 'evenodd');
  ctx.setTransform(1, 0, 0, 1, cx, sy);
  ctx.lineJoin = 'miter';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#140a02';
  ctx.stroke(SL.path);
  ctx.fillStyle = lin(ctx, 0, 0, 0, 12 * SU, [
    [0, '#fffbe0'],
    [0.45, '#ffd35a'],
    [0.55, '#c8861a'],
    [1, '#ffe39a'],
  ]);
  ctx.fill(SL.path, 'evenodd');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.restore();
}

export function drawLogo(text = 'BALAM', sub = 'RISING'): HTMLCanvasElement {
  const W = 1500;
  const Hh = sub ? 380 : 320;
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

  // hand-built lettering (see GLYPHS)
  const U = 17.5;
  const L = lettering(text, U, 1.35);
  const top = base - 12 * U;
  const at = (dy = 0) => {
    ctx.setTransform(1, 0, 0, 1, cx, top + dy);
  };
  // carved 3D edge (extrusion)
  for (let i = 16; i >= 1; i--) {
    at(i);
    ctx.fillStyle = i > 12 ? '#0d0601' : `rgb(${60 - i * 2},${32 - i},${6})`;
    ctx.fill(L.path, 'evenodd');
  }
  at();
  ctx.lineJoin = 'miter';
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#140a02';
  ctx.stroke(L.path);
  ctx.fillStyle = lin(ctx, 0, 0, 0, 12 * U, [
    [0, '#fff6d2'],
    [0.3, '#ffd970'],
    [0.52, '#e0a032'],
    [0.53, '#a8680e'],
    [0.78, '#d69420'],
    [1, '#f7d27a'],
  ]);
  ctx.fill(L.path, 'evenodd');
  // chisel light: bright top-left edge, dark bottom-right edge (inside the letters only)
  ctx.save();
  ctx.clip(L.path, 'evenodd');
  ctx.translate(2.5, 2.5);
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(255,250,225,0.9)';
  ctx.stroke(L.path);
  ctx.translate(-5, -5);
  ctx.strokeStyle = 'rgba(90,48,4,0.8)';
  ctx.stroke(L.path);
  ctx.restore();
  // stone grain on the gold (very subtle, keeps it from looking like a plastic gradient)
  ctx.save();
  ctx.clip(L.path, 'evenodd');
  for (let i = 0; i < 900; i++) {
    const gx = -L.width / 2 + ((i * 97.13) % L.width);
    const gy = (i * 53.7) % (12 * U);
    ctx.fillStyle = i % 3 ? 'rgba(120,70,10,0.10)' : 'rgba(255,245,210,0.12)';
    ctx.fillRect(gx, gy, 2 + (i % 4), 1.5);
  }
  // carved step marks: a tiny stepped pyramid engraved into each stem
  for (const [mx, my] of L.marks) {
    const steps: [number, number][] = [[-11, 5], [-7, 0], [-3, -5]];
    for (const [hx, dy] of steps) {
      ctx.fillStyle = 'rgba(70,36,2,0.8)';
      ctx.fillRect(mx + hx, my + dy - 4, -hx * 2, 5);
      ctx.fillStyle = 'rgba(255,240,190,0.5)';
      ctx.fillRect(mx + hx, my + dy + 1, -hx * 2, 1.5);
    }
  }
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // jade gems at the ends
  const tw = L.width;
  const head = drawMascotHead('open');
  medallion(ctx, cx - tw / 2 - 100, 164, 92, head, false);
  medallion(ctx, cx + tw / 2 + 100, 164, 92, head, true);
  if (sub) subtitle(ctx, cx, 318, sub);
  return c;
}
