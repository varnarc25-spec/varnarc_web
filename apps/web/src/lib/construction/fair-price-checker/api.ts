/** Types + fetch helpers for Construction Fair Price Checker. */

const apiUrl = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export type FairPriceMeta = {
  version: string;
  qualification: string;
  methodology: string;
  materials: Array<{ key: string; label: string; unitHint: string }>;
  cities: Array<{ slug: string; name: string }>;
  units: Array<{ key: string; label: string }>;
};

export type FairPriceSuccess = {
  ok: true;
  classification: 'within_range' | 'below_range' | 'above_range';
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
  materialKey: string;
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
};

export type FairPriceFailure = {
  ok: false;
  reason: string;
  code: string;
  methodology: string;
  methodologyVersion: string;
  dataCount: number;
  disclaimer: string;
};

export type FairPriceResult = FairPriceSuccess | FairPriceFailure;

function unwrap<T>(json: unknown): T | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as { data?: T };
  if ('data' in o) return (o.data ?? null) as T | null;
  return json as T;
}

export async function fetchFairPriceMeta(): Promise<FairPriceMeta | null> {
  try {
    const res = await fetch(`${apiUrl()}/construction/fair-price-checker/meta`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return unwrap<FairPriceMeta>(await res.json());
  } catch {
    return null;
  }
}

export async function checkFairPrice(body: {
  materialKey: string;
  locationSlug: string;
  quotedUnit: string;
  quotedPrice: number;
  quantity?: number | null;
  currency?: string;
}): Promise<FairPriceResult | null> {
  try {
    const res = await fetch(`${apiUrl()}/construction/fair-price-checker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return unwrap<FairPriceResult>(await res.json());
  } catch {
    return null;
  }
}
