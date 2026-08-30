/** Construction Supplier Directory — filters, profiles, SEO gates (no deceptive ranking). */

import { z } from 'zod';
import { PRICE_HUB_CITIES } from '../prices-hub';

export const SUPPLIER_DIRECTORY_VERSION = '2026.08.1';

export const SUPPLIER_DIRECTORY_QUALIFICATION =
  'Listings are directory businesses tagged for construction materials and related trades. Varnarc does not rank suppliers as “best”. Sponsored placements, when present, are labelled Sponsored. Verification badges appear only when Varnarc’s verification program has marked the business verified.';

/** Canonical supplier material/trade categories for the construction hub. */
export const SUPPLIER_DIRECTORY_CATEGORIES = [
  {
    key: 'cement',
    label: 'Cement',
    directorySlugs: ['cement-dealers', 'building-materials'],
  },
  {
    key: 'steel',
    label: 'Steel',
    directorySlugs: ['steel-dealers', 'building-materials'],
  },
  {
    key: 'sand',
    label: 'Sand',
    directorySlugs: ['building-materials'],
  },
  {
    key: 'aggregate',
    label: 'Aggregate',
    directorySlugs: ['building-materials'],
  },
  {
    key: 'tiles',
    label: 'Tiles',
    directorySlugs: ['building-materials', 'interior-designers'],
  },
  {
    key: 'paint',
    label: 'Paint',
    directorySlugs: ['building-materials', 'interior-designers'],
  },
  {
    key: 'sanitary',
    label: 'Sanitary',
    directorySlugs: ['building-materials', 'plumbers'],
  },
  {
    key: 'electrical',
    label: 'Electrical',
    directorySlugs: ['electricians', 'building-materials'],
  },
  {
    key: 'hardware',
    label: 'Hardware',
    directorySlugs: ['building-materials'],
  },
  {
    key: 'other',
    label: 'Other',
    directorySlugs: ['building-materials', 'contractors', 'architects', 'interior-designers'],
  },
] as const;

export type SupplierDirectoryCategoryKey = (typeof SUPPLIER_DIRECTORY_CATEGORIES)[number]['key'];

/** All directory category slugs that qualify a business for the construction suppliers hub. */
export const SUPPLIER_DIRECTORY_SLUGS: readonly string[] = Array.from(
  new Set(SUPPLIER_DIRECTORY_CATEGORIES.flatMap((c) => [...c.directorySlugs])),
);

export const SUPPLIER_DIRECTORY_CITIES = PRICE_HUB_CITIES;

/** Minimum APPROVED listings with useful description for an indexable landing. */
export const SUPPLIER_SEO_MIN_LISTINGS = 3;
/** Min description length to count as “useful information”. */
export const SUPPLIER_SEO_MIN_DESCRIPTION_CHARS = 40;

/** Default listing sort — alphabetical, not “best supplier”. */
export const SUPPLIER_DEFAULT_SORT = 'name' as const;

export const SUPPLIER_SORT_OPTIONS = [
  { key: 'name', label: 'Name (A–Z)' },
  { key: 'recent', label: 'Recently updated' },
] as const;

export type SupplierSortKey = (typeof SUPPLIER_SORT_OPTIONS)[number]['key'];

export const supplierDirectoryQuerySchema = z.object({
  location: z.string().trim().max(80).optional().nullable(),
  category: z
    .enum([
      'cement',
      'steel',
      'sand',
      'aggregate',
      'tiles',
      'paint',
      'sanitary',
      'electrical',
      'hardware',
      'other',
    ])
    .optional()
    .nullable(),
  brand: z.string().trim().max(80).optional().nullable(),
  verified: z
    .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
    .optional()
    .nullable()
    .transform((v) => {
      if (v === true || v === 'true' || v === '1') return true;
      if (v === false || v === 'false' || v === '0') return false;
      return undefined;
    }),
  sort: z.enum(['name', 'recent']).optional().default('name'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(48),
  cursor: z.string().uuid().optional().nullable(),
});

export type SupplierDirectoryQuery = z.infer<typeof supplierDirectoryQuerySchema>;

export function isSupplierDirectoryCategoryKey(
  value: string,
): value is SupplierDirectoryCategoryKey {
  return SUPPLIER_DIRECTORY_CATEGORIES.some((c) => c.key === value);
}

export function getSupplierDirectoryCategory(key: string) {
  return SUPPLIER_DIRECTORY_CATEGORIES.find((c) => c.key === key) ?? null;
}

export function directorySlugsForCategory(
  key: SupplierDirectoryCategoryKey | null | undefined,
): string[] {
  if (!key) return [...SUPPLIER_DIRECTORY_SLUGS];
  const cat = getSupplierDirectoryCategory(key);
  return cat ? [...cat.directorySlugs] : [...SUPPLIER_DIRECTORY_SLUGS];
}

export function inferSupplierCategoriesFromDirectorySlugs(
  slugs: string[],
): SupplierDirectoryCategoryKey[] {
  const keys = new Set<SupplierDirectoryCategoryKey>();
  for (const cat of SUPPLIER_DIRECTORY_CATEGORIES) {
    if (cat.key === 'other') continue;
    if (cat.directorySlugs.some((s) => slugs.includes(s))) keys.add(cat.key);
  }
  if (!keys.size && slugs.some((s) => SUPPLIER_DIRECTORY_SLUGS.includes(s))) {
    keys.add('other');
  }
  return Array.from(keys);
}

export function verificationDisplay(status: string | null | undefined): {
  verified: boolean;
  label: string | null;
} {
  if (status === 'VERIFIED') {
    return { verified: true, label: 'Verified by Varnarc' };
  }
  return { verified: false, label: null };
}

export type SupplierListingCandidate = {
  description?: string | null;
  status?: string;
  city?: string | null;
  categoryKeys?: string[];
};

/**
 * SEO gate: only index when enough useful APPROVED listings exist for the pair.
 * Never invent listings to fill a landing.
 */
export function canIndexSupplierLanding(input: {
  categoryKey: string;
  citySlug: string;
  listings: SupplierListingCandidate[];
}): boolean {
  if (!isSupplierDirectoryCategoryKey(input.categoryKey)) return false;
  if (!SUPPLIER_DIRECTORY_CITIES.some((c) => c.slug === input.citySlug)) return false;

  const useful = input.listings.filter((l) => {
    if (l.status && l.status !== 'APPROVED') return false;
    const desc = (l.description ?? '').trim();
    if (desc.length < SUPPLIER_SEO_MIN_DESCRIPTION_CHARS) return false;
    return true;
  });

  return useful.length >= SUPPLIER_SEO_MIN_LISTINGS;
}

export function supplierLandingPath(categoryKey: string, citySlug: string): string {
  return `/construction/suppliers/${categoryKey}/${citySlug}`;
}

export function supplierProfilePath(slug: string): string {
  return `/construction/suppliers/profile/${slug}`;
}

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function formatBusinessHours(
  hours: Array<{
    day: number;
    openTime?: string | null;
    closeTime?: string | null;
    isClosed?: boolean | null;
  }>,
): Array<{ dayLabel: string; text: string }> {
  return [...hours]
    .sort((a, b) => a.day - b.day)
    .map((h) => {
      const dayLabel = DAY_LABELS[h.day] ?? `Day ${h.day}`;
      if (h.isClosed) return { dayLabel, text: 'Closed' };
      if (h.openTime && h.closeTime) return { dayLabel, text: `${h.openTime} – ${h.closeTime}` };
      return { dayLabel, text: 'Hours not listed' };
    });
}
