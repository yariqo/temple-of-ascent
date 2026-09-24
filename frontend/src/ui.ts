import { BUYS, MAX_STAGE, MODES, RUNES_PER_STAGE, STAGE_TOTEMS } from './config';
import { money } from './format';
import { t } from './i18n';
import { ease, sleepReal, tween, wait, speed } from './anim';
import { sound } from './sound';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export class Ui {
  private tiersEl = $('tiers');
  private bannerEl = $('banner');
  private winEl = $('win');
  private spinBtn = $<HTMLButtonElement>('spin');
  private toastTimer = 0;
  private stage = 0;
  private runes = 0;
  private sceneUrls: string[] = [];
  private sceneFront: 'a' | 'b' = 'a';
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
    $('spin').classList.toggle('jaguar', mode === 'jaguar');
    $('spin-label').textContent = mode === 'jaguar' ? t('spinJaguar') : t('spin');
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
    else $('spin-label').textContent = this.toggle === 'jaguar' ? t('spinJaguar') : t('spin');
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

  setFsCounter(n: number | null, total = 0) {
    const el = $('fs-counter');
    el.hidden = n === null;
    if (n !== null) el.textContent = t('freeSpin', { n: Math.max(1, n), t: total });
  }

  // ---------------------------------------------------------------- scenes
  setSceneUrls(urls: string[]) {
    this.sceneUrls = urls;
    this.showScene(0);
  }
  private showScene(stage: number) {
    if (stage === this.sceneShown || !this.sceneUrls[stage]) return;
    this.sceneShown = stage;
    const next = this.sceneFront === 'a' ? 'b' : 'a';
    const nextEl = $(`scene-${next}`);
    const curEl = $(`scene-${this.sceneFront}`);
    nextEl.style.backgroundImage = `url(${this.sceneUrls[stage]})`;
    nextEl.classList.add('on');
    curEl.classList.remove('on');
    this.sceneFront = next;
  }

  /** Background + pyramid state for a stage (0 = base game). */
  setStage(stage: number, runes = this.runes, bump = false) {
    if (this.stage === 0 && stage > 0) sound.doorOpen();
    this.stage = stage;
    this.runes = runes;
    this.showScene(stage);
    $('pyramid').classList.toggle('active', stage > 0);
    this.renderPyramid(bump);
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
    let skipped = false;
    const onClick = () => (skipped = true);
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
    const end = performance.now() + o.ms / speed.factor();
    while (!skipped && !speed.skip && performance.now() < end) await sleepReal(40);
    el.removeEventListener('click', onClick);
    el.hidden = true;
    this.overlayBusy = false;
  }
  get busyOverlay() {
    return this.overlayBusy;
  }

  async freeSpinsIntro(n: number) {
    await this.showOverlay({ kicker: t('templeAwakes'), title: `${n} ${t('freeSpins')}`, sub: t('fsIntroSub'), ms: 2600 });
  }
  async stageUp(stage: number, extra: number, vals: string) {
    await this.showOverlay({
      kicker: t('stageNames' + stage),
      title: t('stageUp', { n: stage }),
      sub: `${t('extraSpins', { n: extra })} · ${t('newTotems', { v: vals })}`,
      cls: stage >= 4 ? 'god' : '',
      ms: 2600,
    });
  }
  async summary(title: string, amount: string, good: boolean) {
    await this.showOverlay({ kicker: t('fsOver'), title, amount, cls: good ? 'gold' : '', ms: 2600 });
  }
  async bigWin(title: string, amount: number, cls: string, kicker = '') {
    await this.showOverlay({ kicker, title, count: amount, cls, ms: 1800 });
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
      for (const m of ['bonushunt', 'jaguar']) {
        const on = current === m;
        const price = bet * MODES[m].cost;
        const card = document.createElement('div');
        card.className = `fm-card${on ? ' on' : ''}`;
        card.dataset.on = t('active');
        card.innerHTML = `<div class="fm-art"><img alt="" src="${m === 'jaguar' ? this.icons.TG : this.icons.S}"></div><b>${t(m)}</b><p>${t(m + 'Long')}</p><div class="fm-price">${t('perSpin', { v: money(price) })}</div><button class="fm-action${on ? ' off' : ''}"></button>`;
        const btn = card.querySelector('button')!;
        btn.textContent = on ? t('deactivate') : t('activate');
        btn.disabled = !on && price > balance + 1e-9;
        btn.onclick = () => {
          sound.click();
          done({ toggle: on ? null : m });
        };
        spins.appendChild(card);
      }
      // ---- bonus buys
      let armed: string | null = null;
      for (const b of BUYS) {
        const def = MODES[b.mode];
        const price = bet * def.cost;
        const vals = STAGE_TOTEMS[b.stage];
        const card = document.createElement('div');
        card.className = 'fm-card';
        const pyr = Array.from({ length: MAX_STAGE }, (_, i) => `<i class="${i < b.stage ? 'lit' : ''}" style="width:${56 - i * 11}px"></i>`).join('');
        card.innerHTML = `<div class="fm-art"><div class="fm-pyr">${pyr}</div></div><b>${t('buyName_' + b.mode)}</b><p>${t('buyDesc', { n: b.stage, v: `${vals[0]}–${vals[vals.length - 1]}×` })}</p><div class="fm-price">${money(price)}</div><button class="fm-action"></button>`;
        const btn = card.querySelector('button')!;
        btn.textContent = t('buyBtn');
        btn.disabled = price > balance + 1e-9;
        btn.onclick = () => {
          sound.click();
          if (armed === b.mode) return done({ buy: b.mode });
          armed = b.mode;
          buys.querySelectorAll('.fm-card').forEach((c) => c.classList.remove('armed'));
          buys.querySelectorAll('.fm-action').forEach((x) => ((x as HTMLButtonElement).textContent = t('buyBtn')));
          card.classList.add('armed');
          btn.textContent = t('buyNow', { v: money(price) });
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

  showRules(html: string) {
    const dlg = $<HTMLDialogElement>('rules');
    $('rules-body').innerHTML = html;
    dlg.showModal();
    $('rules-close').onclick = () => dlg.close();
  }
}
