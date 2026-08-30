/** VCCI fetch helpers. */

const apiUrl = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export type VcciMethodologyPayload = {
  name: string;
  shortName: string;
  frameworkVersion: string;
  qualification: string;
  baseline: { label: string; start: string; end: string; indexLevel: number };
  components: Array<{
    key: string;
    label: string;
    description: string;
    defaultWeight: number;
    sourceHint: string;
  }>;
  sections: Array<{ id: string; heading: string; body: string }>;
  activeMethodology: {
    id: string;
    version: string;
    label: string;
    baseline: { label: string; start: string; end: string; indexLevel: number };
    weights: Record<string, number>;
    notes: string | null;
    isActive: boolean;
  } | null;
};

export type VcciSnapshot = {
  id: string;
  methodologyVersion: string;
  scope: string;
  componentKey: string | null;
  componentLabel: string | null;
  indexValue: number;
  calculationDate: string;
  componentIndexes: Record<string, number>;
  componentWeights: Record<string, number>;
  sourceDatasets: unknown[];
  coverageRatio: number | null;
  qualityPassed: boolean;
  qualityBlockers: unknown[];
  status: string;
  publishedAt: string | null;
  notes: string | null;
  location: { id: string; name: string; slug: string; type: string } | null;
};

export type VcciHubPayload = {
  published: boolean;
  blockers: string[];
  quality: {
    passed: boolean;
    blockers: string[];
    warnings: string[];
    coverageRatio: number;
    weightSum: number;
    componentCount: number;
    availableComponentCount: number;
  } | null;
  methodology: VcciMethodologyPayload;
  current: VcciSnapshot | null;
  history: VcciSnapshot[];
  showChart: boolean;
  availableCities: string[];
  availableComponents: Array<{ key: string; label: string }>;
};

function unwrap<T>(json: unknown): T | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as { data?: T };
  if ('data' in o) return (o.data ?? null) as T | null;
  return json as T;
}

export async function fetchVcciMethodology(): Promise<VcciMethodologyPayload | null> {
  try {
    const res = await fetch(`${apiUrl()}/construction/vcci/methodology`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return unwrap<VcciMethodologyPayload>(await res.json());
  } catch {
    return null;
  }
}

export async function fetchVcciHub(): Promise<VcciHubPayload | null> {
  try {
    const res = await fetch(`${apiUrl()}/construction/vcci`, { cache: 'no-store' });
    if (!res.ok) return null;
    return unwrap<VcciHubPayload>(await res.json());
  } catch {
    return null;
  }
}

export async function fetchVcciCity(city: string) {
  try {
    const res = await fetch(`${apiUrl()}/construction/vcci/city/${city}`, {
      cache: 'no-store',
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return unwrap<{
      published: boolean;
      city: { slug: string; name: string };
      current: VcciSnapshot;
      history: VcciSnapshot[];
      showChart: boolean;
      methodology: VcciMethodologyPayload;
    }>(await res.json());
  } catch {
    return null;
  }
}

export async function fetchVcciComponent(component: string) {
  try {
    const res = await fetch(`${apiUrl()}/construction/vcci/components/${component}`, {
      cache: 'no-store',
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return unwrap<{
      published: boolean;
      component: {
        key: string;
        label: string;
        description: string;
        defaultWeight: number;
        sourceHint: string;
      };
      current: VcciSnapshot;
      history: VcciSnapshot[];
      showChart: boolean;
      methodology: VcciMethodologyPayload;
    }>(await res.json());
  } catch {
    return null;
  }
}

export async function fetchPublishedVcciCities(): Promise<Array<{ slug: string; name: string }>> {
  try {
    const res = await fetch(`${apiUrl()}/construction/vcci/cities`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = unwrap<{ cities: Array<{ slug: string; name: string }> }>(await res.json());
    return data?.cities ?? [];
  } catch {
    return [];
  }
}
