import './style.css';
import { Application } from 'pixi.js';
import { Board } from './board';
import { Ui } from './ui';
import { RoundPlayer } from './player';
import { MODES, PAYTABLE } from './config';
import { rulesHtml, setLanguage, t } from './i18n';
import { setCurrency } from './format';
import { fetchReplay, StakeRgs, urlParam } from './rgs';
import { sleepReal, speed } from './anim';
import { loadFonts } from './fonts';
import { buildTextures, SYM_CANVAS } from './art/textures';
import { drawScene } from './art/scene';
import { makeCanvas } from './art/draw';
import { sound } from './sound';
import type { AuthInfo, Rgs, Round } from './types';

const LANG = (urlParam('lang') ?? navigator.language ?? 'en').slice(0, 2).toLowerCase() === 'de' ? 'de' : 'en';

function iconUrl(name: string, size = 64): string {
  const [c, ctx] = makeCanvas(size);
  ctx.drawImage(SYM_CANVAS[name], 0, 0, size, size);
  return c.toDataURL();
}

function paytableHtml(): string {
  const rows = Object.entries(PAYTABLE)
    .map(([s, p]) => `<tr><td><img src="${iconUrl(s)}" alt="${s}"></td><td>3× ${p[0]}</td><td>4× ${p[1]}</td><td>5× ${p[2]}</td></tr>`)
    .join('');
  const head = LANG === 'de' ? 'Gewinntabelle (× Einsatz)' : 'Paytable (× bet)';
  const wild =
    LANG === 'de'
      ? 'WILD (Walze 2–5) ersetzt alle normalen Symbole. Die Sonnen-Glyphe startet Freispiele und zählt in den Freispielen als Rune.'
      : 'WILD (reels 2–5) substitutes for all regular symbols. The sun glyph triggers free spins and counts as a rune during free spins.';
  return `<h4>${head}</h4><table>${rows}</table><p><img src="${iconUrl('W')}" alt="Wild"> <img src="${iconUrl('S')}" alt="Glyph"> <img src="${iconUrl('T')}" alt="Stele"><br>${wild}</p>`;
}

async function sceneUrl(stage: number): Promise<string> {
  const c = drawScene(stage);
  return new Promise((res) => c.toBlob((b) => res(b ? URL.createObjectURL(b) : c.toDataURL('image/jpeg', 0.85)), 'image/jpeg', 0.86));
}

async function main() {
  const socialParam = urlParam('social') === 'true';
  setLanguage(LANG, socialParam);
  document.documentElement.lang = LANG;
  const ui = new Ui();

  // ---------- loading: fonts → textures → scenes → renderer ----------
  ui.setLoading(0.1);
  await loadFonts();
  ui.applyTexts();
  ui.setLoading(0.35);
  buildTextures();
  ui.runeIcon = iconUrl('S', 88);
  ui.icons = { S: iconUrl('S', 116), TG: iconUrl('TG', 116) };
  ui.setLoading(0.55);
  const scenes = await Promise.all([0, 1, 2, 3, 4].map(sceneUrl));
  ui.setSceneUrls(scenes);
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
  document.getElementById('rules-btn')!.onclick = () => ui.showRules(rulesHtml(LANG) + paytableHtml());

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
  ui.hideTurbo(!!jur.disabledTurbo);
  ui.hideBuy(!!jur.disabledBuyFeature);

  // ---------- state ----------
  let balance = auth.balance;
  const levels = auth.betLevels;
  let betIdx = Math.max(0, levels.findIndex((v) => Math.abs(v - auth.defaultBet) < 1e-9));
  let toggle: 'bonushunt' | 'jaguar' | null = null;
  let busy = false;

  const bet = () => levels[betIdx];
  const refresh = () => {
    ui.setBalance(balance);
    ui.setBet(bet());
    ui.setActiveToggle(toggle);
    board.mascot.setGold(toggle === 'jaguar');
  };
  refresh();

  const turbo = document.getElementById('turbo') as HTMLInputElement;
  turbo.onchange = () => (speed.turbo = turbo.checked && !jur.disabledTurbo);

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
  async function play(mode: string) {
    if (busy) {
      // skip / slam-stop – ignore the second half of an accidental double click
      if (!jur.disabledSlamstop && performance.now() - roundStarted > 350) speed.skip = true;
      return;
    }
    roundStarted = performance.now();
    const def = MODES[mode];
    const cost = bet() * def.cost;
    if (cost > balance + 1e-9) {
      ui.toast(t('insufficient'));
      return;
    }
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
    } catch (e) {
      ui.toast(errorText(e), 6000);
    }
    const minDur = Number(jur.minimumRoundDuration ?? 0);
    const elapsed = performance.now() - started;
    if (minDur > elapsed) await sleepReal(minDur - elapsed);
    speed.skip = false;
    busy = false;
    ui.setBusy(false, false);
  }

  // ---------- controls ----------
  document.getElementById('spin')!.onclick = () => play(toggle ?? 'base');
  document.getElementById('bet-up')!.onclick = () => {
    if (busy) return;
    sound.click();
    betIdx = Math.min(levels.length - 1, betIdx + 1);
    refresh();
  };
  document.getElementById('bet-down')!.onclick = () => {
    if (busy) return;
    sound.click();
    betIdx = Math.max(0, betIdx - 1);
    refresh();
  };
  const setToggle = (m: string | null) => {
    toggle = m as typeof toggle;
    refresh();
  };
  document.getElementById('feature-btn')!.onclick = async () => {
    if (busy) return;
    sound.click();
    const choice = await ui.featureMenu(bet(), balance, toggle);
    if (!choice) return;
    if (choice.buy) play(choice.buy);
    else if (choice.toggle !== undefined) setToggle(choice.toggle);
  };
  document.getElementById('feature-pill-off')!.onclick = () => {
    if (busy) return;
    sound.click();
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
    play(toggle ?? 'base');
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
  (window as any).__toa = { get busy() {
    return busy;
  } };
}

main();
