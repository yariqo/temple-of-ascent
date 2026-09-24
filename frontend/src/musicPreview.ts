import { sound } from './sound';
(async () => {
  const SR = 44100;
  const secs = Number(new URLSearchParams(location.search).get('s') ?? 40);
  const split = Number(new URLSearchParams(location.search).get('split') ?? 20);
  const hiStage = Number(new URLSearchParams(location.search).get('stage') ?? 2);
  const off = new OfflineAudioContext(2, SR * secs, SR);
  const s: any = sound;
  s.ctx = off;
  s.master = off.createGain();
  s.master.gain.value = 0.8;
  s.master.connect(off.destination);
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
  let t = 0.2;
  let b = 0;
  while (t < secs - 1) {
    const st = t < split ? 0 : hiStage;
    s.musicStep(b, st, t);
    t += s.eighth(st);
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
  (window as any).__pcm = btoa(String.fromCharCode(...new Uint8Array(pcm.buffer).slice(0, 0))) ;
  (window as any).__peak = peak;
  (window as any).__raw = pcm;
  document.title = 'done';
})();
