import { Texture } from 'pixi.js';
import { ALL_SYMBOLS, drawSymbol, makeCanvas, rad, SYM } from './draw';

/** All generated textures, created once after fonts are loaded. */
export const TEX: {
  sym: Record<string, Texture>;
  blur: Record<string, Texture>;
  glow: Texture;
  dot: Texture;
  spark: Texture;
  coin: Texture;
  dust: Texture;
  rune: Texture;
  cell: Texture;
} = {} as any;

/** Symbol canvases (kept for DOM uses, e.g. the rune that flies to the pyramid). */
export const SYM_CANVAS: Record<string, HTMLCanvasElement> = {};

function motionBlur(src: HTMLCanvasElement): HTMLCanvasElement {
  // the blurred copy is only seen while spinning – half resolution is plenty
  const [c, ctx] = makeCanvas(SYM);
  const n = 9;
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = 0.22;
    ctx.drawImage(src, 0, (i - (n - 1) / 2) * 7, SYM, SYM);
  }
  return c;
}

function radialTex(size: number, stops: [number, string][]): Texture {
  const [c, ctx] = makeCanvas(size);
  ctx.fillStyle = rad(ctx, size / 2, size / 2, 0, size / 2, stops);
  ctx.fillRect(0, 0, size, size);
  return Texture.from(c);
}

export function buildTextures() {
  TEX.sym = {};
  TEX.blur = {};
  for (const n of ALL_SYMBOLS) {
    const cv = drawSymbol(n);
    SYM_CANVAS[n] = cv;
    TEX.sym[n] = Texture.from(cv);
    TEX.blur[n] = Texture.from(motionBlur(cv));
  }
  TEX.glow = radialTex(256, [
    [0, 'rgba(255,255,255,0.9)'],
    [0.35, 'rgba(255,255,255,0.45)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  TEX.dot = radialTex(32, [
    [0, 'rgba(255,255,255,1)'],
    [0.4, 'rgba(255,255,255,0.6)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  // four-point spark
  {
    const [c, ctx] = makeCanvas(64);
    ctx.fillStyle = rad(ctx, 32, 32, 0, 32, [
      [0, 'rgba(255,255,255,1)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.quadraticCurveTo(36, 28, 64, 32);
    ctx.quadraticCurveTo(36, 36, 32, 64);
    ctx.quadraticCurveTo(28, 36, 0, 32);
    ctx.quadraticCurveTo(28, 28, 32, 0);
    ctx.fill();
    TEX.spark = Texture.from(c);
  }
  // gold coin
  {
    const [c, ctx] = makeCanvas(64);
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    const g = ctx.createLinearGradient(0, 4, 0, 60);
    g.addColorStop(0, '#fff3b0');
    g.addColorStop(0.4, '#f2c040');
    g.addColorStop(1, '#8a5a08');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#6b3f06';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(32, 32, 16, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(110,65,6,0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(110,65,6,0.9)';
    ctx.fillRect(26, 26, 12, 12);
    TEX.coin = Texture.from(c);
  }
  TEX.dust = radialTex(64, [
    [0, 'rgba(210,190,150,0.8)'],
    [1, 'rgba(210,190,150,0)'],
  ]);
  // small rune icon
  {
    const [c, ctx] = makeCanvas(64);
    ctx.drawImage(SYM_CANVAS.S, 0, 0, 64, 64);
    TEX.rune = Texture.from(c);
  }
  // recessed stone cell
  {
    const [c, ctx] = makeCanvas(SYM);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.roundRect(8, 8, SYM - 16, SYM - 16, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,150,0.07)';
    ctx.lineWidth = 3;
    ctx.stroke();
    TEX.cell = Texture.from(c);
  }
}
