/** Construction Professionals Directory — shared architecture for trades professionals. */

import { z } from 'zod';
import { PRICE_HUB_CITIES } from '../prices-hub';
import { verificationDisplay } from '../supplier-directory';

export const PROFESSIONALS_DIRECTORY_VERSION = '2026.08.1';

export const PROFESSIONALS_DIRECTORY_QUALIFICATION =
  'Listings are directory businesses tagged as construction professionals. A directory listing is not a Varnarc endorsement. “Verified” appears only when Varnarc’s verification program has marked the business verified — it is not a professional licence or certification. Sponsored placements are labelled Sponsored. User reviews, if added later, will be shown separately from verified information.';

/** Canonical professional types. */
export const PROFESSIONAL_TYPES = [
  {
    key: 'contractor',
    label: 'Contractor',
    pluralLabel: 'Contractors',
    directorySlugs: ['contractors', 'builders', 'general-contractors'],
    schemaType: 'GeneralContractor' as const,
  },
  {
    key: 'architect',
    label: 'Architect',
    pluralLabel: 'Architects',
    directorySlugs: ['architects'],
    schemaType: 'Architect' as const, // used as additionalType / description only
  },
  {
    key: 'civil_engineer',
    label: 'Civil engineer',
    pluralLabel: 'Civil engineers',
    directorySlugs: ['civil-engineers', 'structural-engineers', 'engineers'],
    schemaType: 'ProfessionalService' as const,
  },
  {
    key: 'interior_designer',
    label: 'Interior designer',
    pluralLabel: 'Interior designers',
    directorySlugs: ['interior-designers'],
    schemaType: 'ProfessionalService' as const,
  },
] as const;

export type ProfessionalTypeKey = (typeof PROFESSIONAL_TYPES)[number]['key'];

export const PROFESSIONAL_DIRECTORY_SLUGS: readonly string[] = Array.from(
  new Set(PROFESSIONAL_TYPES.flatMap((t) => [...t.directorySlugs])),
);

export const PROFESSIONAL_SPECIALITIES = [
  { key: 'residential', label: 'Residential' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'industrial', label: 'Industrial' },
  { key: 'renovation', label: 'Renovation / remodel' },
  { key: 'structural', label: 'Structural' },
  { key: 'landscape', label: 'Landscape' },
  { key: 'vastu', label: 'Vastu / planning advisory' },
  { key: 'turnkey', label: 'Turnkey' },
  { key: 'project_management', label: 'Project management' },
  { key: 'other', label: 'Other' },
] as const;

export type ProfessionalSpecialityKey = (typeof PROFESSIONAL_SPECIALITIES)[number]['key'];

export const PROFESSIONAL_PROJECT_TYPES = [
  { key: 'new_home', label: 'New home' },
  { key: 'apartment', label: 'Apartment / flat' },
  { key: 'villa', label: 'Villa' },
  { key: 'office', label: 'Office' },
  { key: 'retail', label: 'Retail' },
  { key: 'warehouse', label: 'Warehouse / industrial' },
  { key: 'interior_fitout', label: 'Interior fit-out' },
  { key: 'renovation', label: 'Renovation' },
  { key: 'other', label: 'Other' },
] as const;

export type ProfessionalProjectTypeKey = (typeof PROFESSIONAL_PROJECT_TYPES)[number]['key'];

export const PROFESSIONALS_DIRECTORY_CITIES = PRICE_HUB_CITIES;

export const PROFESSIONAL_SORT_OPTIONS = [
  { key: 'name', label: 'Name (A–Z)' },
  { key: 'recent', label: 'Recently updated' },
] as const;

export const PROFESSIONAL_DEFAULT_SORT = 'name' as const;

/** How a piece of profile information should be labelled in UI. */
export const PROFESSIONAL_INFO_SOURCES = [
  {
    key: 'directory_listing',
    label: 'Directory listing',
    description:
      'Self-reported or editorially entered listing data — not independently certified by Varnarc.',
  },
  {
    key: 'verified_information',
    label: 'Verified information',
    description:
      'Confirmed through Varnarc’s verification program. Does not mean Varnarc certifies professional qualifications or licences.',
  },
  {
    key: 'user_reviews',
    label: 'User reviews',
    description:
      'Opinions from users when the reviews feature is enabled — separate from verification.',
  },
  {
    key: 'sponsored_listing',
    label: 'Sponsored listing',
    description: 'Paid placement. Clearly labelled and never ranked as “best”.',
  },
] as const;

export type ProfessionalInfoSourceKey = (typeof PROFESSIONAL_INFO_SOURCES)[number]['key'];

export const professionalsDirectoryQuerySchema = z.object({
  location: z.string().trim().max(80).optional().nullable(),
  type: z
    .enum(['contractor', 'architect', 'civil_engineer', 'interior_designer'])
    .optional()
    .nullable(),
  speciality: z.string().trim().max(60).optional().nullable(),
  projectType: z.string().trim().max(60).optional().nullable(),
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

export type ProfessionalsDirectoryQuery = z.infer<typeof professionalsDirectoryQuerySchema>;

export function isProfessionalTypeKey(value: string): value is ProfessionalTypeKey {
  return PROFESSIONAL_TYPES.some((t) => t.key === value);
}

export function getProfessionalType(key: string) {
  return PROFESSIONAL_TYPES.find((t) => t.key === key) ?? null;
}

export function directorySlugsForProfessionalType(
  key: ProfessionalTypeKey | null | undefined,
): string[] {
  if (!key) return [...PROFESSIONAL_DIRECTORY_SLUGS];
  const t = getProfessionalType(key);
  return t ? [...t.directorySlugs] : [...PROFESSIONAL_DIRECTORY_SLUGS];
}

export function inferProfessionalTypesFromDirectorySlugs(slugs: string[]): ProfessionalTypeKey[] {
  const keys = new Set<ProfessionalTypeKey>();
  for (const t of PROFESSIONAL_TYPES) {
    if (t.directorySlugs.some((s) => slugs.includes(s))) keys.add(t.key);
  }
  return Array.from(keys);
}

export function professionalProfilePath(slug: string): string {
  return `/construction/professionals/profile/${slug}`;
}

export function professionalLandingPath(typeKey: string, citySlug: string): string {
  return `/construction/professionals/${typeKey}/${citySlug}`;
}

export const PROFESSIONAL_SEO_MIN_LISTINGS = 3;
export const PROFESSIONAL_SEO_MIN_DESCRIPTION_CHARS = 40;

export function canIndexProfessionalLanding(input: {
  typeKey: string;
  citySlug: string;
  listings: Array<{ description?: string | null; status?: string }>;
}): boolean {
  if (!isProfessionalTypeKey(input.typeKey)) return false;
  if (!PROFESSIONALS_DIRECTORY_CITIES.some((c) => c.slug === input.citySlug)) return false;
  const useful = input.listings.filter((l) => {
    if (l.status && l.status !== 'APPROVED') return false;
    return (l.description ?? '').trim().length >= PROFESSIONAL_SEO_MIN_DESCRIPTION_CHARS;
  });
  return useful.length >= PROFESSIONAL_SEO_MIN_LISTINGS;
}

export type ProfessionalMetadataShape = {
  experienceYears?: number | null;
  specialities?: string[];
  projectTypes?: string[];
  serviceArea?: string | null;
  portfolio?: Array<{ title: string; url?: string | null; imageUrl?: string | null }>;
};

export function parseProfessionalMetadata(raw: unknown): ProfessionalMetadataShape {
  if (!raw || typeof raw !== 'object') return {};
  const m = raw as Record<string, unknown>;
  const specialities = Array.isArray(m.specialities)
    ? m.specialities.filter((x): x is string => typeof x === 'string')
    : Array.isArray(m.specialties)
      ? m.specialties.filter((x): x is string => typeof x === 'string')
      : [];
  const projectTypes = Array.isArray(m.projectTypes)
    ? m.projectTypes.filter((x): x is string => typeof x === 'string')
    : [];
  const portfolio = Array.isArray(m.portfolio)
    ? m.portfolio
        .filter((p): p is Record<string, unknown> => Boolean(p) && typeof p === 'object')
        .map((p) => ({
          title: typeof p.title === 'string' ? p.title : 'Project',
          url: typeof p.url === 'string' ? p.url : null,
          imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : null,
        }))
        .filter((p) => p.title.trim())
    : [];
  const experienceYears =
    typeof m.experienceYears === 'number'
      ? m.experienceYears
      : typeof m.experience === 'number'
        ? m.experience
        : null;
  const serviceArea =
    typeof m.serviceArea === 'string'
      ? m.serviceArea
      : typeof m.service_area === 'string'
        ? m.service_area
        : null;
  return { experienceYears, specialities, projectTypes, serviceArea, portfolio };
}

/**
 * Build schema.org ProfessionalService / LocalBusiness JSON-LD only when the entity
 * has enough valid fields. Returns null otherwise (do not emit empty/misleading markup).
 */
export function buildProfessionalStructuredData(input: {
  name: string;
  description?: string | null;
  url: string;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  professionalTypeKey?: ProfessionalTypeKey | null;
  /** Never claim certification; only optional sameAs links. */
  sameAs?: string[];
}): Record<string, unknown> | null {
  const name = input.name.trim();
  if (!name || !input.url.trim()) return null;
  // Require at least a locality for LocalBusiness-style entity validity.
  if (!input.city?.trim()) return null;

  const type = input.professionalTypeKey ? getProfessionalType(input.professionalTypeKey) : null;

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name,
    description: input.description?.trim() || undefined,
    url: input.url,
    telephone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    additionalType: type ? `https://varnarc.local/professional-type/${type.key}` : undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: input.city.trim(),
      addressRegion: input.state?.trim() || undefined,
      addressCountry: input.country?.trim() || 'IN',
    },
    sameAs: input.sameAs?.length ? input.sameAs : undefined,
    // Explicitly omit aggregateRating / review until a real reviews feature ships.
  };
}

export function listingSourceBadges(input: {
  verificationStatus?: string | null;
  sponsored?: boolean;
}): Array<{ key: ProfessionalInfoSourceKey; label: string }> {
  const badges: Array<{ key: ProfessionalInfoSourceKey; label: string }> = [
    { key: 'directory_listing', label: 'Directory listing' },
  ];
  const v = verificationDisplay(input.verificationStatus);
  if (v.verified) {
    badges.push({ key: 'verified_information', label: 'Verified information' });
  }
  if (input.sponsored) {
    badges.push({ key: 'sponsored_listing', label: 'Sponsored listing' });
  }
  return badges;
}

export { verificationDisplay };
