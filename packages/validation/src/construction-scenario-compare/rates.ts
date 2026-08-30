/** Indicative material quantity factors for scenario comparison (planning only). */

import { QUALITY_QTY_FACTOR } from '../construction-cost/rates';

export const SCENARIO_COMPARE_VERSION = '2026.08.1';

export { QUALITY_QTY_FACTOR };

/** Per sq ft factors for a typical RCC house (indicative). */
export const MATERIAL_PER_SQFT = {
  cementBags: 0.4,
  steelKg: 4.5,
  sandCft: 0.9,
  aggregateCft: 1.1,
  bricks: 8,
} as const;

export function estimateDurationMonths(floors: number): number {
  return Math.min(36, Math.max(8, Math.round(10 + floors * 3)));
}
