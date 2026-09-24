import { Container, Sprite, Texture, type Ticker } from 'pixi.js';
import { drawMascotBody, drawMascotHead, drawMascotTail, MASCOT_GEO as G, type Face } from './art/mascot';
import { TEX } from './art/textures';
import { ease, lerp, tween, wait } from './anim';
import { sound } from './sound';

const faces = new Map<string, Texture>();
function faceTex(face: Face, glow: boolean): Texture {
  const k = `${face}${glow ? 'g' : ''}`;
  let t = faces.get(k);
  if (!t) faces.set(k, (t = Texture.from(drawMascotHead(face, glow))));
  return t;
}

const HEAD_X = G.head.x;
const HEAD_Y = G.head.y - G.belly;
const BODY_Y = -G.belly;

/**
 * Balam, the temple jaguar – lies on the reel frame and reacts to the game.
 * Origin of the container = the line the belly rests on.
 */
export class Mascot {
  readonly root = new Container();
  private rig = new Container();
  private body = new Sprite(Texture.from(drawMascotBody()));
  private head = new Sprite(faceTex('open', false));
  private tail = new Sprite(Texture.from(drawMascotTail()));
  private aura = new Sprite(TEX.glow);
  private time = Math.random() * 10;
  private nextBlink = 2.5;
  private blinkUntil = 0;
  private face: Face | null = null;
  private glowEyes = false;
  private look = 0; // 0 = straight, 1 = looking down at the reels
  private busy = 0;

  constructor(ticker: Ticker) {
    this.aura.anchor.set(0.5);
    this.aura.width = 560;
    this.aura.height = 300;
    this.aura.position.set(250, -80);
    this.aura.tint = 0xffc23a;
    this.aura.blendMode = 'add';
    this.aura.alpha = 0;
    this.body.position.set(0, BODY_Y);
    this.tail.anchor.set(G.tail.ax / G.tail.w, G.tail.ay / G.tail.h);
    this.tail.position.set(G.tail.x, G.tail.y - G.belly);
    this.head.anchor.set(G.head.ax / G.head.w, G.head.ay / G.head.h);
    this.head.position.set(HEAD_X, HEAD_Y);
    this.rig.addChild(this.aura, this.tail, this.body, this.head);
    this.root.addChild(this.rig);
    ticker.add((tk) => this.update(tk.deltaMS / 1000));
  }

  private update(dt: number) {
    if (this.root.destroyed) return;
    this.time += dt;
    const t = this.time;
    // breathing, tail sway
    this.body.scale.y = 1 + 0.012 * Math.sin(t * 2.1);
    this.body.y = BODY_Y - G.belly * 0.012 * Math.sin(t * 2.1);
    this.tail.rotation = 0.13 * Math.sin(t * 1.25) + 0.04 * Math.sin(t * 3.1);
    if (!this.busy) {
      this.head.y = HEAD_Y + 2.2 * Math.sin(t * 2.1 + 0.6) + this.look * 10;
      this.head.rotation = -0.05 * Math.sin(t * 0.7) - this.look * 0.18;
    }
    if (this.aura.alpha > 0) this.aura.scale.set((560 / 256) * (1 + 0.05 * Math.sin(t * 3)), (300 / 256) * (1 + 0.05 * Math.sin(t * 3)));
    // blinking
    if (t > this.nextBlink) {
      this.blinkUntil = t + 0.13;
      this.nextBlink = t + 2.5 + Math.random() * 3.5;
      if (Math.random() < 0.2) this.nextBlink = t + 0.3; // double blink now and then
    }
    const f: Face = this.face ?? (t < this.blinkUntil ? 'closed' : 'open');
    const tex = faceTex(f, this.glowEyes && (f === 'open' || f === 'roar'));
    if (this.head.texture !== tex) this.head.texture = tex;
  }

  /** Free spins: turquoise glowing eyes. */
  setFreeSpins(on: boolean) {
    this.glowEyes = on;
  }

  /** Jaguar spin active: golden aura. */
  private gold = false;
  setGold(on: boolean) {
    if (on === this.gold) return;
    this.gold = on;
    const from = this.aura.alpha;
    void tween(400, (t) => (this.aura.alpha = lerp(from, on ? 0.55 : 0, t)));
  }

  /** Reels start: lean over and watch. */
  watch() {
    const from = this.look;
    void tween(260, (t) => (this.look = lerp(from, 1, t)));
  }

  relax() {
    const from = this.look;
    void tween(500, (t) => (this.look = lerp(from, 0, t)));
  }

  /** Small win: happy face and a nod. */
  async happy(ms = 1100) {
    this.face = 'happy';
    this.busy++;
    const y0 = this.head.y;
    await tween(ms * 0.6, (t) => {
      this.head.y = y0 - 7 * Math.abs(Math.sin(t * Math.PI * 3));
      this.head.rotation = 0.08 * Math.sin(t * Math.PI * 3);
    }, ease.linear);
    this.busy--;
    await wait(ms * 0.4);
    if (this.face === 'happy') this.face = null;
  }

  /** The jaguar roars (Jaguar-Ruf / Jaguar-Spin). */
  async roar() {
    this.face = 'roar';
    this.busy++;
    const y0 = HEAD_Y;
    await tween(260, (t) => {
      this.head.scale.set(lerp(1, 1.22, t));
      this.head.y = lerp(y0 + 10, y0 - 12, t);
      this.head.rotation = lerp(-0.18, 0.05, t);
    }, ease.outBack);
    await tween(700, (t) => (this.head.rotation = 0.05 + 0.04 * Math.sin(t * Math.PI * 10) * (1 - t)), ease.linear);
    await tween(300, (t) => {
      this.head.scale.set(lerp(1.22, 1, t));
      this.head.y = lerp(y0 - 12, y0, t);
    });
    this.busy--;
    this.face = null;
  }

  /** Big win: jumps up and down with joy. */
  async jump(times = 2) {
    this.face = 'happy';
    for (let i = 0; i < times; i++) {
      sound.whoosh();
      await tween(220, (t) => {
        this.rig.y = -46 * t;
        this.rig.scale.set(lerp(1, 1.04, t), lerp(1, 0.97, t));
      }, ease.outCubic);
      await tween(260, (t) => {
        this.rig.y = -46 * (1 - t);
        this.rig.scale.set(lerp(1.04, 1, t), lerp(0.97, 1, t));
      }, ease.outBounce);
    }
    this.rig.position.set(0, 0);
    this.rig.scale.set(1);
    await wait(500);
    if (this.face === 'happy') this.face = null;
  }
}
