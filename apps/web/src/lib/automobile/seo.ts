import type { Metadata } from 'next';
import {
  buildAutomobileJsonLdGraph as buildAutomobileJsonLdGraphCore,
  type BuildAutomobileJsonLdGraphInput,
} from '@varnarc/validation';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { AUTOMOBILE_PAGE_DEFAULTS, type AutomobilePageKey } from '@/lib/automobile/seo-pages';
import { getPublicSiteUrlSync } from '@/lib/public-site-url';

const siteUrl = () => getPublicSiteUrlSync();

/** Listing/filter query keys that must not create indexable duplicates. */
export const AUTOMOBILE_FILTER_QUERY_KEYS = [
  'manufacturerId',
  'manufacturer',
  'fuelType',
  'bodyType',
  'category',
  'featured',
  'sponsored',
  'search',
  'q',
  'sort',
  'order',
  'page',
  'cursor',
  'ids',
  'transmission',
  'minSeats',
  'maxSeats',
  'maxPrice',
  'minPrice',
  'minMileage',
  'minSafety',
  'manufacturerSlug',
  'budget',
  'seats',
  'groupByModel',
  'compare',
  'vehicleId',
  'tab',
  'view',
] as const;

/**
 * Calculator share/state params — allowed for UX sharing, but canonical stays clean.
 * Presence → noindex the parameterized URL.
 */
export const AUTOMOBILE_CALC_SHARE_QUERY_KEYS = [
  'amount',
  'rate',
  'tenure',
  'tenureUnit',
  'price',
  'downPayment',
  'principal',
  'interest',
  'km',
  'distance',
  'mileage',
  'fuelPrice',
  'fuel',
  'years',
  'age',
  'premium',
  'idv',
  's',
  'inputs',
  'mode',
] as const;

export type AutomobileCrumbInput = { name: string; path: string };

export type AutomobileIndexingInput = {
  pathname: string;
  searchParams?: URLSearchParams | Record<string, string | string[] | undefined | null>;
  forceNoIndex?: boolean;
};

export type AutomobileIndexingResult = {
  canonicalPath: string;
  canonicalUrl: string;
  index: boolean;
  follow: boolean;
  robots: Metadata['robots'];
  reason: string;
};

function toSearchParams(
  input?: URLSearchParams | Record<string, string | string[] | undefined | null>,
): URLSearchParams {
  if (!input) return new URLSearchParams();
  if (input instanceof URLSearchParams) return input;
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) if (v) sp.append(key, v);
    } else if (value !== '') {
      sp.set(key, value);
    }
  }
  return sp;
}

function hasAnyKey(sp: URLSearchParams, keys: readonly string[]): boolean {
  return keys.some((k) => sp.has(k) && sp.get(k)?.trim());
}

export function isAutomobileCalculatorPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/';
  return p === '/automobile/calculators' || /^\/automobile\/calculators\//.test(p);
}

export function automobileCanonicalPath(pathname: string): string {
  const p = pathname.startsWith('/') ? pathname.replace(/\/$/, '') || '/' : `/${pathname}`;
  return p;
}

export function resolveAutomobileIndexing(
  input: AutomobileIndexingInput,
): AutomobileIndexingResult {
  const pathname = input.pathname.startsWith('/') ? input.pathname : `/${input.pathname}`;
  const sp = toSearchParams(input.searchParams);
  const canonicalPath = automobileCanonicalPath(pathname);
  const canonicalUrl = `${siteUrl()}${canonicalPath}`;

  if (input.forceNoIndex) {
    return {
      canonicalPath,
      canonicalUrl,
      index: false,
      follow: false,
      robots: { index: false, follow: false },
      reason: 'forced',
    };
  }

  const isCalc = isAutomobileCalculatorPath(pathname);

  if (isCalc && hasAnyKey(sp, AUTOMOBILE_CALC_SHARE_QUERY_KEYS)) {
    return {
      canonicalPath,
      canonicalUrl,
      index: false,
      follow: true,
      robots: { index: false, follow: true },
      reason: 'calculator_share_params',
    };
  }

  if (hasAnyKey(sp, AUTOMOBILE_FILTER_QUERY_KEYS)) {
    return {
      canonicalPath,
      canonicalUrl,
      index: false,
      follow: true,
      robots: { index: false, follow: true },
      reason: 'filter_query',
    };
  }

  return {
    canonicalPath,
    canonicalUrl,
    index: true,
    follow: true,
    robots: { index: true, follow: true },
    reason: 'indexable',
  };
}

export function formatAutomobileLastUpdated(
  date: Date | string | null | undefined,
  timeZone = 'Asia/Kolkata',
): string | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone,
  }).format(d);
}

export function automobileAbsoluteUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl()}${p}`;
}

export function automobileHubBreadcrumbs(
  extra: AutomobileCrumbInput[] = [],
): AutomobileCrumbInput[] {
  return [{ name: 'Home', path: '/' }, { name: 'Automobile', path: '/automobile' }, ...extra];
}

export type BuildAutomobileMetadataInput = {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  entityType?: string;
  entityId?: string;
  searchParams?: AutomobileIndexingInput['searchParams'];
  forceNoIndex?: boolean;
  lastUpdated?: Date | string | null;
};

export async function buildAutomobileMetadata(
  input: BuildAutomobileMetadataInput,
): Promise<Metadata> {
  const indexing = resolveAutomobileIndexing({
    pathname: input.path,
    searchParams: input.searchParams,
    forceNoIndex: input.forceNoIndex,
  });

  const base = await buildSeoMetadata({
    entityType: input.entityType ?? 'automobile_page',
    entityId: input.entityId,
    path: indexing.canonicalPath,
    title: input.title,
    description: input.description,
    image: input.image,
    canonicalUrl: indexing.canonicalUrl,
  });

  const lastUpdated = formatAutomobileLastUpdated(input.lastUpdated);

  return {
    ...base,
    robots: indexing.robots,
    alternates: {
      ...base.alternates,
      canonical: indexing.canonicalPath,
    },
    openGraph: {
      ...base.openGraph,
      url: indexing.canonicalUrl,
      type: 'website',
      ...(lastUpdated ? { modifiedTime: new Date(input.lastUpdated!).toISOString() } : {}),
    },
    other: lastUpdated
      ? ({
          'last-updated': lastUpdated,
        } as unknown as Metadata['other'])
      : base.other,
  };
}

export async function buildAutomobilePageMetadata(
  pageKey: AutomobilePageKey,
  options?: {
    searchParams?: AutomobileIndexingInput['searchParams'];
    titleOverride?: string;
    descriptionOverride?: string | null;
    lastUpdated?: Date | string | null;
    forceNoIndex?: boolean;
  },
): Promise<Metadata> {
  const defaults = AUTOMOBILE_PAGE_DEFAULTS[pageKey];
  return buildAutomobileMetadata({
    title: options?.titleOverride ?? defaults.title,
    description: options?.descriptionOverride ?? defaults.description,
    path: defaults.path,
    entityType: 'automobile_page',
    searchParams: options?.searchParams,
    forceNoIndex: options?.forceNoIndex ?? !defaults.indexable,
    lastUpdated: options?.lastUpdated,
  });
}

/** Assemble safe JSON-LD graph for Automobile pages. */
export function buildAutomobileJsonLdGraph(
  input: Omit<BuildAutomobileJsonLdGraphInput, 'siteUrl'> & { siteUrl?: string },
): Array<Record<string, unknown>> {
  return buildAutomobileJsonLdGraphCore({
    ...input,
    siteUrl: input.siteUrl ?? siteUrl(),
  });
}

export function automobileDefaultPath(pageKey: AutomobilePageKey): string {
  return AUTOMOBILE_PAGE_DEFAULTS[pageKey]?.path ?? '/automobile';
}
