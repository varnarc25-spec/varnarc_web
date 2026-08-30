/** Flooring calculator defaults — no product or brand endorsements. */

import type { FlooringType } from './types';

export const FLOORING_CALC_VERSION = '2026.08.1';

export const M2_TO_FT2 = 10.76391041671;

export const FLOORING_TYPE_LABELS: Record<FlooringType, string> = {
  tiles: 'Tiles',
  marble: 'Marble',
  granite: 'Granite',
  wood_laminate: 'Wood / laminate',
  vinyl: 'Vinyl',
  other: 'Other / custom',
};

/**
 * Suggested wastage % by category (editable). Planning guidance only —
 * not brand- or product-specific.
 */
export const FLOORING_DEFAULT_WASTAGE: Record<FlooringType, number> = {
  tiles: 10,
  marble: 15,
  granite: 15,
  wood_laminate: 8,
  vinyl: 7,
  other: 10,
};

export function flooringTypeLabel(type: FlooringType, customLabel?: string | null): string {
  if (type === 'other' && customLabel?.trim()) return customLabel.trim();
  return FLOORING_TYPE_LABELS[type];
}
