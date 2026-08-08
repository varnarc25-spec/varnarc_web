import type { Metadata } from 'next';
import { ModuleHubShell } from '@/components/hub/module-hub-shell';
import { HubSectionHeader } from '@/components/hub/hub-section-header';
import { HubGuideGrid } from '@/components/hub/hub-guide-grid';
import { EmptyState } from '@/components/shared/empty-state';
import { ArticleCard } from '@/components/business/article-card';
import { ArticlesQueryGrid } from '@/features/articles/articles-query-grid';
import { fetchArticles, articleCardPropsFromListItem } from '@/services/content';
import { resolveArticleImageUrl } from '@/lib/article-category-icons';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Guides, news, and insights from Varnarc.',
  alternates: { canonical: '/articles' },
};

export const revalidate = 60;

const popularLinks = [
  { label: 'Finance', href: '/tags/finance' },
  { label: 'Construction', href: '/tags/construction' },
  { label: 'Solar', href: '/articles/solar-subsidy-india' },
];

export default async function ArticlesPage() {
  const { data } = await fetchArticles(24);

  const guideItems = data.slice(0, 6).map((a) => ({
    slug: a.slug,
    title: a.title,
    category: a.category?.name ?? 'Article',
    summary: a.excerpt,
    href: `/articles/${a.slug}`,
    imageUrl: resolveArticleImageUrl(a),
    readMinutes: 5,
  }));

  return (
    <ModuleHubShell
      moduleKey="articles"
      title="Guides, news & expert insights"
      description="Guides, news, and insights across finance, home, auto, and everyday planning."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Articles' }]}
      popularLinks={popularLinks}
      overviewTitle="Blog overview"
    >
      {guideItems.length ? <HubGuideGrid items={guideItems} viewAllHref="/articles" /> : null}

      <section>
        <HubSectionHeader title="All articles" />
        {data.length ? (
          <div className="grid gap-6 md:grid-cols-3">
            {data.map((a) => (
              <div key={a.id}>
                <ArticleCard {...articleCardPropsFromListItem(a)} />
                {a.publishedAt ? (
                  <p className="mt-2 px-1 text-[11px] text-slate-500">
                    {formatDate(a.publishedAt)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <EmptyState
              title="No published articles yet"
              message="Showing live API feed when available."
            />
            <ArticlesQueryGrid limit={6} />
          </div>
        )}
      </section>
    </ModuleHubShell>
  );
}
