import { roundQuantity } from './money';

/**
 * Apply wastage percent: qty * (1 + wastage/100).
 * Wastage must be in [0, maxPercent].
 */
export function applyWastage(
  quantity: number,
  wastagePercent: number,
  maxPercent = 100,
): { ok: true; value: number } | { ok: false; error: string } {
  if (!Number.isFinite(quantity) || !Number.isFinite(wastagePercent)) {
    return { ok: false, error: 'Quantity and wastage must be finite numbers' };
  }
  if (wastagePercent < 0) {
    return { ok: false, error: 'Wastage cannot be negative' };
  }
  if (wastagePercent > maxPercent) {
    return { ok: false, error: `Wastage cannot exceed ${maxPercent}%` };
  }
  const value = roundQuantity(quantity * (1 + wastagePercent / 100));
  if (!Number.isFinite(value)) {
    return { ok: false, error: 'Wastage calculation overflow' };
  }
  return { ok: true, value };
}
