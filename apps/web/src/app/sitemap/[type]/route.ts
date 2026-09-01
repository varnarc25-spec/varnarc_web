import { headers as nextHeaders } from 'next/headers';
import {
  AUTOMOBILE_SITEMAP_CALCULATOR_PATHS,
  AUTOMOBILE_SITEMAP_CORE_PATHS,
  AUTOMOBILE_SITEMAP_SEGMENTS,
  AUTOMOBILE_SITEMAP_STATIC_LASTMOD,
  buildGuideClusterLanding,
  CONSTRUCTION_SITEMAP_CALCULATOR_PATHS,
  CONSTRUCTION_SITEMAP_CORE_PATHS,
  CONSTRUCTION_SITEMAP_EDITORIAL_COMPARISON_SLUGS,
  CONSTRUCTION_SITEMAP_MATERIAL_GUIDE_SLUGS,
  CONSTRUCTION_SITEMAP_SEGMENTS,
  CONSTRUCTION_SITEMAP_STATIC_LASTMOD,
  isAutomobileSitemapSegment,
  isConstructionSitemapSegment,
  listGuideClusters,
  listIndexableConstructionGlossaryTerms,
  listIndexableIntentCalcLandings,
  listPotentialConstructionCostCities,
} from '@varnarc/validation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const PROD_SITE_URL = 'https://varnarc.com';

function resolvePublicUrl(requestHeaders: Headers): string {
  const host = requestHeaders.get('host');
  if (host && !host.includes('localhost')) {
    const proto = requestHeaders.get('x-forwarded-proto') || 'https';
    return `${proto}://${host}`;
  }
  return PROD_SITE_URL;
}

const STATIC_FALLBACK_URLS: Record<string, string[]> = {
  pages: [
    '/',
    '/about',
    '/contact',
    '/editorial-policy',
    '/methodology',
    '/corrections',
    '/disclaimer',
    '/privacy',
    '/terms',
    '/reviews',
    '/articles',
    '/compare',
    '/compare/products',
    '/calculators',
    '/directory',
    '/ai-tools',
    '/solar',
    '/search',
  ],
  finance: [
    '/finance',
    '/finance/loans',
    '/finance/loans/home-loan',
    '/finance/loans/personal-loan',
    '/finance/loans/car-loan',
    '/finance/loans/education-loan',
    '/finance/loans/business-loan',
    '/finance/loans/gold-loan',
    '/finance/loans/two-wheeler-loan',
    '/finance/loans/loan-against-property',
    '/finance/loans/methodology',
    '/finance/credit-cards',
    '/finance/insurance',
    '/finance/investments',
    '/finance/banks',
    '/finance/rates',
    '/finance/faqs',
    '/finance/glossary',
    '/finance/guides',
    '/finance/compare',
    '/finance/eligibility',
    '/finance/credit-score',
  ],
  // Site-wide calculators only — Construction tools live in construction-* sitemaps.
  calculators: [
    '/calculators/emi',
    '/calculators/sip',
    '/calculators/income-tax',
    '/calculators/gst',
    '/calculators/construction-cost',
    '/calculators/solar',
    '/calculators/car-loan',
    '/calculators/retirement',
    '/calculators/fuel',
  ],
  'construction-core': [...CONSTRUCTION_SITEMAP_CORE_PATHS],
  'construction-calculators': [
    ...CONSTRUCTION_SITEMAP_CALCULATOR_PATHS,
    ...listIndexableIntentCalcLandings().map((p) => p.path),
  ],
  'construction-materials': CONSTRUCTION_SITEMAP_MATERIAL_GUIDE_SLUGS.map(
    (s) => `/construction/materials/${s}`,
  ),
  'construction-comparisons': CONSTRUCTION_SITEMAP_EDITORIAL_COMPARISON_SLUGS.map(
    (s) => `/construction/compare/${s}`,
  ),
  'construction-guides': listGuideClusters()
    .map((c) => buildGuideClusterLanding(c.slug))
    .filter((l): l is NonNullable<typeof l> => l != null)
    .map((l) => l.canonicalPath),
  'construction-glossary': listIndexableConstructionGlossaryTerms().map(
    (t) => `/construction/glossary/${t.slug}`,
  ),
  'construction-prices': [
    '/construction/prices',
    '/construction/construction-cost',
    '/construction/cost-index',
    ...listPotentialConstructionCostCities().map((c) => c.path),
  ],
  // Nested automobile segments — static hubs always available even if API is down / undeployed.
  'automobile-core': [...AUTOMOBILE_SITEMAP_CORE_PATHS],
  'automobile-calculators': [...AUTOMOBILE_SITEMAP_CALCULATOR_PATHS],
  'automobile-vehicles': ['/automobile/vehicles'],
  'automobile-manufacturers': ['/automobile/manufacturers'],
  'automobile-comparisons': ['/automobile/comparisons'],
  'automobile-guides': ['/automobile/guides'],
  // Legacy flat automobile key (pre-nested). Prefer nested index once API is updated.
  automobile: [...AUTOMOBILE_SITEMAP_CORE_PATHS, ...AUTOMOBILE_SITEMAP_CALCULATOR_PATHS],
};

function countXmlTags(xml: string, tag: 'url' | 'sitemap'): number {
  const re = tag === 'url' ? /<url\b/gi : /<sitemap\b/gi;
  return (xml.match(re) ?? []).length;
}

function isEmptyUrlSet(xml: string): boolean {
  return xml.includes('<urlset') && countXmlTags(xml, 'url') === 0;
}

function isEmptySitemapIndex(xml: string): boolean {
  return xml.includes('<sitemapindex') && countXmlTags(xml, 'sitemap') === 0;
}

function buildFallbackUrlSet(type: string, publicUrl: string) {
  const paths = STATIC_FALLBACK_URLS[type] ?? [];
  const lastmod = type.startsWith('automobile')
    ? AUTOMOBILE_SITEMAP_STATIC_LASTMOD.toISOString()
    : CONSTRUCTION_SITEMAP_STATIC_LASTMOD.toISOString();
  const entries = paths
    .map(
      (p) =>
        `  <url>\n    <loc>${publicUrl}${p}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

function buildConstructionNestedIndexFallback(publicUrl: string) {
  const lastmod = CONSTRUCTION_SITEMAP_STATIC_LASTMOD.toISOString();
  const entries = CONSTRUCTION_SITEMAP_SEGMENTS.map(
    (segment) =>
      `  <sitemap>\n    <loc>${publicUrl}/sitemap/${segment}.xml</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`,
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>`;
}

function buildAutomobileNestedIndexFallback(publicUrl: string) {
  const lastmod = AUTOMOBILE_SITEMAP_STATIC_LASTMOD.toISOString();
  const entries = AUTOMOBILE_SITEMAP_SEGMENTS.map(
    (segment) =>
      `  <sitemap>\n    <loc>${publicUrl}/sitemap/${segment}.xml</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`,
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>`;
}

function ensureProductionUrls(xml: string, publicUrl: string) {
  return xml.replace(/https?:\/\/localhost:\d+/g, publicUrl);
}

function shouldUseFallback(normalized: string, xml: string): boolean {
  if (!xml || xml.trim().length < 40) return true;
  if (isEmptyUrlSet(xml) || isEmptySitemapIndex(xml)) return true;

  if (normalized === 'construction' && !xml.includes('<sitemapindex')) return true;
  if (normalized === 'automobile' && !xml.includes('<sitemapindex')) return true;
  if (isConstructionSitemapSegment(normalized) && !xml.includes('<urlset')) return true;
  if (isAutomobileSitemapSegment(normalized) && !xml.includes('<urlset')) return true;

  return false;
}

export async function GET(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const normalized = type.replace(/\.xml$/i, '');
  const reqHeaders = await nextHeaders();
  const publicUrl = resolvePublicUrl(reqHeaders);
  const respHeaders = {
    'Content-Type': 'application/xml; charset=utf-8',
    // Avoid long-lived CDN/browser cache of empty/broken sitemaps during rollouts.
    'Cache-Control': 'public, max-age=60, s-maxage=300',
  };

  const fallback = () => {
    if (normalized === 'construction') {
      return buildConstructionNestedIndexFallback(publicUrl);
    }
    if (normalized === 'automobile') {
      return buildAutomobileNestedIndexFallback(publicUrl);
    }
    return buildFallbackUrlSet(normalized, publicUrl);
  };

  try {
    const res = await fetch(`${apiUrl}/seo/sitemap/${normalized}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      return new Response(fallback(), { headers: respHeaders });
    }
    const xml = await res.text();
    if (shouldUseFallback(normalized, xml)) {
      return new Response(fallback(), { headers: respHeaders });
    }
    return new Response(ensureProductionUrls(xml, publicUrl), { headers: respHeaders });
  } catch {
    return new Response(fallback(), { headers: respHeaders });
  }
}
