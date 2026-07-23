import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { ReviewCreateForm, ReviewPublishButton } from '@/components/review-forms';
import { apiServerFetch } from '@/lib/api';

type ReviewRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  overallScore?: number | string | null;
  reviewType?: string;
  entityType?: string | null;
  viewCount?: number;
  product?: { name: string } | null;
};

type ProductRow = { id: string; name: string };

export default async function ReviewsListAdminPage() {
  const [reviewsResult, productsResult] = await Promise.all([
    apiServerFetch<ReviewRow[]>('/reviews/admin?limit=50'),
    apiServerFetch<ProductRow[]>('/reviews/products?limit=50'),
  ]);

  const rows = Array.isArray(reviewsResult.data) ? reviewsResult.data : [];
  const products = Array.isArray(productsResult.data) ? productsResult.data : [];

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="Manage editorial reviews and expert ratings."
        actions={<Badge>{rows.length} loaded</Badge>}
      />

      <ReviewCreateForm products={products} />

      {reviewsResult.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load reviews</CardTitle>
            <CardDescription>{reviewsResult.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 font-medium">{row.title}</td>
                  <td className="px-4 py-3">{row.product?.name || '—'}</td>
                  <td className="px-4 py-3">{row.reviewType || 'editorial'}</td>
                  <td className="px-4 py-3">
                    {row.overallScore != null ? Number(row.overallScore).toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3">{row.viewCount ?? 0}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/reviews/list/${row.id}`}
                        className="text-sm text-[var(--varnarc-brand)] hover:underline"
                      >
                        Edit
                      </Link>
                      <ReviewPublishButton id={row.id} status={row.status} />
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No reviews yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
