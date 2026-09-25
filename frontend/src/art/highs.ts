/**
 * Premium symbols H1–H4 and the wild, painted as carved temple treasures:
 * a stepped gold cartouche with a coloured stone field, the figure sculpted in gold / jade /
 * turquoise on top of it (and breaking out of the frame).
 */
import { Ctx, INK, MAT, Stops, blob, bevel, circle, curve, engrave, gloss, lg, oval, path, rg, solid, sparkle, texture, dropShadow, noShadow } from './kit';

type P2 = [number, number];

// ------------------------------------------------------------------ frame
function stepped(x0: number, y0: number, x1: number, y1: number, st: number): Path2D {
  const s2 = st * 2;
  return path([
    [x0 + s2, y0],
    [x1 - s2, y0],
    [x1 - s2, y0 + st],
    [x1 - st, y0 + st],
    [x1 - st, y0 + s2],
    [x1, y0 + s2],
    [x1, y1 - s2],
    [x1 - st, y1 - s2],
    [x1 - st, y1 - st],
    [x1 - s2, y1 - st],
    [x1 - s2, y1],
    [x0 + s2, y1],
    [x0 + s2, y1 - st],
    [x0 + st, y1 - st],
    [x0 + st, y1 - s2],
    [x0, y1 - s2],
    [x0, y0 + s2],
    [x0 + st, y0 + s2],
    [x0 + st, y0 + st],
    [x0 + s2, y0 + st],
  ]);
}

/** gold stepped cartouche with a coloured stone field and carved fret pattern */
function cartouche(ctx: Ctx, field: Stops, glow: string) {
  const outer = stepped(18, 22, 238, 242, 12);
  solid(ctx, outer, MAT.gold, { y0: 22, y1: 242, shadow: 18, bevel: 5, tex: 0.14, line: 4 });
  const inner = stepped(32, 36, 224, 228, 9);
  ctx.fillStyle = rg(ctx, 128, 120, 10, 140, field);
  ctx.fill(inner);
  texture(ctx, inner, 0.22);
  // carved fret border inside the field
  ctx.save();
  ctx.clip(inner);
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    const x = 44 + i * 24;
    ctx.strokeRect(x, 44, 12, 8);
    ctx.strokeRect(x, 212, 12, 8);
  }
  // soft light behind the figure
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = rg(ctx, 128, 118, 4, 110, [
    [0, glow],
    [1, 'rgba(0,0,0,0)'],
  ]);
  ctx.fillRect(0, 0, 256, 256);
  ctx.restore();
  engrave(ctx, inner, 5, 'rgba(0,0,0,0.75)', 'rgba(255,240,200,0.25)');
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.stroke(inner);
  // rivets on the rim
  for (const [x, y] of [
    [128, 29],
    [128, 235],
    [25, 132],
    [231, 132],
  ] as P2[]) {
    solid(ctx, circle(x, y, 4.5), MAT.turquoise, { y0: y - 5, y1: y + 5, bevel: 1.5, tex: 0, line: 1.5 });
  }
}

function feather(ctx: Ctx, x: number, y: number, len: number, w: number, ang: number, mat: Stops) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const p = blob(
    [
      [0, 0],
      [w * 0.55, -len * 0.3],
      [w * 0.5, -len * 0.75],
      [0, -len],
      [-w * 0.5, -len * 0.75],
      [-w * 0.55, -len * 0.3],
    ],
    0.9,
  );
  solid(ctx, p, mat, { y0: -len, y1: 0, bevel: 3, tex: 0.1, line: 3 });
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(0, -len * 0.9);
  ctx.stroke();
  // eye of the feather
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, -len * 0.72, w * 0.18, len * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------ H1 jaguar
export function drawJaguar2(ctx: Ctx) {
  cartouche(ctx, [
    [0, '#c2402c'],
    [0.6, '#6d1410'],
    [1, '#2a0604'],
  ], 'rgba(255,170,90,0.55)');
  const c = 128;
  // feather crown
  const fm = [MAT.turquoise, MAT.crimson, MAT.gold, MAT.turquoise, MAT.gold, MAT.crimson, MAT.turquoise];
  fm.forEach((m, i) => feather(ctx, c, 120, 116, 36, (i - 3) * 0.27, m));
  // ears
  for (const sx of [-1, 1]) {
    const ear = blob([
      [c + sx * 40, 76],
      [c + sx * 64, 42],
      [c + sx * 84, 56],
      [c + sx * 80, 90],
    ], 0.8);
    solid(ctx, ear, MAT.gold, { y0: 40, y1: 92, bevel: 4, line: 4 });
    const ein = blob([
      [c + sx * 50, 76],
      [c + sx * 65, 54],
      [c + sx * 76, 62],
      [c + sx * 73, 84],
    ], 0.8);
    ctx.fillStyle = lg(ctx, 0, 50, 0, 86, MAT.crimson);
    ctx.fill(ein);
    engrave(ctx, ein, 3);
  }
  // head
  const head = blob([
    [c, 56],
    [c + 44, 62],
    [c + 72, 92],
    [c + 76, 128],
    [c + 62, 164],
    [c + 36, 192],
    [c, 202],
    [c - 36, 192],
    [c - 62, 164],
    [c - 76, 128],
    [c - 72, 92],
    [c - 44, 62],
  ], 0.9);
  solid(ctx, head, MAT.gold, { y0: 56, y1: 204, shadow: 14, bevel: 7, tex: 0.2, line: 5 });
  // rosettes (obsidian inlays)
  const ros: [number, number, number][] = [
    [c - 30, 80, 7],
    [c + 30, 80, 7],
    [c, 72, 6],
    [c - 54, 108, 6],
    [c + 54, 108, 6],
    [c - 58, 146, 6],
    [c + 58, 146, 6],
    [c - 14, 92, 4.5],
    [c + 14, 92, 4.5],
  ];
  for (const [x, y, r] of ros) {
    const ring = new Path2D();
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + 0.4;
      ring.addPath(oval(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9, r * 0.55, r * 0.4, a));
    }
    ctx.fillStyle = '#3a1e05';
    ctx.fill(ring);
    engrave(ctx, ring, 1.5, 'rgba(0,0,0,0.6)', 'rgba(255,230,150,0.4)');
  }
  // tear lines under the eyes (jaguar markings)
  for (const sx of [-1, 1]) {
    const tl = path([
      [c + sx * 22, 130],
      [c + sx * 30, 128],
      [c + sx * 26, 156],
      [c + sx * 22, 154],
    ]);
    ctx.fillStyle = '#3a1e05';
    ctx.fill(tl);
  }
  // muzzle
  const muz = blob([
    [c, 134],
    [c + 30, 142],
    [c + 40, 166],
    [c + 24, 188],
    [c, 194],
    [c - 24, 188],
    [c - 40, 166],
    [c - 30, 142],
  ], 0.9);
  solid(ctx, muz, [
    [0, '#fff8dc'],
    [0.5, '#f3d488'],
    [1, '#b98a30'],
  ], { y0: 134, y1: 194, bevel: 5, tex: 0.1, line: 3.5 });
  // whisker dots
  ctx.fillStyle = '#5a3208';
  for (const sx of [-1, 1]) for (const [dx, dy] of [[16, 158], [24, 166], [14, 170]] as P2[]) ctx.fillRect(c + sx * dx - 1.8, dy - 1.8, 3.6, 3.6);
  // nose (obsidian)
  const nose = blob([
    [c - 17, 136],
    [c + 17, 136],
    [c + 6, 154],
    [c - 6, 154],
  ], 0.6);
  solid(ctx, nose, MAT.obsidian, { y0: 134, y1: 156, bevel: 2.5, tex: 0, line: 3 });
  gloss(ctx, c - 5, 140, 7, 3, 0.7, 0);
  // mouth + fangs
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(c, 155);
  ctx.lineTo(c, 170);
  ctx.moveTo(c - 26, 172);
  ctx.quadraticCurveTo(c - 12, 182, c, 170);
  ctx.quadraticCurveTo(c + 12, 182, c + 26, 172);
  ctx.stroke();
  for (const sx of [-1, 1]) {
    const f = path([
      [c + sx * 12, 176],
      [c + sx * 22, 175],
      [c + sx * 16, 198],
    ]);
    solid(ctx, f, [
      [0, '#ffffff'],
      [1, '#d9d0b8'],
    ], { y0: 175, y1: 198, bevel: 1.5, tex: 0, line: 2.5 });
  }
  // eyes: jade gems with slit pupils
  for (const sx of [-1, 1]) {
    const ex = c + sx * 34;
    const eye = blob([
      [ex - sx * 20, 120],
      [ex - sx * 2, 106],
      [ex + sx * 22, 100],
      [ex + sx * 14, 116],
      [ex - sx * 6, 124],
    ], 0.7);
    ctx.save();
    dropShadow(ctx, 12, 0, 0.0);
    ctx.shadowColor = 'rgba(90,255,190,0.9)';
    ctx.fillStyle = rg(ctx, ex, 112, 2, 24, [
      [0, '#eafff5'],
      [0.35, '#5ff0b0'],
      [1, '#0a6a48'],
    ]);
    ctx.fill(eye);
    ctx.restore();
    noShadow(ctx);
    ctx.fillStyle = '#0b0703';
    ctx.fill(oval(ex, 114, 3.2, 10));
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = INK;
    ctx.stroke(eye);
    gloss(ctx, ex - 6, 108, 6, 3, 0.9, -0.3);
  }
  // fierce brows (angled down towards the nose)
  for (const sx of [-1, 1]) {
    const brow = path([
      [c + sx * 8, 104],
      [c + sx * 62, 86],
      [c + sx * 60, 94],
      [c + sx * 12, 110],
    ]);
    ctx.fillStyle = '#4a2604';
    ctx.fill(brow);
  }
  // cheek shading for volume
  ctx.save();
  ctx.clip(head);
  ctx.globalCompositeOperation = 'multiply';
  for (const sx of [-1, 1]) {
    ctx.fillStyle = rg(ctx, c + sx * 70, 150, 4, 50, [
      [0, 'rgba(150,70,0,0.55)'],
      [1, 'rgba(150,70,0,0)'],
    ]);
    ctx.fillRect(0, 0, 256, 256);
  }
  ctx.restore();
  gloss(ctx, c - 34, 76, 30, 12, 0.5, -0.4, head);
  sparkle(ctx, c - 48, 84, 12);
}

// ------------------------------------------------------------------ H2 quetzal
export function drawQuetzal2(ctx: Ctx) {
  cartouche(ctx, [
    [0, '#1aa3a6'],
    [0.6, '#0a4b55'],
    [1, '#04202a'],
  ], 'rgba(140,255,230,0.5)');
  // branch
  const br = blob([
    [30, 196],
    [120, 188],
    [226, 196],
    [226, 208],
    [120, 202],
    [30, 210],
  ], 0.5);
  solid(ctx, br, [
    [0, '#c98a4a'],
    [1, '#4a2410'],
  ], { y0: 188, y1: 210, bevel: 3, tex: 0.3, line: 3.5 });
  // long tail feathers (break out of the frame at the bottom right)
  const tails: [P2[], Stops][] = [
    [[[146, 170], [180, 196], [214, 222], [246, 248]], MAT.jade],
    [[[140, 176], [166, 206], [190, 234], [210, 254]], [[0, '#8dffcf'], [0.5, '#12a06a'], [1, '#04402a']]],
    [[[152, 164], [196, 184], [230, 204], [254, 222]], [[0, '#b4ffe0'], [0.6, '#1fb07a'], [1, '#054a30']]],
  ];
  for (const [pts, m] of tails) {
    const cv = curve(pts, 0.6);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 20;
    ctx.stroke(cv);
    ctx.strokeStyle = lg(ctx, pts[0][0], pts[0][1], pts[3][0], pts[3][1], m);
    ctx.lineWidth = 14;
    ctx.stroke(cv);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    ctx.translate(-2, -3);
    ctx.stroke(cv);
    ctx.restore();
  }
  // body
  const body = blob([
    [118, 80],
    [150, 88],
    [170, 118],
    [168, 156],
    [148, 184],
    [118, 188],
    [98, 164],
    [96, 118],
  ], 0.9);
  solid(ctx, body, MAT.jade, { y0: 80, y1: 190, shadow: 12, bevel: 6, tex: 0.16, line: 4.5 });
  // red breast
  const breast = blob([
    [100, 138],
    [122, 132],
    [138, 158],
    [130, 186],
    [108, 180],
    [98, 160],
  ], 0.9);
  solid(ctx, breast, MAT.crimson, { y0: 130, y1: 188, bevel: 4, tex: 0.12, line: 3.5 });
  // wing with scalloped feathers
  const wing = blob([
    [128, 102],
    [166, 110],
    [186, 146],
    [176, 178],
    [146, 164],
    [130, 130],
  ], 0.9);
  solid(ctx, wing, [
    [0, '#7ff2c4'],
    [0.5, '#0f8a5c'],
    [1, '#033a24'],
  ], { y0: 100, y1: 180, bevel: 5, tex: 0.15, line: 4 });
  ctx.save();
  ctx.clip(wing);
  ctx.strokeStyle = 'rgba(0,40,20,0.55)';
  ctx.lineWidth = 2.5;
  for (let row = 0; row < 4; row++)
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc(138 + k * 14 + row * 6, 118 + row * 16, 9, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
  ctx.restore();
  // head + crest
  for (let i = 0; i < 4; i++) feather(ctx, 116 + i * 6, 58, 30 - i * 3, 12, -0.6 + i * 0.35, MAT.jade);
  const head = circle(114, 76, 28);
  solid(ctx, head, MAT.jade, { y0: 48, y1: 104, bevel: 5, tex: 0.12, line: 4.5 });
  // beak (gold)
  const beak = blob([
    [90, 72],
    [72, 84],
    [92, 90],
  ], 0.3);
  solid(ctx, beak, MAT.gold, { y0: 70, y1: 92, bevel: 2, tex: 0, line: 3 });
  // eye
  solid(ctx, circle(108, 72, 8), MAT.gold, { y0: 64, y1: 80, bevel: 1.5, tex: 0, line: 2.5 });
  ctx.fillStyle = '#0b0703';
  ctx.fill(circle(108, 72, 4.6));
  ctx.fillStyle = '#fff';
  ctx.fill(circle(106, 70, 1.8));
  gloss(ctx, 104, 62, 12, 5, 0.6, -0.4, head);
  gloss(ctx, 118, 100, 16, 7, 0.4, -0.6, body);
  sparkle(ctx, 88, 58, 11);
}

// ------------------------------------------------------------------ H3 feathered serpent
export function drawSerpent2(ctx: Ctx) {
  cartouche(ctx, [
    [0, '#7a3fc0'],
    [0.6, '#321463'],
    [1, '#12062a'],
  ], 'rgba(220,160,255,0.45)');
  // coiled body (tube)
  const bodyPts: P2[] = [
    [26, 246],
    [48, 212],
    [92, 206],
    [136, 214],
    [176, 196],
    [178, 160],
    [140, 146],
    [96, 150],
    [70, 128],
    [90, 104],
    [140, 108],
  ];
  const body = curve(bodyPts, 0.7);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  dropShadow(ctx, 12, 6, 0.6);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 36;
  ctx.stroke(body);
  noShadow(ctx);
  ctx.strokeStyle = '#0d7a8a';
  ctx.lineWidth = 30;
  ctx.stroke(body);
  // scale bands
  ctx.setLineDash([6, 7]);
  ctx.strokeStyle = 'rgba(8,50,70,0.75)';
  ctx.lineWidth = 30;
  ctx.stroke(body);
  ctx.setLineDash([]);
  // light core (round tube)
  ctx.translate(-2, -3);
  ctx.strokeStyle = 'rgba(120,240,245,0.6)';
  ctx.lineWidth = 14;
  ctx.stroke(body);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 4;
  ctx.translate(-2, -3);
  ctx.stroke(body);
  ctx.restore();
  // gold belly stripe dots
  ctx.save();
  ctx.setLineDash([2, 16]);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#ffd35a';
  ctx.lineWidth = 7;
  ctx.translate(3, 5);
  ctx.stroke(body);
  ctx.restore();
  // feather collar around the neck
  const nx = 150;
  const ny = 100;
  const cm = [MAT.crimson, MAT.turquoise, MAT.gold, MAT.crimson, MAT.turquoise, MAT.gold, MAT.crimson];
  cm.forEach((m, i) => feather(ctx, nx + 4, ny - 4, 54, 22, -0.35 - i * 0.4, m));
  // head
  const head = blob([
    [150, 66],
    [186, 50],
    [222, 58],
    [236, 78],
    [214, 92],
    [176, 96],
    [150, 88],
  ], 0.8);
  // lower jaw (open)
  const jaw = blob([
    [160, 100],
    [206, 100],
    [228, 114],
    [192, 122],
    [162, 114],
  ], 0.7);
  solid(ctx, jaw, [
    [0, '#6fe6ee'],
    [1, '#0a5a6a'],
  ], { y0: 98, y1: 124, bevel: 3, tex: 0.12, line: 4 });
  // mouth inside
  const mouth = path([
    [170, 94],
    [226, 86],
    [226, 106],
    [172, 104],
  ]);
  ctx.fillStyle = '#5a0a10';
  ctx.fill(mouth);
  // tongue
  ctx.strokeStyle = '#e8303a';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(206, 98);
  ctx.lineTo(240, 100);
  ctx.moveTo(240, 100);
  ctx.lineTo(250, 94);
  ctx.moveTo(240, 100);
  ctx.lineTo(250, 106);
  ctx.stroke();
  // fangs
  for (const fx of [186, 210]) {
    solid(ctx, path([[fx - 4, 88], [fx + 4, 88], [fx, 104]]), [[0, '#fff'], [1, '#d9d0b8']], { y0: 88, y1: 104, bevel: 1, tex: 0, line: 2 });
  }
  solid(ctx, head, [
    [0, '#b8fbff'],
    [0.4, '#2cc0d0'],
    [1, '#085060'],
  ], { y0: 48, y1: 98, shadow: 10, bevel: 5, tex: 0.14, line: 4.5 });
  // gold brow plate + scales
  const brow = blob([
    [168, 62],
    [196, 52],
    [214, 60],
    [196, 68],
  ], 0.7);
  solid(ctx, brow, MAT.gold, { y0: 50, y1: 70, bevel: 2, tex: 0, line: 2.5 });
  ctx.fillStyle = 'rgba(6,60,70,0.6)';
  for (const [x, y] of [[166, 80], [178, 82], [190, 80], [158, 74]] as P2[]) ctx.fill(oval(x, y, 4, 3));
  // eye
  ctx.save();
  ctx.shadowColor = 'rgba(255,200,60,0.9)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = rg(ctx, 200, 70, 1, 9, [
    [0, '#fff6c0'],
    [1, '#e0a020'],
  ]);
  ctx.fill(oval(200, 70, 8, 6));
  ctx.restore();
  ctx.fillStyle = '#0b0703';
  ctx.fill(oval(200, 70, 2, 5.5));
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = INK;
  ctx.stroke(oval(200, 70, 8, 6));
  ctx.fillStyle = '#062a30';
  ctx.fill(oval(228, 70, 2.5, 2));
  gloss(ctx, 180, 58, 20, 6, 0.55, -0.2, head);
  sparkle(ctx, 64, 110, 11);
}

// ------------------------------------------------------------------ H4 frog idol
export function drawFrog2(ctx: Ctx) {
  cartouche(ctx, [
    [0, '#2a5fb8'],
    [0.6, '#10275a'],
    [1, '#050c22'],
  ], 'rgba(150,200,255,0.5)');
  const c = 128;
  // back legs
  for (const sx of [-1, 1]) {
    const leg = blob([
      [c + sx * 40, 150],
      [c + sx * 82, 160],
      [c + sx * 90, 200],
      [c + sx * 60, 214],
      [c + sx * 34, 196],
    ], 0.9);
    solid(ctx, leg, MAT.jade, { y0: 150, y1: 216, bevel: 5, tex: 0.2, line: 4 });
    ctx.save();
    ctx.clip(leg);
    ctx.strokeStyle = 'rgba(0,50,30,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(c + sx * 64, 188, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  // body
  const body = blob([
    [c, 86],
    [c + 48, 96],
    [c + 70, 136],
    [c + 62, 180],
    [c + 34, 208],
    [c, 214],
    [c - 34, 208],
    [c - 62, 180],
    [c - 70, 136],
    [c - 48, 96],
  ], 0.9);
  solid(ctx, body, MAT.jade, { y0: 86, y1: 214, shadow: 14, bevel: 7, tex: 0.22, line: 5 });
  // belly with a gold step-fret inlay
  const belly = blob([
    [c, 150],
    [c + 34, 160],
    [c + 36, 190],
    [c, 204],
    [c - 36, 190],
    [c - 34, 160],
  ], 0.9);
  ctx.fillStyle = lg(ctx, 0, 150, 0, 204, [
    [0, '#9ff5d0'],
    [1, '#2a9a70'],
  ]);
  ctx.fill(belly);
  engrave(ctx, belly, 3);
  const fret = new Path2D();
  const fx0 = c - 22;
  const fy = 176;
  fret.moveTo(fx0, fy + 8);
  for (let i = 0; i < 4; i++) {
    const x = fx0 + i * 12;
    fret.lineTo(x, fy);
    fret.lineTo(x + 8, fy);
    fret.lineTo(x + 8, fy + 8);
    fret.lineTo(x + 12, fy + 8);
  }
  ctx.strokeStyle = '#ffd35a';
  ctx.lineWidth = 3.5;
  ctx.stroke(fret);
  // turquoise spots on the back
  for (const [x, y, r] of [[c - 44, 126, 7], [c + 44, 126, 7], [c - 30, 150, 5], [c + 30, 150, 5]] as [number, number, number][]) {
    solid(ctx, circle(x, y, r), MAT.turquoise, { y0: y - r, y1: y + r, bevel: 1.5, tex: 0, line: 2 });
  }
  // mouth
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(c - 40, 134);
  ctx.quadraticCurveTo(c, 156, c + 40, 134);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,255,230,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(c - 36, 139);
  ctx.quadraticCurveTo(c, 159, c + 36, 139);
  ctx.stroke();
  // front feet
  for (const sx of [-1, 1]) {
    const foot = blob([
      [c + sx * 20, 196],
      [c + sx * 44, 200],
      [c + sx * 50, 218],
      [c + sx * 16, 220],
    ], 0.8);
    solid(ctx, foot, MAT.jade, { y0: 196, y1: 222, bevel: 3, tex: 0.1, line: 3.5 });
    ctx.fillStyle = 'rgba(0,50,30,0.6)';
    for (let t = 0; t < 3; t++) ctx.fillRect(c + sx * (24 + t * 8) - 1, 210, 2, 9);
  }
  // bulging gold eyes
  for (const sx of [-1, 1]) {
    const ex = c + sx * 36;
    solid(ctx, circle(ex, 96, 25), MAT.jade, { y0: 70, y1: 122, bevel: 5, tex: 0.15, line: 4.5 });
    solid(ctx, circle(ex, 94, 17), MAT.gold, { y0: 77, y1: 111, bevel: 3, tex: 0.08, line: 3.5 });
    ctx.fillStyle = '#0b0703';
    ctx.fill(oval(ex, 95, 10, 5.5));
    gloss(ctx, ex - 6, 87, 7, 4, 0.9, -0.3);
  }
  gloss(ctx, c - 30, 110, 30, 12, 0.45, -0.3, body);
  sparkle(ctx, c + 60, 90, 11);
}

// ------------------------------------------------------------------ Wild: sun stone
export function drawWild2(ctx: Ctx) {
  const c = 128;
  const cy = 118;
  // rays
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const long = i % 2 === 0;
    const R = long ? 118 : 100;
    const w = long ? 0.2 : 0.16;
    const p = path([
      [c + Math.cos(a - w) * 80, cy + Math.sin(a - w) * 80],
      [c + Math.cos(a) * R, cy + Math.sin(a) * R],
      [c + Math.cos(a + w) * 80, cy + Math.sin(a + w) * 80],
    ]);
    solid(ctx, p, long ? MAT.gold : MAT.goldDeep, { y0: cy - R, y1: cy + R, shadow: long ? 10 : 0, bevel: 3, tex: 0.1, line: 3 });
  }
  // outer gold disc
  const disc = circle(c, cy, 86);
  solid(ctx, disc, MAT.gold, { y0: cy - 86, y1: cy + 86, shadow: 14, bevel: 6, tex: 0.16, line: 4.5 });
  // turquoise glyph ring
  const ring = new Path2D();
  ring.arc(c, cy, 74, 0, Math.PI * 2);
  ring.arc(c, cy, 56, 0, Math.PI * 2, true);
  ctx.fillStyle = lg(ctx, 0, cy - 74, 0, cy + 74, MAT.turquoise);
  ctx.fill(ring);
  texture(ctx, ring, 0.2);
  engrave(ctx, ring, 3);
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.stroke(ring);
  // carved glyph blocks in the ring
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    ctx.save();
    ctx.translate(c + Math.cos(a) * 65, cy + Math.sin(a) * 65);
    ctx.rotate(a + Math.PI / 2);
    const g = i % 2 ? rrectP(-4, -4, 8, 8, 1.5) : rrectP(-6, -3, 12, 6, 2);
    ctx.fillStyle = 'rgba(4,40,50,0.7)';
    ctx.fill(g);
    ctx.restore();
  }
  // inner face disc
  const face = circle(c, cy, 54);
  solid(ctx, face, [
    [0, '#fff6c8'],
    [0.4, '#f2c045'],
    [1, '#a0600a'],
  ], { y0: cy - 54, y1: cy + 54, bevel: 6, tex: 0.12, line: 4 });
  // face: brows, eyes, nose, mouth with obsidian tongue, jade ear spools
  ctx.strokeStyle = '#6a3a04';
  ctx.lineWidth = 4;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(c + sx * 8, cy - 22);
    ctx.quadraticCurveTo(c + sx * 22, cy - 30, c + sx * 36, cy - 20);
    ctx.stroke();
    const eye = oval(c + sx * 20, cy - 10, 10, 6);
    ctx.fillStyle = '#fff8e0';
    ctx.fill(eye);
    ctx.fillStyle = '#140a02';
    ctx.fill(circle(c + sx * 20, cy - 10, 4));
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke(eye);
    solid(ctx, circle(c + sx * 46, cy + 6, 8), MAT.jade, { y0: cy - 2, y1: cy + 14, bevel: 2, tex: 0, line: 2.5 });
  }
  const nose = path([
    [c - 6, cy - 8],
    [c + 6, cy - 8],
    [c + 9, cy + 10],
    [c - 9, cy + 10],
  ]);
  ctx.fillStyle = 'rgba(120,70,5,0.55)';
  ctx.fill(nose);
  const mouth = rrectP(c - 18, cy + 18, 36, 12, 5);
  ctx.fillStyle = '#3a1504';
  ctx.fill(mouth);
  const tongue = path([
    [c - 7, cy + 24],
    [c + 7, cy + 24],
    [c, cy + 48],
  ]);
  solid(ctx, tongue, MAT.obsidian, { y0: cy + 22, y1: cy + 48, bevel: 2, tex: 0, line: 2.5 });
  ctx.fillStyle = '#fff8e0';
  for (const sx of [-1, 1]) ctx.fillRect(c + sx * 12 - 3, cy + 19, 6, 5);
  gloss(ctx, c - 22, cy - 34, 24, 10, 0.55, -0.4, face);
  // WILD ribbon
  const rib = path([
    [36, 206],
    [220, 206],
    [236, 226],
    [220, 246],
    [36, 246],
    [20, 226],
  ]);
  solid(ctx, rib, MAT.crimson, { y0: 206, y1: 246, shadow: 10, bevel: 4, tex: 0.14, line: 4 });
  ctx.lineWidth = 3;
  ctx.strokeStyle = lg(ctx, 0, 206, 0, 246, MAT.gold);
  const ribIn = path([
    [42, 211],
    [216, 211],
    [229, 226],
    [216, 241],
    [42, 241],
    [27, 226],
  ]);
  ctx.stroke(ribIn);
  ctx.save();
  ctx.font = '900 32px Cinzel, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  (ctx as any).letterSpacing = '4px';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#2a0402';
  ctx.strokeText('WILD', c + 2, 229);
  ctx.fillStyle = lg(ctx, 0, 214, 0, 242, [
    [0, '#fffbe0'],
    [0.5, '#ffd35a'],
    [1, '#c8861a'],
  ]);
  ctx.fillText('WILD', c + 2, 229);
  ctx.restore();
  sparkle(ctx, c - 58, cy - 62, 13);
}

function rrectP(x: number, y: number, w: number, h: number, r: number): Path2D {
  const p = new Path2D();
  p.roundRect(x, y, w, h, r);
  return p;
}
export { bevel };
