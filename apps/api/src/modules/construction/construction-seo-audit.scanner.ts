/**
 * Construction SEO scanner — fast inventory checks + deferred HTML crawl helpers.
 */

import {
  CONSTRUCTION_SEO_STATIC_INVENTORY,
  parseConstructionPageHtml,
  withRecommendedAction,
  type ConstructionSeoDraftIssue,
  type ConstructionSeoInventoryItem,
  type ConstructionSeoPageType,
} from '@varnarc/validation';

const STALE_PRICE_DAYS = 30;
const THIN_WORD_COUNT = 120;
const LCP_BUDGET_MS = 2500;
const CLS_BUDGET = 0.1;
const INP_BUDGET_MS = 200;

export type ConstructionSeoCrawlResult = {
  path: string;
  status: number;
  redirectChain: string[];
  finalUrl: string;
  html?: string;
};

export type ConstructionSeoVitals = {
  path: string;
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  samples: number;
};

export function mergeConstructionInventory(
  extras: ConstructionSeoInventoryItem[],
): ConstructionSeoInventoryItem[] {
  const map = new Map<string, ConstructionSeoInventoryItem>();
  for (const item of [...CONSTRUCTION_SEO_STATIC_INVENTORY, ...extras]) {
    const prev = map.get(item.path);
    map.set(item.path, prev ? { ...prev, ...item } : item);
  }
  return [...map.values()];
}

export function runFastConstructionSeoChecks(input: {
  inventory: ConstructionSeoInventoryItem[];
  sitemapPaths: Set<string>;
  hubOutboundLinks: Set<string>;
  stalePricePaths?: string[];
}): ConstructionSeoDraftIssue[] {
  const issues: ConstructionSeoDraftIssue[] = [];
  const titleMap = new Map<string, string[]>();
  const h1Map = new Map<string, string[]>();

  for (const item of input.inventory) {
    const title = item.title?.trim() ?? '';
    const description = item.description?.trim() ?? '';
    const h1 = item.h1?.trim() ?? '';

    if (!title && item.entityId) {
      issues.push(
        withRecommendedAction({
          path: item.path,
          pageType: item.pageType,
          issueType: 'missing_title',
          severity: 'CRITICAL',
          message: `Missing title for ${item.path}`,
        }),
      );
    }
    if (!description && item.entityId) {
      issues.push(
        withRecommendedAction({
          path: item.path,
          pageType: item.pageType,
          issueType: 'missing_meta_description',
          severity: 'WARNING',
          message: `Missing meta description for ${item.path}`,
        }),
      );
    }
    if (title && title.length < 25) {
      issues.push(
        withRecommendedAction({
          path: item.path,
          pageType: item.pageType,
          issueType: 'thin_content',
          severity: 'INFO',
          message: `Short title (${title.length} chars) on ${item.path}`,
          evidence: { titleLength: title.length },
        }),
      );
    }
    if (description && description.length < 70) {
      issues.push(
        withRecommendedAction({
          path: item.path,
          pageType: item.pageType,
          issueType: 'thin_content',
          severity: 'INFO',
          message: `Short meta description (${description.length} chars) on ${item.path}`,
          evidence: { descriptionLength: description.length },
        }),
      );
    }
    if (item.indexable && !item.lastUpdated && item.pageType === 'guide') {
      issues.push(
        withRecommendedAction({
          path: item.path,
          pageType: item.pageType,
          issueType: 'missing_last_updated',
          severity: 'WARNING',
          message: `Guide ${item.path} has no last-updated timestamp in inventory.`,
        }),
      );
    }

    if (title) {
      const key = title.toLowerCase();
      titleMap.set(key, [...(titleMap.get(key) ?? []), item.path]);
    }
    if (h1) {
      const key = h1.toLowerCase();
      h1Map.set(key, [...(h1Map.get(key) ?? []), item.path]);
    }

    if (item.indexable && !input.sitemapPaths.has(item.path)) {
      issues.push(
        withRecommendedAction({
          path: item.path,
          pageType: item.pageType,
          issueType: 'sitemap_missing',
          severity: 'WARNING',
          message: `Indexable URL missing from construction sitemap segments: ${item.path}`,
        }),
      );
    }

    if (
      item.indexable &&
      item.path !== '/construction' &&
      !input.hubOutboundLinks.has(item.path) &&
      !item.path.startsWith('/construction/prices/')
    ) {
      // Soft orphan signal — static hubs may not list every calculator dynamically.
      if (item.pageType === 'material' || item.pageType === 'brand' || item.pageType === 'guide') {
        issues.push(
          withRecommendedAction({
            path: item.path,
            pageType: item.pageType,
            issueType: 'orphan_page',
            severity: 'INFO',
            message: `No hub outbound link observed for ${item.path} in this scan sample.`,
          }),
        );
      }
    }
  }

  for (const [title, paths] of titleMap) {
    if (paths.length < 2) continue;
    for (const path of paths) {
      const item = input.inventory.find((i) => i.path === path)!;
      issues.push(
        withRecommendedAction({
          path,
          pageType: item.pageType,
          issueType: 'duplicate_title',
          severity: 'WARNING',
          message: `Duplicate title shared by ${paths.length} URLs`,
          evidence: { title, paths },
        }),
      );
    }
  }

  for (const [h1, paths] of h1Map) {
    if (paths.length < 2) continue;
    for (const path of paths) {
      const item = input.inventory.find((i) => i.path === path)!;
      issues.push(
        withRecommendedAction({
          path,
          pageType: item.pageType,
          issueType: 'duplicate_h1',
          severity: 'WARNING',
          message: `Duplicate H1 shared by ${paths.length} URLs`,
          evidence: { h1, paths },
        }),
      );
    }
  }

  for (const path of input.sitemapPaths) {
    if (!path.startsWith('/construction')) continue;
    const known = input.inventory.some((i) => i.path === path);
    if (!known && path.split('/').length > 4) {
      // Dynamic landings may be sitemap-only; skip noise for deep price pairs.
      continue;
    }
  }

  for (const path of input.stalePricePaths ?? []) {
    issues.push(
      withRecommendedAction({
        path,
        pageType: 'price',
        issueType: 'stale_price_data',
        severity: 'WARNING',
        message: `Stale or aged construction price data affecting ${path}`,
        evidence: { staleAfterDays: STALE_PRICE_DAYS },
      }),
    );
  }

  return issues;
}

export function runDeferredConstructionSeoChecks(input: {
  item: ConstructionSeoInventoryItem;
  crawl: ConstructionSeoCrawlResult;
  vitals?: ConstructionSeoVitals | null;
}): ConstructionSeoDraftIssue[] {
  const { item, crawl } = input;
  const issues: ConstructionSeoDraftIssue[] = [];
  const pageType: ConstructionSeoPageType = item.pageType;

  if (crawl.status >= 400 || crawl.status === 0) {
    issues.push(
      withRecommendedAction({
        path: item.path,
        pageType,
        issueType: 'http_status',
        severity: 'CRITICAL',
        message: `HTTP ${crawl.status || 'error'} for ${item.path}`,
        httpStatus: crawl.status || null,
        evidence: { redirectChain: crawl.redirectChain, finalUrl: crawl.finalUrl },
      }),
    );
    return issues;
  }

  if (crawl.redirectChain.length > 1) {
    issues.push(
      withRecommendedAction({
        path: item.path,
        pageType,
        issueType: 'redirect_chain',
        severity: 'WARNING',
        message: `Redirect chain length ${crawl.redirectChain.length} for ${item.path}`,
        httpStatus: crawl.status,
        evidence: { chain: crawl.redirectChain, finalUrl: crawl.finalUrl },
      }),
    );
  }

  if (!crawl.html) return issues;
  const signals = parseConstructionPageHtml(crawl.html);

  if (!signals.title?.trim()) {
    issues.push(
      withRecommendedAction({
        path: item.path,
        pageType,
        issueType: 'missing_title',
        severity: 'CRITICAL',
        message: `Live page missing <title>: ${item.path}`,
        httpStatus: crawl.status,
      }),
    );
  }
  if (!signals.metaDescription?.trim()) {
    issues.push(
      withRecommendedAction({
        path: item.path,
        pageType,
        issueType: 'missing_meta_description',
        severity: 'WARNING',
        message: `Live page missing meta description: ${item.path}`,
        httpStatus: crawl.status,
      }),
    );
  }
  if (!signals.canonical?.trim()) {
    issues.push(
      withRecommendedAction({
        path: item.path,
        pageType,
        issueType: 'missing_canonical',
        severity: 'WARNING',
        message: `Live page missing canonical: ${item.path}`,
        httpStatus: crawl.status,
      }),
    );
  }
  if (!signals.h1s.length) {
    issues.push(
      withRecommendedAction({
        path: item.path,
        pageType,
        issueType: 'missing_h1',
        severity: 'CRITICAL',
        message: `Live page missing H1: ${item.path}`,
        httpStatus: crawl.status,
      }),
    );
  } else if (signals.h1s.length > 1) {
    issues.push(
      withRecommendedAction({
        path: item.path,
        pageType,
        issueType: 'multiple_h1',
        severity: 'WARNING',
        message: `Live page has ${signals.h1s.length} H1 elements: ${item.path}`,
        httpStatus: crawl.status,
        evidence: { h1s: signals.h1s.slice(0, 5) },
      }),
    );
  }

  const robots = signals.robots ?? '';
  const hasNoindex = /\bnoindex\b/.test(robots);
  if (item.indexable && hasNoindex) {
    issues.push(
      withRecommendedAction({
        path: item.path,
        pageType,
        issueType: 'noindex_mistake',
        severity: 'CRITICAL',
        message: `Indexable construction URL is noindex: ${item.path}`,
        httpStatus: crawl.status,
        evidence: { robots },
      }),
    );
  }
  if (!item.indexable && !hasNoindex && item.path.includes('?')) {
    issues.push(
      withRecommendedAction({
        path: item.path,
        pageType,
        issueType: 'noindex_mistake',
        severity: 'WARNING',
        message: `Likely non-indexable URL missing noindex: ${item.path}`,
        httpStatus: crawl.status,
        evidence: { robots },
      }),
    );
  }

  if (!signals.hasBreadcrumbJsonLd && !signals.hasVisibleBreadcrumb) {
    issues.push(
      withRecommendedAction({
        path: item.path,
        pageType,
        issueType: 'missing_breadcrumb',
        severity: 'INFO',
        message: `No breadcrumb signals detected on ${item.path}`,
        httpStatus: crawl.status,
      }),
    );
  }

  for (const err of signals.jsonLdErrors) {
    issues.push(
      withRecommendedAction({
        path: item.path,
        pageType,
        issueType: 'invalid_structured_data',
        severity: 'WARNING',
        message: `${err} on ${item.path}`,
        httpStatus: crawl.status,
      }),
    );
  }

  if (signals.imagesMissingAlt > 0) {
    issues.push(
      withRecommendedAction({
        path: item.path,
        pageType,
        issueType: 'missing_alt_text',
        severity: 'WARNING',
        message: `${signals.imagesMissingAlt}/${signals.imagesTotal} images missing alt on ${item.path}`,
        httpStatus: crawl.status,
        evidence: {
          missingAlt: signals.imagesMissingAlt,
          imagesTotal: signals.imagesTotal,
        },
      }),
    );
  }

  if (signals.wordCountApprox > 0 && signals.wordCountApprox < THIN_WORD_COUNT) {
    issues.push(
      withRecommendedAction({
        path: item.path,
        pageType,
        issueType: 'thin_content',
        severity: 'INFO',
        message: `Approximate visible word count ${signals.wordCountApprox} on ${item.path}`,
        httpStatus: crawl.status,
        evidence: { wordCountApprox: signals.wordCountApprox },
      }),
    );
  }

  const vitals = input.vitals;
  if (vitals) {
    if (vitals.lcp != null && vitals.lcp > LCP_BUDGET_MS) {
      issues.push(
        withRecommendedAction({
          path: item.path,
          pageType,
          issueType: 'performance_lcp',
          severity: vitals.lcp > 4000 ? 'CRITICAL' : 'WARNING',
          message: `LCP ${vitals.lcp}ms exceeds budget on ${item.path}`,
          lcp: vitals.lcp,
          evidence: { samples: vitals.samples, budgetMs: LCP_BUDGET_MS },
        }),
      );
    }
    if (vitals.cls != null && vitals.cls > CLS_BUDGET) {
      issues.push(
        withRecommendedAction({
          path: item.path,
          pageType,
          issueType: 'performance_cls',
          severity: vitals.cls > 0.25 ? 'CRITICAL' : 'WARNING',
          message: `CLS ${vitals.cls} exceeds budget on ${item.path}`,
          cls: vitals.cls,
          evidence: { samples: vitals.samples, budget: CLS_BUDGET },
        }),
      );
    }
    if (vitals.inp != null && vitals.inp > INP_BUDGET_MS) {
      issues.push(
        withRecommendedAction({
          path: item.path,
          pageType,
          issueType: 'performance_inp',
          severity: vitals.inp > 500 ? 'CRITICAL' : 'WARNING',
          message: `INP ${vitals.inp}ms exceeds budget on ${item.path}`,
          inp: vitals.inp,
          evidence: { samples: vitals.samples, budgetMs: INP_BUDGET_MS },
        }),
      );
    }
  }

  return issues;
}

export function findBrokenInternalLinks(input: {
  fromPath: string;
  pageType: ConstructionSeoPageType;
  links: string[];
  okPaths: Set<string>;
  failedPaths: Set<string>;
}): ConstructionSeoDraftIssue[] {
  const issues: ConstructionSeoDraftIssue[] = [];
  for (const href of input.links) {
    if (!href.startsWith('/construction')) continue;
    if (input.failedPaths.has(href) || (!input.okPaths.has(href) && input.failedPaths.size > 0)) {
      if (input.failedPaths.has(href)) {
        issues.push(
          withRecommendedAction({
            path: input.fromPath,
            pageType: input.pageType,
            issueType: 'broken_internal_link',
            severity: 'CRITICAL',
            message: `Broken internal link ${href} from ${input.fromPath}`,
            evidence: { href },
          }),
        );
      }
    }
  }
  return issues;
}

export { STALE_PRICE_DAYS };
