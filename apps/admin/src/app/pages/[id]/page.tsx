import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import Link from 'next/link';
import { apiServerFetch } from '@/lib/api';
import { PageEditActions } from '@/components/page-edit-actions';
import { PageVersionHistory } from '@/components/page-version-history';

type PageDetail = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  status: string;
  publishedAt: string | null;
  seo: {
    title: string | null;
    description: string | null;
  } | null;
};

type VersionRow = {
  id: string;
  version: number;
  title: string;
  createdAt: string;
};

export default async function PageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, versionsResult] = await Promise.all([
    apiServerFetch<PageDetail>(`/pages/${id}`),
    apiServerFetch<VersionRow[]>(`/pages/${id}/versions`),
  ]);

  if (result.error || !result.data) {
    return (
      <div>
        <PageHeader title="Page" description="Page detail" />
        <Card>
          <CardHeader>
            <CardTitle>Unable to load page</CardTitle>
            <CardDescription>{result.error || 'Not found'}</CardDescription>
          </CardHeader>
        </Card>
        <Link href="/pages" className="mt-4 inline-block text-sm text-[var(--varnarc-brand)] hover:underline">
          Back to pages
        </Link>
      </div>
    );
  }

  const page = result.data;
  const versions = Array.isArray(versionsResult.data) ? versionsResult.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={page.title}
        description={`/${page.slug}`}
        actions={<Badge>{page.status}</Badge>}
      />
      <PageEditActions
        pageId={page.id}
        title={page.title}
        slug={page.slug}
        content={page.content}
        status={page.status}
        seoTitle={page.seo?.title ?? null}
        seoDescription={page.seo?.description ?? null}
        publishedAt={page.publishedAt ?? null}
      />

      <PageVersionHistory
        pageId={page.id}
        versions={versions}
        currentTitle={page.title}
        currentContent={page.content || ''}
      />

      <Link href="/pages" className="text-sm text-[var(--varnarc-brand)] hover:underline">
        Back to pages
      </Link>
    </div>
  );
}
