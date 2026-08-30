/** Material Price Position — where current sits in a recent historical window (no forecasts). */

import { z } from 'zod';
import {
  PRICE_HUB_CITIES,
  PRICE_HUB_MATERIALS,
  findNearestObservationOnOrBefore,
  isPriceHubCitySlug,
  isPriceHubMaterialKey,
  resolveDisplayFreshness,
  type PriceFreshness,
  type PriceHubCitySlug,
  type PriceHubMaterialKey,
} from '../prices-hub';

export const MATERIAL_PRICE_POSITION_VERSION = '2026.08.1';

export const MATERIAL_PRICE_POSITION_QUALIFICATION =
  'Price position describes where the latest observation sits relative to recent historical observations for the same material and location. It is not advice to buy or wait, and it does not predict future prices.';

export const MATERIAL_PRICE_POSITION_METHODOLOGY =
  'We take LIVE/VERIFIED observations in the selected lookback window (default 90 days), compute the observed min–max range, rank the current price as a percentile within that set, and summarise recent direction by comparing an earlier baseline observation to the current price. Missing days are not interpolated. We never forecast future commodity prices.';

/** Default historical window (days). */
export const MATERIAL_PRICE_POSITION_DEFAULT_WINDOW_DAYS = 90;
/** Minimum reliable points in-window to publish a position. */
export const MATERIAL_PRICE_POSITION_MIN_POINTS = 3;
/** Flat trend if |% change| below this. */
export const MATERIAL_PRICE_POSITION_TREND_FLAT_PCT = 2;

export const MATERIAL_PRICE_POSITION_BANDS = [
  {
    key: 'low',
    label: 'Low',
    sentence: 'Low relative to the last {window} days',
    maxPercentileExclusive: 33.333,
  },
  {
    key: 'moderate',
    label: 'Moderate',
    sentence: 'Moderate relative to the last {window} days',
    maxPercentileExclusive: 66.667,
  },
  {
    key: 'high',
    label: 'High',
    sentence: 'High relative to the last {window} days',
    maxPercentileExclusive: 100.001,
  },
] as const;

export type MaterialPricePositionBand = (typeof MATERIAL_PRICE_POSITION_BANDS)[number]['key'];

export const MATERIAL_PRICE_POSITION_TRENDS = [
  {
    key: 'lower',
    label: 'Lower than earlier in the window',
    description:
      'Latest price is lower than the nearest observation from ~30 days before the window end (historical comparison only).',
  },
  {
    key: 'higher',
    label: 'Higher than earlier in the window',
    description:
      'Latest price is higher than the nearest observation from ~30 days before the window end (historical comparison only).',
  },
  {
    key: 'similar',
    label: 'Similar to earlier in the window',
    description:
      'Latest price is within a small band of the earlier baseline (historical comparison only — not a forecast).',
  },
  {
    key: 'insufficient',
    label: 'Trend not available',
    description: 'Not enough observations to describe recent direction.',
  },
] as const;

export type MaterialPricePositionTrend = (typeof MATERIAL_PRICE_POSITION_TRENDS)[number]['key'];

export const materialPricePositionInputSchema = z.object({
  materialKey: z.string().min(1),
  locationSlug: z.string().min(1),
  windowDays: z.coerce
    .number()
    .int()
    .min(14)
    .max(365)
    .default(MATERIAL_PRICE_POSITION_DEFAULT_WINDOW_DAYS),
  /** Optional project requirement for impact copy. */
  projectQuantity: z.coerce.number().positive().max(1e9).optional().nullable(),
  projectQuantityUnit: z.string().min(1).max(40).optional().nullable(),
  /** Illustrative unit-price change (₹ per unit) for impact — not a prediction. */
  illustrativeUnitChangeInr: z.coerce.number().positive().max(1e7).optional().nullable(),
});

export type MaterialPricePositionInput = z.infer<typeof materialPricePositionInputSchema>;

export type MaterialPricePositionObservation = {
  id?: string;
  price: number;
  unit: string;
  currency?: string;
  claimed: PriceFreshness;
  verifiedAt?: Date | string | null;
  effectiveFrom?: Date | string | null;
};

export type ProjectPriceImpact = {
  quantity: number;
  quantityUnit: string;
  unitChangeInr: number;
  estimatedCostDeltaInr: number;
  copy: string;
};

export type MaterialPricePositionResult =
  | {
      ok: false;
      reason: string;
      windowDays: number;
      observationCount: number;
      version: string;
      qualification: string;
      methodology: string;
    }
  | {
      ok: true;
      materialKey: PriceHubMaterialKey;
      locationSlug: PriceHubCitySlug;
      currency: string;
      unit: string;
      windowDays: number;
      windowLabel: string;
      /** Inclusive window start (ISO). */
      windowStartIso: string;
      windowEndIso: string;
      currentPrice: number;
      currentEffectiveFromIso: string;
      dataFreshness: {
        label: string;
        ageDays: number | null;
        isCurrent: boolean;
        isOlderData: boolean;
        resolved: PriceFreshness;
      };
      recentRange: { low: number; high: number };
      percentile: number;
      positionBand: MaterialPricePositionBand;
      positionLabel: string;
      positionSentence: string;
      recentTrend: MaterialPricePositionTrend;
      recentTrendLabel: string;
      recentTrendDescription: string;
      trendBaselinePrice: number | null;
      trendBaselineDateIso: string | null;
      trendChangePercent: number | null;
      observationCount: number;
      projectImpact: ProjectPriceImpact | null;
      forbiddenClaims: string[];
      limitations: string[];
      version: string;
      qualification: string;
      methodology: string;
    };

function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function roundMoney(n: number): number {
  return Math.round(n);
}

export function bandFromPercentile(percentile: number): MaterialPricePositionBand {
  if (percentile < 33.333) return 'low';
  if (percentile < 66.667) return 'moderate';
  return 'high';
}

export function positionSentenceFor(band: MaterialPricePositionBand, windowDays: number): string {
  const meta = MATERIAL_PRICE_POSITION_BANDS.find((b) => b.key === band)!;
  return meta.sentence.replace('{window}', String(windowDays));
}

/**
 * Empirical percentile of `value` among `prices` (0–100).
 * Fraction of observations strictly below + half of ties.
 */
export function empiricalPercentile(prices: number[], value: number): number {
  if (prices.length === 0) return 0;
  const sorted = [...prices].sort((a, b) => a - b);
  let below = 0;
  let equal = 0;
  for (const p of sorted) {
    if (p < value) below += 1;
    else if (p === value) equal += 1;
  }
  return round1(((below + equal * 0.5) / sorted.length) * 100);
}

export function calculateProjectPriceImpact(input: {
  quantity: number;
  quantityUnit: string;
  unitChangeInr: number;
}): ProjectPriceImpact {
  const estimatedCostDeltaInr = roundMoney(input.quantity * input.unitChangeInr);
  const qtyLabel = `${input.quantity.toLocaleString('en-IN')} ${input.quantityUnit}`;
  const copy = [
    `Your project requires approximately ${qtyLabel}.`,
    `A ₹${input.unitChangeInr.toLocaleString('en-IN')}/unit change would alter estimated material cost by approximately ₹${estimatedCostDeltaInr.toLocaleString('en-IN')}.`,
  ].join(' ');
  return {
    quantity: input.quantity,
    quantityUnit: input.quantityUnit,
    unitChangeInr: input.unitChangeInr,
    estimatedCostDeltaInr,
    copy,
  };
}

/**
 * Pure material price position from historical observations.
 * Does not forecast. Does not recommend buying or waiting.
 */
export function calculateMaterialPricePosition(
  rawInput: MaterialPricePositionInput,
  observations: MaterialPricePositionObservation[],
  now: Date = new Date(),
): MaterialPricePositionResult {
  const input = materialPricePositionInputSchema.parse(rawInput);
  const windowDays = input.windowDays;
  const baseMeta = {
    windowDays,
    version: MATERIAL_PRICE_POSITION_VERSION,
    qualification: MATERIAL_PRICE_POSITION_QUALIFICATION,
    methodology: MATERIAL_PRICE_POSITION_METHODOLOGY,
  };

  if (!isPriceHubMaterialKey(input.materialKey) || !isPriceHubCitySlug(input.locationSlug)) {
    return {
      ok: false,
      reason: 'Material or location is not in the Varnarc prices allowlist.',
      observationCount: 0,
      ...baseMeta,
    };
  }

  const windowEnd = now;
  const windowStart = new Date(windowEnd.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const inWindow = observations
    .map((o) => {
      const display = resolveDisplayFreshness({
        claimed: o.claimed,
        verifiedAt: o.verifiedAt,
        effectiveFrom: o.effectiveFrom,
        now,
      });
      const effective = toDate(o.effectiveFrom);
      return { o, display, effective };
    })
    .filter((row) => {
      if (row.effective == null) return false;
      if (row.effective.getTime() < windowStart.getTime()) return false;
      if (row.effective.getTime() > windowEnd.getTime()) return false;
      if (!Number.isFinite(row.o.price) || row.o.price <= 0) return false;
      // Historical series: keep LIVE/VERIFIED claims in-window even if aged vs "now".
      // ESTIMATED/STALE claims stay out so we do not invent a range from soft data.
      return row.o.claimed === 'LIVE' || row.o.claimed === 'VERIFIED';
    })
    .sort((a, b) => a.effective!.getTime() - b.effective!.getTime());

  if (inWindow.length < MATERIAL_PRICE_POSITION_MIN_POINTS) {
    return {
      ok: false,
      reason: `Only ${inWindow.length} reliable observation${inWindow.length === 1 ? '' : 's'} in the last ${windowDays} days — need at least ${MATERIAL_PRICE_POSITION_MIN_POINTS}. We will not invent a price position.`,
      observationCount: inWindow.length,
      ...baseMeta,
    };
  }

  const latest = inWindow[inWindow.length - 1]!;
  const prices = inWindow.map((r) => r.o.price);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const currentPrice = latest.o.price;
  const percentile = high === low ? 50 : empiricalPercentile(prices, currentPrice);
  const positionBand = bandFromPercentile(percentile);
  const positionMeta = MATERIAL_PRICE_POSITION_BANDS.find((b) => b.key === positionBand)!;
  const positionSentence = positionSentenceFor(positionBand, windowDays);

  // Trend: nearest observation on/before (now - 30d), still within or just before window.
  const trendTarget = new Date(windowEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
  const baseline = findNearestObservationOnOrBefore(
    inWindow.map((r) => ({
      id: r.o.id,
      price: r.o.price,
      effectiveFrom: r.effective!,
    })),
    trendTarget,
  );

  let recentTrend: MaterialPricePositionTrend = 'insufficient';
  let trendChangePercent: number | null = null;
  let trendBaselinePrice: number | null = null;
  let trendBaselineDateIso: string | null = null;

  if (baseline && baseline.price > 0) {
    trendBaselinePrice = baseline.price;
    const bd = toDate(baseline.effectiveFrom);
    trendBaselineDateIso = bd ? bd.toISOString() : null;
    const changePct = ((currentPrice - baseline.price) / baseline.price) * 100;
    trendChangePercent = round1(changePct);
    if (Math.abs(changePct) < MATERIAL_PRICE_POSITION_TREND_FLAT_PCT) {
      recentTrend = 'similar';
    } else if (changePct < 0) {
      recentTrend = 'lower';
    } else {
      recentTrend = 'higher';
    }
  }

  const trendMeta = MATERIAL_PRICE_POSITION_TRENDS.find((t) => t.key === recentTrend)!;

  let projectImpact: ProjectPriceImpact | null = null;
  if (
    input.projectQuantity != null &&
    input.projectQuantity > 0 &&
    input.illustrativeUnitChangeInr != null &&
    input.illustrativeUnitChangeInr > 0
  ) {
    projectImpact = calculateProjectPriceImpact({
      quantity: input.projectQuantity,
      quantityUnit: input.projectQuantityUnit?.trim() || latest.o.unit,
      unitChangeInr: input.illustrativeUnitChangeInr,
    });
  }

  return {
    ok: true,
    materialKey: input.materialKey,
    locationSlug: input.locationSlug,
    currency: latest.o.currency ?? 'INR',
    unit: latest.o.unit,
    windowDays,
    windowLabel: `Last ${windowDays} days`,
    windowStartIso: windowStart.toISOString(),
    windowEndIso: windowEnd.toISOString(),
    currentPrice,
    currentEffectiveFromIso: latest.effective!.toISOString(),
    dataFreshness: {
      label: latest.display.label,
      ageDays: latest.display.ageDays,
      isCurrent: latest.display.isCurrent,
      isOlderData: latest.display.isOlderData,
      resolved: latest.display.resolved,
    },
    recentRange: { low, high },
    percentile,
    positionBand,
    positionLabel: positionMeta.label,
    positionSentence,
    recentTrend,
    recentTrendLabel: trendMeta.label,
    recentTrendDescription: trendMeta.description,
    trendBaselinePrice,
    trendBaselineDateIso,
    trendChangePercent,
    observationCount: inWindow.length,
    projectImpact,
    forbiddenClaims: [
      'Does not say “buy now” or “wait to buy”.',
      'Does not say “price will rise” or “price will fall”.',
      'Does not forecast future commodity prices.',
    ],
    limitations: [
      `Historical window: ${windowDays} days (${windowStart.toISOString().slice(0, 10)} → ${windowEnd.toISOString().slice(0, 10)}).`,
      `Data freshness: ${latest.display.label}${latest.display.ageDays != null ? ` · ${latest.display.ageDays} day(s) since observation` : ''}.`,
      'Brand, grade, GST, quantity and delivery change local quotes — verify with dealers.',
      'Position is relative to Varnarc observations only, not the full market.',
    ],
    ...baseMeta,
  };
}

export function listPricePositionMaterials() {
  return PRICE_HUB_MATERIALS.map((m) => ({
    key: m.key,
    label: m.label,
    unitHint: m.unitHint,
  }));
}

export function listPricePositionCities() {
  return PRICE_HUB_CITIES.map((c) => ({ slug: c.slug, name: c.name }));
}
