/**
 * Directory hub helpers — category prioritization, verification labels,
 * opening-hours checks, and search URL builders. No fabricated inventory.
 */

export type DirectoryCategory = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  description?: string | null;
  _count?: { businesses?: number };
};

export type DirectoryListing = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  whatsapp?: string | null;
  logoUrl?: string | null;
  featured?: boolean;
  sponsored?: boolean;
  ownerId?: string | null;
  verificationStatus?: string | null;
  locations?: Array<{
    city?: string | null;
    locality?: string | null;
    state?: string | null;
    country?: string | null;
    address1?: string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
  }>;
  categories?: Array<{ category?: { name?: string; slug?: string } | null } | null>;
  hours?: Array<{
    day: number;
    openTime?: string | null;
    closeTime?: string | null;
    isClosed?: boolean;
  }>;
  _count?: { reviews?: number };
};

export type DirectoryVerticalKey = 'home' | 'solar' | 'automobile' | 'other';

export type DirectoryVerticalGroup = {
  key: DirectoryVerticalKey;
  label: string;
  categories: Array<{ name: string; slug: string; count: number }>;
};

export type PopularService = {
  name: string;
  slug: string;
  count: number;
  description: string;
  icon: 'home' | 'paint' | 'hammer' | 'sun' | 'zap' | 'droplet' | 'car' | 'wrench' | 'building';
};

/** Prefer these when inventory exists — aligned with Varnarc verticals. */
export const POPULAR_SERVICE_PRIORITY: Array<{
  slug: string;
  description: string;
  icon: PopularService['icon'];
}> = [
  { slug: 'architects', description: 'Find architects near you.', icon: 'home' },
  { slug: 'interior-designers', description: 'Design and finish professionals.', icon: 'paint' },
  { slug: 'contractors', description: 'Building contractors for projects.', icon: 'hammer' },
  { slug: 'building-materials', description: 'Material suppliers nearby.', icon: 'building' },
  { slug: 'solar-installers', description: 'Local solar installation providers.', icon: 'sun' },
  { slug: 'electricians', description: 'Licensed electrical services.', icon: 'zap' },
  { slug: 'plumbers', description: 'Plumbing and water systems.', icon: 'droplet' },
  { slug: 'car-dealers', description: 'Car dealers and showrooms.', icon: 'car' },
  { slug: 'service-centers', description: 'Automobile service centres.', icon: 'wrench' },
  { slug: 'spare-parts', description: 'Spare parts dealers.', icon: 'wrench' },
  { slug: 'spare-parts-suppliers', description: 'Spare parts dealers.', icon: 'wrench' },
  { slug: 'cement-dealers', description: 'Cement dealers near you.', icon: 'building' },
  { slug: 'steel-dealers', description: 'Steel and TMT suppliers.', icon: 'building' },
  { slug: 'painters', description: 'Painting contractors.', icon: 'paint' },
  { slug: 'tyre-shops', description: 'Tyre dealers and fitment.', icon: 'car' },
];

const VERTICAL_SLUGS: Record<Exclude<DirectoryVerticalKey, 'other'>, string[]> = {
  home: [
    'architects',
    'interior-designers',
    'contractors',
    'engineers',
    'electricians',
    'plumbers',
    'painters',
    'carpenters',
    'building-materials',
    'cement-dealers',
    'steel-dealers',
    'steel-suppliers',
    'hardware-stores',
    'waterproofing-contractors',
    'tile-contractors',
    'fabricators',
  ],
  solar: [
    'solar-installers',
    'solar-epc',
    'solar-dealers',
    'inverter-dealers',
    'battery-dealers',
    'solar-maintenance',
  ],
  automobile: [
    'car-dealers',
    'used-car-dealers',
    'service-centers',
    'showrooms',
    'tyre-shops',
    'spare-parts',
    'spare-parts-suppliers',
    'charging-stations',
    'ev-charging-stations',
    'detailing-centres',
  ],
};

/** Regulated / unrelated categories — hide until verification + inventory are ready. */
export const HIDDEN_CATEGORY_SLUGS = new Set([
  'investment-advisors',
  'insurance-providers',
  'banks',
  'nbfcs',
  'hospitals',
  'clinics',
  'diagnostic-centers',
  'pharmacies',
  'schools',
  'colleges',
  'coaching-centers',
  'saas-products',
  'cloud-providers',
  'ai-companies',
  'companies',
  'startups',
  'software-vendors',
  'agencies',
  'healthcare',
  'education',
  'technology',
  'finance',
  'business',
]);

const PARENT_TAXONOMY_SLUGS = new Set([
  'construction',
  'automobile',
  'home-services',
  'home',
  'solar',
  ...HIDDEN_CATEGORY_SLUGS,
]);

export function categoryListingCount(category: DirectoryCategory): number {
  return category._count?.businesses ?? 0;
}

export function hasActiveListings(category: DirectoryCategory): boolean {
  return categoryListingCount(category) > 0 && !HIDDEN_CATEGORY_SLUGS.has(category.slug);
}

export function activeLeafCategories(categories: DirectoryCategory[]): DirectoryCategory[] {
  return categories.filter((c) => hasActiveListings(c) && !PARENT_TAXONOMY_SLUGS.has(c.slug));
}

export function classifyCategorySlug(slug: string): DirectoryVerticalKey {
  for (const key of ['home', 'solar', 'automobile'] as const) {
    if (VERTICAL_SLUGS[key].includes(slug)) return key;
  }
  return 'other';
}

export function buildPopularServices(categories: DirectoryCategory[], limit = 8): PopularService[] {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const picked: PopularService[] = [];

  for (const pref of POPULAR_SERVICE_PRIORITY) {
    if (picked.length >= limit) break;
    const cat = bySlug.get(pref.slug);
    if (!cat || !hasActiveListings(cat)) continue;
    picked.push({
      name: cat.name,
      slug: cat.slug,
      count: categoryListingCount(cat),
      description: pref.description,
      icon: pref.icon,
    });
  }

  if (picked.length < Math.min(6, limit)) {
    for (const cat of activeLeafCategories(categories)) {
      if (picked.length >= limit) break;
      if (picked.some((p) => p.slug === cat.slug)) continue;
      picked.push({
        name: cat.name,
        slug: cat.slug,
        count: categoryListingCount(cat),
        description: `Explore ${cat.name.toLowerCase()} near you.`,
        icon: 'building',
      });
    }
  }

  return picked;
}

export function groupCategoriesByVertical(
  categories: DirectoryCategory[],
): DirectoryVerticalGroup[] {
  const leaves = activeLeafCategories(categories);
  const buckets: Record<DirectoryVerticalKey, DirectoryVerticalGroup['categories']> = {
    home: [],
    solar: [],
    automobile: [],
    other: [],
  };

  for (const cat of leaves) {
    const key = classifyCategorySlug(cat.slug);
    buckets[key].push({
      name: cat.name,
      slug: cat.slug,
      count: categoryListingCount(cat),
    });
  }

  const labels: Record<DirectoryVerticalKey, string> = {
    home: 'Home & Construction',
    solar: 'Solar',
    automobile: 'Automobile',
    other: 'More services',
  };

  return (['home', 'solar', 'automobile', 'other'] as const)
    .map((key) => ({
      key,
      label: labels[key],
      categories: buckets[key].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((group) => group.categories.length > 0);
}

export type VerificationLabel = 'listed' | 'claimed' | 'verified' | 'pending';

export function verificationLabel(listing: {
  verificationStatus?: string | null;
  ownerId?: string | null;
}): VerificationLabel {
  if (listing.verificationStatus === 'VERIFIED') return 'verified';
  if (listing.verificationStatus === 'PENDING') return 'pending';
  if (listing.ownerId) return 'claimed';
  return 'listed';
}

export function verificationDisplay(
  label: VerificationLabel,
): { text: string; tone: string } | null {
  switch (label) {
    case 'verified':
      return { text: 'Verified business', tone: 'verified' };
    case 'claimed':
      return { text: 'Claimed listing', tone: 'claimed' };
    case 'pending':
      return { text: 'Verification pending', tone: 'pending' };
    default:
      // Plain "listed" is the default state — omit badge noise on cards.
      return null;
  }
}

export function primaryLocation(listing: DirectoryListing): {
  city?: string;
  locality?: string;
  label: string | null;
} {
  const loc = listing.locations?.[0];
  if (!loc) return { label: null };
  const city = loc.city?.trim() || undefined;
  const locality = loc.locality?.trim() || undefined;
  const parts = [locality, city].filter(Boolean);
  return {
    city,
    locality,
    label: parts.length ? parts.join(', ') : null,
  };
}

export function categoryNames(listing: DirectoryListing): string[] {
  return (listing.categories ?? [])
    .map((link) => link?.category?.name?.trim())
    .filter((name): name is string => Boolean(name));
}

export function isOpenNow(hours: DirectoryListing['hours'], now: Date = new Date()): boolean {
  if (!hours?.length) return false;
  const slot = hours.find((h) => h.day === now.getDay());
  if (!slot || slot.isClosed || !slot.openTime || !slot.closeTime) return false;
  const toMins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return nowMins >= toMins(slot.openTime) && nowMins <= toMins(slot.closeTime);
}

export function openUntilLabel(
  hours: DirectoryListing['hours'],
  now: Date = new Date(),
): string | null {
  if (!hours?.length) return null;
  const slot = hours.find((h) => h.day === now.getDay());
  if (!slot || slot.isClosed || !slot.closeTime) return null;
  if (!isOpenNow(hours, now)) return null;
  return `Open until ${slot.closeTime}`;
}

export function buildDirectorySearchHref(input: {
  q?: string;
  city?: string;
  category?: string;
  verified?: boolean;
  featured?: boolean;
  sponsored?: boolean;
  openNow?: boolean;
  sort?: string;
}): string {
  const params = new URLSearchParams();
  if (input.q?.trim()) params.set('q', input.q.trim());
  if (input.city?.trim()) params.set('city', input.city.trim());
  if (input.category?.trim()) params.set('category', input.category.trim());
  if (input.verified) params.set('verified', 'true');
  if (input.featured) params.set('featured', 'true');
  if (input.sponsored) params.set('sponsored', 'true');
  if (input.openNow) params.set('openNow', 'true');
  if (input.sort?.trim()) params.set('sort', input.sort.trim());
  const qs = params.toString();
  return qs ? `/directory/search?${qs}` : '/directory/search';
}

export function listingHasCoordinates(listing: DirectoryListing): boolean {
  return (listing.locations ?? []).some(
    (loc) => loc.latitude != null && loc.longitude != null && !Number.isNaN(Number(loc.latitude)),
  );
}

export const DIRECTORY_DISCLAIMER =
  'Varnarc Directory helps you discover businesses and service providers. Listings may be business-submitted or independently added. Verification status is labeled when available. Ratings, when shown, identify their source. Always confirm credentials, suitability, pricing and availability directly with the provider before hiring or purchasing.';

export const DIRECTORY_CROSS_LINKS = [
  {
    title: 'Solar calculator',
    description: 'Estimate savings, then find installers near you.',
    href: '/solar',
    cta: 'Find solar installers',
    directoryHref: '/directory/search?q=solar',
  },
  {
    title: 'Construction tools',
    description: 'Plan materials and costs, then find contractors.',
    href: '/construction',
    cta: 'Find contractors',
    directoryHref: '/directory/search?category=contractors',
  },
  {
    title: 'Automobile',
    description: 'Compare cars, then find dealers and service centres.',
    href: '/automobile',
    cta: 'Find dealers',
    directoryHref: '/directory/search?category=car-dealers',
  },
] as const;
