import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { RelatedArticles } from '@/components/construction/related-articles';
import { fetchConstructionGuides } from '@/services/construction';
import { buildGuideClusterLanding, listGuideClusters } from '@varnarc/validation';
import { cx } from '@/components/construction/styles';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';
import { CONSTRUCTION_PAGE_DEFAULTS } from '@/lib/construction/seo-pages';

export async function generateMetadata(): Promise<Metadata> {
  return buildConstructionPageMetadata('guides');
}

export const revalidate = 60;

export default async function ConstructionGuidesPage() {
  const { data } = await fetchConstructionGuides();
  const topics = listGuideClusters()
    .map((c) => buildGuideClusterLanding(c.slug))
    .filter((l): l is NonNullable<typeof l> => l != null);
  const defaults = CONSTRUCTION_PAGE_DEFAULTS.guides;

  const listItems = [
    ...topics.map((t) => ({ name: t.title, path: t.canonicalPath })),
    ...data.map((g) => ({ name: g.title, path: `/construction/guides/${g.slug}` })),
  ];

  return (
    <ContentLayout
      title={defaults.h1}
      description={defaults.description}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Guides' },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([{ name: 'Guides', path: '/construction/guides' }])}
        webPage={{
          name: defaults.title,
          description: defaults.description,
          path: '/construction/guides',
        }}
        itemList={
          listItems.length
            ? {
                name: 'Construction guides and topic hubs',
                path: '/construction/guides',
                items: listItems,
              }
            : undefined
        }
      />

      <section className="mb-10 space-y-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Topic hubs</h2>
        <p className="text-sm text-slate-600">
          Pillar pages organise calculators, comparisons, glossary and prices. They do not
          auto-generate article text.
        </p>
        <ul className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <li key={t.slug}>
              <Link href={t.canonicalPath} className={cx.secondaryBtn}>
                {t.title}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/construction/topics" className="text-sm font-semibold text-[#f97316]">
          Browse all topics →
        </Link>
      </section>

      <h2 className="mb-4 text-lg font-bold text-[#0b1f3a]">Published guides</h2>
      {data.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((guide) => (
            <Link
              key={guide.slug}
              href={`/construction/guides/${guide.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              {guide.category ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-[#f97316]">
                  {guide.category}
                </span>
              ) : null}
              <h3 className="mt-1 text-base font-extrabold text-[#0b1f3a]">{guide.title}</h3>
              {guide.summary ? (
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{guide.summary}</p>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No guides yet"
          message="Construction guides will appear here once published."
        />
      )}

      <RelatedArticles />
    </ContentLayout>
  );
}
