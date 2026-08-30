/** Construction supplier directory API helpers. */

const apiUrl = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export type SupplierCard = {
  id: string;
  name: string;
  slug: string;
  href: string;
  description: string | null;
  categories: Array<{ key: string; label: string }>;
  categoryLabels: string[];
  location: { city: string | null; state: string | null; locality: string | null };
  contact: {
    phone: string | null;
    email: string | null;
    whatsapp: string | null;
    website: string | null;
  };
  brands: string[];
  verificationStatus: string;
  verificationLabel: string | null;
  verified: boolean;
  sponsored: boolean;
  featured: boolean;
  lastUpdated: string;
};

export type SupplierDirectoryPayload = {
  version: string;
  qualification: string;
  filters: Record<string, unknown>;
  categories: Array<{ key: string; label: string; href: string }>;
  cities: Array<{ slug: string; name: string; href: string }>;
  sponsoredListings: SupplierCard[];
  listings: SupplierCard[];
  businesses: SupplierCard[];
  meta: {
    hasMore: boolean;
    nextCursor: string | null;
    limit: number;
    count: number;
    rankingNote: string;
  };
  directoryHref: string;
};

export type SupplierProfile = SupplierCard & {
  businessName: string;
  hours: Array<{ dayLabel: string; text: string }>;
  hoursAvailable: boolean;
  services: Array<{ name: string; description: string | null }>;
  products: Array<{ name: string; description: string | null; price: string | null }>;
  qualification: string;
  neverRankedBest: boolean;
};

export type SupplierLanding = {
  category: { key: string; label: string };
  city: { slug: string; name: string };
  canonicalPath: string;
  indexable: boolean;
  listings: SupplierCard[];
  sponsoredListings: SupplierCard[];
  qualification: string;
  sampleSize: number;
  lastUpdated: string | null;
};

function unwrap<T>(json: unknown): T | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as { data?: T };
  if ('data' in o) return (o.data ?? null) as T | null;
  return json as T;
}

export async function fetchSupplierDirectory(
  params: {
    location?: string;
    category?: string;
    brand?: string;
    verified?: string;
    sort?: string;
    limit?: number;
  } = {},
): Promise<SupplierDirectoryPayload | null> {
  try {
    const sp = new URLSearchParams();
    if (params.location) sp.set('location', params.location);
    if (params.category) sp.set('category', params.category);
    if (params.brand) sp.set('brand', params.brand);
    if (params.verified) sp.set('verified', params.verified);
    if (params.sort) sp.set('sort', params.sort);
    if (params.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString();
    const res = await fetch(`${apiUrl()}/construction/suppliers${qs ? `?${qs}` : ''}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return unwrap<SupplierDirectoryPayload>(await res.json());
  } catch {
    return null;
  }
}

export async function fetchSupplierProfile(slug: string): Promise<SupplierProfile | null> {
  try {
    const res = await fetch(`${apiUrl()}/construction/suppliers/profile/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return unwrap<SupplierProfile>(await res.json());
  } catch {
    return null;
  }
}

export async function fetchSupplierLanding(
  category: string,
  city: string,
): Promise<SupplierLanding | null> {
  try {
    const res = await fetch(`${apiUrl()}/construction/suppliers/${category}/${city}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return unwrap<SupplierLanding>(await res.json());
  } catch {
    return null;
  }
}

export async function fetchSupplierLandings(): Promise<
  Array<{ category: string; city: string; path: string }>
> {
  try {
    const res = await fetch(`${apiUrl()}/construction/suppliers/landings`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = unwrap<{ pairs: Array<{ category: string; city: string; path: string }> }>(
      await res.json(),
    );
    return data?.pairs ?? [];
  } catch {
    return [];
  }
}
