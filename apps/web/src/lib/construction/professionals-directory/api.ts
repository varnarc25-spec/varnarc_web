/** Construction professionals directory API helpers. */

const apiUrl = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export type ProfessionalSourceBadge = {
  key: 'directory_listing' | 'verified_information' | 'user_reviews' | 'sponsored_listing';
  label: string;
};

export type ProfessionalCard = {
  id: string;
  name: string;
  businessName: string;
  slug: string;
  href: string;
  description: string | null;
  professionalTypes: Array<{ key: string; label: string }>;
  professionalTypeLabels: string[];
  location: { city: string | null; state: string | null; locality: string | null };
  experienceYears: number | null;
  specialities: string[];
  projectTypes: string[];
  serviceArea: string | null;
  portfolio: Array<{ title: string; url?: string | null; imageUrl?: string | null }>;
  contact: {
    phone: string | null;
    email: string | null;
    whatsapp: string | null;
    website: string | null;
  };
  verificationStatus: string;
  verificationLabel: string | null;
  verified: boolean;
  verificationNote: string;
  sponsored: boolean;
  featured: boolean;
  sourceBadges: ProfessionalSourceBadge[];
  userReviews: null;
  userReviewsAvailable: boolean;
  lastUpdated: string;
};

export type ProfessionalsDirectoryPayload = {
  version: string;
  qualification: string;
  filters: Record<string, unknown>;
  types: Array<{ key: string; label: string; pluralLabel: string; href: string }>;
  specialities: Array<{ key: string; label: string; href: string }>;
  projectTypes: Array<{ key: string; label: string; href: string }>;
  cities: Array<{ slug: string; name: string; href: string }>;
  infoSources: Array<{ key: string; label: string; description: string }>;
  sponsoredListings: ProfessionalCard[];
  listings: ProfessionalCard[];
  professionals: ProfessionalCard[];
  meta: {
    hasMore: boolean;
    nextCursor: string | null;
    limit: number;
    count: number;
    rankingNote: string;
    reviewsNote: string;
  };
  directoryHref: string;
  suppliersHref: string;
};

export type ProfessionalProfile = ProfessionalCard & {
  services: Array<{ name: string; description: string | null }>;
  qualification: string;
  neverRankedBest: boolean;
  infoSources: Array<{ key: string; label: string; description: string }>;
  structuredDataEligible: boolean;
};

export type ProfessionalLanding = {
  type: { key: string; label: string; pluralLabel: string };
  city: { slug: string; name: string };
  canonicalPath: string;
  indexable: boolean;
  listings: ProfessionalCard[];
  sponsoredListings: ProfessionalCard[];
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

export async function fetchProfessionalsDirectory(params: {
  location?: string;
  type?: string;
  speciality?: string;
  projectType?: string;
  verified?: string;
  sort?: 'name' | 'recent';
  limit?: number;
}): Promise<ProfessionalsDirectoryPayload | null> {
  const sp = new URLSearchParams();
  if (params.location) sp.set('location', params.location);
  if (params.type) sp.set('type', params.type);
  if (params.speciality) sp.set('speciality', params.speciality);
  if (params.projectType) sp.set('projectType', params.projectType);
  if (params.verified) sp.set('verified', params.verified);
  if (params.sort) sp.set('sort', params.sort);
  if (params.limit) sp.set('limit', String(params.limit));
  try {
    const res = await fetch(`${apiUrl()}/construction/professionals?${sp}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return unwrap<ProfessionalsDirectoryPayload>(await res.json());
  } catch {
    return null;
  }
}

export async function fetchProfessionalProfile(slug: string): Promise<ProfessionalProfile | null> {
  try {
    const res = await fetch(`${apiUrl()}/construction/professionals/profile/${slug}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return unwrap<ProfessionalProfile>(await res.json());
  } catch {
    return null;
  }
}

export async function fetchProfessionalLanding(
  type: string,
  city: string,
): Promise<ProfessionalLanding | null> {
  try {
    const res = await fetch(`${apiUrl()}/construction/professionals/${type}/${city}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return unwrap<ProfessionalLanding>(await res.json());
  } catch {
    return null;
  }
}

export async function fetchProfessionalLandings(): Promise<
  Array<{ type: string; city: string; path: string }>
> {
  try {
    const res = await fetch(`${apiUrl()}/construction/professionals/landings`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const data = unwrap<{ pairs: Array<{ type: string; city: string; path: string }> }>(
      await res.json(),
    );
    return data?.pairs ?? [];
  } catch {
    return [];
  }
}
