import './style.css';
import { Application } from 'pixi.js';
import { Board } from './board';
import { Ui } from './ui';
import { RoundPlayer } from './player';
import { MODES } from './config';
import { setLanguage, t } from './i18n';
import { rulesPage } from './rules';
import { money } from './format';
import { setCurrency } from './format';
import { fetchReplay, StakeRgs, urlParam } from './rgs';
import { sleepReal, speed } from './anim';
import { loadFonts } from './fonts';
import { drawLogo } from './art/logo';
import { buildTextures, SYM_CANVAS } from './art/textures';
import { Backdrop } from './backdrop';
import { drawMascotHead } from './art/mascot';
import { makeCanvas } from './art/draw';
import { sound } from './sound';
import type { AuthInfo, Rgs, Round } from './types';

const LANG = (urlParam('lang') ?? navigator.language ?? 'en').slice(0, 2).toLowerCase() === 'de' ? 'de' : 'en';

function iconUrl(name: string, size = 64): string {
  const [c, ctx] = makeCanvas(size);
  ctx.drawImage(SYM_CANVAS[name], 0, 0, size, size);
  return c.toDataURL();
}

async function main() {
  const socialParam = urlParam('social') === 'true';
  setLanguage(LANG, socialParam);
  document.documentElement.lang = LANG;
  const ui = new Ui();

  // ---------- loading: fonts → textures → scenes → renderer ----------
  ui.setLoading(0.1);
  await loadFonts();
  // game logo (drawn once, used in the header and on the loading screen)
  try {
    const logoUrl = drawLogo().toDataURL('image/png');
    for (const id of ['title', 'load-logo']) {
      const el = document.getElementById(id)!;
      el.innerHTML = `<img class="logo-img" src="${logoUrl}" alt="BALAM" draggable="false">`;
      el.classList.add('has-img');
      el.style.setProperty('--logo-mask', `url(${logoUrl})`);
    }
  } catch {
    /* keep the text logo */
  }
  ui.applyTexts();
  ui.setLoading(0.35);
  buildTextures();
  ui.runeIcon = iconUrl('S', 88);
  ui.icons = { S: iconUrl('S', 116), TG: iconUrl('TG', 116), T: iconUrl('T', 160), TB: iconUrl('TB', 160), TD: iconUrl('TD', 160), TO: iconUrl('TO', 160) };
  ui.setLoading(0.55);
  // animated jungle-temple backdrop (stage 0 now, the others are painted in idle time)
  const backdrop = new Backdrop();
  ui.onStage = (st) => backdrop.setStage(st);
  const warmUp = (st: number) => {
    if (st > 4) return;
    const idle = (window as any).requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 200));
    idle(() => {
      backdrop.warm(st);
      warmUp(st + 1);
    });
  };
  warmUp(1);
  ui.setLoading(0.8);

  const host = document.getElementById('canvas-host')!;
  const app = new Application();
  try {
    await app.init({
      resizeTo: host,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
  } catch {
    ui.doneLoading();
    ui.toast(t('noGraphics'), 1e9);
    return;
  }
  host.appendChild(app.canvas);
  const board = new Board(app);
  new ResizeObserver(() => {
    app.resize();
    board.layout();
  }).observe(host);
  const player = new RoundPlayer(board, ui);
  ui.setLoading(1);

  // ambient fireflies / embers
  let ambientStage = 0;
  // (skipped while the tab is hidden – the renderer pauses and particles would pile up)
  window.setInterval(() => !document.hidden && board.ambient(ambientStage), 420);
  const stageObserver = new MutationObserver(() => {
    const cur = document.querySelector('.tier.current') as HTMLElement | null;
    ambientStage = cur ? Number(cur.dataset.stage) : 0;
  });
  stageObserver.observe(document.getElementById('tiers')!, { subtree: true, attributes: true, attributeFilter: ['class'] });

  // ---------- sound ----------
  ui.setSoundIcon(sound.muted);
  const unlock = () => sound.unlock();
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  document.getElementById('sound-btn')!.onclick = () => {
    sound.unlock();
    sound.setMuted(!sound.muted);
    ui.setSoundIcon(sound.muted);
  };
  ui.setMusicIcon(sound.musicOn);
  document.getElementById('music-btn')!.onclick = () => {
    sound.unlock();
    sound.setMusic(!sound.musicOn);
    ui.setMusicIcon(sound.musicOn);
  };
  document.getElementById('rules-btn')!.onclick = () =>
    ui.showRules(rulesPage(LANG, (n) => iconUrl(n, 96), (window as any).__rulesBet ?? 1, money));

  // ---------- replay of a finished round ----------
  if (urlParam('replay') === 'true') {
    ui.setDemo(t('replay'));
    ui.doneLoading();
    const r = await fetchReplay().catch(() => null);
    if (!r) return ui.toast(t('error', { code: 'REPLAY' }), 1e9);
    ui.setBet(r.amount);
    ui.setBusy(true, false);
    await player.play(r.round, r.amount, MODES[r.round.mode]?.cost ?? 1);
    ui.setBusy(false, false);
    return;
  }

  // ---------- choose RGS ----------
  let rgs: Rgs;
  const rgsUrl = urlParam('rgs_url');
  const sessionID = urlParam('sessionID');
  if (rgsUrl && sessionID) {
    rgs = new StakeRgs(rgsUrl, sessionID, LANG);
  } else if (import.meta.env.MODE !== 'production') {
    const { DemoRgs } = await import('./demo/demoRgs');
    rgs = new DemoRgs();
    ui.setDemo(t('demo'));
  } else {
    ui.doneLoading();
    ui.toast(t('noSession'), 1e9);
    return;
  }

  let auth: AuthInfo;
  try {
    auth = await rgs.authenticate();
  } catch (e: any) {
    ui.doneLoading();
    ui.toast(t('error', { code: e?.code ?? 'AUTH' }), 1e9);
    return;
  }
  ui.doneLoading();

  const jur = auth.jurisdiction ?? {};
  setCurrency(auth.currency);
  if (jur.socialCasino && !socialParam) {
    setLanguage(LANG, true);
    ui.applyTexts();
  }
  // start screen with the three feature tablets (not when an unfinished round is resumed)
  if (!auth.resumeRound) {
    const logo = (document.querySelector('#title img') as HTMLImageElement | null)?.src ?? '';
    void ui.intro({ logo, bonus: iconUrl('S', 96), face: drawMascotHead('roar').toDataURL(), stele: iconUrl('TO', 128), stele2: iconUrl('TD', 128) });
  }
  ui.hideTurbo(!!jur.disabledTurbo);
  ui.hideBuy(!!jur.disabledBuyFeature);

  // ---------- state ----------
  let balance = auth.balance;
  const levels = auth.betLevels;
  let betIdx = Math.max(0, levels.findIndex((v) => Math.abs(v - auth.defaultBet) < 1e-9));
  let toggle: 'bonushunt' | 'jaguar' | null = null;
  let busy = false;

  const bet = () => levels[betIdx];
  Object.defineProperty(window, '__rulesBet', { get: bet, configurable: true });
  const refresh = () => {
    ui.setBalance(balance);
    ui.setBet(bet());
    ui.setActiveToggle(toggle);
    board.mascot.setGold(toggle === 'jaguar');
  };
  refresh();

  // turbo button cycles: off → turbo (1 bolt) → super turbo (2 bolts) → off
  const maxSpeed = jur.disabledTurbo ? 0 : jur.disabledSuperTurbo ? 1 : 2;
  const setSpeed = (lv: number) => {
    speed.level = Math.max(0, Math.min(maxSpeed, lv));
    ui.setTurbo(speed.level);
  };
  document.getElementById('turbo-wrap')!.onclick = () => {
    sound.click();
    setSpeed(speed.level >= maxSpeed ? 0 : speed.level + 1);
  };

  const errorText = (e: any) => {
    const code = e?.code ?? e?.message ?? 'ERR_GEN';
    if (code === 'ERR_IPB') return t('insufficient');
    return t('error', { code });
  };

  async function runRound(round: Round, betAmount: number, closeEarly: Promise<number> | null) {
    await player.play(round, betAmount, MODES[round.mode]?.cost ?? 1);
    if (round.active) {
      // close the round; retry a few times on network trouble so the win is never left open
      let lastErr: unknown = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          balance = attempt === 0 && closeEarly ? await closeEarly : await rgs.endRound();
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
          await sleepReal(800 * (attempt + 1));
        }
      }
      if (lastErr) ui.toast(errorText(lastErr), 8000);
    }
    ui.setBalance(balance);
  }

  let roundStarted = 0;
  /** plays one round; returns its win (money) and whether a bonus was in it, or null if nothing was played */
  async function play(mode: string): Promise<{ win: number; bonus: boolean } | null> {
    if (busy) {
      // skip / slam-stop – ignore the second half of an accidental double click
      if (!jur.disabledSlamstop && performance.now() - roundStarted > 350) speed.skip = true;
      return null;
    }
    roundStarted = performance.now();
    const def = MODES[mode];
    const cost = bet() * def.cost;
    if (cost > balance + 1e-9) {
      ui.toast(t('insufficient'));
      return null;
    }
    let result: { win: number; bonus: boolean } | null = null;
    busy = true;
    speed.skip = false;
    sound.click();
    ui.setBusy(true, !jur.disabledSlamstop);
    const started = performance.now();
    try {
      const res = await rgs.play(bet(), mode);
      balance = res.balance;
      ui.setBalance(balance);
      const round = { ...res.round, mode };
      // like the Stake web-sdk: single-round wins are closed right away, bonus rounds after the animation
      const isBonus = round.events.some((e) => e.type === 'freeSpinTrigger');
      const closeEarly = round.active && !isBonus ? rgs.endRound() : null;
      await runRound(round, bet(), closeEarly);
      const fw = (round.events.find((e) => e.type === 'finalWin') as any)?.amount ?? 0;
      result = { win: (fw / 100) * bet(), bonus: isBonus };
    } catch (e) {
      ui.toast(errorText(e), 6000);
    }
    const minDur = Number(jur.minimumRoundDuration ?? 0);
    const elapsed = performance.now() - started;
    if (minDur > elapsed) await sleepReal(minDur - elapsed);
    speed.skip = false;
    busy = false;
    ui.setBusy(false, false);
    if (auto) ui.setAuto(auto.left);
    return result;
  }

  // ---------- autoplay ----------
  let auto: { left: number } | null = null;
  const stopAuto = (msg?: string) => {
    if (!auto) return;
    auto = null;
    ui.setAuto(null);
    if (msg) ui.toast(t(msg), 3500);
  };
  async function runAuto() {
    while (auto && auto.left > 0) {
      const mode = toggle ?? 'base';
      const cost = bet() * MODES[mode].cost;
      if (cost > balance + 1e-9) {
        stopAuto('insufficient');
        return;
      }
      auto.left--;
      ui.setAuto(auto.left);
      const r = await play(mode);
      if (!auto) return;
      if (!r) {
        stopAuto();
        return;
      }
      await sleepReal([400, 180, 60][speed.level] ?? 400);
    }
    stopAuto(auto ? 'autoDone' : undefined);
  }
  ui.hideAuto(!!jur.disabledAutoplay);
  document.getElementById('auto-btn')!.onclick = async () => {
    if (auto) {
      sound.toggle(false);
      stopAuto();
      return;
    }
    if (busy) return;
    sound.menuOpen();
    const cfg = await ui.autoMenu(maxSpeed, speed.level);
    if (!cfg || busy || auto) return;
    sound.toggle(true);
    setSpeed(cfg.speed);
    auto = { left: cfg.spins };
    ui.setAuto(auto.left);
    void runAuto();
  };

  // ---------- controls ----------
  const spinPressed = () => {
    // during autoplay the spin button stops autoplay (and skips the running animation)
    if (auto) stopAuto();
    void play(toggle ?? 'base');
  };
  document.getElementById('spin')!.onclick = spinPressed;
  document.getElementById('bet-up')!.onclick = () => {
    if (busy || auto) return;
    sound.click();
    betIdx = Math.min(levels.length - 1, betIdx + 1);
    refresh();
  };
  document.getElementById('bet-down')!.onclick = () => {
    if (busy || auto) return;
    sound.click();
    betIdx = Math.max(0, betIdx - 1);
    refresh();
  };
  const setToggle = (m: string | null) => {
    toggle = m as typeof toggle;
    refresh();
  };
  document.getElementById('feature-btn')!.onclick = async () => {
    if (busy || auto) return;
    sound.menuOpen();
    const choice = await ui.featureMenu(bet(), balance, toggle);
    if (!choice) return;
    if (choice.buy) {
      sound.purchase();
      play(choice.buy);
    } else if (choice.toggle !== undefined) {
      sound.toggle(choice.toggle !== null);
      setToggle(choice.toggle);
    }
  };
  document.getElementById('feature-pill-off')!.onclick = () => {
    if (busy || auto) return;
    sound.toggle(false);
    setToggle(null);
  };
  // buttons must not keep keyboard focus after a click, otherwise Space would also "click" them
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest('button, label');
    if (el && !el.closest('dialog')) (el as HTMLElement).blur();
  });
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || jur.disabledSpacebar) return;
    if (document.querySelector('dialog[open]')) return;
    e.preventDefault();
    if (e.repeat) return;
    spinPressed();
  });

  // ---------- resume an unfinished round ----------
  if (auth.resumeRound) {
    const r = auth.resumeRound;
    if (r.amount) {
      const i = levels.findIndex((v) => Math.abs(v - r.amount!) < 1e-9);
      if (i >= 0) betIdx = i;
      refresh();
    }
    busy = true;
    ui.setBusy(true, !jur.disabledSlamstop);
    ui.toast(t('resume'));
    await runRound(r, r.amount ?? bet(), null);
    busy = false;
    ui.setBusy(false, false);
  }

  // demo helper for automated tests
  (window as any).__toa = {
    get busy() {
      return busy;
    },
    get auto() {
      return auto ? auto.left : null;
    },
  };
  // test hooks (demo / dev only): window.__toa.bigwin(amount, bet), window.__toa.bg(stage)
  if (import.meta.env.MODE !== 'production') (window as any).__toa.bg = (st: number) => backdrop.setStage(st);
  if (import.meta.env.MODE !== 'production')
    (window as any).__toa.bigwin = (amount: number, b = 1, max = false) =>
      ui.bigWin(amount, b, { max, onTier: (lv) => {
        if (lv >= 4) void board.mascot.roar();
        else void board.mascot.jump(lv >= 2 ? 2 : 1);
      } });
}

main();
