import { BUYS, MAX_STAGE, MODES, RUNES_PER_STAGE, STAGE_TOTEMS } from './config';
import { money } from './format';
import { t } from './i18n';
import { ease, sleepReal, tween, wait, speed } from './anim';
import { sound } from './sound';
import { BigWin } from './bigwin';
import { IntroBg } from './introBg';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export class Ui {
  private tiersEl = $('tiers');
  private bannerEl = $('banner');
  private winEl = $('win');
  private spinBtn = $<HTMLButtonElement>('spin');
  private toastTimer = 0;
  private stage = 0;
  private runes = 0;
  private sceneShown = -1;
  runeIcon = '';

  constructor() {
    this.applyTexts();
    this.buildPyramid();
  }

  applyTexts() {
    $('balance-label').textContent = t('balance');
    $('bet-label').textContent = t('bet');
    $('win-label').textContent = t('win');
    $('pyr-title').textContent = t('pyramid');
    $('door-text').textContent = t('pyrIdle');
    $('spin-label').textContent = t('spin');
    this.renderPill();
    $('turbo-label').textContent = t('turbo').toUpperCase();
    $('confirm-no').textContent = t('no');
    $('confirm-yes').textContent = t('yes');
    $('rules-close').textContent = t('close');
    $('fm-title').textContent = t('fmTitle');
    $('fm-spins-title').textContent = t('fmSpins');
    $('fm-buy-title').textContent = t('fmBuys');
    $('turbo-wrap').title = t('turbo');
    this.buildPyramid();
  }

  private toggle: string | null = null;
  private bet = 1;

  /** Active feature spin (bonus hunt / jaguar spin): pill above the bar + glowing BONUS button. */
  setActiveToggle(mode: string | null) {
    this.toggle = mode;
    $('feature-btn').classList.toggle('active', !!mode);
    $('spin').classList.toggle('jaguar', mode === 'jaguar' || mode === 'jaguarking');
    $('spin').classList.toggle('king', mode === 'jaguarking');
    $('spin-label').textContent = mode === 'jaguar' || mode === 'jaguarking' ? t('spinJaguar') : t('spin');
    this.renderPill();
  }

  /** BONUS tile text: invitation, or the active feature spin with its price. */
  private renderPill() {
    const off = $('feature-pill-off');
    off.hidden = !this.toggle;
    if (this.toggle) {
      $('feature-label').textContent = t(this.toggle);
      $('feature-sub').textContent = t('tileActive', { v: money(this.bet * MODES[this.toggle].cost) });
    } else {
      $('feature-label').textContent = t('featureBtn');
      $('feature-sub').textContent = t('tileSub');
    }
  }

  setBalance(v: number) {
    $('balance').textContent = money(v);
  }
  setBet(v: number) {
    $('bet').textContent = money(v);
    this.bet = v;
    this.renderPill();
  }
  setWin(v: number | null, big = false) {
    this.winEl.textContent = v === null ? '–' : money(v);
    this.winEl.classList.toggle('big', big);
  }

  async countWin(from: number, to: number, ms = 600) {
    await tween(ms, (k) => this.setWin(from + (to - from) * k, to > 0), ease.outCubic);
    this.setWin(to, to > 0);
  }

  setBusy(busy: boolean, canSkip: boolean) {
    this.spinBtn.classList.toggle('busy', busy);
    if (busy) $('spin-label').textContent = canSkip ? t('skip') : '…';
    else $('spin-label').textContent = this.toggle === 'jaguar' || this.toggle === 'jaguarking' ? t('spinJaguar') : t('spin');
    this.spinBtn.disabled = busy && !canSkip;
    for (const id of ['feature-btn', 'bet-up', 'bet-down', 'feature-pill-off']) ($(id) as HTMLButtonElement).disabled = busy;
  }

  private buyDisabled = false;
  hideBuy(hide: boolean) {
    this.buyDisabled = hide;
  }
  setDemo(text: string | null) {
    const b = $('demo-badge');
    b.hidden = !text;
    if (text) b.textContent = text;
  }
  hideTurbo(hide: boolean) {
    $('turbo-wrap').hidden = hide;
  }
  setSoundIcon(muted: boolean) {
    const w = document.getElementById('snd-waves');
    const x = document.getElementById('snd-x');
    if (w) w.style.display = muted ? 'none' : '';
    if (x) x.style.display = muted ? '' : 'none';
  }
  setMusicIcon(on: boolean) {
    const x = document.getElementById('mus-x');
    if (x) x.style.display = on ? 'none' : '';
    $('music-btn').classList.toggle('off', !on);
  }
  setLoading(p: number) {
    $('load-fill').style.width = `${Math.round(p * 100)}%`;
  }
  doneLoading() {
    $('loading').classList.add('done');
    setTimeout(() => ($('loading').hidden = true), 700);
  }

  toast(msg: string, ms = 3500) {
    const el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => (el.hidden = true), ms);
  }

  async banner(title: string, sub = '', ms = 1600, cls = '') {
    const el = this.bannerEl;
    el.className = cls;
    el.querySelector('.b-title')!.textContent = title;
    el.querySelector('.b-sub')!.textContent = sub;
    el.hidden = false;
    const tt = el.querySelector('.b-title') as HTMLElement;
    tt.style.animation = 'none';
    void tt.offsetWidth;
    tt.style.animation = '';
    await wait(ms);
    el.hidden = true;
  }

  bumpFsCounter() {
    const el = $('fs-counter');
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }
  setFsCounter(n: number | null, total = 0) {
    const el = $('fs-counter');
    el.hidden = n === null;
    if (n !== null) el.textContent = t('freeSpin', { n: Math.max(1, n), t: total });
  }

  // ---------------------------------------------------------------- scenes
  /** set by main: switches the animated backdrop to a stage */
  onStage?: (stage: number) => void;
  private showScene(stage: number) {
    if (stage === this.sceneShown) return;
    this.sceneShown = stage;
    this.onStage?.(stage);
  }

  /** Background + pyramid state for a stage (0 = base game). */
  setStage(stage: number, runes = this.runes, bump = false) {
    const opening = this.stage === 0 && stage > 0;
    if (opening) sound.doorOpen();
    this.stage = stage;
    this.runes = runes;
    this.showScene(stage);
    $('pyramid').classList.toggle('active', stage > 0);
    this.renderPyramid(bump);
    if (opening) this.templeAwaken(stage);
  }

  private restartClass(el: Element, cls: string, ms: number) {
    el.classList.remove(cls);
    void (el as HTMLElement).offsetWidth;
    el.classList.add(cls);
    window.setTimeout(() => el.classList.remove(cls), ms);
  }
  /**
   * The temple comes alive when the bonus starts: the door grinds open, then a wave of light runs
   * up through every tier, the torches flare and the shrine on top lights up.
   */
  private awakenUntil = 0;
  private templeAwaken(stage: number) {
    const pyr = $('pyramid');
    this.awakenUntil = performance.now() + 3200;
    this.restartClass(pyr, 'opening', 900); // rumble before the halves move
    window.setTimeout(() => {
      this.restartClass(pyr, 'awaken', 2200);
      for (let s = 1; s <= MAX_STAGE; s++) {
        const el = this.tierEl(s);
        if (el) window.setTimeout(() => this.restartClass(el, 'ignite', 800), (s - 1) * 230);
      }
      window.setTimeout(() => this.restartClass(pyr, 'crown', 1400), MAX_STAGE * 230);
      // start stage above 1: the light settles on it
      if (stage > 1) window.setTimeout(() => this.tierEl(stage) && this.restartClass(this.tierEl(stage)!, 'bump', 800), MAX_STAGE * 230 + 300);
    }, 1500);
  }
  /** wait until the temple wake-up is visible enough to go on */
  async templeReady() {
    const left = this.awakenUntil - performance.now();
    if (left > 0) await sleepReal(Math.min(left, 3200) / speed.factor());
  }
  /**
   * Stage-up: a wave climbs from the bottom tier up to the new stage, which bursts into light,
   * a pillar of light shoots to the shrine and the torches flare.
   */
  async templeSurge(stage: number) {
    const pyr = $('pyramid');
    const f = speed.factor();
    pyr.style.setProperty('--surge-ms', `${Math.round(900 / f)}ms`);
    this.restartClass(pyr, 'surge', 1400 / f);
    for (let s = 1; s <= stage; s++) {
      const el = this.tierEl(s);
      if (el) window.setTimeout(() => this.restartClass(el, s === stage ? 'burst' : 'ignite', 900), ((s - 1) * 200) / f);
    }
    const top = this.tierEl(stage);
    await sleepReal(((stage - 1) * 200 + 250) / f);
    if (top) {
      const pr = pyr.getBoundingClientRect();
      const tr = top.getBoundingClientRect();
      pyr.style.setProperty('--pillar-bottom', `${pr.bottom - tr.top - 6}px`);
    }
    this.restartClass(pyr, 'pillar', 1300);
    this.restartClass(pyr, 'crown', 1400);
    await sleepReal(750 / f);
  }

  setRunes(runes: number) {
    this.runes = runes;
    this.renderPyramid(false);
  }

  private buildPyramid() {
    this.tiersEl.innerHTML = '';
    for (let s = MAX_STAGE; s >= 1; s--) {
      const d = document.createElement('div');
      d.className = `tier s${s}`;
      d.dataset.stage = String(s);
      d.style.width = `${46 + (MAX_STAGE - s) * 18}%`;
      const vals = STAGE_TOTEMS[s];
      d.innerHTML = `<div class="t-name">${t('stage', { n: s })}</div><div class="t-vals">${vals[0]}–${vals[vals.length - 1]}×</div><div class="t-runes"></div>`;
      const rr = d.querySelector('.t-runes')!;
      if (s < MAX_STAGE) for (let i = 0; i < RUNES_PER_STAGE; i++) rr.appendChild(Object.assign(document.createElement('span'), { className: 'rune' }));
      this.tiersEl.appendChild(d);
    }
    this.renderPyramid(false);
  }

  private tierEl(stage: number): HTMLElement | null {
    return this.tiersEl.querySelector(`.tier[data-stage="${stage}"]`);
  }

  private renderPyramid(bump: boolean) {
    for (const el of Array.from(this.tiersEl.children) as HTMLElement[]) {
      const s = Number(el.dataset.stage);
      el.classList.toggle('current', s === this.stage);
      el.classList.toggle('done', this.stage > 0 && s < this.stage);
      if (bump && s === this.stage) {
        el.classList.remove('bump');
        void el.offsetWidth;
        el.classList.add('bump');
      }
      const filled = this.runes - (s - 1) * RUNES_PER_STAGE;
      // one BONUS symbol away from the next stage: the next tier pulses
      el.classList.toggle('almost', this.stage > 0 && s === this.stage + 1 && this.stage * RUNES_PER_STAGE - this.runes === 1);
      el.querySelectorAll('.rune').forEach((r, i) => r.classList.toggle('on', this.stage > 0 && i < filled));
    }
    const info = $('pyr-info');
    if (this.stage === 0) info.textContent = t('pyrIdle');
    else if (this.stage >= MAX_STAGE) info.textContent = t('maxStage');
    else info.textContent = t('runesToNext', { n: this.stage * RUNES_PER_STAGE - this.runes });
  }

  /** Runes fly from the board into the pyramid meter. */
  async flyRunes(points: { x: number; y: number }[], stage: number) {
    const target = this.tierEl(Math.max(1, Math.min(stage, MAX_STAGE))) ?? $('pyramid');
    const r = target.getBoundingClientRect();
    const tx = r.left + r.width / 2;
    const ty = r.top + r.height / 2;
    const els = points.map((p) => {
      const img = document.createElement('img');
      img.src = this.runeIcon;
      img.className = 'fly-rune';
      img.style.left = `${p.x}px`;
      img.style.top = `${p.y}px`;
      img.style.transitionDuration = `${0.7 / speed.factor()}s`;
      document.body.appendChild(img);
      return { img, p };
    });
    await sleepReal(30);
    els.forEach(({ img, p }) => {
      img.style.transform = `translate(${tx - p.x}px, ${ty - p.y}px) scale(0.45)`;
      img.style.opacity = '0.3';
    });
    await sleepReal(720 / speed.factor());
    els.forEach(({ img }) => img.remove());
  }

  // ---------------------------------------------------------------- overlays
  private overlayBusy = false;
  private async showOverlay(o: { kicker?: string; title: string; amount?: string; sub?: string; cls?: string; ms: number; count?: number }) {
    const el = $('overlay');
    const card = el.querySelector('.ov-card')!;
    el.className = o.cls ?? '';
    card.querySelector('.ov-kicker')!.textContent = o.kicker ?? '';
    card.querySelector('.ov-title')!.textContent = o.title;
    const amountEl = card.querySelector('.ov-amount') as HTMLElement;
    amountEl.textContent = o.amount ?? '';
    card.querySelector('.ov-sub')!.textContent = o.sub ?? '';
    card.querySelector('.ov-hint')!.textContent = t('tapContinue');
    const title = card.querySelector('.ov-title') as HTMLElement;
    title.style.animation = 'none';
    void title.offsetWidth;
    title.style.animation = '';
    el.hidden = false;
    this.overlayBusy = true;
    // a skip tapped during the previous spin must not close this screen at once
    speed.skip = false;
    let skipped = false;
    // a tap only counts once the screen has been visible for a moment (no accidental skip)
    const openedAt = performance.now();
    const onClick = () => {
      if (performance.now() - openedAt > 650) skipped = true;
    };
    el.addEventListener('click', onClick);
    // count-up of the amount
    if (o.count !== undefined) {
      const target = o.count;
      let lastCoin = 0;
      await tween(
        Math.min(4200, 1200 + target * 4),
        (k) => {
          if (skipped) k = 1;
          amountEl.textContent = money(target * k);
          if (k - lastCoin > 0.06) {
            lastCoin = k;
            sound.coin();
          }
        },
        ease.outCubic,
      );
      amountEl.textContent = money(target);
    }
    const end = performance.now() + o.ms / speed.hold();
    while (!skipped && !(speed.skip && performance.now() - openedAt > 650) && performance.now() < end) await sleepReal(40);
    el.removeEventListener('click', onClick);
    el.hidden = true;
    this.overlayBusy = false;
  }
  get busyOverlay() {
    return this.overlayBusy;
  }

  async freeSpinsIntro(n: number, kind = 'bonus') {
    await this.showOverlay({
      kicker: t('buyName_' + kind),
      title: `${n} ${t('freeSpins')}`,
      sub: t('intro_' + kind),
      cls: kind === 'godbonus' ? 'god' : kind === 'superbonus' ? 'gold' : '',
      ms: kind === 'godbonus' ? 3400 : 2600,
    });
  }
  /** summit bonus: a BONUS symbol at the top stage adds a free spin – centred pop over the reels */
  async extraSpinPop(n: number, played: number, total: number) {
    speed.skip = false;
    const el = $('xspin');
    ($('xs-icon') as HTMLImageElement).src = this.icons.S;
    $('xs-title').textContent = t('extraSpin', { n });
    $('xs-sub').textContent = t('extraSpinSub');
    $('xs-total').textContent = t('freeSpin', { n: Math.max(1, played), t: total });
    el.classList.remove('out');
    el.hidden = false;
    // restart the CSS animations
    for (const c of Array.from(el.children) as HTMLElement[]) {
      c.style.animation = 'none';
      void c.offsetWidth;
      c.style.animation = '';
    }
    let done = false;
    // a tap only counts once the screen has been visible for a moment (no accidental skip)
    const openedAt = performance.now();
    const onClick = () => {
      if (performance.now() - openedAt > 650) done = true;
    };
    el.addEventListener('click', onClick);
    const end = performance.now() + Math.max(950, 1500 / speed.hold());
    while (!done && !(speed.skip && performance.now() - openedAt > 650) && performance.now() < end) await sleepReal(30);
    el.removeEventListener('click', onClick);
    el.classList.add('out');
    await sleepReal(240);
    el.hidden = true;
  }
  /** stage-up splash: the steles of the new stage, their value range and the extra spins */
  async stageUp(stage: number, extra: number, values: number[]) {
    const el = $('stagesplash');
    el.className = `st${stage}`;
    $('ss-kicker').textContent = t('stageNames' + stage);
    $('ss-title').textContent = t('stageUp', { n: stage });
    // which stele materials can show up now (material follows the value)
    const lvl = (v: number) => (v >= 250 ? 3 : v >= 50 ? 2 : v >= 10 ? 1 : 0);
    const keys = ['T', 'TB', 'TD', 'TO'];
    // the steles of this stage are all made of one material (stage 2 bronze, 3 diamond, 4 obsidian)
    void lvl;
    const mats = [keys[Math.max(0, Math.min(3, stage - 1))]];
    $('ss-steles').innerHTML = mats.map((k, i) => `<img src="${this.icons[k]}" alt="" style="animation-delay:${0.15 + i * 0.12}s">`).join('');
    $('ss-vals').innerHTML = `${t('steleNow')} <b>${values[0]}×–${values[values.length - 1]}×</b>`;
    $('ss-spins').textContent = t('extraSpins', { n: extra });
    el.hidden = false;
    this.overlayBusy = true;
    // a skip tapped during the previous spin must not close this screen at once
    speed.skip = false;
    let done = false;
    // a tap only counts once the screen has been visible for a moment (no accidental skip)
    const openedAt = performance.now();
    const onClick = () => {
      if (performance.now() - openedAt > 650) done = true;
    };
    el.addEventListener('click', onClick);
    const end = performance.now() + 2600 / speed.hold();
    while (!done && !(speed.skip && performance.now() - openedAt > 650) && performance.now() < end) await sleepReal(40);
    el.removeEventListener('click', onClick);
    el.classList.add('out');
    await sleepReal(280);
    el.hidden = true;
    this.overlayBusy = false;
  }
  async summary(title: string, amount: string, good: boolean) {
    await this.showOverlay({ kicker: t('fsOver'), title, amount, cls: good ? 'gold' : '', ms: 2600 });
  }
  /** end-of-bonus screen: TOTAL WIN, counting amount, number of free spins played */
  async totalWin(amount: number, spins: number, afterBig: boolean) {
    const el = $('totalwin');
    $('tw-title').textContent = t('totalWinTitle');
    $('tw-spins').textContent = t('spinsPlayed', { n: spins });
    $('tw-hint').textContent = t('tapAnywhere');
    const amt = $('tw-amount');
    el.hidden = false;
    el.classList.remove('out');
    this.overlayBusy = true;
    // a skip tapped during the previous spin must not close this screen at once
    speed.skip = false;
    let done = false;
    // a tap only counts once the screen has been visible for a moment (no accidental skip)
    const openedAt = performance.now();
    const onClick = () => {
      if (performance.now() - openedAt > 650) done = true;
    };
    el.addEventListener('click', onClick);
    sound.gong(0.25);
    // count up (quick if the big-win screen already showed the amount)
    await tween(
      afterBig ? 700 : Math.min(2400, 900 + amount * 8),
      (k) => {
        if (done) k = 1;
        amt.textContent = money(amount * k);
      },
      ease.outCubic,
    );
    amt.textContent = money(amount);
    amt.classList.remove('pop');
    void amt.offsetWidth;
    amt.classList.add('pop');
    const end = performance.now() + 6000 / speed.hold();
    done = false;
    while (!done && !(speed.skip && performance.now() - openedAt > 650) && performance.now() < end) await sleepReal(40);
    el.removeEventListener('click', onClick);
    el.classList.add('out');
    await sleepReal(300);
    el.hidden = true;
    this.overlayBusy = false;
  }

  private big: BigWin | null = null;
  /** escalating big-win celebration (BIG → MEGA → EPIC → LEGENDARY → BALAM) */
  async bigWin(amount: number, bet: number, opts: { kicker?: string; max?: boolean; onTier?: (lv: number) => void } = {}) {
    if (!this.big) this.big = new BigWin();
    this.overlayBusy = true;
    await this.big.show(amount, bet, opts);
    this.overlayBusy = false;
  }

  // ---------------------------------------------------------------- dialogs
  confirm(text: string): Promise<boolean> {
    const dlg = $<HTMLDialogElement>('confirm');
    $('confirm-text').textContent = text;
    dlg.showModal();
    return new Promise((resolve) => {
      const done = (v: boolean) => {
        dlg.close();
        $('confirm-yes').onclick = null;
        $('confirm-no').onclick = null;
        resolve(v);
      };
      $('confirm-yes').onclick = () => done(true);
      $('confirm-no').onclick = () => done(false);
    });
  }

  /**
   * Bonus & feature menu (opened with the BONUS button).
   * Feature spins toggle on/off with one tap; bonus buys need a second tap to confirm.
   */
  featureMenu(bet: number, balance: number, current: string | null): Promise<{ toggle?: string | null; buy?: string } | null> {
    const dlg = $<HTMLDialogElement>('feature-menu');
    const spins = $('fm-spins');
    const buys = $('fm-buys');
    spins.innerHTML = '';
    buys.innerHTML = '';
    $('fm-buy-section').hidden = this.buyDisabled;
    return new Promise((resolve) => {
      let settled = false;
      const done = (v: { toggle?: string | null; buy?: string } | null) => {
        if (settled) return;
        settled = true;
        dlg.close();
        resolve(v);
      };
      // ---- feature spins
      for (const m of ['bonushunt', 'jaguar', 'jaguarking']) {
        const on = current === m;
        const price = bet * MODES[m].cost;
        const card = document.createElement('div');
        card.className = `fm-card feat f-${m}${on ? ' on' : ''}`;
        card.dataset.on = t('active');
        card.innerHTML =
          `<div class="fm-art"><img alt="" src="${m === 'jaguarking' ? this.icons.TO : m === 'jaguar' ? this.icons.TG : this.icons.S}"></div>` +
          `<div class="fm-info"><b>${t(m)}</b><span class="fm-tag">${t(m + 'Long')}</span><div class="fm-chips"><i>${t('chip_' + m)}</i></div></div>` +
          `<button class="fm-action${on ? ' off' : ''}"><span></span><em></em></button>`;
        const btn = card.querySelector('button')!;
        btn.querySelector('span')!.textContent = on ? t('deactivate') : t('activate');
        btn.querySelector('em')!.textContent = on ? '' : t('perSpinShort', { v: money(price) });
        btn.disabled = !on && price > balance + 1e-9;
        btn.onclick = () => {
          sound.click();
          done({ toggle: on ? null : m });
        };
        spins.appendChild(card);
      }
      // ---- bonus buys
      let armed: string | null = null;
      const SPINS: Record<number, number> = { 1: 10, 2: 10, 3: 8 };
      const TOP: Record<number, string> = { 1: 'TB', 2: 'TD', 3: 'TO' };
      for (const b of BUYS) {
        const def = MODES[b.mode];
        const price = bet * def.cost;
        const vals = STAGE_TOTEMS[b.stage];
        const card = document.createElement('div');
        card.className = `fm-card buy t${b.stage}`;
        const scat = Array.from({ length: b.stage + 2 }, () => `<img alt="" src="${this.icons.S}">`).join('');
        card.innerHTML =
          `<div class="fm-art"><div class="fm-rays"></div><img class="fm-stele" alt="" src="${this.icons[TOP[b.stage]] ?? this.icons.T}"><div class="fm-scat">${scat}</div></div>` +
          `<div class="fm-info"><b>${t('buyName_' + b.mode)}</b><span class="fm-tag">${t('buyTag_' + b.mode)}</span>` +
          `<div class="fm-range">${vals[0]}×–${vals[vals.length - 1]}×</div>` +
          `<div class="fm-chips"><i>${t('chipSpins', { n: SPINS[b.stage] ?? 10 })}</i><i>${t('chipStage', { n: b.stage })}</i></div></div>` +
          `<button class="fm-action"><span></span><em></em></button>`;
        const btn = card.querySelector('button')!;
        const label = (armedNow: boolean) => {
          btn.querySelector('span')!.textContent = armedNow ? t('buyConfirmBtn') : t('buyBtn');
          btn.querySelector('em')!.textContent = money(price);
        };
        label(false);
        btn.disabled = price > balance + 1e-9;
        btn.onclick = () => {
          sound.click();
          if (armed === b.mode) return done({ buy: b.mode });
          armed = b.mode;
          buys.querySelectorAll('.fm-card').forEach((c) => c.classList.remove('armed'));
          buys.querySelectorAll('.fm-action span').forEach((x) => (x.textContent = t('buyBtn')));
          card.classList.add('armed');
          label(true);
        };
        buys.appendChild(card);
      }
      $('fm-close').onclick = () => done(null);
      dlg.oncancel = () => done(null);
      dlg.onclick = (e) => {
        // tap on the backdrop (outside the dialog box) closes it
        const r = dlg.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) done(null);
      };
      dlg.showModal();
    });
  }

  icons: Record<string, string> = {};

  /** Autoplay dialog: number of spins and speed (0 normal, 1 turbo, 2 super turbo). */
  autoMenu(maxSpeed: number, current: number): Promise<{ spins: number; speed: number } | null> {
    const dlg = $<HTMLDialogElement>('auto-menu');
    $('am-title').textContent = t('autoTitle');
    $('am-spins-t').textContent = t('autoSpins');
    $('am-speed-t').textContent = t('autoSpeed');
    $('am-start').textContent = t('autoStart');
    const pick = (id: string, opts: { label: string; v: number }[], def: number) => {
      const box = $(id);
      box.innerHTML = '';
      let val = opts[Math.max(0, Math.min(opts.length - 1, def))].v;
      opts.forEach((o) => {
        const b = document.createElement('button');
        b.innerHTML = o.label;
        if (o.v === val) b.classList.add('sel');
        b.onclick = () => {
          sound.click();
          val = o.v;
          box.querySelectorAll('button').forEach((x) => x.classList.remove('sel'));
          b.classList.add('sel');
        };
        box.appendChild(b);
      });
      return () => val;
    };
    const spins = pick('am-spins', [10, 25, 50, 100, 250].map((n) => ({ label: String(n), v: n })), 1);
    const bolt = '<svg viewBox="0 0 24 24" class="am-bolt"><path fill="currentColor" d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>';
    const speeds = [
      { label: t('speedNormal'), v: 0 },
      { label: `${bolt} ${t('speedTurbo')}`, v: 1 },
      { label: `${bolt}${bolt} ${t('speedSuper')}`, v: 2 },
    ].filter((o) => o.v <= maxSpeed);
    $('am-speed').parentElement!.hidden = maxSpeed === 0;
    const spd = pick('am-speed', speeds, Math.min(current, maxSpeed));
    return new Promise((resolve) => {
      let settled = false;
      const done = (v: { spins: number; speed: number } | null) => {
        if (settled) return;
        settled = true;
        dlg.close();
        resolve(v);
      };
      $('am-start').onclick = () => done({ spins: spins(), speed: spd() });
      $('am-close').onclick = () => done(null);
      dlg.oncancel = () => done(null);
      dlg.onclick = (e) => {
        const r = dlg.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) done(null);
      };
      dlg.showModal();
    });
  }

  /** turbo button look: 0 off, 1 = one bolt lit, 2 = both bolts lit */
  setTurbo(level: number) {
    const b = $('turbo-wrap');
    b.classList.toggle('lv1', level === 1);
    b.classList.toggle('lv2', level === 2);
    $('turbo-label').textContent = level === 2 ? t('superTurbo') : t('turbo').toUpperCase();
  }

  /** null = autoplay off, otherwise the number of spins left */
  setAuto(left: number | null) {
    const b = $('auto-btn');
    b.classList.toggle('active', left !== null);
    $('auto-label').textContent = left === null ? t('auto') : String(left);
    for (const id of ['feature-btn', 'bet-up', 'bet-down', 'feature-pill-off']) ($(id) as HTMLButtonElement).disabled = left !== null;
  }
  hideAuto(hide: boolean) {
    $('auto-btn').hidden = hide;
  }

  /** start screen with three feature tablets; resolves when the player continues */
  /**
   * Start screen: animated temple background, logo, three feature cards and PLAY.
   * PLAY closes two stone gates over the screen, the intro vanishes behind them and the gates
   * open onto the game.
   */
  intro(art: { logo: string; bonus: string; face: string; steles: Record<string, string> }): Promise<void> {
    const dlg = $<HTMLDialogElement>('intro');
    const bg = new IntroBg($<HTMLCanvasElement>('in-bg'));
    $('in-logo').innerHTML = `<img src="${art.logo}" alt="BALAM RISING">`;
    $('in-t1').textContent = t('introT1');
    $('in-d1').textContent = t('introD1');
    $('in-t2').textContent = t('introT2');
    $('in-d2').textContent = t('introD2');
    $('in-t3').textContent = t('introT3');
    $('in-d3').textContent = t('introD3');
    $('in-go-t').textContent = t('introGo');
    // card 1: five BONUS symbols in an arc
    $('in-a1').innerHTML =
      '<div class="in-burst"></div>' +
      [-2, -1, 0, 1, 2].map((k, i) => `<img class="in-sc" style="--k:${k};--i:${i}" src="${art.bonus}" alt="">`).join('') +
      '<div class="in-five">5×</div>';
    // card 2: roaring jaguar + max win count-up
    $('in-a2').innerHTML = `<div class="in-rays"></div><img class="in-face" src="${art.face}" alt="">`;
    const v2 = $('in-v2');
    v2.textContent = '0×';
    // card 3: stele staircase stone → obsidian
    const st: [string, string][] = [
      ['T', '2×'],
      ['TB', '25×'],
      ['TD', '250×'],
      ['TO', '500×'],
    ];
    $('in-a3').innerHTML = st.map(([k, v], i) => `<div class="in-st" style="--i:${i}"><img src="${art.steles[k]}" alt=""><b>${v}</b></div>`).join('');
    dlg.classList.remove('leaving');
    dlg.showModal();
    bg.start();
    // count the max win up once the card is in
    const target = 10000;
    const t0 = performance.now() + 900;
    const count = () => {
      if (!dlg.open) return;
      const k = Math.max(0, Math.min(1, (performance.now() - t0) / 1600));
      const e = 1 - Math.pow(1 - k, 3);
      v2.textContent = `${Math.round(target * e).toLocaleString(document.documentElement.lang === 'de' ? 'de-DE' : 'en-US')}×`;
      if (k < 1) requestAnimationFrame(count);
      else v2.classList.add('done');
    };
    requestAnimationFrame(count);

    return new Promise((resolve) => {
      let leaving = false;
      const done = async () => {
        if (leaving) return;
        leaving = true;
        sound.click();
        sound.gong(0.3);
        dlg.classList.add('leaving');
        // light surge in the background while the gates close
        const s0 = performance.now();
        const surge = () => {
          bg.surge = Math.min(1, (performance.now() - s0) / 500);
          if (dlg.open && bg.surge < 1) requestAnimationFrame(surge);
        };
        requestAnimationFrame(surge);
        const gate = $('gate');
        gate.hidden = false;
        gate.className = '';
        void gate.offsetWidth;
        gate.classList.add('closing');
        sound.doorOpen();
        await sleepReal(560);
        bg.stop();
        dlg.close();
        dlg.classList.remove('leaving');
        await sleepReal(260);
        gate.classList.remove('closing');
        gate.classList.add('opening');
        resolve();
        await sleepReal(1300);
        gate.hidden = true;
        gate.className = '';
      };
      $('in-go').onclick = done;
      dlg.oncancel = (e) => {
        e.preventDefault();
        void done();
      };
    });
  }

  showRules(html: string) {
    const dlg = $<HTMLDialogElement>('rules');
    const body = $('rules-body');
    body.innerHTML = html;
    dlg.showModal();
    body.scrollTop = 0;
    $('rules-close').textContent = '✕';
    $('rules-close').onclick = () => dlg.close();
    const tabs = Array.from(body.querySelectorAll<HTMLButtonElement>('.rt-tab'));
    const sections = Array.from(body.querySelectorAll<HTMLElement>('.rs'));
    const tabBar = body.querySelector('.rt-tabs') as HTMLElement;
    for (const b of tabs)
      b.onclick = () => {
        sound.click();
        const sec = body.querySelector<HTMLElement>('#' + b.dataset.go);
        if (sec) body.scrollTo({ top: sec.offsetTop - tabBar.offsetHeight - 6, behavior: 'smooth' });
      };
    body.onscroll = () => {
      const y = body.scrollTop + tabBar.offsetHeight + 20;
      let cur = 0;
      sections.forEach((s, i) => {
        if (s.offsetTop <= y) cur = i;
      });
      tabs.forEach((b, i) => b.classList.toggle('on', i === cur));
    };
    dlg.onclick = (e) => {
      const r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
    };
  }
}
