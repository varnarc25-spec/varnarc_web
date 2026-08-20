const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com';

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
    '/calculators/paint',
    '/calculators/solar',
    '/calculators/car-loan',
    '/calculators/retirement',
    '/calculators/fuel',
  ],
  construction: ['/construction', '/construction/faqs', '/construction/guides'],
  automobile: ['/automobile', '/automobile/faqs', '/automobile/guides'],
};

function buildFallbackUrlSet(type: string) {
  const paths = STATIC_FALLBACK_URLS[type] ?? [];
  const now = new Date().toISOString();
  const entries = paths
    .map((p) => `  <url>\n    <loc>${siteUrl}${p}</loc>\n    <lastmod>${now}</lastmod>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const normalized = type.replace(/\.xml$/i, '');
  const headers = { 'Content-Type': 'application/xml; charset=utf-8' };
  try {
    const res = await fetch(`${apiUrl}/seo/sitemap/${normalized}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return new Response(buildFallbackUrlSet(normalized), { headers });
    }
    const xml = await res.text();
    if (!xml || xml.trim().length < 100) {
      return new Response(buildFallbackUrlSet(normalized), { headers });
    }
    return new Response(xml, { headers });
  } catch {
    return new Response(buildFallbackUrlSet(normalized), { headers });
  }
}
