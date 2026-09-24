import { Board } from './board';
import { Ui } from './ui';
import { STAGE_TOTEMS, WIN_TIERS } from './config';
import { t } from './i18n';
import { money } from './format';
import { wait } from './anim';
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

  constructor(private board: Board, private ui: Ui, private onEvent?: (index: number) => void) {}

  private money(amount: number) {
    return (amount / 100) * this.bet;
  }

  async play(round: Round, bet: number, cost: number) {
    this.bet = bet;
    this.cost = cost;
    this.totalWin = 0;
    this.inFreeSpins = false;
    this.ui.setWin(null);
    for (const ev of round.events) {
      await this.handle(ev);
      this.onEvent?.(ev.index);
    }
    // back to base look
    if (this.inFreeSpins) this.leaveFreeSpins();
  }

  private leaveFreeSpins() {
    this.inFreeSpins = false;
    this.ui.setFsCounter(null);
    this.ui.setStage(0, 0);
    this.board.setTheme(0);
  }

  private async handle(ev: GameEvent) {
    switch (ev.type) {
      case 'reveal': {
        const free = ev.gameType === 'freegame';
        if (free && !this.inFreeSpins) this.inFreeSpins = true;
        await this.board.spin(Board.visibleFromReveal(ev.board), ev.anticipation);
        break;
      }
      case 'jaguarRoar': {
        const golden = !!ev.golden;
        const banner = this.ui.banner(golden ? t('goldenJaguar') : t('jaguarRoar'), '', 900);
        await this.board.dropTotems(ev.totems, golden);
        await banner;
        break;
      }
      case 'winInfo': {
        await this.board.showWins(ev.wins);
        break;
      }
      case 'totemMultiplier': {
        await this.board.totemPower(ev.totems, ev.totalMult);
        break;
      }
      case 'setWin':
        // per-spin win; the running total is shown via setTotalWin
        break;
      case 'setTotalWin': {
        const v = this.money(ev.amount);
        if (v !== this.totalWin) {
          await this.ui.countWin(this.totalWin, v, 500);
          this.totalWin = v;
        }
        break;
      }
      case 'freeSpinTrigger': {
        await this.board.highlight(ev.positions, 1000);
        this.inFreeSpins = true;
        await this.ui.banner(`${ev.totalFs} ${t('freeSpins')}`, t('stage', { n: 1 }), 1800);
        this.ui.setFsCounter(0, ev.totalFs);
        break;
      }
      case 'stageInfo': {
        this.ui.setStage(ev.stage, ev.runes, true);
        this.board.setTheme(ev.stage);
        break;
      }
      case 'updateFreeSpin': {
        this.ui.setFsCounter(ev.amount + 1, ev.total);
        this.board.clearWins();
        await wait(150);
        break;
      }
      case 'runeCollect': {
        await this.board.highlight(ev.positions, 700);
        this.ui.setRunes(ev.runes);
        break;
      }
      case 'stageUp': {
        this.ui.setStage(ev.stage, undefined, true);
        this.board.setTheme(ev.stage);
        const vals = STAGE_TOTEMS[ev.stage];
        await this.ui.banner(
          t('stageUp', { n: ev.stage }),
          `${t('extraSpins', { n: ev.extraSpins })} · ${t('newTotems', { v: `${vals[0]}–${vals[vals.length - 1]}×` })}`,
          2000,
        );
        break;
      }
      case 'freeSpinEnd': {
        const v = this.money(ev.amount);
        await this.ui.banner(t('totalFs'), money(v), 2200);
        this.leaveFreeSpins();
        break;
      }
      case 'wincap': {
        await this.ui.banner(t('maxWin'), money(this.money(ev.amount)), 2600, 'god');
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

  /** Big-win banner – never for wins below the round cost. */
  private async celebrate(win: number) {
    const x = win / this.bet;
    if (win < this.bet * this.cost) return;
    const tier = WIN_TIERS.find((w) => x >= w.min);
    if (!tier) return;
    await this.ui.banner(t(tier.key), money(win), tier.min >= 1000 ? 3200 : 2200, tier.min >= 500 ? 'god' : '');
  }
}
