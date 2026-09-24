import { Board } from './board';
import { Ui } from './ui';
import { BONUS_BY_SCATTERS, GOLDEN_TOTEMS, ROAR_TOTEMS, STAGE_TOTEMS } from './config';
import { BIG_TIERS } from './bigwin';
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
  private finalAmount = 0;

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
    this.finalAmount = this.money(round.events.find((e) => e.type === 'finalWin')?.amount ?? 0);
    this.ui.setWin(null);
    for (const ev of round.events) await this.handle(ev);
    if (this.inFreeSpins) this.leaveFreeSpins();
  }

  private leaveFreeSpins() {
    this.inFreeSpins = false;
    this.stage = 0;
    this.ui.setFsCounter(null);
    this.board.setKept(null);
    this.board.mascot.setFreeSpins(false);
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
        this.board.mascot.watch();
        await this.board.spin(Board.visibleFromReveal(ev.board), ev.anticipation);
        this.board.mascot.relax();
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
        // the jaguar only cheers for real wins (≥ round cost) – or any win inside free spins
        if (this.inFreeSpins || this.money(ev.totalWin) >= this.bet * this.cost) void this.board.mascot.happy();
        await this.board.showWins(ev.wins, money(this.money(ev.totalWin)));
        break;
      }
      case 'totemMultiplier': {
        // the steles multiply the LINE win, not the bet – say so
        const kept = ev.keptMult ?? 0;
        const explain =
          kept > 0
            ? t('keptExplain', { a: `${t('lineWin')} ${money(this.money(ev.baseWin))}`, m: ev.totalMult, b: ev.totalMult - kept, k: kept, c: money(this.money(ev.totalWin)) })
            : `${t('lineWin')} ${money(this.money(ev.baseWin))} × ${ev.totalMult} = ${money(this.money(ev.totalWin))}`;
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
        this.board.mascot.setFreeSpins(true);
        void this.board.mascot.roar();
        sound.bonusChime();
        window.setTimeout(() => sound.gong(), 350);
        await this.board.bonusHit(ev.positions);
        this.inFreeSpins = true;
        const kind = BONUS_BY_SCATTERS[Math.min(5, ev.positions?.length ?? 3)] ?? 'bonus';
        await this.ui.freeSpinsIntro(ev.totalFs, kind);
        this.ui.setFsCounter(0, ev.totalFs);
        break;
      }
      case 'multCollect': {
        await this.board.collectKept(ev.totems, ev.total);
        break;
      }
      case 'stageInfo': {
        this.inFreeSpins = true;
        this.board.setKept(ev.divine ? 0 : null);
        this.board.mascot.setFreeSpins(true);
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
        sound.bonusChime();
        const vals = STAGE_TOTEMS[ev.stage];
        this.setStage(ev.stage, undefined, true);
        this.board.celebrate(24);
        void this.board.mascot.jump(1);
        await this.ui.stageUp(ev.stage, ev.extraSpins, `${vals[0]}–${vals[vals.length - 1]}×`);
        break;
      }
      case 'freeSpinEnd': {
        // one closing screen: the big-win screen if the round qualifies, otherwise the summary
        const tier = this.tierFor(this.finalAmount);
        if (tier && !this.capShown) {
          this.capShown = true;
          await this.ui.bigWin(this.finalAmount, this.bet, { kicker: t('fsOver'), onTier: (lv) => this.onTier(lv) });
        } else if (!this.capShown) {
          const v = this.money(ev.amount);
          await this.ui.summary(t('totalFs'), money(v), v >= this.bet * this.cost);
        }
        this.leaveFreeSpins();
        break;
      }
      case 'wincap': {
        this.capShown = true;
        await this.ui.bigWin(this.money(ev.amount), this.bet, { max: true, onTier: (lv) => this.onTier(lv) });
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

  /** Big-win celebration only from 20× bet and never for wins below the round cost. */
  private tierFor(win: number) {
    if (win < this.bet * this.cost) return undefined;
    return [...BIG_TIERS].reverse().find((w) => win / this.bet >= w.min);
  }

  /** the board and the jaguar react to every big-win tier */
  private onTier(lv: number) {
    this.board.celebrate(20 + lv * 16);
    if (lv >= 3) void this.board.shake(8 + lv * 3, 450);
    if (lv >= 4) void this.board.mascot.roar();
    else void this.board.mascot.jump(lv >= 2 ? 2 : 1);
  }

  private async celebrate(win: number) {
    if (this.capShown) return;
    const tier = this.tierFor(win);
    if (!tier) return;
    await this.ui.bigWin(win, this.bet, { onTier: (lv) => this.onTier(lv) });
  }
}
