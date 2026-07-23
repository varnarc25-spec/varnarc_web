import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { AiToolCard } from '@/components/ai-tools/ai-tool-card';
import { unwrapList, type AiToolListItem } from '@/components/ai-tools/types';
import { apiPublicFetch } from '@/services/api-client';

export const metadata: Metadata = {
  title: 'Trending AI Tools',
  description: 'Most popular AI tools on Varnarc.',
  alternates: { canonical: '/ai-tools/trending' },
};

export const revalidate = 60;

export default async function AiToolsTrendingPage() {
  const { data } = await apiPublicFetch<AiToolListItem[]>('/ai-tools?sort=popular&limit=24', {
    next: { revalidate: 60 },
  }).catch(() => ({ data: [] as AiToolListItem[] }));

  const items = unwrapList(data);

  return (
    <ContentLayout
      title="Trending AI Tools"
      description="Popular tools ranked by views and engagement."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'AI Tools', href: '/ai-tools' },
        { label: 'Trending' },
      ]}
    >
      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link href="/ai-tools" className="text-[var(--varnarc-brand)] hover:underline">
          ← AI Tools home
        </Link>
        <Link href="/ai-tools/new" className="text-[var(--varnarc-brand)] hover:underline">
          New tools
        </Link>
      </div>

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
        <EmptyState title="No trending tools" message="Check back soon for popular listings." />
      )}
    </ContentLayout>
  );
}
