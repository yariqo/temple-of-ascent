export type SymbolName = 'H1' | 'H2' | 'H3' | 'H4' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'W' | 'S' | 'T';

export interface BoardSymbol {
  name: SymbolName | string;
  multiplier?: number;
  wild?: boolean;
  scatter?: boolean;
}

/** Positions in events include the padding row (row 1 = top visible row). */
export interface Pos {
  reel: number;
  row: number;
}

export interface GameEvent {
  index: number;
  type: string;
  [key: string]: any;
}

export interface Round {
  events: GameEvent[];
  /** true while the round still has to be closed with /wallet/end-round */
  active: boolean;
  /** > 0 when the round pays something */
  payoutMultiplier: number;
  mode: string;
  /** base bet in currency units, if the RGS tells us (resumed rounds) */
  amount?: number;
}

export interface Jurisdiction {
  socialCasino?: boolean;
  disabledTurbo?: boolean;
  disabledSlamstop?: boolean;
  disabledSpacebar?: boolean;
  disabledBuyFeature?: boolean;
  displayRTP?: boolean;
  minimumRoundDuration?: number;
  [key: string]: unknown;
}

export interface AuthInfo {
  /** balance in currency units */
  balance: number;
  currency: string;
  /** bet levels in currency units */
  betLevels: number[];
  defaultBet: number;
  jurisdiction: Jurisdiction;
  /** round to resume (active) or null */
  resumeRound: Round | null;
}

export interface PlayResult {
  balance: number;
  round: Round;
}

export interface Rgs {
  readonly isDemo: boolean;
  authenticate(): Promise<AuthInfo>;
  /** amount = base bet in currency units; mode = bet mode key */
  play(amount: number, mode: string): Promise<PlayResult>;
  /** closes the round, returns the new balance */
  endRound(): Promise<number>;
}
