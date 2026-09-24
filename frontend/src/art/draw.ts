/**
 * Procedural artwork for Temple of Ascent.
 * Everything is drawn with Canvas2D once at start-up and turned into Pixi textures,
 * so the game ships without image files and stays sharp on every screen.
 * Coordinates are in a 256×256 box ("u" = 1/256 of the size).
 */

export const SYM = 256;

type Ctx = CanvasRenderingContext2D;
type Stops = [number, string][];

export function makeCanvas(w: number, h = w): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  return [c, ctx];
}

export function lin(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: Stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}
export function rad(ctx: Ctx, x: number, y: number, r0: number, r1: number, stops: Stops, fx = x, fy = y) {
  const g = ctx.createRadialGradient(fx, fy, r0, x, y, r1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

export const GOLD: Stops = [
  [0, '#fff7cf'],
  [0.28, '#ffd65a'],
  [0.6, '#d0901c'],
  [1, '#7a4a07'],
];
const INK = '#241204';

function shadow(ctx: Ctx, blur = 14, oy = 7, a = 0.55) {
  ctx.shadowColor = `rgba(0,0,0,${a})`;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = oy;
}
function noShadow(ctx: Ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

function poly(ctx: Ctx, pts: [number, number][]) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
}

/** Aztec step-fret ring of little blocks around a circle. */
function stepRing(ctx: Ctx, cx: number, cy: number, r: number, n: number, size: number, color: string) {
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.rotate(a);
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.restore();
  }
}

/** Round medallion behind premium symbols: coloured stone disc with a gold rim. */
function medallion(ctx: Ctx, inner: string, outer: string) {
  const c = 128;
  shadow(ctx, 16, 8, 0.6);
  ctx.beginPath();
  ctx.arc(c, c, 112, 0, Math.PI * 2);
  ctx.fillStyle = lin(ctx, 0, 16, 0, 240, GOLD);
  ctx.fill();
  noShadow(ctx);
  ctx.beginPath();
  ctx.arc(c, c, 98, 0, Math.PI * 2);
  ctx.fillStyle = rad(ctx, c, c - 20, 10, 110, [
    [0, inner],
    [1, outer],
  ]);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(40,20,0,0.8)';
  ctx.stroke();
  stepRing(ctx, c, c, 105, 24, 7, 'rgba(90,50,5,0.75)');
  // subtle carved ring
  ctx.beginPath();
  ctx.arc(c, c, 88, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 3;
  ctx.stroke();
}

// ---------------------------------------------------------------- gems (L1–L5)

interface GemDef {
  pts: [number, number][]; // outline in -1..1
  light: string;
  mid: string;
  dark: string;
  table: number; // size of the top facet
}

const GEMS: Record<string, GemDef> = {
  // jade – hexagon
  L1: {
    pts: [
      [-0.5, -0.86],
      [0.5, -0.86],
      [1, 0],
      [0.5, 0.86],
      [-0.5, 0.86],
      [-1, 0],
    ],
    light: '#b8ffe0',
    mid: '#2fbf86',
    dark: '#0b4a33',
    table: 0.5,
  },
  // turquoise – tall diamond
  L2: {
    pts: [
      [0, -1.05],
      [0.78, 0],
      [0, 1.05],
      [-0.78, 0],
    ],
    light: '#c9fbff',
    mid: '#23b3cf',
    dark: '#0a3f57',
    table: 0.45,
  },
  // gold – octagon
  L3: {
    pts: Array.from({ length: 8 }, (_, i) => {
      const a = Math.PI / 8 + (i * Math.PI) / 4;
      return [Math.cos(a) * 0.98, Math.sin(a) * 0.98] as [number, number];
    }),
    light: '#fff3b0',
    mid: '#e3a52a',
    dark: '#6b3f06',
    table: 0.52,
  },
  // obsidian – shield
  L4: {
    pts: [
      [-0.85, -0.8],
      [0.85, -0.8],
      [0.85, 0.15],
      [0, 1.02],
      [-0.85, 0.15],
    ],
    light: '#d9d2ff',
    mid: '#5b4f8c',
    dark: '#15102a',
    table: 0.5,
  },
  // ruby – cushion square
  L5: {
    pts: [
      [-0.62, -0.9],
      [0.62, -0.9],
      [0.9, -0.62],
      [0.9, 0.62],
      [0.62, 0.9],
      [-0.62, 0.9],
      [-0.9, 0.62],
      [-0.9, -0.62],
    ],
    light: '#ffd0da',
    mid: '#e0354f',
    dark: '#520a19',
    table: 0.5,
  },
};

function drawGem(ctx: Ctx, g: GemDef) {
  const c = 128;
  const s = 86;
  const P = g.pts.map(([x, y]) => [c + x * s, c + y * s] as [number, number]);
  const T = g.pts.map(([x, y]) => [c + x * s * g.table, c - 8 + y * s * g.table] as [number, number]);
  // body
  shadow(ctx, 18, 9, 0.6);
  poly(ctx, P);
  ctx.fillStyle = rad(ctx, c - 20, c - 34, 6, 120, [
    [0, g.light],
    [0.45, g.mid],
    [1, g.dark],
  ]);
  ctx.fill();
  noShadow(ctx);
  // facets: alternate light/dark wedges between outline and table
  for (let i = 0; i < P.length; i++) {
    const j = (i + 1) % P.length;
    poly(ctx, [P[i], P[j], T[j], T[i]]);
    const midY = (P[i][1] + P[j][1]) / 2;
    const midX = (P[i][0] + P[j][0]) / 2;
    const lightSide = midY < c - 10 || midX < c - 20;
    ctx.fillStyle = lightSide ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.22)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  // table
  poly(ctx, T);
  ctx.fillStyle = lin(ctx, c - 40, c - 50, c + 40, c + 40, [
    [0, g.light],
    [1, g.mid],
  ]);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // outline
  poly(ctx, P);
  ctx.strokeStyle = 'rgba(20,8,0,0.85)';
  ctx.lineWidth = 5;
  ctx.stroke();
  // sparkle
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  star(ctx, c - 28, c - 38, 10, 3);
}

function star(ctx: Ctx, x: number, y: number, r: number, w: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + w * 0.3, y - w * 0.3, x + r, y);
  ctx.quadraticCurveTo(x + w * 0.3, y + w * 0.3, x, y + r);
  ctx.quadraticCurveTo(x - w * 0.3, y + w * 0.3, x - r, y);
  ctx.quadraticCurveTo(x - w * 0.3, y - w * 0.3, x, y - r);
  ctx.fill();
}

// ---------------------------------------------------------------- premium symbols

function drawJaguar(ctx: Ctx) {
  medallion(ctx, '#1f6b55', '#07261c');
  const c = 128;
  // feather crest
  const feathers = ['#e8423c', '#1fc1c9', '#f4c542', '#1fc1c9', '#e8423c'];
  feathers.forEach((col, i) => {
    const a = -Math.PI / 2 + (i - 2) * 0.32;
    ctx.save();
    ctx.translate(c, c + 10);
    ctx.rotate(a + Math.PI / 2);
    ellipse(ctx, 0, -92, 13, 34);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  });
  // ears
  for (const sx of [-1, 1]) {
    ellipse(ctx, c + sx * 52, c - 44, 22, 24, sx * 0.4);
    ctx.fillStyle = '#d98a18';
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.stroke();
    ellipse(ctx, c + sx * 52, c - 42, 11, 13, sx * 0.4);
    ctx.fillStyle = '#5a2a05';
    ctx.fill();
  }
  // head
  shadow(ctx, 8, 4, 0.5);
  ctx.beginPath();
  ctx.moveTo(c - 66, c - 30);
  ctx.quadraticCurveTo(c, c - 72, c + 66, c - 30);
  ctx.quadraticCurveTo(c + 78, c + 30, c + 30, c + 62);
  ctx.quadraticCurveTo(c, c + 76, c - 30, c + 62);
  ctx.quadraticCurveTo(c - 78, c + 30, c - 66, c - 30);
  ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, c - 70, 0, c + 70, [
    [0, '#ffd36b'],
    [0.5, '#f0a02a'],
    [1, '#b8610c'],
  ]);
  ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.stroke();
  // rosettes
  const spots: [number, number, number][] = [
    [-40, -34, 7],
    [-18, -48, 6],
    [18, -48, 6],
    [40, -34, 7],
    [-52, 6, 6],
    [52, 6, 6],
    [0, -30, 5],
  ];
  for (const [x, y, r] of spots) {
    ctx.beginPath();
    ctx.arc(c + x, c + y, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#4a2204';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c + x, c + y, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#4a2204';
    ctx.fill();
  }
  // muzzle
  ellipse(ctx, c - 15, c + 30, 20, 16);
  ctx.fillStyle = '#fff1d0';
  ctx.fill();
  ellipse(ctx, c + 15, c + 30, 20, 16);
  ctx.fill();
  // eyes
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(c + sx * 28, c - 8);
    ctx.rotate(sx * -0.25);
    ellipse(ctx, 0, 0, 17, 10);
    ctx.fillStyle = rad(ctx, 0, 0, 1, 17, [
      [0, '#eafff6'],
      [0.4, '#5ef0b0'],
      [1, '#128a5a'],
    ]);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.stroke();
    ellipse(ctx, 0, 0, 3.2, 8);
    ctx.fillStyle = '#0b0b0b';
    ctx.fill();
    ctx.restore();
  }
  // nose
  poly(ctx, [
    [c - 13, c + 10],
    [c + 13, c + 10],
    [c, c + 24],
  ]);
  ctx.fillStyle = '#6b2c1a';
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke();
  // fangs
  ctx.fillStyle = '#ffffff';
  for (const sx of [-1, 1]) {
    poly(ctx, [
      [c + sx * 10, c + 42],
      [c + sx * 22, c + 42],
      [c + sx * 15, c + 62],
    ]);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
}

function drawQuetzal(ctx: Ctx) {
  medallion(ctx, '#8a1c2b', '#2c050c');
  const c = 128;
  // tail feathers sweeping down-left
  const tails: [string, number][] = [
    ['#0f8f5c', 0.0],
    ['#22c07a', 0.28],
    ['#0a6b45', -0.28],
  ];
  for (const [col, off] of tails) {
    ctx.save();
    ctx.translate(c + 6, c + 20);
    ctx.rotate(0.95 + off);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(22, 60, 0, 112);
    ctx.quadraticCurveTo(-22, 60, 0, 0);
    ctx.fillStyle = lin(ctx, 0, 0, 0, 112, [
      [0, col],
      [1, '#073d28'],
    ]);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(0, 104);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
  // body
  shadow(ctx, 8, 4, 0.5);
  ellipse(ctx, c + 10, c + 10, 46, 58, -0.35);
  ctx.fillStyle = lin(ctx, c - 30, c - 40, c + 40, c + 60, [
    [0, '#6ff0a8'],
    [0.5, '#16a86a'],
    [1, '#075236'],
  ]);
  ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.stroke();
  // red breast
  ctx.beginPath();
  ctx.ellipse(c + 24, c + 30, 26, 36, -0.35, -0.6, Math.PI * 0.95);
  ctx.fillStyle = lin(ctx, 0, c, 0, c + 70, [
    [0, '#ff5a4a'],
    [1, '#9a1020'],
  ]);
  ctx.fill();
  // head
  ctx.beginPath();
  ctx.arc(c + 26, c - 46, 30, 0, Math.PI * 2);
  ctx.fillStyle = lin(ctx, 0, c - 80, 0, c - 16, [
    [0, '#8cffc0'],
    [1, '#129a60'],
  ]);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.stroke();
  // crest
  ctx.beginPath();
  ctx.moveTo(c + 6, c - 66);
  ctx.quadraticCurveTo(c + 20, c - 104, c + 44, c - 74);
  ctx.quadraticCurveTo(c + 30, c - 80, c + 6, c - 66);
  ctx.fillStyle = '#2ee08c';
  ctx.fill();
  ctx.stroke();
  // beak
  poly(ctx, [
    [c + 50, c - 52],
    [c + 76, c - 44],
    [c + 50, c - 36],
  ]);
  ctx.fillStyle = lin(ctx, c + 50, 0, c + 76, 0, [
    [0, '#ffe15a'],
    [1, '#d88a10'],
  ]);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.stroke();
  // eye
  ctx.beginPath();
  ctx.arc(c + 34, c - 50, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(c + 36, c - 50, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  // wing
  ctx.beginPath();
  ctx.moveTo(c - 18, c - 10);
  ctx.quadraticCurveTo(c - 30, c + 40, c + 6, c + 64);
  ctx.quadraticCurveTo(c + 4, c + 20, c - 18, c - 10);
  ctx.fillStyle = '#0a6b45';
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawSerpent(ctx: Ctx) {
  medallion(ctx, '#4b2a7a', '#150828');
  const c = 128;
  // coiled body (S curve)
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(c - 70, c + 72);
    ctx.bezierCurveTo(c - 10, c + 96, c + 70, c + 60, c + 40, c + 18);
    ctx.bezierCurveTo(c + 10, c - 20, c - 70, c + 4, c - 50, c - 40);
    ctx.bezierCurveTo(c - 36, c - 70, c + 4, c - 72, c + 20, c - 58);
  };
  shadow(ctx, 8, 5, 0.5);
  path();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 42;
  ctx.stroke();
  noShadow(ctx);
  path();
  ctx.strokeStyle = lin(ctx, 0, c - 70, 0, c + 90, [
    [0, '#9dff7a'],
    [0.5, '#2fa84a'],
    [1, '#145c25'],
  ]);
  ctx.lineWidth = 34;
  ctx.stroke();
  // belly scales
  path();
  ctx.setLineDash([6, 10]);
  ctx.strokeStyle = 'rgba(255,240,150,0.7)';
  ctx.lineWidth = 12;
  ctx.stroke();
  ctx.setLineDash([]);
  // feather collar
  const collar = ['#e8423c', '#f4c542', '#1fc1c9', '#e8423c', '#f4c542'];
  collar.forEach((col, i) => {
    ctx.save();
    ctx.translate(c + 22, c - 58);
    ctx.rotate(-2.4 + i * 0.42);
    ellipse(ctx, 0, -30, 9, 22);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  });
  // head
  ctx.save();
  ctx.translate(c + 40, c - 62);
  ctx.rotate(-0.2);
  ellipse(ctx, 0, 0, 34, 24);
  ctx.fillStyle = lin(ctx, 0, -24, 0, 24, [
    [0, '#b6ff8c'],
    [1, '#2a8a3c'],
  ]);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.stroke();
  // mouth + tongue
  ctx.beginPath();
  ctx.moveTo(10, 8);
  ctx.lineTo(34, 6);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(32, 6);
  ctx.lineTo(52, 10);
  ctx.lineTo(58, 4);
  ctx.moveTo(52, 10);
  ctx.lineTo(58, 16);
  ctx.strokeStyle = '#ff3b4f';
  ctx.lineWidth = 3.5;
  ctx.stroke();
  // eye
  ellipse(ctx, 6, -8, 8, 6);
  ctx.fillStyle = '#ffe14a';
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ellipse(ctx, 7, -8, 2, 5);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.restore();
}

function drawFrog(ctx: Ctx) {
  medallion(ctx, '#155a78', '#041c28');
  const c = 128;
  const gold = () =>
    lin(ctx, 0, c - 70, 0, c + 80, [
      [0, '#fff3b0'],
      [0.35, '#f2c040'],
      [0.75, '#b7760f'],
      [1, '#6e4106'],
    ]);
  shadow(ctx, 10, 6, 0.55);
  // back legs
  for (const sx of [-1, 1]) {
    ellipse(ctx, c + sx * 50, c + 44, 30, 22, sx * 0.3);
    ctx.fillStyle = gold();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  // body
  ellipse(ctx, c, c + 22, 56, 50);
  ctx.fillStyle = gold();
  ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.stroke();
  // belly engraving (step pattern)
  ctx.strokeStyle = 'rgba(90,50,5,0.7)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const y = c + 20 + i * 12;
    ctx.beginPath();
    ctx.moveTo(c - 26 + i * 6, y);
    ctx.lineTo(c - 10, y);
    ctx.lineTo(c - 10, y - 6);
    ctx.lineTo(c + 10, y - 6);
    ctx.lineTo(c + 10, y);
    ctx.lineTo(c + 26 - i * 6, y);
    ctx.stroke();
  }
  // head
  ellipse(ctx, c, c - 30, 62, 38);
  ctx.fillStyle = gold();
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.stroke();
  // eyes
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(c + sx * 36, c - 56, 20, 0, Math.PI * 2);
    ctx.fillStyle = gold();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c + sx * 36, c - 56, 12, 0, Math.PI * 2);
    ctx.fillStyle = rad(ctx, c + sx * 36, c - 56, 1, 12, [
      [0, '#bfffe6'],
      [1, '#10a070'],
    ]);
    ctx.fill();
    ellipse(ctx, c + sx * 36, c - 56, 8, 3);
    ctx.fillStyle = '#000';
    ctx.fill();
  }
  // mouth
  ctx.beginPath();
  ctx.moveTo(c - 44, c - 22);
  ctx.quadraticCurveTo(c, c, c + 44, c - 22);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.stroke();
  // front feet
  for (const sx of [-1, 1]) {
    ellipse(ctx, c + sx * 26, c + 66, 18, 10);
    ctx.fillStyle = gold();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  star(ctx, c - 30, c - 40, 9, 3);
}

// ---------------------------------------------------------------- specials

function ribbon(ctx: Ctx, text: string, y: number, fill: string | CanvasGradient, color = '#fff6d0') {
  const c = 128;
  ctx.save();
  shadow(ctx, 6, 3, 0.5);
  ctx.beginPath();
  ctx.moveTo(c - 88, y - 20);
  ctx.lineTo(c + 88, y - 20);
  ctx.lineTo(c + 100, y);
  ctx.lineTo(c + 88, y + 20);
  ctx.lineTo(c - 88, y + 20);
  ctx.lineTo(c - 100, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = lin(ctx, 0, y - 20, 0, y + 20, GOLD);
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.font = '900 30px Cinzel, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(40,10,0,0.9)';
  ctx.strokeText(text, c, y + 2);
  ctx.fillStyle = color;
  ctx.fillText(text, c, y + 2);
  ctx.restore();
}

function drawWild(ctx: Ctx) {
  const c = 128;
  // rays
  shadow(ctx, 16, 8, 0.6);
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const a1 = a - Math.PI / 16;
    const a2 = a + Math.PI / 16;
    ctx.moveTo(c + Math.cos(a1) * 82, c + Math.sin(a1) * 82);
    ctx.lineTo(c + Math.cos(a) * 118, c + Math.sin(a) * 118);
    ctx.lineTo(c + Math.cos(a2) * 82, c + Math.sin(a2) * 82);
  }
  ctx.fillStyle = lin(ctx, 0, 10, 0, 246, GOLD);
  ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke();
  // outer disc
  ctx.beginPath();
  ctx.arc(c, c, 86, 0, Math.PI * 2);
  ctx.fillStyle = lin(ctx, 0, 40, 0, 216, GOLD);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.stroke();
  // turquoise ring with glyph dots
  ctx.beginPath();
  ctx.arc(c, c, 70, 0, Math.PI * 2);
  ctx.fillStyle = rad(ctx, c, c, 30, 72, [
    [0, '#3ee6e0'],
    [1, '#0b6b78'],
  ]);
  ctx.fill();
  ctx.stroke();
  stepRing(ctx, c, c, 62, 20, 8, '#f6d36a');
  // inner face disc
  ctx.beginPath();
  ctx.arc(c, c, 48, 0, Math.PI * 2);
  ctx.fillStyle = lin(ctx, 0, 80, 0, 176, GOLD);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.stroke();
  // face
  ctx.fillStyle = INK;
  for (const sx of [-1, 1]) {
    ctx.fillRect(c + sx * 18 - 8, c - 14, 16, 8);
  }
  ctx.beginPath();
  ctx.moveTo(c - 6, c - 4);
  ctx.lineTo(c + 6, c - 4);
  ctx.lineTo(c, c + 10);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(c - 18, c + 18);
  ctx.quadraticCurveTo(c, c + 30, c + 18, c + 18);
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.stroke();
  // tongue (the famous sun-stone tongue)
  poly(ctx, [
    [c - 7, c + 22],
    [c + 7, c + 22],
    [c + 4, c + 40],
    [c - 4, c + 40],
  ]);
  ctx.fillStyle = '#e8423c';
  ctx.fill();
  ribbon(ctx, 'WILD', 214, lin(ctx, 0, 194, 0, 234, [
    [0, '#d63a2e'],
    [1, '#7a120c'],
  ]));
}

function drawScatter(ctx: Ctx) {
  const c = 128;
  // light rays
  ctx.save();
  ctx.translate(c, c);
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-10, -124);
    ctx.lineTo(10, -124);
    ctx.closePath();
    ctx.fillStyle = 'rgba(120,240,255,0.18)';
    ctx.fill();
  }
  ctx.restore();
  // glow
  ctx.beginPath();
  ctx.arc(c, c, 100, 0, Math.PI * 2);
  ctx.fillStyle = rad(ctx, c, c, 10, 100, [
    [0, 'rgba(120,255,255,0.55)'],
    [1, 'rgba(120,255,255,0)'],
  ]);
  ctx.fill();
  // tablet (diamond stone)
  shadow(ctx, 16, 8, 0.6);
  poly(ctx, [
    [c, c - 96],
    [c + 86, c],
    [c, c + 96],
    [c - 86, c],
  ]);
  ctx.fillStyle = lin(ctx, 0, c - 96, 0, c + 96, [
    [0, '#8ff7ff'],
    [0.45, '#18a9c4'],
    [1, '#063a52'],
  ]);
  ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = lin(ctx, 0, c - 96, 0, c + 96, GOLD);
  ctx.lineWidth = 8;
  ctx.stroke();
  poly(ctx, [
    [c, c - 70],
    [c + 62, c],
    [c, c + 70],
    [c - 62, c],
  ]);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // carved sun glyph
  ctx.beginPath();
  ctx.arc(c, c, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#fff4c0';
  ctx.fill();
  ctx.strokeStyle = '#6b3f06';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#fff4c0';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.save();
    ctx.translate(c + Math.cos(a) * 36, c + Math.sin(a) * 36);
    ctx.rotate(a + Math.PI / 2);
    poly(ctx, [
      [-6, 6],
      [6, 6],
      [0, -9],
    ]);
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(c, c, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#e8a21a';
  ctx.fill();
}

/** Stele: carved stone pillar. The value plate (bottom) is left empty – the game writes the multiplier there. */
export function drawStele(ctx: Ctx, golden: boolean) {
  const c = 128;
  const body = golden
    ? lin(ctx, 40, 0, 216, 0, [
        [0, '#7a4a07'],
        [0.3, '#ffd65a'],
        [0.55, '#fff3b8'],
        [0.8, '#d0901c'],
        [1, '#6e4106'],
      ])
    : lin(ctx, 40, 0, 216, 0, [
        [0, '#4a4136'],
        [0.35, '#9d917c'],
        [0.6, '#b8ab93'],
        [1, '#4f463a'],
      ]);
  const edge = golden ? '#4a2a02' : '#1e1a14';
  shadow(ctx, 16, 8, 0.65);
  // pillar
  ctx.beginPath();
  ctx.moveTo(c - 70, 26);
  ctx.lineTo(c + 70, 26);
  ctx.lineTo(c + 78, 236);
  ctx.lineTo(c - 78, 236);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 5;
  ctx.stroke();
  // headdress
  poly(ctx, [
    [c - 82, 38],
    [c + 82, 38],
    [c + 70, 12],
    [c - 70, 12],
  ]);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.stroke();
  const carve = golden ? 'rgba(90,50,0,0.85)' : 'rgba(25,20,14,0.85)';
  const light = golden ? 'rgba(255,255,220,0.6)' : 'rgba(255,255,255,0.22)';
  // headdress step pattern
  ctx.strokeStyle = carve;
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const x = c - 66 + i * 26;
    ctx.strokeRect(x, 18, 14, 14);
  }
  // face: brow, eyes, nose, mouth
  ctx.fillStyle = carve;
  ctx.fillRect(c - 56, 54, 112, 8);
  for (const sx of [-1, 1]) {
    ctx.fillRect(c + sx * 30 - 16, 72, 32, 14);
    ctx.fillStyle = golden ? '#1c8f6a' : '#37c4a0';
    ctx.fillRect(c + sx * 30 - 6, 75, 12, 8);
    ctx.fillStyle = carve;
  }
  ctx.fillRect(c - 7, 90, 14, 26);
  ctx.fillRect(c - 30, 122, 60, 10);
  ctx.fillStyle = light;
  ctx.fillRect(c - 56, 62, 112, 2);
  ctx.fillRect(c - 30, 132, 60, 2);
  // ear spools
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(c + sx * 62, 92, 9, 0, Math.PI * 2);
    ctx.strokeStyle = carve;
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  // value plate recess
  ctx.fillStyle = golden ? 'rgba(60,30,0,0.85)' : 'rgba(18,14,10,0.88)';
  ctx.beginPath();
  ctx.roundRect(c - 64, 150, 128, 68, 10);
  ctx.fill();
  ctx.strokeStyle = light;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ---------------------------------------------------------------- public

export function drawSymbol(name: string): HTMLCanvasElement {
  const [cv, ctx] = makeCanvas(SYM);
  switch (name) {
    case 'H1':
      drawJaguar(ctx);
      break;
    case 'H2':
      drawQuetzal(ctx);
      break;
    case 'H3':
      drawSerpent(ctx);
      break;
    case 'H4':
      drawFrog(ctx);
      break;
    case 'W':
      drawWild(ctx);
      break;
    case 'S':
      drawScatter(ctx);
      break;
    case 'T':
      drawStele(ctx, false);
      break;
    case 'TG':
      drawStele(ctx, true);
      break;
    default:
      drawGem(ctx, GEMS[name] ?? GEMS.L1);
  }
  return cv;
}

export const ALL_SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'L5', 'W', 'S', 'T', 'TG'];
