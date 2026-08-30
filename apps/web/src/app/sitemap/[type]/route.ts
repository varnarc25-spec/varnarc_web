import { headers as nextHeaders } from 'next/headers';
import {
  CONSTRUCTION_SITEMAP_CALCULATOR_PATHS,
  CONSTRUCTION_SITEMAP_CORE_PATHS,
  CONSTRUCTION_SITEMAP_EDITORIAL_COMPARISON_SLUGS,
  CONSTRUCTION_SITEMAP_MATERIAL_GUIDE_SLUGS,
  CONSTRUCTION_SITEMAP_SEGMENTS,
  CONSTRUCTION_SITEMAP_STATIC_LASTMOD,
  isConstructionSitemapSegment,
  listIndexableIntentCalcLandings,
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
  calculators: [
    '/calculators/emi',
    '/calculators/sip',
    '/calculators/income-tax',
    '/calculators/gst',
    '/calculators/construction-cost',
    '/construction/paint-calculator',
    '/construction/tile-calculator',
    '/construction/flooring-calculator',
    '/construction/rcc-calculator',
    '/construction/slab-calculator',
    '/construction/beam-calculator',
    '/construction/column-calculator',
    '/construction/footing-calculator',
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
  automobile: ['/automobile', '/automobile/faqs', '/automobile/guides'],
};

function buildFallbackUrlSet(type: string, publicUrl: string) {
  const paths = STATIC_FALLBACK_URLS[type] ?? [];
  const lastmod = CONSTRUCTION_SITEMAP_STATIC_LASTMOD.toISOString();
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

function ensureProductionUrls(xml: string, publicUrl: string) {
  return xml.replace(/https?:\/\/localhost:\d+/g, publicUrl);
}

export async function GET(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const normalized = type.replace(/\.xml$/i, '');
  const reqHeaders = await nextHeaders();
  const publicUrl = resolvePublicUrl(reqHeaders);
  const respHeaders = { 'Content-Type': 'application/xml; charset=utf-8' };

  const fallback = () => {
    if (normalized === 'construction') {
      return buildConstructionNestedIndexFallback(publicUrl);
    }
    return buildFallbackUrlSet(normalized, publicUrl);
  };

  try {
    const res = await fetch(`${apiUrl}/seo/sitemap/${normalized}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      return new Response(fallback(), { headers: respHeaders });
    }
    const xml = await res.text();
    if (!xml || xml.trim().length < 80) {
      return new Response(fallback(), { headers: respHeaders });
    }
    // Reject unexpected shape for nested construction index
    if (normalized === 'construction' && !xml.includes('<sitemapindex')) {
      return new Response(fallback(), { headers: respHeaders });
    }
    if (isConstructionSitemapSegment(normalized) && !xml.includes('<urlset')) {
      return new Response(fallback(), { headers: respHeaders });
    }
    return new Response(ensureProductionUrls(xml, publicUrl), { headers: respHeaders });
  } catch {
    return new Response(fallback(), { headers: respHeaders });
  }
}
