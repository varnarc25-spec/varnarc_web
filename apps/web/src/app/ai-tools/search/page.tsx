import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { AiToolCard } from '@/components/ai-tools/ai-tool-card';
import { AiToolsSearchForm } from '@/components/ai-tools/ai-tools-search-form';
import { unwrapList, type AiToolListItem } from '@/components/ai-tools/types';
import { apiPublicFetch } from '@/services/api-client';

export const metadata: Metadata = {
  title: 'Search AI Tools',
  description: 'Filter AI tools by category, pricing, free plan, and API availability.',
  alternates: { canonical: '/ai-tools/search' },
};

export const revalidate = 60;

type Props = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    pricingModel?: string;
    freePlan?: string;
    apiAvailable?: string;
    sort?: string;
  }>;
};

export default async function AiToolsSearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '24' });
  if (params.q) qs.set('search', params.q);
  if (params.category) qs.set('category', params.category);
  if (params.pricingModel) qs.set('pricingModel', params.pricingModel);
  if (params.freePlan === 'true') qs.set('freePlan', 'true');
  if (params.apiAvailable === 'true') qs.set('apiAvailable', 'true');
  if (params.sort) qs.set('sort', params.sort);

  const { data } = await apiPublicFetch<AiToolListItem[]>(`/ai-tools?${qs.toString()}`, {
    next: { revalidate: 60 },
  }).catch(() => ({ data: [] as AiToolListItem[] }));

  const items = unwrapList(data);

  return (
    <ContentLayout
      title="Search AI Tools"
      description="Find tools by name, category, pricing model, and capabilities."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'AI Tools', href: '/ai-tools' },
        { label: 'Search' },
      ]}
    >
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <Link href="/ai-tools" className="text-[var(--varnarc-brand)] hover:underline">
          ← AI Tools home
        </Link>
      </div>

      <AiToolsSearchForm
        initialSearch={params.q}
        initialCategory={params.category}
        initialPricingModel={params.pricingModel}
        initialFreePlan={params.freePlan === 'true'}
        initialApiAvailable={params.apiAvailable === 'true'}
        initialSort={params.sort ?? ''}
      />

      {items.length ? (
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((t) => (
            <AiToolCard
              key={t.id}
              name={t.name}
              slug={t.slug}
              description={t.shortDescription || t.description}
              pricingModel={t.pricingModel}
              freePlan={t.freePlan}
              featured={t.featured}
              sponsored={t.sponsored}
              logoUrl={t.logoUrl}
              categoryName={t.category?.name}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No results" message="Try adjusting your search or filters." />
      )}
    </ContentLayout>
  );
}
