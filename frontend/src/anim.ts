/** Tiny promise-based tween helpers. All durations respect the global speed (turbo / skip). */

export const speed = {
  turbo: false,
  skip: false,
  factor(): number {
    return this.skip ? 8 : this.turbo ? 2.2 : 1;
  },
};

export const ease = {
  linear: (t: number) => t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t: number) => {
    const c1 = 1.70158;
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
};

export function tween(ms: number, update: (t: number) => void, easing: (t: number) => number = ease.outCubic): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const step = (now: number) => {
      const dur = Math.max(1, ms / speed.factor());
      const p = Math.min(1, (now - start) / dur);
      update(easing(p));
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

export function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms / speed.factor()));
}

/** Wait a real amount of time (not affected by turbo). */
export function sleepReal(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
