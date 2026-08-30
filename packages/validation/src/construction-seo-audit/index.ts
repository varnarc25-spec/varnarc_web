/**
 * Construction SEO Audit — issue taxonomy, recommended actions, HTML parsers.
 * Pure helpers; no network I/O. Scanner orchestration lives in the API.
 */

import { z } from 'zod';

export const CONSTRUCTION_SEO_ISSUE_TYPES = [
  'missing_title',
  'duplicate_title',
  'missing_meta_description',
  'duplicate_h1',
  'multiple_h1',
  'missing_h1',
  'missing_canonical',
  'noindex_mistake',
  'broken_internal_link',
  'orphan_page',
  'missing_breadcrumb',
  'invalid_structured_data',
  'missing_alt_text',
  'thin_content',
  'missing_last_updated',
  'stale_price_data',
  'redirect_chain',
  'sitemap_missing',
  'sitemap_unexpected',
  'http_status',
  'performance_lcp',
  'performance_cls',
  'performance_inp',
] as const;

export type ConstructionSeoIssueType = (typeof CONSTRUCTION_SEO_ISSUE_TYPES)[number];

export const CONSTRUCTION_SEO_PAGE_TYPES = [
  'hub',
  'calculator',
  'material',
  'brand',
  'guide',
  'checklist',
  'price',
  'faq',
  'glossary',
  'other',
] as const;

export type ConstructionSeoPageType = (typeof CONSTRUCTION_SEO_PAGE_TYPES)[number];

export const constructionSeoAuditModeSchema = z.enum(['FAST', 'FULL']);
export type ConstructionSeoAuditMode = z.infer<typeof constructionSeoAuditModeSchema>;

export const createConstructionSeoAuditRunSchema = z.object({
  mode: constructionSeoAuditModeSchema.default('FULL'),
  siteUrl: z.string().url().optional(),
});

export const constructionSeoAuditRunListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  cursor: z.string().uuid().optional(),
  status: z.string().optional(),
});

export const constructionSeoAuditIssueListQuerySchema = z.object({
  runId: z.string().uuid().optional(),
  pageType: z.string().optional(),
  issueType: z.string().optional(),
  status: z.enum(['OPEN', 'RESOLVED', 'IGNORED', 'all']).optional().default('OPEN'),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL', 'all']).optional().default('all'),
  path: z.string().max(500).optional(),
  scannedAfter: z.string().datetime().optional(),
  scannedBefore: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
  cursor: z.string().uuid().optional(),
});

export const resolveConstructionSeoAuditIssueSchema = z.object({
  status: z.enum(['RESOLVED', 'IGNORED']).default('RESOLVED'),
});

/** Recommended actions — never auto-rewrite SEO content. */
export const CONSTRUCTION_SEO_RECOMMENDED_ACTIONS: Record<ConstructionSeoIssueType, string> = {
  missing_title:
    'Add a unique meta title (≈50–60 chars) in the page SEO defaults or CMS fields. Do not auto-generate live.',
  duplicate_title:
    'Differentiate titles so each URL is unique; review conflicting pages manually before publishing.',
  missing_meta_description:
    'Write a unique meta description (≈140–160 chars) describing the page intent. Do not auto-rewrite.',
  duplicate_h1: 'Ensure each indexable page has a distinct primary H1 aligned to its intent.',
  multiple_h1: 'Keep a single primary H1; demote extra headings to H2+ in the page template.',
  missing_h1: 'Add one clear H1 that matches the page purpose and title theme.',
  missing_canonical:
    'Emit a self-referencing canonical (or the preferred URL) via construction SEO helpers.',
  noindex_mistake:
    'Align robots/noindex with resolveConstructionIndexing rules — filtered/share URLs should not be indexed.',
  broken_internal_link:
    'Fix or remove the broken href; prefer path-based construction internal links.',
  orphan_page:
    'Link the page from a hub, related tools, or sitemap-eligible parent if it should be discoverable.',
  missing_breadcrumb:
    'Add BreadcrumbList JSON-LD and visible breadcrumb nav for construction pages.',
  invalid_structured_data:
    'Validate JSON-LD (FAQPage, HowTo, BreadcrumbList, WebPage, Article, WebApplication, ItemList) and fix parse/schema errors manually. Do not add Product or AggregateRating for educational construction pages.',
  missing_alt_text:
    'Add descriptive alt text for meaningful images; mark decorative images appropriately.',
  thin_content:
    'Expand unique explanatory content (methodology, FAQs, worked examples) — do not thin-pad with boilerplate.',
  missing_last_updated:
    'Surface a last-updated / methodology version date on price and guide pages.',
  stale_price_data:
    'Refresh verified price observations or mark freshness STALE and de-index thin landings if needed.',
  redirect_chain:
    'Collapse multi-hop redirects to a single hop to the final URL; update internal links.',
  sitemap_missing:
    'Include the indexable URL in the matching construction sitemap segment (core, calculators, materials, comparisons, guides, glossary, or prices), or confirm it should stay noindex.',
  sitemap_unexpected:
    'Remove non-indexable or soft-404 URLs from the construction sitemap segments.',
  http_status:
    'Investigate the HTTP status (4xx/5xx); restore content or fix redirects/canonical targets.',
  performance_lcp:
    'Improve LCP (hero image priority, font loading, server TTFB) for this construction URL.',
  performance_cls:
    'Reduce CLS (reserve image/ad space, avoid late-injected layout shifts) on this URL.',
  performance_inp:
    'Improve INP (defer heavy JS, optimize event handlers) on interactive construction tools.',
};

export type ConstructionSeoDraftIssue = {
  path: string;
  pageType: ConstructionSeoPageType;
  issueType: ConstructionSeoIssueType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  recommendedAction?: string;
  evidence?: Record<string, unknown>;
  httpStatus?: number | null;
  lcp?: number | null;
  cls?: number | null;
  inp?: number | null;
};

export function withRecommendedAction(
  issue: ConstructionSeoDraftIssue,
): ConstructionSeoDraftIssue & { recommendedAction: string } {
  return {
    ...issue,
    recommendedAction:
      issue.recommendedAction ?? CONSTRUCTION_SEO_RECOMMENDED_ACTIONS[issue.issueType],
  };
}

export type ConstructionSeoInventoryItem = {
  path: string;
  pageType: ConstructionSeoPageType;
  title?: string | null;
  description?: string | null;
  h1?: string | null;
  indexable: boolean;
  lastUpdated?: string | null;
  entityType?: string | null;
  entityId?: string | null;
};

/** Core static hubs/calculators scanned even before DB merge. */
export const CONSTRUCTION_SEO_STATIC_INVENTORY: ConstructionSeoInventoryItem[] = [
  { path: '/construction', pageType: 'hub', indexable: true },
  { path: '/construction/materials', pageType: 'hub', indexable: true },
  { path: '/construction/brands', pageType: 'hub', indexable: true },
  { path: '/construction/guides', pageType: 'hub', indexable: true },
  { path: '/construction/faqs', pageType: 'faq', indexable: true },
  { path: '/construction/prices', pageType: 'price', indexable: true },
  { path: '/construction/glossary', pageType: 'glossary', indexable: true },
  { path: '/construction/topics', pageType: 'hub', indexable: true },
  { path: '/construction/compare', pageType: 'hub', indexable: true },
  { path: '/construction/cost-calculator', pageType: 'calculator', indexable: true },
  { path: '/construction/construction-cost', pageType: 'calculator', indexable: true },
  { path: '/construction/cement-calculator', pageType: 'calculator', indexable: true },
  { path: '/construction/concrete-calculator', pageType: 'calculator', indexable: true },
  { path: '/construction/brick-calculator', pageType: 'calculator', indexable: true },
  { path: '/construction/steel-calculator', pageType: 'calculator', indexable: true },
  { path: '/construction/sand-calculator', pageType: 'calculator', indexable: true },
  { path: '/construction/aggregate-calculator', pageType: 'calculator', indexable: true },
  { path: '/construction/plaster-calculator', pageType: 'calculator', indexable: true },
  { path: '/construction/paint-calculator', pageType: 'calculator', indexable: true },
  { path: '/construction/tile-calculator', pageType: 'calculator', indexable: true },
  { path: '/construction/flooring-calculator', pageType: 'calculator', indexable: true },
  { path: '/construction/rcc-calculator', pageType: 'calculator', indexable: true },
  { path: '/construction/boq-generator', pageType: 'calculator', indexable: true },
  { path: '/construction/scenario-compare', pageType: 'calculator', indexable: true },
  { path: '/construction/cost-index', pageType: 'hub', indexable: true },
  { path: '/construction/cost-index/methodology', pageType: 'hub', indexable: true },
  { path: '/construction/fair-price-checker', pageType: 'price', indexable: true },
  { path: '/construction/material-selector', pageType: 'calculator', indexable: true },
  { path: '/construction/calc', pageType: 'hub', indexable: true },
];

export type ParsedConstructionPageSignals = {
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  robots: string | null;
  h1s: string[];
  imagesMissingAlt: number;
  imagesTotal: number;
  hasBreadcrumbJsonLd: boolean;
  hasVisibleBreadcrumb: boolean;
  jsonLdErrors: string[];
  internalLinks: string[];
  wordCountApprox: number;
};

function attr(tag: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i');
  const m = tag.match(re);
  return m?.[1] ?? null;
}

/** Lightweight HTML signal extraction for deferred crawl checks. */
export function parseConstructionPageHtml(html: string): ParsedConstructionPageSignals {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1]?.replace(/\s+/g, ' ').trim() || null;

  let metaDescription: string | null = null;
  let robots: string | null = null;
  let canonical: string | null = null;
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    const name = (attr(tag, 'name') ?? attr(tag, 'property') ?? '').toLowerCase();
    const content = attr(tag, 'content');
    if (name === 'description' && content) metaDescription = content.trim();
    if (name === 'robots' && content) robots = content.trim().toLowerCase();
  }
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    const rel = (attr(tag, 'rel') ?? '').toLowerCase();
    if (rel.includes('canonical')) {
      canonical = attr(tag, 'href');
      break;
    }
  }

  const h1s: string[] = [];
  for (const m of html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)) {
    const text = m[1]!
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) h1s.push(text);
  }

  let imagesTotal = 0;
  let imagesMissingAlt = 0;
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    imagesTotal += 1;
    const alt = attr(m[0], 'alt');
    if (alt == null) imagesMissingAlt += 1;
  }

  const jsonLdErrors: string[] = [];
  let hasBreadcrumbJsonLd = false;
  for (const m of html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    const raw = m[1]!.trim();
    if (!raw) continue;
    try {
      const data = JSON.parse(raw) as unknown;
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        if (!node || typeof node !== 'object') continue;
        const t = (node as { '@type'?: string | string[] })['@type'];
        const types = Array.isArray(t) ? t : t ? [t] : [];
        if (types.some((x) => String(x).toLowerCase() === 'breadcrumblist')) {
          hasBreadcrumbJsonLd = true;
        }
        if ((node as { '@graph'?: unknown })['@graph']) {
          const graph = (node as { '@graph': unknown[] })['@graph'];
          for (const g of graph) {
            const gt = (g as { '@type'?: string | string[] })?.['@type'];
            const gtypes = Array.isArray(gt) ? gt : gt ? [gt] : [];
            if (gtypes.some((x) => String(x).toLowerCase() === 'breadcrumblist')) {
              hasBreadcrumbJsonLd = true;
            }
          }
        }
      }
    } catch {
      jsonLdErrors.push('JSON-LD parse error');
    }
  }

  const hasVisibleBreadcrumb =
    /breadcrumb/i.test(html) ||
    /aria-label=["']breadcrumb["']/i.test(html) ||
    /itemtype=["'][^"']*BreadcrumbList["']/i.test(html);

  const internalLinks: string[] = [];
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    const href = m[1]!;
    if (href.startsWith('/construction')) internalLinks.push(href.split('?')[0]!.split('#')[0]!);
  }

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const wordCountApprox = text ? text.split(' ').filter(Boolean).length : 0;

  return {
    title,
    metaDescription,
    canonical,
    robots,
    h1s,
    imagesMissingAlt,
    imagesTotal,
    hasBreadcrumbJsonLd,
    hasVisibleBreadcrumb,
    jsonLdErrors,
    internalLinks,
    wordCountApprox,
  };
}

export function summarizeConstructionSeoIssues(issues: ConstructionSeoDraftIssue[]): {
  totalUrls: number;
  issueCount: number;
  critical: number;
  warnings: number;
  info: number;
  healthyEstimate: number;
  byIssueType: Record<string, number>;
  byPageType: Record<string, number>;
} {
  const urls = new Set(issues.map((i) => i.path));
  const byIssueType: Record<string, number> = {};
  const byPageType: Record<string, number> = {};
  let critical = 0;
  let warnings = 0;
  let info = 0;
  for (const issue of issues) {
    byIssueType[issue.issueType] = (byIssueType[issue.issueType] ?? 0) + 1;
    byPageType[issue.pageType] = (byPageType[issue.pageType] ?? 0) + 1;
    if (issue.severity === 'CRITICAL') critical += 1;
    else if (issue.severity === 'WARNING') warnings += 1;
    else info += 1;
  }
  return {
    totalUrls: urls.size,
    issueCount: issues.length,
    critical,
    warnings,
    info,
    healthyEstimate: Math.max(0, urls.size), // refined by runner with full inventory size
    byIssueType,
    byPageType,
  };
}
