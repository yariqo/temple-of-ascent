/** Static game configuration for the frontend. Must match math/temple_of_ascent/game_config.py */

export const REELS = 5;
export const ROWS = 4;

export interface ModeDef {
  key: string; // bet mode name as in index.json (sent upper-case to the RGS)
  cost: number;
  kind: 'spin' | 'toggle' | 'buy';
}

export const MODES: Record<string, ModeDef> = {
  base: { key: 'base', cost: 1, kind: 'spin' },
  bonushunt: { key: 'bonushunt', cost: 1.5, kind: 'toggle' },
  jaguar: { key: 'jaguar', cost: 25, kind: 'toggle' },
  jaguarking: { key: 'jaguarking', cost: 200, kind: 'toggle' },
  bonus: { key: 'bonus', cost: 100, kind: 'buy' },
  superbonus: { key: 'superbonus', cost: 200, kind: 'buy' },
  godbonus: { key: 'godbonus', cost: 500, kind: 'buy' },
};

/** Bonus-buy menu entries: mode, starting stage. 3 / 4 / 5 BONUS symbols trigger the same bonuses. */
export const BUYS: { mode: string; stage: number }[] = [
  { mode: 'bonus', stage: 1 },
  { mode: 'superbonus', stage: 2 },
  { mode: 'godbonus', stage: 3 },
];

/** Values a jaguar-thrown stele can show (normal roar / golden Jaguar-Spin). */
export const ROAR_TOTEMS = [2, 3, 5, 10, 25];
export const GOLDEN_TOTEMS = [5, 10, 15, 25, 50];
/** Jaguar King (premium feature spin): only king steles 50×–500× */
export const KING_TOTEMS = [50, 100, 250, 500];

/** Totem values per stage (0 = base game), for the pyramid panel. */
export const STAGE_TOTEMS: Record<number, number[]> = {
  0: [2, 3, 5, 10],
  1: [2, 3, 5, 10, 25],
  2: [5, 10, 15, 25, 50],
  3: [10, 20, 25, 50, 100, 250],
  4: [25, 50, 100, 250, 500],
};
export const RUNES_PER_STAGE = 3;
/** number of BONUS symbols -> bonus mode */
export const BONUS_BY_SCATTERS: Record<number, string> = { 3: 'bonus', 4: 'superbonus', 5: 'godbonus' };
export const MAX_STAGE = 4;

/** Placeholder look of every symbol (final art replaces this). */
export const SYMBOL_STYLE: Record<string, { icon: string; label: string; bg: number; fg: number }> = {
  H1: { icon: '🐆', label: 'JAGUAR', bg: 0xb8860b, fg: 0xfff3c4 },
  H2: { icon: '🦜', label: 'QUETZAL', bg: 0x1f7a4d, fg: 0xd9ffe9 },
  H3: { icon: '🐍', label: 'SERPENT', bg: 0x6b3fa0, fg: 0xf0e2ff },
  H4: { icon: '🐸', label: 'IDOL', bg: 0x9c6b1e, fg: 0xffe9b8 },
  L1: { icon: '◆', label: 'JADE', bg: 0x2e6b57, fg: 0x7fffd4 },
  L2: { icon: '◆', label: 'TURQ', bg: 0x245e73, fg: 0x5fe3ff },
  L3: { icon: '◆', label: 'GOLD', bg: 0x6b5a24, fg: 0xffd84d },
  L4: { icon: '◆', label: 'OBSID', bg: 0x2b2b38, fg: 0xb9b3ff },
  L5: { icon: '◆', label: 'RUBY', bg: 0x6b2430, fg: 0xff6b81 },
  W: { icon: '☀️', label: 'WILD', bg: 0xe0a100, fg: 0x3a2400 },
  S: { icon: '🔆', label: 'RUNE', bg: 0x0f5c78, fg: 0xaaf3ff },
  T: { icon: '🗿', label: 'STELE', bg: 0x5a5146, fg: 0xffffff },
};

/** Symbols used for the blurred strip while reels spin. */
export const FILLER: string[] = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'L5', 'L1', 'L2', 'L3', 'L4', 'L5', 'W'];

/** Colour tier of a totem multiplier. */
export function totemTier(m: number): { color: number; name: string } {
  if (m >= 500) return { color: 0xffe066, name: 'sun' };
  if (m >= 250) return { color: 0xff5a1f, name: 'obsidian' };
  if (m >= 50) return { color: 0xffc233, name: 'gold' };
  if (m >= 10) return { color: 0x3ddc97, name: 'jade' };
  return { color: 0xc9c2b8, name: 'stone' };
}

/** Big-win names (multiples of the BASE bet); only shown when the win also reaches the round cost. */

export const STAGE_BG: Record<number, [string, string]> = {
  0: ['#0d2b1f', '#123d2b'], // jungle
  1: ['#10301f', '#1d4a2c'], // jungle floor
  2: ['#2b2413', '#4a3a19'], // temple stairs, torches
  3: ['#3a1a14', '#6b2a18'], // sacrifice platform, dusk
  4: ['#050507', '#1a1030'], // eclipse
};

/** Line pays in × total bet for 3 / 4 / 5 of a kind (math: game_config.py). */
export const PAYTABLE: Record<string, [number, number, number]> = {
  H1: [1.5, 6, 30],
  H2: [1.2, 5, 20],
  H3: [1.0, 3, 12],
  H4: [0.8, 2.5, 10],
  L1: [0.5, 1.2, 5],
  L2: [0.4, 1.0, 4],
  L3: [0.3, 0.8, 3],
  L4: [0.2, 0.6, 2.5],
  L5: [0.2, 0.5, 2],
};
