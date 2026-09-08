/** Indicative rates for the Renovation Cost Calculator. */

import type { RenovationPropertyType, RenovationQuality, RenovationWorkId } from './types';
import {
  DEFAULT_COST_SPLIT,
  LOCATION_MULTIPLIERS,
  normalizeLocationKey,
  toSqft,
} from '../construction-cost/rates';

export const RENOVATION_CALC_VERSION = '2026.09.1';

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

/** Eight primary renovation intents shown as selectable cards. */
export const PRIMARY_RENOVATION_CATEGORY_IDS = [
  'kitchen',
  'bathroom',
  'flooring',
  'painting',
  'false_ceiling',
  'electrical',
  'plumbing',
  'doors_windows',
] as const;

export const RENOVATION_COST_SPLIT = {
  materialPercent: DEFAULT_COST_SPLIT.materialPercent,
  labourPercent: DEFAULT_COST_SPLIT.labourPercent,
  otherPercent: DEFAULT_COST_SPLIT.miscPercent,
} as const;

export const PAINT_SCOPE_MULTIPLIERS = {
  interior: 1,
  exterior: 0.55,
  both: 1.35,
} as const;

export const FLOORING_TYPE_MULTIPLIERS = {
  ceramic: 0.85,
  vitrified: 1,
  wood: 1.45,
  marble: 1.85,
} as const;

export const KITCHEN_SIZE_MULTIPLIERS = {
  compact: 0.78,
  standard: 1,
  large: 1.28,
} as const;

export const KITCHEN_CABINET_MULTIPLIERS = {
  basic: 0.88,
  modular: 1.15,
} as const;

export const KITCHEN_COUNTER_MULTIPLIERS = {
  laminate: 0.9,
  granite: 1,
  quartz: 1.22,
} as const;

export const BHK_MULTIPLIERS: Record<string, number> = {
  '1bhk': 0.94,
  '2bhk': 1,
  '3bhk': 1.06,
  '4bhk': 1.12,
  '5plus': 1.18,
  na: 1,
};

export type RenovationCategoryCard = {
  id: (typeof PRIMARY_RENOVATION_CATEGORY_IDS)[number];
  title: string;
  startingLabel: string;
  icon: 'kitchen' | 'bath' | 'floor' | 'paint' | 'ceiling' | 'electrical' | 'plumbing' | 'door';
};

export const RENOVATION_CATEGORY_CARDS: RenovationCategoryCard[] = [
  { id: 'kitchen', title: 'Kitchen renovation', startingLabel: 'From ₹ 1.8L', icon: 'kitchen' },
  { id: 'bathroom', title: 'Bathroom renovation', startingLabel: 'From ₹ 95,000', icon: 'bath' },
  {
    id: 'flooring',
    title: 'Flooring replacement',
    startingLabel: 'From ₹ 85/sq ft',
    icon: 'floor',
  },
  { id: 'painting', title: 'Painting', startingLabel: 'From ₹ 18/sq ft', icon: 'paint' },
  {
    id: 'false_ceiling',
    title: 'False ceiling',
    startingLabel: 'From ₹ 55/sq ft',
    icon: 'ceiling',
  },
  {
    id: 'electrical',
    title: 'Electrical rewiring',
    startingLabel: 'From ₹ 45/sq ft',
    icon: 'electrical',
  },
  { id: 'plumbing', title: 'Plumbing', startingLabel: 'From ₹ 40/sq ft', icon: 'plumbing' },
  { id: 'doors_windows', title: 'Doors & windows', startingLabel: 'From ₹ 35/sq ft', icon: 'door' },
];
