import './style.css';
import { Application } from 'pixi.js';
import { Board } from './board';
import { Ui } from './ui';
import { RoundPlayer } from './player';
import { MODES, PAYTABLE, SYMBOL_STYLE } from './config';
import { rulesHtml, setLanguage, t } from './i18n';
import { money, setCurrency } from './format';
import { fetchReplay, StakeRgs, urlParam } from './rgs';
import { sleepReal, speed } from './anim';
import type { AuthInfo, Rgs, Round } from './types';

const LANG = (urlParam('lang') ?? navigator.language ?? 'en').slice(0, 2).toLowerCase() === 'de' ? 'de' : 'en';

function paytableHtml(): string {
  const rows = Object.entries(PAYTABLE)
    .map(([s, p]) => `<tr><td>${SYMBOL_STYLE[s].icon} ${SYMBOL_STYLE[s].label}</td><td>3× ${p[0]}</td><td>4× ${p[1]}</td><td>5× ${p[2]}</td></tr>`)
    .join('');
  const head = LANG === 'de' ? 'Gewinntabelle (× Einsatz)' : 'Paytable (× bet)';
  const wild = LANG === 'de' ? '☀️ WILD (Walze 2–5) ersetzt alle normalen Symbole.' : '☀️ WILD (reels 2–5) substitutes for all regular symbols.';
  return `<h4>${head}</h4><table>${rows}</table><p>${wild}</p>`;
}

async function main() {
  const socialParam = urlParam('social') === 'true';
  setLanguage(LANG, socialParam);
  const ui = new Ui();

  const host = document.getElementById('canvas-host')!;
  const app = new Application();
  await app.init({
    resizeTo: host,
    backgroundAlpha: 0,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });
  host.appendChild(app.canvas);
  const board = new Board(app);
  // keep the canvas fitted to its box (grid layout changes on rotate / resize)
  new ResizeObserver(() => {
    app.resize();
    board.layout();
  }).observe(host);
  const player = new RoundPlayer(board, ui);

  document.getElementById('rules-btn')!.onclick = () => ui.showRules(rulesHtml(LANG) + paytableHtml());

  // ---------- replay of a finished round ----------
  if (urlParam('replay') === 'true') {
    ui.setDemo(t('replay'));
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
    ui.toast(t('noSession'), 1e9);
    return;
  }

  let auth: AuthInfo;
  try {
    auth = await rgs.authenticate();
  } catch (e: any) {
    ui.toast(t('error', { code: e?.code ?? 'AUTH' }), 1e9);
    return;
  }

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
      try {
        balance = closeEarly ? await closeEarly : await rgs.endRound();
      } catch (e) {
        ui.toast(errorText(e), 8000);
      }
    }
    ui.setBalance(balance);
  }

  async function play(mode: string) {
    if (busy) {
      if (!jur.disabledSlamstop) speed.skip = true;
      return;
    }
    const def = MODES[mode];
    const cost = bet() * def.cost;
    if (cost > balance + 1e-9) {
      ui.toast(t('insufficient'));
      return;
    }
    busy = true;
    speed.skip = false;
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
    betIdx = Math.min(levels.length - 1, betIdx + 1);
    refresh();
  };
  document.getElementById('bet-down')!.onclick = () => {
    if (busy) return;
    betIdx = Math.max(0, betIdx - 1);
    refresh();
  };
  for (const m of ['bonushunt', 'jaguar'] as const) {
    document.getElementById(`mode-${m}`)!.onclick = () => {
      if (busy) return;
      toggle = toggle === m ? null : m;
      refresh();
    };
  }
  document.getElementById('mode-buy')!.onclick = async () => {
    if (busy) return;
    const ok = await ui.confirm(t('buyConfirm', { cost: money(bet() * MODES.bonus.cost) }));
    if (ok) play('bonus');
  };
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || jur.disabledSpacebar) return;
    if (document.querySelector('dialog[open]')) return;
    e.preventDefault();
    play(toggle ?? 'base');
  });

  // ---------- resume an unfinished round ----------
  if (auth.resumeRound) {
    const r = auth.resumeRound;
    busy = true;
    ui.setBusy(true, !jur.disabledSlamstop);
    ui.toast(t('resume'));
    await runRound(r, r.amount ?? bet(), null);
    busy = false;
    ui.setBusy(false, false);
  }
}

main();
