const META: Record<string, { symbol: string; decimals: number; after?: boolean }> = {
  USD: { symbol: '$', decimals: 2 },
  CAD: { symbol: 'CA$', decimals: 2 },
  JPY: { symbol: '¥', decimals: 0 },
  EUR: { symbol: '€', decimals: 2 },
  RUB: { symbol: '₽', decimals: 2 },
  CNY: { symbol: 'CN¥', decimals: 2 },
  PHP: { symbol: '₱', decimals: 2 },
  INR: { symbol: '₹', decimals: 2 },
  IDR: { symbol: 'Rp', decimals: 0 },
  KRW: { symbol: '₩', decimals: 0 },
  BRL: { symbol: 'R$', decimals: 2 },
  MXN: { symbol: 'MX$', decimals: 2 },
  DKK: { symbol: 'KR', decimals: 2, after: true },
  PLN: { symbol: 'zł', decimals: 2, after: true },
  VND: { symbol: '₫', decimals: 0, after: true },
  TRY: { symbol: '₺', decimals: 2 },
  CLP: { symbol: 'CLP', decimals: 0, after: true },
  ARS: { symbol: 'ARS', decimals: 2, after: true },
  PEN: { symbol: 'S/', decimals: 2, after: true },
  XGC: { symbol: 'GC', decimals: 2 },
  XSC: { symbol: 'SC', decimals: 2 },
};

let currency = 'USD';
export function setCurrency(c: string) {
  currency = c;
}

export function money(v: number): string {
  const m = META[currency] ?? { symbol: currency, decimals: 2, after: true };
  const s = v.toLocaleString('en-US', { minimumFractionDigits: m.decimals, maximumFractionDigits: m.decimals });
  return m.after ? `${s} ${m.symbol}` : `${m.symbol}${s}`;
}
