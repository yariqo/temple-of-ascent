import { MAX_STAGE, MODES, RUNES_PER_STAGE, STAGE_BG, STAGE_TOTEMS } from './config';
import { money } from './format';
import { t } from './i18n';
import { sleepReal, wait } from './anim';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export class Ui {
  private tiersEl = $('tiers');
  private bannerEl = $('banner');
  private winEl = $('win');
  private spinBtn = $<HTMLButtonElement>('spin');
  private toastTimer = 0;
  private stage = 0;
  private runes = 0;

  constructor() {
    this.applyTexts();
    this.buildPyramid();
  }

  applyTexts() {
    $('title').textContent = t('title');
    $('balance-label').textContent = t('balance');
    $('bet-label').textContent = t('bet');
    $('win-label').textContent = t('win');
    $('turbo-label').textContent = t('turbo');
    $('pyr-title').textContent = t('pyramid').toUpperCase();
    this.spinBtn.textContent = t('spin');
    const hunt = $('mode-bonushunt');
    hunt.querySelector('b')!.textContent = `${t('bonushunt')}`;
    hunt.querySelector('small')!.textContent = t('bonushuntDesc');
    const jag = $('mode-jaguar');
    jag.querySelector('b')!.textContent = `${t('jaguar')}`;
    jag.querySelector('small')!.textContent = t('jaguarDesc');
    $('mode-buy').querySelector('b')!.textContent = t('buy');
    $('confirm-no').textContent = t('no');
    $('confirm-yes').textContent = t('yes');
    $('rules-close').textContent = t('close');
  }

  /** mode prices depend on the bet */
  setModePrices(bet: number) {
    $('mode-bonushunt').querySelector('small')!.textContent = `${t('bonushuntDesc')} · ${money(bet * MODES.bonushunt.cost)}`;
    $('mode-jaguar').querySelector('small')!.textContent = `${t('jaguarDesc')} · ${money(bet * MODES.jaguar.cost)}`;
    $('mode-buy').querySelector('small')!.textContent = money(bet * MODES.bonus.cost);
  }

  setActiveToggle(mode: string | null) {
    for (const m of ['bonushunt', 'jaguar']) $(`mode-${m}`).classList.toggle('on', mode === m);
  }

  setBalance(v: number) {
    $('balance').textContent = money(v);
  }
  setBet(v: number) {
    $('bet').textContent = money(v);
    this.setModePrices(v);
  }
  setWin(v: number | null, big = false) {
    this.winEl.textContent = v === null ? '–' : money(v);
    this.winEl.classList.toggle('big', big);
  }

  /** Count the win display up from `from` to `to`. */
  async countWin(from: number, to: number, ms = 700) {
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      this.setWin(from + ((to - from) * i) / steps, to > 0);
      await wait(ms / steps);
    }
    this.setWin(to, to > 0);
  }

  setBusy(busy: boolean, canSkip: boolean) {
    this.spinBtn.classList.toggle('busy', busy);
    this.spinBtn.textContent = busy ? (canSkip ? t('skip') : '…') : t('spin');
    this.spinBtn.disabled = busy && !canSkip;
    for (const id of ['mode-bonushunt', 'mode-jaguar', 'mode-buy', 'bet-up', 'bet-down']) ($(id) as HTMLButtonElement).disabled = busy;
  }

  hideBuy(hide: boolean) {
    $('mode-buy').hidden = hide;
  }

  setDemo(text: string | null) {
    const b = $('demo-badge');
    b.hidden = !text;
    if (text) b.textContent = text;
  }

  hideTurbo(hide: boolean) {
    $('turbo-wrap').hidden = hide;
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
    // re-trigger css animation
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
    if (n !== null) el.textContent = t('freeSpin', { n, t: total });
  }

  /** Background + pyramid state for a stage (0 = base game). */
  setStage(stage: number, runes = this.runes, bump = false) {
    this.stage = stage;
    this.runes = runes;
    const [a, b] = STAGE_BG[stage] ?? STAGE_BG[0];
    document.documentElement.style.setProperty('--bg1', a);
    document.documentElement.style.setProperty('--bg2', b);
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
      d.className = 'tier';
      d.dataset.stage = String(s);
      d.style.width = `${50 + (MAX_STAGE - s) * 16}%`;
      const vals = STAGE_TOTEMS[s];
      d.innerHTML = `<div class="t-name">${t('stage', { n: s })}</div><div class="t-vals">${vals[0]}–${vals[vals.length - 1]}×</div><div class="t-runes"></div>`;
      const rr = d.querySelector('.t-runes')!;
      if (s < MAX_STAGE) for (let i = 0; i < RUNES_PER_STAGE; i++) rr.appendChild(Object.assign(document.createElement('span'), { className: 'rune' }));
      this.tiersEl.appendChild(d);
    }
    this.renderPyramid(false);
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
      // runes of stage s fill the progress towards stage s+1
      const runes = Array.from(el.querySelectorAll('.rune'));
      runes.forEach((r, i) => {
        const filled = this.runes - (s - 1) * RUNES_PER_STAGE;
        r.classList.toggle('on', this.stage > 0 && i < filled);
      });
    }
    const info = $('pyr-info');
    if (this.stage === 0) info.textContent = '';
    else if (this.stage >= MAX_STAGE) info.textContent = t('maxStage');
    else info.textContent = t('runesToNext', { n: this.stage * RUNES_PER_STAGE - this.runes });
  }

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

  showRules(html: string) {
    const dlg = $<HTMLDialogElement>('rules');
    $('rules-body').innerHTML = html;
    dlg.showModal();
    $('rules-close').onclick = () => dlg.close();
  }

  async idle(ms: number) {
    await sleepReal(ms);
  }
}
