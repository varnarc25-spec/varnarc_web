/** Indicative rates for the Renovation Cost Calculator. */

import type { RenovationPropertyType, RenovationQuality, RenovationWorkId } from './types';
import { LOCATION_MULTIPLIERS, normalizeLocationKey, toSqft } from '../construction-cost/rates';

export const RENOVATION_CALC_VERSION = '2026.08.1';

export { LOCATION_MULTIPLIERS, normalizeLocationKey, toSqft };

/**
 * Base rates per work category.
 * - `mode: 'per_sqft'` → amount = rate[quality] × areaSqft
 * - `mode: 'fixed'` → amount = rate[quality] (typical package for one kitchen/bath zone;
 *   scaled lightly by area via areaScaleFactor when area differs from referenceArea)
 */
export type RenovationWorkRate = {
  id: RenovationWorkId;
  label: string;
  mode: 'per_sqft' | 'fixed';
  rates: Record<RenovationQuality, number>;
  /** For fixed packages: scale toward larger/smaller areas. */
  referenceArea?: number;
  areaScaleFactor?: number;
};

export const RENOVATION_WORK_RATES: RenovationWorkRate[] = [
  {
    id: 'painting',
    label: 'Painting',
    mode: 'per_sqft',
    rates: { basic: 18, standard: 28, premium: 45 },
  },
  {
    id: 'flooring',
    label: 'Flooring',
    mode: 'per_sqft',
    rates: { basic: 85, standard: 140, premium: 280 },
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    mode: 'fixed',
    rates: { basic: 180_000, standard: 320_000, premium: 650_000 },
    referenceArea: 1200,
    areaScaleFactor: 0.35,
  },
  {
    id: 'bathroom',
    label: 'Bathroom',
    mode: 'fixed',
    rates: { basic: 95_000, standard: 180_000, premium: 350_000 },
    referenceArea: 1200,
    areaScaleFactor: 0.25,
  },
  {
    id: 'electrical',
    label: 'Electrical',
    mode: 'per_sqft',
    rates: { basic: 45, standard: 75, premium: 120 },
  },
  {
    id: 'plumbing',
    label: 'Plumbing',
    mode: 'per_sqft',
    rates: { basic: 40, standard: 70, premium: 110 },
  },
  {
    id: 'false_ceiling',
    label: 'False ceiling',
    mode: 'per_sqft',
    rates: { basic: 55, standard: 90, premium: 150 },
  },
  {
    id: 'doors_windows',
    label: 'Doors / windows',
    mode: 'per_sqft',
    rates: { basic: 35, standard: 60, premium: 110 },
  },
  {
    id: 'waterproofing',
    label: 'Waterproofing',
    mode: 'per_sqft',
    rates: { basic: 30, standard: 50, premium: 85 },
  },
  {
    id: 'structural_repair',
    label: 'Structural repair',
    mode: 'per_sqft',
    rates: { basic: 80, standard: 140, premium: 220 },
  },
  {
    id: 'carpentry',
    label: 'Carpentry',
    mode: 'per_sqft',
    rates: { basic: 50, standard: 90, premium: 160 },
  },
  {
    id: 'demolition',
    label: 'Demolition',
    mode: 'per_sqft',
    rates: { basic: 25, standard: 40, premium: 60 },
  },
  {
    id: 'debris_removal',
    label: 'Debris removal',
    mode: 'per_sqft',
    rates: { basic: 12, standard: 18, premium: 28 },
  },
];

export const RENOVATION_PROPERTY_MULTIPLIERS: Record<RenovationPropertyType, number> = {
  apartment: 1.0,
  independent_house: 1.05,
  villa: 1.12,
  duplex: 1.06,
  commercial: 1.08,
};

/** Older properties often need more prep, repairs and hidden work. */
export function ageMultiplier(years: number): number {
  if (years <= 5) return 1.0;
  if (years <= 15) return 1.06;
  if (years <= 30) return 1.14;
  return 1.22;
}

export const RENOVATION_RANGE_SPREAD = 0.15;

export function getWorkRateMeta(id: RenovationWorkId): RenovationWorkRate {
  const found = RENOVATION_WORK_RATES.find((w) => w.id === id);
  if (!found) throw new Error(`Unknown renovation work: ${id}`);
  return found;
}

export function computeWorkAmount(
  meta: RenovationWorkRate,
  quality: RenovationQuality,
  areaSqft: number,
): number {
  const base = meta.rates[quality];
  if (meta.mode === 'per_sqft') {
    return Math.round(base * areaSqft);
  }
  const ref = meta.referenceArea ?? 1200;
  const scale = meta.areaScaleFactor ?? 0.3;
  const factor = 1 + ((areaSqft - ref) / ref) * scale;
  return Math.round(base * Math.max(0.7, Math.min(1.6, factor)));
}
