/**
 * Low symbols L1–L5: cut gemstones in a gold bezel.
 * Every facet is shaded from its orientation to the light (top left), so the stones read as real
 * cut jewels instead of flat shapes.
 */
import { Ctx, INK, MAT, bevel, gloss, lg, path, rg, solid, sparkle, texture } from './kit';

type P2 = [number, number];
interface Gem {
  pts: P2[]; // outline, roughly -1..1
  table: number; // table size relative to the outline
  cut: 'step' | 'brilliant' | 'plain';
  col: [string, string, string, string]; // highlight, light, mid, deep
  size?: number;
  tableY?: number; // table offset (perspective, negative = up)
}

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number): string {
  const A = hex(a);
  const B = hex(b);
  const k = Math.max(0, Math.min(1, t));
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * k)},${Math.round(A[1] + (B[1] - A[1]) * k)},${Math.round(A[2] + (B[2] - A[2]) * k)})`;
}
/** 0 (deep) … 1 (highlight) → colour on the gem's ramp */
function ramp(g: Gem, v: number): string {
  const [hi, li, mi, de] = g.col;
  if (v < 0.33) return mix(de, mi, v / 0.33);
  if (v < 0.7) return mix(mi, li, (v - 0.33) / 0.37);
  return mix(li, hi, (v - 0.7) / 0.3);
}
const L = (() => {
  const x = -0.55;
  const y = -0.83;
  const n = Math.hypot(x, y);
  return [x / n, y / n];
})();
function lightOf(nx: number, ny: number): number {
  const n = Math.hypot(nx, ny) || 1;
  return ((nx / n) * L[0] + (ny / n) * L[1] + 1) / 2; // 0..1
}

function regular(n: number, r = 1, rot = 0, sy = 1): P2[] {
  return Array.from({ length: n }, (_, i) => {
    const a = rot + (i / n) * Math.PI * 2;
    return [Math.cos(a) * r, Math.sin(a) * r * sy] as P2;
  });
}

export const GEMS2: Record<string, Gem> = {
  // L1 emerald – emerald cut (rectangle with cut corners, step facets)
  L1: {
    pts: [
      [-0.55, -0.92],
      [0.55, -0.92],
      [0.78, -0.69],
      [0.78, 0.69],
      [0.55, 0.92],
      [-0.55, 0.92],
      [-0.78, 0.69],
      [-0.78, -0.69],
    ],
    table: 0.52,
    cut: 'step',
    col: ['#eafff4', '#5ff0a8', '#11985a', '#03331d'],
  },
  // L2 sapphire – marquise
  L2: {
    pts: (() => {
      const pts: P2[] = [];
      for (let i = 0; i < 12; i++) {
        const t = (i / 12) * Math.PI * 2;
        const x = Math.sin(t) * 0.72;
        const y = -Math.cos(t) * 1.02;
        pts.push([x * (1 - 0.18 * Math.abs(Math.cos(t))), y]);
      }
      return pts;
    })(),
    table: 0.5,
    cut: 'brilliant',
    col: ['#f0fbff', '#6cc8ff', '#1d5fd6', '#0a1a5a'],
  },
  // L3 citrine – round brilliant
  L3: {
    pts: regular(16, 0.92, -Math.PI / 2 + Math.PI / 16),
    table: 0.5,
    cut: 'brilliant',
    col: ['#fffbe0', '#ffd96a', '#e08a12', '#6a2e02'],
    tableY: -0.04,
    size: 84,
  },
  // L4 amethyst – trillion (rounded triangle)
  L4: {
    pts: [
      [0, -0.96],
      [0.28, -0.62],
      [0.62, -0.06],
      [0.92, 0.5],
      [0.74, 0.8],
      [0, 0.84],
      [-0.74, 0.8],
      [-0.92, 0.5],
      [-0.62, -0.06],
      [-0.28, -0.62],
    ],
    table: 0.46,
    cut: 'brilliant',
    col: ['#fbf0ff', '#d59cff', '#7a38c8', '#26094f'],
    tableY: 0.1,
  },
  // L5 ruby – heart
  L5: {
    pts: (() => {
      const pts: P2[] = [];
      for (let i = 0; i < 28; i++) {
        const t = (i / 28) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        pts.push([x / 17, y / 17 + 0.12]);
      }
      return pts;
    })(),
    table: 0.5,
    cut: 'brilliant',
    col: ['#fff0f2', '#ff7a8c', '#d0142e', '#4a0310'],
    tableY: -0.06,
  },
};

export function drawGem2(ctx: Ctx, g: Gem) {
  const c = 128;
  const s = g.size ?? 98;
  const P = g.pts.map(([x, y]) => [c + x * s, c + y * s] as P2);
  const ty = (g.tableY ?? 0) * s;
  const T = g.pts.map(([x, y]) => [c + x * s * g.table, c + ty + y * s * g.table] as P2);
  const outline = path(P);

  // --- gold bezel (setting)
  const B = g.pts.map(([x, y]) => {
    const r = Math.hypot(x, y) || 1;
    const k = (r + 0.12) / r;
    return [c + x * s * k, c + y * s * k] as P2;
  });
  solid(ctx, path(B), MAT.gold, { y0: c - s, y1: c + s, shadow: 16, bevel: 4, tex: 0.1, line: 4 });
  // bezel inner dark seat
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(60,30,0,0.9)';
  ctx.stroke(outline);

  // --- body base (pavilion seen through)
  ctx.fillStyle = rg(ctx, c - s * 0.2, c - s * 0.3, 4, s * 1.2, [
    [0, g.col[1]],
    [0.5, g.col[2]],
    [1, g.col[3]],
  ]);
  ctx.fill(outline);

  // --- facets
  const n = P.length;
  const facet = (pts: P2[], v: number, grad = 0.18) => {
    const fp = path(pts);
    // slight gradient inside each facet for curvature
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
    const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    ctx.fillStyle = lg(ctx, cx - 14, cy - 14, cx + 14, cy + 14, [
      [0, ramp(g, v + grad)],
      [1, ramp(g, v - grad)],
    ]);
    ctx.fill(fp);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1.2;
    ctx.stroke(fp);
  };
  if (g.cut === 'step') {
    // three concentric step rings
    const rings = [0, 0.33, 0.66, 1].map((k) => P.map((p, i) => [p[0] + (T[i][0] - p[0]) * k, p[1] + (T[i][1] - p[1]) * k] as P2));
    for (let r = 0; r < 3; r++)
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const mx = (P[i][0] + P[j][0]) / 2 - c;
        const my = (P[i][1] + P[j][1]) / 2 - c;
        const base = lightOf(mx, my);
        const v = 0.02 + base * 0.8 + (r === 1 ? 0.12 : r === 2 ? -0.08 : 0);
        facet([rings[r][i], rings[r][j], rings[r + 1][j], rings[r + 1][i]], v, 0.1);
      }
  } else {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const mid: P2 = [(P[i][0] + P[j][0]) / 2, (P[i][1] + P[j][1]) / 2];
      const tm: P2 = [(T[i][0] + T[j][0]) / 2, (T[i][1] + T[j][1]) / 2];
      const base = lightOf(mid[0] - c, mid[1] - c);
      // girdle facets (two per edge) + star facet towards the table
      facet([P[i], mid, T[i]], -0.05 + base * 0.85 + (i % 2 ? 0.1 : -0.12));
      facet([mid, P[j], T[j]], -0.05 + base * 0.85 + (i % 2 ? -0.14 : 0.08));
      facet([mid, T[j], T[i]], 0.1 + base * 0.75, 0.12);
      void tm;
    }
  }

  // --- table: bright, with a mirror reflection band
  const table = path(T);
  const tb = T.reduce((a, p) => [Math.min(a[0], p[1]), Math.max(a[1], p[1])], [999, -999]);
  ctx.fillStyle = lg(ctx, 0, tb[0], 0, tb[1], [
    [0, ramp(g, 0.85)],
    [0.5, ramp(g, 0.52)],
    [1, ramp(g, 0.3)],
  ]);
  ctx.fill(table);
  ctx.save();
  ctx.clip(table);
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.moveTo(c - s, c - s * 0.1);
  ctx.lineTo(c - s * 0.1, c - s);
  ctx.lineTo(c + s * 0.12, c - s);
  ctx.lineTo(c - s, c + s * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(c - s * 0.2, c + s);
  ctx.lineTo(c + s, c - s * 0.2);
  ctx.lineTo(c + s, c - s * 0.05);
  ctx.lineTo(c - s * 0.05, c + s);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1.6;
  ctx.stroke(table);

  // --- inner fire + subtle grain
  ctx.save();
  ctx.clip(outline);
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = rg(ctx, c + s * 0.15, c + s * 0.25, 2, s * 0.6, [
    [0, 'rgba(255,255,255,0.35)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  ctx.fillRect(0, 0, 256, 256);
  ctx.restore();
  texture(ctx, outline, 0.06);
  bevel(ctx, outline, 3, 'rgba(255,255,255,0.5)', 'rgba(0,0,0,0.45)');
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = INK;
  ctx.stroke(outline);

  // --- highlights
  gloss(ctx, c - s * 0.32, c - s * 0.45, s * 0.35, s * 0.14, 0.55, -0.7, outline);
  sparkle(ctx, c - s * 0.38, c - s * 0.5, 18);
  sparkle(ctx, c + s * 0.42, c + s * 0.2, 9, 0.7);
}
