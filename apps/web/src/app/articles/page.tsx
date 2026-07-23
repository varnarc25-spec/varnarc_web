import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { ArticleCard } from '@/components/business/article-card';
import { articleCardPropsFromListItem } from '@/services/content';
import { ArticlesQueryGrid } from '@/features/articles/articles-query-grid';
import { fetchArticles } from '@/services/content';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Guides, news, and insights from Varnarc.',
  alternates: { canonical: '/articles' },
};

export const revalidate = 60;

export default async function ArticlesPage() {
  const { data } = await fetchArticles(24);

  return (
    <ContentLayout
      title="Articles"
      description="Guides, news, and insights."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Articles' }]}
    >
      {data.length ? (
        <div className="grid gap-6 md:grid-cols-3">
          {data.map((a) => (
            <div key={a.id}>
              <ArticleCard key={a.id} {...articleCardPropsFromListItem(a)} />
              {a.publishedAt ? (
                <p className="mt-2 px-1 text-[11px] text-slate-500">{formatDate(a.publishedAt)}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <EmptyState title="No published articles yet" message="Showing live API feed when available." />
          <ArticlesQueryGrid limit={6} />
        </div>
      )}
    </ContentLayout>
  );
}
