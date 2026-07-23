import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { AiToolCard } from '@/components/ai-tools/ai-tool-card';
import { unwrapList, type AiToolListItem } from '@/components/ai-tools/types';
import { apiPublicFetch } from '@/services/api-client';

export const metadata: Metadata = {
  title: 'New AI Tools',
  description: 'Recently added AI tools on Varnarc.',
  alternates: { canonical: '/ai-tools/new' },
};

export const revalidate = 60;

export default async function AiToolsNewPage() {
  const { data } = await apiPublicFetch<AiToolListItem[]>('/ai-tools?sort=recent&limit=24', {
    next: { revalidate: 60 },
  }).catch(() => ({ data: [] as AiToolListItem[] }));

  const items = unwrapList(data);

  return (
    <ContentLayout
      title="New AI Tools"
      description="Recently published tools in the catalog."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'AI Tools', href: '/ai-tools' },
        { label: 'New' },
      ]}
    >
      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link href="/ai-tools" className="text-[var(--varnarc-brand)] hover:underline">
          ← AI Tools home
        </Link>
        <Link href="/ai-tools/trending" className="text-[var(--varnarc-brand)] hover:underline">
          Trending
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
        <EmptyState title="No new tools" message="Newly published tools will appear here." />
      )}
    </ContentLayout>
  );
}
