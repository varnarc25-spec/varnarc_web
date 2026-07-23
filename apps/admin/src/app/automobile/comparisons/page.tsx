import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { AutomobileComparisonForm } from '@/components/automobile-forms';
import { apiServerFetch } from '@/lib/api';

type ComparisonRow = {
  id: string;
  title: string;
  type: string;
  vehicleIds?: string[];
  ids?: string[];
  slug?: string | null;
};

export default async function AutomobileComparisonsAdminPage() {
  const result = await apiServerFetch<ComparisonRow[]>('/automobile/admin/comparisons');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Comparison manager"
        description="Saved vehicle comparisons for public compare pages."
        actions={<Badge>{rows.length} saved</Badge>}
      />

      <AutomobileComparisonForm />

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
                const ids = row.vehicleIds ?? row.ids ?? [];
                const webBase = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
                const slugHref = row.slug ? `${webBase}/automobile/comparisons/${row.slug}` : null;
                return (
                  <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                    <td className="px-4 py-3 font-medium">{row.title}</td>
                    <td className="px-4 py-3">{row.type}</td>
                    <td className="px-4 py-3 font-mono text-xs">{ids.join(', ') || '—'}</td>
                    <td className="px-4 py-3">
                      {slugHref ? (
                        <Link
                          href={slugHref}
                          className="text-[var(--varnarc-brand)] hover:underline"
                          target="_blank"
                        >
                          Public page
                        </Link>
                      ) : (
                        '—'
                      )}
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
