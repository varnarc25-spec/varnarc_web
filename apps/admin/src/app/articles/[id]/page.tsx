import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import Link from 'next/link';
import { apiServerFetch } from '@/lib/api';
import { ArticleEditActions } from '@/components/article-edit-actions';
import { ArticleVersionHistory } from '@/components/article-version-history';

type ArticleDetail = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: string;
  isFeatured?: boolean;
  categoryId?: string | null;
  featuredImageId?: string | null;
  publishedAt?: string | null;
  metadata?: unknown;
  featuredImage?: { id: string; url: string; secureUrl: string | null } | null;
  seo?: { title?: string | null; description?: string | null; metaKeywords?: string | null } | null;
  relatedFrom?: Array<{
    relatedId: string;
    related: { id: string; title: string };
  }>;
};

type VersionRow = {
  id: string;
  version: number;
  title: string;
  createdAt: string;
};

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [articleResult, versionsResult] = await Promise.all([
    apiServerFetch<ArticleDetail>(`/articles/${id}`),
    apiServerFetch<VersionRow[]>(`/articles/${id}/versions`),
  ]);

  if (articleResult.error || !articleResult.data) {
    return (
      <div>
        <PageHeader title="Article" description="Article detail" />
        <Card>
          <CardHeader>
            <CardTitle>Unable to load article</CardTitle>
            <CardDescription>{articleResult.error || 'Not found'}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const article = articleResult.data;
  const versions = Array.isArray(versionsResult.data) ? versionsResult.data : [];
  const relatedIds = (article.relatedFrom || []).map((r) => r.relatedId || r.related.id);
  const relatedLabels = Object.fromEntries(
    (article.relatedFrom || []).map((r) => [r.related.id, r.related.title]),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={article.title}
        description={`/${article.slug}`}
        actions={<Badge>{article.status}</Badge>}
      />
      <ArticleEditActions
        articleId={article.id}
        title={article.title}
        slug={article.slug}
        excerpt={article.excerpt}
        content={article.content}
        status={article.status}
        isFeatured={article.isFeatured ?? false}
        categoryId={article.categoryId ?? null}
        featuredImageId={article.featuredImageId ?? article.featuredImage?.id ?? null}
        featuredImageUrl={
          article.featuredImage?.secureUrl || article.featuredImage?.url || null
        }
        relatedIds={relatedIds}
        relatedLabels={relatedLabels}
        publishedAt={article.publishedAt ?? null}
        seoTitle={article.seo?.title ?? null}
        seoDescription={article.seo?.description ?? null}
        seoKeywords={article.seo?.metaKeywords ?? null}
        metadata={article.metadata ?? null}
      />

      <ArticleVersionHistory
        articleId={article.id}
        versions={versions}
        currentTitle={article.title}
        currentContent={article.content}
      />

      <Link href="/articles" className="text-sm text-[var(--varnarc-brand)] hover:underline">
        Back to articles
      </Link>
    </div>
  );
}
