/**
 * Construction sitemap architecture — segment catalog, static paths, and
 * eligibility helpers shared by API sitemap builders and SEO audit.
 *
 * Rules:
 * - Canonical paths only (no query strings)
 * - One URL per segment (no cross-segment duplicates)
 * - Exclude private / user-specific / admin / thin location pages
 */

/** Child sitemap types under `/sitemap/construction.xml` (nested index). */
export const CONSTRUCTION_SITEMAP_SEGMENTS = [
  'construction-core',
  'construction-calculators',
  'construction-materials',
  'construction-comparisons',
  'construction-guides',
  'construction-glossary',
  'construction-prices',
] as const;

export type ConstructionSitemapSegment = (typeof CONSTRUCTION_SITEMAP_SEGMENTS)[number];

/**
 * Bump when static construction hub/calculator paths change so `<lastmod>`
 * stays meaningful without using request wall-clock time.
 */
export const CONSTRUCTION_SITEMAP_CONTENT_VERSION = '2026.08.21';

/** Reliable lastmod for curated static construction URLs. */
export const CONSTRUCTION_SITEMAP_STATIC_LASTMOD = new Date('2026-08-21T00:00:00.000Z');

/** Soft cap per child sitemap before splitting further (Google limit is 50k). */
export const CONSTRUCTION_SITEMAP_MAX_URLS_PER_FILE = 45_000;

/** Path prefixes that must never appear in construction sitemaps. */
export const CONSTRUCTION_SITEMAP_EXCLUDED_PREFIXES = [
  '/construction/projects',
  '/construction/project/',
  '/construction/saved-calculations',
  '/construction/price-alerts',
  '/admin',
] as const;

/**
 * Core hubs and cross-cutting landings (not calculators, not deep entity URLs).
 * Detail URLs live in their dedicated segments.
 */
export const CONSTRUCTION_SITEMAP_CORE_PATHS = [
  '/construction',
  '/construction/faqs',
  '/construction/materials',
  '/construction/brands',
  '/construction/compare',
  '/construction/guides',
  '/construction/checklists',
  '/construction/prices',
  '/construction/construction-cost',
  '/construction/calc',
  '/construction/glossary',
  '/construction/topics',
  '/construction/suppliers',
  '/construction/professionals',
  '/construction/fair-price-checker',
  '/construction/price-position',
  '/construction/news-impact',
  '/construction/community-prices',
  '/construction/contractor-quote-analyzer',
  '/construction/project-readiness',
  '/construction/material-selector',
  '/construction/planner',
  '/construction/cost-index',
  '/construction/cost-index/methodology',
] as const;

/** Public calculator / planner tool landings (clean paths only). */
export const CONSTRUCTION_SITEMAP_CALCULATOR_PATHS = [
  '/construction/estimate',
  '/construction/cost-calculator',
  '/construction/renovation-cost-calculator',
  '/construction/affordability-calculator',
  '/construction/scenario-compare',
  '/construction/cost-change-simulator',
  '/construction/cost-optimization',
  '/construction/cement-calculator',
  '/construction/concrete-calculator',
  '/construction/brick-calculator',
  '/construction/aac-block-calculator',
  '/construction/steel-calculator',
  '/construction/bar-bending-schedule',
  '/construction/boq-generator',
  '/construction/timeline-planner',
  '/construction/budget-tracker',
  '/construction/document-vault',
  '/construction/sand-calculator',
  '/construction/aggregate-calculator',
  '/construction/plaster-calculator',
  '/construction/paint-calculator',
  '/construction/tile-calculator',
  '/construction/flooring-calculator',
  '/construction/rcc-calculator',
  '/construction/slab-calculator',
  '/construction/beam-calculator',
  '/construction/column-calculator',
  '/construction/footing-calculator',
] as const;

/**
 * Editorial material guide slugs under `/construction/materials/{slug}`.
 * Keep aligned with apps/web materials-hub catalog.
 */
export const CONSTRUCTION_SITEMAP_MATERIAL_GUIDE_SLUGS = [
  'cement',
  'concrete',
  'steel',
  'aggregate',
  'sand',
  'brick',
  'aac-blocks',
  'plaster',
  'paint',
  'tiles',
  'flooring',
  'waterproofing',
  'electrical-wiring',
  'switches-sockets',
  'conduits',
  'pvc-pipes',
  'cpvc-pipes',
  'plumbing-fittings',
] as const;

/**
 * Editorial comparison slugs under `/construction/compare/{slug}`.
 * Keep aligned with apps/web compare-hub catalog.
 */
export const CONSTRUCTION_SITEMAP_EDITORIAL_COMPARISON_SLUGS = [
  'aac-vs-brick',
  'opc-vs-ppc',
  'm-sand-vs-river-sand',
  'vitrified-vs-ceramic-tiles',
  'upvc-vs-aluminium-windows',
  'gypsum-vs-cement-plaster',
] as const;

export function isConstructionSitemapSegment(value: string): value is ConstructionSitemapSegment {
  return (CONSTRUCTION_SITEMAP_SEGMENTS as readonly string[]).includes(value);
}

export function normalizeConstructionSitemapPath(path: string): string {
  const bare = path.split('?')[0]?.split('#')[0] ?? path;
  if (!bare.startsWith('/')) return `/${bare}`.replace(/\/+$/, '') || '/';
  return bare.replace(/\/+$/, '') || '/';
}

/** True when a path must be omitted from every construction sitemap. */
export function isConstructionSitemapExcludedPath(path: string): boolean {
  // Query/hash variants are never canonical sitemap entries.
  if (/[?#]/.test(path)) return true;
  const p = normalizeConstructionSitemapPath(path);
  for (const prefix of CONSTRUCTION_SITEMAP_EXCLUDED_PREFIXES) {
    if (prefix.endsWith('/')) {
      if (p === prefix.slice(0, -1) || p.startsWith(prefix)) return true;
    } else if (p === prefix || p.startsWith(`${prefix}/`)) {
      return true;
    }
  }
  return false;
}

export function filterConstructionSitemapPaths(paths: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of paths) {
    const p = normalizeConstructionSitemapPath(raw);
    if (!p.startsWith('/construction')) continue;
    if (isConstructionSitemapExcludedPath(p)) continue;
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}

export function listConstructionSitemapStaticPaths(segment: ConstructionSitemapSegment): string[] {
  switch (segment) {
    case 'construction-core':
      return filterConstructionSitemapPaths(CONSTRUCTION_SITEMAP_CORE_PATHS);
    case 'construction-calculators':
      return filterConstructionSitemapPaths(CONSTRUCTION_SITEMAP_CALCULATOR_PATHS);
    case 'construction-materials':
      return filterConstructionSitemapPaths(
        CONSTRUCTION_SITEMAP_MATERIAL_GUIDE_SLUGS.map((s) => `/construction/materials/${s}`),
      );
    case 'construction-comparisons':
      return filterConstructionSitemapPaths(
        CONSTRUCTION_SITEMAP_EDITORIAL_COMPARISON_SLUGS.map((s) => `/construction/compare/${s}`),
      );
    case 'construction-guides':
    case 'construction-glossary':
    case 'construction-prices':
      return [];
    default:
      return [];
  }
}

export function constructionSitemapChildLoc(siteUrl: string, segment: ConstructionSitemapSegment) {
  const base = siteUrl.replace(/\/+$/, '');
  return `${base}/sitemap/${segment}.xml`;
}
