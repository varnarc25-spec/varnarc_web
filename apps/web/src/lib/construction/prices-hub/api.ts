/** Types + fetch helpers for Construction Prices hub. */

import type { PricePeriodChange } from '@varnarc/validation';

const apiUrl = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export type PriceObservation = {
  id: string;
  price: number;
  minPrice: number | null;
  maxPrice: number | null;
  unit: string;
  currency: string;
  source: string | null;
  sourceUrl?: string | null;
  notes?: string | null;
  sourceCategory: string;
  sourceCategoryLabel: string;
  claimedFreshness: string;
  freshness: string;
  freshnessLabel: string;
  isCurrent: boolean;
  isOlderData: boolean;
  ageDays: number | null;
  effectiveFrom: string;
  verifiedAt: string | null;
  lastUpdated: string;
  material: {
    id: string;
    name: string;
    slug: string;
    hubKey: string | null;
    unit: string;
  } | null;
  location: {
    id: string;
    name: string;
    slug: string;
    type: string;
  } | null;
  brand: { id: string; name: string; slug: string } | null;
};

export type PricesHubPayload = {
  materials: Array<{
    key: string;
    label: string;
    unitHint: string;
    calculatorHref: string;
    hasData: boolean;
  }>;
  locations: Array<{ slug: string; name: string; hasData: boolean }>;
  latest: PriceObservation[];
  observationCount: number;
  currentCount: number;
  olderCount: number;
};

export type PriceLandingPayload = {
  material: { key: string; label: string; unitHint: string; calculatorHref: string };
  city: { slug: string; name: string };
  current: PriceObservation | null;
  older: PriceObservation[];
  history: PriceObservation[];
  changes: PricePeriodChange[];
  showChart: boolean;
  canonicalPath: string;
  indexable?: boolean;
  seo?: {
    editorialIntro: string;
    localMarketNote: string;
    methodology: string;
    qualification: string;
    calculationExample: string;
    faqs: Array<{ question: string; answer: string }>;
    calculatorHref: string;
    calculatorLabel: string;
    relatedMaterialHrefs: Array<{ href: string; label: string }>;
    relatedCityHrefs: Array<{ href: string; label: string }>;
    priceRange: { low: number; high: number } | null;
    lastUpdatedIso: string | null;
    unit: string | null;
    version: string;
  };
};

function unwrap<T>(json: unknown): T | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as { data?: T };
  if ('data' in o) return (o.data ?? null) as T | null;
  return json as T;
}

export async function fetchPricesHub(query?: {
  material?: string;
  location?: string;
}): Promise<PricesHubPayload | null> {
  const sp = new URLSearchParams();
  if (query?.material) sp.set('material', query.material);
  if (query?.location) sp.set('location', query.location);
  const qs = sp.toString();
  try {
    const res = await fetch(`${apiUrl()}/construction/prices${qs ? `?${qs}` : ''}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return unwrap<PricesHubPayload>(await res.json());
  } catch {
    return null;
  }
}

export async function fetchPriceLanding(
  material: string,
  city: string,
): Promise<PriceLandingPayload | null> {
  try {
    const res = await fetch(`${apiUrl()}/construction/prices/${material}/${city}`, {
      cache: 'no-store',
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return unwrap<PriceLandingPayload>(await res.json());
  } catch {
    return null;
  }
}

/** Non-SEO-gated history for hub panels (any observations). */
export async function fetchPricePairHistory(
  material: string,
  city: string,
): Promise<PriceLandingPayload | null> {
  try {
    const res = await fetch(`${apiUrl()}/construction/prices/${material}/${city}/history`, {
      cache: 'no-store',
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return unwrap<PriceLandingPayload>(await res.json());
  } catch {
    return null;
  }
}

export async function fetchIndexablePriceLandings(): Promise<
  Array<{ material: string; city: string }>
> {
  try {
    const res = await fetch(`${apiUrl()}/construction/prices/landings`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = unwrap<{ pairs: Array<{ material: string; city: string }> }>(await res.json());
    return data?.pairs ?? [];
  } catch {
    return [];
  }
}
