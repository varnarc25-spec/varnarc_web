/** Construction Fair Price Checker — compare a quote to recent observed ranges. */

import { z } from 'zod';
import {
  PRICE_HUB_CITIES,
  PRICE_HUB_MATERIALS,
  isPriceHubCitySlug,
  isPriceHubMaterialKey,
  isReliableCurrentPrice,
  resolveDisplayFreshness,
  type PriceFreshness,
  type PriceHubCitySlug,
  type PriceHubMaterialKey,
} from '../prices-hub';

export const FAIR_PRICE_CHECKER_VERSION = '2026.08.1';

export const FAIR_PRICE_CHECKER_QUALIFICATION =
  'This tool compares a supplier quote with Varnarc’s recent observed/reference prices. It does not judge whether a quote is fair, unfair or fraudulent. Brand, grade, GST, delivery, quantity and negotiation all move the day rate — verify locally before deciding.';

export const FAIR_PRICE_METHODOLOGY =
  'Observed range is built from recent LIVE or VERIFIED material price observations for the selected material and location (same unit). We use each observation’s price, and when present its min/max band. Missing days are not interpolated. If too few fresh observations exist, we return an insufficient-data result instead of inventing a range.';

/** Minimum reliable observations required to show a comparison. */
export const FAIR_PRICE_MIN_OBSERVATIONS = 2;
/** Lookback window for “recent” observations (days). */
export const FAIR_PRICE_LOOKBACK_DAYS = 45;
/** Relative tolerance inside range edges (e.g. 0.5% still “within”). */
export const FAIR_PRICE_WITHIN_TOLERANCE = 0.005;

export const FAIR_PRICE_CLASSIFICATIONS = [
  {
    key: 'within_range',
    label: "Within Varnarc's recent observed range",
    shortLabel: 'Within observed range',
  },
  {
    key: 'below_range',
    label: "Below Varnarc's recent observed range",
    shortLabel: 'Below observed range',
  },
  {
    key: 'above_range',
    label: "Above Varnarc's recent observed range",
    shortLabel: 'Above observed range',
  },
] as const;

export type FairPriceClassification = (typeof FAIR_PRICE_CLASSIFICATIONS)[number]['key'];

export const FAIR_PRICE_UNITS = [
  { key: 'bag', label: 'Bag', aliases: ['bag', 'bags', '50kg bag', '50 kg bag'] },
  { key: 'kg', label: 'Kilogram (kg)', aliases: ['kg', 'kilogram', 'kgs'] },
  { key: 'tonne', label: 'Tonne', aliases: ['tonne', 'ton', 'mt', 't'] },
  { key: 'm3', label: 'Cubic metre (m³)', aliases: ['m3', 'm³', 'cum', 'cu.m', 'cubic metre'] },
  { key: 'piece', label: 'Piece', aliases: ['piece', 'pc', 'pcs', 'nos', 'no', 'unit'] },
  { key: 'm2', label: 'Square metre (m²)', aliases: ['m2', 'm²', 'sqm', 'sq.m', 'sft', 'sqft'] },
  { key: 'litre', label: 'Litre', aliases: ['litre', 'liter', 'l', 'ltr'] },
] as const;

export type FairPriceUnitKey = (typeof FAIR_PRICE_UNITS)[number]['key'];

export function normalizeFairPriceUnit(raw: string): FairPriceUnitKey | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  for (const u of FAIR_PRICE_UNITS) {
    if (u.key === s || u.aliases.some((a) => a === s)) return u.key;
  }
  if (s.includes('bag')) return 'bag';
  if (s.includes('kg') || s.includes('kilo')) return 'kg';
  if (s.includes('ton')) return 'tonne';
  if (s.includes('m3') || s.includes('m³') || s.includes('cum') || s.includes('cubic')) return 'm3';
  if (s.includes('m2') || s.includes('m²') || s.includes('sq')) return 'm2';
  if (s.includes('lit') || s === 'l') return 'litre';
  if (s.includes('brick') || s.includes('block') || s.includes('piece') || s.includes('nos'))
    return 'piece';
  return null;
}

export function unitsCompatible(a: string, b: string): boolean {
  const na = normalizeFairPriceUnit(a);
  const nb = normalizeFairPriceUnit(b);
  if (na && nb) return na === nb;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export const fairPriceCheckInputSchema = z.object({
  materialKey: z.string().min(1),
  locationSlug: z.string().min(1),
  quotedUnit: z.string().min(1).max(40),
  quotedPrice: z.coerce.number().positive(),
  quantity: z.coerce.number().positive().optional().nullable(),
  currency: z.string().length(3).default('INR'),
});

export type FairPriceCheckInput = z.infer<typeof fairPriceCheckInputSchema>;

export type FairPriceObservationInput = {
  id?: string;
  price: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  unit: string;
  currency?: string;
  claimed: PriceFreshness;
  verifiedAt?: Date | string | null;
  effectiveFrom?: Date | string | null;
  locationSlug?: string | null;
  locationType?: string | null;
};

export type FairPriceCheckResult =
  | {
      ok: true;
      classification: FairPriceClassification;
      classificationLabel: string;
      quotedPrice: number;
      quotedUnit: string;
      currency: string;
      observedRange: { low: number; high: number; mid: number };
      differenceFromMid: number;
      percentDifferenceFromMid: number;
      differenceFromNearestBound: number;
      percentDifferenceFromNearestBound: number;
      dataCount: number;
      dataFreshness: {
        newestAgeDays: number | null;
        oldestAgeDays: number | null;
        label: string;
      };
      locationGranularity: 'city' | 'national' | 'mixed';
      locationGranularityLabel: string;
      methodology: string;
      methodologyVersion: string;
      materialKey: PriceHubMaterialKey;
      locationSlug: string;
      quantityImpact: {
        quantity: number;
        quotedTotal: number;
        observedLowTotal: number;
        observedHighTotal: number;
        observedMidTotal: number;
        differenceFromMidTotal: number;
      } | null;
      disclaimer: string;
    }
  | {
      ok: false;
      reason: string;
      code:
        | 'INVALID_MATERIAL'
        | 'INVALID_LOCATION'
        | 'INVALID_UNIT'
        | 'INSUFFICIENT_DATA'
        | 'UNIT_MISMATCH'
        | 'NO_FRESH_DATA';
      methodology: string;
      methodologyVersion: string;
      dataCount: number;
      disclaimer: string;
    };

function ageDays(from: Date | string | null | undefined, now: Date): number | null {
  if (!from) return null;
  const d = new Date(from);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
}

export function classifyQuotedPrice(
  quoted: number,
  low: number,
  high: number,
  tolerance = FAIR_PRICE_WITHIN_TOLERANCE,
): FairPriceClassification {
  const span = Math.max(high - low, Math.abs(low) * tolerance, 1);
  const pad = span * tolerance;
  if (quoted < low - pad) return 'below_range';
  if (quoted > high + pad) return 'above_range';
  return 'within_range';
}

export function buildObservedRange(
  observations: Array<{ price: number; minPrice?: number | null; maxPrice?: number | null }>,
): { low: number; high: number; mid: number } | null {
  if (!observations.length) return null;
  let low = Infinity;
  let high = -Infinity;
  for (const o of observations) {
    const lo = o.minPrice != null && Number.isFinite(o.minPrice) ? o.minPrice : o.price;
    const hi = o.maxPrice != null && Number.isFinite(o.maxPrice) ? o.maxPrice : o.price;
    low = Math.min(low, lo, o.price);
    high = Math.max(high, hi, o.price);
  }
  if (!Number.isFinite(low) || !Number.isFinite(high) || low <= 0 || high <= 0) return null;
  if (high < low) return null;
  const mid = Math.round(((low + high) / 2) * 100) / 100;
  return {
    low: Math.round(low * 100) / 100,
    high: Math.round(high * 100) / 100,
    mid,
  };
}

/**
 * Pure evaluation. Caller supplies already-fetched observations; this never invents prices.
 */
export function evaluateFairPriceCheck(input: {
  materialKey: string;
  locationSlug: string;
  quotedUnit: string;
  quotedPrice: number;
  quantity?: number | null;
  currency?: string;
  observations: FairPriceObservationInput[];
  now?: Date;
}): FairPriceCheckResult {
  const disclaimer = FAIR_PRICE_CHECKER_QUALIFICATION;
  const methodology = FAIR_PRICE_METHODOLOGY;
  const methodologyVersion = FAIR_PRICE_CHECKER_VERSION;
  const now = input.now ?? new Date();

  if (!isPriceHubMaterialKey(input.materialKey)) {
    return {
      ok: false,
      code: 'INVALID_MATERIAL',
      reason: 'Select a supported construction material to compare.',
      methodology,
      methodologyVersion,
      dataCount: 0,
      disclaimer,
    };
  }
  if (!isPriceHubCitySlug(input.locationSlug)) {
    return {
      ok: false,
      code: 'INVALID_LOCATION',
      reason: 'Select a supported city for the comparison.',
      methodology,
      methodologyVersion,
      dataCount: 0,
      disclaimer,
    };
  }

  const quotedUnitKey = normalizeFairPriceUnit(input.quotedUnit);
  if (!quotedUnitKey) {
    return {
      ok: false,
      code: 'INVALID_UNIT',
      reason:
        'Quoted unit is not recognised. Use a standard unit such as bag, kg, m³, m², piece or litre.',
      methodology,
      methodologyVersion,
      dataCount: 0,
      disclaimer,
    };
  }

  const lookback = new Date(now.getTime() - FAIR_PRICE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const fresh = input.observations.filter((o) => {
    if (!unitsCompatible(o.unit, input.quotedUnit)) return false;
    const ref = o.verifiedAt ?? o.effectiveFrom;
    const d = ref ? new Date(ref) : null;
    if (!d || Number.isNaN(d.getTime()) || d < lookback) return false;
    return isReliableCurrentPrice(
      resolveDisplayFreshness({
        claimed: o.claimed,
        verifiedAt: o.verifiedAt,
        effectiveFrom: o.effectiveFrom,
        now,
      }),
    );
  });

  if (!fresh.length) {
    const unitMatches = input.observations.filter((o) => unitsCompatible(o.unit, input.quotedUnit));
    return {
      ok: false,
      code: unitMatches.length ? 'NO_FRESH_DATA' : 'UNIT_MISMATCH',
      reason: unitMatches.length
        ? `Not enough recent LIVE/VERIFIED observations in the last ${FAIR_PRICE_LOOKBACK_DAYS} days for this material, location and unit.`
        : 'No observations match the quoted unit. Try a different unit or material.',
      methodology,
      methodologyVersion,
      dataCount: unitMatches.length,
      disclaimer,
    };
  }

  if (fresh.length < FAIR_PRICE_MIN_OBSERVATIONS) {
    return {
      ok: false,
      code: 'INSUFFICIENT_DATA',
      reason: `Only ${fresh.length} recent observation${fresh.length === 1 ? '' : 's'} available — need at least ${FAIR_PRICE_MIN_OBSERVATIONS} to build a reliable observed range. We will not invent a comparison.`,
      methodology,
      methodologyVersion,
      dataCount: fresh.length,
      disclaimer,
    };
  }

  const range = buildObservedRange(fresh);
  if (!range) {
    return {
      ok: false,
      code: 'INSUFFICIENT_DATA',
      reason: 'Could not derive a valid observed range from available observations.',
      methodology,
      methodologyVersion,
      dataCount: fresh.length,
      disclaimer,
    };
  }

  const classification = classifyQuotedPrice(input.quotedPrice, range.low, range.high);
  const classificationLabel =
    FAIR_PRICE_CLASSIFICATIONS.find((c) => c.key === classification)?.label ?? classification;

  const differenceFromMid = Math.round((input.quotedPrice - range.mid) * 100) / 100;
  const percentDifferenceFromMid = Math.round((differenceFromMid / range.mid) * 1000) / 10;

  let nearestBound = range.mid;
  if (classification === 'above_range') nearestBound = range.high;
  else if (classification === 'below_range') nearestBound = range.low;
  const differenceFromNearestBound = Math.round((input.quotedPrice - nearestBound) * 100) / 100;
  const percentDifferenceFromNearestBound =
    nearestBound > 0 ? Math.round((differenceFromNearestBound / nearestBound) * 1000) / 10 : 0;

  const ages = fresh
    .map((o) => ageDays(o.verifiedAt ?? o.effectiveFrom, now))
    .filter((a): a is number => a != null);
  const newestAgeDays = ages.length ? Math.min(...ages) : null;
  const oldestAgeDays = ages.length ? Math.max(...ages) : null;

  const cityCount = fresh.filter((o) => o.locationSlug === input.locationSlug).length;
  const locationGranularity: 'city' | 'national' | 'mixed' =
    cityCount === fresh.length ? 'city' : cityCount === 0 ? 'national' : 'mixed';

  const locationGranularityLabel =
    locationGranularity === 'city'
      ? 'City-level observations'
      : locationGranularity === 'national'
        ? 'National / broader observations'
        : 'Mix of city and broader observations';

  const qty = input.quantity != null && input.quantity > 0 ? input.quantity : null;
  const quantityImpact = qty
    ? {
        quantity: qty,
        quotedTotal: Math.round(input.quotedPrice * qty * 100) / 100,
        observedLowTotal: Math.round(range.low * qty * 100) / 100,
        observedHighTotal: Math.round(range.high * qty * 100) / 100,
        observedMidTotal: Math.round(range.mid * qty * 100) / 100,
        differenceFromMidTotal: Math.round(differenceFromMid * qty * 100) / 100,
      }
    : null;

  return {
    ok: true,
    classification,
    classificationLabel,
    quotedPrice: input.quotedPrice,
    quotedUnit: quotedUnitKey,
    currency: input.currency ?? 'INR',
    observedRange: range,
    differenceFromMid,
    percentDifferenceFromMid,
    differenceFromNearestBound,
    percentDifferenceFromNearestBound,
    dataCount: fresh.length,
    dataFreshness: {
      newestAgeDays,
      oldestAgeDays,
      label:
        newestAgeDays == null
          ? 'Freshness unknown'
          : newestAgeDays <= 7
            ? 'Recent (within 7 days)'
            : newestAgeDays <= 30
              ? 'Within 30 days'
              : `Up to ${newestAgeDays} days old`,
    },
    locationGranularity,
    locationGranularityLabel,
    methodology,
    methodologyVersion,
    materialKey: input.materialKey,
    locationSlug: input.locationSlug,
    quantityImpact,
    disclaimer,
  };
}

export function getFairPriceMaterialOptions() {
  return PRICE_HUB_MATERIALS.map((m) => ({
    key: m.key,
    label: m.label,
    unitHint: m.unitHint,
  }));
}

export function getFairPriceCityOptions() {
  return PRICE_HUB_CITIES.map((c) => ({ slug: c.slug, name: c.name }));
}

export type { PriceHubCitySlug, PriceHubMaterialKey };
