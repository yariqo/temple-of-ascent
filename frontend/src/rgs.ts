import type { AuthInfo, GameEvent, PlayResult, Rgs, Round } from './types';

/** Stake Engine money: integers with 6 decimals. */
export const API_MULTIPLIER = 1_000_000;

export class RgsError extends Error {
  constructor(public code: string, message?: string) {
    super(message ?? code);
  }
}

export function urlParam(key: string): string | null {
  return new URLSearchParams(window.location.search).get(key);
}

function rgsBase(rgsUrl: string): string {
  return rgsUrl.startsWith('http') ? rgsUrl.replace(/\/$/, '') : `https://${rgsUrl.replace(/\/$/, '')}`;
}

export function parseRound(raw: any): Round | null {
  if (!raw) return null;
  const events: GameEvent[] = Array.isArray(raw.state) ? raw.state : Array.isArray(raw.events) ? raw.events : [];
  if (events.length === 0) return null;
  return {
    events,
    active: raw.active === true,
    payoutMultiplier: Number(raw.payoutMultiplier ?? 0),
    mode: String(raw.mode ?? 'base').toLowerCase(),
    amount: raw.amount ? Number(raw.amount) / API_MULTIPLIER : undefined,
  };
}

/** Talks to the real Stake Engine RGS (game opened with ?sessionID=..&rgs_url=..). */
export class StakeRgs implements Rgs {
  readonly isDemo = false;
  private currency = 'USD';

  constructor(private rgsUrl: string, private sessionID: string, private lang: string) {}

  private async post(path: string, body: Record<string, unknown>): Promise<any> {
    let res: Response;
    try {
      res = await fetch(`${rgsBase(this.rgsUrl)}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      throw new RgsError('ERR_NETWORK');
    }
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      /* empty body */
    }
    if (!res.ok || data?.error) {
      throw new RgsError(data?.error ?? data?.code ?? `HTTP_${res.status}`, data?.message);
    }
    return data;
  }

  async authenticate(): Promise<AuthInfo> {
    const d = await this.post('/wallet/authenticate', { sessionID: this.sessionID, language: this.lang });
    this.currency = d.balance?.currency ?? 'USD';
    const cfg = d.config ?? {};
    const levels: number[] = (cfg.betLevels ?? []).map((v: number) => v / API_MULTIPLIER);
    const round = parseRound(d.round);
    return {
      balance: (d.balance?.amount ?? 0) / API_MULTIPLIER,
      currency: this.currency,
      betLevels: levels.length ? levels : [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100],
      defaultBet: (cfg.defaultBetLevel ?? 1_000_000) / API_MULTIPLIER,
      jurisdiction: cfg.jurisdiction ?? {},
      resumeRound: round && round.active ? round : null,
    };
  }

  async play(amount: number, mode: string): Promise<PlayResult> {
    const d = await this.post('/wallet/play', {
      sessionID: this.sessionID,
      currency: this.currency,
      mode: mode.toUpperCase(),
      amount: Math.round(amount * API_MULTIPLIER),
    });
    const round = parseRound(d.round);
    if (!round) throw new RgsError('ERR_EMPTY_ROUND');
    return { balance: (d.balance?.amount ?? 0) / API_MULTIPLIER, round };
  }

  async endRound(): Promise<number> {
    const d = await this.post('/wallet/end-round', { sessionID: this.sessionID });
    return (d.balance?.amount ?? 0) / API_MULTIPLIER;
  }

  /** Mark progress inside a long round (used for resuming after a disconnect). */
  async event(eventIndex: number): Promise<void> {
    try {
      await this.post('/bet/event', { sessionID: this.sessionID, event: String(eventIndex) });
    } catch {
      /* not critical */
    }
  }
}

/** Replay of a finished round: ?replay=true&game=..&version=..&mode=..&event=..&amount=..&rgs_url=.. */
export async function fetchReplay(): Promise<{ round: Round; amount: number } | null> {
  const rgsUrl = urlParam('rgs_url');
  if (!rgsUrl) return null;
  const path = `/bet/replay/${urlParam('game')}/${urlParam('version')}/${urlParam('mode')}/${urlParam('event')}`;
  const res = await fetch(`${rgsBase(rgsUrl)}${path}`);
  if (!res.ok) throw new RgsError(`HTTP_${res.status}`);
  const data = await res.json();
  const round = parseRound({ ...data, mode: urlParam('mode') ?? 'base' });
  if (!round) return null;
  return { round, amount: Number(urlParam('amount') ?? 0) / API_MULTIPLIER || 1 };
}
