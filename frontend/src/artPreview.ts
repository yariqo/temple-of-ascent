import { ALL_SYMBOLS, drawSymbol, SYM } from './art/draw';
import { drawScene } from './art/scene';
import { loadFonts } from './fonts';
import { drawLogo } from './art/logo';
import { drawMascotBody, drawMascotHead, drawMascotTail, MASCOT_GEO } from './art/mascot';
(async () => {
  await loadFonts();
  const c = document.getElementById('c') as HTMLCanvasElement;
  const mode = new URLSearchParams(location.search).get('m') ?? 'sym';
  const ctx = c.getContext('2d')!;
  if (mode === 'sym') {
    const cols = 5;
    c.width = cols * SYM;
    c.height = Math.ceil(ALL_SYMBOLS.length / cols) * SYM;
    ALL_SYMBOLS.forEach((n, i) => ctx.drawImage(drawSymbol(n), (i % cols) * SYM, Math.floor(i / cols) * SYM));
  } else if (mode === 'logo') {
    const l = drawLogo();
    c.width = l.width;
    c.height = l.height * 2 + 20;
    ctx.fillStyle = '#10261c';
    ctx.fillRect(0, 0, c.width, l.height);
    ctx.fillStyle = '#3a1c10';
    ctx.fillRect(0, l.height + 20, c.width, l.height);
    ctx.drawImage(l, 0, 0);
    ctx.drawImage(l, 0, l.height + 20);
  } else if (mode === 'mascot') {
    c.width = 1200;
    c.height = 520;
    ctx.fillStyle = '#20302a';
    ctx.fillRect(0, 0, 1200, 520);
    ctx.fillStyle = '#6a5a44';
    ctx.fillRect(0, 180, 1200, 30);
    const G = MASCOT_GEO;
    const ox = 20, oy = 180 - G.belly + 10;
    ctx.drawImage(drawMascotTail(), ox + G.tail.x - G.tail.ax, oy + G.tail.y - G.tail.ay);
    ctx.drawImage(drawMascotBody(), ox, oy);
    ctx.drawImage(drawMascotHead('open'), ox + G.head.x - G.head.ax, oy + G.head.y - G.head.ay);
    (['closed', 'happy', 'roar'] as const).forEach((f, i) => ctx.drawImage(drawMascotHead(f, i === 2), 520 + i * 230, 0));
    ctx.drawImage(drawMascotHead('open', true), 750, 260);
  } else {
    c.width = 1600;
    c.height = 1500;
    [0, 2, 3, 4].forEach((s, i) => ctx.drawImage(drawScene(s), (i % 2) * 800, Math.floor(i / 2) * 500, 800, 500));
  }
  document.title = 'done';
})();
