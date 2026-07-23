import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { AutomobileCsvToolbar, AutomobileListSearch } from '@/components/automobile-admin-toolbar';
import { AutomobileManufacturerForm, AutomobilePublishButton } from '@/components/automobile-forms';
import { apiServerFetch } from '@/lib/api';

type ManufacturerRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  country?: string | null;
  _count?: { vehicles?: number };
};

export default async function AutomobileManufacturersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '50' });
  if (params.search) qs.set('search', params.search);

  const result = await apiServerFetch<ManufacturerRow[]>(`/automobile/admin/manufacturers?${qs.toString()}`);
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Manufacturers"
        description="Manage automobile manufacturers and brands."
        actions={<Badge>{rows.length} loaded</Badge>}
      />

      <AutomobileListSearch defaultValue={params.search} />
      <AutomobileCsvToolbar entity="manufacturers" />
      <AutomobileManufacturerForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load manufacturers</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Vehicles</th>
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
                  <td className="px-4 py-3">{row.country || '—'}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">{row._count?.vehicles ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/automobile/manufacturers/${row.id}`}
                        className="text-sm text-[var(--varnarc-brand)] hover:underline"
                      >
                        Edit
                      </Link>
                      <AutomobilePublishButton entity="manufacturers" id={row.id} status={row.status} />
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No manufacturers yet.
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
