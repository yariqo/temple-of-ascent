/**
 * Steles (multiplier symbols) in five materials. Geometry is unchanged (the game writes the
 * multiplier into the plate at y 150–218), only the painting is new: rounded pillar shading,
 * carved (engraved) face and glyphs, texture and glints.
 */
import { Ctx, INK, MAT, Stops, circle, engrave, gloss, lg, path, rg, rrect, solid, sparkle, texture } from './kit';

export type SteleSkin2 = 'stone' | 'gold' | 'bronze' | 'diamond' | 'obsidian';

const SK: Record<SteleSkin2, { mat: Stops; carve: string; eye: string; glowEye: string; plate: string; lava?: boolean }> = {
  stone: { mat: MAT.stone, carve: '#2a241c', eye: '#3fe0b0', glowEye: 'rgba(80,255,200,0.9)', plate: '#15110c' },
  gold: { mat: MAT.gold, carve: '#6a3a04', eye: '#23c890', glowEye: 'rgba(80,255,200,0.9)', plate: '#3a1e02' },
  bronze: { mat: MAT.bronze, carve: '#3a1606', eye: '#3ff0d0', glowEye: 'rgba(80,255,220,0.9)', plate: '#2a0e02' },
  diamond: { mat: MAT.ice, carve: '#0e3a66', eye: '#ffffff', glowEye: 'rgba(200,245,255,1)', plate: '#061a36' },
  obsidian: { mat: MAT.obsidian, carve: '#ffb030', eye: '#ffd060', glowEye: 'rgba(255,170,40,1)', plate: '#020203', lava: true },
};

/** cylinder shading across the pillar from a top→bottom material ramp */
function across(ctx: Ctx, m: Stops, x0: number, x1: number) {
  const n = m.length - 1;
  return lg(ctx, x0, 0, x1, 0, [
    [0, m[n][1]],
    [0.22, m[Math.min(n, 2)][1]],
    [0.42, m[1][1]],
    [0.52, m[0][1]],
    [0.7, m[Math.min(n, 2)][1]],
    [1, m[n][1]],
  ]);
}

export function drawStele2(ctx: Ctx, skin: SteleSkin2) {
  const P = SK[skin];
  const c = 128;
  if (skin === 'obsidian' || skin === 'diamond') {
    ctx.beginPath();
    ctx.ellipse(c, 128, 120, 124, 0, 0, Math.PI * 2);
    ctx.fillStyle = rg(ctx, c, 128, 20, 124, skin === 'obsidian'
      ? [
          [0, 'rgba(255,160,40,0.5)'],
          [1, 'rgba(255,160,40,0)'],
        ]
      : [
          [0, 'rgba(160,235,255,0.55)'],
          [1, 'rgba(160,235,255,0)'],
        ]);
    ctx.fill();
  }
  const fill = across(ctx, P.mat, c - 78, c + 78);
  // pillar
  const pillar = path([
    [c - 70, 26],
    [c + 70, 26],
    [c + 78, 236],
    [c - 78, 236],
  ]);
  solid(ctx, pillar, fill, { shadow: 16, bevel: 6, tex: skin === 'diamond' ? 0.06 : 0.24, line: 5 });
  // vertical light falloff (top brighter)
  ctx.save();
  ctx.clip(pillar);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = lg(ctx, 0, 26, 0, 236, [
    [0, 'rgba(255,255,255,1)'],
    [1, 'rgba(120,110,100,1)'],
  ]);
  ctx.fillRect(0, 0, 256, 256);
  ctx.restore();
  if (skin === 'diamond') {
    // crystal facets
    ctx.save();
    ctx.clip(pillar);
    const facets: [number, number][][] = [
      [[c - 70, 26], [c - 20, 140], [c - 78, 236]],
      [[c - 20, 140], [c + 70, 26], [c + 78, 120]],
      [[c - 20, 140], [c + 40, 236], [c + 78, 120]],
    ];
    facets.forEach((f, i) => {
      ctx.fillStyle = i === 0 ? 'rgba(255,255,255,0.22)' : i === 1 ? 'rgba(255,255,255,0.1)' : 'rgba(0,40,90,0.18)';
      ctx.fill(path(f));
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1.6;
      ctx.stroke(path(f));
    });
    ctx.restore();
  }

  // carved area helper: engraved recess, filled dark – or glowing lava on obsidian
  const carve = (p: Path2D, d = 3) => {
    if (P.lava) {
      ctx.save();
      ctx.shadowColor = 'rgba(255,150,30,1)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = lg(ctx, 0, 0, 0, 256, [
        [0, '#fff0a0'],
        [0.5, '#ffb030'],
        [1, '#e06010'],
      ]);
      ctx.fill(p);
      ctx.restore();
      engrave(ctx, p, d * 0.6, 'rgba(120,40,0,0.6)', 'rgba(255,255,220,0.5)');
    } else {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = P.carve;
      ctx.fill(p);
      ctx.restore();
      engrave(ctx, p, d);
    }
  };

  // side glyph columns
  for (const sx of [-1, 1]) {
    const col = new Path2D();
    for (let i = 0; i < 4; i++) {
      const y = 70 + i * 18;
      col.rect(c + sx * 58 - 5, y, 10, 10);
    }
    carve(col, 2);
  }
  // headdress
  const hd = path([
    [c - 84, 40],
    [c + 84, 40],
    [c + 72, 10],
    [c - 72, 10],
  ]);
  solid(ctx, hd, across(ctx, P.mat, c - 84, c + 84), { shadow: 6, bevel: 4, tex: 0.2, line: 4.5 });
  const steps = new Path2D();
  for (let i = 0; i < 6; i++) steps.rect(c - 66 + i * 26, 18, 14, 14);
  carve(steps, 2);
  // face
  carve(rrect(c - 56, 52, 112, 10, 3)); // brow
  for (const sx of [-1, 1]) {
    const sock = rrect(c + sx * 30 - 17, 70, 34, 16, 4);
    carve(sock);
    ctx.save();
    ctx.shadowColor = P.glowEye;
    ctx.shadowBlur = 12;
    ctx.fillStyle = P.eye;
    ctx.fill(rrect(c + sx * 30 - 7, 74, 14, 8, 3));
    ctx.restore();
  }
  carve(path([
    [c - 7, 90],
    [c + 7, 90],
    [c + 10, 116],
    [c - 10, 116],
  ]));
  carve(rrect(c - 32, 122, 64, 11, 4));
  // ear spools (raised rings)
  for (const sx of [-1, 1]) {
    const ring = new Path2D();
    ring.arc(c + sx * 64, 94, 11, 0, Math.PI * 2);
    ring.arc(c + sx * 64, 94, 5, 0, Math.PI * 2, true);
    solid(ctx, ring, skin === 'stone' ? MAT.jade : MAT.gold, { y0: 83, y1: 105, bevel: 2, tex: 0, line: 2.5 });
  }
  // value plate recess
  const plate = rrect(c - 64, 150, 128, 68, 10);
  ctx.fillStyle = P.plate;
  ctx.globalAlpha = 0.92;
  ctx.fill(plate);
  ctx.globalAlpha = 1;
  engrave(ctx, plate, 5, 'rgba(0,0,0,0.9)', skin === 'obsidian' ? 'rgba(255,190,70,0.7)' : 'rgba(255,255,255,0.35)');
  ctx.lineWidth = 2;
  ctx.strokeStyle = skin === 'obsidian' ? 'rgba(255,200,70,0.85)' : 'rgba(255,255,255,0.18)';
  ctx.stroke(plate);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = INK;
  ctx.stroke(pillar);

  // highlights
  if (skin !== 'stone') {
    gloss(ctx, c - 40, 60, 16, 60, skin === 'obsidian' ? 0.25 : 0.4, 0.05, pillar);
    if (skin === 'diamond') {
      sparkle(ctx, c - 50, 44, 15);
      sparkle(ctx, c + 56, 196, 10);
      sparkle(ctx, c + 40, 70, 7);
    }
  } else {
    texture(ctx, pillar, 0.12, 'multiply');
  }
  void circle;
}
