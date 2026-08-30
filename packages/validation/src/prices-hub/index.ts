/** Construction Prices hub — freshness, gating, and material/city allowlists. */

import { getPriceCityLocalNote, isPriceMaterialSeoKey } from './seo-landing';

export const PRICE_HUB_VERSION = '2026.08.1';

export const PRICE_HUB_QUALIFICATION =
  'Indicative market reference only. Prices move with brand, grade, quantity and logistics. Verify with local dealers before budgeting. Varnarc does not sell materials.';

/** Days after which VERIFIED/LIVE observations are labeled older (not “current”). */
export const PRICE_CURRENT_MAX_AGE_DAYS = 30;
/** Days after which any non-LIVE observation is treated as STALE for display. */
export const PRICE_STALE_AFTER_DAYS = 90;
/** Minimum distinct observation dates for a history chart. */
export const PRICE_HISTORY_CHART_MIN_POINTS = 3;
/** Minimum reliable (current) observations for an indexable city×material SEO page. */
export const PRICE_SEO_MIN_RELIABLE_POINTS = 1;
/** Minimum total observations (any freshness) — blocks one-shot thin landings. */
export const PRICE_SEO_MIN_TOTAL_OBSERVATIONS = 3;

export const PRICE_HISTORY_DISCLAIMER =
  'Observed/reference values can differ from local supplier quotes. Brand, grade, quantity, GST, transport and negotiation all move the day rate. Always confirm with dealers before budgeting. Varnarc does not sell materials.';

/** Chart interval presets (approx days). */
export const PRICE_HISTORY_CHART_INTERVALS = [
  { key: '1M', label: '1M', days: 30 },
  { key: '3M', label: '3M', days: 92 },
  { key: '6M', label: '6M', days: 183 },
  { key: '1Y', label: '1Y', days: 365 },
] as const;

export type PriceHistoryChartInterval = (typeof PRICE_HISTORY_CHART_INTERVALS)[number]['key'];

/** Period-over-period change windows. */
export const PRICE_HISTORY_CHANGE_PERIODS = [
  { key: '7d', label: '7-day', days: 7 },
  { key: '30d', label: '30-day', days: 30 },
  { key: '3m', label: '3-month', days: 92 },
  { key: '1y', label: '1-year', days: 365 },
] as const;

export type PriceHistoryChangePeriod = (typeof PRICE_HISTORY_CHANGE_PERIODS)[number]['key'];

export type PriceHistoryPoint = {
  id?: string;
  price: number;
  effectiveFrom: Date | string;
};

export type PricePeriodChange = {
  key: PriceHistoryChangePeriod;
  label: string;
  available: boolean;
  absolute: number | null;
  percent: number | null;
  baselinePrice: number | null;
  baselineDate: string | null;
  /** True when the baseline observation is older than the exact lookback (nearest prior point used). */
  usedNearestPrior: boolean;
};

function toDate(value: Date | string): Date | null {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Latest observation on or before `target`. Never invents / interpolates a mid-gap price.
 */
export function findNearestObservationOnOrBefore<T extends PriceHistoryPoint>(
  observationsAsc: T[],
  target: Date,
): T | null {
  let best: T | null = null;
  for (const obs of observationsAsc) {
    const d = toDate(obs.effectiveFrom);
    if (!d || d.getTime() > target.getTime()) continue;
    best = obs;
  }
  return best;
}

/**
 * Period changes vs current. Uses the nearest real observation on/before each lookback date.
 * Missing lookbacks return `available: false` — no fabricated baseline.
 */
export function computePricePeriodChanges(input: {
  currentPrice: number;
  observations: PriceHistoryPoint[];
  now?: Date;
}): PricePeriodChange[] {
  const now = input.now ?? new Date();
  const asc = [...input.observations]
    .map((o) => ({ ...o, _t: toDate(o.effectiveFrom) }))
    .filter((o): o is typeof o & { _t: Date } => o._t != null)
    .sort((a, b) => a._t.getTime() - b._t.getTime());

  return PRICE_HISTORY_CHANGE_PERIODS.map((period) => {
    const target = new Date(now.getTime() - period.days * 24 * 60 * 60 * 1000);
    const baseline = findNearestObservationOnOrBefore(asc, target);
    if (!baseline || !Number.isFinite(baseline.price) || baseline.price === 0) {
      return {
        key: period.key,
        label: period.label,
        available: false,
        absolute: null,
        percent: null,
        baselinePrice: null,
        baselineDate: null,
        usedNearestPrior: false,
      };
    }
    const baselineDate = toDate(baseline.effectiveFrom)!;
    const absolute = input.currentPrice - baseline.price;
    const percent = (absolute / baseline.price) * 100;
    const exactMs = target.getTime();
    const usedNearestPrior = Math.abs(baselineDate.getTime() - exactMs) > 24 * 60 * 60 * 1000;

    return {
      key: period.key,
      label: period.label,
      available: true,
      absolute: Math.round(absolute * 100) / 100,
      percent: Math.round(percent * 10) / 10,
      baselinePrice: baseline.price,
      baselineDate: baselineDate.toISOString(),
      usedNearestPrior,
    };
  });
}

/** Filter observations to a chart interval. Returns only real points (no gap fills). */
export function filterObservationsByInterval<T extends PriceHistoryPoint>(
  observations: T[],
  interval: PriceHistoryChartInterval,
  now?: Date,
): T[] {
  const meta = PRICE_HISTORY_CHART_INTERVALS.find((i) => i.key === interval);
  if (!meta) return [];
  const end = now ?? new Date();
  const start = new Date(end.getTime() - meta.days * 24 * 60 * 60 * 1000);
  return [...observations]
    .filter((o) => {
      const d = toDate(o.effectiveFrom);
      return d != null && d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
    })
    .sort((a, b) => {
      const da = toDate(a.effectiveFrom)!.getTime();
      const db = toDate(b.effectiveFrom)!.getTime();
      return da - db;
    });
}

export function isPriceHistoryChartInterval(value: string): value is PriceHistoryChartInterval {
  return PRICE_HISTORY_CHART_INTERVALS.some((i) => i.key === value);
}

export const PRICE_HUB_MATERIALS = [
  {
    key: 'cement',
    label: 'Cement',
    unitHint: '₹ / bag',
    calculatorHref: '/construction/cement-calculator',
  },
  {
    key: 'steel',
    label: 'Steel (TMT)',
    unitHint: '₹ / kg',
    calculatorHref: '/construction/steel-calculator',
  },
  {
    key: 'sand',
    label: 'Sand',
    unitHint: '₹ / m³',
    calculatorHref: '/construction/sand-calculator',
  },
  {
    key: 'aggregate',
    label: 'Aggregate',
    unitHint: '₹ / m³',
    calculatorHref: '/construction/aggregate-calculator',
  },
  {
    key: 'brick',
    label: 'Bricks / blocks',
    unitHint: '₹ / piece',
    calculatorHref: '/construction/brick-calculator',
  },
  {
    key: 'tiles',
    label: 'Tiles',
    unitHint: '₹ / m²',
    calculatorHref: '/construction/tile-calculator',
  },
  {
    key: 'paint',
    label: 'Paint',
    unitHint: '₹ / litre',
    calculatorHref: '/construction/paint-calculator',
  },
] as const;

export type PriceHubMaterialKey = (typeof PRICE_HUB_MATERIALS)[number]['key'];

export const PRICE_HUB_CITIES = [
  { slug: 'hyderabad', name: 'Hyderabad' },
  { slug: 'bengaluru', name: 'Bengaluru' },
  { slug: 'chennai', name: 'Chennai' },
  { slug: 'mumbai', name: 'Mumbai' },
  { slug: 'pune', name: 'Pune' },
  { slug: 'delhi', name: 'Delhi NCR' },
  { slug: 'ahmedabad', name: 'Ahmedabad' },
  { slug: 'kolkata', name: 'Kolkata' },
] as const;

export type PriceHubCitySlug = (typeof PRICE_HUB_CITIES)[number]['slug'];

export const PRICE_SOURCE_CATEGORIES = [
  'dealer_quote',
  'market_survey',
  'rmc_plant',
  'manufacturer_list',
  'editorial_reference',
  'other',
] as const;

export type PriceSourceCategory = (typeof PRICE_SOURCE_CATEGORIES)[number];

export const PRICE_SOURCE_CATEGORY_LABELS: Record<PriceSourceCategory, string> = {
  dealer_quote: 'Dealer quote',
  market_survey: 'Market survey',
  rmc_plant: 'RMC / plant',
  manufacturer_list: 'Manufacturer list',
  editorial_reference: 'Editorial reference',
  other: 'Other',
};

export type PriceFreshness = 'LIVE' | 'VERIFIED' | 'ESTIMATED' | 'STALE';

export type DisplayFreshness = {
  resolved: PriceFreshness;
  /** True when the value may be presented as a current observation. */
  isCurrent: boolean;
  /** True when UI must say “older data” instead of current. */
  isOlderData: boolean;
  label: string;
  ageDays: number | null;
};

function ageInDays(from: Date, now: Date) {
  return Math.floor((now.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Resolve display freshness. STALE and aged VERIFIED/ESTIMATED are never “current”.
 * LIVE stays current only while within PRICE_CURRENT_MAX_AGE_DAYS of the reference date.
 */
export function resolveDisplayFreshness(input: {
  claimed: PriceFreshness;
  verifiedAt?: Date | string | null;
  effectiveFrom?: Date | string | null;
  now?: Date;
}): DisplayFreshness {
  const now = input.now ?? new Date();
  const refRaw = input.verifiedAt ?? input.effectiveFrom ?? null;
  const ref = refRaw ? new Date(refRaw) : null;
  const ageDays = ref && !Number.isNaN(ref.getTime()) ? ageInDays(ref, now) : null;

  let resolved: PriceFreshness = input.claimed;
  if (input.claimed === 'LIVE') {
    if (ageDays != null && ageDays > PRICE_CURRENT_MAX_AGE_DAYS) resolved = 'STALE';
    else resolved = 'LIVE';
  } else if (input.claimed === 'VERIFIED') {
    if (!ref) resolved = 'ESTIMATED';
    else if (ageDays != null && ageDays > PRICE_STALE_AFTER_DAYS) resolved = 'STALE';
    else if (ageDays != null && ageDays > PRICE_CURRENT_MAX_AGE_DAYS) resolved = 'STALE';
    else resolved = 'VERIFIED';
  } else if (input.claimed === 'ESTIMATED') {
    if (ageDays != null && ageDays > PRICE_STALE_AFTER_DAYS) resolved = 'STALE';
    else resolved = 'ESTIMATED';
  } else {
    resolved = 'STALE';
  }

  const isCurrent = resolved === 'LIVE' || resolved === 'VERIFIED';
  const isOlderData = !isCurrent;
  const label =
    resolved === 'LIVE'
      ? 'Live'
      : resolved === 'VERIFIED'
        ? 'Verified'
        : resolved === 'ESTIMATED'
          ? 'Estimated (not current)'
          : 'Older data';

  return { resolved, isCurrent, isOlderData, label, ageDays };
}

/** Reliable enough for hub “current” column and SEO landings. */
export function isReliableCurrentPrice(display: DisplayFreshness): boolean {
  return display.isCurrent;
}

/** True when material + city have unique editorial profiles (anti-boilerplate gate). */
export function hasPriceLandingEditorial(materialKey: string, citySlug: string): boolean {
  return isPriceMaterialSeoKey(materialKey) && getPriceCityLocalNote(citySlug) != null;
}

export function canIndexPriceLanding(input: {
  materialKey: string;
  citySlug: string;
  observations: Array<{
    claimed: PriceFreshness;
    verifiedAt?: Date | string | null;
    effectiveFrom?: Date | string | null;
  }>;
  now?: Date;
  /** When false, skips editorial profile checks (tests only). Default true. */
  requireSeoProfiles?: boolean;
}): boolean {
  if (!PRICE_HUB_MATERIALS.some((m) => m.key === input.materialKey)) return false;
  if (!PRICE_HUB_CITIES.some((c) => c.slug === input.citySlug)) return false;

  if (input.requireSeoProfiles !== false) {
    if (!hasPriceLandingEditorial(input.materialKey, input.citySlug)) return false;
  }

  if (input.observations.length < PRICE_SEO_MIN_TOTAL_OBSERVATIONS) return false;

  const reliable = input.observations.filter((o) =>
    isReliableCurrentPrice(
      resolveDisplayFreshness({
        claimed: o.claimed,
        verifiedAt: o.verifiedAt,
        effectiveFrom: o.effectiveFrom,
        now: input.now,
      }),
    ),
  );
  return reliable.length >= PRICE_SEO_MIN_RELIABLE_POINTS;
}

export function shouldShowPriceHistoryChart(pointCount: number): boolean {
  return pointCount >= PRICE_HISTORY_CHART_MIN_POINTS;
}

export function normalizePriceSourceCategory(raw?: string | null): PriceSourceCategory {
  if (!raw) return 'other';
  const v = raw.toLowerCase().replace(/\s+/g, '_');
  if ((PRICE_SOURCE_CATEGORIES as readonly string[]).includes(v)) {
    return v as PriceSourceCategory;
  }
  if (v.includes('dealer') || v.includes('quote')) return 'dealer_quote';
  if (v.includes('survey') || v.includes('market')) return 'market_survey';
  if (v.includes('rmc') || v.includes('plant')) return 'rmc_plant';
  if (v.includes('manufacturer') || v.includes('mrp')) return 'manufacturer_list';
  if (v.includes('editorial') || v.includes('reference')) return 'editorial_reference';
  return 'other';
}

export function isPriceHubMaterialKey(value: string): value is PriceHubMaterialKey {
  return PRICE_HUB_MATERIALS.some((m) => m.key === value);
}

export function isPriceHubCitySlug(value: string): value is PriceHubCitySlug {
  return PRICE_HUB_CITIES.some((c) => c.slug === value);
}

export function getPriceHubMaterial(key: string) {
  return PRICE_HUB_MATERIALS.find((m) => m.key === key);
}

export function getPriceHubCity(slug: string) {
  return PRICE_HUB_CITIES.find((c) => c.slug === slug);
}

/** Match CMS material slug/name to a hub key. */
export function matchMaterialToHubKey(slugOrName: string): PriceHubMaterialKey | null {
  const s = slugOrName.toLowerCase();
  if (s.includes('cement') || s === 'opc' || s === 'ppc') return 'cement';
  if (s.includes('steel') || s.includes('tmt') || s.includes('rebar')) return 'steel';
  if (s.includes('sand') || s.includes('m-sand') || s.includes('msand')) return 'sand';
  if (s.includes('aggregate') || s.includes('jelly') || s.includes('metal')) return 'aggregate';
  if (s.includes('brick') || s.includes('aac') || s.includes('block')) return 'brick';
  if (s.includes('tile')) return 'tiles';
  if (s.includes('paint') || s.includes('emulsion')) return 'paint';
  if (isPriceHubMaterialKey(s)) return s;
  return null;
}

export {
  PRICE_LANDING_SEO_VERSION,
  PRICE_LANDING_METHODOLOGY,
  PRICE_LANDING_QUALIFICATION,
  PRICE_CITY_LOCAL_NOTES,
  PRICE_MATERIAL_SEO_PROFILES,
  buildPriceLandingCalculationExample,
  buildPriceLandingFaqs,
  buildPriceLandingSeoContent,
  getPriceCityLocalNote,
  isPriceMaterialSeoKey,
  type PriceLandingSeoContent,
  type PriceMaterialSeoKey,
  type PriceMaterialSeoProfile,
} from './seo-landing';
