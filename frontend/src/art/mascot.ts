/**
 * "Balam" – the jaguar mascot that lies on top of the reel frame.
 * Drawn in parts so it can be animated: body (with paws), head (several faces), tail.
 */
import { lin, makeCanvas, rad } from './draw';

const INK = '#241204';
const FUR = (ctx: CanvasRenderingContext2D, y0: number, y1: number) =>
  lin(ctx, 0, y0, 0, y1, [
    [0, '#ffd27a'],
    [0.45, '#f0a02a'],
    [1, '#b8610c'],
  ]);

function rosette(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    ctx.moveTo(x + Math.cos(a) * r + 2.2, y + Math.sin(a) * r);
    ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 2.2, 0, Math.PI * 2);
  }
  ctx.fillStyle = '#4a2204';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(120,60,10,0.6)';
  ctx.fill();
}

/** Lying body seen from the front-side, 420×170. The head sits at x≈95, y≈70 (drawn separately). */
export function drawMascotBody(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(420, 170);
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  // body
  ctx.beginPath();
  ctx.moveTo(60, 128);
  ctx.bezierCurveTo(70, 60, 170, 44, 260, 52);
  ctx.bezierCurveTo(340, 56, 400, 80, 404, 124);
  ctx.bezierCurveTo(404, 138, 390, 142, 370, 142);
  ctx.lineTo(80, 142);
  ctx.bezierCurveTo(62, 142, 58, 136, 60, 128);
  ctx.closePath();
  ctx.fillStyle = FUR(ctx, 44, 142);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.stroke();
  // belly light
  ctx.beginPath();
  ctx.moveTo(100, 138);
  ctx.bezierCurveTo(160, 118, 300, 118, 370, 136);
  ctx.lineTo(370, 141);
  ctx.lineTo(100, 141);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,240,205,0.75)';
  ctx.fill();
  // rosettes
  const spots: [number, number, number][] = [
    [150, 76, 8], [190, 66, 7], [232, 70, 8], [276, 66, 7], [318, 76, 8], [356, 92, 7],
    [170, 100, 7], [214, 96, 8], [258, 96, 7], [302, 100, 8], [340, 112, 6], [128, 104, 6],
  ];
  for (const [x, y, r] of spots) rosette(ctx, x, y, r);
  // hind leg bump
  ctx.beginPath();
  ctx.ellipse(350, 118, 40, 26, -0.2, Math.PI * 1.05, Math.PI * 1.95);
  ctx.strokeStyle = 'rgba(80,35,5,0.6)';
  ctx.lineWidth = 3;
  ctx.stroke();
  // front paws hanging over the frame edge
  for (const x of [118, 172]) {
    ctx.beginPath();
    ctx.roundRect(x - 18, 118, 36, 46, 16);
    ctx.fillStyle = FUR(ctx, 118, 164);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(60,25,0,0.7)';
    ctx.lineWidth = 2.5;
    for (const dx of [-7, 0, 7]) {
      ctx.beginPath();
      ctx.moveTo(x + dx, 154);
      ctx.lineTo(x + dx, 162);
      ctx.stroke();
    }
  }
  // gold arm bands (warrior jewellery)
  for (const x of [118, 172]) {
    ctx.fillStyle = lin(ctx, 0, 124, 0, 134, [
      [0, '#fff3b0'],
      [1, '#b8800f'],
    ]);
    ctx.fillRect(x - 18, 124, 36, 8);
    ctx.fillStyle = '#1fc1c9';
    ctx.fillRect(x - 4, 125, 8, 6);
  }
  return c;
}

/** Tail hanging down, 90×220, pivot at the top (x≈20, y≈10). */
export function drawMascotTail(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(90, 220);
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(20, 10);
    ctx.bezierCurveTo(60, 50, 10, 110, 40, 160);
    ctx.bezierCurveTo(55, 185, 75, 190, 70, 205);
  };
  path();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 24;
  ctx.stroke();
  path();
  ctx.strokeStyle = FUR(ctx, 0, 220);
  ctx.lineWidth = 17;
  ctx.stroke();
  // rings
  path();
  ctx.setLineDash([6, 16]);
  ctx.strokeStyle = '#3a1a04';
  ctx.lineWidth = 17;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(70, 205, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#2a1204';
  ctx.fill();
  return c;
}

export type Face = 'open' | 'closed' | 'happy' | 'roar';

/** Head, 190×210, face centre ≈ (95, 128). */
export function drawMascotHead(face: Face, glowEyes = false): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(190, 210);
  const cx = 95;
  const cy = 128;
  // feather crest
  const feathers = ['#e8423c', '#1fc1c9', '#f4c542', '#1fc1c9', '#e8423c'];
  feathers.forEach((col, i) => {
    ctx.save();
    ctx.translate(cx, cy - 20);
    ctx.rotate((i - 2) * 0.3);
    ctx.beginPath();
    ctx.ellipse(0, -62, 9, 26, 0, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  });
  // ears
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + sx * 48, cy - 44, 20, 22, sx * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#d98a18';
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx + sx * 48, cy - 42, 10, 12, sx * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#5a2a05';
    ctx.fill();
  }
  // head shape
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 62, cy - 24);
  ctx.quadraticCurveTo(cx, cy - 70, cx + 62, cy - 24);
  ctx.quadraticCurveTo(cx + 74, cy + 30, cx + 28, cy + 64);
  ctx.quadraticCurveTo(cx, cy + 76, cx - 28, cy + 64);
  ctx.quadraticCurveTo(cx - 74, cy + 30, cx - 62, cy - 24);
  ctx.closePath();
  ctx.fillStyle = FUR(ctx, cy - 70, cy + 70);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.stroke();
  // forehead rosettes
  for (const [x, y] of [
    [-34, -30],
    [-12, -44],
    [12, -44],
    [34, -30],
    [0, -26],
    [-48, 4],
    [48, 4],
  ])
    rosette(ctx, cx + x, cy + y, 5);
  // muzzle
  ctx.fillStyle = '#fff1d0';
  ctx.beginPath();
  ctx.ellipse(cx - 14, cy + 30, 19, 15, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 14, cy + 30, 19, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  // eyes
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(cx + sx * 26, cy - 6);
    ctx.rotate(sx * -0.2);
    if (face === 'closed') {
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.quadraticCurveTo(0, 7, 14, 0);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4;
      ctx.stroke();
    } else if (face === 'happy') {
      ctx.beginPath();
      ctx.moveTo(-14, 4);
      ctx.quadraticCurveTo(0, -10, 14, 4);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4.5;
      ctx.stroke();
    } else {
      const big = face === 'roar';
      ctx.beginPath();
      ctx.ellipse(0, 0, big ? 17 : 15, big ? 11 : 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = rad(ctx, 0, 0, 1, 16, glowEyes
        ? [
            [0, '#ffffff'],
            [0.4, '#7ff3ff'],
            [1, '#1aa6c9'],
          ]
        : [
            [0, '#eafff6'],
            [0.4, '#5ef0b0'],
            [1, '#128a5a'],
          ]);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(1, 0, big ? 2.5 : 3.2, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#0b0b0b';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-5, -4, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
    ctx.restore();
  }
  // nose
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy + 12);
  ctx.lineTo(cx + 12, cy + 12);
  ctx.lineTo(cx, cy + 25);
  ctx.closePath();
  ctx.fillStyle = '#6b2c1a';
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke();
  // mouth
  if (face === 'roar') {
    ctx.beginPath();
    ctx.ellipse(cx, cy + 50, 24, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#5a0c14';
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + sx * 16, cy + 36);
      ctx.lineTo(cx + sx * 8, cy + 36);
      ctx.lineTo(cx + sx * 12, cy + 50);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + sx * 16, cy + 66);
      ctx.lineTo(cx + sx * 8, cy + 66);
      ctx.lineTo(cx + sx * 12, cy + 54);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(cx, cy + 58, 10, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#e8526a';
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy + 38);
    ctx.quadraticCurveTo(cx - 5, cy + (face === 'happy' ? 50 : 44), cx, cy + 36);
    ctx.quadraticCurveTo(cx + 5, cy + (face === 'happy' ? 50 : 44), cx + 14, cy + 38);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
    // little fangs
    ctx.fillStyle = '#fff';
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + sx * 6, cy + 40);
      ctx.lineTo(cx + sx * 11, cy + 40);
      ctx.lineTo(cx + sx * 8.5, cy + 48);
      ctx.fill();
    }
  }
  // gold nose ring (warrior)
  ctx.beginPath();
  ctx.arc(cx, cy + 27, 5, 0.2, Math.PI - 0.2);
  ctx.strokeStyle = '#ffd35a';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // whisker dots
  ctx.fillStyle = '#4a2204';
  for (const sx of [-1, 1]) for (const [dx, dy] of [
    [12, 26],
    [20, 32],
    [14, 36],
  ]) {
    ctx.beginPath();
    ctx.arc(cx + sx * dx, cy + dy, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  return c;
}
