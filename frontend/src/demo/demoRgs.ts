import type { AuthInfo, PlayResult, Rgs, Round } from '../types';
import { MODES } from '../config';
import data from './books.json';

interface DemoBook {
  id: number;
  payoutMultiplier: number;
  events: any[];
}
interface DemoMode {
  cost: number;
  draw: number[];
  books: DemoBook[];
}

/**
 * Local stand-in for the RGS, used only when the game is opened without an rgs_url
 * (development / preview). Plays real books sampled by weight from the published math.
 */
export class DemoRgs implements Rgs {
  readonly isDemo = true;
  private balance = 1000;
  private pending = 0;
  private modes: Record<string, { draw: number[]; byId: Map<number, DemoBook> }> = {};

  constructor() {
    const modes = (data as unknown as { modes: Record<string, DemoMode> }).modes;
    for (const [name, m] of Object.entries(modes)) {
      this.modes[name] = { draw: m.draw, byId: new Map(m.books.map((b) => [b.id, b])) };
    }
  }

  async authenticate(): Promise<AuthInfo> {
    return {
      balance: this.balance,
      currency: 'USD',
      betLevels: [0.1, 0.2, 0.4, 0.6, 0.8, 1, 2, 3, 4, 5, 10, 20, 50, 100],
      defaultBet: 1,
      jurisdiction: {},
      resumeRound: null,
    };
  }

  async play(amount: number, mode: string): Promise<PlayResult> {
    const def = MODES[mode];
    const m = this.modes[mode];
    if (!def || !m) throw new Error(`unknown mode ${mode}`);
    const cost = amount * def.cost;
    if (cost > this.balance + 1e-9) {
      const e = new Error('ERR_IPB') as Error & { code: string };
      e.code = 'ERR_IPB';
      throw e;
    }
    this.balance = round2(this.balance - cost);
    // ?force=<bookId> (demo only) plays a specific book – handy for testing
    const forced = Number(new URLSearchParams(location.search).get('force'));
    const id = forced && m.byId.has(forced) ? forced : m.draw[Math.floor(Math.random() * m.draw.length)];
    const book = m.byId.get(id)!;
    this.pending = round2((book.payoutMultiplier / 100) * amount);
    await sleep(120);
    const round: Round = {
      events: book.events,
      active: book.payoutMultiplier > 0,
      payoutMultiplier: book.payoutMultiplier / 100,
      mode,
    };
    return { balance: this.balance, round };
  }

  /** Demo only: top up the play money. */
  async refill(): Promise<number> {
    this.balance = 1000;
    return this.balance;
  }

  async endRound(): Promise<number> {
    this.balance = round2(this.balance + this.pending);
    this.pending = 0;
    return this.balance;
  }
}

const round2 = (v: number) => Math.round(v * 100) / 100;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
