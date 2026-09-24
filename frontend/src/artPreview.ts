import { ALL_SYMBOLS, drawSymbol, SYM } from './art/draw';
import { drawScene } from './art/scene';
import { loadFonts } from './fonts';
import { drawMascotBody, drawMascotHead, drawMascotTail } from './art/mascot';
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
  } else if (mode === 'mascot') {
    c.width = 1100;
    c.height = 420;
    ctx.fillStyle = '#4a4133';
    ctx.fillRect(0, 150, 1100, 40);
    ctx.drawImage(drawMascotTail(), 380, 150);
    ctx.drawImage(drawMascotBody(), 20, 20);
    ctx.drawImage(drawMascotHead('open'), 20 + 95 - 95, 20 + 70 - 98);
    (['closed', 'happy', 'roar'] as const).forEach((f, i) => ctx.drawImage(drawMascotHead(f, i === 2), 500 + i * 200, 20));
    ctx.drawImage(drawMascotHead('open', true), 700, 220);
  } else {
    c.width = 1600;
    c.height = 1500;
    [0, 2, 3, 4].forEach((s, i) => ctx.drawImage(drawScene(s), (i % 2) * 800, Math.floor(i / 2) * 500, 800, 500));
  }
  document.title = 'done';
})();
