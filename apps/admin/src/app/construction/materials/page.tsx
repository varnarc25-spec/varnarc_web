import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { ConstructionCsvToolbar, ConstructionListSearch } from '@/components/construction-admin-toolbar';
import { ConstructionDuplicateButton, ConstructionMaterialForm, ConstructionPublishButton } from '@/components/construction-forms';
import { apiServerFetch } from '@/lib/api';

type MaterialRow = {
  id: string;
  name: string;
  status: string;
  unit?: string | null;
  approximatePrice?: number | string | null;
  category?: { name: string } | null;
  brand?: { name: string } | null;
};

type CategoryRow = { id: string; name: string };
type BrandRow = { id: string; name: string };

export default async function ConstructionMaterialsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '50' });
  if (params.search) qs.set('search', params.search);

  const [materialsResult, categoriesResult, brandsResult] = await Promise.all([
    apiServerFetch<MaterialRow[]>(`/construction/admin/materials?${qs.toString()}`),
    apiServerFetch<CategoryRow[]>('/construction/categories'),
    apiServerFetch<BrandRow[]>('/construction/admin/brands?limit=100'),
  ]);
  const rows = Array.isArray(materialsResult.data) ? materialsResult.data : [];
  const categories = Array.isArray(categoriesResult.data) ? categoriesResult.data : [];
  const brands = Array.isArray(brandsResult.data) ? brandsResult.data : [];

  return (
    <div>
      <PageHeader
        title="Materials"
        description="Manage construction material catalog entries."
        actions={<Badge>{rows.length} loaded</Badge>}
      />

      <ConstructionListSearch defaultValue={params.search} />
      <ConstructionCsvToolbar entity="materials" />
      <ConstructionMaterialForm categories={categories} brands={brands} />

      {materialsResult.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load materials</CardTitle>
            <CardDescription>{materialsResult.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Brand</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">{row.category?.name || '—'}</td>
                  <td className="px-4 py-3">{row.brand?.name || '—'}</td>
                  <td className="px-4 py-3">{row.unit || '—'}</td>
                  <td className="px-4 py-3">
                    {row.approximatePrice != null ? `₹${row.approximatePrice}` : '—'}
                  </td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/construction/materials/${row.id}`}
                        className="text-sm text-[var(--varnarc-brand)] hover:underline"
                      >
                        Edit
                      </Link>
                      <ConstructionPublishButton entity="materials" id={row.id} status={row.status} />
                      <ConstructionDuplicateButton id={row.id} />
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No materials yet.
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
