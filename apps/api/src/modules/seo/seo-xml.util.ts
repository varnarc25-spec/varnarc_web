/** XML helpers for SEO sitemaps and robots.txt */

import { CONSTRUCTION_SITEMAP_SEGMENTS, isConstructionSitemapSegment } from '@varnarc/validation';

export const SITEMAP_TYPES = [
  'articles',
  'pages',
  'reviews',
  'calculators',
  'ai-tools',
  'directory',
  'comparisons',
  'finance',
  'construction',
  'automobile',
  'images',
] as const;

export type SitemapType = (typeof SITEMAP_TYPES)[number];

/** Root + construction child segments accepted by `/seo/sitemap/:type`. */
export const ALL_SITEMAP_ROUTE_TYPES = [
  ...SITEMAP_TYPES,
  ...CONSTRUCTION_SITEMAP_SEGMENTS,
] as const;

export type SitemapRouteType = (typeof ALL_SITEMAP_ROUTE_TYPES)[number];

export function isKnownSitemapRouteType(type: string): boolean {
  return (SITEMAP_TYPES as readonly string[]).includes(type) || isConstructionSitemapSegment(type);
}

export function buildSitemapIndexXml(
  siteUrl: string,
  types: readonly string[] = SITEMAP_TYPES,
  lastmodByType?: Record<string, Date | string>,
) {
  const fallbackNow = new Date().toISOString();
  const entries = types
    .map((type) => {
      const lm = lastmodByType?.[type];
      const lastmod =
        lm instanceof Date ? lm.toISOString() : typeof lm === 'string' ? lm : fallbackNow;
      return `  <sitemap>\n    <loc>${escapeXml(`${siteUrl}/sitemap/${type}.xml`)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>`;
}

/** Nested construction sitemap index pointing at segment urlsets. */
export function buildConstructionSitemapIndexXml(
  siteUrl: string,
  children: Array<{ loc: string; lastmod?: Date }> = CONSTRUCTION_SITEMAP_SEGMENTS.map(
    (segment) => ({
      loc: `${siteUrl.replace(/\/+$/, '')}/sitemap/${segment}.xml`,
    }),
  ),
) {
  const fallback = new Date().toISOString();
  const entries = children
    .map((c) => {
      const lastmod = c.lastmod ? c.lastmod.toISOString() : fallback;
      return `  <sitemap>\n    <loc>${escapeXml(c.loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>`;
}

export function buildUrlSetXml(
  urls: Array<{ loc: string; lastmod?: Date; changefreq?: string; priority?: number }>,
) {
  const body = urls
    .map((u) => {
      const parts = [`    <loc>${escapeXml(u.loc)}</loc>`];
      if (u.lastmod) parts.push(`    <lastmod>${u.lastmod.toISOString()}</lastmod>`);
      if (u.changefreq) parts.push(`    <changefreq>${u.changefreq}</changefreq>`);
      if (u.priority != null) parts.push(`    <priority>${u.priority}</priority>`);
      return `  <url>\n${parts.join('\n')}\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

export function buildRobotsTxt(input: {
  siteUrl: string;
  disallow?: string[];
  allow?: string[];
  crawlDelay?: number | null;
  sitemapTypes?: readonly string[];
}) {
  const lines = ['User-agent: *'];
  for (const path of input.allow ?? ['/']) {
    lines.push(`Allow: ${path}`);
  }
  for (const path of input.disallow ?? []) {
    lines.push(`Disallow: ${path}`);
  }
  if (input.crawlDelay != null && input.crawlDelay > 0) {
    lines.push(`Crawl-delay: ${input.crawlDelay}`);
  }
  lines.push(`Sitemap: ${input.siteUrl}/sitemap.xml`);
  for (const type of input.sitemapTypes ?? SITEMAP_TYPES) {
    lines.push(`Sitemap: ${input.siteUrl}/sitemap/${type}.xml`);
  }
  return `${lines.join('\n')}\n`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function normalizePath(path: string) {
  if (!path.startsWith('/')) return `/${path}`;
  return path.replace(/\/+$/, '') || '/';
}
