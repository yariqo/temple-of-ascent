/**
 * "Balam" – the temple jaguar that lies on top of the reel frame.
 * Drawn in parts so it can be animated: body (with fore paws), head (several faces), tail.
 * All drawing is procedural Canvas2D (no image files).
 */
import { lin, makeCanvas, rad } from './draw';
import { MAT, bevel, gloss, solid, sparkle, texture } from './kit';

type Ctx = CanvasRenderingContext2D;

/** the mascot is painted at 2× resolution; the game creates its textures with resolution 2 */
export const MASCOT_RES = 2;
function canvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const [c, ctx] = makeCanvas(w * MASCOT_RES, h * MASCOT_RES);
  ctx.scale(MASCOT_RES, MASCOT_RES);
  return [c, ctx];
}

/** Geometry shared with the animation code (src/mascot.ts). Body canvas coordinates. */
export const MASCOT_GEO = {
  bodyW: 480,
  bodyH: 200,
  belly: 160, // y of the line the jaguar lies on
  head: { w: 300, h: 330, ax: 150, ay: 216, x: 102, y: 74 }, // head canvas size, anchor, position on the body
  tail: { w: 120, h: 250, ax: 26, ay: 14, x: 436, y: 136 },
  right: 462, // right end of the body
};

const INK = '#2b1606';
const SPOT = '#23110a';
const CREAM = '#fbecc9';

/** tiny deterministic random so the pattern is always the same */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** jaguar rosette: broken black ring around a darker golden centre (sometimes with a dot) */
function rosette(ctx: Ctx, x: number, y: number, r: number, rnd: () => number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rnd() * Math.PI);
  ctx.scale(1, 0.78 + rnd() * 0.2);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(176,92,14,0.55)';
  ctx.fill();
  const n = 4 + Math.floor(rnd() * 3);
  ctx.strokeStyle = SPOT;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2 + rnd() * 0.3;
    const a1 = a0 + ((Math.PI * 2) / n) * (0.45 + rnd() * 0.3);
    ctx.beginPath();
    ctx.arc(0, 0, r, a0, a1);
    ctx.lineWidth = r * (0.34 + rnd() * 0.18);
    ctx.stroke();
  }
  if (rnd() < 0.5) {
    ctx.beginPath();
    ctx.arc((rnd() - 0.5) * r * 0.4, (rnd() - 0.5) * r * 0.4, r * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = SPOT;
    ctx.fill();
  }
  ctx.restore();
}

function dot(ctx: Ctx, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.85, 0.4, 0, Math.PI * 2);
  ctx.fillStyle = SPOT;
  ctx.fill();
}

// ------------------------------------------------------------------ body
function bodyP(): Path2D {
  const ctx = new Path2D();
  ctx.moveTo(96, 160);
  ctx.bezierCurveTo(88, 120, 104, 84, 140, 66); // chest -> neck
  ctx.bezierCurveTo(168, 52, 196, 56, 214, 64); // shoulder blade
  ctx.bezierCurveTo(262, 80, 316, 74, 356, 58); // back
  ctx.bezierCurveTo(398, 42, 440, 56, 456, 92); // hip
  ctx.bezierCurveTo(466, 116, 464, 146, 452, 160); // rump
  ctx.closePath();
  return ctx;
}


function drawPaw(ctx: Ctx, x: number, top: number, bottom: number, w: number) {
  // fore leg hanging over the frame edge
  const PP = new Path2D();
  PP.moveTo(x - w / 2, top);
  PP.bezierCurveTo(x - w / 2 - 2, top + 20, x - w / 2 - 4, bottom - 18, x - w / 2 - 3, bottom - 10);
  PP.quadraticCurveTo(x, bottom + 8, x + w / 2 + 3, bottom - 10);
  PP.bezierCurveTo(x + w / 2 + 4, bottom - 18, x + w / 2 + 2, top + 20, x + w / 2, top);
  PP.closePath();
  ctx.fillStyle = lin(ctx, x - w / 2, 0, x + w / 2, 0, [
    [0, '#b8680f'],
    [0.4, '#f6b650'],
    [1, '#c97a1c'],
  ]);
  ctx.fill(PP);
  // paw tip lighter + spots
  ctx.save();
  ctx.clip(PP);
  ctx.fillStyle = 'rgba(255,236,200,0.8)';
  ctx.beginPath();
  ctx.ellipse(x, bottom - 4, w * 0.6, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  const r = rng(Math.round(x));
  for (let i = 0; i < 5; i++) dot(ctx, x - w * 0.3 + r() * w * 0.6, top + 8 + r() * (bottom - top - 30), 2.2 + r() * 2);
  ctx.restore();
  texture(ctx, PP, 0.2);
  bevel(ctx, PP, 3, 'rgba(255,240,200,0.55)', 'rgba(60,25,0,0.5)');
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke(PP);
  // toes
  ctx.strokeStyle = 'rgba(60,28,4,0.8)';
  ctx.lineWidth = 2;
  for (const dx of [-w * 0.2, 0, w * 0.2]) {
    ctx.beginPath();
    ctx.moveTo(x + dx, bottom - 12);
    ctx.lineTo(x + dx, bottom - 2);
    ctx.stroke();
  }
  // small claws
  ctx.fillStyle = '#fff6e6';
  for (const dx of [-w * 0.3, -w * 0.1, w * 0.1, w * 0.3]) {
    ctx.beginPath();
    ctx.moveTo(x + dx - 2, bottom);
    ctx.lineTo(x + dx + 2, bottom);
    ctx.lineTo(x + dx, bottom + 5);
    ctx.fill();
  }
}

export function drawMascotBody(): HTMLCanvasElement {
  const G = MASCOT_GEO;
  const [c, ctx] = canvas(G.bodyW, G.bodyH);
  const BP = bodyP();

  // soft contact shadow on the frame
  ctx.beginPath();
  ctx.ellipse(280, 162, 196, 11, 0, 0, Math.PI * 2);
  ctx.fillStyle = rad(ctx, 280, 162, 10, 196, [
    [0, 'rgba(0,0,0,0.5)'],
    [1, 'rgba(0,0,0,0)'],
  ]);
  ctx.fill();

  // hind leg (far side, in shadow)
  const far = new Path2D();
  far.ellipse(392, 128, 58, 36, -0.15, 0, Math.PI * 2);
  ctx.fillStyle = lin(ctx, 0, 92, 0, 164, [
    [0, '#a85e12'],
    [1, '#5a2e06'],
  ]);
  ctx.fill(far);

  // body: warm fur gradient
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = lin(ctx, 0, 44, 0, 160, [
    [0, '#f6b650'],
    [0.3, '#f0a53a'],
    [0.65, '#e0902a'],
    [1, '#c47418'],
  ]);
  ctx.fill(BP);
  ctx.restore();

  ctx.save();
  ctx.clip(BP);
  // belly (cream) along the bottom
  ctx.beginPath();
  ctx.moveTo(90, 170);
  ctx.bezierCurveTo(160, 128, 330, 130, 470, 150);
  ctx.lineTo(470, 175);
  ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, 128, 0, 165, [
    [0, 'rgba(251,236,201,0)'],
    [0.45, 'rgba(251,236,201,0.85)'],
    [1, CREAM],
  ]);
  ctx.fill();
  // volume: shade under the flank, rim light along the back
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = lin(ctx, 0, 60, 0, 160, [
    [0, 'rgba(255,255,255,1)'],
    [0.55, 'rgba(240,215,180,1)'],
    [1, 'rgba(170,120,80,1)'],
  ]);
  ctx.fillRect(0, 0, 480, 200);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = lin(ctx, 0, 46, 0, 84, [
    [0, 'rgba(255,240,195,0.7)'],
    [1, 'rgba(255,240,195,0)'],
  ]);
  ctx.fillRect(80, 40, 400, 50);
  // thigh and shoulder muscles (light + crease)
  ctx.beginPath();
  ctx.ellipse(398, 116, 52, 40, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = rad(ctx, 388, 98, 4, 62, [
    [0, 'rgba(255,220,150,0.6)'],
    [1, 'rgba(160,80,10,0)'],
  ]);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(398, 122, 50, 36, -0.3, Math.PI * 0.95, Math.PI * 1.9);
  ctx.strokeStyle = 'rgba(110,52,6,0.55)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(178, 98, 46, 40, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = rad(ctx, 170, 84, 4, 50, [
    [0, 'rgba(255,220,150,0.5)'],
    [1, 'rgba(160,80,10,0)'],
  ]);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(176, 104, 44, 38, 0.2, Math.PI * 1.05, Math.PI * 1.85);
  ctx.strokeStyle = 'rgba(110,52,6,0.45)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // rosettes – big on the flank, smaller towards belly and legs
  const r = rng(11);
  const placed: [number, number, number][] = [];
  for (let tries = 0; tries < 900 && placed.length < 40; tries++) {
    const x = 150 + r() * 310;
    const y = 62 + r() * 86;
    const size = 6 + (1 - (y - 62) / 86) * 6 + r() * 2.5;
    if (placed.some(([px, py, ps]) => Math.hypot(px - x, py - y) < (ps + size) * 1.35)) continue;
    placed.push([x, y, size]);
  }
  for (const [x, y, size] of placed) {
    if (y > 134) dot(ctx, x, y, 2.4 + r() * 1.6);
    else rosette(ctx, x, y, size, r);
  }
  // spine line of small spots
  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    const x = 180 + t * 250;
    const y = 64 - Math.sin(t * Math.PI) * 6 + (t > 0.7 ? (t - 0.7) * 40 : 0);
    dot(ctx, x, y + 4, 2.6);
  }
  ctx.restore();
  // fur grain + soft bevel
  texture(ctx, BP, 0.22);
  bevel(ctx, BP, 5, 'rgba(255,240,200,0.55)', 'rgba(60,25,0,0.5)');
  fur(ctx, BP, 90, 470, 44, 1);

  // outline
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.stroke(BP);

  // fore paws draped over the frame edge (under the head)
  drawPaw(ctx, 70, 120, 188, 34);
  drawPaw(ctx, 146, 128, 192, 36);
  return c;
}

/** short hair strokes along the top edge of a shape (rim light) */
function fur(ctx: Ctx, clip: Path2D, x0: number, x1: number, yTop: number, seed: number) {
  const r = rng(seed * 97 + 13);
  ctx.save();
  ctx.clip(clip);
  ctx.strokeStyle = 'rgba(255,238,190,0.55)';
  ctx.lineWidth = 1.3;
  for (let x = x0; x < x1; x += 3) {
    // find the top of the shape at this x
    let y = yTop;
    while (y < yTop + 140 && !ctx.isPointInPath(clip, x * MASCOT_RES, y * MASCOT_RES)) y += 2;
    if (y >= yTop + 140) continue;
    const len = 5 + r() * 6;
    ctx.beginPath();
    ctx.moveTo(x, y + 2);
    ctx.lineTo(x + 2 + r() * 2, y + 2 + len);
    ctx.stroke();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ tail
export function drawMascotTail(): HTMLCanvasElement {
  const T = MASCOT_GEO.tail;
  const [c, ctx] = canvas(T.w, T.h);
  const pts: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    pts.push([T.ax + Math.sin(t * 2.6) * 34 + t * 30, T.ay + t * 216]);
  }
  const width = (t: number) => 20 - t * 8;
  // body of the tail as a tapered stroke (many segments)
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < pts.length - 1; i++) {
      const t = i / (pts.length - 1);
      ctx.beginPath();
      ctx.moveTo(pts[i][0], pts[i][1]);
      ctx.lineTo(pts[i + 1][0], pts[i + 1][1]);
      ctx.lineCap = 'round';
      ctx.lineWidth = width(t) + (pass === 0 ? 6 : 0);
      ctx.strokeStyle = pass === 0 ? INK : t > 0.93 ? SPOT : t > 0.6 ? (i % 4 < 2 ? SPOT : '#eeaa45') : '#eeaa45';
      ctx.stroke();
    }
  }
  // spots on the upper part
  const r = rng(5);
  for (let i = 3; i < 24; i += 3) {
    const [x, y] = pts[i];
    dot(ctx, x + (r() - 0.5) * 8, y, 3 + r() * 1.5);
  }
  // highlight
  ctx.beginPath();
  ctx.moveTo(pts[0][0] - 4, pts[0][1]);
  for (let i = 1; i < 22; i++) ctx.lineTo(pts[i][0] - 5, pts[i][1]);
  ctx.strokeStyle = 'rgba(255,236,190,0.35)';
  ctx.lineWidth = 3;
  ctx.stroke();
  return c;
}

// ------------------------------------------------------------------ head
export type Face = 'open' | 'closed' | 'happy' | 'roar';

function headP(cx: number, cy: number): Path2D {
  const ctx = new Path2D();
  ctx.moveTo(cx - 60, cy - 34);
  ctx.bezierCurveTo(cx - 46, cy - 90, cx + 46, cy - 90, cx + 60, cy - 34); // skull
  ctx.bezierCurveTo(cx + 80, cy - 10, cx + 90, cy + 14, cx + 74, cy + 30); // right cheek
  ctx.lineTo(cx + 80, cy + 34); // fur tuft
  ctx.lineTo(cx + 64, cy + 40);
  ctx.bezierCurveTo(cx + 48, cy + 70, cx + 24, cy + 82, cx, cy + 82); // jaw
  ctx.bezierCurveTo(cx - 24, cy + 82, cx - 48, cy + 70, cx - 64, cy + 40);
  ctx.lineTo(cx - 80, cy + 34);
  ctx.lineTo(cx - 72, cy + 30);
  ctx.bezierCurveTo(cx - 90, cy + 14, cx - 80, cy - 10, cx - 60, cy - 34);
  ctx.closePath();
  return ctx;
}

export function drawMascotHead(face: Face, glowEyes = false): HTMLCanvasElement {
  const H = MASCOT_GEO.head;
  const [c, ctx] = canvas(H.w, H.h);
  const cx = H.ax;
  const cy = H.ay;

  // quetzal feathers behind the head (right side)
  const feathers: [number, [number, string][]][] = [
    [-0.15, MAT.jade],
    [0.2, MAT.turquoise],
    [0.55, MAT.crimson],
  ];
  feathers.forEach(([rot, mat], i) => {
    ctx.save();
    ctx.translate(cx + 40, cy - 66);
    ctx.rotate(rot + 0.8);
    const f = new Path2D();
    f.moveTo(0, 0);
    f.bezierCurveTo(20, -26, 36, -66 - i * 6, 16, -98 - i * 8);
    f.bezierCurveTo(-6, -70, -16, -30, 0, 0);
    f.closePath();
    solid(ctx, f, mat, { y0: -100, y1: 0, bevel: 2.5, tex: 0.1, line: 2.5 });
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.quadraticCurveTo(12, -50, 14, -94 - i * 8);
    ctx.strokeStyle = '#ffd35a';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  });

  // ears (small and round, black backs, cream inside)
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(cx + sx * 48, cy - 62);
    ctx.rotate(sx * 0.35);
    const ear = new Path2D();
    ear.ellipse(0, 0, 19, 17, 0, 0, Math.PI * 2);
    solid(ctx, ear, [
      [0, '#f6b650'],
      [1, '#b8680f'],
    ], { y0: -17, y1: 17, bevel: 3, tex: 0.15, line: 3 });
    ctx.beginPath();
    ctx.ellipse(0, 3, 11, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#3a1c08';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 5, 7, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f3d9ad';
    ctx.fill();
    ctx.restore();
  }

  // head base
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  const HP = headP(cx, cy);
  ctx.fillStyle = rad(ctx, cx - 10, cy - 34, 8, 100, [
    [0, '#fbc868'],
    [0.55, '#eea03a'],
    [1, '#b8680f'],
  ]);
  ctx.fill(HP);
  ctx.restore();

  ctx.save();
  ctx.clip(HP);
  // cream areas: around the eyes, muzzle, chin
  ctx.fillStyle = CREAM;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + sx * 26, cy - 4, 22, 13, sx * -0.25, 0, Math.PI * 2);
    ctx.globalAlpha = 0.55;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.beginPath();
  ctx.ellipse(cx - 17, cy + 34, 23, 19, 0.15, 0, Math.PI * 2);
  ctx.ellipse(cx + 17, cy + 34, 23, 19, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, cy + 66, 30, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  // nose bridge highlight
  ctx.fillStyle = lin(ctx, 0, cy - 30, 0, cy + 16, [
    [0, 'rgba(255,226,160,0)'],
    [1, 'rgba(255,226,160,0.7)'],
  ]);
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy - 20);
  ctx.lineTo(cx + 12, cy - 20);
  ctx.lineTo(cx + 9, cy + 16);
  ctx.lineTo(cx - 9, cy + 16);
  ctx.fill();
  // forehead spots
  const r = rng(3);
  for (let i = 0; i < 34; i++) {
    const a = r() * Math.PI;
    const d = 26 + r() * 40;
    const x = cx + Math.cos(a) * d * 1.1 - 0;
    const y = cy - 30 - Math.sin(a) * d * 0.55;
    if (Math.abs(x - cx) < 10 && y > cy - 46) continue;
    dot(ctx, x, y, 1.6 + r() * 2.4);
  }
  // cheek rosettes
  for (const sx of [-1, 1]) {
    rosette(ctx, cx + sx * 58, cy + 4, 7, r);
    dot(ctx, cx + sx * 48, cy + 20, 3);
    dot(ctx, cx + sx * 62, cy + 22, 2.4);
  }
  // volume: darker cheeks and jaw sides
  ctx.globalCompositeOperation = 'multiply';
  for (const sx of [-1, 1]) {
    ctx.fillStyle = rad(ctx, cx + sx * 74, cy + 30, 4, 56, [
      [0, 'rgba(170,90,20,0.7)'],
      [1, 'rgba(170,90,20,0)'],
    ]);
    ctx.fillRect(cx - 120, cy - 120, 240, 240);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
  texture(ctx, HP, 0.2);
  bevel(ctx, HP, 5, 'rgba(255,240,200,0.6)', 'rgba(60,25,0,0.5)');
  fur(ctx, HP, cx - 70, cx + 70, cy - 100, 3);

  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.stroke(HP);

  // gold headband with jade stone
  const band = new Path2D();
  band.moveTo(cx - 58, cy - 46);
  band.quadraticCurveTo(cx, cy - 80, cx + 58, cy - 46);
  band.lineTo(cx + 56, cy - 54);
  band.quadraticCurveTo(cx, cy - 86, cx - 56, cy - 54);
  band.closePath();
  solid(ctx, band, MAT.gold, { y0: cy - 86, y1: cy - 46, bevel: 2, tex: 0.1, line: 2.5 });
  const gem = new Path2D();
  gem.moveTo(cx, cy - 80);
  gem.lineTo(cx + 11, cy - 66);
  gem.lineTo(cx, cy - 52);
  gem.lineTo(cx - 11, cy - 66);
  gem.closePath();
  solid(ctx, gem, MAT.jade, { y0: cy - 80, y1: cy - 52, bevel: 2, tex: 0, line: 2.5 });
  sparkle(ctx, cx - 4, cy - 72, 8);

  // eyes
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(cx + sx * 25, cy - 6);
    ctx.rotate(-sx * 0.22); // outer corners up: a cat's stare, not a sleepy look
    if (face === 'closed' || face === 'happy') {
      ctx.beginPath();
      if (face === 'closed') {
        ctx.moveTo(-14, -1);
        ctx.quadraticCurveTo(0, 6, 14, -1);
      } else {
        ctx.moveTo(-14, 3);
        ctx.quadraticCurveTo(0, -8, 14, 3);
      }
      ctx.strokeStyle = SPOT;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();
    } else {
      const h = face === 'roar' ? 6.5 : 9.5;
      ctx.beginPath();
      ctx.moveTo(-15, 1);
      ctx.quadraticCurveTo(-2, -h - 3, 15, -2);
      ctx.quadraticCurveTo(2, h + 2, -15, 1);
      ctx.closePath();
      ctx.fillStyle = rad(ctx, 0, 0, 1, 14, glowEyes
        ? [
            [0, '#ffffff'],
            [0.35, '#8ff7ff'],
            [1, '#1597b8'],
          ]
        : [
            [0, '#fbf6a0'],
            [0.45, '#d6c83c'],
            [1, '#7c8e1c'],
          ]);
      ctx.fill();
      // round jaguar pupil
      ctx.beginPath();
      ctx.arc(sx * 1.5, 0, face === 'roar' ? 3 : 4.6, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0604';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx * 1.5 - 2, -2.5, 1.9, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      gloss(ctx, -5, -3, 7, 2.5, 0.55, -0.2);
      // black liner
      ctx.beginPath();
      ctx.moveTo(-15, 1);
      ctx.quadraticCurveTo(-2, -h - 3, 15, -2);
      ctx.quadraticCurveTo(2, h + 2, -15, 1);
      ctx.strokeStyle = SPOT;
      ctx.lineWidth = 2.8;
      ctx.stroke();
      if (glowEyes) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fillStyle = rad(ctx, 0, 0, 2, 16, [
          [0, 'rgba(127,243,255,0.5)'],
          [1, 'rgba(127,243,255,0)'],
        ]);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    // brow (angry for the roar)
    ctx.beginPath();
    if (face === 'roar') {
      ctx.moveTo(-sx * 12 - 4, -12);
      ctx.lineTo(sx * 14, -16);
    } else if (face === 'open') {
      // brows angled down towards the nose
      ctx.moveTo(sx * 16, -18);
      ctx.lineTo(-sx * 13, -10);
    } else {
      ctx.moveTo(-14, -12);
      ctx.quadraticCurveTo(0, -17, 14, -13);
    }
    ctx.strokeStyle = 'rgba(40,18,4,0.8)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // tear line
    ctx.beginPath();
    ctx.moveTo(-sx * 12, 4);
    ctx.quadraticCurveTo(-sx * 16, 16, -sx * 12, 26);
    ctx.strokeStyle = SPOT;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  // nose
  ctx.beginPath();
  ctx.moveTo(cx - 13, cy + 12);
  ctx.quadraticCurveTo(cx, cy + 6, cx + 13, cy + 12);
  ctx.quadraticCurveTo(cx + 12, cy + 20, cx, cy + 27);
  ctx.quadraticCurveTo(cx - 12, cy + 20, cx - 13, cy + 12);
  ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, cy + 6, 0, cy + 27, [
    [0, '#d99583'],
    [1, '#8e4b3c'],
  ]);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  gloss(ctx, cx - 3, cy + 13, 7, 3, 0.7, 0);

  // whisker spots
  for (const sx of [-1, 1])
    for (const [dx, dy] of [
      [12, 32],
      [20, 30],
      [28, 34],
      [16, 40],
      [24, 42],
    ])
      dot(ctx, cx + sx * dx, cy + dy, 1.4);

  // mouth
  if (face === 'roar') {
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy + 38);
    ctx.quadraticCurveTo(cx, cy + 30, cx + 26, cy + 38);
    ctx.quadraticCurveTo(cx + 24, cy + 76, cx, cy + 80);
    ctx.quadraticCurveTo(cx - 24, cy + 76, cx - 26, cy + 38);
    ctx.closePath();
    ctx.fillStyle = rad(ctx, cx, cy + 60, 2, 30, [
      [0, '#7a1420'],
      [1, '#3a060c'],
    ]);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy + 70, 13, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#d9566a';
    ctx.fill();
    ctx.fillStyle = '#fffaf0';
    for (const sx of [-1, 1]) {
      // upper fangs
      ctx.beginPath();
      ctx.moveTo(cx + sx * 20, cy + 37);
      ctx.lineTo(cx + sx * 12, cy + 36);
      ctx.lineTo(cx + sx * 16, cy + 54);
      ctx.fill();
      // lower fangs
      ctx.beginPath();
      ctx.moveTo(cx + sx * 16, cy + 76);
      ctx.lineTo(cx + sx * 9, cy + 77);
      ctx.lineTo(cx + sx * 12, cy + 62);
      ctx.fill();
    }
    // wrinkles on the nose
    ctx.strokeStyle = 'rgba(60,26,4,0.7)';
    ctx.lineWidth = 2;
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + sx * 8, cy - 4);
      ctx.quadraticCurveTo(cx + sx * 14, cy + 2, cx + sx * 12, cy + 8);
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(cx, cy + 27);
    ctx.lineTo(cx, cy + 36);
    ctx.moveTo(cx - 18, cy + 40);
    ctx.quadraticCurveTo(cx - 8, cy + (face === 'happy' ? 50 : 44), cx, cy + 36);
    ctx.quadraticCurveTo(cx + 8, cy + (face === 'happy' ? 50 : 44), cx + 18, cy + 40);
    ctx.strokeStyle = SPOT;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.stroke();
    if (face === 'happy') {
      ctx.beginPath();
      ctx.ellipse(cx, cy + 47, 6, 4, 0, 0, Math.PI);
      ctx.fillStyle = '#d9566a';
      ctx.fill();
    }
  }

  // whiskers
  ctx.strokeStyle = 'rgba(255,250,235,0.85)';
  ctx.lineWidth = 1.3;
  for (const sx of [-1, 1])
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + sx * 26, cy + 34 + i * 4);
      ctx.quadraticCurveTo(cx + sx * 60, cy + 26 + i * 8, cx + sx * (92 - i * 4), cy + 30 + i * 12);
      ctx.stroke();
    }

  // jade & gold pendant on a collar below the chin
  ctx.beginPath();
  ctx.moveTo(cx - 46, cy + 66);
  ctx.quadraticCurveTo(cx, cy + 96, cx + 46, cy + 66);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.strokeStyle = '#e6b43a';
  ctx.lineWidth = 4;
  ctx.stroke();
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    const x = cx - 46 + 92 * t;
    const y = cy + 66 + Math.sin(t * Math.PI) * 15;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 ? '#1fae86' : '#ffd35a';
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  const pend = new Path2D();
  pend.arc(cx, cy + 92, 12, 0, Math.PI * 2);
  solid(ctx, pend, MAT.gold, { y0: cy + 80, y1: cy + 104, bevel: 2.5, tex: 0.1, line: 2.5 });
  const pj = new Path2D();
  pj.arc(cx, cy + 92, 6, 0, Math.PI * 2);
  solid(ctx, pj, MAT.jade, { y0: cy + 86, y1: cy + 98, bevel: 1.5, tex: 0, line: 1.5 });
  sparkle(ctx, cx - 3, cy + 89, 6);
  return c;
}
