/** Indicative location rates and multipliers for the Construction Cost Calculator. */

import type { ConstructionCostQuality, ConstructionCostPropertyType } from './types';

export const COST_CALC_VERSION = '2026.08.1';

/** National baseline ₹/sqft for standard quality RCC shell (indicative). */
export const NATIONAL_BASE_RATE_PER_SQFT = 1800;

/** Location multipliers applied to national base (indicative metro/tier adjustments). */
export const LOCATION_MULTIPLIERS: Record<string, { label: string; multiplier: number }> = {
  hyderabad: { label: 'Hyderabad', multiplier: 1.0 },
  bengaluru: { label: 'Bengaluru', multiplier: 1.12 },
  bangalore: { label: 'Bengaluru', multiplier: 1.12 },
  chennai: { label: 'Chennai', multiplier: 1.05 },
  mumbai: { label: 'Mumbai', multiplier: 1.28 },
  pune: { label: 'Pune', multiplier: 1.1 },
  delhi: { label: 'Delhi NCR', multiplier: 1.18 },
  noida: { label: 'Noida', multiplier: 1.15 },
  gurugram: { label: 'Gurugram', multiplier: 1.2 },
  gurgaon: { label: 'Gurugram', multiplier: 1.2 },
  ahmedabad: { label: 'Ahmedabad', multiplier: 0.98 },
  kolkata: { label: 'Kolkata', multiplier: 0.95 },
  jaipur: { label: 'Jaipur', multiplier: 0.92 },
  coimbatore: { label: 'Coimbatore', multiplier: 0.9 },
  indore: { label: 'Indore', multiplier: 0.9 },
  lucknow: { label: 'Lucknow', multiplier: 0.9 },
  default: { label: 'India average', multiplier: 1.0 },
};

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
export const DEFAULT_MARKET_RATES = {
  steelRatePerKg: 55,
  cementRatePerBag: 380,
  labourRateIndex: 100,
} as const;

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

export function normalizeLocationKey(location: string): string {
  const key = location
    .trim()
    .toLowerCase()
    .replace(/\s+ncr$/, '')
    .replace(/[^a-z]/g, '');
  if (!key) return 'default';
  if (LOCATION_MULTIPLIERS[key]) return key;
  // soft match
  for (const k of Object.keys(LOCATION_MULTIPLIERS)) {
    if (k !== 'default' && (key.includes(k) || k.includes(key))) return k;
  }
  return 'default';
}

export function toSqft(area: number, unit: 'sqft' | 'sqm'): number {
  if (unit === 'sqm') return Math.round(area * 10.7639 * 100) / 100;
  return area;
}
