import type { Metadata } from 'next';
import {
  buildConstructionJsonLdGraph as buildConstructionJsonLdGraphCore,
  type BuildConstructionJsonLdGraphInput,
} from '@varnarc/validation';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { CONSTRUCTION_PAGE_DEFAULTS, type ConstructionPageKey } from '@/lib/construction/seo-pages';
import { constructionPath } from '@/lib/construction/routes';
import { getPublicSiteUrlSync } from '@/lib/public-site-url';

const siteUrl = () => getPublicSiteUrlSync();

/** Listing/filter query keys that must not create indexable duplicates. */
export const CONSTRUCTION_FILTER_QUERY_KEYS = [
  'category',
  'categoryId',
  'brand',
  'brandId',
  'sort',
  'order',
  'page',
  'cursor',
  'q',
  'search',
  'featured',
  'sponsored',
  'city',
  'state',
  'region',
  'quality',
  'minPrice',
  'maxPrice',
  'ids',
  'compare',
  'tab',
  'view',
  'hint',
  'intent',
  'material',
  'location',
] as const;

/**
 * Calculator share/state params — allowed for UX sharing, but canonical stays clean.
 * Presence → noindex the parameterized URL.
 */
export const CONSTRUCTION_CALC_SHARE_QUERY_KEYS = [
  'amount',
  'rate',
  'tenure',
  'tenureUnit',
  'volume',
  'length',
  'width',
  'height',
  'depth',
  'area',
  'areaSqft',
  'builtUpArea',
  'areaUnit',
  'floors',
  'location',
  'propertyType',
  'foundationType',
  'structureType',
  'interiorLevel',
  'contingency',
  'contingencyPercent',
  'customRate',
  'renovationArea',
  'propertyAgeYears',
  'age',
  'work',
  'projectCost',
  'estimatedCost',
  'savings',
  'loan',
  'income',
  'emi',
  'duration',
  'months',
  'source',
  'targetReduction',
  'target',
  's',
  'scenarios',
  'qty',
  'quantity',
  'wastage',
  'wastagePercent',
  'price',
  'unitPrice',
  'bags',
  'mix',
  'mixPreset',
  'useCase',
  'mode',
  'shape',
  'coverage',
  'thickness',
  'density',
  'inputs',
] as const;

export type ConstructionCrumbInput = { name: string; path: string };

export type ConstructionIndexingInput = {
  /** Pathname only, e.g. `/construction/materials` or `/construction/cement-calculator`. */
  pathname: string;
  /** Current query string or search params. */
  searchParams?: URLSearchParams | Record<string, string | string[] | undefined | null>;
  /** Force noindex (auth pages, empty thin pages). */
  forceNoIndex?: boolean;
};

export type ConstructionIndexingResult = {
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

export function isConstructionCalculatorPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/';
  if (p.startsWith('/calculators/')) return true;
  if (
    p === '/construction/estimate' ||
    p === '/construction/cost-calculator' ||
    p === '/construction/renovation-cost-calculator' ||
    p === '/construction/affordability-calculator' ||
    p === '/construction/scenario-compare' ||
    p === '/construction/cost-change-simulator' ||
    p === '/construction/cost-optimization' ||
    p === '/construction/cement-calculator' ||
    p === '/construction/concrete-calculator' ||
    p === '/construction/brick-calculator' ||
    p === '/construction/aac-block-calculator' ||
    p === '/construction/steel-calculator' ||
    p === '/construction/bar-bending-schedule' ||
    p === '/construction/boq-generator' ||
    p === '/construction/timeline-planner' ||
    p === '/construction/budget-tracker' ||
    p === '/construction/document-vault' ||
    p === '/construction/material-selector' ||
    p === '/construction/fair-price-checker' ||
    p === '/construction/contractor-quote-analyzer' ||
    p === '/construction/sand-calculator' ||
    p === '/construction/aggregate-calculator' ||
    p === '/construction/plaster-calculator' ||
    p === '/construction/paint-calculator' ||
    p === '/construction/tile-calculator' ||
    p === '/construction/flooring-calculator' ||
    p === '/construction/rcc-calculator' ||
    p === '/construction/slab-calculator' ||
    p === '/construction/beam-calculator' ||
    p === '/construction/column-calculator' ||
    p === '/construction/footing-calculator' ||
    p === '/construction/planner'
  ) {
    return true;
  }
  return /^\/construction\/calculators\//.test(p);
}

export function isConstructionPrivatePath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/';
  return p === '/construction/projects' || p.startsWith('/construction/project/');
}

/**
 * Strip filter + share params and return the canonical clean path for Construction URLs.
 * Filter hubs (`?material=` / `?location=` on prices, `?ids=` on compare) canonicalize to the hub path.
 * SEO landings at `/construction/compare/{slug}` and `/construction/prices/{material}/{city}` keep their path.
 */
export function constructionCanonicalPath(pathname: string): string {
  const p = pathname.startsWith('/') ? pathname.replace(/\/$/, '') || '/' : `/${pathname}`;
  if (p === '/construction/compare') return '/construction/compare';
  if (p === '/construction/prices') return '/construction/prices';
  // Nested compare/prices landings keep their own canonical path
  return p;
}

/**
 * Calculator share URLs keep UX state in the query string, but SEO canonical is always
 * the clean tool path (no calculation parameters).
 */
export function constructionCalculatorCanonicalPath(pathname: string): string {
  return constructionCanonicalPath(pathname);
}

export function resolveConstructionIndexing(
  input: ConstructionIndexingInput,
): ConstructionIndexingResult {
  const pathname = input.pathname.startsWith('/') ? input.pathname : `/${input.pathname}`;
  const sp = toSearchParams(input.searchParams);
  const canonicalPath = isConstructionCalculatorPath(pathname)
    ? constructionCalculatorCanonicalPath(pathname)
    : constructionCanonicalPath(pathname);
  const canonicalUrl = `${siteUrl()}${canonicalPath}`;

  if (input.forceNoIndex || isConstructionPrivatePath(pathname)) {
    return {
      canonicalPath,
      canonicalUrl,
      index: false,
      follow: false,
      robots: { index: false, follow: false },
      reason: 'private_or_forced',
    };
  }

  const isCalc = isConstructionCalculatorPath(pathname);

  if (isCalc && hasAnyKey(sp, CONSTRUCTION_CALC_SHARE_QUERY_KEYS)) {
    return {
      canonicalPath,
      canonicalUrl,
      index: false,
      follow: true,
      robots: { index: false, follow: true },
      reason: 'calculator_share_params',
    };
  }

  if (hasAnyKey(sp, CONSTRUCTION_FILTER_QUERY_KEYS)) {
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

export function formatConstructionLastUpdated(
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

export function constructionAbsoluteUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl()}${p}`;
}

export function buildConstructionBreadcrumbs(
  crumbs: ConstructionCrumbInput[],
): Array<{ name: string; url: string }> {
  return crumbs.map((c) => ({
    name: c.name,
    url: constructionAbsoluteUrl(c.path),
  }));
}

export function constructionHubBreadcrumbs(
  extra: ConstructionCrumbInput[] = [],
): ConstructionCrumbInput[] {
  return [{ name: 'Home', path: '/' }, { name: 'Construction', path: '/construction' }, ...extra];
}

export type BuildConstructionMetadataInput = {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  entityType?: string;
  entityId?: string;
  searchParams?: ConstructionIndexingInput['searchParams'];
  forceNoIndex?: boolean;
  lastUpdated?: Date | string | null;
};

export async function buildConstructionMetadata(
  input: BuildConstructionMetadataInput,
): Promise<Metadata> {
  const indexing = resolveConstructionIndexing({
    pathname: input.path,
    searchParams: input.searchParams,
    forceNoIndex: input.forceNoIndex,
  });

  const base = await buildSeoMetadata({
    entityType: input.entityType ?? 'construction_page',
    entityId: input.entityId,
    path: indexing.canonicalPath,
    title: input.title,
    description: input.description,
    image: input.image,
    canonicalUrl: indexing.canonicalUrl,
  });

  const lastUpdated = formatConstructionLastUpdated(input.lastUpdated);

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

export async function buildConstructionPageMetadata(
  pageKey: ConstructionPageKey,
  options?: {
    searchParams?: ConstructionIndexingInput['searchParams'];
    titleOverride?: string;
    descriptionOverride?: string | null;
    lastUpdated?: Date | string | null;
  },
): Promise<Metadata> {
  const defaults = CONSTRUCTION_PAGE_DEFAULTS[pageKey];
  return buildConstructionMetadata({
    title: options?.titleOverride ?? defaults.title,
    description: options?.descriptionOverride ?? defaults.description,
    path: defaults.path,
    entityType: 'construction_page',
    searchParams: options?.searchParams,
    forceNoIndex: !defaults.indexable,
    lastUpdated: options?.lastUpdated,
  });
}

/** Assemble safe JSON-LD graph for Construction pages — omit empty/misleading nodes. */
export function buildConstructionJsonLdGraph(
  input: Omit<BuildConstructionJsonLdGraphInput, 'siteUrl'> & { siteUrl?: string },
): Array<Record<string, unknown>> {
  return buildConstructionJsonLdGraphCore({
    ...input,
    siteUrl: input.siteUrl ?? siteUrl(),
  });
}

export function constructionDefaultPath(pageKey: ConstructionPageKey): string {
  return CONSTRUCTION_PAGE_DEFAULTS[pageKey]?.path ?? constructionPath();
}
