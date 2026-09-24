import { Board } from './board';
import { Ui } from './ui';
import { GOLDEN_TOTEMS, ROAR_TOTEMS, STAGE_TOTEMS, WIN_TIERS } from './config';
import { t } from './i18n';
import { money } from './format';
import { wait } from './anim';
import { sound } from './sound';
import type { GameEvent, Round } from './types';

/**
 * Plays the events ("book") of one round on the board + UI.
 * All amounts in events are 100 × multiplier of the BASE bet.
 */
export class RoundPlayer {
  private bet = 1;
  private cost = 1;
  private totalWin = 0;
  private inFreeSpins = false;
  private stage = 0;
  private scatterCount = 0;
  private capShown = false;

  constructor(private board: Board, private ui: Ui) {
    // chime for every scatter / rune that lands, rising in pitch
    board.onReelStop = (_r, syms) => {
      const n = syms.filter((s) => s.name === 'S').length;
      for (let i = 0; i < n; i++) sound.scatterLand(this.scatterCount++);
    };
  }

  private money(amount: number) {
    return (amount / 100) * this.bet;
  }

  async play(round: Round, bet: number, cost: number) {
    this.bet = bet;
    this.cost = cost;
    this.totalWin = 0;
    this.inFreeSpins = false;
    this.stage = 0;
    this.capShown = false;
    this.ui.setWin(null);
    for (const ev of round.events) await this.handle(ev);
    if (this.inFreeSpins) this.leaveFreeSpins();
  }

  private leaveFreeSpins() {
    this.inFreeSpins = false;
    this.stage = 0;
    this.ui.setFsCounter(null);
    this.ui.setStage(0, 0);
    this.board.setTheme(0);
    sound.setLoop(0);
  }

  private setStage(stage: number, runes?: number, bump = false) {
    this.stage = stage;
    this.ui.setStage(stage, runes, bump);
    this.board.setTheme(stage);
    sound.setLoop(stage);
  }

  private async handle(ev: GameEvent) {
    switch (ev.type) {
      case 'reveal': {
        this.scatterCount = 0;
        await this.board.spin(Board.visibleFromReveal(ev.board), ev.anticipation);
        await this.board.revealSteles(STAGE_TOTEMS[this.inFreeSpins ? this.stage : 0]);
        break;
      }
      case 'jaguarRoar': {
        const golden = !!ev.golden;
        void this.ui.banner(golden ? t('goldenJaguar') : t('jaguarRoar'), '', 1100, golden ? 'gold' : '');
        await this.board.dropTotems(ev.totems, golden, golden ? GOLDEN_TOTEMS : ROAR_TOTEMS);
        break;
      }
      case 'winInfo': {
        await this.board.showWins(ev.wins, money(this.money(ev.totalWin)));
        break;
      }
      case 'totemMultiplier': {
        // the steles multiply the LINE win, not the bet – say so
        const explain = `${t('lineWin')} ${money(this.money(ev.baseWin))} × ${ev.totalMult} = ${money(this.money(ev.totalWin))}`;
        await this.board.totemPower(ev.totems, ev.totalMult, explain, money(this.money(ev.totalWin)));
        break;
      }
      case 'setWin':
        break;
      case 'setTotalWin': {
        const v = this.money(ev.amount);
        if (v !== this.totalWin) {
          await this.ui.countWin(this.totalWin, v, 450);
          this.totalWin = v;
        }
        break;
      }
      case 'freeSpinTrigger': {
        await this.board.highlight(ev.positions, 1100, 0x7ff3ff);
        this.inFreeSpins = true;
        sound.gong();
        await this.ui.freeSpinsIntro(ev.totalFs);
        this.ui.setFsCounter(0, ev.totalFs);
        break;
      }
      case 'stageInfo': {
        this.inFreeSpins = true;
        this.setStage(ev.stage, ev.runes, true);
        if (ev.stage > 1) await this.ui.banner(t('stage', { n: ev.stage }), t('startsHigher'), 1500, 'gold');
        break;
      }
      case 'updateFreeSpin': {
        this.ui.setFsCounter(ev.amount + 1, ev.total);
        this.board.clearWins();
        await wait(120);
        break;
      }
      case 'runeCollect': {
        sound.rune();
        const pts = ev.positions.map((p: any) => this.board.pagePoint(p));
        const hl = this.board.highlight(ev.positions, 650, 0x7ff3ff);
        await this.ui.flyRunes(pts, this.stage);
        await hl;
        this.ui.setRunes(ev.runes);
        break;
      }
      case 'stageUp': {
        sound.gong(0.45);
        const vals = STAGE_TOTEMS[ev.stage];
        this.setStage(ev.stage, undefined, true);
        this.board.celebrate(24);
        await this.ui.stageUp(ev.stage, ev.extraSpins, `${vals[0]}–${vals[vals.length - 1]}×`);
        break;
      }
      case 'freeSpinEnd': {
        const v = this.money(ev.amount);
        await this.ui.summary(t('totalFs'), money(v), v >= this.bet * this.cost);
        this.leaveFreeSpins();
        break;
      }
      case 'wincap': {
        this.capShown = true;
        sound.fanfare();
        this.board.celebrate(80);
        await this.ui.bigWin(t('maxWin'), this.money(ev.amount), 'god');
        break;
      }
      case 'finalWin': {
        const v = this.money(ev.amount);
        this.ui.setWin(v, v > 0);
        await this.celebrate(v);
        break;
      }
      default:
        break;
    }
  }

  /** Big-win overlay – never for wins below the round cost. */
  private async celebrate(win: number) {
    if (this.capShown || win < this.bet * this.cost) return;
    const x = win / this.bet;
    const tier = WIN_TIERS.find((w) => x >= w.min);
    if (!tier) return;
    sound.fanfare();
    this.board.celebrate(tier.min >= 500 ? 90 : tier.min >= 100 ? 60 : 36);
    await this.ui.bigWin(t(tier.key), win, tier.min >= 500 ? 'god' : tier.min >= 100 ? 'gold' : '');
  }
}
