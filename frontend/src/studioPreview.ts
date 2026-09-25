import { drawStudioLogo, drawStudioMark } from './art/studio';
import { loadFonts } from './fonts';
/* dev preview / export of the studio logo: ?v=row|stack|mark|markmono&t=dark|light&h=256 */
(async () => {
  await loadFonts();
  const q = new URLSearchParams(location.search);
  const v = q.get('v') ?? 'row';
  const h = Number(q.get('h') ?? 256);
  const theme = (q.get('t') ?? 'dark') as 'dark' | 'light';
  const img = v === 'mark' ? drawStudioMark(h) : v === 'markmono' ? drawStudioMark(h, true) : drawStudioLogo(v as 'row' | 'stack', theme, h);
  const c = document.getElementById('c') as HTMLCanvasElement;
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d')!;
  if (q.get('bg')) {
    ctx.fillStyle = q.get('bg')!;
    ctx.fillRect(0, 0, c.width, c.height);
  }
  ctx.drawImage(img, 0, 0);
  document.title = 'done';
})();
