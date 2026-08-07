import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { FinanceCategoryEditForm } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type CategoryDetail = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number | null;
};

type SeoMeta = {
  title?: string | null;
  description?: string | null;
};

export default async function FinanceCategoryEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [categoryResult, seoResult] = await Promise.all([
    apiServerFetch<CategoryDetail>(`/finance/admin/categories/${id}`),
    apiServerFetch<SeoMeta>(`/seo/meta/finance_category/${id}`),
  ]);
  const category = categoryResult.data;

  return (
    <div>
      <PageHeader
        title="Edit category"
        description={category?.name ?? 'Category details'}
        actions={
          <Link
            href="/finance/categories"
            className="text-sm text-[var(--varnarc-brand)] hover:underline"
          >
            ← Back to categories
          </Link>
        }
      />

      {categoryResult.error || !category ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load category</CardTitle>
            <CardDescription>{categoryResult.error || 'Not found'}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <Badge className="mb-4">{category.slug}</Badge>
          <FinanceCategoryEditForm
            id={category.id}
            initial={{
              name: category.name,
              slug: category.slug,
              description: category.description,
              sortOrder: category.sortOrder,
              seoTitle: seoResult.data?.title,
              seoDescription: seoResult.data?.description,
            }}
          />
        </>
      )}
    </div>
  );
}
