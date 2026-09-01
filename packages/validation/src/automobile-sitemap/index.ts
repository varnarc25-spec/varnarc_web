/**
 * Automobile sitemap architecture — segments, static paths, exclusions.
 */

import { listAutomobileCategories } from '../automobile-categories';

export const AUTOMOBILE_SITEMAP_SEGMENTS = [
  'automobile-core',
  'automobile-vehicles',
  'automobile-manufacturers',
  'automobile-comparisons',
  'automobile-calculators',
  'automobile-guides',
] as const;

export type AutomobileSitemapSegment = (typeof AUTOMOBILE_SITEMAP_SEGMENTS)[number];

export const AUTOMOBILE_SITEMAP_CONTENT_VERSION = '2026.09.01';
export const AUTOMOBILE_SITEMAP_STATIC_LASTMOD = new Date('2026-09-01T00:00:00.000Z');
export const AUTOMOBILE_SITEMAP_MAX_URLS_PER_FILE = 45_000;

export const AUTOMOBILE_SITEMAP_EXCLUDED_PREFIXES = ['/admin'] as const;

export const AUTOMOBILE_SITEMAP_CORE_PATHS = [
  '/automobile',
  '/automobile/vehicles',
  '/automobile/manufacturers',
  '/automobile/compare',
  '/automobile/comparisons',
  '/automobile/guides',
  '/automobile/faqs',
  '/automobile/maintenance',
  '/automobile/dealers',
  '/automobile/reviews',
  '/automobile/calculators',
  ...listAutomobileCategories().map((c) => c.path),
] as const;

/** Ownership calculator landings under /automobile/calculators/{slug}. */
export const AUTOMOBILE_SITEMAP_CALCULATOR_PATHS = [
  '/automobile/calculators/car-loan',
  '/automobile/calculators/fuel',
  '/automobile/calculators/mileage',
  '/automobile/calculators/car-insurance',
  '/automobile/calculators/depreciation',
  '/automobile/calculators/maintenance-cost',
] as const;

export function isAutomobileSitemapSegment(value: string): value is AutomobileSitemapSegment {
  return (AUTOMOBILE_SITEMAP_SEGMENTS as readonly string[]).includes(value);
}

export function normalizeAutomobileSitemapPath(path: string): string {
  const bare = path.split('?')[0]?.split('#')[0] ?? path;
  if (!bare.startsWith('/')) return `/${bare}`.replace(/\/+$/, '') || '/';
  return bare.replace(/\/+$/, '') || '/';
}

export function isAutomobileSitemapExcludedPath(path: string): boolean {
  if (/[?#]/.test(path)) return true;
  // Interactive compare with ?ids= is never a sitemap URL (canonical compare hub only).
  const p = normalizeAutomobileSitemapPath(path);
  for (const prefix of AUTOMOBILE_SITEMAP_EXCLUDED_PREFIXES) {
    if (p === prefix || p.startsWith(`${prefix}/`)) return true;
  }
  return false;
}

export function filterAutomobileSitemapPaths(paths: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of paths) {
    const p = normalizeAutomobileSitemapPath(raw);
    if (!p.startsWith('/automobile')) continue;
    if (isAutomobileSitemapExcludedPath(p)) continue;
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}

export function listAutomobileSitemapStaticPaths(segment: AutomobileSitemapSegment): string[] {
  switch (segment) {
    case 'automobile-core':
      return filterAutomobileSitemapPaths(AUTOMOBILE_SITEMAP_CORE_PATHS);
    case 'automobile-calculators':
      return filterAutomobileSitemapPaths(AUTOMOBILE_SITEMAP_CALCULATOR_PATHS);
    default:
      return [];
  }
}

export function automobileSitemapChildLoc(siteUrl: string, segment: AutomobileSitemapSegment) {
  const base = siteUrl.replace(/\/+$/, '');
  return `${base}/sitemap/${segment}.xml`;
}
