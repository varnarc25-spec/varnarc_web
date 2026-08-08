import type { Metadata } from 'next';
import type { FinancePageKey } from '@varnarc/validation';
import { FINANCE_PAGE_DEFAULTS, FINANCE_PAGE_IDS } from '@varnarc/validation';
import { fetchFinancePageSeo, type FinancePageSeo } from '@/services/finance';
import { buildSeoMetadata } from '@/lib/seo-metadata';

function financePageSeoFallback(pageKey: FinancePageKey): FinancePageSeo {
  const defaults = FINANCE_PAGE_DEFAULTS[pageKey];
  return {
    pageKey,
    entityId: FINANCE_PAGE_IDS[pageKey],
    path: defaults.path,
    label: defaults.label,
    title: defaults.title,
    description: defaults.description,
    h1: defaults.h1,
    intro: defaults.intro,
    metaKeywords: null,
    canonicalUrl:
      'canonicalUrl' in defaults && typeof defaults.canonicalUrl === 'string'
        ? defaults.canonicalUrl
        : null,
  };
}

export async function getFinancePageContent(pageKey: FinancePageKey): Promise<FinancePageSeo> {
  try {
    const { data } = await fetchFinancePageSeo(pageKey);
    if (data) return data;
  } catch {
    // use static defaults when hub SEO API is unavailable
  }
  return financePageSeoFallback(pageKey);
}

export async function buildFinancePageMetadata(pageKey: FinancePageKey): Promise<Metadata> {
  const page = await getFinancePageContent(pageKey);
  return buildSeoMetadata({
    entityType: 'finance_page',
    entityId: page.entityId,
    path: page.path,
    title: page.title,
    description: page.description,
    canonicalUrl: page.canonicalUrl,
  });
}
