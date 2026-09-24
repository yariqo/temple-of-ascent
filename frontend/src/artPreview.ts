import { ALL_SYMBOLS, drawSymbol, SYM } from './art/draw';
import { drawScene } from './art/scene';
import { loadFonts } from './fonts';
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
  } else {
    c.width = 1600;
    c.height = 1500;
    [0, 2, 3, 4].forEach((s, i) => ctx.drawImage(drawScene(s), (i % 2) * 800, Math.floor(i / 2) * 500, 800, 500));
  }
  document.title = 'done';
})();
