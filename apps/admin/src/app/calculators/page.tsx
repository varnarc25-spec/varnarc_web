import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type CalcRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  category?: { name: string } | null;
  _count?: { fields: number; history: number };
};

export default async function CalculatorsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '50' });
  if (params.search) qs.set('search', params.search);

  const result = await apiServerFetch<CalcRow[]>(`/calculators/admin/all?${qs.toString()}`);
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Calculators"
        description="Configure formulas, fields, and publish calculator tools."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{rows.length} loaded</Badge>
            <Link href="/calculators/new" className="text-sm text-[var(--varnarc-brand)] hover:underline">
              New calculator
            </Link>
            <Link href="/calculators/categories" className="text-sm text-[var(--varnarc-brand)] hover:underline">
              Categories
            </Link>
            <Link href="/calculators/analytics" className="text-sm text-[var(--varnarc-brand)] hover:underline">
              Analytics
            </Link>
          </div>
        }
      />

      <form className="mb-6">
        <input
          name="search"
          defaultValue={params.search || ''}
          placeholder="Search calculators…"
          className="h-10 w-full max-w-md rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
        />
      </form>

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load calculators</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Fields</th>
                <th className="px-4 py-3 font-medium">Runs</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3">
                    <Link href={`/calculators/${row.id}`} className="font-medium text-[var(--varnarc-brand)] hover:underline">
                      {row.name}
                    </Link>
                    <div className="font-mono text-xs text-[var(--varnarc-subtle)]">{row.slug}</div>
                  </td>
                  <td className="px-4 py-3">{row.category?.name || '—'}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">{row._count?.fields ?? 0}</td>
                  <td className="px-4 py-3">{row._count?.history ?? 0}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No calculators yet.
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
