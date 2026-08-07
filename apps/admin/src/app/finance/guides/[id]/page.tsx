import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { FinanceGuideEditForm } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type GuideDetail = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  body?: string | null;
  status: string;
  categoryId?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

type CategoryRow = { id: string; name: string };

export default async function FinanceGuideEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [guideResult, categoriesResult] = await Promise.all([
    apiServerFetch<GuideDetail>(`/finance/admin/guides/${id}`),
    apiServerFetch<CategoryRow[]>('/finance/categories'),
  ]);
  const guide = guideResult.data;
  const categories = Array.isArray(categoriesResult.data) ? categoriesResult.data : [];

  return (
    <div>
      <PageHeader
        title="Edit guide"
        description={guide?.title ?? 'Guide details'}
        actions={
          <Link
            href="/finance/guides"
            className="text-sm text-[var(--varnarc-brand)] hover:underline"
          >
            ← Back to guides
          </Link>
        }
      />

      {guideResult.error || !guide ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load guide</CardTitle>
            <CardDescription>{guideResult.error || 'Not found'}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <Badge className="mb-4">{guide.status}</Badge>
          <FinanceGuideEditForm
            id={guide.id}
            categories={categories}
            initial={{
              title: guide.title,
              slug: guide.slug,
              summary: guide.summary,
              body: guide.body,
              categoryId: guide.categoryId,
              status: guide.status,
              seoTitle: guide.seoTitle,
              seoDescription: guide.seoDescription,
            }}
          />
        </>
      )}
    </div>
  );
}
