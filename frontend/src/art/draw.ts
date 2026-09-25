/**
 * Procedural artwork for Temple of Ascent.
 * Everything is drawn with Canvas2D once at start-up and turned into Pixi textures,
 * so the game ships without image files and stays sharp on every screen.
 * Coordinates are in a 256×256 box ("u" = 1/256 of the size).
 */

import { drawGem2, GEMS2 } from './gems2';
import { drawStele2 } from './steles2';
import { drawFrog2, drawJaguar2, drawQuetzal2, drawSerpent2, drawWild2 } from './highs';

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

/**
 * BONUS symbol: a golden step pyramid – the temple itself – with a glowing jade portal and a
 * beam of light shooting up from its shrine, on a turquoise halo. (The wild is the sun face,
 * so the BONUS no longer uses a sun.)
 */
function drawScatter(ctx: Ctx) {
  const c = 128;
  const cy = 118;
  // halo: jade disc with alternating gold / turquoise rays
  ctx.save();
  ctx.translate(c, cy);
  for (let i = 0; i < 20; i++) {
    ctx.rotate((Math.PI * 2) / 20);
    ctx.beginPath();
    ctx.moveTo(-5, -40);
    ctx.lineTo(-11, -124);
    ctx.lineTo(11, -124);
    ctx.lineTo(5, -40);
    ctx.closePath();
    ctx.fillStyle = rad(ctx, 0, 0, 40, 124, i % 2
      ? [[0, 'rgba(255,225,130,0.6)'], [1, 'rgba(255,225,130,0)']]
      : [[0, 'rgba(90,245,225,0.6)'], [1, 'rgba(90,245,225,0)']]);
    ctx.fill();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(c, cy, 112, 0, Math.PI * 2);
  ctx.fillStyle = rad(ctx, c, cy, 8, 112, [
    [0, 'rgba(200,255,240,0.95)'],
    [0.45, 'rgba(40,210,190,0.55)'],
    [1, 'rgba(20,160,150,0)'],
  ]);
  ctx.fill();
  // carved jade ring behind the pyramid
  ctx.beginPath();
  ctx.arc(c, cy - 6, 84, 0, Math.PI * 2);
  ctx.lineWidth = 12;
  ctx.strokeStyle = lin(ctx, 0, cy - 90, 0, cy + 80, [
    [0, '#8ff5da'],
    [0.5, '#1c9c83'],
    [1, '#0a4a3e'],
  ]);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.arc(c, cy - 6, 90, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(c, cy - 6, 78, 0, Math.PI * 2);
  ctx.stroke();
  stepRing(ctx, c, cy - 6, 84, 24, 4, 'rgba(255,240,190,0.75)');

  // beam of light from the shrine
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const beam = ctx.createLinearGradient(0, 4, 0, cy - 40);
  beam.addColorStop(0, 'rgba(160,255,240,0)');
  beam.addColorStop(1, 'rgba(200,255,245,0.85)');
  poly(ctx, [
    [c - 6, cy - 40],
    [c + 6, cy - 40],
    [c + 22, 4],
    [c - 22, 4],
  ]);
  ctx.fillStyle = beam;
  ctx.fill();
  ctx.restore();

  // step pyramid: 4 gold tiers (bottom → top)
  const tiers = [
    { w: 176, y: cy + 50, h: 24 },
    { w: 144, y: cy + 26, h: 24 },
    { w: 112, y: cy + 2, h: 24 },
    { w: 80, y: cy - 22, h: 24 },
  ];
  shadow(ctx, 16, 8, 0.7);
  poly(ctx, [
    [c - 88, cy + 74],
    [c + 88, cy + 74],
    [c + 40, cy - 22],
    [c - 40, cy - 22],
  ]);
  ctx.fillStyle = '#000';
  ctx.fill();
  noShadow(ctx);
  for (const t of tiers) {
    const x0 = c - t.w / 2;
    const inset = 8;
    poly(ctx, [
      [x0, t.y + t.h],
      [x0 + t.w, t.y + t.h],
      [x0 + t.w - inset, t.y],
      [x0 + inset, t.y],
    ]);
    ctx.fillStyle = lin(ctx, 0, t.y, 0, t.y + t.h, [
      [0, '#fff3b0'],
      [0.35, '#f0bf45'],
      [0.7, '#b8780f'],
      [1, '#7a4a06'],
    ]);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
    // jade inlay band with carved blocks
    ctx.fillStyle = lin(ctx, 0, t.y + 9, 0, t.y + 16, [
      [0, '#6ff0cf'],
      [1, '#107a64'],
    ]);
    ctx.fillRect(x0 + inset + 4, t.y + 9, t.w - 2 * inset - 8, 7);
    ctx.fillStyle = 'rgba(20,40,30,0.55)';
    for (let x = x0 + inset + 10; x < x0 + t.w - inset - 8; x += 14) ctx.fillRect(x, t.y + 9, 2, 7);
  }
  // central staircase
  poly(ctx, [
    [c - 20, cy + 74],
    [c + 20, cy + 74],
    [c + 11, cy - 22],
    [c - 11, cy - 22],
  ]);
  ctx.fillStyle = lin(ctx, 0, cy - 22, 0, cy + 74, [
    [0, '#ffe9a0'],
    [1, '#a8690c'],
  ]);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(60,30,0,0.6)';
  ctx.lineWidth = 1.5;
  for (let y = cy - 14; y < cy + 74; y += 8) {
    const k = (y - (cy - 22)) / 96;
    const hw = 11 + k * 9;
    ctx.beginPath();
    ctx.moveTo(c - hw, y);
    ctx.lineTo(c + hw, y);
    ctx.stroke();
  }
  // shrine on top with a glowing portal
  const sy = cy - 50;
  poly(ctx, [
    [c - 30, cy - 22],
    [c + 30, cy - 22],
    [c + 26, sy],
    [c - 26, sy],
  ]);
  ctx.fillStyle = lin(ctx, 0, sy, 0, cy - 22, [
    [0, '#fff3b0'],
    [1, '#b8780f'],
  ]);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke();
  // roof comb
  poly(ctx, [
    [c - 32, sy],
    [c + 32, sy],
    [c + 22, sy - 12],
    [c - 22, sy - 12],
  ]);
  ctx.fillStyle = '#e8a21a';
  ctx.fill();
  ctx.stroke();
  // portal
  ctx.save();
  ctx.shadowColor = 'rgba(120,255,235,1)';
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.moveTo(c - 12, cy - 22);
  ctx.lineTo(c - 12, sy + 12);
  ctx.quadraticCurveTo(c, sy + 2, c + 12, sy + 12);
  ctx.lineTo(c + 12, cy - 22);
  ctx.closePath();
  ctx.fillStyle = rad(ctx, c, cy - 30, 2, 22, [
    [0, '#ffffff'],
    [0.5, '#9ffff0'],
    [1, '#1bc7b0'],
  ]);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // sparkles
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  for (const [x, y, r] of [
    [c - 70, cy - 58, 7],
    [c + 74, cy - 40, 5],
    [c + 58, cy - 82, 6],
    [c - 52, cy - 92, 4],
  ] as [number, number, number][])
    star(ctx, x, y, r, 1.6);

  ribbon(ctx, 'BONUS', 222, lin(ctx, 0, 202, 0, 242, [
    [0, '#1fc9a8'],
    [1, '#06594a'],
  ]));
}

/** Stele: carved stone pillar. The value plate (bottom) is left empty – the game writes the multiplier there. */
export type SteleSkin = 'stone' | 'gold' | 'bronze' | 'diamond' | 'obsidian';

/** materials of the steles: stone (2–25×), bronze (5–50×), diamond (10–250×), obsidian (25–500×), gold (Jaguar-Spin) */
const STELE_SKINS: Record<SteleSkin, { body: Stops; edge: string; carve: string; light: string; eye: string; plate: string }> = {
  stone: {
    body: [
      [0, '#4a4136'],
      [0.35, '#9d917c'],
      [0.6, '#b8ab93'],
      [1, '#4f463a'],
    ],
    edge: '#1e1a14',
    carve: 'rgba(25,20,14,0.85)',
    light: 'rgba(255,255,255,0.22)',
    eye: '#37c4a0',
    plate: 'rgba(18,14,10,0.88)',
  },
  gold: {
    body: [
      [0, '#7a4a07'],
      [0.3, '#ffd65a'],
      [0.55, '#fff3b8'],
      [0.8, '#d0901c'],
      [1, '#6e4106'],
    ],
    edge: '#4a2a02',
    carve: 'rgba(90,50,0,0.85)',
    light: 'rgba(255,255,220,0.6)',
    eye: '#1c8f6a',
    plate: 'rgba(60,30,0,0.85)',
  },
  bronze: {
    body: [
      [0, '#4a2310'],
      [0.3, '#b8672c'],
      [0.52, '#f0b27a'],
      [0.75, '#a4561f'],
      [1, '#4a2310'],
    ],
    edge: '#2a1206',
    carve: 'rgba(52,22,6,0.88)',
    light: 'rgba(255,220,180,0.5)',
    eye: '#2fd6b4',
    plate: 'rgba(40,16,4,0.88)',
  },
  diamond: {
    body: [
      [0, '#123a63'],
      [0.28, '#5fc7f0'],
      [0.5, '#e6fbff'],
      [0.72, '#7fd6f5'],
      [1, '#153f6b'],
    ],
    edge: '#0a2440',
    carve: 'rgba(10,40,80,0.75)',
    light: 'rgba(255,255,255,0.8)',
    eye: '#ffffff',
    plate: 'rgba(6,24,48,0.88)',
  },
  obsidian: {
    body: [
      [0, '#050507'],
      [0.35, '#2a2733'],
      [0.55, '#4a4658'],
      [0.8, '#1d1b24'],
      [1, '#050507'],
    ],
    edge: '#000000',
    carve: 'rgba(255,200,70,0.95)',
    light: 'rgba(200,190,255,0.4)',
    eye: '#ff9d2a',
    plate: 'rgba(0,0,0,0.9)',
  },
};

export function drawStele(ctx: Ctx, skin: SteleSkin | boolean) {
  const k: SteleSkin = skin === true ? 'gold' : skin === false ? 'stone' : skin;
  const P = STELE_SKINS[k];
  const c = 128;
  // obsidian and diamond get an aura
  if (k === 'obsidian' || k === 'diamond') {
    ctx.beginPath();
    ctx.ellipse(c, 128, 118, 122, 0, 0, Math.PI * 2);
    ctx.fillStyle = rad(ctx, c, 128, 20, 124, k === 'obsidian'
      ? [
          [0, 'rgba(255,170,40,0.45)'],
          [1, 'rgba(255,170,40,0)'],
        ]
      : [
          [0, 'rgba(160,235,255,0.5)'],
          [1, 'rgba(160,235,255,0)'],
        ]);
    ctx.fill();
  }
  const body = lin(ctx, 40, 0, 216, 0, P.body);
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
  ctx.strokeStyle = P.edge;
  ctx.lineWidth = 5;
  ctx.stroke();
  // crystal facets
  if (k === 'diamond') {
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
    const lines: [number, number, number, number][] = [
      [c - 70, 26, c - 20, 140],
      [c - 20, 140, c + 70, 26],
      [c - 20, 140, c - 78, 236],
      [c - 20, 140, c + 40, 236],
      [c + 40, 236, c + 78, 120],
      [c + 78, 120, c + 70, 26],
    ];
    for (const [x0, y0, x1, y1] of lines) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(c - 70, 26);
    ctx.lineTo(c - 20, 140);
    ctx.lineTo(c - 78, 236);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // headdress
  poly(ctx, [
    [c - 82, 38],
    [c + 82, 38],
    [c + 70, 12],
    [c - 70, 12],
  ]);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = P.edge;
  ctx.stroke();
  const carve = P.carve;
  const light = P.light;
  if (k === 'obsidian') {
    ctx.shadowColor = '#ffb030';
    ctx.shadowBlur = 10;
  }
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
    ctx.fillStyle = P.eye;
    ctx.fillRect(c + sx * 30 - 6, 75, 12, 8);
    ctx.fillStyle = carve;
  }
  ctx.fillRect(c - 7, 90, 14, 26);
  ctx.fillRect(c - 30, 122, 60, 10);
  noShadow(ctx);
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
  ctx.fillStyle = P.plate;
  ctx.beginPath();
  ctx.roundRect(c - 64, 150, 128, 68, 10);
  ctx.fill();
  ctx.strokeStyle = k === 'obsidian' ? 'rgba(255,200,70,0.8)' : light;
  ctx.lineWidth = 2;
  ctx.stroke();
  // glints
  if (k === 'diamond' || k === 'bronze' || k === 'gold') {
    const pts = k === 'diamond' ? [[c - 50, 44, 9], [c + 58, 196, 7], [c + 40, 70, 5]] : [[c - 50, 44, 6]];
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    for (const [x, y, r] of pts) star(ctx, x, y, r, 1.6);
  }
}

/** symbols are painted at 2× resolution (crisp on large / high-DPI screens) */
export const SYM_RES = 2;

export function drawSymbol(name: string): HTMLCanvasElement {
  const [cv, ctx] = makeCanvas(SYM * SYM_RES);
  ctx.scale(SYM_RES, SYM_RES);
  if (GEMS2[name]) {
    drawGem2(ctx, GEMS2[name]);
    return cv;
  }
  switch (name) {
    case 'H1':
      drawJaguar2(ctx);
      break;
    case 'H2':
      drawQuetzal2(ctx);
      break;
    case 'H3':
      drawSerpent2(ctx);
      break;
    case 'H4':
      drawFrog2(ctx);
      break;
    case 'W':
      drawWild2(ctx);
      break;
    case 'S':
      drawScatter(ctx);
      break;
    case 'T':
      drawStele2(ctx, 'stone');
      break;
    case 'TG':
      drawStele2(ctx, 'gold');
      break;
    case 'TB':
      drawStele2(ctx, 'bronze');
      break;
    case 'TD':
      drawStele2(ctx, 'diamond');
      break;
    case 'TO':
      drawStele2(ctx, 'obsidian');
      break;
    default:
      drawGem(ctx, GEMS[name] ?? GEMS.L1);
  }
  return cv;
}

export const ALL_SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'L5', 'W', 'S', 'T', 'TG', 'TB', 'TD', 'TO'];
