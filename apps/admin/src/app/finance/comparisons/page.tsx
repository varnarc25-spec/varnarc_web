import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { FinanceComparisonForm } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type ComparisonRow = {
  id: string;
  title: string;
  type: string;
  productIds?: string[];
  ids?: string[];
  slug?: string | null;
};

export default async function FinanceComparisonsAdminPage() {
  const result = await apiServerFetch<ComparisonRow[]>('/finance/admin/comparisons?limit=50');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Comparison manager"
        description="Saved finance product comparisons for public compare pages."
        actions={<Badge>{rows.length} saved</Badge>}
      />

      <FinanceComparisonForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load comparisons</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">IDs</th>
                <th className="px-4 py-3 font-medium">Public link</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const ids = row.productIds ?? row.ids ?? [];
                const qs = new URLSearchParams({ type: row.type, ids: ids.join(',') });
                return (
                  <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                    <td className="px-4 py-3 font-medium">{row.title}</td>
                    <td className="px-4 py-3">{row.type}</td>
                    <td className="px-4 py-3 font-mono text-xs">{ids.join(', ') || '—'}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/finance/compare?${qs.toString()}`}
                        className="text-[var(--varnarc-brand)] hover:underline"
                        target="_blank"
                      >
                        Open compare
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {!rows.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No saved comparisons yet.
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
