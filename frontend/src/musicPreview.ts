import { sound } from './sound';
/* Offline render of the adaptive score: calm base game → jaguar spins → bonus stages 1–4 → big-win hype. */
(async () => {
  const SR = 44100;
  // [start second, stage, energy]
  const plan: [number, number, number][] = [
    [0, 0, 0],
    [14, 0, 1.6],
    [26, 1, 2.35],
    [38, 2, 3.1],
    [50, 3, 3.85],
    [62, 4, 4.6],
    [74, 4, 6],
  ];
  const secs = 88;
  const off = new OfflineAudioContext(2, SR * secs, SR);
  const s: any = sound;
  s.ctx = off;
  s.master = off.createGain();
  s.master.gain.value = 0.8;
  const comp = off.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 12;
  comp.ratio.value = 4;
  s.master.connect(comp).connect(off.destination);
  s.sfx = off.createGain();
  s.sfx.connect(s.master);
  s.music = off.createGain();
  s.music.connect(s.master);
  const nb = off.createBuffer(1, SR, SR);
  const d = nb.getChannelData(0);
  for (let i = 0; i < SR; i++) d[i] = Math.random() * 2 - 1;
  s.noiseBuf = nb;
  s.ok = () => true;
  s.startMusic();
  clearInterval(s.loopTimer);
  s.music.gain.value = 0.95;
  let t = 0.2;
  let b = 0;
  let seg = -1;
  s.bpm = 66;
  while (t < secs - 2) {
    let k = 0;
    while (k + 1 < plan.length && plan[k + 1][0] <= t) k++;
    const [, st, en] = plan[k];
    if (k !== seg) {
      if (seg >= 0 && st > plan[seg][1]) s.stinger(st, t);
      seg = k;
    }
    s.musicStage = st;
    s.bpm += Math.max(-1.2, Math.min(1.2, 66 + en * 10 - s.bpm));
    s.musicStep(b, en, t);
    t += 60 / s.bpm / 2;
    b++;
  }
  const buf = await off.startRendering();
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  const pcm = new Int16Array(L.length * 2);
  let peak = 0;
  for (let i = 0; i < L.length; i++) {
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    pcm[2 * i] = Math.max(-1, Math.min(1, L[i])) * 32767;
    pcm[2 * i + 1] = Math.max(-1, Math.min(1, R[i])) * 32767;
  }
  (window as any).__peak = peak;
  (window as any).__raw = pcm;
  document.title = 'done';
})();
