import { Container, Sprite, Texture, Ticker } from 'pixi.js';
import { speed } from '../anim';

interface P {
  s: Sprite;
  vx: number;
  vy: number;
  g: number; // gravity
  life: number;
  max: number;
  spin: number;
  fade: boolean;
  scale0: number;
  scale1: number;
  blink?: number;
}

/** Very small particle system (sprites, velocity, gravity, fade). */
export class Particles {
  readonly layer = new Container();
  private list: P[] = [];

  constructor(ticker: Ticker) {
    ticker.add((t) => this.update(t.deltaMS));
  }

  emit(
    tex: Texture,
    x: number,
    y: number,
    o: {
      n?: number;
      speed?: [number, number];
      angle?: [number, number];
      gravity?: number;
      life?: [number, number];
      scale?: [number, number];
      tint?: number | number[];
      spin?: number;
      alpha?: number;
      blend?: 'add' | 'normal';
      blink?: boolean;
      spread?: number;
    } = {},
  ) {
    const n = o.n ?? 12;
    for (let i = 0; i < n; i++) {
      const s = new Sprite(tex);
      s.anchor.set(0.5);
      const sp = rnd(o.speed ?? [60, 220]);
      const a = rnd(o.angle ?? [0, Math.PI * 2]);
      const spread = o.spread ?? 0;
      s.position.set(x + (Math.random() - 0.5) * spread, y + (Math.random() - 0.5) * spread);
      const tint = o.tint ?? 0xffffff;
      s.tint = Array.isArray(tint) ? tint[Math.floor(Math.random() * tint.length)] : tint;
      s.alpha = o.alpha ?? 1;
      if (o.blend === 'add') s.blendMode = 'add';
      const sc = o.scale ?? [0.3, 0.1];
      s.scale.set(sc[0]);
      this.layer.addChild(s);
      const life = rnd(o.life ?? [500, 1100]);
      this.list.push({
        s,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        g: o.gravity ?? 0,
        life,
        max: life,
        spin: (Math.random() - 0.5) * (o.spin ?? 0),
        fade: true,
        scale0: sc[0],
        scale1: sc[1],
        blink: o.blink ? Math.random() * 6 : undefined,
      });
    }
  }

  private update(dms: number) {
    const dt = (Math.min(dms, 50) / 1000) * Math.min(speed.factor(), 2.5);
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt * 1000;
      if (p.life <= 0) {
        p.s.destroy();
        this.list.splice(i, 1);
        continue;
      }
      p.vy += p.g * dt;
      p.s.x += p.vx * dt;
      p.s.y += p.vy * dt;
      p.s.rotation += p.spin * dt;
      const k = p.life / p.max;
      p.s.scale.set(p.scale1 + (p.scale0 - p.scale1) * k);
      let a = k < 0.3 ? k / 0.3 : 1;
      if (p.blink !== undefined) {
        p.blink += dt * 3;
        a *= 0.4 + 0.6 * Math.abs(Math.sin(p.blink));
      }
      p.s.alpha = a;
    }
  }

  clear() {
    for (const p of this.list) p.s.destroy();
    this.list = [];
  }
}

const rnd = ([a, b]: [number, number]) => a + Math.random() * (b - a);
