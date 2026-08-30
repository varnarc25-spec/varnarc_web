/** Constants for Construction Affordability Calculator. */

export const AFFORDABILITY_CALC_VERSION = '2026.08.1';

/** Recommended contingency band for construction planning (indicative). */
export const RECOMMENDED_CONTINGENCY_PERCENT = 12;

/**
 * Peak cash factor vs average monthly drawdown.
 * Early structure phases often need more than a flat monthly average.
 */
export const PEAK_CASH_FACTOR = 1.45;

/** EMI-to-income informational thresholds (not advice or lender rules). */
export const EMI_BURDEN_INFO = {
  comfortableBelow: 30,
  elevatedAbove: 40,
} as const;

/** Funding difference within this % of need is treated as roughly balanced. */
export const BALANCED_TOLERANCE_RATIO = 0.03;
