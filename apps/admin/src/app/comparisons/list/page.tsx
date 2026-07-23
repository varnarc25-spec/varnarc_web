import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { ComparisonCloneButton, ComparisonCreateForm, ComparisonPublishButton, ComparisonBulkToolbar } from '@/components/comparison-forms';
import { apiServerFetch } from '@/lib/api';

type ComparisonRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  entityType?: string | null;
  comparisonType?: string | null;
  viewCount?: number;
  recommendation?: string | null;
  _count?: { items: number };
};

type ProductRow = { id: string; name: string };
type TemplateRow = { id: string; name: string };

export default async function ComparisonsListAdminPage() {
  const [comparisonsResult, productsResult, templatesResult] = await Promise.all([
    apiServerFetch<ComparisonRow[]>('/comparisons/admin?limit=50'),
    apiServerFetch<ProductRow[]>('/reviews/products?limit=50'),
    apiServerFetch<TemplateRow[]>('/comparisons/templates?limit=20'),
  ]);

  const rows = Array.isArray(comparisonsResult.data) ? comparisonsResult.data : [];
  const products = Array.isArray(productsResult.data) ? productsResult.data : [];
  const templates = Array.isArray(templatesResult.data) ? templatesResult.data : [];
  const draftIds = rows.filter((row) => row.status !== 'PUBLISHED').map((row) => row.id);

  return (
    <div>
      <PageHeader
        title="Comparisons"
        description="Manage side-by-side comparison pages."
        actions={<Badge>{rows.length} loaded</Badge>}
      />

      <ComparisonCreateForm products={products} templateId={templates[0]?.id} />
      <ComparisonBulkToolbar ids={draftIds} />

      {comparisonsResult.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load comparisons</CardTitle>
            <CardDescription>{comparisonsResult.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 font-medium">{row.title}</td>
                  <td className="px-4 py-3">{row.entityType || row.comparisonType || '—'}</td>
                  <td className="px-4 py-3">{row._count?.items ?? 0}</td>
                  <td className="px-4 py-3">{row.viewCount ?? 0}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/compare/${row.slug}`}
                        target="_blank"
                        className="text-sm text-[var(--varnarc-brand)] hover:underline"
                      >
                        Preview
                      </Link>
                      <ComparisonPublishButton id={row.id} status={row.status} />
                      <ComparisonCloneButton id={row.id} />
                      <Link
                        href={`/comparisons/list/${row.id}/history`}
                        className="text-sm text-[var(--varnarc-brand)] hover:underline"
                      >
                        History
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No comparisons yet.
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
