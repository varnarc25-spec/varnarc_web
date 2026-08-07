import type { Metadata } from 'next';
import type { FinancePageKey } from '@varnarc/validation';
import { fetchFinancePageSeo, type FinancePageSeo } from '@/services/finance';
import { buildSeoMetadata } from '@/lib/seo-metadata';

export async function getFinancePageContent(pageKey: FinancePageKey): Promise<FinancePageSeo> {
  const { data } = await fetchFinancePageSeo(pageKey);
  return data;
}

export async function buildFinancePageMetadata(pageKey: FinancePageKey): Promise<Metadata> {
  const page = await getFinancePageContent(pageKey);
  return buildSeoMetadata({
    entityType: 'finance_page',
    entityId: page.entityId,
    path: page.path,
    title: page.title,
    description: page.description,
  });
}
