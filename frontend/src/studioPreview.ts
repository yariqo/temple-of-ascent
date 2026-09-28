import { drawStudioLogo, drawStudioMark } from './art/studio';
import { loadFonts } from './fonts';
/* dev preview / export of the studio logo: ?v=row|stack|mark|markmono&t=dark|light&h=256 */
(async () => {
  await loadFonts();
  const q = new URLSearchParams(location.search);
  const v = q.get('v') ?? 'row';
  const h = Number(q.get('h') ?? 256);
  const theme = (q.get('t') ?? 'dark') as 'dark' | 'light';
  if (v === 'avatar') {
    // profile picture: dark round-safe background, sign centred with room for a circular crop
    const c = document.getElementById('c') as HTMLCanvasElement;
    c.width = c.height = h;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(h / 2, h * 0.45, 0, h / 2, h / 2, h * 0.7);
    g.addColorStop(0, '#3a2a12');
    g.addColorStop(0.6, '#140c05');
    g.addColorStop(1, '#070402');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, h, h);
    const m = drawStudioMark(Math.round(h * 0.7));
    ctx.drawImage(m, (h - m.width) / 2, (h - m.height) / 2);
    document.title = 'done';
    return;
  }
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
