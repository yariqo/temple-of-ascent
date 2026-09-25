import { Board } from './board';
import { Ui } from './ui';
import { BONUS_BY_SCATTERS, GOLDEN_TOTEMS, KING_TOTEMS, ROAR_TOTEMS, STAGE_TOTEMS } from './config';
import { BIG_TIERS } from './bigwin';

/** big-win celebration for Jaguar / Jaguar King spins measured against the bet (not the spin price) */
const CELEBRATE_FEATURE_WINS = true;
import { t } from './i18n';
import { money } from './format';
import { speed, wait } from './anim';
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
  private featureSpin = false;
  private spinsPlayed = 0;
  /** a single-spin round that ends in a big win: keep the amount hidden until the big-win screen */
  private quiet = false;
  /** a free spin whose own win is a big win (≥20×): same treatment inside the bonus */
  private spinQuiet = false;
  private events: GameEvent[] = [];
  private idx = 0;
  private get hidden() {
    return this.quiet || this.spinQuiet;
  }

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
    this.featureSpin = round.mode === 'jaguar' || round.mode === 'jaguarking';
    this.totalWin = 0;
    this.inFreeSpins = false;
    this.stage = 0;
    this.capShown = false;
    this.spinsPlayed = 0;
    this.finalAmount = this.money(round.events.find((e) => e.type === 'finalWin')?.amount ?? 0);
    this.ui.setWin(null);
    const hasBonus = round.events.some((e) => e.type === 'freeSpinTrigger');
    this.quiet = !hasBonus && !!this.tierFor(this.finalAmount);
    this.events = round.events;
    for (this.idx = 0; this.idx < this.events.length; this.idx++) await this.handle(this.events[this.idx]);
    this.quiet = false;
    this.spinQuiet = false;
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
        this.spinQuiet = this.inFreeSpins && this.spinWinAhead() / this.bet >= BIG_TIERS[0].min;
        this.board.mascot.watch();
        await this.board.spin(Board.visibleFromReveal(ev.board), ev.anticipation);
        this.board.mascot.relax();
        await this.board.revealSteles(STAGE_TOTEMS[this.inFreeSpins ? this.stage : 0]);
        break;
      }
      case 'jaguarRoar': {
        const golden = !!ev.golden;
        if (!this.inFreeSpins) sound.hype(1);
        void this.ui.banner(ev.king ? t('kingJaguar') : golden ? t('goldenJaguar') : t('jaguarRoar'), '', 1100, golden ? 'gold' : '');
        await this.board.dropTotems(ev.totems, golden, ev.king ? KING_TOTEMS : golden ? GOLDEN_TOTEMS : ROAR_TOTEMS);
        break;
      }
      case 'winInfo': {
        // the jaguar only cheers for real wins (≥ round cost) – or any win inside free spins
        if (!this.hidden && (this.inFreeSpins || this.money(ev.totalWin) >= this.bet * this.cost)) void this.board.mascot.happy();
        await this.board.showWins(ev.wins, this.hidden ? '' : money(this.money(ev.totalWin)), (w) => money(this.money(w)));
        break;
      }
      case 'totemMultiplier': {
        // the steles multiply the LINE win, not the bet – say so
        if (this.hidden) await this.board.totemPower(ev.totems, ev.totalMult, '', '');
        else await this.board.totemPower(ev.totems, ev.totalMult, money(this.money(ev.baseWin)), money(this.money(ev.totalWin)));
        break;
      }
      case 'setWin': {
        // big free-spin win: the celebration reveals the amount, the bonus total counts on afterwards
        if (this.spinQuiet) {
          this.spinQuiet = false;
          await this.ui.bigWin(this.money(ev.amount), this.bet, { onTier: (lv) => this.onTier(lv) });
        }
        break;
      }
      case 'setTotalWin': {
        const v = this.money(ev.amount);
        if (v !== this.totalWin) {
          if (!this.quiet) await this.ui.countWin(this.totalWin, v, 450);
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
        // let the temple wake up before the first spin
        await this.ui.templeReady();
        // Super / Divine Bonus start higher up: the same climb as a real stage-up
        if (ev.stage > 1) {
          sound.bonusChime();
          await this.ui.templeSurge(ev.stage);
          await this.ui.stageUp(ev.stage, 0, STAGE_TOTEMS[ev.stage]);
        }
        break;
      }
      case 'updateFreeSpin': {
        // a tap skips only the spin that is running – every new free spin plays at normal speed again
        speed.skip = false;
        this.spinsPlayed = ev.amount + 1;
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
      case 'extraSpin': {
        sound.bonusChime();
        const pop = this.ui.extraSpinPop(ev.extraSpins, this.spinsPlayed, ev.totalFs);
        await wait(380);
        this.ui.setFsCounter(this.spinsPlayed, ev.totalFs);
        this.ui.bumpFsCounter();
        await pop;
        break;
      }
      case 'stageUp': {
        sound.bonusChime();
        const vals = STAGE_TOTEMS[ev.stage];
        this.setStage(ev.stage, undefined, true);
        this.board.celebrate(8);
        void this.board.mascot.jump(1);
        await this.ui.templeSurge(ev.stage);
        await this.ui.stageUp(ev.stage, ev.extraSpins, vals);
        break;
      }
      case 'freeSpinEnd': {
        // one closing screen: the big-win screen if the round qualifies, otherwise the summary
        // big bonus: the big-win celebration first … then always the TOTAL WIN screen
        const tier = this.tierFor(this.finalAmount);
        if (tier && !this.capShown) {
          this.capShown = true;
          await this.ui.bigWin(this.finalAmount, this.bet, { kicker: t('fsOver'), onTier: (lv) => this.onTier(lv) });
        }
        this.capShown = true;
        await this.ui.totalWin(this.money(ev.amount), this.spinsPlayed, !!tier);
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
        // big win: the celebration comes first, the win bar is filled afterwards
        if (this.quiet) {
          await this.celebrate(v);
          this.ui.setWin(v, v > 0);
        } else {
          this.ui.setWin(v, v > 0);
          await this.celebrate(v);
        }
        break;
      }
      default:
        break;
    }
  }

  /** win of the current free spin (from its setWin event), looked up before the reels stop */
  private spinWinAhead(): number {
    for (let i = this.idx + 1; i < this.events.length; i++) {
      const e = this.events[i];
      if (e.type === 'setWin') return this.money(e.amount);
      if (e.type === 'reveal' || e.type === 'updateFreeSpin' || e.type === 'freeSpinEnd') break;
    }
    return 0;
  }

  /** Big-win celebration only from 20× bet and never for wins below the round cost. */
  private tierFor(win: number) {
    // Jaguar / Jaguar King spins: celebrate from 20× the bet like a normal spin, even below the
    // (high) price of the feature spin – can be switched off with CELEBRATE_FEATURE_WINS
    const floor = this.featureSpin && CELEBRATE_FEATURE_WINS ? 0 : this.bet * this.cost;
    if (win <= 0 || win < floor) return undefined;
    return [...BIG_TIERS].reverse().find((w) => win / this.bet >= w.min);
  }

  /** the board and the jaguar react to every big-win tier */
  private onTier(lv: number) {
    sound.hype(lv);
    if (lv >= 3) void this.board.shake(8 + lv * 3, 450);
    if (lv >= 4) void this.board.mascot.roar();
    else void this.board.mascot.jump(lv >= 2 ? 2 : 1);
  }

  private async celebrate(win: number) {
    if (this.capShown) return;
    const tier = this.tierFor(win);
    if (!tier) {
      // a solid win without a celebration still lifts the music a little
      if (win / this.bet >= 8) sound.hype(1);
      return;
    }
    await this.ui.bigWin(win, this.bet, { onTier: (lv) => this.onTier(lv) });
  }
}
