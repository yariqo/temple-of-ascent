import { sound } from './sound';
import roarUrl from './sfx/roar.mp3?url';
/* Offline render of one jaguar roar (?golden=1) – dev preview only */
(async () => {
  const SR = 44100;
  const golden = new URLSearchParams(location.search).get('golden') === '1';
  const off = new OfflineAudioContext(2, SR * 2.6, SR);
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
  s.musicOn = false;
  s.samples.roar = await off.decodeAudioData(await (await fetch(roarUrl)).arrayBuffer());
  sound.roar(golden);
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
