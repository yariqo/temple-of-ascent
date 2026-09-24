/**
 * Animated jungle-temple backdrop (full screen, behind the game).
 * Static layers are painted once per stage into off-screen canvases; each frame they are
 * composited with parallax, a slow drifting camera and live elements:
 * twinkling stars, drifting clouds, god rays, flickering torches, a flowing waterfall,
 * swaying vines and foreground leaves, rolling mist and fireflies.
 */

const VW = 1600;
const VH = 900;

type Celestial = 'moon' | 'sunrise' | 'sunset' | 'eclipse';

interface Pal {
  sky: [string, string, string];
  cel: Celestial;
  celPos: [number, number];
  celColor: string;
  glow: string;
  far: [string, string];
  haze: string;
  stone: [string, string, string]; // shadow, mid, lit
  moss: string;
  jungle: [string, string, string];
  fg: string;
  rim: string;
  torch: string;
  mist: string;
  fly: string;
  water: string;
  stars: number;
}

const PALS: Pal[] = [
  // 0 – moonlit jungle night
  {
    sky: ['#040d12', '#0b2a31', '#1f5550'],
    cel: 'moon',
    celPos: [0.78, 0.2],
    celColor: '#eafff4',
    glow: 'rgba(170,255,225,0.35)',
    far: ['#12343a', '#0b2327'],
    haze: 'rgba(120,200,190,0.28)',
    stone: ['#0f211f', '#23413b', '#3f6a5e'],
    moss: 'rgba(60,140,80,0.45)',
    jungle: ['#06170f', '#0c2a1b', '#15402a'],
    fg: '#030b07',
    rim: 'rgba(160,255,220,0.45)',
    torch: '#ffb04a',
    mist: 'rgba(190,240,225,',
    fly: '#c8ff7a',
    water: 'rgba(190,245,255,',
    stars: 1,
  },
  // 1 – dawn over the jungle floor
  {
    sky: ['#0b1c1e', '#2c4f3a', '#b9a55a'],
    cel: 'sunrise',
    celPos: [0.5, 0.52],
    celColor: '#fff2b0',
    glow: 'rgba(255,230,150,0.45)',
    far: ['#2e4a3a', '#1c3428'],
    haze: 'rgba(230,220,160,0.3)',
    stone: ['#16241c', '#34503c', '#6f8a5c'],
    moss: 'rgba(80,150,70,0.5)',
    jungle: ['#071a0e', '#0f3319', '#1d4f26'],
    fg: '#040d06',
    rim: 'rgba(255,240,170,0.5)',
    torch: '#ffc050',
    mist: 'rgba(240,240,200,',
    fly: '#fff2a0',
    water: 'rgba(230,255,240,',
    stars: 0.3,
  },
  // 2 – golden hour, torches on the temple stairs
  {
    sky: ['#1a0f06', '#5a3410', '#e0952e'],
    cel: 'sunset',
    celPos: [0.22, 0.46],
    celColor: '#ffe29a',
    glow: 'rgba(255,190,90,0.5)',
    far: ['#4a2e14', '#2e1c0c'],
    haze: 'rgba(255,190,110,0.32)',
    stone: ['#20140a', '#4a3218', '#8e6634'],
    moss: 'rgba(110,120,40,0.45)',
    jungle: ['#120c04', '#2a1c08', '#43300f'],
    fg: '#080502',
    rim: 'rgba(255,200,110,0.55)',
    torch: '#ff9a2a',
    mist: 'rgba(255,215,160,',
    fly: '#ffd27a',
    water: 'rgba(255,235,200,',
    stars: 0,
  },
  // 3 – blood-red sky at the sacrifice platform
  {
    sky: ['#120405', '#4e0f0c', '#d2471c'],
    cel: 'sunset',
    celPos: [0.5, 0.5],
    celColor: '#ffb070',
    glow: 'rgba(255,110,50,0.55)',
    far: ['#3e120c', '#240806'],
    haze: 'rgba(255,120,70,0.3)',
    stone: ['#1a0806', '#40160c', '#86341a'],
    moss: 'rgba(90,60,20,0.4)',
    jungle: ['#100403', '#260a06', '#3e140a'],
    fg: '#070201',
    rim: 'rgba(255,130,70,0.55)',
    torch: '#ff7a1a',
    mist: 'rgba(255,160,120,',
    fly: '#ffb080',
    water: 'rgba(255,200,180,',
    stars: 0.2,
  },
  // 4 – eclipse at the summit
  {
    sky: ['#030108', '#140a28', '#3c1c64'],
    cel: 'eclipse',
    celPos: [0.5, 0.18],
    celColor: '#ffe7a0',
    glow: 'rgba(200,150,255,0.45)',
    far: ['#1e1234', '#120a22'],
    haze: 'rgba(170,120,255,0.28)',
    stone: ['#0a0612', '#20163a', '#43346c'],
    moss: 'rgba(90,60,140,0.35)',
    jungle: ['#050310', '#0e0822', '#1a1036'],
    fg: '#020106',
    rim: 'rgba(200,160,255,0.55)',
    torch: '#ffd24a',
    mist: 'rgba(200,170,255,',
    fly: '#e0c8ff',
    water: 'rgba(210,200,255,',
    stars: 1,
  },
];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function lin(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}
function rad(ctx: CanvasRenderingContext2D, x: number, y: number, r0: number, r1: number, stops: [number, string][]) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

// ------------------------------------------------------------------ static painters
function paintSky(p: Pal): HTMLCanvasElement {
  const [c, ctx] = canvas(VW, VH);
  ctx.fillStyle = lin(ctx, 0, 0, 0, VH, [
    [0, p.sky[0]],
    [0.55, p.sky[1]],
    [1, p.sky[2]],
  ]);
  ctx.fillRect(0, 0, VW, VH);
  const r = rng(3);
  if (p.stars > 0)
    for (let i = 0; i < 260; i++) {
      const y = r() * VH * 0.6;
      ctx.globalAlpha = p.stars * (0.25 + r() * 0.6) * (1 - y / (VH * 0.6));
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(r() * VW, y, r() < 0.1 ? 2 : 1, r() < 0.1 ? 2 : 1);
    }
  ctx.globalAlpha = 1;
  const [cx, cy] = [p.celPos[0] * VW, p.celPos[1] * VH];
  // big glow
  ctx.fillStyle = rad(ctx, cx, cy, 0, VH * 0.75, [
    [0, p.glow],
    [1, 'rgba(0,0,0,0)'],
  ]);
  ctx.fillRect(0, 0, VW, VH);
  if (p.cel === 'moon') {
    ctx.beginPath();
    ctx.arc(cx, cy, 46, 0, Math.PI * 2);
    ctx.fillStyle = rad(ctx, cx - 12, cy - 12, 4, 50, [
      [0, '#ffffff'],
      [0.7, p.celColor],
      [1, '#a9d8c8'],
    ]);
    ctx.fill();
    ctx.fillStyle = 'rgba(120,170,160,0.25)';
    for (const [dx, dy, rr] of [
      [-14, 8, 9],
      [12, -10, 6],
      [16, 14, 5],
      [-4, -18, 4],
    ]) {
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, rr, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (p.cel === 'eclipse') {
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 90; i++) {
      ctx.rotate((Math.PI * 2) / 90);
      ctx.beginPath();
      ctx.moveTo(0, 62);
      ctx.lineTo(0, 62 + 30 + r() * 110);
      ctx.strokeStyle = `rgba(255,${200 + Math.floor(r() * 40)},140,${0.15 + r() * 0.3})`;
      ctx.lineWidth = 1 + r() * 2;
      ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, 66, 0, Math.PI * 2);
    ctx.fillStyle = rad(ctx, cx, cy, 58, 80, [
      [0, 'rgba(255,240,190,1)'],
      [1, 'rgba(255,200,120,0)'],
    ]);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.fillStyle = '#05030a';
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, p.cel === 'sunrise' ? 90 : 70, 0, Math.PI * 2);
    ctx.fillStyle = rad(ctx, cx, cy, 10, 95, [
      [0, '#fffbe6'],
      [0.6, p.celColor],
      [1, 'rgba(255,200,120,0)'],
    ]);
    ctx.fill();
  }
  return c;
}

function ridge(ctx: CanvasRenderingContext2D, base: number, amp: number, seed: number, fill: string | CanvasGradient) {
  const r = rng(seed);
  const ph = [r() * 6, r() * 6, r() * 6];
  ctx.beginPath();
  ctx.moveTo(0, VH);
  for (let x = 0; x <= VW; x += 8) {
    const y = base - amp * (0.5 * Math.sin(x / 210 + ph[0]) + 0.3 * Math.sin(x / 83 + ph[1]) + 0.2 * Math.sin(x / 31 + ph[2]));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VW, VH);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function canopyLine(ctx: CanvasRenderingContext2D, base: number, size: number, seed: number, color: string) {
  const r = rng(seed);
  ctx.fillStyle = color;
  for (let x = -40; x < VW + 40; x += size * 0.55) {
    const rr = size * (0.5 + r() * 0.6);
    ctx.beginPath();
    ctx.arc(x, base - r() * size * 0.6, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillRect(0, base, VW, VH - base);
}

function paintFar(p: Pal): HTMLCanvasElement {
  const [c, ctx] = canvas(VW, VH);
  ridge(ctx, VH * 0.5, 90, 11, lin(ctx, 0, VH * 0.35, 0, VH, [
    [0, p.far[0]],
    [1, p.far[1]],
  ]));
  ctx.fillStyle = lin(ctx, 0, VH * 0.35, 0, VH * 0.7, [
    [0, p.haze],
    [1, 'rgba(0,0,0,0)'],
  ]);
  ctx.fillRect(0, 0, VW, VH);
  ridge(ctx, VH * 0.6, 60, 23, p.far[1]);
  canopyLine(ctx, VH * 0.7, 46, 5, p.jungle[1]);
  ctx.fillStyle = lin(ctx, 0, VH * 0.55, 0, VH * 0.78, [
    [0, p.haze],
    [1, 'rgba(0,0,0,0)'],
  ]);
  ctx.fillRect(0, VH * 0.55, VW, VH * 0.3);
  return c;
}

/** big stepped pyramid; returns torch positions */
function paintTemple(p: Pal): { c: HTMLCanvasElement; torches: [number, number, number][] } {
  const [c, ctx] = canvas(VW, VH);
  const torches: [number, number, number][] = [];
  const r = rng(17);
  const cx = VW / 2;
  const base = VH * 0.88;
  const tiers = 8;
  const tierH = 46;
  const w0 = VW * 0.74;
  const w1 = VW * 0.2;
  const litSide = p.celPos[0] > 0.55 ? 1 : p.celPos[0] < 0.45 ? -1 : 0;
  for (let i = 0; i < tiers; i++) {
    const w = w0 - ((w0 - w1) * i) / (tiers - 1);
    const y = base - (i + 1) * tierH;
    const x0 = cx - w / 2;
    // front face
    ctx.fillStyle = lin(ctx, x0, 0, x0 + w, 0, [
      [0, litSide < 0 ? p.stone[2] : p.stone[0]],
      [0.5, p.stone[1]],
      [1, litSide > 0 ? p.stone[2] : p.stone[0]],
    ]);
    ctx.fillRect(x0, y, w, tierH);
    // top ledge
    ctx.fillStyle = p.stone[2];
    ctx.globalAlpha = 0.55;
    ctx.fillRect(x0 - 4, y, w + 8, 5);
    ctx.globalAlpha = 1;
    // bottom shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x0, y + tierH - 6, w, 6);
    // block lines
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 1.4;
    for (let row = 0; row < 2; row++) {
      const yy = y + 6 + row * 20;
      ctx.beginPath();
      ctx.moveTo(x0, yy + 20);
      ctx.lineTo(x0 + w, yy + 20);
      ctx.stroke();
      for (let bx = x0 + (row ? 18 : 0); bx < x0 + w; bx += 36 + r() * 10) {
        ctx.beginPath();
        ctx.moveTo(bx, yy);
        ctx.lineTo(bx, yy + 20);
        ctx.stroke();
      }
    }
    // step-fret frieze on every second tier
    if (i % 2 === 1) {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2;
      for (let fx = x0 + 10; fx < x0 + w - 24; fx += 28) {
        ctx.strokeRect(fx, y + 14, 14, 14);
      }
    }
    // moss
    for (let m = 0; m < 10; m++) {
      ctx.fillStyle = p.moss;
      ctx.beginPath();
      ctx.ellipse(x0 + r() * w, y + 4 + r() * 8, 14 + r() * 30, 4 + r() * 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // torches on the tier corners
    if (i % 2 === 0 && i < tiers - 1) {
      torches.push([x0 + 18, y - 6, 1 - i * 0.06]);
      torches.push([x0 + w - 18, y - 6, 1 - i * 0.06]);
    }
  }
  // stairs
  const sTop = base - tiers * tierH;
  ctx.beginPath();
  ctx.moveTo(cx - 70, base);
  ctx.lineTo(cx - 40, sTop);
  ctx.lineTo(cx + 40, sTop);
  ctx.lineTo(cx + 70, base);
  ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, sTop, 0, base, [
    [0, p.stone[1]],
    [1, p.stone[0]],
  ]);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.5;
  for (let y = sTop + 8; y < base; y += 8) {
    const t = (y - sTop) / (base - sTop);
    const hw = 40 + 30 * t;
    ctx.beginPath();
    ctx.moveTo(cx - hw, y);
    ctx.lineTo(cx + hw, y);
    ctx.stroke();
  }
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * 70, base);
    ctx.lineTo(cx + s * 40, sTop);
    ctx.lineTo(cx + s * 50, sTop);
    ctx.lineTo(cx + s * 84, base);
    ctx.closePath();
    ctx.fillStyle = p.stone[s === litSide ? 2 : 0];
    ctx.fill();
  }
  // shrine on top
  const shW = 190;
  const shH = 110;
  const shY = sTop - shH;
  ctx.fillStyle = lin(ctx, cx - shW / 2, 0, cx + shW / 2, 0, [
    [0, p.stone[0]],
    [0.5, p.stone[1]],
    [1, p.stone[0]],
  ]);
  ctx.fillRect(cx - shW / 2, shY, shW, shH);
  ctx.fillStyle = p.stone[2];
  ctx.fillRect(cx - shW / 2 - 12, shY - 14, shW + 24, 16);
  // roof comb
  ctx.fillStyle = p.stone[1];
  ctx.beginPath();
  ctx.moveTo(cx - 70, shY - 14);
  ctx.lineTo(cx - 50, shY - 70);
  ctx.lineTo(cx + 50, shY - 70);
  ctx.lineTo(cx + 70, shY - 14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  for (let k = 0; k < 4; k++) ctx.strokeRect(cx - 44 + k * 22, shY - 58, 14, 30);
  // glowing doorway
  ctx.fillStyle = rad(ctx, cx, shY + 70, 4, 80, [
    [0, 'rgba(255,220,140,0.95)'],
    [0.4, 'rgba(255,160,60,0.6)'],
    [1, 'rgba(255,140,40,0)'],
  ]);
  ctx.fillRect(cx - 90, shY - 10, 180, 140);
  ctx.fillStyle = '#ffdb8a';
  ctx.beginPath();
  ctx.moveTo(cx - 26, shY + shH);
  ctx.lineTo(cx - 26, shY + 42);
  ctx.lineTo(cx, shY + 26);
  ctx.lineTo(cx + 26, shY + 42);
  ctx.lineTo(cx + 26, shY + shH);
  ctx.closePath();
  ctx.fill();
  torches.push([cx - shW / 2 - 6, shY - 20, 1.2], [cx + shW / 2 + 6, shY - 20, 1.2]);
  // side ruins (smaller pyramids / pillars)
  for (const [px, sc] of [
    [VW * 0.1, 0.9],
    [VW * 0.9, 1],
  ] as [number, number][]) {
    for (let i = 0; i < 4; i++) {
      const w = (190 - i * 38) * sc;
      const y = base + 10 - (i + 1) * 34 * sc;
      ctx.fillStyle = lin(ctx, px - w / 2, 0, px + w / 2, 0, [
        [0, p.stone[0]],
        [0.5, p.stone[1]],
        [1, p.stone[0]],
      ]);
      ctx.fillRect(px - w / 2, y, w, 34 * sc);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(px - w / 2, y + 30 * sc, w, 4);
    }
    torches.push([px, base + 10 - 4 * 34 * sc - 8, 0.9]);
  }
  // ground
  ctx.fillStyle = lin(ctx, 0, base, 0, VH, [
    [0, p.stone[0]],
    [1, '#000000'],
  ]);
  ctx.fillRect(0, base, VW, VH - base);
  return { c, torches };
}

function leafShape(ctx: CanvasRenderingContext2D, len: number, wid: number, color: string, rim: string, cuts = true) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(len * 0.25, -wid, len * 0.75, -wid * 0.9, len, 0);
  ctx.bezierCurveTo(len * 0.75, wid * 0.9, len * 0.25, wid, 0, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = rim;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(len * 0.95, 0);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 3;
  ctx.stroke();
  if (cuts) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 1; i < 7; i++) {
      const x = (len * i) / 7;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x, s * wid * 0.25);
        ctx.lineTo(x + len * 0.08, s * wid * 1.1);
        ctx.lineWidth = 5;
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

/** trees, cliff and waterfall at the sides; returns the waterfall rectangle */
function paintSides(p: Pal): { c: HTMLCanvasElement; fall: [number, number, number, number] } {
  const [c, ctx] = canvas(VW, VH);
  const r = rng(29);
  // left cliff with waterfall
  ctx.beginPath();
  ctx.moveTo(0, VH * 0.18);
  ctx.lineTo(VW * 0.1, VH * 0.2);
  ctx.lineTo(VW * 0.18, VH * 0.3);
  ctx.lineTo(VW * 0.2, VH);
  ctx.lineTo(0, VH);
  ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, 0, VW * 0.2, 0, [
    [0, p.stone[0]],
    [0.7, p.stone[1]],
    [1, p.stone[0]],
  ]);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 16; i++) {
    const x = r() * VW * 0.18;
    const y = VH * 0.25 + r() * VH * 0.7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 20 + r() * 40, y + r() * 12);
    ctx.stroke();
  }
  const fall: [number, number, number, number] = [VW * 0.075, VH * 0.2, VW * 0.055, VH * 0.8];
  ctx.fillStyle = lin(ctx, 0, fall[1], 0, VH, [
    [0, p.water + '0.55)'],
    [1, p.water + '0.25)'],
  ]);
  ctx.fillRect(...fall);
  // pool glow at the bottom of the fall
  ctx.fillStyle = rad(ctx, fall[0] + fall[2] / 2, VH * 0.96, 4, 140, [
    [0, p.water + '0.4)'],
    [1, p.water + '0)'],
  ]);
  ctx.fillRect(0, VH * 0.8, VW * 0.3, VH * 0.2);
  // right: two big trees
  for (const [tx, tw] of [
    [VW * 0.93, 70],
    [VW * 0.83, 44],
  ] as [number, number][]) {
    ctx.fillStyle = lin(ctx, tx - tw / 2, 0, tx + tw / 2, 0, [
      [0, p.jungle[0]],
      [0.6, p.jungle[2]],
      [1, p.jungle[0]],
    ]);
    ctx.beginPath();
    ctx.moveTo(tx - tw / 2, VH);
    ctx.bezierCurveTo(tx - tw / 2 + 10, VH * 0.6, tx - tw * 0.3, VH * 0.3, tx - tw * 0.2, 0);
    ctx.lineTo(tx + tw * 0.25, 0);
    ctx.bezierCurveTo(tx + tw * 0.35, VH * 0.3, tx + tw / 2 - 6, VH * 0.6, tx + tw / 2 + 14, VH);
    ctx.closePath();
    ctx.fill();
    // roots
    ctx.beginPath();
    ctx.moveTo(tx - tw, VH);
    ctx.quadraticCurveTo(tx - tw * 0.4, VH * 0.9, tx, VH * 0.88);
    ctx.quadraticCurveTo(tx + tw * 0.5, VH * 0.9, tx + tw * 1.2, VH);
    ctx.fill();
  }
  // canopy clusters in the top corners and along the sides
  const clusters: [number, number, number][] = [];
  for (let i = 0; i < 26; i++) clusters.push([r() * VW * 0.28, r() * VH * 0.28, 50 + r() * 70]);
  for (let i = 0; i < 26; i++) clusters.push([VW - r() * VW * 0.3, r() * VH * 0.32, 50 + r() * 80]);
  for (const shade of [0, 1, 2]) {
    for (const [x, y, rr] of clusters) {
      const k = rng(Math.round(x * 7 + y))();
      if (Math.floor(k * 3) !== shade) continue;
      ctx.fillStyle = p.jungle[shade];
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.fill();
      // leaf texture
      ctx.save();
      ctx.translate(x, y);
      for (let l = 0; l < 6; l++) {
        ctx.rotate(1.1);
        ctx.save();
        ctx.translate(rr * 0.3, 0);
        leafShape(ctx, rr * 0.9, rr * 0.22, p.jungle[Math.min(2, shade + 1)], 'rgba(0,0,0,0)', false);
        ctx.restore();
      }
      ctx.restore();
      // rim light towards the sky light
      ctx.beginPath();
      ctx.arc(x, y, rr, Math.PI * 1.1, Math.PI * 1.7);
      ctx.strokeStyle = p.rim;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
  // bottom bushes
  canopyLine(ctx, VH * 0.98, 70, 41, p.jungle[0]);
  return { c, fall };
}

function paintLeafSprite(p: Pal, variant: number): HTMLCanvasElement {
  const [c, ctx] = canvas(560, 300);
  ctx.translate(20, 150);
  ctx.rotate(variant ? -0.05 : 0.05);
  leafShape(ctx, 520, variant ? 70 : 95, p.fg, p.rim, true);
  if (variant) {
    ctx.rotate(-0.35);
    leafShape(ctx, 380, 50, p.fg, p.rim, true);
  }
  return c;
}

function paintRays(): HTMLCanvasElement {
  const [c, ctx] = canvas(1200, 1200);
  ctx.translate(600, 600);
  for (let i = 0; i < 14; i++) {
    ctx.rotate((Math.PI * 2) / 14 + (i % 3) * 0.05);
    const g = ctx.createLinearGradient(0, 0, 0, -600);
    g.addColorStop(0, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-30 - (i % 4) * 10, -600);
    ctx.lineTo(30 + (i % 4) * 10, -600);
    ctx.closePath();
    ctx.fill();
  }
  return c;
}

function paintMist(p: Pal): HTMLCanvasElement {
  const [c, ctx] = canvas(VW, 260);
  const r = rng(51);
  for (let i = 0; i < 40; i++) {
    const x = r() * VW;
    const y = 80 + r() * 100;
    const rr = 80 + r() * 140;
    ctx.fillStyle = rad(ctx, x, y, 0, rr, [
      [0, p.mist + '0.22)'],
      [1, p.mist + '0)'],
    ]);
    ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  return c;
}

function paintCloud(p: Pal): HTMLCanvasElement {
  const [c, ctx] = canvas(520, 180);
  const r = rng(61);
  for (let i = 0; i < 14; i++) {
    const x = 90 + r() * 340;
    const y = 70 + r() * 50;
    const rr = 40 + r() * 60;
    ctx.fillStyle = rad(ctx, x, y, 0, rr, [
      [0, p.mist + '0.18)'],
      [1, p.mist + '0)'],
    ]);
    ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  return c;
}

interface StageArt {
  pal: Pal;
  sky: HTMLCanvasElement;
  far: HTMLCanvasElement;
  temple: HTMLCanvasElement;
  sides: HTMLCanvasElement;
  leaves: HTMLCanvasElement[];
  mist: HTMLCanvasElement;
  cloud: HTMLCanvasElement;
  torches: [number, number, number][];
  fall: [number, number, number, number];
}

function buildStage(stage: number): StageArt {
  const pal = PALS[stage] ?? PALS[0];
  const t = paintTemple(pal);
  const s = paintSides(pal);
  return {
    pal,
    sky: paintSky(pal),
    far: paintFar(pal),
    temple: t.c,
    torches: t.torches,
    sides: s.c,
    fall: s.fall,
    leaves: [paintLeafSprite(pal, 0), paintLeafSprite(pal, 1)],
    mist: paintMist(pal),
    cloud: paintCloud(pal),
  };
}

// ------------------------------------------------------------------ live backdrop
interface Fly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ph: number;
}

export class Backdrop {
  private cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private art: StageArt;
  private prev: StageArt | null = null;
  private fade = 1;
  private stage = 0;
  private rays = paintRays();
  private flies: Fly[] = [];
  private t = Math.random() * 100;
  private last = performance.now();
  private px = 0;
  private py = 0;
  private cache = new Map<number, StageArt>();
  private reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  constructor() {
    this.cv = document.createElement('canvas');
    this.cv.id = 'backdrop';
    document.body.prepend(this.cv);
    this.ctx = this.cv.getContext('2d')!;
    this.art = this.get(0);
    const r = rng(77);
    for (let i = 0; i < 36; i++) this.flies.push({ x: r() * VW, y: VH * 0.35 + r() * VH * 0.6, vx: (r() - 0.5) * 12, vy: (r() - 0.5) * 8, ph: r() * 6 });
    window.addEventListener('pointermove', (e) => {
      this.px = (e.clientX / innerWidth - 0.5) * 2;
      this.py = (e.clientY / innerHeight - 0.5) * 2;
    });
    requestAnimationFrame(this.frame);
  }

  private get(stage: number): StageArt {
    let a = this.cache.get(stage);
    if (!a) {
      a = buildStage(stage);
      this.cache.set(stage, a);
    }
    return a;
  }

  /** pre-paint the art of a stage (e.g. while loading) */
  warm(stage: number) {
    this.get(stage);
  }

  setStage(stage: number) {
    if (stage === this.stage) return;
    this.stage = stage;
    this.prev = this.art;
    this.art = this.get(stage);
    this.fade = 0;
  }

  private frame = (now: number) => {
    requestAnimationFrame(this.frame);
    const dt = Math.min(0.1, (now - this.last) / 1000);
    if (document.hidden) {
      this.last = now;
      return;
    }
    // ~40 fps is plenty for a backdrop
    if (now - this.last < 24) return;
    this.last = now;
    this.t += this.reduced ? 0 : dt;
    if (this.fade < 1) this.fade = Math.min(1, this.fade + dt / 2.2);

    const dpr = Math.min(1.25, window.devicePixelRatio || 1);
    const w = Math.round(innerWidth * dpr);
    const h = Math.round(innerHeight * dpr);
    if (this.cv.width !== w || this.cv.height !== h) {
      this.cv.width = w;
      this.cv.height = h;
    }
    const ctx = this.ctx;
    ctx.globalAlpha = 1;
    if (this.prev && this.fade < 1) {
      this.draw(this.prev, 1, w, h);
      this.draw(this.art, this.fade, w, h);
    } else {
      this.prev = null;
      this.draw(this.art, 1, w, h);
    }
  };

  private draw(a: StageArt, alpha: number, w: number, h: number) {
    const ctx = this.ctx;
    const t = this.t;
    const P = a.pal;
    // camera: cover the screen, slow drift + zoom, pointer parallax
    const zoom = 1.06 + 0.025 * Math.sin(t / 23);
    const s = Math.max(w / VW, h / VH) * zoom;
    const camX = Math.sin(t / 31) * 14 + this.px * 10;
    const camY = Math.cos(t / 37) * 8 + this.py * 6;
    const layer = (img: HTMLCanvasElement, depth: number, x = 0, y = 0, lw = VW, lh = VH) => {
      ctx.setTransform(s, 0, 0, s, w / 2 - (VW / 2) * s - camX * depth * s, h / 2 - (VH / 2) * s - camY * depth * s);
      ctx.drawImage(img, x, y, lw, lh);
    };
    const toScreen = (depth: number) => ctx.setTransform(s, 0, 0, s, w / 2 - (VW / 2) * s - camX * depth * s, h / 2 - (VH / 2) * s - camY * depth * s);

    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = 'source-over';
    layer(a.sky, 0.15);
    // twinkling stars
    if (P.stars > 0) {
      toScreen(0.15);
      for (let i = 0; i < 24; i++) {
        const x = (i * 197.3) % VW;
        const y = ((i * 83.7) % (VH * 0.45)) + 10;
        const k = 0.5 + 0.5 * Math.sin(t * (1.5 + (i % 5) * 0.4) + i);
        ctx.globalAlpha = alpha * P.stars * k * 0.9;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.globalAlpha = alpha;
    }
    // drifting clouds
    toScreen(0.2);
    for (let i = 0; i < 4; i++) {
      const x = ((t * (6 + i * 3) + i * 480) % (VW + 600)) - 520;
      ctx.drawImage(a.cloud, x, VH * (0.08 + i * 0.07), 520 * (1 + (i % 2) * 0.4), 180);
    }
    // god rays from the sky light
    ctx.globalCompositeOperation = 'lighter';
    toScreen(0.18);
    ctx.save();
    ctx.translate(P.celPos[0] * VW, P.celPos[1] * VH);
    ctx.rotate(t * 0.02);
    ctx.globalAlpha = alpha * (0.1 + 0.05 * Math.sin(t * 0.7));
    ctx.drawImage(this.rays, -900, -900, 1800, 1800);
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = alpha;

    layer(a.far, 0.3);
    // mist in the valley
    toScreen(0.35);
    const m1 = (t * 14) % VW;
    ctx.globalAlpha = alpha * (0.7 + 0.3 * Math.sin(t * 0.3));
    ctx.drawImage(a.mist, m1 - VW, VH * 0.55, VW, 260);
    ctx.drawImage(a.mist, m1, VH * 0.55, VW, 260);
    ctx.globalAlpha = alpha;

    layer(a.temple, 0.45);
    // flickering torches
    toScreen(0.45);
    ctx.globalCompositeOperation = 'lighter';
    a.torches.forEach(([x, y, sc], i) => {
      const f = 0.8 + 0.2 * Math.sin(t * 13 + i * 1.7) + 0.1 * Math.sin(t * 29 + i);
      const g = ctx.createRadialGradient(x, y, 0, x, y, 60 * sc * f);
      g.addColorStop(0, P.torch);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = alpha * 0.55;
      ctx.fillStyle = g;
      ctx.fillRect(x - 70 * sc, y - 70 * sc, 140 * sc, 140 * sc);
      // flame
      ctx.globalAlpha = alpha * 0.95;
      ctx.fillStyle = '#fff1b0';
      ctx.beginPath();
      const fh = 16 * sc * f;
      ctx.moveTo(x - 5 * sc, y + 4);
      ctx.quadraticCurveTo(x + Math.sin(t * 9 + i) * 3, y - fh, x + 5 * sc, y + 4);
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = alpha;

    layer(a.sides, 0.7);
    // flowing waterfall
    toScreen(0.7);
    const [fx, fy, fw, fh] = a.fall;
    ctx.save();
    ctx.beginPath();
    ctx.rect(fx, fy, fw, fh);
    ctx.clip();
    for (let i = 0; i < 14; i++) {
      const x = fx + ((i * 37) % fw);
      const y = fy + ((t * (180 + (i % 4) * 40) + i * 130) % (fh + 200)) - 200;
      const g = ctx.createLinearGradient(0, y, 0, y + 200);
      g.addColorStop(0, P.water + '0)');
      g.addColorStop(0.5, P.water + '0.55)');
      g.addColorStop(1, P.water + '0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, 3 + (i % 3) * 2, 200);
    }
    ctx.restore();
    // spray at the bottom
    for (let i = 0; i < 6; i++) {
      const k = (t * 0.5 + i / 6) % 1;
      const rr = 30 + k * 60;
      ctx.globalAlpha = alpha * (1 - k) * 0.35;
      ctx.fillStyle = rad(ctx, fx + fw / 2 + (i - 3) * 10, VH * 0.97 - k * 40, 0, rr, [
        [0, P.water + '0.6)'],
        [1, P.water + '0)'],
      ]);
      ctx.fillRect(fx + fw / 2 - rr - 40, VH * 0.97 - k * 40 - rr, rr * 2 + 80, rr * 2);
    }
    ctx.globalAlpha = alpha;
    // hanging vines swaying
    ctx.strokeStyle = P.jungle[2];
    ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const x = i < 5 ? 60 + i * 70 : VW - 60 - (i - 5) * 80;
      const len = 180 + ((i * 53) % 160);
      const sw = Math.sin(t * 0.8 + i) * 16;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, -10);
      ctx.quadraticCurveTo(x + sw * 0.5, len * 0.5, x + sw, len);
      ctx.stroke();
      ctx.fillStyle = P.jungle[2];
      for (let k = 1; k < 6; k++) {
        const tt = k / 6;
        const lx = x + sw * tt * tt;
        const ly = len * tt;
        ctx.beginPath();
        ctx.ellipse(lx + (k % 2 ? 7 : -7), ly, 9, 4, k % 2 ? 0.5 : -0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // fireflies
    ctx.globalCompositeOperation = 'lighter';
    toScreen(0.8);
    for (const f of this.flies) {
      f.x += (f.vx + Math.sin(t + f.ph) * 6) * 0.03;
      f.y += (f.vy + Math.cos(t * 0.8 + f.ph) * 5) * 0.03;
      if (f.x < 0) f.x += VW;
      if (f.x > VW) f.x -= VW;
      if (f.y < VH * 0.3) f.y = VH * 0.95;
      if (f.y > VH) f.y = VH * 0.35;
      const k = Math.max(0, Math.sin(t * 2 + f.ph * 3));
      ctx.globalAlpha = alpha * k * 0.9;
      ctx.fillStyle = rad(ctx, f.x, f.y, 0, 9, [
        [0, P.fly],
        [1, 'rgba(0,0,0,0)'],
      ]);
      ctx.fillRect(f.x - 9, f.y - 9, 18, 18);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = alpha;
    // ground mist in front
    toScreen(0.9);
    const m2 = (t * 26) % VW;
    ctx.globalAlpha = alpha * 0.8;
    ctx.drawImage(a.mist, -m2, VH * 0.8, VW, 260);
    ctx.drawImage(a.mist, VW - m2, VH * 0.8, VW, 260);
    ctx.globalAlpha = alpha;
    // big foreground leaves in the corners, swaying
    toScreen(1.1);
    const leaves: [number, number, number, number, number][] = [
      [-60, VH * 0.08, 0.45, 0, 1],
      [-40, VH * 0.95, -0.5, 1, 1.1],
      [VW + 60, VH * 0.1, Math.PI - 0.45, 1, 1],
      [VW + 40, VH * 0.92, Math.PI + 0.55, 0, 1.15],
      [-80, VH * 0.55, 0.05, 1, 0.8],
      [VW + 80, VH * 0.6, Math.PI - 0.05, 0, 0.85],
    ];
    leaves.forEach(([x, y, rot, v, sc], i) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot + Math.sin(t * 0.6 + i * 1.3) * 0.035);
      ctx.scale(sc, rot > Math.PI / 2 ? -sc : sc);
      ctx.drawImage(a.leaves[v], -20, -150);
      ctx.restore();
    });
    // vignette
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = rad(ctx, w / 2, h / 2, Math.min(w, h) * 0.35, Math.max(w, h) * 0.75, [
      [0, 'rgba(0,0,0,0)'],
      [1, 'rgba(0,0,0,0.55)'],
    ]);
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }
}
