/** Deterministic currency / quantity rounding helpers. */

export function roundMoney(amount: number, decimals = 2): number {
  if (!Number.isFinite(amount)) return NaN;
  const f = 10 ** decimals;
  // Avoid IEEE edge cases for typical money magnitudes
  return Math.round((amount + Number.EPSILON) * f) / f;
}

export function roundQuantity(value: number, decimals = 6): number {
  if (!Number.isFinite(value)) return NaN;
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * f) / f;
}

export function multiplyQuantityPrice(quantity: number, unitPrice: number, decimals = 2): number {
  if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return NaN;
  return roundMoney(quantity * unitPrice, decimals);
}
