import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { ArticleCard } from '@/components/business/article-card';
import { articleCardPropsFromListItem } from '@/services/content';
import { ApiError } from '@/services/api-client';
import { fetchArticlesByTagSlug, fetchTagBySlug } from '@/services/content';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await fetchTagBySlug(slug);
    return {
      title: `Tag: ${data.name}`,
      alternates: { canonical: `/tags/${slug}` },
    };
  } catch {
    return { title: `Tag: ${slug}`, alternates: { canonical: `/tags/${slug}` } };
  }
}

export default async function TagDetailPage({ params }: Props) {
  const { slug } = await params;
  let tagName = slug;
  try {
    const { data } = await fetchTagBySlug(slug);
    tagName = data.name;
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
  }

  const { data: articles } = await fetchArticlesByTagSlug(slug, 24);

  return (
    <ContentLayout
      title={`#${tagName}`}
      description={`Articles related to ${tagName}.`}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Tags', href: '/tags' },
        { label: tagName },
      ]}
    >
      {articles.length ? (
        <div className="grid gap-6 md:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.id} {...articleCardPropsFromListItem(a)} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <EmptyState
            title="No articles for this tag yet"
            message="Publish articles with this CMS tag to populate the list."
          />
          <Link href="/articles" className="text-sm font-semibold text-[#f97316] hover:underline">
            Browse all articles
          </Link>
        </div>
      )}
    </ContentLayout>
  );
}
