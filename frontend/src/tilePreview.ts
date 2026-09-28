/**
 * Lobby tile / cover art for BALAM RISING (dev tool, not part of the game).
 * preview/tile.html?w=900&h=1200 renders one format; the PNG is read back by a script.
 */
import { drawSymbol } from './art/draw';
import { drawLogo, drawWord } from './art/logo';
import { drawMascotHead, MASCOT_GEO } from './art/mascot';
import { loadFonts } from './fonts';
import { drawStudioMark } from './art/studio';

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

(async () => {
  await loadFonts();
  const q = new URLSearchParams(location.search);
  const W = Number(q.get('w') ?? 900);
  const H = Number(q.get('h') ?? 1200);
  const c = document.getElementById('c') as HTMLCanvasElement;
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const S = Math.min(W, H); // scale reference
  const land = W > H * 1.2;
  const cx = land ? W * 0.3 : W / 2;

  // --- sky: deep jungle teal into a hot sunset
  const lobby = q.get('style') === 'lobby';
  let g = ctx.createLinearGradient(0, 0, 0, H);
  if (lobby) {
    g.addColorStop(0, '#0a5a4a');
    g.addColorStop(0.4, '#1f8a5a');
    g.addColorStop(0.7, '#e0701a');
    g.addColorStop(1, '#b0200c');
  } else {
    g.addColorStop(0, '#061a16');
    g.addColorStop(0.45, '#0f3a2e');
    g.addColorStop(0.75, '#7a3a12');
    g.addColorStop(1, '#2a0f04');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // --- sun behind the jaguar
  const sunY = land ? H * 0.46 : lobby ? H * 0.33 : H * 0.4;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  g = ctx.createRadialGradient(cx, sunY, 0, cx, sunY, S * 0.9);
  g.addColorStop(0, 'rgba(255,210,110,0.95)');
  g.addColorStop(0.25, 'rgba(255,150,50,0.45)');
  g.addColorStop(0.6, 'rgba(255,110,30,0.12)');
  g.addColorStop(1, 'rgba(255,110,30,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // god rays
  ctx.translate(cx, sunY);
  for (let i = 0; i < 24; i++) {
    ctx.rotate((Math.PI * 2) / 24);
    const rg = ctx.createLinearGradient(0, 0, 0, -S * 1.2);
    rg.addColorStop(0, `rgba(255,225,150,${i % 2 ? 0.28 : 0.16})`);
    rg.addColorStop(1, 'rgba(255,225,150,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(-S * 0.02, 0);
    ctx.lineTo(-S * 0.09, -S * 1.2);
    ctx.lineTo(S * 0.09, -S * 1.2);
    ctx.lineTo(S * 0.02, 0);
    ctx.fill();
  }
  ctx.restore();

  // --- step pyramid silhouette
  const ground = land ? H * 0.98 : lobby ? H * 0.62 : H * 0.8;
  const steps = 6;
  const baseW = S * 1.05;
  const stepH = S * 0.055;
  for (let i = 0; i < steps; i++) {
    const sw = baseW * (1 - i * 0.13);
    g = ctx.createLinearGradient(0, ground - (i + 1) * stepH, 0, ground - i * stepH);
    g.addColorStop(0, '#3a2412');
    g.addColorStop(1, '#140a04');
    ctx.fillStyle = g;
    ctx.fillRect(cx - sw / 2, ground - (i + 1) * stepH, sw, stepH + 1);
    ctx.fillStyle = 'rgba(255,190,90,0.35)';
    ctx.fillRect(cx - sw / 2, ground - (i + 1) * stepH, sw, 2);
  }
  if (lobby) {
    g = ctx.createLinearGradient(0, ground, 0, H);
    g.addColorStop(0, '#5a1a06');
    g.addColorStop(1, '#2a0802');
    ctx.fillStyle = g;
  } else ctx.fillStyle = '#0a0503';
  ctx.fillRect(0, ground, W, H - ground);

  // --- jungle leaves in the corners
  const leaf = (x: number, y: number, len: number, ang: number, col: string) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, '#020a06');
    g.addColorStop(1, col);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.5, -len * 0.22, len, 0);
    ctx.quadraticCurveTo(len * 0.5, len * 0.22, 0, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,200,140,0.3)';
    ctx.lineWidth = S * 0.004;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len * 0.95, 0);
    ctx.stroke();
    ctx.restore();
  };
  for (let i = 0; i < 5; i++) {
    leaf(0, 0, S * (0.42 + (i % 2) * 0.12), 0.2 + i * 0.3, i % 2 ? '#145a38' : '#0f4a2e');
    leaf(W, 0, S * (0.42 + (i % 2) * 0.12), Math.PI - 0.2 - i * 0.3, i % 2 ? '#145a38' : '#0f4a2e');
  }

  // --- floating steles and BONUS symbols
  const sym = (name: string, x: number, y: number, size: number, rot: number, glow: string) => {
    const img = drawSymbol(name);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.shadowColor = glow;
    ctx.shadowBlur = size * 0.25;
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
  };
  if (land) {
    sym('TO', W * 0.07, H * 0.62, S * 0.32, -0.2, 'rgba(255,170,40,0.9)');
    sym('TD', W * 0.52, H * 0.78, S * 0.24, 0.16, 'rgba(140,220,255,0.9)');
    sym('S', W * 0.92, H * 0.2, S * 0.2, 0.12, 'rgba(120,255,230,0.9)');
  } else {
    sym('TO', W * 0.14, H * 0.56, S * 0.3, -0.22, 'rgba(255,170,40,0.9)');
    sym('TD', W * 0.86, H * 0.58, S * 0.27, 0.18, 'rgba(140,220,255,0.9)');
    sym('S', W * 0.15, H * 0.2, S * 0.22, -0.12, 'rgba(120,255,230,0.9)');
  }

  // --- the roaring jaguar
  const head = drawMascotHead('roar', true);
  const HG = MASCOT_GEO.head;
  const hw = land ? S * 0.95 : S * 0.98;
  const hh = (hw / HG.w) * HG.h;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = S * 0.05;
  ctx.shadowOffsetY = S * 0.02;
  ctx.drawImage(head, cx - hw * (HG.ax / HG.w), sunY - hh * (HG.ay / HG.h) + S * 0.02, hw, hh);
  ctx.restore();

  // --- sparks
  const r = rng(9);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 34; i++) {
    const x = r() * W;
    const y = H * 0.2 + r() * H * 0.75;
    const rr = S * (0.002 + r() * 0.005);
    g = ctx.createRadialGradient(x, y, 0, x, y, rr * 3);
    g.addColorStop(0, 'rgba(255,230,150,0.9)');
    g.addColorStop(1, 'rgba(255,200,90,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rr * 3, y - rr * 3, rr * 6, rr * 6);
  }
  ctx.restore();

  // --- title
  if (lobby && !land) {
    // hand-built lettering (same as the in-game logo), stacked
    const w1 = drawWord('BALAM', 20);
    const w2 = drawWord('RISING', 20, 2.6);
    const s1 = (W * 0.96) / w1.width;
    const s2 = (W * 0.62) / w2.width;
    let y = H * 0.6;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = S * 0.03;
    ctx.shadowOffsetY = S * 0.012;
    ctx.drawImage(w1, (W - w1.width * s1) / 2, y, w1.width * s1, w1.height * s1);
    y += w1.height * s1 * 0.86;
    ctx.drawImage(w2, (W - w2.width * s2) / 2, y, w2.width * s2, w2.height * s2);
    ctx.restore();
  }
  const logo = drawLogo();
  const lw = land ? W * 0.52 : W * 0.98;
  const lh = (lw / logo.width) * logo.height;
  const lx = land ? W * 0.74 - lw / 2 : (W - lw) / 2;
  const ly = land ? H * 0.5 - lh / 2 : H - lh - H * 0.075;
  // dark band behind the title for contrast
  if (!land && !lobby) {
    g = ctx.createLinearGradient(0, ly - lh * 0.4, 0, H);
    g.addColorStop(0, 'rgba(10,4,0,0)');
    g.addColorStop(0.45, 'rgba(10,4,0,0.75)');
    g.addColorStop(1, 'rgba(10,4,0,0.9)');
    ctx.fillStyle = g;
    ctx.fillRect(0, ly - lh * 0.4, W, H - ly + lh * 0.4);
  }
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = S * 0.03;
  ctx.shadowOffsetY = S * 0.01;
  if (!(lobby && !land)) ctx.drawImage(logo, lx, ly, lw, lh);
  ctx.restore();

  // provider line under the title (like the lobby tiles of other studios)
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${Math.round(S * (land ? 0.04 : 0.036))}px Outfit, sans-serif`;
  (ctx as any).letterSpacing = `${Math.round(S * 0.008)}px`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = S * 0.01;
  const py = land ? ly + lh + H * 0.06 : H - H * (lobby ? 0.03 : 0.042);
  const px = land ? lx + lw / 2 : W / 2;
  const mk = drawStudioMark(Math.round(S * 0.06));
  const label = 'SOLSTONE GAMES';
  const tw = ctx.measureText(label).width;
  ctx.drawImage(mk, px - tw / 2 - mk.width - S * 0.012, py - mk.height / 2);
  ctx.fillText(label, px + 0, py);
  ctx.restore();

  // vignette
  g = ctx.createRadialGradient(W / 2, H / 2, S * 0.4, W / 2, H / 2, Math.max(W, H) * 0.8);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  document.title = 'done';
})();
