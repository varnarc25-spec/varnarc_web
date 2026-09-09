/** Indicative location rates and multipliers for the Construction Cost Calculator. */

import type { ConstructionCostQuality, ConstructionCostPropertyType } from './types';
import {
  DEFAULT_MARKET_RATES as CATALOG_MARKET_RATES,
  LOCATION_MULTIPLIERS,
  NATIONAL_BASE_RATE_PER_SQFT,
  normalizeLocationKey,
} from '../construction-location-catalog';

export const COST_CALC_VERSION = '2026.08.1';

export { LOCATION_MULTIPLIERS, NATIONAL_BASE_RATE_PER_SQFT, normalizeLocationKey };

export const QUALITY_MULTIPLIERS: Record<ConstructionCostQuality, number> = {
  basic: 0.85,
  standard: 1.0,
  premium: 1.28,
  luxury: 1.55,
};

export const PROPERTY_TYPE_MULTIPLIERS: Record<ConstructionCostPropertyType, number> = {
  independent_house: 1.0,
  villa: 1.08,
  apartment: 0.92,
  duplex: 1.04,
  commercial: 1.12,
  renovation: 0.72,
};

export const FOUNDATION_MULTIPLIERS = {
  isolated: 1.0,
  raft: 1.06,
  pile: 1.12,
  combined: 1.04,
} as const;

export const STRUCTURE_MULTIPLIERS = {
  rcc_framed: 1.0,
  load_bearing: 0.94,
  steel: 1.1,
} as const;

export const INTERIOR_MULTIPLIERS = {
  shell: 0.88,
  basic: 0.95,
  standard: 1.0,
  premium: 1.18,
} as const;

/** Default split of construction cost before contingency. */
export const DEFAULT_COST_SPLIT = {
  materialPercent: 52,
  labourPercent: 32,
  miscPercent: 16,
} as const;

/**
 * Category shares of pre-contingency construction cost (planning allocation).
 * Sums to 1.0.
 */
export const CATEGORY_SHARES: Array<{ id: string; label: string; share: number }> = [
  { id: 'cement', label: 'Cement', share: 0.08 },
  { id: 'steel', label: 'Steel', share: 0.12 },
  { id: 'sand', label: 'Sand', share: 0.05 },
  { id: 'aggregate', label: 'Aggregate', share: 0.05 },
  { id: 'bricks', label: 'Bricks / blocks', share: 0.07 },
  { id: 'flooring', label: 'Flooring', share: 0.08 },
  { id: 'paint', label: 'Paint', share: 0.04 },
  { id: 'electrical', label: 'Electrical', share: 0.06 },
  { id: 'plumbing', label: 'Plumbing', share: 0.05 },
  { id: 'doors_windows', label: 'Doors / windows', share: 0.06 },
  { id: 'labour', label: 'Labour', share: 0.22 },
  { id: 'professional', label: 'Professional fees', share: 0.04 },
  { id: 'other', label: 'Other', share: 0.08 },
];

/** Phase shares of total (excluding contingency allocated proportionally later). */
export const PHASE_SHARES: Array<{ id: string; label: string; share: number }> = [
  { id: 'foundation', label: 'Foundation & excavation', share: 0.12 },
  { id: 'structure', label: 'Structure / RCC', share: 0.28 },
  { id: 'masonry', label: 'Masonry & plaster', share: 0.14 },
  { id: 'mep', label: 'Electrical & plumbing', share: 0.12 },
  { id: 'finishing', label: 'Flooring, paint & fittings', share: 0.22 },
  { id: 'external', label: 'External works', share: 0.06 },
  { id: 'fees', label: 'Fees & approvals', share: 0.06 },
];

/** Feature adders in ₹ (indicative) or per-sqft of built-up. */
export const FEATURE_COSTS = {
  basementPerSqftFactor: 0.35,
  parkingPerSlot: 180_000,
  lift: 450_000,
  compoundWall: 220_000,
  modularKitchen: {
    basic: 120_000,
    standard: 220_000,
    premium: 380_000,
    luxury: 650_000,
  } as Record<ConstructionCostQuality, number>,
};

/** Indicative market defaults for commodity / labour rate overrides. */
export const DEFAULT_MARKET_RATES = CATALOG_MARKET_RATES;

/** Planning quantity factors used when applying steel/cement rate deltas. */
export const RATE_QTY_PER_SQFT = {
  steelKg: 4.5,
  cementBags: 0.4,
} as const;

export const QUALITY_QTY_FACTOR: Record<ConstructionCostQuality, number> = {
  basic: 0.92,
  standard: 1,
  premium: 1.08,
  luxury: 1.15,
};

export const RANGE_SPREAD = 0.12;

export function toSqft(area: number, unit: 'sqft' | 'sqm'): number {
  if (unit === 'sqm') return Math.round(area * 10.7639 * 100) / 100;
  return area;
}
