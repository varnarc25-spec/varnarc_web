import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { AiToolCard } from '@/components/ai-tools/ai-tool-card';
import { AiToolsSearchForm } from '@/components/ai-tools/ai-tools-search-form';
import { unwrapList, type AiCategory, type AiToolListItem } from '@/components/ai-tools/types';
import { apiPublicFetch } from '@/services/api-client';

export const metadata: Metadata = {
  title: 'AI Tools',
  description: 'Discover, compare, and review AI tools for writing, image, coding, and more.',
  alternates: { canonical: '/ai-tools' },
};

export const revalidate = 60;

export default async function AiToolsHomePage() {
  const [categoriesResult, sponsoredResult, popularResult] = await Promise.all([
    apiPublicFetch<AiCategory[]>('/ai-tools/categories?limit=24', { next: { revalidate: 60 } }).catch(
      () => ({ data: [] as AiCategory[] }),
    ),
    apiPublicFetch<AiToolListItem[]>('/ai-tools?sponsored=true&limit=6', {
      next: { revalidate: 60 },
    }).catch(() => ({ data: [] as AiToolListItem[] })),
    apiPublicFetch<AiToolListItem[]>('/ai-tools?sort=popular&limit=12', {
      next: { revalidate: 60 },
    }).catch(() => ({ data: [] as AiToolListItem[] })),
  ]);

  const categories = unwrapList(categoriesResult.data);
  const sponsored = unwrapList(sponsoredResult.data);
  const popular = unwrapList(popularResult.data);
  const featured = popular.filter((t) => t.featured);

  return (
    <ContentLayout
      title="AI Tools"
      description="Discover and compare AI products for writing, image, video, coding, and productivity."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'AI Tools' }]}
    >
      <AiToolsSearchForm />

      <div className="mb-8 flex flex-wrap gap-3 text-sm">
        <Link href="/ai-tools/search" className="text-[var(--varnarc-brand)] hover:underline">
          Advanced search
        </Link>
        <Link href="/ai-tools/trending" className="text-[var(--varnarc-brand)] hover:underline">
          Trending
        </Link>
        <Link href="/ai-tools/new" className="text-[var(--varnarc-brand)] hover:underline">
          New tools
        </Link>
        <Link href="/ai-tools/compare" className="text-[var(--varnarc-brand)] hover:underline">
          Compare
        </Link>
        <Link href="/ai-tools/utilities" className="text-[var(--varnarc-brand)] hover:underline">
          AI utilities
        </Link>
        <Link href="/ai-tools/bookmarks" className="text-[var(--varnarc-brand)] hover:underline">
          My bookmarks
        </Link>
      </div>

      {categories.length ? (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Categories</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/ai-tools/${c.slug}`}
                className="rounded-md border border-[var(--varnarc-border)] px-4 py-3 hover:bg-[var(--varnarc-muted)]"
              >
                <span className="font-medium">{c.name}</span>
                {c._count?.tools != null ? (
                  <span className="ml-2 text-sm text-[var(--varnarc-subtle)]">({c._count.tools})</span>
                ) : null}
                {c.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--varnarc-subtle)]">{c.description}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {sponsored.length ? (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Sponsored</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {sponsored.map((t) => (
              <AiToolCard
                key={t.id}
                name={t.name}
                slug={t.slug}
                description={t.shortDescription || t.description}
                pricingModel={t.pricingModel}
                freePlan={t.freePlan}
                featured={t.featured}
                sponsored
                logoUrl={t.logoUrl}
                categoryName={t.category?.name}
              />
            ))}
          </div>
        </section>
      ) : null}

      {featured.length ? (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Featured</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {featured.map((t) => (
              <AiToolCard
                key={t.id}
                name={t.name}
                slug={t.slug}
                description={t.shortDescription || t.description}
                pricingModel={t.pricingModel}
                freePlan={t.freePlan}
                featured
                sponsored={t.sponsored}
                logoUrl={t.logoUrl}
                categoryName={t.category?.name}
              />
            ))}
          </div>
        </section>
      ) : null}

      {popular.length ? (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Trending tools</h2>
            <Link href="/ai-tools/trending" className="text-sm text-[var(--varnarc-brand)] hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {popular.map((t) => (
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
        </section>
      ) : (
        <EmptyState title="No AI tools yet" message="Published tools will appear here." />
      )}
    </ContentLayout>
  );
}
