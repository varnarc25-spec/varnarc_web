import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { FinanceCategoryEditForm } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type CategoryDetail = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  introduction?: string | null;
  sortOrder?: number | null;
  loanHubEnabled?: boolean | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  contentSections?: Record<string, unknown> | null;
  icon?: string | null;
  iconMediaId?: string | null;
  iconAlt?: string | null;
  featuredImage?: string | null;
  featuredImageMediaId?: string | null;
  featuredImageAlt?: string | null;
  heroImage?: string | null;
  heroImageMediaId?: string | null;
  heroImageAlt?: string | null;
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
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Badge>{category.slug}</Badge>
            {category.loanHubEnabled ? (
              <Link
                href={`https://varnarc.com/finance/loans/${category.slug}`}
                className="text-xs font-semibold text-[var(--varnarc-brand)] hover:underline"
              >
                Public category page →
              </Link>
            ) : null}
          </div>
          <FinanceCategoryEditForm
            id={category.id}
            initial={{
              name: category.name,
              slug: category.slug,
              description: category.description,
              shortDescription: category.shortDescription,
              introduction: category.introduction,
              sortOrder: category.sortOrder,
              loanHubEnabled: category.loanHubEnabled,
              metaTitle: category.metaTitle,
              metaDescription: category.metaDescription,
              contentSections: category.contentSections,
              seoTitle: seoResult.data?.title,
              seoDescription: seoResult.data?.description,
              icon: category.icon,
              iconMediaId: category.iconMediaId,
              iconAlt: category.iconAlt,
              featuredImage: category.featuredImage,
              featuredImageMediaId: category.featuredImageMediaId,
              featuredImageAlt: category.featuredImageAlt,
              heroImage: category.heroImage,
              heroImageMediaId: category.heroImageMediaId,
              heroImageAlt: category.heroImageAlt,
            }}
          />
        </>
      )}
    </div>
  );
}
