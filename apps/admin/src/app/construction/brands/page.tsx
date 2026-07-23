import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { ConstructionCsvToolbar, ConstructionListSearch } from '@/components/construction-admin-toolbar';
import { ConstructionBrandForm, ConstructionPublishButton } from '@/components/construction-forms';
import { apiServerFetch } from '@/lib/api';

type BrandRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  website?: string | null;
  _count?: { materials?: number };
};

export default async function ConstructionBrandsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '50' });
  if (params.search) qs.set('search', params.search);

  const result = await apiServerFetch<BrandRow[]>(`/construction/admin/brands?${qs.toString()}`);
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Brands"
        description="Manage construction material brands."
        actions={<Badge>{rows.length} loaded</Badge>}
      />

      <ConstructionListSearch defaultValue={params.search} />
      <ConstructionCsvToolbar entity="brands" />
      <ConstructionBrandForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load brands</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Materials</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.name}</div>
                    <div className="font-mono text-xs text-[var(--varnarc-subtle)]">{row.slug}</div>
                  </td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">{row._count?.materials ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/construction/brands/${row.id}`}
                        className="text-sm text-[var(--varnarc-brand)] hover:underline"
                      >
                        Edit
                      </Link>
                      <ConstructionPublishButton entity="brands" id={row.id} status={row.status} />
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No brands yet.
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
