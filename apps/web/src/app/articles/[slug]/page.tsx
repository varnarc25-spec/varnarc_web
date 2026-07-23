import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleLayout } from '@/components/layout/article-layout';
import { ArticleCommentsSection, type ArticleComment } from '@/components/articles/article-comments-section';
import { ArticleSubscribeBar } from '@/components/articles/article-subscribe-bar';
import { BookmarkButton } from '@/components/bookmark-button';
import { ArticleAiSummarizer } from '@/components/articles/article-ai-summarizer';
import { MarkdownContent } from '@/components/shared/markdown-content';
import { JsonLd, articleJsonLd, breadcrumbJsonLd } from '@/components/seo/json-ld';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { fetchArticleBySlug } from '@/services/content';
import { apiPublicFetch, ApiError } from '@/services/api-client';
import { auth0 } from '@/lib/auth0';
import { apiServerFetch } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { RecordContentView } from '@/components/record-content-view';
import { SponsoredLabel } from '@/components/business/sponsored-label';
import { parseArticleSponsor } from '@/lib/article-sponsor';

type Props = { params: Promise<{ slug: string }> };

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await fetchArticleBySlug(slug);
    return buildSeoMetadata({
      entityType: 'article',
      entityId: data.id,
      path: `/articles/${slug}`,
      title: data.title,
      description: data.excerpt,
    });
  } catch {
    return { title: 'Article' };
  }
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth0.getSession();
  const me = session?.user ? await apiServerFetch<{ id: string }>('/users/me') : null;
  try {
    const { data } = await fetchArticleBySlug(slug);
    const sponsor = parseArticleSponsor(data.metadata);
    const commentsPayload = await apiPublicFetch<{
      items: ArticleComment[];
      total: number;
    }>(`/article-comments?articleId=${data.id}&limit=100`).catch(() => ({
      data: { items: [] as ArticleComment[], total: 0 },
    }));
    const url = `${siteUrl}/articles/${slug}`;
    return (
      <>
        <RecordContentView
          entityType="article"
          entityId={data.id}
          metadata={{ slug, title: data.title }}
        />
        <JsonLd
          data={[
            breadcrumbJsonLd([
              { name: 'Home', url: siteUrl },
              { name: 'Articles', url: `${siteUrl}/articles` },
              { name: data.title, url },
            ]),
            articleJsonLd({
              title: data.title,
              description: data.excerpt,
              url,
              datePublished: data.publishedAt,
            }),
          ]}
        />
        <ArticleLayout
          title={data.title}
          excerpt={data.excerpt}
          badges={sponsor.sponsored ? <SponsoredLabel /> : null}
          publishedLabel={[
            formatDate(data.publishedAt),
            data.readingTimeMinutes ? `${data.readingTimeMinutes} min read` : null,
            data.author?.username
              ? `By ${data.author.displayName || data.author.username}`
              : null,
          ]
            .filter(Boolean)
            .join(' · ')}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Articles', href: '/articles' },
            { label: data.title },
          ]}
        >
          {data.author?.username ? (
            <p className="mb-6 text-sm text-slate-500">
              Written by{' '}
              <a
                href={`/authors/${data.author.username}`}
                className="font-medium text-[var(--varnarc-brand)] hover:underline"
              >
                {data.author.displayName || data.author.username}
              </a>
            </p>
          ) : null}
          {sponsor.sponsored ? (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p>{sponsor.disclosure}</p>
              {sponsor.name ? (
                <p className="mt-1 text-amber-800">
                  {sponsor.url ? (
                    <a
                      href={sponsor.url}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="font-medium underline"
                    >
                      {sponsor.name}
                    </a>
                  ) : (
                    sponsor.name
                  )}
                </p>
              ) : null}
            </div>
          ) : null}
          <ArticleSubscribeBar
            author={data.author}
            category={
              data.category ? { slug: data.category.slug, name: data.category.name } : null
            }
            tags={(data.tags ?? []).map((row) => ({
              slug: row.tag.slug,
              name: row.tag.name,
            }))}
          />
          <div className="mb-6">
            <BookmarkButton entityType="article" entityId={data.id} />
          </div>
          <ArticleAiSummarizer title={data.title} content={data.content || data.excerpt || ''} />
          <MarkdownContent content={data.content || data.excerpt || ''} />
          {data.related?.length ? (
            <section className="mt-12 border-t border-[var(--varnarc-border)] pt-8">
              <h2 className="mb-4 text-xl font-semibold">Related articles</h2>
              <ul className="space-y-3">
                {data.related.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`/articles/${item.slug}`}
                      className="font-medium text-[var(--varnarc-brand)] hover:underline"
                    >
                      {item.title}
                    </a>
                    {item.excerpt ? (
                      <p className="text-sm text-[var(--varnarc-subtle)]">{item.excerpt}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <ArticleCommentsSection
            articleId={data.id}
            initialComments={commentsPayload.data.items}
            initialTotal={commentsPayload.data.total}
            canComment={Boolean(session?.user)}
            currentUserId={me?.data?.id ?? null}
          />
        </ArticleLayout>
      </>
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}
