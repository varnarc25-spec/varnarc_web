/** Fetch helpers for location-specific construction-cost landings. */

import type { ConstructionCostCityLanding } from '@varnarc/validation';

const apiUrl = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

function unwrap<T>(json: unknown): T | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as { data?: T };
  if ('data' in o) return (o.data ?? null) as T | null;
  return json as T;
}

export type ConstructionCostCityLandingPayload = ConstructionCostCityLanding;

export async function fetchConstructionCostCityLanding(
  city: string,
): Promise<ConstructionCostCityLandingPayload | null> {
  try {
    const res = await fetch(`${apiUrl()}/construction/construction-cost/${city}`, {
      cache: 'no-store',
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return unwrap<ConstructionCostCityLandingPayload>(await res.json());
  } catch {
    return null;
  }
}

export async function fetchIndexableConstructionCostCities(): Promise<
  Array<{ city: string; name: string; path: string }>
> {
  try {
    const res = await fetch(`${apiUrl()}/construction/construction-cost/landings`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = unwrap<{
      cities: Array<{ city: string; name: string; path: string }>;
    }>(await res.json());
    return data?.cities ?? [];
  } catch {
    return [];
  }
}
