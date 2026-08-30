/**
 * Precise money helpers using integer minor units (e.g. paise).
 * Avoids floating-point drift when summing budgets and expenses.
 */

export type MoneyMinor = number; // integer minor units only

export function assertMinor(n: number): MoneyMinor {
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new Error('Money minor units must be a finite integer');
  }
  return n;
}

/** Parse a decimal money amount (string or number) to integer minor units. */
export function toMinor(amount: string | number, decimals = 2): MoneyMinor {
  if (typeof amount === 'number') {
    if (!Number.isFinite(amount)) throw new Error('Invalid money amount');
    const f = 10 ** decimals;
    return assertMinor(Math.round(amount * f + Number.EPSILON));
  }
  const raw = amount.trim();
  if (!raw) return 0;
  const neg = raw.startsWith('-');
  const s = neg ? raw.slice(1) : raw;
  if (!/^\d+(\.\d+)?$/.test(s)) throw new Error(`Invalid money amount: ${amount}`);
  const [whole, frac = ''] = s.split('.');
  const padded = (frac + '0'.repeat(decimals)).slice(0, decimals);
  const minor = Number(whole) * 10 ** decimals + Number(padded || '0');
  return assertMinor(neg ? -minor : minor);
}

/** Convert minor units to a major-unit number with exact 2 dp for display/API. */
export function fromMinor(minor: MoneyMinor, decimals = 2): number {
  const f = 10 ** decimals;
  return assertMinor(Math.trunc(minor)) / f;
}

export function addMinor(...parts: MoneyMinor[]): MoneyMinor {
  return assertMinor(parts.reduce((s, p) => s + assertMinor(p), 0));
}

export function subMinor(a: MoneyMinor, b: MoneyMinor): MoneyMinor {
  return assertMinor(assertMinor(a) - assertMinor(b));
}

export function formatMinor(minor: MoneyMinor, currency = 'INR', locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(fromMinor(minor));
}
