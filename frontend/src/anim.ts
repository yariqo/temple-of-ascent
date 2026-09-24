/** Promise-based tween helpers. Time advances frame by frame × speed factor (turbo / skip),
 *  so switching speed in the middle of an animation never makes it jump. */

/** level 0 = normal, 1 = turbo, 2 = super turbo */
export const speed = {
  level: 0,
  skip: false,
  get turbo(): boolean {
    return this.level > 0;
  },
  factor(): number {
    return this.skip ? 7 : [1, 2, 3.6][this.level] ?? 1;
  },
};

export const ease = {
  linear: (t: number) => t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inCubic: (t: number) => t * t * t,
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t: number) => {
    const c1 = 1.4;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  outBackSoft: (t: number) => {
    const c1 = 0.9;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  outBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  outElastic: (t: number) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
};

export function tween(ms: number, update: (t: number) => void, easing: (t: number) => number = ease.outCubic): Promise<void> {
  return new Promise((resolve) => {
    let last = performance.now();
    let elapsed = 0;
    const step = (now: number) => {
      elapsed += Math.min(100, now - last) * speed.factor();
      last = now;
      const p = Math.min(1, elapsed / Math.max(1, ms));
      update(easing(p));
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

/** Wait – shortened by turbo / skip. */
export function wait(ms: number): Promise<void> {
  return tween(ms, () => {}, ease.linear);
}

/** Wait a real amount of time (not affected by turbo). */
export function sleepReal(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
