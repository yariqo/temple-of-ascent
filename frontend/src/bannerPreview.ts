/**
 * X / Twitter header for Solstone Games (dev tool, not part of the game).
 * preview/banner.html?s=2 → 3000×1000. Left bottom stays calm (profile picture sits there).
 */
import { drawLogo } from './art/logo';
import { drawMascotHead } from './art/mascot';
import { drawStudioLogo, drawStudioMark } from './art/studio';
import { loadFonts } from './fonts';

(async () => {
  await loadFonts();
  const q = new URLSearchParams(location.search);
  const k = Number(q.get('s') ?? 2);
  if (q.get('v') === 'logo') {
    // game logo alone, transparent
    const l = drawLogo();
    const cc = document.getElementById('c') as HTMLCanvasElement;
    cc.width = l.width;
    cc.height = l.height;
    cc.getContext('2d')!.drawImage(l, 0, 0);
    document.title = 'done';
    return;
  }
  const W = 1500;
  const H = 500;
  const c = document.getElementById('c') as HTMLCanvasElement;
  c.width = W * k;
  c.height = H * k;
  const ctx = c.getContext('2d')!;
  ctx.scale(k, k);
  if (q.get('v') === 'studio') {
    studioHeader(ctx, W, H);
    document.title = 'done';
    return;
  }

  // night jungle sky
  let g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#04110e');
  g.addColorStop(0.55, '#0c2a21');
  g.addColorStop(1, '#050d0a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // sun behind the temple, right of centre
  const sx = W * 0.64;
  const sy = H * 0.74;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 700);
  g.addColorStop(0, 'rgba(255,196,90,0.55)');
  g.addColorStop(0.3, 'rgba(255,140,40,0.16)');
  g.addColorStop(1, 'rgba(255,120,30,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.translate(sx, sy);
  for (let i = 0; i < 22; i++) {
    ctx.rotate((Math.PI * 2) / 22);
    const rg = ctx.createLinearGradient(0, 0, 0, -760);
    rg.addColorStop(0, `rgba(255,220,140,${i % 2 ? 0.14 : 0.08})`);
    rg.addColorStop(1, 'rgba(255,220,140,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-48, -760);
    ctx.lineTo(48, -760);
    ctx.lineTo(10, 0);
    ctx.fill();
  }
  ctx.restore();
  g = ctx.createRadialGradient(sx, sy - 14, 8, sx, sy, 78);
  g.addColorStop(0, '#fff6d0');
  g.addColorStop(0.5, '#ffc454');
  g.addColorStop(1, '#e0741a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(sx, sy, 78, 0, Math.PI * 2);
  ctx.fill();

  // hills + stepped temple silhouette
  ctx.fillStyle = '#0a2219';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.8);
  for (let x = 0; x <= W; x += 30) ctx.lineTo(x, H * (0.8 + 0.035 * Math.sin(x / 110 + 1.3)));
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.fill();
  ctx.fillStyle = '#061510';
  const base = H + 4;
  for (let i = 0; i < 6; i++) {
    const w = 520 - i * 70;
    ctx.fillRect(sx - w / 2, base - (i + 1) * 26, w, 27);
  }
  ctx.fillRect(sx - 60, base - 6 * 26 - 40, 120, 40);
  ctx.fillStyle = 'rgba(160,255,235,0.8)';
  ctx.save();
  ctx.shadowColor = 'rgba(120,255,230,0.9)';
  ctx.shadowBlur = 22;
  ctx.fillRect(sx - 14, base - 6 * 26 - 30, 28, 30);
  ctx.restore();

  // big leaves in the corners
  const leaves = (x: number, y: number, dir: number, bottom: boolean, S: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, bottom ? -1 : 1);
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.rotate(0.25 + i * 0.28);
      const len = S * (0.34 + (i % 2) * 0.1);
      const lg = ctx.createLinearGradient(0, 0, len, 0);
      lg.addColorStop(0, '#02100a');
      lg.addColorStop(1, i % 2 ? '#0d3a26' : '#0a2e1e');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(len * 0.5, -len * 0.2, len, 0);
      ctx.quadraticCurveTo(len * 0.5, len * 0.2, 0, 0);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  };
  leaves(0, 0, 1, false, 700);
  leaves(W, 0, -1, false, 620);

  // roaring jaguar, right
  const head = drawMascotHead('roar');
  const hh = 470;
  const hw = (head.width / head.height) * hh;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 30;
  ctx.drawImage(head, W - hw * 0.86, H - hh * 0.92, hw, hh);
  ctx.restore();

  // game logo, centre
  const logo = drawLogo();
  const lw = 640;
  const lh = (logo.height / logo.width) * lw;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 6;
  ctx.drawImage(logo, W * 0.47 - lw / 2, 92, lw, lh);
  ctx.restore();

  // studio line under the logo
  const st = drawStudioLogo('row', 'dark', 44);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 10;
  ctx.drawImage(st, W * 0.47 - st.width / 2, 92 + lh + 18);
  ctx.restore();
  ctx.font = '600 15px Outfit, sans-serif';
  (ctx as any).letterSpacing = '6px';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,236,190,0.8)';
  ctx.fillText(q.get('t') ?? 'COMING SOON ON STAKE', W * 0.47 + 3, 92 + lh + 18 + st.height + 34);

  // vignette
  g = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 900);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  document.title = 'done';
})();

/** Solstone Games header: calm, warm dark ground, a huge sunrise sign on the right, wordmark in the middle */
function studioHeader(ctx: CanvasRenderingContext2D, W: number, H: number) {
  let g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#0b0906');
  g.addColorStop(0.6, '#15100a');
  g.addColorStop(1, '#1d140a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // warm light from the sun on the right
  const sx = W * 0.84;
  const sy = H * 0.62;
  g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 760);
  g.addColorStop(0, 'rgba(255,190,80,0.30)');
  g.addColorStop(0.35, 'rgba(255,150,50,0.10)');
  g.addColorStop(1, 'rgba(255,140,40,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // long thin rays
  ctx.save();
  ctx.translate(sx, sy);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 28; i++) {
    const a = Math.PI + (i / 27) * Math.PI;
    const rg = ctx.createLinearGradient(0, 0, Math.cos(a) * 900, Math.sin(a) * 900);
    rg.addColorStop(0, `rgba(255,214,130,${i % 2 ? 0.09 : 0.05})`);
    rg.addColorStop(1, 'rgba(255,214,130,0)');
    ctx.strokeStyle = rg;
    ctx.lineWidth = i % 2 ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 900, Math.sin(a) * 900);
    ctx.stroke();
  }
  ctx.restore();
  // stepped horizon line (temple terraces) along the bottom
  ctx.fillStyle = 'rgba(255,214,130,0.07)';
  for (let i = 0; i < 5; i++) {
    const w = 1500 - i * 260;
    ctx.fillRect(sx - w / 2, H - (i + 1) * 16, w, 16);
  }
  // huge sign on the right
  const m = drawStudioMark(420);
  ctx.save();
  ctx.shadowColor = 'rgba(255,170,60,0.35)';
  ctx.shadowBlur = 50;
  ctx.drawImage(m, sx - 210, sy - 240, 420, 420);
  ctx.restore();
  // wordmark, centre-left (the profile picture covers the bottom left corner)
  const cx = W * 0.44;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 118px Outfit, sans-serif';
  (ctx as any).letterSpacing = '-1px';
  ctx.fillText('SOLSTONE', cx, 236);
  ctx.font = '600 34px Outfit, sans-serif';
  (ctx as any).letterSpacing = '22px';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('GAMES', cx + 11, 290);
  // gold rule + tagline
  const rg2 = ctx.createLinearGradient(cx - 150, 0, cx + 150, 0);
  rg2.addColorStop(0, 'rgba(255,196,90,0)');
  rg2.addColorStop(0.5, 'rgba(255,196,90,0.9)');
  rg2.addColorStop(1, 'rgba(255,196,90,0)');
  ctx.fillStyle = rg2;
  ctx.fillRect(cx - 150, 322, 300, 2);
  ctx.font = '600 17px Outfit, sans-serif';
  (ctx as any).letterSpacing = '7px';
  ctx.fillStyle = 'rgba(255,226,160,0.85)';
  ctx.fillText('ORIGINAL SLOT GAMES', cx + 3, 362);
}
